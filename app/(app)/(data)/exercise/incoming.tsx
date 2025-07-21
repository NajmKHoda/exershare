import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIncomingEntity } from '@/lib/hooks/useIncomingEntity';
import Text from '@/lib/components/theme/Text';
import TextButton from '@/lib/components/controls/TextButton';
import { ThemeColors, useResolvedStyles } from '@/lib/hooks/useThemeColors';
import { ChevronLeft, Check, X } from 'lucide-react-native';
import { IntensityType } from '@/lib/data/Exercise';

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

    const { exercise } = incomingEntity.data;

    const handleAccept = async () => {
        try {
            setSaving(true);
            
            // Create new Exercise instance from the raw data
            await exercise.save(db);
            
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

    // Format volume type and intensity types for display
    const formatType = (type: string): string => {
        return type.charAt(0).toUpperCase() + type.slice(1);
    };

    // Parse categories
    const categories = exercise.categories || [];

    return (
        <View style={resolvedStyles.container}>
            <SafeAreaView edges={['top']} style={resolvedStyles.header}>
                <TextButton 
                    label="Back" 
                    style={resolvedStyles.back} 
                    Icon={ChevronLeft} 
                    onPress={() => router.back()} 
                />
                <Text style={resolvedStyles.headerTitle}>Incoming Exercise</Text>
                <View style={resolvedStyles.headerSpacer} />
            </SafeAreaView>

            <ScrollView style={resolvedStyles.content} contentContainerStyle={resolvedStyles.contentContainer}>
                <View style={resolvedStyles.section}>
                    <Text style={resolvedStyles.sectionTitle}>Exercise Details</Text>
                    
                    <View style={resolvedStyles.detailRow}>
                        <Text style={resolvedStyles.label}>Name:</Text>
                        <Text style={resolvedStyles.value}>{exercise.name}</Text>
                    </View>

                    <View style={resolvedStyles.detailRow}>
                        <Text style={resolvedStyles.label}>Volume Type:</Text>
                        <Text style={resolvedStyles.value}>{formatType(exercise.volumeType)}</Text>
                    </View>

                    {exercise.intensityTypes.length > 0 && (
                        <View style={resolvedStyles.detailRow}>
                            <Text style={resolvedStyles.label}>Intensity Types:</Text>
                            <Text style={resolvedStyles.value}>
                                {exercise.intensityTypes.map(formatType).join(', ')}
                            </Text>
                        </View>
                    )}

                    {exercise.notes && (
                        <View style={resolvedStyles.detailRow}>
                            <Text style={resolvedStyles.label}>Notes:</Text>
                            <Text style={resolvedStyles.value}>{exercise.notes}</Text>
                        </View>
                    )}

                    {categories.length > 0 && (
                        <View style={resolvedStyles.detailRow}>
                            <Text style={resolvedStyles.label}>Categories:</Text>
                            <Text style={resolvedStyles.value}>{categories.join(', ')}</Text>
                        </View>
                    )}
                </View>

                {exercise.sets.length > 0 && (
                    <View style={resolvedStyles.section}>
                        <Text style={resolvedStyles.sectionTitle}>Sets</Text>
                        <View style={resolvedStyles.setsContainer}>
                            <View style={resolvedStyles.setsHeader}>
                                <Text style={resolvedStyles.setsHeaderText}>
                                    {formatType(exercise.volumeType)}
                                </Text>
                                {exercise.intensityTypes.map((type: IntensityType) => (
                                    <Text key={type} style={resolvedStyles.setsHeaderText}>
                                        {formatType(type)}
                                    </Text>
                                ))}
                            </View>
                            {exercise.sets.map((set, index) => (
                                <View key={index} style={resolvedStyles.setRow}>
                                    <Text style={resolvedStyles.setValue}>{set.volume}</Text>
                                    {exercise.intensityTypes.map((type: IntensityType) => (
                                        <Text key={type} style={resolvedStyles.setValue}>
                                            {set[type] !== undefined ? set[type] : '-'}
                                        </Text>
                                    ))}
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
