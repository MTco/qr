//(function(app){}(qrShittery));
	var QueryString=function(){
			var query_string={},query=document.location.search.substring(1),vars=query.split('&');
			for (var i=0;i<vars.length;i++)
			{
				var pair = vars[i].split('=');
				query_string[pair[0]] = pair[1];
			}
			return query_string;
	}();
	var isRunningInAddon = QueryString['isAddon'];

	if(isRunningInAddon && addon)//available as experimental feature for trusted panel source files in jetpack sdk
	{
		addon.port.on('myAddonScriptEvent', function(payloadFromAddon)
		{
			if(payloadFromAddon['event']=='showQR')
			{
				updateQRCode(payloadFromAddon['text'], payloadFromAddon['errorCorrectLevel'], payloadFromAddon['blockSize'], payloadFromAddon['showExtraUI']);
			}
		});
	}

	function pairVars(args,glue)
	{
		var vars=[],pair;
		glue=typeof glue === 'undefined' || glue === '' ? '&' : glue;
		args=args.split(glue);
		for (var i=0;i<args.length;i++)
		{
			pair = args[i].split('=');
			vars[pair[0]] = pair[1];
		}
		return vars;
	}

	var lastRequestedPanelSize,panelResizeTimer;
	function clearPanelResizeTimer()
	{
		if(panelResizeTimer && panelResizeTimer!=-1)
		{
			clearInterval(panelResizeTimer);
			panelResizeTimer = -1;
		}
	}
	function dispatchRequiredPanelSize(canvasSize)
	{
		clearPanelResizeTimer();

		if(isRunningInAddon && addon)
		{
			if(canvasSize==undefined)
			{
				var qrEle = document.getElementById('qrcode');
				if(qrEle)
				{
					canvasSize = qrEle.scrollWidth;
				}
			}

			var textAreaEle = null;//document.getElementById('text');
			if(textAreaEle)
			{
				textAreaEle.style.height = (canvasSize + 'px');
			}

			var nonQRSectionEle = document.getElementById('nonQRSection'),nonQRSectionEleWidth = 0, nonQRSectionEleHeight = 0,width=null,height=null;
			if(nonQRSectionEle)
			{
				nonQRSectionEleWidth = nonQRSectionEle.scrollWidth;
				nonQRSectionEleHeight = nonQRSectionEle.scrollHeight;
			}

			width = nonQRSectionEleWidth + canvasSize + 10;
			height = Math.max(canvasSize, nonQRSectionEleHeight) + 12;

			if(isNaN(height) || isNaN(width))
			{
				console.warn('couldn\'t calculate panel height/width for canvasSize: ' + canvasSize);
			}
			else if(lastRequestedPanelSize && lastRequestedPanelSize['height'] == height && lastRequestedPanelSize['width'] == width)
			{
				addon.port.emit('resizePanel', {'height': height, 'width': width});
				lastRequestedPanelSize = undefined;
			}
			else
			{
				lastRequestedPanelSize = {'height': height, 'width': width};
				panelResizeTimer = setInterval(function(){dispatchRequiredPanelSize(canvasSize)}, 100);
			}
		}
	}

	function strpos(haystack,needle,offset){var i=(haystack+'').indexOf(needle,(offset||0));return i===-1?false:i;};
	function convert(str){return str.replace(/\\u([a-f0-9]{4})/gi,function(found,code){return String.fromCharCode(parseInt(code,16));});}

	var pendingPayload,lastUpdateQRCodeParams,e,dislikeFace='\u2639',USflag='\uD83C\uDDFA\uD83C\uDDF8',tmp=null,httpd='http://',targetURL='',hash=location.hash || '';
	function updateQRCode(text, errorCorrectLevel, blockSize, showExtraUI)
	{
		if(!errorCorrectLevel)
		{
			errorCorrectLevel = (lastUpdateQRCodeParams && lastUpdateQRCodeParams['errorCorrectLevel'])?
										lastUpdateQRCodeParams['errorCorrectLevel']:
										QueryString['errorCorrectLevel'];
			if(errorCorrectLevel==undefined)errorCorrectLevel = 'L';
		}

		if(isNaN(blockSize) || blockSize<1 || blockSize>10)
		{
			blockSize = undefined;
		}
		if(!blockSize)
		{
			blockSize = (lastUpdateQRCodeParams && lastUpdateQRCodeParams['blockSize'])?
										lastUpdateQRCodeParams['blockSize']:
										QueryString['blockSize'];
			if(blockSize===undefined)blockSize = 3;
		}

		if(showExtraUI===undefined)
		{
			showExtraUI = (lastUpdateQRCodeParams && lastUpdateQRCodeParams['showExtraUI']);
			if(showExtraUI === undefined)showExtraUI = true;
		}

		handleShowExtraUI(showExtraUI);
		hash=hash.split('#').join('');
		hash=decodeURIComponent(hash);
		if(strpos(hash,'.qr') !== false){
			hash=hash.split('.qr').join('');
		}
		if(strpos(hash,'pres.me/') === false){
			tmp=dislikeFace;
			targetURL+='dlike.co/';
		}else{
			tmp=USflag;
			targetURL+='pres.me/';
		}
		tmp=convert(tmp);
		hash=hash.split(httpd+targetURL).join('').split(targetURL).join('').split(tmp).join('');
		if(strpos(hash,'&') !== false){
			hash=pairVars(hash,'&');
		}
		text=tmp+httpd+targetURL+hash;
		text = Utf8.encode(text);

		var reqVersion = -1, modCount = null, canvasSize = null, element = null, qr = null;
		try
		{
			reqVersion = getMinQRVersion(text.length, errorCorrectLevel);
		}
		catch(err)
		{
			console.error(err);
			return;
		}

		modCount = getModuleCountForVersion(reqVersion);
		canvasSize = Math.max(350, Math.min(400, (modCount+8)*blockSize));
		element = document.getElementById('qrcode');

		if(element)
		{
			qr=showQRCode(text, reqVersion, errorCorrectLevel, canvasSize);
			if(element.lastChild)
			  element.replaceChild(qr, element.lastChild);
			else
			  element.appendChild(qr);

			element.style.width = (canvasSize + 'px');

			dispatchRequiredPanelSize(canvasSize);

			lastUpdateQRCodeParams = {'errorCorrectLevel': errorCorrectLevel, 'blockSize': blockSize, 'showExtraUI': showExtraUI};
		}
		else
		{
			pendingPayload = {'text': text, 'errorCorrectLevel': errorCorrectLevel, 'blockSize': blockSize, 'showExtraUI': showExtraUI};
		}
	}
	function onLoad()
	{
		var textElement = null;//document.getElementById('text');
		if(textElement)
		{
			textElement.style.resize = (isRunningInAddon?'none':'both');

			if(QueryString['loadText'])
			{
				textElement.value = decodeURIComponent(decodeURIComponent(QueryString['loadText']));
				updateQRCodeWithTA();
			}
		}
		textElement=updateQRCode();

		//document.getElementById('openLink').style.display = (isRunningInAddon?'inline-block':'none');
		//document.getElementById('wrap').style.display = (isRunningInAddon?'-moz-box':'block');
		//document.getElementById('functionality').style.position = (isRunningInAddon?'absolute':'static');

		if(pendingPayload)
		{
			updateQRCode(pendingPayload['text'],
						pendingPayload['errorCorrectLevel'],
						pendingPayload['blockSize'],
						pendingPayload['showExtraUI']
						);
			pendingPayload = undefined;
		}
	}

	function updateTextAreaText(text)
	{
		var textArea = null;//document.getElementById('text');
		if(textArea)
		{
			var textAreaText = textArea.value;
			if(textAreaText!=text)
			{
				textArea.value = text;
			}
		}
	}

	function handleSaveClick()
	{
		var element = document.getElementById('qrcode');
		if(element)
		{
			if(element.lastChild)
			{
				var canvas = element.lastChild;
				canvas.toBlob(function(blob) {
					saveAs(blob,'QR.png');
				});
			}
		}
	}

	function handleOpenClick()
	{
		var textArea = null;//document.getElementById('text');
		if(textArea && addon)
		{
			addon.port.emit('openNew', {'text': encodeURIComponent(encodeURIComponent(textArea.value))});
		}
	}

	function handleZoomIn()
	{
		if(lastUpdateQRCodeParams)setZoomLevel(lastUpdateQRCodeParams['blockSize']+1);
	}
	function handleZoomOut()
	{
		if(lastUpdateQRCodeParams)setZoomLevel(lastUpdateQRCodeParams['blockSize']-1);
	}
	function setZoomLevel(zoomLevel)
	{
		if(isNaN(zoomLevel) || zoomLevel<1 || zoomLevel>10)return;

		if(lastUpdateQRCodeParams)lastUpdateQRCodeParams['blockSize']=zoomLevel;
		updateQRCodeWithTA();
		saveZoomPreference();

	}
	function saveZoomPreference()
	{
		if(isRunningInAddon && addon)
		{
			addon.port.emit('setBlockSize', lastUpdateQRCodeParams['blockSize']);
		}
	}

	function handleShowExtraUI(toShow)
	{
		var extraUIEle = document.getElementById('extraUI'),showExtraUIEle = document.getElementById('showExtraUI'),hideExtraUIEle = document.getElementById('hideExtraUI');

		if(lastUpdateQRCodeParams)lastUpdateQRCodeParams['showExtraUI'] = toShow;

		if(!isRunningInAddon)
		{
			//showExtraUIEle.style.display = 'none';
			//hideExtraUIEle.style.display = 'none';
		}
		else if(toShow)
		{
			extraUIEle.style.display = '-moz-box';
			showExtraUIEle.style.display = 'none';
			hideExtraUIEle.style.display = 'inline-block';
		}
		else
		{
			extraUIEle.style.display = 'none';
			showExtraUIEle.style.display = 'inline-block';
			hideExtraUIEle.style.display = 'none';
		}
		if(isRunningInAddon && addon)
		{
			addon.port.emit("showExtraUI", toShow);
		}

		dispatchRequiredPanelSize();
	}

	function updateQRCodeWithTA()
	{
		clearTAChangeTimer();
		var textArea = null;//document.getElementById('text');
		if(textArea)
		{
			updateQRCode(textArea.value);
		}
	}

	var taChangeTimer;
	function clearTAChangeTimer()
	{
		if(taChangeTimer && taChangeTimer!==-1)
		{
			clearInterval(taChangeTimer);
			taChangeTimer = -1;
		}
	}
	function handleTAChange()
	{
		clearTAChangeTimer();
		taChangeTimer = setInterval((function(){updateQRCode()}), 200);
	}
