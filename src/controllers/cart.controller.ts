import { Request, Response } from "express";
import { CartService } from "../services/cart.service";

const service = new CartService();

/**
 * @openapi
 * components:
 *   schemas:
 *     CartItem:
 *       type: object
 *       properties:
 *         productId:
 *           type: string
 *           format: uuid
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *         quantity:
 *           type: integer
 *           example: 2
 *         product:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *             name:
 *               type: string
 *               example: "iPhone 15 Pro"
 *             price:
 *               type: number
 *               format: decimal
 *               example: 999.99
 *             imageUrl:
 *               type: string
 *               example: "https://example.com/iphone15.jpg"
 *     Cart:
 *       type: object
 *       properties:
 *         userId:
 *           type: string
 *           format: uuid
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CartItem'
 *         totalAmount:
 *           type: number
 *           format: decimal
 *           example: 199.98
 *         totalItems:
 *           type: integer
 *           example: 2
 *     AddToCartRequest:
 *       type: object
 *       required:
 *         - productId
 *       properties:
 *         productId:
 *           type: string
 *           format: uuid
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *         quantity:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *           example: 2
 *     UpdateCartItemRequest:
 *       type: object
 *       required:
 *         - quantity
 *       properties:
 *         quantity:
 *           type: integer
 *           minimum: 0
 *           example: 3
 */

/**
 * @openapi
 * tags:
 *   - name: Cart
 *     description: Shopping cart operations
 */

/**
 * @openapi
 * /api/v1/cart:
 *   get:
 *     tags:
 *       - Cart
 *     summary: Get user cart
 *     description: Get the current user's shopping cart
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export async function getCart(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const cart = await service.getCart(user.id);
    res.json(cart);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * @openapi
 * /api/v1/cart/items:
 *   post:
 *     tags:
 *       - Cart
 *     summary: Add item to cart
 *     description: Add a product to the user's shopping cart
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddToCartRequest'
 *     responses:
 *       200:
 *         description: Item added to cart successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
 *       400:
 *         description: Invalid request data or insufficient stock
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Insufficient stock. Available: 5"
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Product not found
 *       500:
 *         description: Internal server error
 */
export async function addToCart(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const { productId, quantity = 1 } = req.body;
    
    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    const cart = await service.addToCart(user.id, productId, quantity);
    res.json(cart);
  } catch (error: any) {
    if (error.message.includes("not found") || error.message.includes("not available")) {
      res.status(404).json({ message: error.message });
    } else if (error.message.includes("Insufficient stock")) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: error.message });
    }
  }
}

/**
 * @openapi
 * /api/v1/cart/items/{productId}:
 *   put:
 *     tags:
 *       - Cart
 *     summary: Update cart item quantity
 *     description: Update the quantity of a specific item in the cart
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
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
 *             $ref: '#/components/schemas/UpdateCartItemRequest'
 *     responses:
 *       200:
 *         description: Cart item updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
 *       400:
 *         description: Invalid request data or insufficient stock
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Item not found in cart
 *       500:
 *         description: Internal server error
 */
export async function updateCartItem(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const { productId } = req.params;
    const { quantity } = req.body;
    
    if (quantity === undefined) {
      return res.status(400).json({ message: "Quantity is required" });
    }

    const cart = await service.updateCartItem(user.id, productId, quantity);
    res.json(cart);
  } catch (error: any) {
    if (error.message.includes("not found")) {
      res.status(404).json({ message: error.message });
    } else if (error.message.includes("Insufficient stock")) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: error.message });
    }
  }
}

/**
 * @openapi
 * /api/v1/cart/items/{productId}:
 *   delete:
 *     tags:
 *       - Cart
 *     summary: Remove item from cart
 *     description: Remove a specific item from the cart
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product unique identifier
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: Item removed from cart successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Item not found in cart
 *       500:
 *         description: Internal server error
 */
export async function removeFromCart(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const { productId } = req.params;
    
    const cart = await service.removeFromCart(user.id, productId);
    res.json(cart);
  } catch (error: any) {
    if (error.message.includes("not found")) {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: error.message });
    }
  }
}

/**
 * @openapi
 * /api/v1/cart/clear:
 *   post:
 *     tags:
 *       - Cart
 *     summary: Clear cart
 *     description: Remove all items from the cart
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart cleared successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export async function clearCart(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const cart = await service.clearCart(user.id);
    res.json(cart);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}
