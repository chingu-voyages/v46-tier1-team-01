//User Input
document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");
  const searchInput = document.querySelector(".search__input");
  const nameElement = document.querySelector(".ingredient-searched");

  if (form && searchInput) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const searched = document.createElement("h2");
      searched.textContent = `You results  for ${searchInput.value}`;
      nameElement.innerHTML = " ";
      nameElement.appendChild(searched);
      clearResults();
      Autocomplete(searchInput.value);
    });
  } else {
    console.error("The form or search input element is not found in the DOM.");
  }
});

const API_KEY = "e382cd2d05mshbe255d4b9009f46p177e2ajsn5caf5ffa3f4c";

// Fetching AutoComplete the User input

async function Autocomplete(recipeName) {
  const url = `https://tasty.p.rapidapi.com/recipes/auto-complete?prefix=${recipeName}`;
  const options = {
    method: "GET",
    headers: {
      "X-RapidAPI-Key": API_KEY,
      "X-RapidAPI-Host": "tasty.p.rapidapi.com"
    }
  };

  try {
    const response = await fetch(url, options);
    const result = await response.json();
    let firstResultFetched = false; //  1 result is enough for now -testing purpose

    for (const element of result.results) {
      if (element.display.toLowerCase() !== recipeName.toLowerCase()) {
        if (firstResultFetched) {
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 1000)); // 1-second delay
        fetchThumbnail(element.display);
        firstResultFetched = true;
      }
    }
  } catch (error) {
    console.error(error);
  }
}

//Fetching the Thumbnail from API

async function fetchThumbnail(recipeName) {
  try {
    const response = await fetch(
      `https://tasty.p.rapidapi.com/recipes/list?from=0&size=1&q=${recipeName}`,
      {
        method: "GET",
        headers: {
          "X-RapidAPI-Key": API_KEY,
          "X-RapidAPI-Host": "tasty.p.rapidapi.com"
        }
      }
    );

    if (!response.ok) {
      throw new Error("Request failed");
    }

    const data = await response.json();
    if (Array.isArray(data.results) && data.results.length > 0) {
      const thumbnail = data.results[0].thumbnail_url;
      createRecipe(recipeName, thumbnail);
    } else {
      console.error("No results found in thumbnail API for:", recipeName);
    }
  } catch (error) {
    console.error(error);
  }
}

//Fetching the Video url :

//Creating the dynamic receipe content box

function createRecipe(recipeName, url) {
  const box = document.createElement("div");
  const resultIntro = document.createElement("div");
  resultIntro.classList.add("results__result--intro");
  box.classList.add("results__result");
  const recipeDetails = document.createElement("h3");
  const img = document.createElement("img");
  const button = document.createElement("button");
  button.classList.add("result__get-recipe");
  button.textContent = "View Recipe";

  recipeDetails.textContent = recipeName;
  img.src = url;

  resultIntro.appendChild(recipeDetails);
  resultIntro.appendChild(button);
  box.appendChild(img);
  box.appendChild(resultIntro);

  const recipeContainer = document.querySelector(".results__container");
  recipeContainer.appendChild(box);
}

// Function for view Recipe button

// Function to clear existing results
function clearResults() {
  const recipeContainer = document.querySelector(".results__container");
  while (recipeContainer.firstChild) {
    recipeContainer.removeChild(recipeContainer.firstChild);
  }
}

//Dialog Box 

const getRecipeButtons = document.querySelectorAll('.result__get-recipe')
const modal = document.querySelector('.modal')
const modalClose = document.querySelector('.modal__close')

getRecipeButtons.forEach(button => button.addEventListener('click', openModal))
modalClose.addEventListener('click', closeModal)

function openModal() {
    modal.showModal()
}
function closeModal() {
    modal.close()
}
