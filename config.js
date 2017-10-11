var config = {
	"title": "Bootleaf template map",
	"start": {
		// "maxZoom": 16,
		"center": [38.203,-99.799],
		"zoom": 5,
		"attributionControl": false,
		"zoomControl": false
	},
	"about": {
		"title": "Add a map title here",
		"contents": "<p>Add the About page's contents here</p>"
	},
	"controls": {
		"zoom": {
			"position": "topleft"
		},
		"leafletGeocoder": {
			//https://github.com/perliedman/leaflet-control-geocoder
			"collapsed": false,
			"position": "topleft",
			"placeholder": "Search for a location",
			"type": "Google", // OpenStreetMap, Google, ArcGIS
			"suffix": "Australia" // optional keyword to append to every search
		},
		"TOC": {
			//http://leafletjs.com/reference-1.0.2.html#control-layers-option
			"collapsed": false,
			"uncategorisedLabel": "Layers",
			"position": "topright"
		},
		"history": {
			"position": "bottomleft"
		},
		"bookmarks": {
			"position": "topleft",
			"places": [
				{
				"latlng": [
					22.245598601926222,
					114.17609095573425
				],
				"zoom": 5,
				"name": "Ocean Park",
				"id": "a148fa354ba3",
				"editable": true,
				"removable": true
				}
			]
		}
	},
	// "activeTool": "identify", // options are identify/coordinates/queryWidget
	"basemaps": ['esriGray', 'esriDarkGray', 'esriStreets', 'OpenStreetMap'],
	"bing_key": "enter your Bing Maps key",
	"mapboxKey": "enter your MapBox key",
	// "defaultIcon": {
	// 	"imagePath": "http://leafletjs.com/examples/custom-icons/",
	// 	"iconUrl": "leaf-green.png",
	// 	"shadowUrl": "leaf-shadow.png",
	// 	"iconSize":     [38, 95],
	// 		"shadowSize":   [50, 64],
	// 		"iconAnchor":   [22, 94],
	// 		"shadowAnchor": [4, 62],
	// 		"popupAnchor":  [-3, -76]
	// },
	"tocCategories": [
		{
			"name": "GeoJSON layers",
			"layers": ["theatres", "museums"]
		},
		{
			"name": "ArcGIS Layers",
			"layers" : ["trees", "counties", "railways", "us_states"]
		},
		{
			"name": "WMS/WFS layers",
			"layers": ["nearmap", "US_population"],
			"exclusive": false
		}
	],
	"projections": [
		{4269: '+proj=longlat +ellps=GRS80 +datum=NAD83 +no_defs '}
	],
	"highlightStyle": {
		"weight": 2,
		"opacity": 1,
		"color": 'white',
		"dashArray": '3',
		"fillOpacity": 0.5,
		"fillColor": '#E31A1C',
		"stroke": true
	},
	"layers": [
		{
			"id": "trees",
			"name": "Heritage trees",
			"type": "agsFeatureLayer",
			"cluster": true,
			"showCoverageOnHover": false,
			"removeOutsideVisibleBounds": true,
			"url": "https://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Heritage_Trees_Portland/FeatureServer/0",
			"popup": true,
			"tooltipField": "COMMON_NAM",
			"outFields": [
				{"type": "OID",	"name": "FID"},
				{"name": "COMMON_NAM", "alias": "Common Name"},
				{"name": "SCIENTIFIC", "alias": "Scientific Name"},
				{"name": "ADDRESS", "alias": "Address"},
				{"name": "HEIGHT", "alias": "Height (m)", "decimals": 2},
				{"name": "CIRCUMFERE", "alias": "Circumerence (m)"},
				{"name": "YEAR", "alias": "Year"},
				{"name": "OWNER", "alias": "Owner"},
				{"name": "NOTES", "alias": "Notes"}
			],	
			"visible": true,
			"queryWidget": {
				"queries" : [
					{"name": "COMMON_NAM", "alias": "Common name", "defaultOperator": "starts with", "defaultQuery": "A"},
					{"name": "SCIENTIFIC", "alias": "Scientific name"}
				],
				"outFields": [
					{"name": "COMMON_NAM", "alias": "Name"},
					{"name": "SCIENTIFIC", "alias": "Sci. name"},
					{"name": "HEIGHT", hidden: true},
					{"name": "DIAMETER", "hidden": true}
				]
			},
			"style": {
				"stroke": true,
		    "fillColor": "#00FFFF",
		    "fillOpacity": 0.5,
		    "radius": 10,
		    "weight": 0.5,
		    "opacity": 1,
		    "color": '#727272'
		  },
			"minZoom": 7
		},
		{
			"id": "railways",
			"name": "USA Railways",
			"type": "agsFeatureLayer",
			"url": "https://services.arcgis.com/rOo16HdIMeOBI4Mb/ArcGIS/rest/services/USA_Rail_Network/FeatureServer/0",
			"visible": false,
			"useCors": false,
			"popup": true,
			"fields": ["FID","RROWNER1","RR_CLASS", "RAILROAD", "ABANDONED"], 
			"style": {
				"stroke": true,
		    "radius": 10,
		    "weight": 2,
		    "opacity": 1,
		    "color": "#FF0000"
		  },
			"queryWidget": {
				"queries" : [
					{"name": "RAILROAD", "alias": "Name"}
				],
				"outFields": [
					{"name": "RAILROAD", "alias": "Name"},
					{"name": "RROWNER1", "alias": "Owner"}
				],
				"maxAllowableOffset": 10
			}					
		},
		{
			"id": "counties",
			"name": "Counties",
			"type": "agsDynamicLayer",
			"url": "https://sampleserver1.arcgisonline.com/ArcGIS/rest/services/Demographics/ESRI_Census_USA/MapServer/",
			"layers": [3],
			"format": 'png24',
			"transparent": true,
			"layerDefs": {3:"POP2000 > 1000000"},
			"useCors": false,
			"visible": false,
			"identify": {
				"layerLabel": "Census counties",
				"layerName": "Coarse Counties",
				"primaryField": "NAME",
				"fields": [
					{"name": "STATE_NAME", "alias": "State"},
					{"name": "POP2007", "alias": "Population"}
				],
				"maxAllowableOffset": 0.001
			},
			"queryWidget": {
				"queries" : [
					{"name": "NAME", "alias": "County name"},
					{"name": "STATE_NAME", "alias": "State name"},
					{"name": "POP2000", "alias": "Population", "type": "numeric"}
				],
				"outFields": [
					{"name": "NAME", "alias": "County name"},
					{"name": "STATE_NAME", "alias": "State name"},
					{"name": "POP2000", "alias": "Population", "thousands": true, "hidden": true}
				],
				"layerIndex": 3,
				"maxAllowableOffset": 0.001
			}
		},
		{
			"id": "us_states",
			"name": "US States",
			"type": "agsDynamicLayer",
			"url": "https://sampleserver1.arcgisonline.com/ArcGIS/rest/services/Demographics/ESRI_Census_USA/MapServer/",
			"layers": [5],
			"format": 'png24',
			"transparent": true,
			// "layerDefs": {3:"POP2000 > 1000000"},
			"useCors": false,
			"visible": true,
			"identify": {
				"layerName": "states",
				"primaryField": "STATE_NAME",
				"fields": [
					{"name": "STATE_NAME", "alias": "State"},
					{"name": "POP2007", "alias": "Population", "thousands": true},
					{"name": "POP07_SQMI", "alias": "Population density", "decimals": 0}
				],
				"maxAllowableOffset": 0.001
			},
			"queryWidget": {
				"queries" : [
					{"name": "STATE_NAME", "alias": "State name"},
					{"name": "POP2000", "alias": "Population", "type": "numeric"}
				],
				"outFields": [
					{"name": "STATE_NAME", "alias": "State name"},
					{"name": "POP2000", "alias": "Population", "thousands": true},
					{"name": "MALES", "alias": "No. Males", "thousands": true},
					{"name": "FEMALES", "alias": "No. Females", "thousands": true},
					{"name": "SQMI", "alias": "Area (sqmi)", "thousands": true, "decimals": 1}
				],
				"layerIndex": 5,
				"maxAllowableOffset": 0.001,
			},
			"maxZoom": 10,
		},
		{
			"id": "US_population",
			"name": "US Population",
			"type": "wmsTiledLayer",
			"url": "https://demo.geo-solutions.it/geoserver/topp/wms",
			"layers": "topp:states",
      "visible": false,
      "transparent": true,
      "geomField": "the_geom",
      "queryWidget": {
				"queries" : [
					{"name": "STATE_NAME", "alias": "Name"},
					{"name": "STATE_ABBR", "alias": "Abbreviation"}
				]
			},
			"identify": {
				"layerName": "states",
				"buffer": 10,
				"outFields": [
					{"name": "STATE_NAME", "alias": "Name"},
					{"name": "STATE_ABBR", "alias": "Abbreviation"},
					{"name": "FAMILIES", "alias": "Num families", "thousands": true}
				]
			},
			"outFields": [
				{"name": "STATE_NAME", "alias": "Name X"},
				{"name": "STATE_ABBR", "alias": "Abbreviation"},
				{"name": "FAMILIES", "alias": "No. Families", "thousands": true},
				{"name": "LAND_KM", "alias": "sq. km", "thousands": true, "decimals": 1, "hidden": true},
			]
		}
	]
}
