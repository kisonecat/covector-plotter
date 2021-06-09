#version 300 es

//precision mediump float;
precision highp float;

in vec2 point;

uniform float a;
uniform float b;
uniform float c;
uniform float d;
uniform float e;
uniform float f;
uniform float g;
uniform float h;
uniform float j;
uniform float k;
uniform float l;
uniform float m;
uniform float n;
uniform float o;
uniform float p;
uniform float q;
uniform float r;
uniform float s;
uniform float t;
uniform float u;
uniform float v;
uniform float w;
uniform float z;

//    #extension GL_OES_standard_derivatives : enable

#define PI 3.141592653589793238
#define HALF_PI 1.57079632679
#define HALF_PI_INV 0.15915494309
#define LOG_2 0.69314718056
#define C_ONE 1.0
#define C_I 0.0
#define TO_RADIANS 0.01745329251


vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

float cmul (float a, float b) {
  return a*b;
}

float cdiv (float a, float b) {
  return a/b;
}

float cinv (float z) {
  return 1.0/z;
}

float cexp (float z) {
  return exp(z);
}

float clog (float z) {
  return log(z);
}

float cpolar (float z) {
  return 0.0;
}

float cpower (float z, float x) {
  return pow(z,x);
}

float csqrt (float z) {
  return sqrt(z);
}

float csqr (float z) {
  return z*z;
}

float ccos (float z) {
  return cos(z);
}

float csin (float z) {
  return sin(z);
}

float ctan (float z) {
  return tan(z);
}

float cacos (float z) {
  return acos(z);
}

float casin (float z) {
  return asin(z);
}

float catan (float z) {
  return atan(z);
}

float ccosh (float z) {
  return cosh(z);  
}

float csinh (float z) {
  return sinh(z);    
}

float ctanh (float z) {
  return tanh(z);  
}

// https://github.com/d3/d3-color
vec3 cubehelix(vec3 c) {
  float a = c.y * c.z * (1.0 - c.z);
  float cosh = cos(c.x + PI / 2.0);
  float sinh = sin(c.x + PI / 2.0);
  return vec3(
      (c.z + a * (1.78277 * sinh - 0.14861 * cosh)),
      (c.z - a * (0.29227 * cosh + 0.90649 * sinh)),
      (c.z + a * (1.97294 * cosh))
              );
}

// https://github.com/d3/d3-scale-chromatic
vec3 cubehelixRainbow(float t) {
  float ts = 0.25 - 0.25 * cos((t - 0.5) * PI * 2.0);
  return cubehelix(vec3(
      (360.0 * t - 100.0) * TO_RADIANS,
      1.5 - 1.5 * ts,
      (0.8 - 0.9 * ts)
                        ));
}

// https://github.com/rreusser/glsl-solid-wireframe
float wireframe (float parameter, float width, float feather) {
  float w1 = width - feather * 0.5;
  float d = fwidth(parameter);
  float looped = 0.5 - abs(mod(parameter, 1.0) - 0.5);
  return smoothstep(d * w1, d * (w1 + feather), looped);
}

float wireframe (vec2 parameter, float width, float feather) {
  float w1 = width - feather * 0.5;
  vec2 d = fwidth(parameter);
  vec2 looped = 0.5 - abs(mod(parameter, 1.0) - 0.5);
  vec2 a2 = smoothstep(d * w1, d * (w1 + feather), looped);
  return min(a2.x, a2.y);
}

float wireframe (vec3 parameter, float width, float feather) {
  float w1 = width - feather * 0.5;
  vec3 d = fwidth(parameter);
  vec3 looped = 0.5 - abs(mod(parameter, 1.0) - 0.5);
  vec3 a3 = smoothstep(d * w1, d * (w1 + feather), looped);
  return min(min(a3.x, a3.y), a3.z);
}

float wireframe (vec4 parameter, float width, float feather) {
  float w1 = width - feather * 0.5;
  vec4 d = fwidth(parameter);
  vec4 looped = 0.5 - abs(mod(parameter, 1.0) - 0.5);
  vec4 a4 = smoothstep(d * w1, d * (w1 + feather), looped);
  return min(min(min(a4.x, a4.y), a4.z), a4.w);
}

float wireframe (float parameter, float width) {
  float d = fwidth(parameter);
  float looped = 0.5 - abs(mod(parameter, 1.0) - 0.5);
  return smoothstep(d * (width - 0.5), d * (width + 0.5), looped);
}

float wireframe (vec2 parameter, float width) {
  vec2 d = fwidth(parameter);
  vec2 looped = 0.5 - abs(mod(parameter, 1.0) - 0.5);
  vec2 a2 = smoothstep(d * (width - 0.5), d * (width + 0.5), looped);
  return min(a2.x, a2.y);
}

float wireframe (vec3 parameter, float width) {
  vec3 d = fwidth(parameter);
  vec3 looped = 0.5 - abs(mod(parameter, 1.0) - 0.5);
  vec3 a3 = smoothstep(d * (width - 0.5), d * (width + 0.5), looped);
  return min(min(a3.x, a3.y), a3.z);
}

float wireframe (vec4 parameter, float width) {
  vec4 d = fwidth(parameter);
  vec4 looped = 0.5 - abs(mod(parameter, 1.0) - 0.5);
  vec4 a4 = smoothstep(d * (width - 0.5), d * (width + 0.5), looped);
  return min(min(min(a4.x, a4.y), a4.z), a4.z);
}

uniform float rootDarkening, poleLightening;
uniform float rootDarkeningSharpness, poleLighteningSharpness;
uniform float rectangularGridOpacity, polarGridOpacity;
uniform float axisOpacity;
uniform float pixelRatio;
uniform float boxSize;

float theFunctionF(float x, float y) {
  return THEFUNCTIONGOESHERE_F;
}

float theFunctionG(float x, float y) {
  return THEFUNCTIONGOESHERE_G;
}

out vec4 color;

void main () {

  vec2 p = mod(point, boxSize) / boxSize;

  float f = theFunctionF(point.x, point.y);
  float g = theFunctionG(point.x, point.y);  
  
  color = vec4(p.x, p.y, 0, 1.0);
}
