import { NextRequest, NextResponse } from 'next/server';
import { EntityType, TransactionStatus, Prisma } from '@prisma/client';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth';
import prisma from '@/lib/prisma';

interface TransactionData {
  orderId: number;
  userName: string;
  itemCount: number;
  amount: string;
  invoiceNumber: string | null;
}

interface GroupedTransactions {
  date: string;
  data: TransactionData[];
}

interface TransactionRecord {
  orderId: string;
  amount: Prisma.Decimal;
  date: Date;
  invoiceNumber: string | null;
  items: string;
  userName: string;
}

interface OrderItem {
  wasteType: string;
  quantity: number;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

function jsonResponse(data: unknown, status = 200): NextResponse {
  return new NextResponse(
    JSON.stringify(data, (_key, value) => 
      typeof value === 'bigint' ? value.toString() :
      value instanceof Date ? value.toISOString() :
      value
    ),
    {
      status,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

async function getVendorId(entityId: number, entityType: EntityType): Promise<number> {
  if (entityType === EntityType.VENDOR) {
    const vendor = await prisma.vendor.findFirst({
      where: {
        entityId,
        isDeleted: false
      },
      select: { id: true }
    });
    
    if (!vendor) {
      throw new Error('Vendor not found');
    }
    return vendor.id;
  } 
  
  if (entityType === EntityType.AGENT) {
    const agent = await prisma.agent.findFirst({
      where: {
        entityId,
        isDeleted: false
      },
      select: {
        vendor: {
          select: { id: true }
        }
      }
    });
    
    if (!agent?.vendor?.id) {
      throw new Error('Agent or vendor not found');
    }
    return agent.vendor.id;
  }

  throw new Error('Invalid entity type');
}

function formatDate(date: Date): string {
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

function safeParseJson(jsonString: string | null): OrderItem[] {
  if (!jsonString) return [];
  
  try {
    const parsed = JSON.parse(jsonString);
    
    if (!Array.isArray(parsed)) {
      console.warn('Invalid order items format: not an array');
      return [];
    }

    return parsed.filter(item => {
      if (!item || typeof item !== 'object') {
        console.warn('Invalid order item:', item);
        return false;
      }

      const hasValidType = typeof item.wasteType === 'string' && item.wasteType.trim() !== '';
      const hasValidQuantity = typeof item.quantity === 'number' && !isNaN(item.quantity) && item.quantity > 0;

      if (!hasValidType || !hasValidQuantity) {
        console.warn('Invalid order item format:', item);
        return false;
      }

      return true;
    });

  } catch (error) {
    console.warn('JSON parse error:', error instanceof Error ? error.message : 'Unknown error');
    return [];
  }
}

function groupTransactions(transactions: TransactionRecord[]): GroupedTransactions[] {
  const groups = new Map<string, TransactionData[]>();
  
  for (const tx of transactions) {
    const dateStr = formatDate(tx.date);
    const items = safeParseJson(tx.items);
    
    const group = groups.get(dateStr) ?? [];
    group.push({
      orderId: parseInt(tx.orderId, 10),
      userName: tx.userName,
      itemCount: items.length,
      amount: tx.amount.toString(),
      invoiceNumber: tx.invoiceNumber
    });
    
    if (!groups.has(dateStr)) {
      groups.set(dateStr, group);
    }
  }

  return Array.from(groups)
    .map(([date, data]) => ({ date, data }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

export async function GET(req: NextRequest) {
  try {
    const token = extractTokenFromHeader(req.headers.get('Authorization'));
    if (!token) {
      return jsonResponse({ message: 'Missing authorization' }, 401);
    }

    const { entityId, entityType } = verifyToken(token);
    if (!entityId || !entityType) {
      return jsonResponse({ message: 'Invalid token' }, 401);
    }

    let vendorId: number;
    try {
      vendorId = await getVendorId(entityId, entityType);
    } catch (error) {
      return jsonResponse({ 
        message: error instanceof Error ? error.message : 'Authorization failed'
      }, 403);
    }

    const transactions = await prisma.$queryRaw<TransactionRecord[]>`
      SELECT 
        t.orderId,
        t.amount,
        t.date,
        t.invoiceNumber,
        COALESCE(o.items, '[]') as items,
        u.name as userName
      FROM Transaction t
      FORCE INDEX (idx_transaction_vendor_date)
      JOIN \`Order\` o ON t.orderId = o.id
      JOIN User u ON o.userId = u.id
      WHERE o.vendorId = ${vendorId}
        AND t.status = ${TransactionStatus.COMPLETED}
      ORDER BY t.date DESC
      LIMIT 1000
    `;

    const groupedTransactions = groupTransactions(transactions);
    return jsonResponse(groupedTransactions);

  } catch (error) {
    console.error('Transactions API error:', error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return jsonResponse({
        message: 'Database error',
        code: error.code
      }, 500);
    }

    return jsonResponse({ 
      message: error instanceof Error ? error.message : 'Internal server error'
    }, error instanceof Error ? 400 : 500);
  }
}