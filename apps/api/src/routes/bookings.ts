import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { CreateBookingSchema } from '../schemas/index.js';
import { ApiError } from '../middleware/error-handler.js';
import { evaluateAutoApprovalRules } from '../utils/approval-engine.js';

const router = Router();

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { skip = 0, take = 20, status } = req.query;

    const where: any = { tenantId: req.tenantId };
    if (status) where.status = status;

    const [bookings, total] = await Promise.all([
      global.prisma.booking.findMany({
        where,
        skip: parseInt(skip as string) || 0,
        take: parseInt(take as string) || 20,
        include: {
          customer: true,
          approvals: true,
          containerAssignments: { include: { container: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      global.prisma.booking.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        bookings,
        pagination: { total, skip: parseInt(skip as string) || 0, take: parseInt(take as string) || 20 },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString(),
    });
  }
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const booking = await global.prisma.booking.findUnique({
      where: { id: req.params.id },
      include: {
        customer: true,
        shippingLine: true,
        agent: true,
        approvals: true,
        containerAssignments: { include: { container: true } },
        releaseOrders: true,
        deliveryOrders: true,
        billsOfLading: true,
      },
    });

    if (!booking || booking.tenantId !== req.tenantId) {
      throw new ApiError(404, 'Booking not found');
    }

    res.json({
      success: true,
      data: booking,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString(),
      });
    }
  }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const data = CreateBookingSchema.parse(req.body);

    // Verify customer exists and belongs to tenant
    const customer = await global.prisma.customer.findUnique({
      where: { id: data.customerId },
    });

    if (!customer || customer.tenantId !== req.tenantId) {
      throw new ApiError(404, 'Customer not found');
    }

    // Create booking
    const booking = await global.prisma.booking.create({
      data: {
        ...data,
        tenantId: req.tenantId!,
      },
      include: {
        customer: true,
        approvals: true,
      },
    });

    // Evaluate auto-approval rules
    const approvalResult = await evaluateAutoApprovalRules(req.tenantId!, booking.id);

    // Update booking with approval status
    const updatedBooking = await global.prisma.booking.update({
      where: { id: booking.id },
      data: {
        approvalStatus: approvalResult.autoApproved ? 'auto-approved' : 'pending',
        creditCheckPassed: approvalResult.creditCheckPassed,
        approvalWorkflow: approvalResult.workflow,
      },
      include: {
        customer: true,
        approvals: true,
      },
    });

    // Broadcast via WebSocket
    global.io?.emit('booking_created', {
      bookingId: updatedBooking.id,
      status: updatedBooking.status,
      approvalStatus: updatedBooking.approvalStatus,
    });

    res.status(201).json({
      success: true,
      data: updatedBooking,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString(),
    });
  }
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const booking = await global.prisma.booking.update({
      where: { id: req.params.id },
      data: req.body,
      include: { customer: true, approvals: true },
    });

    global.io?.emit('booking_updated', { bookingId: booking.id });

    res.json({
      success: true,
      data: booking,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString(),
    });
  }
});

router.put('/:id/approve', async (req: AuthRequest, res: Response) => {
  try {
    const booking = await global.prisma.booking.findUnique({
      where: { id: req.params.id },
    });

    if (!booking || booking.tenantId !== req.tenantId) {
      throw new ApiError(404, 'Booking not found');
    }

    const updatedBooking = await global.prisma.booking.update({
      where: { id: req.params.id },
      data: {
        status: 'approved',
        approvalStatus: 'manual-approved',
      },
      include: { customer: true, approvals: true },
    });

    global.io?.emit('booking_approved', { bookingId: updatedBooking.id });

    res.json({
      success: true,
      data: updatedBooking,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString(),
      });
    }
  }
});

router.get('/:id/status', async (req: AuthRequest, res: Response) => {
  try {
    const booking = await global.prisma.booking.findUnique({
      where: { id: req.params.id },
      include: {
        containerAssignments: true,
        releaseOrders: { take: 1 },
        deliveryOrders: { take: 1 },
        billsOfLading: { take: 1 },
      },
    });

    if (!booking || booking.tenantId !== req.tenantId) {
      throw new ApiError(404, 'Booking not found');
    }

    res.json({
      success: true,
      data: {
        bookingStatus: booking.status,
        approvalStatus: booking.approvalStatus,
        containerAssignments: booking.containerAssignments.length,
        releaseOrderIssued: !!booking.releaseOrders[0],
        deliveryOrderIssued: !!booking.deliveryOrders[0],
        billOfLadingIssued: !!booking.billsOfLading[0],
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString(),
      });
    }
  }
});

export default router;
