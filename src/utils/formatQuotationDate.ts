/**
 * Formats a date for quotation documents in human-readable format
 * @param dateInput - Date string, Date object, or null/undefined
 * @returns Formatted date string like "15 Jan 2024" or null if invalid
 */
export function formatQuotationDate(dateInput?: string | Date | null): string | null {
  try {
    if (!dateInput) return null;

    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return null;

    // Format as "15 Jan 2024" (day month year)
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short", 
      year: "numeric",
    });
  } catch {
    return null;
  }
}
