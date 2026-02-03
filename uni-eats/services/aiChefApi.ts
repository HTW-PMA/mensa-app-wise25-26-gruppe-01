

import { Canteen, Meal, University } from '@/services/mensaApi';
import { t } from '@/utils/i18n';
import { calculateDistance } from '@/utils/locationUtils';

const DEBUG_AI_CHEF = true;

function log(...args: any[]) {
    if (DEBUG_AI_CHEF) {
        console.log(...args);
    }
}

const API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY || '';
const API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.1-8b-instant';

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

const SCORING_WEIGHTS = {
    FAVORITE_MEAL: 100,
    FAVORITE_CANTEEN: 50,
    MOOD_KEYWORD: 60,           // ⬆️ Increased from 3 to 60
    MOOD_CATEGORY: 70,          // ⬆️ Increased from 5 to 70
    MOOD_AVOID_CAT: -80,        // ⬇️ Increased penalty from -5 to -80
    MOOD_AVOID_KEY: -100,       // ⬇️ Increased penalty from -10 to -100
    NEARBY: 30,
    CLOSER_BONUS: 10,
    QUERY_MATCH: 10,
};


// ============================================================================
// TYPES
// ============================================================================

export interface UserPreferences {
    allergies?: string[];
    dietType?: 'vegetarian' | 'vegan' | 'pescatarian' | 'none';
}

export interface AIChefSemanticFilters {
    category?: 'salad' | 'soup' | 'pasta' | 'bowl' | 'main' | 'dessert';
    temperature?: 'warm' | 'cold';
    heaviness?: 'light' | 'heavy';
}

export interface AIChefContext {
    mensas: Canteen[];
    meals: Meal[];
    favoriteCanteenIds?: string[];
    favoriteMealIds?: string[];
    userPreferences?: UserPreferences;
    userLocation?: { latitude: number; longitude: number };
    contextStatus?: { isLoadingContext?: boolean; isErrorContext?: boolean };
    universities?: University[];
    lastIntent?: 'question' | 'recommendation' | 'unknown';
    lastTopic?: string;
    preferredUniversityId?: string;
    preferredUniversityName?: string;
    preferredUniversityShort?: string;
}

export type AIChefHistoryMessage = { role: 'user' | 'assistant'; content: string };

export type AIChefResponse = {
    text: string;
    recommendedMeals?: Array<{ meal: Meal; reason: string }>;
};

// LLM Response Structure
interface LLMIntentResponse {
    intent: 'question' | 'recommendation' | 'affirmation' | 'smalltalk';
    search_params: {
        query: string | null;
        mood: 'energy' | 'large' | 'light' | 'fast' | null;
        university_target: string | null;
        diet_filter: 'vegan' | 'vegetarian' | 'pescatarian' | null;
        max_price?: number | null;
    };
    detected_language: 'de' | 'en';
    reply_text: string;
    llmCrashed?: boolean; // 👈 NEU
}

// ============================================================================
// CONFIGURATION MAPS
// ============================================================================

type MealCategory = NonNullable<AIChefSemanticFilters['category']>;

const CATEGORY_KEYWORDS: Record<MealCategory, string[]> = {
    salad: ['salat', 'salatschale'],
    soup: ['suppe', 'eintopf', 'bruehe'],
    pasta: ['pasta', 'nudel', 'nudeln'],
    bowl: ['bowl'],
    main: ['gericht', 'hauptgericht'],
    dessert: ['dessert', 'nachspeise'],
};

// University to Canteen Mapping (normalized names for matching)
const UNI_MENSAS: Record<string, string[]> = {
    HTW: ['wilhelminenhof', 'treskowallee', 'htw'],
    FU: ['dahlem', 'silberlaube', 'fu'],
    TU: ['marchstr', 'hauptgebaeude', 'hauptgebäude', 'tu'],
    ASH: ['hellersdorf', 'ash'],
    HWR: ['lichtenberg', 'schöneberg', 'hwr'],
    HU: ['adlershof', 'nord', 'süd', 'hu'],
    BHT: ['luxemburger', 'platanenstraße', 'bht'],
};

// Mood to Food Category Mapping
const MOOD_PREFERENCES: Record<string, {
    keywords: string[];
    categories: string[];
    avoidCategories?: string[];
    avoidKeywords?: string[];
}> = {
    energy: {
        keywords: ['schnitzel', 'braten', 'burger', 'meat', 'fleisch', 'steak', 'würstchen', 'chicken', 'hähnchen', 'rind', 'schwein'],
        categories: ['hauptgericht', 'grill', 'main course', 'fleischgerichte', 'meat dishes'], // Fixed typo: fleischgerichte
        avoidCategories: ['salat', 'dessert', 'salad'],
        avoidKeywords: ['salat', 'salad', 'bowl'],
    },
    light: {
        keywords: ['salat', 'bowl', 'gemüse', 'vegetables', 'smoothie', 'soup', 'suppe'],
        categories: ['salat', 'bowl', 'vegetarisch', 'vegan', 'salad'],
        avoidCategories: ['dessert', 'grill'],
    },
    large: {
        keywords: ['auflauf', 'lasagne', 'schnitzel', 'burger', 'pizza'],
        categories: ['hauptgericht', 'main course', 'auflauf'],
        avoidCategories: ['beilage', 'dessert', 'side dish'],
    },
    fast: {
        keywords: ['wrap', 'sandwich', 'burger', 'pizza', 'pasta'],
        categories: ['snack', 'fast food', 'quick meal'],
        avoidCategories: [],
    },
};

// Simple Translation Dictionary (for common terms)
const TRANSLATION_DICT: Record<string, string> = {
    'Hauptgericht': 'Main Course',
    'Beilage': 'Side Dish',
    'Salat': 'Salad',
    'Suppe': 'Soup',
    'Dessert': 'Dessert',
    'Vegetarisch': 'Vegetarian',
    'Vegan': 'Vegan',
    'Kartoffel': 'Potato',
    'Reis': 'Rice',
    'Nudeln': 'Pasta',
    'Gemüse': 'Vegetables',
    'Fleisch': 'Meat',
    'Fisch': 'Fish',
    'Käse': 'Cheese',
    'Ei': 'Egg',
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Normalize text for comparison (lowercase, remove special chars)
 */
function normalizeText(text: string): string {
    return text
        .toLowerCase()
        .replace(/ä/g, 'ae')
        .replace(/ö/g, 'oe')
        .replace(/ü/g, 'ue')
        .replace(/ß/g, 'ss')
        .replace(/[^a-z0-9\s]/g, '')
        .trim();
}

/**
 * 🛟 Fallback query extraction
 * ONLY used when LLM crashes
 */
function extractQueryFallback(prompt: string): string | null {
    const text = normalizeText(prompt);

    if (text.includes('reis')) return 'rice';
    if (text.includes('salat')) return 'salad';
    if (text.includes('nudel') || text.includes('pasta')) return 'pasta';
    if (text.includes('burger')) return 'burger';
    if (text.includes('suppe')) return 'soup';
    if (text.includes('fisch')) return 'fish';
    if (text.includes('fleisch')) return 'meat';

    return null;
}
function extractMaxPriceFallback(prompt: string): number | null {
    const match = prompt.match(/unter\s*(\d+(?:[.,]\d+)?)/i);
    if (!match) return null;
    return Number(match[1].replace(',', '.'));
}

/**
 * ✅ CHECK: Does a canteen belong to a university (by name matching)
 */
function canteenBelongsToUniversity(
    canteenName: string,
    universityShort: string
): boolean {
    const normalized = normalizeText(canteenName);
    const uniUpper = universityShort.toUpperCase();

    // 1. Direct university shortname in canteen name
    const uniNormalized = normalizeText(uniUpper);
    if (normalized.includes(uniNormalized)) {
        return true;
    }

    // 2. Campus keyword matching
    const keywords = UNI_MENSAS[uniUpper];
    if (!keywords || keywords.length === 0) {
        return false;
    }

    for (const keyword of keywords) {
        const normalizedKeyword = normalizeText(keyword);
        if (normalized.includes(normalizedKeyword)) {
            return true;
        }
    }
    return false;
}

/**
 * Translate meal content to English (simple keyword-based)
 */
function translateMealContent(meal: Meal, language: 'de' | 'en'): Meal {
    if (language === 'de') return meal;

    let translatedName = meal.name;
    let translatedCategory = meal.category;

    Object.entries(TRANSLATION_DICT).forEach(([de, en]) => {
        const regex = new RegExp(`\\b${de}\\b`, 'gi');
        translatedName = translatedName.replace(regex, en);
        if (translatedCategory) {
            translatedCategory = translatedCategory.replace(regex, en);
        }
    });

    return {
        ...meal,
        name: translatedName,
        category: translatedCategory,
    };
}

/**
 * Get mensaIds for a given university shortname
 */
function getMensaIdsForUniversity(uniShort: string, mensas: Canteen[]): string[] {
    const campusKeywords = UNI_MENSAS[uniShort.toUpperCase()] || [];
    if (campusKeywords.length === 0) return [];

    return mensas
        .filter((mensa) => {
            const mensaName = normalizeText(mensa.name);
            return campusKeywords.some((keyword) => mensaName.includes(normalizeText(keyword)));
        })
        .map((m) => m.id);
}

/**
 * Check if meal contains allergens
 */
function hasAllergen(meal: Meal, allergies: string[]): boolean {
    if (!allergies || allergies.length === 0) return false;

    const mealText = normalizeText(
        `${meal.name} ${meal.additives?.map((a) => a.text).join(' ') || ''}`
    );

    return allergies.some((allergen) => mealText.includes(normalizeText(allergen)));
}

/**
 * Check if meal matches diet requirements
 */
function matchesDiet(meal: Meal, dietType?: 'vegan' | 'vegetarian' | 'pescatarian' | 'none'): boolean {
    if (!dietType || dietType === 'none') return true;

    const badges = meal.badges?.map((b) => normalizeText(b.name)) || [];
    const mealText = normalizeText(meal.name);
    const category = normalizeText(meal.category || '');
    const fullText = `${mealText} ${category} ${badges.join(' ')}`;

    switch (dietType) {
        case 'vegan':
            const hasVeganMarker = badges.includes('vegan') || fullText.includes('vegan');
            if (hasVeganMarker) return true;
            const hasAnimalProducts =
                fullText.includes('fleisch') || fullText.includes('meat') ||
                fullText.includes('fisch') || fullText.includes('fish') ||
                fullText.includes('milch') || fullText.includes('milk') ||
                fullText.includes('käse') || fullText.includes('cheese') ||
                fullText.includes('ei') || fullText.includes('egg') ||
                fullText.includes('huhn') || fullText.includes('chicken') ||
                fullText.includes('rind') || fullText.includes('schwein');
            return !hasAnimalProducts;

        case 'vegetarian':
            const hasVeggieMarker =
                badges.includes('vegetarisch') || badges.includes('vegetarian') ||
                badges.includes('vegan') || fullText.includes('vegetarisch') ||
                fullText.includes('vegetarian') || fullText.includes('vegan');
            if (hasVeggieMarker) return true;
            const hasMeat =
                fullText.includes('fleisch') || fullText.includes('meat') ||
                fullText.includes('chicken') || fullText.includes('hähnchen') ||
                fullText.includes('huhn') || fullText.includes('rind') ||
                fullText.includes('beef') || fullText.includes('schwein') ||
                fullText.includes('pork') || fullText.includes('wurst') ||
                fullText.includes('schnitzel') || fullText.includes('steak');
            return !hasMeat;

        case 'pescatarian':
            const hasVeggieOrFish =
                badges.includes('vegetarisch') || badges.includes('vegetarian') ||
                badges.includes('vegan') || fullText.includes('vegetarisch') ||
                fullText.includes('vegetarian') || fullText.includes('vegan') ||
                fullText.includes('fisch') || fullText.includes('fish');
            const hasMeatNotFish =
                fullText.includes('fleisch') || fullText.includes('meat') ||
                fullText.includes('chicken') || fullText.includes('hähnchen') ||
                fullText.includes('rind') || fullText.includes('schwein') ||
                fullText.includes('wurst');
            return hasVeggieOrFish && !hasMeatNotFish;

        default:
            return true;
    }
}

/**
 * Apply hard safety filters (allergies, diet)
 */
function applyHardFilters(
    meals: Meal[],
    context: AIChefContext,
    locationIds: string[]
): Meal[] {
    return meals.filter((meal) => {
        // Location filter (if explicit location IDs provided)
        if (locationIds.length > 0 && !locationIds.includes(meal.canteenId || '')) {
            return false;
        }

        // Allergen filter (CRITICAL SAFETY)
        if (hasAllergen(meal, context.userPreferences?.allergies || [])) {
            return false;
        }

        // Diet filter
        if (!matchesDiet(meal, context.userPreferences?.dietType)) {
            return false;
        }

        return true;
    });
}

/**
 * ✅ NEW: Hard filter that EXCLUDES meals contradicting the mood
 * This prevents "energy" from showing salads or "light" from showing burgers
 */
function applyMoodHardFilter(meals: Meal[], mood: string | null): Meal[] {
    if (!mood) return meals;

    const moodPref = MOOD_PREFERENCES[mood];
    if (!moodPref) return meals;

    // If mood has avoid rules, filter them out strictly
    if (!moodPref.avoidCategories && !moodPref.avoidKeywords) {
        return meals; // No hard exclusions for this mood
    }

    return meals.filter(meal => {
        const mealText = normalizeText(`${meal.name} ${meal.category || ''}`);
        const categoryNorm = normalizeText(meal.category || '');

        // Block if category is on avoid list
        if (moodPref.avoidCategories) {
            const hasAvoidedCategory = moodPref.avoidCategories.some(cat =>
                categoryNorm.includes(normalizeText(cat))
            );
            if (hasAvoidedCategory) {
                log(`🚫 Mood filter blocked "${meal.name}" - avoided category for ${mood}`);
                return false;
            }
        }

        // Block if keyword is on avoid list
        if (moodPref.avoidKeywords) {
            const hasAvoidedKeyword = moodPref.avoidKeywords.some(keyword =>
                mealText.includes(normalizeText(keyword))
            );
            if (hasAvoidedKeyword) {
                log(`🚫 Mood filter blocked "${meal.name}" - avoided keyword for ${mood}`);
                return false;
            }
        }

        return true;
    });
}

/**
 * Match meal against query string
 */
/**
 * ✅ FIXED: Match meal against query string with multilingual support
 */
function matchesQuery(meal: Meal, query: string | null): boolean {
    if (!query) return true;

    const normalizedQuery = normalizeText(query);
    const mealText = normalizeText(`${meal.name} ${meal.category || ''}`);
    const badges = meal.badges?.map((b) => normalizeText(b.name)).join(' ') || '';
    const fullText = `${mealText} ${badges}`;

    // Direct match
    if (fullText.includes(normalizedQuery)) return true;

    // ✅ EXPANDED: Cross-language mappings for common food terms
    const queryMappings: Record<string, string[]> = {
        'salad': ['salat', 'salad'],
        'salat': ['salat', 'salad'],
        'salatschale': ['salat', 'salad'],
        'pizza': ['pizza'],
        'burger': ['burger'],
        'pasta': ['pasta', 'nudel', 'spaghetti'],
        'nudel': ['pasta', 'nudel'],
        'nudeln': ['pasta', 'nudel'],
        'spaghetti': ['pasta', 'nudel', 'spaghetti'],
        'soup': ['suppe', 'soup', 'eintopf'],
        'suppe': ['suppe', 'soup', 'eintopf'],
        'eintopf': ['suppe', 'soup', 'eintopf'],
        'dessert': ['dessert', 'nachspeise'],
        'nachspeise': ['dessert', 'nachspeise'],
        'kuchen': ['kuchen', 'cake'],
        'cake': ['kuchen', 'cake'],
        // ✅ NEW: Rice mappings
        'rice': ['reis', 'rice'],
        'reis': ['reis', 'rice'],
        'reisgerichte': ['reis', 'rice'],
        // ✅ NEW: Potato mappings
        'potato': ['kartoffel', 'potato'],
        'kartoffel': ['kartoffel', 'potato'],
        'potatoes': ['kartoffel', 'potato'],
        'kartoffeln': ['kartoffel', 'potato'],
        // ✅ NEW: Vegetable mappings
        'vegetables': ['gemuese', 'vegetables'],
        'gemüse': ['gemuese', 'vegetables'],
        'gemuese': ['gemuese', 'vegetables'],
        // ✅ NEW: Fish mappings
        'fish': ['fisch', 'fish'],
        'fisch': ['fisch', 'fish'],
        // ✅ NEW: Meat mappings
        'meat': ['fleisch', 'meat'],
        'fleisch': ['fleisch', 'meat'],
        // ✅ NEW: Chicken mappings
        'chicken': ['haehnchen', 'huhn', 'chicken'],
        'hähnchen': ['haehnchen', 'huhn', 'chicken'],
        'haehnchen': ['haehnchen', 'huhn', 'chicken'],
        'huhn': ['haehnchen', 'huhn', 'chicken'],
    };

    // Check if query has known alternatives
    const alternatives = queryMappings[normalizedQuery] || [normalizedQuery];
    if (alternatives.some(alt => fullText.includes(alt))) {
        return true;
    }

    // Multi-word query: ALL words must appear (with alternatives)
    const queryWords = normalizedQuery.split(' ').filter(w => w.length > 2);
    if (queryWords.length > 1) {
        return queryWords.every(word => {
            const wordAlternatives = queryMappings[word] || [word];
            return wordAlternatives.some(alt => fullText.includes(alt));
        });
    }

    // Single word: check with fuzzy tolerance
    // ✅ CRITICAL: Check if ANY part of the meal name contains the query
    const mealWords = fullText.split(' ');
    return mealWords.some(mealWord => {
        // Check if query is contained in any word (e.g., "salat" in "salatschale")
        if (mealWord.includes(normalizedQuery)) return true;
        // Check alternatives
        return alternatives.some(alt => mealWord.includes(alt));
    });

}

/**
 * Score meal based on mood preferences
 */
function scoreMealByMood(meal: Meal, mood: string | null): number {
    if (!mood) return 0;
    const moodPref = MOOD_PREFERENCES[mood];
    if (!moodPref) return 0;

    const mealText = normalizeText(`${meal.name} ${meal.category || ''}`);
    let score = 0;

    moodPref.keywords.forEach((keyword) => {
        if (mealText.includes(normalizeText(keyword))) score += SCORING_WEIGHTS.MOOD_KEYWORD;
    });

    if (meal.category) {
        const normalizedCategory = normalizeText(meal.category);
        if (moodPref.categories.some((cat) => normalizedCategory.includes(normalizeText(cat)))) {
            score += SCORING_WEIGHTS.MOOD_CATEGORY;
        }
        if (moodPref.avoidCategories && moodPref.avoidCategories.some((cat) => normalizedCategory.includes(normalizeText(cat)))) {
            score += SCORING_WEIGHTS.MOOD_AVOID_CAT;
        }
    }

    if (moodPref.avoidKeywords) {
        moodPref.avoidKeywords.forEach((keyword) => {
            if (mealText.includes(normalizeText(keyword))) score += SCORING_WEIGHTS.MOOD_AVOID_KEY;
        });
    }

    return score;
}

/**
 * Sort meals by relevance (Optimized)
 */
function sortMealsByRelevance(
    meals: Meal[],
    context: AIChefContext,
    searchParams: LLMIntentResponse['search_params'],
    mensaMap: Map<string, Canteen> // Optimization: Pass Map instead of searching array
): Meal[] {
    return meals.sort((a, b) => {
        let scoreA = 0;
        let scoreB = 0;

        // Favorites
        if (context.favoriteMealIds?.includes(a.id)) scoreA += SCORING_WEIGHTS.FAVORITE_MEAL;
        if (context.favoriteMealIds?.includes(b.id)) scoreB += SCORING_WEIGHTS.FAVORITE_MEAL;

        if (context.favoriteCanteenIds?.includes(a.canteenId || '')) scoreA += SCORING_WEIGHTS.FAVORITE_CANTEEN;
        if (context.favoriteCanteenIds?.includes(b.canteenId || '')) scoreB += SCORING_WEIGHTS.FAVORITE_CANTEEN;

        // Location proximity
        if (!searchParams.university_target && context.userLocation) {
            const mensaA = mensaMap.get(a.canteenId || '');
            const mensaB = mensaMap.get(b.canteenId || '');

            const geoA = mensaA?.address?.geoLocation;
            const geoB = mensaB?.address?.geoLocation;

            if (geoA?.latitude && geoA?.longitude && geoB?.latitude && geoB?.longitude) {
                const distA = calculateDistance(context.userLocation.latitude, context.userLocation.longitude, geoA.latitude, geoA.longitude);
                const distB = calculateDistance(context.userLocation.latitude, context.userLocation.longitude, geoB.latitude, geoB.longitude);

                if (distA < 2) scoreA += SCORING_WEIGHTS.NEARBY;
                if (distB < 2) scoreB += SCORING_WEIGHTS.NEARBY;
                if (distA < distB) scoreA += SCORING_WEIGHTS.CLOSER_BONUS;
                if (distB < distA) scoreB += SCORING_WEIGHTS.CLOSER_BONUS;
            }
        }

        // Mood matching
        scoreA += scoreMealByMood(a, searchParams.mood);
        scoreB += scoreMealByMood(b, searchParams.mood);

        // Query matching
        if (searchParams.query) {
            const queryNorm = normalizeText(searchParams.query);
            if (normalizeText(a.name).includes(queryNorm)) scoreA += SCORING_WEIGHTS.QUERY_MATCH;
            if (normalizeText(b.name).includes(queryNorm)) scoreB += SCORING_WEIGHTS.QUERY_MATCH;
        }

        return scoreB - scoreA;
    });
}

/**
 * Generate reason text for meal recommendation
 */
function generateReasonText(
    meal: Meal,
    context: AIChefContext,
    searchParams: LLMIntentResponse['search_params'], // Fixed variable name
    language: 'de' | 'en',
    mensaMap: Map<string, Canteen>
): string {
    const reasons: string[] = [];

    if (context.favoriteMealIds?.includes(meal.id)) {
        reasons.push(t(`aiChef.reasons.favorite.${language}`));
    }
    if (searchParams.mood) {
        reasons.push(t(`aiChef.reasons.mood.${searchParams.mood}.${language}`));
    }
    if (searchParams.query) {
        reasons.push(t(`aiChef.reasons.contains.${language}`, { item: searchParams.query }));
    }
    if (searchParams.university_target) {
        reasons.push(t(`aiChef.reasons.fromUniversity.${language}`, { university: searchParams.university_target }));
    }

    if (!searchParams.university_target && context.userLocation) {
        const mensa = mensaMap.get(meal.canteenId || '');
        const geoLocation = mensa?.address?.geoLocation;
        if (geoLocation?.latitude && geoLocation?.longitude) {
            const dist = calculateDistance(context.userLocation.latitude, context.userLocation.longitude, geoLocation.latitude, geoLocation.longitude);
            if (dist < 1) {
                reasons.push(t(`aiChef.reasons.nearYou.${language}`));
            }
        }
    }

    if (reasons.length === 0) {
        reasons.push(t(`aiChef.reasons.matchesSearch.${language}`));
    }

    const finalReason = reasons.join(' • ');
    log(`💬 Reason for "${meal.name}": ${finalReason}`);
    return finalReason;
}

// ============================================================================
// LLM INTEGRATION
// ============================================================================

async function analyzeIntentWithLLM(
    userMessage: string,
    history: AIChefHistoryMessage[] = []
): Promise<LLMIntentResponse> {
    const systemPrompt = `Du bist ein intelligenter Food Assistant für Mensen in Berlin.
    
DEINE AUFGABE:
Analysiere die User-Nachricht und gib ein strukturiertes JSON-Objekt zurück.

INTENT-KATEGORIEN:
- "question": User stellt eine Wissensfrage (z.B. "Was ist Weichkäse?", "Wie viele Kalorien hat Pizza?")
- "recommendation": User sucht nach Essensempfehlungen (z.B. "Zeig mir Pasta", "Ich bin müde", "Was gibt's an der HTW?")
- "affirmation": User bestätigt eine Frage (z.B. "Ja", "Gerne", "Klar", "Okay")
- "smalltalk": Begrüßung oder lockeres Gespräch (z.B. "Hi", "Danke", "Wie geht's?")

SEARCH_PARAMS - WICHTIGE REGEL:
Wenn der User ein KONKRETES GERICHT oder eine ZUTAT nennt, setze immer "query" (nicht "mood"!):

- query: Standardisiertes Essen/Zutat (Englisch bevorzugt): "pasta", "burger", "salad", "soup", "rice", "meat", "fish", "chicken", "potato", "vegetables" etc.
  * Beispiele für query: "Pasta", "Burger", "Salat", "Fleisch", "Fisch", "Reis", "Kartoffeln", "Gemüse", "Chicken", "Suppe"
  * NUR query setzen wenn User konkrete Speisen/Zutaten nennt!
  
- mood: NUR verwenden wenn User eine STIMMUNG/SITUATION beschreibt (NICHT bei konkreten Gerichten!):
  * "energy" = müde, braucht Power, erschöpft (→ User sagt z.B. "Ich bin müde", "Ich brauche Energie")
  * "light" = gesund, leicht (→ User sagt z.B. "Ich will was Leichtes", "Etwas Gesundes")
  * "large" = sehr hungrig (→ User sagt z.B. "Ich habe Hunger", "Etwas Großes")
  * "fast" = Stress, schnell (→ User sagt z.B. "Ich hab's eilig", "Etwas Schnelles")
  * WICHTIG: "Fleischgerichte", "Reisgerichte" etc. sind KEINE Moods, sondern queries!

- university_target: Erkannte Uni-Kürzel: "HTW", "FU", "TU", "HU", "ASH", "HWR", "BHT" (nur wenn explizit erwähnt)
- diet_filter: "vegan", "vegetarian", "pescatarian" (nur wenn explizit erwähnt)

- max_price: number (Euro)
  * NUR setzen, wenn User ein Budget nennt
  * Beispiele:
    - "unter 1€" → max_price: 1
    - "maximal 3 Euro" → max_price: 3
    - "bis 5€" → max_price: 5


WICHTIG - THEMENWECHSEL:
- JEDE neue User-Nachricht ist UNABHÄNGIG vom vorherigen Kontext!
- Wenn User "Wo gibt es Salat?" fragt, VERGISS komplett vorherige Themen wie "Chips" oder "Brokkoli"
- Setze search_params IMMER NEU basierend auf der aktuellen Nachricht
- Kontext nur für Affirmationen nutzen ("Ja" bezieht sich auf vorherige Frage)

SPRACHE:
- Erkenne ob Deutsch oder Englisch
- reply_text: Antworte in der erkannten Sprache, freundlich und knapp

BEISPIELE:
User: "Was ist Weichkäse?"
→ {"intent": "question", "search_params": {"query": null, "mood": null, "university_target": null, "diet_filter": null}, "detected_language": "de", "reply_text": "Weichkäse ist ein Käse mit hohem Wassergehalt und cremiger Konsistenz, z.B. Camembert oder Brie."}

User: "Wo gibt es Salat?"
→ {"intent": "recommendation", "search_params": {"query": "salad", "mood": null, "university_target": null, "diet_filter": null}, "detected_language": "de", "reply_text": "Hier sind frische Salate für dich:"}

User: "Zeig mir Fleischgerichte"
→ {"intent": "recommendation", "search_params": {"query": "meat", "mood": null, "university_target": null, "diet_filter": null}, "detected_language": "de", "reply_text": "Hier sind herzhafte Fleischgerichte für dich:"}

User: "Zeig mir Reisgerichte"
→ {"intent": "recommendation", "search_params": {"query": "rice", "mood": null, "university_target": null, "diet_filter": null}, "detected_language": "de", "reply_text": "Hier sind leckere Reisgerichte für dich:"}

User: "Ich bin müde und an der HTW"
→ {"intent": "recommendation", "search_params": {"query": null, "mood": "energy", "university_target": "HTW", "diet_filter": null}, "detected_language": "de", "reply_text": "Perfekt! Hier sind deftige Gerichte von der HTW, die dir Energie geben:"}

User: "Ich brauche was Leichtes"
→ {"intent": "recommendation", "search_params": {"query": null, "mood": "light", "university_target": null, "diet_filter": null}, "detected_language": "de", "reply_text": "Hier sind leichte Gerichte für dich:"}

User: "Ja, gerne"
→ {"intent": "affirmation", "search_params": {"query": null, "mood": null, "university_target": null, "diet_filter": null}, "detected_language": "de", "reply_text": "Alles klar!"}

User: "Zeig mir Gerichte unter 1€"
→ {"intent": "recommendation", "search_params": {"query": null, "mood": null, "university_target": null, "diet_filter": null, "max_price": 1}, "detected_language": "de", "reply_text": "Hier sind günstige Gerichte unter 1€:"}

User: "Show me vegan pasta"
→ {"intent": "recommendation", "search_params": {"query": "pasta", "mood": null, "university_target": null, "diet_filter": "vegan"}, "detected_language": "en", "reply_text": "Great! Here are vegan pasta dishes:"}`;


    log('🤖 [LLM] Analyzing user intent for message:', userMessage);

    try {
        const payload = {
            model: MODEL,
            messages: [
                { role: 'system', content: systemPrompt },
                ...history.slice(-4),
                { role: 'user', content: userMessage },
            ],
            temperature: 0.3,
            response_format: { type: 'json_object' },
        };
        log('🤖 [LLM] Sending payload to API:', JSON.stringify(payload, null, 2));

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${API_KEY}`,
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            log('❌ [LLM] API Error:', response.status, await response.text());
            throw new Error(`LLM API Error: ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        log('🤖 [LLM] Raw response content:', content);


        if (!content) {
            log('❌ [LLM] Empty response content from API.');
            throw new Error('Empty LLM response');
        }

        // Safety: Try-Catch around JSON parse
        let parsed: LLMIntentResponse;
        try {
            parsed = JSON.parse(content);
            log('🤖 [LLM] Parsed response:', parsed);
        } catch (e) {
            log('❌ [LLM] JSON Parse Error:', e, 'Raw content:', content);
            console.error('JSON Parse Error', e);
            throw new Error('Invalid JSON from LLM');
        }

        // Validate and sanitize
        if (!parsed.intent) {
            log('⚠️ [LLM] Sanitizing: Missing intent, defaulting to "recommendation".');
            parsed.intent = 'recommendation';
        }
        if (!parsed.search_params) {
            log('⚠️ [LLM] Sanitizing: Missing search_params, creating default.');
            parsed.search_params = { query: null, mood: null, university_target: null, diet_filter: null };
        }
        if (!parsed.detected_language) {
            log('⚠️ [LLM] Sanitizing: Missing detected_language, defaulting to "de".');
            parsed.detected_language = 'de';
        }
        if (!parsed.reply_text) {
            log('⚠️ [LLM] Sanitizing: Missing reply_text, creating default.');
            parsed.reply_text = parsed.detected_language === 'de' ? 'Wie kann ich dir helfen?' : 'How can I help you?';
        }

        log('🤖 [LLM] Final sanitized intent response:', parsed);
        return parsed;
    } catch (error) {
        log('❌ [LLM] Intent Analysis CRITICAL Error:', error);
        console.error('LLM Intent Analysis Error:', error);
        return {
            intent: 'recommendation',
            search_params: { query: null, mood: null, university_target: null, diet_filter: null },
            detected_language: 'de',
            reply_text: t('aiChef.errors.couldNotProcess'),
            llmCrashed: true,
        };
    }
}

// ============================================================================
// MAIN EXPORT FUNCTION
// ============================================================================
export async function getAiChefResponse(
    prompt: string,
    context: AIChefContext,
    history?: AIChefHistoryMessage[]
): Promise<AIChefResponse> {
    if (!API_KEY) {
        return { text: t('aiChef.errors.missingApiKey') };
    }

    log('================ AI CHEF REQUEST ================');
    log('🗣️ User prompt:', prompt);
    log('🎓 Profile university:', context.preferredUniversityShort);

    const mensaMap = new Map(context.mensas.map(m => [m.id, m]));

    // Step 1: Analyze intent with LLM
    const llmResponse = await analyzeIntentWithLLM(prompt, history);
    const { intent, search_params, detected_language, reply_text } = llmResponse;

    const previousIntent = context.lastIntent;
    const previousTopic = context.lastTopic;

    // =======================================================
// 🛟 FALLBACK – ONLY if LLM CRASHED
// =======================================================
    if (llmResponse.llmCrashed === true) {
        log('🧯 LLM fallback active');
        const fallbackQuery = extractQueryFallback(prompt);
        const fallbackPrice = extractMaxPriceFallback(prompt);

        if (fallbackQuery) {
            log('🛟 LLM crashed → applying deterministic fallback:', fallbackQuery);
            search_params.query = fallbackQuery;
        }
        if (fallbackPrice != null) {
            log('🛟 LLM crashed → applying deterministic fallback:', fallbackPrice);
            search_params.max_price = fallbackPrice;
        }
    }

    // =======================================================
// 🔁 HARD STOP: User says "No" after a question
// =======================================================
    const normalizedPrompt = normalizeText(prompt);

    const NEGATIONS = ['nein', 'no', 'nop', 'nee', 'ne'];

    if (
        NEGATIONS.includes(normalizedPrompt) &&
        (context.lastIntent === 'question' || intent === 'affirmation')
    ) {
        // Reset conversation context
        context.lastIntent = undefined;
        context.lastTopic = undefined;

        return {
            text:
                detected_language === 'de'
                    ? 'Alles klar 🙂 Wie kann ich dir sonst helfen?'
                    : 'Alright 🙂 How else can I help you?',
            recommendedMeals: [],
        };
    }

    // Reset context logic
    if (intent !== 'affirmation') {
        if (intent === 'question') {
            const cleaned = normalizeText(prompt);
            const nounMatch = cleaned.match(/was\s+ist\s+(.+)/i);
            if (nounMatch) {
                context.lastTopic = normalizeText(nounMatch[1]);
                context.lastIntent = 'question';
            } else {
                context.lastTopic = undefined;
                context.lastIntent = undefined;
            }
        } else {
            context.lastIntent = undefined;
            context.lastTopic = undefined;
        }
    }

    if (intent === 'affirmation') {
        search_params.query = null;
        search_params.mood = null;
        search_params.university_target = null;
        search_params.diet_filter = null;
    }

    // Build semantic filters (these are soft hints, not hard requirements)
    const semanticFilters: AIChefSemanticFilters = {};
    if (search_params.mood === 'light') semanticFilters.heaviness = 'light';
    if (search_params.mood === 'energy' || search_params.mood === 'large') semanticFilters.heaviness = 'heavy';

    switch (search_params.query) {
        case 'salad':
            semanticFilters.category = 'salad';
            break;
        case 'soup':
            semanticFilters.category = 'soup';
            semanticFilters.temperature = 'warm';
            break;
        case 'pasta':
            semanticFilters.category = 'pasta';
            semanticFilters.temperature = 'warm';
            break;
        case 'burger':
        case 'schnitzel':
        case 'auflauf':
        case 'pizza':
            semanticFilters.category = 'main';
            semanticFilters.temperature = 'warm';
            semanticFilters.heaviness = 'heavy';
            break;
        case 'bowl':
            semanticFilters.category = 'bowl';
            semanticFilters.heaviness = 'light';
            break;
        case 'dessert':
        case 'kuchen':
        case 'pudding':
            semanticFilters.category = 'dessert';
            semanticFilters.temperature = 'cold';
            break;
    }

    log('🧠 LLM Analysis:', { intent, search_params, detected_language });

    // Step 2: Handle simple intents
    if (intent === 'smalltalk') {
        return { text: reply_text, recommendedMeals: [] };
    }

    if (intent === 'question') {
        return {
            text: reply_text + '\n\n' + t(`aiChef.messages.showMatchingDishes.${detected_language}`),
            recommendedMeals: [],
        };
    }

    if (intent === 'affirmation') {
        if (previousIntent === 'question' && previousTopic) {
            log('🧠 Affirmation recognized → proceeding to recommendation');
        } else {
            return {
                text: detected_language === 'de' ? 'Okay 🙂 Was möchtest du sehen?' : 'Okay 🙂 What would you like to see?',
                recommendedMeals: [],
            };
        }
    }

    // Step 3: Generate Recommendations
    let locationIds: string[] = [];
    if (search_params.university_target) {
        locationIds = getMensaIdsForUniversity(search_params.university_target, context.mensas);
        if (locationIds.length === 0) {
            return {
                text: t(`aiChef.errors.universityNotFound.${detected_language}`, { university: search_params.university_target }),
                recommendedMeals: [],
            };
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
// 🔧 FIXED DEDUPLICATION: Keep one instance per canteen, not globally
// ═══════════════════════════════════════════════════════════════════════

// Step 1: Remove exact duplicates (same id + canteen + date)
    const uniqueMealMap = new Map<string, Meal>();
    for (const meal of context.meals) {
        const key = `${meal.id}_${meal.canteenId}_${meal.date}`;
        if (!uniqueMealMap.has(key)) {
            uniqueMealMap.set(key, meal);
        }
    }

// Step 2: ✅ NEW - Deduplicate by name WITHIN each canteen only
// This preserves "Kleine Salatschale" at HTW, TU, FU separately
    const groupedByCanteenAndName = new Map<string, Meal>();
    for (const meal of uniqueMealMap.values()) {
        const key = `${meal.canteenId}_${normalizeText(meal.name)}`;
        if (!groupedByCanteenAndName.has(key)) {
            groupedByCanteenAndName.set(key, meal);
        }
    }

    const deduplicatedMeals = Array.from(groupedByCanteenAndName.values());

    log(`📊 Deduplication stats: ${context.meals.length} → ${uniqueMealMap.size} → ${deduplicatedMeals.length}`);
    // ═══════════════════════════════════════════════════════════════════════
    // 🔧 CRITICAL FIX: Apply filters in correct order
    // ═══════════════════════════════════════════════════════════════════════

    // 1️⃣ Hard Safety Filters (Allergies, Diet, Location)
    let filteredMeals = applyHardFilters(deduplicatedMeals, context, locationIds);
    log('🔒 After hard safety filters:', filteredMeals.length);

    // 2️⃣ Price Filter (HARD)
    if (search_params.max_price != null) {
        const beforePrice = filteredMeals.length;

        filteredMeals = filteredMeals.filter(meal => {
            if (!meal.prices || meal.prices.length === 0) return false;

            // Student price bevorzugen
            const studentPrice =
                meal.prices.find(p => p.priceType === 'student') ??
                meal.prices[0];

            return studentPrice.price <= search_params.max_price!;
        });

        log(`💰 Price filter (<= ${search_params.max_price}€): ${beforePrice} → ${filteredMeals.length}`);
    }

    // 3️⃣ University Filter
    const activeUniversity = search_params.university_target ?? context.preferredUniversityShort;
    if (activeUniversity) {
        log(`🎓 APPLYING UNIVERSITY FILTER: ${activeUniversity}`);

        // 🔍 DEBUG: Show which mensas/meals are available before filter
        const availableMensas = new Map<string, number>();
        filteredMeals.forEach(meal => {
            const mensaId = meal.canteenId || 'unknown';
            availableMensas.set(mensaId, (availableMensas.get(mensaId) || 0) + 1);
        });
        log(`📍 Meals per canteen before filter:`);
        availableMensas.forEach((count, mensaId) => {
            const mensa = mensaMap.get(mensaId);
            log(`   ${mensa?.name || mensaId}: ${count} meals`);
        });

        filteredMeals = filteredMeals.filter((meal) => {
            const mensa = mensaMap.get(meal.canteenId || '');
            if (!mensa) return false;
            return canteenBelongsToUniversity(mensa.name, activeUniversity);
        });
        log('🎓 After university filter:', filteredMeals.length);
    }

    // 4️⃣ ✅ NEW: Mood Hard Filter (block contradicting dishes)
    if (search_params.mood) {
        const beforeMood = filteredMeals.length;
        filteredMeals = applyMoodHardFilter(filteredMeals, search_params.mood);
        log(`🎭 Mood filter (${search_params.mood}): ${beforeMood} → ${filteredMeals.length}`);
    }

    // =======================================================
// 🥩 Meat query detection (central switch)
// =======================================================

    if (search_params.query === 'meat') {
        log('🥩 Applying universal meat filter');
        const originalLength = filteredMeals.length;

        filteredMeals = filteredMeals.filter(meal => {
            const text = normalizeText(
                `${meal.name} ${meal.category || ''}`
            );
            const badges = meal.badges?.map(b => normalizeText(b.name)) || [];

            // 1️⃣ ABSOLUTE AUSSCHLUSSREGEL
            const isVeggie =
                badges.some(b =>
                    b.includes('vegan') ||
                    b.includes('vegetarisch') ||
                    b.includes('vegetarian')
                ) ||
                text.includes('vegan') ||
                text.includes('vegetarisch') ||
                text.includes('vegetarian') ||
                text.includes('plantbased') ||
                text.includes('plant-based');

            if (isVeggie) return false;

            // 2️⃣ ECHTE FLEISCH-INDIKATOREN
            const meatKeywords = [
                'fleisch', 'meat',
                'rind', 'beef', 'steak', 'roastbeef',
                'schwein', 'pork', 'wurst', 'salami', 'schinken', 'bacon', 'speck',
                'huhn', 'haehnchen', 'hähnchen', 'chicken',
                'pute', 'turkey', 'truthahn',
                'ente', 'duck', 'gans', 'goose',
                'lamm', 'lamb', 'kalb', 'veal',
                'wild', 'reh', 'hirsch', 'venison',
                'hackfleisch', 'schnitzel'
            ];

            return meatKeywords.some(k => text.includes(k));
        });

        search_params.query = null; // Verhindert späteren Text-Match
        log(`🥩 Meat filter: ${filteredMeals.length}/${originalLength} meals matched`);
    }




    // 4️⃣ ✅ CRITICAL: Query Text Matching (STRICT - must appear in name)
    if (search_params.query) {
        const beforeQuery = filteredMeals.length;
        filteredMeals = filteredMeals.filter(meal => matchesQuery(meal, search_params.query));
        log(`🔍 Query filter ("${search_params.query}"): ${beforeQuery} → ${filteredMeals.length}`);
    }

    // 5️⃣ Semantic Category Filters (soft hints, only if no explicit query)
    if (!search_params.query && Object.keys(semanticFilters).length > 0) {
        const beforeSemantic = filteredMeals.length;

        filteredMeals = filteredMeals.filter(meal => {
            const textNorm = normalizeText(`
                ${meal.name}
                ${meal.category || ''}
                ${Array.isArray((meal as any).notes) ? (meal as any).notes.join(' ') : ''}
                ${Array.isArray(meal.badges) ? meal.badges.map(b => b.name).join(' ') : ''}
            `);

            if (semanticFilters.category) {
                const keywords = CATEGORY_KEYWORDS[semanticFilters.category] || [];
                const genericMatch = (() => {
                    switch (semanticFilters.category) {
                        case 'salad':
                            return textNorm.includes('salat') || textNorm.includes('salad') ||
                                textNorm.includes('gemuese') || textNorm.includes('vegetable');
                        case 'soup':
                            return textNorm.includes('suppe') || textNorm.includes('soup') ||
                                textNorm.includes('eintopf') || textNorm.includes('broth');
                        case 'pasta':
                            return textNorm.includes('pasta') || textNorm.includes('nudel') ||
                                textNorm.includes('spaghetti') || textNorm.includes('lasagne');
                        case 'bowl':
                            return textNorm.includes('bowl') || textNorm.includes('reis') ||
                                textNorm.includes('gemuese') || textNorm.includes('grain');
                        case 'main':
                            return textNorm.includes('haupt') || textNorm.includes('gericht') ||
                                textNorm.includes('main') || textNorm.includes('course') ||
                                textNorm.includes('auflauf');
                        case 'dessert':
                            return textNorm.includes('dessert') || textNorm.includes('kuchen') ||
                                textNorm.includes('pudding') || textNorm.includes('nachspeise') ||
                                textNorm.includes('torte') || textNorm.includes('mousse');
                        default:
                            return false;
                    }
                })();

                const keywordMatch = keywords.some(k => textNorm.includes(normalizeText(k)));
                return keywordMatch || genericMatch;
            }

            return true;
        });

        log(`🧩 Semantic filter: ${beforeSemantic} → ${filteredMeals.length}`);

        // 🛟 Smart Fallback: Only if semantic category filtering yielded 0 results
        if (filteredMeals.length === 0 && semanticFilters.category) {
            log(`🛟 No '${semanticFilters.category}' at university → checking global`);

            const globalSafe = applyHardFilters(deduplicatedMeals, context, []);
            const globalWithMood = search_params.mood
                ? applyMoodHardFilter(globalSafe, search_params.mood)
                : globalSafe;

            filteredMeals = globalWithMood.filter(meal => {
                const textNorm = normalizeText(`${meal.name} ${meal.category || ''}`);
                const keywords = CATEGORY_KEYWORDS[semanticFilters.category!] || [];
                const keywordMatch = keywords.some(k => textNorm.includes(normalizeText(k)));
                const genericMatch = textNorm.includes('salat') || textNorm.includes('bowl');
                return keywordMatch || genericMatch;
            });

            log(`🧭 Global fallback: ${filteredMeals.length} found`);
        }
    }

    // 6️⃣ Override Diet Filter (if explicitly requested)
    if (search_params.diet_filter) {
        const beforeDiet = filteredMeals.length;
        filteredMeals = filteredMeals.filter((meal) =>
            matchesDiet(meal, search_params.diet_filter || undefined)
        );
        log(`🌿 Diet filter ("${search_params.diet_filter}"): ${beforeDiet} → ${filteredMeals.length}`);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 🎯 SORTING & LIMITING
    // ═══════════════════════════════════════════════════════════════════════

    log('📈 Sorting relevant meals...');
    filteredMeals = sortMealsByRelevance(filteredMeals, context, search_params, mensaMap);
    log(`🥇 Top ${Math.min(10, filteredMeals.length)} sorted meals:`, filteredMeals.slice(0, 10).map(m => ({ name: m.name, id: m.id })));
    filteredMeals = filteredMeals.slice(0, 10);

    // ═══════════════════════════════════════════════════════════════════════
    // 🚨 EMPTY STATE HANDLING - Override reply_text if no results
    // ═══════════════════════════════════════════════════════════════════════

    let finalReplyText = reply_text;

    if (filteredMeals.length === 0) {
        const query = search_params.query;
        const category = semanticFilters.category;
        const mood = search_params.mood;
        const uniName = search_params.university_target ?? context.preferredUniversityShort;

        // Build context-aware empty message
        if (query) {
            // User searched for specific dish (e.g., "Burger")
            if (uniName) {
                finalReplyText = detected_language === 'de'
                    ? `Ich habe leider keinen "${query}" an deiner Hochschule (${uniName}) gefunden. 😔`
                    : `I couldn't find any "${query}" at your university (${uniName}). 😔`;
            } else {
                finalReplyText = detected_language === 'de'
                    ? `Ich habe leider keinen "${query}" in den verfügbaren Mensen gefunden.`
                    : `I couldn't find any "${query}" in the available canteens.`;
            }
        } else if (mood) {
            // User specified mood without explicit dish
            const moodNames = {
                de: { energy: 'energiereiches Essen', light: 'leichte Gerichte', large: 'große Gerichte', fast: 'schnelles Essen' },
                en: { energy: 'energy-rich food', light: 'light dishes', large: 'large dishes', fast: 'quick food' }
            };
            const moodText = moodNames[detected_language][mood as keyof typeof moodNames.de] || mood;

            if (uniName) {
                finalReplyText = detected_language === 'de'
                    ? `An deiner Hochschule (${uniName}) gibt es heute leider kein passendes ${moodText}. 😔`
                    : `There are no matching ${moodText} available at your university (${uniName}) today. 😔`;
            } else {
                finalReplyText = detected_language === 'de'
                    ? `Ich konnte leider kein passendes ${moodText} finden.`
                    : `I couldn't find any matching ${moodText}.`;
            }
        } else if (category) {
            // Semantic category without explicit query
            if (uniName) {
                finalReplyText = detected_language === 'de'
                    ? `An deiner Hochschule (${uniName}) gibt es aktuell keine ${category}-Gerichte.`
                    : `There are currently no ${category} dishes at your university (${uniName}).`;
            } else {
                finalReplyText = detected_language === 'de'
                    ? `Aktuell gibt es keine ${category}-Gerichte.`
                    : `There are currently no ${category} dishes available.`;
            }
        } else {
            // Generic fallback
            finalReplyText = detected_language === 'de'
                ? 'Derzeit sind keine passenden Gerichte verfügbar. 😔'
                : 'There are currently no matching dishes available. 😔';
        }

        log(`🤷 No meals found. Final Reply: "${finalReplyText}"`);
        return { text: finalReplyText, recommendedMeals: [] };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ✅ BUILD RESPONSE
    // ═══════════════════════════════════════════════════════════════════════

    const translatedMeals = filteredMeals.map((meal) => translateMealContent(meal, detected_language));

// ✅ OPTIONAL: Remove duplicate dish names from final display (but keep them during filtering)
    const seenNames = new Set<string>();
    const uniqueTranslatedMeals = translatedMeals.filter(meal => {
        const normalized = normalizeText(meal.name);
        if (seenNames.has(normalized)) {
            log(`🔄 Skipping duplicate display: "${meal.name}"`);
            return false;
        }
        seenNames.add(normalized);
        return true;
    });

    let recommendedMeals = uniqueTranslatedMeals.map((meal) => ({
        meal,
        reason: generateReasonText(meal, context, search_params, detected_language, mensaMap),
    }));

    // Affirmation filter: Don't show same dish again
    if (intent === 'affirmation' && previousTopic) {
        recommendedMeals = recommendedMeals.filter(m =>
            m.meal.name && !normalizeText(m.meal.name).includes(previousTopic)
        );

        if (recommendedMeals.length === 0) {
            return {
                text: detected_language === 'de'
                    ? 'Das war bereits alles, was es dazu aktuell gibt 🙂 Möchtest du etwas Ähnliches?'
                    : 'That is everything available for this right now 🙂 Want something similar?',
                recommendedMeals: [],
            };
        }
    }

// Reset context after affirmation
    if (intent === 'affirmation' && previousIntent === 'question') {
        context.lastIntent = undefined;
        context.lastTopic = undefined;
    }

    log(`✅ Final response built. Text: "${finalReplyText}", Recommendations: ${recommendedMeals.length}`);

    return {
        text: finalReplyText,
        recommendedMeals,
    };
}