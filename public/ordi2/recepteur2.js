// VARIABLES GLOBALES
let socket;
let motActuel = null;
let video;
let bodyPix;
let segmentation;
let debugMode = true;

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

// CONFIGURATION INITIALE
function setup() {
  // Créer un petit canvas (invisible, juste pour p5.js)
  createCanvas(1, 1);
  pixelDensity(1);
  
  // Créer un canvas HTML pour le masque
  maskCanvas = document.createElement('canvas');
  maskCanvas.width = 640;
  maskCanvas.height = 480;
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
      
      // Chercher une image sur Wikimedia Commons
      fetchWikimediaImage(msg.mot).then(imageUrl => {
        document.body.style.backgroundImage = "url('" + imageUrl + "')";
        document.body.style.backgroundPosition = 'center';
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundRepeat = 'no-repeat';
        console.log('✓ Image Wikimedia chargée:', imageUrl);
      }).catch(err => {
        // Fallback sur test.jpg si pas d'image trouvée
        console.log('⚠️ Pas d\'image Wikimedia, fallback sur test.jpg');
        document.body.style.backgroundImage = "url('test.jpg')";
        document.body.style.backgroundPosition = 'center';
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundRepeat = 'no-repeat';
      });
      
      // Images A et B côte à côte sur la div masquée par le corps
      let imgA = '../motifs/' + msg.mot + '-a.png';
      let imgB = '../motifs/' + msg.mot + '-b.png';
      revealedDiv.style.backgroundImage = "url('" + imgA + "'), url('" + imgB + "')";
      revealedDiv.style.backgroundPosition = 'left center, right center';
      revealedDiv.style.backgroundSize = '50% 100%, 50% 100%';
      revealedDiv.style.backgroundRepeat = 'no-repeat, no-repeat';
      revealedDiv.style.backgroundColor = 'transparent';
      
      statusDiv.innerHTML = 'Mot: ' + msg.mot + ' | Chargement image...';
      console.log('✓ Images configurées - Masqué:', msg.mot);
      
      // Cacher le message de succès
      successDiv.classList.remove('show');
    }
    
    // Signal de victoire reçu depuis la page micro
    if (msg.victoire) {
      console.log('🎉 VICTOIRE reçue pour:', msg.victoire);
      showSuccess(msg.victoire);
    }
  });
}

// Callback quand la vidéo est prête
function videoReady() {
  console.log('✓ Caméra prête');
  statusDiv.innerHTML = 'Chargement du modèle BodyPix...';
  
  let options = {
    maskType: 'person',
    flipped: true
  };
  bodyPix = ml5.bodySegmentation('BodyPix', options, modelLoaded);
}

// Callback quand le modèle est chargé
function modelLoaded() {
  console.log('✓ BodyPix chargé !');
  statusDiv.innerHTML = "Prêt ! En attente d'un mot...";
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
      console.log('Pas de masque encore...');
    }
    return;
  }
  
  // Convertir le masque en image et l'appliquer comme CSS mask
  let maskDataURL = maskToDataURL(segmentation.mask);
  
  if (maskDataURL && revealedDiv) {
    revealedDiv.style.webkitMaskImage = "url('" + maskDataURL + "')";
    revealedDiv.style.maskImage = "url('" + maskDataURL + "')";
    revealedDiv.style.webkitMaskSize = 'cover';
    revealedDiv.style.maskSize = 'cover';
    revealedDiv.style.webkitMaskPosition = 'center';
    revealedDiv.style.maskPosition = 'center';
    
    if (debugMode) {
      debugDiv.style.display = 'block';
      debugDiv.innerHTML = 'FPS: ' + floor(frameRate()) + '<br>Masque actif';
    }
  }
}

// Redimensionner
function windowResized() {
  // Le canvas est invisible, pas besoin de le redimensionner
}

// Touche 'D' pour debug
function keyPressed() {
  if (key === 'd' || key === 'D') {
    debugMode = !debugMode;
    debugDiv.style.display = debugMode ? 'block' : 'none';
    console.log('Debug mode:', debugMode);
  }
}

// Afficher le message de succès
function showSuccess(mot) {
  console.log('🎉 BRAVO! Mot trouvé:', mot);
  successDiv.innerHTML = '🎉 Bravo !<br>Tu as trouvé "' + mot + '" !';
  successDiv.classList.add('show');
  statusDiv.innerHTML = '✓ Mot trouvé: ' + mot;
}

// Proposer un mot
function proposerMot() {
  let proposition = motInput.value.trim().toLowerCase();
  
  if (!proposition) {
    statusDiv.innerHTML = '⚠️ Entre un mot !';
    return;
  }
  
  console.log('🗣️ Proposition:', proposition);
  
  if (!motActuel) {
    statusDiv.innerHTML = '⚠️ Aucun mot à deviner pour le moment...';
    motInput.value = '';
    return;
  }
  
  // Vérifier si le mot est correct
  if (proposition === motActuel.toLowerCase() || proposition.includes(motActuel.toLowerCase())) {
    console.log('✅ BONNE RÉPONSE !');
    showSuccess(motActuel);
    
    // Envoyer la victoire au serveur
    socket.emit('messageToServer', { victoire: motActuel });
    
    motInput.value = '';
  } else {
    console.log('❌ Mauvaise réponse');
    statusDiv.innerHTML = '❌ "' + proposition + '" n\'est pas le bon mot. Réessaie !';
    motInput.value = '';
    
    // Animation de shake sur l'input
    motInput.style.animation = 'shake 0.3s';
    setTimeout(() => {
      motInput.style.animation = '';
    }, 300);
  }
}

// Chercher une image sur Wikimedia Commons
async function fetchWikimediaImage(searchTerm) {
  // Recherche d'images sur Wikimedia Commons
 const searchUrl = 'https://commons.wikimedia.org/w/api.php?' + 
    'action=query&list=search&srnamespace=6&srlimit=5&iiurlwidth=1920&format=json&origin=*&srsearch=' + 
    encodeURIComponent(searchTerm); 

  
  console.log('🔍 Recherche Wikimedia pour:', searchTerm);
  
  const searchResponse = await fetch(searchUrl);
  const searchData = await searchResponse.json();
  
  if (!searchData.query || !searchData.query.search || searchData.query.search.length === 0) {
    throw new Error('Aucune image trouvée');
  }
  
  // Prendre le premier résultat
  const fileName = searchData.query.search[0].title;
  console.log('📄 Fichier trouvé:', fileName);
  
  // Obtenir l'URL de l'image
  const imageInfoUrl = 'https://commons.wikimedia.org/w/api.php?' +
    'action=query&titles=' + encodeURIComponent(fileName) + 
    '&prop=imageinfo&iiprop=url&iiurlwidth=1920&format=json&origin=*';
  
  const imageResponse = await fetch(imageInfoUrl);
  const imageData = await imageResponse.json();
  
  const pages = imageData.query.pages;
  const pageId = Object.keys(pages)[0];
  
  if (!pages[pageId].imageinfo || !pages[pageId].imageinfo[0]) {
    throw new Error('Pas d\'info image');
  }
  
  // Utiliser thumburl (redimensionnée) ou url (originale)
  const imageUrl = pages[pageId].imageinfo[0].thumburl || pages[pageId].imageinfo[0].url;
  console.log('🖼️ URL image:', imageUrl);
  
  return imageUrl;
}
