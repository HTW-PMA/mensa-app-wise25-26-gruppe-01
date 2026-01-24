/**
 * Central translation utilities for German to English
 * Used across the app for consistent translations
 */

import { getLocale } from '@/utils/i18n';

const isGermanLocale = () => getLocale() === 'de';

// Category translations
export const CATEGORY_TRANSLATIONS: Record<string, string> = {
  Vorspeisen: 'Starters',
  Hauptgerichte: 'Main Dishes',
  Beilagen: 'Sides',
  Salate: 'Salads',
  Suppen: 'Soups',
  Desserts: 'Desserts',
  Getränke: 'Drinks',
  Aktionen: 'Specials',
  Pasta: 'Pasta',
  Pizza: 'Pizza',
  Vegetarisch: 'Vegetarian',
  Vegan: 'Vegan',
  Fleischgerichte: 'Meat Dishes',
  Fischgerichte: 'Fish Dishes',
  Tagesangebot: 'Daily Special',
  Wok: 'Wok',
  Grill: 'Grill',
  Snacks: 'Snacks',
  Frühstück: 'Breakfast',
};

// Property/Badge translations
export const BADGE_TRANSLATIONS: Record<string, string> = {
  Vegan: 'Vegan',
  Vegetarisch: 'Vegetarian',
  'Gelber Ampelpunkt': 'Medium CO2',
  'Grüner Ampelpunkt': 'Low CO2',
  'Roter Ampelpunkt': 'High CO2',
  Bio: 'Organic',
  Glutenfrei: 'Gluten-free',
  Laktosefrei: 'Lactose-free',
  Regional: 'Regional',
  Nachhaltig: 'Sustainable',
  Fairtrade: 'Fairtrade',
  Klimafreundlich: 'Climate-friendly',
  Schweinefleisch: 'Pork',
  Rindfleisch: 'Beef',
  Geflügel: 'Poultry',
  Fisch: 'Fish',
  Alkohol: 'Alcohol',
  Mensaclassic: 'Mensa Classic',
  Mensavital: 'Mensa Vital',
};

// Price type translations
export const PRICE_TYPE_TRANSLATIONS: Record<string, string> = {
  Studierende: 'Students',
  Angestellte: 'Employees',
  Gäste: 'Guests',
  Bedienstete: 'Staff',
  Mitarbeiter: 'Employees',
};

// Allergen translations (name displayed to user)
export const ALLERGEN_TRANSLATIONS: Record<string, string> = {
  Erdnüsse: 'Peanuts',
  Erdnuss: 'Peanut',
  Gluten: 'Gluten',
  Weizen: 'Wheat',
  Roggen: 'Rye',
  Gerste: 'Barley',
  Hafer: 'Oats',
  Dinkel: 'Spelt',
  Milch: 'Milk',
  Laktose: 'Lactose',
  Ei: 'Egg',
  Eier: 'Eggs',
  Fisch: 'Fish',
  Krebstiere: 'Crustaceans',
  Weichtiere: 'Molluscs',
  Schalenfrüchte: 'Tree Nuts',
  Nüsse: 'Nuts',
  Mandeln: 'Almonds',
  Haselnüsse: 'Hazelnuts',
  Walnüsse: 'Walnuts',
  Cashewnüsse: 'Cashews',
  Pistazien: 'Pistachios',
  Sesam: 'Sesame',
  Soja: 'Soy',
  Sellerie: 'Celery',
  Senf: 'Mustard',
  Lupine: 'Lupin',
  Schwefeldioxid: 'Sulphur Dioxide',
  Sulfite: 'Sulphites',
};

// Additive translations
export const ADDITIVE_TRANSLATIONS: Record<string, string> = {
  konserviert: 'Preserved',
  Farbstoff: 'Colorant',
  Konservierungsstoff: 'Preservative',
  Antioxidationsmittel: 'Antioxidant',
  Geschmacksverstärker: 'Flavor Enhancer',
  geschwefelt: 'Sulphured',
  geschwärzt: 'Blackened',
  gewachst: 'Waxed',
  Phosphat: 'Phosphate',
  Süßungsmittel: 'Sweetener',
  Phenylalaninquelle: 'Phenylalanine Source',
  'mit Süßungsmittel': 'With Sweetener',
  'mit Farbstoff': 'With Colorant',
  'mit Konservierungsstoff': 'With Preservative',
  'mit Antioxidationsmittel': 'With Antioxidant',
  'mit Geschmacksverstärker': 'With Flavor Enhancer',
  'mit Phosphat': 'With Phosphate',
};

// Allergen category translations (for allergen info display)
export const ALLERGEN_CATEGORY_TRANSLATIONS: Record<string, string> = {
  Getreide: 'Cereals',
  Milchprodukte: 'Dairy',
  'Tierische Produkte': 'Animal Products',
  'Fisch & Meeresfrüchte': 'Fish & Seafood',
  'Nüsse & Samen': 'Nuts & Seeds',
  Hülsenfrüchte: 'Legumes',
  Gemüse: 'Vegetables',
  Gewürze: 'Spices',
  Zusatzstoffe: 'Additives',
  Sonstiges: 'Other',
};

// ============================================================================
// NEW: AI Chef specific translations
// ============================================================================

// Common UI elements
export const COMMON_TRANSLATIONS: Record<string, string> = {
  Mehr: 'More',
  kcal: 'kcal',
};

// AI Chef meal card translations
export const AI_MEAL_CARD_TRANSLATIONS: Record<string, string> = {
  'Achtung: Enthält': 'Warning: Contains',
  'Passt zu deiner Suche': 'Matches your search',
  'In deiner Nähe': 'Near you',
  'Einer deiner Favoriten!': 'One of your favorites!',
  'Gibt dir Energie': 'Gives you energy',
  'Leicht und gesund': 'Light and healthy',
  'Macht richtig satt': 'Very filling',
  'Schnell verfügbar': 'Quick meal',
};

// AI Chef messages
export const AI_CHEF_MESSAGE_TRANSLATIONS: Record<string, string> = {
  'Das waren schon alle passenden Gerichte, die ich heute gefunden habe.':
      'Those were all the matching dishes I found today.',
  'Wie kann ich dir helfen?': 'How can I help you?',
  'Worüber möchtest du mehr erfahren?': 'What would you like to know more about?',
  'Ich habe das Thema nicht verstanden. Frag mich etwas Neues!':
      'I did not understand the topic. Ask me something new!',
  'Perfekt! Hier sind deftige Gerichte von der HTW, die dir Energie geben:':
      'Perfect! Here are hearty dishes from HTW that give you energy:',
  'Hier sind frische Salate für dich:': 'Here are fresh salads for you:',
  'Alles klar!': 'Got it!',
};

// ============================================================================
// Translation helper functions
// ============================================================================

/**
 * Translate a category name from German to English
 */
export const translateCategory = (category: string): string => {
  if (isGermanLocale()) return category;
  return CATEGORY_TRANSLATIONS[category] || category;
};

/**
 * Translate a badge/property name from German to English
 */
export const translateBadge = (badge: string): string => {
  if (isGermanLocale()) return badge;
  return BADGE_TRANSLATIONS[badge] || badge;
};

/**
 * Translate a price type from German to English
 */
export const translatePriceType = (priceType: string): string => {
  if (isGermanLocale()) return priceType;
  return PRICE_TYPE_TRANSLATIONS[priceType] || priceType;
};

/**
 * Translate an allergen name from German to English
 */
export const translateAllergen = (allergen: string): string => {
  if (isGermanLocale()) return allergen;
  if (ALLERGEN_TRANSLATIONS[allergen]) {
    return ALLERGEN_TRANSLATIONS[allergen];
  }
  for (const [german, english] of Object.entries(ALLERGEN_TRANSLATIONS)) {
    if (allergen.toLowerCase().includes(german.toLowerCase())) {
      return allergen.replace(new RegExp(german, 'gi'), english);
    }
  }
  return allergen;
};

/**
 * Translate an additive name from German to English
 */
export const translateAdditive = (additive: string): string => {
  if (isGermanLocale()) return additive;
  if (ADDITIVE_TRANSLATIONS[additive]) {
    return ADDITIVE_TRANSLATIONS[additive];
  }
  for (const [german, english] of Object.entries(ADDITIVE_TRANSLATIONS)) {
    if (additive.toLowerCase().includes(german.toLowerCase())) {
      return additive.replace(new RegExp(german, 'gi'), english);
    }
  }
  return additive;
};

/**
 * Translate an allergen category from German to English
 */
export const translateAllergenCategory = (category: string): string => {
  if (isGermanLocale()) return category;
  return ALLERGEN_CATEGORY_TRANSLATIONS[category] || category;
};

/**
 * NEW: Translate common UI elements
 */
export const translateCommon = (text: string): string => {
  if (isGermanLocale()) return text;
  return COMMON_TRANSLATIONS[text] || text;
};

/**
 * NEW: Translate AI meal card text
 */
export const translateAIMealCard = (text: string): string => {
  if (isGermanLocale()) return text;
  return AI_MEAL_CARD_TRANSLATIONS[text] || text;
};

/**
 * NEW: Translate AI Chef messages
 */
export const translateAIChefMessage = (text: string): string => {
  if (isGermanLocale()) return text;
  return AI_CHEF_MESSAGE_TRANSLATIONS[text] || text;
};