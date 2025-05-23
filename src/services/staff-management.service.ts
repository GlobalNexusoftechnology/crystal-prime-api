import { AppDataSource } from "../utils/data-source";
import { Staff } from "../entities/staff-management.entity";
import AppError from "../utils/appError";

const staffRepo = AppDataSource.getRepository(Staff);

export interface StaffInput {
  first_name: string;
  last_name: string;
  email: string;
  contact: string;
  dob: string;
  role_name: string;
}

export interface GetStaffQuery {
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'id' | 'first_name' | 'last_name' | 'email' | 'created_at';
  sortOrder?: 'ASC' | 'DESC';
}

export const staffService = () => {
  //  Create Staff
  const createStaff = async (data: StaffInput) => {
    const existing = await staffRepo.findOne({ where: { email: data.email, deleted: false } });
    if (existing) throw new AppError(409, "Staff with this email already exists");

    const newStaff = staffRepo.create(data);
    return await staffRepo.save(newStaff);
  };

  //  Get All Staff
  const getAllStaff = async (params: GetStaffQuery) => {
    const {
      search = '',
      page = 1,
      limit = 10,
      sortBy = 'created_at',
      sortOrder = 'DESC',
    } = params;

    const query = staffRepo
      .createQueryBuilder('staff')
      .where('staff.deleted = false');

    if (search) {
      query.andWhere(
        '(staff.first_name ILIKE :search OR staff.last_name ILIKE :search OR staff.email ILIKE :search OR staff.contact ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    query.orderBy(`staff.${sortBy}`, sortOrder);
    query.skip((page - 1) * limit).take(limit);

    const [data, total] = await query.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  };

  //  Get Staff By ID
  const getStaffById = async (id: string) => {
    const staff = await staffRepo.findOne({ where: { id, deleted: false } });
    if (!staff) throw new AppError(404, "Staff not found");
    return staff;
  };

  //  Update Staff
  const updateStaff = async (id: string, data: Partial<StaffInput>) => {
    const staffEntity = await staffRepo.findOne({ where: { id, deleted: false } });
    if (!staffEntity) throw new AppError(404, "Staff not found");

    Object.assign(staffEntity, data);

    return await staffRepo.save(staffEntity);
  };

  //  Soft Delete Staff
  const softDeleteStaff = async (id: string) => {
    const staff = await staffRepo.findOne({ where: { id, deleted: false } });
    if (!staff) throw new AppError(404, "Staff not found");

    staff.deleted = true;
    staff.deleted_at = new Date();

    return await staffRepo.save(staff);
  };

  return {
    createStaff,
    getAllStaff,
    getStaffById,
    updateStaff,
    softDeleteStaff,
  };
};
