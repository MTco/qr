function convert(str){return str.replace(/\\u([a-f0-9]{4})/gi,function(found,code){return String.fromCharCode(parseInt(code,16));});}

var generateLogo=function(){
	var qr_w='200',qr_h='200',logo_width='64',logo_height='64',logo_x_offset='64',logo_y_offset='64',img,data,err,canvasImg,logo='http://dlike.co/favicon_64.png',e,face=convert('\u2639'),text=face+' '+window.location;

	document.getElementById('text').value=text;

	$('#qrcode').qrcode({ width: qr_w, height: qr_h, text: text });
	var canvas=document.getElementsByTagName('canvas')['0'],ctx=canvas.getContext('2d');

	ctx.fillStyle="rgb(255,255,255)";
	ctx.fillRect(logo_x_offset,logo_y_offset,logo_width,logo_height);

	img=new Image();
	img.addEventListener('load',function(){
		ctx.drawImage(this,logo_x_offset,logo_y_offset,logo_width,logo_height);
		canvas.style.display='none';
		try{
			data=canvas.toDataURL('image/png');
		}
		catch(err){
			alert('The image '+logo+' cannot be loaded because it is from another site.\n\nTo fix this you can:\n\n1. Use chrome with the \'--disable-web-security\' argument\n\nOR\n\n2. Load the image with a URL that starts with:\n\n\t'+window.location.origin);
		}
		canvasImg=document.getElementById('canvasImg');
		canvasImg.src=data;
		canvasImg.style.display='block';
	},false);
	img.src=logo;
};
$(document).ready(function(){
	var face=convert('\u2639'),text=face+' '+window.location;
	document.getElementById('text').value=text;
	handleTAChange();
});
