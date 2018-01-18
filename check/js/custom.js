!function ($) {

	Handlebars.registerHelper('link', function(text, url) {
	  url = Handlebars.escapeExpression(url);
	  text = Handlebars.escapeExpression(text);

	  return new Handlebars.SafeString(
	    "<a target='_blank' href='" + url + "'>" + text + "</a>"
	  );
	});

	bootleaf = {
		errorLayers: []
	};
  analyseConfig();

}

(window.jQuery);
	$(window).on('resize', function () {
  if ($(window).width() > 768) $('#sidebar-collapse').collapse('show')
})
$(window).on('resize', function () {
  if ($(window).width() <= 767) $('#sidebar-collapse').collapse('hide')
})


function analyseConfig() {
	try{

		var mainSource = $("#main-template").html();
		var mainTemplate = Handlebars.compile(mainSource);
		var html = mainTemplate(config);
		$("#main").html(html);
		$("#main").show();
		$("#navDetails").show();

		// Evaluate each layer to assess whether it exists at the specified URL
		var layers = config.layers;
		$("#intTotalLayers").text(layers.length); // report the summary
		for(var i=0; i<layers.length; i++){
			var layerConfig = config.layers[i];
			try{
				var url = layerConfig.url;
				if (url[url.length - 1] !== "/"){url += "/";}
				var type = layerConfig.type;

				// Verify that the layer exists at that url
				if (type === 'agsFeatureLayer' || type === 'agsTiledLayer') {
					$.ajax({
	          dataType: "json",
	          type: 'GET',
	          url: url + '?f=pjson',
	          beforeSend: function (jqXHR, settings) {
	            jqXHR.layerConfig = layerConfig;
	          },
	          success: function(data, textStatus, jqXHR) {
	          	if (data.error !== undefined) {
	          		displayLayerError(jqXHR.layerConfig);
	          	} else {
		          	analyseLayer(data, textStatus, jqXHR);
		          }
	          },
	          error: function(jqXHR, textStatus, error) {
	            displayLayerError(jqXHR.layerConfig);
	          }
	        });
				} else if (type === 'agsDynamicLayer') {
					var dynLayers = layerConfig.layers;
					for (var d=0; d<dynLayers.length; d++){
						var dynLayerIdx = dynLayers[d];
						$.ajax({
		          dataType: "jsonp",
		          type: 'GET',
		          callback: callback,
		          url: url + dynLayerIdx + '?f=pjson',
		          beforeSend: function (jqXHR, settings) {
		            jqXHR.layerConfig = layerConfig;
		          },
		          success: function(data, textStatus, jqXHR) {
		          	analyseLayer(data, textStatus, jqXHR);
		          },
		          error: function(jqXHR, textStatus, error) {
		            displayLayerError(jqXHR.layerConfig);
		          }
		        });
					}
				} else if (type === 'WFS') {
					// Query all features, but only return 1 feature in order to get its attributes
					var whereClause = "1=1";
					if (layerConfig.where !== undefined){
						whereClause = layerConfig.where;
					}

					var data = {
				    "service":"WFS",
				    "version":"1.0.0",
				    "request":"GetFeature",
				    "format_options":"callback:getJson",
				    "CQL_FILTER": whereClause,
				    "typeName": layerConfig.typeName,
						"outputFormat": "text/javascript",
				    "maxFeatures": 1
				  }

				  var geomField = layerConfig.geomField || "geom";
				  if (layerConfig.outFields && layerConfig.outFields.length && layerConfig.outFields.length > 0) {
				    if ($.inArray(geomField, layerConfig.outFields) < 0) {
				      layerConfig.outFields.push(geomField);
				    }
				  }

					$.ajax({
					  jsonp: false,
					  jsonpCallback: 'getJson',
					  type: 'GET',
					  url: layerConfig.url,
					  data: data,
					  async: false,
					  dataType: 'jsonp',
					  beforeSend: function (jqXHR, settings) {
					    // add required properties so they can be accessed in the success function
					    jqXHR.layerConfig = layerConfig;
					  },
					  success: function(data, textStatus, jqXHR) {
					  	try{
						  	if (data.features && data.features.length !== undefined && data.features.length > 0){
						  		// Conver the WFS field list into a field array matching the ArcGIS server pattern
						  		var properties = data.features[0].properties;
						  		data.fields = [];
									for (var key in properties){
										data.fields.push({"name": key});
									}
						  		analyseLayer(data, textStatus, jqXHR);
						  	} else {
						  		displayLayerError(jqXHR.layerConfig);
						  	}
							} catch(err){
								displayLayerError(jqXHR.layerConfig);
							}
					  },
					  error: function(jqXHR, textStatus, error) {
					  	displayLayerError(jqXHR.layerConfig);
					  }
					});

				} else if (type === 'wmsTiledLayer') {
					// Query all features, but only return 1 feature in order to get its attributes
					var whereClause = "1=1";
					if (layerConfig.where !== undefined){
						whereClause = layerConfig.where;
					}

					var data = {
				    "service":"WFS",
				    "version":"1.0.0",
				    "request":"GetFeature",
				    "format_options":"callback:getJson",
				    "CQL_FILTER": whereClause,
				    "typeName": layerConfig.layers,
						"outputFormat": 'application/json',
				    "maxFeatures": 1
				  }

				  var geomField = layerConfig.geomField || "geom";
				  if (layerConfig.outFields && layerConfig.outFields.length && layerConfig.outFields.length > 0) {
				    if ($.inArray(geomField, layerConfig.outFields) < 0) {
				      layerConfig.outFields.push(geomField);
				    }
				  }

					$.ajax({
					  jsonp: false,
					  type: 'GET',
					  url: layerConfig.url,
					  data: data,
					  async: false,
					  dataType: 'json',
					  beforeSend: function (jqXHR, settings) {
					    // add required properties so they can be accessed in the success function
					    jqXHR.layerConfig = layerConfig;
					  },
					  success: function(data, textStatus, jqXHR) {
					  	try{
						  	if (data.features && data.features.length !== undefined && data.features.length > 0){
						  		// Conver the WFS field list into a field array matching the ArcGIS server pattern
						  		var properties = data.features[0].properties;
						  		data.fields = [];
									for (var key in properties){
										data.fields.push({"name": key});
									}
						  		analyseLayer(data, textStatus, jqXHR);
						  	} else {
						  		displayLayerError(jqXHR.layerConfig);
						  	}
							} catch(err){
								displayLayerError(jqXHR.layerConfig);
							}
					  },
					  error: function(jqXHR, textStatus, error) {
					  	displayLayerError(jqXHR.layerConfig);
					  }
					});

				} else if (type === 'geoJSON') {

					$.ajax({
	          dataType: "json",
	          type: 'GET',
	          url: layerConfig.url,
	          beforeSend: function (jqXHR, settings) {
	            // add required properties so they can be accessed in the success function
	            jqXHR.layerConfig = layerConfig;
	          },
	          success: function(data, textStatus, jqXHR) {
					  	try{
						  	if (data.features && data.features.length !== undefined && data.features.length > 0){
						  		// Conver the WFS field list into a field array matching the ArcGIS server pattern
						  		var properties = data.features[0].properties;
						  		data.fields = [];
									for (var key in properties){
										data.fields.push({"name": key});
									}
						  		analyseLayer(data, textStatus, jqXHR);
						  	} else {
						  		displayLayerError(jqXHR.layerConfig);
						  	}
							} catch(err){
								displayLayerError(jqXHR.layerConfig);
							}
					  },
	          error: function(jqXHR, textStatus, error) {
	            displayLayerError(jqXHR.layerConfig);
	          }
	        });

				} else if (type === 'tileLayer'){
					// TODO: handle tile layer
				} else {
					// TODO: handle other layer types?
				}


			} catch(e){
				// TODO - do somthing with this?
				layer['exists'] = false;
			}
		}

	} catch(e){
		displayError();
	}
}

function analyseLayer(data, textStatus, jqXHR) {
	// Verify that each of the specified input fields exists and is
	// of the correct type
	var layerConfig = jqXHR.layerConfig;

	// Add some attributes to enable div creation in the templates
	layerConfig.outFieldsTable = "tblOutFields_" + layerConfig.id;
	layerConfig.queryWidgetTable = "tblQueryWidget_" + layerConfig.id;
	layerConfig.identifyTable = "tblIdentify_" + layerConfig.id;

	var layerSource = $("#layer-template").html();
	var layerTemplate = Handlebars.compile(layerSource);
	var layerHtml = layerTemplate(layerConfig);
	$("#layerList").append(layerHtml);

	// Check the fields
	var fieldSource = $("#field-template").html();
	var fieldTemplate = Handlebars.compile(fieldSource);
	if (layerConfig.outFields !== undefined && layerConfig.outFields.length > 0){

		var outfieldsSource = $("#outfields-template").html();
		var outfieldsTemplate = Handlebars.compile(outfieldsSource);
		var outfieldsHtml = outfieldsTemplate(layerConfig);
		$("#" + layerConfig.id).append(outfieldsHtml);

		// If the layer definition has an outFields array, verify that each field
		// actually exists in the ArcGIS Server layer
		for (var f=0; f<layerConfig.outFields.length; f++){
			var blField = layerConfig.outFields[f];
			blField.exists = false;
			for (var g=0; g<data.fields.length; g++){
				var agsField = data.fields[g];
				if (agsField.name === blField.name){
					blField.exists = true;
					break;
				}
			}
			if (blField.exists === false) {
				blField.class="danger";
				addLayerToErrorList(layerConfig);
			}
			var fieldHtml = fieldTemplate(blField);
			$("#tblOutFields_" + layerConfig.id).find('tbody').append(fieldHtml);
		}
	}

	// If there is a QueryWidget object, verify that each field actually exists in the ArcGIS Server layer
	if (layerConfig.queryWidget !== undefined && layerConfig.queryWidget.outFields !== undefined && layerConfig.queryWidget.outFields.length > 0){

		var queryWidgetSource = $("#querywidget-template").html();
		var queryWidgetTemplate = Handlebars.compile(queryWidgetSource);
		var queryWidgetHtml = queryWidgetTemplate(layerConfig);
		$("#" + layerConfig.id).append(queryWidgetHtml);

		// If the layer definition has an outFields array, verify that each field
		// actually exists in the ArcGIS Server layer
		for (var f=0; f<layerConfig.queryWidget.outFields.length; f++){
			var blField = layerConfig.queryWidget.outFields[f];
			blField.exists = false;
			for (var g=0; g<data.fields.length; g++){
				var agsField = data.fields[g];
				if (agsField.name === blField.name){
					blField.exists = true;
					break;
				}
			}
			if (blField.exists === false) {
				blField.class="danger";
				addLayerToErrorList(layerConfig);
			}
			var fieldHtml = fieldTemplate(blField);
			$("#tblQueryWidget_" + layerConfig.id).find('tbody').append(fieldHtml);
		}
	}

	// If there is an Identify object, verify that each field actually exists in the ArcGIS Server layer
	if (layerConfig.identify !== undefined && layerConfig.identify.outFields !== undefined && layerConfig.identify.outFields.length > 0){

		var identifySource = $("#identify-template").html();
		var identifyTemplate = Handlebars.compile(identifySource);
		var identifyHtml = identifyTemplate(layerConfig);
		$("#" + layerConfig.id).append(identifyHtml);

		// If the layer definition has an outFields array, verify that each field
		// actually exists in the ArcGIS Server layer
		for (var f=0; f<layerConfig.identify.outFields.length; f++){
			var blField = layerConfig.identify.outFields[f];
			blField.exists = false;
			for (var g=0; g<data.fields.length; g++){
				var agsField = data.fields[g];
				if (agsField.name === blField.name){
					blField.exists = true;
					break;
				}
			}
			if (blField.exists === false) {
				blField.class="danger";
				addLayerToErrorList(layerConfig);
			}
			var fieldHtml = fieldTemplate(blField);
			$("#tblIdentify_" + layerConfig.id).find('tbody').append(fieldHtml);
		}
	}


}
function displayError(){
	var mainSource = $("#main-error").html();
	var mainTemplate = Handlebars.compile(mainSource);
	var html = mainTemplate({});
	$("#main").html(html);
	$("#main").show();
	$("#navDetails").hide();
}

function displayLayerError(layerConfig){
	var layerSource = $("#layer-error").html();
	var layerTemplate = Handlebars.compile(layerSource);
	var layerHtml = layerTemplate(layerConfig);
	$("#layerList").append(layerHtml);
	addLayerToErrorList(layerConfig);

}

function addLayerToErrorList(layerConfig){
	// add this layer to the list of error layers
	if (!bootleaf.errorLayers.includes(layerConfig.id)){
		bootleaf.errorLayers.push(layerConfig.id);
		var source = $("#error-layer-name").html();
		var template = Handlebars.compile(source);
		var html = template(layerConfig);
		$("#errorLayerList").append(html);
		$("#errorLayers").show();
	}	
}

function callback(data){
	console.log("Callback", data);
}

function getJson(data){
	console.log("getJson", data);
}