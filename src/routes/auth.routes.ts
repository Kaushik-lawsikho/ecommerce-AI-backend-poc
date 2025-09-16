import { Router } from "express";
import { login, logout, register } from "../controllers/auth.controller";
import { createValidationMiddleware } from "../middlewares/validation.middleware";
import { RegisterDto, LoginDto } from "../dto/validation.dto";
import { createRateLimit } from "../middlewares/security.middleware";

const router = Router();

// Rate limiting for auth endpoints
const authRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 50, // 50 attempts per window (increased for testing)
  keyGenerator: (req) => `auth:${req.ip}`
});

// Registration with validation
router.post("/register", 
  authRateLimit,
  createValidationMiddleware(RegisterDto),
  register
);

// Login with validation
router.post("/login", 
  authRateLimit,
  createValidationMiddleware(LoginDto),
  login
);

// Logout
router.post("/logout", logout);

export default router;