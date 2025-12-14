import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { LedgerType, DonationStatus } from '@prisma/client';

@Injectable()
export class StockLedgerService {
    constructor(private prisma: PrismaService) { }

    /**
     * Main function to move stock.
     * MUST RUN INSIDE TRANSACTION if called mostly.
     * But Prisma doesn't support nested distinct transactions easily, 
     * so we assume the caller handles integrity or we use $transaction here.
     */
    async recordTransaction(
        warehouseId: string,
        itemId: string,
        type: LedgerType,
        qtyChange: number,
        refDocId: string,
        reason?: string
    ) {
        return this.prisma.$transaction(async (tx) => {
            // 1. Get current balance (Sum of prev ledger)
            const aggregates = await tx.stockLedger.aggregate({
                where: { warehouseId, itemId },
                _sum: { quantity: true },
            });
            const currentBalance = aggregates._sum.quantity || 0;

            // 2. Validate Negative Stock
            const newBalance = currentBalance + qtyChange;
            if (newBalance < 0) {
                throw new BadRequestException(`Insufficient stock for Item ${itemId}. Current: ${currentBalance}, Requested: ${qtyChange}`);
            }

            // 3. Insert Ledger Entry
            const entry = await tx.stockLedger.create({
                data: {
                    warehouseId,
                    itemId,
                    type,
                    quantity: qtyChange,
                    balanceAfter: newBalance,
                    refDocId,
                    reason,
                },
            });

            return entry;
        });
    }

    async getCurrentStock(warehouseId: string) {
        // This is expensive for large data, in production use materialized views
        const stock = await this.prisma.stockLedger.groupBy({
            by: ['itemId'],
            where: { warehouseId },
            _sum: { quantity: true },
        });
        return stock.map(s => ({ itemId: s.itemId, qty: s._sum.quantity }));
    }
}
