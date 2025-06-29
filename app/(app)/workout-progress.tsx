"use client"

import { useState, useEffect } from "react"
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Alert } from "react-native"
import { useRouter } from "expo-router"
import { ArrowLeft, ChevronDown, ChevronUp, Check } from "lucide-react-native"
import { useSQLiteContext } from "expo-sqlite"
import { Routine } from "@/lib/data/Routine"
import { WorkoutLog } from "@/lib/data/WorkoutLog"
import { useResolvedStyles, type ThemeColors } from "@/lib/hooks/useThemeColors"

export default function WorkoutProgressScreen() {
  const router = useRouter()
  const db = useSQLiteContext()
  const styles = useResolvedStyles(createStyles)

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
    if (workoutLog) {
      const currentSet = getCurrentSet()
      if (currentSet) {
        setModifiedReps(currentSet.reps)
        setModifiedWeight(currentSet.weight)
      }
    }
  }, [workoutLog])

  const loadWorkoutData = async () => {
    try {
      // Get or create today's workout log
      const today_date = new Date()
      let log = await WorkoutLog.getLog(today_date, db)

      if (!log) {
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
        
        log = new WorkoutLog(today_date, todaysWorkout, routine.name)
        await log.save(db)
      }

      setWorkoutLog(log)
      setLoading(false)
    } catch (error) {
      console.error("Error loading workout data:", error)
      Alert.alert("Error", "Failed to load workout data")
      router.back()
    }
  }

  const getExerciseList = () => {
    if (!workoutLog) return []
    return Array.from(workoutLog.exercises.entries()).map(([id, exercise]) => ({
      id,
      ...exercise,
    }))
  }

  const getCurrentExerciseIndex = () => {
    if (!workoutLog) return 0

    const exercises = getExerciseList()
    for (let i = 0; i < exercises.length; i++) {
      const completion = workoutLog.completion.find((c) => c.id === exercises[i].id)
      const setsCompleted = completion?.setsCompleted || 0
      if (setsCompleted < exercises[i].sets.length) {
        return i
      }
    }
    return exercises.length - 1 // All exercises completed
  }

  const getCurrentSetIndex = () => {
    if (!workoutLog) return 0

    const currentExercise = getCurrentExercise()
    if (!currentExercise) return 0

    const completion = workoutLog.completion.find((c) => c.id === currentExercise.id)
    return completion?.setsCompleted || 0
  }

  const getCurrentExercise = () => {
    const exercises = getExerciseList()
    const currentIndex = getCurrentExerciseIndex()
    return exercises[currentIndex] || null
  }

  const getCurrentSet = () => {
    const currentExercise = getCurrentExercise()
    if (!currentExercise) return null

    const setIndex = getCurrentSetIndex()
    return currentExercise.sets[setIndex] || null
  }

  const getTotalSets = () => {
    return getExerciseList().reduce((total, exercise) => total + exercise.sets.length, 0)
  }

  const getCompletedSets = () => {
    if (!workoutLog) return 0
    return workoutLog.completion.reduce((total, completion) => total + completion.setsCompleted, 0)
  }

  const handleSetComplete = async () => {
    if (!workoutLog) return

    const currentExercise = getCurrentExercise()
    if (!currentExercise) return

    const currentSetIndex = getCurrentSetIndex()

    // Update the exercise with modified values in the workout log
    const updatedExercises = new Map(workoutLog.exercises)
    const exerciseData = updatedExercises.get(currentExercise.id)!
    const updatedSets = [...exerciseData.sets]
    updatedSets[currentSetIndex] = {
      reps: modifiedReps,
      weight: modifiedWeight,
    }

    updatedExercises.set(currentExercise.id, {
      ...exerciseData,
      sets: updatedSets,
    })

    // Update completion tracking
    const updatedCompletion = [...workoutLog.completion]
    const completionIndex = updatedCompletion.findIndex((c) => c.id === currentExercise.id)
    if (completionIndex >= 0) {
      updatedCompletion[completionIndex] = {
        ...updatedCompletion[completionIndex],
        setsCompleted: updatedCompletion[completionIndex].setsCompleted + 1,
      }
    }

    // Create updated workout log
    const updatedLog = new WorkoutLog(
      workoutLog.date,
      workoutLog.routineName,
      workoutLog.workoutName,
      updatedExercises,
      updatedCompletion,
    )

    try {
      await updatedLog.save(db)
      setWorkoutLog(updatedLog)

      // Check if workout is complete
      const totalSets = getTotalSets()
      const completedSets = updatedCompletion.reduce((total, completion) => total + completion.setsCompleted, 0)

      if (completedSets >= totalSets) {
        Alert.alert("Workout Complete!", "Great job finishing your workout!", [
          { text: "OK", onPress: () => router.push("/") },
        ])
      }
    } catch (error) {
      console.error("Error saving workout log:", error)
      Alert.alert("Error", "Failed to save workout progress")
    }
  }

  const handlePreviousSet = () => {
    if (!workoutLog) return

    const exercises = getExerciseList()
    const currentExerciseIndex = getCurrentExerciseIndex()
    const currentSetIndex = getCurrentSetIndex()

    if (currentSetIndex > 0) {
      // Go to previous set in current exercise
      const updatedCompletion = [...workoutLog.completion]
      const completionIndex = updatedCompletion.findIndex((c) => c.id === exercises[currentExerciseIndex].id)
      if (completionIndex >= 0) {
        updatedCompletion[completionIndex] = {
          ...updatedCompletion[completionIndex],
          setsCompleted: Math.max(0, updatedCompletion[completionIndex].setsCompleted - 1),
        }
      }

      const updatedLog = new WorkoutLog(
        workoutLog.date,
        workoutLog.routineName,
        workoutLog.workoutName,
        workoutLog.exercises,
        updatedCompletion,
      )

      updatedLog.save(db)
      setWorkoutLog(updatedLog)
    } else if (currentExerciseIndex > 0) {
      // Go to last set of previous exercise
      const previousExercise = exercises[currentExerciseIndex - 1]
      const updatedCompletion = [...workoutLog.completion]
      const completionIndex = updatedCompletion.findIndex((c) => c.id === previousExercise.id)
      if (completionIndex >= 0) {
        updatedCompletion[completionIndex] = {
          ...updatedCompletion[completionIndex],
          setsCompleted: Math.max(0, previousExercise.sets.length - 1),
        }
      }

      const updatedLog = new WorkoutLog(
        workoutLog.date,
        workoutLog.routineName,
        workoutLog.workoutName,
        workoutLog.exercises,
        updatedCompletion,
      )

      updatedLog.save(db)
      setWorkoutLog(updatedLog)
    }
  }

  const adjustReps = (increment: boolean) => {
    setModifiedReps((prev) => Math.max(1, prev + (increment ? 1 : -1)))
  }

  const adjustWeight = (increment: boolean) => {
    setModifiedWeight((prev) => Math.max(0, prev + (increment ? 5 : -5)))
  }

  if (loading || !workoutLog) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading workout...</Text>
        </View>
      </SafeAreaView>
    )
  }

  const currentExercise = getCurrentExercise()
  const currentSet = getCurrentSet()
  const currentExerciseIndex = getCurrentExerciseIndex()
  const currentSetIndex = getCurrentSetIndex()
  const totalSets = getTotalSets()
  const completedSets = getCompletedSets()
  const progressPercentage = totalSets > 0 ? ((completedSets + 1) / totalSets) * 100 : 0

  const canGoPrevious = completedSets > 0

  if (!currentExercise || !currentSet) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Workout Complete!</Text>
        </View>
      </SafeAreaView>
    )
  }

  const exercises = getExerciseList()
  const currentExerciseCompletion = workoutLog.completion.find((c) => c.id === currentExercise.id)
  const setsCompletedInExercise = currentExerciseCompletion?.setsCompleted || 0

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={styles.headerIcon.color} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.workoutName}>{workoutLog.workoutName}</Text>
          <Text style={styles.routineName}>{workoutLog.routineName}</Text>
        </View>
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressText}>
            Set {setsCompletedInExercise + 1} of {currentExercise.sets.length}
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
          {completedSets + 1 >= totalSets
            ? "Last set! You're almost done!"
            : `${exercises.length - currentExerciseIndex - (setsCompletedInExercise >= currentExercise.sets.length ? 1 : 0)} exercises remaining`}
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