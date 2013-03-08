/*
Nick Rodriguez
7 March 2013
adapted from: https://github.com/mrdoob/three.js/blob/master/examples/webgl_loader_obj_mtl.html
*/

// popup with instructions for user
window.onload = function instructionsPopup() {
  alert('Use the dropdown box to select a model to load.\n\nMouse controls:\nDrag and release the mouse in any direction to rotate the model in that direction. Use the scroll wheel to zoom in and out on the model. Enable "Free Look" to have the model rotate towards the cursor.\n\nTouch controls:\nFlick in any direction to rotate the model in that direction. With "Free Look" checked, touch and hold to have the model rotate towards the touch.');
}

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

var container, stats;

var camera, scene, renderer;
var object = new THREE.Mesh();

var startX = 0, startY = 0;
var dx = 0, dy = 0, dz = 0;
var mouseX = 0, mouseY = 0;

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
	var directionalLight = new THREE.DirectionalLight(0x4169e1, 0.4);
	directionalLight.position.set(-0.2, 0, -0.2).normalize();
	scene.add(directionalLight);

  // adds light yellow spotlight attached to camera
	var spotLight = new THREE.SpotLight(0xeee8aa, 0.8);
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
	container.appendChild(renderer.domElement);

  /* event listener for window */
  window.addEventListener("resize", onWindowResize, false);
  
	/* event listeners for mouse */
	container.addEventListener("mousedown", onDocumentMouseDown, false);
	container.addEventListener("mouseup", onDocumentMouseUp, false);
	container.addEventListener("mousemove", onDocumentMouseMove, false);
	container.addEventListener("mousewheel", mouseWheelHandler, false);
	container.addEventListener("DOMMouseScroll", mouseWheelHandler, false);

	/* event listeners for touch devices */
	container.addEventListener("touchstart", touchHandler, true);
  container.addEventListener("touchmove", touchHandler, true);
  container.addEventListener("touchend", touchHandler, true);
  container.addEventListener("touchcancel", touchHandler, true);
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

// store x and y value where mouse was pressed down
	function onDocumentMouseDown(event) {
	startX = event.clientX;
	startY = event.clientY;
}

// store change in x and y from from starting point to where mouse was released
function onDocumentMouseUp(event) {
	dx += (event.clientX - startX) / 2;
	dy += (event.clientY - startY) / 2;
}

// use mouse position to rotate camera
function onDocumentMouseMove(event) {
	mouseX = (event.clientX - windowHalfX) * 1;
	mouseY = (event.clientY - windowHalfY) * 1;
}		

function onWindowResize() {
	windowHalfX = window.innerWidth / 2;
	windowHalfY = window.innerHeight / 2;

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize(window.innerWidth, window.innerHeight);
}

function mouseWheelHandler(event) {
	var event = window.event || event; // old IE support
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
    targetX = dx * .01;
    targetY = dy * .01;

    object.rotation.x += 0.05 * (targetY - object.rotation.x);
    object.rotation.y += 0.05 * (targetX - object.rotation.y);
  }

	// calculate new z position from mouse wheel method
	camera.position.z += -dz * 10;

	// reset dz to prevent continuous zooming
	dz = 0;

	camera.lookAt(scene.position);
	renderer.render(scene, camera);
}