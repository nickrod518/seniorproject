// get value of "Free Look" checkbox
var freeLook = document.getElementById("freeLook");

// get value of model dropdown
var model = document.getElementById("model").value;

// on change, update model
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
var ambientLight, directionalLight, spotLight;

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
	// distance of camera from model
	camera.position.z = 500;

	/* scene and lighting */
	scene = new THREE.Scene();

  // adds very minor ambient light to scene
	ambientLight = new THREE.AmbientLight(0x101030);
	scene.add(ambientLight);

  // adds blue directional light to left rear of head
	directionalLight = new THREE.DirectionalLight(0x4169e1, 0.8);
	directionalLight.position.set(-.5, 0.2, -1).normalize();
	scene.add(directionalLight);

  // light yellow spotlight attached to camera
	spotLight = new THREE.SpotLight(0xeee8aa, 0.8);
	spotLight.position.set(1, 1, 800);
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
		var object = event.content;
		object.position.y = 0;
		scene.add(object);
	});
	// use html element"s value as the filename and location of the model"s files
	loader.load("models/" + model + "/" + model + ".obj", "models/" + model + "/" + model + ".mtl");

	renderer = new THREE.WebGLRenderer();
	renderer.setSize(window.innerWidth, window.innerHeight);
	container.appendChild(renderer.domElement);

	/* event listeners for mouse */
	// left mouse button press
	container.addEventListener("mousedown", onDocumentMouseDown, false);
	// left mouse button release
	container.addEventListener("mouseup", onDocumentMouseUp, false);
	// mouse movement
	container.addEventListener("mousemove", onDocumentMouseMove, false);
	window.addEventListener("resize", onWindowResize, false);
	// mouse wheel (IE9, Chrome, Safari, Opera)
	container.addEventListener("mousewheel", mouseWheelHandler, false);
	// mouse wheel (Firefox)
	container.addEventListener("DOMMouseScroll", mouseWheelHandler, false);

	/* event listeners for touch devices */
	// touch initiated
	container.addEventListener("touchstart", touchHandler, true);
	// touch moves
  container.addEventListener("touchmove", touchHandler, true);
  // touch ends
  container.addEventListener("touchend", touchHandler, true);
  // ?
  container.addEventListener("touchcancel", touchHandler, true);
}

// touch event handler - remaps touch events to mouse events
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
	mouseX = event.clientX - windowHalfX;
	mouseY = event.clientY - windowHalfY;
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

function animate() {
	requestAnimationFrame(animate);
	render();
}

function render() {
	// calculate new position when using free-mouse method
	if (freeLook.checked) {
		camera.position.x -= (mouseX + camera.position.x) * .05;
		camera.position.y -= (-mouseY + camera.position.y) * .05;

		spotLight.position.x -= (dx + spotLight.position.x) * .05;
		spotLight.position.y += (dy - spotLight.position.y) * .05;
	}

	// calculate new position when using click/drag method
	camera.position.x -= (dx + camera.position.x) * .05;
	camera.position.y += (dy - camera.position.y) * .05;

	spotLight.position.x -= (dx + spotLight.position.x) * .05;
	spotLight.position.y += (dy - spotLight.position.y) * .05;

	// calculate new z position from mouse wheel method
	camera.position.z += -dz * 10;
	spotLight.position.z += -dz * 10;

	// reset dz to prevent continuous zooming
	dz = 0;

	camera.lookAt(scene.position);

	renderer.render(scene, camera);
}