import { Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';

import { DatabaseService } from '@/db/database.service';
import { deliverables } from '@/db/schema/deliverables.schema';
import { CreateDeliverableDto } from './dto/create-deliverable.dto';
import { UpdateDeliverableDto } from './dto/update-deliverable.dto';

type DeliverableInsert = typeof deliverables.$inferInsert;
type DeliverableUpdate = Partial<DeliverableInsert>;

@Injectable()
export class DeliverablesService {
  constructor(private readonly db: DatabaseService) {}

  async create(tenantId: string, createDto: CreateDeliverableDto) {
    const data: DeliverableInsert = { ...createDto, tenantId };
    const [deliverable] = await this.db.db
      .insert(deliverables)
      .values(data)
      .returning();

    return deliverable;
  }

  async findAll(tenantId: string) {
    return this.db.db
      .select()
      .from(deliverables)
      .where(
        and(
          eq(deliverables.tenantId, tenantId),
          eq(deliverables.isArchived, false),
        ),
      )
      .orderBy(desc(deliverables.createdAt));
  }

  async findOne(tenantId: string, id: string) {
    const [deliverable] = await this.db.db
      .select()
      .from(deliverables)
      .where(and(eq(deliverables.id, id), eq(deliverables.tenantId, tenantId)))
      .limit(1);

    if (!deliverable) {
      throw new NotFoundException('Deliverable not found');
    }

    return deliverable;
  }

  async update(tenantId: string, id: string, updateDto: UpdateDeliverableDto) {
    const data: DeliverableUpdate = { ...updateDto, updatedAt: new Date() };
    const [deliverable] = await this.db.db
      .update(deliverables)
      .set(data)
      .where(and(eq(deliverables.id, id), eq(deliverables.tenantId, tenantId)))
      .returning();

    if (!deliverable) {
      throw new NotFoundException('Deliverable not found');
    }

    return deliverable;
  }

  async remove(tenantId: string, id: string) {
    const [deliverable] = await this.db.db
      .update(deliverables)
      .set({ isArchived: true, updatedAt: new Date() })
      .where(and(eq(deliverables.id, id), eq(deliverables.tenantId, tenantId)))
      .returning();

    if (!deliverable) {
      throw new NotFoundException('Deliverable not found');
    }

    return deliverable;
  }
}
