# Covector plotter

Use WebGL to explore covectors.

## See it in action

Go to [the website](https://kisonecat.github.io/covector-plotter/).

You can share your favorite expressions by appending `#f=y&g=-x` or the like.  For instance,

* [y dx - x dy](https://kisonecat.github.io/phase-plot/#f=y&g=-x)

Note that the variables `u` and `v` represents the mouse position `(u,v)`.

## Credits and acknowledgments

Steve Gubkin had the insight of plotting 1-forms this way.

This code uses some of the GLSL code from
[@rreusser](https://beta.observablehq.com/@rreusser/domain-coloring-for-complex-functions),
and relies on npm packages like
[pan-zoom](https://www.npmjs.com/package/pan-zoom) and
[dat.gui](https://github.com/dataarts/dat.gui).  Mathematical
expressions are parsed and converted into GLSL using
[math-expressions](https://github.com/kisonecat/math-expressions).  In
spirit, this is a WebGL version of [the old
plotter](https://people.math.osu.edu/fowler.291/phase/) which owes
much of its existence to Steve Gubkin.



