import { NextRequest, NextResponse } from 'next/server';
import { EntityType } from '@prisma/client';
import prisma from '@/lib/prisma';
import axios from 'axios';

interface RequestBody {
  phoneNumber: string;
  type: EntityType;
}

interface JsonResponseData {
  error?: string;
  message?: string;
  details?: any;
  debug?: any;
  activeOtpExpiresIn?: number;
}

function jsonResponse(data: JsonResponseData, status: number = 200) {
  return NextResponse.json(data, { status: status });
}

function generateOTP(length: number = 6): string {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return Math.floor(min + Math.random() * (max - min + 1)).toString();
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body: RequestBody = await req.json();
    const { phoneNumber, type } = body;
    
    if (!phoneNumber || !type) {
      return jsonResponse(
        { error: 'Phone number and type are required' },
        400
      );
    }

    if (!Object.values(EntityType).includes(type)) {
      return jsonResponse(
        { error: 'Invalid entity type' },
        400
      );
    }

    const entity = await prisma.entity.findUnique({
      where: {
        phone_type: {
          phone: phoneNumber,
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

    if (!entity) {
      return jsonResponse(
        { error: 'Account not found with this phone number' },
        404
      );
    }

    if (entity.otps.length > 0) {
      const activeOtp = entity.otps[0];
      const timeLeft = Math.ceil((activeOtp.expiresAt.getTime() - Date.now()) / 1000);
      
      return jsonResponse({
        error: 'Active OTP exists',
        activeOtpExpiresIn: timeLeft,
      }, 409);
    }

    const otp = generateOTP();
    const expiryTime = new Date(Date.now() + 5 * 60 * 1000);

    await prisma.otp.create({
      data: {
        entityId: entity.id,
        otp,
        expiresAt: expiryTime,
        isVerified: false,
        attempts: 0
      }
    });
    
    const formattedPhone = phoneNumber.replace(/^\+?91/, '').replace(/\s/g, '');
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
          debug: process.env.NODE_ENV === 'development' ? {
            otp,
            apiResponse: response.data
          } : undefined
        }, 200);
      } else {
        await prisma.otp.deleteMany({
          where: {
            entityId: entity.id,
            isVerified: false
          }
        });

        throw new Error(`SMS Gateway Error: ${response.data}`);
      }
    } catch (apiError: any) {
      await prisma.otp.deleteMany({
        where: {
          entityId: entity.id,
          isVerified: false
        }
      });

      console.error('SMS Gateway Error:', {
        message: apiError.message,
        response: apiError?.response?.data,
      });
      
      return jsonResponse(
        { error: 'Failed to send OTP', details: apiError?.response?.data || apiError.message },
        500
      );
    }
  } catch (error: any) {
    console.error('Error processing request:', error);
    return jsonResponse(
      { error: 'Internal server error', details: error.message },
      500
    );
  }
}