import { Holiday } from "../entities";
import { HolidayCreateInput, HolidayUpdateInput } from "../schemas";
import { AppDataSource } from "../utils/data-source";

const holidayRepo = AppDataSource.getRepository(Holiday);

/** Create a new holiday */
export const createHoliday = async (data: HolidayCreateInput) => {
  const holiday = holidayRepo.create(data);
  return await holidayRepo.save(holiday);
};

/** Get all holidays */
export const getAllHolidays = async () => {
  return await holidayRepo.find({ order: { date: "ASC" } });
};

/** Get single holiday by ID */
export const getHolidayById = async (id: string) => {
  const holiday = await holidayRepo.findOne({ where: { id } });
  if (!holiday) throw new Error("Holiday not found");
  return holiday;
};

/** Update holiday by ID */
export const updateHoliday = async (id: string, data: HolidayUpdateInput) => {
  const holiday = await getHolidayById(id);
  Object.assign(holiday, data);
  return await holidayRepo.save(holiday);
};

/** Delete holiday by ID */
export const deleteHoliday = async (id: string) => {
  const holiday = await getHolidayById(id);
  return await holidayRepo.remove(holiday);
};
