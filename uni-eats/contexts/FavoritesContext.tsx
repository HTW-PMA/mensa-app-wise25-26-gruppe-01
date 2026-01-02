import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { storage } from '@/utils/storage';

// Storage Keys
const STORAGE_KEY_FAVORITE_CANTEEN = 'favorite_canteen'; // Legacy - für Migration
const STORAGE_KEY_FAVORITE_CANTEENS = 'favorite_canteens'; // Neu - Multi-Canteen
const STORAGE_KEY_FAVORITE_MEALS = 'favorite_meals';

interface FavoritesContextType {
  favoriteCanteenIds: string[]; // Neue Struktur: Array statt Single Value
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
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

interface FavoritesProviderProps {
  children: ReactNode;
}

export function FavoritesProvider({ children }: FavoritesProviderProps) {
  const [favoriteCanteenIds, setFavoriteCanteenIds] = useState<string[]>([]);
  const [favoriteMealIds, setFavoriteMealIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Lade gespeicherte Favoriten beim Start
  useEffect(() => {
    loadFavorites();
  }, []);

  /**
   * Lädt Favoriten aus Storage und migriert das alte Format
   * Altes Format: favoriteCanteenId (string | null)
   * Neues Format: favoriteCanteenIds (string[])
   */
  const loadFavorites = async () => {
    try {
      const [savedCanteens, savedMeals, legacyCanteen] = await Promise.all([
        storage.get<string[]>(STORAGE_KEY_FAVORITE_CANTEENS),
        storage.get<string[]>(STORAGE_KEY_FAVORITE_MEALS),
        storage.get<string>(STORAGE_KEY_FAVORITE_CANTEEN), // Legacy
      ]);

      // Neue Struktur laden oder mit Legacy migrieren
      if (savedCanteens && Array.isArray(savedCanteens)) {
        setFavoriteCanteenIds(savedCanteens);
      } else if (legacyCanteen) {
        // Migration: Konvertiere altes Format zu neuem
        const migratedIds = [legacyCanteen];
        setFavoriteCanteenIds(migratedIds);
        // Speichere neues Format und lösche altes
        await Promise.all([
          storage.save(STORAGE_KEY_FAVORITE_CANTEENS, migratedIds),
          storage.remove(STORAGE_KEY_FAVORITE_CANTEEN),
        ]);
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

  /**
   * Fügt eine Mensa zu den Favoriten hinzu (nur wenn nicht bereits vorhanden)
   */
  const addFavoriteCanteen = async (canteenId: string) => {
    try {
      if (favoriteCanteenIds.includes(canteenId)) {
        return; // Bereits in Favoriten
      }
      const newCanteenIds = [...favoriteCanteenIds, canteenId];
      setFavoriteCanteenIds(newCanteenIds);
      await storage.save(STORAGE_KEY_FAVORITE_CANTEENS, newCanteenIds);
    } catch (error) {
      console.error('Error adding favorite canteen:', error);
    }
  };

  /**
   * Entfernt eine Mensa aus den Favoriten
   */
  const removeFavoriteCanteen = async (canteenId: string) => {
    try {
      const newCanteenIds = favoriteCanteenIds.filter(id => id !== canteenId);
      setFavoriteCanteenIds(newCanteenIds);
      await storage.save(STORAGE_KEY_FAVORITE_CANTEENS, newCanteenIds);
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
