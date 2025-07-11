import Text from '@/lib/components/theme/Text';
import { initDatabase } from '@/lib/data/database';
import DatabaseSynchronizer from '@/lib/data/DatabaseSynchronizer';
import { DatabaseListenerProvider } from '@/lib/hooks/useDatabaseListener';
import { useSession } from '@/lib/hooks/useSession';
import { supabase } from '@/lib/supabase';
import { Redirect, Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { CryptoDigestAlgorithm, digestStringAsync } from 'expo-crypto';

const DEV_EMAIL = process.env.EXPO_PUBLIC_DEV_EMAIL;
const DEV_PASSWORD = process.env.EXPO_PUBLIC_DEV_PASSWORD;

export default function AuthenticationGuard() {
    const { session, isSessionLoading } = useSession();
    const [encryptedDBName, setEncryptedDBName] = useState<string | null>(null);

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
    }, []);

    useEffect(() => {
        setEncryptedDBName(null);
        if (!session) return;

        digestStringAsync(CryptoDigestAlgorithm.SHA1, session.user.id)
            .then(hash => setEncryptedDBName(hash))
            .catch(error => console.error('Error generating database name:', error));
    }, [session])

    if (DEV_EMAIL && DEV_PASSWORD && !session)
        return <Text>Logging in with dev credentials...</Text>;

    if (isSessionLoading) {
        return <Text>Loading...</Text>;
    }

    if (!session) {
        return <Redirect href='/login' />;
    }

    if (!encryptedDBName) {
        return <Text>Loading database...</Text>;
    }
    
    return (
        <SQLiteProvider
            databaseName={`exershare-${encryptedDBName}.db`}
            onInit={initDatabase}
            options={{ enableChangeListener: true }}
        >
        <DatabaseSynchronizer />
        <DatabaseListenerProvider>
            <Stack screenOptions={{ headerShown: false }} />
        </DatabaseListenerProvider>
        </SQLiteProvider>
    );
}