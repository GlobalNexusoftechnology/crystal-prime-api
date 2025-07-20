export interface StaffPerformanceReport {
  staffName: string;
  staffEmail: string;
  totalTasksAssigned: number;
  completedTasks: number;
  completionRate: number;
  avgDaysToComplete: number;
  delayedTasks: number;
  milestonesManaged: number;
  filesUploaded: number;
  totalFollowUps: number;
  completedFollowUps: number;
  pendingFollowUps: number;
  avgFollowUpResponseTime: number;
  missedFollowUps: number;
}

export interface ProjectPerformanceReport {
  projectInfo: {
    projectId: string;
    name: string;
    client: {
      id: string;
      name: string;
      company_name?: string;
      contact_number?: string;
    };
    status: string;
    start_date: Date | string | null;
    end_date: Date | string | null;
    actual_start_date: Date | string | null;
    actual_end_date: Date | string | null;
  };
  costBudget: {
    budget: number | null;
    estimated_cost: number | null;
    actual_cost: number | null;
    budget_utilization_percent: number | null;
    overrun: number | null;
  };
  taskMetrics: {
    totalTasks: number;
    completed: number;
    inProgress: number;
    overdue: number;
    avgTaskCompletionTimeDays: number;
    taskReassignmentCount: number;
    topPerformer: { userId: string; name: string; tasksCompleted: number } | null;
  };
  resourceUtilization: Array<{
    userId: string;
    name: string;
    assignedTasks: number;
    completedTasks: number;
    taskLoadPercent: number;
    followUps: number;
    activeIssues: number;
  }>;
  milestoneSummary: Array<{
    milestoneId: string;
    name: string;
    status: string;
    start_date: Date | string | null;
    end_date: Date | string | null;
    actual_date: Date | string | null;
    assigned_to: string | null;
    delayDays: number | null;
  }>;
  documentSummary: Array<{
    file_type: string;
    count: number;
    last_updated: Date | string | null;
  }>;
  timelineAnalysis: {
    daysSinceStart: number;
    plannedDurationDays: number;
    progressPercent: number;
    delayRisk: string;
  };
  followUpMatrix: {
    totalFollowUpsLogged: number;
    followUpsCompleted: number;
    pendingFollowUps: number;
    missedOrDelayedFollowUps: number;
    avgResponseTimeHours: number;
    escalatedItems: number;
  };
}

export interface LeadReportsParams {
  fromDate?: string;
  toDate?: string;
  userId?: string;
  sourceId?: string;
  statusId?: string;
  typeId?: string;
}

export interface LeadFunnelChart {
  totalLeads: number;
  lostLeads: number;
  convertedLeads: number;
  dropOfStage: {
    stage: string;
    count: number;
  };
}

export interface LeadKPIMetrics {
  conversionRate: number;
  avgLeadAge: number;
  avgFollowupsLead: number;
  topPerformingSource: string;
  avgTimeToConvert: number;
  pendingFollowups: number;
  hotLeadsCount: number;
  averageResponseTime: number;
}

export interface StaffConversionPerformance {
  staffId: string;
  staffName: string;
  conversionRate: number;
}

export interface SourceWiseConversionRate {
  source: string;
  conversionRate: number;
}

export interface LeadFunnelStage {
  stage: string;
  count: number;
  isHighlighted?: boolean;
}

export interface MonthlyLeadsData {
  labels: string[];
  leads: number[];
}

export interface LeadReportsData {
  leadFunnelChart: LeadFunnelChart;
  kpiMetrics: LeadKPIMetrics;
  staffConversionPerformance: StaffConversionPerformance[];
  sourceWiseConversionRates: SourceWiseConversionRate[];
  leadFunnelStages: LeadFunnelStage[];
  monthlyLeadsChart: MonthlyLeadsData;
  summary: {
    totalLeads: number;
    convertedLeads: number;
    lostLeads: number;
    activeLeads: number;
    conversionRate: number;
  };
} 