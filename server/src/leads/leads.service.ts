import { Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';

import { DatabaseService } from '@/db/database.service';
import { leads } from '@/db/schema/leads.schema';
import { clients } from '@/db/schema/clients.schema';

import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { ConvertLeadToClientDto } from './dto/convert-lead.dto';

@Injectable()
export class LeadsService {
  constructor(private readonly db: DatabaseService) {}

  async create(tenantId: string, dto: CreateLeadDto) {
    const [lead] = await this.db.db
      .insert(leads)
      .values({ ...dto, tenantId })
      .returning();

    return lead;
  }

  async findAll(tenantId: string) {
    return this.db.db
      .select()
      .from(leads)
      .where(and(eq(leads.tenantId, tenantId), eq(leads.isArchived, false)))
      .orderBy(desc(leads.createdAt));
  }

  async findOne(tenantId: string, id: string) {
    const [lead] = await this.db.db
      .select()
      .from(leads)
      .where(and(eq(leads.id, id), eq(leads.tenantId, tenantId)))
      .limit(1);

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    return lead;
  }

  async update(tenantId: string, id: string, dto: UpdateLeadDto) {
    const [lead] = await this.db.db
      .update(leads)
      // PATCH semantics: omitted keys keep their stored value.
      .set({ ...dto, updatedAt: new Date() })
      .where(and(eq(leads.id, id), eq(leads.tenantId, tenantId)))
      .returning();

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    return lead;
  }

  async remove(tenantId: string, id: string) {
    const [lead] = await this.db.db
      .delete(leads)
      .where(and(eq(leads.id, id), eq(leads.tenantId, tenantId)))
      .returning();

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    return lead;
  }

  async convertToClient(
    tenantId: string,
    id: string,
    dto: ConvertLeadToClientDto = {},
  ) {
    const [lead] = await this.db.db
      .select()
      .from(leads)
      .where(and(eq(leads.id, id), eq(leads.tenantId, tenantId)))
      .limit(1);

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    const result = await this.db.db.transaction(async (tx) => {
      const [client] = await tx
        .insert(clients)
        .values({
          tenantId,
          name: dto.name || lead.name,
          email: dto.email || lead.email,
          phone: dto.phone || lead.phone,
          company: dto.company || lead.company,
          status: 'ACTIVE',
        })
        .returning();

      const [updatedLead] = await tx
        .update(leads)
        .set({
          convertedToClientId: client.id,
          status: 'WON',
          updatedAt: new Date(),
        })
        .where(eq(leads.id, lead.id))
        .returning();

      return { client, lead: updatedLead };
    });

    return result;
  }
}
