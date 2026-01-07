import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { storage } from '@/utils/storage';
import { useAuth } from '@/contexts/AuthContext';

// Storage Keys - werden dynamisch mit User-ID generiert
const getStorageKeyCanteens = (userId: string) => `favorites_canteens_${userId}`;
const getStorageKeyMeals = (userId: string) => `favorites_meals_${userId}`;

// Legacy Keys für Migration
const LEGACY_STORAGE_KEY_CANTEEN = 'favorite_canteen';
const LEGACY_STORAGE_KEY_CANTEENS = 'favorite_canteens';
const LEGACY_STORAGE_KEY_MEALS = 'favorite_meals';

interface FavoritesContextType {
  favoriteCanteenIds: string[];
  favoriteMealIds: string[];
  isLoading: boolean;
  addFavoriteCanteen: (canteenId: string) => Promise<void>;
  removeFavoriteCanteen: (canteenId: string) => Promise<void>;
  addFavoriteMeal: (mealId: string) => Promise<void>;
  removeFavoriteMeal: (mealId: string) => Promise<void>;
  isFavoriteCanteen: (canteenId: string) => boolean;
  isFavoriteMeal: (mealId: string) => boolean;
  toggleFavoriteCanteen: (canteenId: string) => Promise<void>;
  toggleFavoriteMeal: (mealId: string) => Promise<void>;
  clearFavorites: () => void;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

interface FavoritesProviderProps {
  children: ReactNode;
}

export function FavoritesProvider({ children }: FavoritesProviderProps) {
  const { user } = useAuth();
  const [favoriteCanteenIds, setFavoriteCanteenIds] = useState<string[]>([]);
  const [favoriteMealIds, setFavoriteMealIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Lädt Favoriten für den aktuellen User aus Storage
   */
  const loadFavorites = useCallback(async (userId: string) => {
    setIsLoading(true);
    try {
      const [savedCanteens, savedMeals] = await Promise.all([
        storage.get<string[]>(getStorageKeyCanteens(userId)),
        storage.get<string[]>(getStorageKeyMeals(userId)),
      ]);

      // Lade user-spezifische Favoriten
      if (savedCanteens && Array.isArray(savedCanteens)) {
        setFavoriteCanteenIds(savedCanteens);
      } else {
        setFavoriteCanteenIds([]);
      }

      if (savedMeals && Array.isArray(savedMeals)) {
        setFavoriteMealIds(savedMeals);
      } else {
        setFavoriteMealIds([]);
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
      setFavoriteCanteenIds([]);
      setFavoriteMealIds([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Setzt Favoriten zurück (beim Logout)
   */
  const clearFavorites = useCallback(() => {
    setFavoriteCanteenIds([]);
    setFavoriteMealIds([]);
  }, []);

  // Lade Favoriten wenn User sich ändert
  useEffect(() => {
    if (user?.id) {
      loadFavorites(user.id);
    } else {
      // Kein User = keine Favoriten
      clearFavorites();
      setIsLoading(false);
    }
  }, [user?.id, loadFavorites, clearFavorites]);

  /**
   * Fügt eine Mensa zu den Favoriten hinzu (nur wenn nicht bereits vorhanden)
   */
  const addFavoriteCanteen = async (canteenId: string) => {
    if (!user?.id) return;
    try {
      if (favoriteCanteenIds.includes(canteenId)) {
        return; // Bereits in Favoriten
      }
      const newCanteenIds = [...favoriteCanteenIds, canteenId];
      setFavoriteCanteenIds(newCanteenIds);
      await storage.save(getStorageKeyCanteens(user.id), newCanteenIds);
    } catch (error) {
      console.error('Error adding favorite canteen:', error);
    }
  };

  /**
   * Entfernt eine Mensa aus den Favoriten
   */
  const removeFavoriteCanteen = async (canteenId: string) => {
    if (!user?.id) return;
    try {
      const newCanteenIds = favoriteCanteenIds.filter(id => id !== canteenId);
      setFavoriteCanteenIds(newCanteenIds);
      await storage.save(getStorageKeyCanteens(user.id), newCanteenIds);
    } catch (error) {
      console.error('Error removing favorite canteen:', error);
    }
  };

  const addFavoriteMeal = async (mealId: string) => {
    if (!user?.id) return;
    try {
      const newMeals = [...favoriteMealIds, mealId];
      setFavoriteMealIds(newMeals);
      await storage.save(getStorageKeyMeals(user.id), newMeals);
    } catch (error) {
      console.error('Error adding favorite meal:', error);
    }
  };

  const removeFavoriteMeal = async (mealId: string) => {
    if (!user?.id) return;
    try {
      const newMeals = favoriteMealIds.filter(id => id !== mealId);
      setFavoriteMealIds(newMeals);
      await storage.save(getStorageKeyMeals(user.id), newMeals);
    } catch (error) {
      console.error('Error removing favorite meal:', error);
    }
  };

  const isFavoriteCanteen = (canteenId: string): boolean => {
    return favoriteCanteenIds.includes(canteenId);
  };

  const isFavoriteMeal = (mealId: string): boolean => {
    return favoriteMealIds.includes(mealId);
  };

  /**
   * Togglet eine Mensa: Fügt sie zu Favoriten hinzu oder entfernt sie
   */
  const toggleFavoriteCanteen = async (canteenId: string) => {
    if (isFavoriteCanteen(canteenId)) {
      await removeFavoriteCanteen(canteenId);
    } else {
      await addFavoriteCanteen(canteenId);
    }
  };

  const toggleFavoriteMeal = async (mealId: string) => {
    if (isFavoriteMeal(mealId)) {
      await removeFavoriteMeal(mealId);
    } else {
      await addFavoriteMeal(mealId);
    }
  };

  return (
    <FavoritesContext.Provider
      value={{
        favoriteCanteenIds,
        favoriteMealIds,
        isLoading,
        addFavoriteCanteen,
        removeFavoriteCanteen,
        addFavoriteMeal,
        removeFavoriteMeal,
        isFavoriteCanteen,
        isFavoriteMeal,
        toggleFavoriteCanteen,
        toggleFavoriteMeal,
        clearFavorites,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavoritesContext(): FavoritesContextType {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavoritesContext must be used within a FavoritesProvider');
  }
  return context;
}
