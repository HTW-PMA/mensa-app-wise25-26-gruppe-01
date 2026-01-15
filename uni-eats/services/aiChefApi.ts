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
    lastIntent?: 'question' | 'recommendation' | 'unknown';
    lastTopic?: string;
}

export type AIChefHistoryMessage = { role: 'user' | 'assistant'; content: string };

export type AIChefResponse = {
    text: string;
    recommendedMeals?: Array<{ mealId: string; reason: string }>;
};

const CAMPUS_MAP: Record<string, string[]> = {
    htw: ['wilhelminenhof', 'treskowallee'],
    fu: ['dahlem', 'silberlaube'],
    tu: ['marchstr', 'hauptgebaeude', 'hauptgebäude'],
    ash: ['hellersdorf'],
    hwr: ['lichtenberg', 'schöneberg'],
    hu: ['adlershof', 'nord', 'süd'],
    bht: ['luxemburger', 'platanenstraße'],
};

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
    | 'schnitzel'
    | 'fleisch'
    | 'fisch'
    | 'vegetarisch'
    | 'vegan'
    | 'kartoffel'
    | 'gemüse'
    | 'protein'
    | 'käse'
    | 'ei'
    | 'tofu'
    | 'brot'
    | 'wrap';

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
    if (m.includes('fleisch') || m.includes('meat') || m.includes('hähnchen') || m.includes('huhn') || m.includes('rind') || m.includes('schwein') || m.includes('chicken')) intents.push('fleisch');
    if (m.includes('fisch') || m.includes('lachs') || m.includes('thunfisch') || m.includes('fish')) intents.push('fisch');
    if (m.includes('vegetarisch') || m.includes('veggie') || m.includes('ohne fleisch')) intents.push('vegetarisch');
    if (m.includes('vegan') || m.includes('pflanzlich')) intents.push('vegan');
    if (m.includes('kartoffel') || m.includes('pommes') || m.includes('potato')) intents.push('kartoffel');
    if (m.includes('gemüse') || m.includes('vegetables')) intents.push('gemüse');
    if (m.includes('protein') || m.includes('eiweiß') || m.includes('eiweiss')) intents.push('protein');
    if (m.includes('käse') || m.includes('cheese')) intents.push('käse');
    if (m.includes('ei') || m.includes('egg') || m.includes('omelette')) intents.push('ei');
    if (m.includes('tofu') || m.includes('soja')) intents.push('tofu');
    if (m.includes('brot') || m.includes('sandwich') || m.includes('bread')) intents.push('brot');
    if (m.includes('wrap') || m.includes('burrito')) intents.push('wrap');
    return Array.from(new Set(intents));
}

function mealMatchesIntent(meal: Meal, intents: FoodIntentKey[]): boolean {
    if (intents.length === 0) return true;
    const hay = `${meal.name} ${meal.category ?? ''}`.toLowerCase();
    const badges = meal.badges?.map(b => b.name.toLowerCase()).join(' ') || '';
    const fullText = `${hay} ${badges}`;

    const rules: Record<FoodIntentKey, string[]> = {
        pasta: ['pasta', 'nudel', 'spaghetti', 'lasagne', 'penne', 'tortellini', 'rigatoni', 'tagliatelle'],
        reis: ['reis', 'risotto', 'paella', 'curry', 'rice'],
        pizza: ['pizza', 'flammkuchen'],
        burger: ['burger'],
        salat: ['salat', 'bowl', 'salad'],
        suppe: ['suppe', 'eintopf', 'stew', 'soup'],
        dessert: ['dessert', 'kuchen', 'pudding', 'süß', 'cake', 'eis', 'ice'],
        schnitzel: ['schnitzel'],
        fleisch: ['fleisch', 'hähnchen', 'huhn', 'chicken', 'rind', 'schwein', 'pork', 'beef', 'meat', 'steak', 'würstchen', 'wurst', 'bacon', 'speck', 'lamm', 'ente', 'pute'],
        fisch: ['fisch', 'lachs', 'thunfisch', 'fish', 'salmon', 'tuna', 'garnele', 'shrimp', 'meeresfrüchte', 'seafood'],
        vegetarisch: ['vegetarisch', 'veggie', 'vegetarian'],
        vegan: ['vegan', 'pflanzlich'],
        kartoffel: ['kartoffel', 'pommes', 'potato', 'fries', 'wedges', 'bratkartoffel'],
        gemüse: ['gemüse', 'vegetables', 'brokkoli', 'paprika', 'zucchini', 'aubergine', 'tomate', 'spinat', 'karotte', 'möhre'],
        protein: ['protein', 'eiweiß', 'eiweiss', 'high protein'],
        käse: ['käse', 'cheese', 'mozzarella', 'parmesan', 'gouda', 'feta'],
        ei: ['ei', 'egg', 'omelette', 'rührei', 'spiegelei'],
        tofu: ['tofu', 'soja', 'tempeh', 'seitan'],
        brot: ['brot', 'sandwich', 'bread', 'toast', 'bagel', 'brötchen'],
        wrap: ['wrap', 'burrito', 'tortilla', 'quesadilla'],
    };
    return intents.some((intent) => rules[intent].some((k) => fullText.includes(k)));
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

    const campusKeywords = CAMPUS_MAP[uniShort as keyof typeof CAMPUS_MAP] || [];

    const relevantMensas: Canteen[] = mensas.filter((m: Canteen) => {
        const mensaNorm = normalizeText(m.name);
        return (
            mensaNorm.includes(uniNorm) ||
            (uniShort && mensaNorm.includes(uniShort)) ||
            campusKeywords.some((kw) => mensaNorm.includes(kw))
        );
    });

    return { uniName: detectedUniversity.name, mensaIds: relevantMensas.map((m) => m.id) };
}

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

function isAffirmativeResponse(message: string): boolean {
    const lower = message.toLowerCase().trim();
    const affirmatives = [
        'ja',
        'klar',
        'gerne',
        'bitte',
        'mach das',
        'zeig',
        'okay',
        'ok',
        'natürlich',
        'warum nicht',
        'los',
        'sicher',
        'auf jeden fall'
    ];
    return affirmatives.some((word) => lower === word || lower.includes(word));
}

export async function getAiChefResponse(
    prompt: string,
    context: AIChefContext,
    history?: AIChefHistoryMessage[]
): Promise<AIChefResponse> {
    if (!API_KEY) return { text: t('aiChef.errors.missingApiKey') };

    // ✅ ERSTE PRÜFUNG: Affirmative Response nach einer Frage
    // Prüfe, ob die letzte Assistant-Nachricht eine Frage enthielt
    const lastAssistantMessage = history?.slice().reverse().find(m => m.role === 'assistant');
    const hasQuestionOffer = lastAssistantMessage?.content.includes('Möchtest du passende Gerichte dazu sehen?');

    if (isAffirmativeResponse(prompt) && hasQuestionOffer && lastAssistantMessage) {
        // Extrahiere das Topic aus der letzten Assistant-Nachricht
        // Format: "Weichkäse ist ... \n\nMöchtest du passende Gerichte dazu sehen?"
        const messageText = lastAssistantMessage.content;

        // Finde das Wort vor "ist" oder nehme das erste Substantiv
        const match = messageText.match(/^(\w+)\s+ist/i);
        const topic = match ? match[1].toLowerCase() : '';

        console.log('🔍 Affirmative detected! Extracted topic:', topic);

        if (!topic) {
            return {
                text: 'Worüber möchtest du mehr erfahren?',
                recommendedMeals: [],
            };
        }

        // Filtere Gerichte basierend auf dem Topic
        const intents = extractFoodIntents(topic);

        let filteredMeals = context.meals.filter((meal) => {
            if (!mealPassesBaseFilters(meal, context, [])) return false;

            const mealText = `${meal.name} ${meal.category ?? ''}`.toLowerCase();
            const normalizedTopic = normalizeText(topic);
            const normalizedMeal = normalizeText(mealText);

            // Prüfe ob das Topic im Gericht vorkommt
            return normalizedMeal.includes(normalizedTopic) ||
                mealText.includes(topic) ||
                (intents.length > 0 && mealMatchesIntent(meal, intents));
        });

        console.log('🍽️ Filtered meals found:', filteredMeals.length);

        // Sortiere nach Favoriten
        filteredMeals.sort((a, b) => {
            const scoreA = context.favoriteMealIds?.includes(a.id) ? 10 : 0;
            const scoreB = context.favoriteMealIds?.includes(b.id) ? 10 : 0;
            return scoreB - scoreA;
        });

        // Wenn keine spezifischen Gerichte gefunden, nutze allgemeine Empfehlungen
        if (filteredMeals.length === 0) {
            filteredMeals = context.meals
                .filter((meal) => mealPassesBaseFilters(meal, context, []))
                .slice(0, 10);
        }

        // Erstelle Empfehlungen
        const recommendations = filteredMeals.slice(0, 10).map(meal => ({
            mealId: meal.id,
            reason: `Enthält ${topic}` +
                (context.favoriteMealIds?.includes(meal.id) ? ' - Einer deiner Favoriten!' : '')
        }));

        if (recommendations.length === 0) {
            return {
                text: `Ich habe leider keine Gerichte mit ${topic} gefunden. Möchtest du etwas anderes probieren?`,
                recommendedMeals: [],
            };
        }

        return {
            text: `Perfekt! Hier sind Gerichte mit ${topic}:`,
            recommendedMeals: recommendations,
        };
    }

    // Negative Antwort
    if (/\b(nein|nicht|ne|nee|nö|nein danke)\b/i.test(prompt)) {
        return {
            text: 'Alles klar 👍 Sag mir einfach Bescheid, wenn du wieder etwas wissen möchtest.',
            recommendedMeals: [],
        };
    }

    const promptLower = prompt.toLowerCase();
    const moods = detectMood(promptLower);
    const intents = extractFoodIntents(promptLower);
    const explicitLoc = hasExplicitLocationClaim(prompt);
    const explicitUni = hasExplicitUniClaim(prompt);
    const { uniName, mensaIds } = extractLocationIntentWithUniversity(prompt, context.mensas, context.universities);

    // 🧠 Intent-Erkennung: Frage vs. Empfehlung
    const isQuestion =
        promptLower.includes('?') ||
        /\b(was|wie|wo|wann|warum|wer|wieso|enthält|ist|sind)\b/.test(promptLower);

    const isRecommendationRequest =
        /\b(zeig|zeige|gib|gibt|empfiehl|empfehle|vorschlag|essen|gericht|hungrig|hunger|empfehlung|vorschläge|hätte gerne|möchte|will|suche|brauch|brauche)\b/.test(
            promptLower
        );

    // ✅ WICHTIG: Wenn eine Uni erkannt wurde, behandle es als Empfehlungsanfrage
    const isLocationBasedRequest = (explicitUni || explicitLoc || mensaIds.length > 0) && !isQuestion;

    // 🔍 Wenn unklar UND keine Empfehlung explizit gewünscht UND keine Location, nachfragen
    // WICHTIG: Nur nachfragen wenn wirklich unklar ist, was der User will
    if (!isQuestion && !isRecommendationRequest && !isLocationBasedRequest && moods.length === 0 && intents.length === 0 && !isAffirmativeResponse(prompt)) {
        return {
            text: 'Möchtest du, dass ich dir passende Gerichte zeige oder soll ich dir etwas erklären?',
            recommendedMeals: [],
        };
    }

    // ❓ Nur Frage, keine Empfehlung gewünscht - beantworte sie!
    if (isQuestion && !isRecommendationRequest && !isLocationBasedRequest) {
        // Nutze die AI, um die Frage zu beantworten
        return await answerQuestion(prompt, context, history);
    }

    // Location-Check: Wenn Uni erwähnt, aber nicht erkannt
    if ((explicitUni || explicitLoc) && mensaIds.length === 0 && !isQuestion) {
        return {
            text:
                'Ich habe deine Uni/Mensa nicht eindeutig erkannt. Welche Mensa oder welchen Campus meinst du genau? Verfügbare Unis: HTW, FU, TU, HU, ASH, HWR, BHT',
            recommendedMeals: [],
        };
    }

    // ✅ Empfehlungen generieren (auch bei Location-basierten Anfragen)
    if (isRecommendationRequest || isLocationBasedRequest || moods.length > 0 || intents.length > 0) {
        return await generateRecommendations(
            context,
            moods,
            intents,
            mensaIds,
            uniName,
            history,
            undefined
        );
    }

    // Fallback
    return {
        text: 'Wie kann ich dir helfen? Frag mich nach Gerichten, Diäten oder Budgets!',
        recommendedMeals: [],
    };

// 🔧 Hilfsfunktion zum Beantworten von Fragen
    async function answerQuestion(
        question: string,
        context: AIChefContext,
        history?: AIChefHistoryMessage[]
    ): Promise<AIChefResponse> {
        const systemPrompt = `Du bist der AI Chef, ein freundlicher Assistent für Mensaessen.
Beantworte die Frage des Nutzers kurz und verständlich.
Gib KEINE Angebote oder Fragen am Ende - nur die reine Antwort.
Antworte NUR als JSON: {"text": "Deine sachliche Antwort"}`;

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
                body: JSON.stringify({
                    model: MODEL,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        ...(history || []).slice(-5),
                        { role: 'user', content: question },
                    ],
                    temperature: 0.7,
                    response_format: { type: 'json_object' },
                }),
            });

            const data = await response.json();
            const parsed = JSON.parse(data.choices?.[0]?.message?.content ?? '{"text":""}');

            // ✅ Füge das Angebot manuell hinzu
            const answer = parsed.text || 'Gute Frage!';
            const offer = '\n\nMöchtest du passende Gerichte dazu sehen?';

            return {
                text: answer + offer,
                recommendedMeals: [],
            };
        } catch {
            return {
                text: 'Ich konnte die Frage gerade nicht beantworten. Möchtest du stattdessen Gerichtsempfehlungen?',
                recommendedMeals: [],
            };
        }
    }

// 🔧 Hilfsfunktion für Empfehlungen (verhindert Duplikation)
    async function generateRecommendations(
        context: AIChefContext,
        moods: string[],
        intents: FoodIntentKey[],
        mensaIds: string[],
        uniName?: string,
        history?: AIChefHistoryMessage[],
        customText?: string
    ): Promise<AIChefResponse> {
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
                        { role: 'user', content: customText || 'Zeige mir passende Gerichte' },
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
                    customText ||
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
}