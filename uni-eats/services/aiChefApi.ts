/**
 * Enhanced Groq API for AI Chef with dietary preferences, mood detection,
 * structured meal recommendations + HARD relevance filtering (post-processing)
 *
 * Fixes TS errors by using the actual Meal shape used in this project:
 * - Meal has NO `allergens` property
 * - Additives use `.text` (not `.name`)
 * - Prices use `.priceType` (not `.status`)
 * - Avoid implicit any
 */

const API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY || '';
const API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.1-8b-instant';

import { Canteen, Meal } from '@/services/mensaApi';
import { t } from '@/utils/i18n';

// Extended user preferences
export interface UserPreferences {
    allergies?: string[];
    dietType?: 'vegetarian' | 'vegan' | 'pescatarian' | 'none';
    dailyBudget?: number;
    spentToday?: number;
    frequentCategories?: string[];
    avoidedCategories?: string[];
}

export interface AIChefContext {
    mensas: Canteen[];
    meals: Meal[];
    favoriteCanteenIds?: string[];
    favoriteMealIds?: string[];
    userPreferences?: UserPreferences;
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

export type AIChefResponse = {
    text: string;
    recommendedMeals?: Array<{
        mealId: string;
        reason: string;
    }>;
};

const MOOD_KEYWORDS = {
    tired: ['müde', 'erschöpft', 'schlapp', 'energielos', 'tired', 'exhausted'],
    stressed: ['gestresst', 'stress', 'hektisch', 'stressed', 'busy'],
    hungry: ['hungrig', 'verhungert', 'starving', 'sehr hungrig'],
    light: ['leicht', 'frisch', 'light', 'gesund', 'healthy'],
    comfort: ['comfort', 'gemütlich', 'herzhaft', 'soul food', 'deftig'],
    quick: ['schnell', 'eilig', 'quick', 'fast', 'in eile'],
};

function detectMood(message: string): string[] {
    const lowerMsg = message.toLowerCase();
    const detectedMoods: string[] = [];
    for (const [mood, keywords] of Object.entries(MOOD_KEYWORDS)) {
        if (keywords.some((keyword) => lowerMsg.includes(keyword))) {
            detectedMoods.push(mood);
        }
    }
    return detectedMoods;
}

function analyzeBudget(preferences?: UserPreferences): string {
    if (!preferences?.dailyBudget) return '';
    const remaining = preferences.dailyBudget - (preferences.spentToday || 0);
    if (remaining <= 0) return 'CRITICAL: User has exceeded daily budget!';
    if (remaining < 3) return `BUDGET ALERT: Only €${remaining.toFixed(2)} remaining today. Suggest cheapest options.`;
    if (remaining < 5) return `Budget conscious: €${remaining.toFixed(2)} left. Prefer affordable meals.`;
    return `Budget available: €${remaining.toFixed(2)} for today.`;
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRad(deg: number): number {
    return deg * (Math.PI / 180);
}

function analyzeMensaProximity(context: AIChefContext): string {
    if (!context.userLocation || context.mensas.length === 0) return '';
    const { latitude: userLat, longitude: userLon } = context.userLocation;

    const mensasWithDistance = context.mensas
        .map((mensa) => {
            const geoLoc = mensa.address?.geoLocation;
            if (!geoLoc?.latitude || !geoLoc?.longitude) return null;
            const distance = calculateDistance(userLat, userLon, geoLoc.latitude, geoLoc.longitude);
            return { name: mensa.name, distance };
        })
        .filter((x): x is { name: string; distance: number } => Boolean(x));

    mensasWithDistance.sort((a, b) => a.distance - b.distance);
    const closest = mensasWithDistance.slice(0, 3);
    if (closest.length === 0) return '';

    const proximityInfo = closest
        .map((m) => `${m.name} (${m.distance < 1 ? Math.round(m.distance * 1000) + 'm' : m.distance.toFixed(1) + 'km'})`)
        .join(', ');

    return `\n📍 LOCATION CONTEXT:\nUser's closest mensas: ${proximityInfo}\nIMPORTANT: Prioritize recommendations from nearby mensas unless user specifically asks for others.`;
}

function getStudentPrice(meal: Meal): string {
    const p = meal.prices?.find((x) => x.priceType === 'Studierende')?.price;
    if (typeof p === 'number' && Number.isFinite(p)) return `€${p.toFixed(2)}`;
    return '';
}

/**
 * ===== HARD FILTER (Relevance Enforcement) =====
 * Fix: LLM sometimes suggests non-matching meals (e.g., rice when asked for pasta).
 * We enforce strict relevance after parsing the model's JSON.
 */
type FoodIntentKey =
    | 'pasta'
    | 'reis'
    | 'pizza'
    | 'burger'
    | 'salat'
    | 'suppe'
    | 'wrap'
    | 'curry'
    | 'pommes'
    | 'dessert';

function extractFoodIntents(userMessage: string): FoodIntentKey[] {
    const m = userMessage.toLowerCase();
    const intents: FoodIntentKey[] = [];

    // Pasta / Nudeln
    if (
        m.includes('pasta') ||
        m.includes('nudel') ||
        m.includes('spaghetti') ||
        m.includes('penne') ||
        m.includes('tagliatelle') ||
        m.includes('tortellini') ||
        m.includes('lasagne') ||
        m.includes('gnocchi')
    ) {
        intents.push('pasta');
    }

    // Reis
    if (m.includes('reis') || m.includes('risotto') || m.includes('biryani') || m.includes('fried rice')) {
        intents.push('reis');
    }

    if (m.includes('pizza')) intents.push('pizza');
    if (m.includes('burger')) intents.push('burger');
    if (m.includes('salat') || m.includes('bowl')) intents.push('salat');
    if (m.includes('suppe') || m.includes('ramen')) intents.push('suppe');
    if (m.includes('wrap') || m.includes('döner') || m.includes('doener') || m.includes('kebab')) intents.push('wrap');
    if (m.includes('curry')) intents.push('curry');
    if (m.includes('pommes') || m.includes('fries')) intents.push('pommes');
    if (m.includes('dessert') || m.includes('kuchen') || m.includes('pudding')) intents.push('dessert');

    return Array.from(new Set(intents));
}

function mealMatchesIntent(meal: Meal, intents: FoodIntentKey[]): boolean {
    if (intents.length === 0) return true;

    const hay = `${meal.name} ${meal.category ?? ''}`.toLowerCase();

    const rules: Record<FoodIntentKey, string[]> = {
        pasta: ['pasta', 'nudel', 'spaghetti', 'penne', 'tagliatelle', 'tortellini', 'lasagne', 'gnocchi'],
        reis: ['reis', 'risotto', 'biryani', 'fried rice'],
        pizza: ['pizza'],
        burger: ['burger'],
        salat: ['salat', 'bowl'],
        suppe: ['suppe', 'ramen'],
        wrap: ['wrap', 'döner', 'doener', 'kebab'],
        curry: ['curry'],
        pommes: ['pommes', 'fries'],
        dessert: ['dessert', 'kuchen', 'pudding'],
    };

    // OR-Match: if user mentions multiple intents, any match is okay.
    return intents.some((intent) => rules[intent].some((k) => hay.includes(k)));
}

function friendlyIntentLabel(intents: FoodIntentKey[]): string {
    if (intents.length === 1) {
        const map: Record<FoodIntentKey, string> = {
            pasta: 'Pasta-Gerichte',
            reis: 'Reisgerichte',
            pizza: 'Pizza',
            burger: 'Burger',
            salat: 'Salate/Bowls',
            suppe: 'Suppen',
            wrap: 'Wraps',
            curry: 'Currys',
            pommes: 'Pommes',
            dessert: 'Desserts',
        };
        return map[intents[0]];
    }
    return 'deine Auswahl';
}

function buildSystemPrompt(context: AIChefContext, userMessage: string) {
    const mealsCount = context.meals?.length ?? 0;

    if (mealsCount === 0) {
        return `You are "AI Chef". No meal data available right now. Say: "Leider kann ich gerade keine Speisedaten abrufen. Bitte versuche es später nochmal! 😊"`;
    }

    const preferences = context.userPreferences;
    const detectedMoods = detectMood(userMessage);

    // KOMPAKTE Meal-Liste (nur die wichtigsten 30 Meals)
    const filteredMeals = context.meals
        .filter((meal) => {
            // Filter by allergens (heuristic: search in name + additives text)
            if (preferences?.allergies && preferences.allergies.length > 0) {
                const additivesText = meal.additives?.map((a) => a.text).join(' ') ?? '';
                const mealText = `${meal.name} ${additivesText}`.toLowerCase();
                const hasAllergen = preferences.allergies.some((a) => mealText.includes(a.toLowerCase()));
                if (hasAllergen) return false;
            }

            // Filter by diet (based on badges/name heuristics)
            if (preferences?.dietType === 'vegan') {
                const badges = meal.badges?.map((b) => b.name.toLowerCase()) ?? [];
                if (!badges.includes('vegan') && !meal.name.toLowerCase().includes('vegan')) return false;
            }

            if (preferences?.dietType === 'vegetarian') {
                const hasMeat = ['fleisch', 'chicken', 'hähn', 'rind', 'schwein', 'pute', 'wurst', 'speck'].some((m) =>
                    meal.name.toLowerCase().includes(m)
                );
                if (hasMeat) return false;
            }

            return true;
        })
        .slice(0, 30); // MAX 30 Meals!

    let mealInfo = '🍽️ Available Meals (INTERNAL DATA - DO NOT OUTPUT THIS LIST TO USER):\n';
    for (const meal of filteredMeals) {
        const mensaName = context.mensas.find((m) => m.id === meal.canteenId)?.name?.substring(0, 20) ?? 'Unknown';
        const price = getStudentPrice(meal);
        mealInfo += `${meal.id}|${meal.name.substring(0, 40)}@${mensaName}|${price}\n`;
    }

    let contextInfo = '';
    if (preferences?.allergies && preferences.allergies.length > 0) {
        contextInfo += `⚠️ Allergies: ${preferences.allergies.join(',')}\n`;
    }
    if (preferences?.dietType && preferences.dietType !== 'none') {
        contextInfo += `🌱 Diet: ${preferences.dietType}\n`;
    }
    if (detectedMoods.length > 0) {
        contextInfo += `😊 Mood: ${detectedMoods.join(',')}\n`;
    }
    const budgetInfo = analyzeBudget(preferences);
    if (budgetInfo) {
        contextInfo += `💶 ${budgetInfo}\n`;
    }
    const proximityInfo = analyzeMensaProximity(context);
    if (proximityInfo) {
        contextInfo += proximityInfo.substring(0, 150) + '\n';
    }

    return `AI Chef for Berlin student cafeterias.

RULES:
1. NO allergens in recommendations
2. Max 3 meals
3. Short response (2-3 sentences)
4. Use meal IDs from list
5. Be helpful and friendly.

${contextInfo}
${mealInfo}`.trim();
}

type ParsedMealRec = { id?: unknown; reason?: unknown };
type ParsedAiJson = { text?: unknown; meals?: unknown };

export async function getAiChefResponse(
    prompt: string,
    context: AIChefContext,
    history?: AIChefHistoryMessage[]
): Promise<AIChefResponse> {
    if (!API_KEY) {
        return { text: t('aiChef.errors.missingApiKey') };
    }

    const systemPrompt = buildSystemPrompt(context, prompt);
    const safeHistory = (history ?? [])
        .filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
        .slice(-8)
        .map((m) => ({ role: m.role, content: m.content }));

    const promptLower = prompt.toLowerCase();

    // Trigger-Wörter
    const isRecommendationQuery =
        promptLower.includes('empfehlung') ||
        promptLower.includes('vorschlag') ||
        promptLower.includes('was soll') ||
        promptLower.includes('was gibt') ||
        promptLower.includes('zeig') ||
        promptLower.includes('such') ||
        promptLower.includes('find') ||
        promptLower.includes('essen') ||
        promptLower.includes('gericht') ||
        promptLower.includes('heute') ||
        promptLower.includes('nah') ||
        promptLower.includes('günstig') ||
        promptLower.includes('vegan') ||
        promptLower.includes('vegetarisch') ||
        promptLower.includes('pasta') ||
        promptLower.includes('burger') ||
        promptLower.includes('pizza') ||
        promptLower.includes('salat') ||
        promptLower.includes('suppe');

    // Verbesserter Prompt für semantische Genauigkeit
    const enhancedPrompt =
        systemPrompt +
        (isRecommendationQuery && context.meals.length > 0
            ? `

IMPORTANT INSTRUCTION FOR JSON OUTPUT:
The user is asking for specific meals. You MUST return a VALID JSON object.

RULES FOR SELECTION:
1. STRICT RELEVANCE: If the user asks for a specific food (e.g., "Pasta", "Burger", "Schnitzel"), ONLY return meals that strictly match that category. Do NOT recommend Rice or Stew if the user asked for Pasta.
2. If no meals match the specific request, explain that in the "text" field and suggest the best available alternatives in the "meals" array.
3. Max 3 meals.

JSON format:
{"text":"Short engaging intro text here","meals":[{"id":"meal_id","reason":"Short reason why (e.g. 'This is a delicious Pasta dish')"}]}

Do NOT use Markdown. Return RAW JSON.`
            : '');

    const requestBody = {
        model: MODEL,
        messages: [{ role: 'system', content: enhancedPrompt }, ...safeHistory, { role: 'user', content: prompt }],
        max_tokens: 450,
        temperature: 0.2,
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
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
            throw new Error(t('aiChef.errors.invalidResponse'));
        }

        let cleanResponse = aiResponse.trim();

        if (isRecommendationQuery && context.meals.length > 0) {
            try {
                // Markdown entfernen
                cleanResponse = cleanResponse.replace(/```json/g, '').replace(/```/g, '').trim();

                const firstBrace = cleanResponse.indexOf('{');
                const lastBrace = cleanResponse.lastIndexOf('}');

                if (firstBrace !== -1 && lastBrace !== -1) {
                    const jsonCandidate = cleanResponse.substring(firstBrace, lastBrace + 1);
                    const parsed: ParsedAiJson = JSON.parse(jsonCandidate);

                    const parsedText = typeof parsed.text === 'string' ? parsed.text : '';
                    const parsedMeals = Array.isArray(parsed.meals) ? (parsed.meals as ParsedMealRec[]) : [];

                    if (parsedText && parsedMeals.length > 0) {
                        const intents = extractFoodIntents(prompt);
                        const matchingPool = intents.length > 0 ? context.meals.filter((meal) => mealMatchesIntent(meal, intents)) : [];
                        const matchingIds = new Set(matchingPool.map((m) => m.id));

                        const validMeals = parsedMeals
                            .map((m) => {
                                const id = typeof m.id === 'string' ? m.id : '';
                                const reason = typeof m.reason === 'string' ? m.reason : '';
                                return { mealId: id, reason };
                            })
                            .filter((m) => Boolean(m.mealId) && context.meals.some((meal) => meal.id === m.mealId));

                        // ✅ HARD relevance filter: if user asked specifically (e.g., pasta) and we have matching meals in context
                        if (intents.length > 0 && matchingPool.length > 0) {
                            const strictlyRelevant = validMeals.filter((m) => matchingIds.has(m.mealId));

                            if (strictlyRelevant.length > 0) {
                                return { text: parsedText, recommendedMeals: strictlyRelevant.slice(0, 3) };
                            }

                            // Model suggested wrong stuff -> replace with actually matching meals from context
                            const fallback = matchingPool.slice(0, 3).map((m) => ({
                                mealId: m.id,
                                reason: `Passt zu ${friendlyIntentLabel(intents)}.`,
                            }));

                            return {
                                text: `Ich zeige dir passende ${friendlyIntentLabel(intents)}:`,
                                recommendedMeals: fallback,
                            };
                        }

                        // If user asked specifically but none exist today -> allow alternatives, but be transparent
                        if (intents.length > 0 && matchingPool.length === 0 && validMeals.length > 0) {
                            return {
                                text: `Ich finde heute leider keine passenden ${friendlyIntentLabel(intents)} – hier sind die besten Alternativen:`,
                                recommendedMeals: validMeals.slice(0, 3),
                            };
                        }

                        if (validMeals.length > 0) {
                            return { text: parsedText, recommendedMeals: validMeals.slice(0, 3) };
                        }
                    }
                }
            } catch (parseError) {
                console.log('JSON Parse failed, falling back to clean text:', parseError);
            }
        }

        return { text: cleanResponse };
    } catch (error) {
        console.error('AI Chef error:', error);
        throw new Error(t('aiChef.errors.generic'));
    }
}
