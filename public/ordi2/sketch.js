
let bodySegmentation;
let video;
let segmentation;
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


function setup() {
  createCanvas(windowWidth, windowHeight);

  video = createCapture(VIDEO);
  video.size(windowWidth, windowHeight);
  video.hide();

  bodySegmentation.detectStart(video, gotResults);
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

// callback
function gotResults(result) {
  segmentation = result;
}