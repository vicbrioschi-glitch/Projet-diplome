/*
 * 👋 Hello! This is an ml5.js example made and shared with ❤️.
 * Learn more about the ml5.js project: https://ml5js.org/
 * ml5.js license and Code of Conduct: https://github.com/ml5js/ml5-next-gen/blob/main/LICENSE.md
 *
 * This example demonstrates segmenting the background from a person with ml5.bodySegmentation.
 */

let bodySegmentation;
let video;
let segmentation;

let options = {
  maskType: "person",
};

function preload() {
  bodySegmentation = ml5.bodySegmentation("SelfieSegmentation", options);
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  // Create the video
  video = createCapture(VIDEO);
  video.size(windowWidth, windowHeight);
  video.hide();

  bodySegmentation.detectStart(video, gotResults);
}

function draw() {
  background(255, 0, 0);

  if (segmentation) {
    video.mask(segmentation.mask);
    image(video, 0, 0);
  }
}

// callback function for body segmentation
function gotResults(result) {
  segmentation = result;
}