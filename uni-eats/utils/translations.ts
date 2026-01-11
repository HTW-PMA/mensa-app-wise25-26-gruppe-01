/**
 * Central translation utilities for German to English
 * Used across the app for consistent translations
 */

// Category translations
export const CATEGORY_TRANSLATIONS: Record<string, string> = {
  'Vorspeisen': 'Starters',
  'Hauptgerichte': 'Main Dishes',
  'Beilagen': 'Sides',
  'Salate': 'Salads',
  'Suppen': 'Soups',
  'Desserts': 'Desserts',
  'Getränke': 'Drinks',
  'Aktionen': 'Specials',
  'Pasta': 'Pasta',
  'Pizza': 'Pizza',
  'Vegetarisch': 'Vegetarian',
  'Vegan': 'Vegan',
  'Fleischgerichte': 'Meat Dishes',
  'Fischgerichte': 'Fish Dishes',
  'Tagesangebot': 'Daily Special',
  'Wok': 'Wok',
  'Grill': 'Grill',
  'Snacks': 'Snacks',
  'Frühstück': 'Breakfast',
};

// Property/Badge translations
export const BADGE_TRANSLATIONS: Record<string, string> = {
  'Vegan': 'Vegan',
  'Vegetarisch': 'Vegetarian',
  'Gelber Ampelpunkt': 'Medium CO₂',
  'Grüner Ampelpunkt': 'Low CO₂',
  'Roter Ampelpunkt': 'High CO₂',
  'Bio': 'Organic',
  'Glutenfrei': 'Gluten-free',
  'Laktosefrei': 'Lactose-free',
  'Regional': 'Regional',
  'Nachhaltig': 'Sustainable',
  'Fairtrade': 'Fairtrade',
  'Klimafreundlich': 'Climate-friendly',
  'Schweinefleisch': 'Pork',
  'Rindfleisch': 'Beef',
  'Geflügel': 'Poultry',
  'Fisch': 'Fish',
  'Alkohol': 'Alcohol',
  'Mensaclassic': 'Mensa Classic',
  'Mensavital': 'Mensa Vital',
};

// Price type translations
export const PRICE_TYPE_TRANSLATIONS: Record<string, string> = {
  'Studierende': 'Students',
  'Angestellte': 'Employees',
  'Gäste': 'Guests',
  'Bedienstete': 'Staff',
  'Mitarbeiter': 'Employees',
};

// Allergen translations (name displayed to user)
export const ALLERGEN_TRANSLATIONS: Record<string, string> = {
  'Erdnüsse': 'Peanuts',
  'Erdnuss': 'Peanut',
  'Gluten': 'Gluten',
  'Weizen': 'Wheat',
  'Roggen': 'Rye',
  'Gerste': 'Barley',
  'Hafer': 'Oats',
  'Dinkel': 'Spelt',
  'Milch': 'Milk',
  'Laktose': 'Lactose',
  'Ei': 'Egg',
  'Eier': 'Eggs',
  'Fisch': 'Fish',
  'Krebstiere': 'Crustaceans',
  'Weichtiere': 'Molluscs',
  'Schalenfrüchte': 'Tree Nuts',
  'Nüsse': 'Nuts',
  'Mandeln': 'Almonds',
  'Haselnüsse': 'Hazelnuts',
  'Walnüsse': 'Walnuts',
  'Cashewnüsse': 'Cashews',
  'Pistazien': 'Pistachios',
  'Sesam': 'Sesame',
  'Soja': 'Soy',
  'Sellerie': 'Celery',
  'Senf': 'Mustard',
  'Lupine': 'Lupin',
  'Schwefeldioxid': 'Sulphur Dioxide',
  'Sulfite': 'Sulphites',
};

// Additive translations
export const ADDITIVE_TRANSLATIONS: Record<string, string> = {
  'konserviert': 'Preserved',
  'Farbstoff': 'Colorant',
  'Konservierungsstoff': 'Preservative',
  'Antioxidationsmittel': 'Antioxidant',
  'Geschmacksverstärker': 'Flavor Enhancer',
  'geschwefelt': 'Sulphured',
  'geschwärzt': 'Blackened',
  'gewachst': 'Waxed',
  'Phosphat': 'Phosphate',
  'Süßungsmittel': 'Sweetener',
  'Phenylalaninquelle': 'Phenylalanine Source',
  'mit Süßungsmittel': 'With Sweetener',
  'mit Farbstoff': 'With Colorant',
  'mit Konservierungsstoff': 'With Preservative',
  'mit Antioxidationsmittel': 'With Antioxidant',
  'mit Geschmacksverstärker': 'With Flavor Enhancer',
  'mit Phosphat': 'With Phosphate',
};

// Allergen category translations (for allergen info display)
export const ALLERGEN_CATEGORY_TRANSLATIONS: Record<string, string> = {
  'Getreide': 'Cereals',
  'Milchprodukte': 'Dairy',
  'Tierische Produkte': 'Animal Products',
  'Fisch & Meeresfrüchte': 'Fish & Seafood',
  'Nüsse & Samen': 'Nuts & Seeds',
  'Hülsenfrüchte': 'Legumes',
  'Gemüse': 'Vegetables',
  'Gewürze': 'Spices',
  'Zusatzstoffe': 'Additives',
  'Sonstiges': 'Other',
};

/**
 * Translate a category name from German to English
 */
export const translateCategory = (category: string): string => {
  return CATEGORY_TRANSLATIONS[category] || category;
};

/**
 * Translate a badge/property name from German to English
 */
export const translateBadge = (badge: string): string => {
  return BADGE_TRANSLATIONS[badge] || badge;
};

/**
 * Translate a price type from German to English
 */
export const translatePriceType = (priceType: string): string => {
  return PRICE_TYPE_TRANSLATIONS[priceType] || priceType;
};

/**
 * Translate an allergen name from German to English
 */
export const translateAllergen = (allergen: string): string => {
  // Try exact match first
  if (ALLERGEN_TRANSLATIONS[allergen]) {
    return ALLERGEN_TRANSLATIONS[allergen];
  }
  // Try to find partial match
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
  // Try exact match first
  if (ADDITIVE_TRANSLATIONS[additive]) {
    return ADDITIVE_TRANSLATIONS[additive];
  }
  // Try to find partial match
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
  return ALLERGEN_CATEGORY_TRANSLATIONS[category] || category;
};
