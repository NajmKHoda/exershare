import { ThemeColors, ThemeColorsProvider } from '@/lib/hooks/useThemeColors';
import { Stack } from 'expo-router';
import { openDatabaseSync, SQLiteProvider } from 'expo-sqlite';
import { PlatformColor } from 'react-native';
import { initDatabase } from '@/lib/data/database';
import { useDrizzleStudio } from 'expo-drizzle-studio-plugin'; 
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const db = openDatabaseSync('app.db');

export default function RootLayout() {
    useDrizzleStudio(db);

    return (
        <SQLiteProvider databaseName='app.db' onInit={ initDatabase } >
        <ThemeColorsProvider value={ themeColors }>
        <GestureHandlerRootView>
            <Stack screenOptions={{ headerShown: false }}/>
        </GestureHandlerRootView>
        </ThemeColorsProvider>
        </SQLiteProvider>
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
