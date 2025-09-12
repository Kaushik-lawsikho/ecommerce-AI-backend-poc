import { Request, Response } from "express";
import { UserService } from "../services/user.service";

const userService = new UserService();

/**
 * @openapi
 * components:
 *   schemas:
 *     UserProfile:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *         username:
 *           type: string
 *           example: "kaushik_admin"
 *         email:
 *           type: string
 *           example: "kaushik@example.com"
 *         firstName:
 *           type: string
 *           example: "Kaushik"
 *         lastName:
 *           type: string
 *           example: "Admin"
 *         phone:
 *           type: string
 *           example: "+1234567890"
 *         role:
 *           type: string
 *           enum: [admin, user]
 *           example: "admin"
 *         isActive:
 *           type: boolean
 *           example: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-15T10:30:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-15T10:30:00Z"
 *     UpdateProfileRequest:
 *       type: object
 *       properties:
 *         firstName:
 *           type: string
 *           example: "Kaushik"
 *         lastName:
 *           type: string
 *           example: "Admin"
 *         phone:
 *           type: string
 *           example: "+1234567890"
 *         email:
 *           type: string
 *           format: email
 *           example: "kaushik@example.com"
 *     ChangePasswordRequest:
 *       type: object
 *       required:
 *         - currentPassword
 *         - newPassword
 *       properties:
 *         currentPassword:
 *           type: string
 *           description: Current password
 *           example: "oldpassword123"
 *         newPassword:
 *           type: string
 *           minLength: 6
 *           description: New password
 *           example: "newpassword123"
 */

/**
 * @openapi
 * tags:
 *   - name: Users
 *     description: User profile management operations
 */

/**
 * @openapi
 * /api/v1/users/profile:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get user profile
 *     description: Get current user's profile information
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserProfile'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Access token required"
 */
export async function getProfile(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const userProfile = await userService.getUserById(user.id);
    
    if (!userProfile) {
      return res.status(404).json({ message: "User not found" });
    }

    // Remove password from response
    const { password, ...profile } = userProfile;
    res.json(profile);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * @openapi
 * /api/v1/users/profile:
 *   put:
 *     tags:
 *       - Users
 *     summary: Update user profile
 *     description: Update current user's profile information
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProfileRequest'
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserProfile'
 *       400:
 *         description: Invalid request data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Invalid request data"
 *       401:
 *         description: Unauthorized
 */
export async function updateProfile(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const updateData = req.body;

    // Remove fields that shouldn't be updated directly
    delete updateData.password;
    delete updateData.role;
    delete updateData.id;
    delete updateData.createdAt;

    const updatedUser = await userService.updateUser(user.id, updateData);
    
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Remove password from response
    const { password, ...profile } = updatedUser;
    res.json(profile);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
}

/**
 * @openapi
 * /api/v1/users/change-password:
 *   post:
 *     tags:
 *       - Users
 *     summary: Change user password
 *     description: Change current user's password
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChangePasswordRequest'
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Password changed successfully"
 *       400:
 *         description: Invalid request data or current password incorrect
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Current password is incorrect"
 *       401:
 *         description: Unauthorized
 */
export async function changePassword(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current password and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters long" });
    }

    // Verify current password
    const userData = await userService.getUserById(user.id);
    if (!userData) {
      return res.status(404).json({ message: "User not found" });
    }

    const bcrypt = require('bcryptjs');
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, userData.password);
    
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Update password
    await userService.updateUser(user.id, { password: newPassword });

    res.json({ message: "Password changed successfully" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}
