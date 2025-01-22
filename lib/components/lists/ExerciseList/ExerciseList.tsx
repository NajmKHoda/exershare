import { FlatList, PlatformColor, StyleSheet, View } from 'react-native'
import { Exercise } from '@/lib/data/Exercise';
import ExerciseView from './ExerciseView';

interface Props {
    exercises: Exercise[]
}

export default function ExerciseList({ exercises }: Props) {
    return (
        <FlatList
            data={ exercises }
            renderItem={ x => <ExerciseView exercise={ x.item } /> }
            keyExtractor={ exercise => exercise.id.toString() }
            ItemSeparatorComponent={ () => <View style={ styles.divider }/> }
            style={{ borderRadius: 10 }}/>
    );
}

const styles = StyleSheet.create({
    divider: {
        height: 2,
        backgroundColor: PlatformColor('opaqueSeparator')
    }
});