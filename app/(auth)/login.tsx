import FormField from '@/lib/components/controls/FormField';
import ThemeText from '@/lib/components/theme/ThemeText';
import { ThemeColors, useResolvedStyles } from '@/lib/hooks/useThemeColors';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const resolvedStyles = useResolvedStyles(styles);

    return (
        <>
            <FormField name='username' value={username} onChange={setUsername} style={resolvedStyles.usernameField} />
            <FormField name='password' isPassword value={password} onChange={setPassword} />
            <Pressable style={resolvedStyles.button} onPress={() => {}}>
                <ThemeText style={resolvedStyles.buttonLabel}>Login</ThemeText>
            </Pressable>
            <Link style={resolvedStyles.signUpLink} href='/signup'>
                or sign up
            </Link>
        </>
    )
}

const styles = (colors: ThemeColors) => StyleSheet.create({
    usernameField: {
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