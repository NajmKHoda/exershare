import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIncomingEntity } from '@/lib/hooks/useIncomingEntity';
import { Routine } from '@/lib/data/Routine';
import { Workout } from '@/lib/data/Workout';
import { Exercise } from '@/lib/data/Exercise';
import ThemeText from '@/lib/components/theme/ThemeText';
import TextButton from '@/lib/components/controls/TextButton';
import { ThemeColors, useResolvedStyles, useThemeColors } from '@/lib/hooks/useThemeColors';
import { ChevronLeft, Check, X } from 'lucide-react-native';
import Separator from '@/lib/components/layout/Separator';

const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function IncomingRoutineScreen() {
    const { incomingEntity, clearIncomingEntity } = useIncomingEntity();
    const db = useSQLiteContext();
    const resolvedStyles = useResolvedStyles(styles);
    const [saving, setSaving] = useState(false);

    // Redirect if no incoming entity or wrong type
    useEffect(() => {
        if (!incomingEntity || incomingEntity.type !== 'routine') {
            router.replace('/');
        }
    }, [incomingEntity]);

    if (!incomingEntity || incomingEntity.type !== 'routine') {
        return null;
    }

    const { routine, workouts, exercises } = incomingEntity.data;

    const handleAccept = async () => {
        try {
            setSaving(true);
            
            // Save all exercises first
            for (const exerciseData of exercises) {
                const newExercise = new Exercise(exerciseData);
                await newExercise.save(db);
            }
            
            // Save all workouts with updated exercise IDs
            for (const workoutData of workouts) {
                const newWorkout = new Workout(workoutData.id, workoutData.name, workoutData.exercise_ids);
                await newWorkout.save(db);
            }

            const newRoutine = new Routine(routine.id, routine.name, routine.workout_ids);
            await newRoutine.save(db);
            
            // Clear the incoming entity and navigate back
            clearIncomingEntity();
            router.replace('/');
            
            Alert.alert('Success', 'Routine imported successfully!');
        } catch (error) {
            console.error('Error saving routine:', error);
            Alert.alert('Error', 'Failed to import routine. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleReject = () => {
        Alert.alert(
            'Reject Routine',
            'Are you sure you want to reject this routine?',
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Reject', 
                    style: 'destructive',
                    onPress: () => {
                        clearIncomingEntity();
                        router.replace('/');
                    }
                }
            ]
        );
    };

    // Create a map for quick workout lookup
    const workoutMap = new Map(workouts.map(w => [w.id, w]));
    
    // Create a map for quick exercise lookup
    const exerciseMap = new Map(exercises.map(e => [e.id, e]));

    return (
        <View style={resolvedStyles.container}>
            <SafeAreaView edges={['top']} style={resolvedStyles.header}>
                <TextButton 
                    label="Back" 
                    style={resolvedStyles.back} 
                    Icon={ChevronLeft} 
                    onPress={() => router.back()} 
                />
                <ThemeText style={resolvedStyles.headerTitle}>Incoming Routine</ThemeText>
                <View style={resolvedStyles.headerSpacer} />
            </SafeAreaView>

            <ScrollView style={resolvedStyles.content} contentContainerStyle={resolvedStyles.contentContainer}>
                <View style={resolvedStyles.section}>
                    <ThemeText style={resolvedStyles.sectionTitle}>Routine Details</ThemeText>
                    
                    <View style={resolvedStyles.detailRow}>
                        <ThemeText style={resolvedStyles.label}>Name:</ThemeText>
                        <ThemeText style={resolvedStyles.value}>{routine.name}</ThemeText>
                    </View>

                    <View style={resolvedStyles.detailRow}>
                        <ThemeText style={resolvedStyles.label}>Workouts:</ThemeText>
                        <ThemeText style={resolvedStyles.value}>{workouts.length} workout(s)</ThemeText>
                    </View>

                    <View style={resolvedStyles.detailRow}>
                        <ThemeText style={resolvedStyles.label}>Exercises:</ThemeText>
                        <ThemeText style={resolvedStyles.value}>{exercises.length} exercise(s)</ThemeText>
                    </View>
                </View>

                <View style={resolvedStyles.section}>
                    <ThemeText style={resolvedStyles.sectionTitle}>Weekly Schedule</ThemeText>
                    <View style={resolvedStyles.scheduleContainer}>
                        {routine.workout_ids.map((workoutId, dayIndex) => {
                            const workout = workoutId ? workoutMap.get(workoutId) : null;
                            return (
                                <View key={dayIndex}>
                                    <View style={resolvedStyles.dayItem}>
                                        <ThemeText style={resolvedStyles.dayName}>{weekDays[dayIndex]}:</ThemeText>
                                        <ThemeText style={resolvedStyles.dayWorkout}>
                                            {workout ? workout.name : 'Rest Day'}
                                        </ThemeText>
                                    </View>
                                    {dayIndex < 6 && <Separator />}
                                </View>
                            );
                        })}
                    </View>
                </View>

                {workouts.length > 0 && (
                    <View style={resolvedStyles.section}>
                        <ThemeText style={resolvedStyles.sectionTitle}>Workouts</ThemeText>
                        <View style={resolvedStyles.workoutsContainer}>
                            {workouts.map((workout, index) => (
                                <View key={workout.id + index.toString()}>
                                    <View style={resolvedStyles.workoutItem}>
                                        <ThemeText style={resolvedStyles.workoutName}>{workout.name}</ThemeText>
                                        
                                        <View style={resolvedStyles.workoutDetail}>
                                            <ThemeText style={resolvedStyles.workoutLabel}>Exercises:</ThemeText>
                                            <View style={resolvedStyles.exercisesList}>
                                                {workout.exercise_ids.map((exerciseId, exerciseIndex) => {
                                                    const exercise = exerciseMap.get(exerciseId);
                                                    return exercise ? (
                                                        <ThemeText key={exerciseId + exerciseIndex.toString()} style={resolvedStyles.exerciseListItem}>
                                                            {exerciseIndex + 1}. {exercise.name}
                                                        </ThemeText>
                                                    ) : null;
                                                })}
                                            </View>
                                        </View>
                                    </View>
                                    {index < workouts.length - 1 && <Separator />}
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {exercises.length > 0 && (
                    <View style={resolvedStyles.section}>
                        <ThemeText style={resolvedStyles.sectionTitle}>Exercises</ThemeText>
                        <View style={resolvedStyles.exercisesContainer}>
                            {exercises.map((exercise, index) => {
                                // Parse sets from the raw data
                                const sets = exercise.sets?.split(';').map(setString => {
                                    const [reps, weight] = setString.split(':');
                                    return { reps: Number(reps), weight: Number(weight) };
                                }) || [];

                                // Parse categories
                                const categories = exercise.categories ? exercise.categories.split(',') : [];

                                return (
                                    <View key={exercise.id + index.toString()}>
                                        <View style={resolvedStyles.exerciseItem}>
                                            <ThemeText style={resolvedStyles.exerciseName}>{exercise.name}</ThemeText>
                                            
                                            {exercise.notes && (
                                                <View style={resolvedStyles.exerciseDetail}>
                                                    <ThemeText style={resolvedStyles.exerciseLabel}>Notes:</ThemeText>
                                                    <ThemeText style={resolvedStyles.exerciseValue}>{exercise.notes}</ThemeText>
                                                </View>
                                            )}

                                            {categories.length > 0 && (
                                                <View style={resolvedStyles.exerciseDetail}>
                                                    <ThemeText style={resolvedStyles.exerciseLabel}>Categories:</ThemeText>
                                                    <ThemeText style={resolvedStyles.exerciseValue}>{categories.join(', ')}</ThemeText>
                                                </View>
                                            )}

                                            {sets.length > 0 && (
                                                <View style={resolvedStyles.exerciseDetail}>
                                                    <ThemeText style={resolvedStyles.exerciseLabel}>Sets:</ThemeText>
                                                    <View style={resolvedStyles.setsDisplay}>
                                                        {sets.slice(0, 3).map((set, setIndex) => (
                                                            <ThemeText key={setIndex} style={resolvedStyles.setInfo}>
                                                                {set.reps} reps × {set.weight} lbs
                                                            </ThemeText>
                                                        ))}
                                                        {sets.length > 3 && (
                                                            <ThemeText style={resolvedStyles.setInfo}>
                                                                ... and {sets.length - 3} more
                                                            </ThemeText>
                                                        )}
                                                    </View>
                                                </View>
                                            )}
                                        </View>
                                        {index < exercises.length - 1 && <Separator />}
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                )}
            </ScrollView>

            <SafeAreaView edges={['bottom']} style={resolvedStyles.footer}>
                <TextButton 
                    label="Reject" 
                    style={resolvedStyles.rejectButton} 
                    Icon={X} 
                    onPress={handleReject} 
                />
                <TextButton 
                    label={saving ? "Saving..." : "Accept"} 
                    style={resolvedStyles.acceptButton} 
                    Icon={Check} 
                    onPress={handleAccept}
                />
            </SafeAreaView>
        </View>
    );
}

const styles = (colors: ThemeColors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 5,
        paddingBottom: 10,
        backgroundColor: colors.backgroundSecondary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    back: {
        fontSize: 20,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    headerSpacer: {
        width: 60,
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: 20,
        gap: 20,
    },
    section: {
        gap: 15,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: colors.accent,
    },
    detailRow: {
        gap: 5,
    },
    label: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.secondary,
    },
    value: {
        fontSize: 18,
        color: colors.primary,
    },
    scheduleContainer: {
        borderRadius: 10,
        overflow: 'hidden',
        backgroundColor: colors.backgroundSecondary,
    },
    dayItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
    },
    dayName: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.primary,
    },
    dayWorkout: {
        fontSize: 18,
        color: colors.secondary,
    },
    workoutsContainer: {
        borderRadius: 10,
        overflow: 'hidden',
        backgroundColor: colors.backgroundSecondary,
    },
    workoutItem: {
        padding: 15,
        gap: 10,
    },
    workoutName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.primary,
    },
    workoutDetail: {
        gap: 5,
    },
    workoutLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.secondary,
    },
    exercisesList: {
        gap: 3,
        marginLeft: 10,
    },
    exerciseListItem: {
        fontSize: 16,
        color: colors.primary,
    },
    exercisesContainer: {
        borderRadius: 10,
        overflow: 'hidden',
        backgroundColor: colors.backgroundSecondary,
    },
    exerciseItem: {
        padding: 15,
        gap: 10,
    },
    exerciseName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.primary,
    },
    exerciseDetail: {
        gap: 5,
    },
    exerciseLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.secondary,
    },
    exerciseValue: {
        fontSize: 14,
        color: colors.primary,
    },
    setsDisplay: {
        gap: 2,
        marginLeft: 10,
    },
    setInfo: {
        fontSize: 14,
        color: colors.primary,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 20,
        backgroundColor: colors.backgroundSecondary,
        gap: 20,
    },
    rejectButton: {
        fontSize: 20,
        color: colors.red,
    },
    acceptButton: {
        fontSize: 20,
        color: colors.green,
    },
});
