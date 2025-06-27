import { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { supabase } from '@/lib/supabase';
import { ThemeColors, useResolvedStyles, useThemeColors } from '@/lib/hooks/useThemeColors';
import ThemeText from '@/lib/components/theme/ThemeText';
import useSQLiteQuery from '@/lib/hooks/useSQLiteQuery';
import { SafeAreaView } from 'react-native-safe-area-context';
import TextButton from '@/lib/components/controls/TextButton';
import { ChevronLeft } from 'lucide-react-native';
import { useFocusEffect, useRouter } from 'expo-router';

export type EntityType = 'exercise' | 'workout' | 'routine';

interface ShareQRCodeProps {
    id: string;
    type: EntityType;
    entityTable: string;
}

export default function ShareScreen({ id, type, entityTable }: ShareQRCodeProps) {
    const colors = useThemeColors();
    const resolvedStyles = useResolvedStyles(styles);
    const router = useRouter();
    const [shareToken, setShareToken] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    
    const [queryResult,,queryDone] = useSQLiteQuery<{ name: string }>(
        `SELECT name FROM ${entityTable} WHERE id = '${id}'`,
    );
    const name = queryResult?.name ?? null;

    // Create share token
    useEffect(() => {
        async function createShareToken() {
            try {
                setLoading(true);
                if (!queryDone) return;
                
                // Verify entity exists
                if (name === null) {
                    throw new Error(`${type} not found`);
                }
                
                // Create a share token in Supabase
                const { data, error } = await supabase
                    .from('share_tokens')
                    .insert({
                        entity_id: id,
                        type: type
                    })
                    .select('id')
                    .single();
                
                if (error) {
                    throw new Error('Failed to create share token');
                }
                
                setShareToken(data.id);
            } catch (err) {
                console.error('Error:', err);
                setError(err instanceof Error ? err.message : 'An unknown error occurred');
            } finally {
                setLoading(false);
            }
        }
        
        createShareToken();
    }, [id, type, queryDone]);

    if (loading) {
        return (
            <View style={resolvedStyles.container}>
                <SafeAreaView edges={['top']} style={resolvedStyles.header}>
                    <TextButton label="Back" style={resolvedStyles.back} Icon={ChevronLeft} onPress={() => router.back()} />
                    
                </SafeAreaView>
                <View style={resolvedStyles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </View>
        );
    }
    
    if (error) {
        return (
            <View style={resolvedStyles.container}>
                <SafeAreaView edges={['top']} style={resolvedStyles.header}>
                    <TextButton label="Back" style={resolvedStyles.back} Icon={ChevronLeft} onPress={() => router.back()} />
                    <ThemeText style={resolvedStyles.headerTitle}>Share {type}</ThemeText>
                    <View style={resolvedStyles.headerSpacer} />
                </SafeAreaView>
                <View style={resolvedStyles.errorContainer}>
                    <ThemeText style={resolvedStyles.errorText}>{error}</ThemeText>
                </View>
            </View>
        );
    }
    
    return (
        <View style={resolvedStyles.container}>
            <SafeAreaView edges={['top']} style={resolvedStyles.header}>
                <TextButton label="Back" style={resolvedStyles.back} Icon={ChevronLeft} onPress={() => router.back()} />
            </SafeAreaView>
            <View style={resolvedStyles.contentContainer}>
                <ThemeText style={resolvedStyles.title}>
                    Share "{name}"
                </ThemeText>
                <ThemeText style={resolvedStyles.subtitle}>
                    Scan this QR code to import the {type}
                </ThemeText>
                
                <View style={resolvedStyles.qrContainer}>
                    {shareToken ? (
                        <QRCode
                            value={JSON.stringify({
                                token: shareToken,
                                type: type
                            })}
                            size={250}
                            color={'#000'}
                            backgroundColor={'#fff'}
                        />
                    ) : (
                        <ThemeText style={resolvedStyles.errorText}>
                            Unable to generate QR code
                        </ThemeText>
                    )}
                </View>
                
                <ThemeText style={resolvedStyles.note}>
                    This QR code will expire when you leave this screen
                </ThemeText>
            </View>
        </View>
    );
}

const styles = (colors: ThemeColors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 5,
        paddingBottom: 10,
        backgroundColor: colors.backgroundSecondary,
        flexDirection: 'row',
        alignItems: 'center'
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        lineHeight: 28,
        textAlign: 'center',
        flex: 1
    },
    headerSpacer: {
        width: 70, // Same width as back button to ensure title stays centered
    },
    back: {
        fontSize: 20,
        textAlign: 'left'
    },
    contentContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
    },
    loadingContainer: {
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
