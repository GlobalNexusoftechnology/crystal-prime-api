import express from 'express';
import {
  createEILogTypeHandler,
  getAllEILogTypesHandler,
  getEILogTypeByIdHandler,
  updateEILogTypeHandler,
  deleteEILogTypeHandler,
} from '../controllers';
import { deserializeUser, requireUser, validate } from '../middleware';
import { eilogTypeSchema } from '../schemas/eilog-type.schema';

const router = express.Router();

router.use(deserializeUser, requireUser);

/**this route handles create new EI log type */
router.post('/', validate(eilogTypeSchema), createEILogTypeHandler);

/**this route handles get all EI log type */
router.get('/', getAllEILogTypesHandler);

/**this route handles get EI log type detail by id */
router.get('/:id', getEILogTypeByIdHandler);

/**this route handles update EI log type by id */
router.put('/:id', validate(eilogTypeSchema), updateEILogTypeHandler);

/**this route handles soft delete EI log type by id */
router.delete('/:id', deleteEILogTypeHandler);

export default router; 