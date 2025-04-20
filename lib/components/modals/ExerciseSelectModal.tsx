import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import TextButton from '../controls/TextButton';
import ThemeText from '../theme/ThemeText';
import useSQLiteQuery from '@/lib/hooks/useSQLiteQuery';
import MultiselectList from '../lists/MultiselectList';
import { DataItem } from '../lists/SearchableList';
import SlideUpModal from './SlideUpModal';
import { Plus } from 'lucide-react-native';

interface Props {
    visible: boolean;
    onAdd?: (exercises: DataItem[]) => void;
    onClose?: () => void;
}

export default function ExerciseSelectModal({ visible, onAdd, onClose }: Props) {
    const [selectedExercises, setSelectedExercises] = useState<DataItem[]>([]);
    const [dbExercises] = useSQLiteQuery<DataItem>(
        `SELECT id, name FROM exercises ORDER BY name;`,
        true
    );

    return (
        <SlideUpModal
            visible={ visible}
            onClose={ onClose }
            title="Add Exercises"
            additionalControls={
                <TextButton
                    label='Add'
                    Icon={Plus}
                    style={{ fontSize: 20 }}
                    onPress={() => {
                        onAdd?.(selectedExercises);
                        setSelectedExercises([]);
                        onClose?.();
                    }} />
            }
        >
            <MultiselectList
                data={ dbExercises }
                selectedItems={ selectedExercises }
                setSelectedItems={ setSelectedExercises } />
        </SlideUpModal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'stretch',
        gap: 10,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20
    },

    controls: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },

    title: {
        textAlign: 'center',
        fontSize: 24,
        fontWeight: 'bold'
    }
});
