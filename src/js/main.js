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
		p.setup = function() {
			createCanvas(400, 400);
		}

		p.draw = function() {
			background(220);
			ellipse(50, 50, 80, 80);
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