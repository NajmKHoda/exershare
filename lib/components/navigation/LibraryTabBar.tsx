import { View, Text, Pressable, StyleSheet } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useThemeColors } from '@/lib/hooks/useThemeColors';

export default function LibraryTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
    const colors = useThemeColors();

    return (
        <View style={{ backgroundColor: colors.background, ...styles.tabContainer }}>
            {state.routes.map(route => {
                const { options } = descriptors[route.key];
                const label = options.title || route.name;

                return (
                    <Pressable
                        key={ route.key }
                        onPress={ () => navigation.navigate(route.name) }
                    >
                        <Text style={ styles.tabText }>
                            { label }
                        </Text>
                    </Pressable>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    tabContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 15,
        paddingHorizontal: 20,
    },

    tabText: {
        fontSize: 24,
        lineHeight: 24
    }
});
