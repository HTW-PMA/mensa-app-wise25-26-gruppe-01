import { Canteen, Meal, University } from '@/services/mensaApi';
import { t } from '@/utils/i18n';

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
}

export type AIChefHistoryMessage = { role: 'user' | 'assistant'; content: string };

export type AIChefResponse = {
    text: string;
    recommendedMeals?: Array<{ mealId: string; reason: string }>;
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
    HTW: ['wilhelminenhof', 'treskowallee'],
    FU: ['dahlem', 'silberlaube'],
    TU: ['marchstr', 'hauptgebaeude', 'hauptgebäude'],
    ASH: ['hellersdorf'],
    HWR: ['lichtenberg', 'schöneberg'],
    HU: ['adlershof', 'nord', 'süd'],
    BHT: ['luxemburger', 'platanenstraße'],
};

// Mood to Food Category Mapping
const MOOD_PREFERENCES: Record<string, {
    keywords: string[];
    categories: string[];
    avoidCategories?: string[];
}> = {
    energy: {
        keywords: ['schnitzel', 'braten', 'burger', 'meat', 'fleisch', 'steak', 'würstchen'],
        categories: ['Hauptgericht', 'Grill', 'Main Course'],
        avoidCategories: ['Salat', 'Dessert'],
    },
    light: {
        keywords: ['salat', 'bowl', 'gemüse', 'vegetables', 'smoothie', 'soup', 'suppe'],
        categories: ['Salat', 'Bowl', 'Vegetarisch', 'Vegan'],
        avoidCategories: ['Dessert', 'Grill'],
    },
    large: {
        keywords: ['auflauf', 'lasagne', 'schnitzel', 'burger', 'pizza'],
        categories: ['Hauptgericht', 'Main Course', 'Auflauf'],
        avoidCategories: ['Beilage', 'Dessert'],
    },
    fast: {
        keywords: ['wrap', 'sandwich', 'burger', 'pizza', 'pasta'],
        categories: ['Snack', 'Fast Food', 'Quick Meal'],
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
 * Check if meal matches diet requirements
 */
function matchesDiet(meal: Meal, dietType?: 'vegan' | 'vegetarian' | 'pescatarian' | 'none'): boolean {
    if (!dietType || dietType === 'none') return true;

    const badges = meal.badges?.map((b) => normalizeText(b.name)) || [];
    const mealText = normalizeText(meal.name);

    switch (dietType) {
        case 'vegan':
            return badges.includes('vegan') || mealText.includes('vegan');
        case 'vegetarian':
            return (
                badges.includes('vegetarian') ||
                badges.includes('vegan') ||
                mealText.includes('vegetarisch') ||
                mealText.includes('vegetarian')
            );
        case 'pescatarian':
            // Pescatarian: vegetarian + fish
            const hasVeggieOrFish =
                badges.includes('vegetarian') ||
                badges.includes('vegan') ||
                mealText.includes('fisch') ||
                mealText.includes('fish');
            const hasMeat =
                mealText.includes('fleisch') ||
                mealText.includes('meat') ||
                mealText.includes('chicken') ||
                mealText.includes('hähnchen');
            return hasVeggieOrFish && !hasMeat;
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
 * Score meal based on mood preferences
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
            score -= 3;
        }
    }

    return score;
}

/**
 * Sort meals by relevance (favorites > mood > query match)
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
 * Generate reason text for meal recommendation
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
        reasons.push(language === 'de' ? 'Einer deiner Favoriten!' : 'One of your favorites!');
    }

    // Mood-based
    if (searchParams.mood) {
        const moodTexts: Record<string, { de: string; en: string }> = {
            energy: { de: 'Gibt dir Energie', en: 'Gives you energy' },
            light: { de: 'Leicht und gesund', en: 'Light and healthy' },
            large: { de: 'Macht richtig satt', en: 'Very filling' },
            fast: { de: 'Schnell verfügbar', en: 'Quickly available' },
        };
        const moodText = moodTexts[searchParams.mood];
        if (moodText) {
            reasons.push(language === 'de' ? moodText.de : moodText.en);
        }
    }

    // Query match
    if (searchParams.query) {
        reasons.push(
            language === 'de'
                ? `Enthält ${searchParams.query}`
                : `Contains ${searchParams.query}`
        );
    }

    // University
    if (searchParams.university_target) {
        reasons.push(
            language === 'de'
                ? `Von ${searchParams.university_target}`
                : `From ${searchParams.university_target}`
        );
    }

    // Fallback
    if (reasons.length === 0) {
        reasons.push(language === 'de' ? 'Passt zu deiner Suche' : 'Matches your search');
    }

    return reasons.join(' • ');
}

// ============================================================================
// LLM INTEGRATION
// ============================================================================

/**
 * Call LLM to analyze user intent and extract structured data
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

SPRACHE:
- Erkenne ob Deutsch oder Englisch
- reply_text: Antworte in der erkannten Sprache, freundlich und knapp

WICHTIG:
- Bei Fragen: intent="question", keine search_params
- Bei Affirmationen: intent="affirmation", extrahiere Topic aus Konversation
- Bei Standort (z.B. "an der HTW"): university_target setzen
- Mood nur setzen wenn explizit Stimmung/Bedürfnis genannt
- Antworte IMMER als valides JSON!

BEISPIELE:
User: "Was ist Weichkäse?"
→ {"intent": "question", "search_params": {"query": null, "mood": null, "university_target": null, "diet_filter": null}, "detected_language": "de", "reply_text": "Weichkäse ist ein Käse mit hohem Wassergehalt und cremiger Konsistenz, z.B. Camembert oder Brie."}

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
                    ...history.slice(-4), // Last 4 messages for context
                    { role: 'user', content: userMessage },
                ],
                temperature: 0.3, // Low temperature for consistent JSON
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

        // Fallback: Simple heuristic
        return {
            intent: 'recommendation',
            search_params: {
                query: null,
                mood: null,
                university_target: null,
                diet_filter: null,
            },
            detected_language: 'de',
            reply_text: 'Entschuldigung, ich konnte deine Anfrage nicht verarbeiten. Frag mich nach Gerichten!',
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

    console.log('🧠 LLM Analysis:', {
        intent,
        search_params,
        detected_language,
    });

    // Step 2: Handle based on intent
    switch (intent) {
        case 'question':
            // Pure question - no recommendations
            return {
                text: reply_text + (detected_language === 'de'
                    ? '\n\nMöchtest du passende Gerichte dazu sehen?'
                    : '\n\nWould you like to see matching dishes?'),
                recommendedMeals: [],
            };

        case 'smalltalk':
            // Small talk - no recommendations
            return {
                text: reply_text,
                recommendedMeals: [],
            };

        case 'affirmation':
            // User confirmed - extract topic from last assistant message
            const lastAssistantMsg = history
                ?.slice()
                .reverse()
                .find((m) => m.role === 'assistant');

            if (!lastAssistantMsg?.content.includes(detected_language === 'de' ? 'passende Gerichte' : 'matching dishes')) {
                return {
                    text: detected_language === 'de'
                        ? 'Worüber möchtest du mehr erfahren?'
                        : 'What would you like to know more about?',
                    recommendedMeals: [],
                };
            }

            // Extract topic from previous conversation
            const topicMatch = lastAssistantMsg.content.match(/^(\w+)\s+(ist|is)/i);
            const topic = topicMatch ? topicMatch[1].toLowerCase() : null;

            if (!topic) {
                return {
                    text: detected_language === 'de'
                        ? 'Ich habe das Thema nicht verstanden. Frag mich etwas Neues!'
                        : 'I did not understand the topic. Ask me something new!',
                    recommendedMeals: [],
                };
            }

            // Use topic as query
            search_params.query = topic;
            // Continue to recommendation flow below
            break;

        case 'recommendation':
            // Continue to recommendation flow
            break;

        default:
            return {
                text: reply_text,
                recommendedMeals: [],
            };
    }

    // Step 3: Generate Recommendations
    // Get location filter
    let locationIds: string[] = [];
    if (search_params.university_target) {
        locationIds = getMensaIdsForUniversity(search_params.university_target, context.mensas);

        if (locationIds.length === 0) {
            return {
                text:
                    detected_language === 'de'
                        ? `Ich konnte keine Mensa für ${search_params.university_target} finden. Verfügbare Unis: HTW, FU, TU, HU, ASH, HWR, BHT`
                        : `I could not find a canteen for ${search_params.university_target}. Available universities: HTW, FU, TU, HU, ASH, HWR, BHT`,
                recommendedMeals: [],
            };
        }
    }

    // Apply hard filters (safety first!)
    let filteredMeals = applyHardFilters(context.meals, context, locationIds);

    // Apply query filter
    if (search_params.query) {
        filteredMeals = filteredMeals.filter((meal) => matchesQuery(meal, search_params.query));
    }

    // Apply diet filter from search params (if different from user prefs)
    if (search_params.diet_filter) {
        filteredMeals = filteredMeals.filter((meal) =>
            matchesDiet(meal, search_params.diet_filter || undefined)
        );
    }

    // Sort by relevance
    filteredMeals = sortMealsByRelevance(filteredMeals, context, search_params);

    // Limit to top 10
    filteredMeals = filteredMeals.slice(0, 10);

    // No results?
    if (filteredMeals.length === 0) {
        const locationHint = search_params.university_target
            ? ` ${detected_language === 'de' ? 'an der' : 'at'} ${search_params.university_target}`
            : '';

        return {
            text:
                detected_language === 'de'
                    ? `Ich habe leider keine passenden Gerichte${locationHint} gefunden. 😕`
                    : `Sorry, I could not find any matching dishes${locationHint}. 😕`,
            recommendedMeals: [],
        };
    }

    // Translate meals if needed
    const translatedMeals = filteredMeals.map((meal) =>
        translateMealContent(meal, detected_language)
    );

    // Generate recommendations with reasons
    const recommendations = translatedMeals.map((meal) => ({
        mealId: meal.id,
        reason: generateReasonText(meal, context, search_params, detected_language),
    }));

    return {
        text: reply_text,
        recommendedMeals: recommendations,
    };
}