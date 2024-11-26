import { NextRequest, NextResponse } from 'next/server';
import { EntityType, Prisma } from '@prisma/client';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth';
import prisma from '@/lib/prisma';

interface InvoiceItem {
  description: string;
  unitPrice: number;
  quantity: number;
  total: number;
}

interface TaxDetails {
  gstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTaxableValue: number;
}

interface InvoiceData {
  invoiceNumber: string;
  date: Date;
  dueDate: Date;
  vendorName: string;
  vendorAddress: string;
  vendorBankDetails: {
    bankName: string;
    accountName: string;
    accountNumber: string;
  };
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: InvoiceItem[];
  subtotal: number;
  taxDetails: TaxDetails;
  total: number;
}

function processOrderItems(items: any[], pricings: Record<number, number>): InvoiceItem[] {
  return items.map(item => {
    const unitPrice = pricings[item.wasteTypeId] ?? 0;
    return {
      description: item.wasteType,
      unitPrice,
      quantity: item.quantity,
      total: Number((unitPrice * item.quantity).toFixed(2))
    };
  });
}

function formatAddress(parts: (string | null | undefined)[]): string {
  return parts.filter(Boolean).join(', ');
}

function convertDecimalToNumber(value: Prisma.Decimal | null | undefined): number {
  return value ? Number(value.toString()) : 0;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { invoiceId: string } }
) {
  try {
    const token = extractTokenFromHeader(req.headers.get('Authorization'));
    if (!token) {
      return NextResponse.json({ message: 'Missing authorization' }, { status: 401 });
    }

    const { entityId, entityType } = verifyToken(token);
    const { invoiceId } = params;
    
    if (!invoiceId) {
      return NextResponse.json({ message: 'Missing invoice ID' }, { status: 400 });
    }

    // Optimized single query for all required data
    const invoice = await prisma.$transaction(async (tx) => {
      const result = await tx.transaction.findFirst({
        where: {
          invoiceNumber: invoiceId,
          OR: [
            {
              order: {
                vendor: {
                  entityId: entityType === EntityType.VENDOR ? entityId : undefined
                }
              }
            },
            {
              order: {
                vendor: {
                  agents: entityType === EntityType.AGENT ? {
                    some: {
                      entityId,
                      isDeleted: false
                    }
                  } : undefined
                }
              }
            }
          ]
        },
        select: {
          invoiceNumber: true,
          date: true,
          amount: true,
          order: {
            select: {
              scheduledPickupTime: true,
              items: true,
              pickupAddress: {
                select: {
                  street: true,
                  city: true,
                  state: true,
                  postalCode: true
                }
              },
              user: {
                select: {
                  name: true,
                  entity: { select: { phone: true } }
                }
              },
              vendor: {
                select: {
                  name: true,
                  businessName: true,
                  bankName: true,
                  accountName: true,
                  accountNumber: true,
                  vendorPricings: {
                    select: {
                      wasteTypeId: true,
                      price: true
                    }
                  }
                }
              }
            }
          },
          taxDetails: {
            select: {
              gstRate: true,
              cgstAmount: true,
              sgstAmount: true,
              igstAmount: true,
              totalTaxableValue: true
            }
          }
        }
      });

      if (!result) {
        throw new Error(entityType === EntityType.VENDOR ? 'Invoice not found' : 'Unauthorized access');
      }

      return result;
    });

    // Process pricing data
    const pricingMap = invoice.order.vendor?.vendorPricings.reduce((acc, p) => {
      acc[p.wasteTypeId] = Number(p.price);
      return acc;
    }, {} as Record<number, number>) ?? {};

    const items = processOrderItems(invoice.order.items as any[], pricingMap);

    const response: InvoiceData = {
      invoiceNumber: invoice.invoiceNumber,
      date: invoice.date,
      dueDate: new Date(invoice.order.scheduledPickupTime.getTime() + 7 * 24 * 60 * 60 * 1000),
      
      vendorName: invoice.order.vendor?.name ?? '',
      vendorAddress: formatAddress([
        invoice.order.vendor?.businessName,
        invoice.order.pickupAddress?.street,
        invoice.order.pickupAddress?.city
      ]),
      
      vendorBankDetails: {
        bankName: invoice.order.vendor?.bankName ?? '',
        accountName: invoice.order.vendor?.accountName ?? '',
        accountNumber: invoice.order.vendor?.accountNumber ?? ''
      },
      
      customerName: invoice.order.user?.name ?? '',
      customerPhone: invoice.order.user?.entity?.phone ?? '',
      customerAddress: formatAddress([
        invoice.order.pickupAddress?.street,
        invoice.order.pickupAddress?.city,
        invoice.order.pickupAddress?.state,
        invoice.order.pickupAddress?.postalCode
      ]),
      
      items,
      subtotal: Number(invoice.amount),
      
      taxDetails: {
        gstRate: convertDecimalToNumber(invoice.taxDetails?.gstRate),
        cgstAmount: convertDecimalToNumber(invoice.taxDetails?.cgstAmount),
        sgstAmount: convertDecimalToNumber(invoice.taxDetails?.sgstAmount),
        igstAmount: convertDecimalToNumber(invoice.taxDetails?.igstAmount),
        totalTaxableValue: convertDecimalToNumber(invoice.taxDetails?.totalTaxableValue)
      },
      
      total: Number(
        new Prisma.Decimal(invoice.amount)
          .add(invoice.taxDetails?.totalTaxableValue ?? 0)
          .toFixed(2)
      )
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Invoice API error:', error);

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json({ message: 'Invoice not found' }, { status: 404 });
      }
      if (error.message.includes('Unauthorized')) {
        return NextResponse.json({ message: 'Unauthorized access' }, { status: 403 });
      }
    }

    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}