import { useState, useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import TextButton from '@/lib/components/controls/TextButton';
import ThemeText from '@/lib/components/theme/ThemeText';
import { ThemeColors, useResolvedStyles, useThemeColors } from '@/lib/hooks/useThemeColors';
import { useIncomingEntity } from '@/lib/hooks/useIncomingEntity';
import { supabase } from '@/lib/supabase';
import { ChevronLeft, Camera } from 'lucide-react-native';

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
            setIncomingEntity({
                type: type as 'exercise' | 'workout' | 'routine',
                ...entityData
            });

            // Navigate to the appropriate incoming screen
            router.replace(`/${type}/incoming` as any);
        } catch (error) {
            console.error('Error processing QR code:', error);
            scanned.current = false;
        }
    };

    const fetchSharedExercise = async (token: string) => {
        const { data, error } = await supabase.functions.invoke('fetch_shared_exercise', {
            body: { token }
        });
        
        if (error) throw error;
        return data;
    };

    const downloadWorkout = async (token: string) => {
        const { data, error } = await supabase.functions.invoke('download_workout', {
            body: { token }
        });
        
        if (error) throw error;
        return data;
    };

    const downloadRoutine = async (token: string) => {
        const { data, error } = await supabase.functions.invoke('download_routine', {
            body: { token }
        });
        
        if (error) throw error;

        return data;
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
                    <ThemeText style={resolvedStyles.headerTitle}>Scan QR Code</ThemeText>
                    <View style={resolvedStyles.headerSpacer} />
                </SafeAreaView>
                <View style={resolvedStyles.permissionContainer}>
                    <ThemeText style={resolvedStyles.permissionText}>
                        Camera permission is required to scan QR codes
                    </ThemeText>
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
                <ThemeText style={resolvedStyles.headerTitle}>Scan QR Code</ThemeText>
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
                    <ThemeText style={resolvedStyles.instructionText}>
                        {scanned.current ? 'Processing...' : 'Point camera at QR code to scan'}
                    </ThemeText>
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