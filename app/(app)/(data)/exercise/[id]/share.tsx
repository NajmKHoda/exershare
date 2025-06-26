import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { Exercise } from '@/lib/data/Exercise';
import { supabase } from '@/lib/supabase';
import QRCode from 'react-native-qrcode-svg';
import { ThemeColors, useResolvedStyles, useThemeColors } from '@/lib/hooks/useThemeColors';

export default function ShareExerciseScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const db = useSQLiteContext();
    const router = useRouter();
    const colors = useThemeColors();
    const resolvedStyles = useResolvedStyles(styles);
    const [exercise, setExercise] = useState<Exercise | null>(null);
    const [shareToken, setShareToken] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Load exercise and create share token
    useEffect(() => {
        async function loadExerciseAndCreateToken() {
            try {
                setLoading(true);
                
                // Load the exercise
                const loadedExercise = await Exercise.pullOne(id, db);
                if (!loadedExercise) {
                    throw new Error('Exercise not found');
                }
                setExercise(loadedExercise);
                
                // Create a share token in Supabase
                const { data, error } = await supabase
                    .from('share_tokens')
                    .insert({
                        entity_id: id,
                        type: 'exercise'
                    })
                    .select('id')
                    .single();
                
                if (error) {
                    throw new Error('Failed to create share token');
                }
                
                console.log(data.id);
                setShareToken(data.id);
            } catch (err) {
                console.error('Error:', err);
                setError(err instanceof Error ? err.message : 'An unknown error occurred');
            } finally {
                setLoading(false);
            }
        }
        
        loadExerciseAndCreateToken();
        
        // Clean up function to delete the token when component unmounts
        return () => {
            if (shareToken) {
                // Delete the token when leaving the screen
                supabase
                    .from('share_tokens')
                    .delete()
                    .eq('id', shareToken)
                    .then(({ error }) => {
                        if (error) {
                            console.error('Failed to delete share token:', error);
                        }
                    });
            }
        };
    }, [id, db]);

    return (
        <View style={resolvedStyles.container}>        
            {loading ? (
                <ActivityIndicator size="large" color={colors.primary} />
            ) : error ? (
                <View style={resolvedStyles.errorContainer}>
                    <Text style={resolvedStyles.errorText}>{error}</Text>
                </View>
            ) : (
                <View style={resolvedStyles.contentContainer}>
                    <Text style={resolvedStyles.title}>
                        Share "{exercise?.name}"
                    </Text>
                    <Text style={resolvedStyles.subtitle}>
                        Scan this QR code to import the exercise
                    </Text>
                    
                    <View style={resolvedStyles.qrContainer}>
                        {shareToken ? (
                            <QRCode
                                value={JSON.stringify({
                                    token: shareToken,
                                    type: 'exercise'
                                })}
                                size={250}
                                color={'#000'}
                                backgroundColor={'#fff'}
                            />
                        ) : (
                            <Text style={resolvedStyles.errorText}>
                                Unable to generate QR code
                            </Text>
                        )}
                    </View>
                    
                    <Text style={resolvedStyles.note}>
                        This QR code will expire when you leave this screen
                    </Text>
                </View>
            )}
        </View>
    );
}

const styles = (colors: ThemeColors) => StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: colors.background
    },
    contentContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
        color: colors.primary
    },
    subtitle: {
        fontSize: 16,
        marginBottom: 32,
        textAlign: 'center',
        color: colors.secondary
    },
    qrContainer: {
        padding: 20,
        borderRadius: 12,
        marginBottom: 32,
        backgroundColor: colors.backgroundSecondary
    },
    note: {
        fontSize: 14,
        fontStyle: 'italic',
        textAlign: 'center',
        color: colors.secondary
    },
    errorContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    errorText: {
        fontSize: 16,
        textAlign: 'center',
        color: colors.red
    }
});