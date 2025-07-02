import { View, Pressable, StyleSheet } from 'react-native';
import Text from '../../theme/Text';
import { ThemeColors, useResolvedStyles, useThemeColors } from '@/lib/hooks/useThemeColors';
import { useReorderableDrag } from 'react-native-reorderable-list';
import { DataItem } from '../../lists/SearchableList';
import { MoveVertical, XCircle } from 'lucide-react-native';

interface Props {
    item: DataItem,
    index: number,
    onRemove: (index: number) => void
}

export default function ReorderableEntry({ item, index, onRemove }: Props) {
    const colors = useThemeColors();
    const resolvedStyles = useResolvedStyles(styles);
    const drag = useReorderableDrag();

    return (
        <View style={resolvedStyles.exerciseContainer}>
            <Pressable style={resolvedStyles.exerciseDragHandle} onLongPress={drag}>
                <MoveVertical size={24} color={colors.primary as string} />
                <Text style={resolvedStyles.exerciseText}>{item.name}</Text>
            </Pressable>
            <Pressable onPress={() => onRemove(index)}>
                <XCircle size={24} color={colors.red as string} />
            </Pressable>
        </View>
    );
}

const styles = (colors: ThemeColors) => StyleSheet.create({
    exerciseContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12
    },

    exerciseDragHandle: {
        flex: 1,
        flexDirection: 'row',
        gap: 10
    },

    exerciseText: {
        fontSize: 20
    }
});
