import panzoom from 'pan-zoom';
import {mat3, vec2} from 'gl-matrix';
import vertexShaderGLSL from './vertex.glsl';
import fragmentShaderGLSL from './fragment.glsl';
import complexShaderGLSL from './reim.glsl';

var gl;

function initGL(canvas) {
    try {
        gl = canvas.getContext("webgl");

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
    gl.shaderSource(fragmentShader, complexShaderGLSL + fragmentShaderGLSL);
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

}

var panzoomMatrix = mat3.create();
var viewportMatrix = mat3.create();

function setUniforms() {
    window.gl = gl;
    //gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
    //panzoomMatrix = [[1,0,0],[0,1,0],[0,0,1]];
    gl.uniformMatrix3fv(shaderProgram.uPanzoomMatrix, false, panzoomMatrix);
    /*
gl.uniform2f(
                shaderProgram.ViewportSizeUniform, 
                gl.viewportWidth, 
                gl.viewportHeight
                );
    */
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

    var height = gl.canvas.clientHeight;
    var width = gl.canvas.clientWidth;
    var aspectRatio = width / height;

    var m = width;
    if (m < height) m = height;

    gl.viewport((width - m)/2, (height - m)/2, m, m );

    viewportScale = m/2;
    
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
    var displayWidth  = canvas.clientWidth;
    var displayHeight = canvas.clientHeight;
    
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
    const gl = canvas.getContext("webgl");
    
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
