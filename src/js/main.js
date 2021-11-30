"use strict";

(function() {

	/***************************************
		Common methods
	***************************************/

	var vpWidth = function() { return Math.max(document.documentElement.clientWidth, window.innerWidth || 0); }
	var vpHeight = function() { return Math.max(document.documentElement.clientHeight, window.innerHeight || 0); }

	
	var resizer, sketchContainer, p5Sketch;

	var init = function() {
		resizer           = resizeBody();
		sketchContainer   = document.querySelector('.sketch-container');

		if (sketchContainer)
			p5Sketch          = new p5(sketch, sketchContainer);

		credits();
	}



	/***************************************
		Resize body
	***************************************/

	var resizeBody = function() {
		var changeHeight = function() {
			var root = document.documentElement,
				height = window.innerHeight,
				width  = vpWidth(),
				vw = 0.01 * document.body.clientWidth,
				vh = 0.01 * window.innerHeight;

			root.style.setProperty('--vw', vw + 'px');
			root.style.setProperty('--vh', vh + 'px');
			document.body.style.height = window.innerHeight + 'px';
		}

		setTimeout(changeHeight, 20);
		window.addEventListener('resize', changeHeight);

		return changeHeight;
	}



	/***************************************
		Loom
	***************************************/

	var sketch = function(p) {

		/* horizontal threads */
		class Warp {
			constructor(args) {
				this.args = args;
			}

			weave() {

			}
		}


		/* vertical threads */
		class Weft {
			constructor(args) {
				this.args  = args;
				this.lastY = 0;
			}

			weave(newY) {
				p.strokeCap(p.SQUARE);
				p.strokeWeight(this.args.width);
				p.stroke(this.args.color);
				p.line(this.args.x, this.lastY, this.args.x, newY);
				this.lastY = newY;
			}
		}

		let threadWidth   = 4,
			threadSpacing = 1,
			threadTotal   = threadWidth + threadSpacing,

			wefts         = [],
			weftColors    = ['#777', '#777', '#999', '#999', '#BBB', '#BBB'],
			numWefts,

			warps         = [],
			warpColors    = ['#777', '#777', '#999', '#999', '#BBB', '#BBB'];

		let	currentWarp   = 0,
			currentWeft   = 0;


		var saveFrame = function() {
			let now      = new Date(),
				fileName = 'loom_' + now.getFullYear() + '-' + (now.getMonth() + 1) + '-' + now.getDate()
						 + ' ' + now.getHours() + '-' + now.getMinutes() + '-' + now.getSeconds();
			p.save(fileName + '.jpg');
		}

		p.setup = function() {
			p.createCanvas(sketchContainer.clientWidth, sketchContainer.clientHeight);
			sketchContainer.addEventListener('click', saveFrame);
			numWefts = Math.floor(p.width / threadTotal);

			for (let i = 0; i < numWefts; i++) {
				wefts.push(new Weft({
					x:    		i * threadTotal,
					color:		weftColors[i % weftColors.length],
					width:		threadWidth
				}));
			}

			for (let i = 0; i < warpColors.length; i++) {
				warps.push(new Warp({
					y: 			i * threadTotal,
					color:  	warpColors[i],
					width:  	threadWidth,
					pattern:	[ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ]
				}));
			}

			p.background(255);
		}

		p.draw = function() {
			if (currentWarp > p.height)
				return p.noLoop();

			wefts.forEach(weft => weft.weave(currentWarp))
			currentWarp += threadTotal;
		}
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