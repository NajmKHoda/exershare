import { useThemeColors } from '@/lib/hooks/useThemeColors';
import SearchableList, { DataItem } from '@/lib/components/lists/SearchableList';
import ListItem from '@/lib/components/lists/ListItem';

interface Props {
    data: DataItem[],
    onSelect?: (item: DataItem) => void,
    onItemAdd?: () => unknown
}

export default function SelectList({ data, onSelect, onItemAdd }: Props) {
    const colors = useThemeColors();

    return (
        <SearchableList
            data={ data }
            itemRenderer={ (item) => (
                <ListItem
                    label={ item.name }
                    symbolName='chevron.right'
                    symbolColor={ colors.primary as string }
                    onPress={ () => onSelect?.(item) }
                />
            )}
            onItemAdd={ onItemAdd }
        />
    );
}