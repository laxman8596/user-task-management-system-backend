import express from "express";
import { verifyToken, verifyRole } from "../middleware/authMiddleware.js";
import { getTasks, getAllTasks, createTask, updateTask, updateTaskStatus, deleteTask, adminUpdateTask, adminDeleteTask, assignTask, respondToTask, getAssignedTasks } from "../controllers/taskController.js";

const router = express.Router();

// Get all tasks for logged-in user
router.get("/", verifyToken, getTasks);

// Admin only - Get all users' tasks
router.get("/admin/all", verifyToken, verifyRole("admin"), getAllTasks);

// Create new task
router.post("/", verifyToken, createTask);

// Update task
router.put("/:id", verifyToken, updateTask);

// Update task status only
router.patch("/:id/status", verifyToken, updateTaskStatus);

// Delete task
router.delete("/:id", verifyToken, deleteTask);

// Admin task management
router.put("/admin/:id", verifyToken, verifyRole("admin"), adminUpdateTask);
router.delete("/admin/:id", verifyToken, verifyRole("admin"), adminDeleteTask);

// Task assignment
router.post("/assign", verifyToken, verifyRole("admin"), assignTask);
router.get("/assigned", verifyToken, getAssignedTasks);
router.patch("/:id/respond", verifyToken, respondToTask);

export default router;