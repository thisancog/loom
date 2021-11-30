"use strict";

(function() {

	/***************************************
		Common methods
	***************************************/

	var vpWidth = function() { return Math.max(document.documentElement.clientWidth, window.innerWidth || 0); }
	var vpHeight = function() { return Math.max(document.documentElement.clientHeight, window.innerHeight || 0); }

	
	var init = function() {
		resizeBody();
		loom();
		credits();
	}



	/***************************************
		Resize body
	***************************************/

	var resizeBody = function() {
		var changeHeight = function() {
			document.documentElement.style.setProperty('--vw', (0.01 * document.body.clientWidth) + 'px');
			document.documentElement.style.setProperty('--vh', (0.01 * window.innerHeight) + 'px');
			document.body.style.height = window.innerHeight + 'px';
		}

		setTimeout(changeHeight, 20); // older Safari iOS will lag
		window.addEventListener('resize', changeHeight);
	}





	/***************************************
		Loom
	***************************************/

	var loom = function() {
		var sketchContainer = document.querySelector('.sketch-container'),
			controls        = document.querySelector('.controls'),
			settings        = controls.querySelector('.settings'),
			settingsToggle  = settings.querySelector('.settings-toggle'),
			addWeftBtn      = controls.querySelector('.add-weft-btn'),
			removeWeftBtns  = [].slice.call(controls.querySelectorAll('.setting-wefts .remove-btn')),
			addWarpBtn      = controls.querySelector('.add-warp-btn'),
			removeWarpBtns  = [].slice.call(controls.querySelectorAll('.setting-warps .remove-btn')),
			seedInput       = controls.querySelector('#seed'),
			generateBtn     = controls.querySelector('#generate'),
			downloadBtn     = controls.querySelector('#download'),
			args, p5Sketch;

		var registerEvents = function() {
			settingsToggle.addEventListener('click', toggleSettings);
			addWeftBtn.addEventListener(    'click', addWeft);
			removeWeftBtns.forEach(btn =>
				btn.addEventListener(       'click', removeWeft)
			);
			addWarpBtn.addEventListener(    'click', addWarp);
			removeWarpBtns.forEach(btn =>
				btn.addEventListener(       'click', removeWarp)
			);

			generateBtn.addEventListener(   'click', resetLoom);
			downloadBtn.addEventListener(   'click', saveFrame);
			controls.addEventListener(     'submit', resetLoom);
		}

		var initLoom = function() {
			args            = parseArgs();
			p5Sketch        = new p5(sketch, sketchContainer);
		}

		var resetLoom = function(e) {
			e.preventDefault();

			if (p5Sketch)
				p5Sketch.remove();

			initLoom();
		}

		var parseArgs = function() {
			if (seedInput.value.length > 0)
				generateFromString(seedInput.value);

			let threadWidth   = parseFloat(document.querySelector('#thread-width').value),
				threadSpacing = parseFloat(document.querySelector('#thread-spacing').value),
				patternWidth  = parseInt(document.querySelector('#pattern-width').value);

			let weftColors    = [].slice.call(controls.querySelectorAll('.setting-wefts .repeater-elements input[type="color"]'))
								  .map(input => input.value);

			let warps         = [].slice.call(controls.querySelectorAll('.setting-warps .repeater-elements .repeater-single'))
								  .map(function(row) {
										return {
											color:   row.querySelector('input[type="color"]').value,
											pattern: row.querySelector('input[type="text"]').value
													    .replace(/[^01]/g, '')
													    .split(''),
								  		}
								  });

			return {
				threadWidth: 	threadWidth,
				threadSpacing:	threadSpacing,
				threadTotal:    threadWidth + threadSpacing,
				patternWidth:	patternWidth,
				weftColors: 	weftColors,
				warpSettings:   warps 
			};
		}

		var generateFromString = function(value) {
			let threadWidthInput   = document.querySelector('#thread-width'),
				threadSpacingInput = document.querySelector('#thread-spacing'),
				patternWidth       = document.querySelector('#pattern-width');

			//	clear everything
			document.querySelector('.setting-wefts .repeater-elements').innerHTML = '';
			document.querySelector('.setting-warps .repeater-elements').innerHTML = '';


			let getRandomNumber = xmur3(value),
				numWefts        = parseInt(lerp(getRandomNumber(), 1, 50)),
				numWarps        = parseInt(lerp(getRandomNumber(), 1, 50)),
				threadWidth     = parseInt(lerp(getRandomNumber(), 1, 50)),
				colors          = generateRandomColorSet(getRandomNumber);

			console.log(colors);

			threadWidthInput.value   = threadWidth;
			threadSpacingInput.value = parseInt(lerp(getRandomNumber(), 0, 0.5 * threadWidth));
			patternWidth.value       = parseInt(lerp(getRandomNumber(), 1, 999));

			for (let i = 0; i < numWefts; i++) {
				let newColor = colors[parseInt(lerp(getRandomNumber(), 0, colors.length - 1))];
				addWeft(newColor);
			}

			for (let i = 0; i < numWarps; i++) {
				let newColor      = colors[parseInt(lerp(getRandomNumber(), 0, colors.length - 1))],
					patternLength = parseInt(lerp(getRandomNumber(), 4, 200)),
					newPattern    = '';

				for (let n = 0; n < patternLength; n++) {
					newPattern = newPattern + (getRandomNumber() < 0.5 ? '0' : '1');
				}

				addWarp(newColor, newPattern);
			}
		}



		/***************************************
			Interface
		***************************************/

		var addWeft = function(color) {
			let weftsInner = controls.querySelector('.setting-wefts .repeater-elements'),
				template   = controls.querySelector('.setting-wefts .repeater-template'),
				newElem    = template.cloneNode(true),
				removeBtn  = newElem.querySelector('.remove-btn');

			newElem.classList.remove('repeater-template');
			weftsInner.appendChild(newElem);
			removeBtn.addEventListener('click', removeWeft);

			if (color !== null) {
				newElem.querySelector('input[type="color"]').value = color;
			}
		}

		var removeWeft = function(e) {
			let row = e.target.closest('.repeater-single');
			e.target.removeEventListener('click', removeWeft);
			row.parentElement.removeChild(row);
		}

		var addWarp = function(color, pattern) {
			let warpsInner = controls.querySelector('.setting-warps .repeater-elements'),
				template   = controls.querySelector('.setting-warps .repeater-template'),
				newElem    = template.cloneNode(true),
				removeBtn  = newElem.querySelector('.remove-btn');

			newElem.classList.remove('repeater-template');
			warpsInner.appendChild(newElem);
			removeBtn.addEventListener('click', removeWarp);

			if (color !== null) {
				newElem.querySelector('input[type="color"]').value = color;
			}

			if (pattern !== null) {
				newElem.querySelector('input[type="text"]').value = pattern;
			}
		}

		var removeWarp = function(e) {
			let row = e.target.closest('.repeater-single');
			e.target.removeEventListener('click', removeWarp);
			row.parentElement.removeChild(row);
		}

		var saveFrame = function() {
			let now      = new Date(),
				fileName = 'loom_' + now.getFullYear() + '-' + (now.getMonth() + 1) + '-' + now.getDate()
						 + ' ' + now.getHours() + '-' + now.getMinutes() + '-' + now.getSeconds();
			p5Sketch.save(fileName + '.jpg');
		}

		var toggleSettings = function() {
			settings.classList.toggle('show-settings');
		}



		/***************************************
			Drawing
		***************************************/

		var sketch = function(p) {
			let wefts         = [],
				numWefts,
				warps         = [];

			var	offsetX          = 0.5 * args.threadWidth,
				currentY         = 0,
				currentWarpIndex = 0;

			p.setup = function() {
				p.createCanvas(sketchContainer.clientWidth, sketchContainer.clientHeight);
				numWefts = getNumWefts();

				for (let x = 0; x < numWefts; x++) {
					wefts.push(new Weft({
						x:    		x * args.threadTotal + offsetX, // offset because stroke is drawn centered
						color:		args.weftColors[x % args.weftColors.length],
						gap:        args.threadSpacing,
						step:       args.threadTotal,
						width:		args.threadWidth
					}));
				}

				for (let y = 0; y < args.warpSettings.length; y++) {
					warps.push(new Warp({
						color:  	args.warpSettings[y].color,
						gap:        args.threadSpacing,
						step:       args.threadTotal,
						width:  	args.threadWidth,
						numWefts:   numWefts,
						pattern:	args.warpSettings[y].pattern
					}));
				}

				p.background(255);
			}


			/***************************************
				Draw row by row
			***************************************/

			p.draw = function() {
				if (currentY * args.threadTotal > p.height)
					return p.noLoop();

				let currentWarp = warps[currentWarpIndex];

				for (var x = 0; x < numWefts; x++) {
					let underOrOver = currentWarp.weave(x, currentY);
					if (underOrOver == 'under')
					 	wefts[x].weave(currentY);
				}

				currentWarpIndex = wrapIndex(currentWarpIndex + 1, 0, args.warpSettings.length - 1);
				currentY++;
			}


			/***************************************
				Warps: horizontal threads
			***************************************/

			class Warp {
				constructor(args) {
					this.args            = args;
					this.counter         = 0;
				}

				weave(currentX, currentY) {
					this.counter = wrapIndex(this.counter + 1, 0, this.args.pattern.length - 1);

				//	go under?
					if (this.args.pattern[this.counter] == 0)
						return 'under';

				//	go over!
					let	startX =  currentX      * this.args.step - this.args.gap,
						endX   = (currentX + 1) * this.args.step,
						y      = currentY * this.args.step + 0.5 * (this.args.width);

					p.strokeCap(p.SQUARE);
					p.strokeWeight(this.args.width);
					p.stroke(this.args.color);
					p.line(startX, y, endX, y);
					return 'over';
				}
			}



			/***************************************
				Wefts: vertical threads
			***************************************/

			class Weft {
				constructor(args) {
					this.args  = args;
				}

				weave(currentY) {
					let startY =  currentY      * this.args.step - this.args.gap,
						endY   = (currentY + 1) * this.args.step + this.args.gap;

					p.strokeCap(p.SQUARE);
					p.strokeWeight(this.args.width);
					p.stroke(this.args.color);
					p.line(this.args.x, startY, this.args.x, endY);
				}
			}

			var getNumWefts = function() {
				let minWidth      = Math.floor(p.width / args.threadTotal),
					maxWidth      = Math.ceil(minWidth / args.patternWidth) * args.patternWidth + Math.floor(0.5 * args.patternWidth);
				return maxWidth;
			}
		}

		/***************************************
			Helper functions
		***************************************/

		var wrapIndex = function(n, min, max) {
			if (n >= min && n <= max)	return n;
			if (n > max)				return min;
										return max;
		}

		var limit = function(n, min, max) {
			return Math.min(Math.max(n, min), max);
		}

		var lerp = function(n, min, max) {
        	return min + (max - min) * limit(n, 0, 1);
		}

		// seeded pseudo-random number generator
		var xmur3 = function(seed) {
			for (var i = 0, h = 1779033703 ^ seed.length; i < seed.length; i++) {
				h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
				h = h << 13 | h >>> 19;
			}

			return function() {
				h = Math.imul(h ^ h >>> 16, 2246822507);
				h = Math.imul(h ^ h >>> 13, 3266489909);
				h = (h ^= h >>> 16) >>> 0;
				return h / Math.pow(10, h.toString().length);
			}
		}

		var generateRandomColorSet = function(PRNG) {
			let hue        = parseInt(lerp(PRNG(), 0, 359)),
				schemes    = ['mono', 'contrast', 'triade', 'tetrade', 'analogic'],
				variations = ['default', 'pastel', 'soft', 'light', 'hard', 'pale'],
				scheme     = schemes[parseInt(lerp(PRNG(), 0, schemes.length - 1))],
				variation  = variations[parseInt(lerp(PRNG(), 0, variations.length - 1))],
				colorSet   = new ColorScheme();

			colorSet.from_hue(hue).scheme(scheme);
			if (['triade', 'tetrade', 'analogic'].indexOf(scheme) > -1)
				colorSet.distance(lerp(PRNG(), 0.25, 0.5));
			
			let colors = colorSet.variation(variation).colors();
			return colors.map(color => '#' + color);
		}

		registerEvents();
		initLoom();
	}






	/***************************************
		Credits
	***************************************/

	var credits = function() {
		var credits = '**********\n\nThis website was built by Matthias Planitzer.\nwww.matthias-planitzer.de\n\n**********';
		console.log('%c' + credits, 'color: #00F; font-family: Helvetica Neue", Helvetica, sans-serif; font-size: 14px;');	
	}

	init();
})();