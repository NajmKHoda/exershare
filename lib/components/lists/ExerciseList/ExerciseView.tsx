import { useThemeColors } from '@/lib/hooks/useThemeColors';
import { StyleSheet, View } from 'react-native';
import ThemeText from '../../theme/ThemeText';
import { Check, MoreHorizontal } from 'lucide-react-native';

interface Props {
    exercise: ExerciseInfo;
}

export default function ExerciseView({ exercise }: Props) {
    const themeColors = useThemeColors();

    const { name, completion } = exercise;

    let completionSymbol: React.ReactNode | undefined = undefined;
    switch (completion) {
        case 'complete':
            completionSymbol = <Check 
                strokeWidth={3}
                color={themeColors.green as string}
                size={22} />;
            break;
        case 'in-progress':
            completionSymbol = <MoreHorizontal 
                strokeWidth={3}
                color={themeColors.orange as string}
                size={22} />;
    }

    return (
        <View style={{
            backgroundColor: themeColors.backgroundSecondary,
            ...styles.container
        }}>
            <ThemeText style={ styles.name }>{ name }</ThemeText>
            { completionSymbol }
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        padding: 15,
        justifyContent: 'space-between',
        alignItems: 'center'
    },

    name: {
        fontSize: 20,
        lineHeight: 22
    }
})

export interface ExerciseInfo {
    name: string;
    completion: 'complete' | 'in-progress' | 'incomplete';
}