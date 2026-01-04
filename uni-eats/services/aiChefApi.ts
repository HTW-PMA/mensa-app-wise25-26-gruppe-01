/**
 * Direct Groq API call (OpenAI-compatible) for the AI Chef feature.
 * NOTE: EXPO_PUBLIC_* keys are bundled into the client -> do not treat as secret for production.
 */

const API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY || '';
const API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.1-8b-instant';

import { Canteen, Meal } from '@/services/mensaApi';

export interface AIChefContext {
    mensas: Canteen[];
    meals: Meal[];

    // New favorites system
    favoriteCanteenIds?: string[];
    favoriteMealIds?: string[];

    contextStatus?: {
        isLoadingContext?: boolean;
        isErrorContext?: boolean;
    };
}

export type AIChefHistoryMessage = {
    role: 'user' | 'assistant';
    content: string;
};

function getStudentPrice(meal: Meal): string {
    const p = meal.prices?.find((x) => x.priceType === 'Studierende')?.price;
    if (typeof p === 'number' && Number.isFinite(p)) return `€${p.toFixed(2)}`;
    return '';
}

function buildSystemPrompt(context: AIChefContext) {
    const mensasCount = context.mensas?.length ?? 0;
    const mealsCount = context.meals?.length ?? 0;

    const isLoading = context.contextStatus?.isLoadingContext ?? false;
    const isError = context.contextStatus?.isErrorContext ?? false;

    const favoriteCanteenIds = Array.isArray(context.favoriteCanteenIds) ? context.favoriteCanteenIds : [];
    const favoriteMealIds = Array.isArray(context.favoriteMealIds) ? context.favoriteMealIds : [];

    const favoriteMensasByName =
        favoriteCanteenIds
            .map((id) => context.mensas.find((m) => m.id === id)?.name)
            .filter(Boolean) as string[];

    const favoriteMealsByName =
        favoriteMealIds
            .map((id) => context.meals.find((m) => m.id === id)?.name)
            .filter(Boolean) as string[];

    // Compact lists
    let mensaInfo = '';
    if (mensasCount > 0) {
        mensaInfo += 'Available Mensas (name + id):\n';
        for (const mensa of context.mensas) {
            mensaInfo += `- ${mensa.name} (id: ${mensa.id})\n`;
        }
    }

    let mealInfo = '';
    if (mealsCount > 0) {
        mealInfo += 'Available Meals (from current app data):\n';
        for (const meal of context.meals) {
            const mensaName = context.mensas.find((m) => m.id === meal.canteenId)?.name ?? 'Unknown Mensa';
            const category = meal.category ? ` • category: ${meal.category}` : '';
            const price = getStudentPrice(meal);
            const priceTxt = price ? ` • price(student): ${price}` : '';
            mealInfo += `- ${meal.name} @ ${mensaName}${category}${priceTxt}\n`;
        }
    }

    return `
You are "AI Chef", a helpful assistant inside a Berlin university cafeteria (Mensa) app.

GOAL:
Help users decide what to eat TODAY based strictly on the provided mensa + meal data.

RULES (very important):
- Do NOT ask the user for Mensa IDs.
- Never invent meals. Only recommend items that appear in "Available Meals".
- Keep answers short: max 6–10 lines.
- If you recommend meals: give 2–3 options, each with a short reason (e.g., vegan/healthy/budget).
- If the user doesn't specify a mensa, you may recommend across mensas OR ask ONE clarifying question by name.

FAVORITES:
- favorite_mensas_count: ${favoriteMensasByName.length}
- favorite_meals_count: ${favoriteMealsByName.length}
- favorite_mensas: ${favoriteMensasByName.length ? favoriteMensasByName.join(', ') : 'none'}
- favorite_meals: ${favoriteMealsByName.length ? favoriteMealsByName.join(', ') : 'none'}

If the user asks "Based on my favorites":
- Prefer meals from favorite mensas first.
- If a favorite meal exists in today's list, include it.

DATA STATUS:
- mensas_count: ${mensasCount}
- meals_count: ${mealsCount}
- is_loading: ${String(isLoading)}
- is_error: ${String(isError)}

If meals_count is 0:
- Be transparent: "I can't see today's menu data right now."
- Ask ONE helpful question or suggest to retry.

${mensaInfo ? `\n${mensaInfo}` : ''}
${mealInfo ? `\n${mealInfo}` : ''}
`.trim();
}

export async function getAiChefResponse(
    prompt: string,
    context: AIChefContext,
    history?: AIChefHistoryMessage[]
): Promise<string> {
    if (!API_KEY) {
        return 'API key is not configured. Please set EXPO_PUBLIC_GROQ_API_KEY.';
    }

    const systemPrompt = buildSystemPrompt(context);

    // Keep short history to avoid token bloat
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
        max_tokens: 180,
        temperature: 0.4,
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
            console.error('AI Chef API Error status:', response.status);
            console.error('AI Chef API Error body (raw):', errorText);
            throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();
        const aiResponse: unknown = data?.choices?.[0]?.message?.content;

        if (typeof aiResponse !== 'string' || aiResponse.trim().length === 0) {
            console.error('Invalid response structure from AI:', data);
            throw new Error('Received an empty or invalid response from the AI.');
        }

        // keep UI plain text (no markdown rendering)
        return aiResponse.replace(/\*\*(.*?)\*\*/g, '$1').trim();
    } catch (error) {
        console.error('Failed to get response from AI Chef:', error);
        throw new Error('Sorry, I am having trouble thinking right now. Please try again later.');
    }
}

