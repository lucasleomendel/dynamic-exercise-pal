// AuthContext.tsx

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { supabase } from '../utils/supabaseClient'; // Update this import based on your project structure

interface UserProfile {
    id: string;
    email: string;
    name?: string;
    avatar_url?: string;
    created_at: string;
    updated_at: string;
}

interface AuthContextType {
    user: UserProfile | null;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string) => Promise<void>;
    refreshProfile: () => Promise<void>;
    updateProfile: (profile: UserProfile) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<UserProfile | null>(null);

    const signIn = async (email: string, password: string) => {
        const { user, error } = await supabase.auth.signIn({
            email,
            password,
        });
        if (error) throw error;
        setUser(user);
    };

    const signUp = async (email: string, password: string) => {
        const { user, error } = await supabase.auth.signUp({
            email,
            password,
        });
        if (error) throw error;
        setUser(user);
    };

    const refreshProfile = async () => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user?.id)
            .single();
        if (error) throw error;
        setUser(data);
    };

    const updateProfile = async (profile: UserProfile) => {
        const { error } = await supabase
            .from('profiles')
            .upsert(profile);
        if (error) throw error;
        setUser(profile);
    };

    return (
        <AuthContext.Provider value={{ user, signIn, signUp, refreshProfile, updateProfile }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
