import { ThemeColors, useResolvedStyles, useThemeColors } from '@/lib/hooks/useThemeColors';
import { standardShadow } from '@/lib/standardStyles';
import { Tabs } from 'expo-router';
import { Dumbbell, Book, LucideIcon } from 'lucide-react-native';
import { StyleSheet } from 'react-native';

export default function TabsLayout() {
    const resolvedStyles = useResolvedStyles(styles);

    return (
        <Tabs screenOptions={{
            headerShown: false,
            tabBarStyle: resolvedStyles.tabBar
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

const styles = (colors: ThemeColors) => StyleSheet.create({
    tabBar: {
        backgroundColor: colors.backgroundSecondary,
        borderTopWidth: 0,
        ...standardShadow,
        shadowOffset: { width: 0, height: -3 },
    }
});