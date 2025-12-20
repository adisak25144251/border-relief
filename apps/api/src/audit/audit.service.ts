import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async logAction(
    userId: string,
    action: string,
    details: any,
    donationId?: string,
    resource: string = 'SYSTEM', // ✅ required field in Prisma schema
  ) {
    return this.prisma.auditLog.create({
      data: {
        action,
        resource, // ✅ ใส่ resource ให้ครบ

        details: {
          ...details,
          ...(donationId ? { donationId } : {}),
        },

        // ✅ connect relation แทน userId scalar
        user: { connect: { id: userId } },
      },
    });
  }
}
