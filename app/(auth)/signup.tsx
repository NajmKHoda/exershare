import FormField from '@/lib/components/controls/FormField';
import ThemeText from '@/lib/components/theme/ThemeText';
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
        const { error } =  await supabase.auth.signUp({
            email: email,
            password: password
        });
        setWaiting(false);

        if (!error) router.push('/'); 
    }

    return (
        <>
            <FormField name='username' value={username} onChange={setUsername} style={resolvedStyles.field} />
            <FormField name='email' keyboardType='email-address' value={email} onChange={setEmail} style={resolvedStyles.field} />
            <FormField name='password' isPassword value={password} onChange={setPassword} style={resolvedStyles.field} />

            <Pressable style={resolvedStyles.button} onPress={handleSignUp} disabled={waiting}>
                <ThemeText style={resolvedStyles.buttonLabel}>{waiting ? 'Signing up...' : 'Sign Up'}</ThemeText>
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
