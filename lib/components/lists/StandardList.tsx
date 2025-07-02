import { ThemeColors, useResolvedStyles } from '@/lib/hooks/useThemeColors';
import { standardOutline, standardShadow } from '@/lib/standardStyles';
import { FlatListProps, StyleSheet } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import Separator from './elements/Separator';

export default function StandardList<T>(props: FlatListProps<T>) {
    const styles = useResolvedStyles(stylesTemplate);

    return (
        <FlatList
            style={styles.list}
            contentContainerStyle={styles.listContainer}
            ItemSeparatorComponent={Separator}
            {...props}
        />
    )
}

const stylesTemplate = (colors: ThemeColors) => StyleSheet.create({
    list: {
        padding: standardShadow.shadowRadius,
    },
    listContainer: {
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
        backgroundColor: colors.backgroundSecondary,

        ...standardShadow,
        ...standardOutline(colors),
    }
})