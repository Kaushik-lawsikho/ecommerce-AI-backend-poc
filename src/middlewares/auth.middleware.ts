import { Request, Response, NextFunction } from "express";
import { UserService } from "../services/user.service";

const userService = new UserService();

export async function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }

  try {
    // First verify JWT
    const decoded = userService.verifyToken(token);
    
    // Then check Redis for token validity
    const redisUser = await userService.getTokenFromRedis(token);
    
    if (!redisUser) {
      return res.status(401).json({ message: "Token expired or invalid" });
    }

    // Add user info to request
    (req as any).user = redisUser;
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid token" });
  }
}

export async function isAdmin(req: Request, res: Response, next: NextFunction) {
  const user = (req as any)?.user;
  
  if (!user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  if (user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  
  next();
}
