// ============================================================
// ALUR 1: PERSIAPAN - alamat API dan elemen HTML yang digunakan
// ============================================================
// Alamat API yang menyediakan data resep.
const API_URL = "https://dummyjson.com/recipes?limit=0";
const STORAGE_KEY = "recipe-finder-favorites";

// Ambil elemen HTML yang akan digunakan oleh JavaScript.
const searchForm = document.querySelector("#search-form");
const searchInput = document.querySelector("#search-input");
const cuisineFilter = document.querySelector("#cuisine-filter");
const difficultyFilter = document.querySelector("#difficulty-filter");
const favoriteButton = document.querySelector("#favorite-button");
const favoriteCount = document.querySelector("#favorite-count");
const sectionTitle = document.querySelector("#section-title");
const recipeCount = document.querySelector("#recipe-count");
const resetButton = document.querySelector("#reset-filter-button");
const loadingState = document.querySelector("#loading-state");
const errorState = document.querySelector("#error-state");
const emptyState = document.querySelector("#empty-state");
const retryButton = document.querySelector("#retry-button");
const recipeGrid = document.querySelector("#recipe-grid");
const recipeDialog = document.querySelector("#recipe-dialog");
const dialogContent = document.querySelector("#dialog-content");
const closeDialogButton = document.querySelector("#close-dialog");

// ============================================================
// ALUR 2: DATA APLIKASI - menyimpan resep dan kondisi tampilan
// ============================================================
// Variabel untuk menyimpan semua resep, favorit, dan tampilan yang sedang aktif.
let recipes = [];
let favoriteIds = loadFavorites();
let showingFavorites = false;

// ============================================================
// ALUR 3: FAVORIT - baca dan simpan data melalui LocalStorage
// ============================================================
// Baca daftar favorit yang tersimpan di browser.
function loadFavorites() {
  try {
    const savedFavorites = localStorage.getItem(STORAGE_KEY);

    if (savedFavorites === null) {
      return [];
    }

    const parsedFavorites = JSON.parse(savedFavorites);
    if (Array.isArray(parsedFavorites)) {
      return parsedFavorites;
    }

    return [];
  } catch (error) {
    console.log("Favorit tersimpan tidak dapat dibaca.", error);
    return [];
  }
}

// Simpan daftar favorit terbaru ke LocalStorage.
function saveFavorites() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favoriteIds));
  } catch (error) {
    console.log("Favorit tidak dapat disimpan.", error);
  }
}

// ============================================================
// ALUR 4: BANTUAN TAMPILAN - amankan teks dan atur status halaman
// ============================================================
// Ubah karakter khusus agar teks dari API aman saat dimasukkan ke HTML.
function escapeHTML(text) {
  const characters = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };

  return String(text ?? "").replace(/[&<>"']/g, function (character) {
    return characters[character];
  });
}

// Tampilkan satu status: loading, error, kosong, atau daftar resep.
function showPageState(stateName) {
  loadingState.hidden = stateName !== "loading";
  errorState.hidden = stateName !== "error";
  emptyState.hidden = stateName !== "empty";
  recipeGrid.hidden = stateName !== "recipes";
}

// ============================================================
// ALUR 5: AMBIL DATA - Fetch API lalu siapkan pilihan cuisine
// ============================================================
// Minta data resep dari API.
async function loadRecipes() {
  showPageState("loading");

  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error("Permintaan resep gagal.");
    }

    const data = await response.json();
    recipes = data.recipes || [];

    fillCuisineOptions();
    displayRecipes();
  } catch (error) {
    console.log("Resep gagal dimuat.", error);
    showPageState("error");
  }
}

// Isi pilihan filter cuisine berdasarkan data yang diterima dari API.
function fillCuisineOptions() {
  const cuisineNames = [];

  for (const recipe of recipes) {
    if (recipe.cuisine && !cuisineNames.includes(recipe.cuisine)) {
      cuisineNames.push(recipe.cuisine);
    }
  }

  cuisineNames.sort();
  cuisineFilter.innerHTML = '<option value="">All Cuisine</option>';

  for (const cuisine of cuisineNames) {
    const option = document.createElement("option");
    option.value = cuisine;
    option.textContent = cuisine;
    cuisineFilter.append(option);
  }
}

// ============================================================
// ALUR 6: SEARCH & FILTER - periksa resep dan kumpulkan yang cocok
// ============================================================
// Periksa satu resep: apakah cocok dengan pencarian dan filter yang dipilih?
function recipeMatchesFilters(recipe) {
  const searchText = searchInput.value.trim().toLowerCase();
  const selectedCuisine = cuisineFilter.value;
  const selectedDifficulty = difficultyFilter.value;

  const nameMatches = recipe.name.toLowerCase().includes(searchText);
  const cuisineMatches = selectedCuisine === "" || recipe.cuisine === selectedCuisine;
  const difficultyMatches = selectedDifficulty === "" || recipe.difficulty === selectedDifficulty;
  const favoriteMatches = !showingFavorites || favoriteIds.includes(recipe.id);

  return nameMatches && cuisineMatches && difficultyMatches && favoriteMatches;
}

// Ambil semua resep yang cocok dengan kriteria pengguna.
function getMatchingRecipes() {
  const matchingRecipes = [];

  for (const recipe of recipes) {
    if (recipeMatchesFilters(recipe)) {
      matchingRecipes.push(recipe);
    }
  }

  return matchingRecipes;
}

// ============================================================
// ALUR 7: TAMPILKAN RESEP - buat kartu dan render hasil di halaman
// ============================================================
/// Fungsi untuk membuat elemen HTML kartu resep berdasarkan data objek 'recipe'
function createRecipeCard(recipe) {
  // 1. Cek apakah ID resep ini ada di dalam list/array 'favoriteIds'
  const isFavorite = favoriteIds.includes(recipe.id);

  // 2. Hitung total waktu pembuatan (waktu persiapan + waktu memasak)
  const totalMinutes = recipe.prepTimeMinutes + recipe.cookTimeMinutes;

  // 3. Set nilai default untuk jenis hidangan jika tidak ada data dari resep
  let mealType = "Recipe";

  // Jika data mealType tersedia dan berisi minimal 1 item, ambil item pertama
  if (recipe.mealType && recipe.mealType.length > 0) {
    mealType = recipe.mealType[0];
  }

  // 4. Tentukan simbol hati dan teks deskripsi berdasarkan status favorit
  let heart = "♡";                          // Simbol hati kosong (default)
  let favoriteLabel = "Add to favorites";    // Teks tombol untuk menambah favorit
  
  if (isFavorite) {
    heart = "♥";                            // Simbol hati berisi jika sudah jadi favorit
    favoriteLabel = "Remove from favorites"; // Teks tombol untuk menghapus dari favorit
  }

  // 5. Kembalikan template string HTML yang siap dimasukkan ke dalam DOM
  return `
    <article class="recipe-card">
      <!-- Gambar resep dengan fitur 'lazy loading' agar hemat bandwidth -->
      <img class="recipe-image" src="${escapeHTML(recipe.image)}" alt="${escapeHTML(recipe.name)}" loading="lazy">
      
      <div class="recipe-body">
        <!-- Kategori masakan (contoh: Italian, Indonesian, dll.) -->
        <span class="recipe-cuisine">${escapeHTML(recipe.cuisine)}</span>
        
        <!-- Judul/Nama resep -->
        <h3 class="recipe-title">${escapeHTML(recipe.name)}</h3>
        
        <!-- Informasi singkat resep -->
        <div class="recipe-meta">
          <span>⏱️ ${totalMinutes} min</span>               <!-- Total waktu -->
          <span>⭐ ${escapeHTML(recipe.rating)}</span>        <!-- Rating resep -->
          <span>${escapeHTML(recipe.difficulty)}</span>      <!-- Tingkat kesulitan -->
          <span>${escapeHTML(mealType)}</span>              <!-- Jenis hidangan -->
        </div>
        
        <!-- Tombol-tombol aksi -->
        <div class="recipe-actions">
          <!-- Tombol untuk melihat detail resep lengkap -->
          <button class="detail-button" type="button" data-action="details" data-id="${recipe.id}">
            View recipe
          </button>
          
          <!-- Tombol favorit yang mendukung aksesibilitas (aria-label & aria-pressed) -->
          <button class="like-button" type="button" data-action="favorite" data-id="${recipe.id}" aria-label="${favoriteLabel}" aria-pressed="${isFavorite}">
            ${heart}
          </button>
        </div>
      </div>
    </article>
  `;
}
// Tampilkan hasil pencarian atau filter ke halaman.
function displayRecipes() {
  const matchingRecipes = getMatchingRecipes();
  const amount = matchingRecipes.length;

  if (showingFavorites) {
    sectionTitle.textContent = "Your Favorite Recipes";
  } else {
    sectionTitle.textContent = "Explore Recipes";
  }

  if (amount === 1) {
    recipeCount.textContent = "1 recipe";
  } else {
    recipeCount.textContent = amount + " recipes";
  }

  const hasSearch = searchInput.value.trim() !== "";
  const hasCuisine = cuisineFilter.value !== "";
  const hasDifficulty = difficultyFilter.value !== "";
  resetButton.hidden = !hasSearch && !hasCuisine && !hasDifficulty && !showingFavorites;

  if (amount === 0) {
    showPageState("empty");
    return;
  }

  let cardsHTML = "";
  for (const recipe of matchingRecipes) {
    cardsHTML += createRecipeCard(recipe);
  }

  recipeGrid.innerHTML = cardsHTML;
  showPageState("recipes");
}

// ============================================================
// ALUR 8: DETAIL & FAVORIT - buka resep atau ubah daftar favorit
// ============================================================
// Tambahkan favorit jika belum ada, atau hapus jika sudah menjadi favorit.
function changeFavorite(recipeId) {
  const favoritePosition = favoriteIds.indexOf(recipeId);

  if (favoritePosition === -1) {
    favoriteIds.push(recipeId);
  } else {
    favoriteIds.splice(favoritePosition, 1);
  }

  saveFavorites();
  favoriteCount.textContent = favoriteIds.length;
  displayRecipes();
}

// Tampilkan bahan, informasi, dan langkah memasak dalam dialog.
function openRecipeDetails(recipeId) {
  let selectedRecipe = null;

  for (const recipe of recipes) {
    if (recipe.id === recipeId) {
      selectedRecipe = recipe;
      break;
    }
  }

  if (selectedRecipe === null) {
    return;
  }

  let ingredientsHTML = "";
  for (const ingredient of selectedRecipe.ingredients) {
    ingredientsHTML += `<li>${escapeHTML(ingredient)}</li>`;
  }

  let instructionsHTML = "";
  for (let index = 0; index < selectedRecipe.instructions.length; index++) {
    const stepNumber = index + 1;
    const instruction = selectedRecipe.instructions[index];
    instructionsHTML += `<p><strong>${stepNumber}.</strong> ${escapeHTML(instruction)}</p>`;
  }

  let mealTypes = "Recipe";
  if (selectedRecipe.mealType && selectedRecipe.mealType.length > 0) {
    mealTypes = selectedRecipe.mealType.map(escapeHTML).join(", ");
  }

  dialogContent.innerHTML = `
    <img class="dialog-image" src="${escapeHTML(selectedRecipe.image)}" alt="${escapeHTML(selectedRecipe.name)}">
    <div class="dialog-body">
      <span class="recipe-cuisine">${escapeHTML(selectedRecipe.cuisine)}</span>
      <h2>${escapeHTML(selectedRecipe.name)}</h2>
      <div class="dialog-meta">
        <span>⏱️ Prep ${selectedRecipe.prepTimeMinutes} min</span>
        <span>🍳 Cook ${selectedRecipe.cookTimeMinutes} min</span>
        <span>⭐ ${escapeHTML(selectedRecipe.rating)} (${escapeHTML(selectedRecipe.reviewCount)} reviews)</span>
        <span>👥 ${escapeHTML(selectedRecipe.servings)} servings</span>
        <span>📊 ${escapeHTML(selectedRecipe.difficulty)}</span>
        <span>🍽️ ${mealTypes}</span>
      </div>
      <h3>Ingredients</h3>
      <ul class="ingredients">${ingredientsHTML}</ul>
      <h3>Instructions</h3>
      <div class="instructions">${instructionsHTML}</div>
    </div>
  `;

  recipeDialog.showModal();
}

// ============================================================
// ALUR 9: EVENT PENGGUNA - cari, filter, detail, favorit, reset, dan retry
// ============================================================
// Ketika tombol pencarian ditekan, cegah halaman refresh dan tampilkan hasilnya.
searchForm.addEventListener("submit", function (event) {
  event.preventDefault();
  displayRecipes();
});

// Perbarui hasil saat pengguna mengetik atau mengganti filter.
searchInput.addEventListener("input", displayRecipes);
cuisineFilter.addEventListener("change", displayRecipes);
difficultyFilter.addEventListener("change", displayRecipes);

// Satu event listener untuk tombol detail dan favorit di semua kartu resep.
recipeGrid.addEventListener("click", function (event) {
  const clickedButton = event.target.closest("button[data-action]");

  if (clickedButton === null) {
    return;
  }

  const recipeId = Number(clickedButton.dataset.id);

  if (clickedButton.dataset.action === "favorite") {
    changeFavorite(recipeId);
  }

  if (clickedButton.dataset.action === "details") {
    openRecipeDetails(recipeId);
  }
});

// Beralih antara semua resep dan daftar favorit.
favoriteButton.addEventListener("click", function () {
  showingFavorites = !showingFavorites;
  favoriteButton.setAttribute("aria-pressed", String(showingFavorites));
  displayRecipes();
});

// Kosongkan pencarian dan filter, lalu kembali ke semua resep.
resetButton.addEventListener("click", function () {
  searchInput.value = "";
  cuisineFilter.value = "";
  difficultyFilter.value = "";
  showingFavorites = false;
  favoriteButton.setAttribute("aria-pressed", "false");
  displayRecipes();
});

// Tutup detail resep.
closeDialogButton.addEventListener("click", function () {
  recipeDialog.close();
});

// Coba ambil data lagi setelah terjadi error.
retryButton.addEventListener("click", loadRecipes);

// Klik pada area gelap di luar dialog juga akan menutup detail.
recipeDialog.addEventListener("click", function (event) {
  if (event.target === recipeDialog) {
    recipeDialog.close();
  }
});

// ============================================================
// ALUR 10: MULAI APLIKASI - tampilkan jumlah favorit dan ambil resep
// ============================================================
// Tampilkan jumlah favorit yang sudah tersimpan, lalu mulai mengambil data resep.
favoriteCount.textContent = favoriteIds.length;
loadRecipes();
