//User Input
document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");
  const searchInput = document.querySelector(".search__input");
  const nameElement = document.querySelector(".ingredient-searched");

  if (form && searchInput) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const searched = document.createElement("h2");
      searched.textContent = `Your results for ${searchInput.value}`;
      nameElement.innerHTML = " ";
      nameElement.appendChild(searched);
      clearResults();
      Autocomplete(searchInput.value);
    });
  } else {
    console.error("The form or search input element is not found in the DOM.");
  }
});

const API_KEY = "c0ceab46e0msh0eadabf65682e61p12dd5ejsnbcab6b2c9a32";

// Fetching AutoComplete the User input

async function Autocomplete(recipeName) {

  // //by Andrei : ot make it easy to add elements and check styling. Will require commenting (overriding) out actual APi functionality. DO NOT DELETE
  // if (localStorage['resultForLS']) {
  //   fetchThumbnailVideoDescription('chicken breast')
  // }
  // //END

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
    console.log(result)
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
    console.log(data)
    if (Array.isArray(data.results) && data.results.length > 0) {
      const thumbnail = data.results[0].thumbnail_url;
      const video_url = data.results[0].original_video_url;
      const description = data.results[0].description;
      const countryTag = data.results[0].tags[0].display_name
      const rating = Math.ceil(data.results[0].user_ratings.score * 5)
      const yields = data.results[0].yields
      const cookTime = data.results[0]?.total_time_tier?.display_tier

      createRecipe(recipeName, thumbnail, video_url, description, countryTag, rating, cookTime, yields);


      // const resultForLS = { //can comment out once LS is set
      //   'recipeName': recipeName,
      //   'thumbnail': thumbnail,
      //   'video_url': video_url,
      //   'description': description,
      //   'country': countryTag,
      //   'rating': rating,
      //   'yields': yields,
      //   'cookTime': cookTime
      // }
      // localStorage.setItem('resultForLS', JSON.stringify(resultForLS))

    } else {
      console.error("No results found in thumbnail API for:", recipeName);
    }
  } catch (error) {
    console.error(error);
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

}

//Creating the dynamic receipe content box

function createRecipe(recipeName, img_url, video_url, description, countryTag, rating, cookTime, yields) {
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
    addDialog(recipeName, img_url, video_url, description, countryTag, rating, cookTime, yields);
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

function Capitalize(name) {
  result = ''
  for (word of name.split(' ')) {
    result += word[0].toUpperCase() + word.slice(1) + ' '
  }
  return result
}

// Function for view Recipe button
function addDialog(name, url, video_url, description, countryTag, rating, cookTime, yields) {
  const modal = document.createElement('div');
  modal.classList.add('modal');

  const close = document.createElement('button');
  close.classList.add('modal__close');
  close.innerHTML = '&#10006;';

  const mealName = document.createElement('h3');
  mealName.classList.add('modal__name');
  mealName.textContent = Capitalize(name);

  const mealImage = document.createElement('img');
  mealImage.src = url;
  mealImage.alt = 'Meal Image';
  mealImage.classList.add('modal__image');

  const list = document.createElement('ul')
  list.classList.add('modal__tags')

  const country = document.createElement('li')
  country.textContent = countryTag.toUpperCase()

  const stars = document.createElement('li')
  stars.classList.add('modal-tag__rating')
  stars.innerHTML = '<i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i>'
  list.append(country, stars)


  const info = document.createElement('div')
  info.classList.add('modal__info')


  const servings = document.createElement('h4')
  servings.textContent = yields

  const timeInfo = document.createElement('div')
  const timeTitle = document.createElement('h4')
  timeTitle.textContent = 'Cooking Time: '
  const timeNumber = document.createElement('p')
  timeNumber.textContent = cookTime

  timeInfo.append(timeTitle, timeNumber)
  info.append(servings, timeInfo)


  const ingredientsTitle = document.createElement('h4')
  ingredientsTitle.textContent = 'Ingredients: '
  const ingredientsText = document.createElement('p');
  ingredientsText.classList.add('modal__ingredients');
  ingredientsText.textContent = 'Coriander chocolate peanut butter dip lavender lemonade blueberry pops red lentil curry hummus falafel bowl mint arugula salad fall coconut milk rich coconut cream.';


  const instructionsTitle = document.createElement('h4')
  instructionsTitle.textContent = 'Instructions: '
  const instructionsText = document.createElement('p');
  instructionsText.classList.add('modal__instructions');
  instructionsText.textContent = description;

  const linkContainer = document.createElement('div')
  linkContainer.classList.add('modal__btn-wrapper')
  const video_link = document.createElement('a');
  video_link.href = video_url;
  video_link.target = "_blank";
  video_link.textContent = 'Watch video';
  video_link.classList.add('modal__video-link');
  linkContainer.append(video_link)

  const details = document.createElement('details')
  details.classList.add('modal__nutrition')
  const summary = document.createElement('summary')
  summary.textContent = 'Nutrition Information'
  const para = document.createElement('p')
  para.textContent = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do  eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut  enim ad minim veniam, quis nostrud exercitation ullamco laboris   nisi ut aliquip ex ea commodo consequat. Duis aute irure dolo   in reprehenderit in voluptate velit esse cillum dolore eu fugiat  nulla pariatur. Excepteur sint occaecat cupidatat non proident,  sunt in culpa qui officia deserunt mollit anim'
  details.append(summary, para)


  //Need to work on other things to display.

  modal.append(close, mealName, mealImage);
  modal.append(list, info)
  modal.append(ingredientsTitle, ingredientsText);
  modal.append(instructionsTitle, instructionsText);
  modal.append(linkContainer, details);


  document.querySelector('.results-section').appendChild(modal);
  modal.style.display = 'block';

  close.addEventListener('click', function () {
    document.querySelector('.results-section').removeChild(modal);
  });

  //by Andrei: to properly dispose of the dialog element on Escape key press
  //works, but throws an exception
  document.body.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      try {
        document.querySelector('.results-section').removeChild(modal);
      } catch (error) {
        console.error("Caught an exception:", error);
      }
    }
  })
  colorStars(rating)
}



// Function to clear existing results

function clearResults() {
  const recipeContainer = document.querySelector(".results__container");
  while (recipeContainer.firstChild) {
    recipeContainer.removeChild(recipeContainer.firstChild);
  }
}

function colorStars(score) {
  for (let i = 1; i <= 5; i++) {
    const star = document.querySelector(`.fa-star:nth-child(${i})`);
    if (i <= score) {
      star.style.color = 'rgb(255, 196, 0)';
    }
  }
  console.log(score)
}




//by Andrei : static modal functionality

// //by Andrei : to see the styling changes we make to the modal
// const modal = document.querySelector('.modal')
// const openModal = document.querySelector('.result__get-recipe')
// const closeModal = document.querySelector('.modal__close')
// closeModal.addEventListener('click', () => modal.style.display = 'none')
// openModal.addEventListener('click', () => modal.style.display = 'block')
