var canvas, gl, squareVerticesBuffer, mvMatrix, shaderProgram, vertexPositionAttribute, perspectiveMatrix, squareVerticesColorBuffer;

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

  gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesBuffer);
  gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesColorBuffer);
  gl.vertexAttribPointer(vertexColorAttribute, 4, gl.FLOAT, false, 0, 0);

  setMatrixUniforms();
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
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