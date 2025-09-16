import { Router } from "express";
import {
  listProducts, getProduct, createProduct, updateProduct, deleteProduct,
  searchProducts, getFeaturedProducts
} from "../controllers/product.controller";
import { authenticateToken, isAdmin } from "../middlewares/auth.middleware";
import { createValidationMiddleware, validateQueryParams, validatePathParams, validators } from "../middlewares/validation.middleware";
import { CreateProductDto, UpdateProductDto, SearchProductsDto } from "../dto/validation.dto";
import { createRateLimit, xssProtection, sqlInjectionProtection, requestSizeLimit } from "../middlewares/security.middleware";

const router = Router();

// Security middleware for all routes
router.use(xssProtection);
router.use(sqlInjectionProtection);
router.use(requestSizeLimit(2 * 1024 * 1024)); // 2MB limit

// Rate limiting
const generalRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100 // 100 requests per window
});

const adminRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 20 // 20 requests per window for admin operations
});

// Public routes (no authentication required)
router.get("/", generalRateLimit, listProducts);
router.get("/search", 
  generalRateLimit,
  validateQueryParams(['search', 'categoryId', 'minPrice', 'maxPrice', 'page', 'limit']),
  createValidationMiddleware(SearchProductsDto, { skipMissingProperties: true }),
  searchProducts
);
router.get("/featured", 
  generalRateLimit,
  validateQueryParams(['limit']),
  getFeaturedProducts
);
router.get("/:id", 
  generalRateLimit,
  validatePathParams({ id: validators.uuid }),
  getProduct
);

// Protected routes (authentication required)
router.post("/", 
  adminRateLimit,
  authenticateToken, 
  isAdmin, 
  createValidationMiddleware(CreateProductDto),
  createProduct
);
router.put("/:id", 
  adminRateLimit,
  authenticateToken, 
  isAdmin, 
  validatePathParams({ id: validators.uuid }),
  createValidationMiddleware(UpdateProductDto, { skipMissingProperties: true }),
  updateProduct
);
router.delete("/:id", 
  adminRateLimit,
  authenticateToken, 
  isAdmin, 
  validatePathParams({ id: validators.uuid }),
  deleteProduct
);

export default router;