import { useEffect, useState } from 'react';
import { TextInputProps } from 'react-native';
import { TextInput } from 'react-native-gesture-handler';

interface DeferredInputFieldProps extends TextInputProps {
    value: string;
    setValue: (value: string) => string;
    formatUnfocused?: (value: string) => string;
}

export default function DeferredInputField({
    value,
    setValue,
    formatUnfocused = (x) => x, // Identity function by default
    ...props
}: DeferredInputFieldProps) {
    const [curValue, setCurValue] = useState(value);
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => setCurValue(value), [value]);

    return (
        <TextInput
            value={isFocused ? curValue : formatUnfocused(curValue)}
            onChangeText={isFocused ? setCurValue : undefined}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
                setIsFocused(false);
                setCurValue(setValue(curValue))
            }}
            { ...props }
        />
    );
}