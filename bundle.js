(function () {
	'use strict';

	var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

	function createCommonjsModule(fn, module) {
		return module = { exports: {} }, fn(module, module.exports), module.exports;
	}

	var impetus = createCommonjsModule(function (module, exports) {
	(function (global, factory) {
	    {
	        factory(exports, module);
	    }
	})(commonjsGlobal, function (exports, module) {

	    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

	    var stopThresholdDefault = 0.3;
	    var bounceDeceleration = 0.04;
	    var bounceAcceleration = 0.11;

	    // fixes weird safari 10 bug where preventDefault is prevented
	    // @see https://github.com/metafizzy/flickity/issues/457#issuecomment-254501356
	    window.addEventListener('touchmove', function () {});

	    var Impetus = function Impetus(_ref) {
	        var _ref$source = _ref.source;
	        var sourceEl = _ref$source === undefined ? document : _ref$source;
	        var updateCallback = _ref.update;
	        var _ref$multiplier = _ref.multiplier;
	        var multiplier = _ref$multiplier === undefined ? 1 : _ref$multiplier;
	        var _ref$friction = _ref.friction;
	        var friction = _ref$friction === undefined ? 0.92 : _ref$friction;
	        var initialValues = _ref.initialValues;
	        var boundX = _ref.boundX;
	        var boundY = _ref.boundY;
	        var _ref$bounce = _ref.bounce;
	        var bounce = _ref$bounce === undefined ? true : _ref$bounce;

	        _classCallCheck(this, Impetus);

	        var boundXmin, boundXmax, boundYmin, boundYmax, pointerLastX, pointerLastY, pointerCurrentX, pointerCurrentY, pointerId, decVelX, decVelY;
	        var targetX = 0;
	        var targetY = 0;
	        var stopThreshold = stopThresholdDefault * multiplier;
	        var ticking = false;
	        var pointerActive = false;
	        var paused = false;
	        var decelerating = false;
	        var trackingPoints = [];

	        /**
	         * Initialize instance
	         */
	        (function init() {
	            sourceEl = typeof sourceEl === 'string' ? document.querySelector(sourceEl) : sourceEl;
	            if (!sourceEl) {
	                throw new Error('IMPETUS: source not found.');
	            }

	            if (!updateCallback) {
	                throw new Error('IMPETUS: update function not defined.');
	            }

	            if (initialValues) {
	                if (initialValues[0]) {
	                    targetX = initialValues[0];
	                }
	                if (initialValues[1]) {
	                    targetY = initialValues[1];
	                }
	                callUpdateCallback();
	            }

	            // Initialize bound values
	            if (boundX) {
	                boundXmin = boundX[0];
	                boundXmax = boundX[1];
	            }
	            if (boundY) {
	                boundYmin = boundY[0];
	                boundYmax = boundY[1];
	            }

	            sourceEl.addEventListener('touchstart', onDown);
	            sourceEl.addEventListener('mousedown', onDown);
	        })();

	        /**
	         * In edge cases where you may need to
	         * reinstanciate Impetus on the same sourceEl
	         * this will remove the previous event listeners
	         */
	        this.destroy = function () {
	            sourceEl.removeEventListener('touchstart', onDown);
	            sourceEl.removeEventListener('mousedown', onDown);
	            // however it won't "destroy" a reference
	            // to instance if you'd like to do that
	            // it returns null as a convinience.
	            // ex: `instance = instance.destroy();`
	            return null;
	        };

	        /**
	         * Disable movement processing
	         * @public
	         */
	        this.pause = function () {
	            pointerActive = false;
	            paused = true;
	        };

	        /**
	         * Enable movement processing
	         * @public
	         */
	        this.resume = function () {
	            paused = false;
	        };

	        /**
	         * Update the current x and y values
	         * @public
	         * @param {Number} x
	         * @param {Number} y
	         */
	        this.setValues = function (x, y) {
	            if (typeof x === 'number') {
	                targetX = x;
	            }
	            if (typeof y === 'number') {
	                targetY = y;
	            }
	        };

	        /**
	         * Update the multiplier value
	         * @public
	         * @param {Number} val
	         */
	        this.setMultiplier = function (val) {
	            multiplier = val;
	            stopThreshold = stopThresholdDefault * multiplier;
	        };

	        /**
	         * Update boundX value
	         * @public
	         * @param {Number[]} boundX
	         */
	        this.setBoundX = function (boundX) {
	            boundXmin = boundX[0];
	            boundXmax = boundX[1];
	        };

	        /**
	         * Update boundY value
	         * @public
	         * @param {Number[]} boundY
	         */
	        this.setBoundY = function (boundY) {
	            boundYmin = boundY[0];
	            boundYmax = boundY[1];
	        };

	        /**
	         * Executes the update function
	         */
	        function callUpdateCallback() {
	            updateCallback.call(sourceEl, targetX, targetY);
	        }

	        /**
	         * Creates a custom normalized event object from touch and mouse events
	         * @param  {Event} ev
	         * @returns {Object} with x, y, and id properties
	         */
	        function normalizeEvent(ev) {
	            if (ev.type === 'touchmove' || ev.type === 'touchstart' || ev.type === 'touchend') {
	                var touch = ev.targetTouches[0] || ev.changedTouches[0];
	                return {
	                    x: touch.clientX,
	                    y: touch.clientY,
	                    id: touch.identifier
	                };
	            } else {
	                // mouse events
	                return {
	                    x: ev.clientX,
	                    y: ev.clientY,
	                    id: null
	                };
	            }
	        }

	        /**
	         * Initializes movement tracking
	         * @param  {Object} ev Normalized event
	         */
	        function onDown(ev) {
	            var event = normalizeEvent(ev);
	            if (!pointerActive && !paused) {
	                pointerActive = true;
	                decelerating = false;
	                pointerId = event.id;

	                pointerLastX = pointerCurrentX = event.x;
	                pointerLastY = pointerCurrentY = event.y;
	                trackingPoints = [];
	                addTrackingPoint(pointerLastX, pointerLastY);

	                // @see https://developers.google.com/web/updates/2017/01/scrolling-intervention
	                document.addEventListener('touchmove', onMove, getPassiveSupported() ? { passive: false } : false);
	                document.addEventListener('touchend', onUp);
	                document.addEventListener('touchcancel', stopTracking);
	                document.addEventListener('mousemove', onMove, getPassiveSupported() ? { passive: false } : false);
	                document.addEventListener('mouseup', onUp);
	            }
	        }

	        /**
	         * Handles move events
	         * @param  {Object} ev Normalized event
	         */
	        function onMove(ev) {
	            ev.preventDefault();
	            var event = normalizeEvent(ev);

	            if (pointerActive && event.id === pointerId) {
	                pointerCurrentX = event.x;
	                pointerCurrentY = event.y;
	                addTrackingPoint(pointerLastX, pointerLastY);
	                requestTick();
	            }
	        }

	        /**
	         * Handles up/end events
	         * @param {Object} ev Normalized event
	         */
	        function onUp(ev) {
	            var event = normalizeEvent(ev);

	            if (pointerActive && event.id === pointerId) {
	                stopTracking();
	            }
	        }

	        /**
	         * Stops movement tracking, starts animation
	         */
	        function stopTracking() {
	            pointerActive = false;
	            addTrackingPoint(pointerLastX, pointerLastY);
	            startDecelAnim();

	            document.removeEventListener('touchmove', onMove);
	            document.removeEventListener('touchend', onUp);
	            document.removeEventListener('touchcancel', stopTracking);
	            document.removeEventListener('mouseup', onUp);
	            document.removeEventListener('mousemove', onMove);
	        }

	        /**
	         * Records movement for the last 100ms
	         * @param {number} x
	         * @param {number} y [description]
	         */
	        function addTrackingPoint(x, y) {
	            var time = Date.now();
	            while (trackingPoints.length > 0) {
	                if (time - trackingPoints[0].time <= 100) {
	                    break;
	                }
	                trackingPoints.shift();
	            }

	            trackingPoints.push({ x: x, y: y, time: time });
	        }

	        /**
	         * Calculate new values, call update function
	         */
	        function updateAndRender() {
	            var pointerChangeX = pointerCurrentX - pointerLastX;
	            var pointerChangeY = pointerCurrentY - pointerLastY;

	            targetX += pointerChangeX * multiplier;
	            targetY += pointerChangeY * multiplier;

	            if (bounce) {
	                var diff = checkBounds();
	                if (diff.x !== 0) {
	                    targetX -= pointerChangeX * dragOutOfBoundsMultiplier(diff.x) * multiplier;
	                }
	                if (diff.y !== 0) {
	                    targetY -= pointerChangeY * dragOutOfBoundsMultiplier(diff.y) * multiplier;
	                }
	            } else {
	                checkBounds(true);
	            }

	            callUpdateCallback();

	            pointerLastX = pointerCurrentX;
	            pointerLastY = pointerCurrentY;
	            ticking = false;
	        }

	        /**
	         * Returns a value from around 0.5 to 1, based on distance
	         * @param {Number} val
	         */
	        function dragOutOfBoundsMultiplier(val) {
	            return 0.000005 * Math.pow(val, 2) + 0.0001 * val + 0.55;
	        }

	        /**
	         * prevents animating faster than current framerate
	         */
	        function requestTick() {
	            if (!ticking) {
	                requestAnimFrame(updateAndRender);
	            }
	            ticking = true;
	        }

	        /**
	         * Determine position relative to bounds
	         * @param {Boolean} restrict Whether to restrict target to bounds
	         */
	        function checkBounds(restrict) {
	            var xDiff = 0;
	            var yDiff = 0;

	            if (boundXmin !== undefined && targetX < boundXmin) {
	                xDiff = boundXmin - targetX;
	            } else if (boundXmax !== undefined && targetX > boundXmax) {
	                xDiff = boundXmax - targetX;
	            }

	            if (boundYmin !== undefined && targetY < boundYmin) {
	                yDiff = boundYmin - targetY;
	            } else if (boundYmax !== undefined && targetY > boundYmax) {
	                yDiff = boundYmax - targetY;
	            }

	            if (restrict) {
	                if (xDiff !== 0) {
	                    targetX = xDiff > 0 ? boundXmin : boundXmax;
	                }
	                if (yDiff !== 0) {
	                    targetY = yDiff > 0 ? boundYmin : boundYmax;
	                }
	            }

	            return {
	                x: xDiff,
	                y: yDiff,
	                inBounds: xDiff === 0 && yDiff === 0
	            };
	        }

	        /**
	         * Initialize animation of values coming to a stop
	         */
	        function startDecelAnim() {
	            var firstPoint = trackingPoints[0];
	            var lastPoint = trackingPoints[trackingPoints.length - 1];

	            var xOffset = lastPoint.x - firstPoint.x;
	            var yOffset = lastPoint.y - firstPoint.y;
	            var timeOffset = lastPoint.time - firstPoint.time;

	            var D = timeOffset / 15 / multiplier;

	            decVelX = xOffset / D || 0; // prevent NaN
	            decVelY = yOffset / D || 0;

	            var diff = checkBounds();

	            if (Math.abs(decVelX) > 1 || Math.abs(decVelY) > 1 || !diff.inBounds) {
	                decelerating = true;
	                requestAnimFrame(stepDecelAnim);
	            }
	        }

	        /**
	         * Animates values slowing down
	         */
	        function stepDecelAnim() {
	            if (!decelerating) {
	                return;
	            }

	            decVelX *= friction;
	            decVelY *= friction;

	            targetX += decVelX;
	            targetY += decVelY;

	            var diff = checkBounds();

	            if (Math.abs(decVelX) > stopThreshold || Math.abs(decVelY) > stopThreshold || !diff.inBounds) {

	                if (bounce) {
	                    var reboundAdjust = 2.5;

	                    if (diff.x !== 0) {
	                        if (diff.x * decVelX <= 0) {
	                            decVelX += diff.x * bounceDeceleration;
	                        } else {
	                            var adjust = diff.x > 0 ? reboundAdjust : -reboundAdjust;
	                            decVelX = (diff.x + adjust) * bounceAcceleration;
	                        }
	                    }
	                    if (diff.y !== 0) {
	                        if (diff.y * decVelY <= 0) {
	                            decVelY += diff.y * bounceDeceleration;
	                        } else {
	                            var adjust = diff.y > 0 ? reboundAdjust : -reboundAdjust;
	                            decVelY = (diff.y + adjust) * bounceAcceleration;
	                        }
	                    }
	                } else {
	                    if (diff.x !== 0) {
	                        if (diff.x > 0) {
	                            targetX = boundXmin;
	                        } else {
	                            targetX = boundXmax;
	                        }
	                        decVelX = 0;
	                    }
	                    if (diff.y !== 0) {
	                        if (diff.y > 0) {
	                            targetY = boundYmin;
	                        } else {
	                            targetY = boundYmax;
	                        }
	                        decVelY = 0;
	                    }
	                }

	                callUpdateCallback();

	                requestAnimFrame(stepDecelAnim);
	            } else {
	                decelerating = false;
	            }
	        }
	    }

	    /**
	     * @see http://www.paulirish.com/2011/requestanimationframe-for-smart-animating/
	     */
	    ;

	    module.exports = Impetus;
	    var requestAnimFrame = (function () {
	        return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || function (callback) {
	            window.setTimeout(callback, 1000 / 60);
	        };
	    })();

	    function getPassiveSupported() {
	        var passiveSupported = false;

	        try {
	            var options = Object.defineProperty({}, "passive", {
	                get: function get() {
	                    passiveSupported = true;
	                }
	            });

	            window.addEventListener("test", null, options);
	        } catch (err) {}

	        getPassiveSupported = function () {
	            return passiveSupported;
	        };
	        return passiveSupported;
	    }
	});
	});

	var parseUnit = function parseUnit(str, out) {
	    if (!out)
	        out = [ 0, '' ];

	    str = String(str);
	    var num = parseFloat(str, 10);
	    out[0] = num;
	    out[1] = str.match(/[\d.\-\+]*\s*(.*)/)[1] || '';
	    return out
	};

	var topx = toPX;

	var PIXELS_PER_INCH = 96;

	function getPropertyInPX(element, prop) {
	  var parts = parseUnit(getComputedStyle(element).getPropertyValue(prop));
	  return parts[0] * toPX(parts[1], element)
	}

	//This brutal hack is needed
	function getSizeBrutal(unit, element) {
	  var testDIV = document.createElement('div');
	  testDIV.style['font-size'] = '128' + unit;
	  element.appendChild(testDIV);
	  var size = getPropertyInPX(testDIV, 'font-size') / 128;
	  element.removeChild(testDIV);
	  return size
	}

	function toPX(str, element) {
	  element = element || document.body;
	  str = (str || 'px').trim().toLowerCase();
	  if(element === window || element === document) {
	    element = document.body; 
	  }
	  switch(str) {
	    case '%':  //Ambiguous, not sure if we should use width or height
	      return element.clientHeight / 100.0
	    case 'ch':
	    case 'ex':
	      return getSizeBrutal(str, element)
	    case 'em':
	      return getPropertyInPX(element, 'font-size')
	    case 'rem':
	      return getPropertyInPX(document.body, 'font-size')
	    case 'vw':
	      return window.innerWidth/100
	    case 'vh':
	      return window.innerHeight/100
	    case 'vmin':
	      return Math.min(window.innerWidth, window.innerHeight) / 100
	    case 'vmax':
	      return Math.max(window.innerWidth, window.innerHeight) / 100
	    case 'in':
	      return PIXELS_PER_INCH
	    case 'cm':
	      return PIXELS_PER_INCH / 2.54
	    case 'mm':
	      return PIXELS_PER_INCH / 25.4
	    case 'pt':
	      return PIXELS_PER_INCH / 72
	    case 'pc':
	      return PIXELS_PER_INCH / 6
	  }
	  return 1
	}

	var wheel = mouseWheelListen;

	function mouseWheelListen(element, callback, noScroll) {
	  if(typeof element === 'function') {
	    noScroll = !!callback;
	    callback = element;
	    element = window;
	  }
	  var lineHeight = topx('ex', element);
	  var listener = function(ev) {
	    if(noScroll) {
	      ev.preventDefault();
	    }
	    var dx = ev.deltaX || 0;
	    var dy = ev.deltaY || 0;
	    var dz = ev.deltaZ || 0;
	    var mode = ev.deltaMode;
	    var scale = 1;
	    switch(mode) {
	      case 1:
	        scale = lineHeight;
	      break
	      case 2:
	        scale = window.innerHeight;
	      break
	    }
	    dx *= scale;
	    dy *= scale;
	    dz *= scale;
	    if(dx || dy || dz) {
	      return callback(dx, dy, dz, ev)
	    }
	  };
	  element.addEventListener('wheel', listener);
	  return listener
	}

	var distance_1 = distance;

	/**
	 * Calculates the euclidian distance between two vec2's
	 *
	 * @param {vec2} a the first operand
	 * @param {vec2} b the second operand
	 * @returns {Number} distance between a and b
	 */
	function distance(a, b) {
	    var x = b[0] - a[0],
	        y = b[1] - a[1];
	    return Math.sqrt(x*x + y*y)
	}

	// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.

	function EventEmitter() {
	  this._events = this._events || {};
	  this._maxListeners = this._maxListeners || undefined;
	}
	var events = EventEmitter;

	// Backwards-compat with node 0.10.x
	EventEmitter.EventEmitter = EventEmitter;

	EventEmitter.prototype._events = undefined;
	EventEmitter.prototype._maxListeners = undefined;

	// By default EventEmitters will print a warning if more than 10 listeners are
	// added to it. This is a useful default which helps finding memory leaks.
	EventEmitter.defaultMaxListeners = 10;

	// Obviously not all Emitters should be limited to 10. This function allows
	// that to be increased. Set to zero for unlimited.
	EventEmitter.prototype.setMaxListeners = function(n) {
	  if (!isNumber(n) || n < 0 || isNaN(n))
	    throw TypeError('n must be a positive number');
	  this._maxListeners = n;
	  return this;
	};

	EventEmitter.prototype.emit = function(type) {
	  var er, handler, len, args, i, listeners;

	  if (!this._events)
	    this._events = {};

	  // If there is no 'error' event listener then throw.
	  if (type === 'error') {
	    if (!this._events.error ||
	        (isObject(this._events.error) && !this._events.error.length)) {
	      er = arguments[1];
	      if (er instanceof Error) {
	        throw er; // Unhandled 'error' event
	      } else {
	        // At least give some kind of context to the user
	        var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
	        err.context = er;
	        throw err;
	      }
	    }
	  }

	  handler = this._events[type];

	  if (isUndefined(handler))
	    return false;

	  if (isFunction(handler)) {
	    switch (arguments.length) {
	      // fast cases
	      case 1:
	        handler.call(this);
	        break;
	      case 2:
	        handler.call(this, arguments[1]);
	        break;
	      case 3:
	        handler.call(this, arguments[1], arguments[2]);
	        break;
	      // slower
	      default:
	        args = Array.prototype.slice.call(arguments, 1);
	        handler.apply(this, args);
	    }
	  } else if (isObject(handler)) {
	    args = Array.prototype.slice.call(arguments, 1);
	    listeners = handler.slice();
	    len = listeners.length;
	    for (i = 0; i < len; i++)
	      listeners[i].apply(this, args);
	  }

	  return true;
	};

	EventEmitter.prototype.addListener = function(type, listener) {
	  var m;

	  if (!isFunction(listener))
	    throw TypeError('listener must be a function');

	  if (!this._events)
	    this._events = {};

	  // To avoid recursion in the case that type === "newListener"! Before
	  // adding it to the listeners, first emit "newListener".
	  if (this._events.newListener)
	    this.emit('newListener', type,
	              isFunction(listener.listener) ?
	              listener.listener : listener);

	  if (!this._events[type])
	    // Optimize the case of one listener. Don't need the extra array object.
	    this._events[type] = listener;
	  else if (isObject(this._events[type]))
	    // If we've already got an array, just append.
	    this._events[type].push(listener);
	  else
	    // Adding the second element, need to change to array.
	    this._events[type] = [this._events[type], listener];

	  // Check for listener leak
	  if (isObject(this._events[type]) && !this._events[type].warned) {
	    if (!isUndefined(this._maxListeners)) {
	      m = this._maxListeners;
	    } else {
	      m = EventEmitter.defaultMaxListeners;
	    }

	    if (m && m > 0 && this._events[type].length > m) {
	      this._events[type].warned = true;
	      console.error('(node) warning: possible EventEmitter memory ' +
	                    'leak detected. %d listeners added. ' +
	                    'Use emitter.setMaxListeners() to increase limit.',
	                    this._events[type].length);
	      if (typeof console.trace === 'function') {
	        // not supported in IE 10
	        console.trace();
	      }
	    }
	  }

	  return this;
	};

	EventEmitter.prototype.on = EventEmitter.prototype.addListener;

	EventEmitter.prototype.once = function(type, listener) {
	  if (!isFunction(listener))
	    throw TypeError('listener must be a function');

	  var fired = false;

	  function g() {
	    this.removeListener(type, g);

	    if (!fired) {
	      fired = true;
	      listener.apply(this, arguments);
	    }
	  }

	  g.listener = listener;
	  this.on(type, g);

	  return this;
	};

	// emits a 'removeListener' event iff the listener was removed
	EventEmitter.prototype.removeListener = function(type, listener) {
	  var list, position, length, i;

	  if (!isFunction(listener))
	    throw TypeError('listener must be a function');

	  if (!this._events || !this._events[type])
	    return this;

	  list = this._events[type];
	  length = list.length;
	  position = -1;

	  if (list === listener ||
	      (isFunction(list.listener) && list.listener === listener)) {
	    delete this._events[type];
	    if (this._events.removeListener)
	      this.emit('removeListener', type, listener);

	  } else if (isObject(list)) {
	    for (i = length; i-- > 0;) {
	      if (list[i] === listener ||
	          (list[i].listener && list[i].listener === listener)) {
	        position = i;
	        break;
	      }
	    }

	    if (position < 0)
	      return this;

	    if (list.length === 1) {
	      list.length = 0;
	      delete this._events[type];
	    } else {
	      list.splice(position, 1);
	    }

	    if (this._events.removeListener)
	      this.emit('removeListener', type, listener);
	  }

	  return this;
	};

	EventEmitter.prototype.removeAllListeners = function(type) {
	  var key, listeners;

	  if (!this._events)
	    return this;

	  // not listening for removeListener, no need to emit
	  if (!this._events.removeListener) {
	    if (arguments.length === 0)
	      this._events = {};
	    else if (this._events[type])
	      delete this._events[type];
	    return this;
	  }

	  // emit removeListener for all listeners on all events
	  if (arguments.length === 0) {
	    for (key in this._events) {
	      if (key === 'removeListener') continue;
	      this.removeAllListeners(key);
	    }
	    this.removeAllListeners('removeListener');
	    this._events = {};
	    return this;
	  }

	  listeners = this._events[type];

	  if (isFunction(listeners)) {
	    this.removeListener(type, listeners);
	  } else if (listeners) {
	    // LIFO order
	    while (listeners.length)
	      this.removeListener(type, listeners[listeners.length - 1]);
	  }
	  delete this._events[type];

	  return this;
	};

	EventEmitter.prototype.listeners = function(type) {
	  var ret;
	  if (!this._events || !this._events[type])
	    ret = [];
	  else if (isFunction(this._events[type]))
	    ret = [this._events[type]];
	  else
	    ret = this._events[type].slice();
	  return ret;
	};

	EventEmitter.prototype.listenerCount = function(type) {
	  if (this._events) {
	    var evlistener = this._events[type];

	    if (isFunction(evlistener))
	      return 1;
	    else if (evlistener)
	      return evlistener.length;
	  }
	  return 0;
	};

	EventEmitter.listenerCount = function(emitter, type) {
	  return emitter.listenerCount(type);
	};

	function isFunction(arg) {
	  return typeof arg === 'function';
	}

	function isNumber(arg) {
	  return typeof arg === 'number';
	}

	function isObject(arg) {
	  return typeof arg === 'object' && arg !== null;
	}

	function isUndefined(arg) {
	  return arg === void 0;
	}

	var dprop = defaultProperty;

	function defaultProperty (get, set) {
	  return {
	    configurable: true,
	    enumerable: true,
	    get: get,
	    set: set
	  }
	}

	var rootPosition = { left: 0, top: 0 };

	var mouseEventOffset_1 = mouseEventOffset;
	function mouseEventOffset (ev, target, out) {
	  target = target || ev.currentTarget || ev.srcElement;
	  if (!Array.isArray(out)) {
	    out = [ 0, 0 ];
	  }
	  var cx = ev.clientX || 0;
	  var cy = ev.clientY || 0;
	  var rect = getBoundingClientOffset(target);
	  out[0] = cx - rect.left;
	  out[1] = cy - rect.top;
	  return out
	}

	function getBoundingClientOffset (element) {
	  if (element === window ||
	      element === document ||
	      element === document.body) {
	    return rootPosition
	  } else {
	    return element.getBoundingClientRect()
	  }
	}

	var EventEmitter$1 = events.EventEmitter;



	var touchPinch_1 = touchPinch;
	function touchPinch (target) {
	  target = target || window;

	  var emitter = new EventEmitter$1();
	  var fingers = [ null, null ];
	  var activeCount = 0;

	  var lastDistance = 0;
	  var ended = false;
	  var enabled = false;

	  // some read-only values
	  Object.defineProperties(emitter, {
	    pinching: dprop(function () {
	      return activeCount === 2
	    }),

	    fingers: dprop(function () {
	      return fingers
	    })
	  });

	  enable();
	  emitter.enable = enable;
	  emitter.disable = disable;
	  emitter.indexOfTouch = indexOfTouch;
	  return emitter

	  function indexOfTouch (touch) {
	    var id = touch.identifier;
	    for (var i = 0; i < fingers.length; i++) {
	      if (fingers[i] &&
	        fingers[i].touch &&
	        fingers[i].touch.identifier === id) {
	        return i
	      }
	    }
	    return -1
	  }

	  function enable () {
	    if (enabled) return
	    enabled = true;
	    target.addEventListener('touchstart', onTouchStart, false);
	    target.addEventListener('touchmove', onTouchMove, false);
	    target.addEventListener('touchend', onTouchRemoved, false);
	    target.addEventListener('touchcancel', onTouchRemoved, false);
	  }

	  function disable () {
	    if (!enabled) return
	    enabled = false;
	    activeCount = 0;
	    fingers[0] = null;
	    fingers[1] = null;
	    lastDistance = 0;
	    ended = false;
	    target.removeEventListener('touchstart', onTouchStart, false);
	    target.removeEventListener('touchmove', onTouchMove, false);
	    target.removeEventListener('touchend', onTouchRemoved, false);
	    target.removeEventListener('touchcancel', onTouchRemoved, false);
	  }

	  function onTouchStart (ev) {
	    for (var i = 0; i < ev.changedTouches.length; i++) {
	      var newTouch = ev.changedTouches[i];
	      var id = newTouch.identifier;
	      var idx = indexOfTouch(id);

	      if (idx === -1 && activeCount < 2) {
	        var first = activeCount === 0;

	        // newest and previous finger (previous may be undefined)
	        var newIndex = fingers[0] ? 1 : 0;
	        var oldIndex = fingers[0] ? 0 : 1;
	        var newFinger = new Finger();

	        // add to stack
	        fingers[newIndex] = newFinger;
	        activeCount++;

	        // update touch event & position
	        newFinger.touch = newTouch;
	        mouseEventOffset_1(newTouch, target, newFinger.position);

	        var oldTouch = fingers[oldIndex] ? fingers[oldIndex].touch : undefined;
	        emitter.emit('place', newTouch, oldTouch);

	        if (!first) {
	          var initialDistance = computeDistance();
	          ended = false;
	          emitter.emit('start', initialDistance);
	          lastDistance = initialDistance;
	        }
	      }
	    }
	  }

	  function onTouchMove (ev) {
	    var changed = false;
	    for (var i = 0; i < ev.changedTouches.length; i++) {
	      var movedTouch = ev.changedTouches[i];
	      var idx = indexOfTouch(movedTouch);
	      if (idx !== -1) {
	        changed = true;
	        fingers[idx].touch = movedTouch; // avoid caching touches
	        mouseEventOffset_1(movedTouch, target, fingers[idx].position);
	      }
	    }

	    if (activeCount === 2 && changed) {
	      var currentDistance = computeDistance();
	      emitter.emit('change', currentDistance, lastDistance);
	      lastDistance = currentDistance;
	    }
	  }

	  function onTouchRemoved (ev) {
	    for (var i = 0; i < ev.changedTouches.length; i++) {
	      var removed = ev.changedTouches[i];
	      var idx = indexOfTouch(removed);

	      if (idx !== -1) {
	        fingers[idx] = null;
	        activeCount--;
	        var otherIdx = idx === 0 ? 1 : 0;
	        var otherTouch = fingers[otherIdx] ? fingers[otherIdx].touch : undefined;
	        emitter.emit('lift', removed, otherTouch);
	      }
	    }

	    if (!ended && activeCount !== 2) {
	      ended = true;
	      emitter.emit('end');
	    }
	  }

	  function computeDistance () {
	    if (activeCount < 2) return 0
	    return distance_1(fingers[0].position, fingers[1].position)
	  }
	}

	function Finger () {
	  this.position = [0, 0];
	  this.touch = null;
	}

	var EventEmitter$2 = events.EventEmitter;

	function attach (opt) {
	  opt = opt || {};
	  var element = opt.element || window;

	  var emitter = new EventEmitter$2();

	  var position = opt.position || [0, 0];
	  if (opt.touchstart !== false) {
	    element.addEventListener('mousedown', update, false);
	    element.addEventListener('touchstart', updateTouch, false);
	  }

	  element.addEventListener('mousemove', update, false);
	  element.addEventListener('touchmove', updateTouch, false);

	  emitter.position = position;
	  emitter.dispose = dispose;
	  return emitter;

	  function updateTouch (ev) {
	    var touch = ev.targetTouches[0];
	    update(touch);
	  }

	  function update (ev) {
	    mouseEventOffset_1(ev, element, position);
	    emitter.emit('move', ev);
	  }

	  function dispose () {
	    element.removeEventListener('mousemove', update, false);
	    element.removeEventListener('mousedown', update, false);
	    element.removeEventListener('touchmove', updateTouch, false);
	    element.removeEventListener('touchstart', updateTouch, false);
	  }
	}

	var touchPosition = function (opt) {
	  return attach(opt).position;
	};

	var emitter = function (opt) {
	  return attach(opt);
	};
	touchPosition.emitter = emitter;

	var global$1 = (typeof global !== "undefined" ? global :
	            typeof self !== "undefined" ? self :
	            typeof window !== "undefined" ? window : {});

	// shim for using process in browser
	// based off https://github.com/defunctzombie/node-process/blob/master/browser.js

	function defaultSetTimout() {
	    throw new Error('setTimeout has not been defined');
	}
	function defaultClearTimeout () {
	    throw new Error('clearTimeout has not been defined');
	}
	var cachedSetTimeout = defaultSetTimout;
	var cachedClearTimeout = defaultClearTimeout;
	if (typeof global$1.setTimeout === 'function') {
	    cachedSetTimeout = setTimeout;
	}
	if (typeof global$1.clearTimeout === 'function') {
	    cachedClearTimeout = clearTimeout;
	}

	function runTimeout(fun) {
	    if (cachedSetTimeout === setTimeout) {
	        //normal enviroments in sane situations
	        return setTimeout(fun, 0);
	    }
	    // if setTimeout wasn't available but was latter defined
	    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
	        cachedSetTimeout = setTimeout;
	        return setTimeout(fun, 0);
	    }
	    try {
	        // when when somebody has screwed with setTimeout but no I.E. maddness
	        return cachedSetTimeout(fun, 0);
	    } catch(e){
	        try {
	            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
	            return cachedSetTimeout.call(null, fun, 0);
	        } catch(e){
	            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
	            return cachedSetTimeout.call(this, fun, 0);
	        }
	    }


	}
	function runClearTimeout(marker) {
	    if (cachedClearTimeout === clearTimeout) {
	        //normal enviroments in sane situations
	        return clearTimeout(marker);
	    }
	    // if clearTimeout wasn't available but was latter defined
	    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
	        cachedClearTimeout = clearTimeout;
	        return clearTimeout(marker);
	    }
	    try {
	        // when when somebody has screwed with setTimeout but no I.E. maddness
	        return cachedClearTimeout(marker);
	    } catch (e){
	        try {
	            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
	            return cachedClearTimeout.call(null, marker);
	        } catch (e){
	            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
	            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
	            return cachedClearTimeout.call(this, marker);
	        }
	    }



	}
	var queue = [];
	var draining = false;
	var currentQueue;
	var queueIndex = -1;

	function cleanUpNextTick() {
	    if (!draining || !currentQueue) {
	        return;
	    }
	    draining = false;
	    if (currentQueue.length) {
	        queue = currentQueue.concat(queue);
	    } else {
	        queueIndex = -1;
	    }
	    if (queue.length) {
	        drainQueue();
	    }
	}

	function drainQueue() {
	    if (draining) {
	        return;
	    }
	    var timeout = runTimeout(cleanUpNextTick);
	    draining = true;

	    var len = queue.length;
	    while(len) {
	        currentQueue = queue;
	        queue = [];
	        while (++queueIndex < len) {
	            if (currentQueue) {
	                currentQueue[queueIndex].run();
	            }
	        }
	        queueIndex = -1;
	        len = queue.length;
	    }
	    currentQueue = null;
	    draining = false;
	    runClearTimeout(timeout);
	}
	function nextTick(fun) {
	    var args = new Array(arguments.length - 1);
	    if (arguments.length > 1) {
	        for (var i = 1; i < arguments.length; i++) {
	            args[i - 1] = arguments[i];
	        }
	    }
	    queue.push(new Item(fun, args));
	    if (queue.length === 1 && !draining) {
	        runTimeout(drainQueue);
	    }
	}
	// v8 likes predictible objects
	function Item(fun, array) {
	    this.fun = fun;
	    this.array = array;
	}
	Item.prototype.run = function () {
	    this.fun.apply(null, this.array);
	};
	var title = 'browser';
	var platform = 'browser';
	var browser = true;
	var env = {};
	var argv = [];
	var version = ''; // empty string to avoid regexp issues
	var versions = {};
	var release = {};
	var config = {};

	function noop() {}

	var on = noop;
	var addListener = noop;
	var once = noop;
	var off = noop;
	var removeListener = noop;
	var removeAllListeners = noop;
	var emit = noop;

	function binding(name) {
	    throw new Error('process.binding is not supported');
	}

	function cwd () { return '/' }
	function chdir (dir) {
	    throw new Error('process.chdir is not supported');
	}function umask() { return 0; }

	// from https://github.com/kumavis/browser-process-hrtime/blob/master/index.js
	var performance$1 = global$1.performance || {};
	var performanceNow =
	  performance$1.now        ||
	  performance$1.mozNow     ||
	  performance$1.msNow      ||
	  performance$1.oNow       ||
	  performance$1.webkitNow  ||
	  function(){ return (new Date()).getTime() };

	// generate timestamp or delta
	// see http://nodejs.org/api/process.html#process_process_hrtime
	function hrtime(previousTimestamp){
	  var clocktime = performanceNow.call(performance$1)*1e-3;
	  var seconds = Math.floor(clocktime);
	  var nanoseconds = Math.floor((clocktime%1)*1e9);
	  if (previousTimestamp) {
	    seconds = seconds - previousTimestamp[0];
	    nanoseconds = nanoseconds - previousTimestamp[1];
	    if (nanoseconds<0) {
	      seconds--;
	      nanoseconds += 1e9;
	    }
	  }
	  return [seconds,nanoseconds]
	}

	var startTime = new Date();
	function uptime() {
	  var currentTime = new Date();
	  var dif = currentTime - startTime;
	  return dif / 1000;
	}

	var process = {
	  nextTick: nextTick,
	  title: title,
	  browser: browser,
	  env: env,
	  argv: argv,
	  version: version,
	  versions: versions,
	  on: on,
	  addListener: addListener,
	  once: once,
	  off: off,
	  removeListener: removeListener,
	  removeAllListeners: removeAllListeners,
	  emit: emit,
	  binding: binding,
	  cwd: cwd,
	  chdir: chdir,
	  umask: umask,
	  hrtime: hrtime,
	  platform: platform,
	  release: release,
	  config: config,
	  uptime: uptime
	};

	var performanceNow$1 = createCommonjsModule(function (module) {
	// Generated by CoffeeScript 1.12.2
	(function() {
	  var getNanoSeconds, hrtime$$1, loadTime, moduleLoadTime, nodeLoadTime, upTime;

	  if ((typeof performance !== "undefined" && performance !== null) && performance.now) {
	    module.exports = function() {
	      return performance.now();
	    };
	  } else if ((typeof process !== "undefined" && process !== null) && process.hrtime) {
	    module.exports = function() {
	      return (getNanoSeconds() - nodeLoadTime) / 1e6;
	    };
	    hrtime$$1 = process.hrtime;
	    getNanoSeconds = function() {
	      var hr;
	      hr = hrtime$$1();
	      return hr[0] * 1e9 + hr[1];
	    };
	    moduleLoadTime = getNanoSeconds();
	    upTime = process.uptime() * 1e9;
	    nodeLoadTime = moduleLoadTime - upTime;
	  } else if (Date.now) {
	    module.exports = function() {
	      return Date.now() - loadTime;
	    };
	    loadTime = Date.now();
	  } else {
	    module.exports = function() {
	      return new Date().getTime() - loadTime;
	    };
	    loadTime = new Date().getTime();
	  }

	}).call(commonjsGlobal);


	});

	var root = typeof window === 'undefined' ? commonjsGlobal : window
	  , vendors = ['moz', 'webkit']
	  , suffix = 'AnimationFrame'
	  , raf = root['request' + suffix]
	  , caf = root['cancel' + suffix] || root['cancelRequest' + suffix];

	for(var i = 0; !raf && i < vendors.length; i++) {
	  raf = root[vendors[i] + 'Request' + suffix];
	  caf = root[vendors[i] + 'Cancel' + suffix]
	      || root[vendors[i] + 'CancelRequest' + suffix];
	}

	// Some versions of FF have rAF but not cAF
	if(!raf || !caf) {
	  var last = 0
	    , id = 0
	    , queue$1 = []
	    , frameDuration = 1000 / 60;

	  raf = function(callback) {
	    if(queue$1.length === 0) {
	      var _now = performanceNow$1()
	        , next = Math.max(0, frameDuration - (_now - last));
	      last = next + _now;
	      setTimeout(function() {
	        var cp = queue$1.slice(0);
	        // Clear queue here to prevent
	        // callbacks from appending listeners
	        // to the current frame's queue
	        queue$1.length = 0;
	        for(var i = 0; i < cp.length; i++) {
	          if(!cp[i].cancelled) {
	            try{
	              cp[i].callback(last);
	            } catch(e) {
	              setTimeout(function() { throw e }, 0);
	            }
	          }
	        }
	      }, Math.round(next));
	    }
	    queue$1.push({
	      handle: ++id,
	      callback: callback,
	      cancelled: false
	    });
	    return id
	  };

	  caf = function(handle) {
	    for(var i = 0; i < queue$1.length; i++) {
	      if(queue$1[i].handle === handle) {
	        queue$1[i].cancelled = true;
	      }
	    }
	  };
	}

	var raf_1 = function(fn) {
	  // Wrap in a new function to prevent
	  // `cancel` potentially being assigned
	  // to the native rAF function
	  return raf.call(root, fn)
	};
	var cancel = function() {
	  caf.apply(root, arguments);
	};
	var polyfill = function(object) {
	  if (!object) {
	    object = root;
	  }
	  object.requestAnimationFrame = raf;
	  object.cancelAnimationFrame = caf;
	};
	raf_1.cancel = cancel;
	raf_1.polyfill = polyfill;

	var client = true;

	function detect() {
		var supported = false;

		try {
			var opts = Object.defineProperty({}, 'passive', {
				get: function() {
					supported = true;
				}
			});

			window.addEventListener('test', null, opts);
			window.removeEventListener('test', null, opts);
		} catch(e) {
			supported = false;
		}

		return supported
	}

	var hasPassiveEvents = client && detect();

	var panZoom_1 = panZoom;


	function panZoom (target, cb) {
		if (target instanceof Function) {
			cb = target;
			target = document.documentElement || document.body;
		}

		if (typeof target === 'string') target = document.querySelector(target);

		//enable panning
		var touch = touchPosition.emitter({
			element: target
		});

		var impetus$$1;

		var initX = 0, initY = 0, init = true;
		var initFn = function (e) { init = true; };
		target.addEventListener('mousedown', initFn);
		target.addEventListener('touchstart', initFn, hasPassiveEvents ? { passive: true } : false);

		var lastY = 0, lastX = 0;
		impetus$$1 = new impetus({
			source: target,
			update: function (x, y) {
				if (init) {
					init = false;
					initX = touch.position[0];
					initY = touch.position[1];
				}

				var e = {
					target: target,
					type: 'mouse',
					dx: x - lastX, dy: y - lastY, dz: 0,
					x: touch.position[0], y: touch.position[1],
					x0: initX, y0: initY
				};

				lastX = x;
				lastY = y;

				schedule(e);
			},
			multiplier: 1,
			friction: .75
		});


		//enable zooming
		var wheelListener = wheel(target, function (dx, dy, dz, e) {
			e.preventDefault();
			schedule({
				target: target,
				type: 'mouse',
				dx: 0, dy: 0, dz: dy,
				x: touch.position[0], y: touch.position[1],
				x0: touch.position[0], y0: touch.position[1]
			});
		});

		//mobile pinch zoom
		var pinch = touchPinch_1(target);
		var mult = 2;
		var initialCoords;

		pinch.on('start', function (curr) {
			var f1 = pinch.fingers[0];
			var f2 = pinch.fingers[1];

			initialCoords = [
				f2.position[0] * .5 + f1.position[0] * .5,
				f2.position[1] * .5 + f1.position[1] * .5
			];

			impetus$$1 && impetus$$1.pause();
		});
		pinch.on('end', function () {
			if (!initialCoords) return

			initialCoords = null;

			impetus$$1 && impetus$$1.resume();
		});
		pinch.on('change', function (curr, prev) {
			if (!pinch.pinching || !initialCoords) return

			schedule({
				target: target,
				type: 'touch',
				dx: 0, dy: 0, dz: - (curr - prev) * mult,
				x: initialCoords[0], y: initialCoords[1],
				x0: initialCoords[0], y0: initialCoords[0]
			});
		});


		// schedule function to current or next frame
		var planned, frameId;
		function schedule (ev) {
			if (frameId != null) {
				if (!planned) planned = ev;
				else {
					planned.dx += ev.dx;
					planned.dy += ev.dy;
					planned.dz += ev.dz;

					planned.x = ev.x;
					planned.y = ev.y;
				}

				return
			}

			// Firefox sometimes does not clear webgl current drawing buffer
			// so we have to schedule callback to the next frame, not the current
			// cb(ev)

			frameId = raf_1(function () {
				cb(ev);
				frameId = null;
				if (planned) {
					var arg = planned;
					planned = null;
					schedule(arg);
				}
			});
		}

		return function unpanzoom () {
			touch.dispose();

			target.removeEventListener('mousedown', initFn);
			target.removeEventListener('touchstart', initFn);

			impetus$$1.destroy();

			target.removeEventListener('wheel', wheelListener);

			pinch.disable();

			raf_1.cancel(frameId);
		}
	}

	/**
	 * Common utilities
	 * @module glMatrix
	 */

	// Configuration Constants
	var EPSILON = 0.000001;
	var ARRAY_TYPE = typeof Float32Array !== 'undefined' ? Float32Array : Array;

	var degree = Math.PI / 180;

	/**
	 * 3x3 Matrix
	 * @module mat3
	 */

	/**
	 * Creates a new identity mat3
	 *
	 * @returns {mat3} a new 3x3 matrix
	 */
	function create$2() {
	  var out = new ARRAY_TYPE(9);
	  if (ARRAY_TYPE != Float32Array) {
	    out[1] = 0;
	    out[2] = 0;
	    out[3] = 0;
	    out[5] = 0;
	    out[6] = 0;
	    out[7] = 0;
	  }
	  out[0] = 1;
	  out[4] = 1;
	  out[8] = 1;
	  return out;
	}

	/**
	 * Creates a new mat3 initialized with values from an existing matrix
	 *
	 * @param {mat3} a matrix to clone
	 * @returns {mat3} a new 3x3 matrix
	 */
	function clone$2(a) {
	  var out = new ARRAY_TYPE(9);
	  out[0] = a[0];
	  out[1] = a[1];
	  out[2] = a[2];
	  out[3] = a[3];
	  out[4] = a[4];
	  out[5] = a[5];
	  out[6] = a[6];
	  out[7] = a[7];
	  out[8] = a[8];
	  return out;
	}

	/**
	 * Set a mat3 to the identity matrix
	 *
	 * @param {mat3} out the receiving matrix
	 * @returns {mat3} out
	 */
	function identity$2(out) {
	  out[0] = 1;
	  out[1] = 0;
	  out[2] = 0;
	  out[3] = 0;
	  out[4] = 1;
	  out[5] = 0;
	  out[6] = 0;
	  out[7] = 0;
	  out[8] = 1;
	  return out;
	}

	/**
	 * Translate a mat3 by the given vector
	 *
	 * @param {mat3} out the receiving matrix
	 * @param {mat3} a the matrix to translate
	 * @param {vec2} v vector to translate by
	 * @returns {mat3} out
	 */
	function translate$1(out, a, v) {
	  var a00 = a[0],
	      a01 = a[1],
	      a02 = a[2],
	      a10 = a[3],
	      a11 = a[4],
	      a12 = a[5],
	      a20 = a[6],
	      a21 = a[7],
	      a22 = a[8],
	      x = v[0],
	      y = v[1];

	  out[0] = a00;
	  out[1] = a01;
	  out[2] = a02;

	  out[3] = a10;
	  out[4] = a11;
	  out[5] = a12;

	  out[6] = x * a00 + y * a10 + a20;
	  out[7] = x * a01 + y * a11 + a21;
	  out[8] = x * a02 + y * a12 + a22;
	  return out;
	}

	/**
	 * Scales the mat3 by the dimensions in the given vec2
	 *
	 * @param {mat3} out the receiving matrix
	 * @param {mat3} a the matrix to rotate
	 * @param {vec2} v the vec2 to scale the matrix by
	 * @returns {mat3} out
	 **/
	function scale$2(out, a, v) {
	  var x = v[0],
	      y = v[1];

	  out[0] = x * a[0];
	  out[1] = x * a[1];
	  out[2] = x * a[2];

	  out[3] = y * a[3];
	  out[4] = y * a[4];
	  out[5] = y * a[5];

	  out[6] = a[6];
	  out[7] = a[7];
	  out[8] = a[8];
	  return out;
	}

	/**
	 * 3 Dimensional Vector
	 * @module vec3
	 */

	/**
	 * Creates a new, empty vec3
	 *
	 * @returns {vec3} a new 3D vector
	 */
	function create$4() {
	  var out = new ARRAY_TYPE(3);
	  if (ARRAY_TYPE != Float32Array) {
	    out[0] = 0;
	    out[1] = 0;
	    out[2] = 0;
	  }
	  return out;
	}

	/**
	 * Calculates the length of a vec3
	 *
	 * @param {vec3} a vector to calculate length of
	 * @returns {Number} length of a
	 */
	function length(a) {
	  var x = a[0];
	  var y = a[1];
	  var z = a[2];
	  return Math.sqrt(x * x + y * y + z * z);
	}

	/**
	 * Creates a new vec3 initialized with the given values
	 *
	 * @param {Number} x X component
	 * @param {Number} y Y component
	 * @param {Number} z Z component
	 * @returns {vec3} a new 3D vector
	 */
	function fromValues$4(x, y, z) {
	  var out = new ARRAY_TYPE(3);
	  out[0] = x;
	  out[1] = y;
	  out[2] = z;
	  return out;
	}

	/**
	 * Normalize a vec3
	 *
	 * @param {vec3} out the receiving vector
	 * @param {vec3} a vector to normalize
	 * @returns {vec3} out
	 */
	function normalize(out, a) {
	  var x = a[0];
	  var y = a[1];
	  var z = a[2];
	  var len = x * x + y * y + z * z;
	  if (len > 0) {
	    //TODO: evaluate use of glm_invsqrt here?
	    len = 1 / Math.sqrt(len);
	    out[0] = a[0] * len;
	    out[1] = a[1] * len;
	    out[2] = a[2] * len;
	  }
	  return out;
	}

	/**
	 * Calculates the dot product of two vec3's
	 *
	 * @param {vec3} a the first operand
	 * @param {vec3} b the second operand
	 * @returns {Number} dot product of a and b
	 */
	function dot(a, b) {
	  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
	}

	/**
	 * Computes the cross product of two vec3's
	 *
	 * @param {vec3} out the receiving vector
	 * @param {vec3} a the first operand
	 * @param {vec3} b the second operand
	 * @returns {vec3} out
	 */
	function cross(out, a, b) {
	  var ax = a[0],
	      ay = a[1],
	      az = a[2];
	  var bx = b[0],
	      by = b[1],
	      bz = b[2];

	  out[0] = ay * bz - az * by;
	  out[1] = az * bx - ax * bz;
	  out[2] = ax * by - ay * bx;
	  return out;
	}

	/**
	 * Alias for {@link vec3.length}
	 * @function
	 */
	var len = length;

	/**
	 * Perform some operation over an array of vec3s.
	 *
	 * @param {Array} a the array of vectors to iterate over
	 * @param {Number} stride Number of elements between the start of each vec3. If 0 assumes tightly packed
	 * @param {Number} offset Number of elements to skip at the beginning of the array
	 * @param {Number} count Number of vec3s to iterate over. If 0 iterates over entire array
	 * @param {Function} fn Function to call for each vector in the array
	 * @param {Object} [arg] additional argument to pass to fn
	 * @returns {Array} a
	 * @function
	 */
	var forEach = function () {
	  var vec = create$4();

	  return function (a, stride, offset, count, fn, arg) {
	    var i = void 0,
	        l = void 0;
	    if (!stride) {
	      stride = 3;
	    }

	    if (!offset) {
	      offset = 0;
	    }

	    if (count) {
	      l = Math.min(count * stride + offset, a.length);
	    } else {
	      l = a.length;
	    }

	    for (i = offset; i < l; i += stride) {
	      vec[0] = a[i];vec[1] = a[i + 1];vec[2] = a[i + 2];
	      fn(vec, vec, arg);
	      a[i] = vec[0];a[i + 1] = vec[1];a[i + 2] = vec[2];
	    }

	    return a;
	  };
	}();

	/**
	 * 4 Dimensional Vector
	 * @module vec4
	 */

	/**
	 * Creates a new, empty vec4
	 *
	 * @returns {vec4} a new 4D vector
	 */
	function create$5() {
	  var out = new ARRAY_TYPE(4);
	  if (ARRAY_TYPE != Float32Array) {
	    out[0] = 0;
	    out[1] = 0;
	    out[2] = 0;
	    out[3] = 0;
	  }
	  return out;
	}

	/**
	 * Normalize a vec4
	 *
	 * @param {vec4} out the receiving vector
	 * @param {vec4} a vector to normalize
	 * @returns {vec4} out
	 */
	function normalize$1(out, a) {
	  var x = a[0];
	  var y = a[1];
	  var z = a[2];
	  var w = a[3];
	  var len = x * x + y * y + z * z + w * w;
	  if (len > 0) {
	    len = 1 / Math.sqrt(len);
	    out[0] = x * len;
	    out[1] = y * len;
	    out[2] = z * len;
	    out[3] = w * len;
	  }
	  return out;
	}

	/**
	 * Perform some operation over an array of vec4s.
	 *
	 * @param {Array} a the array of vectors to iterate over
	 * @param {Number} stride Number of elements between the start of each vec4. If 0 assumes tightly packed
	 * @param {Number} offset Number of elements to skip at the beginning of the array
	 * @param {Number} count Number of vec4s to iterate over. If 0 iterates over entire array
	 * @param {Function} fn Function to call for each vector in the array
	 * @param {Object} [arg] additional argument to pass to fn
	 * @returns {Array} a
	 * @function
	 */
	var forEach$1 = function () {
	  var vec = create$5();

	  return function (a, stride, offset, count, fn, arg) {
	    var i = void 0,
	        l = void 0;
	    if (!stride) {
	      stride = 4;
	    }

	    if (!offset) {
	      offset = 0;
	    }

	    if (count) {
	      l = Math.min(count * stride + offset, a.length);
	    } else {
	      l = a.length;
	    }

	    for (i = offset; i < l; i += stride) {
	      vec[0] = a[i];vec[1] = a[i + 1];vec[2] = a[i + 2];vec[3] = a[i + 3];
	      fn(vec, vec, arg);
	      a[i] = vec[0];a[i + 1] = vec[1];a[i + 2] = vec[2];a[i + 3] = vec[3];
	    }

	    return a;
	  };
	}();

	/**
	 * Quaternion
	 * @module quat
	 */

	/**
	 * Creates a new identity quat
	 *
	 * @returns {quat} a new quaternion
	 */
	function create$6() {
	  var out = new ARRAY_TYPE(4);
	  if (ARRAY_TYPE != Float32Array) {
	    out[0] = 0;
	    out[1] = 0;
	    out[2] = 0;
	  }
	  out[3] = 1;
	  return out;
	}

	/**
	 * Sets a quat from the given angle and rotation axis,
	 * then returns it.
	 *
	 * @param {quat} out the receiving quaternion
	 * @param {vec3} axis the axis around which to rotate
	 * @param {Number} rad the angle in radians
	 * @returns {quat} out
	 **/
	function setAxisAngle(out, axis, rad) {
	  rad = rad * 0.5;
	  var s = Math.sin(rad);
	  out[0] = s * axis[0];
	  out[1] = s * axis[1];
	  out[2] = s * axis[2];
	  out[3] = Math.cos(rad);
	  return out;
	}

	/**
	 * Performs a spherical linear interpolation between two quat
	 *
	 * @param {quat} out the receiving quaternion
	 * @param {quat} a the first operand
	 * @param {quat} b the second operand
	 * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
	 * @returns {quat} out
	 */
	function slerp(out, a, b, t) {
	  // benchmarks:
	  //    http://jsperf.com/quaternion-slerp-implementations
	  var ax = a[0],
	      ay = a[1],
	      az = a[2],
	      aw = a[3];
	  var bx = b[0],
	      by = b[1],
	      bz = b[2],
	      bw = b[3];

	  var omega = void 0,
	      cosom = void 0,
	      sinom = void 0,
	      scale0 = void 0,
	      scale1 = void 0;

	  // calc cosine
	  cosom = ax * bx + ay * by + az * bz + aw * bw;
	  // adjust signs (if necessary)
	  if (cosom < 0.0) {
	    cosom = -cosom;
	    bx = -bx;
	    by = -by;
	    bz = -bz;
	    bw = -bw;
	  }
	  // calculate coefficients
	  if (1.0 - cosom > EPSILON) {
	    // standard case (slerp)
	    omega = Math.acos(cosom);
	    sinom = Math.sin(omega);
	    scale0 = Math.sin((1.0 - t) * omega) / sinom;
	    scale1 = Math.sin(t * omega) / sinom;
	  } else {
	    // "from" and "to" quaternions are very close
	    //  ... so we can do a linear interpolation
	    scale0 = 1.0 - t;
	    scale1 = t;
	  }
	  // calculate final values
	  out[0] = scale0 * ax + scale1 * bx;
	  out[1] = scale0 * ay + scale1 * by;
	  out[2] = scale0 * az + scale1 * bz;
	  out[3] = scale0 * aw + scale1 * bw;

	  return out;
	}

	/**
	 * Creates a quaternion from the given 3x3 rotation matrix.
	 *
	 * NOTE: The resultant quaternion is not normalized, so you should be sure
	 * to renormalize the quaternion yourself where necessary.
	 *
	 * @param {quat} out the receiving quaternion
	 * @param {mat3} m rotation matrix
	 * @returns {quat} out
	 * @function
	 */
	function fromMat3(out, m) {
	  // Algorithm in Ken Shoemake's article in 1987 SIGGRAPH course notes
	  // article "Quaternion Calculus and Fast Animation".
	  var fTrace = m[0] + m[4] + m[8];
	  var fRoot = void 0;

	  if (fTrace > 0.0) {
	    // |w| > 1/2, may as well choose w > 1/2
	    fRoot = Math.sqrt(fTrace + 1.0); // 2w
	    out[3] = 0.5 * fRoot;
	    fRoot = 0.5 / fRoot; // 1/(4w)
	    out[0] = (m[5] - m[7]) * fRoot;
	    out[1] = (m[6] - m[2]) * fRoot;
	    out[2] = (m[1] - m[3]) * fRoot;
	  } else {
	    // |w| <= 1/2
	    var i = 0;
	    if (m[4] > m[0]) i = 1;
	    if (m[8] > m[i * 3 + i]) i = 2;
	    var j = (i + 1) % 3;
	    var k = (i + 2) % 3;

	    fRoot = Math.sqrt(m[i * 3 + i] - m[j * 3 + j] - m[k * 3 + k] + 1.0);
	    out[i] = 0.5 * fRoot;
	    fRoot = 0.5 / fRoot;
	    out[3] = (m[j * 3 + k] - m[k * 3 + j]) * fRoot;
	    out[j] = (m[j * 3 + i] + m[i * 3 + j]) * fRoot;
	    out[k] = (m[k * 3 + i] + m[i * 3 + k]) * fRoot;
	  }

	  return out;
	}

	/**
	 * Normalize a quat
	 *
	 * @param {quat} out the receiving quaternion
	 * @param {quat} a quaternion to normalize
	 * @returns {quat} out
	 * @function
	 */
	var normalize$2 = normalize$1;

	/**
	 * Sets a quaternion to represent the shortest rotation from one
	 * vector to another.
	 *
	 * Both vectors are assumed to be unit length.
	 *
	 * @param {quat} out the receiving quaternion.
	 * @param {vec3} a the initial vector
	 * @param {vec3} b the destination vector
	 * @returns {quat} out
	 */
	var rotationTo = function () {
	  var tmpvec3 = create$4();
	  var xUnitVec3 = fromValues$4(1, 0, 0);
	  var yUnitVec3 = fromValues$4(0, 1, 0);

	  return function (out, a, b) {
	    var dot$$1 = dot(a, b);
	    if (dot$$1 < -0.999999) {
	      cross(tmpvec3, xUnitVec3, a);
	      if (len(tmpvec3) < 0.000001) cross(tmpvec3, yUnitVec3, a);
	      normalize(tmpvec3, tmpvec3);
	      setAxisAngle(out, tmpvec3, Math.PI);
	      return out;
	    } else if (dot$$1 > 0.999999) {
	      out[0] = 0;
	      out[1] = 0;
	      out[2] = 0;
	      out[3] = 1;
	      return out;
	    } else {
	      cross(tmpvec3, a, b);
	      out[0] = tmpvec3[0];
	      out[1] = tmpvec3[1];
	      out[2] = tmpvec3[2];
	      out[3] = 1 + dot$$1;
	      return normalize$2(out, out);
	    }
	  };
	}();

	/**
	 * Performs a spherical linear interpolation with two control points
	 *
	 * @param {quat} out the receiving quaternion
	 * @param {quat} a the first operand
	 * @param {quat} b the second operand
	 * @param {quat} c the third operand
	 * @param {quat} d the fourth operand
	 * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
	 * @returns {quat} out
	 */
	var sqlerp = function () {
	  var temp1 = create$6();
	  var temp2 = create$6();

	  return function (out, a, b, c, d, t) {
	    slerp(temp1, a, d, t);
	    slerp(temp2, b, c, t);
	    slerp(out, temp1, temp2, 2 * t * (1 - t));

	    return out;
	  };
	}();

	/**
	 * Sets the specified quaternion with values corresponding to the given
	 * axes. Each axis is a vec3 and is expected to be unit length and
	 * perpendicular to all other specified axes.
	 *
	 * @param {vec3} view  the vector representing the viewing direction
	 * @param {vec3} right the vector representing the local "right" direction
	 * @param {vec3} up    the vector representing the local "up" direction
	 * @returns {quat} out
	 */
	var setAxes = function () {
	  var matr = create$2();

	  return function (out, view, right, up) {
	    matr[0] = right[0];
	    matr[3] = right[1];
	    matr[6] = right[2];

	    matr[1] = up[0];
	    matr[4] = up[1];
	    matr[7] = up[2];

	    matr[2] = -view[0];
	    matr[5] = -view[1];
	    matr[8] = -view[2];

	    return normalize$2(out, fromMat3(out, matr));
	  };
	}();

	/**
	 * 2 Dimensional Vector
	 * @module vec2
	 */

	/**
	 * Creates a new, empty vec2
	 *
	 * @returns {vec2} a new 2D vector
	 */
	function create$8() {
	  var out = new ARRAY_TYPE(2);
	  if (ARRAY_TYPE != Float32Array) {
	    out[0] = 0;
	    out[1] = 0;
	  }
	  return out;
	}

	/**
	 * Creates a new vec2 initialized with values from an existing vector
	 *
	 * @param {vec2} a vector to clone
	 * @returns {vec2} a new 2D vector
	 */
	function clone$8(a) {
	  var out = new ARRAY_TYPE(2);
	  out[0] = a[0];
	  out[1] = a[1];
	  return out;
	}

	/**
	 * Scales a vec2 by a scalar number
	 *
	 * @param {vec2} out the receiving vector
	 * @param {vec2} a the vector to scale
	 * @param {Number} b amount to scale the vector by
	 * @returns {vec2} out
	 */
	function scale$8(out, a, b) {
	  out[0] = a[0] * b;
	  out[1] = a[1] * b;
	  return out;
	}

	/**
	 * Transforms the vec2 with a mat3
	 * 3rd vector component is implicitly '1'
	 *
	 * @param {vec2} out the receiving vector
	 * @param {vec2} a the vector to transform
	 * @param {mat3} m matrix to transform with
	 * @returns {vec2} out
	 */
	function transformMat3$1(out, a, m) {
	  var x = a[0],
	      y = a[1];
	  out[0] = m[0] * x + m[3] * y + m[6];
	  out[1] = m[1] * x + m[4] * y + m[7];
	  return out;
	}

	/**
	 * Perform some operation over an array of vec2s.
	 *
	 * @param {Array} a the array of vectors to iterate over
	 * @param {Number} stride Number of elements between the start of each vec2. If 0 assumes tightly packed
	 * @param {Number} offset Number of elements to skip at the beginning of the array
	 * @param {Number} count Number of vec2s to iterate over. If 0 iterates over entire array
	 * @param {Function} fn Function to call for each vector in the array
	 * @param {Object} [arg] additional argument to pass to fn
	 * @returns {Array} a
	 * @function
	 */
	var forEach$2 = function () {
	  var vec = create$8();

	  return function (a, stride, offset, count, fn, arg) {
	    var i = void 0,
	        l = void 0;
	    if (!stride) {
	      stride = 2;
	    }

	    if (!offset) {
	      offset = 0;
	    }

	    if (count) {
	      l = Math.min(count * stride + offset, a.length);
	    } else {
	      l = a.length;
	    }

	    for (i = offset; i < l; i += stride) {
	      vec[0] = a[i];vec[1] = a[i + 1];
	      fn(vec, vec, arg);
	      a[i] = vec[0];a[i + 1] = vec[1];
	    }

	    return a;
	  };
	}();

	var vertexShaderGLSL = "#version 300 es\nin vec3 aVertexPosition;uniform mat3 uPanzoomMatrix;out vec2 point;void main(void){gl_Position=vec4(aVertexPosition,1.0);point=vec2(uPanzoomMatrix*vec3(aVertexPosition.x,aVertexPosition.y,1.0));}";

	var fragmentShaderGLSL = "#version 300 es\nprecision highp float;in vec2 point;uniform float a;uniform float b;uniform float c;uniform float d;uniform float e;uniform float f;uniform float g;uniform float h;uniform float j;uniform float k;uniform float l;uniform float m;uniform float n;uniform float o;uniform float p;uniform float q;uniform float r;uniform float s;uniform float t;uniform float u;uniform float v;uniform float w;uniform float z;\n#define PI 3.141592653589793238\n#define HALF_PI 1.57079632679\n#define HALF_PI_INV 0.15915494309\n#define LOG_2 0.69314718056\n#define C_ONE 1.0\n#define C_I 0.0\n#define TO_RADIANS 0.01745329251\nfloat wireframe(float parameter,float width,float feather,float d){float w1=width-feather*0.5;float looped=0.5-abs(mod(parameter,1.0)-0.5);return smoothstep(d*w1,d*(w1+feather),looped);}uniform float pixelRatio;uniform float boxSize;uniform float lineSpacing;float theFunctionF(float x,float y){return THEFUNCTIONGOESHERE_F;}float theFunctionG(float x,float y){return THEFUNCTIONGOESHERE_G;}out vec4 color;void main(){vec2 p=fract(point/boxSize);vec2 center=(round(point/boxSize-vec2(0.5,0.5))+vec2(0.5,0.5))*boxSize;vec2 v=point-center;float dpointx=fwidth(point.x);float dpointy=fwidth(point.y);vec2 vx=point-center+vec2(dpointx,0.0);vec2 vy=point-center+vec2(0.0,dpointy);float f=theFunctionF(center.x,center.y);float g=theFunctionG(center.x,center.y);vec2 form=vec2(f,g);float result=dot(v,form);float side=sign(result);float resultx=dot(vx,form);float resulty=dot(vy,form);result=(result/lineSpacing);resultx=(resultx/lineSpacing);resulty=(resulty/lineSpacing);float result_dx=(resultx-result);float result_dy=(resulty-result);result=fract(result);float abs_dxdy=abs(result_dx)+abs(result_dy);result=wireframe(result,pixelRatio*0.3,1.0,abs_dxdy);vec4 red=vec4(1.0,0.0,0.0,1.0);vec4 blue=vec4(0.0,0.0,1.0,1.0);vec4 lineColor=mix(red,blue,(side+1.0)/2.0);vec4 background=vec4(1.0,1.0,1.0,1.0);color=mix(lineColor,background,result);color=mix(color,lineColor,0.1);}";

	/**
	 * dat-gui JavaScript Controller Library
	 * http://code.google.com/p/dat-gui
	 *
	 * Copyright 2011 Data Arts Team, Google Creative Lab
	 *
	 * Licensed under the Apache License, Version 2.0 (the "License");
	 * you may not use this file except in compliance with the License.
	 * You may obtain a copy of the License at
	 *
	 * http://www.apache.org/licenses/LICENSE-2.0
	 */

	function ___$insertStyle(css) {
	  if (!css) {
	    return;
	  }
	  if (typeof window === 'undefined') {
	    return;
	  }

	  var style = document.createElement('style');

	  style.setAttribute('type', 'text/css');
	  style.innerHTML = css;
	  document.head.appendChild(style);

	  return css;
	}

	function colorToString (color, forceCSSHex) {
	  var colorFormat = color.__state.conversionName.toString();
	  var r = Math.round(color.r);
	  var g = Math.round(color.g);
	  var b = Math.round(color.b);
	  var a = color.a;
	  var h = Math.round(color.h);
	  var s = color.s.toFixed(1);
	  var v = color.v.toFixed(1);
	  if (forceCSSHex || colorFormat === 'THREE_CHAR_HEX' || colorFormat === 'SIX_CHAR_HEX') {
	    var str = color.hex.toString(16);
	    while (str.length < 6) {
	      str = '0' + str;
	    }
	    return '#' + str;
	  } else if (colorFormat === 'CSS_RGB') {
	    return 'rgb(' + r + ',' + g + ',' + b + ')';
	  } else if (colorFormat === 'CSS_RGBA') {
	    return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
	  } else if (colorFormat === 'HEX') {
	    return '0x' + color.hex.toString(16);
	  } else if (colorFormat === 'RGB_ARRAY') {
	    return '[' + r + ',' + g + ',' + b + ']';
	  } else if (colorFormat === 'RGBA_ARRAY') {
	    return '[' + r + ',' + g + ',' + b + ',' + a + ']';
	  } else if (colorFormat === 'RGB_OBJ') {
	    return '{r:' + r + ',g:' + g + ',b:' + b + '}';
	  } else if (colorFormat === 'RGBA_OBJ') {
	    return '{r:' + r + ',g:' + g + ',b:' + b + ',a:' + a + '}';
	  } else if (colorFormat === 'HSV_OBJ') {
	    return '{h:' + h + ',s:' + s + ',v:' + v + '}';
	  } else if (colorFormat === 'HSVA_OBJ') {
	    return '{h:' + h + ',s:' + s + ',v:' + v + ',a:' + a + '}';
	  }
	  return 'unknown format';
	}

	var ARR_EACH = Array.prototype.forEach;
	var ARR_SLICE = Array.prototype.slice;
	var Common = {
	  BREAK: {},
	  extend: function extend(target) {
	    this.each(ARR_SLICE.call(arguments, 1), function (obj) {
	      var keys = this.isObject(obj) ? Object.keys(obj) : [];
	      keys.forEach(function (key) {
	        if (!this.isUndefined(obj[key])) {
	          target[key] = obj[key];
	        }
	      }.bind(this));
	    }, this);
	    return target;
	  },
	  defaults: function defaults(target) {
	    this.each(ARR_SLICE.call(arguments, 1), function (obj) {
	      var keys = this.isObject(obj) ? Object.keys(obj) : [];
	      keys.forEach(function (key) {
	        if (this.isUndefined(target[key])) {
	          target[key] = obj[key];
	        }
	      }.bind(this));
	    }, this);
	    return target;
	  },
	  compose: function compose() {
	    var toCall = ARR_SLICE.call(arguments);
	    return function () {
	      var args = ARR_SLICE.call(arguments);
	      for (var i = toCall.length - 1; i >= 0; i--) {
	        args = [toCall[i].apply(this, args)];
	      }
	      return args[0];
	    };
	  },
	  each: function each(obj, itr, scope) {
	    if (!obj) {
	      return;
	    }
	    if (ARR_EACH && obj.forEach && obj.forEach === ARR_EACH) {
	      obj.forEach(itr, scope);
	    } else if (obj.length === obj.length + 0) {
	      var key = void 0;
	      var l = void 0;
	      for (key = 0, l = obj.length; key < l; key++) {
	        if (key in obj && itr.call(scope, obj[key], key) === this.BREAK) {
	          return;
	        }
	      }
	    } else {
	      for (var _key in obj) {
	        if (itr.call(scope, obj[_key], _key) === this.BREAK) {
	          return;
	        }
	      }
	    }
	  },
	  defer: function defer(fnc) {
	    setTimeout(fnc, 0);
	  },
	  debounce: function debounce(func, threshold, callImmediately) {
	    var timeout = void 0;
	    return function () {
	      var obj = this;
	      var args = arguments;
	      function delayed() {
	        timeout = null;
	        if (!callImmediately) func.apply(obj, args);
	      }
	      var callNow = callImmediately || !timeout;
	      clearTimeout(timeout);
	      timeout = setTimeout(delayed, threshold);
	      if (callNow) {
	        func.apply(obj, args);
	      }
	    };
	  },
	  toArray: function toArray(obj) {
	    if (obj.toArray) return obj.toArray();
	    return ARR_SLICE.call(obj);
	  },
	  isUndefined: function isUndefined(obj) {
	    return obj === undefined;
	  },
	  isNull: function isNull(obj) {
	    return obj === null;
	  },
	  isNaN: function (_isNaN) {
	    function isNaN(_x) {
	      return _isNaN.apply(this, arguments);
	    }
	    isNaN.toString = function () {
	      return _isNaN.toString();
	    };
	    return isNaN;
	  }(function (obj) {
	    return isNaN(obj);
	  }),
	  isArray: Array.isArray || function (obj) {
	    return obj.constructor === Array;
	  },
	  isObject: function isObject(obj) {
	    return obj === Object(obj);
	  },
	  isNumber: function isNumber(obj) {
	    return obj === obj + 0;
	  },
	  isString: function isString(obj) {
	    return obj === obj + '';
	  },
	  isBoolean: function isBoolean(obj) {
	    return obj === false || obj === true;
	  },
	  isFunction: function isFunction(obj) {
	    return Object.prototype.toString.call(obj) === '[object Function]';
	  }
	};

	var INTERPRETATIONS = [
	{
	  litmus: Common.isString,
	  conversions: {
	    THREE_CHAR_HEX: {
	      read: function read(original) {
	        var test = original.match(/^#([A-F0-9])([A-F0-9])([A-F0-9])$/i);
	        if (test === null) {
	          return false;
	        }
	        return {
	          space: 'HEX',
	          hex: parseInt('0x' + test[1].toString() + test[1].toString() + test[2].toString() + test[2].toString() + test[3].toString() + test[3].toString(), 0)
	        };
	      },
	      write: colorToString
	    },
	    SIX_CHAR_HEX: {
	      read: function read(original) {
	        var test = original.match(/^#([A-F0-9]{6})$/i);
	        if (test === null) {
	          return false;
	        }
	        return {
	          space: 'HEX',
	          hex: parseInt('0x' + test[1].toString(), 0)
	        };
	      },
	      write: colorToString
	    },
	    CSS_RGB: {
	      read: function read(original) {
	        var test = original.match(/^rgb\(\s*(.+)\s*,\s*(.+)\s*,\s*(.+)\s*\)/);
	        if (test === null) {
	          return false;
	        }
	        return {
	          space: 'RGB',
	          r: parseFloat(test[1]),
	          g: parseFloat(test[2]),
	          b: parseFloat(test[3])
	        };
	      },
	      write: colorToString
	    },
	    CSS_RGBA: {
	      read: function read(original) {
	        var test = original.match(/^rgba\(\s*(.+)\s*,\s*(.+)\s*,\s*(.+)\s*,\s*(.+)\s*\)/);
	        if (test === null) {
	          return false;
	        }
	        return {
	          space: 'RGB',
	          r: parseFloat(test[1]),
	          g: parseFloat(test[2]),
	          b: parseFloat(test[3]),
	          a: parseFloat(test[4])
	        };
	      },
	      write: colorToString
	    }
	  }
	},
	{
	  litmus: Common.isNumber,
	  conversions: {
	    HEX: {
	      read: function read(original) {
	        return {
	          space: 'HEX',
	          hex: original,
	          conversionName: 'HEX'
	        };
	      },
	      write: function write(color) {
	        return color.hex;
	      }
	    }
	  }
	},
	{
	  litmus: Common.isArray,
	  conversions: {
	    RGB_ARRAY: {
	      read: function read(original) {
	        if (original.length !== 3) {
	          return false;
	        }
	        return {
	          space: 'RGB',
	          r: original[0],
	          g: original[1],
	          b: original[2]
	        };
	      },
	      write: function write(color) {
	        return [color.r, color.g, color.b];
	      }
	    },
	    RGBA_ARRAY: {
	      read: function read(original) {
	        if (original.length !== 4) return false;
	        return {
	          space: 'RGB',
	          r: original[0],
	          g: original[1],
	          b: original[2],
	          a: original[3]
	        };
	      },
	      write: function write(color) {
	        return [color.r, color.g, color.b, color.a];
	      }
	    }
	  }
	},
	{
	  litmus: Common.isObject,
	  conversions: {
	    RGBA_OBJ: {
	      read: function read(original) {
	        if (Common.isNumber(original.r) && Common.isNumber(original.g) && Common.isNumber(original.b) && Common.isNumber(original.a)) {
	          return {
	            space: 'RGB',
	            r: original.r,
	            g: original.g,
	            b: original.b,
	            a: original.a
	          };
	        }
	        return false;
	      },
	      write: function write(color) {
	        return {
	          r: color.r,
	          g: color.g,
	          b: color.b,
	          a: color.a
	        };
	      }
	    },
	    RGB_OBJ: {
	      read: function read(original) {
	        if (Common.isNumber(original.r) && Common.isNumber(original.g) && Common.isNumber(original.b)) {
	          return {
	            space: 'RGB',
	            r: original.r,
	            g: original.g,
	            b: original.b
	          };
	        }
	        return false;
	      },
	      write: function write(color) {
	        return {
	          r: color.r,
	          g: color.g,
	          b: color.b
	        };
	      }
	    },
	    HSVA_OBJ: {
	      read: function read(original) {
	        if (Common.isNumber(original.h) && Common.isNumber(original.s) && Common.isNumber(original.v) && Common.isNumber(original.a)) {
	          return {
	            space: 'HSV',
	            h: original.h,
	            s: original.s,
	            v: original.v,
	            a: original.a
	          };
	        }
	        return false;
	      },
	      write: function write(color) {
	        return {
	          h: color.h,
	          s: color.s,
	          v: color.v,
	          a: color.a
	        };
	      }
	    },
	    HSV_OBJ: {
	      read: function read(original) {
	        if (Common.isNumber(original.h) && Common.isNumber(original.s) && Common.isNumber(original.v)) {
	          return {
	            space: 'HSV',
	            h: original.h,
	            s: original.s,
	            v: original.v
	          };
	        }
	        return false;
	      },
	      write: function write(color) {
	        return {
	          h: color.h,
	          s: color.s,
	          v: color.v
	        };
	      }
	    }
	  }
	}];
	var result = void 0;
	var toReturn = void 0;
	var interpret = function interpret() {
	  toReturn = false;
	  var original = arguments.length > 1 ? Common.toArray(arguments) : arguments[0];
	  Common.each(INTERPRETATIONS, function (family) {
	    if (family.litmus(original)) {
	      Common.each(family.conversions, function (conversion, conversionName) {
	        result = conversion.read(original);
	        if (toReturn === false && result !== false) {
	          toReturn = result;
	          result.conversionName = conversionName;
	          result.conversion = conversion;
	          return Common.BREAK;
	        }
	      });
	      return Common.BREAK;
	    }
	  });
	  return toReturn;
	};

	var tmpComponent = void 0;
	var ColorMath = {
	  hsv_to_rgb: function hsv_to_rgb(h, s, v) {
	    var hi = Math.floor(h / 60) % 6;
	    var f = h / 60 - Math.floor(h / 60);
	    var p = v * (1.0 - s);
	    var q = v * (1.0 - f * s);
	    var t = v * (1.0 - (1.0 - f) * s);
	    var c = [[v, t, p], [q, v, p], [p, v, t], [p, q, v], [t, p, v], [v, p, q]][hi];
	    return {
	      r: c[0] * 255,
	      g: c[1] * 255,
	      b: c[2] * 255
	    };
	  },
	  rgb_to_hsv: function rgb_to_hsv(r, g, b) {
	    var min = Math.min(r, g, b);
	    var max = Math.max(r, g, b);
	    var delta = max - min;
	    var h = void 0;
	    var s = void 0;
	    if (max !== 0) {
	      s = delta / max;
	    } else {
	      return {
	        h: NaN,
	        s: 0,
	        v: 0
	      };
	    }
	    if (r === max) {
	      h = (g - b) / delta;
	    } else if (g === max) {
	      h = 2 + (b - r) / delta;
	    } else {
	      h = 4 + (r - g) / delta;
	    }
	    h /= 6;
	    if (h < 0) {
	      h += 1;
	    }
	    return {
	      h: h * 360,
	      s: s,
	      v: max / 255
	    };
	  },
	  rgb_to_hex: function rgb_to_hex(r, g, b) {
	    var hex = this.hex_with_component(0, 2, r);
	    hex = this.hex_with_component(hex, 1, g);
	    hex = this.hex_with_component(hex, 0, b);
	    return hex;
	  },
	  component_from_hex: function component_from_hex(hex, componentIndex) {
	    return hex >> componentIndex * 8 & 0xFF;
	  },
	  hex_with_component: function hex_with_component(hex, componentIndex, value) {
	    return value << (tmpComponent = componentIndex * 8) | hex & ~(0xFF << tmpComponent);
	  }
	};

	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
	  return typeof obj;
	} : function (obj) {
	  return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
	};











	var classCallCheck = function (instance, Constructor) {
	  if (!(instance instanceof Constructor)) {
	    throw new TypeError("Cannot call a class as a function");
	  }
	};

	var createClass = function () {
	  function defineProperties(target, props) {
	    for (var i = 0; i < props.length; i++) {
	      var descriptor = props[i];
	      descriptor.enumerable = descriptor.enumerable || false;
	      descriptor.configurable = true;
	      if ("value" in descriptor) descriptor.writable = true;
	      Object.defineProperty(target, descriptor.key, descriptor);
	    }
	  }

	  return function (Constructor, protoProps, staticProps) {
	    if (protoProps) defineProperties(Constructor.prototype, protoProps);
	    if (staticProps) defineProperties(Constructor, staticProps);
	    return Constructor;
	  };
	}();







	var get = function get(object, property, receiver) {
	  if (object === null) object = Function.prototype;
	  var desc = Object.getOwnPropertyDescriptor(object, property);

	  if (desc === undefined) {
	    var parent = Object.getPrototypeOf(object);

	    if (parent === null) {
	      return undefined;
	    } else {
	      return get(parent, property, receiver);
	    }
	  } else if ("value" in desc) {
	    return desc.value;
	  } else {
	    var getter = desc.get;

	    if (getter === undefined) {
	      return undefined;
	    }

	    return getter.call(receiver);
	  }
	};

	var inherits = function (subClass, superClass) {
	  if (typeof superClass !== "function" && superClass !== null) {
	    throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
	  }

	  subClass.prototype = Object.create(superClass && superClass.prototype, {
	    constructor: {
	      value: subClass,
	      enumerable: false,
	      writable: true,
	      configurable: true
	    }
	  });
	  if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
	};











	var possibleConstructorReturn = function (self, call) {
	  if (!self) {
	    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
	  }

	  return call && (typeof call === "object" || typeof call === "function") ? call : self;
	};

	var Color = function () {
	  function Color() {
	    classCallCheck(this, Color);
	    this.__state = interpret.apply(this, arguments);
	    if (this.__state === false) {
	      throw new Error('Failed to interpret color arguments');
	    }
	    this.__state.a = this.__state.a || 1;
	  }
	  createClass(Color, [{
	    key: 'toString',
	    value: function toString() {
	      return colorToString(this);
	    }
	  }, {
	    key: 'toHexString',
	    value: function toHexString() {
	      return colorToString(this, true);
	    }
	  }, {
	    key: 'toOriginal',
	    value: function toOriginal() {
	      return this.__state.conversion.write(this);
	    }
	  }]);
	  return Color;
	}();
	function defineRGBComponent(target, component, componentHexIndex) {
	  Object.defineProperty(target, component, {
	    get: function get$$1() {
	      if (this.__state.space === 'RGB') {
	        return this.__state[component];
	      }
	      Color.recalculateRGB(this, component, componentHexIndex);
	      return this.__state[component];
	    },
	    set: function set$$1(v) {
	      if (this.__state.space !== 'RGB') {
	        Color.recalculateRGB(this, component, componentHexIndex);
	        this.__state.space = 'RGB';
	      }
	      this.__state[component] = v;
	    }
	  });
	}
	function defineHSVComponent(target, component) {
	  Object.defineProperty(target, component, {
	    get: function get$$1() {
	      if (this.__state.space === 'HSV') {
	        return this.__state[component];
	      }
	      Color.recalculateHSV(this);
	      return this.__state[component];
	    },
	    set: function set$$1(v) {
	      if (this.__state.space !== 'HSV') {
	        Color.recalculateHSV(this);
	        this.__state.space = 'HSV';
	      }
	      this.__state[component] = v;
	    }
	  });
	}
	Color.recalculateRGB = function (color, component, componentHexIndex) {
	  if (color.__state.space === 'HEX') {
	    color.__state[component] = ColorMath.component_from_hex(color.__state.hex, componentHexIndex);
	  } else if (color.__state.space === 'HSV') {
	    Common.extend(color.__state, ColorMath.hsv_to_rgb(color.__state.h, color.__state.s, color.__state.v));
	  } else {
	    throw new Error('Corrupted color state');
	  }
	};
	Color.recalculateHSV = function (color) {
	  var result = ColorMath.rgb_to_hsv(color.r, color.g, color.b);
	  Common.extend(color.__state, {
	    s: result.s,
	    v: result.v
	  });
	  if (!Common.isNaN(result.h)) {
	    color.__state.h = result.h;
	  } else if (Common.isUndefined(color.__state.h)) {
	    color.__state.h = 0;
	  }
	};
	Color.COMPONENTS = ['r', 'g', 'b', 'h', 's', 'v', 'hex', 'a'];
	defineRGBComponent(Color.prototype, 'r', 2);
	defineRGBComponent(Color.prototype, 'g', 1);
	defineRGBComponent(Color.prototype, 'b', 0);
	defineHSVComponent(Color.prototype, 'h');
	defineHSVComponent(Color.prototype, 's');
	defineHSVComponent(Color.prototype, 'v');
	Object.defineProperty(Color.prototype, 'a', {
	  get: function get$$1() {
	    return this.__state.a;
	  },
	  set: function set$$1(v) {
	    this.__state.a = v;
	  }
	});
	Object.defineProperty(Color.prototype, 'hex', {
	  get: function get$$1() {
	    if (!this.__state.space !== 'HEX') {
	      this.__state.hex = ColorMath.rgb_to_hex(this.r, this.g, this.b);
	    }
	    return this.__state.hex;
	  },
	  set: function set$$1(v) {
	    this.__state.space = 'HEX';
	    this.__state.hex = v;
	  }
	});

	var Controller = function () {
	  function Controller(object, property) {
	    classCallCheck(this, Controller);
	    this.initialValue = object[property];
	    this.domElement = document.createElement('div');
	    this.object = object;
	    this.property = property;
	    this.__onChange = undefined;
	    this.__onFinishChange = undefined;
	  }
	  createClass(Controller, [{
	    key: 'onChange',
	    value: function onChange(fnc) {
	      this.__onChange = fnc;
	      return this;
	    }
	  }, {
	    key: 'onFinishChange',
	    value: function onFinishChange(fnc) {
	      this.__onFinishChange = fnc;
	      return this;
	    }
	  }, {
	    key: 'setValue',
	    value: function setValue(newValue) {
	      this.object[this.property] = newValue;
	      if (this.__onChange) {
	        this.__onChange.call(this, newValue);
	      }
	      this.updateDisplay();
	      return this;
	    }
	  }, {
	    key: 'getValue',
	    value: function getValue() {
	      return this.object[this.property];
	    }
	  }, {
	    key: 'updateDisplay',
	    value: function updateDisplay() {
	      return this;
	    }
	  }, {
	    key: 'isModified',
	    value: function isModified() {
	      return this.initialValue !== this.getValue();
	    }
	  }]);
	  return Controller;
	}();

	var EVENT_MAP = {
	  HTMLEvents: ['change'],
	  MouseEvents: ['click', 'mousemove', 'mousedown', 'mouseup', 'mouseover'],
	  KeyboardEvents: ['keydown']
	};
	var EVENT_MAP_INV = {};
	Common.each(EVENT_MAP, function (v, k) {
	  Common.each(v, function (e) {
	    EVENT_MAP_INV[e] = k;
	  });
	});
	var CSS_VALUE_PIXELS = /(\d+(\.\d+)?)px/;
	function cssValueToPixels(val) {
	  if (val === '0' || Common.isUndefined(val)) {
	    return 0;
	  }
	  var match = val.match(CSS_VALUE_PIXELS);
	  if (!Common.isNull(match)) {
	    return parseFloat(match[1]);
	  }
	  return 0;
	}
	var dom = {
	  makeSelectable: function makeSelectable(elem, selectable) {
	    if (elem === undefined || elem.style === undefined) return;
	    elem.onselectstart = selectable ? function () {
	      return false;
	    } : function () {};
	    elem.style.MozUserSelect = selectable ? 'auto' : 'none';
	    elem.style.KhtmlUserSelect = selectable ? 'auto' : 'none';
	    elem.unselectable = selectable ? 'on' : 'off';
	  },
	  makeFullscreen: function makeFullscreen(elem, hor, vert) {
	    var vertical = vert;
	    var horizontal = hor;
	    if (Common.isUndefined(horizontal)) {
	      horizontal = true;
	    }
	    if (Common.isUndefined(vertical)) {
	      vertical = true;
	    }
	    elem.style.position = 'absolute';
	    if (horizontal) {
	      elem.style.left = 0;
	      elem.style.right = 0;
	    }
	    if (vertical) {
	      elem.style.top = 0;
	      elem.style.bottom = 0;
	    }
	  },
	  fakeEvent: function fakeEvent(elem, eventType, pars, aux) {
	    var params = pars || {};
	    var className = EVENT_MAP_INV[eventType];
	    if (!className) {
	      throw new Error('Event type ' + eventType + ' not supported.');
	    }
	    var evt = document.createEvent(className);
	    switch (className) {
	      case 'MouseEvents':
	        {
	          var clientX = params.x || params.clientX || 0;
	          var clientY = params.y || params.clientY || 0;
	          evt.initMouseEvent(eventType, params.bubbles || false, params.cancelable || true, window, params.clickCount || 1, 0,
	          0,
	          clientX,
	          clientY,
	          false, false, false, false, 0, null);
	          break;
	        }
	      case 'KeyboardEvents':
	        {
	          var init = evt.initKeyboardEvent || evt.initKeyEvent;
	          Common.defaults(params, {
	            cancelable: true,
	            ctrlKey: false,
	            altKey: false,
	            shiftKey: false,
	            metaKey: false,
	            keyCode: undefined,
	            charCode: undefined
	          });
	          init(eventType, params.bubbles || false, params.cancelable, window, params.ctrlKey, params.altKey, params.shiftKey, params.metaKey, params.keyCode, params.charCode);
	          break;
	        }
	      default:
	        {
	          evt.initEvent(eventType, params.bubbles || false, params.cancelable || true);
	          break;
	        }
	    }
	    Common.defaults(evt, aux);
	    elem.dispatchEvent(evt);
	  },
	  bind: function bind(elem, event, func, newBool) {
	    var bool = newBool || false;
	    if (elem.addEventListener) {
	      elem.addEventListener(event, func, bool);
	    } else if (elem.attachEvent) {
	      elem.attachEvent('on' + event, func);
	    }
	    return dom;
	  },
	  unbind: function unbind(elem, event, func, newBool) {
	    var bool = newBool || false;
	    if (elem.removeEventListener) {
	      elem.removeEventListener(event, func, bool);
	    } else if (elem.detachEvent) {
	      elem.detachEvent('on' + event, func);
	    }
	    return dom;
	  },
	  addClass: function addClass(elem, className) {
	    if (elem.className === undefined) {
	      elem.className = className;
	    } else if (elem.className !== className) {
	      var classes = elem.className.split(/ +/);
	      if (classes.indexOf(className) === -1) {
	        classes.push(className);
	        elem.className = classes.join(' ').replace(/^\s+/, '').replace(/\s+$/, '');
	      }
	    }
	    return dom;
	  },
	  removeClass: function removeClass(elem, className) {
	    if (className) {
	      if (elem.className === className) {
	        elem.removeAttribute('class');
	      } else {
	        var classes = elem.className.split(/ +/);
	        var index = classes.indexOf(className);
	        if (index !== -1) {
	          classes.splice(index, 1);
	          elem.className = classes.join(' ');
	        }
	      }
	    } else {
	      elem.className = undefined;
	    }
	    return dom;
	  },
	  hasClass: function hasClass(elem, className) {
	    return new RegExp('(?:^|\\s+)' + className + '(?:\\s+|$)').test(elem.className) || false;
	  },
	  getWidth: function getWidth(elem) {
	    var style = getComputedStyle(elem);
	    return cssValueToPixels(style['border-left-width']) + cssValueToPixels(style['border-right-width']) + cssValueToPixels(style['padding-left']) + cssValueToPixels(style['padding-right']) + cssValueToPixels(style.width);
	  },
	  getHeight: function getHeight(elem) {
	    var style = getComputedStyle(elem);
	    return cssValueToPixels(style['border-top-width']) + cssValueToPixels(style['border-bottom-width']) + cssValueToPixels(style['padding-top']) + cssValueToPixels(style['padding-bottom']) + cssValueToPixels(style.height);
	  },
	  getOffset: function getOffset(el) {
	    var elem = el;
	    var offset = { left: 0, top: 0 };
	    if (elem.offsetParent) {
	      do {
	        offset.left += elem.offsetLeft;
	        offset.top += elem.offsetTop;
	        elem = elem.offsetParent;
	      } while (elem);
	    }
	    return offset;
	  },
	  isActive: function isActive(elem) {
	    return elem === document.activeElement && (elem.type || elem.href);
	  }
	};

	var BooleanController = function (_Controller) {
	  inherits(BooleanController, _Controller);
	  function BooleanController(object, property) {
	    classCallCheck(this, BooleanController);
	    var _this2 = possibleConstructorReturn(this, (BooleanController.__proto__ || Object.getPrototypeOf(BooleanController)).call(this, object, property));
	    var _this = _this2;
	    _this2.__prev = _this2.getValue();
	    _this2.__checkbox = document.createElement('input');
	    _this2.__checkbox.setAttribute('type', 'checkbox');
	    function onChange() {
	      _this.setValue(!_this.__prev);
	    }
	    dom.bind(_this2.__checkbox, 'change', onChange, false);
	    _this2.domElement.appendChild(_this2.__checkbox);
	    _this2.updateDisplay();
	    return _this2;
	  }
	  createClass(BooleanController, [{
	    key: 'setValue',
	    value: function setValue(v) {
	      var toReturn = get(BooleanController.prototype.__proto__ || Object.getPrototypeOf(BooleanController.prototype), 'setValue', this).call(this, v);
	      if (this.__onFinishChange) {
	        this.__onFinishChange.call(this, this.getValue());
	      }
	      this.__prev = this.getValue();
	      return toReturn;
	    }
	  }, {
	    key: 'updateDisplay',
	    value: function updateDisplay() {
	      if (this.getValue() === true) {
	        this.__checkbox.setAttribute('checked', 'checked');
	        this.__checkbox.checked = true;
	        this.__prev = true;
	      } else {
	        this.__checkbox.checked = false;
	        this.__prev = false;
	      }
	      return get(BooleanController.prototype.__proto__ || Object.getPrototypeOf(BooleanController.prototype), 'updateDisplay', this).call(this);
	    }
	  }]);
	  return BooleanController;
	}(Controller);

	var OptionController = function (_Controller) {
	  inherits(OptionController, _Controller);
	  function OptionController(object, property, opts) {
	    classCallCheck(this, OptionController);
	    var _this2 = possibleConstructorReturn(this, (OptionController.__proto__ || Object.getPrototypeOf(OptionController)).call(this, object, property));
	    var options = opts;
	    var _this = _this2;
	    _this2.__select = document.createElement('select');
	    if (Common.isArray(options)) {
	      var map = {};
	      Common.each(options, function (element) {
	        map[element] = element;
	      });
	      options = map;
	    }
	    Common.each(options, function (value, key) {
	      var opt = document.createElement('option');
	      opt.innerHTML = key;
	      opt.setAttribute('value', value);
	      _this.__select.appendChild(opt);
	    });
	    _this2.updateDisplay();
	    dom.bind(_this2.__select, 'change', function () {
	      var desiredValue = this.options[this.selectedIndex].value;
	      _this.setValue(desiredValue);
	    });
	    _this2.domElement.appendChild(_this2.__select);
	    return _this2;
	  }
	  createClass(OptionController, [{
	    key: 'setValue',
	    value: function setValue(v) {
	      var toReturn = get(OptionController.prototype.__proto__ || Object.getPrototypeOf(OptionController.prototype), 'setValue', this).call(this, v);
	      if (this.__onFinishChange) {
	        this.__onFinishChange.call(this, this.getValue());
	      }
	      return toReturn;
	    }
	  }, {
	    key: 'updateDisplay',
	    value: function updateDisplay() {
	      if (dom.isActive(this.__select)) return this;
	      this.__select.value = this.getValue();
	      return get(OptionController.prototype.__proto__ || Object.getPrototypeOf(OptionController.prototype), 'updateDisplay', this).call(this);
	    }
	  }]);
	  return OptionController;
	}(Controller);

	var StringController = function (_Controller) {
	  inherits(StringController, _Controller);
	  function StringController(object, property) {
	    classCallCheck(this, StringController);
	    var _this2 = possibleConstructorReturn(this, (StringController.__proto__ || Object.getPrototypeOf(StringController)).call(this, object, property));
	    var _this = _this2;
	    function onChange() {
	      _this.setValue(_this.__input.value);
	    }
	    function onBlur() {
	      if (_this.__onFinishChange) {
	        _this.__onFinishChange.call(_this, _this.getValue());
	      }
	    }
	    _this2.__input = document.createElement('input');
	    _this2.__input.setAttribute('type', 'text');
	    dom.bind(_this2.__input, 'keyup', onChange);
	    dom.bind(_this2.__input, 'change', onChange);
	    dom.bind(_this2.__input, 'blur', onBlur);
	    dom.bind(_this2.__input, 'keydown', function (e) {
	      if (e.keyCode === 13) {
	        this.blur();
	      }
	    });
	    _this2.updateDisplay();
	    _this2.domElement.appendChild(_this2.__input);
	    return _this2;
	  }
	  createClass(StringController, [{
	    key: 'updateDisplay',
	    value: function updateDisplay() {
	      if (!dom.isActive(this.__input)) {
	        this.__input.value = this.getValue();
	      }
	      return get(StringController.prototype.__proto__ || Object.getPrototypeOf(StringController.prototype), 'updateDisplay', this).call(this);
	    }
	  }]);
	  return StringController;
	}(Controller);

	function numDecimals(x) {
	  var _x = x.toString();
	  if (_x.indexOf('.') > -1) {
	    return _x.length - _x.indexOf('.') - 1;
	  }
	  return 0;
	}
	var NumberController = function (_Controller) {
	  inherits(NumberController, _Controller);
	  function NumberController(object, property, params) {
	    classCallCheck(this, NumberController);
	    var _this = possibleConstructorReturn(this, (NumberController.__proto__ || Object.getPrototypeOf(NumberController)).call(this, object, property));
	    var _params = params || {};
	    _this.__min = _params.min;
	    _this.__max = _params.max;
	    _this.__step = _params.step;
	    if (Common.isUndefined(_this.__step)) {
	      if (_this.initialValue === 0) {
	        _this.__impliedStep = 1;
	      } else {
	        _this.__impliedStep = Math.pow(10, Math.floor(Math.log(Math.abs(_this.initialValue)) / Math.LN10)) / 10;
	      }
	    } else {
	      _this.__impliedStep = _this.__step;
	    }
	    _this.__precision = numDecimals(_this.__impliedStep);
	    return _this;
	  }
	  createClass(NumberController, [{
	    key: 'setValue',
	    value: function setValue(v) {
	      var _v = v;
	      if (this.__min !== undefined && _v < this.__min) {
	        _v = this.__min;
	      } else if (this.__max !== undefined && _v > this.__max) {
	        _v = this.__max;
	      }
	      if (this.__step !== undefined && _v % this.__step !== 0) {
	        _v = Math.round(_v / this.__step) * this.__step;
	      }
	      return get(NumberController.prototype.__proto__ || Object.getPrototypeOf(NumberController.prototype), 'setValue', this).call(this, _v);
	    }
	  }, {
	    key: 'min',
	    value: function min(minValue) {
	      this.__min = minValue;
	      return this;
	    }
	  }, {
	    key: 'max',
	    value: function max(maxValue) {
	      this.__max = maxValue;
	      return this;
	    }
	  }, {
	    key: 'step',
	    value: function step(stepValue) {
	      this.__step = stepValue;
	      this.__impliedStep = stepValue;
	      this.__precision = numDecimals(stepValue);
	      return this;
	    }
	  }]);
	  return NumberController;
	}(Controller);

	function roundToDecimal(value, decimals) {
	  var tenTo = Math.pow(10, decimals);
	  return Math.round(value * tenTo) / tenTo;
	}
	var NumberControllerBox = function (_NumberController) {
	  inherits(NumberControllerBox, _NumberController);
	  function NumberControllerBox(object, property, params) {
	    classCallCheck(this, NumberControllerBox);
	    var _this2 = possibleConstructorReturn(this, (NumberControllerBox.__proto__ || Object.getPrototypeOf(NumberControllerBox)).call(this, object, property, params));
	    _this2.__truncationSuspended = false;
	    var _this = _this2;
	    var prevY = void 0;
	    function onChange() {
	      var attempted = parseFloat(_this.__input.value);
	      if (!Common.isNaN(attempted)) {
	        _this.setValue(attempted);
	      }
	    }
	    function onFinish() {
	      if (_this.__onFinishChange) {
	        _this.__onFinishChange.call(_this, _this.getValue());
	      }
	    }
	    function onBlur() {
	      onFinish();
	    }
	    function onMouseDrag(e) {
	      var diff = prevY - e.clientY;
	      _this.setValue(_this.getValue() + diff * _this.__impliedStep);
	      prevY = e.clientY;
	    }
	    function onMouseUp() {
	      dom.unbind(window, 'mousemove', onMouseDrag);
	      dom.unbind(window, 'mouseup', onMouseUp);
	      onFinish();
	    }
	    function onMouseDown(e) {
	      dom.bind(window, 'mousemove', onMouseDrag);
	      dom.bind(window, 'mouseup', onMouseUp);
	      prevY = e.clientY;
	    }
	    _this2.__input = document.createElement('input');
	    _this2.__input.setAttribute('type', 'text');
	    dom.bind(_this2.__input, 'change', onChange);
	    dom.bind(_this2.__input, 'blur', onBlur);
	    dom.bind(_this2.__input, 'mousedown', onMouseDown);
	    dom.bind(_this2.__input, 'keydown', function (e) {
	      if (e.keyCode === 13) {
	        _this.__truncationSuspended = true;
	        this.blur();
	        _this.__truncationSuspended = false;
	        onFinish();
	      }
	    });
	    _this2.updateDisplay();
	    _this2.domElement.appendChild(_this2.__input);
	    return _this2;
	  }
	  createClass(NumberControllerBox, [{
	    key: 'updateDisplay',
	    value: function updateDisplay() {
	      this.__input.value = this.__truncationSuspended ? this.getValue() : roundToDecimal(this.getValue(), this.__precision);
	      return get(NumberControllerBox.prototype.__proto__ || Object.getPrototypeOf(NumberControllerBox.prototype), 'updateDisplay', this).call(this);
	    }
	  }]);
	  return NumberControllerBox;
	}(NumberController);

	function map(v, i1, i2, o1, o2) {
	  return o1 + (o2 - o1) * ((v - i1) / (i2 - i1));
	}
	var NumberControllerSlider = function (_NumberController) {
	  inherits(NumberControllerSlider, _NumberController);
	  function NumberControllerSlider(object, property, min, max, step) {
	    classCallCheck(this, NumberControllerSlider);
	    var _this2 = possibleConstructorReturn(this, (NumberControllerSlider.__proto__ || Object.getPrototypeOf(NumberControllerSlider)).call(this, object, property, { min: min, max: max, step: step }));
	    var _this = _this2;
	    _this2.__background = document.createElement('div');
	    _this2.__foreground = document.createElement('div');
	    dom.bind(_this2.__background, 'mousedown', onMouseDown);
	    dom.bind(_this2.__background, 'touchstart', onTouchStart);
	    dom.addClass(_this2.__background, 'slider');
	    dom.addClass(_this2.__foreground, 'slider-fg');
	    function onMouseDown(e) {
	      document.activeElement.blur();
	      dom.bind(window, 'mousemove', onMouseDrag);
	      dom.bind(window, 'mouseup', onMouseUp);
	      onMouseDrag(e);
	    }
	    function onMouseDrag(e) {
	      e.preventDefault();
	      var bgRect = _this.__background.getBoundingClientRect();
	      _this.setValue(map(e.clientX, bgRect.left, bgRect.right, _this.__min, _this.__max));
	      return false;
	    }
	    function onMouseUp() {
	      dom.unbind(window, 'mousemove', onMouseDrag);
	      dom.unbind(window, 'mouseup', onMouseUp);
	      if (_this.__onFinishChange) {
	        _this.__onFinishChange.call(_this, _this.getValue());
	      }
	    }
	    function onTouchStart(e) {
	      if (e.touches.length !== 1) {
	        return;
	      }
	      dom.bind(window, 'touchmove', onTouchMove);
	      dom.bind(window, 'touchend', onTouchEnd);
	      onTouchMove(e);
	    }
	    function onTouchMove(e) {
	      var clientX = e.touches[0].clientX;
	      var bgRect = _this.__background.getBoundingClientRect();
	      _this.setValue(map(clientX, bgRect.left, bgRect.right, _this.__min, _this.__max));
	    }
	    function onTouchEnd() {
	      dom.unbind(window, 'touchmove', onTouchMove);
	      dom.unbind(window, 'touchend', onTouchEnd);
	      if (_this.__onFinishChange) {
	        _this.__onFinishChange.call(_this, _this.getValue());
	      }
	    }
	    _this2.updateDisplay();
	    _this2.__background.appendChild(_this2.__foreground);
	    _this2.domElement.appendChild(_this2.__background);
	    return _this2;
	  }
	  createClass(NumberControllerSlider, [{
	    key: 'updateDisplay',
	    value: function updateDisplay() {
	      var pct = (this.getValue() - this.__min) / (this.__max - this.__min);
	      this.__foreground.style.width = pct * 100 + '%';
	      return get(NumberControllerSlider.prototype.__proto__ || Object.getPrototypeOf(NumberControllerSlider.prototype), 'updateDisplay', this).call(this);
	    }
	  }]);
	  return NumberControllerSlider;
	}(NumberController);

	var FunctionController = function (_Controller) {
	  inherits(FunctionController, _Controller);
	  function FunctionController(object, property, text) {
	    classCallCheck(this, FunctionController);
	    var _this2 = possibleConstructorReturn(this, (FunctionController.__proto__ || Object.getPrototypeOf(FunctionController)).call(this, object, property));
	    var _this = _this2;
	    _this2.__button = document.createElement('div');
	    _this2.__button.innerHTML = text === undefined ? 'Fire' : text;
	    dom.bind(_this2.__button, 'click', function (e) {
	      e.preventDefault();
	      _this.fire();
	      return false;
	    });
	    dom.addClass(_this2.__button, 'button');
	    _this2.domElement.appendChild(_this2.__button);
	    return _this2;
	  }
	  createClass(FunctionController, [{
	    key: 'fire',
	    value: function fire() {
	      if (this.__onChange) {
	        this.__onChange.call(this);
	      }
	      this.getValue().call(this.object);
	      if (this.__onFinishChange) {
	        this.__onFinishChange.call(this, this.getValue());
	      }
	    }
	  }]);
	  return FunctionController;
	}(Controller);

	var ColorController = function (_Controller) {
	  inherits(ColorController, _Controller);
	  function ColorController(object, property) {
	    classCallCheck(this, ColorController);
	    var _this2 = possibleConstructorReturn(this, (ColorController.__proto__ || Object.getPrototypeOf(ColorController)).call(this, object, property));
	    _this2.__color = new Color(_this2.getValue());
	    _this2.__temp = new Color(0);
	    var _this = _this2;
	    _this2.domElement = document.createElement('div');
	    dom.makeSelectable(_this2.domElement, false);
	    _this2.__selector = document.createElement('div');
	    _this2.__selector.className = 'selector';
	    _this2.__saturation_field = document.createElement('div');
	    _this2.__saturation_field.className = 'saturation-field';
	    _this2.__field_knob = document.createElement('div');
	    _this2.__field_knob.className = 'field-knob';
	    _this2.__field_knob_border = '2px solid ';
	    _this2.__hue_knob = document.createElement('div');
	    _this2.__hue_knob.className = 'hue-knob';
	    _this2.__hue_field = document.createElement('div');
	    _this2.__hue_field.className = 'hue-field';
	    _this2.__input = document.createElement('input');
	    _this2.__input.type = 'text';
	    _this2.__input_textShadow = '0 1px 1px ';
	    dom.bind(_this2.__input, 'keydown', function (e) {
	      if (e.keyCode === 13) {
	        onBlur.call(this);
	      }
	    });
	    dom.bind(_this2.__input, 'blur', onBlur);
	    dom.bind(_this2.__selector, 'mousedown', function ()        {
	      dom.addClass(this, 'drag').bind(window, 'mouseup', function ()        {
	        dom.removeClass(_this.__selector, 'drag');
	      });
	    });
	    dom.bind(_this2.__selector, 'touchstart', function ()        {
	      dom.addClass(this, 'drag').bind(window, 'touchend', function ()        {
	        dom.removeClass(_this.__selector, 'drag');
	      });
	    });
	    var valueField = document.createElement('div');
	    Common.extend(_this2.__selector.style, {
	      width: '122px',
	      height: '102px',
	      padding: '3px',
	      backgroundColor: '#222',
	      boxShadow: '0px 1px 3px rgba(0,0,0,0.3)'
	    });
	    Common.extend(_this2.__field_knob.style, {
	      position: 'absolute',
	      width: '12px',
	      height: '12px',
	      border: _this2.__field_knob_border + (_this2.__color.v < 0.5 ? '#fff' : '#000'),
	      boxShadow: '0px 1px 3px rgba(0,0,0,0.5)',
	      borderRadius: '12px',
	      zIndex: 1
	    });
	    Common.extend(_this2.__hue_knob.style, {
	      position: 'absolute',
	      width: '15px',
	      height: '2px',
	      borderRight: '4px solid #fff',
	      zIndex: 1
	    });
	    Common.extend(_this2.__saturation_field.style, {
	      width: '100px',
	      height: '100px',
	      border: '1px solid #555',
	      marginRight: '3px',
	      display: 'inline-block',
	      cursor: 'pointer'
	    });
	    Common.extend(valueField.style, {
	      width: '100%',
	      height: '100%',
	      background: 'none'
	    });
	    linearGradient(valueField, 'top', 'rgba(0,0,0,0)', '#000');
	    Common.extend(_this2.__hue_field.style, {
	      width: '15px',
	      height: '100px',
	      border: '1px solid #555',
	      cursor: 'ns-resize',
	      position: 'absolute',
	      top: '3px',
	      right: '3px'
	    });
	    hueGradient(_this2.__hue_field);
	    Common.extend(_this2.__input.style, {
	      outline: 'none',
	      textAlign: 'center',
	      color: '#fff',
	      border: 0,
	      fontWeight: 'bold',
	      textShadow: _this2.__input_textShadow + 'rgba(0,0,0,0.7)'
	    });
	    dom.bind(_this2.__saturation_field, 'mousedown', fieldDown);
	    dom.bind(_this2.__saturation_field, 'touchstart', fieldDown);
	    dom.bind(_this2.__field_knob, 'mousedown', fieldDown);
	    dom.bind(_this2.__field_knob, 'touchstart', fieldDown);
	    dom.bind(_this2.__hue_field, 'mousedown', fieldDownH);
	    dom.bind(_this2.__hue_field, 'touchstart', fieldDownH);
	    function fieldDown(e) {
	      setSV(e);
	      dom.bind(window, 'mousemove', setSV);
	      dom.bind(window, 'touchmove', setSV);
	      dom.bind(window, 'mouseup', fieldUpSV);
	      dom.bind(window, 'touchend', fieldUpSV);
	    }
	    function fieldDownH(e) {
	      setH(e);
	      dom.bind(window, 'mousemove', setH);
	      dom.bind(window, 'touchmove', setH);
	      dom.bind(window, 'mouseup', fieldUpH);
	      dom.bind(window, 'touchend', fieldUpH);
	    }
	    function fieldUpSV() {
	      dom.unbind(window, 'mousemove', setSV);
	      dom.unbind(window, 'touchmove', setSV);
	      dom.unbind(window, 'mouseup', fieldUpSV);
	      dom.unbind(window, 'touchend', fieldUpSV);
	      onFinish();
	    }
	    function fieldUpH() {
	      dom.unbind(window, 'mousemove', setH);
	      dom.unbind(window, 'touchmove', setH);
	      dom.unbind(window, 'mouseup', fieldUpH);
	      dom.unbind(window, 'touchend', fieldUpH);
	      onFinish();
	    }
	    function onBlur() {
	      var i = interpret(this.value);
	      if (i !== false) {
	        _this.__color.__state = i;
	        _this.setValue(_this.__color.toOriginal());
	      } else {
	        this.value = _this.__color.toString();
	      }
	    }
	    function onFinish() {
	      if (_this.__onFinishChange) {
	        _this.__onFinishChange.call(_this, _this.__color.toOriginal());
	      }
	    }
	    _this2.__saturation_field.appendChild(valueField);
	    _this2.__selector.appendChild(_this2.__field_knob);
	    _this2.__selector.appendChild(_this2.__saturation_field);
	    _this2.__selector.appendChild(_this2.__hue_field);
	    _this2.__hue_field.appendChild(_this2.__hue_knob);
	    _this2.domElement.appendChild(_this2.__input);
	    _this2.domElement.appendChild(_this2.__selector);
	    _this2.updateDisplay();
	    function setSV(e) {
	      if (e.type.indexOf('touch') === -1) {
	        e.preventDefault();
	      }
	      var fieldRect = _this.__saturation_field.getBoundingClientRect();
	      var _ref = e.touches && e.touches[0] || e,
	          clientX = _ref.clientX,
	          clientY = _ref.clientY;
	      var s = (clientX - fieldRect.left) / (fieldRect.right - fieldRect.left);
	      var v = 1 - (clientY - fieldRect.top) / (fieldRect.bottom - fieldRect.top);
	      if (v > 1) {
	        v = 1;
	      } else if (v < 0) {
	        v = 0;
	      }
	      if (s > 1) {
	        s = 1;
	      } else if (s < 0) {
	        s = 0;
	      }
	      _this.__color.v = v;
	      _this.__color.s = s;
	      _this.setValue(_this.__color.toOriginal());
	      return false;
	    }
	    function setH(e) {
	      if (e.type.indexOf('touch') === -1) {
	        e.preventDefault();
	      }
	      var fieldRect = _this.__hue_field.getBoundingClientRect();
	      var _ref2 = e.touches && e.touches[0] || e,
	          clientY = _ref2.clientY;
	      var h = 1 - (clientY - fieldRect.top) / (fieldRect.bottom - fieldRect.top);
	      if (h > 1) {
	        h = 1;
	      } else if (h < 0) {
	        h = 0;
	      }
	      _this.__color.h = h * 360;
	      _this.setValue(_this.__color.toOriginal());
	      return false;
	    }
	    return _this2;
	  }
	  createClass(ColorController, [{
	    key: 'updateDisplay',
	    value: function updateDisplay() {
	      var i = interpret(this.getValue());
	      if (i !== false) {
	        var mismatch = false;
	        Common.each(Color.COMPONENTS, function (component) {
	          if (!Common.isUndefined(i[component]) && !Common.isUndefined(this.__color.__state[component]) && i[component] !== this.__color.__state[component]) {
	            mismatch = true;
	            return {};
	          }
	        }, this);
	        if (mismatch) {
	          Common.extend(this.__color.__state, i);
	        }
	      }
	      Common.extend(this.__temp.__state, this.__color.__state);
	      this.__temp.a = 1;
	      var flip = this.__color.v < 0.5 || this.__color.s > 0.5 ? 255 : 0;
	      var _flip = 255 - flip;
	      Common.extend(this.__field_knob.style, {
	        marginLeft: 100 * this.__color.s - 7 + 'px',
	        marginTop: 100 * (1 - this.__color.v) - 7 + 'px',
	        backgroundColor: this.__temp.toHexString(),
	        border: this.__field_knob_border + 'rgb(' + flip + ',' + flip + ',' + flip + ')'
	      });
	      this.__hue_knob.style.marginTop = (1 - this.__color.h / 360) * 100 + 'px';
	      this.__temp.s = 1;
	      this.__temp.v = 1;
	      linearGradient(this.__saturation_field, 'left', '#fff', this.__temp.toHexString());
	      this.__input.value = this.__color.toString();
	      Common.extend(this.__input.style, {
	        backgroundColor: this.__color.toHexString(),
	        color: 'rgb(' + flip + ',' + flip + ',' + flip + ')',
	        textShadow: this.__input_textShadow + 'rgba(' + _flip + ',' + _flip + ',' + _flip + ',.7)'
	      });
	    }
	  }]);
	  return ColorController;
	}(Controller);
	var vendors$1 = ['-moz-', '-o-', '-webkit-', '-ms-', ''];
	function linearGradient(elem, x, a, b) {
	  elem.style.background = '';
	  Common.each(vendors$1, function (vendor) {
	    elem.style.cssText += 'background: ' + vendor + 'linear-gradient(' + x + ', ' + a + ' 0%, ' + b + ' 100%); ';
	  });
	}
	function hueGradient(elem) {
	  elem.style.background = '';
	  elem.style.cssText += 'background: -moz-linear-gradient(top,  #ff0000 0%, #ff00ff 17%, #0000ff 34%, #00ffff 50%, #00ff00 67%, #ffff00 84%, #ff0000 100%);';
	  elem.style.cssText += 'background: -webkit-linear-gradient(top,  #ff0000 0%,#ff00ff 17%,#0000ff 34%,#00ffff 50%,#00ff00 67%,#ffff00 84%,#ff0000 100%);';
	  elem.style.cssText += 'background: -o-linear-gradient(top,  #ff0000 0%,#ff00ff 17%,#0000ff 34%,#00ffff 50%,#00ff00 67%,#ffff00 84%,#ff0000 100%);';
	  elem.style.cssText += 'background: -ms-linear-gradient(top,  #ff0000 0%,#ff00ff 17%,#0000ff 34%,#00ffff 50%,#00ff00 67%,#ffff00 84%,#ff0000 100%);';
	  elem.style.cssText += 'background: linear-gradient(top,  #ff0000 0%,#ff00ff 17%,#0000ff 34%,#00ffff 50%,#00ff00 67%,#ffff00 84%,#ff0000 100%);';
	}

	var css = {
	  load: function load(url, indoc) {
	    var doc = indoc || document;
	    var link = doc.createElement('link');
	    link.type = 'text/css';
	    link.rel = 'stylesheet';
	    link.href = url;
	    doc.getElementsByTagName('head')[0].appendChild(link);
	  },
	  inject: function inject(cssContent, indoc) {
	    var doc = indoc || document;
	    var injected = document.createElement('style');
	    injected.type = 'text/css';
	    injected.innerHTML = cssContent;
	    var head = doc.getElementsByTagName('head')[0];
	    try {
	      head.appendChild(injected);
	    } catch (e) {
	    }
	  }
	};

	var saveDialogContents = "<div id=\"dg-save\" class=\"dg dialogue\">\n\n  Here's the new load parameter for your <code>GUI</code>'s constructor:\n\n  <textarea id=\"dg-new-constructor\"></textarea>\n\n  <div id=\"dg-save-locally\">\n\n    <input id=\"dg-local-storage\" type=\"checkbox\"/> Automatically save\n    values to <code>localStorage</code> on exit.\n\n    <div id=\"dg-local-explain\">The values saved to <code>localStorage</code> will\n      override those passed to <code>dat.GUI</code>'s constructor. This makes it\n      easier to work incrementally, but <code>localStorage</code> is fragile,\n      and your friends may not see the same values you do.\n\n    </div>\n\n  </div>\n\n</div>";

	var ControllerFactory = function ControllerFactory(object, property) {
	  var initialValue = object[property];
	  if (Common.isArray(arguments[2]) || Common.isObject(arguments[2])) {
	    return new OptionController(object, property, arguments[2]);
	  }
	  if (Common.isNumber(initialValue)) {
	    if (Common.isNumber(arguments[2]) && Common.isNumber(arguments[3])) {
	      if (Common.isNumber(arguments[4])) {
	        return new NumberControllerSlider(object, property, arguments[2], arguments[3], arguments[4]);
	      }
	      return new NumberControllerSlider(object, property, arguments[2], arguments[3]);
	    }
	    if (Common.isNumber(arguments[4])) {
	      return new NumberControllerBox(object, property, { min: arguments[2], max: arguments[3], step: arguments[4] });
	    }
	    return new NumberControllerBox(object, property, { min: arguments[2], max: arguments[3] });
	  }
	  if (Common.isString(initialValue)) {
	    return new StringController(object, property);
	  }
	  if (Common.isFunction(initialValue)) {
	    return new FunctionController(object, property, '');
	  }
	  if (Common.isBoolean(initialValue)) {
	    return new BooleanController(object, property);
	  }
	  return null;
	};

	function requestAnimationFrame(callback) {
	  setTimeout(callback, 1000 / 60);
	}
	var requestAnimationFrame$1 = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || requestAnimationFrame;

	var CenteredDiv = function () {
	  function CenteredDiv() {
	    classCallCheck(this, CenteredDiv);
	    this.backgroundElement = document.createElement('div');
	    Common.extend(this.backgroundElement.style, {
	      backgroundColor: 'rgba(0,0,0,0.8)',
	      top: 0,
	      left: 0,
	      display: 'none',
	      zIndex: '1000',
	      opacity: 0,
	      WebkitTransition: 'opacity 0.2s linear',
	      transition: 'opacity 0.2s linear'
	    });
	    dom.makeFullscreen(this.backgroundElement);
	    this.backgroundElement.style.position = 'fixed';
	    this.domElement = document.createElement('div');
	    Common.extend(this.domElement.style, {
	      position: 'fixed',
	      display: 'none',
	      zIndex: '1001',
	      opacity: 0,
	      WebkitTransition: '-webkit-transform 0.2s ease-out, opacity 0.2s linear',
	      transition: 'transform 0.2s ease-out, opacity 0.2s linear'
	    });
	    document.body.appendChild(this.backgroundElement);
	    document.body.appendChild(this.domElement);
	    var _this = this;
	    dom.bind(this.backgroundElement, 'click', function () {
	      _this.hide();
	    });
	  }
	  createClass(CenteredDiv, [{
	    key: 'show',
	    value: function show() {
	      var _this = this;
	      this.backgroundElement.style.display = 'block';
	      this.domElement.style.display = 'block';
	      this.domElement.style.opacity = 0;
	      this.domElement.style.webkitTransform = 'scale(1.1)';
	      this.layout();
	      Common.defer(function () {
	        _this.backgroundElement.style.opacity = 1;
	        _this.domElement.style.opacity = 1;
	        _this.domElement.style.webkitTransform = 'scale(1)';
	      });
	    }
	  }, {
	    key: 'hide',
	    value: function hide() {
	      var _this = this;
	      var hide = function hide() {
	        _this.domElement.style.display = 'none';
	        _this.backgroundElement.style.display = 'none';
	        dom.unbind(_this.domElement, 'webkitTransitionEnd', hide);
	        dom.unbind(_this.domElement, 'transitionend', hide);
	        dom.unbind(_this.domElement, 'oTransitionEnd', hide);
	      };
	      dom.bind(this.domElement, 'webkitTransitionEnd', hide);
	      dom.bind(this.domElement, 'transitionend', hide);
	      dom.bind(this.domElement, 'oTransitionEnd', hide);
	      this.backgroundElement.style.opacity = 0;
	      this.domElement.style.opacity = 0;
	      this.domElement.style.webkitTransform = 'scale(1.1)';
	    }
	  }, {
	    key: 'layout',
	    value: function layout() {
	      this.domElement.style.left = window.innerWidth / 2 - dom.getWidth(this.domElement) / 2 + 'px';
	      this.domElement.style.top = window.innerHeight / 2 - dom.getHeight(this.domElement) / 2 + 'px';
	    }
	  }]);
	  return CenteredDiv;
	}();

	var styleSheet = ___$insertStyle(".dg ul{list-style:none;margin:0;padding:0;width:100%;clear:both}.dg.ac{position:fixed;top:0;left:0;right:0;height:0;z-index:0}.dg:not(.ac) .main{overflow:hidden}.dg.main{-webkit-transition:opacity .1s linear;-o-transition:opacity .1s linear;-moz-transition:opacity .1s linear;transition:opacity .1s linear}.dg.main.taller-than-window{overflow-y:auto}.dg.main.taller-than-window .close-button{opacity:1;margin-top:-1px;border-top:1px solid #2c2c2c}.dg.main ul.closed .close-button{opacity:1 !important}.dg.main:hover .close-button,.dg.main .close-button.drag{opacity:1}.dg.main .close-button{-webkit-transition:opacity .1s linear;-o-transition:opacity .1s linear;-moz-transition:opacity .1s linear;transition:opacity .1s linear;border:0;line-height:19px;height:20px;cursor:pointer;text-align:center;background-color:#000}.dg.main .close-button.close-top{position:relative}.dg.main .close-button.close-bottom{position:absolute}.dg.main .close-button:hover{background-color:#111}.dg.a{float:right;margin-right:15px;overflow-y:visible}.dg.a.has-save>ul.close-top{margin-top:0}.dg.a.has-save>ul.close-bottom{margin-top:27px}.dg.a.has-save>ul.closed{margin-top:0}.dg.a .save-row{top:0;z-index:1002}.dg.a .save-row.close-top{position:relative}.dg.a .save-row.close-bottom{position:fixed}.dg li{-webkit-transition:height .1s ease-out;-o-transition:height .1s ease-out;-moz-transition:height .1s ease-out;transition:height .1s ease-out;-webkit-transition:overflow .1s linear;-o-transition:overflow .1s linear;-moz-transition:overflow .1s linear;transition:overflow .1s linear}.dg li:not(.folder){cursor:auto;height:27px;line-height:27px;padding:0 4px 0 5px}.dg li.folder{padding:0;border-left:4px solid rgba(0,0,0,0)}.dg li.title{cursor:pointer;margin-left:-4px}.dg .closed li:not(.title),.dg .closed ul li,.dg .closed ul li>*{height:0;overflow:hidden;border:0}.dg .cr{clear:both;padding-left:3px;height:27px;overflow:hidden}.dg .property-name{cursor:default;float:left;clear:left;width:40%;overflow:hidden;text-overflow:ellipsis}.dg .c{float:left;width:60%;position:relative}.dg .c input[type=text]{border:0;margin-top:4px;padding:3px;width:100%;float:right}.dg .has-slider input[type=text]{width:30%;margin-left:0}.dg .slider{float:left;width:66%;margin-left:-5px;margin-right:0;height:19px;margin-top:4px}.dg .slider-fg{height:100%}.dg .c input[type=checkbox]{margin-top:7px}.dg .c select{margin-top:5px}.dg .cr.function,.dg .cr.function .property-name,.dg .cr.function *,.dg .cr.boolean,.dg .cr.boolean *{cursor:pointer}.dg .cr.color{overflow:visible}.dg .selector{display:none;position:absolute;margin-left:-9px;margin-top:23px;z-index:10}.dg .c:hover .selector,.dg .selector.drag{display:block}.dg li.save-row{padding:0}.dg li.save-row .button{display:inline-block;padding:0px 6px}.dg.dialogue{background-color:#222;width:460px;padding:15px;font-size:13px;line-height:15px}#dg-new-constructor{padding:10px;color:#222;font-family:Monaco, monospace;font-size:10px;border:0;resize:none;box-shadow:inset 1px 1px 1px #888;word-wrap:break-word;margin:12px 0;display:block;width:440px;overflow-y:scroll;height:100px;position:relative}#dg-local-explain{display:none;font-size:11px;line-height:17px;border-radius:3px;background-color:#333;padding:8px;margin-top:10px}#dg-local-explain code{font-size:10px}#dat-gui-save-locally{display:none}.dg{color:#eee;font:11px 'Lucida Grande', sans-serif;text-shadow:0 -1px 0 #111}.dg.main::-webkit-scrollbar{width:5px;background:#1a1a1a}.dg.main::-webkit-scrollbar-corner{height:0;display:none}.dg.main::-webkit-scrollbar-thumb{border-radius:5px;background:#676767}.dg li:not(.folder){background:#1a1a1a;border-bottom:1px solid #2c2c2c}.dg li.save-row{line-height:25px;background:#dad5cb;border:0}.dg li.save-row select{margin-left:5px;width:108px}.dg li.save-row .button{margin-left:5px;margin-top:1px;border-radius:2px;font-size:9px;line-height:7px;padding:4px 4px 5px 4px;background:#c5bdad;color:#fff;text-shadow:0 1px 0 #b0a58f;box-shadow:0 -1px 0 #b0a58f;cursor:pointer}.dg li.save-row .button.gears{background:#c5bdad url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAANCAYAAAB/9ZQ7AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAQJJREFUeNpiYKAU/P//PwGIC/ApCABiBSAW+I8AClAcgKxQ4T9hoMAEUrxx2QSGN6+egDX+/vWT4e7N82AMYoPAx/evwWoYoSYbACX2s7KxCxzcsezDh3evFoDEBYTEEqycggWAzA9AuUSQQgeYPa9fPv6/YWm/Acx5IPb7ty/fw+QZblw67vDs8R0YHyQhgObx+yAJkBqmG5dPPDh1aPOGR/eugW0G4vlIoTIfyFcA+QekhhHJhPdQxbiAIguMBTQZrPD7108M6roWYDFQiIAAv6Aow/1bFwXgis+f2LUAynwoIaNcz8XNx3Dl7MEJUDGQpx9gtQ8YCueB+D26OECAAQDadt7e46D42QAAAABJRU5ErkJggg==) 2px 1px no-repeat;height:7px;width:8px}.dg li.save-row .button:hover{background-color:#bab19e;box-shadow:0 -1px 0 #b0a58f}.dg li.folder{border-bottom:0}.dg li.title{padding-left:16px;background:#000 url(data:image/gif;base64,R0lGODlhBQAFAJEAAP////Pz8////////yH5BAEAAAIALAAAAAAFAAUAAAIIlI+hKgFxoCgAOw==) 6px 10px no-repeat;cursor:pointer;border-bottom:1px solid rgba(255,255,255,0.2)}.dg .closed li.title{background-image:url(data:image/gif;base64,R0lGODlhBQAFAJEAAP////Pz8////////yH5BAEAAAIALAAAAAAFAAUAAAIIlGIWqMCbWAEAOw==)}.dg .cr.boolean{border-left:3px solid #806787}.dg .cr.color{border-left:3px solid}.dg .cr.function{border-left:3px solid #e61d5f}.dg .cr.number{border-left:3px solid #2FA1D6}.dg .cr.number input[type=text]{color:#2FA1D6}.dg .cr.string{border-left:3px solid #1ed36f}.dg .cr.string input[type=text]{color:#1ed36f}.dg .cr.function:hover,.dg .cr.boolean:hover{background:#111}.dg .c input[type=text]{background:#303030;outline:none}.dg .c input[type=text]:hover{background:#3c3c3c}.dg .c input[type=text]:focus{background:#494949;color:#fff}.dg .c .slider{background:#303030;cursor:ew-resize}.dg .c .slider-fg{background:#2FA1D6;max-width:100%}.dg .c .slider:hover{background:#3c3c3c}.dg .c .slider:hover .slider-fg{background:#44abda}\n");

	css.inject(styleSheet);
	var CSS_NAMESPACE = 'dg';
	var HIDE_KEY_CODE = 72;
	var CLOSE_BUTTON_HEIGHT = 20;
	var DEFAULT_DEFAULT_PRESET_NAME = 'Default';
	var SUPPORTS_LOCAL_STORAGE = function () {
	  try {
	    return !!window.localStorage;
	  } catch (e) {
	    return false;
	  }
	}();
	var SAVE_DIALOGUE = void 0;
	var autoPlaceVirgin = true;
	var autoPlaceContainer = void 0;
	var hide = false;
	var hideableGuis = [];
	var GUI = function GUI(pars) {
	  var _this = this;
	  var params = pars || {};
	  this.domElement = document.createElement('div');
	  this.__ul = document.createElement('ul');
	  this.domElement.appendChild(this.__ul);
	  dom.addClass(this.domElement, CSS_NAMESPACE);
	  this.__folders = {};
	  this.__controllers = [];
	  this.__rememberedObjects = [];
	  this.__rememberedObjectIndecesToControllers = [];
	  this.__listening = [];
	  params = Common.defaults(params, {
	    closeOnTop: false,
	    autoPlace: true,
	    width: GUI.DEFAULT_WIDTH
	  });
	  params = Common.defaults(params, {
	    resizable: params.autoPlace,
	    hideable: params.autoPlace
	  });
	  if (!Common.isUndefined(params.load)) {
	    if (params.preset) {
	      params.load.preset = params.preset;
	    }
	  } else {
	    params.load = { preset: DEFAULT_DEFAULT_PRESET_NAME };
	  }
	  if (Common.isUndefined(params.parent) && params.hideable) {
	    hideableGuis.push(this);
	  }
	  params.resizable = Common.isUndefined(params.parent) && params.resizable;
	  if (params.autoPlace && Common.isUndefined(params.scrollable)) {
	    params.scrollable = true;
	  }
	  var useLocalStorage = SUPPORTS_LOCAL_STORAGE && localStorage.getItem(getLocalStorageHash(this, 'isLocal')) === 'true';
	  var saveToLocalStorage = void 0;
	  Object.defineProperties(this,
	  {
	    parent: {
	      get: function get$$1() {
	        return params.parent;
	      }
	    },
	    scrollable: {
	      get: function get$$1() {
	        return params.scrollable;
	      }
	    },
	    autoPlace: {
	      get: function get$$1() {
	        return params.autoPlace;
	      }
	    },
	    closeOnTop: {
	      get: function get$$1() {
	        return params.closeOnTop;
	      }
	    },
	    preset: {
	      get: function get$$1() {
	        if (_this.parent) {
	          return _this.getRoot().preset;
	        }
	        return params.load.preset;
	      },
	      set: function set$$1(v) {
	        if (_this.parent) {
	          _this.getRoot().preset = v;
	        } else {
	          params.load.preset = v;
	        }
	        setPresetSelectIndex(this);
	        _this.revert();
	      }
	    },
	    width: {
	      get: function get$$1() {
	        return params.width;
	      },
	      set: function set$$1(v) {
	        params.width = v;
	        setWidth(_this, v);
	      }
	    },
	    name: {
	      get: function get$$1() {
	        return params.name;
	      },
	      set: function set$$1(v) {
	        params.name = v;
	        if (titleRowName) {
	          titleRowName.innerHTML = params.name;
	        }
	      }
	    },
	    closed: {
	      get: function get$$1() {
	        return params.closed;
	      },
	      set: function set$$1(v) {
	        params.closed = v;
	        if (params.closed) {
	          dom.addClass(_this.__ul, GUI.CLASS_CLOSED);
	        } else {
	          dom.removeClass(_this.__ul, GUI.CLASS_CLOSED);
	        }
	        this.onResize();
	        if (_this.__closeButton) {
	          _this.__closeButton.innerHTML = v ? GUI.TEXT_OPEN : GUI.TEXT_CLOSED;
	        }
	      }
	    },
	    load: {
	      get: function get$$1() {
	        return params.load;
	      }
	    },
	    useLocalStorage: {
	      get: function get$$1() {
	        return useLocalStorage;
	      },
	      set: function set$$1(bool) {
	        if (SUPPORTS_LOCAL_STORAGE) {
	          useLocalStorage = bool;
	          if (bool) {
	            dom.bind(window, 'unload', saveToLocalStorage);
	          } else {
	            dom.unbind(window, 'unload', saveToLocalStorage);
	          }
	          localStorage.setItem(getLocalStorageHash(_this, 'isLocal'), bool);
	        }
	      }
	    }
	  });
	  if (Common.isUndefined(params.parent)) {
	    params.closed = false;
	    dom.addClass(this.domElement, GUI.CLASS_MAIN);
	    dom.makeSelectable(this.domElement, false);
	    if (SUPPORTS_LOCAL_STORAGE) {
	      if (useLocalStorage) {
	        _this.useLocalStorage = true;
	        var savedGui = localStorage.getItem(getLocalStorageHash(this, 'gui'));
	        if (savedGui) {
	          params.load = JSON.parse(savedGui);
	        }
	      }
	    }
	    this.__closeButton = document.createElement('div');
	    this.__closeButton.innerHTML = GUI.TEXT_CLOSED;
	    dom.addClass(this.__closeButton, GUI.CLASS_CLOSE_BUTTON);
	    if (params.closeOnTop) {
	      dom.addClass(this.__closeButton, GUI.CLASS_CLOSE_TOP);
	      this.domElement.insertBefore(this.__closeButton, this.domElement.childNodes[0]);
	    } else {
	      dom.addClass(this.__closeButton, GUI.CLASS_CLOSE_BOTTOM);
	      this.domElement.appendChild(this.__closeButton);
	    }
	    dom.bind(this.__closeButton, 'click', function () {
	      _this.closed = !_this.closed;
	    });
	  } else {
	    if (params.closed === undefined) {
	      params.closed = true;
	    }
	    var _titleRowName = document.createTextNode(params.name);
	    dom.addClass(_titleRowName, 'controller-name');
	    var titleRow = addRow(_this, _titleRowName);
	    var onClickTitle = function onClickTitle(e) {
	      e.preventDefault();
	      _this.closed = !_this.closed;
	      return false;
	    };
	    dom.addClass(this.__ul, GUI.CLASS_CLOSED);
	    dom.addClass(titleRow, 'title');
	    dom.bind(titleRow, 'click', onClickTitle);
	    if (!params.closed) {
	      this.closed = false;
	    }
	  }
	  if (params.autoPlace) {
	    if (Common.isUndefined(params.parent)) {
	      if (autoPlaceVirgin) {
	        autoPlaceContainer = document.createElement('div');
	        dom.addClass(autoPlaceContainer, CSS_NAMESPACE);
	        dom.addClass(autoPlaceContainer, GUI.CLASS_AUTO_PLACE_CONTAINER);
	        document.body.appendChild(autoPlaceContainer);
	        autoPlaceVirgin = false;
	      }
	      autoPlaceContainer.appendChild(this.domElement);
	      dom.addClass(this.domElement, GUI.CLASS_AUTO_PLACE);
	    }
	    if (!this.parent) {
	      setWidth(_this, params.width);
	    }
	  }
	  this.__resizeHandler = function () {
	    _this.onResizeDebounced();
	  };
	  dom.bind(window, 'resize', this.__resizeHandler);
	  dom.bind(this.__ul, 'webkitTransitionEnd', this.__resizeHandler);
	  dom.bind(this.__ul, 'transitionend', this.__resizeHandler);
	  dom.bind(this.__ul, 'oTransitionEnd', this.__resizeHandler);
	  this.onResize();
	  if (params.resizable) {
	    addResizeHandle(this);
	  }
	  saveToLocalStorage = function saveToLocalStorage() {
	    if (SUPPORTS_LOCAL_STORAGE && localStorage.getItem(getLocalStorageHash(_this, 'isLocal')) === 'true') {
	      localStorage.setItem(getLocalStorageHash(_this, 'gui'), JSON.stringify(_this.getSaveObject()));
	    }
	  };
	  this.saveToLocalStorageIfPossible = saveToLocalStorage;
	  function resetWidth() {
	    var root = _this.getRoot();
	    root.width += 1;
	    Common.defer(function () {
	      root.width -= 1;
	    });
	  }
	  if (!params.parent) {
	    resetWidth();
	  }
	};
	GUI.toggleHide = function () {
	  hide = !hide;
	  Common.each(hideableGuis, function (gui) {
	    gui.domElement.style.display = hide ? 'none' : '';
	  });
	};
	GUI.CLASS_AUTO_PLACE = 'a';
	GUI.CLASS_AUTO_PLACE_CONTAINER = 'ac';
	GUI.CLASS_MAIN = 'main';
	GUI.CLASS_CONTROLLER_ROW = 'cr';
	GUI.CLASS_TOO_TALL = 'taller-than-window';
	GUI.CLASS_CLOSED = 'closed';
	GUI.CLASS_CLOSE_BUTTON = 'close-button';
	GUI.CLASS_CLOSE_TOP = 'close-top';
	GUI.CLASS_CLOSE_BOTTOM = 'close-bottom';
	GUI.CLASS_DRAG = 'drag';
	GUI.DEFAULT_WIDTH = 245;
	GUI.TEXT_CLOSED = 'Close Controls';
	GUI.TEXT_OPEN = 'Open Controls';
	GUI._keydownHandler = function (e) {
	  if (document.activeElement.type !== 'text' && (e.which === HIDE_KEY_CODE || e.keyCode === HIDE_KEY_CODE)) {
	    GUI.toggleHide();
	  }
	};
	dom.bind(window, 'keydown', GUI._keydownHandler, false);
	Common.extend(GUI.prototype,
	{
	  add: function add(object, property) {
	    return _add(this, object, property, {
	      factoryArgs: Array.prototype.slice.call(arguments, 2)
	    });
	  },
	  addColor: function addColor(object, property) {
	    return _add(this, object, property, {
	      color: true
	    });
	  },
	  remove: function remove(controller) {
	    this.__ul.removeChild(controller.__li);
	    this.__controllers.splice(this.__controllers.indexOf(controller), 1);
	    var _this = this;
	    Common.defer(function () {
	      _this.onResize();
	    });
	  },
	  destroy: function destroy() {
	    if (this.parent) {
	      throw new Error('Only the root GUI should be removed with .destroy(). ' + 'For subfolders, use gui.removeFolder(folder) instead.');
	    }
	    if (this.autoPlace) {
	      autoPlaceContainer.removeChild(this.domElement);
	    }
	    var _this = this;
	    Common.each(this.__folders, function (subfolder) {
	      _this.removeFolder(subfolder);
	    });
	    dom.unbind(window, 'keydown', GUI._keydownHandler, false);
	    removeListeners(this);
	  },
	  addFolder: function addFolder(name) {
	    if (this.__folders[name] !== undefined) {
	      throw new Error('You already have a folder in this GUI by the' + ' name "' + name + '"');
	    }
	    var newGuiParams = { name: name, parent: this };
	    newGuiParams.autoPlace = this.autoPlace;
	    if (this.load &&
	    this.load.folders &&
	    this.load.folders[name]) {
	      newGuiParams.closed = this.load.folders[name].closed;
	      newGuiParams.load = this.load.folders[name];
	    }
	    var gui = new GUI(newGuiParams);
	    this.__folders[name] = gui;
	    var li = addRow(this, gui.domElement);
	    dom.addClass(li, 'folder');
	    return gui;
	  },
	  removeFolder: function removeFolder(folder) {
	    this.__ul.removeChild(folder.domElement.parentElement);
	    delete this.__folders[folder.name];
	    if (this.load &&
	    this.load.folders &&
	    this.load.folders[folder.name]) {
	      delete this.load.folders[folder.name];
	    }
	    removeListeners(folder);
	    var _this = this;
	    Common.each(folder.__folders, function (subfolder) {
	      folder.removeFolder(subfolder);
	    });
	    Common.defer(function () {
	      _this.onResize();
	    });
	  },
	  open: function open() {
	    this.closed = false;
	  },
	  close: function close() {
	    this.closed = true;
	  },
	  onResize: function onResize() {
	    var root = this.getRoot();
	    if (root.scrollable) {
	      var top = dom.getOffset(root.__ul).top;
	      var h = 0;
	      Common.each(root.__ul.childNodes, function (node) {
	        if (!(root.autoPlace && node === root.__save_row)) {
	          h += dom.getHeight(node);
	        }
	      });
	      if (window.innerHeight - top - CLOSE_BUTTON_HEIGHT < h) {
	        dom.addClass(root.domElement, GUI.CLASS_TOO_TALL);
	        root.__ul.style.height = window.innerHeight - top - CLOSE_BUTTON_HEIGHT + 'px';
	      } else {
	        dom.removeClass(root.domElement, GUI.CLASS_TOO_TALL);
	        root.__ul.style.height = 'auto';
	      }
	    }
	    if (root.__resize_handle) {
	      Common.defer(function () {
	        root.__resize_handle.style.height = root.__ul.offsetHeight + 'px';
	      });
	    }
	    if (root.__closeButton) {
	      root.__closeButton.style.width = root.width + 'px';
	    }
	  },
	  onResizeDebounced: Common.debounce(function () {
	    this.onResize();
	  }, 50),
	  remember: function remember() {
	    if (Common.isUndefined(SAVE_DIALOGUE)) {
	      SAVE_DIALOGUE = new CenteredDiv();
	      SAVE_DIALOGUE.domElement.innerHTML = saveDialogContents;
	    }
	    if (this.parent) {
	      throw new Error('You can only call remember on a top level GUI.');
	    }
	    var _this = this;
	    Common.each(Array.prototype.slice.call(arguments), function (object) {
	      if (_this.__rememberedObjects.length === 0) {
	        addSaveMenu(_this);
	      }
	      if (_this.__rememberedObjects.indexOf(object) === -1) {
	        _this.__rememberedObjects.push(object);
	      }
	    });
	    if (this.autoPlace) {
	      setWidth(this, this.width);
	    }
	  },
	  getRoot: function getRoot() {
	    var gui = this;
	    while (gui.parent) {
	      gui = gui.parent;
	    }
	    return gui;
	  },
	  getSaveObject: function getSaveObject() {
	    var toReturn = this.load;
	    toReturn.closed = this.closed;
	    if (this.__rememberedObjects.length > 0) {
	      toReturn.preset = this.preset;
	      if (!toReturn.remembered) {
	        toReturn.remembered = {};
	      }
	      toReturn.remembered[this.preset] = getCurrentPreset(this);
	    }
	    toReturn.folders = {};
	    Common.each(this.__folders, function (element, key) {
	      toReturn.folders[key] = element.getSaveObject();
	    });
	    return toReturn;
	  },
	  save: function save() {
	    if (!this.load.remembered) {
	      this.load.remembered = {};
	    }
	    this.load.remembered[this.preset] = getCurrentPreset(this);
	    markPresetModified(this, false);
	    this.saveToLocalStorageIfPossible();
	  },
	  saveAs: function saveAs(presetName) {
	    if (!this.load.remembered) {
	      this.load.remembered = {};
	      this.load.remembered[DEFAULT_DEFAULT_PRESET_NAME] = getCurrentPreset(this, true);
	    }
	    this.load.remembered[presetName] = getCurrentPreset(this);
	    this.preset = presetName;
	    addPresetOption(this, presetName, true);
	    this.saveToLocalStorageIfPossible();
	  },
	  revert: function revert(gui) {
	    Common.each(this.__controllers, function (controller) {
	      if (!this.getRoot().load.remembered) {
	        controller.setValue(controller.initialValue);
	      } else {
	        recallSavedValue(gui || this.getRoot(), controller);
	      }
	      if (controller.__onFinishChange) {
	        controller.__onFinishChange.call(controller, controller.getValue());
	      }
	    }, this);
	    Common.each(this.__folders, function (folder) {
	      folder.revert(folder);
	    });
	    if (!gui) {
	      markPresetModified(this.getRoot(), false);
	    }
	  },
	  listen: function listen(controller) {
	    var init = this.__listening.length === 0;
	    this.__listening.push(controller);
	    if (init) {
	      updateDisplays(this.__listening);
	    }
	  },
	  updateDisplay: function updateDisplay() {
	    Common.each(this.__controllers, function (controller) {
	      controller.updateDisplay();
	    });
	    Common.each(this.__folders, function (folder) {
	      folder.updateDisplay();
	    });
	  }
	});
	function addRow(gui, newDom, liBefore) {
	  var li = document.createElement('li');
	  if (newDom) {
	    li.appendChild(newDom);
	  }
	  if (liBefore) {
	    gui.__ul.insertBefore(li, liBefore);
	  } else {
	    gui.__ul.appendChild(li);
	  }
	  gui.onResize();
	  return li;
	}
	function removeListeners(gui) {
	  dom.unbind(window, 'resize', gui.__resizeHandler);
	  if (gui.saveToLocalStorageIfPossible) {
	    dom.unbind(window, 'unload', gui.saveToLocalStorageIfPossible);
	  }
	}
	function markPresetModified(gui, modified) {
	  var opt = gui.__preset_select[gui.__preset_select.selectedIndex];
	  if (modified) {
	    opt.innerHTML = opt.value + '*';
	  } else {
	    opt.innerHTML = opt.value;
	  }
	}
	function augmentController(gui, li, controller) {
	  controller.__li = li;
	  controller.__gui = gui;
	  Common.extend(controller,                                   {
	    options: function options(_options) {
	      if (arguments.length > 1) {
	        var nextSibling = controller.__li.nextElementSibling;
	        controller.remove();
	        return _add(gui, controller.object, controller.property, {
	          before: nextSibling,
	          factoryArgs: [Common.toArray(arguments)]
	        });
	      }
	      if (Common.isArray(_options) || Common.isObject(_options)) {
	        var _nextSibling = controller.__li.nextElementSibling;
	        controller.remove();
	        return _add(gui, controller.object, controller.property, {
	          before: _nextSibling,
	          factoryArgs: [_options]
	        });
	      }
	    },
	    name: function name(_name) {
	      controller.__li.firstElementChild.firstElementChild.innerHTML = _name;
	      return controller;
	    },
	    listen: function listen() {
	      controller.__gui.listen(controller);
	      return controller;
	    },
	    remove: function remove() {
	      controller.__gui.remove(controller);
	      return controller;
	    }
	  });
	  if (controller instanceof NumberControllerSlider) {
	    var box = new NumberControllerBox(controller.object, controller.property, { min: controller.__min, max: controller.__max, step: controller.__step });
	    Common.each(['updateDisplay', 'onChange', 'onFinishChange', 'step'], function (method) {
	      var pc = controller[method];
	      var pb = box[method];
	      controller[method] = box[method] = function () {
	        var args = Array.prototype.slice.call(arguments);
	        pb.apply(box, args);
	        return pc.apply(controller, args);
	      };
	    });
	    dom.addClass(li, 'has-slider');
	    controller.domElement.insertBefore(box.domElement, controller.domElement.firstElementChild);
	  } else if (controller instanceof NumberControllerBox) {
	    var r = function r(returned) {
	      if (Common.isNumber(controller.__min) && Common.isNumber(controller.__max)) {
	        var oldName = controller.__li.firstElementChild.firstElementChild.innerHTML;
	        var wasListening = controller.__gui.__listening.indexOf(controller) > -1;
	        controller.remove();
	        var newController = _add(gui, controller.object, controller.property, {
	          before: controller.__li.nextElementSibling,
	          factoryArgs: [controller.__min, controller.__max, controller.__step]
	        });
	        newController.name(oldName);
	        if (wasListening) newController.listen();
	        return newController;
	      }
	      return returned;
	    };
	    controller.min = Common.compose(r, controller.min);
	    controller.max = Common.compose(r, controller.max);
	  } else if (controller instanceof BooleanController) {
	    dom.bind(li, 'click', function () {
	      dom.fakeEvent(controller.__checkbox, 'click');
	    });
	    dom.bind(controller.__checkbox, 'click', function (e) {
	      e.stopPropagation();
	    });
	  } else if (controller instanceof FunctionController) {
	    dom.bind(li, 'click', function () {
	      dom.fakeEvent(controller.__button, 'click');
	    });
	    dom.bind(li, 'mouseover', function () {
	      dom.addClass(controller.__button, 'hover');
	    });
	    dom.bind(li, 'mouseout', function () {
	      dom.removeClass(controller.__button, 'hover');
	    });
	  } else if (controller instanceof ColorController) {
	    dom.addClass(li, 'color');
	    controller.updateDisplay = Common.compose(function (val) {
	      li.style.borderLeftColor = controller.__color.toString();
	      return val;
	    }, controller.updateDisplay);
	    controller.updateDisplay();
	  }
	  controller.setValue = Common.compose(function (val) {
	    if (gui.getRoot().__preset_select && controller.isModified()) {
	      markPresetModified(gui.getRoot(), true);
	    }
	    return val;
	  }, controller.setValue);
	}
	function recallSavedValue(gui, controller) {
	  var root = gui.getRoot();
	  var matchedIndex = root.__rememberedObjects.indexOf(controller.object);
	  if (matchedIndex !== -1) {
	    var controllerMap = root.__rememberedObjectIndecesToControllers[matchedIndex];
	    if (controllerMap === undefined) {
	      controllerMap = {};
	      root.__rememberedObjectIndecesToControllers[matchedIndex] = controllerMap;
	    }
	    controllerMap[controller.property] = controller;
	    if (root.load && root.load.remembered) {
	      var presetMap = root.load.remembered;
	      var preset = void 0;
	      if (presetMap[gui.preset]) {
	        preset = presetMap[gui.preset];
	      } else if (presetMap[DEFAULT_DEFAULT_PRESET_NAME]) {
	        preset = presetMap[DEFAULT_DEFAULT_PRESET_NAME];
	      } else {
	        return;
	      }
	      if (preset[matchedIndex] && preset[matchedIndex][controller.property] !== undefined) {
	        var value = preset[matchedIndex][controller.property];
	        controller.initialValue = value;
	        controller.setValue(value);
	      }
	    }
	  }
	}
	function _add(gui, object, property, params) {
	  if (object[property] === undefined) {
	    throw new Error('Object "' + object + '" has no property "' + property + '"');
	  }
	  var controller = void 0;
	  if (params.color) {
	    controller = new ColorController(object, property);
	  } else {
	    var factoryArgs = [object, property].concat(params.factoryArgs);
	    controller = ControllerFactory.apply(gui, factoryArgs);
	  }
	  if (params.before instanceof Controller) {
	    params.before = params.before.__li;
	  }
	  recallSavedValue(gui, controller);
	  dom.addClass(controller.domElement, 'c');
	  var name = document.createElement('span');
	  dom.addClass(name, 'property-name');
	  name.innerHTML = controller.property;
	  var container = document.createElement('div');
	  container.appendChild(name);
	  container.appendChild(controller.domElement);
	  var li = addRow(gui, container, params.before);
	  dom.addClass(li, GUI.CLASS_CONTROLLER_ROW);
	  if (controller instanceof ColorController) {
	    dom.addClass(li, 'color');
	  } else {
	    dom.addClass(li, _typeof(controller.getValue()));
	  }
	  augmentController(gui, li, controller);
	  gui.__controllers.push(controller);
	  return controller;
	}
	function getLocalStorageHash(gui, key) {
	  return document.location.href + '.' + key;
	}
	function addPresetOption(gui, name, setSelected) {
	  var opt = document.createElement('option');
	  opt.innerHTML = name;
	  opt.value = name;
	  gui.__preset_select.appendChild(opt);
	  if (setSelected) {
	    gui.__preset_select.selectedIndex = gui.__preset_select.length - 1;
	  }
	}
	function showHideExplain(gui, explain) {
	  explain.style.display = gui.useLocalStorage ? 'block' : 'none';
	}
	function addSaveMenu(gui) {
	  var div = gui.__save_row = document.createElement('li');
	  dom.addClass(gui.domElement, 'has-save');
	  gui.__ul.insertBefore(div, gui.__ul.firstChild);
	  dom.addClass(div, 'save-row');
	  var gears = document.createElement('span');
	  gears.innerHTML = '&nbsp;';
	  dom.addClass(gears, 'button gears');
	  var button = document.createElement('span');
	  button.innerHTML = 'Save';
	  dom.addClass(button, 'button');
	  dom.addClass(button, 'save');
	  var button2 = document.createElement('span');
	  button2.innerHTML = 'New';
	  dom.addClass(button2, 'button');
	  dom.addClass(button2, 'save-as');
	  var button3 = document.createElement('span');
	  button3.innerHTML = 'Revert';
	  dom.addClass(button3, 'button');
	  dom.addClass(button3, 'revert');
	  var select = gui.__preset_select = document.createElement('select');
	  if (gui.load && gui.load.remembered) {
	    Common.each(gui.load.remembered, function (value, key) {
	      addPresetOption(gui, key, key === gui.preset);
	    });
	  } else {
	    addPresetOption(gui, DEFAULT_DEFAULT_PRESET_NAME, false);
	  }
	  dom.bind(select, 'change', function () {
	    for (var index = 0; index < gui.__preset_select.length; index++) {
	      gui.__preset_select[index].innerHTML = gui.__preset_select[index].value;
	    }
	    gui.preset = this.value;
	  });
	  div.appendChild(select);
	  div.appendChild(gears);
	  div.appendChild(button);
	  div.appendChild(button2);
	  div.appendChild(button3);
	  if (SUPPORTS_LOCAL_STORAGE) {
	    var explain = document.getElementById('dg-local-explain');
	    var localStorageCheckBox = document.getElementById('dg-local-storage');
	    var saveLocally = document.getElementById('dg-save-locally');
	    saveLocally.style.display = 'block';
	    if (localStorage.getItem(getLocalStorageHash(gui, 'isLocal')) === 'true') {
	      localStorageCheckBox.setAttribute('checked', 'checked');
	    }
	    showHideExplain(gui, explain);
	    dom.bind(localStorageCheckBox, 'change', function () {
	      gui.useLocalStorage = !gui.useLocalStorage;
	      showHideExplain(gui, explain);
	    });
	  }
	  var newConstructorTextArea = document.getElementById('dg-new-constructor');
	  dom.bind(newConstructorTextArea, 'keydown', function (e) {
	    if (e.metaKey && (e.which === 67 || e.keyCode === 67)) {
	      SAVE_DIALOGUE.hide();
	    }
	  });
	  dom.bind(gears, 'click', function () {
	    newConstructorTextArea.innerHTML = JSON.stringify(gui.getSaveObject(), undefined, 2);
	    SAVE_DIALOGUE.show();
	    newConstructorTextArea.focus();
	    newConstructorTextArea.select();
	  });
	  dom.bind(button, 'click', function () {
	    gui.save();
	  });
	  dom.bind(button2, 'click', function () {
	    var presetName = prompt('Enter a new preset name.');
	    if (presetName) {
	      gui.saveAs(presetName);
	    }
	  });
	  dom.bind(button3, 'click', function () {
	    gui.revert();
	  });
	}
	function addResizeHandle(gui) {
	  var pmouseX = void 0;
	  gui.__resize_handle = document.createElement('div');
	  Common.extend(gui.__resize_handle.style, {
	    width: '6px',
	    marginLeft: '-3px',
	    height: '200px',
	    cursor: 'ew-resize',
	    position: 'absolute'
	  });
	  function drag(e) {
	    e.preventDefault();
	    gui.width += pmouseX - e.clientX;
	    gui.onResize();
	    pmouseX = e.clientX;
	    return false;
	  }
	  function dragStop() {
	    dom.removeClass(gui.__closeButton, GUI.CLASS_DRAG);
	    dom.unbind(window, 'mousemove', drag);
	    dom.unbind(window, 'mouseup', dragStop);
	  }
	  function dragStart(e) {
	    e.preventDefault();
	    pmouseX = e.clientX;
	    dom.addClass(gui.__closeButton, GUI.CLASS_DRAG);
	    dom.bind(window, 'mousemove', drag);
	    dom.bind(window, 'mouseup', dragStop);
	    return false;
	  }
	  dom.bind(gui.__resize_handle, 'mousedown', dragStart);
	  dom.bind(gui.__closeButton, 'mousedown', dragStart);
	  gui.domElement.insertBefore(gui.__resize_handle, gui.domElement.firstElementChild);
	}
	function setWidth(gui, w) {
	  gui.domElement.style.width = w + 'px';
	  if (gui.__save_row && gui.autoPlace) {
	    gui.__save_row.style.width = w + 'px';
	  }
	  if (gui.__closeButton) {
	    gui.__closeButton.style.width = w + 'px';
	  }
	}
	function getCurrentPreset(gui, useInitialValues) {
	  var toReturn = {};
	  Common.each(gui.__rememberedObjects, function (val, index) {
	    var savedValues = {};
	    var controllerMap = gui.__rememberedObjectIndecesToControllers[index];
	    Common.each(controllerMap, function (controller, property) {
	      savedValues[property] = useInitialValues ? controller.initialValue : controller.getValue();
	    });
	    toReturn[index] = savedValues;
	  });
	  return toReturn;
	}
	function setPresetSelectIndex(gui) {
	  for (var index = 0; index < gui.__preset_select.length; index++) {
	    if (gui.__preset_select[index].value === gui.preset) {
	      gui.__preset_select.selectedIndex = index;
	    }
	  }
	}
	function updateDisplays(controllerArray) {
	  if (controllerArray.length !== 0) {
	    requestAnimationFrame$1.call(window, function () {
	      updateDisplays(controllerArray);
	    });
	  }
	  Common.each(controllerArray, function (c) {
	    c.updateDisplay();
	  });
	}
	var GUI$1 = GUI;

	const gui$1 = new GUI$1();

	var Parameters = function() {
	  this.f = 'x*y';
	  this.g = 'x+y';
	  this.boxSize = 0.1;
	  this.lineSpacing = 1;
	};
						      
	var parameters = new Parameters();

	function processHash() {
	    var hash = window.location.hash.replace(/^#/,'');
	    hash.split(',').forEach( function(assignment) {
		var lhs = assignment.split('=')[0];
		var rhs = assignment.split('=')[1];
		if (typeof parameters[lhs] == 'number')
		    parameters[lhs] = parseFloat(rhs);
		if (typeof parameters[lhs] == 'string')
		    parameters[lhs] = rhs;
	    });
	}

	if(window.location.hash) {
	    processHash();
	} 

	window.addEventListener("hashchange", function () {
	    processHash();
	    updateShaders();
	}, false);

	var glslFunctionF = parameters.f;
	var glslFunctionG = parameters.g;

	function updateHash() {
	    var properties = [];
	    var originalParameters = new Parameters();
	    
	    Object.getOwnPropertyNames(parameters).forEach( function(property) {
		if (originalParameters[property] != parameters[property]) {
		    properties.unshift( property + "=" + parameters[property].toString() );
		}
	    });

	    var hash = properties.join(',');
	    history.pushState(null, null, '#' + hash);
	}

	function updateShaders() {
	  updateHash();
	    
	  try {
	    glslFunctionF = parameters.f;
	    glslFunctionG = parameters.g;
	    initShaders();
	  } catch (err) {
	    console.log(err);
	    return;
	  }
	    
	  window.requestAnimationFrame(drawScene);
	}

	gui$1.add(parameters, 'f').onChange( updateShaders ).listen();
	gui$1.add(parameters, 'g').onChange( updateShaders ).listen();

	//var colorFolder = gui.addFolder('Colors');

	function update() {
	    
	    updateHash();
	    window.requestAnimationFrame(drawScene);
	}

	gui$1.add(parameters, 'boxSize', 0, 2 ).onChange( update ).listen();
	gui$1.add(parameters, 'lineSpacing', 0, 1 ).onChange( update ).listen();

	/*
	colorFolder.add(parameters, 'rootDarkeningSharpness', 1, 40 ).onChange( update ).listen();
	colorFolder.add(parameters, 'poleLightening', 0, 1 ).onChange( update ).listen();
	colorFolder.add(parameters, 'poleLighteningSharpness', 0, 40 ).onChange( update ).listen();
	colorFolder.add(parameters, 'rectangularGridOpacity', 0, 1 ).onChange( update ).listen();
	colorFolder.add(parameters, 'polarGridOpacity', 0, 1 ).onChange( update ).listen();

	gui.add(parameters, 'axisOpacity', 0, 1 ).onChange( update ).listen();
	*/

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
	  var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
	  var source = fragmentShaderGLSL
	      .replace( 'THEFUNCTIONGOESHERE_F', glslFunctionF )
	      .replace( 'THEFUNCTIONGOESHERE_G', glslFunctionG );  
	  
	  gl.shaderSource(fragmentShader, source);
	  gl.compileShader(fragmentShader);
	    
	  if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
	    console.log(gl.getShaderInfoLog(fragmentShader));
	    return null;
	  }

	  var vertexShader = gl.createShader(gl.VERTEX_SHADER);
	  gl.shaderSource(vertexShader, vertexShaderGLSL);
	  gl.compileShader(vertexShader);

	  if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
	    console.log(gl.getShaderInfoLog(vertexShader));
	    return null;
	  }

	  shaderProgram = gl.createProgram();
	  gl.attachShader(shaderProgram, vertexShader);
	  gl.attachShader(shaderProgram, fragmentShader);
	  gl.linkProgram(shaderProgram);
	 
	  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
	    console.log("Could not initialise shaders");
	    return null;
	  }

	  gl.useProgram(shaderProgram);
	 
	  shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
	  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
	 
	  shaderProgram.uPanzoomMatrix = gl.getUniformLocation(shaderProgram, "uPanzoomMatrix");
	  shaderProgram.boxSize = gl.getUniformLocation(shaderProgram, "boxSize");
	  shaderProgram.lineSpacing = gl.getUniformLocation(shaderProgram, "lineSpacing");    

	  /*
	  shaderProgram.axisOpacity = gl.getUniformLocation(shaderProgram, "axisOpacity");
	  shaderProgram.rootDarkening = gl.getUniformLocation(shaderProgram, "rootDarkening");
	  shaderProgram.rootDarkeningSharpness = gl.getUniformLocation(shaderProgram, "rootDarkeningSharpness");
	  shaderProgram.poleLightening = gl.getUniformLocation(shaderProgram, "poleLightening");
	  shaderProgram.poleLighteningSharpness = gl.getUniformLocation(shaderProgram, "poleLighteningSharpness");
	  shaderProgram.rectangularGridOpacity = gl.getUniformLocation(shaderProgram, "rectangularGridOpacity");
	  shaderProgram.polarGridOpacity = gl.getUniformLocation(shaderProgram, "polarGridOpacity");
	*/
	  shaderProgram.pixelRatio = gl.getUniformLocation(shaderProgram, "pixelRatio");

	  shaderProgram.variables = [];
	  "abcdfghjklmnopqrstuvwxyz".split('').forEach(function(v) {
	    shaderProgram.variables[v] = gl.getUniformLocation(shaderProgram, v);
	  });
	}

	var panzoomMatrix = create$2();
	var viewportMatrix = create$2();

	function setUniforms() {
	  gl.uniformMatrix3fv(shaderProgram.uPanzoomMatrix, false, panzoomMatrix);
	  gl.uniform1f(shaderProgram.boxSize, parameters.boxSize);
	  gl.uniform1f(shaderProgram.lineSpacing, parameters.lineSpacing);  
	  
	  /*
	    gl.uniform1f(shaderProgram.axisOpacity, parameters.axisOpacity);
	    gl.uniform1f(shaderProgram.rootDarkening, parameters.rootDarkening);
	    gl.uniform1f(shaderProgram.rootDarkeningSharpness, parameters.rootDarkeningSharpness);
	    gl.uniform1f(shaderProgram.poleLightening, parameters.poleLightening);
	    gl.uniform1f(shaderProgram.poleLighteningSharpness, parameters.poleLighteningSharpness);
	    gl.uniform1f(shaderProgram.rectangularGridOpacity, parameters.rectangularGridOpacity);
	    gl.uniform1f(shaderProgram.polarGridOpacity, parameters.polarGridOpacity);
	  */
	  
	    gl.uniform1f(shaderProgram.pixelRatio, window.devicePixelRatio);
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

	  var height = gl.canvas.clientHeight * window.devicePixelRatio;
	  var width = gl.canvas.clientWidth * window.devicePixelRatio;

	  var m = width;
	  if (m < height) m = height;

	  gl.viewport((width - m)/2, (height - m)/2, m, m );

	  height = gl.canvas.clientHeight;
	  width = gl.canvas.clientWidth;

	  m = width;
	  if (m < height) m = height;

	  viewportScale = m/2;
	  
	  identity$2(viewportMatrix);
	  scale$2(viewportMatrix, viewportMatrix, [-2.0/m, 2.0/m]);
	  translate$1(viewportMatrix, viewportMatrix, [-width/2, -height/2]);        

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
	  var displayWidth  = canvas.clientWidth * window.devicePixelRatio;
	  var displayHeight = canvas.clientHeight * window.devicePixelRatio;
	        
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

	document.querySelector("#glCanvas").addEventListener("mousemove", function(e) {
	  var point = clone$8( [e.clientX, e.clientY] );
	  transformMat3$1( point, point, viewportMatrix );
	  var inverse$$1 = clone$2(panzoomMatrix);
	  inverse$$1[6] = -inverse$$1[6];
	  inverse$$1[7] = -inverse$$1[7];
	  transformMat3$1( point, point, inverse$$1 );
	  gl.uniform1f(shaderProgram.variables["u"], point[0]);
	  gl.uniform1f(shaderProgram.variables["v"], point[1]);
	  window.requestAnimationFrame(drawScene);
	});

	panZoom_1(document.querySelector("#glCanvas"), e => {
	  var center = clone$8( [e.x, e.y] );
	    
	  transformMat3$1( center, center, viewportMatrix );
	    
	  scale$8( center, center, -1 );
	  translate$1( panzoomMatrix, panzoomMatrix, center );
	  var scale$$1 = Math.exp(e.dz / 100.0);
	  scale$2( panzoomMatrix, panzoomMatrix, [scale$$1,scale$$1] );
	  scale$8( center, center, -1 );
	  translate$1( panzoomMatrix, panzoomMatrix, center );    

	  translate$1( panzoomMatrix, panzoomMatrix, [-e.dx/viewportScale, e.dy/viewportScale] );
	    
	  window.requestAnimationFrame(drawScene);
	});

}());
