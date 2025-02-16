import { View, Pressable, StyleSheet } from 'react-native';
import { SymbolView } from 'expo-symbols';
import ThemeText from '../../theme/ThemeText';
import { useThemeColors } from '@/lib/hooks/useThemeColors';
import { useReorderableDrag } from 'react-native-reorderable-list';
import { DataItem } from '../../lists/SearchableList';

interface Props {
    item: DataItem,
    index: number,
    onRemove: (index: number) => void
}

export default function ExerciseEntry({ item, index, onRemove }: Props) {
    const colors = useThemeColors();
    const drag = useReorderableDrag();

    return (
        <View style={[ styles.exerciseContainer, { backgroundColor: colors.backgroundSecondary } ]}>
            <Pressable style={ styles.exerciseDragHandle } onLongPress={ drag }>
                <SymbolView name='chevron.up.chevron.down' size={ 24 } tintColor={ colors.primary as string } />
                <ThemeText style={ styles.exerciseText }>{ item.name }</ThemeText>
            </Pressable>
            <Pressable onPress={() => onRemove(index)}>
                <SymbolView name='xmark.circle.fill' size={ 24 } tintColor={ colors.red as string } />
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
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
