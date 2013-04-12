/*
Nick Rodriguez
7 April 2013

adapted from: https://github.com/mrdoob/three.js/blob/master/examples/webgl_loader_obj_mtl.html
contains methods to handle toolbar buttons, camera rotation/zoom, model rotation, file loading, rendering, and animation
*/

// popup with instructions for user
window.onload = instructionsPopup();

// get value of "Free Look" checkbox
var freeLook = document.getElementById("freeLook");

// get value of model dropdown
var model = document.getElementById("model").value;

// on change of dropdown, update model
document.getElementById("model").onchange = function() {
	// update model value
	model = document.getElementById("model").value;
	// get the div with the canvas element
	var c = document.getElementById("canvas");
	// remove the div with the canvas element
	var remElement = (c.parentNode).removeChild(c);
  // redraw
  init();
};

var webglCapable = 0;

var container, stats;

var camera, scene, renderer;
var spotLight = new THREE.SpotLight();
var object = new THREE.Mesh();

var prevX = 0, prevY = 0;
var dx = 0, dy = 0, dz = 0;
var mouseX = 0, mouseY = 0;
var mousedown = false;

var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

init();
animate();

function init() {
	// create a new div container for the element
	container = document.createElement("div");
	// give the new div an id of "canvas"
	container.setAttribute("id", "canvas");

	document.body.appendChild(container);

  /* camera */
	// PerspectiveCamera(fov, aspect, near, far)
	camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 2500);
	// camera starts at (0, 0, 0) so pull it back
	camera.position.z = 500;

	/* scene and lighting */
	scene = new THREE.Scene();

  // adds ambient light to scene
	var ambientLight = new THREE.AmbientLight(0x404040);
	scene.add(ambientLight);

  // adds blue directional light to left rear of head
	var directionalLight = new THREE.DirectionalLight(0x4169e1, 0.8);
	directionalLight.position.set(-0.2, 0, -0.2).normalize();
	scene.add(directionalLight);

  // adds light yellow spotlight attached to camera
	spotLight = new THREE.SpotLight(0xeee8aa, 0.8);
	spotLight.position.set(1, 100, 1000);
	spotLight.castShadow = true;
	spotLight.shadowMapWidth = 1024;
	spotLight.shadowMapHeight = 1024;
	spotLight.shadowCameraNear = 1;
	spotLight.shadowCameraFar = 2500;
	spotLight.shadowCameraFov = 45;
	scene.add(spotLight);

	/* model */
	var loader = new THREE.OBJMTLLoader();
	loader.addEventListener("load", function (event) {
		object = event.content;
		object.position.y = 0;
		scene.add(object);
	});
	// use html element's value as the filename and location of the model's files
	loader.load("models/" + model + "/" + model + ".obj", "models/" + model + "/" + model + ".mtl");

	renderer = new THREE.WebGLRenderer();
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.domElement.setAttribute("id", "scene");
	container.appendChild(renderer.domElement);

  /* event listener for window */
  window.addEventListener("resize", onWindowResize, false);
  
	/* event listeners for mouse */
	container.addEventListener("mousedown", mousedown=true, false);
	container.addEventListener("mouseup", mousedown=false, false);
	container.addEventListener("mousemove", onDocumentMouseMove, false);
	container.addEventListener("mousewheel", mouseWheelHandler, false);
	container.addEventListener("DOMMouseScroll", mouseWheelHandler, false);

	/* event listeners for touch devices */
	container.addEventListener("touchstart", touchHandler, true);
  container.addEventListener("touchmove", touchHandler, true);
  container.addEventListener("touchend", touchHandler, true);
  container.addEventListener("touchcancel", touchHandler, true);
}

// reset camera, spotlight, and model position on button press
function reset() {
  camera.position.x = 0;
  camera.position.y = 0;
  camera.position.z = 500;
  
  spotLight.intensity = 0.8;

  object.rotation.x = 0;
  object.rotation.y = 0;

  dx = 0;
  dy = 0;
  dz = 0;

  mouseX = 0;
  mouseY = 0;

  document.getElementById("brightness").value = 8;
  document.getElementById("color").value = "#eee8aa";
  updateLightColor("#eee8aa");
}

// update intensity of spotlight
function updateLightBrightness(brightness) {
  // because the slider uses ints, we use a scale of 0-100 and then normalize here
  spotLight.intensity = brightness*0.1;
}

// update the color of the spotlight
function updateLightColor(color) {
  // convert the color value into a usable hex value
  color = color.replace("#", "0x");
  spotLight.color.setHex(color);
}

// reset the camera and model when free look is checked/unchecked
freeLook.onchange = function () {
  reset();
};

// WebGL detection or instruction popup called on load or button press
function instructionsPopup() {
  // check if this is the first time we've checked webgl capabilities or if
  if (!webglCapable) {
    // check if webgl capable and if so, increment flag
    if (Detector.webgl) {
      alert('Use the dropdown box to select a model to load.\n\nMouse controls:\nDrag and release the mouse in any direction to rotate the model in that direction. Use the scroll wheel to zoom in and out on the model. Enable "Free Look" to have the model rotate towards the cursor.\n\nTouch controls:\nFlick in any direction to rotate the model in that direction. With "Free Look" checked, touch and hold to have the model rotate towards the touch.');
      webglCapable++;
    // web browser is not webgl capable
    } else {
      alert("Your web browser does not support WebGL.");
    }
  // web browser is webgl capable
  } else {
    alert('Use the dropdown box to select a model to load.\n\nMouse controls:\nDrag and release the mouse in any direction to rotate the model in that direction. Use the scroll wheel to zoom in and out on the model. Enable "Free Look" to have the model rotate towards the cursor.\n\nTouch controls:\nFlick in any direction to rotate the model in that direction. With "Free Look" checked, touch and hold to have the model rotate towards the touch.');
  }
}

// hide toolbar when button is pressed; show when pressed again
function toggleToolbar() {
  var toolbar = document.getElementById("toolbar");
  var text = document.getElementById("toolbarButton");
  if (toolbar.style.display == "block") {
    toolbar.style.display = "none";
    text.innerHTML = "Show Toolbar";
  }
  else {
    toolbar.style.display = "block";
    text.innerHTML = "Hide Toolbar";
  }
}

// touch event handler - remaps touch events to simulated mouse events
// taken from http://ross.posterous.com/2008/08/19/iphone-touch-events-in-javascript/
function touchHandler(event) {
  var touches = event.changedTouches,
    first = touches[0],
    type = "";
  switch(event.type) {
    case "touchstart": 	type="mousedown"; break;
    case "touchmove":  	type="mousemove"; break;        
    case "touchend":   	type="mouseup"; break;
    default: return;
  }

  var simulatedEvent = document.createEvent("MouseEvent");
    simulatedEvent.initMouseEvent(type, true, true, window, 1, 
    first.screenX, first.screenY, 
    first.clientX, first.clientY, false, 
    false, false, false, 0, null);
  first.target.dispatchEvent(simulatedEvent);
  event.preventDefault();
}

document.onmousedown = function () {
  mousedown = true;
  //throw ("mouse is down");
}

document.onmouseup = function () {
  mousedown = false;
  //throw ("mouse is up");
}

// use mouse position to rotate camera
function onDocumentMouseMove(event) {
  // calculate new mouse position
	mouseX = (event.clientX - windowHalfX);
	mouseY = (event.clientY - windowHalfY);

  // find difference of old mouse position - new mouse position
	if (mousedown) {
	  dx = prevX - mouseX;
	  dy = prevY - mouseY;
	}

  // set old mouse position to current mouse position
	prevX = mouseX;
	prevY = mouseY;
}		

function onWindowResize() {
	windowHalfX = window.innerWidth / 2;
	windowHalfY = window.innerHeight / 2;

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize(window.innerWidth, window.innerHeight);
}

function mouseWheelHandler(event) {
	dz = Math.max(-1, Math.min(1, (event.wheelDelta || -event.detail)));
	return false;
}

function zoomIn(event) {
  dz += 3;
}

function zoomOut(event) {
  dz -= 3;
}

function animate() {
	requestAnimationFrame(animate);
	render();
}



function render() {
	// calculate new position when using free mouse method
  if (freeLook.checked) {
    targetX = mouseX * .005;
    targetY = mouseY * .008;

    object.rotation.x += 0.05 * (targetY - object.rotation.x);
    object.rotation.y += 0.05 * (targetX - object.rotation.y);
  }

  // calculate new position when using click/drag method
  else {
    object.rotation.x -= 0.05 * dy;
    object.rotation.y -= 0.05 * dx;

    dx *= .9;
    dy *= .9;
  }

  // calculate new z position from mouse wheel method
  if (camera.position.z > 150 && dz > 0)
    camera.position.z += -dz * 25;
  else if (camera.position.z < 700 && dz < 0)
    camera.position.z += -dz * 25;

	// reset dz to prevent continuous zooming
	dz = 0;

	camera.lookAt(scene.position);
	renderer.render(scene, camera);
}