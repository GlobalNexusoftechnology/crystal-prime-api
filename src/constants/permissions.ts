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

  // Add more as needed
];

export const ACTIONS: TOptionItem[] = [
  { key: "VIEW", label: "Read", value: '1' },
  { key: "ADD", label: "Add", value: '2' },
  { key: "EDIT", label: "Edit", value: '3' },
  { key: "DELETE", label: "Delete", value: '4' },
];

export const getPermissionCode = (module: string, action: string) => `${module}_${action}`;
