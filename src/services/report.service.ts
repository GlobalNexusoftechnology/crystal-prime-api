import { AppDataSource } from '../utils/data-source';
import { User } from '../entities/user.entity';
import { ProjectTasks } from '../entities/project-task.entity';
import { ProjectMilestones } from '../entities/project-milestone.entity';
import { projectAttachments } from '../entities/project-attachments.entity';
import { LeadFollowup, FollowupStatus } from '../entities/lead-followups.entity';
import { StaffPerformanceReport } from '../types/report';
import { Between, MoreThanOrEqual, LessThanOrEqual, Not, ILike } from 'typeorm';
import ExcelJS from "exceljs";
import { AppError } from '../utils';

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