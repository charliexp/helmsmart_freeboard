// ┌────────────────────────────────────────────────────────────────────┐ \\
// │ F R E E B O A R D                                                  │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2013 Jim Heising (https://github.com/jheising)         │ \\
// │ Copyright © 2013 Bug Labs, Inc. (http://buglabs.net)               │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Licensed under the MIT license.                                    │ \\
// └────────────────────────────────────────────────────────────────────┘ \\

(function () {
	var SPARKLINE_HISTORY_LENGTH = 100;
	var SPARKLINE_COLORS = ["#FF9900", "#FFFFFF", "#B3B4B4", "#6B6B6B", "#28DE28", "#13F7F9", "#E6EE18", "#C41204", "#CA3CB8", "#0B1CFB"];

    function easeTransitionText(newValue, textElement, duration) {

		var currentValue = $(textElement).text();

        if (currentValue == newValue)
            return;

        if ($.isNumeric(newValue) && $.isNumeric(currentValue)) {
            var numParts = newValue.toString().split('.');
            var endingPrecision = 0;

            if (numParts.length > 1) {
                endingPrecision = numParts[1].length;
            }

            numParts = currentValue.toString().split('.');
            var startingPrecision = 0;

            if (numParts.length > 1) {
                startingPrecision = numParts[1].length;
            }

            jQuery({transitionValue: Number(currentValue), precisionValue: startingPrecision}).animate({transitionValue: Number(newValue), precisionValue: endingPrecision}, {
                duration: duration,
                step: function () {
                    $(textElement).text(this.transitionValue.toFixed(this.precisionValue));
                },
                done: function () {
                    $(textElement).text(newValue);
                }
            });
        }
        else {
            $(textElement).text(newValue);
        }
    }

	function addSparklineLegend(element, legend) {
		var legendElt = $("<div class='sparkline-legend'></div>");
		for(var i=0; i<legend.length; i++) {
			var color = SPARKLINE_COLORS[i % SPARKLINE_COLORS.length];
			var label = legend[i];
			legendElt.append("<div class='sparkline-legend-value'><span style='color:" +
							 color + "'>&#9679;</span>" + label + "</div>");
		}
		element.empty().append(legendElt);

		freeboard.addStyle('.sparkline-legend', "margin:5px;");
		freeboard.addStyle('.sparkline-legend-value',
			'color:white; font:10px arial,san serif; float:left; overflow:hidden; width:50%;');
		freeboard.addStyle('.sparkline-legend-value span',
			'font-weight:bold; padding-right:5px;');
	}

	function addValueToSparkline(element, value, legend) {
		var values = $(element).data().values;
		var valueMin = $(element).data().valueMin;
		var valueMax = $(element).data().valueMax;
		if (!values) {
			values = [];
			valueMin = undefined;
			valueMax = undefined;
		}

		var collateValues = function(val, plotIndex) {
			if(!values[plotIndex]) {
				values[plotIndex] = [];
			}
			if (values[plotIndex].length >= SPARKLINE_HISTORY_LENGTH) {
				values[plotIndex].shift();
			}
			values[plotIndex].push(Number(val));

			if(valueMin === undefined || val < valueMin) {
				valueMin = val;
			}
			if(valueMax === undefined || val > valueMax) {
				valueMax = val;
			}
		}

		if(_.isArray(value)) {
			_.each(value, collateValues);
		} else {
			collateValues(value, 0);
		}
		$(element).data().values = values;
		$(element).data().valueMin = valueMin;
		$(element).data().valueMax = valueMax;

		var tooltipHTML = '<span style="color: {{color}}">&#9679;</span> {{y}}';

		var composite = false;
		_.each(values, function(valueArray, valueIndex) {
			$(element).sparkline(valueArray, {
				type: "line",
				composite: composite,
				height: "100%",
				width: "100%",
				fillColor: false,
				lineColor: SPARKLINE_COLORS[valueIndex % SPARKLINE_COLORS.length],
				lineWidth: 2,
				spotRadius: 3,
				spotColor: false,
				minSpotColor: "#78AB49",
				maxSpotColor: "#78AB49",
				highlightSpotColor: "#9D3926",
				highlightLineColor: "#9D3926",
				chartRangeMin: valueMin,
				chartRangeMax: valueMax,
				tooltipFormat: (legend && legend[valueIndex])?tooltipHTML + ' (' + legend[valueIndex] + ')':tooltipHTML
			});
			composite = true;
		});
	}

	var valueStyle = freeboard.getStyleString("values");

	freeboard.addStyle('.widget-big-text', valueStyle + "font-size:75px;");
	freeboard.addStyle('.widget-huge-text', valueStyle + "font-size:150px;");

	freeboard.addStyle('.tw-display', 'width: 100%; height:100%; display:table; table-layout:fixed;');

	freeboard.addStyle('.tw-tr',
		'display:table-row;');

	freeboard.addStyle('.tw-tg',
		'display:table-row-group;');

	freeboard.addStyle('.tw-tc',
		'display:table-caption;');

	freeboard.addStyle('.tw-td',
		'display:table-cell;');

	freeboard.addStyle('.tw-value',
		valueStyle +
		'overflow: hidden;' +
		'display: inline-block;' +
		'text-overflow: ellipsis;');

	freeboard.addStyle('.tw-unit',
		'display: inline-block;' +
		'padding-left: 10px;' +
		'padding-bottom: 1.1em;' +
		'vertical-align: bottom;');

	freeboard.addStyle('.tw-value-wrapper',
		'position: relative;' +
		'vertical-align: middle;' +
		'height:100%;');

	freeboard.addStyle('.tw-sparkline',
		'height:20px;');

    var textWidget = function (settings) {

        var self = this;

        var currentSettings = settings;
		var displayElement = $('<div class="tw-display"></div>');
		var titleElement = $('<h2 class="section-title tw-title tw-td"></h2>');
        var valueElement = $('<div class="tw-value"></div>');
        var unitsElement = $('<div class="tw-unit"></div>');
        var sparklineElement = $('<div class="tw-sparkline tw-td"></div>');

		function updateValueSizing()
		{
			if(!_.isUndefined(currentSettings.units) && currentSettings.units != "") // If we're displaying our units
			{
				valueElement.css("max-width", (displayElement.innerWidth() - unitsElement.outerWidth(true)) + "px");
			}
			else
			{
				valueElement.css("max-width", "100%");
			}
		}

        this.render = function (element) {
			$(element).empty();

			$(displayElement)
				.append($('<div class="tw-tr"></div>').append(titleElement))
				.append($('<div class="tw-tr"></div>').append($('<div class="tw-value-wrapper tw-td"></div>').append(valueElement).append(unitsElement)))
				.append($('<div class="tw-tr"></div>').append(sparklineElement));

			$(element).append(displayElement);

			updateValueSizing();
        }

        this.onSettingsChanged = function (newSettings) {
            currentSettings = newSettings;

			var shouldDisplayTitle = (!_.isUndefined(newSettings.title) && newSettings.title != "");
			var shouldDisplayUnits = (!_.isUndefined(newSettings.units) && newSettings.units != "");

			if(newSettings.sparkline)
			{
				sparklineElement.attr("style", null);
			}
			else
			{
				delete sparklineElement.data().values;
				sparklineElement.empty();
				sparklineElement.hide();
			}

			if(shouldDisplayTitle)
			{
				titleElement.html((_.isUndefined(newSettings.title) ? "" : newSettings.title));
				titleElement.attr("style", null);
			}
			else
			{
				titleElement.empty();
				titleElement.hide();
			}

			if(shouldDisplayUnits)
			{
				unitsElement.html((_.isUndefined(newSettings.units) ? "" : newSettings.units));
				unitsElement.attr("style", null);
			}
			else
			{
				unitsElement.empty();
				unitsElement.hide();
			}

			var valueFontSize = 30;

			if(newSettings.size == "big")
			{
				valueFontSize = 75;

				if(newSettings.sparkline)
				{
					valueFontSize = 60;
				}
			}
			else if(newSettings.size == "huge")
			{
				valueFontSize = 150;

				if(newSettings.sparkline)
				{
					valueFontSize = 125;
				}
			}

			valueElement.css({"font-size" : valueFontSize + "px"});

			updateValueSizing();
        }

		this.onSizeChanged = function()
		{
			updateValueSizing();
		}

        this.onCalculatedValueChanged = function (settingName, newValue) {
            if (settingName == "value") 
			{
				value = newValue[0].value;

                if (currentSettings.animate) {
                    easeTransitionText(value, valueElement, 500);
                }
                else {
                    valueElement.text(value);
                }

				
                if (currentSettings.sparkline) {
					for(i=0; i< newValue.length; i++)
                    addValueToSparkline(sparklineElement, newValue[i].value);
                }
            }
        }

        this.onDispose = function () {

        }

        this.getHeight = function () {
			 if (currentSettings.size == "huge" ) {
                return 4;
            }
            else if (currentSettings.size == "big" ) {
                return 2;
            }
            else {
                return 1;
            }
        }

        this.onSettingsChanged(settings);
    };

    freeboard.loadWidgetPlugin({
        type_name: "text_widget",
        display_name: "HelmSmart Array Text",
		description: "Text Box - uses HelmSmart Data source to grab selected array span - plots first point in array",
        "external_scripts" : [
            //"plugins/thirdparty/jquery.sparkline.min.js"
			"https://helmsmart-freeboard.herokuapp.com/static/plugins/thirdparty/jquery.sparkline.min.js"
        ],
        settings: [
            {
                name: "title",
                display_name: "Title",
                type: "text"
            },
            {
                name: "size",
                display_name: "Size",
                type: "option",
                options: [
                    {
                        name: "Regular",
                        value: "regular"
                    },
                    {
                        name: "Big",
                        value: "big"
                    },
					{
                        name: "Huge",
                        value: "huge"
                    }
                ]
            },
            {
                name: "value",
                display_name: "Value",
                type: "calculated"
            },
            {
                name: "sparkline",
                display_name: "Include Sparkline",
                type: "boolean"
            },
            {
                name: "animate",
                display_name: "Animate Value Changes",
                type: "boolean",
                default_value: true
            },
            {
                name: "units",
                display_name: "Units",
                type: "text"
            }
        ],
        newInstance: function (settings, newInstanceCallback) {
            newInstanceCallback(new textWidget(settings));
        }
    });

    var gaugeID = 0;
	freeboard.addStyle('.gauge-widget-wrapper', "width: 100%;text-align: center;");
	freeboard.addStyle('.gauge-widget', "width:200px;height:160px;display:inline-block;");

    var gaugeWidget = function (settings) {
        var self = this;

        var thisGaugeID = "gauge-" + gaugeID++;
        var titleElement = $('<h2 class="section-title"></h2>');
        var gaugeElement = $('<div class="gauge-widget" id="' + thisGaugeID + '"></div>');

        var gaugeObject;
        var rendered = false;

        var currentSettings = settings;

        function createGauge() {
            if (!rendered) {
                return;
            }

            gaugeElement.empty();

            gaugeObject = new JustGage({
                id: thisGaugeID,
                value: (_.isUndefined(currentSettings.min_value) ? 0 : currentSettings.min_value),
                min: (_.isUndefined(currentSettings.min_value) ? 0 : currentSettings.min_value),
                max: (_.isUndefined(currentSettings.max_value) ? 0 : currentSettings.max_value),
                label: currentSettings.units,
                showInnerShadow: false,
                valueFontColor: "#d3d4d4"
            });
        }

        this.render = function (element) {
            rendered = true;
            $(element).append(titleElement).append($('<div class="gauge-widget-wrapper"></div>').append(gaugeElement));
            createGauge();
        }

        this.onSettingsChanged = function (newSettings) {
            if (newSettings.min_value != currentSettings.min_value || newSettings.max_value != currentSettings.max_value || newSettings.units != currentSettings.units) {
                currentSettings = newSettings;
                createGauge();
            }
            else {
                currentSettings = newSettings;
            }

            titleElement.html(newSettings.title);
        }

        this.onCalculatedValueChanged = function (settingName, newValue) {
            if (!_.isUndefined(gaugeObject)) {
				
                gaugeObject.refresh(Number(newValue[0].value));
            }
        }

        this.onDispose = function () {
        }

        this.getHeight = function () {
            return 3;
        }

        this.onSettingsChanged(settings);
    };

    freeboard.loadWidgetPlugin({
        type_name: "gauge",
        display_name: "HelmSmart Array Gauge",
		description: "Gauge - uses HelmSmart Data source to grab selected array span - plots only first point in array",
        "external_scripts" : [
            //"plugins/thirdparty/raphael.2.1.0.min.js",
            //"plugins/thirdparty/justgage.1.0.1.js"
			"https://helmsmart-freeboard.herokuapp.com/static/plugins/thirdparty/raphael.2.1.0.min.js",
			"https://helmsmart-freeboard.herokuapp.com/static/plugins/thirdparty/justgage.1.0.1.js"
        ],
        settings: [
            {
                name: "title",
                display_name: "Title",
                type: "text"
            },
            {
                name: "value",
                display_name: "Value",
                type: "calculated"
            },
            {
                name: "units",
                display_name: "Units",
                type: "text"
            },
            {
                name: "min_value",
                display_name: "Minimum",
                type: "text",
                default_value: 0
            },
            {
                name: "max_value",
                display_name: "Maximum",
                type: "text",
                default_value: 100
            }
        ],
        newInstance: function (settings, newInstanceCallback) {
            newInstanceCallback(new gaugeWidget(settings));
        }
    });


	freeboard.addStyle('.sparkline', "width:100%;height: 75px;");
    var sparklineWidget = function (settings) {
        var self = this;

        var titleElement = $('<h2 class="section-title"></h2>');
        var sparklineElement = $('<div class="sparkline"></div>');
		var sparklineLegend = $('<div></div>');
		var currentSettings = settings;
		var arrayvalues = [];

        this.render = function (element) {
            $(element).append(titleElement).append(sparklineElement).append(sparklineLegend);
        }

        this.onSettingsChanged = function (newSettings) {
			currentSettings = newSettings;
            titleElement.html((_.isUndefined(newSettings.title) ? "" : newSettings.title));

			if(newSettings.include_legend) {
				addSparklineLegend(sparklineLegend,  newSettings.legend.split(","));
			}
        }

        this.onCalculatedValueChanged = function (settingName, newValue) {
			// newValue is an array of arrays
			// each sub arry is a series of data points
			// there is an arry for each sparkline
			
			// get number of points to plot for the series
			// assume all series have the saem number of points ??
			length=newValue[0].length;
			
			for(i=0; i< length; i++)
			{
				// empty the series points
				arrayvalues = [];
				
				// add a point from each series
				for(j=0; j< newValue.length; j++)
					arrayvalues.push(newValue[j][i].value);
					
					// now pass the serries of points into the plot routine 
					if (currentSettings.legend) {
					
						addValueToSparkline(sparklineElement,  arrayvalues, currentSettings.legend.split(","));
					} else {
						
							addValueToSparkline(sparklineElement, arrayvalues);
						
					}
			}
        }

        this.onDispose = function () {
        }

        this.getHeight = function () {
			var legendHeight = 0;
			if (currentSettings.include_legend && currentSettings.legend) {
				var legendLength = currentSettings.legend.split(",").length;
				if (legendLength > 4) {
					legendHeight = Math.floor((legendLength-1) / 4) * 0.5;
				} else if (legendLength) {
					legendHeight = 0.5;
				}
			}
			return 2 + legendHeight;
        }

        this.onSettingsChanged(settings);
    };

    freeboard.loadWidgetPlugin({
        type_name: "sparkline",
        display_name: "HelmSmart Array Sparkline",
		description: "Historical Sparkline- uses HelmSmart Data source to grab selected array span - plots all points in array",
        "external_scripts" : [
            //"plugins/thirdparty/jquery.sparkline.min.js"
			"https://helmsmart-freeboard.herokuapp.com/static/plugins/thirdparty/jquery.sparkline.min.js"
			//"https://helmsmart-freeboard.herokuapp.com/static/plugins/thirdparty/raphael.2.1.0.min.js",
			//"https://helmsmart-freeboard.herokuapp.com/static/plugins/thirdparty/justgage.1.0.1.js"
        ],
        settings: [
            {
                name: "title",
                display_name: "Title",
                type: "text"
            },
            {
                name: "value",
                display_name: "Value",
                type: "calculated",
				multi_input: "true"
            },
			{
				name: "include_legend",
				display_name: "Include Legend",
				type: "boolean"
			},
			{
				name: "legend",
				display_name: "Legend",
				type: "text",
				description: "Comma-separated for multiple sparklines"
			}
        ],
        newInstance: function (settings, newInstanceCallback) {
            newInstanceCallback(new sparklineWidget(settings));
        }
    });

	freeboard.addStyle('div.pointer-value', "position:absolute;height:95px;margin: auto;top: 0px;bottom: 0px;width: 100%;text-align:center;");
    var pointerWidget = function (settings) {
        var self = this;
        var paper;
        var strokeWidth = 3;
        var triangle;
        var width, height;
        var currentValue = 0;
        var valueDiv = $('<div class="widget-big-text"></div>');
        var unitsDiv = $('<div></div>');

        function polygonPath(points) {
            if (!points || points.length < 2)
                return [];
            var path = []; //will use path object type
            path.push(['m', points[0], points[1]]);
            for (var i = 2; i < points.length; i += 2) {
                path.push(['l', points[i], points[i + 1]]);
            }
            path.push(['z']);
            return path;
        }

        this.render = function (element) {
            width = $(element).width();
            height = $(element).height();

            var radius = Math.min(width, height) / 2 - strokeWidth * 2;

            paper = Raphael($(element).get()[0], width, height);
            var circle = paper.circle(width / 2, height / 2, radius);
            circle.attr("stroke", "#FF9900");
            circle.attr("stroke-width", strokeWidth);

            triangle = paper.path(polygonPath([width / 2, (height / 2) - radius + strokeWidth, 15, 20, -30, 0]));
            triangle.attr("stroke-width", 0);
            triangle.attr("fill", "#fff");

            $(element).append($('<div class="pointer-value"></div>').append(valueDiv).append(unitsDiv));
        }

        this.onSettingsChanged = function (newSettings) {
            unitsDiv.html(newSettings.units);
        }

        this.onCalculatedValueChanged = function (settingName, newValue) {
			var datavalue = newValue[0].value;
			
			if (!isNaN(datavalue))
			{
				if (settingName == "direction") {
					if (!_.isUndefined(triangle)) {
						var direction = "r";

						var oppositeCurrent = currentValue + 180;

						if (oppositeCurrent < datavalue) {
							//direction = "l";
						}

						triangle.animate({transform: "r" + datavalue + "," + (width / 2) + "," + (height / 2)}, 250, "bounce");
					}

					currentValue = datavalue;
				}
				else if (settingName == "value_text") {
					valueDiv.html(datavalue);
				}
			}
        }

        this.onDispose = function () {
        }

        this.getHeight = function () {
            return 4;
        }

        this.onSettingsChanged(settings);
    };

    freeboard.loadWidgetPlugin({
        type_name: "pointer",
        display_name: "HelmSmart Array Pointer",
		description: "Radial Pointer Gauge - uses HelmSmart Data source to grab selected array span - plots only first point in array",
        "external_scripts" : [
            //"plugins/thirdparty/raphael.2.1.0.min.js"
						//"https://helmsmart-freeboard.herokuapp.com/static/plugins/thirdparty/jquery.sparkline.min.js"
			"https://helmsmart-freeboard.herokuapp.com/static/plugins/thirdparty/raphael.2.1.0.min.js",
			//"https://helmsmart-freeboard.herokuapp.com/static/plugins/thirdparty/justgage.1.0.1.js"
        ],
        settings: [
            {
                name: "direction",
                display_name: "Direction",
                type: "calculated",
                description: "In degrees"
            },
            {
                name: "value_text",
                display_name: "Value Text",
                type: "calculated"
            },
            {
                name: "units",
                display_name: "Units",
                type: "text"
            }
        ],
        newInstance: function (settings, newInstanceCallback) {
            newInstanceCallback(new pointerWidget(settings));
        }
    });

 var vgaugeID = 0;
	freeboard.addStyle('.vgauge-widget-wrapper', "width: 100%;text-align: center;");
	freeboard.addStyle('.vgauge-widget', "width:150px;height:160px;display:inline-block;");
	
	
 var verticalgaugeWidget = function (settings) {
       // var titleElement = $('<h2 class="section-title"></h2>');
       // var gaugeElement = $('<div></div>');
		

        //var gaugeElement = $('<div></div>');

		var thisGaugeID = "gauge-" + gaugeID++;
        var titleElement = $('<h2 class="section-title"></h2>');
        var gaugeElement = $('<div class="vgauge-widget" id="' + thisGaugeID + '"></div>');
		
		
		
        var self = this;
        var paper = null;
        var gaugeFill = null;
        var rect;
        var width, height;
        var valueText, unitsText;
        var minValueLabel, maxValueLabel;
        //var currentValue = 0;
        //var colors = ["#a9d70b", "#f9c802", "#ff0000"];

        var currentSettings = settings;

        /* get the color for a fill percentage
           these colors match the justGage library for radial guagues */
        function getColor(fillPercent) {
            // mix colors
            // green rgb(169,215,11) #a9d70b
            // yellow rgb(249,200,2) #f9c802
            // red rgb(255,0,0) #ff0000

            if (fillPercent >= 0.5 ) {
                fillPercent = 2 * fillPercent - 1;
                var R = fillPercent * 255 + (1 - fillPercent) * 249;
                var G = fillPercent * 0 + (1 - fillPercent) * 200;
                var B = fillPercent * 0 + (1 - fillPercent) * 2;
            }
            else {
                fillPercent = 2 * fillPercent;
                var R = fillPercent * 249 + (1 - fillPercent) * 169;
                var G = fillPercent * 200 + (1 - fillPercent) * 215;
                var B = fillPercent * 2 + (1 - fillPercent) * 11;
            }

            return "rgb(" + Math.round(R) + "," + Math.round(G) + "," + Math.round(B) + ")"
        }

        self.render = function (element) {
            $(element).append(titleElement.html(currentSettings.title)).append(gaugeElement);

            width = gaugeElement.width();
            height = 160;

            var gaugeWidth = 30;
            var gaugeHeight = 120;

            paper = Raphael(gaugeElement.get()[0], width, height);
            paper.clear();

            rect = paper.rect(width / 3 - gaugeWidth / 2, height / 2 - gaugeHeight / 2, gaugeWidth, gaugeHeight);
            rect.attr({
                "fill": "#edebeb",
                "stroke": "#edebeb"
            });

            // place min and max labels
            minValueLabel = paper.text(width / 3, height / 2 + gaugeHeight / 2 + 14, currentSettings.min_value);
            maxValueLabel = paper.text(width / 3, height / 2 - gaugeHeight / 2 - 14, currentSettings.max_value);

            minValueLabel.attr({
                "font-family": "arial",
                "font-size": "10",
                "fill": "#b3b3b3",
                "text-anchor": "middle"
            });

            maxValueLabel.attr({
                "font-family": "arial",
                "font-size": "10",
                "fill": "#b3b3b3",
                "text-anchor": "middle"
            });

            // place units and value
            var units = _.isUndefined(currentSettings.units) ? "" : currentSettings.units;

            valueText = paper.text(width * 2 / 3, height / 2 - 10, "");
            unitsText = paper.text(width * 2 / 3, height / 2 + 10, units);

            valueText.attr({
                "font-family": "arial",
                "font-size": "25",
                "font-weight": "bold",
                "fill": "#d3d4d4",
                "text-anchor": "middle"
            });

            unitsText.attr({
                "font-family": "arial",
                "font-size": "10",
                "font-weight": "normal",
                "fill": "#b3b3b3",
                "text-anchor": "middle"
            });

            // fill to 0 percent
            gaugeFill = paper.rect(width / 3 - gaugeWidth / 2, height / 2 - gaugeHeight / 2, gaugeWidth, 0);
            gaugeFill.attr({
                "fill": "#edebeb",
                "stroke": "#edebeb"
            });
        }

        self.onSettingsChanged = function (newSettings) {
            if (newSettings.units != currentSettings.units || newSettings.min_value != currentSettings.min_value || newSettings.max_value != currentSettings.max_value) {
                currentSettings = newSettings;
                var units = _.isUndefined(currentSettings.units) ? "" : currentSettings.units;
                var min = _.isUndefined(currentSettings.min_value) ? 0 : currentSettings.min_value;
                var max = _.isUndefined(currentSettings.max_value) ? 0 : currentSettings.max_value;

                unitsText.attr({"text": units});
                minValueLabel.attr({"text": min});
                maxValueLabel.attr({"text": max});
            }
            else {
                currentSettings = newSettings;
            }

            titleElement.html(newSettings.title);
        }

        self.onCalculatedValueChanged = function (settingName, newValue) {
            if (settingName === "value") {
                if (!_.isUndefined(gaugeFill) && !_.isUndefined(valueText)) {

                    newValue = _.isUndefined(newValue) ? 0 : newValue;
					var datavalue = newValue[0].value;
                    var fillVal = 120 * (datavalue - currentSettings.min_value)/(currentSettings.max_value - currentSettings.min_value);

                    fillVal = fillVal > 120 ? 120 : fillVal;
                    fillVal = fillVal < 0 ? 0 : fillVal;

                    var fillColor = getColor(fillVal / 120);

                    // animate like radial gauges
                    gaugeFill.animate({"height": 120 - fillVal, "fill": "#edebeb", "stroke": "#edebeb"}, 500, ">");
                    rect.animate({"fill": fillColor, "stroke": fillColor });

                    valueText.attr({"text": datavalue});
                }
            }
        }

        self.onDispose = function () {
        }

        self.getHeight = function () {
            return 3;
        }

    };

    freeboard.loadWidgetPlugin({
        type_name: "vertical-linear-gauge",
        display_name: "HelmSmart Array Vertical Gauge",
        "external_scripts" : [
			"https://helmsmart-freeboard.herokuapp.com/static/plugins/thirdparty/raphael.2.1.0.min.js",
			"https://helmsmart-freeboard.herokuapp.com/static/plugins/thirdparty/colormix.2.0.0.min.js"
            //"plugins/thirdparty/raphael.2.1.0-custom.js",
            //"plugins/thirdparty/colormix.2.0.0.min.js"
        ],
        settings: [
            {
                name: "title",
                display_name: "Title",
                type: "text"
            },
            {
                name: "value",
                display_name: "Value",
                type: "calculated"
            },
            {
                name: "units",
                display_name: "Units",
                type: "text"
            },
            {
                name: "min_value",
                display_name: "Minimum",
                type: "number",
                default_value: 0
            },
            {
                name: "max_value",
                display_name: "Maximum",
                type: "number",
                default_value: 100
            }
        ],
        newInstance: function (settings, newInstanceCallback) {
            newInstanceCallback(new verticalgaugeWidget(settings));
        }
    });	
	
	
	var hgaugeID = 0;
	freeboard.addStyle('.hgauge-widget-wrapper', "width: 100%;text-align: center;");
	freeboard.addStyle('.hgauge-widget', "width:200px;height:80px;display:inline-block;");
	
   var horzinalgaugeWidget = function (settings) {
       //var titleElement = $('<h2 class="section-title"></h2>');
        //var gaugeElement = $('<div></div>');
		
		var thisGaugeID = "gauge-" + hgaugeID++;
        var titleElement = $('<h2 class="section-title"></h2>');
        var gaugeElement = $('<div class="hgauge-widget" id="' + thisGaugeID + '"></div>');

        var self = this;
        var paper = null;
        var gaugeFill = null;
        var width, height;
        var valueText, unitsText;
        var minValueLabel, maxValueLabel;
        //var currentValue = 0;
        //var colors = ["#a9d70b", "#f9c802", "#ff0000"];

        var currentSettings = settings;

        /* get the color for a fill percentage
           these colors match the justGage library for radial guagues */
        function getColor(fillPercent) {
            // mix colors
            // green rgb(169,215,11) #a9d70b
            // yellow rgb(249,200,2) #f9c802
            // red rgb(255,0,0) #ff0000

            if (fillPercent >= 0.5 ) {
                fillPercent = 2 * fillPercent - 1;
                var R = fillPercent * 255 + (1 - fillPercent) * 249;
                var G = fillPercent * 0 + (1 - fillPercent) * 200;
                var B = fillPercent * 0 + (1 - fillPercent) * 2;
            }
            else {
                fillPercent = 2 * fillPercent;
                var R = fillPercent * 249 + (1 - fillPercent) * 169;
                var G = fillPercent * 200 + (1 - fillPercent) * 215;
                var B = fillPercent * 2 + (1 - fillPercent) * 11;
            }

            return "rgb(" + Math.round(R) + "," + Math.round(G) + "," + Math.round(B) + ")"
        }

        self.render = function (element) {
            $(element).append(titleElement.html(currentSettings.title)).append(gaugeElement);

            width = gaugeElement.width();
            height = 160;

            var gaugeWidth = 160;
            var gaugeHeight = 30;

            paper = Raphael(gaugeElement.get()[0], width, height);
            paper.clear();

            var rect = paper.rect(width / 2 - gaugeWidth / 2, height / 3 - gaugeHeight / 2, gaugeWidth, gaugeHeight);
            rect.attr({
                "fill": "#edebeb",
                "stroke": "#edebeb"
            });

            // place min and max labels
            minValueLabel = paper.text(width / 2 - gaugeWidth / 2 - 8, height / 3, currentSettings.min_value);
            maxValueLabel = paper.text(width / 2 + gaugeWidth / 2 + 8, height / 3, currentSettings.max_value);

            minValueLabel.attr({
                "font-family": "arial",
                "font-size": "10",
                "fill": "#b3b3b3",
                "text-anchor": "end"
            });

            maxValueLabel.attr({
                "font-family": "arial",
                "font-size": "10",
                "fill": "#b3b3b3",
                "text-anchor": "start"
            });

            // place units and value
            var units = _.isUndefined(currentSettings.units) ? "" : currentSettings.units;

            valueText = paper.text(width / 2, height * 2 / 3, "");
            unitsText = paper.text(width / 2, height * 2 / 3 + 20, units);

            valueText.attr({
                "font-family": "arial",
                "font-size": "25",
                "font-weight": "bold",
                "fill": "#d3d4d4",
                "text-anchor": "middle"
            });

            unitsText.attr({
                "font-family": "arial",
                "font-size": "10",
                "font-weight": "normal",
                "fill": "#b3b3b3",
                "text-anchor": "middle"
            });

            // fill to 0 percent
            gaugeFill = paper.rect(width / 2 - gaugeWidth / 2, height / 3 - gaugeHeight / 2, 0, gaugeHeight);
        }

        self.onSettingsChanged = function (newSettings) {
            if (newSettings.units != currentSettings.units || newSettings.min_value != currentSettings.min_value || newSettings.max_value != currentSettings.max_value) {
                currentSettings = newSettings;
                var units = _.isUndefined(currentSettings.units) ? "" : currentSettings.units;
                var min = _.isUndefined(currentSettings.min_value) ? 0 : currentSettings.min_value;
                var max = _.isUndefined(currentSettings.max_value) ? 0 : currentSettings.max_value;

                unitsText.attr({"text": units});
                minValueLabel.attr({"text": min});
                maxValueLabel.attr({"text": max});
            }
            else {
                currentSettings = newSettings;
            }

            titleElement.html(newSettings.title);
        }

        self.onCalculatedValueChanged = function (settingName, newValue) {
            if (settingName === "value") {
                if (!_.isUndefined(gaugeFill) && !_.isUndefined(valueText)) {

                    newValue = _.isUndefined(newValue) ? 0 : newValue;
					var datavalue = newValue[0].value;
                    var fillVal = 160 * (datavalue - currentSettings.min_value)/(currentSettings.max_value - currentSettings.min_value);

                    fillVal = fillVal > 160 ? 160 : fillVal;
                    fillVal = fillVal < 0 ? 0 : fillVal;

                    var fillColor = getColor(fillVal / 160);

                    gaugeFill.animate({"width": fillVal, "fill": fillColor, "stroke": fillColor}, 500, ">");
                    valueText.attr({"text": datavalue});
                }
            }
        }

        self.onDispose = function () {
        }

        self.getHeight = function () {
            return 3;
        }

    };

    freeboard.loadWidgetPlugin({
        type_name: "horizontal-linear-gauge",
        display_name: "HelmSmart Horizontal Gauge",
        "external_scripts" : [
			"https://helmsmart-freeboard.herokuapp.com/static/plugins/thirdparty/raphael.2.1.0.min.js",
			"https://helmsmart-freeboard.herokuapp.com/static/plugins/thirdparty/colormix.2.0.0.min.js"
        ],
        settings: [
            {
                name: "title",
                display_name: "Title",
                type: "text"
            },
            {
                name: "value",
                display_name: "Value",
                type: "calculated"
            },
            {
                name: "units",
                display_name: "Units",
                type: "text"
            },
            {
                name: "min_value",
                display_name: "Minimum",
                type: "number",
                default_value: 0
            },
            {
                name: "max_value",
                display_name: "Maximum",
                type: "number",
                default_value: 100
            }
        ],
        newInstance: function (settings, newInstanceCallback) {
            newInstanceCallback(new horzinalgaugeWidget(settings));
        }
    });	

	freeboard.addStyle('.indicator-light', "border-radius:50%;width:22px;height:22px;border:2px solid #3d3d3d;margin-top:5px;float:left;background-color:#222;margin-right:10px;");
	freeboard.addStyle('.indicator-light.on', "background-color:#FFC773;box-shadow: 0px 0px 15px #FF9900;border-color:#FDF1DF;");
	freeboard.addStyle('.indicator-text', "margin-top:10px;");
    var indicatorWidget = function (settings) {
        var self = this;
        var titleElement = $('<h2 class="section-title"></h2>');
        var stateElement = $('<div class="indicator-text"></div>');
        var indicatorElement = $('<div class="indicator-light"></div>');
        var currentSettings = settings;
        var isOn = false;
        var onText;
        var offText;

        function updateState() {
            indicatorElement.toggleClass("on", isOn);

            if (isOn) {
                stateElement.text((_.isUndefined(onText) ? (_.isUndefined(currentSettings.on_text) ? "" : currentSettings.on_text) : onText));
            }
            else {
                stateElement.text((_.isUndefined(offText) ? (_.isUndefined(currentSettings.off_text) ? "" : currentSettings.off_text) : offText));
            }
        }

        this.render = function (element) {
            $(element).append(titleElement).append(indicatorElement).append(stateElement);
        }

        this.onSettingsChanged = function (newSettings) {
            currentSettings = newSettings;
            titleElement.html((_.isUndefined(newSettings.title) ? "" : newSettings.title));
            updateState();
        }

        this.onCalculatedValueChanged = function (settingName, newValue) {
            if (settingName == "value") {
                isOn = Boolean(newValue[0].value);
            }
            if (settingName == "on_text") {
                onText = newValue[0].value;
            }
            if (settingName == "off_text") {
                offText = newValue[0].value;
            }

            updateState();
        }

        this.onDispose = function () {
        }

        this.getHeight = function () {
            return 1;
        }

        this.onSettingsChanged(settings);
    };

    freeboard.loadWidgetPlugin({
        type_name: "indicator",
        display_name: "HelmSmart Array Indicator Light",
		description: "Indicator light for HelmSmart Status - uses HelmSmart Data source to grab selected span - plots first point in array",
        settings: [
	        {
	            name: "title",
	            display_name: "Title",
	            type: "text"
	        },
	        {
	            name: "value",
	            display_name: "Value",
	            type: "calculated"
	        },
	        {
	            name: "on_text",
	            display_name: "On Text",
	            type: "calculated"
	        },
	        {
	            name: "off_text",
	            display_name: "Off Text",
	            type: "calculated"
	        }
        ],
        newInstance: function (settings, newInstanceCallback) {
            newInstanceCallback(new indicatorWidget(settings));
        }
    });

    freeboard.addStyle('.gm-style-cc a', "text-shadow:none;");


    var googleMapWidget = function (settings) {
        var self = this;
        var currentSettings = settings;
        var map;
        var marker;
        var currentPosition = {};
		var myLatlng;
		var myOldLatlng;
		
		
		var newpoly = new Array();
		var mypolyOptions = {
		   strokeColor: '#B40B6A',
		   strokeOpacity: 1.0,
		   strokeWeight: 5,
		   visible:true
		   }

        function updatePosition() {
            if (map && marker && currentPosition.lat && currentPosition.lon) {
                var newLatLon = new google.maps.LatLng(currentPosition.lat, currentPosition.lon);
                marker.setPosition(newLatLon);
                map.panTo(newLatLon);
				
				
				
				
				//newpoly[i] = new google.maps.Polyline(mypolyOptions);
				
				
            }
        }

        this.render = function (element) {
            function initializeMap() {
                var mapOptions = {
                    zoom: 13,
                    center: new google.maps.LatLng(37.235, -115.811111),
                    disableDefaultUI: false,
                    draggable: true,
                    styles: [
                        {"featureType": "water", "elementType": "geometry", "stylers": [
                            {"color": "#052C84"}
                        ]},
                        {"featureType": "landscape", "elementType": "geometry", "stylers": [
                            {"color": "#046753"},
                            {"lightness": 20}
                        ]},
                        {"featureType": "road.highway", "elementType": "geometry.fill", "stylers": [
                            {"color": "#000000"},
                            {"lightness": 17}
                        ]},
                        {"featureType": "road.highway", "elementType": "geometry.stroke", "stylers": [
                            {"color": "#535207"},
                            {"lightness": 29},
                            {"weight": 0.2}
                        ]},
                        {"featureType": "road.arterial", "elementType": "geometry", "stylers": [
                            {"color": "#000000"},
                            {"lightness": 18}
                        ]},
                        {"featureType": "road.local", "elementType": "geometry", "stylers": [
                            {"color": "#000000"},
                            {"lightness": 16}
                        ]},
                        {"featureType": "poi", "elementType": "geometry", "stylers": [
                            {"color": "#027533"},
                            {"lightness": 21}
                        ]},
                        {"elementType": "labels.text.stroke", "stylers": [
                            {"visibility": "on"},
                            {"color": "#000000"},
                            {"lightness": 16}
                        ]},
                        {"elementType": "labels.text.fill", "stylers": [
                            {"saturation": 36},
                            {"color": "#000000"},
                            {"lightness": 40}
                        ]},
                        {"elementType": "labels.icon", "stylers": [
                            {"visibility": "off"}
                        ]},
                        {"featureType": "transit", "elementType": "geometry", "stylers": [
                            {"color": "#000000"},
                            {"lightness": 19}
                        ]},
                        {"featureType": "administrative", "elementType": "geometry.fill", "stylers": [
                            {"color": "#027533"},
                            {"lightness": 20}
                        ]},
                        {"featureType": "administrative", "elementType": "geometry.stroke", "stylers": [
                            {"color": "#000000"},
                            {"lightness": 17},
                            {"weight": 1.2}
                        ]}
                    ]
                };

                map = new google.maps.Map(element, mapOptions);

                google.maps.event.addDomListener(element, 'mouseenter', function (e) {
                    e.cancelBubble = true;
                    if (!map.hover) {
                        map.hover = true;
                        map.setOptions({zoomControl: true});
                    }
                });

                google.maps.event.addDomListener(element, 'mouseleave', function (e) {
                    if (map.hover) {
                        map.setOptions({zoomControl: false});
                        map.hover = false;
                    }
                });

                marker = new google.maps.Marker({map: map});

                updatePosition();
            }

            if (window.google && window.google.maps) {
                initializeMap();
            }
            else {
                window.gmap_initialize = initializeMap;
                head.js("https://maps.googleapis.com/maps/api/js?v=3.exp&sensor=false&callback=gmap_initialize");
            }
        }

        this.onSettingsChanged = function (newSettings) {
            currentSettings = newSettings;
        }

        this.onCalculatedValueChanged = function (settingName, newValue) {
            if (settingName == "lat") {
               // currentPosition.lat = newValue;
            }
            else if (settingName == "lon") {
               // currentPosition.lon = newValue;
            }
			 else if (settingName == "position") {
				 position = newValue[0];
				 currentPosition.lon = position.lng;
				 currentPosition.lat = position.lat;
				 
				 for(i=0; i< newpoly.length; i++)
				{
					newpoly[i].setMap(null)
				}
				 newpoly=[];
									
				 for(i=0; i< newValue.length; i++)
					{
	
						position = newValue[i];
	
						 
						if((typeof newpoly[i] === 'undefined') || newpoly[i].Show != false)
						{
    
							myLatlng = new google.maps.LatLng(position.lat, position.lng);
						 
						 newpoly[i] = new google.maps.Polyline(mypolyOptions);
					
							
							
						         var path = newpoly[i].getPath();

					 // Because path is an MVCArray, we can simply append a new coordinate
					// and it will automatically appear
						 if(myOldLatlng != null)
						   polyLineCount = path.push(myOldLatlng);
						 
						  polyLineCount = path.push(myLatlng);
						  newpoly[i].setMap(map); 
											 
						 // marker.setPosition(myLatlng);
											  
						 myOldLatlng = myLatlng;	
							
							
					}
            }

            updatePosition();
        }
		}

        this.onDispose = function () {
        }

        this.getHeight = function () {
            return 4;
        }

        this.onSettingsChanged(settings);
    };

    freeboard.loadWidgetPlugin({
        type_name: "google_map",
        display_name: "HelmSmart Array Google Map",
		description: "Map with historical path from data point array - uses HelmSmart Data source to grab selected span",
        fill_size: true,
        settings: [
            {
                name: "lat",
                display_name: "Latitude",
                type: "calculated"
            },
            {
                name: "lon",
                display_name: "Longitude",
                type: "calculated"
            },
			{
                name: "position",
                display_name: "Position",
                type: "calculated"
            }
        ],
        newInstance: function (settings, newInstanceCallback) {
            newInstanceCallback(new googleMapWidget(settings));
        }
    });

   

}());