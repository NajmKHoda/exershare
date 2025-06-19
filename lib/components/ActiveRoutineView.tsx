import { Pressable, StyleSheet, View } from 'react-native';
import ThemeText from './theme/ThemeText';
import { ThemeColors, useResolvedStyles, useThemeColors } from '../hooks/useThemeColors';
import DatabaseSelectModal from './modals/DatabaseSelectModal';
import { useState } from 'react';
import { DataItem } from './lists/SearchableList';
import { useSQLiteContext } from 'expo-sqlite';
import { useActiveRoutine } from '../hooks/useActiveRoutine';
import { Pencil, Share } from 'lucide-react-native';

export default function ActiveRoutineView() {
    const db = useSQLiteContext();
    const resolvedStyles = useResolvedStyles(styles);
    const activeRoutine = useActiveRoutine();
    const [isModalVisible, setModalVisible] = useState(false);

    function handleRoutineSelect(routine: DataItem) {
        db.runAsync(`UPDATE user SET active_routine_id = ?;`, routine.id);
    }

    return (
        <>
            <View style={resolvedStyles.container}>
                <View style={resolvedStyles.info}>
                    <ThemeText>ACTIVE ROUTINE</ThemeText>
                    <ThemeText style={resolvedStyles.activeRoutineName}>
                        {activeRoutine?.name ?? 'None'}
                    </ThemeText>
                </View>
                <View style={resolvedStyles.options}>
                    <Pressable onPress={() => setModalVisible(true)}>
                        <Pencil size={40} />
                    </Pressable>
                    <Share size={40} />
                </View>
            </View>

            <DatabaseSelectModal
                visible={isModalVisible}
                onClose={() => setModalVisible(false)}
                dbName='routines'
                title='Select Active Routine'
                onSelect={handleRoutineSelect} />
        </>
    );
}

const styles = (colors: ThemeColors) => StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderRadius: 10,
        borderWidth: 3,
        padding: 25,
        borderColor: colors.accent,
        backgroundColor: colors.backgroundSecondary
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
        flexDirection: 'row',
        gap: 16
    }
});