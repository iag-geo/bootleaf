// Enter your custom JavaScript code here

function beforeMapLoads(){

	// // This function is called before the map loads, and is useful for manipulating the config object, eg
	// // to add a new custom layer.

	// // Create a layer which is based on a query string in the URL - this shows the US state based on the query
	// // value, eg bootleaf.html/?query=california
	// var statesConfig = {
	// 	"id": "us_states",
	// 	"name": "States",
	// 	"type": "agsDynamicLayer",
	// 	"url": "http://sampleserver1.arcgisonline.com/ArcGIS/rest/services/Demographics/ESRI_Census_USA/MapServer/",
	// 	"layers": [5],
	// 	"useCors": false,
	// 	"visible": true
	// }

	// var query = getURLParameter('query');
	// if(query) {
	// 	statesConfig.layerDefs = "5: STATE_NAME = '" + query + "'";
	// 	statesConfig.name += " (" + query + ")";
	// }

	// // Add this layer to the TOC and map.
	// config.layers.push(statesConfig);
	// for (i in config.tocCategories){
	// 	if (config.tocCategories[i]['name'] === 'ArcGIS Layers') {
	// 		config.tocCategories[i]['layers'].push(statesConfig.id);
	// 	}
	// }

	// // If there are any layers defined in the URL, add this layer to the list so it draws by default
	// if(bootleaf.layerParams.length > 0){
	// 	bootleaf.layerParams.push(statesConfig.id);
	// }

}

function afterMapLoads(){
	// This function is run after the map has loaded. It gives access to bootleaf.map, bootleaf.TOCcontrol, etc
	
	// Check to see whether the Gray basemap is chosen, and the user has zoomed in too far. In this case, 
	// switch to the Streets basemap
	bootleaf.map.on("zoomend", function(evt){
		if (bootleaf.currentBasemap === 'Gray'){
			if (evt.target._zoom >= 17) {
				setBasemap({"type": 'esri', "id": 'Streets'});
				$.growl.warning({ title: "Basemap change", message: "The grayscale basemap is not available at this scale"});
			}
		}
	});

	// Detect the coordinates of the address returned by the geocoder. This can be used elsewhere as required
	bootleaf.leafletGeocoder.on("markgeocode", function(evt){
		console.log("Coordinates: ", evt.geocode.center.lat, ", ", evt.geocode.center.lng);
	});
}