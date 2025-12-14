import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AuditModule } from './audit/audit.module';
import { DonationsModule } from './donations/donations.module';
import { LogisticsModule } from './logistics/logistics.module';

@Module({
    imports: [AuthModule, UsersModule, AuditModule, DonationsModule, LogisticsModule],
    controllers: [],
    providers: [],
})
export class AppModule { }
