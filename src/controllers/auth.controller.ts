import { Request, Response } from "express";
import { UserService } from "../services/user.service";

const userService = new UserService();

/**
 * @openapi
 * components:
 *   schemas:
 *     LoginRequest:
 *       type: object
 *       required:
 *         - usernameOrEmail
 *         - password
 *       properties:
 *         usernameOrEmail:
 *           type: string
 *           description: Username or email for authentication
 *           example: "kaushik_admin"
 *         password:
 *           type: string
 *           description: Password for authentication
 *           example: "admin123"
 *     RegisterRequest:
 *       type: object
 *       required:
 *         - username
 *         - email
 *         - password
 *       properties:
 *         username:
 *           type: string
 *           description: Unique username
 *           example: "kaushik_admin"
 *         email:
 *           type: string
 *           format: email
 *           description: User email address
 *           example: "kaushik@example.com"
 *         password:
 *           type: string
 *           minLength: 6
 *           description: User password
 *           example: "admin123"
 *         firstName:
 *           type: string
 *           description: User first name
 *           example: "Kaushik"
 *         lastName:
 *           type: string
 *           description: User last name
 *           example: "Admin"
 *         phone:
 *           type: string
 *           description: User phone number
 *           example: "+1234567890"
 *     LoginResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "Login successful"
 *         token:
 *           type: string
 *           description: JWT access token
 *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *         user:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *               example: "123e4567-e89b-12d3-a456-426614174000"
 *             username:
 *               type: string
 *               example: "kaushik_admin"
 *             email:
 *               type: string
 *               example: "kaushik@example.com"
 *             role:
 *               type: string
 *               example: "admin"
 *             firstName:
 *               type: string
 *               example: "Kaushik"
 *             lastName:
 *               type: string
 *               example: "Admin"
 *     RegisterResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "User registered successfully"
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
 *             role:
 *               type: string
 *             firstName:
 *               type: string
 *             lastName:
 *               type: string
 *     LogoutResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "Logout successful"
 */

/**
 * @openapi
 * tags:
 *   - name: Authentication
 *     description: User authentication operations
 */

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: User registration
 *     description: Register a new user account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RegisterResponse'
 *       400:
 *         description: Invalid request data or user already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User with this username or email already exists"
 */
export async function register(req: Request, res: Response) {
  try {
    const { username, email, password, firstName, lastName, phone, role } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "Username, email, and password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    const user = await userService.createUser({
      username,
      email,
      password,
      firstName,
      lastName,
      phone,
      role
    });

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
}

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: User login
 *     description: Authenticate user and return JWT token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Invalid credentials"
 */
export async function login(req: Request, res: Response) {
  try {
    const { usernameOrEmail, password } = req.body;

    if (!usernameOrEmail || !password) {
      return res.status(400).json({ message: "Username/email and password required" });
    }

    const user = await userService.authenticateUser(usernameOrEmail, password);
    const token = userService.generateToken(user);
    
    // Store token in Redis
    await userService.storeTokenInRedis(token, user);

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
  } catch (error: any) {
    res.status(401).json({ message: error.message });
  }
}

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: User logout
 *     description: Invalidate JWT token
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LogoutResponse'
 *       401:
 *         description: Unauthorized
 */
export async function logout(req: Request, res: Response) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      await userService.invalidateToken(token);
    }

    res.json({ message: "Logout successful" });
  } catch (error) {
    res.status(500).json({ message: "Logout failed" });
  }
}