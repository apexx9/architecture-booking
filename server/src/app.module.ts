import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { AuthModule } from '@/auth/auth.module';
import { AppConfigModule } from '@/config/app-config.module';
import { DatabaseModule } from '@/db/database.module';
import { HealthModule } from '@/health/health.module';
import { TenancyModule } from '@/tenancy/tenancy.module';
import { LeadsModule } from '@/leads/leads.module';
import { ClientsModule } from '@/clients/clients.module';
import { ProjectsModule } from '@/projects/projects.module';
import { ProjectPhasesModule } from '@/project-phases/project-phases.module';
import { TasksModule } from '@/tasks/tasks.module';
import { DeliverablesModule } from '@/deliverables/deliverables.module';
import { FilesModule } from '@/files/files.module';

@Module({
  imports: [
    AppConfigModule,

    ScheduleModule.forRoot(),

    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 60,
      },
    ]),

    DatabaseModule,
    AuthModule,
    HealthModule,
    TenancyModule,
    LeadsModule,
    ClientsModule,
    ProjectsModule,
    ProjectPhasesModule,
    TasksModule,
    DeliverablesModule,
    FilesModule,
  ],

  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
