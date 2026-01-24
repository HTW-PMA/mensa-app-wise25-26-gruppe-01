import React, {
    createContext,
    useContext,
    useMemo,
    ReactNode,
} from 'react';

import { Canteen, Meal, University } from '@/services/mensaApi';
import { useProfile } from '@/contexts/ProfileContext';

// ============================================================================
// TYPES
// ============================================================================

export interface UserPreferences {
    allergies?: string[];
    dietType?: 'none' | 'vegetarian' | 'vegan' | 'pescatarian';
}

export interface AIChefContextValue {
    // Core data
    mensas: Canteen[];
    meals: Meal[];
    universities?: University[];

    // User preferences
    userPreferences?: UserPreferences;

    // 🔥 NEW: University from profile (highest priority)
    preferredUniversityId?: string;
    preferredUniversityName?: string;

    // Favorites (optional)
    favoriteCanteenIds?: string[];
    favoriteMealIds?: string[];

    // Status flags
    isReady: boolean;
}

const AIChefContext = createContext<AIChefContextValue | undefined>(undefined);

// ============================================================================
// PROVIDER
// ============================================================================

interface AIChefProviderProps {
    children: ReactNode;
    mensas: Canteen[];
    meals: Meal[];
    universities?: University[];
    favoriteCanteenIds?: string[];
    favoriteMealIds?: string[];
}

export function AIChefProvider({
                                   children,
                                   mensas,
                                   meals,
                                   universities,
                                   favoriteCanteenIds,
                                   favoriteMealIds,
                               }: AIChefProviderProps) {
    const { profile, isLoading: isProfileLoading } = useProfile();

    const value = useMemo<AIChefContextValue>(() => {
        const userPreferences: UserPreferences | undefined = profile
            ? {
                dietType: profile.dietType,
                allergies: profile.allergies,
            }
            : undefined;

        return {
            mensas,
            meals,
            universities,

            userPreferences,

            // 🔥 University from profile
            preferredUniversityId: profile?.universityId,
            preferredUniversityName: profile?.universityName,

            favoriteCanteenIds,
            favoriteMealIds,

            isReady: !isProfileLoading && mensas.length > 0 && meals.length > 0,
        };
    }, [
        mensas,
        meals,
        universities,
        profile,
        isProfileLoading,
        favoriteCanteenIds,
        favoriteMealIds,
    ]);

    return (
        <AIChefContext.Provider value={value}>
            {children}
        </AIChefContext.Provider>
    );
}

// ============================================================================
// HOOK
// ============================================================================

export function useAIChefContext(): AIChefContextValue {
    const context = useContext(AIChefContext);
    if (!context) {
        throw new Error('useAIChefContext must be used within an AIChefProvider');
    }
    return context;
}
