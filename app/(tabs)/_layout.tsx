import { useThemeColors } from '@/lib/hooks/useThemeColors';
import { Tabs } from 'expo-router';
import { Dumbbell, Book, LucideIcon } from 'lucide-react-native';

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
                    tabBarIcon: TabIcon(Dumbbell)
                }} />
            <Tabs.Screen
                name='library/(tabs)'
                options={{
                    title: 'Library',
                    tabBarIcon: TabIcon(Book)
                }} />
        </Tabs>
    );
}

interface TabIconProps {
    size: number,
    focused: boolean,
    color: string
}

function TabIcon(Icon: LucideIcon) {
    return ({ color, size }: TabIconProps) => (
        <Icon size={size} color={color} />
    );
}