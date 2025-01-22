import { SymbolView } from 'expo-symbols';
import { StyleSheet, View, Text, PlatformColor } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '../hooks/useThemeColors';
import ThemeText from './theme/ThemeText';

export default function RoutineHeader() {
    const themeColors = useThemeColors();

    return (
        <SafeAreaView edges={[ 'top' ]} style={{
            backgroundColor: themeColors.backgroundSecondary, 
            ...styles.container
        }}>
            <SymbolView size={ 40 } name='chevron.left' />
            <View style={ styles.info }>
                <ThemeText style={ styles.secondaryInfo }>PUSH, PULL, LEGS</ThemeText>
                <ThemeText style={ styles.workoutName }>Push Day A</ThemeText>
                <ThemeText style={ styles.secondaryInfo }>Today, January 1st</ThemeText>
            </View>
            <SymbolView size={ 40 } name='chevron.right' />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({ 
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 30,
        paddingVertical: 15
    },

    info: {
        justifyContent: 'center',
        gap: 10
    },

    workoutName: {
        fontSize: 40,
        lineHeight: 40,
        fontWeight: 'bold'
    },

    secondaryInfo: {
        textAlign: 'center',
        fontSize: 16,
        lineHeight: 16
    },
});