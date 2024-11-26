import { NextRequest, NextResponse } from 'next/server';
import { EntityType, AgentStatus, VehicleType, Prisma } from '@prisma/client';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth';
import prisma from '@/lib/prisma';

interface AgentData {
  name: string;
  phone: string;
  vehicleType: VehicleType;
  vehicleNumber: string;
  status: AgentStatus;
}

interface ApiResponse {
  message: string;
  agent?: {
    id: number;
    name: string;
    vehicleType: VehicleType;
    vehicleNumber: string;
    status: AgentStatus;
  };
  error?: string;
}

function jsonResponse(data: ApiResponse, status: number = 200): NextResponse {
  return NextResponse.json(data, { status });
}

async function generateAgentFirebaseUid(): Promise<string> {
  const timestamp = Date.now();
  return `agent_${timestamp}`;
}

async function validateRequest(body: unknown): Promise<AgentData> {
  const data = body as AgentData;
  
  if (!data.name?.trim() || 
      !data.phone?.trim() || 
      !data.vehicleNumber?.trim() ||
      !Object.values(VehicleType).includes(data.vehicleType) ||
      !Object.values(AgentStatus).includes(data.status)) {
    throw new Error('INVALID_INPUT');
  }

  // Clean phone number by removing +91 prefix if present
  data.phone = data.phone.replace(/^\+91/, '');

  return data;
}

export async function POST(req: NextRequest) {
  try {
    const token = extractTokenFromHeader(req.headers.get('Authorization'));
    if (!token) {
      return jsonResponse({ message: 'Missing authorization', error: 'UNAUTHORIZED' }, 401);
    }

    const { entityId, entityType } = verifyToken(token);
    if (entityType !== EntityType.VENDOR) {
      return jsonResponse({ message: 'Only vendors can create agents', error: 'FORBIDDEN' }, 403);
    }

    const agentData = await validateRequest(await req.json());

    const result = await prisma.$transaction(async (tx) => {
      const [vendor, existingEntity] = await Promise.all([
        tx.vendor.findFirst({
          where: { 
            entityId,
            isDeleted: false
          },
          select: { id: true }
        }),
        tx.entity.findUnique({
          where: {
            phone_type: {
              phone: agentData.phone,
              type: EntityType.AGENT
            }
          },
          select: { id: true }
        })
      ]);

      if (!vendor) {
        throw new Error('VENDOR_NOT_FOUND');
      }

      if (existingEntity) {
        throw new Error('PHONE_EXISTS');
      }

      const firebaseUid = await generateAgentFirebaseUid();

      const newEntity = await tx.entity.create({
        data: {
          firebaseUid,
          phone: agentData.phone,
          type: EntityType.AGENT
        }
      });

      const agent = await tx.agent.create({
        data: {
          entityId: newEntity.id,
          name: agentData.name,
          vehicleType: agentData.vehicleType,
          vehicleNumber: agentData.vehicleNumber,
          status: agentData.status,
          rating: new Prisma.Decimal(0),
          vendorId: vendor.id
        },
        select: {
          id: true,
          name: true,
          vehicleType: true,
          vehicleNumber: true,
          status: true
        }
      });

      return agent;
    }, {
      maxWait: 5000,
      timeout: 10000,
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable
    });

    return jsonResponse({
      message: 'Agent created successfully',
      agent: result
    });

  } catch (error) {
    console.error('Error creating agent:', error);

    if (error instanceof Error) {
      switch (error.message) {
        case 'INVALID_INPUT':
          return jsonResponse({ 
            message: 'Missing or invalid required fields',
            error: 'INVALID_INPUT'
          }, 400);
        case 'VENDOR_NOT_FOUND':
          return jsonResponse({ 
            message: 'Vendor not found or inactive',
            error: 'NOT_FOUND'
          }, 404);
        case 'PHONE_EXISTS':
          return jsonResponse({ 
            message: 'An agent with this phone number already exists',
            error: 'CONFLICT'
          }, 409);
      }
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2002':
          return jsonResponse({ 
            message: 'Phone number already registered',
            error: 'DUPLICATE_PHONE'
          }, 409);
        default:
          return jsonResponse({ 
            message: 'Database error',
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