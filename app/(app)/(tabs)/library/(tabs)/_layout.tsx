import { Tabs } from 'expo-router';
import { ThemeColors, useResolvedStyles, useThemeColors } from '@/lib/hooks/useThemeColors';
import { Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Text from '@/lib/components/theme/Text';
import LibraryTabBar from '@/lib/components/navigation/LibraryTabBar';
import { syncData } from '@/lib/data/sync';
import { useSQLiteContext } from 'expo-sqlite';

export default function Layout() {
    const db = useSQLiteContext();
    const resolvedStyles = useResolvedStyles(styles);
  
    return (
        <>
            <SafeAreaView
                edges={[ 'top' ]}
                style={resolvedStyles.headerContainer}
            >
                <Text style={resolvedStyles.headerTitle}>Library</Text>
            </SafeAreaView>
            <Tabs
                screenOptions={{
                    headerShown: false,
                    tabBarPosition: 'top',
                    sceneStyle: resolvedStyles.tabScreen
                }}
                tabBar={props => <LibraryTabBar {...props} />}
            >   
                <Tabs.Screen name='index' options={{ title: 'Routines' }} />
                <Tabs.Screen name='workouts' options={{ title: 'Workouts' }} />
                <Tabs.Screen name='exercises' options={{ title: 'Exercises' }} />
            </Tabs>
        </>
    );
  }

const styles = (colors: ThemeColors) => StyleSheet.create({
    container: {
        flex: 1
    },

    headerContainer: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        backgroundColor: colors.backgroundSecondary
    },

    headerTitle: {
        fontSize: 40,
        lineHeight: 40,
        fontWeight: 700
    },

    tabScreen: {
        paddingHorizontal: 20,
        alignItems: 'stretch',
        backgroundColor: colors.background
    }
})