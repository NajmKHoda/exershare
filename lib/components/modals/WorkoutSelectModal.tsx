import { StyleSheet, View } from 'react-native';
import TextButton from '../controls/TextButton';
import ThemeText from '../theme/ThemeText';
import { DataItem } from '../lists/SearchableList';
import SlideUpModal from './SlideUpModal';
import SelectList from '../lists/SelectList';
import useSQLiteQuery from '@/lib/hooks/useSQLiteQuery';

interface Props {
    visible: boolean;
    onSelect?: (workout: DataItem) => void;
    onClose?: () => void;
}

export default function WorkoutSelectModal({ visible, onSelect, onClose }: Props) {
    const [dbWorkouts] = useSQLiteQuery<DataItem>(
        `SELECT id, name FROM workouts ORDER BY name;`,
        true
    );

    return (
        <SlideUpModal visible={ visible } onClose={ onClose }>
            <View style={ styles.controls }>
                <TextButton
                    label='Back'
                    symbol='chevron.left'
                    style={{ fontSize: 20 }}
                    onPress={ onClose } />
            </View>
            <ThemeText style={ styles.title }>Select Workout</ThemeText>
            <SelectList
                data={ dbWorkouts }
                onSelect={workout => {
                    onSelect?.(workout); 
                    onClose?.();
                }} />
        </SlideUpModal>
    );
}

const styles = StyleSheet.create({
    controls: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center'
    },
    title: {
        textAlign: 'center',
        fontSize: 24,
        fontWeight: 'bold'
    }
});
