import { Router } from "express";
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
} from "../controllers/cart.controller";
import { authenticateToken } from "../middlewares/auth.middleware";

const router = Router();

// All cart routes require authentication
router.use(authenticateToken);

router.get("/", getCart);
router.post("/items", addToCart);
router.put("/items/:productId", updateCartItem);
router.delete("/items/:productId", removeFromCart);
router.post("/clear", clearCart);

export default router;
