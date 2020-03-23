
(function(global, $, factory) {
	if (typeof define === "function" && define.amd) {
		define(function() {
			return factory($, global);
		});
	} else if (typeof exports !== "undefined") {
		module.exports = factory($, global);
	} else {
		global.pinpad = factory($, global);
	}
})(window, jQuery, function($, window) {


var tmplt = ' \
<div class="pinpad-dimmed [[SKIN]]"> \
  <div class="wrapper"> \
    <div class="inner_wrapper"> \
      <div class="high"> \
        <div class="pin-board"> \
          <div class="pin-desc">[[DESC]]</div> \
          <div class="pin"></div> \
        </div> \
      </div> \
      <div class="low"> \
        <div class="pinpad"> \
          <div></div> \
          <div class="pads">  \
            [[NUMBERS]] \
          </div> \
        </div> \
      </div> \
    </div> \
  </div> \
</div>';
var pinpadCount = 0;
var $pinpad = null;
var text = '';
var formattedText = '';
var curPinpad;

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min; //최댓값은 제외, 최솟값은 포함
}

function setRandomBlank(list) {
	var p = getRandomInt(0, list.length);
	var tmp = list.splice(0, p);
	tmp.push('');
	return tmp.concat(list);
}
function replacerKey(op, key) {
	if(!op.letterReplace)
		return key;

	if(!op.letterReplace[key]) {
		switch(key) {
			case 'dot':
				return '.';	//default
			default:
				return key;
		}
	}
	return op.letterReplace[key];
}

function done(text, formattedText) {
  if(curPinpad.op.ref) {
    if(curPinpad.op.ref.usePattern)
      $(curPinpad.op.ref.el).val(formattedText);
    else
      $(curPinpad.op.ref.el).val(text);
    // $(curPinpad.op.ref.el).blur();
  }
  curPinpad.op.oncomplete && curPinpad.op.oncomplete(text);
  closePinpad();
}

function keyevent(e) {
	var $elem = $(e.target);
	if($elem.data('key') == undefined)
		$elem = $elem.parents('.number');
	var key = $elem.data('key');

	switch(key) {
		case 'dot':
			break;
		case 'del':
			if(text.length > 0)
				text = text.substring(0, text.length - 1);
			break;
		case 'done':
      done(text, formattedText);
			break;
		default :
			if(!curPinpad.op.maxLength || text.length < curPinpad.op.maxLength)
				text = text + key;
			break;
	}

	formattedText = text;

	if(curPinpad.op.format) {
		var idx = 0;
		var tmp = curPinpad.op.format;
		
		for(var i = 0; i < text.length; i++) {
			var ch = text[i];
			tmp = tmp.replace(/[*]/, ch);
		}

		var p = tmp.indexOf('*');
		if(p >= 0)
			tmp = tmp.substring(0, p);
		formattedText = tmp;
	}

  if(curPinpad.op.immediate && text.length == curPinpad.op.maxLength) {
    done(text, formattedText);
  }

	var viewText = formattedText || text;
	if(curPinpad.op.passcode == true)
		viewText = viewText.replace(/[\w\W]/g, '●');

	$pin.text(viewText);


	e.stopPropagation();
	e.preventDefault();
}

function closePinpad() {
	$('body').removeClass('pinpad-noscroll');
	$(".pinpad-dimmed").remove();
	
	$pinpad.remove();
	$pinpad = null;
}

function showPinpad(pinpadInfo) {
	if($pinpad)
		return;

	text = '';
  $pinpad = $(pinpadInfo.tmplt);
  if($(window).width() > 500)
    $pinpad.addClass('window');
  
	$('body').addClass('pinpad-noscroll').append($pinpad);
	$pinpad.on('touchstart, click', '.number', keyevent);
	// $pinpad.on('click', '.number', keyevent);
  $pin = $pinpad.find('.pin');
  curPinpad = pinpadInfo;
    
}
	
function create(user_op) {		
	var pinid = 'pinpad' + pinpadCount;
	pinpadCount++;

	var pinpadInfo = {
		op : user_op || {},
	};
	pinpadInfo.op.mode = pinpadInfo.op.mode || 'x3';
	pinpadInfo.op.keypads = pinpadInfo.op.keypads || [1, 2, 3, 4, 5, 6, 7, 8, 9, 'del', 0, 'done'];
	pinpadInfo.op.height = pinpadInfo.op.height || 60;
	pinpadInfo.op.desc = pinpadInfo.op.desc || 'PIN CODE';
	pinpadInfo.op.skin = pinpadInfo.op.skin || '';
	pinpadInfo.op.setRandomSpaceCount = pinpadInfo.op.setRandomSpaceCount || 0;
	
	var newKeypad = [];
	var blankCount = 0;
	if(pinpadInfo.op.setRandomSpaceCount > 0) {
		var subListSize = Math.ceil(pinpadInfo.op.keypads.length / pinpadInfo.op.setRandomSpaceCount);
		while(pinpadInfo.op.keypads.length > 0) {
			var subList = pinpadInfo.op.keypads.splice(0, subListSize);
			newKeypad = newKeypad.concat(setRandomBlank(subList));
			blankCount++;
		}
		
		while(blankCount < pinpadInfo.op.setRandomSpaceCount) {
			newKeypad = setRandomBlank(newKeypad);
			blankCount++;
		}
		pinpadInfo.op.keypads = newKeypad;
	}

	

	if(pinpadInfo.op.format) {
		pinpadInfo.op.maxLength = pinpadInfo.op.format.replace(/[^*]/g, '').length;
	}

	var numbers = '';
	for(var i = 0; i < pinpadInfo.op.keypads.length; i++) {
		var key = pinpadInfo.op.keypads[i];
		var keypad = replacerKey(pinpadInfo.op, key);
		numbers	+= '<div class="number ' + pinpadInfo.op.mode + '" style="line-height:' + pinpadInfo.op.height + 'px;" data-key="'+ key + '"><span>' + keypad + '</span>&#8203;</div>';
	}
	
	pinpadInfo.tmplt = tmplt.replace('[[NUMBERS]]', numbers);
	pinpadInfo.tmplt = pinpadInfo.tmplt.replace('[[DESC]]', pinpadInfo.op.desc);
	pinpadInfo.tmplt = pinpadInfo.tmplt.replace('[[SKIN]]', pinpadInfo.op.skin);

	if(pinpadInfo.op.ref) {
		if(!pinpadInfo.op.ref.el)
			throw new Error('el is undefined');
    
    $(pinpadInfo.op.ref.el).on('click', function() {
      $(this).blur();
			showPinpad(pinpadInfo);
		});
	}
	
	return {
		show : showPinpad.bind(this, pinpadInfo)
	};
}

return create;


});

