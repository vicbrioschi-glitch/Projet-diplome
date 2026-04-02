// === BOUTONS ===
const btnRegles = document.getElementById('btn-regles');
const btnCredits = document.getElementById('btn-credits');

// === FENÊTRES ===
const reglesBox = document.getElementById('regles-box');
const creditsBox = document.getElementById('credits-box');
const overlay = document.getElementById('overlay');

// === BOUTONS FERMETURE ===
const closeButtons = document.querySelectorAll('.close-btn');


// === OUVERTURE DES FENÊTRES ===
btnRegles.addEventListener('click', () => {
    reglesBox.style.display = "block";
    overlay.style.display = "block";
});

btnCredits.addEventListener('click', () => {
    creditsBox.style.display = "block";
    overlay.style.display = "block";
});


// === FERMETURE AVEC LE BOUTON ✖ ===
closeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const target = btn.getAttribute("data-close"); // ex: regles-box ou credits-box
        document.getElementById(target).style.display = "none";
        overlay.style.display = "none";
    });
});

// === FERMETURE PAR CLIQUE SUR L’OVERLAY ===
overlay.addEventListener('click', () => {
    reglesBox.style.display = "none";
    creditsBox.style.display = "none";
    overlay.style.display = "none";
});

// === CAROUSEL===
let index = 0;
const images = document.querySelectorAll(".carousel img");

function showImage(i) {
  images.forEach(img => img.classList.remove("active"));
  images[i].classList.add("active");
}

function next() {
  index = (index + 1) % images.length;
  showImage(index);
}

function prev() {
  index = (index - 1 + images.length) % images.length;
  showImage(index);
}
