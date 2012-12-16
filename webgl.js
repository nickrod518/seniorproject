var canvas, gl;

var squareVerticesBuffer, squareVerticesColorBuffer;
var squareRotation = 0.0;
var squareXOffset = 0.0;
var squareYOffset = 0.0;
var squareZOffset = 0.0;
var lastSquareUpdateTime = 0;
var xIncValue = 0.2;
var yIncValue = -0.4;
var zIncValue = 0.3;

var mvMatrix, shaderProgram, vertexPositionAttribute, vertexColorAttribute, perspectiveMatrix;

function start() {
  var canvas = document.getElementById("glcanvas");
  
  // initialize GL context
  initWebGL(canvas);
  
  // only continue if WebGL available and working
  if (gl) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0); // set clear color to fully opaque black
    gl.clearDepth(1.0); // clear everything
    gl.enable(gl.DEPTH_TEST); // enable depth testing
    gl.depthFunc(gl.LEQUAL); // near things obscure far things

    initShaders();
    initBuffers();
    setInterval(drawScene, 15);
  }
}

function initWebGL(canvas) {
  gl = null;
  
  try {
    // grab standard context, if it fails, use experimental
    gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
  } 
  catch (e) {
  }
  
  if (!gl) {
    // if we don't have gl context, alert
    alert("Unable to initialize WebGL. Your browser may not support it.");
  }
}

function initBuffers() {
  squareVerticesBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesBuffer);

  var vertices = [
    1.0, 1.0, 0.0,
    -1.0, 1.0, 0.0,
    1.0, -1.0, 0.0,
    -1.0, -1.0, 0.0
  ];

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

  var colors = [
    1.0, 1.0, 1.0, 1.0, // white
    1.0, 0.0, 0.0, 1.0, // red
    0.0, 1.0, 0.0, 1.0, // green
    0.0, 0.0, 1.0, 1.0 // blue
  ];

  squareVerticesColorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesColorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
}

function drawScene() {
  // clear the canvas
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // establish perspective for view
  // FOV is 45 degrees.
  // height and width ratio is 640:480
  // display objects between 0.1 and 100 units from camera
  perspectiveMatrix = makePerspective(45, 640.0/480.0, 0.1, 100.0);

  // set drawing position to center of scene
  loadIdentity();

  // move drawing position to where we want to start
  mvTranslate([-0.0, 0.0, -6.0]);

  // save current matrix before rotating and drawing
  mvPushMatrix();
  mvRotate(squareRotation, [1, 0, 1]);
  mvTranslate([squareXOffset, squareYOffset, squareZOffset]);

  gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesBuffer);
  gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

  // set colors for vertices
  gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesColorBuffer);
  gl.vertexAttribPointer(vertexColorAttribute, 4, gl.FLOAT, false, 0, 0);

  // draw the square
  setMatrixUniforms();
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

  mvPopMatrix();

  var currentTime = (new Date).getTime();
  if (lastSquareUpdateTime) {
    var delta = currentTime - lastSquareUpdateTime;
    squareRotation += (30 * delta) / 1000.0;
    squareXOffset += xIncValue * ((30 * delta) / 1000.0);
    squareYOffset += yIncValue * ((30 * delta) / 1000.0);
    squareZOffset += zIncValue * ((30 * delta) / 1000.0);

    if (Math.abs(squareYOffset) > 2.5) {
      xIncValue = -xIncValue;
      yIncValue = -yIncValue;
      zIncValue = -zIncValue;
    }
  }

  lastSquareUpdateTime = currentTime;
}

function initShaders() {
  var fragmentShader = getShader(gl, "shader-fs");
  var vertexShader = getShader(gl, "shader-vs");

  // create shader program
  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  // if creating shader program failed, alert
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Unable to initialize the shader program.");
  }

  gl.useProgram(shaderProgram);

  vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
  gl.enableVertexAttribArray(vertexPositionAttribute);

  vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
  gl.enableVertexAttribArray(vertexColorAttribute);
}

function getShader(gl, id) {
  var shaderScript, theSource, currentChild, shader;

  shaderScript = document.getElementById(id);

  if (!shaderScript) {
    return null;
  }

  theSource = "";
  currentChild = shaderScript.firstChild;

  while (currentChild) {
    if (currentChild.nodeType == 3) {
      theSource += currentChild.textContent;
    }

    currentChild = currentChild.nextSibling;
  }

  if (shaderScript.type == "x-shader/x-fragment") {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else if (shaderScript.type == "x-shader/x-vertex") {
    shader = gl.createShader(gl.VERTEX_SHADER);
  } else {
    // unknown shader type
    return null;
  }

  gl.shaderSource(shader, theSource);

  // compile the shader program
  gl.compileShader(shader);

  // see if it compiled successfully
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert("An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader));
    return null;
  }

  return shader;
}


// matrix utility functions
function loadIdentity() {
  mvMatrix = Matrix.I(4);
}

function multMatrix(m) {
  mvMatrix = mvMatrix.x(m);
}

function mvTranslate(v) {
  multMatrix(Matrix.Translation($V([v[0], v[1], v[2]])).ensure4x4());
}

function setMatrixUniforms() {
  var pUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
  gl.uniformMatrix4fv(pUniform, false, new Float32Array(perspectiveMatrix.flatten()));

  var mvUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
  gl.uniformMatrix4fv(mvUniform, false, new Float32Array(mvMatrix.flatten()));
}

var mvMatrixStack = [];

function mvPushMatrix(m) {
  if (m) {
    mvMatrixStack.push(m.dup());
    mvMatrix = m.dup();
  } else {
    mvMatrixStack.push(mvMatrix.dup());
  }
}

function mvPopMatrix() {
  if (!mvMatrixStack.length) {
    throw("Can't pop from an empty matrix stack.");
  }

  mvMatrix = mvMatrixStack.pop();
  return mvMatrix;
}

function mvRotate(angle, v) {
  var inRadians = angle * Math.PI / 180.0;

  var m = Matrix.Rotation(inRadians, $V([v[0], v[1], v[2]])).ensure4x4();
  multMatrix(m);
}