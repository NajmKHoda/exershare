import FormField from '@/lib/components/controls/FormField';
import Text from '@/lib/components/theme/Text';
import { ThemeColors, useResolvedStyles } from '@/lib/hooks/useThemeColors';
import { supabase } from '@/lib/supabase';
import { parse as parseURL, useLinkingURL } from 'expo-linking';
import { Link, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

export default function ForgotPasswordPage() {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [waiting, setWaiting] = useState(false);

    const url = useLinkingURL();
    const router = useRouter();
    const styles = useResolvedStyles(styleTemplate);

    useEffect(() => {
        if (!url) return;

        const { queryParams } = parseURL(url.replace('#', '?'));
        if (!queryParams) return;

        const { access_token, refresh_token } = queryParams;
        if (typeof access_token !== 'string' || typeof refresh_token !== 'string')
            return;

        supabase.auth.setSession({ access_token, refresh_token })
            .catch(error => console.error('Error setting session:', error));
    }, [url]);

    async function handlePasswordReset() {
        setError(null);
        setWaiting(true);
        if (newPassword !== confirmPassword) {
            setError("Passwords do not match.");
            setWaiting(false);
            return;
        }

        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) {
            setError("Error updating password.");
            console.error(error);
            setWaiting(false);
            return;
        }

        setWaiting(false);
        router.replace('/');
    }

    return (
        <>
            <Text>Enter your new password:</Text>
            {error && <Text style={styles.errorMessage}>{error}</Text>}
            <FormField
                name="new password"
                value={newPassword}
                onChange={setNewPassword}
                style={styles.item}
                isPassword
            />
            <FormField
                name="confirm password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                style={styles.item}
                isPassword
            />
            <Pressable
                style={[styles.button, waiting && styles.buttonDisabled]}
                onPress={handlePasswordReset}
                disabled={waiting}
            >
                <Text style={styles.buttonLabel}>{waiting ? '...' : 'Reset Password'}</Text>
            </Pressable>
            <Link style={styles.link} href="/login">
                Return to login
            </Link>
        </>
    );
}

const styleTemplate = (colors: ThemeColors) => StyleSheet.create({
    errorMessage: {
        color: colors.red,
        marginTop: 16,
    },
    item: {
        marginTop: 16,
    },
    button: {
        paddingVertical: 10,
        paddingHorizontal: 48,
        borderRadius: 10,
        backgroundColor: colors.accent,
        alignItems: 'center',
        marginTop: 48,
        marginBottom: 8
    },
    buttonDisabled: {
        backgroundColor: colors.gray,
    },
    buttonLabel: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    link: {
        color: colors.accent,
    }
});