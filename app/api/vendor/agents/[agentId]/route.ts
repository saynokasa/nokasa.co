import { NextRequest, NextResponse } from 'next/server';
import { EntityType, AgentStatus, VehicleType, Prisma } from '@prisma/client';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth';
import prisma from '@/lib/prisma';

interface AgentUpdateData {
  name?: string;
  phone?: string;
  vehicleType?: VehicleType;
  vehicleNumber?: string;
  status?: AgentStatus;
}

interface ApiResponse {
  message: string;
  agent?: {
    id: number;
    name: string;
    vehicleType: VehicleType;
    vehicleNumber: string;
    status: AgentStatus;
    entity: {
      phone: string;
    };
  };
  error?: string;
}

function jsonResponse(data: ApiResponse, status: number = 200): NextResponse {
  return NextResponse.json(data, { status });
}

async function validateUpdateData(data: unknown): Promise<AgentUpdateData> {
  const updateData = data as AgentUpdateData;
  
  if (Object.keys(updateData).length === 0) {
    throw new Error('NO_UPDATE_DATA');
  }

  if (updateData.name?.trim() === '') {
    throw new Error('INVALID_NAME');
  }

  if (updateData.phone && !/^\+[1-9]\d{10,14}$/.test(updateData.phone)) {
    throw new Error('INVALID_PHONE');
  }

  if (updateData.vehicleType && !Object.values(VehicleType).includes(updateData.vehicleType)) {
    throw new Error('INVALID_VEHICLE_TYPE');
  }

  if (updateData.status && !Object.values(AgentStatus).includes(updateData.status)) {
    throw new Error('INVALID_STATUS');
  }

  if (updateData.vehicleNumber?.trim() === '') {
    throw new Error('INVALID_VEHICLE_NUMBER');
  }

  return updateData;
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { agentId: string } }
) {
  try {
    const token = extractTokenFromHeader(req.headers.get('Authorization'));
    if (!token) {
      return jsonResponse({ message: 'Missing authorization', error: 'UNAUTHORIZED' }, 401);
    }

    const { entityId, entityType } = verifyToken(token);
    if (entityType !== EntityType.VENDOR) {
      return jsonResponse({ message: 'Only vendors can edit agents', error: 'FORBIDDEN' }, 403);
    }

    const agentId = parseInt(params.agentId);
    if (isNaN(agentId)) {
      return jsonResponse({ message: 'Invalid agent ID', error: 'INVALID_ID' }, 400);
    }

    const updateData = await validateUpdateData(await req.json());

    const result = await prisma.$transaction(async (tx) => {
      const [vendor, agent] = await Promise.all([
        tx.vendor.findFirst({
          where: { 
            entityId,
            isDeleted: false 
          },
          select: { id: true }
        }),
        tx.agent.findUnique({
          where: { id: agentId },
          select: {
            id: true,
            vendorId: true,
            entityId: true
          }
        })
      ]);

      if (!vendor) {
        throw new Error('VENDOR_NOT_FOUND');
      }

      if (!agent || agent.vendorId !== vendor.id) {
        throw new Error('AGENT_NOT_FOUND');
      }

      if (updateData.phone) {
        const existingPhone = await tx.entity.findFirst({
          where: {
            phone: updateData.phone,
            type: EntityType.AGENT,
            NOT: { id: agent.entityId }
          }
        });

        if (existingPhone) {
          throw new Error('PHONE_EXISTS');
        }
      }

      const [updatedAgent] = await Promise.all([
        tx.agent.update({
          where: { id: agentId },
          data: {
            ...(updateData.name && { name: updateData.name }),
            ...(updateData.vehicleType && { vehicleType: updateData.vehicleType }),
            ...(updateData.vehicleNumber && { vehicleNumber: updateData.vehicleNumber }),
            ...(updateData.status && { status: updateData.status }),
            entity: updateData.phone ? {
              update: { phone: updateData.phone }
            } : undefined
          },
          select: {
            id: true,
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
        }),
      ]);

      return updatedAgent;
    }, {
      maxWait: 5000,
      timeout: 8000,
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable
    });

    return jsonResponse({
      message: 'Agent updated successfully',
      agent: result
    });

  } catch (error) {
    console.error('Error updating agent:', error);

    if (error instanceof Error) {
      switch (error.message) {
        case 'NO_UPDATE_DATA':
          return jsonResponse({ message: 'No update data provided', error: 'INVALID_INPUT' }, 400);
        case 'INVALID_NAME':
        case 'INVALID_PHONE':
        case 'INVALID_VEHICLE_TYPE':
        case 'INVALID_VEHICLE_NUMBER':
        case 'INVALID_STATUS':
          return jsonResponse({ 
            message: `Invalid ${error.message.split('_')[1].toLowerCase()}`,
            error: error.message 
          }, 400);
        case 'VENDOR_NOT_FOUND':
          return jsonResponse({ message: 'Vendor not found', error: 'NOT_FOUND' }, 404);
        case 'AGENT_NOT_FOUND':
          return jsonResponse({ 
            message: 'Agent not found or does not belong to this vendor',
            error: 'NOT_FOUND'
          }, 404);
        case 'PHONE_EXISTS':
          return jsonResponse({ 
            message: 'Phone number already in use',
            error: 'CONFLICT'
          }, 409);
      }
    }

    return jsonResponse({ 
      message: 'Internal server error',
      error: 'INTERNAL_ERROR'
    }, 500);
  }
}