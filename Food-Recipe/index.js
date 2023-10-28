//User Input
let responseCount = 0;
document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");
  const searchInput = document.querySelector(".search__input");
  const nameElement = document.querySelector(".ingredient-searched");


  if (form && searchInput && nameElement) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const searched = document.createElement("h2");
      searched.textContent = `Your results for ${searchInput.value}`;
      nameElement.innerHTML = "";
      nameElement.appendChild(searched);
      clearResults();
      responseCount = 0;
      await Autocomplete(searchInput.value);
    });
  } else {
    console.error("The form, search input, or name element is not found in the DOM.");
  }
});

const API_KEY = "c0ceab46e0msh0eadabf65682e61p12dd5ejsnbcab6b2c9a32";

const RATE_LIMIT = 5; // Requests per second

const fetchQueue = []; // Queue to manage fetch requests

async function executeFetchQueue() {
  while (fetchQueue.length > 0) {
    if (responseCount >= 1) {
      break;
    }
    const { recipeName, originalName } = fetchQueue.shift();
    await fetchThumbnailVideoDescription(recipeName, originalName);
    await new Promise((resolve) => setTimeout(resolve, 1000 / RATE_LIMIT));
    responseCount++;
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
    console.log(result);

    fetchQueue.length = 0; // Clear the fetchQueue
    for (const element of result.results) {
      if (element.display.toLowerCase() !== recipeName.toLowerCase()) {
        fetchQueue.push({ recipeName: element.display, originalName: recipeName });
      }
    }

    executeFetchQueue(); // Start processing the fetch queue
  } catch (error) {
    console.error(error);
  }
}

// Fetching the Thumbnail from API
async function fetchThumbnailVideoDescription(recipeName) {
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
    console.log(data.results[0]);

    if (Array.isArray(data.results) && data.results.length > 0) {
      const thumbnail = data.results[0].thumbnail_url;
      const video_url = data.results[0].original_video_url;
      const description = data.results[0].description;

      const countryTag = () => {
        let result = "";
        data.results[0]?.tags.filter((entry) => {
          if (entry.root_tag_type === "cuisine" && entry.display_name !== "Cuisine")
            result += `${entry.display_name} `;
        });
        return result;
      };

      const rating = Math.ceil(data.results[0].user_ratings.score * 5);
      const yields = data.results[0].yields;
      const cookTime = data.results[0]?.total_time_tier?.display_tier;
      const instructionsTag = data.results[0]?.instructions;

      const nutrition = () => {
        const obj = data.results[0]?.nutrition;
        let result = "";
        if (obj) {
          for (const key in obj) {
            if (obj.hasOwnProperty(key) && key !== "updated_at") {
              result += `${key}: ${obj[key]}, `;
            }
          }
          result = result.slice(0, -2).split(',').map(item => `<li>${item}</li>`).join("");
        }
        return result;
      };

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

      createRecipe(recipeName, thumbnail, video_url, description, countryTag, rating, cookTime, yields, instructionsTag, nutrition, difficultyTag);
    } else {
      console.error("No results found in thumbnail API for:", recipeName);
    }
  } catch (error) {
    console.error(error);
  }
}

  // // by Andrei : to make it easy to add elements and check styling. Will require commenting (overriding) out actual API functionality.
  // // by Andrei: set LS for faster display of search result (mock result will aways display 'chicken')  DO NOT DELETE
  // if (!localStorage['resultForLS']) {
  //   localStorage.setItem('resultForLS', JSON.stringify(resultForLS))
  // } else { console.log('exists') }

  // const fromLS = JSON.parse(localStorage['resultForLS'])
  // console.log(fromLS)
  // createRecipe(fromLS['recipeName'], fromLS['thumbnail'], fromLS['video_url'], fromLS['description']);
  // const dataMea = JSON.parse(localStorage.getItem('entire data'))
  // console.log(dataMea.results[0].yields)
  // //END



//Creating the dynamic receipe content box

function createRecipe(recipeName, img_url, video_url, description, countryTag, rating, cookTime, yields, instructionsTag, nutrition, difficultyTag) {
  const box = document.createElement("div");
  const resultIntro = document.createElement("div");
  resultIntro.classList.add("results__result--intro");
  box.classList.add("results__result");
  const recipeDetails = document.createElement("h3");
  const img = document.createElement("img");
  const button = document.createElement("button");

  button.classList.add("result__get-recipe");
  button.textContent = "View Recipe";

  recipeDetails.textContent = Capitalize(recipeName);
  img.src = img_url;

  button.addEventListener('click', () => {
    addDialog(recipeName, img_url, video_url, description, countryTag, rating, cookTime, yields, instructionsTag, nutrition, difficultyTag);
  });


  resultIntro.appendChild(recipeDetails);
  resultIntro.appendChild(button);
  box.appendChild(img);
  box.appendChild(resultIntro);

  const recipeContainer = document.querySelector(".results__container");
  recipeContainer.appendChild(box);
}

//Function for No results

function NoResults() {
  const recipeContainer = document.querySelector(".results__container");
  const NoResult = document.createElement('h2');
  NoResult.textContent = 'No result Found';
  recipeContainer.appendChild(NoResult);
}



// Function for view Recipe button

function addDialog(name, url, video_url, description, countryTag, rating, cookTime, yields, instructionsTag, nutrition, difficultyTag) {
  const modal = createModal();
   const close = createCloseButton();
  const mealName = createMealName(name);
  const mealImage = createMealImage(url);
  const list = createTagList(countryTag, difficultyTag);
  const info = createInfoSection(yields, cookTime);
  const ingredientsText = createIngredients(description);
  const instructionsText = createInstructions(instructionsTag);
  const linkContainer = createVideoLink(video_url);
  const nutritionDetails = createNutritionDetails(nutrition);
  modal.append(close, mealName, mealImage, list, info, ingredientsText, instructionsText, linkContainer, nutritionDetails);
  document.querySelector('.results-section').appendChild(modal);
  modal.classList.add('modal-active');

  close.addEventListener('click', () => closeModal(modal));
  document.body.addEventListener('keydown', (e) => handleKeyPress(e, modal));

  colorStars(rating);
}

function createModal() {
  const modal = document.createElement('div');
  modal.classList.add('modal');
  return modal;
}

function createCloseButton() {
  const close = document.createElement('button');
  close.classList.add('modal__close');
  close.innerHTML = '&#10006;';
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
  const timeInfo = createSubheading('Cooking Time:', cookTime);
 
  info.appendChild(servings[0]); 
  info.appendChild(timeInfo[0]); 
  info.appendChild(timeInfo[1]); 

  return info;
}

function createSubheading(title, text) {
  const heading = document.createElement('h4');
  heading.textContent = title;

  if (text) {
    const content = document.createElement('p');
    content.textContent = text;
    return [heading, content];
  }

  return [heading];
}

function createIngredients(description) {
  const ingredientsContainer = document.createElement('div'); 

  const ingredientsTitle = document.createElement('h4');
  ingredientsTitle.textContent = 'Ingredients';

  const ingredientsText = document.createElement('p');
  ingredientsText.classList.add('modal__ingredients');
  ingredientsText.textContent = description;
  ingredientsContainer.appendChild(ingredientsTitle);
  ingredientsContainer.appendChild(ingredientsText);

  return ingredientsContainer; 
}



function createInstructions(instructionsTag) {
  const instructions = document.createElement('ul');
  instructions.classList.add('modal__instructions');

  const subheading = document.createElement('h4');
  subheading.textContent = 'Instructions:';
  instructions.appendChild(subheading);

  instructionsTag.forEach((instruction) => {
    const listItem = document.createElement('li');
    listItem.textContent = instruction.display_text;
    instructions.appendChild(listItem);
  });

  return instructions;
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


function clearResults() {
  const recipeContainer = document.querySelector(".results__container");
  while (recipeContainer.firstChild) {
    recipeContainer.removeChild(recipeContainer.firstChild);
  }
}


// //by Andrei : static modal functionality

// //by Andrei : to see the styling changes we make to the modal
// const modal = document.querySelector('.modal')
// const openModal = document.querySelector('.result__get-recipe')
// const closeModal = document.querySelector('.modal__close')
// // closeModal.addEventListener('click', () => modal.style.display = 'none')
// // openModal.addEventListener('click', () => modal.style.display = 'block')
// closeModal.addEventListener('click', () => modal.classList.remove('modal-active'))
// openModal.addEventListener('click', () => modal.classList.add('modal-active'))
