import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuthRequest extends Request {
  userId?: string;
  tenantId?: string;
  user?: any;
}

export async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Missing or invalid authorization header' });
      return;
    }

    const token = authHeader.substring(7);
    const secret = process.env.JWT_SECRET || 'your-secret-key';

    const decoded = jwt.verify(token, secret) as { userId: string; tenantId: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { role: { include: { permissions: true } } },
    });

    if (!user || user.tenantId !== decoded.tenantId) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    req.userId = decoded.userId;
    req.tenantId = decoded.tenantId;
    req.user = user;

    next();
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized' });
  }
}

export async function authorize(resource: string, action: string) {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const hasPermission = req.user.role?.permissions?.some(
      (p: any) => p.resource === resource && p.action === action
    );

    if (!hasPermission) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    next();
  };
}
