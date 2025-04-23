import { useState } from 'react';
import { ThemeColors, useResolvedStyles, useThemeColors } from '@/lib/hooks/useThemeColors';
import { StyleSheet, TextInput, View } from 'react-native';
import { Search } from 'lucide-react-native';

interface Props {
    value?: string,
    onChange?: (value: string) => unknown
}

export default function SearchField({ value, onChange }: Props) {
    const colors = useThemeColors();
    const [isFocused, setIsFocused] = useState(false);
    const resolvedStyles = useResolvedStyles(styles);

    return (
        <View style={{ ...resolvedStyles.container, borderBottomColor: isFocused ? colors.accent : colors.primary }}>
            <Search
                size={24}
                color={(isFocused ? colors.accent : colors.primary) as string}
            />
            <TextInput
                style={resolvedStyles.input}
                placeholder='Search...'
                value={value}
                onChangeText={onChange}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
            />
        </View>
    );
}

const styles = (colors: ThemeColors) => StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 5,
        paddingBottom: 5,
        borderBottomWidth: 3,
        overflow: 'hidden'
    },
    input: {
        fontSize: 20,
        lineHeight: 24,
        paddingVertical: 0,
        color: colors.primary
    }
});