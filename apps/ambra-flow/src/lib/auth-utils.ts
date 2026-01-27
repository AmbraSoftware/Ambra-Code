/**
 * Auth Utilities - Sincronização de Token
 * 
 * Sincroniza token entre localStorage (client-side) e cookies (server-side middleware).
 * Garante que o middleware possa acessar o token para validação.
 */

/**
 * Armazena token em localStorage e cookie
 */
export function setAuthToken(token: string): void {
    if (typeof window === 'undefined') return;
    
    // Armazena no localStorage (client-side)
    localStorage.setItem('token', token);
    
    // Sincroniza com cookie (server-side middleware)
    // Max-age: 7 dias (mesmo padrão do backend)
    document.cookie = `token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
}

/**
 * Remove token de localStorage e cookie
 */
export function removeAuthToken(): void {
    if (typeof window === 'undefined') return;
    
    // Remove do localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Remove cookie (expira imediatamente)
    document.cookie = 'token=; path=/; max-age=0; SameSite=Lax';
}

/**
 * Obtém token do localStorage (fallback para cookie se necessário)
 */
export function getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    
    // Prioriza localStorage
    const token = localStorage.getItem('token');
    if (token) return token;
    
    // Fallback: tenta ler do cookie
    const cookies = document.cookie.split(';');
    const tokenCookie = cookies.find(c => c.trim().startsWith('token='));
    if (tokenCookie) {
        return tokenCookie.split('=')[1];
    }
    
    return null;
}
