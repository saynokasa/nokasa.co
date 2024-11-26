import { NextRequest, NextResponse } from 'next/server';
import { EntityType, Prisma } from '@prisma/client';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth';
import prisma from '@/lib/prisma';

async function getVendorAgents(entityId: number) {
  // Single optimized query without any extra features
  const result = await prisma.$queryRaw<Array<{
    id: number;
    name: string;
    phone: string;
  }>>`
    SELECT 
      a.id,
      a.name,
      e.phone
    FROM Vendor v
    USE INDEX (idx_vendor_entity_status)
    JOIN Agent a 
      USE INDEX (idx_agent_vendor_status)
      ON a.vendorId = v.id 
      AND a.isDeleted = FALSE
    JOIN Entity e 
      ON a.entityId = e.id
    WHERE v.entityId = ${entityId}
      AND v.isDeleted = FALSE
    ORDER BY a.name`;
    
  return {
    agents: result.map(row => ({
      id: Number(row.id),
      name: row.name,
      phone: row.phone
    }))
  };
}

export async function GET(req: NextRequest) {
  try {
    const token = extractTokenFromHeader(req.headers.get('Authorization'));
    if (!token) {
      return NextResponse.json({ message: 'Missing authorization' }, { status: 401 });
    }

    const { entityId, entityType } = verifyToken(token);
    if (entityType !== EntityType.VENDOR) {
      return NextResponse.json({ message: 'Only vendors can access agent list' }, { status: 403 });
    }

    const result = await getVendorAgents(entityId);
    return NextResponse.json(result);

  } catch (error) {
    console.error('Agent list error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}