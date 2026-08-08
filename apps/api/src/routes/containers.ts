import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';

const router = Router();

router.get('/', async (req: AuthRequest, res: Response) => {
  res.json({ success: true, data: [], timestamp: new Date().toISOString() });
});

router.post('/', async (req: AuthRequest, res: Response) => {
  res.status(201).json({ success: true, data: {}, timestamp: new Date().toISOString() });
});

export default router;
