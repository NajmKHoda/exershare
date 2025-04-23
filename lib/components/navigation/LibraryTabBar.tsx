import { View, Pressable, StyleSheet, PlatformColor } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { ThemeColors, useResolvedStyles, useThemeColors } from '@/lib/hooks/useThemeColors';
import ThemeText from '../theme/ThemeText';

export default function LibraryTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
    const colors = useThemeColors();
    const resolvedStyles = useResolvedStyles(styles);

    return (
        <View style={resolvedStyles.tabContainer}>
            {state.routes.map((route, index) => {
                const { options } = descriptors[route.key];
                const label = options.title || route.name;
                const isSelected = index === state.index;

                return (
                    <Pressable
                        key={ route.key }
                        onPress={ () => navigation.navigate(route.name) }
                    >
                        <ThemeText style={[
                            resolvedStyles.tabText,
                            isSelected && resolvedStyles.tabTextSelected
                        ]}>
                            { label }
                        </ThemeText>
                    </Pressable>
                );
            })}
        </View>
    );
}

const styles = (colors: ThemeColors) => StyleSheet.create({
    tabContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 15,
        paddingHorizontal: 20,
        backgroundColor: colors.background
    },

    tabText: {
        fontSize: 24,
        lineHeight: 24
    },

    tabTextSelected: {
        fontWeight: 'bold',
        color: colors.accent
    }
});
