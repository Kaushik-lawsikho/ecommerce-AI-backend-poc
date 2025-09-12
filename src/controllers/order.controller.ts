import { Request, Response } from "express";
import { OrderService } from "../services/order.service";
import { OrderStatus } from "../entities/order.entity";

const service = new OrderService();

/**
 * @openapi
 * components:
 *   schemas:
 *     OrderItem:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *         productId:
 *           type: string
 *           format: uuid
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *         product:
 *           $ref: '#/components/schemas/Product'
 *         quantity:
 *           type: integer
 *           example: 2
 *         unitPrice:
 *           type: number
 *           format: decimal
 *           example: 99.99
 *         totalPrice:
 *           type: number
 *           format: decimal
 *           example: 199.98
 *     Order:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *         orderNumber:
 *           type: string
 *           example: "ORD-1704067200000-abc123def"
 *         userId:
 *           type: string
 *           format: uuid
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *         user:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *             username:
 *               type: string
 *             email:
 *               type: string
 *         status:
 *           type: string
 *           enum: [pending, confirmed, shipped, delivered, cancelled]
 *           example: "pending"
 *         totalAmount:
 *           type: number
 *           format: decimal
 *           example: 199.98
 *         shippingCost:
 *           type: number
 *           format: decimal
 *           example: 10.00
 *         taxAmount:
 *           type: number
 *           format: decimal
 *           example: 20.00
 *         shippingAddress:
 *           type: string
 *           example: "123 Main St"
 *         shippingCity:
 *           type: string
 *           example: "New York"
 *         shippingPostalCode:
 *           type: string
 *           example: "10001"
 *         shippingCountry:
 *           type: string
 *           example: "USA"
 *         notes:
 *           type: string
 *           example: "Please deliver after 5 PM"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-15T10:30:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-15T10:30:00Z"
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderItem'
 *     CreateOrderRequest:
 *       type: object
 *       required:
 *         - items
 *       properties:
 *         items:
 *           type: array
 *           items:
 *             type: object
 *             required:
 *               - productId
 *               - quantity
 *             properties:
 *               productId:
 *                 type: string
 *                 format: uuid
 *                 example: "123e4567-e89b-12d3-a456-426614174000"
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 example: 2
 *         shippingAddress:
 *           type: string
 *           example: "123 Main St"
 *         shippingCity:
 *           type: string
 *           example: "New York"
 *         shippingPostalCode:
 *           type: string
 *           example: "10001"
 *         shippingCountry:
 *           type: string
 *           example: "USA"
 *         notes:
 *           type: string
 *           example: "Please deliver after 5 PM"
 *     UpdateOrderStatusRequest:
 *       type: object
 *       required:
 *         - status
 *       properties:
 *         status:
 *           type: string
 *           enum: [pending, confirmed, shipped, delivered, cancelled]
 *           example: "confirmed"
 */

/**
 * @openapi
 * tags:
 *   - name: Orders
 *     description: Order management operations
 */

/**
 * @openapi
 * /api/v1/orders:
 *   post:
 *     tags:
 *       - Orders
 *     summary: Create a new order
 *     description: Create a new order for the authenticated user
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateOrderRequest'
 *     responses:
 *       201:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       400:
 *         description: Invalid request data or insufficient stock
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Insufficient stock for product iPhone 15 Pro"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export async function createOrder(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const order = await service.createOrder(user.id, req.body);
    res.status(201).json(order);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
}

/**
 * @openapi
 * /api/v1/orders:
 *   get:
 *     tags:
 *       - Orders
 *     summary: Get user orders
 *     description: Get orders for the authenticated user with pagination
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         description: Number of orders per page
 *         example: 10
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 orders:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *                 total:
 *                   type: integer
 *                   example: 5
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 limit:
 *                   type: integer
 *                   example: 10
 *                 totalPages:
 *                   type: integer
 *                   example: 1
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export async function getUserOrders(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    
    const result = await service.getUserOrders(user.id, page, limit);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * @openapi
 * /api/v1/orders/{id}:
 *   get:
 *     tags:
 *       - Orders
 *     summary: Get order by ID
 *     description: Get a specific order by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Order unique identifier
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: Order retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       404:
 *         description: Order not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Order not found"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export async function getOrder(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const order = await service.getOrderById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if user owns the order or is admin
    if (order.userId !== user.id && user.role !== 'admin') {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(order);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * @openapi
 * /api/v1/orders/{id}/cancel:
 *   post:
 *     tags:
 *       - Orders
 *     summary: Cancel an order
 *     description: Cancel an order (only if not delivered)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Order unique identifier
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: Order cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       400:
 *         description: Cannot cancel order
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Cannot cancel delivered order"
 *       404:
 *         description: Order not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export async function cancelOrder(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const order = await service.getOrderById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if user owns the order or is admin
    if (order.userId !== user.id && user.role !== 'admin') {
      return res.status(403).json({ message: "Access denied" });
    }

    const cancelledOrder = await service.cancelOrder(req.params.id);
    res.json(cancelledOrder);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
}

/**
 * @openapi
 * /api/v1/orders/{id}/status:
 *   put:
 *     tags:
 *       - Orders
 *     summary: Update order status
 *     description: Update order status (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Order unique identifier
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateOrderStatusRequest'
 *     responses:
 *       200:
 *         description: Order status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Order not found
 *       500:
 *         description: Internal server error
 */
export async function updateOrderStatus(req: Request, res: Response) {
  try {
    const { status } = req.body;
    const updatedOrder = await service.updateOrderStatus(req.params.id, status);
    
    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(updatedOrder);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
}

/**
 * @openapi
 * /api/v1/orders/all:
 *   get:
 *     tags:
 *       - Orders
 *     summary: Get all orders
 *     description: Get all orders with pagination (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         description: Number of orders per page
 *         example: 10
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 orders:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *                 total:
 *                   type: integer
 *                   example: 25
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 limit:
 *                   type: integer
 *                   example: 10
 *                 totalPages:
 *                   type: integer
 *                   example: 3
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 */
export async function getAllOrders(req: Request, res: Response) {
  try {
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    
    const result = await service.getAllOrders(page, limit);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}
