let currentRecipes = [];
let favoriteIds = new Set();
let favoriteRecipes = [];
let showingRecipe = null;
let originalEnglishRecipe = null;

// DOM Nodes
const searchInput = document.getElementById('search-input');
const searchBtnSubmit = document.getElementById('search-btn-submit');
const searchBtnClear = document.getElementById('search-btn-clear');
const loadingSpinner = document.getElementById('loading-spinner');
const emptyState = document.getElementById('empty-state');
const recipeGrid = document.getElementById('recipe-grid');
const btnShowMore = document.getElementById('btn-show-more');
const viewHomeNav = document.getElementById('nav-btn-home');
const viewFavsNav = document.getElementById('nav-btn-favorites');

// Filters
const filterMeal = document.getElementById('filter-meal');
const filterCuisine = document.getElementById('filter-cuisine');
const filterTime = document.getElementById('filter-time');
const filterDietary = document.getElementById('filter-dietary');
const filterDifficulty = document.getElementById('filter-difficulty');
const filterCalories = document.getElementById('filter-calories');
const filterAllergies = document.getElementById('filter-allergies');
const filterReset = document.getElementById('filter-reset');

function getFilters() {
    return {
        mealType: filterMeal.value,
        cuisine: filterCuisine.value,
        time: filterTime.value ? filterTime.value : 'any',
        dietary: filterDietary.value,
        difficulty: filterDifficulty.value,
        calories: filterCalories.value,
        allergies: filterAllergies.value
    };
}

filterReset.addEventListener('click', () => {
    filterMeal.value = 'any';
    filterCuisine.value = 'any';
    filterTime.value = '';
    filterDietary.value = 'any';
    filterDifficulty.value = 'any';
    filterCalories.value = 'any';
    filterAllergies.value = '';
});

// App Lifecycle interactions linked to auth
window.onUserLogin = async (uid) => {
    favoriteRecipes = await window.api.getFavorites(uid);
    favoriteIds = new Set(favoriteRecipes.map(r => r.id));
    renderFavorites();
    renderRecipes(); // re-render to update hearts
};

window.onUserLogout = () => {
    favoriteRecipes = [];
    favoriteIds.clear();
    renderFavorites();
    renderRecipes();
};

viewHomeNav.addEventListener('click', () => navigateTo('home'));
viewFavsNav.addEventListener('click', () => {
    navigateTo('favorites');
    renderFavorites();
});
document.getElementById('btn-browse-recipes').addEventListener('click', () => navigateTo('home'));

// Search Actions
searchInput.addEventListener('input', () => {
    if (searchInput.value.trim().length > 0) {
        searchBtnClear.classList.remove('hidden');
    } else {
        searchBtnClear.classList.add('hidden');
    }
});

searchBtnClear.addEventListener('click', () => {
    searchInput.value = '';
    searchBtnClear.classList.add('hidden');
});

searchInput.addEventListener('keydown', e => {
    if(e.key === 'Enter') handleSearch();
});
searchBtnSubmit.addEventListener('click', handleSearch);

async function handleSearch() {
    const raw = searchInput.value;
    const ingredients = raw.split(',').map(s => s.trim()).filter(Boolean);
    if(ingredients.length === 0) {
        alert("Please enter ingredients");
        return;
    }

    loadingSpinner.classList.remove('hidden');
    emptyState.classList.add('hidden');
    recipeGrid.innerHTML = '';
    btnShowMore.classList.add('hidden');

    try {
        const filters = getFilters();
        currentRecipes = await window.api.generateRecipes(ingredients, filters);
        
        if(currentRecipes.length === 0) {
            emptyState.querySelector('p').textContent = "No recipes found fitting these filters.";
            emptyState.classList.remove('hidden');
        } else {
            renderRecipes();
        }
    } catch(e) {
        alert("Search failed: " + e.message);
        emptyState.classList.remove('hidden');
    } finally {
        loadingSpinner.classList.add('hidden');
    }
}

// Rendering
function renderCardHTML(recipe, isFav) {
    const isFavClass = isFav ? 'text-destructive' : 'text-muted-foreground';
    const heartIconType = isFav ? 'fa-solid' : 'fa-regular';
    
    // We escape recipe data to store it in data attribute or attach via event listeners later.
    // Instead of inline JS, we'll create the DOM element manually to attach handlers easily.
    
    const div = document.createElement('div');
    div.className = "bg-card rounded-2xl border border-border/50 overflow-hidden recipe-card-hover shadow-md flex flex-col h-full";
    div.innerHTML = `
      <div class="p-5 flex-1 flex flex-col justify-between relative">
        <button class="toggle-fav-btn absolute top-3 right-3 p-1.5 rounded-full bg-muted hover:bg-primary/10 transition-colors">
          <i class="${heartIconType} fa-heart ${isFavClass}"></i>
        </button>
        <div>
          <h3 class="text-lg font-bold mb-2 leading-tight">${recipe.name}</h3>
          <p class="text-sm text-muted-foreground mb-4 line-clamp-2">${recipe.description}</p>
        </div>
        <div>
          <div class="flex items-center gap-4 text-xs text-muted-foreground mb-4">
            <span><i class="fa-regular fa-clock"></i> ${recipe.totalTime}m</span>
            <span><i class="fa-solid fa-fire"></i> ${recipe.calories} kcal</span>
          </div>
          <button class="btn-search-primary w-full text-sm py-2.5 view-details-btn">View Recipe</button>
        </div>
      </div>
    `;

    // Listeners
    div.querySelector('.toggle-fav-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        handleToggleFavorite(recipe);
    });

    div.querySelector('.view-details-btn').addEventListener('click', () => {
        openModal(recipe);
    });

    return div;
}

function renderRecipes() {
    recipeGrid.innerHTML = '';
    currentRecipes.forEach(recipe => {
        const isFav = favoriteIds.has(recipe.id);
        recipeGrid.appendChild(renderCardHTML(recipe, isFav));
    });
}

function renderFavorites() {
    const favGrid = document.getElementById('favorites-grid');
    const favEmpty = document.getElementById('favorites-empty-state');

    favGrid.innerHTML = '';
    if(favoriteRecipes.length === 0) {
        favEmpty.classList.remove('hidden');
    } else {
        favEmpty.classList.add('hidden');
        favoriteRecipes.forEach(recipe => {
            favGrid.appendChild(renderCardHTML(recipe, true));
        });
    }
}

async function handleToggleFavorite(recipe) {
    if(!currentUser) {
        alert("Please login to save favorites.");
        return;
    }
    try {
        await window.api.toggleFavorite(currentUser.uid, recipe);
        window.onUserLogin(currentUser.uid); // Refresh
    } catch(e) {
        console.error(e);
        alert("Firebase Error: " + e.message + "\\n\\nPlease make sure you've enabled Firestore Database in your Firebase Console and set its Security Rules to allow writes!");
    }
}

// Modal Logic
const modalOverlay = document.getElementById('recipe-modal');
const modalClose = document.getElementById('modal-close');
const modalLangSelect = document.getElementById('modal-lang-select');

modalClose.addEventListener('click', () => {
    modalOverlay.classList.add('hidden');
});

modalLangSelect.addEventListener('change', async (e) => {
    if (!originalEnglishRecipe) return;
    const lang = e.target.value;
    
    if (lang === 'en') {
        applyTranslation(originalEnglishRecipe, null, 'en');
        return;
    }

    const originalTitle = document.getElementById('modal-title').textContent;
    document.getElementById('modal-title').textContent = "Translating...";
    
    try {
        const payload = await window.api.translateRecipe(originalEnglishRecipe, lang);
        applyTranslation(payload.recipe || originalEnglishRecipe, payload.ui, lang);
    } catch (err) {
        alert("Translation failed: " + err.message);
        document.getElementById('modal-title').textContent = originalTitle;
        modalLangSelect.value = 'en';
    }
});

function applyTranslation(translatedRecipe, uiDict, lang) {
    openModal(translatedRecipe, true);
    
    const ui = uiDict || {
        Calories: "Calories", Protein: "Protein", Carbs: "Carbs",
        Cuisine: "Cuisine", Difficulty: "Difficulty", Time: "Time",
        Ingredients: "Ingredients", Instructions: "Instructions",
        mins: "mins", kcal: "kcal"
    };

    document.getElementById('lbl-cals').textContent = ui.Calories;
    document.getElementById('lbl-pro').textContent = ui.Protein;
    document.getElementById('lbl-carbs').textContent = ui.Carbs;
    document.getElementById('lbl-cui').textContent = ui.Cuisine;
    document.getElementById('lbl-diff').textContent = ui.Difficulty;
    document.getElementById('lbl-time').textContent = ui.Time;
    document.getElementById('lbl-ing').textContent = "📝 " + ui.Ingredients;
    document.getElementById('lbl-steps').textContent = "🍳 " + ui.Instructions;
    
    // Overwrite the hardcoded mins and kcal strings generated inside openModal
    document.getElementById('modal-cals').textContent = `${translatedRecipe.calories} ${ui.kcal}`;
    document.getElementById('modal-time').textContent = `${translatedRecipe.totalTime} ${ui.mins}`;
}

function openModal(recipe, keepLang = false) {
    showingRecipe = recipe;
    if (!keepLang) {
        originalEnglishRecipe = JSON.parse(JSON.stringify(recipe)); // Deep copy backup
        if (modalLangSelect) modalLangSelect.value = 'en';
    }
    
    document.getElementById('modal-title').textContent = recipe.name;
    document.getElementById('modal-cals').textContent = `${recipe.calories} kcal`;
    document.getElementById('modal-protein').textContent = recipe.nutrition?.protein || 'N/A';
    document.getElementById('modal-carbs').textContent = recipe.nutrition?.carbs || 'N/A';
    
    document.getElementById('modal-cuisine').textContent = recipe.cuisine;
    document.getElementById('modal-difficulty').textContent = recipe.difficulty;
    document.getElementById('modal-time').textContent = `${recipe.totalTime} mins`;

    const ingList = document.getElementById('modal-ingredients');
    ingList.innerHTML = '';
    (recipe.ingredients || []).forEach(ing => {
        const li = document.createElement('li');
        // Handle if ing is a string or an object
        const ingText = (typeof ing === 'object' && ing !== null) ? (ing.text || ing.ingredient || JSON.stringify(ing)) : ing;
        li.textContent = ingText;
        ingList.appendChild(li);
    });

    const stepList = document.getElementById('modal-steps');
    stepList.innerHTML = '';
    (recipe.steps || []).forEach((step, idx) => {
        const li = document.createElement('li');
        // Handle if step is a string or an object
        let stepText = (typeof step === 'object' && step !== null) ? (step.step || step.instruction || JSON.stringify(step)) : step;
        
        // Strip prefixes like "Step 1:", "1.", "स्टेप 1:", "దశ 1:", etc. from the beginning
        stepText = stepText.replace(/^(\s*[\p{L}\p{M}\s]{1,10}\s*\d+\s*[:.\-)]\s*|\s*\d+\s*[:.\-)]\s*)+/u, '');
        
        li.textContent = stepText;
        li.className = 'leading-relaxed';
        stepList.appendChild(li);
    });

    modalOverlay.classList.remove('hidden');
}


