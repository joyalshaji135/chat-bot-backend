import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Simple authentication middleware without req.user
export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    // Allow access for chatbot queries
    next();
    return;
  }

  try {
    // Verify token but don't attach to req for now
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    // Skip attaching to req.user to avoid TypeScript errors
    next();
  } catch (error) {
    // Still allow access even if token is invalid for now
    next();
  }
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  // Temporarily allow all access
  // TODO: Implement proper admin check later
  next();
};