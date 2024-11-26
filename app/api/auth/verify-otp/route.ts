import { NextRequest, NextResponse } from 'next/server';
import { EntityType, Prisma } from '@prisma/client';
import { generateToken } from '@/lib/auth';
import prisma from '@/lib/prisma';

interface VerifyOTPRequest {
  phone: string;
  otp: string;
  type: EntityType;
}

function jsonResponse(data: any, status: number = 200) {
  return NextResponse.json(data, { status });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.phone || !body.otp || !body.type) {
      return jsonResponse({ message: 'Phone, OTP, and type are required' }, 400);
    }

    const { phone, otp, type } = body as VerifyOTPRequest;

    if (!Object.values(EntityType).includes(type)) {
      return jsonResponse({ message: 'Invalid entity type' }, 400);
    }

    const entity = await prisma.entity.findUnique({
      where: {
        phone_type: {
          phone,
          type
        }
      },
      include: {
        otps: {
          where: {
            isVerified: false,
            expiresAt: {
              gt: new Date()
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      }
    });

    if (!entity || !entity.isActive || entity.deletedAt) {
      return jsonResponse({ message: 'Account not found or inactive' }, 404);
    }

    const latestOTP = entity.otps[0];
    if (!latestOTP) {
      return jsonResponse({ message: 'No valid OTP found. Please request a new one' }, 401);
    }

    if (latestOTP.attempts >= 3) {
      await prisma.otp.update({
        where: { id: latestOTP.id },
        data: { isVerified: true }
      });
      return jsonResponse({ message: 'Maximum attempts exceeded. Please request a new OTP' }, 401);
    }

    await prisma.otp.update({
      where: { id: latestOTP.id },
      data: { attempts: { increment: 1 } }
    });

    if (latestOTP.otp !== otp) {
      return jsonResponse({ 
        message: 'Invalid OTP',
        remainingAttempts: 2 - latestOTP.attempts
      }, 401);
    }

    await prisma.otp.update({
      where: { id: latestOTP.id },
      data: { isVerified: true }
    });

    let entityInfo: { id: number; type: EntityType; name?: string };

    if (type === EntityType.ADMIN) {
      entityInfo = {
        id: entity.id,
        type: EntityType.ADMIN
      };
    } else {
      const relatedEntity = await getRelatedEntity(entity.id, type);
      
      if (!relatedEntity || relatedEntity.isDeleted) {
        return jsonResponse({ message: `${type} account is inactive` }, 403);
      }

      entityInfo = {
        id: relatedEntity.id,
        type,
        name: relatedEntity.name
      };
    }

    const token = generateToken({
      entityId: entity.id,
      entityType: entity.type
    });

    return jsonResponse({
      message: 'Authentication successful',
      user: entityInfo,
      token
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return jsonResponse({ 
        message: 'Database error', 
        error: error.code 
      }, 500);
    }

    return jsonResponse({ message: 'Authentication failed' }, 500);
  }
}

async function getRelatedEntity(entityId: number, type: EntityType) {
  switch (type) {
    case EntityType.VENDOR:
      return prisma.vendor.findUnique({
        where: { entityId },
        select: { id: true, name: true, isDeleted: true }
      });
    case EntityType.AGENT:
      return prisma.agent.findUnique({
        where: { entityId },
        select: { id: true, name: true, isDeleted: true }
      });
    case EntityType.USER:
      return prisma.user.findUnique({
        where: { entityId },
        select: { id: true, name: true, isDeleted: true }
      });
    default:
      return null;
  }
}