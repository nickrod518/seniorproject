function start() {
  var canvas = document.getElementById("canvas");
  
  initWebGL(canvas); // initialize GL context
  
  // only continue if WebGL available and working
  if (gl) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0); // set clear color to fully opaque black
    gl.enable(gl.DEPTH_TEST); // enable depth testing    
    gl.depthFunc(gl.LEQUAL); // near things obscure far things    
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT); // clear the color and depth buffer.
  }
}

function initWebGL(canvas) {
  gl = null;
  
  try {
    gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
  } catch (e) {}
  
  if (!gl) {
    alert("Unable to initialize WebGL. Your browser may not support it.");
  }
}