import { MODULES, ACTIONS } from "../constants";

export function validatePermissionCodes(codes: string[]): boolean {
  const VALID_MODULE_VALUES = MODULES.map((module) => module.value);
  const VALID_ACTION_CODES = ACTIONS.map((action) => action.value);
  for (const code of codes) {
    if (code.length < 3) return false;

    const modulePart = code.slice(0, 2);
    const actionParts = code.slice(2).split("");

    // Module must be valid
    if (!VALID_MODULE_VALUES.includes(modulePart)) return false;
    
    // Each action digit must be valid (1–4)
    for (const action of actionParts) {
      if (!VALID_ACTION_CODES.includes(action)) return false;
    }

    // Ensure no duplicate actions in a single code
    if (new Set(actionParts).size !== actionParts.length) return false;
  }

  return true;
}
