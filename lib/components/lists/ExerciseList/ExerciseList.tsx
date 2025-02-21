import { FlatList, PlatformColor, StyleSheet, View } from 'react-native'
import ExerciseView, { ExerciseInfo } from './ExerciseView';

interface Props {
    exercises: ExerciseInfo[]
}

export default function ExerciseList({ exercises }: Props) {
    return (
        <FlatList
            data={ exercises }
            renderItem={ x => <ExerciseView exercise={ x.item } /> }
            keyExtractor={ (_, i) => i.toString() }
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