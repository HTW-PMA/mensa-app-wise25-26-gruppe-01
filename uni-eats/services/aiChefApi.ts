import { Canteen, Meal, University } from '@/services/mensaApi';
import { t } from '@/utils/i18n';

const API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY || '';
const API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.1-8b-instant';

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
}

export type AIChefHistoryMessage = { role: 'user' | 'assistant'; content: string };

export type AIChefResponse = {
    text: string;
    recommendedMeals?: Array<{ mealId: string; reason: string }>;
};

// ------------------------------------------------------------
// Hilfsfunktionen
// ------------------------------------------------------------

const MOOD_KEYWORDS = {
    tired: ['müde', 'erschöpft', 'schlapp', 'energielos', 'kraft', 'power', 'tired'],
    stressed: ['gestresst', 'stress', 'hektisch', 'zeitdruck', 'eilig', 'schnell'],
    hungry: ['hungrig', 'kohldampf', 'bärenhunger', 'starving', 'viel'],
    healthy: ['gesund', 'leicht', 'light', 'abnehmen', 'vitamin', 'frisch'],
};

function detectMood(message: string): string[] {
    const lowerMsg = message.toLowerCase();
    return Object.entries(MOOD_KEYWORDS)
        .filter(([_, keywords]) => keywords.some((k) => lowerMsg.includes(k)))
        .map(([mood]) => mood);
}

type FoodIntentKey =
    | 'pasta'
    | 'reis'
    | 'pizza'
    | 'burger'
    | 'salat'
    | 'suppe'
    | 'dessert'
    | 'schnitzel';

function extractFoodIntents(userMessage: string): FoodIntentKey[] {
    const m = userMessage.toLowerCase();
    const intents: FoodIntentKey[] = [];
    if (m.includes('pasta') || m.includes('nudel') || m.includes('spaghetti')) intents.push('pasta');
    if (m.includes('reis') || m.includes('risotto')) intents.push('reis');
    if (m.includes('pizza')) intents.push('pizza');
    if (m.includes('burger')) intents.push('burger');
    if (m.includes('salat') || m.includes('bowl')) intents.push('salat');
    if (m.includes('suppe') || m.includes('eintopf')) intents.push('suppe');
    if (m.includes('dessert') || m.includes('süß') || m.includes('kuchen')) intents.push('dessert');
    if (m.includes('schnitzel')) intents.push('schnitzel');
    return Array.from(new Set(intents));
}

function mealMatchesIntent(meal: Meal, intents: FoodIntentKey[]): boolean {
    if (intents.length === 0) return true;
    const hay = `${meal.name} ${meal.category ?? ''}`.toLowerCase();
    const rules: Record<FoodIntentKey, string[]> = {
        pasta: ['pasta', 'nudel', 'spaghetti', 'lasagne', 'penne', 'tortellini'],
        reis: ['reis', 'risotto', 'paella', 'curry'],
        pizza: ['pizza', 'flammkuchen'],
        burger: ['burger'],
        salat: ['salat', 'bowl'],
        suppe: ['suppe', 'eintopf', 'stew'],
        dessert: ['dessert', 'kuchen', 'pudding', 'süß'],
        schnitzel: ['schnitzel'],
    };
    return intents.some((intent) => rules[intent].some((k) => hay.includes(k)));
}

function normalizeText(s: string): string {
    return s
        .toLowerCase()
        .replace(/ä/g, 'ae')
        .replace(/ö/g, 'oe')
        .replace(/ü/g, 'ue')
        .replace(/ß/g, 'ss')
        .replace(/[^a-z0-9]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function hasExplicitLocationClaim(message: string): boolean {
    const m = normalizeText(message);
    return (
        (m.includes('ich bin ') && (m.includes(' an der ') || m.includes(' am ') || m.includes(' bei '))) ||
        m.includes('bin an der') ||
        m.includes('bin am') ||
        m.includes('bin bei') ||
        m.includes('an der uni') ||
        m.includes('auf dem campus')
    );
}

function hasExplicitUniClaim(message: string): boolean {
    return /\b(fu|tu|hu|htw|ash|hwr|bht)\b/i.test(message);
}

// ------------------------------------------------------------
// Standort- und Uni-Erkennung (ohne universityId)
// ------------------------------------------------------------

function extractLocationIntentWithUniversity(
    userMessage: string,
    mensas: Canteen[],
    universities?: University[]
): { uniName?: string; mensaIds: string[] } {
    const lowerMsg = normalizeText(userMessage);
    if (!universities || universities.length === 0) return { mensaIds: [] };

    const detectedUniversity = universities.find((u) => {
        const uniNameNorm = normalizeText(u.name);
        const uniShort = u.shortName ? normalizeText(u.shortName) : '';
        return (
            lowerMsg.includes(uniNameNorm) ||
            (uniShort && lowerMsg.includes(uniShort)) ||
            lowerMsg.includes(uniNameNorm.split(' ')[0])
        );
    });

    if (!detectedUniversity) return { mensaIds: [] };

    const uniNorm = normalizeText(detectedUniversity.name);
    const uniShort = detectedUniversity.shortName
        ? normalizeText(detectedUniversity.shortName)
        : '';

    const relevantMensas: Canteen[] = mensas.filter((m: Canteen) => {
        const mensaNorm = normalizeText(m.name);
        return (
            mensaNorm.includes(uniNorm) ||
            (uniShort && mensaNorm.includes(uniShort)) ||
            (lowerMsg.includes('htw') &&
                (mensaNorm.includes('wilhelminenhof') || mensaNorm.includes('treskowallee'))) ||
            (lowerMsg.includes('fu') && mensaNorm.includes('dahlem')) ||
            (lowerMsg.includes('tu') && mensaNorm.includes('marchstr')) ||
            (lowerMsg.includes('ash') && mensaNorm.includes('hellersdorf')) ||
            (lowerMsg.includes('hwr') && mensaNorm.includes('lichtenberg'))
        );
    });

    return { uniName: detectedUniversity.name, mensaIds: relevantMensas.map((m) => m.id) };
}

// ------------------------------------------------------------
// Base-Filter
// ------------------------------------------------------------

function mealPassesBaseFilters(meal: Meal, context: AIChefContext, locationIds: string[]): boolean {
    const allergens = context.userPreferences?.allergies || [];
    const mealText = (meal.name + (meal.additives?.map((a) => a.text).join(' ') || '')).toLowerCase();
    if (allergens.some((a) => mealText.includes(a.toLowerCase()))) return false;

    if (context.userPreferences?.dietType === 'vegan') {
        const isVegan =
            meal.badges?.some((b) => b.name.toLowerCase() === 'vegan') || meal.name.toLowerCase().includes('vegan');
        if (!isVegan) return false;
    }

    if (locationIds.length > 0) {
        if (!meal.canteenId || !locationIds.includes(meal.canteenId ?? '')) return false;
    }

    return true;
}

// ------------------------------------------------------------
// Hauptfunktion
// ------------------------------------------------------------

export async function getAiChefResponse(
    prompt: string,
    context: AIChefContext,
    history?: AIChefHistoryMessage[]
): Promise<AIChefResponse> {
    if (!API_KEY) return { text: t('aiChef.errors.missingApiKey') };

    const promptLower = prompt.toLowerCase();
    const moods = detectMood(promptLower);
    const intents = extractFoodIntents(promptLower);
    const explicitLoc = hasExplicitLocationClaim(prompt);
    const explicitUni = hasExplicitUniClaim(prompt);

    const { uniName, mensaIds } = extractLocationIntentWithUniversity(prompt, context.mensas, context.universities);

    if ((explicitUni || explicitLoc) && mensaIds.length === 0) {
        return {
            text:
                'Ich habe deine Uni/Mensa nicht eindeutig erkannt. Welche Mensa oder welchen Campus meinst du genau? (z.B. „Mensa Wilhelminenhof“, „Treskowallee“, „FU Dahlem“)',
            recommendedMeals: [],
        };
    }

    let filteredMeals = context.meals.filter((meal) => mealPassesBaseFilters(meal, context, mensaIds));

    if (mensaIds.length > 0) {
        filteredMeals = filteredMeals.filter((m) => mensaIds.includes(m.canteenId ?? ''));
    }

    filteredMeals.sort((a, b) => {
        const canteenA = a.canteenId ?? '';
        const canteenB = b.canteenId ?? '';
        const scoreA =
            (context.favoriteMealIds?.includes(a.id) ? 10 : 0) +
            (context.favoriteCanteenIds?.includes(canteenA) ? 5 : 0);
        const scoreB =
            (context.favoriteMealIds?.includes(b.id) ? 10 : 0) +
            (context.favoriteCanteenIds?.includes(canteenB) ? 5 : 0);
        return scoreB - scoreA;
    });

    const systemPrompt = `Du bist der AI Chef. Empfiehl Gerichte aus der Liste.
${moods.length ? `Stimmung: ${moods.join(', ')}.` : ''}
${mensaIds.length ? `WICHTIG: Empfehle nur Gerichte aus den erlaubten Mensen.` : ''}
Antworte NUR als JSON: {"text": "Grundtext", "meals": [{"id": "ID", "reason": "Grund"}]}`;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
            body: JSON.stringify({
                model: MODEL,
                messages: [
                    { role: 'system', content: systemPrompt },
                    ...(history || []).slice(-5),
                    { role: 'user', content: prompt },
                ],
                temperature: 0.2,
                response_format: { type: 'json_object' },
            }),
        });

        const data = await response.json();
        const parsed = JSON.parse(data.choices?.[0]?.message?.content ?? '{"text":"","meals":[]}');

        let validRecs = (parsed.meals || [])
            .map((r: any) => {
                const m = context.meals.find((meal) => meal.id === r.id);
                if (!m) return null;
                if (!mealPassesBaseFilters(m, context, mensaIds)) return null;
                if (intents.length > 0 && !mealMatchesIntent(m, intents)) return null;
                return {
                    mealId: m.id,
                    reason:
                        typeof r.reason === 'string'
                            ? r.reason
                            : mensaIds.length
                                ? 'Aus deiner Universitätsmensa ausgewählt.'
                                : 'Passt zu deiner Suche.',
                };
            })
            .filter(Boolean) as Array<{ mealId: string; reason: string }>;

        const pool =
            intents.length > 0
                ? filteredMeals.filter((m) => mealMatchesIntent(m, intents))
                : filteredMeals;
        const seenIds = new Set(validRecs.map((r) => r.mealId));

        for (const m of pool) {
            if (validRecs.length >= 10) break;
            if (!seenIds.has(m.id)) {
                validRecs.push({
                    mealId: m.id,
                    reason: context.favoriteMealIds?.includes(m.id)
                        ? 'Einer deiner Favoriten!'
                        : mensaIds.length
                            ? 'Von deiner Uni-Mensa empfohlen.'
                            : 'Passt zu deiner Suche.',
                });
                seenIds.add(m.id);
            }
        }

        if (mensaIds.length > 0) {
            validRecs = validRecs.filter((r) => {
                const meal = context.meals.find((m) => m.id === r.mealId);
                return meal && mensaIds.includes(meal.canteenId ?? '');
            });
        }

        if (validRecs.length === 0) {
            const locHint = mensaIds.length > 0 ? ' an deiner Uni' : '';
            return {
                text: `Ich habe heute leider keine passenden Gerichte${locHint} gefunden.`,
                recommendedMeals: [],
            };
        }

        return {
            text:
                parsed.text ||
                (uniName
                    ? `Hier sind einige Gerichte aus der ${uniName}.`
                    : 'Hier sind einige Gerichte, die dir gefallen könnten.'),
            recommendedMeals: validRecs,
        };
    } catch {
        return { text: 'Ich konnte gerade keine passenden Gerichte finden.' };
    }
}
