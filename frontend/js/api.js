// API Calls to our Express Server
async function generateRecipes(ingredients, filters) {
    const response = await fetch('/api/generate-recipes', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ingredients, filters })
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to generate recipes');
    }
    const data = await response.json();
    return data.recipes || [];
}

async function translateRecipe(recipe, targetLang) {
    const response = await fetch('/api/translate-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipe, targetLang })
    });

    if (!response.ok) throw new Error('Translation failed');
    return await response.json();
}

// Firebase Realtime Database for Favorites 
async function getFavorites(userId) {
    try {
        const snapshot = await window.rtdb.ref(`users/${userId}/favorites`).once('value');
        const data = snapshot.val();
        if (!data) return [];
        // Convert object { id: { recipe } } into an array
        return Object.values(data);
    } catch(e) {
        console.error("Error reading favorites from RTDB:", e);
        return [];
    }
}

async function toggleFavorite(userId, recipe) {
    try {
        const favRef = window.rtdb.ref(`users/${userId}/favorites/${recipe.id}`);
        const snapshot = await favRef.once('value');
        
        if (snapshot.exists()) {
            // Remove
            await favRef.remove();
            return false;
        } else {
            // Add
            await favRef.set(recipe);
            return true;
        }
    } catch (e) {
        console.error("Error toggling favorite in RTDB:", e);
        throw e;
    }
}

window.api = {
    generateRecipes,
    translateRecipe,
    getFavorites,
    toggleFavorite
};
