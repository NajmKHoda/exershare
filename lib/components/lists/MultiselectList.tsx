import SearchableList, { DataItem } from './SearchableList';
import ListItem from './ListItem';
import { useThemeColors } from '@/lib/hooks/useThemeColors';
import { Circle, CircleCheck } from 'lucide-react-native';

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
                    Icon={ selectedIds.includes(item.id) ? CircleCheck : Circle }
                    iconColor={ colors.accent as string }
                    iconSize={ 27}
                    onPress={ () => toggleSelection(item) }
                />
            )}
        />
    );
}