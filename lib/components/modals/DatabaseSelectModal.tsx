import { DataItem } from '../lists/SearchableList';
import SlideUpModal from './SlideUpModal';
import SelectList from '../lists/SelectList';
import useSQLiteQuery from '@/lib/hooks/useSQLiteQuery';

interface Props {
    visible: boolean;
    dbName: string;
    onSelect?: (item: DataItem) => void;
    onClose?: () => void;
    title?: string;
}

export default function DatabaseSelectModal({ visible, dbName, onSelect, onClose, title }: Props) {
    const [data] = useSQLiteQuery<DataItem>(
        `SELECT id, name FROM ${ dbName } ORDER BY name;`,
        true
    );

    return (
        <SlideUpModal visible={ visible } onClose={ onClose } title={ title || 'Select Item' }>
            <SelectList
                data={ data }
                onSelect={ item => {
                    onSelect?.(item);
                    onClose?.();
                }} />
        </SlideUpModal>
    );
}