//---------------------------------------------------------------------
// JavaScript-HTML5 QRCode Generator
//
// Copyright (c) 2011 Amanuel Tewolde
//
// Licensed under the MIT license:
//   http://www.opensource.org/licenses/mit-license.php
//
//---------------------------------------------------------------------

// Generates a QRCode of text provided.
// First QRCode is rendered to a canvas.
// The canvas is then turned to an image PNG
// before being returned as an <img> tag.
//(function(app){}(qrShittery));
	function showQRCode(text, version, errorCorrectLevel, canvasSize)
	{
		var black = 'rgb(0,0,0)',white = 'rgb(255,255,255)',qrErrCorrectLevel = QRErrorCorrectLevel.L,QRCodeVersion = 10; // 1-40 see ☹http://dlike.co/cFbI5I1
		if(version!=undefined && version>=1 && version<=40)
		{
			QRCodeVersion = version;
		}

		// QR Code Error Correction Capability
		// Higher levels improves error correction capability while decreasing the amount of data QR Code size.
		// QRErrorCorrectLevel.L (5%) QRErrorCorrectLevel.M (15%) QRErrorCorrectLevel.Q (25%) QRErrorCorrectLevel.H (30%)
		// eg. L can survive approx 5% damage...etc.
		if(errorCorrectLevel!=undefined)
		{
			switch(errorCorrectLevel)
			{
				case 'L':
				case 'l':qrErrCorrectLevel = QRErrorCorrectLevel.L;break;
				case 'M':
				case 'm':qrErrCorrectLevel = QRErrorCorrectLevel.M;break;
				case 'Q':
				case 'q':qrErrCorrectLevel = QRErrorCorrectLevel.Q;break;
				case 'H':
				case 'h':qrErrCorrectLevel = QRErrorCorrectLevel.H;break;
			}
		}

		var canvas=document.createElement('canvas'),qrCanvasContext = canvas.getContext('2d'),qr=null;
		try {
			qr = new QRCode(QRCodeVersion, qrErrCorrectLevel);
			qr.addData(text);
			qr.make();
		}
		catch(err) {
			var errorChild = document.createElement('p'),errorMSG = document.createTextNode('QR Code FAIL! ' + err);
			errorChild.appendChild(errorMSG);
			return errorChild;
		}

		var margin = 4,qrsize = qr.getModuleCount(),qrSizeWithMargin = qrsize + 2*margin,qrSizeWith1SideMargin = qrsize + margin,dotsize=null,padding=null,shiftForPadding=null,r=null,c=null;//http://www.qrcode.com/en/qrgene4.html requires at least 4 modules around the code
		if(canvasSize==undefined)
		{
			canvasSize = 295;
		}
		canvas.setAttribute('height',canvasSize);
		canvas.setAttribute('width',canvasSize);

		dotsize = Math.max(1, Math.floor(canvasSize/qrSizeWithMargin));

		padding = canvasSize - dotsize*qrSizeWithMargin
		shiftForPadding = Math.floor(padding/2);
		if (canvas.getContext){
			for (r = 0; r < qrSizeWithMargin; r++)
			{
				for (c = 0; c < qrSizeWithMargin; c++)
				{
					if(r<margin || c<margin || r>=qrSizeWith1SideMargin || c>=qrSizeWith1SideMargin)
						qrCanvasContext.fillStyle = white;
					else if (qr.isDark(r-margin, c-margin))
						qrCanvasContext.fillStyle = black;
					else
						qrCanvasContext.fillStyle = white;

					qrCanvasContext.strokeStyle = black;
					qrCanvasContext.fillRect ((c*dotsize) +shiftForPadding,(r*dotsize) + shiftForPadding,dotsize,dotsize);   // x, y, w, h
				}
			}
		}
		return canvas;
	}
