import { UserRole } from './enums';

/**
 * Resposta do endpoint /auth/login
 */
export interface AuthResponse {
  access_token: string;
  user: {
    id: string;
    name: string;
    roles: UserRole[];
    schoolId: string | null;
    mustChangePassword?: boolean;
  };
}

/**
 * Perfil do usuário autenticado (armazenado no AsyncStorage)
 */
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  roles: UserRole[];
  schoolId: string | null;
}
