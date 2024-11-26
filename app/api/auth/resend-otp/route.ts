import { NextRequest, NextResponse } from 'next/server';
import { EntityType, Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import axios from 'axios';

interface ResendOTPRequest {
  phone: string;
  type: EntityType;
}

function jsonResponse(data: any, status: number = 200) {
  return NextResponse.json(data, { status });
}

function generateOTP(length: number = 6): string {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return Math.floor(min + Math.random() * (max - min + 1)).toString();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.phone || !body.type) {
      return jsonResponse({ message: 'Phone and type are required' }, 400);
    }

    const { phone, type } = body as ResendOTPRequest;

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
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 5
        }
      }
    });

    if (!entity || !entity.isActive || entity.deletedAt) {
      return jsonResponse({ message: 'Account not found or inactive' }, 404);
    }

    const recentOTPs = entity.otps;
    
    if (recentOTPs.length >= 5) {
      return jsonResponse({ 
        message: 'Maximum OTP requests exceeded. Please try again later',
        nextAllowedAt: new Date(recentOTPs[4].createdAt.getTime() + 24 * 60 * 60 * 1000)
      }, 429);
    }

    const lastOTP = recentOTPs[0];
    if (lastOTP && !lastOTP.isVerified && 
        Date.now() - lastOTP.createdAt.getTime() < 1 * 60 * 1000) {
      const waitTime = Math.ceil((lastOTP.createdAt.getTime() + 60 * 1000 - Date.now()) / 1000);
      return jsonResponse({ 
        message: 'Please wait before requesting a new OTP',
        retryAfterSeconds: waitTime 
      }, 429);
    }

    const otp = generateOTP();
    const expiryTime = new Date(Date.now() + 5 * 60 * 1000);

    const newOTP = await prisma.otp.create({
      data: {
        entityId: entity.id,
        otp,
        expiresAt: expiryTime,
        isVerified: false,
        attempts: 0
      }
    });

    const formattedPhone = phone.replace(/^\+?91/, '').replace(/\s/g, '');
    const phoneWithCountryCode = `91${formattedPhone}`;

    const params: Record<string, string> = {
      username: process.env.SMS_USERNAME!,
      password: process.env.SMS_PASSWORD!,
      type: '0',
      dlr: '1',
      destination: phoneWithCountryCode,
      source: process.env.SMS_SOURCE!,
      message: `Please use the code ${otp} to login on NoKasa. Please do not share this code with anyone for security reason.`,
      entityid: process.env.ENTITY_ID!,
      tempid: process.env.TEMPLATE_ID!,
      header: process.env.HEADER_ID!
    };

    try {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        searchParams.append(key, value);
      });

      const response = await axios({
        method: 'get',
        url: `${process.env.SMS_API_URL}`,
        params: searchParams,
        timeout: 10000,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      if (response.data && (response.data.includes('1701') || response.data.includes('1702'))) {
        return jsonResponse({ 
          message: 'OTP sent successfully',
          debug: {
            otp: process.env.NODE_ENV === 'development' ? otp : undefined,
            apiResponse: process.env.NODE_ENV === 'development' ? response.data : undefined
          }
        });
      } else {
        throw new Error(`SMS Gateway Error: ${response.data}`);
      }
    } catch (smsError: any) {
      console.error('SMS Gateway Error:', {
        error: smsError,
        response: smsError?.response?.data
      });

      if (newOTP) {
        await prisma.otp.delete({
          where: { id: newOTP.id }
        });
      }

      throw new Error('Failed to send SMS');
    }

  } catch (error: any) {
    console.error('Resend OTP error:', error);
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return jsonResponse({ 
        message: 'Database error', 
        error: error.code 
      }, 500);
    }

    return jsonResponse({ 
      message: 'Failed to send OTP',
      error: error.message 
    }, 500);
  }
}