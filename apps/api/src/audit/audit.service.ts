import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AuditService {
    constructor(private prisma: PrismaService) { }

    async logAction(userId: string, action: string, details: any, donationId?: string) {
        return this.prisma.auditLog.create({
            data: {
                userId,
                action,
                details,
                donationId,
            },
            // No update/delete methods allowed for AuditLog to ensure immutability
        });
    }
}
