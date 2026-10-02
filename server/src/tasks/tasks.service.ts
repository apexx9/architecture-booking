import { Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';

import { DatabaseService } from '@/db/database.service';
import { tasks } from '@/db/schema/tasks.schema';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

type TaskInsert = typeof tasks.$inferInsert;
type TaskUpdate = Partial<TaskInsert>;

@Injectable()
export class TasksService {
  constructor(private readonly db: DatabaseService) {}

  async create(tenantId: string, createTaskDto: CreateTaskDto) {
    const data: TaskInsert = { ...createTaskDto, tenantId };
    if (data.status === 'DONE' && !data.completedAt) {
      data.completedAt = new Date();
    }
    const [task] = await this.db.db.insert(tasks).values(data).returning();

    return task;
  }

  async findAll(tenantId: string) {
    return this.db.db
      .select()
      .from(tasks)
      .where(and(eq(tasks.tenantId, tenantId), eq(tasks.isArchived, false)))
      .orderBy(desc(tasks.createdAt));
  }

  async findByProject(tenantId: string, projectId: string) {
    return this.db.db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.tenantId, tenantId),
          eq(tasks.projectId, projectId),
          eq(tasks.isArchived, false),
        ),
      )
      .orderBy(desc(tasks.createdAt));
  }

  async findOne(tenantId: string, id: string) {
    const [task] = await this.db.db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.tenantId, tenantId)))
      .limit(1);

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  async update(tenantId: string, id: string, updateTaskDto: UpdateTaskDto) {
    const data: TaskUpdate = { ...updateTaskDto, updatedAt: new Date() };
    if (data.status === 'DONE' && !data.completedAt) {
      data.completedAt = new Date();
    }
    const [task] = await this.db.db
      .update(tasks)
      .set(data)
      .where(and(eq(tasks.id, id), eq(tasks.tenantId, tenantId)))
      .returning();

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  async remove(tenantId: string, id: string) {
    const [task] = await this.db.db
      .update(tasks)
      .set({ isArchived: true, updatedAt: new Date() })
      .where(and(eq(tasks.id, id), eq(tasks.tenantId, tenantId)))
      .returning();

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }
}
