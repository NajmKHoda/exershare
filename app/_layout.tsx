import { ThemeColors, ThemeColorsConsumer, ThemeColorsProvider } from '@/lib/hooks/useThemeColors';
import { Tabs } from 'expo-router';
import { openDatabaseSync, SQLiteProvider } from 'expo-sqlite';
import { PlatformColor } from 'react-native';
import TabSymbol from '@/lib/components/navigation/TabSymbol';
import { initDatabase } from '@/lib/data/database';
import { useDrizzleStudio } from 'expo-drizzle-studio-plugin'; 

const db = openDatabaseSync('app.db');

export default function RootLayout() {
    useDrizzleStudio(db);

    return (
        <SQLiteProvider databaseName='app.db' onInit={ initDatabase } >
        <ThemeColorsProvider value={ themeColors }>
        <ThemeColorsConsumer>
            {themeColors => (
                <Tabs screenOptions={{
                    headerShown: false,
                    tabBarStyle: {
                        backgroundColor: themeColors.backgroundSecondary,
                        borderTopWidth: 0
                    }
                }} >
                    <Tabs.Screen
                        name='index'
                        options={{
                            title: 'Home',
                            tabBarIcon: TabSymbol('dumbbell.fill')
                        }} />
                    <Tabs.Screen
                        name='library/(tabs)'
                        options={{
                            title: 'Library',
                            tabBarIcon: TabSymbol('book.closed.fill')
                        }} />
                </Tabs>
            )}
        </ThemeColorsConsumer>
        </ThemeColorsProvider>
        </SQLiteProvider>
    );
}

const themeColors: ThemeColors = {
    primary: PlatformColor('label'),
    accent: PlatformColor('link'),
    background: PlatformColor('systemBackground'),
    backgroundSecondary: PlatformColor('secondarySystemBackground')
}