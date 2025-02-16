import useSQLiteQuery from '@/lib/hooks/useSQLiteQuery';
import MultiselectList from './MultiselectList';
import { DataItem } from './SearchableList';

interface Props {
    dbName: string,
    selectedItems: DataItem[],
    setSelectedItems: (selected: DataItem[]) => void
}

export default function RefList({ dbName, selectedItems, setSelectedItems }: Props) {
    const [data] = useSQLiteQuery<{ id: number; name: string }>(
        `SELECT id, name FROM ${dbName} ORDER BY name;`
    , true);

    return (
        <MultiselectList
            data={ data }
            selectedItems={ selectedItems }
            setSelectedItems={ setSelectedItems } />
    );
};