import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import 'express-async-errors';
import { Server } from 'socket.io';
import http from 'http';
import { PrismaClient } from '@prisma/client';
import { createClient } from 'redis';
import { config } from 'dotenv';

import authRoutes from './routes/auth.js';
import customerRoutes from './routes/customers.js';
import bookingRoutes from './routes/bookings.js';
import containerRoutes from './routes/containers.js';
import releaseOrderRoutes from './routes/release-orders.js';
import deliveryOrderRoutes from './routes/delivery-orders.js';
import billOfLadingRoutes from './routes/bill-of-lading.js';
import vesselRoutes from './routes/vessels.js';
import yardRoutes from './routes/yard.js';
import workflowRoutes from './routes/workflows.js';
import rulesRoutes from './routes/rules.js';
import notificationRoutes from './routes/notifications.js';
import reportRoutes from './routes/reports.js';
import auditRoutes from './routes/audit.js';
import adminRoutes from './routes/admin.js';

import { errorHandler } from './middleware/error-handler.js';
import { authenticate } from './middleware/auth.js';
import { initializeSocketIO } from './utils/socket-io.js';

config();

const app: Express = express();
const server = http.createServer(app);
const prisma = new PrismaClient();
const redis = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', authenticate, customerRoutes);
app.use('/api/bookings', authenticate, bookingRoutes);
app.use('/api/containers', authenticate, containerRoutes);
app.use('/api/release-orders', authenticate, releaseOrderRoutes);
app.use('/api/delivery-orders', authenticate, deliveryOrderRoutes);
app.use('/api/bill-of-lading', authenticate, billOfLadingRoutes);
app.use('/api/vessels', authenticate, vesselRoutes);
app.use('/api/yard', authenticate, yardRoutes);
app.use('/api/workflows', authenticate, workflowRoutes);
app.use('/api/rules', authenticate, rulesRoutes);
app.use('/api/notifications', authenticate, notificationRoutes);
app.use('/api/reports', authenticate, reportRoutes);
app.use('/api/audit', authenticate, auditRoutes);
app.use('/api/admin', authenticate, adminRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handling
app.use(errorHandler);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

initializeSocketIO(io, prisma);

// Connect to Redis
redis.connect().catch(console.error);

// Store instances globally for middleware access
declare global {
  var prisma: PrismaClient;
  var redis: ReturnType<typeof createClient>;
  var io: Server;
}

global.prisma = prisma;
global.redis = redis;
global.io = io;

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  await redis.disconnect();
  process.exit(0);
});

const PORT = process.env.API_PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 MEGAZEN API running on port ${PORT}`);
  console.log(`📊 Database connected`);
  console.log(`⚡ WebSocket ready`);
});
