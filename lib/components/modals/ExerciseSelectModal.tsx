import { useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '@/lib/hooks/useThemeColors';
import TextButton from '../controls/TextButton';
import ThemeText from '../theme/ThemeText';
import RefList from '../lists/RefList';
import { DataItem } from '../lists/SearchableList';

interface Props {
    visible: boolean;
    onAdd?: (exercises: DataItem[]) => void;
    onClose?: () => void;
}

export default function ExerciseSelectModal({ visible, onAdd, onClose }: Props) {
    const colors = useThemeColors();
    const [selectedExercises, setSelectedExercises] = useState<DataItem[]>([]);

    return (
        <Modal 
            animationType='slide'
            transparent={ true }
            visible={ visible }
            onRequestClose={ onClose }
        >
            <SafeAreaView style={ styles.safeArea } edges={[ 'top' ]}>
                <View style={[ styles.container, { backgroundColor: colors.background } ]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <TextButton
                            label='Back'
                            symbol='chevron.left'
                            style={{ fontSize: 20 }}
                            onPress={ onClose } />
                        <TextButton
                            label='Add'
                            symbol='plus'
                            style={{ fontSize: 20 }}
                            onPress={ () => {
                                onAdd?.(selectedExercises);
                                setSelectedExercises([]);
                                onClose?.();
                            }} />
                    </View>
                    <ThemeText style={ styles.title }>Add Exercises</ThemeText>
                    <RefList
                        dbName='exercises'
                        selectedItems={ selectedExercises }
                        setSelectedItems={ setSelectedExercises } />
                </View>
            </SafeAreaView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        alignItems: 'stretch',
        paddingTop: 20,
        backgroundColor: 'rgba(0,0,0,0.5)'
    },

    container: {
        flex: 1,
        alignItems: 'stretch',
        gap: 10,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20
    },

    title: {
        textAlign: 'center',
        fontSize: 24,
        fontWeight: 'bold'
    }
});
