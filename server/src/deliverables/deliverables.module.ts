import { Module } from '@nestjs/common';

import { AuthModule } from '@/auth/auth.module';
import { DatabaseModule } from '@/db/database.module';
import { TenancyModule } from '@/tenancy/tenancy.module';

import { DeliverablesController } from './deliverables.controller';
import { DeliverablesService } from './deliverables.service';

@Module({
  imports: [DatabaseModule, AuthModule, TenancyModule],
  controllers: [DeliverablesController],
  providers: [DeliverablesService],
  exports: [DeliverablesService],
})
export class DeliverablesModule {}
