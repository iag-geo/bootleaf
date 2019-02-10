BootLeaf
========

 - [Installation](#installation)
 - [Configuration](#configuration)
 - [Basemaps](#basemaps)
 - [Layers](#layers)
 - [Table of Contents](#table-of-contents)
 - [Identify](#identify)
 - [Query](#query)
 - [Custom code](#custom-code)
 - [Known issues](#issues)

### Introduction

This is an update to the excellent [Bootleaf](https://github.com/bmcbride/bootleaf) code written by [Bryan McBride](https://github.com/bmcbride), which incorporates the responsive framework [Bootstrap](http://getbootstrap.com) with the lightweight [Leaflet](http://leafletjs.com) mapping API.

This update decouples the application logic from the map contents, and so provides a framework for rapid creation of new maps by simply updating a configuration file.

![bootleaf screenshot](https://i.imgur.com/DZbDs86.png)

Support is provided for:
 - WMS tiled layers
 - WFS layers
 - GeoJSON layers
 - ArcGIS Server feature, dynamic and tiled layers
 - Clustering of WFS, GeoJSON and ArcGIS Server feature layers

Note - WMS and WFS layers have been tested in GeoServer only. [CORS](http://suite.opengeo.org/docs/latest/sysadmin/cors/index.html) and [jsonp](https://www.gaiaresources.com.au/json-with-geoserver-and-leaflet/) should be enabled on GeoServer for best results.

Note - Bootleaf uses the [Esri-Leaflet](https://esri.github.io/esri-leaflet/) plugin, in order to support ArcGIS layers and display Esri basemaps. Please note the [Esri usage terms](https://github.com/esri/esri-leaflet#terms) before using this.

Additional functionality includes:
 - [Table of Contents](https://github.com/ismyrnow/Leaflet.groupedlayercontrol) with support for groups and radio buttons
 - Identify function for WMS and ArcGIS Dynamic layers
 - Query Widget, for finding features within ArcGIS Feature and Dynamic layers
 - Spatial Bookmarks
 - Address search using [OpenStreetMap](https://nominatim.openstreetmap.org/), Google or ArcGIS
 - Ability to share the map with current location and visible layers
 - Tooltips and info-windows
 - Simple labels within WFS and GeoJson layers

The application comprises:
 - `index.html` - defines the elements on the page, including the map, sidebar, navigation, buttons, etc. References all of the other files
 - `config.js` - configuration file, which personalises each map. Specifies the starting extent, basemap, controls, and layers
 - `style.css` - over-writes the default styles to personalise the map
 - `custom.js` - adds custom functionality to personalise the map
 - `src/...` - the directory containing the core Bootleaf functionality
 - `data` - stores any local GeoJSON datasets which are not hosted on a server

## [Installation](#installation)

Use these steps to create a map based on the current version of the Bootleaf template:

1. download the code from [here](https://github.com/iag-geo/bootleaf/archive/master.zip)
2. unzip the file into a temp directory
3. copy the _bootleaf_ directory into a suitable directory on your server
4. rename the *bootleaf* folder to the name of your app (*your_app*)
5. open your application via http://your_server/path/your_app and verify that it works correctly

**Deployment and upgrades**
- to deploy your app to another server, copy the *your_app* directory to the server. This will include both the Bootleaf code (in the _src_ directory) and your custom app as a stand-alone package
- in the future, to update your app to the latest version of the Bootleaf template, download the code again and replace the _src_ in your local version with the _src_ latest version (ensuring you don't over-write your custom config file)

## [Configuration](#configuration)

All configuration options for the map are controlled via the *config.js* file, so open this file in your code editor and go for it!

The format of this file is JSON, which uses key/value pairs holding parameters and their values, eg:

```
"title": "Bootleaf template map",
"start": {
	"center": [42, -85],
	"zoom": 5,
	"attributionControl": false,
	"zoomControl": false,
	"layers": []
}
```

When editing these values, ensure that the key *names* are quoted. *Textual values* should be quoted, but *numerical values and booleans* should not be quoted. Un-needed parameters may be commented out using /\* ... \*/ notation around the entire parameter.

#### Parameter explanations

- `title` : displayed in the header of the browser
- `start` : used to set the inital map extent, and other Leaflet [initiation parameters](http://leafletjs.com/reference-1.0.2.html#map-factory)
- `about` : displayed in the map's About panel
- `bing_key` : a license key to use [Bing Maps basemap tiles](https://msdn.microsoft.com/en-us/library/ff428642.aspx)
- `mapboxKey` : a license key to use [MapBox basemap tiles](https://www.mapbox.com/help/how-access-tokens-work/)
- `controls` : used to configure individual map controls. If a control is commented out, it will not be shown. Valid positions are *topleft*, *topright*, *bottomleft*, *bottomright*
	- `zoom` : specify the location of the zoom in/out buttons
	- `leafletGeocoder` : configure the [geocoder](https://github.com/perliedman/leaflet-control-geocoder)
		- `type`: `Google/OpenStreetMap/ArcGIS`
		- `suffix`: an optional keyword to filter each search. eg, use "Australia" to tell the geocoder to search within Australia only
		- `key`: when using the Google Maps option, specify your API key (https://developers.google.com/maps/documentation/geocoding/start#get-a-key)
	- `TOC` : configure the default [table of contents](https://github.com/ismyrnow/Leaflet.groupedlayercontrol) (see below for further configuration options)
	- `history` : display next/previous buttons on the map, to enable moving forward/back through the extent history
	- `bookmarks` : spatial bookmarks may be saved to the config file, or added via the UI. In the latter case they're accessible via cookies on the current user's machine. Follow the pattern of the sample bookmarks to create new instances
- `activeTool` : a tool may optionally be configured as active when the map loads. Current options are `identify`, `queryWidget` (see below for more info) and `coordinate` (which reports the coordinates at the location clicked on the map)
- `defaultIcon` : optionally, override the [default icon](http://leafletjs.com/reference-1.1.0.html#icon-default) which is a blue pin, for example to specify an alternate image, or to change the size and shape of the pin. This icon is used in the geocoding result display amongst other areas
- `projections` - an array of [proj4js](http://proj4js.org/) projection definitions, which are used when projecting coordinates from other reference systems onto the map. Determine each layer's projection, then look up the details at http://spatialreference.org/. Add each layer's WKID to the `projections` array in the format:

```
"projections": [
	{wkid: 'proj 4 projection parameters from spatialreference.org'},
	{4269: '+proj=longlat +ellps=GRS80 +datum=NAD83 +no_defs '}
]
```
- `showIdentifyMarker` : `true/false` - when true, the location clicked on the map is shown in a popup. Default is true.
## [Basemaps](#basemaps)
Various basemaps may be included on the map, by listing the basemap IDs as shown below. The first basemap listed is the default.

`"basemaps" : ['esriStreets', 'MapboxLight', 'OpenStreetMap']`

[Esri basemaps](https://developers.arcgis.com/javascript/3/jsapi/esri.basemaps-amd.html):
 - `esriStreets`
 - `esriTopographic`
 - `esriImagery`
 - `esriShadedRelief`
 - `esriTerrain`
 - `esriGray`
 - `esriDarkGray`
 - `esriNationalGeographic`
 - `esriOceans`

[MapBox basemaps](https://www.mapbox.com/api-documentation/#maps)
- `MapboxStreets`
- `MapboxLight`
- `MapboxDark`
- `MapboxSatellite`
- `MapboxSatelliteStreets`
- `MapboxHighContrast`

(MapBox Basemaps require a valid `mapboxKey` parameter in the config file)

[Bing basemaps](https://developers.arcgis.com/javascript/3/jsapi/vetiledlayer-amd.html):
 - `Aerial`
 - `AerialWithLabels`
 - `Road`

(Bing basemaps require a valid `bing_key` parameter in the config file)

[Leaflet Tiled basemaps](http://leafletjs.com/reference-1.0.2.html#tilelayer):
 - `OpenStreetMap`

![basemaps screenshot](https://i.imgur.com/ja3Z9q1.png)

If no basemaps are listed in the config file, all basemaps will be available on the map.

## [Layers](#layers)

Support for various layer types is included in this Bootleaf update, including ArcGIS Server (feature, dynamic and tiled), WMS tiled and GeoJSON, with more types to be added in future.

To begin adding layers, find the `"layers": []` section of the config file, and add a new layer using the format:

```
{
	"id": "a unique ID for this layer",
	"name": "the name, which will appear in the Table of Contents",
	"type": "layer type (see 'Supported layer types' below)",
	"url": "layer URL"
}
```

### Supported layer types

- `agsFeatureLayer` : [ArcGIS Server Feature layer](https://developers.arcgis.com/javascript/3/jsapi/featurelayer-amd.html)
- `agsDynamicLayer` : [ArcGIS Server Dynamic layer](https://developers.arcgis.com/javascript/3/jsapi/arcgisdynamicmapservicelayer-amd.html)
- `agsTiledLayer` : [ArcGIS Server Tiled layer](https://developers.arcgis.com/javascript/3/jsapi/arcgistiledmapservicelayer-amd.html)
- `geoJSON` : [Leaflet GeoJSON](http://leafletjs.com/reference-1.0.2.html#geojson)
- `wmsTiledLayer` : [Leaflet WMS Tile layer](http://leafletjs.com/reference-1.0.2.html#tilelayer-wms)
- `tileLayer` : [tiled layers](http://leafletjs.com/reference-1.0.3.html#tilelayer) which follow the pattern 'http://{s}.somedomain.com/blabla/{z}/{x}/{y}{r}.png'
- `WFS` : [WFS](http://www.opengeospatial.org/standards/wfs) layers (Note: to date, testing has only been done on WFS as provided by GeoServer in GeoJSON format.)

Note - it may be necessary to use a [reverse proxy](https://github.com/iag-geo/bootleaf/blob/master/reverseProxy.md) in order to access data from GeoServer.

#### Other layer options

- `visible` : `true/false`
- `opacity` : `0-1`
- `minZoom` : `1-19` - furthest zoom level the layer will be displayed on the map
- `maxZoom` : `1-19` - closest zoom level the layer will be displayed on the map
- `attribution` : `"text to appear in the attribution widget"`
- `layers` : `[1, 2, 3]` - applies to ArcGIS Dynamic layer, and specifies the visible layers
- `typeName` : applies to WFS layers, and specifies the GeoServer layer to draw
- `popup` : `true/false` - applies to WFS and ArcGIS Feature layers, and determines whether to show a popup when clicking on the feature
- `where` : a [SQL clause](http://resources.arcgis.com/en/help/main/10.2/index.html#/SQL_reference_for_query_expressions_used_in_ArcGIS/00s500000033000000/) to limit the features returned. Applies to WFS, wmsTiledLayer and ArcGIS Feature layers. Note that when using a `where` clause with a GeoServer layer, and also using the Identify functionality, only simple `where` clauses are supported (eg `where`: `fieldName = 'value'`)
- `layerDefs` : a [query](https://esri.github.io/esri-leaflet/api-reference/layers/dynamic-map-layer.html) to limit the features returned, in the format `{3:"STATE_NAME='Kansas'", 2:"POP2007>25000"}`. Applies to ArcGIS Dynamic layers
- `viewParams` : a query to limit the features return from a WMS/WFS layer. This requires that the layer has been [appropriately configured as a SQL View](http://docs.geoserver.org/stable/en/user/data/database/sqlview.html) in GeoServer
- `cluster` : `true/false` - cluster point features. Applies to WFS, ArcGIS Feature and GeoJSON layers. Additional options are described on the [Leaflet cluster](https://github.com/Leaflet/Leaflet.markercluster) page
- `hidden` : `true/false` - when true, the layer will not be shown in the Table of Contents or on the map, but can still be used in the Query Widget. This can be useful to allow querying of a complex layer which can't easily be drawn on the map
- `showOnTop` : `true:false` - when true, this layer will be drawn on top of other layers. This can be used to ensure that points draw on top of polygons, etc. (Note that When multiple layers have this option set, there is the potential that they will overlap _each other_.)
- `geomField` - applies to GeoServer layers. The name of the geometry field
- `label`: `{"name": "field_name","minZoom": 10, maxZoom: 16}` - this option creates a simple text label layer based on the specified field name, with the label layer switching on/off based on the current map scale. Coincident labels are de-duplicated. Applies to WFS and GeoJson layers only
- `outputFormat` : for WFS layers, override the default `text/javascript` output format type, eg using `application/json` or `text/json` as required by the GeoServer instance
- `EPSG` - applies to GeoServer layers. The WKID value for this layer's coordinate system - see http://spatialreference.org/

**Specifying and formatting fields**

There are various locations throughout Bootleaf (such as popups, Identify and Query) where it is useful to control which fields/attributes are shown, and how they are formatted. This is handled via the `outFields` parameter, which is an array of field objects in the format:

```
"outFields": [
	{"name": "NAME", "alias": "Name"},
	{"name": "POP", "alias": "Population", "thousands": true},
	{"name": "AREASQKM", "alias": "Area (sq km)", "decimals": 2},
	{"name": "si", "alias": "Sum Insured", "decimals": 0, "prefix": "$"},
	{"name": "startdate", "alias": "Start Date", "date": true},
	{"name": "OBJECTID", "hidden": true}
]
```

- `name` - the field name as returned by ArcGIS Server, GeoServer, etc
- `alias` - an optional alias to display in place of the actual field name
- `thousands` - for numeric fields, the option to display commas as a thousands indicator
- `decimals` - for numeric fields, the option to round values to a specified number of decimal places
- `prefix` - an optional prefix to add before the value (eg $)
- `date` - forces JavaScript-formatted dates (as returned by ArcGIS Server) to display as YYYY/MM/DD
- `hidden` - hides the value from being displayed, but uses it elsewhere (eg in the Download As CSV option)

The `outFields` parameter may be specified against the layer, and additionally against the `identify` and `queryWidget` - this can be useful in order to display different fields in different situations.

For ArcGIS Feature Layers, if this option is specified the layer's ID field must be included (eg, OBJECTID, OID, FID, etc).

- `tooltipField` : `'fieldName'` - for WFS and agsFeatureLayers, you can specify the name of a field to be displayed in a simple tooltip when the user hovers over the feature

**Styling options**
- `style` : style object in [Leaflet format](http://leafletjs.com/reference.html#path-options), which will over-write the default Leaflet styles. Applies to GeoJSON and ArcGIS Feature layers
- `icon` : specify a marker [icon](http://leafletjs.com/reference.html#icon) for GeoJSON and ArcGIS Feature layers
- `clusterIconClass` - over-write the standard cluster styles, and apply a given style to all cluster icons in this layer. Specify a `background-color` or other CSS properties for this class in order to style the cluster appropriately

_Note that only one of these styling options may be applied to a layer as they are mutually exclusive._

Other parameters (as described in the Supported Layer Types links above) may be added to the layer's configuration, and will be sent to the layer constructor.

## [Table of Contents](#table-of-contents)

The [table of contents](http://leafletjs.com/reference-1.0.2.html#control-layers-option) may optionally be used to allow users to switch layers on/off.

![Table of Contents screenshot](https://i.imgur.com/V9Ssnke.png)

Include `TOC` in the `controls` section to enable this option. By default the TOC lists all layers found on the map, but this may be configured by adding the `tocCategories` object, as in this example:

```
"tocCategories": [
	{
		"name": "Group name 1",
		"layers" : ["layerID1","layerID2"],
		"exclusive": true
	},
	{
		"name": "Group name 2",
		"layers": ["layerID3","layerID4"]
	}
],
"toggleAll": true
```

Create groups using the syntax `{"name": "X"}` and add layers to this group using the syntax `{"layers": [list of layer IDs]}`, where the layer IDs match the IDs set up in the Layer Configuration section below.

The `exclusive` flag applies radio buttons to layers within that group, such that only one layer may be visible at any time. This replaces the default checkbox functionality.

The `toggleAll` flag adds buttons to the top of the Table of Contents, allowing all layers to be toggled on/off quickly.

*Note: this Table of Contents widget does not have the ability to control the layer draw order, so the last layer checked on always draws on top of other layers. This will be improved upon in the future.*

## [Identify](#identify)

Identify functionality may currently be configured for WMS and ArcGIS Server Dynamic layers (other layer types may be supported in future).

![identify results screenshot](https://i.imgur.com/7bdIVIX.png)

To enable this, add the `identify` object as an option under a Dynamic or WMS layer:

```
{
	"id": "layerID",
	"type": "agsDynamicLayer",
	"identify": {
		"layerName": "the layer name in the ArcGIS Server REST API",
		"layerLabel": "the layer name to display in the Results dialog",
		"primaryField": "the field on which to report",
		"outFields": [
			{"name": "field_name", "alias": "Field Alias", "prefix": "$"},
			{"name": "field alias", "thousands": true, "decimals": 2}
		],
	},
	"maxAllowableOffset": 0.01
}
```

If `outFields` is not specified against the `identify` object, the layer's `outFields` will be used. See the `outFields` section above for more information on the field specification.

Note: If the ArcGIS Server REST API lists an alias against a field, this should be used in place of the field name. Eg in the case of [this layer](http://vmgeospatialdev.erga.aubootleaf.corp/arcgis/rest/services/admin_boundaries/EmbargoRegions_BOM_201506/MapServer/1) the *BNAME* field has an alias, so (somewhat confusingly) the *alias* should actually be specified in the `name` field:

*BNAME ( type: esriFieldTypeString , alias: BOM river region name)*

When the Identify tool is activated under the > Tools menu, and the layer is visible, clicking on the map will return the value of the `primaryField` at the location clicked. The results for all identify-able layers are shown in the pull-out sidebar.

*Note: the Identify tool is only enabled if there are visible, identifiable layers on the map.*

## [Query](#query)

The query widget allows users to search for features within a layer, and is currently supported for ArcGIS Server Feature & Dynamic layers, and WMS/WFS layers.

![query widget screenshot](https://i.imgur.com/sElCdJp.png)

To enable this, add the `queryWidget` object as an option under an ArcGIS Dynamic or Feature layer:

```
"queryWidget": {
	"layerIndex": 0,
	"maxAllowableOffset": 0.001,
	"queries" : [
		{"name": "NAME", "alias": "Name", "defaultOperator": "contains"},
		{"name": "POP", "alias": "Population", "type": "numeric"}
	],
	"outFields": [
		{"name": "NAME", "alias": "Name"},
		{"name": "POP", "alias": "Population", "thousands": true},
		{"name": "AREASQKM", "alias": "Area (sq km)", "decimals": 2},
		{"name": "OBJECTID", "hidden": true}
	]
}
```

#### Query Widget Parameters

- `layerIndex` - the layer's index according to its REST URL. Applies to ArcGIS Dynamic layers only
- `maxAllowableOffset` - this parameter allows the query results to be returned faster, by generalising the output geometry by the specified amount. The units are whatever units the dataset is stored in (eg decimal degrees, metres, etc). This applies to ArcGIS layers only
- `queries` - an array of query objects, consisting of:
  - `name` - the name of the field to query
  - `alias` - an optional alias to display in the widget
	- `type` - defaults to text, or use `numeric` to allow the correct syntax for numerical fields. Other field types may be added in future.
	- `defaultOperator` - the default optional query operator for this query. Options are "=", "starts with", "ends with", "contains", "<", ">"
- `outFields` - the list of field objectss to be returned in the query results section. If `outFields` is not specified against the `queryWidget` object, the layer's `outFields` will be used. See the `outFields` section above for more information on the field specification.

Use the Within Current Map Extent or Within Polygon options to restrict the query to the specified extent. Use the Download As CSV option to download the results for processing in Excel.

If the query layer uses a projection other than lat/long, the layer's coordinate system must be added to the config file's `projections` parameter (see above).

*Note: the Query Tool is only enabled if there are queryable layers on the map.*

## [Custom code](#custom-code)
The file custom.js can be used to personalise the map by writing additional functionality. This file contains 2 functions, `beforeMapLoads()` and `afterMapLoads()`, which allow you to perform customisations as required.

The sample file includes code to demonstrate how to use a user-defined query string to filter a layer on-the-fly:

![Custom code screenshot](https://i.imgur.com/6YLfiHz.png)

Additional [Leaflet plugins](https://leafletjs.com/plugins.html) may also be added to Bootleaf. Download the relevant plugin into the `/src/plugins` directory then add a reference to the plugin in the `index.html` file, following the pattern of the existing plugins. Then use the plugin as required in the `custom.js` file.

## [Known issues and other problems](#issues)

- the `exclusive` option in the Table of Contents doesn't always work well when the map first opens - it may be out of sync with what's displayed on the map. The workaround is to have all layers switched off by default when they're inside an exclusive TOC group. Once a layer has been checked on in the TOC, the behaviour reverts to normal.
- related to the above, the Identify tool may not work against the correct layers if the Identify tool is active when the map loads with exclusive TOC groups. The workaround is to not have the Identify tool active when the map loads, when using an exclusive TOC group. Once the Identify tool is enabled using the > Tools > Identify option, the behaviour reverts to normal.

Contact [Steve](https://github.com/slead) if you encounter any problems, and/or log bugs using the [Issues](https://github.com/iag-geo/bootleaf/issues) link on GitHub.
