import { Request, Response, NextFunction } from "express";
import { LeadService } from "../services/leads.service";
import { ProjectService } from "../services/projects.service";
import { ProjectTaskService } from "../services/project-task.service";
import { getEILogChartData } from "../services/eilog.service";

const leadService = LeadService();
const projectService = ProjectService();


export const dashboardController = () => {
  const getDashboardSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = res?.locals?.user;
      const userId: string = user?.id;
      const role: string = user?.role?.role;

      // Admin: full dashboard
      if (role === 'admin') {
        // Fetch all required data in parallel
        const [
          leadStats,
          projectStatusCounts,
          leadStatusWeekly,
          leadStatusMonthly,
          leadStatusYearly,
          leadTypeWeekly,
          leadTypeMonthly,
          leadTypeYearly,
          allProjects,
          yearlyChart,
          monthlyChart,
          weeklyChart
        ] = await Promise.all([
          leadService.getLeadStats(userId, role),
          projectService.getProjectStatusCounts(userId, role),
          leadService.groupLeadsByStatus("Weekly", userId, role),
          leadService.groupLeadsByStatus("Monthly", userId, role),
          leadService.groupLeadsByStatus("Yearly", userId, role),
          leadService.groupLeadsByType("Weekly", userId, role),
          leadService.groupLeadsByType("Monthly", userId, role),
          leadService.groupLeadsByType("Yearly", userId, role),
          projectService.getAllProjectDashboard(userId, role),
          getEILogChartData(userId, role, 'yearly'),
          getEILogChartData(userId, role, 'monthly'),
          getEILogChartData(userId, role, 'weekly')
        ]);

        // Stats for cards
        const stats = [
          {
            count: String(leadStats.totalLeads || 0),
            title: "Total Leads",
            subtitle: "Over All leads"
          },
          {
            count: String(leadStats.todayFollowups || 0),
            title: "Follow-Ups Due Today",
            subtitle: "Today's pending work"
          },
          {
            count: String(leadStats.convertedLeads || 0),
            title: "Converted Leads",
            subtitle: "Weekly Leads"
          },
          {
            count: String(leadStats.lostLeads || 0),
            title: "Lost Leads",
            subtitle: "Weekly Leads"
          },
          {
            count: leadStats.totalLeads
              ? `${Math.round((leadStats.convertedLeads / leadStats.totalLeads) * 100)}%`
              : "0%",
            title: "Conversion Rate",
            subtitle: "Lead to Customer"
          }
        ];

        // Project snapshot (status counts)
        const projectSnapshot = {
          inProgress: projectStatusCounts.find((s: any) => s.status === "In Progress")?.count || 0,
          completed: projectStatusCounts.find((s: any) => s.status === "Completed")?.count || 0,
          open: projectStatusCounts.find((s: any) => s.status === "Open")?.count || 0
        };

        const monthWiseProjectRenewalData: Record<string, any[]> = {};

        const monthNames = [
          "January",
          "February",
          "March",
          "April",
          "May",
          "June",
          "July",
          "August",
          "September",
          "October",
          "November",
          "December",
        ];

        for (const project of allProjects) {
          const renewalDate = project.renewal_date;

          if (!renewalDate) continue;

          const dateObj = new Date(renewalDate);
          const month = monthNames[dateObj.getMonth()];

          if (!monthWiseProjectRenewalData[month]) {
            monthWiseProjectRenewalData[month] = [];
          }

          const category = project.project_type?.name || "Other";

          let categoryGroup = monthWiseProjectRenewalData[month].find(
            (cat) => cat.category === category
          );

          if (!categoryGroup) {
            categoryGroup = {
              category,
              projects: [],
            };
            monthWiseProjectRenewalData[month].push(categoryGroup);
          }

          // ✅ Calculate milestone completion %
          const totalMilestones = project.milestones?.length || 0;
          console.log(totalMilestones);
          const completedMilestones =
            project.milestones?.filter(
              (m) => m.status?.toLowerCase() === "completed"
            ).length || 0;

          const completionPercentage =
            totalMilestones > 0
              ? Math.round((completedMilestones / totalMilestones) * 100)
              : 0;

          categoryGroup.projects.push({
            name: project.name,
            date: dateObj.toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            }),
            status: completionPercentage,
          });
        }

        // Expenses data (unchanged)
        const expenses = {
          weekly: weeklyChart,
          monthly: monthlyChart,
          yearly: yearlyChart
        };

        // Lead analytics (status) and lead type, all periods
        const leadAnalytics = {
          weekly: leadStatusWeekly,
          monthly: leadStatusMonthly,
          yearly: leadStatusYearly
        };
        const leadType = {
          weekly: leadTypeWeekly,
          monthly: leadTypeMonthly,
          yearly: leadTypeYearly
        };

        res.status(200).json({
          status: "success",
          data: {
            stats,
            projectSnapshot,
            leadAnalytics,
            leadType,
            projectRenewalData: monthWiseProjectRenewalData,
            expenses
          }
        });
        return;
      }

      // Non-admin: only return limited stats
      // 1. My Task (count of all open, in process tasks assigned to user)
      // 2. Today Follow up (from getLeadStats)
      // 3. Project (count of projects where user is assigned to a milestone or task)
      // 4. Performance Ratio (completed tasks / total task assigned)
      const [leadStats, allTasks, allProjects] = await Promise.all([
        leadService.getLeadStats(userId, role),
        // Get all tasks assigned to this user (from project_tasks)
        (async () => {
          const { data } = await require("../services/project-task.service").ProjectTaskService().getAllTasks();
          return data.filter((t: any) => t.assigned_to === userId);
        })(),
        // Get all projects where user is assigned to a milestone or task
        projectService.getAllProject(userId, role)
      ]);

      // My Task: count of open and in process tasks
      const myTaskCount = allTasks.filter((t: any) => t.status === "Open" || t.status === "In Progress").length;
      // Performance Ratio: completed / total assigned
      const completedTaskCount = allTasks.filter((t: any) => t.status === "Completed").length;
      const totalAssignedTaskCount = allTasks.length;
      const performanceRatio = totalAssignedTaskCount > 0 ? `${Math.round((completedTaskCount / totalAssignedTaskCount) * 100)}%` : "0%";
      // Project: count of projects where user is assigned
      const projectCount = allProjects.length;
      // Today Follow up
      const todayFollowups = leadStats.todayFollowups || 0;

      // Only return the counts for the four stats
      res.status(200).json({
        status: 'success',
        data: {
          myTaskCount,
          todayFollowups,
          projectCount,
          performanceRatio
        }
      });
      return;
    } catch (error) {
      next(error);
    }
  };

  return {
    getDashboardSummary,
  };
};
