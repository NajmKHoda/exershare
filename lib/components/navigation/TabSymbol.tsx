import { SFSymbol, SymbolView } from 'expo-symbols';

interface TabSymbolProps {
    focused: boolean,
    color: string,
    size: number
}

export default function TabSymbol(name: SFSymbol) {
    return ({ size }: TabSymbolProps) => (
        <SymbolView name={ name } size={ size } />
    );
}