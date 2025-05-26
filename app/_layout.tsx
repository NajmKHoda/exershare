import { ThemeColors, ThemeColorsProvider } from '@/lib/hooks/useThemeColors';
import { Redirect, Slot, Stack } from 'expo-router';
import { openDatabaseSync, SQLiteProvider } from 'expo-sqlite';
import { PlatformColor } from 'react-native';
import { initDatabase } from '@/lib/data/database';
import { useDrizzleStudio } from 'expo-drizzle-studio-plugin'; 
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActiveRoutineProvider } from '@/lib/hooks/useActiveRoutine';
import { SessionProvider } from '@/lib/hooks/useSession';
import { useNetworkState } from 'expo-network';
import { useEffect } from 'react';

const db = openDatabaseSync('app.db');

export default function RootLayout() {
    const networkState = useNetworkState();
    useDrizzleStudio(db);

    useEffect(() => {
        console.log('Network state:', networkState);
    }, [networkState]);

    return (
        <SessionProvider>
        <SQLiteProvider databaseName='app.db' onInit={ initDatabase } >
        <ThemeColorsProvider value={ themeColors }>
        <ActiveRoutineProvider>
        <GestureHandlerRootView>
        <SafeAreaProvider>
            <Slot />
        </SafeAreaProvider>
        </GestureHandlerRootView>
        </ActiveRoutineProvider>
        </ThemeColorsProvider>
        </SQLiteProvider>
        </SessionProvider>
    );
}

const themeColors: ThemeColors = {
    primary: PlatformColor('label'),
    accent: PlatformColor('link'),
    background: PlatformColor('systemBackground'),
    backgroundSecondary: PlatformColor('secondarySystemBackground'),
    separator: PlatformColor('opaqueSeparator'),

    red: PlatformColor('systemRed'),
    orange: PlatformColor('systemOrange'),
    yellow: PlatformColor('systemYellow'),
    green: PlatformColor('systemGreen'),
    blue: PlatformColor('systemBlue'),
    purple: PlatformColor('systemPurple'),
    gray: PlatformColor('systemGray')
}
