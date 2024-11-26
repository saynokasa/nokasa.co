import { NextRequest, NextResponse } from 'next/server';
import { EntityType, OrderStatus, TransactionStatus, Prisma } from '@prisma/client';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth';
import prisma from '@/lib/prisma';

interface OrderItem {
  wasteTypeId: number;
  wasteType: string;
  quantity: number;
  costPerKg: number;
  totalCost: number;
}

interface OrderDetailsResponse {
  id: number;
  status: OrderStatus;
  scheduledPickup: Date;
  estimatedWeight: number;
  actualWeight: number | null;
  user: { name: string; phone: string; };
  items: OrderItem[];
  pickupAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    latitude: number | null;
    longitude: number | null;
  };
  agent: { id: number; name: string; } | null;
  totalOrderCost: number;
  invoiceNumber: string | null;
}

interface PricingInfo {
  id: number;
  name: string;
  price: number;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { orderId: string } }
): Promise<NextResponse> {
  try {
    const token = extractTokenFromHeader(req.headers.get('Authorization'));
    if (!token) {
      return NextResponse.json({ message: 'Missing authorization' }, { status: 401 });
    }

    const { entityId, entityType } = verifyToken(token);
    const orderId = parseInt(params.orderId);
    
    if (isNaN(orderId)) {
      return NextResponse.json({ message: 'Invalid order ID' }, { status: 400 });
    }

    const [orderDetails, pricingDetails, transactionDetails] = await Promise.all([
      prisma.order.findFirst({
        where: {
          id: orderId,
          OR: [
            { vendor: { entityId: entityType === EntityType.VENDOR ? entityId : undefined } },
            { agent: { entityId: entityType === EntityType.AGENT ? entityId : undefined } }
          ]
        },
        select: {
          id: true,
          status: true,
          scheduledPickupTime: true,
          estimatedWeight: true,
          actualWeight: true,
          items: true,
          user: {
            select: {
              name: true,
              entity: { select: { phone: true } }
            }
          },
          agent: {
            select: { id: true, name: true }
          },
          pickupAddress: {
            select: {
              street: true,
              city: true,
              state: true,
              postalCode: true,
              country: true,
              latitude: true,
              longitude: true
            }
          }
        }
      }),

      prisma.vendorPricing.findMany({
        where: {
          vendor: {
            orders: {
              some: { id: orderId }
            }
          }
        },
        select: {
          wasteTypeId: true,
          price: true,
          wasteType: {
            select: { name: true }
          }
        }
      }),

      prisma.transaction.findFirst({
        where: {
          orderId,
          status: TransactionStatus.COMPLETED
        },
        select: { invoiceNumber: true },
        orderBy: { date: 'desc' }
      })
    ]);

    if (!orderDetails) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    const pricingMap = new Map<string, PricingInfo>(
      pricingDetails.map(p => [
        p.wasteType.name.toLowerCase(),
        {
          id: p.wasteTypeId,
          name: p.wasteType.name,
          price: Number(p.price)
        }
      ])
    );

    let totalCost = 0;
    const processedItems: OrderItem[] = [];

    if (Array.isArray(orderDetails.items)) {
      for (const item of orderDetails.items as any[]) {
        const pricing = pricingMap.get(item.wasteType?.toLowerCase());
        if (!pricing) continue;

        const quantity = Number(item.quantity);
        if (isNaN(quantity) || quantity <= 0) continue;

        const itemCost = Number((quantity * pricing.price).toFixed(2));
        totalCost += itemCost;

        processedItems.push({
          wasteTypeId: pricing.id,
          wasteType: pricing.name,
          quantity,
          costPerKg: pricing.price,
          totalCost: itemCost
        });
      }
    }

    const response: OrderDetailsResponse = {
      id: orderDetails.id,
      status: orderDetails.status,
      scheduledPickup: orderDetails.scheduledPickupTime,
      estimatedWeight: Number(orderDetails.estimatedWeight),
      actualWeight: orderDetails.actualWeight ? Number(orderDetails.actualWeight) : null,
      user: {
        name: orderDetails.user.name,
        phone: orderDetails.user.entity.phone
      },
      items: processedItems,
      pickupAddress: orderDetails.pickupAddress,
      agent: orderDetails.agent,
      totalOrderCost: Number(totalCost.toFixed(2)),
      invoiceNumber: transactionDetails?.invoiceNumber ?? null
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Order details error:', error);
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json({ 
        message: 'Database error', 
        code: error.code 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Internal server error' 
    }, { status: 500 });
  }
}