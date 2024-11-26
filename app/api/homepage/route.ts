import { NextRequest, NextResponse } from 'next/server';
import { EntityType, OrderStatus, AgentStatus, Prisma } from '@prisma/client';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth';
import prisma from '@/lib/prisma';

function jsonResponse(data: any, status: number = 200) {
  return NextResponse.json(data, { status });
}

interface DashboardStats {
  todaysOrders: number;
  pendingOrders: number;
  agentsAvailable?: number;
  completedOrders?: number;
}

interface DashboardFilters {
  orderType: string;
  sort: '0' | '1';
}

function getDateRanges() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const oneWeekLater = new Date(today);
  oneWeekLater.setDate(oneWeekLater.getDate() + 7);
  
  return { today, tomorrow, oneWeekLater };
}

function validateFilters(orderType: string | null, sort: string | null): DashboardFilters | null {
  if (!orderType || !sort) return null;

  const validVendorTypes = ['new', 'accepted'];
  const validAgentTypes = ['pending', 'completed'];
  const validSortOptions = ['0', '1'];

  if (![...validVendorTypes, ...validAgentTypes].includes(orderType) || 
      !validSortOptions.includes(sort)) {
    return null;
  }

  return { orderType, sort: sort as '0' | '1' };
}

async function getVendorDashboard(vendorId: number, filters: DashboardFilters) {
  const { today, tomorrow, oneWeekLater } = getDateRanges();

  const statsPromise = prisma.$queryRaw<DashboardStats[]>`
    SELECT 
      (SELECT COUNT(*)
       FROM \`Order\` o1
       WHERE o1.vendorId = ${vendorId}
       AND o1.status = ${OrderStatus.NEW}
       AND o1.scheduledPickupTime >= ${today}
       AND o1.scheduledPickupTime < ${tomorrow}) AS todaysOrders,
      
      (SELECT COUNT(*)
       FROM \`Order\` o2
       WHERE o2.vendorId = ${vendorId}
       AND o2.status = ${OrderStatus.ACCEPTED}) AS pendingOrders,
      
      (SELECT COUNT(*)
       FROM Agent a
       WHERE a.vendorId = ${vendorId}
       AND a.status = ${AgentStatus.AVAILABLE}
       AND a.isDeleted = false) AS agentsAvailable
    FROM dual
  `;

  const ordersPromise = prisma.order.findMany({
    where: {
      vendorId,
      scheduledPickupTime: {
        gte: today,
        lt: oneWeekLater
      },
      status: filters.orderType === 'new' ? OrderStatus.NEW : OrderStatus.ACCEPTED
    },
    select: {
      id: true,
      scheduledPickupTime: true,
      actualPickupTime: true,
      estimatedWeight: true,
      actualWeight: true,
      items: true,
      status: true,
      user: {
        select: {
          name: true,
          entity: { 
            select: { phone: true }
          }
        }
      },
      agent: {
        select: { 
          id: true, 
          name: true,
          status: true,
          vehicleType: true,
          vehicleNumber: true
        }
      },
      pickupAddress: {
        select: {
          street: true,
          city: true,
          state: true,
          postalCode: true,
          latitude: true,
          longitude: true
        }
      }
    },
    orderBy: {
      scheduledPickupTime: filters.sort === '0' ? 'asc' : 'desc'
    }
  });

  const [stats, orders] = await Promise.all([statsPromise, ordersPromise]);
  const dashboardStats = stats[0];

  const todayStr = today.toISOString().slice(0, 10);

  return {
    stats: {
      todaysOrders: Number(dashboardStats.todaysOrders),
      pendingOrders: Number(dashboardStats.pendingOrders),
      agentsAvailable: Number(dashboardStats.agentsAvailable),
    },
    orders: {
      today: orders.filter(order => 
        order.scheduledPickupTime.toISOString().slice(0, 10) === todayStr
      ),
      upcoming: orders.filter(order => 
        order.scheduledPickupTime.toISOString().slice(0, 10) !== todayStr
      )
    }
  };
}

async function getAgentDashboard(agentId: number, filters: DashboardFilters) {
  const { today, tomorrow, oneWeekLater } = getDateRanges();

  const statsPromise = prisma.$queryRaw<DashboardStats[]>`
    SELECT 
      (SELECT COUNT(*)
       FROM \`Order\` o1
       WHERE o1.agentId = ${agentId}
       AND o1.status = ${OrderStatus.ACCEPTED}
       AND o1.scheduledPickupTime >= ${today}
       AND o1.scheduledPickupTime < ${tomorrow}) AS todaysOrders,
      
      (SELECT COUNT(*)
       FROM \`Order\` o2
       WHERE o2.agentId = ${agentId}
       AND o2.status = ${OrderStatus.ACCEPTED}) AS pendingOrders,
      
      (SELECT COUNT(*)
       FROM \`Order\` o3
       WHERE o3.agentId = ${agentId}
       AND o3.status = ${OrderStatus.COMPLETED}
       AND o3.status NOT IN (${OrderStatus.REJECTED}, ${OrderStatus.CANCELLED})) AS completedOrders
    FROM dual
  `;

  const ordersPromise = prisma.order.findMany({
    where: {
      agentId,
      scheduledPickupTime: {
        gte: today,
        lt: oneWeekLater
      },
      status: filters.orderType === 'pending' ? OrderStatus.ACCEPTED : OrderStatus.COMPLETED,
      NOT: {
        status: {
          in: [OrderStatus.REJECTED, OrderStatus.CANCELLED]
        }
      }
    },
    select: {
      id: true,
      scheduledPickupTime: true,
      actualPickupTime: true,
      estimatedWeight: true,
      actualWeight: true,
      items: true,
      status: true,
      otp: true,
      user: {
        select: {
          name: true,
          entity: { 
            select: { phone: true }
          }
        }
      },
      pickupAddress: {
        select: {
          street: true,
          city: true,
          state: true,
          postalCode: true,
          latitude: true,
          longitude: true
        }
      }
    },
    orderBy: {
      scheduledPickupTime: filters.sort === '0' ? 'asc' : 'desc'
    }
  });

  const [stats, orders] = await Promise.all([statsPromise, ordersPromise]);
  const dashboardStats = stats[0];
  
  const todayStr = today.toISOString().slice(0, 10);

  return {
    stats: {
      todaysOrders: Number(dashboardStats.todaysOrders),
      pendingOrders: Number(dashboardStats.pendingOrders),
      completedOrders: Number(dashboardStats.completedOrders)
    },
    orders: {
      today: orders.filter(order => 
        order.scheduledPickupTime.toISOString().slice(0, 10) === todayStr
      ),
      upcoming: orders.filter(order => 
        order.scheduledPickupTime.toISOString().slice(0, 10) !== todayStr
      )
    }
  };
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse({ message: 'Missing authorization header' }, 401);
    }

    const token = extractTokenFromHeader(authHeader);
    const { entityId, entityType } = verifyToken(token);

    const searchParams = new URL(req.url).searchParams;
    const filters = validateFilters(
      searchParams.get('orderType'),
      searchParams.get('sort')
    );

    if (!filters) {
      return jsonResponse({ message: 'Invalid query parameters' }, 400);
    }

    if (entityType === EntityType.VENDOR) {
      const vendor = await prisma.vendor.findFirst({
        where: { 
          entityId,
          isDeleted: false 
        },
        select: { id: true }
      });

      if (!vendor) {
        return jsonResponse({ message: 'Vendor not found or inactive' }, 404);
      }

      const dashboard = await getVendorDashboard(vendor.id, filters);
      return jsonResponse(dashboard);
    }

    if (entityType === EntityType.AGENT) {
      const agent = await prisma.agent.findFirst({
        where: { 
          entityId,
          isDeleted: false 
        },
        select: { id: true }
      });

      if (!agent) {
        return jsonResponse({ message: 'Agent not found or inactive' }, 404);
      }

      const dashboard = await getAgentDashboard(agent.id, filters);
      return jsonResponse(dashboard);
    }

    return jsonResponse({ message: 'Invalid user type' }, 403);

  } catch (error) {
    console.error('Homepage API Error:', error);
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return jsonResponse({ 
        message: 'Database error', 
        code: error.code,
        error: process.env.NODE_ENV === 'development' ? error : undefined
      }, 500);
    }

    return jsonResponse({ message: 'Internal server error' }, 500);
  }
}