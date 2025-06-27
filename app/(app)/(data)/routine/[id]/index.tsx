import { useLocalSearchParams, router } from 'expo-router';
import { useState, useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { XCircle } from 'lucide-react-native';
import { Routine } from '@/lib/data/Routine';
import EntityDetailScreen from '@/lib/components/screens/EntityDetailScreen';
import LabeledTextField from '@/lib/components/controls/LabeledTextField';
import { ThemeColors, useResolvedStyles, useThemeColors } from '@/lib/hooks/useThemeColors';
import { FlatList } from 'react-native-gesture-handler';
import { DataItem } from '@/lib/components/lists/SearchableList';
import Separator from '@/lib/components/layout/Separator';
import ThemeText from '@/lib/components/theme/ThemeText';
import DatabaseSelectModal from '@/lib/components/modals/DatabaseSelectModal';

export default function RoutineScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const db = useSQLiteContext();
    const colors = useThemeColors();
    const resolvedStyles = useResolvedStyles(styles);
    const [routine, setRoutine] = useState<Routine | null>(null);
    const [currentState, setCurrentState] = useState({
        name: '',
        workouts: new Array(7).fill(null) as (DataItem | null)[]
    });
    const [dayToSet, setDayToSet] = useState<number | null>(null);

    // Load routine if id is provided
    useEffect(() => {
        async function loadRoutine() {
            if (id === 'new') return;
            
            try {
                const loadedRoutine = await Routine.pullOne(id, db);
                if (loadedRoutine) {
                    setRoutine(loadedRoutine);
                    setCurrentState({
                        name: loadedRoutine.name,
                        workouts: loadedRoutine.workouts.map(workout =>
                            workout !== null ? { id: workout.id, name: workout.name } : null
                        )
                    });
                }
            } catch (error) {
                console.error('Failed to load routine:', error);
                router.back();
            }
        }
        
        loadRoutine();
    }, [id, db]);

    async function handleSave() {
        try {
            const workoutIds = currentState.workouts.map(workout => workout?.id ?? null);

            if (routine) {
                // Update existing routine
                const updatedRoutine = new Routine(
                    routine.id,
                    currentState.name,
                    workoutIds
                );
                await updatedRoutine.save(db);
            } else {
                // Create new routine
                await Routine.create(
                    currentState.name,
                    workoutIds,
                    db
                );
            }
            router.back();
        } catch (error) {
            console.error('Failed to save routine:', error);
        }
    }

    async function handleDelete() {
        if (routine) {
            try {
                await routine.delete(db);
                router.back();
            } catch (error) {
                console.error('Failed to delete routine:', error);
            }
        }
    }

    return (
        <EntityDetailScreen
            title='Routine'
            isNewEntity={id === 'new'}
            onSave={handleSave}
            onDelete={handleDelete}
            entityId={id === 'new' ? undefined : id}
        >
            <LabeledTextField
                name="Name"
                initialValue={currentState.name}
                onValueChange={name => setCurrentState({ ...currentState, name })}
            />
            <FlatList
                data={currentState.workouts}
                ItemSeparatorComponent={Separator}
                keyExtractor={(_, index) => index.toString()}
                contentContainerStyle={resolvedStyles.listContainer}
                scrollEnabled={false}
                renderItem={({ item, index }) => (
                    <View style={resolvedStyles.workoutRow}>
                        <Pressable style={resolvedStyles.selectRegion} onPress={() => setDayToSet(index)}>
                            <ThemeText style={resolvedStyles.entryText}>
                                <Text style={{ fontWeight: 'bold' }}>{weekDays[index]}: </Text>
                                {item?.name ?? 'Rest Day'}
                            </ThemeText>
                        </Pressable>
                        <Pressable onPress={() => setCurrentState({
                            ...currentState,
                            workouts: currentState.workouts.map((w, i) => i === index ? null : w)
                        })}>
                            <XCircle
                                size={24}
                                color={(item ? colors.red : colors.gray) as string} />
                        </Pressable>
                    </View>
                )} 
            />

            <DatabaseSelectModal
                visible={dayToSet !== null}
                dbName='workouts'
                title='Select Workout'
                onSelect={workout => setCurrentState({
                    ...currentState,
                    workouts: currentState.workouts.map((w, i) => i === dayToSet ? workout : w)
                })}
                onClose={() => setDayToSet(null)}
            />
        </EntityDetailScreen>
    );
}

const styles = (colors: ThemeColors) => StyleSheet.create({
    listContainer: {
        borderRadius: 10,
        overflow: 'hidden'
    },
    workoutRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 15,
        backgroundColor: colors.backgroundSecondary
    },
    selectRegion: {
        flex: 1
    },
    entryText: {
        fontSize: 20
    }
});

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];