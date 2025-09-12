import { Router } from "express";
import { getProfile, updateProfile, changePassword } from "../controllers/user.controller";
import { authenticateToken } from "../middlewares/auth.middleware";

const router = Router();

// All user routes require authentication
router.use(authenticateToken);

router.get("/profile", getProfile);
router.put("/profile", updateProfile);
router.post("/change-password", changePassword);

export default router;
