import { AppDataSource } from "../utils/data-source";
import { User } from "../entities/user.entity";
import { ProjectTasks } from "../entities/project-task.entity";
import { ProjectMilestones } from "../entities/project-milestone.entity";
import { projectAttachments } from "../entities/project-attachments.entity";
import {
  LeadFollowup,
  FollowupStatus,
} from "../entities/lead-followups.entity";
import {
  Between,
  MoreThanOrEqual,
  LessThanOrEqual,
  Not,
  ILike,
  In,
  Brackets,
  LessThan,
} from "typeorm";
import ExcelJS from "exceljs";
import { AppError } from "../utils";
import { Project } from "../entities/projects.entity";
import { Clients } from "../entities/clients.entity";
import { EILog } from "../entities/eilog.entity";
import { LeadReportsParams, LeadReportsData, LeadFunnelChart, LeadKPIMetrics, StaffConversionPerformance, SourceWiseConversionRate, LeadFunnelStage, MonthlyLeadsData } from '../types/report';
import { Leads } from '../entities/leads.entity';
import { BusinessAnalysisParams, BusinessAnalysisReport, LeadFunnelMetrics, ProjectDeliveryMetrics, FinancialSummary, TeamStaffPerformance, MonthlyTrendData } from '../types/report';
import { ProjectStatus } from '../entities/projects.entity';
import { PublicDashboardParams, PublicDashboardReport, PublicBusinessOverview, PublicLeadClientInterest, PublicTrendChart, PublicMonthlyLeadsChart, PublicTeamPerformance } from '../types/report';
import { any } from "zod";
import { ClientFollowup, ClientFollowupStatus } from "../entities/clients-followups.entity";

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
const leadFollowupRepo = AppDataSource.getRepository(LeadFollowup);
const clientFollowupRepo = AppDataSource.getRepository(ClientFollowup);


const leadRepo = AppDataSource.getRepository(Leads);

export async function getStaffPerformanceReport(params: StaffPerformanceReportParams): Promise<any> {
    const { startDate, endDate, userId } = params;

    // Parse date range
  let dateFilter: { from?: Date; to?: Date } = {};
  if (startDate && endDate) {
    dateFilter.from = new Date(startDate);
    dateFilter.to = new Date(endDate);
    dateFilter.to.setHours(23, 59, 59, 999);
  } else if (startDate) {
    dateFilter.from = new Date(startDate);
    dateFilter.to = new Date();
  } else if (endDate) {
    dateFilter.from = new Date(0); // epoch
    dateFilter.to = new Date(endDate);
    dateFilter.to.setHours(23, 59, 59, 999);
  } else {
    // Default to last 30 days if no dates provided
    dateFilter.to = new Date();
    dateFilter.from = new Date();
    dateFilter.from.setDate(dateFilter.from.getDate() - 30);
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
    const completedTasks = tasks.filter(t => t.status === 'Completed').length;
    const completionRate = totalTasksAssigned > 0 ? (completedTasks / totalTasksAssigned) * 100 : 0;
    let avgDaysToComplete = 0;
    const completedTaskDates = tasks.filter(t => t.status === 'Completed' && (t as any).created_at && (t as any).updated_at);
    if (completedTaskDates.length > 0) {
        const totalDays = completedTaskDates.reduce((sum, t) => {
            const created = new Date((t as any).created_at);
            const updated = new Date((t as any).updated_at);
            return sum + (updated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
        }, 0);
        avgDaysToComplete = totalDays / completedTaskDates.length;
    }

    // Milestones managed by user (no date filter)
    const milestonesManaged = await milestoneRepo.count({ where: { assigned_to: user.id } });
    
    const documentContributions = await AppDataSource.query(`
    SELECT (
        (SELECT COUNT(*) FROM lead_attachments 
         WHERE deleted = false 
         ${userId ? 'AND uploaded_by = $3' : ''} 
         ${dateFilter.from && dateFilter.to ? 'AND created_at BETWEEN $1 AND $2' : ''})
        +
        (SELECT COUNT(*) FROM project_attachments 
         WHERE deleted = false 
         ${userId ? 'AND uploaded_by = $3' : ''} 
         ${dateFilter.from && dateFilter.to ? 'AND created_at BETWEEN $1 AND $2' : ''})
    ) as total_documents
`, 
dateFilter.from && dateFilter.to 
    ? (userId ? [dateFilter.from, dateFilter.to, userId] : [dateFilter.from, dateFilter.to])
    : (userId ? [userId] : [])
).then(result => parseInt(result[0].total_documents) || 0);

    // // Followups by user
    // const followups = await followupRepo.find({ where: followupWhere });
    // const totalFollowUps = followups.length;
    // const completedFollowUps = followups.filter(f => f.status === FollowupStatus.COMPLETED).length;
    // const pendingFollowUps = followups.filter(f => f.status.toLocaleLowerCase() === FollowupStatus.PENDING.toLocaleLowerCase() || f.status.toLocaleLowerCase() === FollowupStatus.AWAITING_RESPONSE.toLocaleLowerCase()).length;
    // const completedFollowupDates = followups.filter(f => f.status === FollowupStatus.COMPLETED && f.due_date && f.completed_date);
    // if (completedFollowupDates.length > 0) {
    //     const totalHours = completedFollowupDates.reduce((sum, f) => {
    //         return sum + ((f.completed_date!.getTime() - f.due_date!.getTime()) / (1000 * 60 * 60));
    //     }, 0);
    // }
    // const missedFollowUps = completedFollowupDates.filter(f => f.completed_date! > f.due_date!).length;

let avgFollowUpResponseTime = 0;

const leadResponseTimeQuery = followupRepo
    .createQueryBuilder("lead_followup")
    .select([
        "AVG(EXTRACT(EPOCH FROM (lead_followup.completed_date - lead_followup.due_date)) / 3600) as avg_hours",
        "COUNT(*) as count"
    ])
    .where("lead_followup.status = :status", { status: FollowupStatus.COMPLETED })
    .andWhere("lead_followup.due_date IS NOT NULL")
    .andWhere("lead_followup.completed_date IS NOT NULL");

const clientResponseTimeQuery = clientFollowupRepo
    .createQueryBuilder("client_followup")
    .select([
        "AVG(EXTRACT(EPOCH FROM (client_followup.completed_date - client_followup.due_date)) / 3600) as avg_hours",
        "COUNT(*) as count"
    ])
    .where("client_followup.status = :status", { status: ClientFollowupStatus.COMPLETED })
    .andWhere("client_followup.due_date IS NOT NULL")
    .andWhere("client_followup.completed_date IS NOT NULL");

// Add user filter only if userId exists
if (userId) {
    leadResponseTimeQuery.andWhere("lead_followup.user_id = :userId", { userId: userId });
    clientResponseTimeQuery.andWhere("client_followup.user_id = :userId", { userId: userId });
}

// Apply date filter to both queries
const applyDateFilter = (query: any) => {
    if (dateFilter.from && dateFilter.to) {
        query.andWhere("created_at BETWEEN :from AND :to", {
            from: dateFilter.from,
            to: dateFilter.to
        });
    } else if (dateFilter.from) {
        query.andWhere("created_at >= :from", { from: dateFilter.from });
    } else if (dateFilter.to) {
        query.andWhere("created_at <= :to", { to: dateFilter.to });
    }
    return query;
};

applyDateFilter(leadResponseTimeQuery);
applyDateFilter(clientResponseTimeQuery);

// Execute both queries
const [leadResult, clientResult] = await Promise.all([
    leadResponseTimeQuery.getRawOne<{ avg_hours: string | null; count: string }>(),
    clientResponseTimeQuery.getRawOne<{ avg_hours: string | null; count: string }>()
]);

// Calculate weighted average from both followup types
let totalWeightedHours = 0;
let totalFollowups = 0;

// Process lead followups
if (leadResult?.avg_hours && leadResult?.count) {
    const leadAvgHours = parseFloat(leadResult.avg_hours);
    const leadCount = parseInt(leadResult.count);
    
    if (leadCount > 0) {
        totalWeightedHours += leadAvgHours * leadCount;
        totalFollowups += leadCount;
    }
}

// Process client followups
if (clientResult?.avg_hours && clientResult?.count) {
    const clientAvgHours = parseFloat(clientResult.avg_hours);
    const clientCount = parseInt(clientResult.count);
    
    if (clientCount > 0) {
        totalWeightedHours += clientAvgHours * clientCount;
        totalFollowups += clientCount;
    }
}

// Calculate final weighted average
avgFollowUpResponseTime = totalFollowups > 0 
    ? totalWeightedHours / totalFollowups 
    : 0;

const delayedTasksCount = await AppDataSource.query(`
    SELECT COUNT(*) as delayed_tasks_count
    FROM project_tasks pt
    WHERE pt.deleted = false
    AND LOWER(pt.status) != 'completed'
    AND pt.due_date < CURRENT_DATE
    ${userId ? 'AND pt.assigned_to = $3' : ''}
    ${dateFilter.from && dateFilter.to ? 'AND pt.created_at BETWEEN $1 AND $2' : ''}
`,
dateFilter.from && dateFilter.to 
    ? (userId ? [dateFilter.from, dateFilter.to, userId] : [dateFilter.from, dateFilter.to])
    : (userId ? [userId] : [])
).then(result => parseInt(result[0].delayed_tasks_count) || 0);


const createFollowupCountQuery = (repo: any, statusField: string, statusValues?: string[], isMissed: boolean = false) => {
    const query = repo
        .createQueryBuilder("followup")
        .select("COUNT(*)", "count");
    
    if (statusValues && statusValues.length > 0) {
        if (statusValues.length === 1) {
            query.where(`followup.${statusField} = :status`, { status: statusValues[0] });
        } else {
            query.where(`followup.${statusField} IN (:...statuses)`, { statuses: statusValues });
        }
    }
    
    query.andWhere("followup.due_date IS NOT NULL");
    
    // For missed queries, we need different logic
    if (isMissed) {
        query.andWhere("followup.due_date < CURRENT_DATE")
             .andWhere(`followup.${statusField} NOT IN (:...completedStatuses)`, { 
                 completedStatuses: [FollowupStatus.COMPLETED, ClientFollowupStatus.COMPLETED] 
             });
    }
    
    // Add user filter if userId exists
    if (userId) {
        query.andWhere("followup.user_id = :userId", { userId: userId });
    }
    
    // Apply date filter
    if (dateFilter.from && dateFilter.to) {
        query.andWhere("followup.created_at BETWEEN :from AND :to", {
            from: dateFilter.from,
            to: dateFilter.to
        });
    } else if (dateFilter.from) {
        query.andWhere("followup.created_at >= :from", { from: dateFilter.from });
    } else if (dateFilter.to) {
        query.andWhere("followup.created_at <= :to", { to: dateFilter.to });
    }
    
    return query;
};

// Create queries for both lead and client followups
const leadTotalQuery = createFollowupCountQuery(followupRepo, "status");
const leadCompletedQuery = createFollowupCountQuery(followupRepo, "status", [FollowupStatus.COMPLETED]);
const leadPendingQuery = createFollowupCountQuery(followupRepo, "status", [FollowupStatus.PENDING, FollowupStatus.RESCHEDULE]);
const leadMissedQuery = createFollowupCountQuery(followupRepo, "status", undefined, true);

const clientTotalQuery = createFollowupCountQuery(clientFollowupRepo, "status");
const clientCompletedQuery = createFollowupCountQuery(clientFollowupRepo, "status", [ClientFollowupStatus.COMPLETED]);
const clientPendingQuery = createFollowupCountQuery(clientFollowupRepo, "status", [ClientFollowupStatus.PENDING, ClientFollowupStatus.RESCHEDULE]);
const clientMissedQuery = createFollowupCountQuery(clientFollowupRepo, "status", undefined, true);

// Execute all queries
const [
    leadTotalResult,
    leadCompletedResult,
    leadPendingResult,
    leadMissedResult,
    clientTotalResult,
    clientCompletedResult,
    clientPendingResult,
    clientMissedResult
] = await Promise.all([
    leadTotalQuery.getRawOne(),
    leadCompletedQuery.getRawOne(),
    leadPendingQuery.getRawOne(),
    leadMissedQuery.getRawOne(),
    clientTotalQuery.getRawOne(),
    clientCompletedQuery.getRawOne(),
    clientPendingQuery.getRawOne(),
    clientMissedQuery.getRawOne()
]);

// Helper function to parse count results
const parseCount = (result: any) => result ? parseInt(result.count || '0') : 0;

// Calculate totals across both followup types
const totalFollowUps = parseCount(leadTotalResult) + parseCount(clientTotalResult);
const completedFollowUps = parseCount(leadCompletedResult) + parseCount(clientCompletedResult);
const pendingFollowUps = parseCount(leadPendingResult) + parseCount(clientPendingResult);
const missedFollowUps = parseCount(leadMissedResult) + parseCount(clientMissedResult);

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
            delayedTasks: delayedTasksCount
        },
        milestoneFileActivity: {
            milestonesManaged,
            filesUploaded: documentContributions,
        },
        followUpPerformance: {
            totalFollowUps,
            completedFollowUps,
            pendingFollowUps,
            missedFollowUps,
            avgResponseTime: `${Math.round(avgFollowUpResponseTime)} Hr`,
        }
    };
}

export async function exportStaffPerformanceToExcel(params: StaffPerformanceReportParams): Promise<{ workbook: ExcelJS.Workbook; name: string }> {
  const report = await getStaffPerformanceReport(params);
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Staff Performance');
  worksheet.columns = [
    { header: 'First Name', key: 'firstName', width: 15 },
    { header: 'Last Name', key: 'lastName', width: 15 },
    { header: 'Email', key: 'email', width: 25 },
    { header: 'Phone', key: 'phone', width: 15 },
    { header: 'Total Tasks Assigned', key: 'totalTasksAssigned', width: 20 },
    { header: 'Completed Tasks', key: 'completedTasks', width: 18 },
    { header: 'Completion Rate', key: 'completionRate', width: 18 },
    { header: 'Avg Days to Complete', key: 'avgDaysToComplete', width: 20 },
    { header: 'Delayed Tasks', key: 'delayedTasks', width: 15 },
    { header: 'Milestones Managed', key: 'milestonesManaged', width: 18 },
    { header: 'Files Uploaded', key: 'filesUploaded', width: 15 },
    { header: 'Total Follow-ups', key: 'totalFollowUps', width: 18 },
    { header: 'Completed Follow-ups', key: 'completedFollowUps', width: 20 },
    { header: 'Pending Follow-ups', key: 'pendingFollowUps', width: 20 },
    { header: 'Missed Follow-ups', key: 'missedFollowUps', width: 18 },
    { header: 'Avg Follow-up Response Time', key: 'avgResponseTime', width: 28 },
  ];
  worksheet.addRow({
    firstName: report.staffInfo.firstName,
    lastName: report.staffInfo.lastName,
    email: report.staffInfo.email,
    phone: report.staffInfo.phone,
    totalTasksAssigned: report.taskSummary.totalTasksAssigned,
    completedTasks: report.taskSummary.completedTasks,
    completionRate: report.taskSummary.completionRate,
    avgDaysToComplete: report.taskSummary.avgDaysToComplete,
    delayedTasks: report.taskSummary.delayedTasks,
    milestonesManaged: report.milestoneFileActivity.milestonesManaged,
    filesUploaded: report.milestoneFileActivity.filesUploaded,
    totalFollowUps: report.followUpPerformance.totalFollowUps,
    completedFollowUps: report.followUpPerformance.completedFollowUps,
    pendingFollowUps: report.followUpPerformance.pendingFollowUps,
    missedFollowUps: report.followUpPerformance.missedFollowUps,
    avgResponseTime: report.followUpPerformance.avgResponseTime,
  });
  const name = `staff_performance_${Date.now()}`;
  return { workbook, name };
}

export async function getProjectPerformanceReport({ projectId, clientId, fromDate, toDate }: { projectId?: string; clientId?: string; fromDate?: string; toDate?: string }): Promise<any> {
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

    // Date filter logic
    let dateFrom: Date | undefined = fromDate ? new Date(fromDate) : undefined;
    let dateTo: Date | undefined = toDate ? new Date(toDate) : undefined;
    if (dateTo) dateTo.setHours(23, 59, 59, 999);

    // Helper: check if a date is in range
    const inRange = (d: Date | string | undefined | null) => {
        if (!d) return false;
        const dt = new Date(d);
        if (dateFrom && dt < dateFrom) return false;
        if (dateTo && dt > dateTo) return false;
        return true;
    };

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

    // Basic Project Info (unchanged)
    const projectType = project.project_type?.name || "";
    let projectManager = null;
    if (project.milestones && project.milestones.length > 0) {
        const firstMilestone = project.milestones.find(m => m.assigned_to);
        if (firstMilestone && firstMilestone.assigned_to) {
            projectManager = await getUserDetails(firstMilestone.assigned_to);
        }
    }
    // Assigned Team: all unique assigned_to from milestones and tasks (filtered by date)
    const teamUserIds = new Set<string>();
    (project.milestones || []).forEach(m => {
        if ((!dateFrom && !dateTo) || inRange(m.created_at)) {
            if (m.assigned_to) teamUserIds.add(m.assigned_to);
            (m.tasks || []).forEach(t => { if ((!dateFrom && !dateTo) || inRange(t.created_at)) { if (t.assigned_to) teamUserIds.add(t.assigned_to); } });
        }
    });
    const assignedTeam = await Promise.all(Array.from(teamUserIds).map(getUserDetails));
    const projectPhase = (project.milestones || []).find(m => ((!dateFrom && !dateTo) || inRange(m.created_at)) && m.status && m.status.toLowerCase() !== 'completed')?.name || "";
    const currentStatus = (project.milestones || []).find(m => ((!dateFrom && !dateTo) || inRange(m.created_at)) && m.status && m.status.toLowerCase() !== 'completed')?.status || project.status;

// Cost & Budget Analysis
// Cost & Budget Analysis
const budget = project.budget ? `${project.budget.toLocaleString()}` : "Not set";
const estimatedCost = project.estimated_cost ? `${project.estimated_cost.toLocaleString()}` : "Not set";
const actualCost = project.actual_cost ? `${project.actual_cost.toLocaleString()}` : "No costs yet";

// Budget Utilization
const budgetUtilization = (project.budget && project.actual_cost && project.budget > 0)
    ? `${Math.min((Number(project.actual_cost) / Number(project.budget)) * 100, 100).toFixed(0)}%`
    : "Calculate when costs added";

// Overrun
const overrun = (project.budget && project.actual_cost && project.actual_cost > project.budget)
    ? `${(Number(project.actual_cost) - Number(project.budget)).toLocaleString()}`
    : "No overrun";

    // Task Metrics (filtered by date)
    const allTasks = (project.milestones || []).flatMap(m => ((!dateFrom && !dateTo) || inRange(m.created_at)) ? (m.tasks || []).filter(t => (!dateFrom && !dateTo) || inRange(t.created_at)) : []);
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter(t => t.status?.toLowerCase() === 'completed').length;
    const inProgressTasks = allTasks.filter(t => t.status?.toLowerCase().includes('progress')).length;
    const overdueTasks = allTasks.filter(t => t.due_date && inRange(t.due_date) && new Date(t.due_date) < new Date() && t.status?.toLowerCase() !== 'completed').length;
    const avgTaskCompletionTime = (() => {
        const completed = allTasks.filter(t => t.status?.toLowerCase() === 'completed' && t.created_at && t.updated_at);
        if (!completed.length) return "0 Days";
        const totalDays = completed.reduce((sum, t) => sum + ((new Date(t.updated_at).getTime() - new Date(t.created_at).getTime()) / (1000 * 60 * 60 * 24)), 0);
        return `${(totalDays / completed.length).toFixed(1)} Days`;
    })();
    const taskReassignmentCount = 0;
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
    const taskMetricsChart = [
        { label: "Total Tasks", value: totalTasks },
        { label: "Completed", value: completedTasks },
        { label: "In Progress", value: inProgressTasks },
        { label: "Overdue", value: overdueTasks }
    ];

    // Document Summary (filtered by date)
    const documentSummary = (project.attachments || [])
        .filter(a => (!dateFrom && !dateTo) || inRange(a.created_at))
        .map(att => ({
            file_url: att.file_path || null,
            last_updated: att.created_at ? new Date(att.created_at).toLocaleDateString() : null,
            file_name: att.file_name || null
        }));
    const totalFiles = documentSummary.length;

    // Follow-Up & Communication Matrix (unchanged, placeholder)
    const followUpMatrix = {
        totalFollowUpsLogged: 0,
        followUpsCompleted: 0,
        pendingFollowUps: 0,
        missedOrDelayedFollowUps: 0,
        avgResponseTimeHours: "0 hours",
        escalatedItems: 0
    };

    // Timeline Analysis (unchanged)
    const now = new Date();
    const daysSinceStart = project.start_date ? Math.ceil((now.getTime() - new Date(project.start_date).getTime()) / (1000 * 60 * 60 * 24)) : 0;
    const plannedDurationDays = project.start_date && project.end_date ? Math.ceil((new Date(project.end_date).getTime() - new Date(project.start_date).getTime()) / (1000 * 60 * 60 * 24)) : 0;
    const progressPercent = (project.milestones && project.milestones.length)
        ? Math.round((project.milestones.filter((m) => ((!dateFrom && !dateTo) || inRange(m.created_at)) && m.status.toLowerCase() === 'completed').length / project.milestones.filter(m => (!dateFrom && !dateTo) || inRange(m.created_at)).length * 100))
        : 0;
    const delayRisk = progressPercent < 100 && (project.milestones || []).some((m) => ((!dateFrom && !dateTo) || inRange(m.created_at)) && m.end_date && m.actual_date && (new Date(m.actual_date).getTime() - new Date(m.end_date).getTime()) / (1000 * 60 * 60 * 24) > 0) ? 'Medium' : 'Low';
    const timelineAnalysis = {
        daysSinceStart,
        plannedDurationDays,
        progressPercent,
        delayRisk
    };

    // Milestone Summary (filtered by date)
    const milestoneSummary = (project.milestones || []).filter(m => (!dateFrom && !dateTo) || inRange(m.created_at)).map((m) => ({
        milestoneId: m.id,
        name: m.name,
        status: m.status,
        start_date: m.start_date ? new Date(m.start_date).toLocaleDateString() : null,
        end_date: m.end_date ? new Date(m.end_date).toLocaleDateString() : null,
        actual_date: m.actual_date ? new Date(m.actual_date).toLocaleDateString() : null,
        assigned_to: m.assigned_to ? assignedTeam.find(u => u && u.id === m.assigned_to) : null,
        delayDays: m.end_date && m.actual_date ? Math.max(0, Math.ceil((new Date(m.actual_date).getTime() - new Date(m.end_date).getTime()) / (1000 * 60 * 60 * 24))) : null
    }));

    // Resource Utilization (filtered by date)
    const resourceUtilization = await Promise.all(assignedTeam.map(async (user) => {
        if (!user) return null;
        const assignedTasks = allTasks.filter(t => t.assigned_to === user.id).length;
        const completedTasks = allTasks.filter(t => t.assigned_to === user.id && t.status?.toLowerCase() === 'completed').length;
        const taskLoadPercent = totalTasks ? Math.round((assignedTasks / totalTasks) * 100) : 0;
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
            estimatedStartDate: project.start_date ?? null,
            estimatedEndDate: project.end_date ?? null,
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

export async function exportProjectPerformanceReportToExcel(params: any): Promise<{ workbook: ExcelJS.Workbook; name: string }> {
  const { projectId, clientId, fromDate, toDate } = params;
  // Build filter
  let where: any = { deleted: false };
  if (projectId) where.id = projectId;
  if (clientId) where.client = { id: clientId };
  if (fromDate || toDate) {
    if (fromDate && toDate) {
      where.created_at = Between(new Date(fromDate), (() => { const d = new Date(toDate); d.setHours(23,59,59,999); return d; })());
    } else if (fromDate) {
      where.created_at = Between(new Date(fromDate), new Date());
    } else if (toDate) {
      const to = new Date(toDate); to.setHours(23,59,59,999);
      where.created_at = Between(new Date(0), to);
    }
  }
  // Fetch all projects for the filters
  const projects = await projectRepo.find({
    where,
    select: ['id'],
  });
  const workbook = new ExcelJS.Workbook();

  // 1. Basic Project Info
  const basicSheet = workbook.addWorksheet('BasicProjectInfo');
  let basicColumnsSet = false;
  // 2. Cost & Budget Analysis
  const costSheet = workbook.addWorksheet('CostBudgetAnalysis');
  let costColumnsSet = false;
  // 3. Task Metrics
  const taskSheet = workbook.addWorksheet('TaskMetrics');
  let taskColumnsSet = false;
  // 4. Document Summary
  const docSheet = workbook.addWorksheet('DocumentSummary');
  let docColumnsSet = false;
  // 5. Follow-Up Matrix
  const followupSheet = workbook.addWorksheet('FollowUpMatrix');
  let followupColumnsSet = false;
  // 6. Timeline Analysis
  const timelineSheet = workbook.addWorksheet('TimelineAnalysis');
  let timelineColumnsSet = false;
  // 7. Milestone Summary
  const milestoneSheet = workbook.addWorksheet('MilestoneSummary');
  let milestoneColumnsSet = false;
  // 8. Resource Utilization
  const resourceSheet = workbook.addWorksheet('ResourceUtilization');
  let resourceColumnsSet = false;
  // 9. Assigned Team
  const assignedTeamSheet = workbook.addWorksheet('AssignedTeam');
  assignedTeamSheet.columns = [
    { header: 'Project S.No.', key: 'projectSno', width: 12 },
    { header: 'Name', key: 'name', width: 25 },
    { header: 'Email', key: 'email', width: 25 },
    { header: 'Phone', key: 'phone', width: 18 },
    { header: 'Role', key: 'role', width: 18 },
  ];

  // 10. Project Manager
  const projectManagerSheet = workbook.addWorksheet('ProjectManager');
  projectManagerSheet.columns = [
    { header: 'Project S.No.', key: 'projectSno', width: 12 },
    { header: 'Name', key: 'name', width: 25 },
    { header: 'Email', key: 'email', width: 25 },
    { header: 'Phone', key: 'phone', width: 18 },
    { header: 'Role', key: 'role', width: 18 },
  ];

  let basicSno = 1, costSno = 1, taskSno = 1, docSno = 1, followupSno = 1, timelineSno = 1, milestoneSno = 1, resourceSno = 1;
  for (const project of projects) {
    const report = await getProjectPerformanceReport({ projectId: project.id });
    // Basic Project Info
    const basicInfo = { ...report.basicProjectInfo };
    // Remove 'assignedTeam' and 'projectManager' from basicInfo before adding to worksheet
    const { assignedTeam, projectManager, ...basicInfoWithoutTeamManager } = basicInfo;
    if (!basicColumnsSet) {
      basicSheet.columns = [
        { header: 'S.No.', key: 'sno', width: 8 },
        ...Object.keys(basicInfoWithoutTeamManager).map(key => ({ header: key, key, width: 20 }))
      ];
      basicColumnsSet = true;
    }
    basicSheet.addRow({ sno: basicSno++, ...basicInfoWithoutTeamManager });
    // Project Manager worksheet
    if (projectManager && typeof projectManager === 'object') {
      projectManagerSheet.addRow({
        projectSno: basicSno - 1,
        name: projectManager.name || '',
        email: projectManager.email || '',
        phone: projectManager.phone || '',
        role: projectManager.role || '',
      });
    }
    // Cost & Budget Analysis
    if (!costColumnsSet) {
      costSheet.columns = [
        { header: 'S.No.', key: 'sno', width: 8 },
        ...Object.keys(report.costBudgetAnalysis).map(key => ({ header: key, key, width: 20 }))
      ];
      costColumnsSet = true;
    }
    costSheet.addRow({ sno: costSno++, ...report.costBudgetAnalysis });
    // Task Metrics
    if (!taskColumnsSet) {
      taskSheet.columns = [
        { header: 'S.No.', key: 'sno', width: 8 },
        ...Object.keys(report.taskMetrics)
          .filter(key => key !== 'chart')
          .map(key => ({ header: key, key, width: 20 }))
      ];
      taskColumnsSet = true;
    }
    const taskMetricsRow = { ...report.taskMetrics };
    if (typeof taskMetricsRow.topPerformer === 'object' && taskMetricsRow.topPerformer !== null) {
      taskMetricsRow.topPerformer = taskMetricsRow.topPerformer.name || '';
    } else if (!taskMetricsRow.topPerformer) {
      taskMetricsRow.topPerformer = '';
    }
    // Remove 'chart' property from row
    delete taskMetricsRow.chart;
    taskSheet.addRow({ sno: taskSno++, ...taskMetricsRow });
    // Task Metrics Chart (separate sheet)
    if (!workbook.getWorksheet('TaskMetricsChart')) {
      const chartSheet = workbook.addWorksheet('TaskMetricsChart');
      chartSheet.columns = [
        { header: 'Label', key: 'label', width: 20 },
        { header: 'Value', key: 'value', width: 15 },
      ];
      if (Array.isArray(report.taskMetrics.chart)) {
        report.taskMetrics.chart.forEach((row: { label: string; value: number }) => chartSheet.addRow(row));
      }
    }
    // Document Summary
    if (!docColumnsSet) {
      docSheet.columns = [
        { header: 'S.No.', key: 'sno', width: 8 },
        { header: 'File URL', key: 'file_url', width: 40 },
        { header: 'Last Updated', key: 'last_updated', width: 18 },
        { header: 'File Name', key: 'file_name', width: 25 },
      ];
      docColumnsSet = true;
    }
    if (Array.isArray(report.documentSummary.files)) {
      report.documentSummary.files.forEach((file: { file_url: string; last_updated: string; file_name: string }, idx: number) => {
        docSheet.addRow({
          sno: docSno++,
          file_url: { text: file.file_name || file.file_url, hyperlink: file.file_url },
          last_updated: file.last_updated,
          file_name: file.file_name,
        });
      });
      docSheet.addRow({});
      docSheet.addRow({ file_name: 'Total Files', file_url: report.documentSummary.totalFiles });
    }
    // Follow-Up Matrix
    if (!followupColumnsSet) {
      followupSheet.columns = [
        { header: 'S.No.', key: 'sno', width: 8 },
        ...Object.keys(report.followUpMatrix).map(key => ({ header: key, key, width: 20 }))
      ];
      followupColumnsSet = true;
    }
    followupSheet.addRow({ sno: followupSno++, ...report.followUpMatrix });
    // Timeline Analysis
    if (!timelineColumnsSet) {
      timelineSheet.columns = [
        { header: 'S.No.', key: 'sno', width: 8 },
        ...Object.keys(report.timelineAnalysis).map(key => ({ header: key, key, width: 20 }))
      ];
      timelineColumnsSet = true;
    }
    timelineSheet.addRow({ sno: timelineSno++, ...report.timelineAnalysis });
    // Milestone Summary (array)
    if (Array.isArray(report.milestoneSummary)) {
      if (!milestoneColumnsSet && report.milestoneSummary.length > 0) {
        milestoneSheet.columns = [
          { header: 'S.No.', key: 'sno', width: 8 },
          ...Object.keys(report.milestoneSummary[0]).map(key => ({ header: key, key, width: 20 }))
        ];
        milestoneColumnsSet = true;
      }
      report.milestoneSummary.forEach((row: Record<string, unknown>, idx: number) => milestoneSheet.addRow({ sno: milestoneSno++, ...row }));
    }
    // resourceUtilization (array)
    if (Array.isArray(report.resourceUtilization)) {
      if (!resourceColumnsSet && report.resourceUtilization.length > 0) {
        resourceSheet.columns = [
          { header: 'S.No.', key: 'sno', width: 8 },
          ...Object.keys(report.resourceUtilization[0]).map(key => ({ header: key, key, width: 20 }))
        ];
        resourceColumnsSet = true;
      }
      report.resourceUtilization.forEach((row: Record<string, unknown>, idx: number) => resourceSheet.addRow({ sno: resourceSno++, ...row }));
    }
    // Assigned Team worksheet
    if (Array.isArray(report.basicProjectInfo.assignedTeam)) {
      report.basicProjectInfo.assignedTeam.forEach((member: any) => {
        if (member && typeof member === 'object') {
          assignedTeamSheet.addRow({
            projectSno: basicSno,
            name: member.name || '',
            email: member.email || '',
            phone: member.phone || '',
            role: member.role || '',
          });
        }
      });
    }
  }
  const name = `project_performance_${Date.now()}`;
  return { workbook, name };
}

export async function getLeadReports(params: LeadReportsParams): Promise<LeadReportsData> {
  const { fromDate, toDate } = params;

      // Parse date range
  let dateFilter: { from?: Date; to?: Date } = {};
  if (fromDate && toDate) {
    dateFilter.from = new Date(fromDate);
    dateFilter.to = new Date(toDate);
    dateFilter.to.setHours(23, 59, 59, 999);
  } else if (fromDate) {
    dateFilter.from = new Date(fromDate);
    dateFilter.to = new Date();
  } else if (toDate) {
    dateFilter.from = new Date(0); // epoch
    dateFilter.to = new Date(toDate);
    dateFilter.to.setHours(23, 59, 59, 999);
  } else {
    // Default to last 30 days if no dates provided
    dateFilter.to = new Date();
    dateFilter.from = new Date();
    dateFilter.from.setDate(dateFilter.from.getDate() - 30);
  }

  // Build base query conditions
  let baseWhereConditions: any = { deleted: false };

  // Date filter
  if (dateFilter.from && dateFilter.to) {
    baseWhereConditions.created_at = Between(dateFilter.from, dateFilter.to);
  }


  // // 1. Lead Funnel Chart
  // const leadFunnelChart = await getLeadFunnelChart(baseWhereConditions);

  // // 2. KPI Metrics
  // const kpiMetrics = await getKPIMetrics(baseWhereConditions, dateFilter);

  // // 3. Staff Conversion Performance
  // const staffConversionPerformance = await getStaffConversionPerformance(baseWhereConditions);

  // // 4. Source-wise Conversion Rates
  // const sourceWiseConversionRates = await getSourceWiseConversionRates(baseWhereConditions);

  // // 5. Lead Funnel Stages
  // const leadFunnelStages = await getLeadFunnelStages(baseWhereConditions);

  // // 6. Monthly Leads Chart
  // const monthlyLeadsChart = await getMonthlyLeadsChart(baseWhereConditions);

  // // 7. Summary
  // const summary = await getSummary(baseWhereConditions);

  const [
  leadFunnelChart,
  kpiMetrics,
  staffConversionPerformance,
  sourceWiseConversionRates,
  leadFunnelStages,
  monthlyLeadsChart,
  summary
] = await Promise.all([
  getLeadFunnelChart(baseWhereConditions, dateFilter),
  getKPIMetrics(baseWhereConditions, dateFilter),
  getStaffConversionPerformance(baseWhereConditions),
  getSourceWiseConversionRates(dateFilter),
  getLeadFunnelStages(baseWhereConditions),
  getMonthlyLeadsChart(baseWhereConditions),
  getSummary(baseWhereConditions)
]);


  return {
    leadFunnelChart,
    kpiMetrics,
    staffConversionPerformance,
    sourceWiseConversionRates,
    leadFunnelStages,
    monthlyLeadsChart,
    summary
  };
}

export async function exportLeadReportToExcel(params: any): Promise<{ workbook: ExcelJS.Workbook; name: string }> {
  // Fetch the full report for the filters
  const report = await getLeadReports(params);
  const workbook = new ExcelJS.Workbook();

  // 1. Lead Funnel Chart
  const funnelSheet = workbook.addWorksheet('LeadFunnelChart');
  funnelSheet.columns = [
    { header: 'Total Leads', key: 'totalLeads', width: 15 },
    { header: 'Lost Leads', key: 'lostLeads', width: 15 },
    { header: 'Converted Leads', key: 'convertedLeads', width: 18 },
    { header: 'Drop Off Stage', key: 'dropOfStage', width: 20 },
    { header: 'Drop Off Count', key: 'dropOfCount', width: 15 },
  ];
  funnelSheet.addRow({
    totalLeads: report.leadFunnelChart.totalLeads,
    lostLeads: report.leadFunnelChart.lostLeads,
    convertedLeads: report.leadFunnelChart.convertedLeads,
    dropOfStage: report.leadFunnelChart.dropOfStage.stage,
    dropOfCount: report.leadFunnelChart.dropOfStage.count,
  });

  // 2. KPI Metrics
  const kpiSheet = workbook.addWorksheet('KPIMetrics');
  kpiSheet.columns = [
    { header: 'Metric', key: 'metric', width: 30 },
    { header: 'Value', key: 'value', width: 20 },
  ];
  Object.entries(report.kpiMetrics).forEach(([metric, value]) => {
    kpiSheet.addRow({ metric, value });
  });

  // 3. Staff Conversion Performance
  const staffSheet = workbook.addWorksheet('StaffConversionPerformance');
  staffSheet.columns = [
    { header: 'Staff ID', key: 'staffId', width: 15 },
    { header: 'Staff Name', key: 'staffName', width: 25 },
    { header: 'Conversion Rate (%)', key: 'conversionRate', width: 20 },
  ];
  report.staffConversionPerformance.forEach(staff => {
    staffSheet.addRow(staff);
  });

  // 4. Source Wise Conversion Rates
  const sourceSheet = workbook.addWorksheet('SourceWiseConversionRates');
  sourceSheet.columns = [
    { header: 'Source', key: 'source', width: 20 },
    { header: 'Conversion Rate (%)', key: 'conversionRate', width: 20 },
  ];
  report.sourceWiseConversionRates.forEach(source => {
    sourceSheet.addRow(source);
  });

  // 5. Lead Funnel Stages
  const stageSheet = workbook.addWorksheet('LeadFunnelStages');
  stageSheet.columns = [
    { header: 'Stage', key: 'stage', width: 25 },
    { header: 'Count', key: 'count', width: 15 },
    { header: 'Is Highlighted', key: 'isHighlighted', width: 15 },
  ];
  report.leadFunnelStages.forEach(stage => {
    stageSheet.addRow(stage);
  });

  // 6. Monthly Leads Chart
  const monthlySheet = workbook.addWorksheet('MonthlyLeadsChart');
  monthlySheet.columns = [
    { header: 'Month', key: 'month', width: 12 },
    { header: 'Leads', key: 'leads', width: 10 },
  ];
  report.monthlyLeadsChart.labels.forEach((month, i) => {
    monthlySheet.addRow({
      month,
      leads: report.monthlyLeadsChart.leads[i],
    });
  });

  // 7. Summary
  const summarySheet = workbook.addWorksheet('Summary');
  summarySheet.columns = [
    { header: 'Metric', key: 'metric', width: 25 },
    { header: 'Value', key: 'value', width: 15 },
  ];
  Object.entries(report.summary).forEach(([metric, value]) => {
    summarySheet.addRow({ metric, value });
  });

  const name = `lead_report_${Date.now()}`;
  return { workbook, name };
}

async function getLeadFunnelChart(whereConditions: any, dateFilter?: any, convertedStatusNames: string[] = ["completed", "business done"]): Promise<LeadFunnelChart> {

    const rangeWhere = (dateFilter.from && dateFilter.to)
    ? { created_at: Between(dateFilter.from, dateFilter.to) }
    : {};

  const [totalLeads, lostLeads, convertedLeads] = await Promise.all([
    leadRepo.count({ where: { deleted: false, ...rangeWhere} }),
    leadRepo.count({ 
      where: { deleted: false, ...rangeWhere, status: { name: ILike('no-interested') } },
      relations: ['status']
    }),
     leadRepo.count({
      where: convertedStatusNames.map((s) => ({
        deleted: false,
        ...rangeWhere,
        status: { name: ILike(s) },
      })),
      relations: ["status"],
    }),
  ]);

  // Get the most common stage for drop-off (excluding completed and no-interested)
  const dropOffStage = await leadRepo
    .createQueryBuilder('lead')
    .leftJoin('lead.status', 'status')
    .select(['status.name as stage', 'COUNT(*) as count'])
    .where('lead.deleted = false')
    .andWhere('status.name NOT IN (:...excludedStatuses)', { 
      excludedStatuses: ['Completed', 'no-interested'] 
    })
    .groupBy('status.name')
    .orderBy('count', 'DESC')
    .limit(1)
    .getRawOne();

  return {
    totalLeads,
    lostLeads,
    convertedLeads,
    dropOfStage: {
      stage: dropOffStage?.stage || 'Profile Sent',
      count: parseInt(dropOffStage?.count) || 0
    }
  };
}

async function getKPIMetrics(whereConditions: any, dateFilter: any): Promise<LeadKPIMetrics> {
  // Get all leads for calculations
  const leads = await leadRepo.find({
    where: whereConditions,
    relations: ['status', 'source', 'followups']
  });

  const convertedLeads = leads.filter(lead => lead.status?.name === 'Completed');
  const totalLeads = leads.length;
  const conversionRate = totalLeads > 0 ? (convertedLeads.length / totalLeads) * 100 : 0;

  // Average lead age
  const avgLeadAge = leads.length > 0 
    ? leads.reduce((sum, lead) => {
        const age = Math.floor((Date.now() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60 * 24));
        return sum + age;
      }, 0) / leads.length
    : 0;

  // Average followups per lead
  const totalFollowups = leads.reduce((sum, lead) => sum + lead.followups.length, 0);
  const avgFollowupsLead = leads.length > 0 ? totalFollowups / leads.length : 0;

  // Top performing source
  const sourceStats = await leadRepo
    .createQueryBuilder('lead')
    .leftJoin('lead.source', 'source')
    .leftJoin('lead.status', 'status')
    .select(['source.name as source', 'COUNT(*) as total', 'SUM(CASE WHEN status.name = :completedStatus THEN 1 ELSE 0 END) as converted'])
    .where('lead.deleted = false')
    .andWhere('source.name IS NOT NULL')
    .setParameter('completedStatus', 'Completed')
    .groupBy('source.name')
    .getRawMany();

  const topPerformingSource = sourceStats.length > 0 
    ? sourceStats.reduce((top, current) => {
        const currentRate = current.total > 0 ? (current.converted / current.total) * 100 : 0;
        const topRate = top.total > 0 ? (top.converted / top.total) * 100 : 0;
        return currentRate > topRate ? current : top;
      }).source
    : 'Website';

  // Average time to convert (simplified calculation)
  // For now, using a default value. In a real implementation, you would query the status history
  const avgTimeToConvert = 54; // Default value - can be enhanced with proper status history query

  // Pending followups
  const pendingFollowups = await followupRepo.count({
    where: {
      deleted: false,
      status: Not(FollowupStatus.COMPLETED),
      due_date: LessThanOrEqual(new Date())
    }
  });

  // Hot leads count (leads with high possibility of conversion)
  const hotLeadsCount = await leadRepo.count({
    where: {
      ...whereConditions,
      possibility_of_conversion: MoreThanOrEqual(70)
    }
  });

  // Average response time (simplified calculation)
  const averageResponseTime = 4.5; // Default value, can be calculated from followup timestamps

  return {
    conversionRate: Math.round(conversionRate * 10) / 10, // Round to 1 decimal
    avgLeadAge: Math.round(avgLeadAge * 10) / 10,
    avgFollowupsLead: Math.round(avgFollowupsLead * 10) / 10,
    topPerformingSource,
    avgTimeToConvert: Math.round(avgTimeToConvert),
    pendingFollowups,
    hotLeadsCount,
    averageResponseTime
  };
}

async function getStaffConversionPerformance(whereConditions: any): Promise<StaffConversionPerformance[]> {
  // console.log('Starting getStaffConversionPerformance...');
  
  try {
    // First, check if there are any users in the database
    const totalUsers = await userRepo.count({ where: { deleted: false } });
    // console.log('Total users in database:', totalUsers);
    
    if (totalUsers === 0) {
      console.log('No users found in database');
      return [];
    }
    
    // Get all users to see what data we have
    const allUsers = await userRepo.find({
      where: { deleted: false },
      select: ['id', 'first_name', 'last_name', 'email'],
      relations: ['role']
    });
    
    // console.log('Users with roles:', allUsers.map(u => ({
    //   id: u.id,
    //   firstName: u.first_name,
    //   lastName: u.last_name,
    //   email: u.email,
    //   role: u.role?.role || 'no-role',
    //   roleId: u.role?.id
    // })));
    
    // console.log('All users found:', allUsers.map(u => ({
    //   id: u.id,
    //   firstName: u.first_name,
    //   lastName: u.last_name,
    //   email: u.email,
    //   role: u.role?.role
    // })));
    
    // Try to get staff with lead conversion data
    let staffStats = await leadRepo
      .createQueryBuilder('lead')
      .leftJoin('lead.assigned_to', 'user')
      .leftJoin('lead.status', 'status')
      .select([
        'user.id as staffid',
        'user.first_name as firstname',
        'user.last_name as lastname',
        'COUNT(*) as totalleads',
        'SUM(CASE WHEN status.name = :completedStatus THEN 1 ELSE 0 END) as convertedleads'
      ])
      .where('lead.deleted = false')
      .andWhere('user.id IS NOT NULL')
      .andWhere('user.deleted = false')
      .setParameter('completedStatus', 'Completed')
      .groupBy('user.id, user.first_name, user.last_name')
      .orderBy('convertedleads', 'DESC')
      .limit(10) // Increased limit to get more users
      .getRawMany();

    // console.log('Staff stats with leads:', staffStats);

    // If no staff with leads found, get all non-admin users
    if (staffStats.length === 0) {
      console.log('No staff with leads found, getting all non-admin users...');
      staffStats = await userRepo
        .createQueryBuilder('user')
        .leftJoin('user.role', 'role')
        .select([
          'user.id as staffid',
          'user.first_name as firstname',
          'user.last_name as lastname',
          '0 as totalleads',
          '0 as convertedleads'
        ])
        .where('user.deleted = false')
        .andWhere('(role.role IS NULL OR role.role != :adminRole)')
        .setParameter('adminRole', 'admin')
        .limit(10) // Increased limit to get more users
        .getRawMany();
      
      // console.log('Non-admin users found:', staffStats);
    }

    // If still no results, get any users and filter in JavaScript
    if (staffStats.length === 0) {
      // console.log('No non-admin users found, getting any users and filtering...');
      
      // Get all users with their roles
      const allUsersWithRoles = await userRepo.find({
        where: { deleted: false },
        relations: ['role']
      });
      
      // Filter out admin users and convert to the expected format
      const nonAdminUsers = allUsersWithRoles
        .filter(user => !user.role || user.role.role !== 'admin')
        .slice(0, 10) // Increased limit to get more users
        .map(user => ({
          staffid: user.id,
          firstname: user.first_name || '',
          lastname: user.last_name || '',
          totalleads: '0',
          convertedleads: '0'
        }));
      
      // console.log('Total users found:', allUsersWithRoles.length);
      // console.log('Admin users filtered out:', allUsersWithRoles.filter(user => user.role && user.role.role === 'admin').length);
      // console.log('Non-admin users after filtering:', nonAdminUsers.length);
      
      staffStats = nonAdminUsers;
      console.log('Filtered non-admin users:', staffStats);
    }

    // If no users found at all, return empty array
    if (staffStats.length === 0) {
      // console.log('No users found in database');
      return [];
    }

    // Ensure we get all available users (up to 10)
    if (staffStats.length < 4) {
      // console.log(`Only ${staffStats.length} users found, trying to get more...`);
      
      // Get all non-admin users directly
      const allNonAdminUsers = await userRepo.find({
        where: { deleted: false },
        relations: ['role']
      });
      
      const additionalUsers = allNonAdminUsers
        .filter(user => !user.role || user.role.role !== 'admin')
        .filter(user => !staffStats.some(staff => staff.staffid === user.id))
        .slice(0, 10 - staffStats.length)
        .map(user => ({
          staffid: user.id,
          firstname: user.first_name || '',
          lastname: user.last_name || '',
          totalleads: '0',
          convertedleads: '0'
        }));
      
      staffStats = [...staffStats, ...additionalUsers];
      // console.log(`Added ${additionalUsers.length} additional users. Total: ${staffStats.length}`);
    }

    // Process the staff data
    const processedStaff = staffStats.map(staff => {
      // Handle both camelCase and lowercase field names from database
      const firstName = staff.firstName || staff.firstname || '';
      const lastName = staff.lastName || staff.lastname || '';
      const staffId = staff.staffId || staff.staffid || '';
      const totalLeads = parseInt(staff.totalLeads || staff.totalleads || '0');
      const convertedLeads = parseInt(staff.convertedLeads || staff.convertedleads || '0');
      
      const staffName = `${firstName} ${lastName}`.trim() || '-';
      
      // console.log('Processing staff:', { 
      //   staffId, 
      //   firstName, 
      //   lastName, 
      //   staffName, 
      //   totalLeads,
      //   convertedLeads
      // });
      
      return {
        staffId,
        staffName,
        conversionRate: totalLeads > 0 
          ? Math.round((convertedLeads / totalLeads) * 100)
          : 0
      };
    });

    // console.log('Final processed staff data:', processedStaff);
    return processedStaff;

  } catch (error) {
    console.error('Error in getStaffConversionPerformance:', error);
    return [];
  }
}

async function getSourceWiseConversionRates(
  dateFilter: any, 
  convertedStatusNames: string[] = ["completed", "business done"]
): Promise<SourceWiseConversionRate[]> {
  
  const convLower = convertedStatusNames.map((s) => s.toLowerCase());
  
  const sourceStats = await leadRepo
    .createQueryBuilder('lead')
    .leftJoin('lead.source', 'source')
    .leftJoin('lead.status', 'status')
    .select([
      'source.name as source',
      'COUNT(*)::int as totalLeads',
      'SUM(CASE WHEN LOWER(status.name) IN (:...convLower) THEN 1 ELSE 0 END)::int as convertedLeads'
    ])
    .where('lead.deleted = false')
    .andWhere('source.name IS NOT NULL')
    .andWhere('lead.created_at BETWEEN :from AND :to', {
      from: dateFilter.from,
      to: dateFilter.to,
    })
    .setParameter('convLower', convLower)
    .groupBy('source.name')
    .getRawMany();

 const data = sourceStats.map(source => ({
    source: source.source,
    conversionRate: source.totalleads > 0 
      ? Math.round((source.convertedleads / source.totalleads) * 100 * 10) / 10
      : 0
  }));

     return data;
}

async function getLeadFunnelStages(whereConditions: any): Promise<LeadFunnelStage[]> {
  const stageStats = await leadRepo
    .createQueryBuilder('lead')
    .leftJoin('lead.status', 'status')
    .select(['status.name as stage', 'COUNT(*) as count'])
    .where('lead.deleted = false')
    .andWhere('status.name IS NOT NULL')
    .groupBy('status.name')
    .orderBy('count', 'DESC')
    .getRawMany();

  return stageStats.map(stage => ({
    stage: stage.stage,
    count: parseInt(stage.count),
    isHighlighted: stage.stage === 'Not Interested' // Highlight as shown in image
  }));
}

async function getMonthlyLeadsChart(whereConditions: any): Promise<MonthlyLeadsData> {
  // First try to get real data from database
  const monthlyStats = await leadRepo
    .createQueryBuilder('lead')
    .select([
      'EXTRACT(MONTH FROM lead.created_at) as month',
      'COUNT(*) as leads'
    ])
    .where('lead.deleted = false')
    .groupBy('EXTRACT(MONTH FROM lead.created_at)')
    .orderBy('month', 'ASC')
    .getRawMany();

  // Generate labels for all months (Jan to Dec)
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  
  // Initialize leads array with zeros
  const leads = Array.from({ length: 12 }, () => 0);
  
  // Populate leads data
  monthlyStats.forEach(stat => {
    const monthIndex = parseInt(stat.month) - 1; // Convert to 0-based index
    if (monthIndex >= 0 && monthIndex < 12) {
      // Handle null values from database
      const leadCount = stat.leads ? parseInt(stat.leads) : 0;
      leads[monthIndex] = leadCount;
    }
  });

  // console.log('Monthly stats from database:', monthlyStats);
  // console.log('Processed leads array:', leads);

  return {
    labels: monthNames,
    leads
  };
}

async function getSummary(whereConditions: any): Promise<LeadReportsData['summary']> {
  const [totalLeads, convertedLeads, lostLeads, activeLeads] = await Promise.all([
    leadRepo.count({ where: whereConditions }),
    leadRepo.count({ 
      where: { ...whereConditions, status: { name: 'Completed' } },
      relations: ['status']
    }),
    leadRepo.count({ 
      where: { ...whereConditions, status: { name: 'no-interested' } },
      relations: ['status']
    }),
    leadRepo.count({ 
      where: { 
        ...whereConditions, 
        status: { name: Not(In(['Completed', 'no-interested'])) }
      },
      relations: ['status']
    })
  ]);

  const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

  return {
    totalLeads,
    convertedLeads,
    lostLeads,
    activeLeads,
    conversionRate: Math.round(conversionRate * 10) / 10
  };
}

export async function getBusinessAnalysisReport(params: BusinessAnalysisParams): Promise<BusinessAnalysisReport> {
  const { fromDate, toDate } = params;

  // Parse date range
  let dateFilter: { from?: Date; to?: Date } = {};
  if (fromDate && toDate) {
    dateFilter.from = new Date(fromDate);
    dateFilter.to = new Date(toDate);
    dateFilter.to.setHours(23, 59, 59, 999);
  } else if (fromDate) {
    dateFilter.from = new Date(fromDate);
    dateFilter.to = new Date();
  } else if (toDate) {
    dateFilter.from = new Date(0); // epoch
    dateFilter.to = new Date(toDate);
    dateFilter.to.setHours(23, 59, 59, 999);
  } else {
    // Default to last 30 days if no dates provided
    dateFilter.to = new Date();
    dateFilter.from = new Date();
    dateFilter.from.setDate(dateFilter.from.getDate() - 30);
  }

  // Build base query conditions
  let baseWhereConditions: any = { deleted: false };

  // Date filter
  if (dateFilter.from && dateFilter.to) {
    baseWhereConditions.created_at = Between(dateFilter.from, dateFilter.to);
  }

  // // 1. Lead Funnel Metrics
  // const leadFunnelMetrics = await getLeadFunnelMetrics(baseWhereConditions);

  // // 2. Project Delivery Metrics
  // const projectDeliveryMetrics = await getProjectDeliveryMetrics(dateFilter);

  // // 3. Financial Summary
  // const financialSummary = await getFinancialSummary(baseWhereConditions);

  // // 4. Team & Staff Performance
  // const teamStaffPerformance = await getTeamStaffPerformance(baseWhereConditions);

  // // 5. Monthly Trends
  // const monthlyTrends = await getMonthlyTrends(baseWhereConditions);

  // // 6. Summary
  // const summary = await getBusinessSummary(baseWhereConditions);

  const [
    leadFunnelMetrics,
    projectDeliveryMetrics,
    financialSummary,
    teamStaffPerformance,
    monthlyTrends,
    summary,
  ] = await Promise.all([
    getLeadFunnelMetrics(dateFilter),
    getProjectDeliveryMetrics(dateFilter),
    getFinancialSummary(baseWhereConditions),
    getTeamStaffPerformance(dateFilter),
    getMonthlyTrends(baseWhereConditions),
    getBusinessSummary(baseWhereConditions),
  ]);

  return {
    leadFunnelMetrics,
    projectDeliveryMetrics,
    financialSummary,
    teamStaffPerformance,
    monthlyTrends,
    summary
  };
}

export async function exportBusinessAnalysisReportToExcel(params: any): Promise<{ workbook: ExcelJS.Workbook; name: string }> {
  const report = await getBusinessAnalysisReport(params);
  const workbook = new ExcelJS.Workbook();

  // 1. Lead Funnel Metrics
  const funnelSheet = workbook.addWorksheet('LeadFunnelMetrics');
  funnelSheet.columns = [
    { header: 'Metric', key: 'metric', width: 30 },
    { header: 'Value', key: 'value', width: 20 },
  ];
  Object.entries(report.leadFunnelMetrics).forEach(([metric, value]) => {
    funnelSheet.addRow({ metric, value });
  });

  // 2. Project Delivery Metrics
  const projectSheet = workbook.addWorksheet('ProjectDeliveryMetrics');
  projectSheet.columns = [
    { header: 'Metric', key: 'metric', width: 30 },
    { header: 'Value', key: 'value', width: 20 },
  ];
  Object.entries(report.projectDeliveryMetrics).forEach(([metric, value]) => {
    projectSheet.addRow({ metric, value });
  });

  // 3. Financial Summary
  const financialSheet = workbook.addWorksheet('FinancialSummary');
  financialSheet.columns = [
    { header: 'Metric', key: 'metric', width: 30 },
    { header: 'Value', key: 'value', width: 20 },
  ];
  Object.entries(report.financialSummary).forEach(([metric, value]) => {
    financialSheet.addRow({ metric, value });
  });

  // 4. Team & Staff Performance
  const teamSheet = workbook.addWorksheet('TeamStaffPerformance');
  teamSheet.columns = [
    { header: 'Metric', key: 'metric', width: 30 },
    { header: 'Value', key: 'value', width: 20 },
  ];
  Object.entries(report.teamStaffPerformance).forEach(([metric, value]) => {
    teamSheet.addRow({ metric, value });
  });

  // 5. Monthly Trends
  const trendsSheet = workbook.addWorksheet('MonthlyTrends');
  trendsSheet.columns = [
    { header: 'Month', key: 'month', width: 12 },
    { header: 'Projects Started', key: 'started', width: 18 },
    { header: 'Projects Completed', key: 'completed', width: 18 },
    { header: 'New Leads', key: 'newLeads', width: 12 },
    { header: 'Revenue', key: 'revenue', width: 15 },
  ];
  report.monthlyTrends.labels.forEach((month, i) => {
    trendsSheet.addRow({
      month,
      started: report.monthlyTrends.started[i],
      completed: report.monthlyTrends.completed[i],
      newLeads: report.monthlyTrends.newLeads[i],
      revenue: report.monthlyTrends.revenue[i],
    });
  });

  // 6. Summary
  const summarySheet = workbook.addWorksheet('Summary');
  summarySheet.columns = [
    { header: 'Metric', key: 'metric', width: 25 },
    { header: 'Value', key: 'value', width: 15 },
  ];
  Object.entries(report.summary).forEach(([metric, value]) => {
    summarySheet.addRow({ metric, value });
  });

  const name = `business_analysis_${Date.now()}`;
  return { workbook, name };
}

async function getLeadFunnelMetrics(
  dateFilter: any,
  baseWhereConditions: any = { deleted: false },
  convertedStatusNames: string[] = ["completed", "business done"]
): Promise<LeadFunnelMetrics> {
  // ensure both are present (your caller already guarantees this)
  const rangeWhere = (dateFilter.from && dateFilter.to)
    ? { created_at: Between(dateFilter.from, dateFilter.to) }
    : {};

  const baseWhere = { ...baseWhereConditions, ...rangeWhere };

  // counts
  const [totalLeads, qualifiedLeads, convertedLeads] = await Promise.all([
    // total
    leadRepo.count({ where: baseWhere }),

    // qualified (case-insensitive)
    leadRepo.count({
      where: { ...baseWhere, status: { name: ILike("qualified") } },
      relations: ["status"],
    }),

    // converted (case-insensitive, any of the provided names)
    // use OR array with ILike to avoid query builder here
    leadRepo.count({
      where: convertedStatusNames.map((s) => ({
        ...baseWhere,
        status: { name: ILike(s) },
      })),
      relations: ["status"],
    }),
  ]);

  // best lead source (also range-filtered)
  const convLower = convertedStatusNames.map((s) => s.toLowerCase());

  const sourceQb = leadRepo
    .createQueryBuilder("lead")
    .leftJoin("lead.source", "source")
    .leftJoin("lead.status", "status")
    .select([
      "source.name as source",
      "COUNT(*)::int as total",
      // count as converted when status is in converted list (case-insensitive)
      "SUM(CASE WHEN LOWER(status.name) IN (:...convLower) THEN 1 ELSE 0 END)::int as converted",
    ])
    .where("lead.deleted = :deleted", { deleted: baseWhere.deleted ?? false })
    .andWhere("source.name IS NOT NULL")
    .andWhere("lead.created_at BETWEEN :from AND :to", {
      from: dateFilter.from,
      to: dateFilter.to,
    })
    .setParameter("convLower", convLower)
    .groupBy("source.name");

  const sourceStats: Array<{ source: string; total: number; converted: number }> =
    await sourceQb.getRawMany();

  const bestLeadSource =
    sourceStats.length > 0
      ? sourceStats.reduce((top, current) => {
          const cRate =
            current.total > 0 ? (current.converted / current.total) * 100 : 0;
          const tRate =
            top.total > 0 ? (top.converted / top.total) * 100 : 0;
          return cRate > tRate ? current : top;
        }).source
      : "-";

  // metrics
  const conversionRate =
    totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;
    
     // average lead age (in days)
  const ageQb = leadRepo
    .createQueryBuilder("lead")
    .select(
      `AVG(EXTRACT(EPOCH FROM (NOW() - lead.created_at)) / 86400)`,
      "avgAge"
    )
    .where("lead.deleted = :deleted", { deleted: baseWhere.deleted ?? false })
    .andWhere("lead.created_at BETWEEN :from AND :to", {
      from: dateFilter.from,
      to: dateFilter.to,
    });

  const ageResult = await ageQb.getRawOne<{ avgAge: string | null }>();
  const avgLeadAge = ageResult?.avgAge
    ? Math.round(parseFloat(ageResult.avgAge))
    : 0;

// Calculate average time to convert (in days) for converted leads
const avgTimeToConvertQuery = leadRepo
  .createQueryBuilder("lead")
  .innerJoin("lead.status_histories", "history")
  .innerJoin("history.status", "status")
  .select("AVG(EXTRACT(EPOCH FROM (history.created_at - lead.created_at)) / 86400)", "avgDays")
  .where("lead.deleted = :deleted", { deleted: baseWhere.deleted ?? false })
  .andWhere("lead.created_at BETWEEN :from AND :to", {
    from: dateFilter.from,
    to: dateFilter.to,
  })
  .andWhere("LOWER(status.name) IN (:...convertedStatusNames)", {
    convertedStatusNames: convertedStatusNames.map(s => s.toLowerCase())
  });

const avgTimeResult = await avgTimeToConvertQuery.getRawOne<{ avgDays: string | null }>();
console.log("Time to convert query result:", avgTimeResult);

// If no converted leads found, try a different approach
let avgTimeToConvert = 0;
if (!avgTimeResult?.avgDays) {
  const altTimeQuery = leadRepo
    .createQueryBuilder("lead")
    .innerJoin("lead.status", "status")
    .select("AVG(EXTRACT(EPOCH FROM (NOW() - lead.created_at)) / 86400)", "avgDays")
    .where("lead.deleted = :deleted", { deleted: baseWhere.deleted ?? false })
    .andWhere("lead.created_at BETWEEN :from AND :to", {
      from: dateFilter.from,
      to: dateFilter.to,
    })
    .andWhere("LOWER(status.name) IN (:...convertedStatusNames)", {
      convertedStatusNames: convertedStatusNames.map(s => s.toLowerCase())
    });
  
  const altTimeResult = await altTimeQuery.getRawOne<{ avgDays: string | null }>();
  console.log("Alternative time query result:", altTimeResult);
  avgTimeToConvert = altTimeResult?.avgDays ? Math.round(parseFloat(altTimeResult.avgDays)) : 0;
} else {
  avgTimeToConvert = Math.round(parseFloat(avgTimeResult.avgDays));
}

// Calculate average followups per lead - more efficient query

// Calculate average time between followups (in days)
const avgFollowupTimeQuery = leadRepo
  .createQueryBuilder("lead")
  .innerJoin("lead.followups", "followup")
  .select("lead.id", "leadId")
  .addSelect("COUNT(followup.id)", "followupCount")
  .addSelect("MIN(EXTRACT(EPOCH FROM (followup.due_date - lead.created_at)) / 86400)", "firstFollowupTime")
  .addSelect("MAX(EXTRACT(EPOCH FROM (followup.due_date - lead.created_at)) / 86400)", "lastFollowupTime")
  .where("lead.deleted = :deleted", { deleted: baseWhere.deleted ?? false })
  .andWhere("lead.created_at BETWEEN :from AND :to", {
    from: dateFilter.from,
    to: dateFilter.to,
  })
  .andWhere("followup.due_date IS NOT NULL")
  .groupBy("lead.id")
  .having("COUNT(followup.id) > 0");

const followupTimeResults = await avgFollowupTimeQuery.getRawMany();

let totalFollowupTime = 0;
let totalFollowupIntervals = 0;

followupTimeResults.forEach(result => {
  const followupCount = parseInt(result.followupCount);
  const firstFollowupTime = parseFloat(result.firstFollowupTime);
  const lastFollowupTime = parseFloat(result.lastFollowupTime);
  
  if (followupCount > 1) {
    // Calculate average time between followups for this lead
    const avgTimeForLead = (lastFollowupTime - firstFollowupTime) / (followupCount - 1);
    totalFollowupTime += avgTimeForLead;
    totalFollowupIntervals += 1;
  } else if (followupCount === 1) {
    // For single followup, use the time from lead creation to followup
    totalFollowupTime += firstFollowupTime;
    totalFollowupIntervals += 1;
  }
});

const avgFollowupTime = totalFollowupIntervals > 0 
  ? Math.round(totalFollowupTime / totalFollowupIntervals) 
  : 0;

  // Calculate average response time (time to first followup) in days
const avgResponseTimeQuery = leadRepo
  .createQueryBuilder("lead")
  .innerJoin("lead.followups", "followup")
  .select("AVG(EXTRACT(EPOCH FROM (followup.due_date - lead.created_at)) / 86400)", "avgResponseTime")
  .where("lead.deleted = :deleted", { deleted: baseWhere.deleted ?? false })
  .andWhere("lead.created_at BETWEEN :from AND :to", {
    from: dateFilter.from,
    to: dateFilter.to,
  })
  .andWhere("followup.due_date IS NOT NULL");

const avgResponseTimeResult = await avgResponseTimeQuery.getRawOne<{ avgResponseTime: string | null }>();
const avgResponseTime = avgResponseTimeResult?.avgResponseTime 
  ? (Number((Number(parseFloat(avgResponseTimeResult.avgResponseTime)) * 24).toFixed(2))) 
  : 0;

  // Count pending followups (followups with status not COMPLETED)
const pendingFollowupsQuery = leadRepo
  .createQueryBuilder("lead")
  .innerJoin("lead.followups", "followup")
  .select("COUNT(followup.id)", "pendingCount")
  .where("lead.deleted = :deleted", { deleted: baseWhere.deleted ?? false })
  .andWhere("lead.created_at BETWEEN :from AND :to", {
    from: dateFilter.from,
    to: dateFilter.to,
  })
  .andWhere("followup.status != :completedStatus", { 
    completedStatus: FollowupStatus.COMPLETED 
  });

const pendingFollowupsResult = await pendingFollowupsQuery.getRawOne<{ pendingCount: string }>();
const pendingFollowupsCount = parseInt(pendingFollowupsResult?.pendingCount || "0");

// Count hot leads based on recent followup activity
// Count hot leads based on high possibility of conversion
const hotLeadsQuery = leadRepo
  .createQueryBuilder("lead")
  .leftJoin("lead.status", "status")
  .select("COUNT(lead.id)", "hotLeadsCount")
  .where("lead.deleted = :deleted", { deleted: baseWhere.deleted ?? false })
  .andWhere("lead.created_at BETWEEN :from AND :to", {
    from: dateFilter.from,
    to: dateFilter.to,
  })
  .andWhere("lead.possibility_of_conversion >= :minPossibility", { 
    minPossibility: 70 // 70% or higher possibility
  })
  .andWhere("LOWER(status.name) NOT IN (:...convertedStatusNames)", {
    convertedStatusNames: convertedStatusNames.map(s => s.toLowerCase())
  });

const hotLeadsResult = await hotLeadsQuery.getRawOne<{ hotLeadsCount: string }>();
const hotLeadsCount = parseInt(hotLeadsResult?.hotLeadsCount || "0");

// Calculate drop-off stage (stage with highest lead loss)
  const dropOffStageQuery = leadRepo
    .createQueryBuilder("lead")
    .leftJoin("lead.status_histories", "history")
    .leftJoin("history.status", "status")
    .select([
      "status.name as stage_name",
      "COUNT(DISTINCT lead.id) as dropped_leads"
    ])
    .where("lead.deleted = :deleted", { deleted: baseWhere.deleted ?? false })
    .andWhere("lead.created_at BETWEEN :from AND :to", {
      from: dateFilter.from,
      to: dateFilter.to,
    })
    .andWhere("status.name IS NOT NULL")
    .andWhere("LOWER(status.name) NOT IN (:...convertedStatusNames)", {
      convertedStatusNames: convertedStatusNames.map(s => s.toLowerCase())
    })
    .groupBy("status.name")
    .orderBy("dropped_leads", "DESC")
    .limit(1);

  const dropOffStageResult = await dropOffStageQuery.getRawOne<{ 
    stage_name: string; 
    dropped_leads: string 
  }>();

  const dropOfStage = dropOffStageResult?.stage_name || "No data";

  return {
    totalLeads,
    qualifiedLeads,
    convertedLeads,
    dropOfStage,
    conversionRate: Math.round(conversionRate * 10) / 10,
    avgTimeToConvert: avgTimeToConvert,
    avgFollowups: avgFollowupTime,
    bestLeadSource,
    avgLeadAge,
    averageResponseTime: avgResponseTime,
    pendingFollowups: pendingFollowupsCount,
    hotLeadsCount,
  };
}

async function getProjectDeliveryMetrics(
  dateFilter: any
): Promise<ProjectDeliveryMetrics> {
  // Total & completed
  const [totalProjects, completedProjects] = await Promise.all([
    projectRepo.count({
      where: {
        deleted: false,
        ...(dateFilter.from && dateFilter.to
          ? { created_at: Between(dateFilter.from, dateFilter.to) }
          : {}),
      },
    }),
    projectRepo.count({
      where: {
        deleted: false,
        status: ProjectStatus.COMPLETED,
        ...(dateFilter.from && dateFilter.to
          ? { created_at: Between(dateFilter.from, dateFilter.to) }
          : {}),
      },
    }),
  ]);

  // Avg duration
  const qb = projectRepo
    .createQueryBuilder("project")
    .select(
      `AVG(EXTRACT(EPOCH FROM (project.actual_end_date - project.actual_start_date))/86400)`,
      "avgDuration"
    )
    .where("project.deleted = :deleted", { deleted: false })
    .andWhere("project.status = :status", { status: ProjectStatus.COMPLETED })
    .andWhere("project.actual_end_date IS NOT NULL")
    .andWhere("project.actual_start_date IS NOT NULL");

  if (dateFilter.from && dateFilter.to) {
    qb.andWhere("project.created_at BETWEEN :from AND :to", {
      from: dateFilter.from,
      to: dateFilter.to,
    });
  }

  const projectDurations = await qb.getRawOne<{ avgDuration: string | null }>();
  const avgProjectDuration = projectDurations?.avgDuration
    ? Math.round(parseFloat(projectDurations.avgDuration))
    : 0;

  // Budget overruns
  const budgetQb = projectRepo
    .createQueryBuilder("project")
    .where("project.deleted = :deleted", { deleted: false })
    .andWhere("project.budget IS NOT NULL")
    .andWhere("project.actual_cost > project.budget");

  if (dateFilter.from && dateFilter.to) {
    budgetQb.andWhere("project.created_at BETWEEN :from AND :to", {
      from: dateFilter.from,
      to: dateFilter.to,
    });
  }

  const budgetOverrunProjects = await budgetQb.getCount();

  // On-time delivery
  const onTimeQb = projectRepo
    .createQueryBuilder("project")
    .where("project.deleted = :deleted", { deleted: false })
    .andWhere("project.status = :status", { status: ProjectStatus.COMPLETED })
    .andWhere("project.actual_end_date IS NOT NULL")
    .andWhere("project.end_date IS NOT NULL")
    .andWhere("project.actual_end_date <= project.end_date");

  if (dateFilter.from && dateFilter.to) {
    onTimeQb.andWhere("project.created_at BETWEEN :from AND :to", {
      from: dateFilter.from,
      to: dateFilter.to,
    });
  }

  const [onTimeProjects, completedProjectsCount] = await Promise.all([
    onTimeQb.getCount(),
    projectRepo.count({
      where: {
        deleted: false,
        status: ProjectStatus.COMPLETED,
        ...(dateFilter.from && dateFilter.to
          ? { created_at: Between(dateFilter.from, dateFilter.to) }
          : {}),
      },
    }),
  ]);

  const onTimeDeliveryRate =
    completedProjectsCount > 0
      ? Math.round((onTimeProjects / completedProjectsCount) * 100)
      : 0;

  // Profitability
  const profitabilityQb = projectRepo
    .createQueryBuilder("project")
    .select(
      "AVG( ((project.budget - project.actual_cost) / NULLIF(project.budget,0)) * 100 )",
      "avgProfitability"
    )
    .where("project.deleted = :deleted", { deleted: false })
    .andWhere("project.budget IS NOT NULL")
    .andWhere("project.actual_cost IS NOT NULL");

  if (dateFilter.from && dateFilter.to) {
    profitabilityQb.andWhere("project.created_at BETWEEN :from AND :to", {
      from: dateFilter.from,
      to: dateFilter.to,
    });
  }

  const profitabilityResult =
    await profitabilityQb.getRawOne<{ avgProfitability: string | null }>();
  const avgProjectProfitability = profitabilityResult?.avgProfitability
    ? Math.round(parseFloat(profitabilityResult.avgProfitability))
    : 0;

  // Resource utilization
  const resourceQb = projectRepo
    .createQueryBuilder("project")
    .leftJoin("project.milestones", "milestone")
    .leftJoin("milestone.tasks", "task")
    .where("project.deleted = :deleted", { deleted: false })
    .andWhere("task.id IS NOT NULL");

  if (dateFilter.from && dateFilter.to) {
    resourceQb.andWhere("project.created_at BETWEEN :from AND :to", {
      from: dateFilter.from,
      to: dateFilter.to,
    });
  }

  const [projectsWithTasks, totalProjectsCount] = await Promise.all([
    resourceQb.getCount(),
    projectRepo.count({
      where: {
        deleted: false,
        ...(dateFilter.from && dateFilter.to
          ? { created_at: Between(dateFilter.from, dateFilter.to) }
          : {}),
      },
    }),
  ]);

  const resourceUtilization =
    totalProjectsCount > 0
      ? Math.round((projectsWithTasks / totalProjectsCount) * 100)
      : 0;

  // Client satisfaction (placeholder)
  const clientSatisfactionIndex = 4.3;

  return {
    totalProjects,
    completedProjects,
    avgProjectDuration,
    budgetOverrunProjects,
    onTimeDeliveryRate,
    avgProjectProfitability,
    resourceUtilization,
    clientSatisfactionIndex,
  };
}

async function getFinancialSummary(whereConditions: any): Promise<FinancialSummary> {
  const eilogRepo = AppDataSource.getRepository(EILog);
  const projectRepo = AppDataSource.getRepository(Project);
  
  // Build date filter for queries
  let dateFilter: any = {};
  if (whereConditions.fromDate && whereConditions.toDate) {
    dateFilter.created_at = Between(new Date(whereConditions.fromDate), new Date(whereConditions.toDate));
  } else if (whereConditions.fromDate) {
    dateFilter.created_at = MoreThanOrEqual(new Date(whereConditions.fromDate));
  } else if (whereConditions.toDate) {
    dateFilter.created_at = LessThanOrEqual(new Date(whereConditions.toDate));
  }

  // Get all EILog entries with date filter
  const eilogs = await eilogRepo.find({
    where: dateFilter,
    relations: ['eilogType', 'eilogHead', 'createdBy']
  });

  // Get project financial data with date filter
  let projectDateFilter: any = {};
  if (whereConditions.fromDate && whereConditions.toDate) {
    projectDateFilter.created_at = Between(new Date(whereConditions.fromDate), new Date(whereConditions.toDate));
  } else if (whereConditions.fromDate) {
    projectDateFilter.created_at = MoreThanOrEqual(new Date(whereConditions.fromDate));
  } else if (whereConditions.toDate) {
    projectDateFilter.created_at = LessThanOrEqual(new Date(whereConditions.toDate));
  }

  const projects = await projectRepo.find({
    where: projectDateFilter,
    relations: ['client']
  });

  // Calculate total income and expenses from EILog
  let totalIncome = 0;
  let totalExpense = 0;
  
  // Track amounts by payment mode for income
  const incomeByPaymentMode: { [key: string]: number } = {
    'Bank Transfer': 0,
    'UPI': 0,
    'Cash': 0,
    'Online': 0,
    'Cheque': 0,
    'Others': 0
  };
  
  // Track amounts by payment mode for expenses
  const expenseByPaymentMode: { [key: string]: number } = {
    'Bank Transfer': 0,
    'UPI': 0,
    'Cash': 0,
    'Online': 0,
    'Cheque': 0,
    'Others': 0
  };

  // Process each EILog entry
  eilogs.forEach(eilog => {
    const income = parseFloat(eilog.income || '0');
    const expense = parseFloat(eilog.expense || '0');
    const paymentMode = eilog.paymentMode || 'Others';
    
    if (income > 0) {
      totalIncome += income;
      incomeByPaymentMode[paymentMode] = (incomeByPaymentMode[paymentMode] || 0) + income;
    }
    
    if (expense > 0) {
      totalExpense += expense;
      expenseByPaymentMode[paymentMode] = (expenseByPaymentMode[paymentMode] || 0) + expense;
    }
  });

  // Add project-based income (budget as potential income)
  let projectIncome = 0;
  projects.forEach(project => {
    if (project.budget) {
      projectIncome += parseFloat(project.budget.toString());
    }
  });

  // Add project-based expenses (actual costs)
  let projectExpenses = 0;
  projects.forEach(project => {
    if (project.actual_cost) {
      projectExpenses += parseFloat(project.actual_cost.toString());
    }
  });

  // Combine EILog and project financial data
  const combinedIncome = totalIncome + projectIncome;
  const combinedExpenses = totalExpense + projectExpenses;

  return {
    totalIncome: combinedIncome,
    amountReceivedInBank: incomeByPaymentMode['Bank Transfer'] || 0,
    amountReceivedInUPI: incomeByPaymentMode['UPI'] || 0,
    amountReceivedInCash: incomeByPaymentMode['Cash'] || 0,
    amountReceivedInOnline: incomeByPaymentMode['Online'] || 0,
    amountSpentInBank: expenseByPaymentMode['Bank Transfer'] || 0,
    amountSpentInUPI: expenseByPaymentMode['UPI'] || 0,
    amountSpentInCash: expenseByPaymentMode['Cash'] || 0,
    amountSpentInOnline: expenseByPaymentMode['Online'] || 0
  };
}

async function getTeamStaffPerformance(
  dateFilter: any,
  baseWhereConditions: any = { deleted: false }
): Promise<TeamStaffPerformance> {
  // Apply date filter to task-related queries
  const rangeWhere = (dateFilter.from && dateFilter.to)
    ? { created_at: Between(dateFilter.from, dateFilter.to) }
    : {};

  const baseWhere = { ...baseWhereConditions, ...rangeWhere };

  // Get active staff count (no date filter needed for staff count)
  const activeStaffMembers = await userRepo.count({
    where: { 
      deleted: false,
      role: { role: Not(ILike('admin')) }
    },
    relations: ['role']
  });

  // Get top performer with date filter for tasks
  const topPerformer = await userRepo
  .createQueryBuilder('user')
  .leftJoin(
    'user.assignedTasks',
    'task',
    'task.created_at BETWEEN :from AND :to', // Date filter in JOIN
    { from: dateFilter.from, to: dateFilter.to }
  )
  .leftJoin('user.role', 'role')
  .select([
    'user.first_name as firstName',
    'user.last_name as lastName',
    'COUNT(CASE WHEN task.status = :completedStatus THEN 1 END) as completedTasks',
    'COUNT(task.id) as totalTasks'
  ])
  .where('user.deleted = false AND role.role != :adminRole', { adminRole: 'admin' })
  .setParameter('completedStatus', 'Completed')
  .groupBy('user.id, user.first_name, user.last_name')
  .orderBy('completedTasks', 'DESC')
  .limit(1)
  .getRawOne();

  const topPerformerName = topPerformer 
    ? `${topPerformer.firstname || ''} ${topPerformer.lastname || ''}`.trim()
    : 'No Staff Available';

  // Calculate task completion rate and delayed tasks with date filter
const [completedTasks, totalTasks, delayedTasksCount] = await Promise.all([
    taskRepo.count({ 
        where: { 
            deleted: false, 
            status: 'Completed',
            ...(dateFilter.from && dateFilter.to && { 
                created_at: Between(dateFilter.from, dateFilter.to) 
            })
        } 
    }),
    taskRepo.count({ 
        where: { 
            deleted: false,
            ...(dateFilter.from && dateFilter.to && { 
                created_at: Between(dateFilter.from, dateFilter.to) 
            })
        } 
    }),
    taskRepo.count({ 
        where: { 
            deleted: false,
            status: Not('Completed'), // Not completed
            due_date: LessThan(new Date()), // Past due date
            ...(dateFilter.from && dateFilter.to && { 
                created_at: Between(dateFilter.from, dateFilter.to) 
            })
        } 
    })
]);

  const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  
  // Get staff followup statistics 
const followupStats = await Promise.all([
    // Lead followups by staff
    leadFollowupRepo
        .createQueryBuilder("followup")
        .select("followup.user_id", "staffId")
        .addSelect("COUNT(followup.id)", "followupCount")
        .where("followup.user_id IS NOT NULL")
        .andWhere(
            dateFilter.from && dateFilter.to 
                ? "followup.created_at BETWEEN :start AND :end" 
                : "1=1",
            { start: dateFilter.from, end: dateFilter.to }
        )
        .groupBy("followup.user_id")
        .getRawMany(),
    
    // Client followups by staff
    clientFollowupRepo
        .createQueryBuilder("followup")
        .select("followup.user_id", "staffId")
        .addSelect("COUNT(followup.id)", "followupCount")
        .where("followup.user_id IS NOT NULL")
        .andWhere(
            dateFilter.from && dateFilter.to 
                ? "followup.created_at BETWEEN :start AND :end" 
                : "1=1",
            { start: dateFilter.from, end: dateFilter.to }
        )
        .groupBy("followup.user_id")
        .getRawMany()
]);

const [leadStats, clientStats] = followupStats;

// Combine and calculate totals
const staffFollowupMap = new Map();

// Process lead followups
leadStats.forEach(stat => {
    const staffId = stat.staffId;
    const count = parseInt(stat.followupCount);
    staffFollowupMap.set(staffId, (staffFollowupMap.get(staffId) || 0) + count);
});

// Process client followups
clientStats.forEach(stat => {
    const staffId = stat.staffId;
    const count = parseInt(stat.followupCount);
    staffFollowupMap.set(staffId, (staffFollowupMap.get(staffId) || 0) + count);
});

// Calculate average
const totalStaff = staffFollowupMap.size;
const totalFollowups = Array.from(staffFollowupMap.values()).reduce((sum, count) => sum + count, 0);
const avgFollowupsPerStaff = totalStaff > 0 ? totalFollowups / totalStaff : 0;

//not using for now we are just returning total document uploaded in date range.
// // Get average documents per staff in a single query
// const documentStats = await AppDataSource.query(`
//     SELECT 
//         COUNT(*) as total_documents,
//         COUNT(DISTINCT uploaded_by) as total_staff,
//         CASE 
//             WHEN COUNT(DISTINCT uploaded_by) > 0 
//             THEN COUNT(*)::float / COUNT(DISTINCT uploaded_by) 
//             ELSE 0 
//         END as avg_documents_per_staff
//     FROM (
//         SELECT uploaded_by, created_at 
//         FROM lead_attachments 
//         WHERE uploaded_by IS NOT NULL
//         ${dateFilter.from && dateFilter.to ? `AND created_at BETWEEN $1 AND $2` : ''}
        
//         UNION ALL
        
//         SELECT uploaded_by, created_at 
//         FROM project_attachments 
//         WHERE uploaded_by IS NOT NULL
//         ${dateFilter.from && dateFilter.to ? `AND created_at BETWEEN $1 AND $2` : ''}
//     ) AS all_documents
// `, dateFilter.from && dateFilter.to ? [dateFilter.from, dateFilter.to] : []);

// const { total_documents, total_staff, avg_documents_per_staff } = documentStats[0];

const documentContributions = await AppDataSource.query(`
    SELECT (
        (SELECT COUNT(*) FROM lead_attachments 
         WHERE deleted = false 
         AND ${dateFilter.from && dateFilter.to ? 'created_at BETWEEN $1 AND $2' : '1=1'})
        +
        (SELECT COUNT(*) FROM project_attachments 
         WHERE deleted = false 
         AND ${dateFilter.from && dateFilter.to ? 'created_at BETWEEN $1 AND $2' : '1=1'})
    ) as total_documents
`, dateFilter.from && dateFilter.to ? [dateFilter.from, dateFilter.to] : [])
.then(result => parseInt(result[0].total_documents) || 0);

  return {
    activeStaffMembers,
    topPerformer: topPerformerName,
    taskCompletionRate: Math.round(taskCompletionRate),
    delayedTasks: Number(delayedTasksCount) ?? 0,
    avgFollowupsPerStaff: avgFollowupsPerStaff,
    documentContributions: documentContributions
  };
}

async function getMonthlyTrends(whereConditions: any): Promise<MonthlyTrendData> {
  const eilogRepo = AppDataSource.getRepository(EILog);
  
  // Get project trends for the whole year (Jan-Dec)
  const projectTrends = await projectRepo
    .createQueryBuilder('project')
    .select([
      'EXTRACT(MONTH FROM project.created_at) as month',
      'COUNT(*) as started',
      'COUNT(CASE WHEN project.status = :completedStatus THEN 1 END) as completed'
    ])
    .where('project.deleted = false')
    .setParameter('completedStatus', ProjectStatus.COMPLETED)
    .groupBy('EXTRACT(MONTH FROM project.created_at)')
    .orderBy('month', 'ASC')
    .getRawMany();

  // Debug: Check total projects count
  const totalProjectsCount = await projectRepo.count({ where: { deleted: false } });

  // Get lead trends for the whole year (Jan-Dec)
  const leadTrends = await leadRepo
    .createQueryBuilder('lead')
    .select([
      'EXTRACT(MONTH FROM lead.created_at) as month',
      'COUNT(*) as newLeads'
    ])
    .where('lead.deleted = false')
    .groupBy('EXTRACT(MONTH FROM lead.created_at)')
    .orderBy('month', 'ASC')
    .getRawMany();

  // Debug: Check total leads count
  const totalLeadsCount = await leadRepo.count({ where: { deleted: false } });

  // Get revenue trends from EILog for the whole year (Jan-Dec)
  const revenueTrends = await eilogRepo
    .createQueryBuilder('eilog')
    .select([
      'EXTRACT(MONTH FROM eilog.created_at) as month',
      'SUM(CAST(eilog.income AS DECIMAL)) as totalIncome',
      'SUM(CAST(eilog.expense AS DECIMAL)) as totalExpense'
    ])
    .where('eilog.income IS NOT NULL OR eilog.expense IS NOT NULL')
    .groupBy('EXTRACT(MONTH FROM eilog.created_at)')
    .orderBy('month', 'ASC')
    .getRawMany();

  // Get project revenue trends (budget as potential revenue)
  const projectRevenueTrends = await projectRepo
    .createQueryBuilder('project')
    .select([
      'EXTRACT(MONTH FROM project.created_at) as month',
      'SUM(CAST(project.budget AS DECIMAL)) as totalBudget',
      'SUM(CAST(project.actual_cost AS DECIMAL)) as totalActualCost'
    ])
    .where('project.budget IS NOT NULL OR project.actual_cost IS NOT NULL')
    .groupBy('EXTRACT(MONTH FROM project.created_at)')
    .orderBy('month', 'ASC')
    .getRawMany();

  // Generate labels for all 12 months
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const labels = monthNames;

  // Initialize arrays for all 12 months
  const started = Array.from({ length: 12 }, () => 0);
  const completed = Array.from({ length: 12 }, () => 0);
  const newLeads = Array.from({ length: 12 }, () => 0);
  const revenue = Array.from({ length: 12 }, () => 0);

  // Populate project data
  projectTrends.forEach(trend => {
    const monthIndex = parseInt(trend.month) - 1; // 0-based index for Jan-Dec
    if (monthIndex >= 0 && monthIndex < 12) {
      // Handle null values from database and case sensitivity
      started[monthIndex] = (trend.started || trend.started) ? parseInt(trend.started || trend.started) : 0;
      completed[monthIndex] = (trend.completed || trend.completed) ? parseInt(trend.completed || trend.completed) : 0;
      // console.log(`Setting project month ${trend.month} (index ${monthIndex}): started=${started[monthIndex]}, completed=${completed[monthIndex]}`);
    }
  });

  // Populate lead data
  leadTrends.forEach(trend => {
    const monthIndex = parseInt(trend.month) - 1; // 0-based index for Jan-Dec
    if (monthIndex >= 0 && monthIndex < 12) {
      // Handle null values from database and case sensitivity
      const leadCount = trend.newLeads || trend.newleads ? parseInt(trend.newLeads || trend.newleads) : 0;
      newLeads[monthIndex] = leadCount;
      // console.log(`Setting month ${trend.month} (index ${monthIndex}) to ${leadCount} leads`);
    }
  });

  // console.log('Project trends from database:', projectTrends);
  // console.log('Lead trends from database:', leadTrends);
  // console.log('Processed newLeads array:', newLeads);

  // Populate revenue data from EILog
  revenueTrends.forEach(trend => {
    const monthIndex = parseInt(trend.month) - 1; // 0-based index for Jan-Dec
    if (monthIndex >= 0 && monthIndex < 12) {
      // Handle null values from database and case sensitivity
      const income = (trend.totalIncome || trend.totalincome) ? parseFloat(trend.totalIncome || trend.totalincome) : 0;
      const expense = (trend.totalExpense || trend.totalexpense) ? parseFloat(trend.totalExpense || trend.totalexpense) : 0;
      const netRevenue = income - expense; // Net revenue (income - expenses)
      revenue[monthIndex] += netRevenue;
      
      // console.log(`Month ${trend.month}: income=${income}, expense=${expense}, net=${netRevenue}`);
    }
  });

  // Add project revenue data
  projectRevenueTrends.forEach(trend => {
    const monthIndex = parseInt(trend.month) - 1; // 0-based index for Jan-Dec
    if (monthIndex >= 0 && monthIndex < 12) {
      // Handle null values from database and case sensitivity
      const budget = (trend.totalBudget || trend.totalbudget) ? parseFloat(trend.totalBudget || trend.totalbudget) : 0;
      const actualCost = (trend.totalActualCost || trend.totalactualcost) ? parseFloat(trend.totalActualCost || trend.totalactualcost) : 0;
      const projectNetRevenue = budget - actualCost;
      // Add budget as potential revenue and subtract actual costs
      revenue[monthIndex] += projectNetRevenue;
      
      // console.log(`Project Month ${trend.month}: budget=${budget}, actualCost=${actualCost}, net=${projectNetRevenue}`);
    }
  });

  // console.log('Revenue trends from database:', revenueTrends);
  // console.log('Project revenue trends from database:', projectRevenueTrends);
  // console.log('Final processed arrays:', { started, completed, newLeads, revenue });

  return {
    labels,
    started,
    completed,
    newLeads,
    revenue
  };
}

async function getBusinessSummary(whereConditions: any): Promise<BusinessAnalysisReport['summary']> {
  const eilogRepo = AppDataSource.getRepository(EILog);
  
  // Build date filter for queries
  let dateFilter: any = {};
  if (whereConditions.fromDate && whereConditions.toDate) {
    dateFilter.created_at = Between(new Date(whereConditions.fromDate), new Date(whereConditions.toDate));
  } else if (whereConditions.fromDate) {
    dateFilter.created_at = MoreThanOrEqual(new Date(whereConditions.fromDate));
  } else if (whereConditions.toDate) {
    dateFilter.created_at = LessThanOrEqual(new Date(whereConditions.toDate));
  }

  // Get EILog financial data
  const eilogs = await eilogRepo.find({
    where: dateFilter,
    relations: ['eilogType', 'eilogHead', 'createdBy']
  });

  // Calculate total revenue from EILog
  let totalRevenue = 0;
  eilogs.forEach(eilog => {
    const income = parseFloat(eilog.income || '0');
    const expense = parseFloat(eilog.expense || '0');
    totalRevenue += income - expense; // Net revenue
  });

  // Get project financial data
  const projects = await projectRepo.find({
    where: { ...dateFilter, deleted: false },
    relations: ['client']
  });

  // Add project-based revenue
  projects.forEach(project => {
    if (project.budget) {
      totalRevenue += parseFloat(project.budget.toString());
    }
    if (project.actual_cost) {
      totalRevenue -= parseFloat(project.actual_cost.toString());
    }
  });

  const [totalProjects, totalLeads, totalStaff] = await Promise.all([
    projectRepo.count({ where: { deleted: false } }),
    leadRepo.count({ where: { deleted: false } }),
    userRepo.count({ 
      where: { 
        deleted: false,
        role: { role: Not(ILike('admin')) }
      },
      relations: ['role']
    })
  ]);

  // Calculate overall performance based on real metrics
  const completedProjects = projects.filter(p => p.status === ProjectStatus.COMPLETED).length;
  const projectCompletionRate = totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0;
  
  // Calculate lead conversion rate
  const convertedLeads = await leadRepo.count({ 
    where: { 
      deleted: false,
      status: { name: ILike('%converted%') }
    },
    relations: ['status']
  });
  const leadConversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;
  
  // Calculate overall performance as average of key metrics
  const overallPerformance = Math.round((projectCompletionRate + leadConversionRate) / 2);

  return {
    totalRevenue: Math.round(totalRevenue),
    totalProjects,
    totalLeads,
    totalStaff,
    overallPerformance
  };
}

export async function getPublicDashboardReport(params: PublicDashboardParams,   convertedStatusNames: string[] = ["completed", "business done"]
): Promise<PublicDashboardReport> {
    const convLower = convertedStatusNames.map((s) => s.toLowerCase());

  const { fromDate, toDate } = params;

// Date filter
let dateFilter: { from?: Date; to?: Date } = {};
if (fromDate && toDate) {
  dateFilter.from = new Date(fromDate);
  dateFilter.to = new Date(toDate);
  dateFilter.to.setHours(23, 59, 59, 999);
} else if (fromDate) {
  dateFilter.from = new Date(fromDate);
  dateFilter.to = new Date();
} else if (toDate) {
  dateFilter.from = new Date(0);
  dateFilter.to = new Date(toDate);
  dateFilter.to.setHours(23, 59, 59, 999);
} else {
  // Default to last 30 days if no dates provided
  dateFilter.to = new Date();
  dateFilter.from = new Date();
  dateFilter.from.setDate(dateFilter.from.getDate() - 30);
}

// Build where conditions
let baseWhere: any = { deleted: false };
if (dateFilter.from && dateFilter.to) {
  baseWhere.created_at = Between(dateFilter.from, dateFilter.to);
}

  // 1. Business Overview
const [totalProjectsDelivered, ongoingProjects, clientsServed] = await Promise.all([
    projectRepo.count({ 
        where: { 
            deleted: false, 
            status: ProjectStatus.COMPLETED,
            ...(dateFilter.from && dateFilter.to && { 
                created_at: Between(dateFilter.from, dateFilter.to) 
            })
        } 
    }),
    projectRepo.count({ 
        where: { 
            deleted: false, 
            status: ProjectStatus.IN_PROGRESS,
            ...(dateFilter.from && dateFilter.to && { 
                created_at: Between(dateFilter.from, dateFilter.to) 
            })
        } 
    }),
    clientRepo.count({ 
        where: { 
            deleted: false,
            ...(dateFilter.from && dateFilter.to && { 
                created_at: Between(dateFilter.from, dateFilter.to) 
            })
        } 
    })
]);

  const businessOverview: PublicBusinessOverview = {
    totalProjectsDelivered,
    ongoingProjects,
    clientsServed
  };

  // 2. Lead & Client Interest
  const now = new Date();
  // Use provided dates or default to this month
const startDate = fromDate ? new Date(fromDate) : new Date(now.getFullYear(), now.getMonth(), 1);
const endDate = toDate ? new Date(toDate) : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

// Set end time to end of day if toDate is provided
if (toDate) {
  endDate.setHours(23, 59, 59, 999);
}

const leadsThisMonth = await leadRepo.count({ 
  where: { 
    deleted: false, 
    created_at: Between(startDate, endDate) 
  } 
});

const conversionsThisMonth = await leadRepo
  .createQueryBuilder('lead')
  .innerJoinAndSelect('lead.status', 'status')
  .where('lead.deleted = :deleted', { deleted: false })
  .andWhere('lead.created_at BETWEEN :start AND :end', { 
    start: startDate, 
    end: endDate 
  })
  .andWhere('LOWER(status.name) IN (:...statusNames)', { 
    statusNames: convLower
  })
  .getCount();

// Calculate average conversion time using the same logic as getLeadFunnelMetrics

// Calculate average time to convert (in days) for converted leads
const avgTimeToConvertQuery = leadRepo
  .createQueryBuilder("lead")
  .innerJoin("lead.status_histories", "history")
  .innerJoin("history.status", "status")
  .select("AVG(EXTRACT(EPOCH FROM (history.created_at - lead.created_at)) / 86400)", "avgDays")
  .where("lead.deleted = :deleted", { deleted: baseWhere.deleted ?? false })
  .andWhere("lead.created_at BETWEEN :from AND :to", {
    from: dateFilter.from,
    to: dateFilter.to,
  })
  .andWhere("LOWER(status.name) IN (:...convertedStatusNames)", {
    convertedStatusNames: convLower
  });

const avgTimeResult = await avgTimeToConvertQuery.getRawOne<{ avgDays: string | null }>();
console.log("Time to convert query result:", avgTimeResult);

// If no converted leads found, try a different approach
let avgTimeToConvert = 0;
if (!avgTimeResult?.avgDays) {
  const altTimeQuery = leadRepo
    .createQueryBuilder("lead")
    .innerJoin("lead.status", "status")
    .select("AVG(EXTRACT(EPOCH FROM (NOW() - lead.created_at)) / 86400)", "avgDays")
    .where("lead.deleted = :deleted", { deleted: baseWhere.deleted ?? false })
    .andWhere("lead.created_at BETWEEN :from AND :to", {
      from: dateFilter.from,
      to: dateFilter.to,
    })
    .andWhere("LOWER(status.name) IN (:...convertedStatusNames)", {
      convertedStatusNames: convLower
    });
  
  const altTimeResult = await altTimeQuery.getRawOne<{ avgDays: string | null }>();
  console.log("Alternative time query result:", altTimeResult);
  avgTimeToConvert = altTimeResult?.avgDays ? Math.round(parseFloat(altTimeResult.avgDays)) : 0;
} else {
  avgTimeToConvert = Math.round(parseFloat(avgTimeResult.avgDays));
}
  
  // Top source of leads
  const sourceQb = leadRepo
    .createQueryBuilder("lead")
    .leftJoin("lead.source", "source")
    .leftJoin("lead.status", "status")
    .select([
      "source.name as source",
      "COUNT(*)::int as total",
      // count as converted when status is in converted list (case-insensitive)
      "SUM(CASE WHEN LOWER(status.name) IN (:...convLower) THEN 1 ELSE 0 END)::int as converted",
    ])
    .where("lead.deleted = :deleted", { deleted: baseWhere.deleted ?? false })
    .andWhere("source.name IS NOT NULL")
    .andWhere("lead.created_at BETWEEN :from AND :to", {
      from: dateFilter.from,
      to: dateFilter.to,
    })
    .setParameter("convLower", convLower)
    .groupBy("source.name");

  const sourceStats: Array<{ source: string; total: number; converted: number }> =
    await sourceQb.getRawMany();

  const bestLeadSource =
    sourceStats.length > 0
      ? sourceStats.reduce((top, current) => {
          const cRate =
            current.total > 0 ? (current.converted / current.total) * 100 : 0;
          const tRate =
            top.total > 0 ? (top.converted / top.total) * 100 : 0;
          return cRate > tRate ? current : top;
        }).source
      : "-";

  const leadClientInterest: PublicLeadClientInterest = {
    leadsThisMonth,
    conversionsThisMonth,
    avgConversionTime: avgTimeToConvert,
    topSourceOfLeads: bestLeadSource,
  };

  // 3. Trend Charts (Expenses Overview)
  // By month, for new and completed projects
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const newProject = Array.from({ length: 12 }, () => 0);
  const completedProject = Array.from({ length: 12 }, () => 0);
  const projectTrends = await projectRepo
    .createQueryBuilder('project')
    .select([
      'EXTRACT(MONTH FROM project.created_at) as month',
      'COUNT(*) as started',
      'COUNT(CASE WHEN project.status = :completedStatus THEN 1 END) as completed'
    ])
    .where('project.deleted = false')
    .setParameter('completedStatus', ProjectStatus.COMPLETED)
    .groupBy('EXTRACT(MONTH FROM project.created_at)')
    .orderBy('month', 'ASC')
    .getRawMany();
  projectTrends.forEach(trend => {
    const monthIndex = parseInt(trend.month) - 1;
    if (monthIndex >= 0 && monthIndex < 12) {
      newProject[monthIndex] = parseInt(trend.started);
      completedProject[monthIndex] = parseInt(trend.completed);
    }
  });
  const trendChart: PublicTrendChart = {
    labels: monthNames,
    newProject,
    completedProject
  };

  // 4. Monthly Leads Chart
  const leads = Array.from({ length: 12 }, () => 0);
  const leadTrends = await leadRepo
    .createQueryBuilder('lead')
    .select([
      'EXTRACT(MONTH FROM lead.created_at) as month',
      'COUNT(*) as leads'
    ])
    .where('lead.deleted = false')
    .groupBy('EXTRACT(MONTH FROM lead.created_at)')
    .orderBy('month', 'ASC')
    .getRawMany();
  leadTrends.forEach(trend => {
    const monthIndex = parseInt(trend.month) - 1;
    if (monthIndex >= 0 && monthIndex < 12) {
      leads[monthIndex] = parseInt(trend.leads);
    }
  });
  const monthlyLeadsChart: PublicMonthlyLeadsChart = {
    labels: monthNames,
    leads
  };

  // 5. Team & Performance Highlights
// Get top performer with date filter for tasks
  const topPerformer = await userRepo
  .createQueryBuilder('user')
  .leftJoin(
    'user.assignedTasks',
    'task',
    'task.created_at BETWEEN :from AND :to', // Date filter in JOIN
    { from: dateFilter.from, to: dateFilter.to }
  )
  .leftJoin('user.role', 'role')
  .select([
    'user.first_name as firstName',
    'user.last_name as lastName',
    'COUNT(CASE WHEN task.status = :completedStatus THEN 1 END) as completedTasks',
    'COUNT(task.id) as totalTasks'
  ])
  .where('user.deleted = false AND role.role != :adminRole', { adminRole: 'admin' })
  .setParameter('completedStatus', 'Completed')
  .groupBy('user.id, user.first_name, user.last_name')
  .orderBy('completedTasks', 'DESC')
  .limit(1)
  .getRawOne();

  const topPerformerName = topPerformer 
    ? `${topPerformer.firstname || ''} ${topPerformer.lastname || ''}`.trim()
    : 'No Staff Available';

  // On-time delivery rate
  const onTimeQb = projectRepo
    .createQueryBuilder("project")
    .where("project.deleted = :deleted", { deleted: false })
    .andWhere("project.status = :status", { status: ProjectStatus.COMPLETED })
    .andWhere("project.actual_end_date IS NOT NULL")
    .andWhere("project.end_date IS NOT NULL")
    .andWhere("project.actual_end_date <= project.end_date");

  if (dateFilter.from && dateFilter.to) {
    onTimeQb.andWhere("project.created_at BETWEEN :from AND :to", {
      from: dateFilter.from,
      to: dateFilter.to,
    });
  }

  const [onTimeProjects, completedProjectsCount] = await Promise.all([
    onTimeQb.getCount(),
    projectRepo.count({
      where: {
        deleted: false,
        status: ProjectStatus.COMPLETED,
        ...(dateFilter.from && dateFilter.to
          ? { created_at: Between(dateFilter.from, dateFilter.to) }
          : {}),
      },
    }),
  ]);

  const onTimeDeliveryRate =
    completedProjectsCount > 0
      ? Math.round((onTimeProjects / completedProjectsCount) * 100)
      : 0;

  // Calculate task completion rate with date filter
const [completedTasks, totalTasks] = await Promise.all([
    taskRepo.count({ 
        where: { 
            deleted: false, 
            status: 'Completed',
            ...(dateFilter.from && dateFilter.to && { 
                created_at: Between(dateFilter.from, dateFilter.to) 
            })
        } 
    }),
    taskRepo.count({ 
        where: { 
            deleted: false,
            ...(dateFilter.from && dateFilter.to && { 
                created_at: Between(dateFilter.from, dateFilter.to) 
            })
        } 
    })
]);


  const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const teamPerformance: PublicTeamPerformance = {
    topPerformer: topPerformerName,
    onTimeDeliveryRate,
    avgTaskCompletionRate: Math.ceil(taskCompletionRate),
  };

  return {
    businessOverview,
    leadClientInterest,
    trendChart,
    monthlyLeadsChart,
    teamPerformance
  };
}

export async function exportPublicDashboardReportToExcel(params: any): Promise<{ workbook: ExcelJS.Workbook; name: string }> {
  const report = await getPublicDashboardReport(params);
  const workbook = new ExcelJS.Workbook();
  // Summary sheet
  const worksheet = workbook.addWorksheet('Public Dashboard');
  worksheet.columns = [
    { header: 'Section', key: 'section', width: 30 },
    { header: 'Metric', key: 'metric', width: 30 },
    { header: 'Value', key: 'value', width: 20 },
  ];
  worksheet.addRow({ section: 'Business Overview', metric: 'Total Projects Delivered', value: report.businessOverview.totalProjectsDelivered });
  worksheet.addRow({ section: 'Business Overview', metric: 'Ongoing Projects', value: report.businessOverview.ongoingProjects });
  worksheet.addRow({ section: 'Business Overview', metric: 'Clients Served', value: report.businessOverview.clientsServed });
  worksheet.addRow({ section: 'Lead & Client Interest', metric: 'Leads This Month', value: report.leadClientInterest.leadsThisMonth });
  worksheet.addRow({ section: 'Lead & Client Interest', metric: 'Conversions This Month', value: report.leadClientInterest.conversionsThisMonth });
  worksheet.addRow({ section: 'Lead & Client Interest', metric: 'Avg Conversion Time', value: report.leadClientInterest.avgConversionTime });
  worksheet.addRow({ section: 'Lead & Client Interest', metric: 'Top Source of Leads', value: report.leadClientInterest.topSourceOfLeads });
  worksheet.addRow({ section: 'Team & Performance', metric: 'Top Performer', value: report.teamPerformance.topPerformer });
  worksheet.addRow({ section: 'Team & Performance', metric: 'On-time Delivery Rate', value: report.teamPerformance.onTimeDeliveryRate });
  worksheet.addRow({ section: 'Team & Performance', metric: 'Avg Task Completion Rate', value: report.teamPerformance.avgTaskCompletionRate });

  // Trend Chart Data
  const trendSheet = workbook.addWorksheet('TrendChart');
  trendSheet.columns = [
    { header: 'Month', key: 'month', width: 12 },
    { header: 'New Project', key: 'newProject', width: 15 },
    { header: 'Completed Project', key: 'completedProject', width: 18 },
  ];
  report.trendChart.labels.forEach((month, i) => {
    trendSheet.addRow({
      month,
      newProject: report.trendChart.newProject[i],
      completedProject: report.trendChart.completedProject[i],
    });
  });

  // Monthly Leads Chart Data
  const leadsSheet = workbook.addWorksheet('MonthlyLeadsChart');
  leadsSheet.columns = [
    { header: 'Month', key: 'month', width: 12 },
    { header: 'Leads', key: 'leads', width: 10 },
  ];
  report.monthlyLeadsChart.labels.forEach((month, i) => {
    leadsSheet.addRow({
      month,
      leads: report.monthlyLeadsChart.leads[i],
    });
  });

  const name = `public_dashboard_${Date.now()}`;
  return { workbook, name };
}
