import FormField from '@/lib/components/controls/FormField';
import Text from '@/lib/components/theme/Text';
import { ThemeColors, useResolvedStyles } from '@/lib/hooks/useThemeColors';
import { supabase } from '@/lib/supabase';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

export default function SignUp() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [waiting, setWaiting] = useState(false);
    const router = useRouter();

    const resolvedStyles = useResolvedStyles(styles);

    async function handleSignUp() {
        setWaiting(true);
        const { error: authError } =  await supabase.auth.signUp({
            email: email,
            password: password
        });
        if (authError) {
            setWaiting(false);
            return;
        }

        const { error: usernameError } = await supabase.from('profiles').insert({ username })
        if (usernameError) {
            setWaiting(false);
            return;
        }

        router.push('/');
    }

    return (
        <>
            <FormField name='username' value={username} onChange={setUsername} style={resolvedStyles.field} />
            <FormField name='email' keyboardType='email-address' value={email} onChange={setEmail} style={resolvedStyles.field} />
            <FormField name='password' isPassword value={password} onChange={setPassword} style={resolvedStyles.field} />

            <Pressable style={resolvedStyles.button} onPress={handleSignUp} disabled={waiting}>
                <Text style={resolvedStyles.buttonLabel}>{waiting ? 'Signing up...' : 'Sign Up'}</Text>
            </Pressable>
            <Link style={resolvedStyles.link} href="/login">
                or log in
            </Link>
        </>
    )
}

const styles = (colors: ThemeColors) => StyleSheet.create({
    field: {
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
    link: {
        color: colors.accent,
    }
});
