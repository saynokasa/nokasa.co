import { NextRequest, NextResponse } from 'next/server';
import { EntityType, Prisma, OrderStatus } from '@prisma/client';
import prisma from '@/lib/prisma';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth';

interface OrderRequestBody {
  scheduledPickupTime: string;
  pickupAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    latitude?: number;
    longitude?: number;
  };
  name: string;
  phone: string;
  email: string;
  estimatedWeight: number;
  items: {
    wasteTypeId: number;
    weight: number;
  }[];
  applicationId: number;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const authHeader = req.headers.get('authorization');
    let userId: number;
    let entityId: number;
    
    try {
      const token = extractTokenFromHeader(authHeader);
      const decoded = verifyToken(token);
      
      if (decoded.entityType !== EntityType.USER) {
        return NextResponse.json({ 
          error: 'Unauthorized. Only users can create orders' 
        }, { status: 403 });
      }
      entityId = decoded.entityId;
    } catch (error) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: OrderRequestBody = await req.json();
    
    if (!body.scheduledPickupTime || !body.pickupAddress || !body.estimatedWeight || !body.items?.length) {
      return NextResponse.json({ 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: {
        entityId: entityId,
        isDeleted: false
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    userId = user.id;

    const address = await prisma.address.create({
      data: {
        entityId: entityId,
        ...body.pickupAddress,
        type: 'HOME',
        isPrimary: false
      }
    });

    const vendor = await prisma.vendor.findFirst({
      where: {
        isDeleted: false,
        vendorPricings: {
          some: {
            wasteTypeId: {
              in: body.items.map(item => item.wasteTypeId)
            },
            postalCode: body.pickupAddress.postalCode
          }
        }
      },
      orderBy: {
        rating: 'desc'
      }
    });

    if (!vendor) {
      return NextResponse.json({ 
        error: 'No vendor available for the selected waste types in your area' 
      }, { status: 404 });
    }

    const priceDetails = await prisma.vendorPricing.findMany({
      where: {
        vendorId: vendor.id,
        wasteTypeId: {
          in: body.items.map(item => item.wasteTypeId)
        },
        postalCode: body.pickupAddress.postalCode
      }
    });

    const totalAmount = body.items.reduce((sum, item) => {
      const pricing = priceDetails.find(p => p.wasteTypeId === item.wasteTypeId);
      return sum + (pricing ? Number(pricing.price) * item.weight : 0);
    }, 0);

    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          userId: userId,
          vendorId: vendor.id,
          applicationId: body.applicationId,
          items: body.items,
          status: OrderStatus.NEW,
          scheduledPickupTime: new Date(body.scheduledPickupTime),
          estimatedWeight: new Prisma.Decimal(body.estimatedWeight),
          pickupAddressId: address.id
        },
        include: {
          vendor: {
            select: {
              name: true,
              businessName: true
            }
          }
        }
      });

      const transaction = await tx.transaction.create({
        data: {
          orderId: order.id,
          entityId: entityId,
          invoiceNumber: `INV-${order.id}-${Date.now()}`,
          amount: new Prisma.Decimal(totalAmount),
          type: 'PURCHASE',
          status: 'PENDING',
          date: new Date(),
          paymentMethod: 'CASH'
        }
      });

      await tx.notification.create({
        data: {
          entityId: vendor.entityId,
          type: 'INFO',
          message: `New pickup request received for ${body.scheduledPickupTime}`,
          isRead: false
        }
      });

      return { order, transaction };
    });

    return NextResponse.json({
      message: 'Order created successfully',
      data: {
        orderId: result.order.id,
        vendor: result.order.vendor,
        scheduledPickupTime: result.order.scheduledPickupTime,
        amount: totalAmount,
        transactionId: result.transaction.id
      }
    });

  } catch (error) {
    console.error('Order creation error:', error);
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json({ 
        error: 'Database error',
        details: error.code
      }, { status: 500 });
    }

    return NextResponse.json({ 
      error: 'Failed to create order' 
    }, { status: 500 });
  }
}