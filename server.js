const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const Groq = require('groq-sdk');

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Serve frontend (IMPORTANT for Railway)
app.use(express.static(path.join(__dirname, 'frontend')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});
app.post('/api/generate-recipes', async (req, res) => {
    try {
        const { ingredients, filters } = req.body;

        // This is the highly specific, strict prompt you requested for the AI!
        const systemPrompt = `You are a professional Master Chef and intelligent recipe generator.

INPUT:
- Ingredients provided by user: [${ingredients.join(', ')}]
- User preferences: ${JSON.stringify(filters)}

OBJECTIVE:
Generate exactly 5 high-quality, realistic, and distinct recipes that strictly follow all constraints.

CORE RULES:

=====================
FILTER ENFORCEMENT & ALLERGY INTELLIGENCE (HIGHEST PRIORITY)
=====================
User filters OVERRIDE the ingredient list completely.
- If a filter is applied, you MUST strictly follow it.
- You MUST ignore any ingredient that conflicts with filters or allergies, even if present in the input.

DIETARY RULE (CRITICAL):
- Veg → NO egg, chicken, fish, or any meat.
- Vegan → NO egg, milk, butter, cheese, curd, ghee, or any animal product.
- Example: If input contains "egg" and dietary = "Veg", you MUST UNCONDITIONALLY IGNORE the egg.

ALLERGY INTELLIGENCE CHECK:
- You must intelligently analyze ALL ingredients for hidden allergen risks. Do NOT rely only on exact words. 
- Example: If a user has a "Dairy" allergy, you MUST UNCONDITIONALLY EXCLUDE butter, milk, cheese, ghee, curd, and yogurt.
- Example: If a user has a "Nut" allergy, you MUST EXCLUDE peanut oil and almond flour.

GENERAL RULE:
- Filters/Allergies ALWAYS take priority over ingredients. Conflict ingredients must be treated as NON-EXISTENT.
- Discard and regenerate any recipe that includes a forbidden ingredient.

1. INGREDIENT CONSTRAINTS (STRICT)
- You MUST ONLY use the main ingredients explicitly provided by the user in the INPUT list, EXCEPT those that violate the Filter/Allergy rules above.
- ZERO HALLUCINATION: You MUST NOT introduce ANY new main ingredients (no meats, no extra vegetables, no grains, no cheeses) that were not provided.

2. ALLOWED EXCEPTIONS (PANTRY ITEMS ONLY)
- You may use ONLY these additional items for cooking logic:
  water, cooking oil, butter (unless Vegan), salt, sugar, and basic dry spices (pepper, cumin, turmeric, garam masala, chili powder).
- NOTE: Onions and Garlic are NOT basic spices. Do NOT use them unless they are in the user's input list.

3. DISALLOWED OUTPUTS
- Do NOT generate:
  - Basic condiments (sauces, chutneys, purees)
  - Unrealistic or forced combinations
  - Repetitive or slightly modified versions of the same dish

4. STRICT FILTER ENFORCEMENT

- Cuisine:
  Allowed ONLY: South Indian, North Indian, Chinese, Italian, Mexican
  If specified (${filters.cuisine}), MUST match exactly.

- Meal Type:
  (${filters.mealType}) → Recipe must logically match (Breakfast/Lunch/Dinner/Snacks)

- Dietary:
  (${filters.dietary})
  - Veg → No meat/fish
  - Vegan → No animal products at all
  - Non-veg → Allowed

- Calories:
  (${filters.calories})
  - Low < 400 kcal
  - Medium 400–700 kcal
  - High > 700 kcal

- Cook Time:
  (${filters.time}) → totalTime MUST be ≤ this

- Allergies:
  (${filters.allergies}) → STRICTLY exclude these ingredients

5. QUALITY REQUIREMENTS

- Recipes must be:
  - Practical and commonly cookable
  - Beginner-friendly but realistic
  - Logically consistent with cuisine

- Ingredients:
  - Include exact quantities and units (e.g., 1 cup, 200g, 1 tsp)

- Steps:
  - Clear, numbered steps
  - Include time, heat level, and method

6. OUTPUT FORMAT (STRICT JSON)

Return ONLY a JSON array with EXACTLY 5 recipes:

[
  {
    "id": "unique-id",
    "name": "Recipe Name",
    "description": "Short description",
    "cuisine": "Cuisine",
    "difficulty": "Easy/Medium/Hard",
    "totalTime": 30,
    "calories": 400,
    "ingredients": ["1 cup chopped onions", "1 tsp salt"],
    "steps": ["Step 1: Heat oil on medium flame...", "..."],
    "nutrition": {
      "protein": "15g",
      "carbs": "40g",
      "fat": "20g"
    },
    "tips": "Helpful cooking tip"
  }
]

7. FINAL VALIDATION STEP (CRITICAL)

For EACH recipe:
- SELF-AUDIT: Check ALL ingredients against the provided INPUT list and the ALLOWED PANTRY list in Rule 2.
- DISCARD: If ANY ingredient is NOT in the user input list OR allowed pantry items (onions/garlic are BANNED unless in input), you MUST DISCARD that recipe.
- REGENERATE: Continue generating and auditing until you have EXACTLY 5 valid, high-quality, and distinct recipes.
- DO NOT output invalid recipes or recipes requiring missing ingredients.
- Ensure the final JSON is valid and clean.`;

        // Check for AI Key
        if (!process.env.GROQ_API_KEY) {
            throw new Error("To generate incredibly fast AI recipes via LLaMA, please open backend/.env and add your GROQ_API_KEY !");
        }

        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

        let generatedRecipes = [];
        let aiFailed = false;

        try {
            const completion = await groq.chat.completions.create({
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: `Generate the JSON array of exactly 5 distinct, highly detailed recipes using: [${ingredients.join(', ')}]` }
                ],
                model: "llama-3.3-70b-versatile",
                temperature: 0.7,
            });
            const responseText = completion.choices[0]?.message?.content || "";
            let cleanJson = "";

            // Robust JSON Array extraction: Find the block that starts with [ and ends with ]
            // We search for the longest possible JSON array string in case the AI added chatter
            const matches = responseText.match(/\[\s*\{[\s\S]*\}\s*\]/g);
            if (matches) {
                cleanJson = matches[matches.length - 1]; // Usually the last block is the full array
            } else {
                cleanJson = responseText.trim();
            }

            try {
                generatedRecipes = JSON.parse(cleanJson);
            } catch (jsonErr) {
                console.error("JSON Parse Error. AI Response was:", responseText);
                throw jsonErr;
            }
        } catch (primaryError) {
            console.warn("Primary Groq LLaMA model failed, falling back...", primaryError.message);
            try {
                const fallbackCompletion = await groq.chat.completions.create({
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: `Generate the JSON array of exactly 5 distinct, highly detailed recipes using: [${ingredients.join(', ')}]` }
                    ],
                    model: "llama-3.1-8b-instant",
                    temperature: 0.7,
                });
                const responseText = fallbackCompletion.choices[0]?.message?.content || "";
                const matches = responseText.match(/\[\s*\{[\s\S]*\}\s*\]/g);
                let cleanJson = matches ? matches[matches.length - 1] : responseText.trim();
                generatedRecipes = JSON.parse(cleanJson);
            } catch (secondaryError) {
                console.error("All Groq AI models failed:", secondaryError.message);
                aiFailed = true;
            }
        }

        if (aiFailed || !Array.isArray(generatedRecipes) || generatedRecipes.length === 0) {
            throw new Error("AI models are currently unavailable. Please try again in 10 seconds.");
        }

        // Apply any manual backend filtering for safety (e.g., time)
        if (filters?.time && filters.time !== 'any' && filters.time.trim() !== '') {
            generatedRecipes = generatedRecipes.filter(r => r.totalTime <= parseInt(filters.time));
        }

        res.json({ recipes: generatedRecipes });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/translate-recipe', async (req, res) => {
    try {
        const { recipe, targetLang } = req.body;
        if (!process.env.GROQ_API_KEY) throw new Error("GROQ_API_KEY is missing for translation.");
        if (targetLang === 'en') return res.json({ recipe });

        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        const systemMsg = `You are a culinary translator. Your objective is twofold:
1. Translate ALL string values inside the provided JSON 'recipe' object into the language code '${targetLang}' (e.g. 'hi' for Hindi, 'te' for Telugu).
2. Provide translated UI labels for the frontend.

CRITICAL RULES:
- ONLY translate human-readable text in the recipe (name, description, tips, ingredients, steps).
- DO NOT alter structural keys (e.g., keep 'name', 'ingredients', 'totalTime', 'nutrition').
- DO NOT alter structural numeric values or IDs.

Return EXACTLY this entire JSON wrapper object and absolutely nothing else (no markdown):
{
  "recipe": { ...the fully translated recipe object... },
  "ui": {
    "Calories": "translated word for Calories",
    "Protein": "translated word for Protein",
    "Carbs": "translated word for Carbs",
    "Cuisine": "translated word for Cuisine",
    "Difficulty": "translated word for Difficulty",
    "Time": "translated word for Time",
    "Ingredients": "translated word for Ingredients",
    "Instructions": "translated word for Instructions",
    "mins": "translated exact word for mins",
    "kcal": "translated abbreviation for kcal"
  }
}`;

        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: systemMsg },
                { role: "user", content: JSON.stringify(recipe) }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.2,
        });

        const responseText = completion.choices[0]?.message?.content || "";
        const cleanJson = responseText.replace(/```json/ig, '').replace(/```/g, '').trim();
        const translatedData = JSON.parse(cleanJson);

        res.json(translatedData);
    } catch (e) {
        console.error("Translate Error:", e);
        res.status(500).json({ error: e.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server listening on port : http://localhost:${PORT}`);
});
