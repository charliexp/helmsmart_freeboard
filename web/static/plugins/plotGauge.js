window.dyngaugeID = 0;
(function() {    
        var dynamicGaugeWidget = function (settings) {
        var self = this;
        thisDynGaugeID = "dyngauge-" + window.dyngaugeID++;
        var titleElement = $('<h2 class="section-title"></h2>');
        var gaugeElement = $('<div id="' + thisDynGaugeID + '"></div>');

        var gaugeObject;
        var rendered = false;

        var currentSettings = settings;

        function createGauge() {
            if (!rendered) {
                return;
            }

            gaugeElement.empty();

			 gaugeObject = new Highcharts.Chart(chartoptions[graphindex] );
			 
			 
            gaugeObject = new JustGage({
                id: thisDynGaugeID,
                value: (_.isUndefined(currentSettings.min_value) ? 0 : currentSettings.min_value),
                min: (_.isUndefined(currentSettings.min_value) ? 0 : currentSettings.min_value),
                max: (_.isUndefined(currentSettings.max_value) ? 0 : currentSettings.max_value),
                label: currentSettings.units,
                showInnerShadow: false,
                valueFontColor: "#d3d4d4",
                levelColors: ['#ff0000', '#ffa500','#ffa500','#ffff00', '#00ff00']
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
				
				if(newValue.length != 0)
				{
					myvalue=newValue[0];
					mynumber = myvalue.content.amps;
						
					gaugeObject.refresh(Number(mynumber));
				
				}
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
        type_name: "dyngauge",
        display_name: "PlotGauge",
        "external_scripts" : [
          //  "https://helmsmart-freeboard.herokuapp.com/static/plugins/thirdparty/raphael.2.1.0.min.js",
          //  "https://helmsmart-freeboard.herokuapp.com/static/plugins/thirdparty/justgage.1.0.1.js"
			 "https://helmsmart-freeboard.herokuapp.com/static/js/highcharts.js"
			highcharts.js
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
            newInstanceCallback(new dynamicGaugeWidget(settings));
        }
    });
    
}());
