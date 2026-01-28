import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  Logger,
} from '@nestjs/common';
import { Public } from '../../auth/decorators/public.decorator';
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('announcements')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnnouncementsController {
  private readonly logger = new Logger(AnnouncementsController.name);

  constructor(private readonly announcementsService: AnnouncementsService) {
    this.logger.log('AnnouncementsController initialized');
  }

  @Get('ping')
  @Public()
  ping() {
    return 'pong';
  }

  @Post()
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN, UserRole.GOV_ADMIN)
  async create(@Request() req, @Body() dto: CreateAnnouncementDto) {
    // Enforce RLS: Authenticated user's schoolId
    const schoolId = req.user.schoolId;
    const authorId = req.user.id;
    return this.announcementsService.create(schoolId, authorId, dto);
  }

  @Get()
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN, UserRole.GOV_ADMIN)
  async findAll(@Request() req) {
    const schoolId = req.user.schoolId;
    const userId = req.user.id;
    return this.announcementsService.findAll(schoolId, userId);
  }

  @Patch(':id/deactivate')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN)
  async deactivate(@Request() req, @Param('id') id: string) {
    return this.announcementsService.deactivate(req.user.schoolId, id);
  }

  @Patch(':id/restore')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN)
  async restore(@Request() req, @Param('id') id: string) {
    return this.announcementsService.restore(req.user.schoolId, id);
  }

  @Delete(':id')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN)
  async remove(@Request() req, @Param('id') id: string) {
    return this.announcementsService.remove(req.user.schoolId, id);
  }
}
