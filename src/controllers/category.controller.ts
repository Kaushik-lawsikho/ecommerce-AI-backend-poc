import { Request, Response } from "express";
import { CategoryService } from "../services/category.service";

const service = new CategoryService();

/**
 * @openapi
 * components:
 *   schemas:
 *     Category:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the category
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *         name:
 *           type: string
 *           maxLength: 100
 *           description: Category name
 *           example: "Electronics"
 *         description:
 *           type: string
 *           description: Category description
 *           example: "Electronic devices and accessories"
 *         imageUrl:
 *           type: string
 *           description: URL to category image
 *           example: "https://example.com/electronics.jpg"
 *         isActive:
 *           type: boolean
 *           description: Whether the category is active
 *           example: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Category creation timestamp
 *           example: "2024-01-15T10:30:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Category last update timestamp
 *           example: "2024-01-15T10:30:00Z"
 *     CreateCategoryRequest:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           maxLength: 100
 *           description: Category name
 *           example: "Electronics"
 *         description:
 *           type: string
 *           description: Category description
 *           example: "Electronic devices and accessories"
 *         imageUrl:
 *           type: string
 *           description: URL to category image
 *           example: "https://example.com/electronics.jpg"
 *     UpdateCategoryRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           maxLength: 100
 *           description: Category name
 *           example: "Electronics"
 *         description:
 *           type: string
 *           description: Category description
 *           example: "Electronic devices and accessories"
 *         imageUrl:
 *           type: string
 *           description: URL to category image
 *           example: "https://example.com/electronics.jpg"
 *         isActive:
 *           type: boolean
 *           description: Whether the category is active
 *           example: true
 */

/**
 * @openapi
 * tags:
 *   - name: Categories
 *     description: Category management operations
 */

/**
 * @openapi
 * /api/v1/categories:
 *   get:
 *     tags:
 *       - Categories
 *     summary: Get all categories
 *     description: Retrieve a list of all active categories
 *     responses:
 *       200:
 *         description: List of categories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Category'
 *       500:
 *         description: Internal server error
 */
export async function listCategories(req: Request, res: Response) {
  try {
    const categories = await service.listAll();
    res.json(categories);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * @openapi
 * /api/v1/categories/{id}:
 *   get:
 *     tags:
 *       - Categories
 *     summary: Get category by ID
 *     description: Retrieve a specific category by its unique identifier
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Category unique identifier
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: Category retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 *       404:
 *         description: Category not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Category not found"
 *       500:
 *         description: Internal server error
 */
export async function getCategory(req: Request, res: Response) {
  try {
    const category = await service.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.json(category);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * @openapi
 * /api/v1/categories/{id}/products:
 *   get:
 *     tags:
 *       - Categories
 *     summary: Get products in category
 *     description: Retrieve all products belonging to a specific category
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Category unique identifier
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 category:
 *                   $ref: '#/components/schemas/Category'
 *                 products:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *       404:
 *         description: Category not found
 *       500:
 *         description: Internal server error
 */
export async function getCategoryProducts(req: Request, res: Response) {
  try {
    const category = await service.getCategoryWithProducts(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.json(category);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * @openapi
 * /api/v1/categories:
 *   post:
 *     tags:
 *       - Categories
 *     summary: Create a new category
 *     description: Create a new category (Admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCategoryRequest'
 *     responses:
 *       201:
 *         description: Category created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 */
export async function createCategory(req: Request, res: Response) {
  try {
    const category = await service.create(req.body);
    res.status(201).json(category);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
}

/**
 * @openapi
 * /api/v1/categories/{id}:
 *   put:
 *     tags:
 *       - Categories
 *     summary: Update a category
 *     description: Update an existing category by ID (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Category unique identifier
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateCategoryRequest'
 *     responses:
 *       200:
 *         description: Category updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Category not found
 *       500:
 *         description: Internal server error
 */
export async function updateCategory(req: Request, res: Response) {
  try {
    const category = await service.update(req.params.id, req.body);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.json(category);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
}

/**
 * @openapi
 * /api/v1/categories/{id}:
 *   delete:
 *     tags:
 *       - Categories
 *     summary: Delete a category
 *     description: Delete a category by ID (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Category unique identifier
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       204:
 *         description: Category deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Category not found
 *       500:
 *         description: Internal server error
 */
export async function deleteCategory(req: Request, res: Response) {
  try {
    await service.remove(req.params.id);
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}
