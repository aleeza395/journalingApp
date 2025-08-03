const menuicon = document.querySelector('.menu-icon');
const navlinks = document.querySelector('.nav-links');
console.log("hellloooooo")

menuicon.addEventListener("click", () => {
    navlinks.classList.toggle('show')
})