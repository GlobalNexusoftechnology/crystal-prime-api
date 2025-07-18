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