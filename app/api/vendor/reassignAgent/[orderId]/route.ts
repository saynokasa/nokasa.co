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
    if (entityType !== EntityType.VENDOR) {
      return NextResponse.json({ message: 'Only vendors can reassign an order' }, { status: 403 });
    }

    const orderId = parseInt(params.orderId);
    const { agentId } = await req.json();
    if (!agentId) {
      return NextResponse.json({ message: 'Agent ID is required' }, { status: 400 });
    }

    const result = await prisma.$queryRaw<Array<{ orderId: number }>>`
      SELECT o.id as orderId
      FROM \`Order\` o
      JOIN Vendor v 
        USE INDEX (idx_vendor_entity_status)
        ON o.vendorId = v.id 
        AND v.entityId = ${entityId}
        AND v.isDeleted = FALSE
      JOIN Agent a 
        USE INDEX (idx_agent_vendor_status)
        ON a.id = ${agentId}
        AND a.vendorId = v.id
        AND a.isDeleted = FALSE
      WHERE o.id = ${orderId}
        AND o.status = ${OrderStatus.ACCEPTED}
      LIMIT 1
    `;

    if (!result.length) {
      return NextResponse.json({ 
        message: 'Invalid order or agent, or order cannot be reassigned' 
      }, { status: 403 });
    }

    const updatedOrder = await prisma.$executeRaw`
      UPDATE \`Order\`
      SET agentId = ${agentId}
      WHERE id = ${orderId}
        AND status = ${OrderStatus.ACCEPTED}
    `;

    if (!updatedOrder) {
      return NextResponse.json({ 
        message: 'Order status has changed' 
      }, { status: 409 });
    }

    return NextResponse.json({
      message: 'Order reassigned',
      status: OrderStatus.ACCEPTED
    });

  } catch (error) {
    console.error('Error reassigning agent:', error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return NextResponse.json({ 
          message: 'Order or agent not found' 
        }, { status: 404 });
      }
    }

    return NextResponse.json({ 
      message: 'Internal server error' 
    }, { status: 500 });
  }
}