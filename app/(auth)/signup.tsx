import FormField from '@/lib/components/controls/FormField';
import ThemeText from '@/lib/components/theme/ThemeText';
import { ThemeColors, useResolvedStyles } from '@/lib/hooks/useThemeColors';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

export default function SignUp() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const resolvedStyles = useResolvedStyles(styles);

    return (
        <>
            <FormField name='username' value={username} onChange={setUsername} style={resolvedStyles.field} />
            <FormField name='email' keyboardType='email-address' value={email} onChange={setEmail} style={resolvedStyles.field} />
            <FormField name='password' isPassword value={password} onChange={setPassword} style={resolvedStyles.field} />

            <Pressable style={resolvedStyles.button} onPress={() => {}}>
                <ThemeText style={resolvedStyles.buttonLabel}>Sign Up</ThemeText>
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
