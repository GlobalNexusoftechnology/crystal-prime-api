import { AppDataSource } from "../utils/data-source";
import { User } from "../entities/user.entity";
import { ProjectTasks } from "../entities/project-task.entity";
import { ProjectMilestones } from "../entities/project-milestone.entity";
import { projectAttachments } from "../entities/project-attachments.entity";
import {
  LeadFollowup,
  FollowupStatus,
} from "../entities/lead-followups.entity";
import { StaffPerformanceReport } from "../types/report";
import {
  Between,
  MoreThanOrEqual,
  LessThanOrEqual,
  Not,
  ILike,
  In,
} from "typeorm";
import ExcelJS from "exceljs";
import { AppError } from "../utils";
import { Project } from "../entities/projects.entity";
import { Clients } from "../entities/clients.entity";
import { ProjectPerformanceReport } from "../types/report";

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

export async function getStaffPerformanceReport(params: StaffPerformanceReportParams): Promise<any> {
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
    userWhere.role = { role: Not(ILike('admin')) };

    // Get user (filter by userId if provided, and exclude admins)
    const user = await userRepo.findOne({
        where: userWhere,
        relations: ['role'],
    });

    if (!user) {
        throw new AppError(404, "No Staff found.");
    }

    // Build date filter for queries
    let taskWhere: any = { assigned_to: user.id };
    let followupWhere: any = { user: { id: user.id } };
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
    const delayedTasks = tasks.filter(t => (t as any).updated_at && t.due_date && new Date((t as any).updated_at) > new Date(t.due_date)).length;

    // Milestones managed by user (no date filter)
    const milestonesManaged = await milestoneRepo.count({ where: { assigned_to: user.id } });
    // Files uploaded by user (no date filter)
    const filesUploaded = await attachmentRepo.count({ where: { uploaded_by: { id: user.id } } });

    // Followups by user
    const followups = await followupRepo.find({ where: followupWhere });
    const totalFollowUps = followups.length;
    const completedFollowUps = followups.filter(f => f.status.toLocaleLowerCase() === FollowupStatus.COMPLETED.toLocaleLowerCase()).length;
    const pendingFollowUps = followups.filter(f => f.status.toLocaleLowerCase() === FollowupStatus.PENDING.toLocaleLowerCase() || f.status.toLocaleLowerCase() === FollowupStatus.AWAITING_RESPONSE.toLocaleLowerCase()).length;
    let avgFollowUpResponseTime = 0;
    const completedFollowupDates = followups.filter(f => f.status.toLocaleLowerCase() === FollowupStatus.COMPLETED.toLocaleLowerCase() && f.due_date && f.completed_date);
    if (completedFollowupDates.length > 0) {
        const totalHours = completedFollowupDates.reduce((sum, f) => {
            return sum + ((f.completed_date!.getTime() - f.due_date!.getTime()) / (1000 * 60 * 60));
        }, 0);
        avgFollowUpResponseTime = totalHours / completedFollowupDates.length;
    }
    const missedFollowUps = completedFollowupDates.filter(f => f.completed_date! > f.due_date!).length;

    return {
        staffInfo: {
            firstName: user.first_name,
            lastName: user.last_name,
            email: user.email,
            phone: user.phone_number
        },
        taskSummary: {
            totalTasksAssigned,
            completedTasks,
            completionRate: `${completionRate.toFixed(1)}%`,
            avgDaysToComplete: `${avgDaysToComplete.toFixed(1)} Days`,
            delayedTasks
        },
        milestoneFileActivity: {
            milestonesManaged,
            filesUploaded
        },
        followUpPerformance: {
            totalFollowUps,
            completedFollowUps,
            pendingFollowUps,
            missedFollowUps,
            avgResponseTime: `${avgFollowUpResponseTime.toFixed(1)} Hr`
        }
    };
}

export async function exportStaffPerformanceToExcel(
  params: StaffPerformanceReportParams
): Promise<{ workbook: ExcelJS.Workbook; name: string }> {
  const data = await getStaffPerformanceReport(params);
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Staff Performance");

  worksheet.columns = [
    { header: "Staff Name", key: "staffName", width: 25 },
    { header: "Staff Email", key: "staffEmail", width: 30 },
    { header: "Total Tasks Assigned", key: "totalTasksAssigned", width: 20 },
    { header: "Completed Tasks", key: "completedTasks", width: 18 },
    { header: "Completion Rate (%)", key: "completionRate", width: 18 },
    { header: "Avg Days to Complete", key: "avgDaysToComplete", width: 20 },
    { header: "Delayed Tasks", key: "delayedTasks", width: 15 },
    { header: "Milestones Managed", key: "milestonesManaged", width: 18 },
    { header: "Files Uploaded", key: "filesUploaded", width: 15 },
    { header: "Total Follow-ups", key: "totalFollowUps", width: 18 },
    { header: "Completed Follow-ups", key: "completedFollowUps", width: 20 },
    { header: "Pending Follow-ups", key: "pendingFollowUps", width: 20 },
    {
      header: "Avg Follow-up Response Time (hrs)",
      key: "avgFollowUpResponseTime",
      width: 28,
    },
    { header: "Missed Follow-ups", key: "missedFollowUps", width: 18 },
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

export async function getProjectPerformanceReport({ projectId, clientId }: { projectId?: string; clientId?: string }): Promise<any> {
    // 1. Fetch the project with all necessary relations
    let project: Project | null = null;
    if (projectId) {
        project = await projectRepo.findOne({
            where: { id: projectId },
            relations: [
                "client",
                "milestones",
                "milestones.tasks",
                "attachments",
                "attachments.uploaded_by",
                "project_type"
            ],
        });
    } else if (clientId) {
        project = await projectRepo.findOne({
            where: { client: { id: clientId } },
            order: { created_at: "DESC" },
            relations: [
                "client",
                "milestones",
                "milestones.tasks",
                "attachments",
                "attachments.uploaded_by",
                "project_type"
            ],
        });
    } else {
        const projects = await projectRepo.find({
            order: { created_at: "DESC" },
            relations: [
                "client",
                "milestones",
                "milestones.tasks",
                "attachments",
                "attachments.uploaded_by",
                "project_type"
            ],
            take: 1,
        });
        project = projects[0] || null;
    }
    if (!project) throw new AppError(404, "Project not found");

    // Helper: get user details by id
    const getUserDetails = async (userId: string) => {
        if (!userId) return null;
        const user = await userRepo.findOne({ where: { id: userId }, relations: ["role"] });
        if (!user) return null;
        return {
            id: user.id,
            name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
            email: user.email,
            phone: user.phone_number,
            role: user.role?.role || null
        };
    };

    // Basic Project Info
    const projectType = project.project_type?.name || "";
    // Project Manager: assume first milestone assigned_to or fallback to null
    let projectManager = null;
    if (project.milestones && project.milestones.length > 0) {
        const firstMilestone = project.milestones.find(m => m.assigned_to);
        if (firstMilestone && firstMilestone.assigned_to) {
            projectManager = await getUserDetails(firstMilestone.assigned_to);
        }
    }
    // Assigned Team: all unique assigned_to from milestones and tasks
    const teamUserIds = new Set<string>();
    (project.milestones || []).forEach(m => {
        if (m.assigned_to) teamUserIds.add(m.assigned_to);
        (m.tasks || []).forEach(t => { if (t.assigned_to) teamUserIds.add(t.assigned_to); });
    });
    const assignedTeam = await Promise.all(Array.from(teamUserIds).map(getUserDetails));
    // Project Phase: last milestone with status not completed
    const projectPhase = (project.milestones || []).find(m => m.status && m.status.toLowerCase() !== 'completed')?.name || "";
    // Current Status: last milestone with status not completed
    const currentStatus = (project.milestones || []).find(m => m.status && m.status.toLowerCase() !== 'completed')?.status || project.status;

    // Cost & Budget Analysis
    const budget = project.budget ? project.budget.toLocaleString() : "-";
    const estimatedCost = project.estimated_cost ? project.estimated_cost.toLocaleString() : "-";
    const actualCost = project.actual_cost ? project.actual_cost.toLocaleString() : "-";
    const budgetUtilization = (project.budget && project.actual_cost)
        ? `${((Number(project.actual_cost) / Number(project.budget)) * 100).toFixed(0)}%`
        : "-";
    const overrun = (project.budget && project.actual_cost)
        ? (Number(project.actual_cost) - Number(project.budget)).toLocaleString()
        : "-";

    // Task Metrics
    const allTasks = (project.milestones || []).flatMap(m => m.tasks || []);
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter(t => t.status?.toLowerCase() === 'completed').length;
    const inProgressTasks = allTasks.filter(t => t.status?.toLowerCase().includes('progress')).length;
    const overdueTasks = allTasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status?.toLowerCase() !== 'completed').length;
    const avgTaskCompletionTime = (() => {
        const completed = allTasks.filter(t => t.status?.toLowerCase() === 'completed' && t.created_at && t.updated_at);
        if (!completed.length) return "0 Days";
        const totalDays = completed.reduce((sum, t) => sum + ((new Date(t.updated_at).getTime() - new Date(t.created_at).getTime()) / (1000 * 60 * 60 * 24)), 0);
        return `${(totalDays / completed.length).toFixed(1)} Days`;
    })();
    // Task reassignment count: not tracked, set to 0
    const taskReassignmentCount = 0;
    // Top performer: user with most completed tasks
    const userTaskMap: Record<string, { name: string; count: number }> = {};
    for (const t of allTasks) {
        if (t.assigned_to && t.status?.toLowerCase() === 'completed') {
            userTaskMap[t.assigned_to] = userTaskMap[t.assigned_to] || { name: t.assigned_to, count: 0 };
            userTaskMap[t.assigned_to].count++;
        }
    }
    let topPerformer = null;
    if (Object.keys(userTaskMap).length) {
        const top = Object.entries(userTaskMap).sort((a, b) => b[1].count - a[1].count)[0];
        const user = await getUserDetails(top[0]);
        topPerformer = user ? { ...user, tasksCompleted: top[1].count } : null;
    }
    // Task Metrics Bar Chart
    const taskMetricsChart = [
        { label: "Total Tasks", value: totalTasks },
        { label: "Completed", value: completedTasks },
        { label: "In Progress", value: inProgressTasks },
        { label: "Overdue", value: overdueTasks }
    ];

    // Document Summary
    const docTypeMap: Record<string, { count: number; last_updated: Date | string | null }> = {};
    for (const att of project.attachments || []) {
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
        last_updated: data.last_updated ? new Date(data.last_updated).toLocaleDateString() : null
    }));
    const totalFiles = (project.attachments || []).length;

    // Follow-Up & Communication Matrix (placeholder, as followup logic is not in project entity)
    // You may need to fetch followups from another service if available
    const followUpMatrix = {
        totalFollowUpsLogged: 0,
        followUpsCompleted: 0,
        pendingFollowUps: 0,
        missedOrDelayedFollowUps: 0,
        avgResponseTimeHours: "0 hours",
        escalatedItems: 0
    };

    // Timeline Analysis
    const now = new Date();
    const daysSinceStart = project.start_date ? Math.ceil((now.getTime() - new Date(project.start_date).getTime()) / (1000 * 60 * 60 * 24)) : 0;
    const plannedDurationDays = project.start_date && project.end_date ? Math.ceil((new Date(project.end_date).getTime() - new Date(project.start_date).getTime()) / (1000 * 60 * 60 * 24)) : 0;
    const progressPercent = (project.milestones && project.milestones.length)
        ? Math.round((project.milestones.filter((m) => m.status.toLowerCase() === 'completed').length / project.milestones.length) * 100)
        : 0;
    const delayRisk = progressPercent < 100 && (project.milestones || []).some((m) => {
        const delay = m.end_date && m.actual_date ? (new Date(m.actual_date).getTime() - new Date(m.end_date).getTime()) / (1000 * 60 * 60 * 24) : 0;
        return delay > 0;
    }) ? 'Medium' : 'Low';
    const timelineAnalysis = {
        daysSinceStart,
        plannedDurationDays,
        progressPercent,
        delayRisk
    };

    // Milestone Summary
    const milestoneSummary = (project.milestones || []).map((m) => ({
        milestoneId: m.id,
        name: m.name,
        status: m.status,
        start_date: m.start_date ? new Date(m.start_date).toLocaleDateString() : null,
        end_date: m.end_date ? new Date(m.end_date).toLocaleDateString() : null,
        actual_date: m.actual_date ? new Date(m.actual_date).toLocaleDateString() : null,
        assigned_to: m.assigned_to ? assignedTeam.find(u => u && u.id === m.assigned_to) : null,
        delayDays: m.end_date && m.actual_date ? Math.max(0, Math.ceil((new Date(m.actual_date).getTime() - new Date(m.end_date).getTime()) / (1000 * 60 * 60 * 24))) : null
    }));

    // Resource Utilization
    const resourceUtilization = await Promise.all(assignedTeam.map(async (user) => {
        if (!user) return null;
        const assignedTasks = allTasks.filter(t => t.assigned_to === user.id).length;
        const completedTasks = allTasks.filter(t => t.assigned_to === user.id && t.status?.toLowerCase() === 'completed').length;
        const taskLoadPercent = totalTasks ? Math.round((assignedTasks / totalTasks) * 100) : 0;
        // Placeholder for followUpsHandled and activeIssues
        return {
            ...user,
            assignedTasks,
            completedTasks,
            loadPercent: `${taskLoadPercent}%`,
            followUpsHandled: 0,
            activeIssues: 0
        };
    }));

    // Compose final response
    return {
        basicProjectInfo: {
            projectType,
            projectManager,
            estimatedStartDate: project.start_date ? new Date(project.start_date).toLocaleString() : null,
            estimatedEndDate: project.end_date ? new Date(project.end_date).toLocaleString() : null,
            actualStartDate: project.actual_start_date ? new Date(project.actual_start_date).toLocaleString() : null,
            actualEndDate: project.actual_end_date ? new Date(project.actual_end_date).toLocaleString() : null,
            assignedTeam: assignedTeam.filter(Boolean),
            projectPhase,
            currentStatus
        },
        costBudgetAnalysis: {
            budget,
            estimatedCost,
            actualCost,
            budgetUtilization,
            overrun
        },
        taskMetrics: {
            totalTasks,
            completedTasks,
            inProgressTasks,
            overdueTasks,
            avgTaskCompletionTime,
            taskReassignmentCount,
            topPerformer,
            chart: taskMetricsChart
        },
        documentSummary: {
            totalFiles,
            files: documentSummary
        },
        followUpMatrix,
        timelineAnalysis,
        milestoneSummary,
        resourceUtilization: resourceUtilization.filter(Boolean)
    };
}
