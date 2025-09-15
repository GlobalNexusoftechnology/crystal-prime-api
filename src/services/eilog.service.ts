import { AppDataSource } from '../utils/data-source';
import AppError from '../utils/appError';
import { EILog, EILogType, EILogHead, User } from '../entities';
import { EILogInput, EILogUpdateInput } from 'schemas/eilog.schema';
import ExcelJS from "exceljs";

const eilogRepository = AppDataSource.getRepository(EILog);
const eilogTypeRepository = AppDataSource.getRepository(EILogType);
const eilogHeadRepository = AppDataSource.getRepository(EILogHead);
const userRepository = AppDataSource.getRepository(User);

// Helper function to check if attachment is a Cloudinary URL
const isCloudinaryUrl = (attachment: string | null | undefined): boolean => {
  if (!attachment) return false;
  return attachment.startsWith('https://res.cloudinary.com/');
};

// Helper function to convert filename to Cloudinary URL (for existing records)
const convertFilenameToCloudinaryUrl = (filename: string): string | null => {
  return null;
};

// Helper function to process attachment field
const processAttachment = (attachment: string | null | undefined): string | null => {
  if (!attachment) return null;
  
  // If it's already a Cloudinary URL, return as-is
  if (isCloudinaryUrl(attachment)) {
    return attachment;
  }
  
  return convertFilenameToCloudinaryUrl(attachment);
};

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
      createdBy: userId,
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
  console.log('Filters received:', filters); // Debug log
  const page = Number(filters.page) > 0 ? Number(filters.page) : 1;
  const limit = Number(filters.limit) > 0 ? Number(filters.limit) : 10;
  const skip = (page - 1) * limit;

  const qb = eilogRepository.createQueryBuilder('eilog')
    .leftJoin('eilog.eilogType', 'eilogType')
    .leftJoin('eilog.eilogHead', 'eilogHead')
    .leftJoinAndSelect('eilog.createdBy', 'createdBy')
    .where('eilog.deleted = :deleted', { deleted: false });

  // Role-based filtering - non-admins can only see their own logs
  if (filters.createdById) {
    qb.andWhere('createdBy.id = :createdById', { createdById: filters.createdById });
  } else {
    qb.andWhere('eilog.created_by = :userId', { userId });
  }

  // Search text filter
  if (filters.searchText) {
    qb.andWhere(
      '(eilog.description ILIKE :searchText OR eilogType.name ILIKE :searchText OR eilogHead.name ILIKE :searchText)',
      { searchText: `%${filters.searchText}%` }
    );
  }

  // EILog Type filter
  if (filters.eilogTypeId) {
    qb.andWhere('eilogType.id = :eilogTypeId', { eilogTypeId: filters.eilogTypeId });
  }

  // EILog Head filter
  if (filters.eilogHeadId) {
    qb.andWhere('eilogHead.id = :eilogHeadId', { eilogHeadId: filters.eilogHeadId });
  }

  // Payment Mode filter
  if (filters.paymentMode) {
    qb.andWhere('eilog.paymentMode = :paymentMode', { paymentMode: filters.paymentMode });
  }

  // Transaction Type filter (income/expense/both)
  if (filters.transactionType) {
    if (filters.transactionType === 'income') {
      qb.andWhere('eilog.income IS NOT NULL AND eilog.income > 0');
    } else if (filters.transactionType === 'expense') {
      qb.andWhere('eilog.expense IS NOT NULL AND eilog.expense > 0');
    }
    // 'both' means no additional filter
  }

  // Amount range filters
  if (filters.minAmount !== undefined) {
    qb.andWhere('(eilog.income >= :minAmount OR eilog.expense >= :minAmount)', { minAmount: filters.minAmount });
  }
  if (filters.maxAmount !== undefined) {
    qb.andWhere('(eilog.income <= :maxAmount OR eilog.expense <= :maxAmount)', { maxAmount: filters.maxAmount });
  }

  // Date range filters
  if (filters.dateRange && filters.referenceDate) {
    const refDate = new Date(filters.referenceDate);
    let startDate: Date | undefined;
    let endDate: Date | undefined;

    switch (filters.dateRange) {
      case 'Daily':
        startDate = new Date(refDate.setHours(0, 0, 0, 0));
        endDate = new Date(refDate.setHours(23, 59, 59, 999));
        break;
      case 'Weekly':
        const day = refDate.getDay();
        const diff = refDate.getDate() - day + (day === 0 ? -6 : 1);
        startDate = new Date(refDate.setDate(diff));
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'Monthly':
        startDate = new Date(refDate.getFullYear(), refDate.getMonth(), 1);
        endDate = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
      default:
        // 'All' - no date filter
        break;
    }

    if (startDate && endDate) {
      qb.andWhere('eilog.created_at BETWEEN :startDate AND :endDate', { startDate, endDate });
    }
  } else {
    // Custom date range
    if (filters.fromDate) {
      qb.andWhere('eilog.created_at >= :fromDate', { fromDate: filters.fromDate });
    }
    if (filters.toDate) {
      qb.andWhere('eilog.created_at <= :toDate', { toDate: filters.toDate });
    }
  }

  qb.orderBy('eilog.created_at', 'DESC');
  qb.skip(skip).take(limit);

  // Select specific fields
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
    'createdBy.id',
  ]);

  const [eilogs, total] = await qb.getManyAndCount();

  return {
    data: eilogs.map((e: any) => ({
      id: e.id,
      description: e.description,
      income: e.income,
      expense: e.expense,
      paymentMode: e.paymentMode,
      attachment: processAttachment(e.attachment),
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
      createdBy: e.createdBy?.id ?? null,
      deleted: e.deleted
    })),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};


// Get a single EILog by ID - admin can view any, user only their own
export const getEILogById = async (id: string, userId: string, role: string) => {
  const qb = eilogRepository
    .createQueryBuilder('eilog')
    .leftJoinAndSelect('eilog.eilogType', 'eilogType')
    .leftJoinAndSelect('eilog.eilogHead', 'eilogHead')
    .leftJoin('eilog.createdBy', 'createdBy')
    .where('eilog.id = :id', { id })
    .andWhere('eilog.deleted = :deleted', { deleted: false });

  if (role !== 'admin' && role !== 'Admin') {
    qb.andWhere('createdBy.id = :userId', { userId });
  }

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
    'createdBy.id',
  ]);

  const eilog = await qb.getOne();

  if (!eilog) throw new AppError(404, 'EILog not found');

  // Process attachment field
  const processedEilog = {
    ...eilog,
    createdBy: eilog.createdBy?.id ?? null,
    attachment: processAttachment(eilog.attachment),
  };

  return processedEilog;
};

// Update an existing EILog by ID (admin can update any, user only their own)
export const updateEILogById = async (id: string, payload: EILogUpdateInput, userId: string, role: string) => {
  const eilog = await eilogRepository.findOne({
    where: { id },
    relations: ['createdBy', 'eilogType', 'eilogHead'],
  });
  if (!eilog || eilog.deleted) throw new AppError(404, 'EILog not found');
  if (role !== 'admin' && role !== 'Admin') {
    if (!eilog.createdBy || eilog.createdBy.id !== userId) throw new AppError(403, 'You are not allowed to update this log');
  }

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
    attachment: processAttachment(eilog.attachment),
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

// Soft delete an EILog by ID (admin can delete any, user only their own)
export const deleteEILogById = async (id: string, userId: string, role: string) => {
  // Find the EILog with createdBy relation
  const eilog = await eilogRepository.findOne({ where: { id }, relations: ['createdBy'] });
  if (!eilog || eilog.deleted) throw new AppError(404, 'EILog not found');
  if (role !== 'admin' && role !== 'Admin') {
    if (!eilog.createdBy || eilog.createdBy.id !== userId) throw new AppError(403, 'You are not allowed to delete this log');
  }
  // Soft delete
  eilog.deleted = true;
  eilog.deleted_at = new Date();
  await eilogRepository.save(eilog);
};

// Export EILogs to Excel
export const exportEILogsToExcel = async (
  userId: string,
  role: string,
  filters: any = {}
): Promise<ExcelJS.Workbook> => {
  const isAdmin = role === 'admin' || role === 'Admin';
  const qb = eilogRepository.createQueryBuilder('eilog')
    .leftJoin('eilog.eilogType', 'eilogType')
    .leftJoin('eilog.eilogHead', 'eilogHead')
    .where('eilog.deleted = :deleted', { deleted: false });

  // Role-based filtering
  if (!isAdmin) {
    qb.andWhere('eilog.created_by = :userId', { userId });
  } else if (filters.createdById) {
    qb.andWhere('eilog.created_by = :createdById', { createdById: filters.createdById });
  }

  if (filters.searchText) {
    qb.andWhere(
      '(eilog.description ILIKE :searchText OR eilogType.name ILIKE :searchText OR eilogHead.name ILIKE :searchText)',
      { searchText: `%${filters.searchText}%` }
    );
  }
  if (filters.eilogTypeId) {
    qb.andWhere('eilogType.id = :eilogTypeId', { eilogTypeId: filters.eilogTypeId });
  }
  if (filters.eilogHeadId) {
    qb.andWhere('eilogHead.id = :eilogHeadId', { eilogHeadId: filters.eilogHeadId });
  }
  if (filters.paymentMode) {
    qb.andWhere('eilog.paymentMode = :paymentMode', { paymentMode: filters.paymentMode });
  }
  if (filters.transactionType) {
    if (filters.transactionType === 'income') {
      qb.andWhere('eilog.income IS NOT NULL AND eilog.income > 0');
    } else if (filters.transactionType === 'expense') {
      qb.andWhere('eilog.expense IS NOT NULL AND eilog.expense > 0');
    }
  }
  if (filters.minAmount !== undefined) {
    qb.andWhere('(eilog.income >= :minAmount OR eilog.expense >= :minAmount)', { minAmount: filters.minAmount });
  }
  if (filters.maxAmount !== undefined) {
    qb.andWhere('(eilog.income <= :maxAmount OR eilog.expense <= :maxAmount)', { maxAmount: filters.maxAmount });
  }
  // Date range filters
  if (filters.dateRange && filters.referenceDate) {
    const refDate = new Date(filters.referenceDate);
    let startDate: Date | undefined;
    let endDate: Date | undefined;
    switch (filters.dateRange) {
      case 'Daily':
        startDate = new Date(refDate.setHours(0, 0, 0, 0));
        endDate = new Date(refDate.setHours(23, 59, 59, 999));
        break;
      case 'Weekly':
        const day = refDate.getDay();
        const diff = refDate.getDate() - day + (day === 0 ? -6 : 1);
        startDate = new Date(refDate.setDate(diff));
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'Monthly':
        startDate = new Date(refDate.getFullYear(), refDate.getMonth(), 1);
        endDate = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
      default:
        break;
    }
    if (startDate && endDate) {
      qb.andWhere('eilog.created_at BETWEEN :startDate AND :endDate', { startDate, endDate });
    }
  } else {
    if (filters.fromDate) {
      qb.andWhere('eilog.created_at >= :fromDate', { fromDate: filters.fromDate });
    }
    if (filters.toDate) {
      qb.andWhere('eilog.created_at <= :toDate', { toDate: filters.toDate });
    }
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
  const worksheet = workbook.addWorksheet('EILogs');

  worksheet.columns = [
    { header: 'Sr No', key: 'sr_no', width: 6 },
    { header: 'EILog Type', key: 'eilog_type', width: 20 },
    { header: 'EILog Head', key: 'eilog_head', width: 20 },
    { header: 'Description', key: 'description', width: 40 },
    { header: 'Income', key: 'income', width: 15 },
    { header: 'Expense', key: 'expense', width: 15 },
    { header: 'Payment Mode', key: 'payment_mode', width: 15 },
    { header: 'Attachment', key: 'attachment', width: 30 },
    { header: 'Date', key: 'created_at', width: 25 },
  ];

  worksheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true };
  });

  let rowIndex = 1;
  eilogs.forEach((eilog: any) => {
    worksheet.addRow({
      sr_no: rowIndex++,
      eilog_type: eilog.eilogType?.name || 'N/A',
      eilog_head: eilog.eilogHead?.name || 'N/A',
      description: eilog.description || 'N/A',
      income: eilog.income || 'N/A',
      expense: eilog.expense || 'N/A',
      payment_mode: eilog.paymentMode || 'N/A',
      attachment: eilog.attachment || 'N/A',
      created_at: eilog.created_at?.toLocaleString() || 'N/A',
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
  await workbook.xlsx.load(fileBuffer as any);
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
// Get EILog statistics
export const getEILogStats = async (userId: string) => {
  const qb = eilogRepository.createQueryBuilder('eilog')
    .where('eilog.deleted = :deleted', { deleted: false })
    .andWhere('eilog.created_by = :userId', { userId });

  // Total count
  const totalCount = await qb.getCount();

  // Total income
  const totalIncome = await qb
    .select('COALESCE(SUM(CAST(eilog.income AS DECIMAL)), 0)', 'total')
    .andWhere('eilog.income IS NOT NULL AND eilog.income > 0')
    .getRawOne();

  // Total expense
  const totalExpense = await qb
    .select('COALESCE(SUM(CAST(eilog.expense AS DECIMAL)), 0)', 'total')
    .andWhere('eilog.expense IS NOT NULL AND eilog.expense > 0')
    .getRawOne();

  // Today's transactions
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayIncome = await qb
    .select('COALESCE(SUM(CAST(eilog.income AS DECIMAL)), 0)', 'total')
    .andWhere('eilog.income IS NOT NULL AND eilog.income > 0')
    .andWhere('eilog.created_at >= :today AND eilog.created_at < :tomorrow', { today, tomorrow })
    .getRawOne();

  const todayExpense = await qb
    .select('COALESCE(SUM(CAST(eilog.expense AS DECIMAL)), 0)', 'total')
    .andWhere('eilog.expense IS NOT NULL AND eilog.expense > 0')
    .andWhere('eilog.created_at >= :today AND eilog.created_at < :tomorrow', { today, tomorrow })
    .getRawOne();

  // This month's transactions
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const firstDayOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

  const monthIncome = await qb
    .select('COALESCE(SUM(CAST(eilog.income AS DECIMAL)), 0)', 'total')
    .andWhere('eilog.income IS NOT NULL AND eilog.income > 0')
    .andWhere('eilog.created_at >= :firstDay AND eilog.created_at < :lastDay', { 
      firstDay: firstDayOfMonth, 
      lastDay: firstDayOfNextMonth 
    })
    .getRawOne();

  const monthExpense = await qb
    .select('COALESCE(SUM(CAST(eilog.expense AS DECIMAL)), 0)', 'total')
    .andWhere('eilog.expense IS NOT NULL AND eilog.expense > 0')
    .andWhere('eilog.created_at >= :firstDay AND eilog.created_at < :lastDay', { 
      firstDay: firstDayOfMonth, 
      lastDay: firstDayOfNextMonth 
    })
    .getRawOne();

  return {
    totalCount,
    totalIncome: parseFloat(totalIncome?.total || '0'),
    totalExpense: parseFloat(totalExpense?.total || '0'),
    netAmount: parseFloat(totalIncome?.total || '0') - parseFloat(totalExpense?.total || '0'),
    todayIncome: parseFloat(todayIncome?.total || '0'),
    todayExpense: parseFloat(todayExpense?.total || '0'),
    todayNet: parseFloat(todayIncome?.total || '0') - parseFloat(todayExpense?.total || '0'),
    monthIncome: parseFloat(monthIncome?.total || '0'),
    monthExpense: parseFloat(monthExpense?.total || '0'),
    monthNet: parseFloat(monthIncome?.total || '0') - parseFloat(monthExpense?.total || '0'),
  };
};

// Get EILog chart data for dashboard
export const getEILogChartData = async (
  userId: string,
  role: string,
  view: 'monthly' | 'yearly' | 'weekly' = 'monthly',
  filterUserId?: string
) => {
  const qb = eilogRepository.createQueryBuilder('eilog')
    .leftJoin('eilog.createdBy', 'createdBy')
    .where('eilog.deleted = :deleted', { deleted: false });

  // Admin can filter by user, normal user only sees their own
  if (role === 'admin' || role === 'Admin') {
    if (filterUserId) {
      qb.andWhere('createdBy.id = :filterUserId', { filterUserId });
    }
  } else {
    qb.andWhere('createdBy.id = :userId', { userId });
  }

  let labels: string[] = [];
  let income: number[] = [];
  let expense: number[] = [];

  if (view === 'yearly') {
    // Group by month for the current year
    const now = new Date();
    const year = now.getFullYear();
    labels = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    for (let month = 0; month < 12; month++) {
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 1);
      const [inc, exp] = await Promise.all([
        qb.clone().andWhere('eilog.created_at >= :start AND eilog.created_at < :end', { start, end })
          .select('COALESCE(SUM(CAST(eilog.income AS DECIMAL)), 0)', 'total').getRawOne(),
        qb.clone().andWhere('eilog.created_at >= :start AND eilog.created_at < :end', { start, end })
          .select('COALESCE(SUM(CAST(eilog.expense AS DECIMAL)), 0)', 'total').getRawOne(),
      ]);
      income.push(Number(inc.total || 0));
      expense.push(Number(exp.total || 0));
    }
  } else if (view === 'monthly') {
    // Group by day for current month
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    labels = Array.from({ length: daysInMonth }, (_, i) => (i + 1).toString());
    for (let day = 1; day <= daysInMonth; day++) {
      const start = new Date(year, month, day, 0, 0, 0, 0);
      const end = new Date(year, month, day + 1, 0, 0, 0, 0);
      const [inc, exp] = await Promise.all([
        qb.clone().andWhere('eilog.created_at >= :start AND eilog.created_at < :end', { start, end })
          .select('COALESCE(SUM(CAST(eilog.income AS DECIMAL)), 0)', 'total').getRawOne(),
        qb.clone().andWhere('eilog.created_at >= :start AND eilog.created_at < :end', { start, end })
          .select('COALESCE(SUM(CAST(eilog.expense AS DECIMAL)), 0)', 'total').getRawOne(),
      ]);
      income.push(Number(inc.total || 0));
      expense.push(Number(exp.total || 0));
    }
  } else if (view === 'weekly') {
    // Group by day for current week (Mon-Sun)
    const now = new Date();
    const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1; // Monday=0
    const monday = new Date(now);
    monday.setDate(now.getDate() - dayOfWeek);
    labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    for (let i = 0; i < 7; i++) {
      const start = new Date(monday);
      start.setDate(monday.getDate() + i);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(start.getDate() + 1);
      const [inc, exp] = await Promise.all([
        qb.clone().andWhere('eilog.created_at >= :start AND eilog.created_at < :end', { start, end })
          .select('COALESCE(SUM(CAST(eilog.income AS DECIMAL)), 0)', 'total').getRawOne(),
        qb.clone().andWhere('eilog.created_at >= :start AND eilog.created_at < :end', { start, end })
          .select('COALESCE(SUM(CAST(eilog.expense AS DECIMAL)), 0)', 'total').getRawOne(),
      ]);
      income.push(Number(inc.total || 0));
      expense.push(Number(exp.total || 0));
    }
  }

  return { labels, income, expense };
};
