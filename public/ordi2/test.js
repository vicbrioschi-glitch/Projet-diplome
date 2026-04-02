// VARIABLES GLOBALES
let socket;
let motActuel = null;
let video;
let bodyPix;
let segmentation;

// Éléments DOM
let revealedDiv;
let statusDiv;
let debugDiv;
let successDiv;
let motInput;
let btnProposer;

// Canvas pour convertir le masque
let maskCanvas;
let maskCtx;

let bodySegmentation;
const foreground_url = '../illu_background/' + msg.mot;
const background_url_a = '../motifs/' + msg.mot + '-a.png';
const background_url_b = '../motifs/' + msg.mot + '-b.png';
let options = {
  maskType: "person",
};



function preload() {
  bodySegmentation = ml5.bodySegmentation("BodyPix", options);
  foreground_image = loadImage(foreground_url);
  background_image_a = loadImage(background_url_a);
  background_image_b = loadImage(background_url_b);
}



// CONFIGURATION INITIALE
function setup() {
   createCanvas(windowWidth, windowHeight);

  video = createCapture(VIDEO);
  video.size(windowWidth, windowHeight);
  video.hide();

  bodySegmentation.detectStart(video, gotResults);
  
  // Créer un canvas HTML pour le masque
  maskCanvas = document.createElement('canvas');
  maskCanvas.width = windowWidth;
  maskCanvas.height = windowHeight;
  maskCtx = maskCanvas.getContext('2d', { willReadFrequently: true });
  
  // Récupérer les éléments DOM
  revealedDiv = document.getElementById('revealed');
  statusDiv = document.getElementById('status');
  debugDiv = document.getElementById('debug');
  successDiv = document.getElementById('success');
  motInput = document.getElementById('mot-input');
  btnProposer = document.getElementById('btn-proposer');
  
  socket = io();
  

  // Gestion de la proposition de mots
  btnProposer.addEventListener('click', proposerMot);
  motInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      proposerMot();
    }
  });
  
  // Initialiser la caméra
  video = createCapture(VIDEO, videoReady);
  video.size(640, 480);
  video.hide();
  
  statusDiv.innerHTML = 'Initialisation de la caméra...';

  // Quand on reçoit un mot du sender
  socket.on('messageFromServer', (msg) => {
    console.log('Message reçu :', msg);
    
    // Nouveau mot à deviner
    if (msg.mot) {
      motActuel = msg.mot;
      
      
      //Images A et B côte à côte sur la div masquée par le corps
      let imgA = '../motifs/' + msg.mot + '-a.png';
      let imgB = '../motifs/' + msg.mot + '-b.png';
      document.body.style.backgroundImage = "url('" + imgA + "'), url('" + imgB + "')";
      document.body.style.backgroundPosition = 'left center, right center';
      document.body.style.backgroundSize = '50% 100%, 50% 100%';
      document.body.style.backgroundRepeat = 'no-repeat, no-repeat';
      document.body.style.backgroundColor = 'transparent';
      
      statusDiv.innerHTML = 'Mot: ' + msg.mot + ' | Chargement image...';
      console.log('Images configurées - Masqué:', msg.mot);
      
      // Cacher le message de succès
      successDiv.classList.remove('show');
    }
    
    // Signal de victoire reçu depuis la page micro
    if (msg.victoire) {
      console.log(' VICTOIRE reçue pour:', msg.victoire);
      showSuccess(msg.victoire);
    }
  });
}

// Callback quand la vidéo est prête

function videoReady() {
  statusDiv.innerHTML = 'Chargement du modèle BodyPix...';
  
  let options = {
    maskType: 'person',
    flipped: true
  };
  bodyPix = ml5.bodySegmentation('BodyPix', options, modelLoaded);
}

// Callback quand le modèle est chargé
function modelLoaded() {
  statusDiv.innerHTML = "Trouve une paire";
  bodyPix.detectStart(video, gotResults);
}

// Callback avec les résultats de segmentation
function gotResults(result) {
  segmentation = result;
}

// Convertir le masque p5 en data URL pour CSS mask-image
function maskToDataURL(maskImg) {
  // Effacer le canvas
  maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
  
  // Flip horizontal (miroir)
  maskCtx.save();
  maskCtx.translate(maskCanvas.width, 0);
  maskCtx.scale(-1, 1);
  
  // Dessiner l'image p5 sur le canvas HTML
  if (maskImg.canvas) {
    maskCtx.drawImage(maskImg.canvas, 0, 0, maskCanvas.width, maskCanvas.height);
  } else if (maskImg.elt) {
    maskCtx.drawImage(maskImg.elt, 0, 0, maskCanvas.width, maskCanvas.height);
  } else {
    maskCtx.drawImage(maskImg, 0, 0, maskCanvas.width, maskCanvas.height);
  }
  
  maskCtx.restore();
  
  return maskCanvas.toDataURL();
}

// Boucle de dessin principale
function draw() {
  if (!segmentation || !segmentation.mask) {
    if (debugMode && frameCount % 60 === 0) {
      console.log('utilisateur a pas trouver de paire');
    }
    return;
  }

  function draw() {
  clear()
  
  background(0, 0, 255); //bleu
  
  if (segmentation) {

    // negative
    const neg = segmentation.mask.filter(INVERT);
    foreground_image.mask(neg);
    // Display the image.
    image(foreground_image, 0, 0);
    foreground_image = loadImage(foreground_url);
    
    // Apply the mask to A.
    background_image_a.mask(segmentation.mask);    
    // Display the image A.
    image(background_image_a, 0, 0, windowWidth / 2, windowHeight);
    background_image_a = loadImage(background_url_a);
    
    // Apply the mask to A.
    background_image_a.mask(segmentation.mask);    
    // Display the image A.
    image(background_image_a, windowWidth / 2, 0, windowWidth / 2, windowHeight);
    background_image_a = loadImage(background_url_a);
    
    
  }
  
}
  
  // Convertir le masque en image et l'appliquer comme CSS mask
  let maskDataURL = maskToDataURL(segmentation.mask);
  
  if (maskDataURL && revealedDiv) {
    revealedDiv.style.setProperty('--image', "url('" + maskDataURL+ "')");
  }
}








// Afficher le message de succès
function showSuccess(mot) {
  console.log(' BRAVO! Mot trouvé:', mot);
  successDiv.innerHTML = 'Bravo !<br>Tu as trouvé "' + mot + '" !';
  successDiv.classList.add('show');
  statusDiv.innerHTML = 'Mot trouvé: ' + mot;
}

// Proposer un mot
function proposerMot() {
  let proposition = motInput.value.trim().toLowerCase();
  
  if (!proposition) {
    statusDiv.innerHTML = 'Entre un mot !';
    return;
  }
  
  console.log('Proposition:', proposition);
  
  if (!motActuel) {
    statusDiv.innerHTML = 'Aucun mot à deviner pour le moment...';
    motInput.value = '';
    return;
  }
  
  // Vérifier si le mot est correct
  if (proposition === motActuel.toLowerCase() || proposition.includes(motActuel.toLowerCase())) {
    console.log('BONNE RÉPONSE !');
    showSuccess(motActuel);
    
    // Envoyer la victoire au serveur
    socket.emit('messageToServer', { victoire: motActuel });
    
    motInput.value = '';
  } else {
    console.log('perdu Mauvaise réponse');
    statusDiv.innerHTML = 'perdu "' + proposition + '" n\'est pas le bon mot. Réessaie !';
    motInput.value = '';
    
    // Animation de shake sur l'input
    motInput.style.animation = 'shake 0.3s';
    setTimeout(() => {
      motInput.style.animation = '';
    }, 300);
  }
}


  
