import express from 'express';
import {
  createEILogHeadHandler,
  getAllEILogHeadsHandler,
  getEILogHeadByIdHandler,
  updateEILogHeadHandler,
  deleteEILogHeadHandler,
} from '../controllers';
import { deserializeUser, requireUser, validate } from '../middleware';
import { eilogHeadSchema } from '../schemas/eilog-head.schema';

const router = express.Router();

router.use(deserializeUser, requireUser);

/**this route handles create new EI log head */
router.post('/', validate(eilogHeadSchema), createEILogHeadHandler);

/**this route handles get all EI log head */
router.get('/', getAllEILogHeadsHandler);

/**this route handles get EI log head detail by id */
router.get('/:id', getEILogHeadByIdHandler);

/**this route handles update EI log head by id */
router.put('/:id', validate(eilogHeadSchema), updateEILogHeadHandler);

/**this route handles soft delete EI log head by id */
router.delete('/:id', deleteEILogHeadHandler);

export default router; 