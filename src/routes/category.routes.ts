import { Router } from "express";
import {
  listCategories,
  getCategory,
  getCategoryProducts,
  createCategory,
  updateCategory,
  deleteCategory
} from "../controllers/category.controller";
import { authenticateToken, isAdmin } from "../middlewares/auth.middleware";

const router = Router();

// Public routes (no authentication required)
router.get("/", listCategories);
router.get("/:id", getCategory);
router.get("/:id/products", getCategoryProducts);

// Protected routes (authentication required)
router.post("/", authenticateToken, isAdmin, createCategory);
router.put("/:id", authenticateToken, isAdmin, updateCategory);
router.delete("/:id", authenticateToken, isAdmin, deleteCategory);

export default router;
