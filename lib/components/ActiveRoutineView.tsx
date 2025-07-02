import { Pressable, StyleSheet, View } from 'react-native';
import Text from './theme/Text';
import { ThemeColors, useResolvedStyles, useThemeColors } from '../hooks/useThemeColors';
import DatabaseSelectModal from './modals/DatabaseSelectModal';
import { useState } from 'react';
import { DataItem } from './lists/SearchableList';
import { useSQLiteContext } from 'expo-sqlite';
import { Pencil, Share } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import useSQLiteQuery from '../hooks/useSQLiteQuery';
import { standardShadow } from '../standardStyles';

export default function ActiveRoutineView() {
    const colors = useThemeColors();
    const resolvedStyles = useResolvedStyles(styles);

    const db = useSQLiteContext();
    const router = useRouter();
    const [activeRoutine] = useSQLiteQuery<{ id: string, name: string }>(
        `SELECT id, name FROM routines WHERE id = (SELECT active_routine_id FROM user)`,
        false,
        'user'
    );
    const [isModalVisible, setModalVisible] = useState(false);

    function handleRoutineSelect(routine: DataItem) {
        db.runAsync(`UPDATE user SET active_routine_id = ?;`, routine.id);
    }

    return (
        <>
            <View style={resolvedStyles.container}>
                <View style={resolvedStyles.info}>
                    <Text>ACTIVE ROUTINE</Text>
                    <Text style={resolvedStyles.activeRoutineName}>
                        {activeRoutine?.name ?? 'None'}
                    </Text>
                </View>
                <View style={resolvedStyles.options}>
                    <Pressable onPress={() => setModalVisible(true)}>
                        <Pencil size={40} color={colors.primary} />
                    </Pressable>
                    { activeRoutine &&
                        <Pressable onPress={() => router.push(`/routine/${activeRoutine.id}/share`)}>
                            <Share size={40} color={colors.primary} />
                        </Pressable>
                    }
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
        backgroundColor: colors.backgroundSecondary,
        
        ...standardShadow
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