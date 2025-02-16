import TabSymbol from '@/lib/components/navigation/TabSymbol';
import { useThemeColors } from '@/lib/hooks/useThemeColors'
import { Tabs } from 'expo-router';

export default function TabsLayout() {
    const colors = useThemeColors();

    return (
        <Tabs screenOptions={{
            headerShown: false,
            tabBarStyle: {
                backgroundColor: colors.backgroundSecondary,
                borderTopWidth: 0
            }
        }} >
            <Tabs.Screen
                name='index'
                options={{
                    title: 'Routines',
                    tabBarIcon: TabSymbol('dumbbell.fill')
                }} />
            <Tabs.Screen
                name='library/(tabs)'
                options={{
                    title: 'Library',
                    tabBarIcon: TabSymbol('book.closed.fill')
                }} />
        </Tabs>
    );

}