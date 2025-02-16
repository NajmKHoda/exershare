import SearchableList, { DataItem } from './SearchableList';
import ListItem from './ListItem';
import { useThemeColors } from '@/lib/hooks/useThemeColors';

interface Props {
    data: DataItem[];
    selectedItems: DataItem[];
    setSelectedItems: (selected: DataItem[]) => void;
}

export default function MultiselectList({ data, selectedItems, setSelectedItems }: Props) {
    const colors = useThemeColors();

    const selectedIds = selectedItems.map(item => item.id);

    function toggleSelection(item: DataItem) {
        if (selectedIds.includes(item.id)) {
            setSelectedItems(selectedItems.filter(x => x.id !== item.id));
        } else {
            setSelectedItems([...selectedItems, item]);
        }
    };

    return (
        <SearchableList
            data={ data }
            itemRenderer={(item) => (
                <ListItem
                    label={ item.name }
                    symbolName={ selectedIds.includes(item.id) ? 'checkmark.circle.fill' : 'circle' }
                    symbolColor={ colors.accent as string }
                    symbolSize={ 27}
                    onPress={ () => toggleSelection(item) }
                />
            )}
        />
    );
}