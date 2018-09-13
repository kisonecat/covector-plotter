precision mediump float;
      varying vec2 vUV;
      vec2 p;
      
      void main(void) {

	  p.x = vUV.x;
	  p.y = vUV.y;
	  p = cmul(cmul(vec2(8,0.0),p),cpower(vec2(2.71828182845905,0.0),p));
		  
	  gl_FragColor = vec4(1, p.y*p.y, 0.0, 1.0);
	  if ((p.x < p.y))
	      gl_FragColor = vec4(0, p.y*p.y, 0.0, 1.0);	      
      }

