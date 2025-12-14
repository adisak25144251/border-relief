import { Controller, Get, Post, Body, Patch, Param, UseGuards, Request } from '@nestjs/common';
import { DonationsService } from './donations.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DonationStatus, ItemCategory } from '@prisma/client';

@Controller('donations')
export class DonationsController {
    constructor(private readonly donationsService: DonationsService) { }

    @UseGuards(JwtAuthGuard)
    @Post()
    create(@Request() req, @Body() createDto: any) {
        // Basic mapping, in real app use DTOs with validation
        return this.donationsService.create({
            description: createDto.description,
            quantity: createDto.quantity,
            unit: createDto.unit,
            category: createDto.category as ItemCategory,
            donor: { connect: { id: req.user.userId } }
        }, req.user.userId);
    }

    @Get()
    findAll() {
        return this.donationsService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.donationsService.findOne(id);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id/status')
    updateStatus(@Request() req, @Param('id') id: string, @Body('status') status: DonationStatus) {
        return this.donationsService.updateStatus(id, status, req.user.userId);
    }
}
