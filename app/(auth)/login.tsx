import FormField from '@/lib/components/controls/FormField';
import Text from '@/lib/components/theme/Text';
import { ThemeColors, useResolvedStyles } from '@/lib/hooks/useThemeColors';
import { supabase } from '@/lib/supabase';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet } from 'react-native';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [waiting, setWaiting] = useState(false);
    const router = useRouter();

    const styles = useResolvedStyles(stylesTemplate);

    async function handleLogin() {
        setWaiting(true);
        const { error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        setWaiting(false);
        
        if (!error) router.push('/');
    }

    function handleForgotPassword() {
        Alert.prompt(
            'Forgot Password',
            'Please enter your email address to reset your password.',
            async (email) => {
                if (!email) return;
                setWaiting(true);
                const { error } = await supabase.auth.resetPasswordForEmail(
                    email, { redirectTo: 'exershare://forgot-password' }
                );
                setWaiting(false);
                if (error) {
                    Alert.alert('Error', error.message);
                } else {
                    Alert.alert('Success', 'A password reset link has been sent to your email.');
                }
            },
            'plain-text',
            '',
            'email-address'
        );
    }

    return (
        <>
            <FormField name='email address' keyboardType='email-address' value={email} onChange={setEmail} style={styles.emailField} />
            <FormField name='password' isPassword value={password} onChange={setPassword} />
            <Pressable style={styles.forgotPasswordContainer} onPress={handleForgotPassword}>
                <Text style={styles.forgotPassword}>Forgot password?</Text>
            </Pressable>
            <Pressable
                style={[styles.button, waiting && styles.buttonDisabled]} 
                onPress={handleLogin}
                disabled={waiting}
            >
                <Text style={styles.buttonLabel}>Login</Text>
            </Pressable>
            <Link style={styles.signUpLink} href='/signup'>
                or sign up
            </Link>
        </>
    )
}

const stylesTemplate = (colors: ThemeColors) => StyleSheet.create({
    emailField: {
        marginBottom: 16,
    },
    forgotPasswordContainer: {
        alignSelf: 'flex-start',
        marginTop: 8,
    },
    forgotPassword: {
        color: colors.accent,
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
    signUpLink: {
        color: colors.accent,
    }
});