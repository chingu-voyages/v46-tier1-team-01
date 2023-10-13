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
        fetchThumbnailVideoDescription(element.display);
        firstResultFetched = true;
      }
    }
  } catch (error) {
    console.error(error);
  }
}

//Fetching the Thumbnail from API

async function fetchThumbnailVideoDescription(recipeName) {
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
      const video_url=data.results[0].original_video_url;
      const description = data.results[0].description;
      createRecipe(recipeName, thumbnail,video_url,description);
    } else {
      console.error("No results found in thumbnail API for:", recipeName);
    }
  } catch (error) {
    console.error(error);
  }
}

//Creating the dynamic receipe content box

function createRecipe(recipeName, img_url , video_url,description) {
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
  img.src = img_url;

   button.addEventListener('click', function () {
    addDialog(recipeName, img_url, video_url , description);
  });

  resultIntro.appendChild(recipeDetails);
  resultIntro.appendChild(button);
  box.appendChild(img);
  box.appendChild(resultIntro);

  const recipeContainer = document.querySelector(".results__container");
  recipeContainer.appendChild(box);
}

//Function for No results

function NoResults(){
    const recipeContainer = document.querySelector(".results__container");
    const NoResult = document.createElement('h2');
    NoResult.textContent='No result Found';
    recipeContainer.appendChild(NoResult);
}

// Function for view Recipe button

function addDialog(name, url,video_url,description) {
  const dialogbox = document.createElement('dialog');
  dialogbox.classList.add('modal'); 

  const close = document.createElement('p');
  close.classList.add('modal__close'); 
  close.innerHTML = '&#10006;';

  const mealName = document.createElement('h3');
  mealName.classList.add('.modal__name');
  mealName.textContent = name;

  const mealImage = document.createElement('img');
  mealImage.src = url;
  mealImage.alt = 'Meal Image';
  mealImage.classList.add('modal__image');

  const Instructions = document.createElement('p');
  Instructions.classList.add('.modal__instructions');
  Instructions.textContent=description;

  const video_link = document.createElement('a');
  video_link.href=video_url;
  video_link.target="_blank";
  video_link.textContent='Watch video';
  video_link.classList.add('.modal__video-link');


  //Need to work on other things to display.

  dialogbox.appendChild(close);
  dialogbox.appendChild(mealName);
  dialogbox.appendChild(mealImage);
  dialogbox.appendChild(Instructions);
  dialogbox.appendChild(video_link);

 
  document.body.appendChild(dialogbox);
  dialogbox.showModal();

  close.addEventListener('click', function () {
    dialogbox.close();

    document.body.removeChild(dialogbox);
  });
}

// Function to clear existing results

function clearResults() {
  const recipeContainer = document.querySelector(".results__container");
  while (recipeContainer.firstChild) {
    recipeContainer.removeChild(recipeContainer.firstChild);
  }
}


