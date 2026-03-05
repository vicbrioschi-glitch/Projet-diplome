let socket;
let video;
let motActuel = null;
let imgDessous = null;
let imgDessousLoaded = false;
let latestMask = null;
let segmenter;

function setup() {
  // Créer un canvas plein écran
  let cnv = createCanvas(windowWidth, windowHeight);
  cnv.style('position', 'absolute');
  cnv.style('top', '0');
  cnv.style('left', '0');
  cnv.style('z-index', '2');
  
  pixelDensity(1); // Important pour la manipulation de pixels
  
  socket = io();

  // Préparer la vidéo (webcam)
  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();

  // Charger le modèle bodySegmentation - SelfieSegmentation est plus fiable
  const options = {
    maskType: "background",
    runtime: "tfjs"
  };
  
  console.log("Chargement du modèle de segmentation...");
  segmenter = ml5.bodySegmentation(video, options, modelLoaded);

  // Quand on reçoit un message du serveur
  socket.on('messageFromServer', (msg) => {
    console.log('Message reçu :', msg);
    if (msg.mot) {
      motActuel = msg.mot;
      // Image du dessus (mot-a.png) sur le body
      document.body.style.backgroundImage = `url('motifs/${msg.mot}-a.png')`;
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundPosition = 'center';
      // Image du dessous: choisir un mot DIFFÉRENT au hasard
      const symbols = [
        "chapeau","pinceau","pompier","fourmis","chalet","portefeuille","mortpion","cartable","rideau","départ","sirene","rateau","coussin","millefeuille","citron","boisson","bricole","poirreau","vernis","page"
      ];
      let autresMots = symbols.filter(s => s !== msg.mot);
      let motAleatoire = autresMots[Math.floor(Math.random() * autresMots.length)];
      imgDessousLoaded = false;
      imgDessous = loadImage(`motifs/${motAleatoire}-b.png`, () => {
        imgDessousLoaded = true;
        console.log("Image dessous chargée (aléatoire):", motAleatoire);
      });
    } else {
      document.body.style.backgroundImage = '';
      imgDessous = null;
      imgDessousLoaded = false;
    }
  });
}

function modelLoaded() {
  console.log("Modèle de segmentation chargé !");
  segmenter.detectStart(video, gotSegmentation);
}

function gotSegmentation(result) {
  if (result && result.mask) {
    latestMask = result.mask;
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function draw() {
  clear(); // Fond transparent
  
  // Debug: afficher l'état
  if (!latestMask) {
    fill(255, 0, 0);
    textSize(20);
    text("En attente du masque de segmentation...", 20, 30);
    // Afficher la vidéo pour debug
    image(video, 0, 50, 320, 240);
    return;
  }
  
  if (!imgDessous || !imgDessousLoaded) {
    fill(0, 255, 0);
    textSize(20);
    text("En attente d'une image (envoyez un mot)...", 20, 30);
    // Afficher le masque pour debug
    image(latestMask, 0, 50, 320, 240);
    return;
  }

  // Méthode simplifiée: utiliser le masque directement avec p5
  // Copier l'image de dessous
  let imgCopy = imgDessous.get();
  imgCopy.resize(width, height);
  
  // Copier et redimensionner le masque
  let maskCopy = latestMask.get();
  maskCopy.resize(width, height);
  
  // Appliquer le masque (le masque doit être en niveaux de gris)
  imgCopy.mask(maskCopy);
  
  // Dessiner l'image masquée
  image(imgCopy, 0, 0);
}
