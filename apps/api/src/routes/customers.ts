import { Router, Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.js';
import { CreateCustomerSchema } from '../schemas/index.js';
import { ApiError } from '../middleware/error-handler.js';

const router = Router();

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { skip = 0, take = 20, status } = req.query;

    const where: any = { tenantId: req.tenantId };
    if (status) where.status = status;

    const [customers, total] = await Promise.all([
      global.prisma.customer.findMany({
        where,
        skip: parseInt(skip as string) || 0,
        take: parseInt(take as string) || 20,
        include: { contacts: true },
      }),
      global.prisma.customer.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        customers,
        pagination: {
          total,
          skip: parseInt(skip as string) || 0,
          take: parseInt(take as string) || 20,
        },
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
    const customer = await global.prisma.customer.findUnique({
      where: { id: req.params.id },
      include: {
        contacts: true,
        bookings: { take: 10 },
      },
    });

    if (!customer || customer.tenantId !== req.tenantId) {
      throw new ApiError(404, 'Customer not found');
    }

    res.json({
      success: true,
      data: customer,
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
    const data = CreateCustomerSchema.parse(req.body);

    const customer = await global.prisma.customer.create({
      data: {
        ...data,
        tenantId: req.tenantId!,
      },
    });

    res.status(201).json({
      success: true,
      data: customer,
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
    const customer = await global.prisma.customer.update({
      where: { id: req.params.id },
      data: req.body,
    });

    res.json({
      success: true,
      data: customer,
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

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    await global.prisma.customer.delete({
      where: { id: req.params.id },
    });

    res.json({
      success: true,
      data: { id: req.params.id },
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

router.get('/:id/credit', async (req: AuthRequest, res: Response) => {
  try {
    const customer = await global.prisma.customer.findUnique({
      where: { id: req.params.id },
    });

    if (!customer || customer.tenantId !== req.tenantId) {
      throw new ApiError(404, 'Customer not found');
    }

    res.json({
      success: true,
      data: {
        creditLimit: customer.creditLimit,
        creditUsed: customer.creditUsed,
        availableCredit: customer.creditLimit - customer.creditUsed,
        creditPercentage: (customer.creditUsed / customer.creditLimit) * 100,
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
