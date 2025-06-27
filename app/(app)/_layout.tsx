import ThemeText from '@/lib/components/theme/ThemeText';
import { useSession } from '@/lib/hooks/useSession';
import { supabase } from '@/lib/supabase';
import { Redirect, Stack } from 'expo-router';
import { useEffect } from 'react';

const DEV_EMAIL = process.env.EXPO_PUBLIC_DEV_EMAIL;
const DEV_PASSWORD = process.env.EXPO_PUBLIC_DEV_PASSWORD;

export default function AuthenticationGuard() {
    const { session, isSessionLoading } = useSession();

    /* DEBUG START */
    useEffect(() => {
        async function autoLogin() {
            if (DEV_EMAIL && DEV_PASSWORD && !session) {
                // Automatically log in with dev credentials if available
                const { error } = await supabase.auth.signInWithPassword({
                    email: DEV_EMAIL,
                    password: DEV_PASSWORD
                });

                if (error) {
                    console.error('Auto-login failed:', error);
                } else {
                    console.log('Auto-login successful');
                }
            }
        }

        autoLogin();
    }, [session]);

    if (DEV_EMAIL && DEV_PASSWORD && !session)
        return <ThemeText>Logging in with dev credentials...</ThemeText>;
    /* DEBUG END */

    if (isSessionLoading) {
        return <ThemeText>Loading...</ThemeText>;
    }

    if (!session) {
        return <Redirect href='/login' />;
    }

    return <Stack screenOptions={{ headerShown: false }} />;
}