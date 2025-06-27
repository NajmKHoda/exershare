import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIncomingEntity } from '@/lib/hooks/useIncomingEntity';
import { Exercise } from '@/lib/data/Exercise';
import ThemeText from '@/lib/components/theme/ThemeText';
import TextButton from '@/lib/components/controls/TextButton';
import { ThemeColors, useResolvedStyles, useThemeColors } from '@/lib/hooks/useThemeColors';
import { ChevronLeft, Check, X } from 'lucide-react-native';

export default function IncomingExerciseScreen() {
    const { incomingEntity, clearIncomingEntity } = useIncomingEntity();
    const db = useSQLiteContext();
    const resolvedStyles = useResolvedStyles(styles);
    const [saving, setSaving] = useState(false);

    // Redirect if no incoming entity or wrong type
    useEffect(() => {
        if (!incomingEntity || incomingEntity.type !== 'exercise') {
            router.replace('/');
        }
    }, [incomingEntity]);

    if (!incomingEntity || incomingEntity.type !== 'exercise') {
        return null;
    }

    const exerciseData = incomingEntity.data.exercise;

    const handleAccept = async () => {
        try {
            setSaving(true);
            
            // Create new Exercise instance from the raw data
            const newExercise = new Exercise(exerciseData);
            await newExercise.save(db);
            
            // Clear the incoming entity and navigate back
            clearIncomingEntity();
            router.replace('/');
            
            Alert.alert('Success', 'Exercise imported successfully!');
        } catch (error) {
            console.error('Error saving exercise:', error);
            Alert.alert('Error', 'Failed to import exercise. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleReject = () => {
        Alert.alert(
            'Reject Exercise',
            'Are you sure you want to reject this exercise?',
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

    // Parse sets from the raw data
    const sets = exerciseData.sets?.split(';').map(setString => {
        const [reps, weight] = setString.split(':');
        return { reps: Number(reps), weight: Number(weight) };
    }) || [];

    // Parse categories
    const categories = exerciseData.categories ? exerciseData.categories.split(',') : [];

    return (
        <View style={resolvedStyles.container}>
            <SafeAreaView edges={['top']} style={resolvedStyles.header}>
                <TextButton 
                    label="Back" 
                    style={resolvedStyles.back} 
                    Icon={ChevronLeft} 
                    onPress={() => router.back()} 
                />
                <ThemeText style={resolvedStyles.headerTitle}>Incoming Exercise</ThemeText>
                <View style={resolvedStyles.headerSpacer} />
            </SafeAreaView>

            <ScrollView style={resolvedStyles.content} contentContainerStyle={resolvedStyles.contentContainer}>
                <View style={resolvedStyles.section}>
                    <ThemeText style={resolvedStyles.sectionTitle}>Exercise Details</ThemeText>
                    
                    <View style={resolvedStyles.detailRow}>
                        <ThemeText style={resolvedStyles.label}>Name:</ThemeText>
                        <ThemeText style={resolvedStyles.value}>{exerciseData.name}</ThemeText>
                    </View>

                    {exerciseData.notes && (
                        <View style={resolvedStyles.detailRow}>
                            <ThemeText style={resolvedStyles.label}>Notes:</ThemeText>
                            <ThemeText style={resolvedStyles.value}>{exerciseData.notes}</ThemeText>
                        </View>
                    )}

                    {categories.length > 0 && (
                        <View style={resolvedStyles.detailRow}>
                            <ThemeText style={resolvedStyles.label}>Categories:</ThemeText>
                            <ThemeText style={resolvedStyles.value}>{categories.join(', ')}</ThemeText>
                        </View>
                    )}
                </View>

                {sets.length > 0 && (
                    <View style={resolvedStyles.section}>
                        <ThemeText style={resolvedStyles.sectionTitle}>Sets</ThemeText>
                        <View style={resolvedStyles.setsContainer}>
                            <View style={resolvedStyles.setsHeader}>
                                <ThemeText style={resolvedStyles.setsHeaderText}>Reps</ThemeText>
                                <ThemeText style={resolvedStyles.setsHeaderText}>Weight (lbs)</ThemeText>
                            </View>
                            {sets.map((set, index) => (
                                <View key={index} style={resolvedStyles.setRow}>
                                    <ThemeText style={resolvedStyles.setValue}>{set.reps}</ThemeText>
                                    <ThemeText style={resolvedStyles.setValue}>{set.weight}</ThemeText>
                                </View>
                            ))}
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
    setsContainer: {
        borderRadius: 10,
        overflow: 'hidden',
        backgroundColor: colors.backgroundSecondary,
    },
    setsHeader: {
        flexDirection: 'row',
        padding: 15,
        backgroundColor: colors.accent,
    },
    setsHeaderText: {
        flex: 1,
        textAlign: 'center',
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
    },
    setRow: {
        flexDirection: 'row',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: colors.separator,
    },
    setValue: {
        flex: 1,
        textAlign: 'center',
        fontSize: 18,
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
