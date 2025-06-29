import { useState, useEffect } from "react"
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Alert } from "react-native"
import { useRouter } from "expo-router"
import { ArrowLeft, ChevronDown, ChevronUp, Check } from "lucide-react-native"
import { useSQLiteContext } from "expo-sqlite"
import { Routine } from "@/lib/data/Routine"
import { WorkoutLog } from "@/lib/data/WorkoutLog"
import { Exercise } from "@/lib/data/Exercise"
import type { Workout } from "@/lib/data/Workout"
import { useResolvedStyles, type ThemeColors } from "@/lib/hooks/useThemeColors"

export default function WorkoutProgressScreen() {
  const router = useRouter()
  const db = useSQLiteContext()
  const styles = useResolvedStyles(createStyles)

  const [activeRoutine, setActiveRoutine] = useState<Routine | null>(null)
  const [currentWorkout, setCurrentWorkout] = useState<Workout | null>(null)
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0)
  const [currentSetIndex, setCurrentSetIndex] = useState(0)
  const [workoutLog, setWorkoutLog] = useState<WorkoutLog | null>(null)
  const [loading, setLoading] = useState(true)

  // State for modified reps and weight
  const [modifiedReps, setModifiedReps] = useState<number>(0)
  const [modifiedWeight, setModifiedWeight] = useState<number>(0)

  useEffect(() => {
    loadWorkoutData()
  }, [])

  useEffect(() => {
    // Update modified values when exercise/set changes
    if (currentWorkout) {
      const currentExercise = currentWorkout.exercises[currentExerciseIndex]
      const currentSet = currentExercise.sets[currentSetIndex]
      setModifiedReps(currentSet.reps)
      setModifiedWeight(currentSet.weight)
    }
  }, [currentWorkout, currentExerciseIndex, currentSetIndex])

  const loadWorkoutData = async () => {
    try {
      // Get active routine
      const routine = await Routine.pullActive(db)
      if (!routine) {
        Alert.alert("No Active Routine", "Please set an active routine first.")
        router.back()
        return
      }

      // Get today's workout
      const today = new Date().getDay()
      const todaysWorkout = routine.workouts[today]

      if (!todaysWorkout) {
        Alert.alert("Rest Day", "No workout scheduled for today!")
        router.back()
        return
      }

      // Get or create today's workout log
      const today_date = new Date()
      let log = await WorkoutLog.getLog(today_date, db)

      if (!log) {
        log = new WorkoutLog(today_date, todaysWorkout, routine.name)
        await log.save(db)
      }

      setActiveRoutine(routine)
      setCurrentWorkout(todaysWorkout)
      setWorkoutLog(log)
      setLoading(false)
    } catch (error) {
      console.error("Error loading workout data:", error)
      Alert.alert("Error", "Failed to load workout data")
      router.back()
    }
  }

  const handleSetComplete = async () => {
    if (!currentWorkout || !workoutLog) return

    const currentExercise = currentWorkout.exercises[currentExerciseIndex]

    // Update the exercise with modified values
    const updatedSets = [...currentExercise.sets]
    updatedSets[currentSetIndex] = {
      reps: modifiedReps,
      weight: modifiedWeight,
    }

    // Create updated exercise and save to database
    const updatedExercise = new Exercise({
      id: currentExercise.id,
      name: currentExercise.name,
      sets: updatedSets.map(({ reps, weight }) => `${reps}:${weight}`).join(";"),
      notes: currentExercise.notes,
      categories: currentExercise.categories.join(","),
      last_modified: new Date().toISOString(),
    })

    try {
      await updatedExercise.save(db)
    } catch (error) {
      console.error("Error saving exercise:", error)
      Alert.alert("Error", "Failed to save exercise changes")
      return
    }

    const isLastSetOfExercise = currentSetIndex === currentExercise.sets.length - 1
    const isLastExercise = currentExerciseIndex === currentWorkout.exercises.length - 1

    if (isLastSetOfExercise) {
      // Mark exercise as completed in workout log
      const updatedExercises = new Map(workoutLog.exercises)
      updatedExercises.set(currentExercise.name, true)

      const updatedLog = new WorkoutLog(
        workoutLog.date,
        updatedExercises,
        workoutLog.routineName,
        workoutLog.workoutName,
      )

      await updatedLog.save(db)
      setWorkoutLog(updatedLog)

      if (isLastExercise) {
        // Workout complete
        Alert.alert("Workout Complete!", "Great job finishing your workout!", [
          { text: "OK", onPress: () => router.push("/") },
        ])
        return
      } else {
        // Move to next exercise
        setCurrentExerciseIndex((prev) => prev + 1)
        setCurrentSetIndex(0)
      }
    } else {
      // Move to next set
      setCurrentSetIndex((prev) => prev + 1)
    }
  }

  const handlePreviousSet = () => {
    if (currentSetIndex > 0) {
      setCurrentSetIndex((prev) => prev - 1)
    } else if (currentExerciseIndex > 0) {
      const previousExercise = currentWorkout!.exercises[currentExerciseIndex - 1]
      setCurrentExerciseIndex((prev) => prev - 1)
      setCurrentSetIndex(previousExercise.sets.length - 1)
    }
  }

  const adjustReps = (increment: boolean) => {
    setModifiedReps((prev) => Math.max(1, prev + (increment ? 1 : -1)))
  }

  const adjustWeight = (increment: boolean) => {
    setModifiedWeight((prev) => Math.max(0, prev + (increment ? 5 : -5)))
  }

  if (loading || !currentWorkout || !activeRoutine) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading workout...</Text>
        </View>
      </SafeAreaView>
    )
  }

  const currentExercise = currentWorkout.exercises[currentExerciseIndex]
  const totalSets = currentWorkout.exercises.reduce((total, exercise) => total + exercise.sets.length, 0)
  const completedSets =
    currentWorkout.exercises
      .slice(0, currentExerciseIndex)
      .reduce((total, exercise) => total + exercise.sets.length, 0) + currentSetIndex

  const progressPercentage = ((completedSets + 1) / totalSets) * 100

  const canGoPrevious = currentSetIndex > 0 || currentExerciseIndex > 0

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={styles.headerIcon.color} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.workoutName}>{currentWorkout.name}</Text>
          <Text style={styles.routineName}>{activeRoutine.name}</Text>
        </View>
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressText}>
            Set {currentSetIndex + 1} of {currentExercise.sets.length}
          </Text>
          <Text style={styles.progressSubtext}>
            {completedSets + 1} / {totalSets} total sets
          </Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
        </View>
        <Text style={styles.progressPercentage}>Overall Progress: {Math.round(progressPercentage)}%</Text>
      </View>

      {/* Set Display */}
      <View style={styles.setDisplay}>
        <Text style={styles.exerciseName}>{currentExercise.name}</Text>

        <View style={styles.setInfo}>
          {/* Reps Section */}
          <View style={styles.valueSection}>
            <View style={styles.valueRow}>
              <TouchableOpacity onPress={() => adjustReps(false)} style={styles.adjustButton}>
                <ChevronDown size={24} color={styles.adjustButtonIcon.color} />
              </TouchableOpacity>

              <View style={styles.valueDisplay}>
                <Text style={styles.valueNumber}>{modifiedReps}</Text>
                <Text style={styles.valueLabel}>reps</Text>
              </View>

              <TouchableOpacity onPress={() => adjustReps(true)} style={styles.adjustButton}>
                <ChevronUp size={24} color={styles.adjustButtonIcon.color} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Weight Section */}
          <View style={styles.valueSection}>
            {modifiedWeight > 0 ? (
              <View style={styles.valueRow}>
                <TouchableOpacity onPress={() => adjustWeight(false)} style={styles.adjustButton}>
                  <ChevronDown size={24} color={styles.adjustButtonIcon.color} />
                </TouchableOpacity>

                <View style={styles.valueDisplay}>
                  <Text style={styles.weightNumber}>{modifiedWeight} lbs</Text>
                  <Text style={styles.valueLabel}>weight</Text>
                </View>

                <TouchableOpacity onPress={() => adjustWeight(true)} style={styles.adjustButton}>
                  <ChevronUp size={24} color={styles.adjustButtonIcon.color} />
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={styles.bodyweightText}>Bodyweight</Text>
            )}
          </View>
        </View>
      </View>

      {/* Complete Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={handleSetComplete} style={styles.completeButton}>
          <Check size={24} color={styles.completeButtonIcon.color} />
          <Text style={styles.completeButtonText}>Complete Set</Text>
        </TouchableOpacity>

        {canGoPrevious && (
          <TouchableOpacity onPress={handlePreviousSet} style={styles.previousButton}>
            <Text style={styles.previousButtonText}>Previous Set</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.remainingText}>
          {currentExerciseIndex === currentWorkout.exercises.length - 1 &&
          currentSetIndex === currentExercise.sets.length - 1
            ? "Last set! You're almost done!"
            : `${currentWorkout.exercises.length - currentExerciseIndex - 1} exercises remaining`}
        </Text>
      </View>
    </SafeAreaView>
  )
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    loadingText: {
      fontSize: 18,
      color: colors.gray,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.separator,
    },
    backButton: {
      padding: 8,
      marginRight: 8,
    },
    headerTextContainer: {
      flex: 1,
    },
    headerIcon: {
      color: colors.primary,
    },
    workoutName: {
      fontSize: 20,
      fontWeight: "bold",
      color: colors.primary,
    },
    routineName: {
      fontSize: 14,
      color: colors.gray,
    },
    progressContainer: {
      padding: 16,
      backgroundColor: colors.backgroundSecondary,
    },
    progressHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 12,
    },
    progressText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.primary,
    },
    progressSubtext: {
      fontSize: 14,
      color: colors.gray,
    },
    progressBar: {
      height: 8,
      backgroundColor: colors.separator,
      borderRadius: 4,
      marginBottom: 8,
    },
    progressFill: {
      height: "100%",
      backgroundColor: colors.accent,
      borderRadius: 4,
    },
    progressPercentage: {
      fontSize: 12,
      color: colors.gray,
      textAlign: "center",
    },
    setDisplay: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 32,
    },
    exerciseName: {
      fontSize: 24,
      fontWeight: "bold",
      textAlign: "center",
      marginBottom: 32,
      color: colors.primary,
    },
    setInfo: {
      alignItems: "center",
      gap: 48,
    },
    valueSection: {
      alignItems: "center",
    },
    valueRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 24,
    },
    adjustButton: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 20,
      width: 40,
      height: 40,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.separator,
    },
    adjustButtonIcon: {
      color: colors.primary,
    },
    valueDisplay: {
      alignItems: "center",
      minWidth: 120,
    },
    valueNumber: {
      fontSize: 72,
      fontWeight: "bold",
      color: colors.accent,
    },
    weightNumber: {
      fontSize: 36,
      fontWeight: "600",
      color: colors.primary,
    },
    valueLabel: {
      fontSize: 18,
      color: colors.gray,
    },
    bodyweightText: {
      fontSize: 18,
      color: colors.gray,
    },
    buttonContainer: {
      padding: 16,
    },
    completeButton: {
      backgroundColor: colors.accent,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
    },
    completeButtonIcon: {
      color: colors.background,
    },
    completeButtonText: {
      color: colors.background,
      fontSize: 18,
      fontWeight: "600",
      marginLeft: 8,
    },
    previousButton: {
      backgroundColor: colors.backgroundSecondary,
      alignItems: "center",
      justifyContent: "center",
      padding: 12,
      borderRadius: 8,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.separator,
    },
    previousButtonText: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: "500",
    },
    remainingText: {
      fontSize: 14,
      color: colors.gray,
      textAlign: "center",
    },
  })
