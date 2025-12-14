import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AuditService } from '../audit/audit.service';
import { DonationStatus, ItemCategory, Prisma } from '@prisma/client';

@Injectable()
export class DonationsService {
    constructor(
        private prisma: PrismaService,
        private auditService: AuditService,
    ) { }

    async create(data: Prisma.DonationCreateInput, userId: string) {
        const donation = await this.prisma.donation.create({
            data,
        });
        await this.auditService.logAction(userId, 'CREATE_DONATION', { donationId: donation.id }, donation.id);
        return donation;
    }

    async findAll() {
        return this.prisma.donation.findMany();
    }

    async findOne(id: string) {
        return this.prisma.donation.findUnique({ where: { id } });
    }

    async updateStatus(id: string, status: DonationStatus, userId: string) {
        const donation = await this.prisma.donation.findUnique({ where: { id } });
        if (!donation) throw new NotFoundException('Donation not found');

        const updated = await this.prisma.donation.update({
            where: { id },
            data: { status },
        });

        await this.auditService.logAction(
            userId,
            'UPDATE_STATUS',
            { from: donation.status, to: status },
            id
        );
        return updated;
    }
}
