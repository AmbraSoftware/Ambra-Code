"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    school?: {
        name: string;
    }
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, pass: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // Load User on Mount
    useEffect(() => {
        async function loadUser() {
            const token = Cookies.get('nodum_token');
            // console.log("DEBUG: AuthContext loadUser token:", token);
            if (token) {
                try {
                    const { data } = await api.get('/auth/profile');
                    setUser(data);
                } catch (error) {
                    console.error("Failed to load user profile", error);
                    Cookies.remove('nodum_token');
                    setUser(null);
                }
            }
            setLoading(false);
        }
        loadUser();
    }, []);

    const login = async (email: string, pass: string) => {
        try {
            const { data } = await api.post('/auth/login', { email, password: pass });
            // console.log("DEBUG: Login Response Data:", data);

            // Save Token
            if (data.access_token) {
                Cookies.set('nodum_token', data.access_token, { expires: 7 }); // 7 days
                // console.log("DEBUG: Token Set in Cookie:", Cookies.get('nodum_token'));
            } else {
                console.error("Login failed: No access_token in response");
            }

            // Set User State
            setUser(data.user);

            // Redirect handled by component or here
            router.push('/dashboard');
        } catch (error) {
            console.error("Login failed", error);
            throw error;
        }
    };

    const logout = () => {
        Cookies.remove('nodum_token');
        setUser(null);
        router.push('/');
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
