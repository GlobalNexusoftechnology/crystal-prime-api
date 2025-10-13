import { Leave } from "../entities";
import { LeaveCreateInput, LeaveUpdateInput } from "../schemas";
import { AppDataSource } from "../utils/data-source";

const leaveRepo = AppDataSource.getRepository(Leave);

export const applyLeave = async (data: LeaveCreateInput) => {
  const leave = leaveRepo.create(data);
  return await leaveRepo.save(leave);
};

export const updateLeaveStatus = async (id: string, data: LeaveUpdateInput) => {
  const leave = await leaveRepo.findOneBy({ id });
  if (!leave) throw new Error("Leave not found");
  Object.assign(leave, data);
  return await leaveRepo.save(leave);
};

export const getAllLeaves = async () => {
  return await leaveRepo.find({ relations: ["staff"] });
};

export const getLeavesByStaff = async (staffId: string) => {
  return await leaveRepo.find({ where: { staffId }, order: { appliedDate: "DESC" } });
};
