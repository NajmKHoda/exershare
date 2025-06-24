import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Camera, BarcodeScanningResult, CameraView, useCameraPermissions } from 'expo-camera';
import { Stack, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { ThemeColors, useResolvedStyles, useThemeColors } from '@/lib/hooks/useThemeColors';
import { useSQLiteContext } from 'expo-sqlite';
import { Exercise } from '@/lib/data/Exercise';

type ScanData = {
  token: string;
  type: 'exercise' | 'workout' | 'routine';
};

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const colors = useThemeColors();
  const resolvedStyles = useResolvedStyles(styles);

  useEffect(() => { requestPermission() }, []);

  const handleBarCodeScanned = async ({ type, data }: BarcodeScanningResult) => {
    if (scanned) return; // Prevent multiple scans

    try {
      setScanned(true);
      setLoading(true);
      
      // Parse the QR code data
      const scanData: ScanData = JSON.parse(data);
      
      if (!scanData.token || !scanData.type) {
        throw new Error('Invalid QR code format');
      }

      // Handle different entity types
      if (scanData.type === 'exercise') {
        await handleExerciseScan(scanData.token);
      } else {
        // For future implementation of other types
        setError(`${scanData.type} scanning is not yet implemented`);
        setLoading(false);
      }
    } catch (err) {
      console.error('Scan error:', err);
      setError(err instanceof Error ? err.message : 'Failed to process QR code');
      setLoading(false);
    }
  };

  const handleExerciseScan = async (token: string) => {
    try {
      // Call the Supabase edge function to fetch the shared exercise
      const { data, error } = await supabase.functions.invoke('fetch_shared_exercise', {
        body: { token }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data?.exercise) {
        throw new Error('No exercise data returned');
      }

      // Save the exercise to the local database
      console.log('Exercise received:', data.exercise);
      
      setLoading(false);
    } catch (err) {
      console.error('Exercise fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch exercise');
      setLoading(false);
    }
  };

  const resetScanner = () => {
    setScanned(false);
    setError(null);
  };

  // Render based on permission state
  if (!permission) {
    return (
      <View style={resolvedStyles.container}>
        <Stack.Screen 
          options={{
            title: 'Scan QR Code',
            headerShown: true,
          }} 
        />
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={resolvedStyles.container}>
        <Stack.Screen 
          options={{
            title: 'Scan QR Code',
            headerShown: true,
          }} 
        />
        <View style={resolvedStyles.messageContainer}>
          <Text style={resolvedStyles.errorText}>
            Camera permission is required to scan QR codes.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={resolvedStyles.container}>
      <Stack.Screen 
        options={{
          title: 'Scan QR Code',
          headerShown: true,
        }} 
      />
      
      {!scanned ? (
        <View style={resolvedStyles.scannerContainer}>
          <CameraView
            facing={'back'}
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            style={resolvedStyles.scanner}
            barcodeScannerSettings={{
              barcodeTypes: ['qr'],
            }}
          />
          <View style={resolvedStyles.overlay}>
            <Text style={resolvedStyles.instructions}>
              Point camera at a QR code to import an exercise
            </Text>
          </View>
        </View>
      ) : loading ? (
        <View style={resolvedStyles.messageContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={resolvedStyles.statusText}>Processing...</Text>
        </View>
      ) : error ? (
        <View style={resolvedStyles.messageContainer}>
          <Text style={resolvedStyles.errorText}>{error}</Text>
          <Text 
            style={resolvedStyles.linkText}
            onPress={resetScanner}
          >
            Tap to scan again
          </Text>
        </View>
      ) : (
        <View style={resolvedStyles.messageContainer}>
          <Text style={resolvedStyles.successText}>Exercise imported successfully!</Text>
          <Text 
            style={resolvedStyles.linkText}
            onPress={resetScanner}
          >
            Tap to scan another QR code
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scannerContainer: {
    flex: 1,
    position: 'relative',
  },
  scanner: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: 20,
  },
  instructions: {
    color: 'white',
    fontSize: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 16,
    borderRadius: 8,
    marginBottom: 40,
    textAlign: 'center',
  },
  messageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  statusText: {
    fontSize: 18,
    marginTop: 16,
    textAlign: 'center',
    color: colors.primary,
  },
  successText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: colors.green,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    color: colors.red,
    marginBottom: 16,
  },
  linkText: {
    fontSize: 16,
    color: colors.primary,
    textAlign: 'center',
    marginTop: 16,
  },
});
