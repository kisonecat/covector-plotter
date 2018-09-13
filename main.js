import panzoom from 'pan-zoom';
import {mat3, vec2} from 'gl-matrix';
import vertexShaderGLSL from './vertex.glsl';
import fragmentShaderGLSL from './fragment.glsl';
//import complexShaderGLSL from './reim.glsl';

import * as dat from 'dat.gui';
const gui = new dat.GUI();

var Parameters = function() {
    this.bounds = '1.0 - x*x - y*y + z';
    this.rootDarkening = 0.85;
    this.rootDarkeningSharpness = 1;
    this.poleLightening = 0.85;
    this.poleLighteningSharpness = 30;
    this.rectangularGridOpacity = 0.1;
    this.polarGridOpacity = 0.7;
    this.pixelRatio = window.devicePixelRatio;
};

					      
var parameters = new Parameters();

var colorFolder = gui.addFolder('Colors');

function update() {
    window.requestAnimationFrame(drawScene);
}

colorFolder.add(parameters, 'rootDarkening', 0, 1 ).onChange( update );
colorFolder.add(parameters, 'rootDarkeningSharpness', 1, 40 ).onChange( update );
colorFolder.add(parameters, 'poleLightening', 0, 1 ).onChange( update );
colorFolder.add(parameters, 'poleLighteningSharpness', 0, 40 ).onChange( update );
colorFolder.add(parameters, 'rectangularGridOpacity', 0, 1 ).onChange( update );
colorFolder.add(parameters, 'polarGridOpacity', 0, 1 ).onChange( update );

var gl;

function initGL(canvas) {
    try {
        gl = canvas.getContext("webgl2");

	var width = gl.canvas.clientWidth;
	var height = gl.canvas.clientHeight;
    } catch (e) {
    }
    if (!gl) {
        alert("Could not initialise WebGL, sorry :-(");
    }
}
 
var shaderProgram;
 
function initShaders() {
    console.log("initshaders");
    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentShaderGLSL);
    gl.compileShader(fragmentShader);
    
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(fragmentShader));
        return null;
    }

    var vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexShaderGLSL);
    gl.compileShader(vertexShader);

    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(vertexShader));
        return null;
    }

    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
 
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Could not initialise shaders");
    }

    gl.useProgram(shaderProgram);
 
    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
 
    //shaderProgram.vertexUVAttribute = gl.getAttribLocation(shaderProgram, "aVertexUV");
    //gl.enableVertexAttribArray(shaderProgram.vertexUVAttribute);
 
    //shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    shaderProgram.uPanzoomMatrix = gl.getUniformLocation(shaderProgram, "uPanzoomMatrix");
    //shaderProgram.ViewportSizeUniform = gl.getUniformLocation(shaderProgram, "uViewportSize");

    
    shaderProgram.rootDarkening = gl.getUniformLocation(shaderProgram, "rootDarkening");
    shaderProgram.rootDarkeningSharpness = gl.getUniformLocation(shaderProgram, "rootDarkeningSharpness");
    shaderProgram.poleLightening = gl.getUniformLocation(shaderProgram, "poleLightening");
    shaderProgram.poleLighteningSharpness = gl.getUniformLocation(shaderProgram, "poleLighteningSharpness");
    shaderProgram.rectangularGridOpacity = gl.getUniformLocation(shaderProgram, "rectangularGridOpacity");
    shaderProgram.polarGridOpacity = gl.getUniformLocation(shaderProgram, "polarGridOpacity");
    shaderProgram.pixelRatio = gl.getUniformLocation(shaderProgram, "pixelRatio");
}

var panzoomMatrix = mat3.create();
var viewportMatrix = mat3.create();

function setUniforms() {
    gl.uniformMatrix3fv(shaderProgram.uPanzoomMatrix, false, panzoomMatrix);

    gl.uniform1f(shaderProgram.rootDarkening, parameters.rootDarkening);
    gl.uniform1f(shaderProgram.rootDarkeningSharpness, parameters.rootDarkeningSharpness);
    gl.uniform1f(shaderProgram.poleLightening, parameters.poleLightening);
    gl.uniform1f(shaderProgram.poleLighteningSharpness, parameters.poleLighteningSharpness);
    gl.uniform1f(shaderProgram.rectangularGridOpacity, parameters.rectangularGridOpacity);
    gl.uniform1f(shaderProgram.polarGridOpacity, parameters.polarGridOpacity);
    gl.uniform1f(shaderProgram.pixelRatio, parameters.pixelRatio);
}
 
var squareVertexPositionBuffer;
 
function initBuffers() {
  //Create Square Position Buffer
    squareVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
    var vertices = [
         1.0,  1.0,  0.0,
        -1.0,  1.0,  0.0,
         1.0, -1.0,  0.0,
        -1.0, -1.0,  0.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    squareVertexPositionBuffer.itemSize = 3;
    squareVertexPositionBuffer.numItems = 4;
}
 
var viewportScale = 1.0;

function drawScene() {
    resize(gl.canvas);

    var height = gl.canvas.clientHeight * parameters.pixelRatio;
    var width = gl.canvas.clientWidth * parameters.pixelRatio;
    var aspectRatio = width / height;

    var m = width;
    if (m < height) m = height;

    gl.viewport((width - m)/2, (height - m)/2, m, m );

    viewportScale = m/2;

    height = gl.canvas.clientHeight;
    width = gl.canvas.clientWidth;

    m = width;
    if (m < height) m = height;
    
    mat3.identity(viewportMatrix);
    mat3.scale(viewportMatrix, viewportMatrix, [-2.0/m, 2.0/m]);
    mat3.translate(viewportMatrix, viewportMatrix, [-width/2, -height/2]);        

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
    gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, squareVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    setUniforms();
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, squareVertexPositionBuffer.numItems);
}

window.addEventListener("resize", function() {
    window.requestAnimationFrame(drawScene);
});

function resize(canvas) {
    // Lookup the size the browser is displaying the canvas.
    var displayWidth  = canvas.clientWidth * parameters.pixelRatio;
    var displayHeight = canvas.clientHeight * parameters.pixelRatio;
        
    // Check if the canvas is not the same size.
    if (canvas.width  != displayWidth ||
	canvas.height != displayHeight) {
	
	// Make the canvas the same size
	canvas.width  = displayWidth;
	canvas.height = displayHeight;
    }
}

function webGLStart() {
    const canvas = document.querySelector("#glCanvas");
    // Initialize the GL context
    const gl = canvas.getContext("webgl2");
    
    // Only continue if WebGL is available and working
    if (gl === null) {
	alert("Unable to initialize WebGL. Your browser or machine may not support it.");
	return;
    }

    initGL(canvas);
    initShaders();
    initBuffers();
 
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    window.requestAnimationFrame(drawScene);
}
 
webGLStart();

panzoom(document.body, e => {
    var center = vec2.clone( [e.x, e.y] );
    
    vec2.transformMat3( center, center, viewportMatrix );
    
    vec2.scale( center, center, -1 );
    mat3.translate( panzoomMatrix, panzoomMatrix, center );
    var scale = Math.exp(e.dz / 100.0);
    mat3.scale( panzoomMatrix, panzoomMatrix, [scale,scale] );
    vec2.scale( center, center, -1 );
    mat3.translate( panzoomMatrix, panzoomMatrix, center );    

    mat3.translate( panzoomMatrix, panzoomMatrix, [-e.dx/viewportScale, e.dy/viewportScale] );
    
    window.requestAnimationFrame(drawScene);

});
