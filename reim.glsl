/*
Copyright 2012 Mate J Kovacs

This file (reim.glsl) is part of Reim.  Reim is free software: you can
redistribute it and/or modify it under the terms of the GNU General
Public License as published by the Free Software Foundation, either
version 3 of the License, or (at your option) any later version.

Reim is distributed in the hope that it will be useful, but WITHOUT
ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License
for more details.  You should have received a copy of the GNU General
Public License along with Reim. If not, see
<http://www.gnu.org/licenses/>.
*/

/* CONSTRUCTORS */

precision mediump float;

vec2 ccis(float r);
vec2 ccish(float r);

/* PROPERTIES */

float carg(vec2 c);
float cabs(vec2 c);
float cre(vec2 c);
float cim(vec2 c);

/* OPERATIONS */

vec2 cconj(vec2 c);
vec2 cneg(vec2 c);
vec2 cinv(vec2 c);
vec2 cexp(vec2 c);
vec2 clog(vec2 c); // principal value
vec2 csin(vec2 c);
vec2 ccos(vec2 c);

vec2 cadd(vec2 a, vec2 b);
vec2 csub(vec2 a, vec2 b);
vec2 cmul(vec2 a, vec2 b);
vec2 cdiv(vec2 a, vec2 b);

vec2 cpower(vec2 a, vec2 b);

/* IMPLEMENTATION */

vec2 ccis(float r)
{
  return vec2( cos(r), sin(r) );
}

vec2 ccish(float r)
{
  vec2 e = vec2( exp(r), exp(-r) );
  return vec2(e.x + e.y, e.x - e.y);
}

float carg(vec2 c)
{
  return atan(c.y, c.x);
}

float cabs(vec2 c)
{
  return length(c);
}

float cre(vec2 c)
{
  return c.x;
}

float cim(vec2 c)
{
  return c.y;
}

vec2 cconj(vec2 c)
{
  return vec2(c.x, -c.y);
}

vec2 cneg(vec2 c)
{
  return -c;
}

vec2 cinv(vec2 c)
{
  return cconj(c) / dot(c, c);
}

vec2 cexp(vec2 c)
{
  return exp(c.x) * ccis(c.y);
}

vec2 clog(vec2 c)
{
  return vec2( log( cabs(c) ), carg(c) );
}

vec2 csin(vec2 c)
{
  // NOTE: component-wise multiplication
  return vec2( sin(c.x), cos(c.x) ) * ccish(c.y);
}

vec2 ccos(vec2 c)
{
  // NOTE: component-wise multiplication
  return vec2( cos(c.x), -sin(c.x) ) * ccish(c.y);
}

vec2 cadd(vec2 a, vec2 b)
{
  return a + b;
}

vec2 csub(vec2 a, vec2 b)
{
  return a - b;
}

vec2 cmul(vec2 a, vec2 b)
{
  return vec2(a.x*b.x - a.y*b.y, a.x*b.y + a.y*b.x);
}

vec2 cdiv(vec2 a, vec2 b)
{
  return cmul(a, cinv(b));
}

vec2 cpower(vec2 a, vec2 b)
{
  return cexp(cmul(b,clog(a)));
}
