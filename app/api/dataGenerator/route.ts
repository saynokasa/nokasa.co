import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, EntityType, VehicleType, AgentStatus, OrderStatus, TransactionType, TransactionStatus, PaymentMethod, RewardSystem, NotificationType, AddressType } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();
const ADMIN_SECRET = process.env.ADMIN_SECRET;

if (!ADMIN_SECRET) {
  throw new Error('ADMIN_SECRET must be set');
}

function verifyAdminSecret(authHeader: string | null): boolean {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  const token = authHeader.split(' ')[1];
  return token === ADMIN_SECRET;
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (!verifyAdminSecret(authHeader)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    await generateData();
    return NextResponse.json({ message: 'Data generation completed successfully' });
  } catch (error) {
    console.error('Data generation error:', error);
    return NextResponse.json({ error: 'Data generation failed', details: (error as Error).message }, { status: 500 });
  }
}

function randomEnum<T extends { [key: string]: string | number }>(enumObj: T): T[keyof T] {
  const values = Object.values(enumObj);
  return values[Math.floor(Math.random() * values.length)] as T[keyof T];
}

const usedFirebaseUids = new Set<string>();
const usedPhones = new Set<string>();
const usedBusinessLicenses = new Set<string>();
const usedGstNumbers = new Set<string>();
const usedInvoiceNumbers = new Set<string>();
const usedPinCodes = new Set<string>();

const allWasteTypes = ['PAPER', 'PLASTIC', 'METAL', 'GLASS', 'ORGANIC', 'E-WASTE', 'TEXTILE', 'RUBBER', 'WOOD', 'HAZARDOUS'];
const allServiceAreas = ['NORTH', 'SOUTH', 'EAST', 'WEST', 'CENTRAL', 'NORTHEAST', 'NORTHWEST', 'SOUTHEAST', 'SOUTHWEST'];
const bankNames = ['IDFC', 'SBI', 'HDFC', 'ICICI'];

function getRandomItems<T>(arr: T[], count: number): T[] {
  return faker.helpers.arrayElements(arr, count);
}

function generateUniqueValue(generator: () => string, usedSet: Set<string>): string {
  let value;
  do {
    value = generator();
  } while (usedSet.has(value));
  usedSet.add(value);
  return value;
}

const generateUniquePhone = () => generateUniqueValue(() => '+91' + faker.string.numeric(10), usedPhones);
const generateUniqueFirebaseUid = () => generateUniqueValue(() => faker.string.alphanumeric(28), usedFirebaseUids);
const generateUniqueBusinessLicense = () => generateUniqueValue(() => faker.string.alphanumeric(10), usedBusinessLicenses);
const generateUniqueGstNumber = () => generateUniqueValue(() => faker.string.alphanumeric(15), usedGstNumbers);
const generateUniqueInvoiceNumber = () => generateUniqueValue(() => faker.string.alphanumeric(10), usedInvoiceNumbers);
const generateUniquePinCode = () => generateUniqueValue(() => faker.location.zipCode('######'), usedPinCodes);

let allVendorPinCodes: string[] = [];

async function generateData() {
  await generateWasteTypes(5);
  await generateApplications(3);
  const vendors = await generateVendors(10);
  await generateVendorPricing(vendors);
  const agents = await generateAgents(50, vendors);
  const users = await generateUsers(50);
  await generateOrders(800, users, vendors, agents);
  await generateNotifications(150);
}

async function generateWasteTypes(count: number) {
  const wasteTypeNames = new Set<string>();
  while (wasteTypeNames.size < count) {
    wasteTypeNames.add(faker.commerce.productMaterial());
  }
  const wasteTypes = Array.from(wasteTypeNames).map((name) => ({ name }));
  await prisma.wasteType.createMany({ data: wasteTypes });
}

async function generateApplications(count: number) {
  const applications = Array.from({ length: count }, () => ({
    name: faker.company.name(),
    rewardSystem: randomEnum(RewardSystem),
    rewardFactor: faker.number.float({ min: 0, max: 5, fractionDigits: 2 }),
  }));
  await prisma.application.createMany({ data: applications });
}

async function generateAddress(entityId: number, pinCode: string, isPrimary: boolean = false) {
  const addressData = {
    entityId,
    street: faker.location.streetAddress(),
    city: faker.location.city(),
    state: faker.location.state(),
    postalCode: pinCode,
    country: 'India',
    type: faker.helpers.arrayElement(Object.values(AddressType)),
    isPrimary,
    latitude: faker.number.float({ min: 8.4, max: 37.6, fractionDigits: 7 }),
    longitude: faker.number.float({ min: 68.7, max: 97.25, fractionDigits: 7 }),
  };
  return await prisma.address.create({ data: addressData });
}

async function generateVendors(count: number) {
  const vendors = [];
  for (let i = 0; i < count; i++) {
    const hashedPassword = await hash("admin", 10);
    const entityData = {
      firebaseUid: generateUniqueFirebaseUid(),
      phone: generateUniquePhone(),
      password: hashedPassword,
      type: EntityType.VENDOR,
      isActive: true,
    };
    const entity = await prisma.entity.create({ data: entityData });

    const businessName = faker.company.name();

    const vendorData = {
      entityId: entity.id,
      name: faker.person.fullName(),
      businessName,
      businessLicense: generateUniqueBusinessLicense(),
      gstNumber: generateUniqueGstNumber(),
      rating: faker.number.float({ min: 0, max: 5, fractionDigits: 2 }),
      acceptedWasteTypes: getRandomItems(allWasteTypes, faker.number.int({ min: 3, max: 7 })),
      serviceAreas: getRandomItems(allServiceAreas, faker.number.int({ min: 2, max: 5 })),
      bankName: faker.helpers.arrayElement(bankNames),
      accountName: businessName,
      accountNumber: faker.finance.accountNumber(12),
    };
    
    const vendor = await prisma.vendor.create({ data: vendorData });
    const vendorPinCodes = Array.from({ length: 10 }, () => generateUniquePinCode());
    allVendorPinCodes.push(...vendorPinCodes);
    
    await generateAddress(entity.id, vendorPinCodes[0], true);
    vendors.push({ ...vendor, pinCodes: vendorPinCodes });
  }
  return vendors;
}


async function generateVendorPricing(vendors: any[]) {
  const wasteTypes = await prisma.wasteType.findMany();
  const pricingData = vendors.flatMap(vendor => 
    vendor.pinCodes.flatMap((pinCode: string) => 
      wasteTypes.map(wasteType => ({
        vendorId: vendor.id,
        wasteTypeId: wasteType.id,
        postalCode: pinCode,
        price: faker.number.float({ min: 10, max: 100, fractionDigits: 2 }),
      }))
    )
  );
  await prisma.vendorPricing.createMany({ data: pricingData });
}

async function generateAgents(count: number, vendors: any[]) {
  const agents = [];
  for (let i = 0; i < count; i++) {
    const hashedPassword = await hash("admin", 10);
    const entityData = {
      firebaseUid: generateUniqueFirebaseUid(),
      phone: generateUniquePhone(),
      password: hashedPassword,
      type: EntityType.AGENT,
      isActive: true,
    };
    const entity = await prisma.entity.create({ data: entityData });
    const vendor = vendors[Math.floor(Math.random() * vendors.length)];
    const agentData = {
      entityId: entity.id,
      vendorId: vendor.id,
      name: faker.person.fullName(),
      vehicleType: randomEnum(VehicleType),
      vehicleNumber: faker.vehicle.vrm(),
      status: randomEnum(AgentStatus),
      rating: faker.number.float({ min: 0, max: 5, fractionDigits: 2 }),
    };
    const agent = await prisma.agent.create({ data: agentData });
    await generateAddress(entity.id, vendor.pinCodes[Math.floor(Math.random() * vendor.pinCodes.length)], true);
    agents.push(agent);

    await prisma.vendorHistory.create({
      data: {
        agentId: agent.id,
        vendorId: vendor.id,
        isActive: true,
        startDate: faker.date.past(),
      },
    });
  }
  return agents;
}

async function generateUsers(count: number) {
  const users = [];
  for (let i = 0; i < count; i++) {
    const hashedPassword = await hash("admin", 10);
    const entityData = {
      firebaseUid: generateUniqueFirebaseUid(),
      phone: generateUniquePhone(),
      password: hashedPassword,
      type: EntityType.USER,
      isActive: true,
    };
    const entity = await prisma.entity.create({ data: entityData });
    const userData = {
      entityId: entity.id,
      name: faker.person.fullName(),
    };
    const user = await prisma.user.create({ data: userData });
    
    const addressCount = faker.number.int({ min: 1, max: 3 });
    for (let j = 0; j < addressCount; j++) {
      const pinCode = allVendorPinCodes[Math.floor(Math.random() * allVendorPinCodes.length)];
      await generateAddress(entity.id, pinCode, j === 0);
    }
    
    users.push(user);
  }
  return users;
}

async function generateOrders(count: number, users: any[], vendors: any[], agents: any[]) {
  const applications = await prisma.application.findMany();
  if (applications.length === 0) {
    throw new Error('No applications found.');
  }
  const wasteTypes = await prisma.wasteType.findMany();
  const currentDate = new Date();
  const lastWeek = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000);
  const nextWeek = new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000);

  for (let i = 0; i < count; i++) {
    const user = users[Math.floor(Math.random() * users.length)];
    const userAddresses = await prisma.address.findMany({ where: { entityId: user.entityId } });
    if (userAddresses.length === 0) throw new Error(`No addresses found for user ${user.entityId}`);
    
    const pickupAddress = userAddresses[Math.floor(Math.random() * userAddresses.length)];
    const vendor = vendors.find(v => v.pinCodes.includes(pickupAddress.postalCode));
    if (!vendor) throw new Error(`No vendor found for postal code ${pickupAddress.postalCode}`);

    const agent = agents.find((a) => a.vendorId === vendor.id);
    const application = applications[Math.floor(Math.random() * applications.length)];
    const items = Array.from({ length: faker.number.int({ min: 1, max: 3 }) }, () => ({
      wasteType: wasteTypes[Math.floor(Math.random() * wasteTypes.length)].name,
      quantity: faker.number.int({ min: 1, max: 10 }),
    }));

    const status = randomEnum(OrderStatus);
    const scheduledPickupTime = faker.date.between({ from: lastWeek, to: nextWeek });
    const actualPickupTime = status === OrderStatus.COMPLETED ? faker.date.between({ from: scheduledPickupTime, to: nextWeek }) : null;
    const actualWeight = status === OrderStatus.COMPLETED ? faker.number.float({ min: 0, max: 5, fractionDigits: 2 }) : null;
    
    const otp = faker.string.numeric(6);

    const rating = status === OrderStatus.COMPLETED ? faker.number.int({ min: 1, max: 5 }) : null;
    const reviewComment = status === OrderStatus.COMPLETED ? faker.lorem.sentence() : null;
    
    const orderData = {
      userId: user.id,
      vendorId: vendor.id,
      agentId: status === OrderStatus.NEW ? null : (status === OrderStatus.REJECTED && Math.random() < 0.5 ? null : agent?.id),
      applicationId: application.id,
      items,
      status,
      scheduledPickupTime,
      actualPickupTime,
      estimatedWeight: faker.number.float({ min: 0, max: 5, fractionDigits: 2 }),
      actualWeight,
      otp,
      rating,
      reviewComment,
      pickupAddressId: pickupAddress.id,
    };
    
    const order = await prisma.order.create({ data: orderData });
    await generateTransaction(order.id, user.entityId);
    
    if (status === OrderStatus.CANCELLED || status === OrderStatus.REJECTED) {
      const cancelRejectData = {
        orderId: order.id,
        reason: faker.lorem.sentence(),
        entityId: user.entityId,
        cancelledAt: status === OrderStatus.CANCELLED ? faker.date.recent() : null,
        rejectedAt: status === OrderStatus.REJECTED ? faker.date.recent() : null,
      };
      await prisma.orderCancelAndRejectHistory.create({ data: cancelRejectData });
    }
  }
}


async function generateTransaction(orderId: number, entityId: number) {
  const transactionData = {
    orderId,
    entityId,
    invoiceNumber: generateUniqueInvoiceNumber(),
    amount: faker.number.float({ min: 0, max: 5000, fractionDigits: 2 }),
    type: randomEnum(TransactionType),
    status: randomEnum(TransactionStatus),
    date: faker.date.recent(),
    paymentMethod: randomEnum(PaymentMethod),
  };
  const transaction = await prisma.transaction.create({ data: transactionData });
  await generateTaxDetails(transaction.id);
}


// async function generateTransaction(orderId: number, entityId: number) {
//   const order = await prisma.order.findUnique({
//     where: { id: orderId },
//     include: {
//       vendor: true,
//       pickupAddress: true,
//     },
//   });

//   if (!order || !order.vendor) {
//     throw new Error(`Order or vendor not found for order ID: ${orderId}`);
//   }

//   const orderItems = order.items as { wasteTypeId: number; quantity: number }[];

//   let subtotal = 0;

//   for (const item of orderItems) {
//     const vendorPricing = await prisma.vendorPricing.findFirst({
//       where: {
//         vendorId: order.vendor.id,
//         wasteTypeId: item.wasteTypeId,
//         postalCode: order.pickupAddress?.postalCode || '',
//       },
//     });

//     if (!vendorPricing) {
//       console.warn(`Vendor pricing not found for wasteTypeId: ${item.wasteTypeId}, vendorId: ${order.vendor.id}`);
//       continue;
//     }

//     const itemTotal = vendorPricing.price.toNumber() * item.quantity;
//     subtotal += itemTotal;
//   }

//   const transactionData = {
//     orderId,
//     entityId,
//     invoiceNumber: generateUniqueInvoiceNumber(),
//     amount: subtotal,
//     type: randomEnum(TransactionType),
//     status: randomEnum(TransactionStatus),
//     date: faker.date.recent(),
//     paymentMethod: randomEnum(PaymentMethod),
//   };

//   const transaction = await prisma.transaction.create({ data: transactionData });

//   await generateTaxDetails(transaction.id);
// }


async function generateTaxDetails(transactionId: number) {
  const taxData = {
    transactionId,
    gstRate: faker.number.float({ min: 5, max: 28, fractionDigits: 2 }),
    cgstAmount: faker.number.float({ min: 0, max: 500, fractionDigits: 2 }),
    sgstAmount: faker.number.float({ min: 0, max: 500, fractionDigits: 2 }),
    igstAmount: faker.number.float({ min: 0, max: 1000, fractionDigits: 2 }),
    totalTaxableValue: faker.number.float({ min: 100, max: 5000, fractionDigits: 2 }),
  };
  await prisma.taxDetails.create({ data: taxData });
}


async function generateNotifications(count: number) {
  const entities = await prisma.entity.findMany();
  const notifications = Array.from({ length: count }, () => {
    const entity = entities[Math.floor(Math.random() * entities.length)];
    return {
      entityId: entity.id,
      message: faker.lorem.sentence(),
      type: randomEnum(NotificationType),
      isRead: faker.datatype.boolean(),
    };
  });

  await prisma.notification.createMany({ data: notifications });
}