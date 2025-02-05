import { useThemeColors } from '@/lib/hooks/useThemeColors';
import { View } from 'react-native';

export default function Separator() {
    const colors = useThemeColors();
    return <View style={{
        height: 3,
        alignSelf: 'stretch',
        backgroundColor: colors.separator
    }}/>
}