import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiHeader,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto'; // Added RegisterDto import
import { ChangePasswordDto } from './dto/change-password.dto'; // [v4.5] Security
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/users.decorator';
import {
  AuthenticatedUserPayload,
  UserProfileDto,
} from './dto/user-payload.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Autentica um utilizador e retorna um token JWT',
    description:
      'Para contas vinculadas a escolas, o cabeçalho x-tenant-slug é obrigatório em ambiente de desenvolvimento ou domínios partilhados.',
  })
  @ApiHeader({
    name: 'x-tenant-slug',
    description: 'Identificador da escola (Slug)',
    required: false, // Opcional para Global Admin, obrigatório para os restantes
  })
  @ApiResponse({ status: 200, description: 'Login realizado com sucesso.' })
  @ApiResponse({
    status: 401,
    description: 'Credenciais inválidas ou escola não identificada.',
  })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registra uma nova escola ou operador' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Recupera os dados do perfil do utilizador logado' })
  @ApiResponse({
    status: 200,
    description: 'Dados do perfil recuperados.',
    type: UserProfileDto,
  })
  async getProfile(
    @CurrentUser() user: AuthenticatedUserPayload,
  ): Promise<UserProfileDto> {
    return this.authService.getProfile(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '[v4.5] Troca de senha com refresh de token',
    description:
      'Permite que o usuário troque sua senha e receba um novo JWT atualizado.',
  })
  @ApiResponse({
    status: 200,
    description: 'Senha alterada com sucesso. Novo token retornado.',
  })
  async changePassword(
    @CurrentUser() user: AuthenticatedUserPayload,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(user.id, dto.newPassword);
  }
}
