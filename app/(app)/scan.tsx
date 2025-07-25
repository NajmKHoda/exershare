import { useState, useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import TextButton from '@/lib/components/controls/TextButton';
import Text from '@/lib/components/theme/Text';
import { ThemeColors, useResolvedStyles, useThemeColors } from '@/lib/hooks/useThemeColors';
import { useIncomingEntity } from '@/lib/hooks/useIncomingEntity';
import { supabase } from '@/lib/supabase';
import { ChevronLeft, Camera } from 'lucide-react-native';
import { Exercise } from '@/lib/data/Exercise';
import { Workout } from '@/lib/data/Workout';
import { Routine } from '@/lib/data/Routine';

export default function ScanScreen() {
    const [permission, requestPermission] = useCameraPermissions();
    const scanned = useRef(false);
    const router = useRouter();
    const resolvedStyles = useResolvedStyles(styles);
    const { setIncomingEntity } = useIncomingEntity();

    useEffect(() => {
        if (!permission?.granted && permission?.canAskAgain) {
            requestPermission();
        }
    }, [permission]);

    const handleBarCodeScanned = async ({ data }: { data: string }) => {
        if (scanned.current) return;
        scanned.current = true;
        try {
            const qrData = JSON.parse(data);
            const { token, type } = qrData;

            if (!token || !type) {
                throw new Error('Invalid QR code format');
            }

            let entityData;

            switch (type) {
                case 'exercise':
                    entityData = await fetchSharedExercise(token);
                    break;
                case 'workout':
                    entityData = await downloadWorkout(token);
                    break;
                case 'routine':
                    entityData = await downloadRoutine(token);
                    break;
                default:
                    throw new Error(`Unsupported entity type: ${type}`);
            }

            // Store raw data with entity type
            setIncomingEntity(entityData);

            // Navigate to the appropriate incoming screen
            router.replace(`/${type}/incoming` as any);
        } catch (error) {
            console.error('Error processing QR code:', error);
            scanned.current = false;
        }
    };

    const fetchSharedExercise = async (token: string) => {
        const { data: { data }, error } = await supabase.functions.invoke('fetch_shared_exercise', {
            body: { token }
        });

        if (error) throw error;
        return { 
            type: 'exercise' as const,
            data: {
                exercise: new Exercise(data.exercise) 
            }
        };
    };

    const downloadWorkout = async (token: string) => {
        const { data: { data }, error } = await supabase.functions.invoke('download_workout', {
            body: { token }
        });
        
        if (error) throw error;
        return {
            type: 'workout' as const,
            data: {
                workout: new Workout(
                    data.workout.id,
                    data.workout.name,
                    data.workout.exercise_ids
                ),
                exercises: data.exercises.map((e: any) => new Exercise(e)) as Exercise[]
            }
        };
    };

    const downloadRoutine = async (token: string) => {
        const { data: { data }, error } = await supabase.functions.invoke('download_routine', {
            body: { token }
        });
        
        if (error) throw error;
        return {
            type: 'routine' as const,
            data: {
                routine: new Routine(
                    data.routine.id,
                    data.routine.name,
                    data.routine.workout_ids
                ),
                workouts: data.workouts.map((w: any) => new Workout(
                    w.id,
                    w.name,
                    w.exercise_ids
                )) as Workout[],
                exercises: data.exercises.map((e: any) => new Exercise(e)) as Exercise[]
            }
        };
    };

    if (!permission) {
        return <View />;
    }

    if (!permission.granted) {
        return (
            <View style={resolvedStyles.container}>
                <SafeAreaView edges={['top']} style={resolvedStyles.header}>
                    <TextButton 
                        label="Back" 
                        style={resolvedStyles.back} 
                        Icon={ChevronLeft} 
                        onPress={() => router.back()} 
                    />
                    <Text style={resolvedStyles.headerTitle}>Scan QR Code</Text>
                    <View style={resolvedStyles.headerSpacer} />
                </SafeAreaView>
                <View style={resolvedStyles.permissionContainer}>
                    <Text style={resolvedStyles.permissionText}>
                        Camera permission is required to scan QR codes
                    </Text>
                    <TextButton 
                        label="Grant Permission" 
                        Icon={Camera}
                        onPress={requestPermission}
                        style={resolvedStyles.permissionButton}
                    />
                </View>
            </View>
        );
    }

    return (
        <View style={resolvedStyles.container}>
            <SafeAreaView edges={['top']} style={resolvedStyles.header}>
                <TextButton 
                    label="Back" 
                    style={resolvedStyles.back} 
                    Icon={ChevronLeft} 
                    onPress={() => router.back()} 
                />
                <Text style={resolvedStyles.headerTitle}>Scan QR Code</Text>
                <View style={resolvedStyles.headerSpacer} />
            </SafeAreaView>
            
            <View style={resolvedStyles.cameraContainer}>
                <CameraView
                    style={resolvedStyles.camera}
                    facing="back"
                    onBarcodeScanned={handleBarCodeScanned}
                    barcodeScannerSettings={{
                        barcodeTypes: ['qr'],
                    }}
                />
                <View style={resolvedStyles.overlay}>
                    <View style={resolvedStyles.scanArea} />
                    <Text style={resolvedStyles.instructionText}>
                        {scanned.current ? 'Processing...' : 'Point camera at QR code to scan'}
                    </Text>
                </View>
            </View>
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
    permissionContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        gap: 20,
    },
    permissionText: {
        fontSize: 18,
        textAlign: 'center',
    },
    permissionButton: {
        fontSize: 16,
        color: colors.accent,
    },
    cameraContainer: {
        flex: 1,
    },
    camera: {
        ...StyleSheet.absoluteFillObject
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 40,
    },
    scanArea: {
        width: 250,
        height: 250,
        borderWidth: 3,
        borderColor: colors.accent,
        borderRadius: 20,
        backgroundColor: 'transparent',
    },
    instructionText: {
        color: 'white',
        fontSize: 18,
        textAlign: 'center',
        backgroundColor: 'rgba(0,0,0,0.7)',
        padding: 10,
        borderRadius: 10,
    },
    scanAgainContainer: {
        padding: 20,
        backgroundColor: colors.backgroundSecondary,
    },
    scanAgainButton: {
        fontSize: 18,
        color: colors.accent,
        textAlign: 'center',
    },
});