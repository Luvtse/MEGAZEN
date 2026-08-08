import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';

export function initializeSocketIO(io: Server, prisma: PrismaClient) {
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on('subscribe_tracking', (data: { containerId: string; tenantId: string }) => {
      socket.join(`tracking:${data.containerId}`);
    });

    socket.on('unsubscribe_tracking', (data: { containerId: string }) => {
      socket.leave(`tracking:${data.containerId}`);
    });

    socket.on('subscribe_booking', (data: { bookingId: string; tenantId: string }) => {
      socket.join(`booking:${data.bookingId}`);
    });

    socket.on('subscribe_bol', (data: { bolId: string; tenantId: string }) => {
      socket.join(`bol:${data.bolId}`);
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });
}
