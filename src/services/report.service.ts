import { AppDataSource } from '../utils/data-source';
import { User } from '../entities/user.entity';
import { ProjectTasks } from '../entities/project-task.entity';
import { ProjectMilestones } from '../entities/project-milestone.entity';
import { projectAttachments } from '../entities/project-attachments.entity';
import { LeadFollowup, FollowupStatus } from '../entities/lead-followups.entity';
import { StaffPerformanceReport } from '../types/report';
import { Between, MoreThanOrEqual, LessThanOrEqual, Not, ILike, In } from 'typeorm';
import ExcelJS from "exceljs";
import { AppError } from '../utils';
import { Project } from '../entities/projects.entity';
import { Clients } from '../entities/clients.entity';
import { ProjectPerformanceReport } from '../types/report';

interface StaffPerformanceReportParams {
    startDate?: string;
    endDate?: string;
    userId?: string;
}


const userRepo = AppDataSource.getRepository(User);
const taskRepo = AppDataSource.getRepository(ProjectTasks);
const milestoneRepo = AppDataSource.getRepository(ProjectMilestones);
const attachmentRepo = AppDataSource.getRepository(projectAttachments);
const followupRepo = AppDataSource.getRepository(LeadFollowup);
const projectRepo = AppDataSource.getRepository(Project);
const clientRepo = AppDataSource.getRepository(Clients);

export async function getStaffPerformanceReport(params: StaffPerformanceReportParams): Promise<StaffPerformanceReport> {

    const { startDate, endDate, userId } = params;

    // Parse date range
    let dateFilter: { from?: Date; to?: Date } = {};
    if (startDate && endDate) {
        dateFilter.from = new Date(startDate);
        dateFilter.to = new Date(endDate);
    } else if (startDate) {
        dateFilter.from = new Date(startDate);
        dateFilter.to = new Date();
    } else if (endDate) {
        dateFilter.from = new Date(0); // epoch
        dateFilter.to = new Date(endDate);
    }

    // Exclude admin users
    const userWhere: any = userId ? { id: userId } : {};
    // Always filter out admin by role (case-insensitive)
    userWhere.role = { role: Not(ILike('admin')) };

    // Get users (filter by userId if provided, and exclude admins)
    const user = await userRepo.findOne({
        where: userWhere,
        relations: ['role'],
    });

    let report;

    if (!user) {
        throw new AppError(404, "No Staff found.");
    }

    // Build date filter for queries
    let taskWhere: any = { assigned_to: user.id };
    let followupWhere: any = { user: { id: user.id } };
    // Only filter by date if at least one date is provided
    if (dateFilter.from && dateFilter.to) {
        taskWhere.created_at = Between(dateFilter.from, dateFilter.to);
        followupWhere.created_at = Between(dateFilter.from, dateFilter.to);
    } else if (dateFilter.from) {
        taskWhere.created_at = MoreThanOrEqual(dateFilter.from);
        followupWhere.created_at = MoreThanOrEqual(dateFilter.from);
    } else if (dateFilter.to) {
        taskWhere.created_at = LessThanOrEqual(dateFilter.to);
        followupWhere.created_at = LessThanOrEqual(dateFilter.to);
    }
    // Tasks assigned to user
    const tasks = await taskRepo.find({ where: taskWhere });
    const totalTasksAssigned = tasks.length;
    const completedTasks = tasks.filter(t => t.status.toLocaleLowerCase() === 'completed').length;
    const completionRate = totalTasksAssigned > 0 ? (completedTasks / totalTasksAssigned) * 100 : 0;
    // For avgDaysToComplete, need created_at and updated_at (assume Model base class has these fields)
    let avgDaysToComplete = 0;
    const completedTaskDates = tasks.filter(t => t.status.toLocaleLowerCase() === 'completed' && (t as any).created_at && (t as any).updated_at);
    if (completedTaskDates.length > 0) {
        const totalDays = completedTaskDates.reduce((sum, t) => {
            const created = new Date((t as any).created_at);
            const updated = new Date((t as any).updated_at);
            return sum + (updated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
        }, 0);
        avgDaysToComplete = totalDays / completedTaskDates.length;
    }
    // Delayed tasks: updated_at > due_date
    const delayedTasks = tasks.filter(t => (t as any).updated_at && t.due_date && new Date((t as any).updated_at) > new Date(t.due_date)).length;

    // Milestones managed by user (no date filter, as no created_at in entity)
    const milestonesManaged = await milestoneRepo.count({ where: { assigned_to: user.id } });
    // Files uploaded by user (no date filter, as no created_at in entity)
    const filesUploaded = await attachmentRepo.count({ where: { uploaded_by: { id: user.id } } });

    // Followups by user
    const followups = await followupRepo.find({ where: followupWhere });
    const totalFollowUps = followups.length;
    const completedFollowUps = followups.filter(f => f.status.toLocaleLowerCase() === FollowupStatus.COMPLETED.toLocaleLowerCase()).length;
    const pendingFollowUps = followups.filter(f => f.status.toLocaleLowerCase() === FollowupStatus.PENDING.toLocaleLowerCase() || f.status.toLocaleLowerCase() === FollowupStatus.AWAITING_RESPONSE.toLocaleLowerCase()).length;
    // Avg follow-up response time (hrs): time between due_date and completed_date
    let avgFollowUpResponseTime = 0;
    const completedFollowupDates = followups.filter(f => f.status.toLocaleLowerCase() === FollowupStatus.COMPLETED.toLocaleLowerCase() && f.due_date && f.completed_date);
    if (completedFollowupDates.length > 0) {
        const totalHours = completedFollowupDates.reduce((sum, f) => {
            return sum + ((f.completed_date!.getTime() - f.due_date!.getTime()) / (1000 * 60 * 60));
        }, 0);
        avgFollowUpResponseTime = totalHours / completedFollowupDates.length;
    }
    // Missed follow-ups: completed after due_date
    const missedFollowUps = completedFollowupDates.filter(f => f.completed_date! > f.due_date!).length;

    report = {
        staffName: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
        staffEmail: user.email,
        totalTasksAssigned,
        completedTasks,
        completionRate: Number(completionRate.toFixed(2)),
        avgDaysToComplete: Number(avgDaysToComplete.toFixed(2)),
        delayedTasks,
        milestonesManaged,
        filesUploaded,
        totalFollowUps,
        completedFollowUps,
        pendingFollowUps,
        avgFollowUpResponseTime: Number(avgFollowUpResponseTime.toFixed(2)),
        missedFollowUps,
    };

    return report;
}


export async function exportStaffPerformanceToExcel(params: StaffPerformanceReportParams): Promise<{ workbook: ExcelJS.Workbook, name: string }> {
    const data = await getStaffPerformanceReport(params);
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Staff Performance');

    worksheet.columns = [
        { header: 'Staff Name', key: 'staffName', width: 25 },
        { header: 'Staff Email', key: 'staffEmail', width: 30 },
        { header: 'Total Tasks Assigned', key: 'totalTasksAssigned', width: 20 },
        { header: 'Completed Tasks', key: 'completedTasks', width: 18 },
        { header: 'Completion Rate (%)', key: 'completionRate', width: 18 },
        { header: 'Avg Days to Complete', key: 'avgDaysToComplete', width: 20 },
        { header: 'Delayed Tasks', key: 'delayedTasks', width: 15 },
        { header: 'Milestones Managed', key: 'milestonesManaged', width: 18 },
        { header: 'Files Uploaded', key: 'filesUploaded', width: 15 },
        { header: 'Total Follow-ups', key: 'totalFollowUps', width: 18 },
        { header: 'Completed Follow-ups', key: 'completedFollowUps', width: 20 },
        { header: 'Pending Follow-ups', key: 'pendingFollowUps', width: 20 },
        { header: 'Avg Follow-up Response Time (hrs)', key: 'avgFollowUpResponseTime', width: 28 },
        { header: 'Missed Follow-ups', key: 'missedFollowUps', width: 18 },
    ];

    worksheet.getRow(1).eachCell((cell) => {
        cell.font = { bold: true };
    });

    worksheet.addRow({
        staffName: data.staffName,
        staffEmail: data.staffEmail,
        totalTasksAssigned: data.totalTasksAssigned,
        completedTasks: data.completedTasks,
        completionRate: data.completionRate,
        avgDaysToComplete: data.avgDaysToComplete,
        delayedTasks: data.delayedTasks,
        milestonesManaged: data.milestonesManaged,
        filesUploaded: data.filesUploaded,
        totalFollowUps: data.totalFollowUps,
        completedFollowUps: data.completedFollowUps,
        pendingFollowUps: data.pendingFollowUps,
        avgFollowUpResponseTime: data.avgFollowUpResponseTime,
        missedFollowUps: data.missedFollowUps,
    });

    const name = data?.staffName?.split(" ")?.join("_");

    return { workbook: workbook, name };
}

export async function getProjectPerformanceReport({ projectId, clientId }: { projectId?: string; clientId?: string }): Promise<ProjectPerformanceReport> {
  // 1. Fetch the project
  let project: Project | null = null;
  if (projectId) {
    project = await projectRepo.findOne({
      where: { id: projectId },
      relations: ['client', 'milestones', 'attachments'],
    });
  } else if (clientId) {
    project = await projectRepo.findOne({
      where: { client: { id: clientId } },
      order: { created_at: 'DESC' },
      relations: ['client', 'milestones', 'attachments'],
    });
  } else {
    const projects = await projectRepo.find({
      order: { created_at: 'DESC' },
      relations: ['client', 'milestones', 'attachments'],
      take: 1,
    });
    project = projects[0] || null;
  }
  if (!project) throw new AppError(404, 'Project not found');

  // 2. Project Info
  const projectInfo = {
    projectId: project.id,
    description: project.description,
    name: project.name,
    client: project.client
      ? {
          id: project.client.id,
          name: project.client.name,
          company_name: project.client.company_name,
          contact_number: project.client.contact_number,
        }
      : { id: '', name: '', company_name: '', contact_number: '' },
    status: project.status,
    start_date: project.start_date,
    end_date: project.end_date,
    actual_start_date: project.actual_start_date,
    actual_end_date: project.actual_end_date,
  };

  // 3. Cost & Budget
  const costBudget = {
    budget: project.budget ?? null,
    estimated_cost: project.estimated_cost ?? null,
    actual_cost: project.actual_cost ?? null,
    budget_utilization_percent:
      project.budget && project.actual_cost
        ? Math.round((Number(project.actual_cost) / Number(project.budget)) * 100)
        : null,
    overrun:
      project.budget && project.actual_cost
        ? Number(project.actual_cost) - Number(project.budget)
        : null,
  };

  // 4. Task Metrics
  // ProjectTasks are linked to Project via ProjectMilestones
  const milestoneIds = (project.milestones || []).map(m => m.id);
  let tasks: ProjectTasks[] = [];
  if (milestoneIds.length) {
    tasks = await taskRepo.find({ where: { milestone: { id: In(milestoneIds) } } });
  }
  const totalTasks = tasks.length;
  const completed = tasks.filter((t) => t.status.toLowerCase() === 'completed').length;
  const inProgress = tasks.filter((t) => (t.status.toLowerCase() === 'in progress' || t.status.toLowerCase() === 'in-progress')).length;
  const overdue = tasks.filter((t) => t.due_date && new Date(t.due_date) < new Date() && t.status.toLowerCase() !== 'completed').length;
  const avgTaskCompletionTimeDays = (() => {
    const completedTasks = tasks.filter((t: any) => t.status.toLowerCase() === 'completed' && t.created_at && t.updated_at);
    if (!completedTasks.length) return 0;
    const totalDays = completedTasks.reduce((sum: number, t: any) => sum + (new Date(t.updated_at).getTime() - new Date(t.created_at).getTime()) / (1000 * 60 * 60 * 24), 0);
    return Number((totalDays / completedTasks.length).toFixed(2));
  })();
  // Task reassignment count: count tasks with a reassignment history if available, else 0
  const taskReassignmentCount = 0; // Placeholder, implement if you have reassignment tracking
  // Top performer: user with most completed tasks
  const userTaskMap: Record<string, { name: string; count: number }> = {};
  for (const t of tasks) {
    if (t.assigned_to && t.status.toLowerCase() === 'completed') {
      userTaskMap[t.assigned_to] = userTaskMap[t.assigned_to] || { name: t.assigned_to, count: 0 };
      userTaskMap[t.assigned_to].count++;
    }
  }
  let topPerformer = null;
  if (Object.keys(userTaskMap).length) {
    const top = Object.entries(userTaskMap).sort((a, b) => b[1].count - a[1].count)[0];
    topPerformer = { userId: top[0], name: top[1].name, tasksCompleted: top[1].count };
  }
  const taskMetrics = {
    totalTasks,
    completed,
    inProgress,
    overdue,
    avgTaskCompletionTimeDays,
    taskReassignmentCount,
    topPerformer,
  };

  // 5. Resource Utilization
  // Group by assigned_to
  const resourceUtilizationMap: Record<string, { name: string; assignedTasks: number; completedTasks: number; followUps: number; activeIssues: number }> = {};
  for (const t of tasks) {
    if (!t.assigned_to) continue;
    if (!resourceUtilizationMap[t.assigned_to]) {
      resourceUtilizationMap[t.assigned_to] = { name: t.assigned_to, assignedTasks: 0, completedTasks: 0, followUps: 0, activeIssues: 0 };
    }
    resourceUtilizationMap[t.assigned_to].assignedTasks++;
    if (t.status.toLowerCase() === 'completed') resourceUtilizationMap[t.assigned_to].completedTasks++;
    // Placeholder: followUps and activeIssues, implement if you have this info
  }
  const resourceUtilization = Object.entries(resourceUtilizationMap).map(([userId, data]) => ({
    userId,
    name: data.name,
    assignedTasks: data.assignedTasks,
    completedTasks: data.completedTasks,
    taskLoadPercent: data.assignedTasks && totalTasks ? Math.round((data.assignedTasks / totalTasks) * 100) : 0,
    followUps: data.followUps,
    activeIssues: data.activeIssues,
  }));

  // 6. Milestone Summary
  const milestoneSummary = (project.milestones || []).map((m) => ({
    milestoneId: m.id,
    name: m.name,
    status: m.status,
    start_date: m.start_date,
    end_date: m.end_date,
    actual_date: m.actual_date,
    assigned_to: m.assigned_to,
    delayDays:
      m.end_date && m.actual_date
        ? Math.max(0, Math.ceil((new Date(m.actual_date).getTime() - new Date(m.end_date).getTime()) / (1000 * 60 * 60 * 24)))
        : null,
  }));

  // 7. Document Summary
  const attachments = project.attachments || [];
  const docTypeMap: Record<string, { count: number; last_updated: Date | string | null }> = {};
  for (const att of attachments) {
    if (!att.file_type) continue;
    if (!docTypeMap[att.file_type]) {
      docTypeMap[att.file_type] = { count: 0, last_updated: att.created_at };
    }
    docTypeMap[att.file_type].count++;
    if (!docTypeMap[att.file_type].last_updated || (att.created_at && new Date(att.created_at) > new Date(docTypeMap[att.file_type].last_updated!))) {
      docTypeMap[att.file_type].last_updated = att.created_at;
    }
  }
  const documentSummary = Object.entries(docTypeMap).map(([file_type, data]) => ({
    file_type,
    count: data.count,
    last_updated: data.last_updated,
  }));

  // 8. Timeline Analysis
  const now = new Date();
  const daysSinceStart = project.start_date ? Math.ceil((now.getTime() - new Date(project.start_date).getTime()) / (1000 * 60 * 60 * 24)) : 0;
  const plannedDurationDays = project.start_date && project.end_date ? Math.ceil((new Date(project.end_date).getTime() - new Date(project.start_date).getTime()) / (1000 * 60 * 60 * 24)) : 0;
  const progressPercent = milestoneSummary.length
    ? Math.round((milestoneSummary.filter((m) => m.status.toLowerCase() === 'completed').length / milestoneSummary.length) * 100)
    : 0;
  const delayRisk = progressPercent < 100 && milestoneSummary.some((m) => m.delayDays && m.delayDays > 0) ? 'Medium' : 'Low';
  const timelineAnalysis = {
    daysSinceStart,
    plannedDurationDays,
    progressPercent,
    delayRisk,
  };

  // 9. Follow-Up Matrix
  // Fetch followups for the lead referenced by the client (if any)
  let followups: LeadFollowup[] = [];
  const clientLeadId = project.client?.lead?.id;
  if (clientLeadId) {
    followups = await followupRepo.find({ where: { lead: { id: clientLeadId } } });
  }
  const totalFollowUpsLogged = followups.length;
  const followUpsCompleted = followups.filter((f) => f.status.toLocaleLowerCase() === FollowupStatus.COMPLETED.toLocaleLowerCase()).length;
  const pendingFollowUps = followups.filter((f) => f.status.toLocaleLowerCase() === FollowupStatus.PENDING.toLocaleLowerCase() || f.status.toLocaleLowerCase() === FollowupStatus.AWAITING_RESPONSE.toLocaleLowerCase()).length;
  const missedOrDelayedFollowUps = followups.filter((f) => f.completed_date && f.due_date && f.completed_date > f.due_date).length;
  const avgResponseTimeHours = (() => {
    const completed = followups.filter((f) => f.status.toLocaleLowerCase() === FollowupStatus.COMPLETED.toLocaleLowerCase() && f.due_date && f.completed_date);
    if (!completed.length) return 0;
    const totalHours = completed.reduce((sum, f) => sum + ((f.completed_date!.getTime() - f.due_date!.getTime()) / (1000 * 60 * 60)), 0);
    return Number((totalHours / completed.length).toFixed(2));
  })();
  const escalatedItems = 0; // Placeholder, implement if you have escalation tracking
  const followUpMatrix = {
    totalFollowUpsLogged,
    followUpsCompleted,
    pendingFollowUps,
    missedOrDelayedFollowUps,
    avgResponseTimeHours,
    escalatedItems,
  };

  return {
    projectInfo,
    costBudget,
    taskMetrics,
    resourceUtilization,
    milestoneSummary,
    documentSummary,
    timelineAnalysis,
    followUpMatrix,
  };
} 