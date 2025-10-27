import express from "express";
import { verifyRole, verifyToken } from "../middleware/authMiddleware.js";
import { createUser, deleteUser, getProfile, getUsers, updateUser, updateProfile, deleteProfile } from "../controllers/userControler.js";

const router = express.Router();

// Only admin can see all users
router.get("/", verifyToken, verifyRole("admin"), getUsers);

// Only admin can create a user
router.post("/", verifyToken, verifyRole("admin"), createUser);

// Only admin can update a user
router.put("/:id", verifyToken, verifyRole("admin"), updateUser);

// Only admin can delete a user
router.delete("/:id", verifyToken, verifyRole("admin"), deleteUser);

// Any logged-in user can see their profile
router.get("/me", verifyToken, getProfile);

// Any logged-in user can update their profile
router.put("/me", verifyToken, updateProfile);

// Any logged-in user can delete their profile
router.delete("/me", verifyToken, deleteProfile);

export default router;
