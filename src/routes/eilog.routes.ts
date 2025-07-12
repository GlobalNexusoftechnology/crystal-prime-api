import express from 'express';
import {
  createEILogHandler,
  getAllEILogsHandler,
  getEILogByIdHandler,
  updateEILogHandler,
  deleteEILogHandler,
  exportEILogsToExcelHandler,
  downloadEILogTemplateHandler,
  uploadEILogsFromExcelHandler,
} from '../controllers';
import { deserializeUser, requireUser, validate } from '../middleware';
import { eilogSchema, eilogUpdateSchema } from '../schemas/eilog.schema';
import { excelUpload } from '../utils/upload';

const router = express.Router();

router.use(deserializeUser, requireUser);

/**this route handles create new EI log */
router.post('/', validate(eilogSchema), createEILogHandler);

/**this route handles get all EI logs (with filters) */
router.get('/', getAllEILogsHandler);

/**this route handles export EI logs to Excel */
router.get('/export/excel', exportEILogsToExcelHandler);

/**this route handles download EILog template */
router.get('/template/download', downloadEILogTemplateHandler);

/**this route handles upload EILogs from Excel */
router.post('/upload-excel', excelUpload.single('file'), uploadEILogsFromExcelHandler);

/**this route handles get EI log detail by id */
router.get('/:id', getEILogByIdHandler);

/**this route handles update EI log by id */
router.put('/:id', validate(eilogUpdateSchema), updateEILogHandler);

/**this route handles soft delete EI log by id */
router.delete('/:id', deleteEILogHandler);

export default router; 