import { NextRequest, NextResponse } from 'next/server';
import { OrderStatus, EntityType, Prisma } from '@prisma/client';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const token = extractTokenFromHeader(req.headers.get('Authorization'));
    if (!token) {
      return NextResponse.json({ message: 'Authentication failed' }, { status: 401 });
    }

    const { entityId, entityType } = verifyToken(token);
    if (entityType !== EntityType.AGENT) {
      return NextResponse.json({ message: 'Unauthorized access' }, { status: 403 });
    }

    const orderId = parseInt(params.orderId);
    const { otp } = await req.json();

    const orderData = await prisma.$queryRaw<Array<{
      orderId: number;
      estimatedWeight: string;
      actualWeight: string | null;
      orderOtp: string;
    }>>`
      SELECT 
        o.id as orderId,
        o.estimatedWeight,
        o.actualWeight,
        o.otp as orderOtp
      FROM \`Order\` o
      JOIN Agent a 
        USE INDEX (idx_agent_active)
        ON o.agentId = a.id
        AND a.entityId = ${entityId}
        AND a.isDeleted = FALSE
      WHERE o.id = ${orderId}
        AND o.status = ${OrderStatus.ACCEPTED}
      LIMIT 1
    `;

    if (!orderData.length) {
      return NextResponse.json({ 
        message: 'Order not found or not assigned to this agent' 
      }, { status: 404 });
    }

    const order = orderData[0];
    if (!order.orderOtp || order.orderOtp !== otp.toString()) {
      return NextResponse.json({ message: 'Invalid OTP' }, { status: 400 });
    }

    const weightToUse = order.actualWeight || order.estimatedWeight;

    const updatedOrder = await prisma.$executeRaw`
      UPDATE \`Order\`
      SET 
        status = ${OrderStatus.COMPLETED},
        actualPickupTime = NOW(),
        actualWeight = ${weightToUse},
        updatedAt = NOW()
      WHERE id = ${orderId}
        AND status = ${OrderStatus.ACCEPTED}
      AND agentId = (
        SELECT id FROM Agent 
        WHERE entityId = ${entityId} 
        AND isDeleted = FALSE 
        LIMIT 1
      )
    `;

    if (!updatedOrder) {
      return NextResponse.json({ 
        message: 'Order status has changed' 
      }, { status: 409 });
    }

    return NextResponse.json({
      message: 'Pickup confirmed',
      status: OrderStatus.COMPLETED
    });

  } catch (error) {
    console.error('Pickup confirmation error:', error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return NextResponse.json({ 
          message: 'Order not found' 
        }, { status: 404 });
      }
    }

    return NextResponse.json({ 
      message: 'Internal server error' 
    }, { status: 500 });
  }
}