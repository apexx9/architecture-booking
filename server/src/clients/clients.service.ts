import { Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';

import { DatabaseService } from '@/db/database.service';
import { clients } from '@/db/schema/clients.schema';

import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsService {
  constructor(private readonly db: DatabaseService) {}

  async create(tenantId: string, dto: CreateClientDto) {
    const [client] = await this.db.db
      .insert(clients)
      .values({ ...dto, tenantId })
      .returning();

    return client;
  }

  async findAll(tenantId: string) {
    return this.db.db
      .select()
      .from(clients)
      .where(and(eq(clients.tenantId, tenantId), eq(clients.isArchived, false)))
      .orderBy(desc(clients.createdAt));
  }

  async findOne(tenantId: string, id: string) {
    const [client] = await this.db.db
      .select()
      .from(clients)
      .where(and(eq(clients.id, id), eq(clients.tenantId, tenantId)))
      .limit(1);

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    return client;
  }

  async update(tenantId: string, id: string, dto: UpdateClientDto) {
    const [client] = await this.db.db
      .update(clients)
      // PATCH semantics: only the keys present on the DTO are written, so an
      // omitted field keeps its stored value. Drizzle skips `undefined` keys.
      .set({ ...dto, updatedAt: new Date() })
      .where(and(eq(clients.id, id), eq(clients.tenantId, tenantId)))
      .returning();

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    return client;
  }

  async remove(tenantId: string, id: string) {
    const [client] = await this.db.db
      .delete(clients)
      .where(and(eq(clients.id, id), eq(clients.tenantId, tenantId)))
      .returning();

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    return client;
  }
}
