import ThemeText from '@/lib/components/theme/ThemeText';
import { useSession } from '@/lib/hooks/useSession';
import { Redirect, Stack } from 'expo-router';

export default function AuthenticationGuard() {
    const { session, isSessionLoading } = useSession();

    if (isSessionLoading) {
        return <ThemeText>Loading...</ThemeText>;
    }

    if (!session) {
        return <Redirect href='/login' />;
    }

    return <Stack screenOptions={{ headerShown: false }} />;
}