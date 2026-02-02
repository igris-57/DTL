// frontend/contexts/AuthContext.tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

type UserRole = 'student' | 'admin' | null;

interface User {
    username: string;
    role: UserRole;
    name: string;
}

interface AuthContextType {
    user: User | null;
    login: (username: string, password: string) => { success: boolean; error?: string; redirectTo?: string };
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo credentials
const DEMO_USERS = {
    student: { password: 'student123', name: 'Demo Student', role: 'student' as const },
    admin: { password: 'admin123', name: 'Admin User', role: 'admin' as const },
};

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    // Load user from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem('auth_user');
        if (stored) {
            try {
                setUser(JSON.parse(stored));
            } catch {
                localStorage.removeItem('auth_user');
            }
        }
        setIsLoading(false);
    }, []);

    const login = (username: string, password: string) => {
        const demoUser = DEMO_USERS[username as keyof typeof DEMO_USERS];

        if (!demoUser) {
            return { success: false, error: 'Invalid username' };
        }

        if (demoUser.password !== password) {
            return { success: false, error: 'Invalid password' };
        }

        const newUser: User = {
            username,
            role: demoUser.role,
            name: demoUser.name,
        };

        setUser(newUser);
        localStorage.setItem('auth_user', JSON.stringify(newUser));

        const redirectTo = demoUser.role === 'admin' ? '/dashboard' : '/assessment';
        return { success: true, redirectTo };
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('auth_user');
        router.push('/');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
