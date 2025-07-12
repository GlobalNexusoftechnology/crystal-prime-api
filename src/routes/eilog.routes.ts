import express from 'express';
import {
  createEILogHandler,
  getAllEILogsHandler,
  getEILogByIdHandler,
  updateEILogHandler,
  deleteEILogHandler,
} from '../controllers';
import { deserializeUser, requireUser, validate } from '../middleware';
import { eilogSchema, eilogUpdateSchema } from '../schemas/eilog.schema';

const router = express.Router();

router.use(deserializeUser, requireUser);

/**this route handles create new EI log */
router.post('/', validate(eilogSchema), createEILogHandler);

/**this route handles get all EI logs (with filters) */
router.get('/', getAllEILogsHandler);

/**this route handles get EI log detail by id */
router.get('/:id', getEILogByIdHandler);

/**this route handles update EI log by id */
router.put('/:id', validate(eilogUpdateSchema), updateEILogHandler);

/**this route handles soft delete EI log by id */
router.delete('/:id', deleteEILogHandler);

export default router; 