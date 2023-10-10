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
console.log('test')