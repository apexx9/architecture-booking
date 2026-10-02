import { Module } from '@nestjs/common';

import { AuthModule } from '@/auth/auth.module';
import { DatabaseModule } from '@/db/database.module';
import { TenancyModule } from '@/tenancy/tenancy.module';

import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';

@Module({
  imports: [DatabaseModule, AuthModule, TenancyModule],
  controllers: [ClientsController],
  providers: [ClientsService],
  exports: [ClientsService],
})
export class ClientsModule {}
