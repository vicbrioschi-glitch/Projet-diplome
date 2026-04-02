const symbols = ["chapeau","pinceau","pompier","fourmis","chalet","portefeuille","mortpion","cartable","rideau","départ","sirene","rateau","coussin","millefeuille","citron","boisson","bricole","poirreau","vernis","page"];


// Créer un deck avec toutes les combinaisons de symboles et variantes
let deck = [];
symbols.forEach(symbol => {
    ["a", "b"].forEach(variant => {
        deck.push({ symbol, variant });
    });
});
  let socket;
function setup() {
  
socket = io();
}


console.log(deck);

// Mélanger les cartes
deck.sort(() => Math.random() - 0.5);

const game = document.getElementById("game");

// Create cards
deck.forEach(({ symbol, variant }, idx) => {
    const card = document.createElement("div");
    card.classList.add("card");
    card.dataset.symbol = symbol;
    // Associer chaque symbole/variante à une image (chapeau-a.png, chapeau-b.png, ...)
    const imgFile = `motifs/${symbol}-${variant}.png`;
    card.innerHTML = `
        <div class="front ${symbol}-${variant}" style="background-image:url('${imgFile}'); background-size:cover; background-position:center;"></div>
        <div class="back">LISIBILITÉ</div>
    `;
    game.appendChild(card);
});

// Retourner toutes les cartes au chargement
/* document.querySelectorAll(".card").forEach(card => {
    card.classList.add("flipped");
}); */

let first = null;
let second = null;
let lock = false;

// Popup elements
const popup = document.getElementById("popup");
const btnContinue = document.getElementById("btn-continue");
const btnEnigme = document.getElementById("btn-enigme");

function showPopup() {
    if (popup) {
        popup.classList.add("show");
    } else {
        console.warn("Popup element '#popup' not found.");
    }
}
function hidePopup() {
    if (popup) popup.classList.remove("show");
}

btnContinue.onclick = () => hidePopup();

let lastFoundSymbol = null;
btnEnigme.onclick = () => {
  
    if (lastFoundSymbol) {
        const msg = {
            mot: lastFoundSymbol,
            time: Date.now()
        };
        socket.emit('messageFromSender', msg);
        console.log('Mot envoyé via websocket :', msg);
    } else {
        alert("Aucune paire trouvée à envoyer.");
    }
};



document.querySelectorAll(".card").forEach(card => {
    card.addEventListener("click", () => {
        if (lock || card.classList.contains("flipped")) return;

        card.classList.add("flipped");

        if (!first) {
            first = card;
        } else {
            second = card;
            lock = true;

            // comparer le symbole de base (ignorer la variante a/b)
            let sym1 = first.dataset.symbol;
            let sym2 = second.dataset.symbol;

                        if (sym1 === sym2) {
                                // --- PAIRE TROUVÉE → Popup ---
                                lastFoundSymbol = sym1;
                                setTimeout(showPopup, 200);
                                showPopup();
                                first = null;
                                second = null;
                                lock = false;
                        } else {
                // Retourner les cartes
                setTimeout(() => {
                    first.classList.remove("flipped");
                    second.classList.remove("flipped");
                    first = null;
                    second = null;
                    lock = false;
                }, 800);
            }
        }
    });
});









