import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIncomingEntity } from '@/lib/hooks/useIncomingEntity';
import { Workout } from '@/lib/data/Workout';
import { Exercise } from '@/lib/data/Exercise';
import Text from '@/lib/components/theme/Text';
import TextButton from '@/lib/components/controls/TextButton';
import { ThemeColors, useResolvedStyles, useThemeColors } from '@/lib/hooks/useThemeColors';
import { ChevronLeft, Check, X } from 'lucide-react-native';
import Separator from '@/lib/components/lists/elements/Separator';

export default function IncomingWorkoutScreen() {
    const { incomingEntity, clearIncomingEntity } = useIncomingEntity();
    const db = useSQLiteContext();
    const resolvedStyles = useResolvedStyles(styles);
    const [saving, setSaving] = useState(false);

    // Redirect if no incoming entity or wrong type
    useEffect(() => {
        if (!incomingEntity || incomingEntity.type !== 'workout') {
            router.replace('/');
        }
    }, [incomingEntity]);

    if (!incomingEntity || incomingEntity.type !== 'workout') {
        return null;
    }

    const { workout, exercises } = incomingEntity.data;

    const handleAccept = async () => {
        try {
            setSaving(true);
            
            // Save all exercises first
            await Exercise.saveMany(db, exercises.map(e => new Exercise(e)), false, true);

            // Create new Workout instance with the exercise IDs
            const newWorkout = new Workout(workout.id, workout.name, exercises.map(e => e.id));
            await newWorkout.save(db);
            
            // Clear the incoming entity and navigate back
            clearIncomingEntity();
            router.replace('/');
            
            Alert.alert('Success', 'Workout imported successfully!');
        } catch (error) {
            console.error('Error saving workout:', error);
            Alert.alert('Error', 'Failed to import workout. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleReject = () => {
        Alert.alert(
            'Reject Workout',
            'Are you sure you want to reject this workout?',
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

    return (
        <View style={resolvedStyles.container}>
            <SafeAreaView edges={['top']} style={resolvedStyles.header}>
                <TextButton 
                    label="Back" 
                    style={resolvedStyles.back} 
                    Icon={ChevronLeft} 
                    onPress={() => router.back()} 
                />
                <Text style={resolvedStyles.headerTitle}>Incoming Workout</Text>
                <View style={resolvedStyles.headerSpacer} />
            </SafeAreaView>

            <ScrollView style={resolvedStyles.content} contentContainerStyle={resolvedStyles.contentContainer}>
                <View style={resolvedStyles.section}>
                    <Text style={resolvedStyles.sectionTitle}>Workout Details</Text>
                    
                    <View style={resolvedStyles.detailRow}>
                        <Text style={resolvedStyles.label}>Name:</Text>
                        <Text style={resolvedStyles.value}>{workout.name}</Text>
                    </View>

                    <View style={resolvedStyles.detailRow}>
                        <Text style={resolvedStyles.label}>Exercises:</Text>
                        <Text style={resolvedStyles.value}>{exercises.length} exercise(s)</Text>
                    </View>
                </View>

                {exercises.length > 0 && (
                    <View style={resolvedStyles.section}>
                        <Text style={resolvedStyles.sectionTitle}>Exercises</Text>
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
                                            <Text style={resolvedStyles.exerciseName}>{exercise.name}</Text>
                                            
                                            {exercise.notes && (
                                                <View style={resolvedStyles.exerciseDetail}>
                                                    <Text style={resolvedStyles.exerciseLabel}>Notes:</Text>
                                                    <Text style={resolvedStyles.exerciseValue}>{exercise.notes}</Text>
                                                </View>
                                            )}

                                            {categories.length > 0 && (
                                                <View style={resolvedStyles.exerciseDetail}>
                                                    <Text style={resolvedStyles.exerciseLabel}>Categories:</Text>
                                                    <Text style={resolvedStyles.exerciseValue}>{categories.join(', ')}</Text>
                                                </View>
                                            )}

                                            {sets.length > 0 && (
                                                <View style={resolvedStyles.exerciseDetail}>
                                                    <Text style={resolvedStyles.exerciseLabel}>Sets:</Text>
                                                    <View style={resolvedStyles.setsDisplay}>
                                                        {sets.map((set, setIndex) => (
                                                            <Text key={setIndex} style={resolvedStyles.setInfo}>
                                                                {set.reps} reps × {set.weight} lbs
                                                            </Text>
                                                        ))}
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
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.primary,
    },
    exerciseDetail: {
        gap: 5,
    },
    exerciseLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.secondary,
    },
    exerciseValue: {
        fontSize: 16,
        color: colors.primary,
    },
    setsDisplay: {
        gap: 3,
        marginLeft: 10,
    },
    setInfo: {
        fontSize: 16,
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
