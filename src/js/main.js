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
			addWeftBtn      = controls.querySelector('.add-weft-btn'),
			removeWeftBtns  = [].slice.call(controls.querySelectorAll('.setting-wefts .remove-btn')),
			generateBtn     = controls.querySelector('#generate'),
			downloadBtn     = controls.querySelector('#download'),
			args, p5Sketch;

		var registerEvents = function() {
			addWeftBtn.addEventListener('click', addWeft);
			removeWeftBtns.forEach(btn => btn.addEventListener('click', removeWeft));
			generateBtn.addEventListener('click', resetLoom);
			downloadBtn.addEventListener('click', saveFrame);
			controls.addEventListener('submit', resetLoom);
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
			let threadWidth   = parseFloat(document.querySelector('#thread-width').value),
				threadSpacing = parseFloat(document.querySelector('#thread-spacing').value),
				patternWidth  = parseInt(document.querySelector('#pattern-width').value);

			let weftColors    = [].slice.call(controls.querySelectorAll('.setting-wefts .repeater-elements input[type="color"]')).
								map(input => input.value);

			return {
				threadWidth: 	threadWidth,
				threadSpacing:	threadSpacing,
				threadTotal:    threadWidth + threadSpacing,
				patternWidth:	patternWidth,
				weftColors: 	weftColors     
			};
		}


		/***************************************
			Interface
		***************************************/

		var addWeft = function() {
			let weftsInner = controls.querySelector('.setting-wefts .repeater-elements'),
				template   = controls.querySelector('.setting-wefts .repeater-template'),
				newElem    = template.cloneNode(true),
				removeBtn  = newElem.querySelector('.remove-btn');

			newElem.classList.remove('repeater-template');
			weftsInner.appendChild(newElem);
			removeBtn.addEventListener('click', removeWeft);
		}

		var removeWeft = function(e) {
			let row = e.target.closest('.repeater-single');
			e.target.removeEventListener('click', removeWeft);
			row.parentElement.removeChild(row);
		}

		var saveFrame = function() {
			let now      = new Date(),
				fileName = 'loom_' + now.getFullYear() + '-' + (now.getMonth() + 1) + '-' + now.getDate()
						 + ' ' + now.getHours() + '-' + now.getMinutes() + '-' + now.getSeconds();
			p5Sketch.save(fileName + '.jpg');
		}



		/***************************************
			Drawing
		***************************************/

		var sketch = function(p) {
			let wefts         = [],
				numWefts,

				warps         = [],
				warpSettings  = [
					{
						color: 		'#777',
						pattern: 	[ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ]
					},
					{
						color: 		'#777',
						pattern: 	[ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0 ]
					}
				],
				numWarps      = warpSettings.length;

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

				for (let y = 0; y < numWarps; y++) {
					warps.push(new Warp({
						color:  	warpSettings[y].color,
						gap:        args.threadSpacing,
						step:       args.threadTotal,
						width:  	args.threadWidth,
						numWefts:   numWefts,
						pattern:	warpSettings[y].pattern
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

				currentWarpIndex = wrapIndex(currentWarpIndex + 1, 0, numWarps - 1);
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



			/***************************************
				Helper functions
			***************************************/

			var getNumWefts = function() {
				let minWidth      = Math.floor(p.width / args.threadTotal),
					maxWidth      = Math.ceil(minWidth / args.patternWidth) * args.patternWidth + Math.floor(0.5 * args.patternWidth);
				return maxWidth;
			}

			var wrapIndex = function(i, min, max) {
				if (i >= min && i <= max)	return i;
				if (i > max)				return min;
											return max;
			}
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