import { Request, Response, NextFunction } from "express";
import { LeadService } from "../services/leads.service";
import { ProjectService } from "../services/projects.service";
import { ProjectTaskService } from "../services/project-task.service";
import { MilestoneService } from "../services/project-milestone.service";
import { DailyTaskEntryService } from "../services/daily-task.service";
import { getEILogChartData } from "../services/eilog.service"; 

const leadService = LeadService();
const projectService = ProjectService();
const projectTaskService = ProjectTaskService();
const milestoneService = MilestoneService();
const dailyTaskService = DailyTaskEntryService();

export const dashboardController = () => {
  const getDashboardSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = res?.locals?.user?.id;
      const role = res?.locals?.user?.role?.role;

      const [leadStats, allLeads, allProjects, allTasksResult, dailyTasks] = await Promise.all([
        leadService.getLeadStats(userId, role),
        leadService.getAllLeads(),
        projectService.getAllProject(),
        projectTaskService.getAllTasks(),
        dailyTaskService.getAllEntries()
      ]);

      const leadStatusCounts: Record<string, number> = {};
      const leadTypeCounts: Record<string, number> = {};
      allLeads.forEach((lead: any) => {
        const status = lead.status?.name || "Unknown";
        const type = lead.type || "Unknown";
        leadStatusCounts[status] = (leadStatusCounts[status] || 0) + 1;
        leadTypeCounts[type] = (leadTypeCounts[type] || 0) + 1;
      });

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

      const allTasks = allTasksResult.data || [];
      const totalTasks = allTasks.length;
      const inProgressTasks = allTasks.filter((t: any) => t.status === "In Progress").length;
      const completedTasks = allTasks.filter((t: any) => t.status === "Completed").length;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      const tasksDueToday = allTasks.filter(
        (t: any) => t.due_date && new Date(t.due_date) >= today && new Date(t.due_date) < tomorrow
      ).length;

      const dailyTasksToday = dailyTasks.filter((dt: any) => {
        const entryDate = new Date(dt.entry_date);
        return entryDate >= today && entryDate < tomorrow;
      });

      const dailyTasksTomorrow = dailyTasks.filter((dt: any) => {
        const entryDate = new Date(dt.entry_date);
        return entryDate >= tomorrow && entryDate < new Date(tomorrow.getTime() + 86400000);
      });

      const [yearlyChart, monthlyChart, weeklyChart] = await Promise.all([
        getEILogChartData(userId, role, 'yearly'),
        getEILogChartData(userId, role, 'monthly'),
        getEILogChartData(userId, role, 'weekly')
      ]);

      const convertedLeads = leadStats.convertedLeads || 0;
      const lostLeads = leadStats.lostLeads || 0;
      const conversionRate = leadStats.totalLeads ? `${Math.round((convertedLeads / leadStats.totalLeads) * 100)}%` : "0%";

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
            leadType: leadTypeCounts,
            converted: convertedLeads,
            lost: lostLeads,
            conversionRate,
          },
          projects: {
            total: totalProjects,
            inProgress: inProgressProjects,
            completed: completedProjects,
            snapshot: projectSnapshot,
            renewal: {
              "E-Commerce": [
                { name: "Flipkart", renewal_date: "2024-06-20", completion: 60 },
              ],
              "Shopping": [
                { name: "Zara", renewal_date: "2024-06-21", completion: 40 },
              ]
            }
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
          expenses: {
            yearly: yearlyChart,
            monthly: monthlyChart,
            weekly: weeklyChart,
          }
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
