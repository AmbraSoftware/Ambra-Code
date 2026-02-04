import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';

@Injectable()
export class AnnouncementsService {
  constructor(private prisma: PrismaService) {}

  async create(
    schoolId: string | null,
    authorId: string,
    dto: CreateAnnouncementDto,
  ) {
    return this.prisma.announcement.create({
      data: {
        schoolId: schoolId || undefined,
        authorId,
        title: dto.title,
        message: dto.message,
        targetRole: dto.targetRole as any,
        scope: dto.scope as any, // Cast to Prisma Enum
        targetIds: dto.targetIds || [],
        status: dto.status || 'SENT',
      },
    });
  }

  async findAll(schoolId: string | null, userId?: string) {
    // 1. Global Admin Mode (No School Context)
    if (!schoolId) {
      return this.prisma.announcement.findMany({
        orderBy: { createdAt: 'desc' },
        include: { author: { select: { name: true, role: true } } },
        take: 50,
      });
    }

    // 2. Resolve Context (Fetch System/Gov IDs)
    // We need to know which System/Government this school belongs to.
    const schoolContext = await this.prisma.school.findUnique({
      where: { id: schoolId },
      select: { systemId: true, governmentId: true },
    });

    if (!schoolContext) {
      throw new NotFoundException(
        'School context not found for announcements.',
      );
    }

    // 3. Construct "Smart Filter"
    return this.prisma.announcement.findMany({
      where: {
        OR: [
          { scope: 'GLOBAL' },
          { schoolId: schoolId }, // Scope: SCHOOL (Implicit or Explicit)
          {
            scope: 'SYSTEM',
            targetIds: { has: schoolContext.systemId },
          },
          {
            scope: 'GOVERNMENT',
            targetIds: { has: schoolContext.governmentId || 'none' },
          },
          {
            scope: 'INDIVIDUAL',
            targetIds: { has: userId },
          },
        ],
        status: 'SENT',
      },
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: { name: true, role: true },
        },
      },
      take: 50,
    });
  }
  private async verifyOwnership(id: string, schoolId: string | null) {
    if (!schoolId) return; // Global Admin (null) has access to everything

    const announcement = await this.prisma.announcement.findFirst({
      where: { id, schoolId },
    });

    if (!announcement) {
      throw new NotFoundException('Anúncio não encontrado ou acesso negado.');
    }
  }

  async deactivate(schoolId: string | null, id: string) {
    await this.verifyOwnership(id, schoolId);
    return this.prisma.announcement.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });
  }

  async restore(schoolId: string | null, id: string) {
    await this.verifyOwnership(id, schoolId);
    return this.prisma.announcement.update({
      where: { id },
      data: { status: 'ACTIVE' },
    });
  }

  async remove(schoolId: string | null, id: string) {
    await this.verifyOwnership(id, schoolId);
    return this.prisma.announcement.delete({
      where: { id },
    });
  }
}
