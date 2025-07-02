import SearchableList, { DataItem } from './SearchableList';
import ListItem from './ListItem';
import { useThemeColors } from '@/lib/hooks/useThemeColors';
import { Circle, CircleCheck } from 'lucide-react-native';
import StandardList from './StandardList';

interface Props {
    data: DataItem[];
    selectedItems: DataItem[];
    setSelectedItems: (selected: DataItem[]) => void;
    search?: boolean;
}

export default function MultiselectList({ data, selectedItems, setSelectedItems, search=true }: Props) {
    const colors = useThemeColors();

    const selectedIds = selectedItems.map(item => item.id);

    function toggleSelection(item: DataItem) {
        if (selectedIds.includes(item.id)) {
            setSelectedItems(selectedItems.filter(x => x.id !== item.id));
        } else {
            setSelectedItems([...selectedItems, item]);
        }
    };

    return ( search ?
        <SearchableList
            data={ data }
            itemRenderer={(item) => (
                <ListItem
                    label={ item.name }
                    Icon={ selectedIds.includes(item.id) ? CircleCheck : Circle }
                    iconColor={ colors.accent as string }
                    iconSize={ 27}
                    onPress={ () => toggleSelection(item) }
                />
            )}
        /> :
        <StandardList
            data={ data }
            keyExtractor={({ id }) => id}
            renderItem={({ item }) => (
                <ListItem
                    label={ item.name }
                    Icon={ selectedIds.includes(item.id) ? CircleCheck : Circle }
                    iconColor={ colors.accent as string }
                    iconSize={ 27 }
                    onPress={() => toggleSelection(item)}
                />
            )}
            scrollEnabled={false}
        />
    );
}