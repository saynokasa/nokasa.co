import { NextRequest, NextResponse } from 'next/server';
import { EntityType, Prisma } from '@prisma/client';
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
    if (isNaN(orderId)) {
      return NextResponse.json({ message: 'Invalid order ID' }, { status: 400 });
    }

    const result = await prisma.$executeRaw`
      UPDATE \`Order\` o
      JOIN Agent a 
        USE INDEX (idx_agent_active)
        ON o.agentId = a.id
        AND a.entityId = ${entityId}
        AND a.isDeleted = FALSE
      SET o.otp = '654321',
          o.updatedAt = NOW()
      WHERE o.id = ${orderId}
    `;

    if (!result) {
      return NextResponse.json({ 
        message: 'Order not found or not assigned to this agent' 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'OTP resent successfully', 
      otp: '654321'
    });

  } catch (error) {
    console.error('OTP resend error:', error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      const message = error.code === 'P2025' 
        ? 'Order not found'
        : 'Database error';
      return NextResponse.json({ message }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Internal server error' 
    }, { status: 500 });
  }
}