import { NextRequest, NextResponse } from 'next/server';
import { EntityType, OrderStatus, Prisma } from '@prisma/client';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth';
import prisma from '@/lib/prisma';

interface RejectOrderRequest {
  reasons: string[];
}

function jsonResponse(data: { message: string; status?: OrderStatus }, statusCode: number = 200) {
  return NextResponse.json(data, { status: statusCode });
}

export async function POST(
  req: NextRequest, 
  { params }: { params: { orderId: string } }
) {
  try {
    const token = extractTokenFromHeader(req.headers.get('Authorization'));
    if (!token) {
      return jsonResponse({ message: 'Missing authorization' }, 401);
    }

    const { entityId, entityType } = verifyToken(token);
    const orderId = parseInt(params.orderId);
    
    if (isNaN(orderId)) {
      return jsonResponse({ message: 'Invalid order ID' }, 400);
    }

    const { reasons } = await req.json() as RejectOrderRequest;
    if (!Array.isArray(reasons) || reasons.length === 0) {
      return jsonResponse({ message: 'At least one reason is required for rejecting an order' }, 400);
    }

    if (entityType === EntityType.VENDOR) {
      const result = await prisma.$transaction(async (tx) => {
        const vendor = await tx.vendor.findFirst({
          where: {
            entityId,
            isDeleted: false
          },
          select: { id: true }
        });

        if (!vendor) {
          throw new Error('VENDOR_NOT_FOUND');
        }

        const order = await tx.order.findFirst({
          where: {
            id: orderId,
            status: OrderStatus.NEW
          },
          select: { id: true }
        });

        if (!order) {
          throw new Error('INVALID_ORDER_STATUS');
        }

        await tx.order.update({
          where: { id: orderId },
          data: {
            status: OrderStatus.REJECTED,
            vendorId: vendor.id,
            agentId: null
          }
        });

        await tx.orderCancelAndRejectHistory.create({
          data: {
            orderId,
            reason: reasons.join('#%#%'),
            entityId,
            rejectedAt: new Date()
          }
        });

        return { success: true };
      }, {
        maxWait: 5000,
        timeout: 10000
      });

      return jsonResponse({
        message: 'Order rejected by vendor',
        status: OrderStatus.REJECTED
      });
    }

    if (entityType === EntityType.AGENT) {
      const result = await prisma.$transaction(async (tx) => {
        const agent = await tx.agent.findFirst({
          where: {
            entityId,
            isDeleted: false
          },
          select: { id: true }
        });

        if (!agent) {
          throw new Error('AGENT_NOT_FOUND');
        }

        const order = await tx.order.findFirst({
          where: {
            id: orderId,
            agentId: agent.id
          },
          select: { id: true }
        });

        if (!order) {
          throw new Error('ORDER_NOT_ASSIGNED');
        }

        await tx.order.update({
          where: { id: orderId },
          data: {
            status: OrderStatus.REJECTED
          }
        });

        await tx.orderCancelAndRejectHistory.create({
          data: {
            orderId,
            reason: reasons.join('#%#%'),
            entityId,
            rejectedAt: new Date()
          }
        });

        return { success: true };
      }, {
        maxWait: 5000,
        timeout: 10000
      });

      return jsonResponse({
        message: 'Order rejected by agent',
        status: OrderStatus.REJECTED
      });
    }

    return jsonResponse({ message: 'Unauthorized access' }, 403);

  } catch (error) {
    console.error('Error processing reject order:', error);

    if (error instanceof Error) {
      switch (error.message) {
        case 'VENDOR_NOT_FOUND':
          return jsonResponse({ message: 'Vendor not found' }, 404);
        case 'AGENT_NOT_FOUND':
          return jsonResponse({ message: 'Agent not found' }, 404);
        case 'INVALID_ORDER_STATUS':
          return jsonResponse({ message: 'Order can only be rejected when in NEW status' }, 403);
        case 'ORDER_NOT_ASSIGNED':
          return jsonResponse({ message: 'Order not assigned to this agent' }, 403);
      }
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return jsonResponse({ message: 'Database error', status: OrderStatus.NEW }, 500);
    }

    return jsonResponse({ message: 'Internal server error' }, 500);
  }
}