import { AppDataSource } from "../utils/data-source";
import { WorkRequest } from "../entities/work-request.entity";
import { Holiday } from "../entities/holiday.entity";
import { User } from "../entities/user.entity";
import AppError from "../utils/appError";
import { NotificationService } from "./notification.service";
import { NotificationType } from "../entities/notification.entity";

const workRequestRepository = AppDataSource.getRepository(WorkRequest);
const holidayRepository = AppDataSource.getRepository(Holiday);
const userRepository = AppDataSource.getRepository(User);
const notificationService = NotificationService();

export const createWorkRequest = async (
  userId: string,
  requestDate: string,
  reason: string
) => {
  const date = new Date(requestDate);
  
  if (isNaN(date.getTime())) {
    throw new AppError(400, "Invalid date format. Please provide a valid date (YYYY-MM-DD).");
  }

  const day = date.getDay(); // 0 is Sunday

  // Check if it's Sunday
  const isSunday = day === 0;

  // Check if it's a Holiday
  const holiday = await holidayRepository.findOne({
    where: { date: date },
  });

  if (!isSunday && !holiday) {
    throw new AppError(400, "Work requests are only needed for Sundays or Holidays.");
  }

  // Check if request already exists
  const existingRequest = await workRequestRepository.findOne({
    where: { staffId: userId, requestDate: date },
  });

  if (existingRequest) {
    throw new AppError(400, "A request for this date already exists.");
  }

  const user = await userRepository.findOne({ where: { id: userId } });
  if (!user) throw new AppError(404, "User not found");

  const workRequest = workRequestRepository.create({
    staffId: userId,
    requestDate: date,
    reason,
    status: "Pending",
  });

  await workRequestRepository.save(workRequest);

  // Notify Admin (Assuming there is a way to identify admins, or sending to all admins)
  // For now, let's find users with role 'Admin'
  // Note: This depends on how roles are handled. I'll assume a simple check for now or fetch all admins.
  // Optimization: In a real app, we might cache admin IDs or have a specific method.
  const admins = await userRepository.find({
    where: { role: { role: "admin" } }, // Adjust based on Role entity structure
    relations: ["role"],
  });

  for (const admin of admins) {
     if (admin.role?.role === 'admin') {
        await notificationService.createNotification(
            admin.id,
            NotificationType.WORK_REQUEST_CREATED,
            `${user.first_name} ${user.last_name} has requested to work on ${requestDate}.`,
            { requestId: workRequest.id }
        );
     }
  }

  return workRequest;
};

export const getAllWorkRequests = async (filters: any) => {
  const query = workRequestRepository.createQueryBuilder("request")
    .leftJoinAndSelect("request.staff", "staff")
    .orderBy("request.created_at", "DESC");

  if (filters.status) {
    query.andWhere("request.status = :status", { status: filters.status });
  }
  
  if (filters.staffId) {
      query.andWhere("request.staffId = :staffId", { staffId: filters.staffId });
  }

  return await query.getMany();
};

export const updateWorkRequestStatus = async (
  requestId: string,
  status: "Approved" | "Rejected",
  adminRemark?: string
) => {
  const request = await workRequestRepository.findOne({
    where: { id: requestId },
    relations: ["staff"],
  });

  if (!request) {
    throw new AppError(404, "Work request not found");
  }

  if (!["Approved", "Rejected"].includes(status)) {
    throw new AppError(400, "Status must be either 'Approved' or 'Rejected'");
  }

  // Allow status changes from:
  // 1. Pending -> Approved/Rejected
  // 2. Approved -> Rejected
  // 3. Rejected -> Approved
  const currentStatus = request.status;
  const validTransitions = ["Pending", "Approved", "Rejected"];
  
  if (!validTransitions.includes(currentStatus)) {
    throw new AppError(400, "Invalid current status");
  }

  request.status = status;
  if (adminRemark) request.adminRemark = adminRemark;

  await workRequestRepository.save(request);

  // Notify Staff
  await notificationService.createNotification(
    request.staffId,
    status === "Approved" ? NotificationType.WORK_REQUEST_APPROVED : NotificationType.WORK_REQUEST_REJECTED,
    `Your work request for ${new Date(request.requestDate).toDateString()} has been ${status}.`,
    { requestId: request.id }
  );

  return request;
};
