import { Module } from '@nestjs/common';

import { AuthModule } from '@/auth/auth.module';
import { DatabaseModule } from '@/db/database.module';
import { TenancyModule } from '@/tenancy/tenancy.module';

import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';

@Module({
  imports: [DatabaseModule, AuthModule, TenancyModule],
  controllers: [LeadsController],
  providers: [LeadsService],
  exports: [LeadsService],
})
export class LeadsModule {}
