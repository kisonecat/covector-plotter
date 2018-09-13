// rollup.config.js
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import glsl from 'rollup-plugin-glsl';

export default {
  input: 'main.js',
  output: {
      file: 'bundle.js',
      format: 'iife',
      name: 'PhasePlotter'
  },  
  plugins: [
      resolve({browser:true, preferBuiltins:false}),
      commonjs(),
      glsl({
	  include: '*.glsl',
      })
  ]
};
