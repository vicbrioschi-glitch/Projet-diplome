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

// CONFIGURATION INITIALE
function setup() {
  createCanvas(1, 1);
  pixelDensity(1);
  
  maskCanvas = document.createElement('canvas');
  maskCanvas.width = 640;
  maskCanvas.height = 480;
  maskCtx = maskCanvas.getContext('2d', { willReadFrequently: true });
  
  revealedDiv = document.getElementById('revealed');
  statusDiv = document.getElementById('status');
  debugDiv = document.getElementById('debug');
  successDiv = document.getElementById('success');
  motInput = document.getElementById('mot-input');
  btnProposer = document.getElementById('btn-proposer');
  
  socket = io();
  
  btnProposer.addEventListener('click', proposerMot);
  motInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') proposerMot();
  });
  
  video = createCapture(VIDEO, videoReady);
  video.size(640, 480);
  video.hide();
  

  socket.on('messageFromServer', (msg) => {
    console.log('Message reçu :', msg);
    
    if (msg.mot) {
      motActuel = msg.mot;
      statusDiv.innerHTML = '';
      
      let imgA = '../motifs/' + msg.mot + '-a.png';
      let imgB = '../motifs/' + msg.mot + '-b.png';

      // --- OVERLAY AU PREMIER PLAN ---
      let overlay = document.getElementById('images-overlay');
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'images-overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.zIndex = '9999';
        overlay.style.pointerEvents = 'none';
        document.body.appendChild(overlay);
      }
      overlay.style.backgroundImage = "url('" + imgA + "'), url('" + imgB + "')";
      overlay.style.backgroundPosition = 'left center, right center';
      overlay.style.backgroundSize = '50% 100%, 50% 100%';
      overlay.style.backgroundRepeat = 'no-repeat, no-repeat';
      

      // illustration background 
      document.body.style.backgroundImage = "url('../illu_background/" + msg.mot + "-c.png')";
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundPosition = 'center';
      document.body.style.backgroundRepeat = 'no-repeat';

      // Passer les éléments UI au-dessus de l'overlay
      [statusDiv, successDiv, motInput, btnProposer].forEach(el => {
        if (el) {
          el.style.position = 'relative';
          el.style.zIndex = '10000';
        }
      });
      // --- FIN OVERLAY ---
      
      
      console.log('Images configurées - Masqué:', msg.mot);
      successDiv.classList.remove('show');
    }
    
    if (msg.victoire) {
      console.log(' VICTOIRE reçue pour:', msg.victoire);
      showSuccess(msg.victoire);
    }
  });
}

function videoReady() {
  let options = { maskType: 'person', flipped: false };
  bodyPix = ml5.bodySegmentation('BodyPix', options, modelLoaded);
}

function modelLoaded() {
  statusDiv.innerHTML = "TROUVE UNE PAIRE";
  bodyPix.detectStart(video, gotResults);
}

function gotResults(result) {
  segmentation = result;
}

function maskToDataURL(maskImg) {
  maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
  maskCtx.save();
  maskCtx.translate(maskCanvas.width, 0);
  maskCtx.scale(-1, 1);
  
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

function draw() {
  if (!segmentation || !segmentation.mask) return;
  
  let maskDataURL = maskToDataURL(segmentation.mask);
  
  if (maskDataURL) {
    let overlay = document.getElementById('images-overlay');
    if (overlay) {
      overlay.style.webkitMaskImage = "url('" + maskDataURL + "')";
      overlay.style.maskImage = "url('" + maskDataURL + "')";
      overlay.style.webkitMaskSize = '100% 100%';
      overlay.style.maskSize = '100% 100%';
    }
  }
}

function showSuccess(mot) {
  console.log(' BRAVO! Mot trouvé:', mot);
  successDiv.innerHTML = 'Bravo !<br>Tu as trouvé "' + mot + '" !';
  successDiv.classList.add('show');
  statusDiv.innerHTML = 'Mot trouvé: ' + mot;
}

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
  
  if (proposition === motActuel.toLowerCase() || proposition.includes(motActuel.toLowerCase())) {
    console.log('BONNE RÉPONSE !');
    showSuccess(motActuel);
    socket.emit('messageToServer', { victoire: motActuel });
    motInput.value = '';
  } else {
    console.log('perdu mauvaise réponse');
    statusDiv.innerHTML = 'perdu "' + proposition + '" n\'est pas le bon mot. Réessaie !';
    motInput.value = '';
    motInput.style.animation = 'shake 0.3s';
    setTimeout(() => { motInput.style.animation = ''; }, 300);
  }
}