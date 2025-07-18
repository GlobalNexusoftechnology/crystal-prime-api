export type TOptionItem = {
  key: string;
  label: string;
  value: string;
};

export const MODULES: TOptionItem[] = [
  { key: "DASHBOARD", label: "Dashboard", value: '10' },
  { key: "LEAD_MANAGEMENT", label: "Lead Management Module", value: '11' },
  { key: "PROJECT_MANAGEMENT", label: "Project Management Module", value: '12' },
  { key: "STAFF_MANAGEMENT", label: "Staff Management Module", value: '13' },
  { key: "LEAD_SOURCES", label: "Lead Sources Module", value: '14'},
  { key: "LEAD_STATUSES", label: "Lead Statuses Module", value: '15'},
  { key: "ROLES", label: "Roles Module", value: '16'},
  { key: "SETTINGS", label: "Settings Module", value: '17' },
  { key: "LEAD_TYPES", label: "Lead Types Module", value: '18' },
  { key: "CLIENT_MANAGEMENT", label: "Client Management Module", value: '19' },
  { key: "PROJECT_TEMPLATE", label: "Project Template Module", value: '20' },
  { key: "MILESTONE", label: "Milestone Module", value: "21" },
  { key: "TASK", label: "Task Module", value: "22" },
  { key: "EI_LOG_TYPES", label: "EI Log Types Module", value: "23" },
  { key: "EI_LOG_HEADS", label: "EI Log Heads Module", value: "24" },
  { key: "EI_LOG_MANAGEMENT", label: "EI Log Management Module", value: "25" },
  { key: "REPORTS", label: "Reports", value: "26" },
  { key: "STAFF_PERFORMANCE_REPORT", label: "Staff Performance Report", value: "27" },
  { key: "PROJECT_PERFORMANCE_REPORT", label: "Project Performance Report", value: "28" },
  { key: "LEAD_ANALYTICS_REPORT", label: "Lead Analytics Report", value: "29" },
  { key: "BUSINESS_ANALYSIS_REPORT", label: "Business Analysis Report", value: "30" },
  { key: "PUBLIC_BUSINESS_DASHBOARD", label: "Public Business Dashboard", value: "31" },

];

export const ACTIONS: TOptionItem[] = [
  { key: "VIEW", label: "Read", value: '1' },
  { key: "ADD", label: "Add", value: '2' },
  { key: "EDIT", label: "Edit", value: '3' },
  { key: "DELETE", label: "Delete", value: '4' },
];

export const getPermissionCode = (module: string, action: string) => `${module}_${action}`;
