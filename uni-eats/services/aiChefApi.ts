import { Canteen, Meal, University } from '@/services/mensaApi';
import { t } from '@/utils/i18n';
import { calculateDistance } from '@/utils/locationUtils';

const API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY || '';
const API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.1-8b-instant';

// ============================================================================
// TYPES
// ============================================================================

export interface UserPreferences {
    allergies?: string[];
    dietType?: 'vegetarian' | 'vegan' | 'pescatarian' | 'none';
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
    };
    detected_language: 'de' | 'en';
    reply_text: string;
}

// ============================================================================
// CONFIGURATION MAPS
// ============================================================================

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
        categories: ['hauptgericht', 'grill', 'main course', 'fleiscphgerichte', 'meat dishes'],
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
    // Categories
    'Hauptgericht': 'Main Course',
    'Beilage': 'Side Dish',
    'Salat': 'Salad',
    'Suppe': 'Soup',
    'Dessert': 'Dessert',
    'Vegetarisch': 'Vegetarian',
    'Vegan': 'Vegan',

    // Common ingredients
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
 * ✅ CHECK: Does a canteen belong to a university (by name matching)
 */
/**
 * ✅ CHECK: Does a canteen belong to a university (by name matching)
 */
// In aiChefApi.ts - Ersetze canteenBelongsToUniversity mit dieser Debug-Version

/**
 * ✅ CHECK: Does a canteen belong to a university (by name matching)
 */
function canteenBelongsToUniversity(
    canteenName: string,
    universityShort: string
): boolean {
    const normalized = normalizeText(canteenName);
    const uniUpper = universityShort.toUpperCase();

    console.log(`🔍 Checking canteen: "${canteenName}"`);
    console.log(`   Normalized: "${normalized}"`);
    console.log(`   Looking for: ${uniUpper}`);

    // 1. Direct university shortname in canteen name
    const uniNormalized = normalizeText(uniUpper);
    if (normalized.includes(uniNormalized)) {
        console.log(`   ✅ MATCH: Direct shortname "${uniUpper}" found in name`);
        return true;
    }

    // 2. Campus keyword matching
    const keywords = UNI_MENSAS[uniUpper];
    if (!keywords || keywords.length === 0) {
        console.log(`   ❌ NO MATCH: No keywords defined for ${uniUpper}`);
        return false;
    }

    console.log(`   Checking keywords:`, keywords);

    for (const keyword of keywords) {
        const normalizedKeyword = normalizeText(keyword);
        if (normalized.includes(normalizedKeyword)) {
            console.log(`   ✅ MATCH: Keyword "${keyword}" found`);
            return true;
        }
    }

    console.log(`   ❌ NO MATCH: No keywords matched for ${uniUpper}`);
    return false;
}
/**
 * Translate meal content to English (simple keyword-based)
 */
function translateMealContent(meal: Meal, language: 'de' | 'en'): Meal {
    if (language === 'de') return meal;

    let translatedName = meal.name;
    let translatedCategory = meal.category;

    // Simple word-by-word translation for common terms
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
 * Check if meal matches diet requirements (FIXED - more permissive)
 */
function matchesDiet(meal: Meal, dietType?: 'vegan' | 'vegetarian' | 'pescatarian' | 'none'): boolean {
    if (!dietType || dietType === 'none') return true;

    const badges = meal.badges?.map((b) => normalizeText(b.name)) || [];
    const mealText = normalizeText(meal.name);
    const category = normalizeText(meal.category || '');

    // Combine all searchable text
    const fullText = `${mealText} ${category} ${badges.join(' ')}`;

    switch (dietType) {
        case 'vegan':
            // Vegan: Must have vegan marker OR no animal products
            const hasVeganMarker =
                badges.includes('vegan') ||
                fullText.includes('vegan');

            // If explicitly marked vegan, allow it
            if (hasVeganMarker) return true;

            // Otherwise check for animal products (strict blocking)
            const hasAnimalProducts =
                fullText.includes('fleisch') ||
                fullText.includes('meat') ||
                fullText.includes('fisch') ||
                fullText.includes('fish') ||
                fullText.includes('milch') ||
                fullText.includes('milk') ||
                fullText.includes('käse') ||
                fullText.includes('cheese') ||
                fullText.includes('ei') ||
                fullText.includes('egg') ||
                fullText.includes('huhn') ||
                fullText.includes('chicken') ||
                fullText.includes('rind') ||
                fullText.includes('schwein');

            return !hasAnimalProducts;

        case 'vegetarian':
            // Vegetarian: Allow vegan + vegetarian + ambiguous dishes
            const hasVeggieMarker =
                badges.includes('vegetarisch') ||
                badges.includes('vegetarian') ||
                badges.includes('vegan') ||
                fullText.includes('vegetarisch') ||
                fullText.includes('vegetarian') ||
                fullText.includes('vegan');

            // If marked veggie/vegan, allow
            if (hasVeggieMarker) return true;

            // Block only obvious meat (but allow fish for now, pescatarian will filter)
            const hasMeat =
                fullText.includes('fleisch') ||
                fullText.includes('meat') ||
                fullText.includes('chicken') ||
                fullText.includes('hähnchen') ||
                fullText.includes('huhn') ||
                fullText.includes('rind') ||
                fullText.includes('beef') ||
                fullText.includes('schwein') ||
                fullText.includes('pork') ||
                fullText.includes('wurst') ||
                fullText.includes('schnitzel') ||
                fullText.includes('steak');

            return !hasMeat;

        case 'pescatarian':
            // Pescatarian: Vegetarian OR fish, but NO other meat
            const hasVeggieOrFish =
                badges.includes('vegetarisch') ||
                badges.includes('vegetarian') ||
                badges.includes('vegan') ||
                fullText.includes('vegetarisch') ||
                fullText.includes('vegetarian') ||
                fullText.includes('vegan') ||
                fullText.includes('fisch') ||
                fullText.includes('fish');

            const hasMeatNotFish =
                fullText.includes('fleisch') ||
                fullText.includes('meat') ||
                fullText.includes('chicken') ||
                fullText.includes('hähnchen') ||
                fullText.includes('rind') ||
                fullText.includes('schwein') ||
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
        // Location filter
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
 * Match meal against query string
 */
function matchesQuery(meal: Meal, query: string | null): boolean {
    if (!query) return true;

    const normalizedQuery = normalizeText(query);
    const mealText = normalizeText(`${meal.name} ${meal.category || ''}`);
    const badges = meal.badges?.map((b) => normalizeText(b.name)).join(' ') || '';

    return (
        mealText.includes(normalizedQuery) ||
        badges.includes(normalizedQuery) ||
        normalizedQuery.split(' ').some((word) => mealText.includes(word))
    );
}

/**
 * Score meal based on mood preferences (FIXED)
 */
function scoreMealByMood(meal: Meal, mood: string | null): number {
    if (!mood) return 0;

    const moodPref = MOOD_PREFERENCES[mood];
    if (!moodPref) return 0;

    const mealText = normalizeText(`${meal.name} ${meal.category || ''}`);
    let score = 0;

    // Positive keywords
    moodPref.keywords.forEach((keyword) => {
        if (mealText.includes(normalizeText(keyword))) {
            score += 3;
        }
    });

    // Preferred categories
    if (meal.category) {
        const normalizedCategory = normalizeText(meal.category);
        if (moodPref.categories.some((cat) => normalizedCategory.includes(normalizeText(cat)))) {
            score += 5;
        }
    }

    // Avoid categories (negative score)
    if (meal.category && moodPref.avoidCategories) {
        const normalizedCategory = normalizeText(meal.category);
        if (moodPref.avoidCategories.some((cat) => normalizedCategory.includes(normalizeText(cat)))) {
            score -= 5;
        }
    }

    // Avoid keywords (stronger penalty)
    if (moodPref.avoidKeywords) {
        moodPref.avoidKeywords.forEach((keyword) => {
            if (mealText.includes(normalizeText(keyword))) {
                score -= 10;
            }
        });
    }

    return score;
}

/**
 * Sort meals by relevance (FIXED with location awareness)
 */
function sortMealsByRelevance(
    meals: Meal[],
    context: AIChefContext,
    searchParams: LLMIntentResponse['search_params']
): Meal[] {
    return meals.sort((a, b) => {
        let scoreA = 0;
        let scoreB = 0;

        // Favorites get highest priority
        if (context.favoriteMealIds?.includes(a.id)) scoreA += 100;
        if (context.favoriteMealIds?.includes(b.id)) scoreB += 100;


        // Favorite canteens
        if (context.favoriteCanteenIds?.includes(a.canteenId || '')) scoreA += 50;
        if (context.favoriteCanteenIds?.includes(b.canteenId || '')) scoreB += 50;


        // Location proximity (only if NO university was explicitly mentioned)
        if (!searchParams.university_target && context.userLocation) {
            const mensaA = context.mensas.find((m) => m.id === a.canteenId);
            const mensaB = context.mensas.find((m) => m.id === b.canteenId);

            const geoA = mensaA?.address?.geoLocation;
            const geoB = mensaB?.address?.geoLocation;

            if (geoA?.latitude && geoA?.longitude && geoB?.latitude && geoB?.longitude) {
                const distA = calculateDistance(
                    context.userLocation.latitude,
                    context.userLocation.longitude,
                    geoA.latitude,
                    geoA.longitude
                );
                const distB = calculateDistance(
                    context.userLocation.latitude,
                    context.userLocation.longitude,
                    geoB.latitude,
                    geoB.longitude
                );

                // Nearby bonus (< 2km)
                if (distA < 2) scoreA += 30;
                if (distB < 2) scoreB += 30;

                // Closer is better
                if (distA < distB) scoreA += 10;
                if (distB < distA) scoreB += 10;
            }
        }

        // Mood matching
        scoreA += scoreMealByMood(a, searchParams.mood);
        scoreB += scoreMealByMood(b, searchParams.mood);

        // Query matching (exact > partial)
        if (searchParams.query) {
            const queryNorm = normalizeText(searchParams.query);
            const aName = normalizeText(a.name);
            const bName = normalizeText(b.name);

            if (aName.includes(queryNorm)) scoreA += 10;
            if (bName.includes(queryNorm)) scoreB += 10;
        }

        return scoreB - scoreA;
    });
}

/**
 * Generate reason text for meal recommendation (FIXED for English)
 */
function generateReasonText(
    meal: Meal,
    context: AIChefContext,
    searchParams: LLMIntentResponse['search_params'],
    language: 'de' | 'en'
): string {
    const reasons: string[] = [];

    // Favorite
    if (context.favoriteMealIds?.includes(meal.id)) {
        reasons.push(t(`aiChef.reasons.favorite.${language}`));
    }

    // Mood-based
    if (searchParams.mood) {
        const moodKey = `aiChef.reasons.mood.${searchParams.mood}.${language}`;
        reasons.push(t(moodKey));
    }

    // Query match
    if (searchParams.query) {
        reasons.push(t(`aiChef.reasons.contains.${language}`, { item: searchParams.query }));
    }

    // University
    if (searchParams.university_target) {
        reasons.push(t(`aiChef.reasons.fromUniversity.${language}`, {
            university: searchParams.university_target
        }));
    }

    // Location proximity
    if (!searchParams.university_target && context.userLocation) {
        const mensa = context.mensas.find((m) => m.id === meal.canteenId);
        const geoLocation = mensa?.address?.geoLocation;

        if (geoLocation?.latitude && geoLocation?.longitude) {
            const dist = calculateDistance(
                context.userLocation.latitude,
                context.userLocation.longitude,
                geoLocation.latitude,
                geoLocation.longitude
            );
            if (dist < 1) {
                reasons.push(t(`aiChef.reasons.nearYou.${language}`));
            }
        }
    }

    // Fallback
    if (reasons.length === 0) {
        reasons.push(t(`aiChef.reasons.matchesSearch.${language}`));
    }

    return reasons.join(' • ');
}

// ============================================================================
// LLM INTEGRATION
// ============================================================================

/**
 * Call LLM to analyze user intent and extract structured data (FIXED)
 */
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

SEARCH_PARAMS:
- query: Standardisiertes Essen (Englisch bevorzugt): "pasta", "burger", "salad", "soup", etc.
- mood: 
  * "energy" = müde, braucht Power (→ herzhaft, Fleisch)
  * "light" = gesund, leicht (→ Salat, Gemüse)
  * "large" = sehr hungrig (→ Hauptgerichte, Aufläufe)
  * "fast" = Stress, schnell (→ Wraps, Sandwiches)
- university_target: Erkannte Uni-Kürzel: "HTW", "FU", "TU", "HU", "ASH", "HWR", "BHT" (nur wenn explizit erwähnt)
- diet_filter: "vegan", "vegetarian", "pescatarian" (nur wenn explizit erwähnt)

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

User: "Ich bin müde und an der HTW"
→ {"intent": "recommendation", "search_params": {"query": null, "mood": "energy", "university_target": "HTW", "diet_filter": null}, "detected_language": "de", "reply_text": "Perfekt! Hier sind deftige Gerichte von der HTW, die dir Energie geben:"}

User: "Ja, gerne"
→ {"intent": "affirmation", "search_params": {"query": null, "mood": null, "university_target": null, "diet_filter": null}, "detected_language": "de", "reply_text": "Alles klar!"}

User: "Show me vegan pasta"
→ {"intent": "recommendation", "search_params": {"query": "pasta", "mood": null, "university_target": null, "diet_filter": "vegan"}, "detected_language": "en", "reply_text": "Great! Here are vegan pasta dishes:"}`;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${API_KEY}`,
            },
            body: JSON.stringify({
                model: MODEL,
                messages: [
                    { role: 'system', content: systemPrompt },
                    ...history.slice(-4),
                    { role: 'user', content: userMessage },
                ],
                temperature: 0.3,
                response_format: { type: 'json_object' },
            }),
        });

        if (!response.ok) {
            throw new Error(`LLM API Error: ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        if (!content) {
            throw new Error('Empty LLM response');
        }

        const parsed: LLMIntentResponse = JSON.parse(content);

        // Validate and sanitize
        if (!parsed.intent) {
            parsed.intent = 'recommendation';
        }
        if (!parsed.search_params) {
            parsed.search_params = {
                query: null,
                mood: null,
                university_target: null,
                diet_filter: null,
            };
        }
        if (!parsed.detected_language) {
            parsed.detected_language = 'de';
        }
        if (!parsed.reply_text) {
            parsed.reply_text =
                parsed.detected_language === 'de'
                    ? 'Wie kann ich dir helfen?'
                    : 'How can I help you?';
        }

        return parsed;
    } catch (error) {
        console.error('LLM Intent Analysis Error:', error);

        return {
            intent: 'recommendation',
            search_params: {
                query: null,
                mood: null,
                university_target: null,
                diet_filter: null,
            },
            detected_language: 'de',
            reply_text: t('aiChef.errors.couldNotProcess'),
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

    // Step 1: Analyze intent with LLM
    const llmResponse = await analyzeIntentWithLLM(prompt, history);
    const { intent, search_params, detected_language, reply_text } = llmResponse;
    const preferredUniId: string | undefined = context.preferredUniversityId;

    console.log('🧠 LLM Analysis:', {
        intent,
        search_params,
        detected_language,
    });
    console.log('🏫 preferredUniversityShort:', context.preferredUniversityShort);

    // Step 2: Handle based on intent
    switch (intent) {
        case 'question':
            return {
                text: reply_text + '\n\n' + t(`aiChef.messages.showMatchingDishes.${detected_language}`),
                recommendedMeals: [],
            };

        case 'smalltalk':
            return {
                text: reply_text,
                recommendedMeals: [],
            };

        case 'affirmation':
            const lastAssistantMsg = history
                ?.slice()
                .reverse()
                .find((m) => m.role === 'assistant');

            if (!lastAssistantMsg?.content.includes(t(`aiChef.messages.matchingDishes.${detected_language}`))) {
                return {
                    text: t(`aiChef.messages.whatToKnowMore.${detected_language}`),
                    recommendedMeals: [],
                };
            }

            const topicMatch = lastAssistantMsg.content.match(/^(\w+)\s+(ist|is)/i);
            const topic = topicMatch ? topicMatch[1].toLowerCase() : null;

            if (!topic) {
                return {
                    text: t(`aiChef.messages.topicNotUnderstood.${detected_language}`),
                    recommendedMeals: [],
                };
            }

            search_params.query = topic;
            break;

        case 'recommendation':
            break;

        default:
            return {
                text: reply_text,
                recommendedMeals: [],
            };
    }

    // Step 3: Generate Recommendations
    let locationIds: string[] = [];
    if (search_params.university_target) {
        locationIds = getMensaIdsForUniversity(search_params.university_target, context.mensas);

        if (locationIds.length === 0) {
            return {
                text: t(`aiChef.errors.universityNotFound.${detected_language}`, {
                    university: search_params.university_target
                }),
                recommendedMeals: [],
            };
        }
    }

    function deduplicateRecommendedMeals(
        meals: { mealId: string; reason: string }[]
    ) {
        const seen = new Set<string>();
        return meals.filter((m) => {
            if (seen.has(m.mealId)) return false;
            seen.add(m.mealId);
            return true;
        });
    }


    // 🔥 DEDUPLICATION: remove duplicate meals (same mealId + canteen + date)
    const uniqueMealMap = new Map<string, Meal>();

    for (const meal of context.meals) {
        const key = `${meal.id}_${meal.canteenId}_${meal.date}`;
        if (!uniqueMealMap.has(key)) {
            uniqueMealMap.set(key, meal);
        }
    }

    const deduplicatedMeals = Array.from(uniqueMealMap.values());

    // Apply hard filters (safety first!)
    let filteredMeals = applyHardFilters(deduplicatedMeals, context, locationIds);

    console.log('🔍 After hard filters:', filteredMeals.length, 'meals (diet:', context.userPreferences?.dietType, ')');

// ✅ Uni-Filter (User-Intent hat Vorrang vor Profil)
    const activeUniversity =
        search_params.university_target ??
        context.preferredUniversityShort;

    if (activeUniversity) {
        console.log(`🏫 APPLYING UNIVERSITY FILTER: ${activeUniversity}`);

        const beforeCount = filteredMeals.length;

        filteredMeals = filteredMeals.filter((meal) => {
            const mensa = context.mensas.find(m => m.id === meal.canteenId);
            if (!mensa) return false;

            return canteenBelongsToUniversity(mensa.name, activeUniversity);
        });

        console.log(
            `🎓 University filter result: ${beforeCount} → ${filteredMeals.length} meals (kept only ${activeUniversity})`
        );


        if (filteredMeals.length > 0) {
            console.log('📋 Sample meals from', activeUniversity + ':',
                filteredMeals.slice(0, 3).map(m => ({
                    name: m.name,
                    mensa: context.mensas.find(c => c.id === m.canteenId)?.name
                }))
            );
        }
    }

    console.log('🔍 After hard filters:', filteredMeals.length, 'meals (diet:', context.userPreferences?.dietType, ')');

    // Debug: Show first 3 meal names
    if (filteredMeals.length > 0) {
        console.log('📋 Sample meals:', filteredMeals.slice(0, 3).map(m => m.name));
    }

    // Apply query filter
    if (search_params.query) {
        filteredMeals = filteredMeals.filter((meal) => matchesQuery(meal, search_params.query));
        console.log('🔍 After query filter:', filteredMeals.length, 'meals');
    }


    // Apply diet filter from search params (if different from user prefs)
    if (search_params.diet_filter) {
        filteredMeals = filteredMeals.filter((meal) =>
            matchesDiet(meal, search_params.diet_filter || undefined)
        );
        console.log('🔍 After diet filter:', filteredMeals.length, 'meals');
    }

    // Sort by relevance
    filteredMeals = sortMealsByRelevance(filteredMeals, context, search_params);

    // Limit to top 10
    filteredMeals = filteredMeals.slice(0, 10);

    if (filteredMeals.length === 0) {
        // 🔒 WICHTIG: Wenn Profil-Uni gesetzt → KEIN Cross-Uni-Fallback
        if (context.preferredUniversityId) {
            return {
                text:
                    detected_language === 'de'
                        ? 'An deiner Hochschule gibt es aktuell keine passenden Gerichte.'
                        : 'There are currently no matching dishes at your university.',
                recommendedMeals: [],
            };
        }

        // 🌍 Nur OHNE Profil-Uni darf es ein globales Fallback geben
        const fallbackMeals = sortMealsByRelevance(
            context.meals,
            context,
            search_params
        ).slice(0, 10);

        return {
            text: t(`aiChef.errors.noMatchingDishes.${detected_language}`),
            recommendedMeals: fallbackMeals.map(meal => ({
                meal,
                reason:
                    detected_language === 'de'
                        ? 'Verfügbares Gericht'
                        : 'Available dish',
            })),
        };
    }


        // Translate meals if needed
    const translatedMeals = filteredMeals.map((meal) =>
        translateMealContent(meal, detected_language)
    );

// Build recommendations
    let recommendedMeals = translatedMeals.map((meal) => ({
        meal,
        reason: generateReasonText(meal, context, search_params, detected_language),
    }));


// ✅ FINAL DEDUPLICATION
    const seen = new Set<string>();
    recommendedMeals = recommendedMeals.filter((m) => {
        const key = `${m.meal.id}_${m.meal.canteenId}_${m.meal.date}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });


    return {
        text: reply_text,
        recommendedMeals,
    };
}