import { Module } from '@nestjs/common';

import { AuthModule } from '@/auth/auth.module';
import { DatabaseModule } from '@/db/database.module';
import { TenancyModule } from '@/tenancy/tenancy.module';

import { ProjectPhasesController } from './project-phases.controller';
import { ProjectPhasesService } from './project-phases.service';

@Module({
  imports: [DatabaseModule, AuthModule, TenancyModule],
  controllers: [ProjectPhasesController],
  providers: [ProjectPhasesService],
  exports: [ProjectPhasesService],
})
export class ProjectPhasesModule {}
