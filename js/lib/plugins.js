$(function () {
	$(".placeholder").click(function (e) {
		if (!$(e.target).hasClass('placeholder-input'))
			$(this).find('.placeholder-input').focus();

	});
	$(".placeholder .placeholder-input")
	.on('click.placeholderInput focus.placeholderInput', function () {
		$(this)
		.closest('.placeholder')
		.addClass('placeholder-focus')
		.trigger('placeholder-focus')
		.trigger('change');
	})
	.on('blur.placeholderInput', function () {
		$(this)
		.closest('.placeholder')
		.removeClass('placeholder-focus')
		.trigger('placeholder-blur')
		.trigger('change');
	});
	$(".placeholder")
	.on('change.placeholderInput', function () {
		if ($(this).find('.placeholder-input').val() != "") {
			$(this).addClass('has-data');
		} else {
			$(this).removeClass('has-data');
		}
	})
	.on('update.placeholderInput', function () {
		var $this = $(this);
		$.delay(1, function () {
			$this.find(".placeholder-input").trigger('click blur change');
			$this.trigger('change');
		});
	});
	$.plugin('stackUpdate', function () {
		var 
		$this = this,
		strEvents = 'keyup.stackUpdate click.stackUpdate blur.stackUpdate change.stackUpdate',
		refUpdateDelay,
		strCurrentValue = $this.val();
		if ($this.hasClass('stackUpdate'))
			return $this;
		$this
		.addClass('stackUpdate')
		.bind(strEvents, function () {
			var strName = $this.attr('name'),
			strVal = $this.val();
			
			if (strName == 'value' && !strVal.match(/^https?:\/\//i))
				strVal = "https://" + strVal;
			else if (strVal == '')
			{
				$this.addClass('error');
				return;
			} else {
				$this.removeClass('error');
			}
			
			window.clearTimeout(refUpdateDelay);
			if (
				$this.hasClass('error')
				|| strCurrentValue == strVal
			)
				return;
			
			strCurrentValue = strVal;
			refUpdateDelay = app.setStackUpdateTimeout(strVal, strName); 

			
		});
		return $this;
	});
})