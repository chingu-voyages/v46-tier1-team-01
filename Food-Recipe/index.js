// Constants and Global Variables

const API_KEY = "69a70d6bb4msh7f8e2a33ff12d14p126bcbjsna708be83759f";
const RATE_LIMIT = 5; // Requests per second
const fetchQueue = []; //API is so slow (5 req per second),so we are using this fetch queue
let loadingModal = null;

//Searh Input Event Listener 

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");
  const searchInput = document.querySelector(".search__input");
  const nameElement = document.querySelector(".ingredient-searched");

  if (form && searchInput && nameElement) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      clearResults();
      const searched = document.createElement("h2");
      searched.textContent = `Your results for ${searchInput.value}`;
      nameElement.innerHTML = "";
      nameElement.appendChild(searched);
      clearResults();
      await Autocomplete(searchInput.value);
    });
  } else {
    console.error("The form, search input, or name element is not found in the DOM.");
  }
});

async function executeFetchQueue() {
  while (fetchQueue.length > 0) {

    showLoadingModal();

    const { recipeName: displayName, originalName } = fetchQueue.shift();
    await fetchResponses(displayName, originalName);
    await new Promise((resolve) => setTimeout(resolve, 1000 / RATE_LIMIT));

    hideLoadingModal();
  }
}

// Fetching AutoComplete the User input

async function Autocomplete(recipeName) {
  const url = `https://tasty.p.rapidapi.com/recipes/auto-complete?prefix=${recipeName}`;
  const options = {
    method: "GET",
    headers: {
      "X-RapidAPI-Key": API_KEY,
      "X-RapidAPI-Host": "tasty.p.rapidapi.com",
    },
  };

  try {
    const response = await fetch(url, options);
    const result = await response.json();

    if (result.results && result.results.length > 0) {
      fetchQueue.length = 0;
      for (const element of result.results) {
        if (element.display.toLowerCase() !== recipeName.toLowerCase()) {
          fetchQueue.push({ recipeName: element.display, originalName: recipeName });
        }
      }
      executeFetchQueue();
    } else {
      noResults();
    }
  } catch (error) {
    console.error(error);
  }
}

// Fetching details from API

async function fetchResponses(recipeName) {
  try {
    const response = await fetch(
      `https://tasty.p.rapidapi.com/recipes/list?from=0&size=1&q=${recipeName}`,
      {
        method: "GET",
        headers: {
          "X-RapidAPI-Key": API_KEY,
          "X-RapidAPI-Host": "tasty.p.rapidapi.com",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Request failed");
    }

    const data = await response.json();

    if (Array.isArray(data.results) && data.results.length === 0) {
      console.log('No results found');
    }

    const thumbnail = data.results[0].thumbnail_url;
    const video_url = data.results[0].original_video_url;
    const description = data.results[0].description;

    const displayName = data.results[0]?.name;

    const countryTag = () => {
      let result = "";
      data.results[0]?.tags.filter((entry) => {
        if (entry.root_tag_type === "cuisine" && entry.display_name !== "Cuisine")
          result += `${entry.display_name} `;
      });
      return result.length === 0 ? "N/A" : result;
    };

    const rating = Math.ceil(data.results[0].user_ratings.score * 5);
    const yields = data.results[0].yields;
    const cookTime = data.results[0].total_time_tier?.display_tier ?? "N/A";
    const ingredientsTag = data.results[0]?.sections[0].components;

    const instructionsTag = data.results[0]?.instructions;

    const difficultyTag = () => {
      const master = data.results[0]?.tags;
      const filteredDifficultyTags = master.filter((entry) => {
        return (
          entry.root_tag_type === "difficulty" &&
          (entry.display_name === "Easy" ||
            entry.display_name === "Medium" ||
            entry.display_name === "Difficult" ||
            entry.display_name === "Hard")
        );
      });
      const result = filteredDifficultyTags.map((entry) => entry.display_name);
      return result;
    };

    const nutrition = () => {
      const obj = data.results[0]?.nutrition;
      let result = "";
      if (obj) {
        for (const key in obj) {
          if (obj.hasOwnProperty(key) && key !== "updated_at") {
            result += `${capitalize_firstLetter(key)}: ${obj[key]}, `;
          }
        }
        result = result.length > 0 ? result.slice(0, -2).split(',').map(item => `<li>${item}</li>`).join("") : 'No nutrition data available';
      }
      return result;
    };

    createRecipe(displayName, thumbnail, video_url, description, countryTag, rating, cookTime, yields, ingredientsTag, instructionsTag, nutrition, difficultyTag);
  } catch (error) {
    console.error(error);
  }
}

// Function to create a dynamic recipe content box

function createRecipe(displayName, img_url, video_url, description, countryTag, rating, cookTime, yields, ingredientsTag, instructionsTag, nutrition, difficultyTag) {

  if (loadingModal) {
    loadingModal.remove();
    loadingModal = null;
  }

  const box = document.createElement("div");
  box.classList.add("results__result");

  if (body.classList.contains('dark-mode')) {
    box.classList.add('dark-mode');
  }

  const resultIntro = document.createElement("div");
  resultIntro.classList.add("results__result--intro");

  const recipeDetails = document.createElement("h3");
  recipeDetails.textContent = capitalize_firstLetter(displayName);

  const img = document.createElement("img");
  img.src = img_url;

  const button = createViewRecipeButton(displayName, img_url, video_url, description, countryTag, rating, cookTime, yields, ingredientsTag, instructionsTag, nutrition, difficultyTag);

  resultIntro.appendChild(recipeDetails);
  resultIntro.appendChild(button);
  box.appendChild(img);
  box.appendChild(resultIntro);

  const recipeContainer = document.querySelector(".results__container");
  recipeContainer.appendChild(box);
}

// Function to create a "View Recipe" button and attach a click event

function createViewRecipeButton(displayName, img_url, video_url, description, countryTag, rating, cookTime, yields, ingredientsTag, instructionsTag, nutrition, difficultyTag) {
  const button = document.createElement("button");
  button.classList.add("result__get-recipe");
  button.textContent = "View Recipe";

  button.addEventListener('click', () => {
    addDialog(displayName, img_url, video_url, description, countryTag, rating, cookTime, yields, ingredientsTag, instructionsTag, nutrition, difficultyTag);
  });
  return button;
}

// Function to display "No Results" message

function noResults() {
  console.log('No results')
  clearResults();
  const recipeContainer = document.querySelector(".results__container");
  const noResult = document.createElement('h2');
  noResult.textContent = 'No result found';
  recipeContainer.appendChild(noResult);
}

// Function for view Recipe button

function addDialog(name, url, video_url, description, countryTag, rating, cookTime, yields, ingredientsTag, instructionsTag, nutrition, difficultyTag) {
  const modal = createModal();
  const close = createCloseButton();
  const mealName = createMealName(name);
  const mealImage = createMealImage(url);
  const list = createTagList(countryTag, difficultyTag);
  const info = createInfoSection(yields, cookTime);
  const ingredientsText = createIngredients(ingredientsTag);
  const instructionsText = createInstructions(instructionsTag);
  const linkContainer = createVideoLink(video_url);
  const nutritionDetails = createNutritionDetails(nutrition);
  modal.append(close, mealName, mealImage, list, info, ingredientsText, instructionsText, linkContainer, nutritionDetails);
  document.querySelector('.results-section').appendChild(modal);

  close.addEventListener('click', () => closeModal(modal));
  document.body.addEventListener('keydown', (e) => handleKeyPress(e, modal));

  colorStars(rating);
}

function createModal() {
  const modal = document.createElement('div');
  modal.classList.add('modal');
  modal.classList.add('modal-active');
  if (body.classList.contains('dark-mode')) {
    modal.classList.add('dark-mode');
  }
  return modal;
}

function createCloseButton() {
  const close = document.createElement('button');
  close.classList.add('modal__close');
  close.innerHTML = '&#10006;';
  if (body.classList.contains('dark-mode')) {
    close.classList.add('dark-mode');
  }
  return close;
}


function createMealName(name) {
  const mealName = document.createElement('h3');
  mealName.classList.add('modal__name');
  mealName.textContent = Capitalize(name);
  return mealName;
}

function createMealImage(url) {
  const mealImage = document.createElement('img');
  mealImage.src = url;
  mealImage.alt = 'Meal Image';
  mealImage.classList.add('modal__image');
  return mealImage;
}

function createTagList(countryTag, difficultyTag) {
  const list = document.createElement('ul');
  list.classList.add('modal__tags');

  const country = createTagItem(countryTag());
  const difficulty = createTagItem(`Difficulty: ${difficultyTag()}`);
  const stars = document.createElement('li');
  stars.classList.add('modal-tag__rating');
  stars.innerHTML = '<i class="fa-solid fa-star" style="color: rgb(255, 196, 0);"></i><i class="fa-solid fa-star" style="color: rgb(255, 196, 0);"></i><i class="fa-solid fa-star" style="color: rgb(255, 196, 0);"></i><i class="fa-solid fa-star" style="color: rgb(255, 196, 0);"></i><i class="fa-solid fa-star" style="color: rgb(255, 196, 0);"></i>';
  list.append(country, difficulty, stars);
  return list;
}

function createTagItem(text) {
  const item = document.createElement('li');
  item.textContent = text;
  return item;
}
function createInfoSection(yields, cookTime) {
  const info = document.createElement('div');
  info.classList.add('modal__info');

  const servings = createSubheading(yields);
  const timeInfo = createSubheading(`Cooking Time: ${cookTime}`);

  info.appendChild(servings);
  info.appendChild(timeInfo);
  return info;
}

function createSubheading(title) {
  const heading = document.createElement('h4');
  heading.textContent = title;
  return heading;
}


function createIngredients(description) {
  const ingredientsListElement = document.createElement('div');

  const ingredientsList = document.createElement('ul');
  description.forEach((ingredient, index) => {
    const listItem = document.createElement('li');
    listItem.textContent = ingredient.raw_text;
    ingredientsList.appendChild(listItem);
  });
  ingredientsListElement.appendChild(ingredientsList);
  
  return ingredientsListElement;
}


function createInstructions(instructionsTag) {
  const instructionsDiv = document.createElement('div');
  instructionsDiv.classList.add('modal__instructions');

  const subheading = document.createElement('h4');
  subheading.textContent = 'Instructions:';
  const instructionsList = document.createElement('ul');
  instructionsDiv.appendChild(subheading);
  instructionsDiv.appendChild(instructionsList);

  instructionsTag.forEach((instruction) => {
    const listItem = document.createElement('li');
    listItem.textContent = instruction.display_text;
    instructionsList.appendChild(listItem);
  });
  return instructionsDiv;
}


function createVideoLink(video_url) {
  const linkContainer = document.createElement('div');
  linkContainer.classList.add('modal__btn-wrapper');
  const video_link = document.createElement('a');
  video_link.href = video_url;
  video_link.target = '_blank';
  video_link.textContent = 'Watch video';
  video_link.classList.add('modal__video-link');
  linkContainer.appendChild(video_link);
  return linkContainer;
}

function createNutritionDetails(nutrition) {
  const details = document.createElement('details');
  details.classList.add('modal__nutrition');
  const summary = document.createElement('summary');
  summary.textContent = 'Nutrition Information';
  const nutritionList = document.createElement('ul');
  nutritionList.innerHTML = nutrition();
  details.append(summary, nutritionList);
  return details;
}

function closeModal(modal) {
  const resultsSection = document.querySelector('.results-section');
  if (resultsSection) {
    resultsSection.removeChild(modal);
  }
}

function handleKeyPress(event, modal) {
  if (event.key === 'Escape') {
    const resultsSection = document.querySelector('.results-section');
    if (resultsSection && resultsSection.contains(modal)) {
      resultsSection.removeChild(modal);
    }
  }
}

function colorStars(rating) {
  for (let i = 1; i <= 5; i++) {
    const star = document.querySelector(`.fa-star:nth-child(${i})`);
    if (i <= rating) {
      star.style.color = 'rgb(255, 196, 0)';
    }
  }
}

function Capitalize(text) {
  result = ''
  for (word of text.split(' ')) {
    result += word[0].toUpperCase() + word.slice(1) + ' '
  }
  return result;
}

// Function to capitalize the first letter of a string

function capitalize_firstLetter(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}


function clearResults() {
  const recipeContainer = document.querySelector(".results__container");
  while (recipeContainer.firstChild) {
    recipeContainer.removeChild(recipeContainer.firstChild);
  }
}

//closes the modal on click outside the modal
window.addEventListener('click', (e) => {
  if (document.querySelector('.modal')) {
    if (!e.target.matches('.modal')) {
      if (e.target.matches('.result__get-recipe')) return
      else {
        const doesNoCloseOnClick = e.target.closest('h3, img, ul, div, h4, p, a, summary');
        if (!doesNoCloseOnClick) {
          document.querySelector('.results-section').removeChild(document.querySelector('.modal'));
        }
      }

    }
  }
})

//Loading Modal

function showLoadingModal() {
  // Create and display the loading modal
  loadingModal = document.createElement('div');
  loadingModal.classList.add('results__result', 'loading-modal');
  if (body.classList.contains('dark-mode')) {
    loadingModal.classList.add('dark-mode');
    loadingModal.innerHTML = `<div class="lds-dual-ring">
              <p>Loading...</p>
            </div>

            <img
              src="./assets/black gif.gif"
              alt="plate of delicious food"
              class="result__image blur-2"
            />
            <div class="results__result--intro blur-1">
              <h3>Recipe Name</h3>
              <button class="result__get-recipe">View Recipe</button>
            </div>`;
  } else {
    loadingModal.innerHTML = `<div class="lds-dual-ring">
    <p>Loading...</p>
    </div>
            <img
              src="./assets/loader.gif"
              alt="plate of delicious food"
              class="result__image blur-2"
              />
              <div class="results__result--intro blur-1">
              <h3>Recipe Name</h3>
              <button class="result__get-recipe">View Recipe</button>
              </div>`;
  }
  // Append the loading modal to the results section
  const resultsSection = document.querySelector('.results-section');
  resultsSection.appendChild(loadingModal);
}


//Hiding Modal

function hideLoadingModal() {
  if (loadingModal) {
    loadingModal.remove();
    loadingModal = null;
  }
}

// Dark/light mode toggle

const darkModeToggle = document.querySelector('.dark-mode__toggle');
darkModeToggle.addEventListener('change', () => toggleDarkMode());

const body = document.body;
const isDarkMode = localStorage.getItem('dark-mode');
if (isDarkMode === 'enabled') {
  body.classList.add('dark-mode');
  darkModeToggle.checked = true;
}

function toggleDarkMode() {
  const results = document.querySelectorAll('.results__result');
  const modal = document.querySelectorAll('.modal');
  const modalClose = document.querySelectorAll('.modal__close');

  body.classList.toggle('dark-mode');

  if (body.classList.contains('dark-mode')) {
    localStorage.setItem('dark-mode', 'enabled');
  } else {
    localStorage.setItem('dark-mode', 'disabled');
  }

  if (results) {
    results.forEach(i => i.classList.toggle('dark-mode'));
  }
  if (modal) {
    modal.forEach(i => i.classList.toggle('dark-mode'));
  }
  if (modalClose) {
    modalClose.forEach(i => i.classList.toggle('dark-mode'));
  }
}