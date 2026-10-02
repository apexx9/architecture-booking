import { Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, eq } from 'drizzle-orm';

import { DatabaseService } from '@/db/database.service';
import { projectPhases } from '@/db/schema/project-phases.schema';
import { CreateProjectPhaseDto } from './dto/create-project-phase.dto';
import { UpdateProjectPhaseDto } from './dto/update-project-phase.dto';

@Injectable()
export class ProjectPhasesService {
  constructor(private readonly db: DatabaseService) {}

  async create(tenantId: string, createDto: CreateProjectPhaseDto) {
    const [phase] = await this.db.db
      .insert(projectPhases)
      .values({ ...createDto, tenantId })
      .returning();

    return phase;
  }

  async findAll(tenantId: string) {
    return this.db.db
      .select()
      .from(projectPhases)
      .where(
        and(
          eq(projectPhases.tenantId, tenantId),
          eq(projectPhases.isArchived, false),
        ),
      )
      .orderBy(asc(projectPhases.order), asc(projectPhases.createdAt));
  }

  async findOne(tenantId: string, id: string) {
    const [phase] = await this.db.db
      .select()
      .from(projectPhases)
      .where(
        and(eq(projectPhases.id, id), eq(projectPhases.tenantId, tenantId)),
      )
      .limit(1);

    if (!phase) {
      throw new NotFoundException('Project phase not found');
    }

    return phase;
  }

  async update(tenantId: string, id: string, updateDto: UpdateProjectPhaseDto) {
    const [phase] = await this.db.db
      .update(projectPhases)
      .set({ ...updateDto, updatedAt: new Date() })
      .where(
        and(eq(projectPhases.id, id), eq(projectPhases.tenantId, tenantId)),
      )
      .returning();

    if (!phase) {
      throw new NotFoundException('Project phase not found');
    }

    return phase;
  }

  async remove(tenantId: string, id: string) {
    const [phase] = await this.db.db
      .update(projectPhases)
      .set({ isArchived: true, updatedAt: new Date() })
      .where(
        and(eq(projectPhases.id, id), eq(projectPhases.tenantId, tenantId)),
      )
      .returning();

    if (!phase) {
      throw new NotFoundException('Project phase not found');
    }

    return phase;
  }
}
