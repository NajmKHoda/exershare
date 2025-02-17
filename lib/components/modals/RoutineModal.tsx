import { useState, useEffect } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { Routine } from '@/lib/data/Routine';
import LabeledTextField from '../controls/LabeledTextField';
import EditModal from './EditModal';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import WorkoutSelectModal from './WorkoutSelectModal';
import { DataItem } from '../lists/SearchableList';
import { FlatList } from 'react-native-gesture-handler';
import Separator from '../layout/Separator';
import { useThemeColors } from '@/lib/hooks/useThemeColors';
import ThemeText from '../theme/ThemeText';
import { SymbolView } from 'expo-symbols';

interface Props {
    routine: Routine | null;
    visible: boolean;
    onClose: () => unknown;
}

export default function RoutineModal({ routine, visible, onClose }: Props) {
    const db = useSQLiteContext();
    const colors = useThemeColors();
    const [curRoutine, setCurRoutine] = useState<RoutineData>(routineOrDefault);
    const [dayToSet, setDayToSet] = useState<number | null>(null);

    // Reset state when a new routine is provided
    useEffect(() => setCurRoutine(routineOrDefault), [routine]);

    function routineOrDefault() {
        return {
            name: routine?.name ?? '',
            workouts: routine?.workouts.map(workout =>
                workout !== null ? { id: workout.id, name: workout.name } : null
            ) ?? new Array(7).fill(null)
        };
    }

    async function handleSave() {
        const workoutIds = curRoutine.workouts.map(workout => workout?.id ?? null);

        if (routine) {
            const updatedRoutine = new Routine(
                routine.id,
                curRoutine.name,
                workoutIds
            );
            await updatedRoutine.save(db);
        } else {
            await Routine.create(
                curRoutine.name,
                workoutIds,
                db
            );
        }

        setCurRoutine(routineOrDefault);
        onClose();
    }

    async function handleDelete() {
        await routine!.delete(db);
        onClose();
    }

    return (
        <EditModal
            visible={visible}
            onClose={onClose}
            onSave={handleSave}
            onDelete={routine ? handleDelete : undefined}
        >
            <LabeledTextField
                name="Name"
                initialValue={curRoutine.name}
                onValueChange={name => setCurRoutine({ ...curRoutine, name })}
            />
            <FlatList
                data={ curRoutine.workouts}
                ItemSeparatorComponent={ Separator }
                keyExtractor={ (_, index) => index.toString() }
                contentContainerStyle={ styles.listContainer }
                renderItem={({ item, index }) => (
                    <View style={[ styles.workoutRow, { backgroundColor: colors.backgroundSecondary } ]}>
                        <Pressable style={ styles.selectRegion } onPress={() => setDayToSet(index)}>
                            <ThemeText style={ styles.entryText }>
                                <Text style={{ fontWeight: 'bold' }}>{ weekDays[index] }: </Text>
                                { item?.name ?? 'Rest Day' }
                            </ThemeText>
                        </Pressable>
                        <Pressable onPress={() => setCurRoutine({
                            ...curRoutine,
                            workouts: curRoutine.workouts.map((w, i) => i === index ? null : w)
                        })}>
                            <SymbolView
                                name='xmark.circle.fill'
                                size={ 24 }
                                tintColor={ (item ? colors.red : colors.gray) as string } />
                        </Pressable>
                    </View>
                )} />
            <WorkoutSelectModal
                visible={ dayToSet !== null }
                onSelect={ workout => setCurRoutine({
                    ...curRoutine,
                    workouts: curRoutine.workouts.map((w, i) => i === dayToSet ? workout : w)
                })}
                onClose={() => setDayToSet(null)}
            />
        </EditModal>
    );
};

const styles = StyleSheet.create({
    workoutRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 15
    },

    listContainer: {
        borderRadius: 10,
        overflow: 'hidden'
    },

    selectRegion: {
        flex: 1
    },

    entryText: {
        fontSize: 20
    }
});

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface RoutineData {
    name: string,
    workouts: (DataItem | null)[]
}
