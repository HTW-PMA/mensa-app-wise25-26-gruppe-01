import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { storage } from '@/utils/storage';

const STORAGE_KEY_FAVORITE_CANTEEN = 'favorite_canteen';
const STORAGE_KEY_FAVORITE_MEALS = 'favorite_meals';

interface FavoritesContextType {
  favoriteCanteenId: string | null;
  favoriteMealIds: string[];
  isLoading: boolean;
  addFavoriteCanteen: (canteenId: string) => Promise<void>;
  removeFavoriteCanteen: () => Promise<void>;
  addFavoriteMeal: (mealId: string) => Promise<void>;
  removeFavoriteMeal: (mealId: string) => Promise<void>;
  isFavoriteCanteen: (canteenId: string) => boolean;
  isFavoriteMeal: (mealId: string) => boolean;
  toggleFavoriteCanteen: (canteenId: string) => Promise<void>;
  toggleFavoriteMeal: (mealId: string) => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

interface FavoritesProviderProps {
  children: ReactNode;
}

export function FavoritesProvider({ children }: FavoritesProviderProps) {
  const [favoriteCanteenId, setFavoriteCanteenId] = useState<string | null>(null);
  const [favoriteMealIds, setFavoriteMealIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Lade gespeicherte Favoriten beim Start
  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const [savedCanteen, savedMeals] = await Promise.all([
        storage.get<string>(STORAGE_KEY_FAVORITE_CANTEEN),
        storage.get<string[]>(STORAGE_KEY_FAVORITE_MEALS),
      ]);

      if (savedCanteen) {
        setFavoriteCanteenId(savedCanteen);
      }
      if (savedMeals && Array.isArray(savedMeals)) {
        setFavoriteMealIds(savedMeals);
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addFavoriteCanteen = async (canteenId: string) => {
    try {
      setFavoriteCanteenId(canteenId);
      await storage.save(STORAGE_KEY_FAVORITE_CANTEEN, canteenId);
    } catch (error) {
      console.error('Error saving favorite canteen:', error);
    }
  };

  const removeFavoriteCanteen = async () => {
    try {
      setFavoriteCanteenId(null);
      await storage.remove(STORAGE_KEY_FAVORITE_CANTEEN);
    } catch (error) {
      console.error('Error removing favorite canteen:', error);
    }
  };

  const addFavoriteMeal = async (mealId: string) => {
    try {
      const newMeals = [...favoriteMealIds, mealId];
      setFavoriteMealIds(newMeals);
      await storage.save(STORAGE_KEY_FAVORITE_MEALS, newMeals);
    } catch (error) {
      console.error('Error adding favorite meal:', error);
    }
  };

  const removeFavoriteMeal = async (mealId: string) => {
    try {
      const newMeals = favoriteMealIds.filter(id => id !== mealId);
      setFavoriteMealIds(newMeals);
      await storage.save(STORAGE_KEY_FAVORITE_MEALS, newMeals);
    } catch (error) {
      console.error('Error removing favorite meal:', error);
    }
  };

  const isFavoriteCanteen = (canteenId: string): boolean => {
    return favoriteCanteenId === canteenId;
  };

  const isFavoriteMeal = (mealId: string): boolean => {
    return favoriteMealIds.includes(mealId);
  };

  const toggleFavoriteCanteen = async (canteenId: string) => {
    if (isFavoriteCanteen(canteenId)) {
      await removeFavoriteCanteen();
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
        favoriteCanteenId,
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
