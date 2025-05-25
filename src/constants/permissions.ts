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
  // Add more as needed
];

export const ACTIONS: TOptionItem[] = [
  { key: "VIEW", label: "Read", value: '1' },
  { key: "ADD", label: "Add", value: '2' },
  { key: "EDIT", label: "Edit", value: '3' },
  { key: "DELETE", label: "Delete", value: '4' },
];

export const getPermissionCode = (module: string, action: string) => `${module}_${action}`;
