import { Router } from "express";
import {
  listProducts, getProduct, createProduct, updateProduct, deleteProduct,
  searchProducts, getFeaturedProducts
} from "../controllers/product.controller";
import { authenticateToken, isAdmin } from "../middlewares/auth.middleware";

const router = Router();

// Public routes (no authentication required)
router.get("/", listProducts);
router.get("/search", searchProducts);
router.get("/featured", getFeaturedProducts);
router.get("/:id", getProduct);

// Protected routes (authentication required)
router.post("/", authenticateToken, isAdmin, createProduct);
router.put("/:id", authenticateToken, isAdmin, updateProduct);
router.delete("/:id", authenticateToken, isAdmin, deleteProduct);

export default router;