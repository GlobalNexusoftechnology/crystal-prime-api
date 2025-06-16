import { Router } from "express";
import { projectTaskMasterController } from "../controllers/task-master.controller";

const router = Router();
const controller = projectTaskMasterController();

router.post('/', controller.createTaskController);
router.get('/', controller.getAllTasksController);
router.get('/:id', controller.getTaskByIdController);
router.put('/:id', controller.updateTaskController);
router.delete('/:id', controller.deleteTaskController);

export default router;
