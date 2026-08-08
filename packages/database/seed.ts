import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();

  // Create Tenants
  const tenant1 = await prisma.tenant.create({
    data: {
      name: 'MEGAZEN HQ',
      code: 'MEGAZEN',
      domain: 'megazen.com',
      status: 'active',
      config: { region: 'APAC', timezone: 'UTC' },
    },
  });

  const tenant2 = await prisma.tenant.create({
    data: {
      name: 'Djibouti Terminal',
      code: 'DJI-TERM',
      domain: 'djibouti.megazen.com',
      status: 'active',
      config: { region: 'Africa', timezone: 'EAT' },
    },
  });

  const tenant3 = await prisma.tenant.create({
    data: {
      name: 'Ethiopia Logistics',
      code: 'ETH-LOG',
      domain: 'ethiopia.megazen.com',
      status: 'active',
      config: { region: 'Africa', timezone: 'EAT' },
    },
  });

  // Create Roles
  const adminRole = await prisma.role.create({
    data: {
      tenantId: tenant1.id,
      name: 'Admin',
      description: 'Full system access',
    },
  });

  const operatorRole = await prisma.role.create({
    data: {
      tenantId: tenant1.id,
      name: 'Operator',
      description: 'Operations team',
    },
  });

  // Create Users
  const hashedPassword = await bcryptjs.hash('password123', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@megazen.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      tenantId: tenant1.id,
      roleId: adminRole.id,
      status: 'active',
    },
  });

  const operator1 = await prisma.user.create({
    data: {
      email: 'operator1@megazen.com',
      password: hashedPassword,
      firstName: 'John',
      lastName: 'Operator',
      tenantId: tenant1.id,
      roleId: operatorRole.id,
      status: 'active',
    },
  });

  const operator2 = await prisma.user.create({
    data: {
      email: 'operator2@megazen.com',
      password: hashedPassword,
      firstName: 'Jane',
      lastName: 'Manager',
      tenantId: tenant1.id,
      roleId: operatorRole.id,
      status: 'active',
    },
  });

  // Create Organizations
  await prisma.organization.create({
    data: {
      tenantId: tenant1.id,
      name: 'MEGAZEN Inc.',
      registrationNumber: 'REG-001',
      taxId: 'TAX-001',
      address: '123 Maritime Street, Singapore 018971',
      phone: '+65-6123-4567',
      email: 'contact@megazen.com',
      website: 'https://megazen.com',
    },
  });

  // Create Shipping Lines
  const maersk = await prisma.shippingLine.create({
    data: {
      tenantId: tenant1.id,
      code: 'MAERSK',
      name: 'Maersk Line',
      scac: 'MAEU',
      country: 'Denmark',
      contactEmail: 'sg@maersk.com',
      contactPhone: '+65-6123-1234',
    },
  });

  const msc = await prisma.shippingLine.create({
    data: {
      tenantId: tenant1.id,
      code: 'MSC',
      name: 'Mediterranean Shipping Company',
      scac: 'MSCU',
      country: 'Switzerland',
      contactEmail: 'sg@msc.com',
      contactPhone: '+65-6123-5678',
    },
  });

  // Create Customers
  const customer1 = await prisma.customer.create({
    data: {
      tenantId: tenant1.id,
      code: 'ACME-001',
      name: 'Acme Import Co.',
      type: 'importer',
      email: 'contact@acmeimport.com',
      phone: '+65-9999-1234',
      address: '456 Import Lane, Singapore',
      country: 'Singapore',
      taxId: 'SG-TAX-123',
      creditLimit: 500000,
      creditUsed: 125000,
      status: 'active',
      tags: ['premium', 'local'],
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      tenantId: tenant1.id,
      code: 'GLOBAL-001',
      name: 'Global Exports Ltd.',
      type: 'exporter',
      email: 'sales@globalexports.com',
      phone: '+65-8888-5678',
      address: '789 Export Boulevard, Singapore',
      country: 'Singapore',
      taxId: 'SG-TAX-456',
      creditLimit: 750000,
      creditUsed: 230000,
      status: 'active',
      tags: ['premium', 'electronics'],
    },
  });

  // Create Vessels
  const vessel1 = await prisma.vessel.create({
    data: {
      tenantId: tenant1.id,
      name: 'MAERSK MC-KINNEY MOLLER',
      imo: '9649839',
      callSign: 'OXUE',
      flag: 'DK',
      owner: 'Maersk Line',
      operator: 'Maersk Line',
      capacity: 20124,
      length: 398.4,
      beam: 59.0,
      draft: 15.7,
    },
  });

  const vessel2 = await prisma.vessel.create({
    data: {
      tenantId: tenant1.id,
      name: 'MSC GULSUN',
      imo: '9806520',
      callSign: 'VRDF6',
      flag: 'LBR',
      owner: 'MSC',
      operator: 'MSC',
      capacity: 23756,
      length: 400.0,
      beam: 61.0,
      draft: 14.5,
    },
  });

  // Create Voyages
  const voyage1 = await prisma.voyage.create({
    data: {
      vesselId: vessel1.id,
      voyageNumber: '2608E',
      rotation: 'AE-SG-MY-TH-SG-AE',
      portOfLoading: 'AEDXB',
      portOfDischarge: 'SGSIN',
      etd: new Date('2024-01-20'),
      eta: new Date('2024-02-05'),
      status: 'in-transit',
    },
  });

  // Create Containers
  for (let i = 1; i <= 50; i++) {
    await prisma.container.create({
      data: {
        tenantId: tenant1.id,
        containerNumber: `MSKU${String(8841000 + i).padStart(6, '0')}`,
        type: i % 3 === 0 ? '40ft HC' : i % 2 === 0 ? 'Reefer' : '40ft',
        size: i % 3 === 0 ? '40' : '40',
        status: ['available', 'assigned', 'in-transit'][i % 3],
        location: i % 2 === 0 ? 'SGSIN' : 'AEDXB',
        carrier: i % 2 === 0 ? 'Maersk' : 'MSC',
        condition: 'good',
      },
    });
  }

  // Create Bookings
  const booking1 = await prisma.booking.create({
    data: {
      tenantId: tenant1.id,
      bookingNumber: 'BK-2024-001234',
      customerId: customer1.id,
      shippingLineId: maersk.id,
      origin: 'AEDXB',
      destination: 'SGSIN',
      cargoDescription: 'Electronics Parts',
      cargoType: 'general',
      weight: 12500,
      volume: 35.5,
      containerCount: 1,
      expectedShippingDate: new Date('2024-02-05'),
      status: 'approved',
      approvalStatus: 'auto-approved',
      priority: 'normal',
      creditCheckPassed: true,
      approvalWorkflow: {
        status: 'auto_approved',
        rules: ['customer_active', 'credit_limit_ok', 'no_dangerous_goods'],
      },
    },
  });

  // Create Release Orders
  const ro1 = await prisma.releaseOrder.create({
    data: {
      tenantId: tenant1.id,
      roNumber: 'RO-2024-0567',
      bookingId: booking1.id,
      customerId: customer1.id,
      vessel: 'MAERSK MC-KINNEY MOLLER',
      voyage: '2608E',
      portOfLoading: 'AEDXB',
      portOfDischarge: 'SGSIN',
      releaseDate: new Date(),
      expiryDate: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours
      status: 'issued',
      financialClearanceStatus: 'cleared',
      customsClearanceStatus: 'cleared',
      issuedAt: new Date(),
    },
  });

  // Create Bill of Lading
  const bol1 = await prisma.billOfLading.create({
    data: {
      tenantId: tenant1.id,
      bolNumber: 'MAEU984210549',
      scac: 'MAEU',
      bookingId: booking1.id,
      shipper: 'Acme Import Co., 456 Import Lane, Singapore 018971',
      consignee: 'Global Exports Ltd., 789 Export Boulevard, Singapore 018972',
      vessel: 'MAERSK MC-KINNEY MOLLER',
      voyageNo: '2608E',
      portOfLoading: 'AEDXB',
      portOfDischarge: 'SGSIN',
      prepaid: true,
      collect: false,
      status: 'issued',
      version: 1,
      amendmentCount: 0,
      issuedAt: new Date(),
    },
  });

  // Create Audit Log Entry
  await prisma.auditLog.create({
    data: {
      tenantId: tenant1.id,
      entityType: 'Booking',
      entityId: booking1.id,
      action: 'create',
      userId: admin.id,
      newData: {
        bookingNumber: booking1.bookingNumber,
        status: booking1.status,
      },
      ipAddress: '127.0.0.1',
      userAgent: 'Seed Script',
    },
  });

  console.log('✅ Database seed completed!');
  console.log(`
📊 Seeded Data Summary:
- Tenants: 3
- Users: 3
- Customers: 2
- Vessels: 2
- Voyages: 1
- Containers: 50
- Bookings: 1
- Release Orders: 1
- Bills of Lading: 1

🔐 Demo Login Credentials:
Email: admin@megazen.com
Password: password123
  `);
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
