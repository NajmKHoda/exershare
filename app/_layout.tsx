import { ThemeColors, ThemeColorsConsumer, ThemeColorsProvider } from '@/lib/hooks/useThemeColors';
import { Tabs } from 'expo-router';
import { SQLiteDatabase, SQLiteProvider } from 'expo-sqlite';
import { PlatformColor } from 'react-native';
import TabSymbol from '@/lib/components/navigation/TabSymbol';
import { Exercise } from '@/lib/data/Exercise';
import { Workout } from '@/lib/data/Workout';

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
    await Promise.all([
        Exercise.init(db),
        Workout.init(db)
    ]);
}