import { NextRequest, NextResponse } from 'next/server';
import { EntityType, OrderStatus, Prisma } from '@prisma/client';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth';
import prisma from '@/lib/prisma';

interface AcceptOrderRequest {
  agentId: number;
}

function jsonResponse(data: { message: string; status?: OrderStatus }, statusCode: number = 200): NextResponse {
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
    if (entityType !== EntityType.VENDOR) {
      return jsonResponse({ message: 'Only vendors can accept an order' }, 403);
    }

    const orderId = parseInt(params.orderId);
    if (isNaN(orderId)) {
      return jsonResponse({ message: 'Invalid order ID' }, 400);
    }

    const { agentId } = await req.json() as AcceptOrderRequest;
    if (!agentId) {
      return jsonResponse({ message: 'Agent ID is required' }, 400);
    }

    const result = await prisma.$transaction(async (tx) => {
      const [orderData, agentData] = await Promise.all([
        tx.order.findUnique({
          where: { id: orderId },
          select: {
            id: true,
            status: true
          }
        }),
        tx.agent.findFirst({
          where: {
            id: agentId,
            vendor: {
              entityId,
              isDeleted: false
            }
          },
          select: { 
            id: true,
            vendorId: true 
          }
        })
      ]);

      if (!orderData) {
        throw new Error('ORDER_NOT_FOUND');
      }

      if (orderData.status !== OrderStatus.NEW) {
        throw new Error(`STATUS_${orderData.status}`);
      }

      if (!agentData) {
        throw new Error('INVALID_AGENT');
      }

      const updatedOrder = await tx.order.update({
        where: {
          id: orderId,
          status: OrderStatus.NEW
        },
        data: {
          status: OrderStatus.ACCEPTED,
          vendorId: agentData.vendorId,
          agentId: agentData.id
        },
        select: {
          status: true
        }
      });

      return updatedOrder;
    }, {
      maxWait: 5000,
      timeout: 8000,
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable
    });

    return jsonResponse({
      message: 'Order accepted successfully',
      status: result.status
    });

  } catch (error) {
    console.error('Error accepting order:', error);

    if (error instanceof Error) {
      switch (error.message) {
        case 'ORDER_NOT_FOUND':
          return jsonResponse({ message: 'Order not found' }, 404);
        case 'INVALID_AGENT':
          return jsonResponse({ 
            message: 'Invalid agent or agent does not belong to the vendor' 
          }, 403);
      }

      if (error.message.startsWith('STATUS_')) {
        const currentStatus = error.message.split('_')[1];
        return jsonResponse({ 
          message: `Order can only be accepted when in NEW status. Current status: ${currentStatus}`,
          status: currentStatus as OrderStatus
        }, 400);
      }
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2002':
          return jsonResponse({ message: 'Order already accepted' }, 400);
        case 'P2025':
          return jsonResponse({ 
            message: 'Order status changed. Please refresh and try again' 
          }, 409);
        default:
          return jsonResponse({ message: 'Database error' }, 500);
      }
    }

    return jsonResponse({ message: 'Internal server error' }, 500);
  }
}