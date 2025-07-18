import express from "express";
import { TaskCommentController } from "../controllers/task-comment.controller";
import { deserializeUser, requireUser } from "../middleware";
import { validate } from "../middleware/validate";
import { createTaskCommentSchema, updateTaskCommentSchema, getTaskCommentsSchema } from "../schemas/task-comment.schema";

const router = express.Router();

// Call the controller function to get the methods
const controller = TaskCommentController();

router.use(deserializeUser, requireUser);

// Create a new task comment
router.post(
    "/",
    validate(createTaskCommentSchema),
    controller.createTaskComment
);

// Get all comments for a specific task
router.get(
    "/task/:task_id",
    validate(getTaskCommentsSchema),
    controller.getTaskComments
);

// Get a specific task comment by ID
router.get(
    "/:id",
    controller.getTaskCommentById
);

// Update a task comment
router.patch(
    "/:id",
    validate(updateTaskCommentSchema),
    controller.updateTaskComment
);

// Delete a task comment
router.delete(
    "/:id",
    controller.deleteTaskComment
);

export default router; 