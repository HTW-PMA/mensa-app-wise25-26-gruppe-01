import { useState, useEffect, useCallback } from 'react';
import { useMeals } from './useMeals';
import { useMensas } from './useMensas';
import { storage } from '@/utils/storage';
import {
  filterMeals,
  filterCanteens,
  combineSearchResults,
  debounce,
  isValidSearchQuery,
  SearchResult,
} from '@/utils/searchHelpers';
import { Meal, Canteen } from '@/services/mensaApi';

const RECENT_SEARCHES_KEY = 'recent_searches';
const MAX_RECENT_SEARCHES = 10;

export interface UseSearchResult {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  results: SearchResult[];
  isLoading: boolean;
  isError: boolean;
  recentSearches: string[];
  addRecentSearch: (query: string) => void;
  removeRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
}

export function useSearch(): UseSearchResult {
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [filteredResults, setFilteredResults] = useState<SearchResult[]>([]);

  // Laden aller Mensas und Gerichte
  const allMeals = useMeals();
  const allMensas = useMensas();

  // Laden der zuletzt gesuchten Begriffe beim Start
  useEffect(() => {
    loadRecentSearches();
  }, []);

  // Filterlogik mit Debouncing
  const performSearch = useCallback(() => {
    if (!isValidSearchQuery(searchQuery)) {
      setFilteredResults([]);
      return;
    }

    const meals = allMeals.data || [];
    const mensas = allMensas.data || [];

    const filteredMeals = filterMeals(meals, searchQuery);
    const filteredMensas = filterCanteens(mensas, searchQuery);

    const results = combineSearchResults(filteredMeals, filteredMensas);
    setFilteredResults(results);
  }, [searchQuery, allMeals.data, allMensas.data]);

  // Debounced Search mit 500ms Verzögerung
  const debouncedSearch = useCallback(
    debounce(performSearch, 500),
    [performSearch]
  );

  useEffect(() => {
    if (searchQuery.length === 0) {
      setFilteredResults([]);
    } else {
      debouncedSearch();
    }
  }, [searchQuery, debouncedSearch]);

  const loadRecentSearches = async () => {
    const searches = await storage.get<string[]>(RECENT_SEARCHES_KEY);
    if (searches) {
      setRecentSearches(searches);
    }
  };

  const addRecentSearch = useCallback(async (query: string) => {
    if (!isValidSearchQuery(query)) return;

    const trimmedQuery = query.trim();
    const updated = [
      trimmedQuery,
      ...recentSearches.filter(s => s !== trimmedQuery),
    ].slice(0, MAX_RECENT_SEARCHES);

    setRecentSearches(updated);
    await storage.save(RECENT_SEARCHES_KEY, updated);
  }, [recentSearches]);

  const removeRecentSearch = useCallback(async (query: string) => {
    const updated = recentSearches.filter(s => s !== query);
    setRecentSearches(updated);
    await storage.save(RECENT_SEARCHES_KEY, updated);
  }, [recentSearches]);

  const clearRecentSearches = useCallback(async () => {
    setRecentSearches([]);
    await storage.remove(RECENT_SEARCHES_KEY);
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    results: filteredResults,
    isLoading: allMeals.isLoading || allMensas.isLoading,
    isError: allMeals.isError || allMensas.isError,
    recentSearches,
    addRecentSearch,
    removeRecentSearch,
    clearRecentSearches,
  };
}
