import { NextRequest, NextResponse } from 'next/server';
import { EntityType, VehicleType, AgentStatus, Prisma } from '@prisma/client';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth';
import prisma from '@/lib/prisma';

interface AgentResponse {
  id: number;
  entityId: number;
  name: string;
  phone: string;
  vehicleType: VehicleType;
  vehicleNumber: string;
  status: AgentStatus;
}

function jsonResponse(data: { message?: string; data?: AgentResponse; error?: string }, status = 200): NextResponse {
  return NextResponse.json(data, { 
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function GET(
  req: NextRequest, 
  { params }: { params: { agentId: string } }
) {
  try {
    const agentId = parseInt(params.agentId);
    if (isNaN(agentId) || agentId <= 0) {
      return jsonResponse({ 
        message: 'Invalid agent ID',
        error: 'INVALID_INPUT'
      }, 400);
    }

    const token = extractTokenFromHeader(req.headers.get('Authorization'));
    if (!token) {
      return jsonResponse({ 
        message: 'Missing authorization',
        error: 'UNAUTHORIZED'
      }, 401);
    }

    const { entityId, entityType } = verifyToken(token);
    if (entityType !== EntityType.VENDOR) {
      return jsonResponse({ 
        message: 'Only vendors can access agent details',
        error: 'FORBIDDEN'
      }, 403);
    }

    const agent = await prisma.agent.findFirst({
      where: {
        id: agentId,
        isDeleted: false,
        vendor: {
          entityId: entityId,
          isDeleted: false
        }
      },
      select: {
        id: true,
        entityId: true,
        name: true,
        vehicleType: true,
        vehicleNumber: true,
        status: true,
        entity: {
          select: {
            phone: true
          }
        }
      }
    });

    if (!agent) {
      return jsonResponse({ 
        message: 'Agent not found or does not belong to this vendor',
        error: 'NOT_FOUND'
      }, 404);
    }

    const response: AgentResponse = {
      id: agent.id,
      entityId: agent.entityId,
      name: agent.name,
      phone: agent.entity.phone,
      vehicleType: agent.vehicleType,
      vehicleNumber: agent.vehicleNumber,
      status: agent.status
    };

    return jsonResponse({ data: response });

  } catch (error) {
    console.error('Agent details error:', error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2021') {
        return jsonResponse({
          message: 'Database table not found',
          error: 'DB_ERROR'
        }, 500);
      }
    }

    return jsonResponse({ 
      message: 'Internal server error',
      error: 'INTERNAL_ERROR'
    }, 500);
  }
}