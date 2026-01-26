import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class InvitationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(
    senderId: string,
    schoolId: string,
    createInvitationDto: CreateInvitationDto,
  ) {
    const { receiverEmail } = createInvitationDto;

    return this.prisma.$transaction(async (tx) => {
      const receiver = await tx.user.findFirst({
        where: { email: receiverEmail, schoolId: schoolId, role: 'GUARDIAN' },
      });

      if (!receiver) {
        throw new NotFoundException(
          'Nenhum responsável encontrado com este email nesta escola.',
        );
      }
      if (receiver.id === senderId) {
        throw new ConflictException(
          'Você não pode enviar um convite para si mesmo.',
        );
      }

      const existingInvitation = await tx.guardianInvitation.findFirst({
        where: { senderId, receiverId: receiver.id, status: 'PENDING' },
      });
      if (existingInvitation) {
        throw new ConflictException(
          'Já existe um convite pendente para este usuário.',
        );
      }

      const invitation = await tx.guardianInvitation.create({
        data: {
          senderId,
          receiverId: receiver.id,
          schoolId,
          status: 'PENDING',
        },
      });

      await this.auditService.logAction(tx, {
        userId: senderId,
        action: 'CREATE_INVITATION',
        entity: 'GuardianInvitation',
        entityId: invitation.id,
        meta: { receiverEmail },
      });

      return invitation;
    });
  }

  async accept(invitationId: string, receiverId: string) {
    return this.prisma.$transaction(
      async (tx) => {
        const invitation = await tx.guardianInvitation.findFirst({
          where: {
            id: invitationId,
            receiverId: receiverId,
            status: 'PENDING',
          },
        });

        if (!invitation) {
          throw new NotFoundException('Convite não encontrado ou inválido.');
        }

        // Conecta o novo responsável a todos os dependentes do remetente
        const sender = await tx.user.findUnique({
          where: { id: invitation.senderId },
          include: { dependentRelations: true },
        });

        if (!sender) {
          throw new NotFoundException('Remetente não encontrado.');
        }

        const dependenciesToCreate = sender.dependentRelations.map((rel) => ({
          guardianId: receiverId,
          dependentId: rel.dependentId,
        }));

        if (dependenciesToCreate.length > 0) {
          await tx.userDependency.createMany({
            data: dependenciesToCreate,
            skipDuplicates: true,
          });
        }

        const acceptedInvitation = await tx.guardianInvitation.update({
          where: { id: invitationId },
          data: { status: 'ACCEPTED' },
        });

        await this.auditService.logAction(tx, {
          userId: receiverId,
          action: 'ACCEPT_INVITATION',
          entity: 'GuardianInvitation',
          entityId: acceptedInvitation.id,
        });

        return acceptedInvitation;
      },
      { isolationLevel: 'Serializable' },
    );
  }

  async reject(invitationId: string, receiverId: string) {
    const invitation = await this.prisma.guardianInvitation.findFirst({
      where: { id: invitationId, receiverId: receiverId, status: 'PENDING' },
    });

    if (!invitation) {
      throw new NotFoundException('Convite não encontrado ou inválido.');
    }

    return this.prisma.guardianInvitation.update({
      where: { id: invitationId },
      data: { status: 'REJECTED' },
    });
  }

  async getMyInvitations(userId: string) {
    return this.prisma.guardianInvitation.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      include: {
        sender: { select: { name: true, email: true } },
        receiver: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
