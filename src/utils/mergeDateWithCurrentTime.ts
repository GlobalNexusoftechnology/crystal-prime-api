export const mergeDateWithCurrentTime = (
  dateInput: string | Date | undefined
): Date | undefined => {
  if (!dateInput) {
    return undefined;
  }
  const baseDate = new Date(dateInput);
  const now = new Date();

  baseDate.setHours(now.getHours());
  baseDate.setMinutes(now.getMinutes());
  baseDate.setSeconds(now.getSeconds());
  baseDate.setMilliseconds(now.getMilliseconds());

  return baseDate;
};
