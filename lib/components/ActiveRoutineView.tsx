import { Pressable, StyleSheet, View } from 'react-native';
import ThemeText from './theme/ThemeText';
import { useThemeColors } from '../hooks/useThemeColors';
import { SymbolView } from 'expo-symbols';
import DatabaseSelectModal from './modals/DatabaseSelectModal';
import { useState } from 'react';
import { DataItem } from './lists/SearchableList';
import { useSQLiteContext } from 'expo-sqlite';
import { useActiveRoutine } from '../hooks/useActiveRoutine';

export default function ActiveRoutineView() {
    const db = useSQLiteContext();
    const colors = useThemeColors();
    const { activeRoutine, refreshActiveRoutine } = useActiveRoutine();
    const [isModalVisible, setModalVisible] = useState(false);

    function handleRoutineSelect(routine: DataItem) {
        db.runAsync(`UPDATE user SET active_routine_id = ?;`, routine.id);
        refreshActiveRoutine();
    }

    return (
        <>
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
                        { activeRoutine?.name ?? 'None' }
                    </ThemeText>
                </View>
                <View style={ styles.options }>
                    <Pressable onPress={ () => setModalVisible(true) }>
                        <SymbolView name='pencil.circle.fill' size={ 60 } />
                    </Pressable>
                    <SymbolView name='square.and.arrow.up.circle.fill' size={ 60 } />
                </View>
            </View>

            <DatabaseSelectModal
                visible={ isModalVisible }
                onClose={ () => setModalVisible(false) }
                dbName='routines'
                title='Select Active Routine'
                onSelect={ handleRoutineSelect } />
        </>
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