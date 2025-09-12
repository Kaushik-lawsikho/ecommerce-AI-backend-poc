import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Repository } from "typeorm";
import { AppDataSource } from "../config/datasource";
import { User, UserRole } from "../entities/user.entity";
import { redisClient } from "../config/redis";

export class UserService {
  private repo: Repository<User>;
  private readonly JWT_SECRET = process.env.JWT_SECRET || "04fbf3366aac3fecf50d6c2760c3cdfec0a8281010a79ee928c8482783596028";
  private readonly TOKEN_EXPIRY = "24h";
  private readonly SALT_ROUNDS = 12;

  constructor() {
    this.repo = AppDataSource.getRepository(User);
  }

  async createUser(userData: {
    username: string;
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    role?: UserRole | string;
  }) {
    // Check if user already exists
    const existingUser = await this.repo.findOne({
      where: [
        { username: userData.username },
        { email: userData.email }
      ]
    });

    if (existingUser) {
      throw new Error("User with this username or email already exists");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, this.SALT_ROUNDS);

    // Convert string role to UserRole enum if needed
    let userRole = UserRole.USER;
    if (userData.role) {
      if (typeof userData.role === 'string') {
        userRole = userData.role.toLowerCase() === 'admin' ? UserRole.ADMIN : UserRole.USER;
      } else {
        userRole = userData.role;
      }
    }

    // Create user
    const user = this.repo.create({
      ...userData,
      password: hashedPassword,
      role: userRole
    });

    return await this.repo.save(user);
  }

  async authenticateUser(usernameOrEmail: string, password: string) {
    const user = await this.repo.findOne({
      where: [
        { username: usernameOrEmail },
        { email: usernameOrEmail }
      ]
    });
    
    if (!user) {
      throw new Error("User not found");
    }

    if (!user.isActive) {
      throw new Error("User account is deactivated");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error("Invalid password");
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName
    };
  }

  async getUserById(id: string) {
    return await this.repo.findOne({ where: { id } });
  }

  async updateUser(id: string, updateData: Partial<User>) {
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, this.SALT_ROUNDS);
    }
    
    await this.repo.update(id, updateData);
    return await this.getUserById(id);
  }

  generateToken(user: { username: string; role: string }) {
    const payload = {
      username: user.username,
      role: user.role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    };

    return jwt.sign(payload, this.JWT_SECRET);
  }

  async storeTokenInRedis(token: string, user: { username: string; role: string }) {
    const key = `token:${token}`;
    await redisClient.setex(key, 24 * 60 * 60, JSON.stringify(user)); // 24 hours expiry
  }

  async getTokenFromRedis(token: string) {
    const key = `token:${token}`;
    const userData = await redisClient.get(key);
    return userData ? JSON.parse(userData) : null;
  }

  async invalidateToken(token: string) {
    const key = `token:${token}`;
    await redisClient.del(key);
  }

  verifyToken(token: string) {
    try {
      return jwt.verify(token, this.JWT_SECRET) as any;
    } catch (error) {
      throw new Error("Invalid token");
    }
  }
}