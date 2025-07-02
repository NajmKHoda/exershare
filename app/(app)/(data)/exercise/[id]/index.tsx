import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { Exercise, IntensityType, Set, TYPE_DEFAULTS, VolumeType } from '@/lib/data/Exercise';
import EntityDetailScreen from '@/lib/components/screens/EntityDetailScreen';
import LabeledTextField from '@/lib/components/controls/LabeledTextField';
import SetList from '@/lib/components/lists/SetList';
import { View, StyleSheet, Pressable } from 'react-native';
import Text from '@/lib/components/theme/Text';
import { ThemeColors, useResolvedStyles } from '@/lib/hooks/useThemeColors';
import VolumeTypeModal from '@/lib/components/modals/VolumeTypeModal';
import IntensityTypeModal from '@/lib/components/modals/IntensityTypeModal';

export default function ExerciseScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const db = useSQLiteContext();
    const router = useRouter();
    const resolvedStyles = useResolvedStyles(styles);
    const [exercise, setExercise] = useState<Exercise | null>(null);
    const [volumeTypeModalVisible, setVolumeTypeModalVisible] = useState(false);
    const [intensityTypeModalVisible, setIntensityTypeModalVisible] = useState(false);
    const [currentState, setCurrentState] = useState({
        name: '',
        volumeType: 'reps' as VolumeType,
        intensityTypes: ['weight'] as IntensityType[],
        sets: [
            { volume: 12, weight: 25 },
            { volume: 12, weight: 25 },
            { volume: 12, weight: 25 }
        ] as Set[],
        notes: '',
        categories: [] as string[]
    });

    // Load exercise if id is provided
    useEffect(() => {
        async function loadExercise() {
            if (id === 'new') return;
            
            try {
                const loadedExercise = await Exercise.pullOne(id, db);
                if (loadedExercise) {
                    setExercise(loadedExercise);
                    setCurrentState({
                        name: loadedExercise.name,
                        volumeType: loadedExercise.volumeType || 'reps',
                        intensityTypes: loadedExercise.intensityTypes || ['weight'],
                        sets: loadedExercise.sets,
                        notes: loadedExercise.notes,
                        categories: loadedExercise.categories
                    });
                }
            } catch (error) {
                console.error('Failed to load exercise:', error);
                router.back();
            }
        }
        
        loadExercise();
    }, [id, db]);

    function handleVolumeTypeChange(newVolumeType: VolumeType) {
        const refreshedSets = currentState.sets.map(set => ({
            ...set,
            volume: TYPE_DEFAULTS[newVolumeType]
        }));

        setCurrentState({
            ...currentState,
            volumeType: newVolumeType,
            sets: refreshedSets
        });
    }

    function handleIntensityTypeChange(newIntensityTypes: IntensityType[]) {
        const refreshedSets = currentState.sets.map(set => {
            const newSet: Set = { volume: set.volume };
            newIntensityTypes.forEach((type) => {
                if (type in set) {
                    newSet[type] = set[type]
                } else {
                    newSet[type] = TYPE_DEFAULTS[type];
                }
            });
            return newSet;
        });

        setCurrentState({
            ...currentState,
            intensityTypes: newIntensityTypes,
            sets: refreshedSets
        });
    }

    async function handleSave() {
        try {
            if (exercise) {
                // Update existing exercise
                const updatedExercise = new Exercise(
                    exercise.id,
                    currentState.name,
                    currentState.volumeType,
                    currentState.intensityTypes,
                    currentState.sets,
                    currentState.notes,
                    currentState.categories,
                );
                await updatedExercise.save(db);
            } else {
                // Create new exercise
                await Exercise.create(
                    db,
                    currentState.name,
                    currentState.volumeType,
                    currentState.intensityTypes,
                    currentState.sets,
                    currentState.notes,
                    currentState.categories
                );
            }
            router.back();
        } catch (error) {
            console.error('Failed to save exercise:', error);
        }
    }

    async function handleDelete() {
        if (exercise) {
            try {
                await exercise.delete(db);
                router.back();
            } catch (error) {
                console.error('Failed to delete exercise:', error);
            }
        }
    }

    return (
        <EntityDetailScreen 
            isNewEntity={id === 'new'} 
            title='Exercise' 
            onSave={handleSave} 
            onDelete={handleDelete}
            entityId={id !== 'new' ? id : undefined}
        >
            <LabeledTextField
                name='Name'
                initialValue={currentState.name}
                onValueChange={name => setCurrentState({ ...currentState, name })} 
            />

            <View style={resolvedStyles.typeRow}>
                <Text style={resolvedStyles.typeText}>
                    Volume Type: {currentState.volumeType}
                </Text>
                <Pressable onPress={() => setVolumeTypeModalVisible(true)}>
                    <Text style={resolvedStyles.changeText}>(Change)</Text>
                </Pressable>
            </View>

            <View style={resolvedStyles.typeRow}>
                <Text style={resolvedStyles.typeText}>
                    Intensity Types: {currentState.intensityTypes.join(', ')}
                </Text>
                <Pressable onPress={() => setIntensityTypeModalVisible(true)}>
                    <Text style={resolvedStyles.changeText}>(Change)</Text>
                </Pressable>
            </View>

            <SetList
                sets={currentState.sets}
                onSetsChange={sets => setCurrentState({ ...currentState, sets })}
                volumeType={currentState.volumeType}
                intensityTypes={currentState.intensityTypes}
            />

            <VolumeTypeModal
                visible={volumeTypeModalVisible}
                currentType={currentState.volumeType}
                onClose={() => setVolumeTypeModalVisible(false)}
                onSelect={handleVolumeTypeChange}
            />

            <IntensityTypeModal
                visible={intensityTypeModalVisible}
                currentTypes={currentState.intensityTypes}
                onClose={(types) => {
                    setIntensityTypeModalVisible(false);
                    handleIntensityTypeChange(types);
                }}
            />
        </EntityDetailScreen>
    );
}

const styles = (colors: ThemeColors) => StyleSheet.create({
    typeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 5,
        marginTop: 10
    },
    typeText: {
        fontWeight: 'bold'
    },
    changeText: {
        color: colors.accent,
        marginLeft: 5
    }
});