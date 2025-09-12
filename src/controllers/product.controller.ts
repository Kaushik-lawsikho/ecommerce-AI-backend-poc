import { Request, Response } from "express";
import { ProductService } from "../services/product.service";

const service = new ProductService();

/**
 * @openapi
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       required:
 *         - name
 *         - price
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the product
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *         name:
 *           type: string
 *           maxLength: 255
 *           description: Product name
 *           example: "iPhone 15 Pro"
 *         description:
 *           type: string
 *           description: Product description
 *           example: "Latest iPhone with advanced features"
 *         price:
 *           type: number
 *           format: decimal
 *           minimum: 0
 *           description: Product price
 *           example: 999.99
 *         isAvailable:
 *           type: boolean
 *           description: Whether the product is available for purchase
 *           example: true
 *         imageUrl:
 *           type: string
 *           description: URL to product image
 *           example: "https://example.com/iphone15.jpg"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Product creation timestamp
 *           example: "2024-01-15T10:30:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Product last update timestamp
 *           example: "2024-01-15T10:30:00Z"
 *     CreateProductRequest:
 *       type: object
 *       required:
 *         - name
 *         - price
 *       properties:
 *         name:
 *           type: string
 *           maxLength: 255
 *           description: Product name
 *           example: "iPhone 15 Pro"
 *         description:
 *           type: string
 *           description: Product description
 *           example: "Latest iPhone with advanced features"
 *         price:
 *           type: number
 *           format: decimal
 *           minimum: 0
 *           description: Product price
 *           example: 999.99
 *         isAvailable:
 *           type: boolean
 *           description: Whether the product is available for purchase
 *           example: true
 *         imageUrl:
 *           type: string
 *           description: URL to product image
 *           example: "https://example.com/iphone15.jpg"
 *     UpdateProductRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           maxLength: 255
 *           description: Product name
 *           example: "iPhone 15 Pro"
 *         description:
 *           type: string
 *           description: Product description
 *           example: "Latest iPhone with advanced features"
 *         price:
 *           type: number
 *           format: decimal
 *           minimum: 0
 *           description: Product price
 *           example: 999.99
 *         isAvailable:
 *           type: boolean
 *           description: Whether the product is available for purchase
 *           example: true
 *         imageUrl:
 *           type: string
 *           description: URL to product image
 *           example: "https://example.com/iphone15.jpg"
 *     Error:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Error message
 *           example: "Product not found"
 *   securitySchemes:
 *     sessionAuth:
 *       type: apiKey
 *       in: cookie
 *       name: connect.sid
 *       description: Session cookie for authentication
 */

/**
 * @openapi
 * tags:
 *   - name: Products
 *     description: Product management operations
 */

/**
 * @openapi
 * /api/v1/products:
 *   get:
 *     tags:
 *       - Products
 *     summary: Get all products
 *     description: Retrieve a list of all available products
 *     responses:
 *       200:
 *         description: List of products retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 *             example:
 *               - id: "123e4567-e89b-12d3-a456-426614174000"
 *                 name: "iPhone 15 Pro"
 *                 description: "Latest iPhone with advanced features"
 *                 price: 999.99
 *                 isAvailable: true
 *                 imageUrl: "https://example.com/iphone15.jpg"
 *                 createdAt: "2024-01-15T10:30:00Z"
 *                 updatedAt: "2024-01-15T10:30:00Z"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function listProducts(req: Request, res: Response) {
  const products = await service.listAll();
  res.json(products);
}

/**
 * @openapi
 * /api/v1/products/{id}:
 *   get:
 *     tags:
 *       - Products
 *     summary: Get product by ID
 *     description: Retrieve a specific product by its unique identifier
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product unique identifier
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: Product retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "Product not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function getProduct(req: Request, res: Response) {
  const p = await service.findById(req.params.id);
  if (!p) return res.status(404).json({ message: "Not found" });
  return res.json(p);
}

/**
 * @openapi
 * /api/v1/products:
 *   post:
 *     tags:
 *       - Products
 *     summary: Create a new product
 *     description: Create a new product (Admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateProductRequest'
 *           example:
 *             name: "iPhone 15 Pro"
 *             description: "Latest iPhone with advanced features"
 *             price: 999.99
 *             isAvailable: true
 *             imageUrl: "https://example.com/iphone15.jpg"
 *     responses:
 *       201:
 *         description: Product created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Invalid request data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Valid JWT token required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function createProduct(req: Request, res: Response) {
  const created = await service.create(req.body);
  res.status(201).json(created);
}

/**
 * @openapi
 * /api/v1/products/{id}:
 *   put:
 *     tags:
 *       - Products
 *     summary: Update a product
 *     description: Update an existing product by ID (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product unique identifier
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProductRequest'
 *           example:
 *             name: "iPhone 15 Pro Max"
 *             price: 1099.99
 *             isAvailable: false
 *     responses:
 *       200:
 *         description: Product updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Invalid request data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Valid JWT token required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function updateProduct(req: Request, res: Response) {
  const updated = await service.update(req.params.id, req.body);
  res.json(updated);
}

/**
 * @openapi
 * /api/v1/products/{id}:
 *   delete:
 *     tags:
 *       - Products
 *     summary: Delete a product
 *     description: Delete a product by ID (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product unique identifier
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       204:
 *         description: Product deleted successfully
 *       401:
 *         description: Unauthorized - Valid JWT token required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function deleteProduct(req: Request, res: Response) {
  await service.remove(req.params.id);
  res.status(204).send();
}

/**
 * @openapi
 * /api/products/search:
 *   get:
 *     tags:
 *       - Products
 *     summary: Search products
 *     description: Search and filter products with pagination
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for product name or description
 *         example: "iPhone"
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by category ID
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *           format: decimal
 *         description: Minimum price filter
 *         example: 100.00
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *           format: decimal
 *         description: Maximum price filter
 *         example: 1000.00
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of products per page
 *         example: 10
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 products:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *                 total:
 *                   type: integer
 *                   description: Total number of products matching the search
 *                   example: 25
 *                 page:
 *                   type: integer
 *                   description: Current page number
 *                   example: 1
 *                 limit:
 *                   type: integer
 *                   description: Number of products per page
 *                   example: 10
 *                 totalPages:
 *                   type: integer
 *                   description: Total number of pages
 *                   example: 3
 *       500:
 *         description: Internal server error
 */
export async function searchProducts(req: Request, res: Response) {
  try {
    const filters = {
      search: req.query.search as string,
      categoryId: req.query.categoryId as string,
      minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
      maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10
    };

    const result = await service.search(filters);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * @openapi
 * /api/products/featured:
 *   get:
 *     tags:
 *       - Products
 *     summary: Get featured products
 *     description: Retrieve a list of featured products
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 8
 *         description: Number of featured products to return
 *         example: 8
 *     responses:
 *       200:
 *         description: Featured products retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 *       500:
 *         description: Internal server error
 */
export async function getFeaturedProducts(req: Request, res: Response) {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 8;
    const products = await service.getFeaturedProducts(limit);
    res.json(products);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}