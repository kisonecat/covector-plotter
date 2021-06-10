#version 300 es
// #extension GL_OES_standard_derivatives : enable

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

vec2 cmul (vec2 a, vec2 b) {
  return vec2(a.x*b.x,0.0);  
}

vec2 cdiv (vec2 a, vec2 b) {
  return vec2(a.x/b.x,0.0);
}

vec2 cinv (vec2 z) {
  return vec2(1.0/z.x,0.0);
}

vec2 cexp (vec2 z) {
  return vec2(exp(z.x),0.0);
}

vec2 clog (vec2 z) {
  return vec2(log(z.x),0.0);  
}

vec2 cpolar (vec2 z) {
  return vec2(0.0,0.0);
}

vec2 cpower (vec2 z, vec2 x) {
  return vec2(pow(z.x,x.x),0.0);  
}

vec2 csqrt (vec2 z) {
  return vec2(sqrt(z.x),0.0);    
}

vec2 csqr (vec2 z) {
  return vec2(z.x*z.x,0.0);      
}

vec2 ccos (vec2 z) {
  return vec2(cos(z.x),0.0);      
}

vec2 csin (vec2 z) {
  return vec2(sin(z.x),0.0);        
}

vec2 ctan (vec2 z) {
  return vec2(tan(z.x),0.0);        
}

vec2 cacos (vec2 z) {
  return vec2(acos(z.x),0.0);        
}

vec2 casin (vec2 z) {
  return vec2(asin(z.x),0.0);        
}

vec2 catan (vec2 z) {
  return vec2(atan(z.x),0.0);        
}

vec2 ccosh (vec2 z) {
  return vec2(cosh(z.x),0.0);        
}

vec2 csinh (vec2 z) {
  return vec2(sinh(z.x),0.0);        
}

vec2 ctanh (vec2 z) {
  return vec2(tanh(z.x),0.0);        
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
float wireframe (float parameter, float width, float feather, float d) {
  float w1 = width - feather * 0.5;
  //float d = fwidth(parameter);
  float looped = 0.5 - abs(mod(parameter, 1.0) - 0.5);
  return smoothstep(d * w1, d * (w1 + feather), looped);
}

uniform float rootDarkening, poleLightening;
uniform float rootDarkeningSharpness, poleLighteningSharpness;
uniform float rectangularGridOpacity, polarGridOpacity;
uniform float axisOpacity;
uniform float pixelRatio;
uniform float boxSize;
uniform float lineSpacing;

float theFunctionF(float x, float y) {
  return THEFUNCTIONGOESHERE_F;
}

float theFunctionG(float x, float y) {
  return THEFUNCTIONGOESHERE_G;
}

out vec4 color;

void main () {

  vec2 p = fract(point / boxSize);

  vec2 center = (round(point / boxSize - vec2(0.5,0.5)) + vec2(0.5,0.5)) * boxSize;
  vec2 v = point - center;

  // you may be angry I'm not using fwidth later, and clearly
  // computing derivatives by hand below; this is because of the use
  // of 'round' above, which would introduce artifacts if I
  // differentiate it.
  
  float dpointx = fwidth(point.x);
  float dpointy = fwidth(point.y);
  
  vec2 vx = point - center + vec2(dpointx,0.0);
  vec2 vy = point - center + vec2(0.0,dpointy);

  float f = theFunctionF(center.x, center.y);
  float g = theFunctionG(center.x, center.y);
  
  vec2 form = vec2(f,g);
  float result = dot(v, form);
  float side = sign(result);

  float resultx = dot(vx, form);
  float resulty = dot(vy, form);

  result = (result / lineSpacing);
  resultx = (resultx / lineSpacing);
  resulty = (resulty / lineSpacing);  
  
  float result_dx = (resultx - result);
  float result_dy = (resulty - result);

  result = fract(result);
  float abs_dxdy = abs(result_dx) + abs(result_dy);
  
  result = wireframe(result, pixelRatio*0.5, 1.0, abs_dxdy );

  vec4 red = vec4(1.0,0.0,0.0,1.0);
  vec4 blue = vec4(0.0,0.0,1.0,1.0);

  vec4 lineColor = mix( red, blue, (side + 1.0) / 2.0 );
  vec4 background = vec4(1.0,1.0,1.0,1.0);
  color = mix(lineColor, background, result );
}
