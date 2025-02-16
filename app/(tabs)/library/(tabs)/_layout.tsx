import { Tabs } from 'expo-router';
import { useThemeColors } from '@/lib/hooks/useThemeColors';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ThemeText from '@/lib/components/theme/ThemeText';
import LibraryTabBar from '@/lib/components/navigation/LibraryTabBar';

export default function Layout() {
    const colors = useThemeColors();
  
    return (
        <>
            <SafeAreaView
                edges={[ 'top' ]}
                style={{
                    backgroundColor: colors.backgroundSecondary,
                    ...styles.headerContainer
                }}
            >
                <ThemeText style={ styles.headerTitle }>Library</ThemeText>
            </SafeAreaView>
            <Tabs
                screenOptions={{
                    headerShown: false,
                    tabBarPosition: 'top',
                    sceneStyle: {
                        backgroundColor: colors.background,
                        ...styles.tabScreen
                    }
                }}
                tabBar={ props => <LibraryTabBar { ...props } /> }
            >   
                <Tabs.Screen name='index' options={{ title: 'Routines' }} />
                <Tabs.Screen name='workouts' options={{ title: 'Workouts' }} />
                <Tabs.Screen name='exercises' options={{ title: 'Exercises' }} />
            </Tabs>
        </>
    );
  }

const styles = StyleSheet.create({
    container: {
        flex: 1
    },

    headerContainer: {
        paddingVertical: 10,
        paddingHorizontal: 20
    },

    headerTitle: {
        fontSize: 40,
        lineHeight: 40,
        fontWeight: 700
    },

    tabScreen: {
        paddingHorizontal: 20,
        alignItems: 'stretch'
    }

})