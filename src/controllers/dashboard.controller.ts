import { Request, Response, NextFunction } from "express";
import { LeadService } from "../services/leads.service";
import { ProjectService } from "../services/projects.service";
import { ProjectTaskService } from "../services/project-task.service";
import { MilestoneService } from "../services/project-milestone.service";
import { DailyTaskEntryService } from "../services/daily-task.service";

const leadService = LeadService();
const projectService = ProjectService();
const projectTaskService = ProjectTaskService();
const milestoneService = MilestoneService();
const dailyTaskService = DailyTaskEntryService();

export const dashboardController = () => {
  const getDashboardSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // User context (if needed for filtering)
      const userId = res?.locals?.user?.id;

      // 1. Leads summary and analytics
      const leadStats = await leadService.getLeadStats(userId);
      const allLeads = await leadService.getAllLeads();
      // Lead analytics by status (for bar chart)
      const leadStatusCounts: Record<string, number> = {};
      allLeads.forEach((lead: any) => {
        const status = lead.status?.name || "Unknown";
        leadStatusCounts[status] = (leadStatusCounts[status] || 0) + 1;
      });

      // 2. Projects summary
      const allProjects = await projectService.getAllProject();
      const totalProjects = allProjects.length;
      const inProgressProjects = allProjects.filter((p: any) => p.status === "In Progress").length;
      const completedProjects = allProjects.filter((p: any) => p.status === "Completed").length;
      const projectSnapshot = {
        inProgress: inProgressProjects,
        completed: completedProjects,
        percentCompleted: totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0,
        percentInProgress: totalProjects > 0 ? Math.round((inProgressProjects / totalProjects) * 100) : 0,
        total: totalProjects,
      };

      // 3. Tasks summary
      const allTasksResult = await projectTaskService.getAllTasks();
      const allTasks = allTasksResult.data || [];
      const totalTasks = allTasks.length;
      const inProgressTasks = allTasks.filter((t: any) => t.status === "In Progress").length;
      const completedTasks = allTasks.filter((t: any) => t.status === "Completed").length;
      // Tasks due today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      const tasksDueToday = allTasks.filter((t: any) => t.due_date && new Date(t.due_date) >= today && new Date(t.due_date) < tomorrow).length;

      // 4. Daily tasks (today/tomorrow)
      const dailyTasks = await dailyTaskService.getAllEntries();
      const dailyTasksToday = dailyTasks.filter((dt: any) => {
        const entryDate = new Date(dt.entry_date);
        return entryDate >= today && entryDate < tomorrow;
      });
      const dailyTasksTomorrow = dailyTasks.filter((dt: any) => {
        const entryDate = new Date(dt.entry_date);
        return entryDate >= tomorrow && entryDate < new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000);
      });

      // 5. Compose response
      res.status(200).json({
        status: "success",
        data: {
          leads: {
            total: leadStats.totalLeads,
            assignedToMe: leadStats.assignedToMe,
            profileSent: leadStats.profileSent,
            businessDone: leadStats.businessDone,
            notInterested: leadStats.notInterested,
            todayFollowups: leadStats.todayFollowups,
            analytics: leadStatusCounts,
          },
          projects: {
            total: totalProjects,
            inProgress: inProgressProjects,
            completed: completedProjects,
            snapshot: projectSnapshot,
          },
          tasks: {
            total: totalTasks,
            inProgress: inProgressTasks,
            completed: completedTasks,
            dueToday: tasksDueToday,
          },
          dailyTasks: {
            today: dailyTasksToday,
            tomorrow: dailyTasksTomorrow,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  };

  return {
    getDashboardSummary,
  };
}; 