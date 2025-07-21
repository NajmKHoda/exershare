import { useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable, TextInput } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { useIncomingEntity } from '@/lib/hooks/useIncomingEntity';
import Text from '@/lib/components/theme/Text';
import FormField from '@/lib/components/controls/FormField';
import TextButton from '@/lib/components/controls/TextButton';
import { ThemeColors, useResolvedStyles, useThemeColors } from '@/lib/hooks/useThemeColors';
import { ChevronLeft, Sparkles } from 'lucide-react-native';
import { standardOutline, standardShadow } from '@/lib/standardStyles';
import { Routine } from '@/lib/data/Routine';
import { Workout } from '@/lib/data/Workout';
import { Exercise } from '@/lib/data/Exercise';

// Goal options that the user can select
const GOALS = ['strength', 'hypertrophy', 'endurance', 'weight loss', 'general fitness'];

// Experience level options
const EXPERIENCE_LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

// Common equipment options
const EQUIPMENT_OPTIONS = [
  'Dumbbells',
  'Barbells',
  'Resistance Bands',
  'Kettlebells',
  'Machines',
  'Bodyweight Only',
  'Pull-up Bar',
  'Bench'
];

export default function GenerateRoutineScreen() {
  const colors = useThemeColors();
  const resolvedStyles = useResolvedStyles(styles);
  const { setIncomingEntity } = useIncomingEntity();
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state
  const [goal, setGoal] = useState<string>('strength');
  const [daysPerWeek, setDaysPerWeek] = useState<string>('3');
  const [timePerWorkout, setTimePerWorkout] = useState<string>('1');
  const [equipmentAvailable, setEquipmentAvailable] = useState<string[]>(['Dumbbells', 'Bodyweight Only']);
  const [experienceLevel, setExperienceLevel] = useState<string>('Intermediate');
  const [customInstructions, setCustomInstructions] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const toggleEquipment = (equipment: string) => {
    if (equipmentAvailable.includes(equipment)) {
      setEquipmentAvailable(equipmentAvailable.filter(item => item !== equipment));
    } else {
      setEquipmentAvailable([...equipmentAvailable, equipment]);
    }
  };

  const validateForm = (): boolean => {
    if (isNaN(Number(daysPerWeek)) || Number(daysPerWeek) < 1 || Number(daysPerWeek) > 7) {
      setError('Days per week must be between 1 and 7');
      return false;
    }
    
    if (isNaN(Number(timePerWorkout)) || Number(timePerWorkout) <= 0 || Number(timePerWorkout) > 3) {
      setError('Time per workout must be between 0.25 and 3 hours');
      return false;
    }
    
    setError(null);
    return true;
  };

  const handleGenerate = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      // Prepare the request payload
      const payload = {
        preferences: {
          goal,
          daysPerWeek: Number(daysPerWeek),
          timePerWorkout: Number(timePerWorkout),
          equipmentAvailable,
          experienceLevel,
          customInstructions: customInstructions.trim(),
        },
      };
      
      // Call the Supabase edge function
      const { data, error } = await supabase.functions.invoke('generate_routine', {
        body: payload,
      });
      
      if (error) {
        console.error('Error generating routine:', error);
        setError('Failed to generate routine. Please try again.');
        setIsLoading(false);
        return;
      }
      
      // Set the result in the incoming entity context
      setIncomingEntity({
        type: 'routine',
        data: {
          routine: new Routine(
            data.routine.id,
            data.routine.name,
            data.routine.workout_ids
          ),
          workouts: data.workouts.map((w: any) => new Workout(
            w.id,
            w.name,
            w.exercise_ids,
          )),
          exercises: data.exercises.map((e: any) => new Exercise(e)),
        },
      });

      // Navigate to the incoming routine page
      router.push('/routine/incoming');
    } catch (err) {
      console.error('Error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={resolvedStyles.container} edges={['top']}>
      <View style={resolvedStyles.header}>
        <Pressable onPress={() => router.back()} style={resolvedStyles.backButton}>
          <ChevronLeft color={colors.primary} size={24} />
        </Pressable>
        <Text style={resolvedStyles.title}>Generate Workout Routine</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <ScrollView style={resolvedStyles.scrollView} contentContainerStyle={resolvedStyles.scrollContent}>
        {/* Goal selection */}
        <View style={resolvedStyles.section}>
          <Text style={resolvedStyles.sectionTitle}>Fitness Goal</Text>
          <View style={resolvedStyles.optionsContainer}>
            {GOALS.map((goalOption) => (
              <Pressable
                key={goalOption}
                style={[
                  resolvedStyles.optionButton,
                  goal === goalOption && resolvedStyles.selectedOptionButton
                ]}
                onPress={() => setGoal(goalOption)}
              >
                <Text style={
                  goal === goalOption && resolvedStyles.selectedOptionText
                }>
                  {goalOption.charAt(0).toUpperCase() + goalOption.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
        
        {/* Days per week */}
        <View style={resolvedStyles.formField}>
          <Text style={resolvedStyles.label}>Days Per Week (1-7)</Text>
          <FormField
            name=""
            keyboardType="numeric"
            value={daysPerWeek}
            onChange={setDaysPerWeek}
            style={resolvedStyles.input}
          />
        </View>
        
        {/* Time per workout */}
        <View style={resolvedStyles.formField}>
          <Text style={resolvedStyles.label}>Hours Per Workout (0.25-3)</Text>
          <FormField
            name=""
            keyboardType="numeric"
            value={timePerWorkout}
            onChange={setTimePerWorkout}
            style={resolvedStyles.input}
          />
        </View>
        
        {/* Experience level */}
        <View style={resolvedStyles.section}>
          <Text style={resolvedStyles.sectionTitle}>Experience Level</Text>
          <View style={resolvedStyles.optionsContainer}>
            {EXPERIENCE_LEVELS.map((level) => (
              <Pressable
                key={level}
                style={[
                  resolvedStyles.optionButton,
                  experienceLevel === level && resolvedStyles.selectedOptionButton
                ]}
                onPress={() => setExperienceLevel(level)}
              >
                <Text style={
                  experienceLevel === level && resolvedStyles.selectedOptionText
                }>
                  {level}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
        
        {/* Equipment */}
        <View style={resolvedStyles.section}>
          <Text style={resolvedStyles.sectionTitle}>Available Equipment</Text>
          <View style={resolvedStyles.equipmentGrid}>
            {EQUIPMENT_OPTIONS.map((equipment) => (
              <Pressable
                key={equipment}
                style={[
                  resolvedStyles.equipmentButton,
                  equipmentAvailable.includes(equipment) && resolvedStyles.selectedEquipmentButton
                ]}
                onPress={() => toggleEquipment(equipment)}
              >
                <Text style={[
                  resolvedStyles.equipmentText,
                  equipmentAvailable.includes(equipment) && resolvedStyles.selectedEquipmentText
                ]}>
                  {equipment}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
        
        {/* Custom instructions */}
        <View style={resolvedStyles.formField}>
          <Text style={resolvedStyles.label}>Custom Instructions (Optional)</Text>
          <View style={resolvedStyles.textAreaContainer}>
            <TextInput
              style={resolvedStyles.textArea}
              multiline={true}
              numberOfLines={4}
              value={customInstructions}
              onChangeText={setCustomInstructions}
              placeholder="Add any specific requirements or focus areas"
              placeholderTextColor={colors.gray}
            />
          </View>
        </View>
        
        {/* Error message */}
        {error && (
          <Text style={resolvedStyles.errorText}>{error}</Text>
        )}
        
        {/* Generate button */}
        <View style={resolvedStyles.buttonContainer}>
          <TextButton
            label="Generate Routine"
            Icon={Sparkles}
            onPress={handleGenerate}
            disabled={isLoading}
            style={resolvedStyles.generateButton}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gray,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  formField: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    marginTop: 0,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: colors.backgroundSecondary,
    marginRight: 8,
    marginBottom: 8,
    ...standardOutline(colors),
    ...standardShadow,
  },
  selectedOptionButton: {
    backgroundColor: colors.accent,
    borderColor: colors.primary,
  },
  selectedOptionText: {
    color: 'white',
  },
  equipmentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  equipmentButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.backgroundSecondary,
    marginRight: 8,
    marginBottom: 8,
    ...standardOutline(colors),
  },
  selectedEquipmentButton: {
    backgroundColor: colors.accent,
    borderColor: colors.primary,
  },
  equipmentText: {
    fontSize: 14,
  },
  selectedEquipmentText: {
    color: 'white',
  },
  textAreaContainer: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.gray,
    borderRadius: 8,
  },
  textArea: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    marginTop: 8,
    marginBottom: 24,
  },
  generateButton: {
    paddingVertical: 14,
  },
  errorText: {
    color: 'red',
    marginBottom: 16,
  },
});
