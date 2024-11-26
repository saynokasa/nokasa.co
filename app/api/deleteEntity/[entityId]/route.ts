import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, EntityType, OrderStatus } from '@prisma/client';
import { verifyToken, extractTokenFromHeader, JwtPayload } from '@/lib/auth';

const prisma = new PrismaClient();

export async function DELETE(req: NextRequest, { params }: { params: { entityId: string } }) {
  try {
    const authHeader = req.headers.get('Authorization');
    let decodedToken: JwtPayload;

    try {
      const token = extractTokenFromHeader(authHeader);
      decodedToken = verifyToken(token);
    } catch (err) {
      return NextResponse.json({ message: 'Authentication failed' }, { status: 401 });
    }

    const { entityId: requestingEntityId, entityType: requestingEntityType } = decodedToken;
    const targetEntityId = parseInt(params.entityId);

    const hasPermission = await hasDeletePermission(requestingEntityId, requestingEntityType as EntityType, targetEntityId);
    if (!hasPermission) {
      return NextResponse.json({ message: 'Permission denied' }, { status: 403 });
    }

    const entity = await prisma.entity.findUnique({
      where: { id: targetEntityId },
      include: {
        vendor: true,
        agent: true,
        user: true,
      },
    });

    if (!entity) {
      return NextResponse.json({ message: 'Entity not found' }, { status: 404 });
    }

    switch (entity.type) {
      case EntityType.VENDOR:
        await deleteVendor(entity.vendor!.id);
        break;
      case EntityType.AGENT:
        await deleteAgent(entity.agent!.id);
        break;
      case EntityType.USER:
        await deleteUser(entity.user!.id);
        break;
    }

    await prisma.entity.update({
      where: { id: targetEntityId },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });

    return NextResponse.json({ message: 'Entity deleted successfully' });

  } catch (error) {
    console.error('Error deleting entity:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

async function deleteVendor(vendorId: number) {
  await prisma.vendor.update({
    where: { id: vendorId },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
    },
  });

  await prisma.agent.updateMany({
    where: { vendorId: vendorId },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
      status: 'OFFLINE',
    },
  });
}

async function deleteAgent(agentId: number) {
  await prisma.agent.update({
    where: { id: agentId },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
      status: 'OFFLINE',
    },
  });
}

async function deleteUser(userId: number) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
    },
  });
}

async function hasDeletePermission(requestingEntityId: number, requestingEntityType: EntityType, targetEntityId: number): Promise<boolean> {
  if (requestingEntityType === EntityType.ADMIN) {
    return true;
  }

  if (requestingEntityType === EntityType.VENDOR) {
    const vendor = await prisma.vendor.findUnique({
      where: { entityId: requestingEntityId }, 
    });

    if (!vendor) {
      return false; 
    }

    const targetEntity = await prisma.entity.findUnique({
      where: { id: targetEntityId },
      include: { agent: true, vendor: true, user: true }, 
    });

    if (targetEntity?.type === EntityType.AGENT && targetEntity.agent) {
      const agentCount = await prisma.agent.count({
        where: { vendorId: vendor.id, isDeleted: false },
      });

      if (agentCount <= 1) {
        return false;
      }

      const hasPendingOrders = await prisma.order.count({
        where: { agentId: targetEntity.agent.id, status: OrderStatus.ACCEPTED },
      });

      if (hasPendingOrders > 0) {
        return false; 
      }

      const vendorAgent = await prisma.agent.findFirst({
        where: {
          id: targetEntity.agent.id,
          vendorId: vendor.id, 
        },
      });

      return !!vendorAgent; 
    }

    if (targetEntity?.type === EntityType.VENDOR && targetEntityId === requestingEntityId) {
      const hasAcceptedOrders = await prisma.order.count({
        where: { vendorId: vendor.id, status: OrderStatus.ACCEPTED },
      });

      if (hasAcceptedOrders > 0) {
        return false;
      }

      return true; 
    }
  }

  if (requestingEntityType === EntityType.USER) {
    if (targetEntityId === requestingEntityId) {
      const hasOrders = await prisma.order.count({
        where: { userId: targetEntityId },
      });

      if (hasOrders > 0) {
        return false; 
      }

      return true; 
    }
  }

  return false;
}
