import { NextRequest, NextResponse } from 'next/server';
import { EntityType, Prisma } from '@prisma/client';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth';
import prisma from '@/lib/prisma';

interface PricingResponse {
  vendorId: number;
  pricings: Array<{
    wasteType: string;
    postalCode: string;
    price: number;
  }>;
}

export async function GET(req: NextRequest) {
  try {
    const token = extractTokenFromHeader(req.headers.get('Authorization'));
    if (!token) {
      return NextResponse.json({ message: 'Authentication failed' }, { status: 401 });
    }

    const { entityId, entityType } = verifyToken(token);
    if (entityType !== EntityType.AGENT) {
      return NextResponse.json({ message: 'Unauthorized access' }, { status: 403 });
    }

    const agent = await prisma.agent.findFirst({
      where: {
        entityId,
        isDeleted: false
      },
      select: {
        vendorId: true
      }
    });

    if (!agent) {
      return NextResponse.json({ message: 'Agent not found or inactive' }, { status: 404 });
    }

    const vendorPricings = await prisma.vendorPricing.findMany({
      where: {
        vendorId: agent.vendorId
      },
      select: {
        postalCode: true,
        price: true,
        wasteType: {
          select: {
            name: true
          }
        }
      },
      orderBy: [
        {
          wasteType: {
            name: 'asc'
          }
        },
        {
          postalCode: 'asc'
        }
      ]
    });

    if (!vendorPricings.length) {
      return NextResponse.json({ message: 'No pricing data found' }, { status: 404 });
    }

    const response: PricingResponse = {
      vendorId: agent.vendorId,
      pricings: vendorPricings.map(pricing => ({
        wasteType: pricing.wasteType.name,
        postalCode: pricing.postalCode,
        price: Number(pricing.price)
      }))
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching vendor prices:', error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json({ 
        message: 'Database error',
        code: error.code 
      }, { status: 500 });
    }

    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}