var freeLook = document.getElementById("freeLook");

var container, stats;

var camera, scene, renderer;

var startX = 0, startY = 0;
var changeX = 0, changeY = 0;
var mouseX = 0, mouseY = 0, scrollZ = 0;

var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

init();
animate();

// load a new model
var loadButton = document.getElementById("load");
loadButton.onclick = function save() {
	// get the div with the canvas element
	var c = document.getElementById('canvas');
	// remove the div with the canvas element
	var remElement = (c.parentNode).removeChild(c);
	// redraw
  	init();
}

function init() {
	// create a new div container for the element
	container = document.createElement('div');
	// give the new div an id of "canvas"
	container.setAttribute("id", "canvas");

	document.body.appendChild(container);

	// PerspectiveCamera(fov, aspect, near, far)
	camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 2500);
	// distance of camera from model
	camera.position.z = 500;

	/* scene */
	scene = new THREE.Scene();

	var ambient = new THREE.AmbientLight(0x101030);
	scene.add(ambient);

	var directionalLight = new THREE.DirectionalLight( 0xffeedd );
	directionalLight.position.set(0, 0, 1).normalize();
	scene.add(directionalLight);

	/* model */
	// get model name from html element
	var model = document.getElementById("model").value;
	var loader = new THREE.OBJMTLLoader();
	loader.addEventListener('load', function (event) {
		var object = event.content;
		object.position.y = 0;
		scene.add(object);
	});
	// use html element's value as the filename and location of the model's files
	loader.load("models/" + model + '/' + model + '.obj', "models/" + model + '/' + model + '.mtl');

	renderer = new THREE.WebGLRenderer();
	renderer.setSize(window.innerWidth, window.innerHeight);
	container.appendChild(renderer.domElement);

	/* event listeners for mouse */
	// left mouse button press
	document.addEventListener('mousedown', onDocumentMouseDown, false);
	// left mouse button release
	document.addEventListener('mouseup', onDocumentMouseUp, false);
	// mouse movement
	document.addEventListener('mousemove', onDocumentMouseMove, false);
	window.addEventListener('resize', onWindowResize, false);
	// mouse wheel (IE9, Chrome, Safari, Opera)
	container.addEventListener('mousewheel', mouseWheelHandler, false);
	// mouse wheel (Firefox)
	container.addEventListener('DOMMouseScroll', mouseWheelHandler, false);

	/* event listeners for touch devices */
	// touch initiated
	document.addEventListener("touchstart", touchHandler, true);
	// touch moves
    document.addEventListener("touchmove", touchHandler, true);
    // touch ends
    document.addEventListener("touchend", touchHandler, true);
    // ?
    document.addEventListener("touchcancel", touchHandler, true);
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
	changeX += (event.clientX - startX) / 2;
	changeY += (event.clientY - startY) / 2;
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
	scrollZ = Math.max(-1, Math.min(1, (event.wheelDelta || -event.detail)));
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
	}

	// calculate new position when using click/drag method
	camera.position.x -= (changeX + camera.position.x) * .05;
	camera.position.y += (changeY - camera.position.y) * .05;

	// calculate new z position from mouse wheel method
	camera.position.z += -scrollZ * 10;

	// reset scrollZ to prevent continuous zooming
	scrollZ = 0;

	camera.lookAt(scene.position);

	renderer.render(scene, camera);
}