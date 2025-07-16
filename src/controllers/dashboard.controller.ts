import { Request, Response, NextFunction } from "express";
import { LeadService } from "../services/leads.service";
import { ProjectService } from "../services/projects.service";
import { ProjectTaskService } from "../services/project-task.service";
import { getEILogChartData } from "../services/eilog.service";
import fs from "fs";

const leadService = LeadService();
const projectService = ProjectService();
const projectTaskService = ProjectTaskService();

function getWeek(date: Date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
  return Math.ceil((((d as any) - (yearStart as any)) / 86400000 + 1)/7);
}

export const dashboardController = () => {
  const getDashboardSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = res?.locals?.user?.id;
      const role = res?.locals?.user?.role?.role;

      // Fetch all required data in parallel
      const [
        leadStats,
        allLeads,
        allProjects,
        allTasksResult,
        yearlyChart,
        monthlyChart,
        weeklyChart
      ] = await Promise.all([
        leadService.getLeadStats(userId, role),
        leadService.getAllLeads(),
        projectService.getAllProject(),
        projectTaskService.getAllTasks(),
        getEILogChartData(userId, role, 'yearly'),
        getEILogChartData(userId, role, 'monthly'),
        getEILogChartData(userId, role, 'weekly')
      ]);

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

      // Helper to compute project status from milestone statuses
      function computeProjectStatusFromMilestones(milestones: any[], projectName?: string): string {
        const logLine = `[${new Date().toISOString()}] Project: ${projectName || "Unknown"}, Milestones: ${JSON.stringify(milestones)}\n`;
        fs.appendFileSync("dashboard-debug.log", logLine);
        if (!milestones.length) return "Open";
        const allCompleted = milestones.every(m => m.status === "Completed");
        const anyInProgress = milestones.some(m => m.status === "In Progress");
        const hasCompleted = milestones.some(m => m.status === "Completed");
        const hasOpen = milestones.some(m => m.status === "Open");
        let status = "Open";
        if (allCompleted) status = "Completed";
        else if (anyInProgress || (hasCompleted && hasOpen)) status = "In Progress";
        else if (hasOpen) status = "Open";
        const statusLog = `[${new Date().toISOString()}] Project: ${projectName || "Unknown"}, Computed Status: ${status}\n`;
        fs.appendFileSync("dashboard-debug.log", statusLog);
        return status;
      }

      // Compute project status for all projects
      let inProgressProjects = 0;
      let completedProjects = 0;
      let pendingProjects = 0;
      for (const project of allProjects) {
        const status = computeProjectStatusFromMilestones(project.milestones || [], project.name);
        if (status === "In Progress") inProgressProjects++;
        else if (status === "Completed") completedProjects++;
        else if (status === "Open") pendingProjects++;
      }
      const totalProjects = allProjects.length;
      const projectSnapshotData = [
        { name: "In Progress", value: inProgressProjects },
        { name: "Completed", value: completedProjects },
        { name: "Pending", value: pendingProjects }
      ];
      const projectSnapshotColors = ["#3B82F6", "#6366F1", "#F59E42"];

      // 3. Lead Type Chart Data Map (group by type for each period)
      function groupLeadsByType(leads: any[], filterFn: (lead: any) => boolean) {
        const counts: Record<string, number> = {};
        leads.filter(filterFn).forEach((lead: any) => {
          const type =
            typeof lead.type === "object" && lead.type !== null
              ? lead.type.name || "Unknown"
              : lead.type || "Unknown";
          counts[type] = (counts[type] || 0) + 1;
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
      }
      const now = new Date();
      const thisWeek = getWeek(now);
      const thisMonth = now.getMonth();
      const thisYear = now.getFullYear();

      const leadTypeChartDataMap = {
        "This Week": groupLeadsByType(allLeads, (lead) => {
          const created = new Date(lead.created_at);
          return getWeek(created) === thisWeek && created.getFullYear() === thisYear;
        }),
        "Last Week": groupLeadsByType(allLeads, (lead) => {
          const created = new Date(lead.created_at);
          return getWeek(created) === thisWeek - 1 && created.getFullYear() === thisYear;
        }),
        "This Month": groupLeadsByType(allLeads, (lead) => {
          const created = new Date(lead.created_at);
          return created.getMonth() === thisMonth && created.getFullYear() === thisYear;
        }),
        "Last Month": groupLeadsByType(allLeads, (lead) => {
          const created = new Date(lead.created_at);
          return created.getMonth() === thisMonth - 1 && created.getFullYear() === thisYear;
        })
      };
      const leadTypeColors = ["#10B981", "#3B82F6", "#F59E42", "#6366F1"];

      // 4. Project Renewal Data (dynamic)
      const projectRenewalData = [];
      const categories = [...new Set(allProjects.map((p: any) => p.project_type || "Other"))];
      for (const category of categories) {
        const projects = allProjects
          .filter((p: any) => (p.project_type || "Other") === category)
          .map((p: any) => ({
            name: p.name,
            date: p.renewal_date ? new Date(p.renewal_date).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }) : "",
            status: p.completion || 0 // You may want to calculate completion %
          }));
        projectRenewalData.push({ category, projects });
      }

      // 5. Expenses Data Map (dynamic, using your chart data)
      const expensesDataMap = {
        Weekly: weeklyChart,
        Monthly: monthlyChart,
        Yearly: yearlyChart
      };

      // 6. Lead Analytics Chart Data Map (group by status for each period)
      function groupLeadsByStatus(leads: any[], filterFn: (lead: any) => boolean) {
        const counts: Record<string, number> = {};
        leads.filter(filterFn).forEach((lead: any) => {
          const status =
            typeof lead.status === "object" && lead.status !== null
              ? lead.status.name || "Unknown"
              : lead.status || "Unknown";
          counts[status] = (counts[status] || 0) + 1;
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
      }
      const leadAnalyticsChartDataMap = {
        "This Week": groupLeadsByStatus(allLeads, (lead) => {
          const created = new Date(lead.created_at);
          return getWeek(created) === thisWeek && created.getFullYear() === thisYear;
        }),
        "Last Week": groupLeadsByStatus(allLeads, (lead) => {
          const created = new Date(lead.created_at);
          return getWeek(created) === thisWeek - 1 && created.getFullYear() === thisYear;
        }),
        "This Month": groupLeadsByStatus(allLeads, (lead) => {
          const created = new Date(lead.created_at);
          return created.getMonth() === thisMonth && created.getFullYear() === thisYear;
        }),
        "Last Month": groupLeadsByStatus(allLeads, (lead) => {
          const created = new Date(lead.created_at);
          return created.getMonth() === thisMonth - 1 && created.getFullYear() === thisYear;
        })
      };

      res.status(200).json({
        status: "success",
        data: {
          stats,
          projectSnapshotData,
          projectSnapshotColors,
          leadTypeChartDataMap,
          leadTypeColors,
          projectRenewalData,
          expensesDataMap,
          leadAnalyticsChartDataMap
        }
      });
    } catch (error) {
      next(error);
    }
  };

  return {
    getDashboardSummary,
  };
};
