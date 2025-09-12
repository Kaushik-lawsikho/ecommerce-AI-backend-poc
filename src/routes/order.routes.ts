import { Router } from "express";
import {
  createOrder,
  getUserOrders,
  getOrder,
  cancelOrder,
  updateOrderStatus,
  getAllOrders
} from "../controllers/order.controller";
import { authenticateToken, isAdmin } from "../middlewares/auth.middleware";

const router = Router();

// All order routes require authentication
router.use(authenticateToken);

// User routes
router.post("/", createOrder);
router.get("/", getUserOrders);
router.get("/:id", getOrder);
router.post("/:id/cancel", cancelOrder);

// Admin routes
router.get("/all", isAdmin, getAllOrders);
router.put("/:id/status", isAdmin, updateOrderStatus);

export default router;
