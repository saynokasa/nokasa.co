import { NextRequest, NextResponse } from 'next/server';
import { EntityType, OrderStatus, Prisma } from '@prisma/client';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth';
import prisma from '@/lib/prisma';

interface CancelOrderRequest {
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
    if (entityType !== EntityType.VENDOR) {
      return jsonResponse({ message: 'Only vendors can cancel orders' }, 403);
    }

    const orderId = parseInt(params.orderId);
    if (isNaN(orderId)) {
      return jsonResponse({ message: 'Invalid order ID' }, 400);
    }

    const { reasons } = await req.json() as CancelOrderRequest;
    if (!Array.isArray(reasons) || reasons.length === 0) {
      return jsonResponse({ message: 'At least one cancellation reason is required' }, 400);
    }

    try {
      const orderDetails = await prisma.order.findFirst({
        where: {
          id: orderId,
          vendor: {
            entityId,
            isDeleted: false
          }
        },
        select: {
          id: true,
          status: true,
          vendorId: true
        }
      });

      if (!orderDetails) {
        return jsonResponse({ message: 'Order not found or not authorized' }, 404);
      }

      if (orderDetails.status !== OrderStatus.ACCEPTED) {
        return jsonResponse({ 
          message: `Cannot cancel order in ${orderDetails.status} status`,
          status: orderDetails.status
        }, 400);
      }

      await prisma.$transaction([
        prisma.order.update({
          where: {
            id: orderId,
          },
          data: {
            status: OrderStatus.CANCELLED,
            agentId: null
          }
        }),

        prisma.orderCancelAndRejectHistory.create({
          data: {
            orderId,
            reason: reasons.join('#%#%'),
            entityId,
            cancelledAt: new Date()
          }
        })
      ]);

      const updatedOrder = await prisma.order.findUnique({
        where: { id: orderId },
        select: { status: true }
      });

      if (!updatedOrder || updatedOrder.status !== OrderStatus.CANCELLED) {
        throw new Error('CANCELLATION_FAILED');
      }

      return jsonResponse({
        message: 'Order cancelled successfully',
        status: OrderStatus.CANCELLED
      });

    } catch (error) {
      console.error('Transaction error:', error);
      
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        console.error('Prisma error code:', error.code);
        console.error('Prisma error message:', error.message);
        
        return jsonResponse({ 
          message: 'Failed to cancel order. Please try again.' 
        }, 500);
      }

      if (error instanceof Error && error.message === 'CANCELLATION_FAILED') {
        return jsonResponse({ 
          message: 'Order cancellation failed. Please try again.' 
        }, 500);
      }

      throw error;
    }

  } catch (error) {
    console.error('Error in cancel order API:', error);

    return jsonResponse({ 
      message: 'An unexpected error occurred. Please try again.' 
    }, 500);
  }
}