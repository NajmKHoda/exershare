import { createContext, useContext } from 'react';
import useSQLiteQuery from './useSQLiteQuery';
import { MeasurementSystem } from '../utils/units';

interface UserPreferences {
    units: MeasurementSystem
}

const DEFAULT_PREFERENCES: UserPreferences = {
    units: 'metric'
};

const UserPreferencesContext = createContext<UserPreferences>(DEFAULT_PREFERENCES);

export function UserPreferencesProvider({ children }: { children: React.ReactNode }) {
    const [query] = useSQLiteQuery<UserPreferences>(`SELECT units FROM user;`, false, 'user');

    return (
        <UserPreferencesContext.Provider value={query ?? DEFAULT_PREFERENCES}>
            {children}
        </UserPreferencesContext.Provider>
    );
}

export const useUserPreferences = () => useContext(UserPreferencesContext);