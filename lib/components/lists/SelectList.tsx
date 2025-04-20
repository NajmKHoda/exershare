import { useThemeColors } from '@/lib/hooks/useThemeColors';
import SearchableList, { DataItem } from '@/lib/components/lists/SearchableList';
import ListItem from '@/lib/components/lists/ListItem';
import { ChevronRight } from 'lucide-react-native';

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
                    Icon={ ChevronRight }
                    iconColor={ colors.primary as string }
                    onPress={ () => onSelect?.(item) }
                />
            )}
            onItemAdd={ onItemAdd }
        />
    );
}