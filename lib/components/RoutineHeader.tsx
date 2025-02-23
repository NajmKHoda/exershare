import { SymbolView } from 'expo-symbols';
import { StyleSheet, View, Text, PlatformColor, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '../hooks/useThemeColors';
import ThemeText from './theme/ThemeText';

interface Props {
    routineName: string,
    workoutName: string,
    date: Date,
    onDayChange?: (amount: number) => unknown
}

export default function RoutineHeader({ routineName, workoutName, date, onDayChange }: Props) {
    const themeColors = useThemeColors();

    return (
        <SafeAreaView edges={[ 'top' ]} style={{
            backgroundColor: themeColors.backgroundSecondary, 
            ...styles.container
        }}>
            <Pressable onPress={ () => onDayChange && onDayChange(-1) }>
                <SymbolView size={ 40 } name='chevron.left' />
            </Pressable>
            <View style={ styles.info }>
                <ThemeText style={ styles.secondaryInfo }>{ routineName.toUpperCase() }</ThemeText>
                <ThemeText style={ styles.workoutName }>{ workoutName }</ThemeText>
                <ThemeText style={ styles.secondaryInfo }>{
                    date.toLocaleDateString('en-US', { dateStyle: 'full' })}
                </ThemeText>
            </View>
            <Pressable onPress={ () => onDayChange && onDayChange(1) }>
                <SymbolView size={ 40 } name='chevron.right' />
            </Pressable>
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
        alignItems: 'center',
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