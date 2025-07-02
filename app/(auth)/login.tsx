import FormField from '@/lib/components/controls/FormField';
import Text from '@/lib/components/theme/Text';
import { ThemeColors, useResolvedStyles } from '@/lib/hooks/useThemeColors';
import { supabase } from '@/lib/supabase';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [waiting, setWaiting] = useState(false);
    const router = useRouter();

    const resolvedStyles = useResolvedStyles(styles);

    async function handleLogin() {
        setWaiting(true);
        const { error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        setWaiting(false);
        
        if (!error) router.push('/');
    }

    return (
        <>
            <FormField name='email address' keyboardType='email-address' value={email} onChange={setEmail} style={resolvedStyles.emailField} />
            <FormField name='password' isPassword value={password} onChange={setPassword} />
            <Pressable style={resolvedStyles.button} onPress={handleLogin} disabled={waiting}>
                <Text style={resolvedStyles.buttonLabel}>{waiting ? 'Logging in...' : 'Login'}</Text>
            </Pressable>
            <Link style={resolvedStyles.signUpLink} href='/signup'>
                or sign up
            </Link>
        </>
    )
}

const styles = (colors: ThemeColors) => StyleSheet.create({
    emailField: {
        marginBottom: 16,
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
    buttonLabel: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    signUpLink: {
        color: colors.accent,
    }
});