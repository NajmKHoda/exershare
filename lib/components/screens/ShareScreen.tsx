import { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { supabase } from '@/lib/supabase';
import { ThemeColors, useResolvedStyles, useThemeColors } from '@/lib/hooks/useThemeColors';
import ThemeText from '@/lib/components/theme/ThemeText';
import useSQLiteQuery from '@/lib/hooks/useSQLiteQuery';

export type EntityType = 'exercise' | 'workout' | 'routine';

interface ShareQRCodeProps {
    id: string;
    type: EntityType;
    entityTable: string;
}

export default function ShareScreen({ id, type, entityTable }: ShareQRCodeProps) {
    const colors = useThemeColors();
    const resolvedStyles = useResolvedStyles(styles);
    const [shareToken, setShareToken] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    
    const [queryResult] = useSQLiteQuery<{ name: string }>(
        `SELECT name FROM ${entityTable} WHERE id = ${id}`
    );
    const name = queryResult?.name ?? null;

    // Create share token
    useEffect(() => {
        async function createShareToken() {
            try {
                setLoading(true);
                
                // Verify entity exists
                if (name === null) {
                    throw new Error(`${type.charAt(0).toUpperCase() + type.slice(1)} not found`);
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
    }, [id, type, name]);

    if (loading) {
        return (
            <View style={resolvedStyles.container}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }
    
    if (error) {
        return (
            <View style={resolvedStyles.container}>
                <View style={resolvedStyles.errorContainer}>
                    <ThemeText style={resolvedStyles.errorText}>{error}</ThemeText>
                </View>
            </View>
        );
    }
    
    return (
        <View style={resolvedStyles.container}>
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
