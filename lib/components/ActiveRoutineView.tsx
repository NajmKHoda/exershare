import { StyleSheet, View } from 'react-native';
import ThemeText from './theme/ThemeText';
import { useThemeColors } from '../hooks/useThemeColors';
import { SymbolView } from 'expo-symbols';
import useSQLiteQuery from '../hooks/useSQLiteQuery';

export default function ActiveRoutineView() {
    const colors = useThemeColors();
    const [queryResult] = useSQLiteQuery<{ name: string }>(`
        SELECT routines.name FROM routines
        JOIN user ON routines.id = user.active_routine_id;
    `);
    
    const activeRoutineName = queryResult?.name ?? 'None';

    return (
        <View
            style={{
                borderColor: colors.accent,
                backgroundColor: colors.backgroundSecondary,
                ...styles.container
            }}
        >
            <View style={ styles.info }>
                <ThemeText>ACTIVE ROUTINE</ThemeText>
                <ThemeText style={ styles.activeRoutineName }>
                    { activeRoutineName }
                </ThemeText>
            </View>
            <View style={ styles.options }>
                <SymbolView name='pencil.circle.fill' size={ 60 } />
                <SymbolView name='square.and.arrow.up.circle.fill' size={ 60 } />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderRadius: 10,
        borderWidth: 3,
        padding: 25
    },

    info: {
        gap: 10
    },

    activeRoutineName: {
        fontWeight: 'bold',
        fontSize: 24,
        lineHeight: 24
    },

    options: {
        flexDirection: 'row'
    }
});