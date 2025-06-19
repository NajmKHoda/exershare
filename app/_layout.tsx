import { ThemeColors, ThemeColorsProvider } from '@/lib/hooks/useThemeColors';
import { Slot } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { PlatformColor } from 'react-native';
import { initDatabase } from '@/lib/data/database';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActiveRoutineProvider } from '@/lib/hooks/useActiveRoutine';
import { SessionProvider } from '@/lib/hooks/useSession';
import DatabaseSynchronizer from '@/lib/data/DatabaseSynchronizer';
import { DatabaseListenerProvider } from '@/lib/hooks/useDatabaseListener';

export default function RootLayout() {
    return (
        <SessionProvider>
        <SQLiteProvider
            databaseName='app.db'
            onInit={ initDatabase }
            options={{ enableChangeListener: true }}
        >
        <DatabaseSynchronizer />
        <DatabaseListenerProvider>
        <ThemeColorsProvider value={ themeColors }>
        <ActiveRoutineProvider>
        <GestureHandlerRootView>
        <SafeAreaProvider>
            <Slot />
        </SafeAreaProvider>
        </GestureHandlerRootView>
        </ActiveRoutineProvider>
        </ThemeColorsProvider>
        </DatabaseListenerProvider>
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
