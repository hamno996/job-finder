import express from "express";
import userAuth from "../middleware/authMiddleware.js";
import { getUser, updateUser } from "../controllers/userController.js";

const router = express.Router();

router.get("/get-user", userAuth, getUser);
router.put("/update-user", userAuth, updateUser);

export default router;
