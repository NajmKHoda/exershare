import { StyleSheet, View, Pressable } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native'
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemeColors, useResolvedStyles, useThemeColors } from '../hooks/useThemeColors';
import ThemeText from './theme/ThemeText';

interface Props {
    routineName: string,
    workoutName: string,
    date: Date,
    onDayChange?: (amount: number) => unknown
}

export default function RoutineHeader({ routineName, workoutName, date, onDayChange }: Props) {
    const colors = useThemeColors();
    const resolvedStyles = useResolvedStyles(styles);

    return (
        <SafeAreaView edges={[ 'top' ]} style={resolvedStyles.container}>
            <Pressable onPress={ () => onDayChange && onDayChange(-1) }>
                <ChevronLeft size={48} color={colors.primary} />
            </Pressable>
            <View style={ resolvedStyles.info }>
                <ThemeText style={ resolvedStyles.secondaryInfo }>{ routineName.toUpperCase() }</ThemeText>
                <ThemeText style={ resolvedStyles.workoutName }>{ workoutName }</ThemeText>
                <ThemeText style={ resolvedStyles.secondaryInfo }>{
                    date.toLocaleDateString('en-US', { dateStyle: 'full' })
                }</ThemeText>
            </View>
            <Pressable onPress={ () => onDayChange && onDayChange(1) }>
                <ChevronRight size={48} color={colors.primary} />
            </Pressable>
        </SafeAreaView>
    );
}

const styles = (colors: ThemeColors) => StyleSheet.create({ 
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 15,
        backgroundColor: colors.backgroundSecondary
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