import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIncomingEntity } from '@/lib/hooks/useIncomingEntity';
import { Workout } from '@/lib/data/Workout';
import { Exercise, Set } from '@/lib/data/Exercise';
import Text from '@/lib/components/theme/Text';
import TextButton from '@/lib/components/controls/TextButton';
import { ThemeColors, useResolvedStyles } from '@/lib/hooks/useThemeColors';
import { ChevronLeft, Check, X } from 'lucide-react-native';
import Separator from '@/lib/components/lists/elements/Separator';
import { formatValue } from '@/lib/utils/units';
import { useUserPreferences } from '@/lib/hooks/useUserPreferences';

const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function IncomingRoutineScreen() {
    const { incomingEntity, clearIncomingEntity } = useIncomingEntity();
    const db = useSQLiteContext();
    const resolvedStyles = useResolvedStyles(styles);
    const [saving, setSaving] = useState(false);
    const { units } = useUserPreferences();

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
            
            await Exercise.saveMany(db, exercises);
            await Workout.saveMany(db, workouts);
            await routine.save(db);
            
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
                <Text style={resolvedStyles.headerTitle}>Incoming Routine</Text>
                <View style={resolvedStyles.headerSpacer} />
            </SafeAreaView>

            <ScrollView style={resolvedStyles.content} contentContainerStyle={resolvedStyles.contentContainer}>
                <View style={resolvedStyles.section}>
                    <Text style={resolvedStyles.sectionTitle}>Routine Details</Text>
                    
                    <View style={resolvedStyles.detailRow}>
                        <Text style={resolvedStyles.label}>Name:</Text>
                        <Text style={resolvedStyles.value}>{routine.name}</Text>
                    </View>

                    <View style={resolvedStyles.detailRow}>
                        <Text style={resolvedStyles.label}>Workouts:</Text>
                        <Text style={resolvedStyles.value}>{workouts.length} workout(s)</Text>
                    </View>

                    <View style={resolvedStyles.detailRow}>
                        <Text style={resolvedStyles.label}>Exercises:</Text>
                        <Text style={resolvedStyles.value}>{exercises.length} exercise(s)</Text>
                    </View>
                </View>

                <View style={resolvedStyles.section}>
                    <Text style={resolvedStyles.sectionTitle}>Weekly Schedule</Text>
                    <View style={resolvedStyles.scheduleContainer}>
                        {routine.workoutIds.map((workoutId, dayIndex) => {
                            const workout = workoutId ? workoutMap.get(workoutId) : null;
                            return (
                                <View key={dayIndex}>
                                    <View style={resolvedStyles.dayItem}>
                                        <Text style={resolvedStyles.dayName}>{weekDays[dayIndex]}:</Text>
                                        <Text style={resolvedStyles.dayWorkout}>
                                            {workout ? workout.name : 'Rest Day'}
                                        </Text>
                                    </View>
                                    {dayIndex < 6 && <Separator />}
                                </View>
                            );
                        })}
                    </View>
                </View>

                {workouts.length > 0 && (
                    <View style={resolvedStyles.section}>
                        <Text style={resolvedStyles.sectionTitle}>Workouts</Text>
                        <View style={resolvedStyles.workoutsContainer}>
                            {workouts.map((workout, index) => (
                                <View key={workout.id + index.toString()}>
                                    <View style={resolvedStyles.workoutItem}>
                                        <Text style={resolvedStyles.workoutName}>{workout.name}</Text>
                                        
                                        <View style={resolvedStyles.workoutDetail}>
                                            <Text style={resolvedStyles.workoutLabel}>Exercises:</Text>
                                            <View style={resolvedStyles.exercisesList}>
                                                {workout.exerciseIds.map((exerciseId, exerciseIndex) => {
                                                    const exercise = exerciseMap.get(exerciseId);
                                                    return exercise ? (
                                                        <Text key={exerciseId + exerciseIndex.toString()} style={resolvedStyles.exerciseListItem}>
                                                            {exerciseIndex + 1}. {exercise.name}
                                                        </Text>
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
                        <Text style={resolvedStyles.sectionTitle}>Exercises</Text>
                        <View style={resolvedStyles.exercisesContainer}>
                            {exercises.map((exercise, index) => {     
                                const { sets, categories, volumeType, intensityTypes } = exercise;

                                return (
                                    <View key={exercise.id + index.toString()}>
                                        <View style={resolvedStyles.exerciseItem}>
                                            <Text style={resolvedStyles.exerciseName}>{exercise.name}</Text>
                                            
                                            {(volumeType || intensityTypes.length > 0) && (
                                                <View style={resolvedStyles.exerciseDetail}>
                                                    <Text style={resolvedStyles.exerciseLabel}>Type:</Text>
                                                    <Text style={resolvedStyles.exerciseValue}>
                                                        {volumeType && `Volume: ${volumeType}`}
                                                        {volumeType && intensityTypes.length > 0 && ', '}
                                                        {intensityTypes.length > 0 && `Intensity: ${intensityTypes.join(', ')}`}
                                                    </Text>
                                                </View>
                                            )}

                                            {exercise.notes && (
                                                <View style={resolvedStyles.exerciseDetail}>
                                                    <Text style={resolvedStyles.exerciseLabel}>Notes:</Text>
                                                    <Text style={resolvedStyles.exerciseValue}>{exercise.notes}</Text>
                                                </View>
                                            )}

                                            {categories.length > 0 && (
                                                <View style={resolvedStyles.exerciseDetail}>
                                                    <Text style={resolvedStyles.exerciseLabel}>Categories:</Text>
                                                    <Text style={resolvedStyles.exerciseValue}>{exercise.categories.join(', ')}</Text>
                                                </View>
                                            )}

                                            {sets.length > 0 && (
                                                <View style={resolvedStyles.exerciseDetail}>
                                                    <Text style={resolvedStyles.exerciseLabel}>Sets:</Text>
                                                    <View style={resolvedStyles.setsDisplay}>
                                                        {sets.slice(0, 3).map((set, setIndex) => (
                                                            <Text key={setIndex} style={resolvedStyles.setInfo}>
                                                                {formatValue(set.volume, volumeType, units)}
                                                                {intensityTypes.map(type => 
                                                                    ` × ${formatValue(set[type]!, type, units)}`
                                                                ).join('')}
                                                            </Text>
                                                        ))}
                                                        {sets.length > 3 && (
                                                            <Text style={resolvedStyles.setInfo}>
                                                                ... and {sets.length - 3} more
                                                            </Text>
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
