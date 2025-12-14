import { Module } from '@nestjs/common';
import { StockLedgerService } from './stock-ledger.service';
import { PrismaService } from '../prisma.service';

@Module({
    providers: [StockLedgerService, PrismaService],
    exports: [StockLedgerService],
})
export class LogisticsModule { }
