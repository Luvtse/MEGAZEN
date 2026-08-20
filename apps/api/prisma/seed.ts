import { PrismaClient, UserRole, ContainerStatus, BookingStatus } from "@prisma/client";
import { formatBillOfLadingNumber } from "../src/utils/numbering.js";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const tenant = await prisma.tenant.upsert({
    where: { code: "MEGAZEN-DEMO" },
    update: {},
    create: { name: "MEGAZEN Demo Tenant", code: "MEGAZEN-DEMO" }
  });

  const customer = await prisma.customer.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: "DEMO-CUST" } },
    update: {},
    create: {
      tenantId: tenant.id,
      name: "Demo Logistics Customer",
      code: "DEMO-CUST",
      email: "operations@example.com",
      phone: "+251900000000"
    }
  });

  const container = await prisma.container.upsert({
    where: { tenantId_containerNumber: { tenantId: tenant.id, containerNumber: "ZENU1234567" } },
    update: {},
    create: {
      tenantId: tenant.id,
      containerNumber: "ZENU1234567",
      type: "DRY",
      size: "40",
      status: ContainerStatus.IN_YARD,
      location: "Djibouti Terminal",
      carrier: "MEGAZEN DEMO LINE"
    }
  });

  await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: "admin@megazen.local" } },
    update: {},
    create: {
      tenantId: tenant.id,
      email: "admin@megazen.local",
      name: "MEGAZEN Administrator",
      role: UserRole.ADMIN
    }
  });

  const booking = await prisma.booking.upsert({
    where: { bookingNumber: "8372946155" },
    update: {},
    create: {
      bookingNumber: "8372946155",
      tenantId: tenant.id,
      customerId: customer.id,
      containerId: container.id,
      origin: "Djibouti",
      destination: "Addis Ababa",
      cargoDescription: "General cargo",
      weight: 12500,
      volume: 32,
      status: BookingStatus.CONFIRMED
    }
  });

  const billOfLadingNumber = formatBillOfLadingNumber(booking.bookingNumber);

  await prisma.shipment.upsert({
    where: { bookingId: booking.id },
    update: {},
    create: {
      bookingId: booking.id,
      tenantId: tenant.id,
      status: "PLANNED",
      blNumber: billOfLadingNumber,
      vessel: "MEGAZEN DEMO VESSEL",
      voyage: "MGZ-001"
    }
  });

  const existing = await prisma.billOfLading.findFirst({
    where: { tenantId: tenant.id, blNumber: billOfLadingNumber, version: 1 }
  });

  if (!existing) {
    const bill = await prisma.billOfLading.create({
      data: {
        tenantId: tenant.id,
        blNumber: billOfLadingNumber,
        version: 1,
        status: "DRAFT",
        copyType: "ORIGINAL",
        scac: "ZENU",
        bookingId: booking.id,
        customerId: customer.id,
        carrierName: "MEGAZEN DEMO LINE",
        shipperName: "Demo Exporter Ltd",
        shipperAddress: "Djibouti Free Zone",
        consigneeName: "Demo Importer PLC",
        consigneeAddress: "Addis Ababa, Ethiopia",
        placeOfReceipt: "Djibouti",
        portOfLoading: "DJIBOUTI",
        portOfDischarge: "DJIBOUTI",
        placeOfDelivery: "Addis Ababa",
        vesselName: "MEGAZEN DEMO VESSEL",
        voyageNumber: "MGZ-001",
        placeOfIssue: "Djibouti",
        numberOfOriginals: 3,
        description: "General cargo",
        totalPackages: 100,
        totalGrossWeight: 12500,
        totalMeasurement: 32,
        currency: "USD",
        freightTerms: "PREPAID",
        verificationToken: "MEGAZEN-DEMO-VERIFY-0001",
        createdById: null
      }
    });

    await prisma.billOfLadingContainer.create({
      data: {
        billOfLadingId: bill.id,
        containerId: container.id,
        containerNumber: container.containerNumber,
        containerType: container.type,
        packageCount: 100,
        grossWeight: 12500,
        measurement: 32
      }
    });

    await prisma.billOfLadingVersion.create({
      data: {
        billOfLadingId: bill.id,
        version: 1,
        status: "DRAFT",
        reason: "Initial demo document"
      }
    });
  }
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
