import { NextRequest, NextResponse } from 'next/server';
import { EntityType, Prisma } from '@prisma/client';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth';
import prisma from '@/lib/prisma';

interface UpdateOrderItem {
  wasteType: string;
  quantity: number;
}

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
    const { items } = await req.json() as { items: UpdateOrderItem[] };

    const orderDetails = await prisma.$queryRaw<Array<{
      orderId: number;
      vendorId: number;
      postalCode: string;
    }>>`
      SELECT 
        o.id as orderId,
        o.vendorId,
        addr.postalCode
      FROM \`Order\` o
      JOIN Agent a 
        USE INDEX (idx_agent_active)
        ON o.agentId = a.id
        AND a.entityId = ${entityId}
        AND a.isDeleted = FALSE
      JOIN Address addr 
        USE INDEX (idx_address_postal)
        ON o.pickupAddressId = addr.id
      WHERE o.id = ${orderId}
      LIMIT 1
    `;

    if (!orderDetails.length) {
      return NextResponse.json({ 
        message: 'Order not found or not authorized' 
      }, { status: 404 });
    }

    const order = orderDetails[0];

    const pricings = await prisma.$queryRaw<Array<{
      wasteName: string;
      price: string;
    }>>`
      SELECT 
        wt.name as wasteName,
        vp.price
      FROM VendorPricing vp
      USE INDEX (unique_vendor_waste_postal)
      JOIN WasteType wt 
        ON vp.wasteTypeId = wt.id
      WHERE vp.vendorId = ${order.vendorId}
        AND vp.postalCode = ${order.postalCode}
    `;

    const priceMap = new Map(
      pricings.map(p => [
        p.wasteName.toLowerCase(),
        Number(p.price)
      ])
    );

    let totalWeight = 0;
    let totalCost = 0;

    for (const item of items) {
      const price = priceMap.get(item.wasteType.toLowerCase());
      if (!price) {
        return NextResponse.json({
          message: `Invalid waste type: ${item.wasteType}`
        }, { status: 400 });
      }

      totalWeight += item.quantity;
      totalCost += item.quantity * price;
    }

    const updatedOrder = await prisma.$executeRaw`
      UPDATE \`Order\` o
      JOIN Agent a ON o.agentId = a.id
        AND a.entityId = ${entityId}
      SET 
        o.items = ${JSON.stringify(items)},
        o.actualWeight = ${totalWeight},
        o.updatedAt = NOW()
      WHERE o.id = ${orderId}
    `;

    if (!updatedOrder) {
      return NextResponse.json({ 
        message: 'Failed to update order' 
      }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Order updated successfully',
      items,
      totalWeight,
      totalCost
    });

  } catch (error) {
    console.error('Order update error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}