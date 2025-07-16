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
          projectService.getAllProject(),
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

        // Project renewal data (unchanged)
        const projectRenewalData = [];
        const categories = [...new Set(allProjects.map((p: any) => p.project_type || "Other"))];
        for (const category of categories) {
          const projects = allProjects
            .filter((p: any) => (p.project_type || "Other") === category)
            .map((p: any) => ({
              name: p.name,
              date: p.renewal_date ? new Date(p.renewal_date).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }) : "",
              status: p.completion || 0
            }));
          projectRenewalData.push({ category, projects });
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
            projectRenewalData,
            expenses
          }
        });
        return;
      }

      // Non-admin: only return limited stats
      const leadStats = await leadService.getLeadStats(userId, role);
      const totalLeads = leadStats.totalLeads || 0;
      const todayFollowups = leadStats.todayFollowups || 0;
      const convertedLeads = leadStats.convertedLeads || 0;
      const lostLeads = leadStats.lostLeads || 0;
      const conversionRate = totalLeads ? `${Math.round((convertedLeads / totalLeads) * 100)}%` : '0%';
      const stats = {
        totalLeads,
        todayFollowups,
        convertedLeads,
        lostLeads,
        conversionRate
      };
      res.status(200).json({ status: 'success', data: stats });
      return;
    } catch (error) {
      next(error);
    }
  };

  return {
    getDashboardSummary,
  };
};
