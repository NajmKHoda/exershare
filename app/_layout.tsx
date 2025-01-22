import { ThemeColors, ThemeColorsConsumer, ThemeColorsProvider } from '@/lib/hooks/useThemeColors';
import { Tabs } from 'expo-router';
import { SQLiteDatabase, SQLiteProvider } from 'expo-sqlite';
import { PlatformColor } from 'react-native';
import TabSymbol from '@/lib/components/navigation/TabSymbol';

export default function RootLayout() {
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

async function initDatabase(db: SQLiteDatabase) {
    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS exercises (
            id INTEGER PRIMARY KEY NOT NULL,
            name TEXT NOT NULL,
            sets TEXT NOT NULL,
            notes TEXT,
            categories TEXT
        );
        
        INSERT OR IGNORE INTO exercises (id, name, sets) VALUES
            (1, 'Bench Press', '3x12'),
            (2, 'Lateral Pulldown', '3x12'),
            (3, 'Arnold Press', '3x12'),
            (4, 'Cable Row', '3x12'),
            (5, 'Pressdowns/Overheads', '3x12'),
            (6, 'EZ-Bar Bicep Curls', '3x12'),
            (7, 'Chest/Delt Flys', '3x12');
    `);
}