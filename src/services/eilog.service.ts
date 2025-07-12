import { AppDataSource } from '../utils/data-source';
import AppError from '../utils/appError';
import { EILog, EILogType, EILogHead, User } from '../entities';
import { EILogInput, EILogUpdateInput } from 'schemas/eilog.schema';
import ExcelJS from "exceljs";

const eilogRepository = AppDataSource.getRepository(EILog);
const eilogTypeRepository = AppDataSource.getRepository(EILogType);
const eilogHeadRepository = AppDataSource.getRepository(EILogHead);
const userRepository = AppDataSource.getRepository(User);

// Create a new EILog
export const createEILog = async (payload: EILogInput, userId: string) => {
  // Only one of income or expense can be present in a single log, and at least one must be present
  if ((!payload.income && !payload.expense) || (payload.income && payload.expense)) {
    throw new AppError(400, 'Either income or expense must be present, but not both');
  }

  const eilogType = await eilogTypeRepository.findOneBy({ id: payload.eilogType });
  if (!eilogType) throw new AppError(404, 'EILogType not found');
  const eilogHead = await eilogHeadRepository.findOneBy({ id: payload.eilogHead });
  if (!eilogHead) throw new AppError(404, 'EILogHead not found');
  const user = await userRepository.findOneBy({ id: userId });
  if (!user) throw new AppError(404, 'User not found');
  const eilog = eilogRepository.create({
    eilogType,
    eilogHead,
    createdBy: user,
    paymentMode: payload.paymentMode,
    description: payload.description,
    income: payload.income,
    expense: payload.expense,
    attachment: payload.attachment,
  } as Partial<EILog>);
  
  const savedEIlog =  await eilogRepository.save(eilog);

    return {
      id: savedEIlog.id,
      eilogType: eilogType.name,
      eilogHead: eilogHead.name,
      created_at: savedEIlog.created_at,
      updated_at: savedEIlog.updated_at,
      paymentMode: savedEIlog.paymentMode,
      description: savedEIlog.description,
      income: savedEIlog.income,
      expense: savedEIlog.expense,
      attachment: savedEIlog.attachment,
    }
};

export const getAllEILogs = async (filters: any = {}, userId: string) => {
  const page = Number(filters.page) > 0 ? Number(filters.page) : 1;
  const limit = Number(filters.limit) > 0 ? Number(filters.limit) : 10;
  const skip = (page - 1) * limit;

  const qb = eilogRepository.createQueryBuilder('eilog')
    .leftJoin('eilog.eilogType', 'eilogType')
    .leftJoin('eilog.eilogHead', 'eilogHead')
    .where('eilog.deleted = :deleted', { deleted: false })
    .andWhere('eilog.created_by = :userId', { userId });

  // Filters
  if (filters.eilogType) {
    qb.andWhere('eilogType.id = :eilogType', { eilogType: filters.eilogType });
  }
  if (filters.eilogHead) {
    qb.andWhere('eilogHead.id = :eilogHead', { eilogHead: filters.eilogHead });
  }
  if (filters.paymentMode) {
    qb.andWhere('eilog.paymentMode = :paymentMode', { paymentMode: filters.paymentMode });
  }
  if (filters.startDate && filters.endDate) {
    qb.andWhere('eilog.created_at BETWEEN :startDate AND :endDate', {
      startDate: filters.startDate,
      endDate: filters.endDate,
    });
  } else if (filters.startDate) {
    qb.andWhere('eilog.created_at >= :startDate', { startDate: filters.startDate });
  } else if (filters.endDate) {
    qb.andWhere('eilog.created_at <= :endDate', { endDate: filters.endDate });
  }

  qb.orderBy('eilog.created_at', 'DESC');
  qb.skip(skip).take(limit);

  // Only select specific fields you want to return
  qb.select([
    'eilog.id',
    'eilog.description',
    'eilog.income',
    'eilog.expense',
    'eilog.paymentMode',
    'eilog.attachment',
    'eilog.created_at',
    'eilog.updated_at',
    'eilogType.id',
    'eilogType.name',
    'eilogHead.id',
    'eilogHead.name',
  ]);

  const [eilogs, total] = await qb.getManyAndCount();

  return {
    data: eilogs.map((e: any) => ({
      id: e.id,
      description: e.description,
      income: e.income,
      expense: e.expense,
      paymentMode: e.paymentMode,
      attachment: e.attachment,
      created_at: e.created_at,
      updated_at: e.updated_at,
      eilogType: {
        id: e.eilogType?.id,
        name: e.eilogType?.name,
      },
      eilogHead: {
        id: e.eilogHead?.id,
        name: e.eilogHead?.name,
      },
    })),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};


// Get a single EILog by ID - only allow access if user is the creator
export const getEILogById = async (id: string, userId: string) => {
  const eilog = await eilogRepository
    .createQueryBuilder('eilog')
    .leftJoinAndSelect('eilog.eilogType', 'eilogType')
    .leftJoinAndSelect('eilog.eilogHead', 'eilogHead')
    .leftJoin('eilog.createdBy', 'createdBy')
    .where('eilog.id = :id', { id })
    .andWhere('eilog.deleted = :deleted', { deleted: false })
    .andWhere('createdBy.id = :userId', { userId })
    .select([
      'eilog.id',
      'eilog.description',
      'eilog.income',
      'eilog.expense',
      'eilog.paymentMode',
      'eilog.attachment',
      'eilog.created_at',
      'eilog.updated_at',
      'eilogType.id',
      'eilogType.name',
      'eilogHead.id',
      'eilogHead.name'
    ])
    .getOne();

  if (!eilog) throw new AppError(404, 'EILog not found');

  return eilog;
};

// Update an existing EILog by ID (only creator can update)
export const updateEILogById = async (id: string, payload: EILogUpdateInput, userId: string) => {
  const eilog = await eilogRepository.findOne({
    where: { id },
    relations: ['createdBy', 'eilogType', 'eilogHead'],
  });
  if (!eilog || eilog.deleted) throw new AppError(404, 'EILog not found');
  if (!eilog.createdBy || eilog.createdBy.id !== userId) throw new AppError(403, 'You are not allowed to update this log');

  // Don't allow both income and expense in update payload
  if (payload.income != null && payload.expense != null) {
    throw new AppError(400, 'You cannot update both income and expense at the same time');
  }

  // Update relations if provided
  if (payload.eilogType) {
    const eilogType = await eilogTypeRepository.findOneBy({ id: payload.eilogType });
    if (!eilogType) throw new AppError(404, 'EILogType not found');
    eilog.eilogType = eilogType;
  }
  if (payload.eilogHead) {
    const eilogHead = await eilogHeadRepository.findOneBy({ id: payload.eilogHead });
    if (!eilogHead) throw new AppError(404, 'EILogHead not found');
    eilog.eilogHead = eilogHead;
  }

  // Allow user to update the income to expense and vice versa
  if (payload.expense) {
    eilog.expense = payload.expense.toString();
    eilog.income = null as any;
  } else if (payload.income) {
    eilog.income = payload.income.toString();
    eilog.expense = null as any;
  }

  // Assign the rest of the payload except income/expense
  const { income, expense, ...rest } = payload;
  Object.assign(eilog, rest);

  await eilogRepository.save(eilog);

  // Prepare response object, removing sensitive/unwanted fields
  const response: any = {
    id: eilog.id,
    description: eilog.description,
    income: eilog.income,
    expense: eilog.expense,
    paymentMode: eilog.paymentMode,
    attachment: eilog.attachment,
    created_at: eilog.created_at,
    updated_at: eilog.updated_at,
    eilogType: eilog.eilogType
      ? {
          id: eilog.eilogType.id,
          name: eilog.eilogType.name,
        }
      : undefined,
    eilogHead: eilog.eilogHead
      ? {
          id: eilog.eilogHead.id,
          name: eilog.eilogHead.name,
        }
      : undefined,
  };

  return response;
};

// Soft delete an EILog by ID (only creator can delete)
export const deleteEILogById = async (id: string, userId: string) => {
  // Find the EILog with createdBy relation
  const eilog = await eilogRepository.findOne({ where: { id }, relations: ['createdBy'] });
  if (!eilog || eilog.deleted) throw new AppError(404, 'EILog not found');
  if (!eilog.createdBy || eilog.createdBy.id !== userId) throw new AppError(403, 'You are not allowed to delete this log');
  
  // Soft delete
  eilog.deleted = true;
  eilog.deleted_at = new Date();
  await eilogRepository.save(eilog);
};

// Export EILogs to Excel
export const exportEILogsToExcel = async (
  userId: string,
  filters: any = {}
): Promise<ExcelJS.Workbook> => {
  const qb = eilogRepository.createQueryBuilder('eilog')
    .leftJoin('eilog.eilogType', 'eilogType')
    .leftJoin('eilog.eilogHead', 'eilogHead')
    .where('eilog.deleted = :deleted', { deleted: false })
    .andWhere('eilog.created_by = :userId', { userId });

  // Apply filters
  if (filters.eilogType) {
    qb.andWhere('eilogType.id = :eilogType', { eilogType: filters.eilogType });
  }
  if (filters.eilogHead) {
    qb.andWhere('eilogHead.id = :eilogHead', { eilogHead: filters.eilogHead });
  }
  if (filters.paymentMode) {
    qb.andWhere('eilog.paymentMode = :paymentMode', { paymentMode: filters.paymentMode });
  }
  if (filters.startDate && filters.endDate) {
    qb.andWhere('eilog.created_at BETWEEN :startDate AND :endDate', {
      startDate: filters.startDate,
      endDate: filters.endDate,
    });
  } else if (filters.startDate) {
    qb.andWhere('eilog.created_at >= :startDate', { startDate: filters.startDate });
  } else if (filters.endDate) {
    qb.andWhere('eilog.created_at <= :endDate', { endDate: filters.endDate });
  }

  qb.orderBy('eilog.created_at', 'DESC');

  qb.select([
    'eilog.id',
    'eilog.description',
    'eilog.income',
    'eilog.expense',
    'eilog.paymentMode',
    'eilog.attachment',
    'eilog.created_at',
    'eilog.updated_at',
    'eilogType.id',
    'eilogType.name',
    'eilogHead.id',
    'eilogHead.name',
  ]);

  const eilogs = await qb.getMany();

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("EILogs");

  worksheet.columns = [
    { header: "Sr No", key: "sr_no", width: 6 },
    { header: "EILog Type", key: "eilog_type", width: 20 },
    { header: "EILog Head", key: "eilog_head", width: 20 },
    { header: "Description", key: "description", width: 40 },
    { header: "Income", key: "income", width: 15 },
    { header: "Expense", key: "expense", width: 15 },
    { header: "Payment Mode", key: "payment_mode", width: 15 },
    { header: "Attachment", key: "attachment", width: 30 },
    { header: "Created At", key: "created_at", width: 25 },
  ];

  // Bold the header row
  worksheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true };
  });

  let rowIndex = 1;
  eilogs.forEach((eilog: any) => {
    worksheet.addRow({
      sr_no: rowIndex++,
      eilog_type: eilog.eilogType?.name || "N/A",
      eilog_head: eilog.eilogHead?.name || "N/A",
      description: eilog.description || "N/A",
      income: eilog.income || "N/A",
      expense: eilog.expense || "N/A",
      payment_mode: eilog.paymentMode || "N/A",
      attachment: eilog.attachment || "N/A",
      created_at: eilog.created_at?.toLocaleString() || "N/A",
    });
  });

  return workbook;
};

// Generate EILog Template
export const generateEILogTemplate = async (): Promise<ExcelJS.Workbook> => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("EILogs");

  // Use the same headers as exportEILogsToExcel for consistency
  worksheet.columns = [
    { header: "EILog Type", key: "eilog_type", width: 20 },
    { header: "EILog Head", key: "eilog_head", width: 20 },
    { header: "Description", key: "description", width: 40 },
    { header: "Income", key: "income", width: 15 },
    { header: "Expense", key: "expense", width: 15 },
    { header: "Payment Mode", key: "payment_mode", width: 15 },
    { header: "Attachment", key: "attachment", width: 30 },
  ];

  // Bold the header row
  worksheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true };
  });

  return workbook;
};

// Service to handle Excel upload for EILogs
export const uploadEILogsFromExcelService = async (
  fileBuffer: Buffer,
  user: User
) => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(fileBuffer);
  const worksheet = workbook.worksheets[0];

  const headers: string[] = [];
  worksheet.getRow(1).eachCell((cell) => {
    headers.push(cell.text.toLowerCase().trim().replace(/\s+/g, "_"));
  });

  const requiredFields = ["eilog_type", "eilog_head", "payment_mode"];
  const missingFields = requiredFields.filter(
    (field) => !headers.includes(field)
  );
  if (missingFields.length > 0) {
    throw new AppError(
      400,
      `Missing required fields: ${missingFields.join(", ")}`
    );
  }

  const eilogsToInsert: any[] = [];
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;

    const eilogData: any = {};
    headers.forEach((header, colIndex) => {
      const cell = row.getCell(colIndex + 1);
      const cellValue = cell.value;
      let value = "";
      if (
        cellValue &&
        typeof cellValue === "object" &&
        "text" in cellValue &&
        cellValue.text &&
        typeof cellValue.text === "object" &&
        "richText" in (cellValue.text as any) &&
        Array.isArray((cellValue.text as any).richText)
      ) {
        value = ((cellValue.text as any).richText as any[]).map((rt: any) => rt.text).join("");
      } else if (
        cellValue &&
        typeof cellValue === "object" &&
        "text" in cellValue &&
        typeof (cellValue as any).text === "string"
      ) {
        value = (cellValue as any).text;
      } else {
        value = cell.text || "";
      }
      eilogData[header] = value;
    });

    eilogData._rowNumber = rowNumber;
    eilogsToInsert.push(eilogData);
  });

  const savedEILogs = [];

  const isNA = (val: string | null | undefined): boolean =>
    !val || ["na", "n/a", "NA", "N/A"].includes(val.toString().trim().toLowerCase());

  for (const data of eilogsToInsert) {
    const rowNumber = data._rowNumber;

    const incomeRaw = data.income?.toString() ?? "";
    const expenseRaw = data.expense?.toString() ?? "";
    const incomeValid = !isNA(incomeRaw);
    const expenseValid = !isNA(expenseRaw);

    if (!incomeValid && !expenseValid) {
      throw new AppError(
        400,
        `Either income or expense must be provided at row ${rowNumber}`
      );
    }

    if (incomeValid && expenseValid) {
      throw new AppError(
        400,
        `Cannot have both income and expense at row ${rowNumber}`
      );
    }

    if (!data.eilog_type || isNA(data.eilog_type)) {
      throw new AppError(400, `EILog Type is required at row ${rowNumber}`);
    }

    if (!data.eilog_head || isNA(data.eilog_head)) {
      throw new AppError(400, `EILog Head is required at row ${rowNumber}`);
    }

    if (!data.payment_mode || isNA(data.payment_mode)) {
      throw new AppError(400, `Payment Mode is required at row ${rowNumber}`);
    }

    const eilogType = await eilogTypeRepository.findOne({
      where: { name: String(data.eilog_type).trim() },
    });
    if (!eilogType) {
      throw new AppError(
        400,
        `Invalid EILog Type name at row ${rowNumber}: ${data.eilog_type}`
      );
    }

    const eilogHead = await eilogHeadRepository.findOne({
      where: { name: String(data.eilog_head).trim() },
    });
    if (!eilogHead) {
      throw new AppError(
        400,
        `Invalid EILog Head name at row ${rowNumber}: ${data.eilog_head}`
      );
    }

    const eilog = eilogRepository.create({
      eilogType,
      eilogHead,
      createdBy: user,
      paymentMode: data.payment_mode || null,
      description: data.description || null,
      income: incomeValid ? incomeRaw : null,
      expense: expenseValid ? expenseRaw : null,
      attachment: data.attachment || null,
    } as Partial<EILog>);

    const saved = await eilogRepository.save(eilog);

    savedEILogs.push({
      id: saved.id,
      created_at: saved.created_at,
      updated_at: saved.updated_at,
      income: saved.income,
      expense: saved.expense,
      description: saved.description,
      paymentMode: saved.paymentMode,
      attachment: saved.attachment,
      eilogType: {
        id: saved.eilogType?.id,
        name: saved.eilogType?.name,
      },
      eilogHead: {
        id: saved.eilogHead?.id,
        name: saved.eilogHead?.name,
      },
    });
  }

  return { total: savedEILogs.length, eilogs: savedEILogs };
};
