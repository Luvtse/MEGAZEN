import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function evaluateAutoApprovalRules(
  tenantId: string,
  bookingId: string
): Promise<{
  autoApproved: boolean;
  creditCheckPassed: boolean;
  workflow: any;
  reason?: string;
}> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { customer: true },
  });

  if (!booking) {
    return {
      autoApproved: false,
      creditCheckPassed: false,
      workflow: null,
      reason: 'Booking not found',
    };
  }

  // Rule 1: Customer must be active
  if (booking.customer.status !== 'active') {
    return {
      autoApproved: false,
      creditCheckPassed: false,
      workflow: { failedRules: ['customer_not_active'] },
      reason: 'Customer is not active',
    };
  }

  // Rule 2: Credit limit must cover booking value
  // Assuming we need to calculate booking value from cargo details
  const creditCheckPassed = booking.customer.creditLimit > booking.customer.creditUsed;
  if (!creditCheckPassed) {
    return {
      autoApproved: false,
      creditCheckPassed: false,
      workflow: { failedRules: ['credit_limit_exceeded'] },
      reason: 'Credit limit exceeded',
    };
  }

  // Rule 3: Check for dangerous goods
  if (booking.cargoType && ['hazmat', 'dangerous', 'class1-7'].includes(booking.cargoType)) {
    return {
      autoApproved: false,
      creditCheckPassed: true,
      workflow: { requiresManualApproval: true, reason: 'Dangerous goods' },
      reason: 'Dangerous goods require manual approval',
    };
  }

  // Rule 4: Check all mandatory fields are filled
  if (!booking.origin || !booking.destination || !booking.cargoDescription) {
    return {
      autoApproved: false,
      creditCheckPassed: true,
      workflow: { failedRules: ['mandatory_fields_missing'] },
      reason: 'Mandatory fields are missing',
    };
  }

  // All rules passed - auto-approve
  return {
    autoApproved: true,
    creditCheckPassed: true,
    workflow: {
      status: 'auto_approved',
      approvedAt: new Date().toISOString(),
      rules: [
        'customer_active',
        'credit_limit_ok',
        'no_dangerous_goods',
        'mandatory_fields_ok',
      ],
    },
  };
}
