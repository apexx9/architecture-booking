import { Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';

import { DatabaseService } from '@/db/database.service';
import { projects } from '@/db/schema/projects.schema';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(private readonly db: DatabaseService) {}

  async create(tenantId: string, createProjectDto: CreateProjectDto) {
    const [project] = await this.db.db
      .insert(projects)
      .values({ ...createProjectDto, tenantId })
      .returning();

    return project;
  }

  async findAll(tenantId: string) {
    return this.db.db
      .select()
      .from(projects)
      .where(
        and(eq(projects.tenantId, tenantId), eq(projects.isArchived, false)),
      )
      .orderBy(desc(projects.createdAt));
  }

  async findOne(tenantId: string, id: string) {
    const [project] = await this.db.db
      .select()
      .from(projects)
      .where(and(eq(projects.id, id), eq(projects.tenantId, tenantId)))
      .limit(1);

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  async update(
    tenantId: string,
    id: string,
    updateProjectDto: UpdateProjectDto,
  ) {
    const [project] = await this.db.db
      .update(projects)
      .set({ ...updateProjectDto, updatedAt: new Date() })
      .where(and(eq(projects.id, id), eq(projects.tenantId, tenantId)))
      .returning();

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  async remove(tenantId: string, id: string) {
    const [project] = await this.db.db
      .update(projects)
      .set({ isArchived: true, updatedAt: new Date() })
      .where(and(eq(projects.id, id), eq(projects.tenantId, tenantId)))
      .returning();

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }
}
