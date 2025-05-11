import { Session } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabase';

export const SessionContext = createContext<SessionData | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [isSessionLoading, setIsSessionLoading] = useState(true);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setIsSessionLoading(false);
        });
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_, session) => setSession(session)
        );
        return () => subscription.unsubscribe();
    }, [])

    return (
        <SessionContext.Provider value={{ session, isSessionLoading }}>
            {children}
        </SessionContext.Provider>
    );
}

export function useSession() {
    const context = useContext(SessionContext);
    if (!context) {
        throw new Error('useSession must be used within a SessionProvider');
    }
    return context;
}

interface SessionData {
    session: Session | null;
    isSessionLoading: boolean;
}