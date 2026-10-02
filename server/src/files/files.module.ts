import { Module } from '@nestjs/common';

import { AuthModule } from '@/auth/auth.module';
import { DatabaseModule } from '@/db/database.module';
import { TenancyModule } from '@/tenancy/tenancy.module';

import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { LocalStorageProvider } from './local-storage.provider';

@Module({
  imports: [DatabaseModule, AuthModule, TenancyModule],
  controllers: [FilesController],
  providers: [FilesService, LocalStorageProvider],
  exports: [FilesService],
})
export class FilesModule {}
