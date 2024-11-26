import { NextRequest, NextResponse } from 'next/server';
import { EntityType, OrderStatus, Prisma } from '@prisma/client';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth';
import prisma from '@/lib/prisma';

interface OrderResponse {
  id: number;
  status: OrderStatus;
  items: any[];
  user: {
    name: string;
    phone: string;
  };
  pickupAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
  };
  agent?: {
    id: number;
    name: string;
  };
  actualPickupTime?: Date | null;
  scheduledPickup?: Date;
  rejectedAt?: Date | null;
  cancelledAt?: Date | null;
  reasons?: string[];
}

function parseOrderItems(items: any): any[] {
  if (typeof items === 'string') {
    try {
      return JSON.parse(items);
    } catch {
      return [];
    }
  }
  return Array.isArray(items) ? items : [];
}

async function getCompletedOrders(vendorId: number): Promise<OrderResponse[]> {
  const orders = await prisma.order.findMany({
    where: {
      vendorId,
      status: OrderStatus.COMPLETED
    },
    include: {
      user: {
        include: {
          entity: true
        }
      },
      agent: true,
      pickupAddress: true
    },
    orderBy: {
      actualPickupTime: 'desc'
    }
  });

  return orders.map(order => ({
    id: order.id,
    status: order.status,
    items: parseOrderItems(order.items),
    user: {
      name: order.user.name,
      phone: order.user.entity.phone
    },
    pickupAddress: {
      street: order.pickupAddress.street,
      city: order.pickupAddress.city,
      state: order.pickupAddress.state,
      postalCode: order.pickupAddress.postalCode
    },
    agent: order.agent ? {
      id: order.agent.id,
      name: order.agent.name
    } : undefined,
    actualPickupTime: order.actualPickupTime,
    scheduledPickup: order.scheduledPickupTime
  }));
}

async function getRejectedOrders(vendorId: number): Promise<OrderResponse[]> {
  const orders = await prisma.order.findMany({
    where: {
      vendorId,
      OrderCancelAndRejectHistory: {
        some: {
          OR: [
            { rejectedAt: { not: null } },
            { cancelledAt: { not: null } }
          ]
        }
      }
    },
    include: {
      user: {
        include: {
          entity: true
        }
      },
      agent: true,
      pickupAddress: true,
      OrderCancelAndRejectHistory: {
        orderBy: {
          rejectedAt: 'desc'
        }
      }
    },
    orderBy: {
      scheduledPickupTime: 'desc'
    }
  });

  return orders.map(order => ({
    id: order.id,
    status: order.status,
    items: parseOrderItems(order.items),
    user: {
      name: order.user.name,
      phone: order.user.entity.phone
    },
    pickupAddress: {
      street: order.pickupAddress.street,
      city: order.pickupAddress.city,
      state: order.pickupAddress.state,
      postalCode: order.pickupAddress.postalCode
    },
    agent: order.agent ? {
      id: order.agent.id,
      name: order.agent.name
    } : undefined,
    scheduledPickup: order.scheduledPickupTime,
    rejectedAt: order.OrderCancelAndRejectHistory[0]?.rejectedAt ?? null,
    cancelledAt: order.OrderCancelAndRejectHistory[0]?.cancelledAt ?? null,
    reasons: order.OrderCancelAndRejectHistory[0]?.reason ? 
      order.OrderCancelAndRejectHistory[0].reason.split('#%#%') : []
  }));
}

export async function GET(req: NextRequest) {
  try {
    const token = extractTokenFromHeader(req.headers.get('Authorization'));
    if (!token) {
      return NextResponse.json({ message: 'Missing authorization' }, { status: 401 });
    }

    const { entityId, entityType } = verifyToken(token);
    if (entityType !== EntityType.VENDOR) {
      return NextResponse.json({ message: 'Unauthorized access' }, { status: 403 });
    }

    const vendor = await prisma.vendor.findFirst({
      where: {
        entityId,
        isDeleted: false
      },
      select: {
        id: true
      }
    });

    if (!vendor) {
      return NextResponse.json({ message: 'Vendor not found' }, { status: 404 });
    }

    const orderType = new URL(req.url).searchParams.get('orderType') as 'completed' | 'rejected';
    if (!orderType || !['completed', 'rejected'].includes(orderType)) {
      return NextResponse.json({ message: 'Invalid order type' }, { status: 400 });
    }

    const orders = orderType === 'completed' 
      ? await getCompletedOrders(vendor.id)
      : await getRejectedOrders(vendor.id);

    return NextResponse.json({
      total: orders.length,
      orders
    });

  } catch (error) {
    console.error('Order history error:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json({ 
        message: 'Database error',
        code: error.code 
      }, { status: 500 });
    }
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}