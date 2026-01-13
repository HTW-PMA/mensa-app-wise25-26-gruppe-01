/**
 * Enhanced Groq API for AI Chef with dietary preferences, mood detection, and budget tracking
 */

const API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY || '';
const API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.1-8b-instant';

import { Canteen, Meal } from '@/services/mensaApi';
import { t } from '@/utils/i18n';

// Extended user preferences
export interface UserPreferences {
    // Dietary restrictions
    allergies?: string[]; // e.g., ["Gluten", "Lactose", "Nuts"]
    dietType?: 'vegetarian' | 'vegan' | 'pescatarian' | 'none';

    // Budget
    dailyBudget?: number; // e.g., 5.00
    spentToday?: number;

    // Learned preferences (from user history)
    frequentCategories?: string[]; // e.g., ["Pasta", "Salat"]
    avoidedCategories?: string[];
}

export interface AIChefContext {
    mensas: Canteen[];
    meals: Meal[];
    favoriteCanteenIds?: string[];
    favoriteMealIds?: string[];

    // NEW: User preferences
    userPreferences?: UserPreferences;

    // NEW: User location for proximity-based recommendations
    userLocation?: {
        latitude: number;
        longitude: number;
    };

    contextStatus?: {
        isLoadingContext?: boolean;
        isErrorContext?: boolean;
    };
}

export type AIChefHistoryMessage = {
    role: 'user' | 'assistant';
    content: string;
};

// Mood detection keywords
const MOOD_KEYWORDS = {
    tired: ['müde', 'erschöpft', 'schlapp', 'energielos', 'tired', 'exhausted'],
    stressed: ['gestresst', 'stress', 'hektisch', 'stressed', 'busy'],
    hungry: ['hungrig', 'verhungert', 'starving', 'sehr hungrig'],
    light: ['leicht', 'frisch', 'light', 'gesund', 'healthy'],
    comfort: ['comfort', 'gemütlich', 'herzhaft', 'soul food', 'deftig'],
    quick: ['schnell', 'eilig', 'quick', 'fast', 'in eile'],
};

// Budget suggestions
const BUDGET_CATEGORIES = {
    cheap: 3.50,
    moderate: 5.00,
    expensive: 7.00,
};

/**
 * Detects user mood from message
 */
function detectMood(message: string): string[] {
    const lowerMsg = message.toLowerCase();
    const detectedMoods: string[] = [];

    for (const [mood, keywords] of Object.entries(MOOD_KEYWORDS)) {
        if (keywords.some(keyword => lowerMsg.includes(keyword))) {
            detectedMoods.push(mood);
        }
    }

    return detectedMoods;
}

/**
 * Analyzes budget constraints
 */
function analyzeBudget(preferences?: UserPreferences): string {
    if (!preferences?.dailyBudget) return '';

    const remaining = preferences.dailyBudget - (preferences.spentToday || 0);

    if (remaining <= 0) {
        return 'CRITICAL: User has exceeded daily budget!';
    } else if (remaining < 3) {
        return `BUDGET ALERT: Only â‚¬${remaining.toFixed(2)} remaining today. Suggest cheapest options.`;
    } else if (remaining < 5) {
        return `Budget conscious: â‚¬${remaining.toFixed(2)} left. Prefer affordable meals.`;
    }

    return `Budget available: â‚¬${remaining.toFixed(2)} for today.`;
}

/**
 * Calculates distance between two coordinates in km
 */
function calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    const R = 6371; // Earth radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRad(deg: number): number {
    return deg * (Math.PI / 180);
}

/**
 * Analyzes mensa proximity and returns sorted list with distances
 */
function analyzeMensaProximity(context: AIChefContext): string {
    if (!context.userLocation || context.mensas.length === 0) {
        return '';
    }

    const { latitude: userLat, longitude: userLon } = context.userLocation;

    // Calculate distances for all mensas
    const mensasWithDistance = context.mensas
        .map(mensa => {
            const geoLoc = mensa.address?.geoLocation;
            if (!geoLoc?.latitude || !geoLoc?.longitude) {
                return null;
            }

            const distance = calculateDistance(
                userLat,
                userLon,
                geoLoc.latitude,
                geoLoc.longitude
            );

            return { name: mensa.name, distance };
        })
        .filter(Boolean) as Array<{ name: string; distance: number }>;

    // Sort by distance
    mensasWithDistance.sort((a, b) => a.distance - b.distance);

    // Get closest 3 mensas
    const closest = mensasWithDistance.slice(0, 3);

    if (closest.length === 0) return '';

    const proximityInfo = closest
        .map(m => `${m.name} (${m.distance < 1 ? Math.round(m.distance * 1000) + 'm' : m.distance.toFixed(1) + 'km'})`)
        .join(', ');

    return `\nðŸ“ LOCATION CONTEXT:
User's closest mensas: ${proximityInfo}
IMPORTANT: Prioritize recommendations from nearby mensas unless user specifically asks for others.`;
}
function getStudentPrice(meal: Meal): string {
    const p = meal.prices?.find((x) => x.priceType === 'Studierende')?.price;
    if (typeof p === 'number' && Number.isFinite(p)) return `â‚¬${p.toFixed(2)}`;
    return '';
}

/**
 * Analyzes meals for allergens and dietary compatibility
 */
function analyzeMealCompatibility(meal: Meal, preferences?: UserPreferences): string {
    const warnings: string[] = [];

    // Check allergies
    if (preferences?.allergies && preferences.allergies.length > 0) {
        const mealAdditives = meal.additives?.map(a => a.text.toLowerCase()) || [];
        const mealName = meal.name.toLowerCase();

        for (const allergy of preferences.allergies) {
            const allergyLower = allergy.toLowerCase();
            // Check if allergen appears in name or additives
            if (mealName.includes(allergyLower) ||
                mealAdditives.some(a => a.includes(allergyLower))) {
                warnings.push(`âš ï¸ Contains ${allergy}`);
            }
        }
    }

    // Check diet type
    if (preferences?.dietType) {
        const badges = meal.badges?.map(b => b.name.toLowerCase()) || [];
        const mealName = meal.name.toLowerCase();

        switch (preferences.dietType) {
            case 'vegan':
                if (!badges.includes('vegan') && !mealName.includes('vegan')) {
                    warnings.push('âŒ Not vegan');
                }
                break;
            case 'vegetarian':
                const hasMeat = ['fleisch', 'chicken', 'rind', 'schwein', 'hähnchen'].some(m => mealName.includes(m));
                if (hasMeat) {
                    warnings.push('âŒ Contains meat');
                }
                break;
        }
    }

    return warnings.length > 0 ? ` [${warnings.join(', ')}]` : '';
}

/**
 * Infers user preferences from favorites
 */
function inferPreferences(context: AIChefContext): string {
    const { favoriteMealIds, meals } = context;

    if (!favoriteMealIds || favoriteMealIds.length === 0) {
        return 'No clear preferences yet.';
    }

    const favMeals = meals.filter(m => favoriteMealIds.includes(m.id));

    // Analyze categories
    const categories = favMeals
        .map(m => m.category)
        .filter(Boolean) as string[];

    const categoryCount: Record<string, number> = {};
    categories.forEach(cat => {
        categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    });

    const topCategories = Object.entries(categoryCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([cat]) => cat);

    if (topCategories.length > 0) {
        return `User frequently likes: ${topCategories.join(', ')}`;
    }

    return 'No clear category preferences.';
}

/**
 * Builds enhanced system prompt with all features
 */
function buildSystemPrompt(context: AIChefContext, userMessage: string) {
    const mensasCount = context.mensas?.length ?? 0;
    const mealsCount = context.meals?.length ?? 0;

    const isLoading = context.contextStatus?.isLoadingContext ?? false;
    const isError = context.contextStatus?.isErrorContext ?? false;

    const favoriteCanteenIds = Array.isArray(context.favoriteCanteenIds) ? context.favoriteCanteenIds : [];
    const favoriteMealIds = Array.isArray(context.favoriteMealIds) ? context.favoriteMealIds : [];

    const favoriteMensasByName = favoriteCanteenIds
        .map((id) => context.mensas.find((m) => m.id === id)?.name)
        .filter(Boolean) as string[];

    const favoriteMealsByName = favoriteMealIds
        .map((id) => context.meals.find((m) => m.id === id)?.name)
        .filter(Boolean) as string[];

    // MOOD DETECTION
    const detectedMoods = detectMood(userMessage);
    const moodContext = detectedMoods.length > 0
        ? `\nDETECTED MOOD: ${detectedMoods.join(', ')}
- tired/müde: suggest energy-rich meals (protein, carbs)
- stressed: suggest comfort food or quick options
- hungry/verhungert: suggest filling, substantial meals
- light/leicht: suggest salads, light dishes
- comfort: suggest hearty, warming dishes
- quick/schnell: suggest fast-to-eat options`
        : '';

    // DIETARY RESTRICTIONS
    const preferences = context.userPreferences;
    let dietaryInfo = '';

    if (preferences?.allergies && preferences.allergies.length > 0) {
        dietaryInfo += `\nâš ï¸ USER ALLERGIES: ${preferences.allergies.join(', ')}
CRITICAL: Never recommend meals containing these allergens!`;
    }

    if (preferences?.dietType && preferences.dietType !== 'none') {
        dietaryInfo += `\nDIET TYPE: ${preferences.dietType}
- Only suggest ${preferences.dietType} compatible meals`;
    }

    // BUDGET TRACKING
    const budgetInfo = analyzeBudget(preferences);
    const budgetContext = budgetInfo ? `\nðŸ’¶ ${budgetInfo}` : '';

    // LEARNED PREFERENCES
    const learnedPrefs = inferPreferences(context);

    // LOCATION-BASED PROXIMITY
    const proximityInfo = analyzeMensaProximity(context);

    // COMPARISON MODE
    const isComparison = userMessage.toLowerCase().includes('vergleich') ||
        userMessage.toLowerCase().includes('besser') ||
        userMessage.toLowerCase().includes('vs') ||
        userMessage.includes('oder');

    const comparisonHint = isComparison ? `
ðŸ“Š COMPARISON MODE DETECTED
- Compare meals side-by-side
- Mention: price, calories (if available), dietary fit, allergens
- Give clear recommendation with reasoning` : '';

    // Build meals list with compatibility info
    let mealInfo = '';
    if (mealsCount > 0) {
        mealInfo += '\nðŸ½ï¸ Available Meals:\n';
        for (const meal of context.meals) {
            const mensaName = context.mensas.find((m) => m.id === meal.canteenId)?.name ?? 'Unknown';
            const category = meal.category ? ` â€¢ ${meal.category}` : '';
            const price = getStudentPrice(meal);
            const priceTxt = price ? ` â€¢ ${price}` : '';
            const compatibility = analyzeMealCompatibility(meal, preferences);

            mealInfo += `- ${meal.name} @ ${mensaName}${category}${priceTxt}${compatibility}\n`;
        }
    }

    let mensaInfo = '';
    // Only show mensa list if we have meals
    if (mensasCount > 0 && mealsCount > 0) {
        mensaInfo += '\nðŸ“ Available Mensas:\n';
        for (const mensa of context.mensas) {
            mensaInfo += `- ${mensa.name}\n`;
        }
    }

    return `
You are "AI Chef", a smart assistant for Berlin university cafeterias.

ðŸŽ¯ GOAL:
Help students decide what to eat TODAY based on their preferences, dietary needs, and budget.

ðŸš¨ CRITICAL RULES:
1. NEVER recommend meals with user's allergens
2. Respect dietary restrictions (vegan/vegetarian)
3. Consider budget constraints
4. Keep responses SHORT (max 6-10 lines)
5. Give 2-3 specific meal recommendations with reasons
6. NEVER mention Mensa IDs in your response - only use Mensa names
7. Only recommend meals from the "Available Meals" list
8. If no meals available: apologize briefly and ask user to try again later

ðŸ’š USER FAVORITES:
- Favorite mensas (${favoriteMensasByName.length}): ${favoriteMensasByName.join(', ') || 'none'}
- Favorite meals (${favoriteMealsByName.length}): ${favoriteMealsByName.join(', ') || 'none'}
- Learned preferences: ${learnedPrefs}
${dietaryInfo}${budgetContext}${moodContext}${proximityInfo}${comparisonHint}

ðŸ“Š DATA STATUS:
- Mensas: ${mensasCount}
- Meals today: ${mealsCount}
- Loading: ${String(isLoading)}
- Error: ${String(isError)}

${mealsCount === 0 ? `
âš ï¸ CRITICAL: No meal data available right now!
Your response MUST be:
"Leider kann ich gerade keine Speisedaten abrufen. Bitte versuche es in ein paar Minuten nochmal oder schaue direkt in der Mensa vorbei! ðŸ˜Š"
DO NOT list any mensas or IDs!` : ''}
${mensaInfo}${mealInfo}
`.trim();
}

/**
 * Main API function - enhanced with all features
 */
export async function getAiChefResponse(
    prompt: string,
    context: AIChefContext,
    history?: AIChefHistoryMessage[]
): Promise<string> {
    if (!API_KEY) {
        return t('aiChef.errors.missingApiKey');
    }

    const systemPrompt = buildSystemPrompt(context, prompt);

    const safeHistory = (history ?? [])
        .filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
        .slice(-8)
        .map((m) => ({ role: m.role, content: m.content }));

    const requestBody = {
        model: MODEL,
        messages: [
            { role: 'system', content: systemPrompt },
            ...safeHistory,
            { role: 'user', content: prompt },
        ],
        max_tokens: 220,
        temperature: 0.5,
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${API_KEY}`,
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('AI Chef API Error:', response.status, errorText);
            throw new Error(t('aiChef.errors.requestFailed', { status: response.status }));
        }

        const data = await response.json();
        const aiResponse: unknown = data?.choices?.[0]?.message?.content;

        if (typeof aiResponse !== 'string' || aiResponse.trim().length === 0) {
            console.error('Invalid response from AI:', data);
            throw new Error(t('aiChef.errors.invalidResponse'));
        }

        return aiResponse.replace(/\*\*(.*?)\*\*/g, '$1').trim();
    } catch (error) {
        console.error('AI Chef error:', error);
        throw new Error(t('aiChef.errors.generic'));
    }
}

