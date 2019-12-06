var bootleaf = {
  "mapWkid": 4326,
  "layerTOC": {},
  "tocOptions": {
    "exclusiveGroups": [],
    "groupCheckboxes": true
  },
  "activeTool": null,
  "identifyLayers": [],
  "layers": [],
  "wfsLayers": [],
  "labelLayers": [],
  "identifyLayerHeadings": [],
  "clickTolerance": 5,
  "currentTool": null,
  "queryTasks": [],
  "queryReults": {},
  "visibleLayers": [],
  "basemaps": [
    {"id": "MapboxStreets", "type": "mapbox", "theme": "streets", "label": "Streets (MapBox)"},
    {"id": "MapboxLight", "type": "mapbox", "theme": "light", "label": "Light (MapBox)"},
    {"id": "MapboxDark", "type": "mapbox", "theme": "dark", "label": "Dark (MapBox)"},
    {"id": "MapboxSatellite", "type": "mapbox", "theme": "satellite", "label": "Satellite (MapBox)"},
    {"id": "MapboxSatelliteStreets", "type": "mapbox", "theme": "streets-satellite", "label": "Streets with Satellite (MapBox)"},
    {"id": "MapboxHighContrast", "type": "mapbox", "theme": "high-contrast", "label": "High-contrast (MapBox)"},
    {"id": "esriStreets", "type": "esri", "theme": "Streets", "label": "Streets (ArcGIS)"},
    {"id": "esriGray", "type": "esri", "theme": "Gray", "label": "Light gray (ArcGIS)"},
    {"id": "esriTopographic", "type": "esri", "theme": "Topograhic", "label": "Topographics (ArcGIS)"},
    {"id": "esriImagery", "type": "esri", "theme": "Imagery", "label": "Satellite (ArcGIS)"},
    {"id": "esriShadedRelief", "type": "esri", "theme": "ShadedRelief", "label": "Shaded relief (ArcGIS)"},
    {"id": "esriTerrain", "type": "esri", "theme": "Terrain", "label": "Terrain (ArcGIS"},
    {"id": "esriDarkGray", "type": "esri", "theme": "DarkGray", "label": "Dark gray (ArcGIS)"},
    {"id": "esriNationalGeographic", "type": "esri", "theme": "NationalGeographic", "label": "National Geographic (ArcGIS)"},
    {"id": "esriOceans", "type": "esri", "theme": "Oceans", "label": "Oceans (ArcGIS)"},
    {"id": "OpenStreetMap", "type": "tiled", "label": "OpenStreetMap", "url": "http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"},
    {"id": "Aerial", "type": "bing", "label": "Bing satellite"},
    {"id": "AerialWithLabels", "type": "bing", "label": "Bing satellite labels"},
    {"id": "Road", "type": "bing", "label": "Bing streets"}
  ]
};

$(document).ready(function(){

  if (typeof config === 'undefined') {
    $.growl.error({message: "Error - the configuration file is not found!", fixed: true});
    return null
  }

  // Get parameters passed via the URL. Overwrite the config file's start parameter
  if(getURLParameter("lat") !== null && getURLParameter("lng") !== null){
    config.start.center = [getURLParameter("lat"), getURLParameter("lng")]
  }
  if(getURLParameter("zoom") !== null){
    config.start.zoom = getURLParameter("zoom");
  }

  // If there are layers in the URL, handle them in the layer creation functions
  if(getURLParameter("layers")) {
    bootleaf.layerParams = getURLParameter("layers").split(",");
  } else {
    bootleaf.layerParams = [];
  }

  // If the basemap is specified in the URL, it's handled in the basemap creation function
  if(getURLParameter("basemap") !== null){
    bootleaf.defaultBasemap = getURLParameter("basemap");
  }

  // Allows for insertion of custom properties to manipulate the config file
  try{
    beforeMapLoads();
  } catch (error){
    $.growl.error({message: "There was a problem running the BeforeMapLoads custom code: " + error.message, fixed: true});
  }

  // Set the page title
  if (config.title !== undefined) {document.title = config.title;}

  // Set the About page content
  if (config.about !== undefined) {
    if (config.about.title !== undefined) {
      $("#aboutTitle").html(config.about.title);
    }
    if (config.about.contents !== undefined) {
      $("#aboutContents").html(config.about.contents);
    }
  }

  // Set the style for highlighting features - used by Identify and Query Widget
  bootleaf.highlightStyle = config.highlightStyle || {
    "stroke": false,
    "fillColor": "#00FFFF",
    "fillOpacity": 0.7,
    "radius": 10,
    "weight": 2,
    "opacity": 1,
    "color": '#727272',
    "dashArray": '3'
  };

  // Override the default icon if an icon is specified. See http://leafletjs.com/reference-1.1.0.html#icon-default
  if (config.defaultIcon !== undefined){
    var options = ["imagePath", "iconUrl", "iconSize", "iconAnchor", "popupAnchor", "shadowUrl", "shadowSize", "shadowAnchor"];
    for (var o = 0; o < options.length; o++){
      var option = options[o];
      if (config.defaultIcon[option] !== undefined){
        L.Icon.Default.prototype.options[option] = config.defaultIcon[option];
      }
    }
  }

  // Build layers from the config file
  if(config.layers === undefined){
    config.layers = [];
  }
  for (var layerIdx = 0; layerIdx < config.layers.length; layerIdx ++){
    try {
      var layer;
      var layerConfig = config.layers[layerIdx];
      var layerType = layerConfig.type;
      var layerId = layerConfig.id || "unknown layer";

      // If a style has been specified, run a pointToLayer function to allow it to work
      if (layerConfig.style){
        layerConfig.pointToLayer = function (feature, latlng) {
          return L.circleMarker(latlng);
        }
      }

      // Enable the icon if specified
      if (layerConfig.icon !== undefined){
        var icon = L.icon(layerConfig.icon);
        layerConfig.pointToLayer = function (feature, latlng) {
          var marker = L.marker(latlng,{
            icon: icon
          });
          return marker;
        };
      }

      if (layerType === "agsFeatureLayer") {

        // If the config file includes 'outFields', convert it to 'fields' - a simple listing of field names
        // which is required by the Esri-Leaflet API
        if (layerConfig.outFields !== undefined && layerConfig.outFields.length > 0) {
          layerConfig.fields = $.map( layerConfig.outFields, function( val, i ) {
            return val['name'];
          });
        }

        if (layerConfig.cluster !== undefined) {
          layer = L.esri.Cluster.featureLayer(layerConfig);
        } else {
          layer = L.esri.featureLayer(layerConfig);
        }

        // Configure a popup for this layer, if specified in the config
        if (layerConfig.popup) {
          layer.on("click", function(evt){
            var output = '<table class="table table-condensed table-bordered">';
            var layerConfig = this.layerConfig;
            for (key in evt.layer.feature.properties){
              // Ignore ID fields
              if (["FID", "OBJECTID", "OID", "id", "ID", "ObjectID"].indexOf(key) < 0){
                var val = evt.layer.feature.properties[key];

                // Use the field alias if supplied in the outFields parameter
                if (layerConfig.outFields !== undefined){
                  var outFields = layerConfig.outFields;
                  var outputs = formatPopup(key, val, outFields);
                  key = outputs[0];
                  val = outputs[1];
                }
                if (key !== null){
                  output += "<tr><td>" + key + "</td><td>" + val + "</td></tr>";
                }
              }
            }
            output += "</table>"
            bootleaf.map.openPopup(output, evt.latlng)
          });
        }

        // Configure a tooltip for this layer, if specified in the config
        if (layerConfig.tooltipField !== undefined) {
          layer.on("mouseover", function(evt){
            try{
              var tooltipContent = evt.layer.feature.properties[this.layerConfig.tooltipField];
              bootleaf.map.openTooltip(tooltipContent, evt.latlng);
            } catch(err){
              console.log("problem opening tooltip");
            }
          });
          layer.on("mouseout", function(evt){
            try{
              bootleaf.map.eachLayer(function(layer) {
                if(layer.options.pane === "tooltipPane") layer.removeFrom(bootleaf.map);
              });
            } catch(err){
              console.log("problem closing tooltip");
            }
          });
        }

      } else if (layerType === "agsTiledLayer") {
        layer = L.esri.tiledMapLayer(layerConfig);
      } else if (layerType === 'agsDynamicLayer') {
        layer = L.esri.dynamicMapLayer(layerConfig);
      } else if (layerType === "wmsTiledLayer") {
        if (layerConfig.where) {
          layerConfig['CQL_FILTER'] = layerConfig.where;
        }
        layer = L.tileLayer.wms(layerConfig.url, layerConfig);
      } else if (layerType === 'WFS') {
        // If the config file includes 'outFields', convert it to 'fields' - a simple listing of field names
        // which is required by the Esri-Leaflet API
        if (layerConfig.outFields !== undefined && layerConfig.outFields.length > 0) {
          layerConfig.fields = $.map( layerConfig.outFields, function( val, i ) {
            return val['name'];
          });
        }
        // Configure tooltip or popup
        if (layerConfig.popup !== undefined || layerConfig.tooltipField !== undefined){layerConfig.onEachFeature = configurePopup;}

        if (layerConfig.cluster) {
          if (layerConfig.clusterIconClass !== undefined){
            layerConfig.iconCreateFunction = function (cluster) {
              // If the user has over-ridden the default cluster markers, create new markers
              // with the class name specified, scaling them based on the number of markers
              var numMarkers = cluster.getAllChildMarkers().length;
              var iconSize;
              if (numMarkers < 10) {
                iconSize = 25;
              } else if (numMarkers >= 10 && numMarkers < 100) {
                iconSize = 35;
              } else if (numMarkers >= 100 && numMarkers < 1000) {
                iconSize = 45;
              } else if (numMarkers >= 1000) {
                iconSize = 55
              }
              var icon = {
                "className": "marker-cluster span ",
                "iconSize": L.point(iconSize, iconSize),
                "html": "<div class='cluster-" + iconSize + "'><span >" + numMarkers + "</span></div>"
              }
              icon.className += cluster._group.layerConfig.clusterIconClass;
              return L.divIcon(icon);
            }
          }
          layer = L.markerClusterGroup(layerConfig);
        } else {
          layer = L.geoJSON(null, layerConfig);
        }

        // If this layer has a tooltip and a popup, close it when showing the popup
        if (layerConfig.tooltipField !== undefined && layerConfig.popup !== undefined && layerConfig.popup === true) {
          layer.on("click", function(evt){
            evt.layer.closeTooltip()
          })
        }
        layer.layerConfig = layerConfig;
        bootleaf.wfsLayers.push(layer);

        // If the layer has labels configured, create an empty label layer. It will be populated later
        if (layerConfig.label !== undefined){
          buildLabelLayer(layerConfig);
        }

      } else if (layerType === "tileLayer") {
        layer = L.tileLayer(layerConfig.url, layerConfig);
      } else if (layerType === "geoJSON") {

        $.ajax({
          dataType: "json",
          type: 'GET',
          url: layerConfig.url,
          beforeSend: function (jqXHR, settings) {
            // add required properties so they can be accessed in the success function
            jqXHR.layerConfig = layerConfig;
          },
          success: function(data, textStatus, jqXHR) {

            // If the layer has labels configured, create an empty label layer. It will be populated later
            if (jqXHR.layerConfig.label !== undefined){
              buildLabelLayer(jqXHR.layerConfig);
            }

            // Handle cluster/normal layers differently

            if (jqXHR.layerConfig.icon !== undefined){
              jqXHR.layerConfig.pointToLayer = function (feature, latlng) {
                var marker = L.marker(latlng,{
                  icon: L.icon(jqXHR.layerConfig.icon)
                });
                return marker;
              };
            }

            jqXHR.layerConfig.onEachFeature = configurePopup;

            if (jqXHR.layerConfig.cluster) {
              jqXHR.layer = L.markerClusterGroup(jqXHR.layerConfig);
              jqXHR.tempLayer = new L.geoJson(null,jqXHR.layerConfig);
              $(data.features).each(function(key, data) {
                jqXHR.tempLayer.addData(data);
              });
              jqXHR.layer.addLayer(jqXHR.tempLayer);
            } else {
              jqXHR.layer = new L.geoJson(null, jqXHR.layerConfig);
              $(data.features).each(function(key, data) {
                jqXHR.layer.addData(data);
              });
            }

            jqXHR.layer.layerConfig = jqXHR.layerConfig;
            addLayer(jqXHR.layer);

            // Display labels if configured for this layer
            if (jqXHR.layer.layerConfig.label !== undefined){
              createLabels(jqXHR.layer.layerConfig, data)
            }


          },
          error: function(jqXHR, textStatus, error) {
            $.growl.warning({ message: "There was a problem fetching the features for " + jqXHR.layerConfig.id});

            // Remove this layer from the map, TOC and Visible Layers array
            if(jqXHR.layer !== undefined) {
              try{
                bootleaf.map.removeLayer(jqXHR.layer);
                bootleaf.visibleLayers.splice(bootleaf.visibleLayers.indexOf(jqXHR.layer.id), 1)
                bootleaf.TOCcontrol.removeLayer(jqXHR.layer);
              } catch(err){
                console.log("There was a problem removing this layer from the map");
              }
            }
          }
        });
      }

        // Configure the Query Widget for this layer, if specified in the config
      if (layerConfig.queryWidget !== undefined && layerConfig.queryWidget.queries && layerConfig.queryWidget.queries.length > 0) {
        var queries = []
        for (var queryIdx = 0; queryIdx < layerConfig.queryWidget.queries.length; queryIdx ++){
          var query = layerConfig.queryWidget.queries[queryIdx];
          query.layerId = layerConfig.id;
          queries.push(query);
        }
        bootleaf.queryTasks.push({"layerName": layerConfig.name, "layerId": layerConfig.id, "queries": queries});
      }

      if (layer !== undefined) {
        // Persist the layer's config options with the layer itself
        layer.layerConfig = layerConfig;
        if (!layerConfig.hidden && layerConfig.type !== 'geoJSON') {
          addLayer(layer);
        }
      }

    } catch(err) {
      $.growl.error({ message: err.message});
    }
  }

  // Initialise the map using the start parameters from the config file, and the visibleAtStart layers
  if(config.start.maxZoom === undefined){config.start.maxZoom = 19;} // Required for the Marker Clusterer
  bootleaf.map = L.map("map", config.start);

  // Enable the draw tool if there are any query layers. The tool is enabled and disabled with the Query Widget
  if (bootleaf.queryTasks.length > 0){
    bootleaf.drawControl = new L.Control.Draw({
      position: 'topright',
      draw: {
          polygon: true,
          polyline: false,
          circle: false,
          marker: false,
          rectangle: false
      }
    });

    // Add a graphics layer to hold polygons drawn in the QueryWidget draw tool
    bootleaf.queryPolygon = new L.FeatureGroup();
    bootleaf.map.addLayer(bootleaf.queryPolygon);
    bootleaf.map.on(L.Draw.Event.CREATED, function (e) {
      var layer = e.layer;
      bootleaf.queryPolygon.addLayer(layer);
    });

    bootleaf.map.on('draw:drawstart', function (e) {
      bootleaf.queryPolygon.clearLayers();
      $("#queryDrawControlHelp").hide();
    });

  }

  // Set default projections and load any user-defined projections. Create proj4 definitions from these
  bootleaf.projections = {
    102100: '+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext  +no_defs',
    4326: '+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs',
    4283: '+proj=longlat +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +no_defs'
  };
  $.map( config.projections || [], function( val, i ) {
    for (var key in val){
      bootleaf.projections[key] = val[key];
    }
  });
  for (var wkid in bootleaf.projections){
    var def = bootleaf.projections[wkid];
    proj4.defs('EPSG:' + wkid, def);
  }

   /* Highlight layer, used for Identify and Query results */
  bootleaf.highlightLayer = L.geoJson(null);

  // When the visible layers change, check whether the new layers are identifiable/queryable
  bootleaf.map.on("layeradd", function(evt) {
    if (evt.layer.layerConfig !== undefined){
      updateIdentifyLayers();
      reorderLayers();
    }
  });

  bootleaf.map.on("layerremove", function(evt) {
    if (evt.layer.layerConfig !== undefined){
      updateIdentifyLayers();
      reorderLayers();
    }
  });

  // When the map loads, or its extent changes, update any WFS layers
  bootleaf.map.on("moveend", function() {
    updateScaleThresholds();
    fetchWFS();
  });
  updateScaleThresholds();
  fetchWFS();

  // Add map controls:

  // Zoom Control
  if(config.controls){
    if(config.controls.zoom) {
      if (navigator.userAgent.match(/iPad/i) === null){
        bootleaf.zoomControl = L.control.zoom({
          position: config.controls.zoom.position || "bottomright"
        }).addTo(bootleaf.map);
      }
    }

    // TOC control
    if(config.controls.TOC){
      bootleaf.tocOptions['position'] = config.controls.TOC.position || 'topright';
      bootleaf.tocOptions['collapsed'] = config.controls.TOC.collapsed || false;
      bootleaf.tocOptions['toggleAll'] = config.controls.TOC.toggleAll || false;

      bootleaf.TOCcontrol = L.control.groupedLayers(null, bootleaf.layerTOC, bootleaf.tocOptions);
      bootleaf.map.addControl(bootleaf.TOCcontrol);
    }

    // History control
    if (config.controls.history) {
      try{
        bootleaf.historyControl = new L.HistoryControl(config.controls.history).addTo(bootleaf.map);
      }catch(err){
        $.growl.warning({ message: "There was a problem enabling history on this application"});
      }
    }

    // Geocoder control
    // https://github.com/perliedman/leaflet-control-geocoder
    if(config.controls.leafletGeocoder !== undefined) {

      var geocoder = L.Control.Geocoder.nominatim(config.controls.leafletGeocoder);
      if(config.controls.leafletGeocoder.type === "Harmony") {
        geocoder = L.Control.Geocoder.harmony(config.controls.leafletGeocoder);
      } else if (config.controls.leafletGeocoder.type === "OpenStreetMap") {
        geocoder = L.Control.Geocoder.nominatim(config.controls.leafletGeocoder);
      } else if (config.controls.leafletGeocoder.type === "Google") {
        geocoder = L.Control.Geocoder.google(config.controls.leafletGeocoder);
      } else if (config.controls.leafletGeocoder.type === "ArcGIS") {
        geocoder = L.Control.Geocoder.arcgis(config.controls.leafletGeocoder);
      }

      if (config.controls.leafletGeocoder.suffix !== undefined){
        geocoder.suffix = config.controls.leafletGeocoder.suffix;
      }

      bootleaf.leafletGeocoder = L.Control.geocoder({
        position: config.controls.leafletGeocoder.position || "bottomright",
        placeholder: config.controls.leafletGeocoder.placeholder || "Search for an address",
        collapsed: config.controls.leafletGeocoder.collapsed || false,
        geocoder: geocoder
      }).addTo(bootleaf.map);

    }

    if (config.controls.bookmarks) {
      var bookmarkOptions = {
        "localStorage": true,
        "position": "topleft"
      }
      bootleaf.bookmarkControl = new L.Control.Bookmarks(bookmarkOptions).addTo(bootleaf.map);

      // Check if each bookmark has already been added via local storage, to avoid duplicate bookmarks
      localBookmarks = $.map( bootleaf.bookmarkControl._data || [], function( val, i ) {
        return val.id;
      });

      if (config.controls.bookmarks.places !== undefined && config.controls.bookmarks.places.length !== undefined){
        for(var bmIdx = 0; bmIdx < config.controls.bookmarks.places.length; bmIdx++){
          var bm = config.controls.bookmarks.places[bmIdx];
          if($.inArray(bm.id, localBookmarks) === -1) {
            bootleaf.map.fire('bookmark:add', {data: config.controls.bookmarks.places[bmIdx]});
          }
        }
      }
    }
  }

  // Add basemaps to the dropdown. If the basemaps option is used in the config file, only load those basemaps, otherwise load them all
  $.map( bootleaf.basemaps || [], function( basemap, i ) {
    if(config.basemaps === undefined || $.inArray(basemap.id, config.basemaps) > -1){
      var html = '<li>';
      html += '<a href="#" data-toggle="collapse" data-target=".navbase-collapse.in" class="dropdown-item liBasemap" data-type="' + basemap.type + '" data-theme="'
          + basemap.theme + '"' +  'data-basemapId="' + basemap.id + '"';
      if(basemap.url){
        html += 'data-url="' + basemap.url + '"';
      }
      html += ' data-id="' + basemap.id + '">' + basemap.label + '</a></li>';
      $("#ulBasemap").append(html);
    }

    // Set the default basemap. It's either the first in the config.basemaps list, or the first in the default list
    if(bootleaf.defaultBasemap && basemap.id === bootleaf.defaultBasemap){
      setBasemap(basemap);
    } else if (bootleaf.defaultBasemap === undefined){
      if(config.basemaps && config.basemaps[0] === basemap.id){
        setBasemap(basemap);
      }
    }
  });

  // Specify the default basemap if it wasn't set above
  if(!config.basemaps && !bootleaf.defaultBasemap){
    setBasemap(bootleaf.basemaps[0]);
  }

  if(config.basemaps === undefined || (config.basemaps !== undefined && config.basemaps.length > 1)){
    $('*[data-basemapId="' + bootleaf.defaultBasemapId + '"]').addClass("active");

    // Change the basemap when the user changes the dropdown
    $(".liBasemap").click(function(evt) {
      // Update the Active class for this basemap
      $("#ulBasemap a").removeClass("active");
      $('*[data-basemapId="' + this.id + '"]').addClass("active");
      var basemap = {
        "type": this.dataset['type'],
        "id": this.dataset.id,
        "theme": this.dataset.theme
      };
      if (this.dataset['url']) {basemap.url = this.dataset['url']}
      setBasemap(basemap);
    });

  } else {
    $("#basemapDropdown").hide();
  }

  // Hide the loading indicator
  // TODO - show the loading indicator when something happens
  $("#loading").hide();

  // Decide whether to enable the queryWidget tool
  if (!bootleaf.queryTasks || bootleaf.queryTasks.length === 0){
    $("#liQueryWidget").addClass('disabled');
  } else {
    $("#liQueryWidget").removeClass('disabled');
  }

  // Enable Identify if any identifiable layers are present
  updateIdentifyLayers();

  // Set the active tool, if applicable and supported by the current layers
  if (config.activeTool !== undefined){
    $(".mapTools").removeClass("active");

    if (config.activeTool === 'identify') {
      if (bootleaf.identifyLayers && bootleaf.identifyLayers.length > 0){
        configureIdentifyTool();
        $('*[data-tool="' +  config.activeTool + '"]').addClass("active");
      }

    } else if (config.activeTool === 'coordinates') {
      configureCoordinatesTool();
      $('*[data-tool="' +  config.activeTool + '"]').addClass("active");
    } else if (config.activeTool === 'queryWidget'){
      if (bootleaf.queryTasks && bootleaf.queryTasks.length > 0){
        configureQueryWidget();
        $('*[data-tool="' +  config.activeTool + '"]').addClass("active");
      }
    }
    // TODO - add more tools here, with corresponding configureXXXtool functions

  } else {
    $("#sidebar").hide("slow");
    $(".mapTools").removeClass("active");
  }

  // Run custom code after the map has loaded
  try{
    afterMapLoads();
  } catch (error){
    $.growl.error({ message: "There was a problem running the AfterMapLoads custom code: " + error.message});
  }

});

function reorderLayers(){

  // If any layers are tagged as showOnTop, bring them to the top of the map
  for (var i = 0; i < bootleaf.layers.length; i++){
    var layer = bootleaf.layers[i];
    if (bootleaf.map.hasLayer(layer) && layer.layerConfig && layer.layerConfig.showOnTop) {
      layer.bringToFront();
    }
  }

}

function addLayer(layer){

  // Once the layer has been created, add it to the map and the applicable TOC category
  var layerConfig = layer.layerConfig;
  layer.name = layerConfig.name || layerConfig.id || "unknown layer name";

  // Insert a span to hold the layer's legend information, if specified
  if (layerConfig.legendClass !== undefined){
    layer.name = "<span class='legend " + layerConfig.legendClass + "'></span> " + layer.name;
  }
  var layerAdded = false;

  // Add this layer to the TOC (within a category if specified in the config file)
  var tocCategories = config.tocCategories || [];
  for (var tocIdx = 0 ; tocIdx < tocCategories.length; tocIdx ++) {
    var tocCategory = tocCategories[tocIdx];
    var tocCategoryName = tocCategory.name;
    var tocLayers = tocCategory.layers || [];

    // Add this category to the TOC
    if (tocCategoryName in bootleaf.layerTOC === false) {
      bootleaf.layerTOC[tocCategoryName] = {};
      if (tocCategory.exclusive) {
        bootleaf.tocOptions.exclusiveGroups.push(tocCategoryName);
        // Add an option to switch off all layers in the radio group
        bootleaf.layerTOC[tocCategoryName]["none"] = L.layerGroup();
      }
    }

    // Add this layer to the appropriate category, if applicable
    if ($.inArray(layerConfig.id, tocLayers) > -1) {
      bootleaf.layerTOC[tocCategoryName][layer.name] = layer;
      layer.tocCategoryName = tocCategoryName;
      layerAdded = true;
    }
  }

  if (layerAdded === false) {
    var uncategorisedLabel = "Uncategorised";
    if(config.controls && config.controls.TOC && config.controls.TOC.uncategorisedLabel){
      uncategorisedLabel = config.controls.TOC.uncategorisedLabel;
    }
    if (uncategorisedLabel in bootleaf.layerTOC === false){
      bootleaf.layerTOC[uncategorisedLabel] = {};
    }
    bootleaf.layerTOC[uncategorisedLabel][layer.name] = layer;
  }

  // Layers are visible by default, unless otherwise specified in the config, or unless
  // any layers are passed in URL parameters (in which case, only those layers are visisble)
  if(config.start.layers == undefined) { config.start["layers"] = [];}
  if(bootleaf.layerParams.length > 0) {
    if(bootleaf.layerParams.indexOf(layerConfig.id) > -1){
      config.start.layers.push(layer);
      bootleaf.visibleLayers.push(layerConfig.id);
      layer.tocState = "on";
    }
  } else if (layerConfig.visible === undefined || layerConfig.visible == true) {
    config.start.layers.push(layer);
    bootleaf.visibleLayers.push(layerConfig.id);
    layer.tocState = "on";
  }

  // GeoJSON layers have to be added manually, since this function is called asynchronously after
  // the other layers have already been added to the map's layers list
  if (layerConfig.type === 'geoJSON'){
    if ($.inArray(layerConfig.id, bootleaf.visibleLayers) > -1) {
      layer.addTo(bootleaf.map);
      layer.tocState = "on";
    }
    bootleaf.TOCcontrol.addOverlay(layer, layer.name, layer.tocCategoryName);
  }

  if (layer.tocState === undefined){
    layer.tocState = "off";
  }
  bootleaf.layers.push(layer);

}

function setBasemap(basemap){
  if (bootleaf.basemapLayer) {bootleaf.map.removeLayer(bootleaf.basemapLayer);}
  var options = {
    "maxZoomLevel": 23,
    "maxZoom": 23,
    "maxNativeZoom": 19
  }
  if (basemap.type === "esri") {
    if ($.inArray(basemap.id, ["esriGray", "esriDarkGray"]) > -1) {
      options.maxNativeZoom = 16;
    }
    var esriTheme = basemap.theme || "Streets";
    bootleaf.basemapLayer = L.esri.basemapLayer(esriTheme, options);
  } else if (basemap.type === 'tiled'){
    if (basemap.id === 'OpenStreetMap') {
      options.attribution = "<a href='http://www.openstreetmap.org/copyright' target='_blank'>© OpenStreetMap contributors</a>";
    }
    bootleaf.basemapLayer = L.tileLayer(basemap.url, options);
  } else if (basemap.type === 'mapbox'){
    options["attribution"] = "<a target='_blank' href='https://www.mapbox.com/about/maps/'>© Mapbox</a>, <a href='http://www.openstreetmap.org/copyright' target='_blank'>© OpenStreetMap</a>, <a href='https://www.mapbox.com/map-feedback/' target='_blank'>Improve this map</a>"
    var mapboxKey = config.mapboxKey || "";
    if (mapboxKey === '' || mapboxKey === undefined){
      $.growl.warning({ title: "Map Box error", message: "Ensure that you have specified a valid MapBox key in the config file"});
    }
    var mapboxTheme = basemap.theme || "streets";
    bootleaf.basemapLayer = L.tileLayer("http://a.tiles.mapbox.com/v4/mapbox." + mapboxTheme + "/{z}/{x}/{y}.png?access_token=" + mapboxKey, options);
  } else if (basemap.type === 'bing'){
    var options = {
      "bingMapsKey": config.bing_key,
      "imagerySet": basemap.id,
      "attribution": "<a href='https://www.microsoft.com/en-us/maps/ target='_blank'>Bing</a>"
    }
    bootleaf.basemapLayer = L.tileLayer.bing(options);
  }
  bootleaf.map.addLayer(bootleaf.basemapLayer)
  // bootleaf.basemapLayer.bringToBack();
  bootleaf.currentBasemap = basemap.id;
  $('*[data-basemapId="' + basemap.id + '"]').addClass("active");
}

function configurePopup(feature, layer) {
  if (feature.properties) {
    if (this.popup !== undefined){
      var popupContent = "<table class='table table-condensed'>";
      for (key in feature.properties){
        var val = feature.properties[key];
        // Ignore nulls, and GeoServer default attributes such as bbox, geom and gid. Add others to this list if required
        if (val !== null && val !== undefined && $.inArray(key, ["bbox", "geom", "gid"]) < 0) {

          // Use the field alias if supplied in the outFields parameter
          if (this.outFields !== undefined) {
            var outFields = this.outFields;
            var outputs = formatPopup(key, val, outFields);
            key = outputs[0];
            val = outputs[1];
          }
          if (key !== null) {
            popupContent += "<tr><td>" + key + "</td><td>"+ val + "</td></tr>";
          }
        }
      }

      popupContent = popupContent.replace(/>,</g, "><");
      popupContent += "</table>";
      layer.bindPopup(popupContent);
    }

    if (this.tooltipField !== undefined){
      try{
        var tooltipContent = feature.properties[this.tooltipField];
        layer.bindTooltip(tooltipContent);
      } catch(err){
        console.log("There was an error configuring the tooltip");
      }
    }
  }
}

function formatPopup(key, val, outFields){
  // Given an input field name and value, return the appropriately formatted values
  for (var i=0; i < outFields.length; i++){
    var field = outFields[i];
    if (field.name !== undefined && field.name === key) {
      if (field.alias !== undefined){
        key = field.alias;
      }
      if (field.hidden === undefined || field.hidden === false){
        val = formatValue(val, field);
      } else {
        key = null;
      }
      break;
    }
  }
  return [key, val];
}

function formatValue(value, field){
  // Given a value and a field definition, apply the appropriate formatting
  // Used in the Query Widget and Identify functions

  try{
    if (field.decimals !== undefined) {
      value = round(value, field.decimals);
    }
    if (field.date !== undefined && value !== null){
      try {
        var theDate = moment(new Date(value));
        var theYear = theDate.year();
        var theMonth = theDate.month() + 1;
        if (theMonth.toString().length === 1){
          theMonth = "0" + theMonth;
        }
        var theDay = theDate.date();
        if (theDay.toString().length === 1){
          theDay = "0" + theDay;
        }

        value = theYear + "/" + theMonth + "/" + theDay;
      } catch(err) {
        console.log("Please ensure that Moment.js has been included");
      }

    }
    if (field.thousands !== undefined) {
      value = addThousandsSeparator(value);
    }
    if (field.prefix !== undefined){
      value = field.prefix + value;
    }
  } catch(err) {
    console.log("There was a problem applying field formatting");
  }

  return (value);
}

function updateIdentifyLayers(){
  // This function runs with the visible layers change, to ensure that only
  // identifiable, visible layers can be identified
  bootleaf.identifyLayers = $.map( bootleaf.map._layers || [], function( val, i ) {
    if (val.layerConfig && val.layerConfig.identify !== undefined) {
      return val;
    }
  });

  if(bootleaf.identifyLayers.length > 0) {
    $("#liIdentify").removeClass('disabled');
    if (bootleaf.activeTool === 'identify'){
      enableIdentify();
    }
  } else {
    $("#liIdentify").addClass('disabled');
    disableIdentify();
  }
}

function setMapCursor(cursor){
  $('.leaflet-container').css('cursor', cursor);
}

function switchOffTools(){
  // remove the listeners for all tools
  bootleaf.map.off('click', showMarker);
  bootleaf.map.off('click', runIdentifies);
  setMapCursor('default');
  bootleaf.activeTool = null;
  bootleaf.map.removeLayer(bootleaf.highlightLayer);

  // Hide the draw toolbar on the Query Widget and remove any polygons
  if (bootleaf.drawControl && bootleaf.drawControl._map !== undefined){
    bootleaf.drawControl.remove();
    bootleaf.queryPolygon.clearLayers();
  }
}

/**************************************************************************************************/
// QUERY WIDGET START
/**************************************************************************************************/

function configureQueryWidget(){
  switchOffTools();
  // resetSidebar("Query Widget");
  bootleaf.activeTool = "queryWidget";

  if (bootleaf.queryTasks) {
    if (bootleaf.queryTasks.length > 0){

      $("#liQueryWidget").removeClass('disabled');

      // Configure the handlebars template for the Query Widget. The layer names are inserted here,
      // while the field and operator values are inserted elsewhere
      var querySource = $("#query-template").html();
      bootleaf.queryTemplate = Handlebars.compile(querySource);

      var layerNames = $.map(bootleaf.queryTasks, function( val, i ) {
        var name = val.layerName;
        if (name === undefined || name === '') {
          name = val.layerId;
        }

        var output = {
          "id": val.layerId,
          "name": name
        }
        return output;
      });

      var html = bootleaf.queryTemplate(layerNames);
      resetSidebar("Query", html);

      // Seed the query field dropdown based on the selected layer
      updateQueryFields($("#queryWidgetLayer option:selected" ).val());

      $("#btnRunQuery").on('click', runQueryWidget);
      // Display the Draw tool when its option is chosen, and disable the extent tool
      $('#chkQueryWithinPolygon').change(function() {
        if($(this).is(":checked")) {
          $("#drawQueryWidget").show();
          $("#queryDrawControlHelp").show();
          $("#chkQueryWithinMapExtent").attr('checked', false);
        } else {
          $("#drawQueryWidget").hide();
          bootleaf.queryPolygon.clearLayers()
        }
      });
      $('#chkQueryWithinMapExtent').change(function() {
        if($(this).is(":checked")) {
          $("#chkQueryWithinPolygon").attr('checked', false);
          $("#drawQueryWidget").hide();
          bootleaf.queryPolygon.clearLayers()
        }
      });

    } else {
      $("#sidebarContents").html("<p><span class='info'>There are no query-able layers in the map</span></p>");
      $("#btnRunQuery").off('click', runQueryWidget);
      $("#liQueryWidget").addClass('disabled');
    }

  } else {
    $("#sidebarContents").html("<p><span class='info'>There are no query-able layers in the map</span></p>");
    $("#btnRunQuery").off('click', runQueryWidget);
    $("#liQueryWidget").addClass('disabled');
  }

  // Update the query field names when the query layer selection changes
  $("#queryWidgetLayer").off("change")
  $("#queryWidgetLayer").on("change", function(e){
    updateQueryFields(e.target.value);
  });

  $("#sidebar").show("slow");

  // Display the Draw control on the Query Widget panel
  if (bootleaf.drawControl._map === null || bootleaf.drawControl._map === undefined){
    bootleaf.map.addControl(bootleaf.drawControl);
    var htmlObject = bootleaf.drawControl.getContainer();
    var a = document.getElementById('queryDrawControl');
    setParent(htmlObject, a);
  }
}

function updateQueryFields(layerId){
  // Update the Fields dropdown on the Query widget with the query fields for this layer
  $("#queryWidgetField").empty();
  $("#queryWidgetValue").val("");
  resetQueryOutputTable();

  var fieldOptions = [];

  for (var i=0; i < bootleaf.queryTasks.length; i++){
    var queryTask = bootleaf.queryTasks[i];
    if (queryTask.layerId === layerId){
      var queries = queryTask.queries;
      for (var j=0; j < queries.length; j++){
        var query = queries[j];
        var fieldName = query.name;
        var fieldAlias = query.alias || fieldName;
        var fieldType = query.type || "text";
        var fieldDefaultOperator = query.defaultOperator || "=";
        var option = '<option value="' + fieldName + '" data-fieldtype="';
        option += fieldType + '" + data-defaultoperator ="' + fieldDefaultOperator + '"';
        option += '>' + fieldAlias + "</option>"
        fieldOptions.push(option);
      }
    }
  }
  $("#queryWidgetField").append(fieldOptions);

  // Update the query operator when the query field selection changes
  updateQueryOperator($("#queryWidgetField option:selected")[0]);
  $("#queryWidgetField").off("change");
  $("#queryWidgetField").on("change", function(){
    updateQueryOperator(this.options[this.selectedIndex]);
  });
}

function updateQueryOperator(option){
  // Update the Operators dropdown on the Query widget with the applicable options for this field type
  $("#queryWidgetOperator").empty();
  $("#queryWidgetValue").val("");
  var defaultOperator = option.dataset['defaultoperator'] || '=';

  var operators = [
    {"value": "=", "alias": "is"},
    {"value": "starts with"},
    {"value": "ends with"},
    {"value": "contains"}
  ];
  if (option !== undefined && option.dataset['fieldtype'] !== undefined){
    var fieldType = option.dataset["fieldtype"];
    if (fieldType === 'numeric'){
      operators = [
        {"value": "<", "alias": "is less than"},
        {"value": "=", "alias": "is equal to"},
        {"value": ">", "alias": "is greater than"}
      ];
    }
    // TODO: add other field types, eg date, etc
  }

  var operatorOptions = $.map( operators, function( val, i ) {
    var alias = val.alias || val.value;
    var opt = '<option value="' + val.value + '"';
    if (defaultOperator === val.value) {
      opt += " selected='selected'";
    }
    opt += '>' + alias + "</option>"
    return opt;
  });
  $("#queryWidgetOperator").append(operatorOptions);

}

function runQueryWidget() {
  resetQueryOutputTable();
  $("#ajaxLoading").show();
  var layerId = $("#queryWidgetLayer option:selected").val()
  var fieldName = $("#queryWidgetField option:selected").val();
  var fieldType = $("#queryWidgetField option:selected")[0].dataset['fieldtype'];
  var operator = $("#queryWidgetOperator option:selected").val();
  var queryText = $("#queryWidgetValue").val().toUpperCase();
  bootleaf.map.removeLayer(bootleaf.highlightLayer);

  // Obtain the query URL for this layer
  var queryUrl;
  var outFields = '*';
  var maxAllowableOffset = 0.1;
  for(var layerIdx=0; layerIdx < config.layers.length; layerIdx++){
    var layer = config.layers[layerIdx];
    if (layer.id === layerId){

      if (layer.type === 'agsFeatureLayer'){
        if(layer.url[layer.url.length - 1] === "/") {
          queryUrl = layer.url + "query?";
        } else {
          queryUrl = layer.url + "/query?";
        }
      } else if (layer.type === 'agsDynamicLayer'){
        var layerIndex = layer.queryWidget.layerIndex;
        if(layer.url[layer.url.length - 1] === "/") {
          queryUrl = layer.url + layerIndex + "/query?";
        } else {
          queryUrl = layer.url + "/" + layerIndex + "/query?";
        }
      } else if (layer.type === 'wmsTiledLayer' || layer.type === 'WFS') {
        // Use the WFS form of the URL for querying. This code ensures that the correct suffix is used.
        var queryUrl = layer.url;
        var tokens = queryUrl.split("/");
        var suffix = tokens[tokens.length - 1];
        if (suffix !== 'ows') {
          queryUrl = queryUrl.replace(suffix, 'ows');
        }
      }
      if(layer.queryWidget != undefined) {

        if (layer.queryWidget.maxAllowableOffset !== undefined) {
          maxAllowableOffset = layer.queryWidget.maxAllowableOffset;
        }
      }
      break;
    }
  }

  if (queryUrl === undefined){
    handleQueryError("Unable to find the URL to query this layer");
    return null;
  }

  // Ensure that any hard-coded where clause is honoured here
  var where;
  var query;
  if (layer.layerDefs !== undefined){
    for (var key in layer.layerDefs){
      var layerDefQuery = layer.layerDefs[key];
      if (where === undefined){
        where = "(" + layerDefQuery + ")";
      } else {
        where += " and (" + layerDefQuery + ")";
      }
    }
  } else if (layer.where !== undefined){
    where = layer.where;
  }

  // the QueryWidget may have its own outFields, otherwise use the layer's outFields, otherwise use all fields
  var outFields = [];
  if (layer.queryWidget.outFields !== undefined) {
    outFields = layer.queryWidget.outFields;
  } else if (layer.outFields !== undefined) {
    outFields = layer.outFields;
  }

  // ArcGIS and GeoServer queries use very different syntax, to treat them differently from this point
  if (layer.type === 'agsDynamicLayer' || layer.type === 'agsFeatureLayer') {

    // Run a query using this layer's URL and this field name, with the entered query text
    var queryData = {
      "f": "json",
      "returnGeometry": true,
      "maxAllowableOffset": maxAllowableOffset,
      "useCors": false
    }

    if (outFields.length > 0) {
      queryData['outFields'] = outFields[0].name;
      for (var qIdx = 0; qIdx < outFields.length; qIdx ++){
        queryData['outFields'] += "," + outFields[qIdx].name;
      }
    }

    // Add or use any query parameters entered by the user
    if (fieldType === 'numeric'){
      query = fieldName + operator + queryText;
    } else {

      if(queryText === "*" || queryText === "") {
        if (where === undefined) {
          query = "1=1";
        }
      } else if (operator === "starts with"){
        query = 'upper(' + fieldName + ") like '" + queryText + "%'";
      } else if (operator === "ends with"){
        query = 'upper(' + fieldName + ") like '%" + queryText + "'";
      } else if (operator === "contains"){
        query = 'upper(' + fieldName + ") like '%" + queryText + "%'";
      } else {
        query = 'upper(' + fieldName + ') ' + operator + "'" + queryText + "'";
      }
    }

    if (where === undefined){
      where = "(" + query + ")";
    } else if (query !== undefined) {
      where += " and (" + query + ")";
    }
    queryData["where"] = where;
    //TODO: add other field types, eg date, etc

    if($("#chkQueryWithinMapExtent").is(':checked')) {
      queryData.inSr = 4326;
      var bounds = bootleaf.map.getBounds();
      var geometry = {"xmin": bounds._southWest.lng,"ymin": bounds._southWest.lat,"xmax": bounds._northEast.lng,"ymax": bounds._northEast.lat,"spatialReference":{"wkid":4326}}
      queryData.geometry = JSON.stringify(geometry);
      queryData.geometryType="esriGeometryEnvelope";
      queryData.spatialRelationship="SPATIAL_REL_OVERLAPS"
    } else if($("#chkQueryWithinPolygon").is(':checked')) {
      // Ensure there is a valid polygon
      if (bootleaf.queryPolygon.toGeoJSON().features.length > 0){
        queryData.inSr = 4326;
        var geometry = {
          "rings": bootleaf.queryPolygon.toGeoJSON().features[0].geometry.coordinates,
          "spatialReference": {"wkid":4326}
        }
        queryData.geometry = JSON.stringify(geometry);
        queryData.geometryType="esriGeometryPolygon";
        queryData.spatialRelationship="SPATIAL_REL_OVERLAPS";
      }
    }

    $.ajax({
      dataType: "jsonp",
      type: 'POST',
      data: queryData,
      url: queryUrl,
      beforeSend: function (jqXHR, settings) {
        jqXHR.layerConfig = layer;
      },
      success: function(data, textStatus, jqXHR) {
        try {
          handleQueryResults(data, jqXHR.layerConfig, outFields);
        } catch(err) {
          handleQueryError("There was a problem running the query");
        }
      },
      error: function(jqXHR, textStatus, error) {
        handleQueryError("There was a problem running the query")

      }
    });

  } else if (layer.type === 'wmsTiledLayer' || layer.type === 'WFS') {
    var queryData = {
      service: "WFS",
      version: "1.0.0",
      request: "GetFeature",
      outputFormat: 'application/json',
      maxFeatures: 1000,
      sortBy: fieldName
    }
    //TODO - make maxFeatures a parameter from the config file

    if (outFields.length > 0){
      var geomField = layer.geomField || "geom";
      queryData['propertyName'] = geomField;
      for (var oIdx=0; oIdx < outFields.length; oIdx ++){
        queryData['propertyName'] += "," + outFields[oIdx].name;
      }
    }

    var query;
    if (fieldType === 'numeric'){
      query = fieldName + operator + queryText;
    } else {
      if(queryText === "*" || queryText === ""){
        query = "1=1";
      } else if (operator === "starts with"){
        query = "strToUpperCase(" + fieldName + ") like '" + queryText + "%'";
      } else if (operator === "ends with"){
        query = 'strToUpperCase(' + fieldName + ") like '%" + queryText + "'";
      } else if (operator === "contains"){
        query = 'strToUpperCase(' + fieldName + ") like '%" + queryText + "%'";
      } else {
        query = 'strToUpperCase(' + fieldName + ') ' + operator + "'" + queryText + "'";
      }
    }
    //TODO: add other field types, eg date, etc

    if (where === undefined) {
      where = query;
    } else {
      where += " and " + query;
    }
    queryData["CQL_FILTER"] = where;

    // Search within the map extent or a polygon
    if($("#chkQueryWithinMapExtent").is(':checked')) {
      var bounds = bootleaf.map.getBounds();
      queryData.CQL_FILTER += "and BBOX(" + geomField + "," + bounds._southWest.lng + "," + bounds._southWest.lat + "," +  bounds._northEast.lng + "," + bounds._northEast.lat + ",'EPSG:" + bootleaf.mapWkid + "')"
    } else if($("#chkQueryWithinPolygon").is(':checked')) {
      var vertices = bootleaf.queryPolygon.toGeoJSON().features[0].geometry.coordinates[0];
      var polygon;

      // Reproject the polygon into the source layer's SRS if necessary (code provided by https://github.com/SchroeC)
      if (layer.EPSG === undefined || layer.EPSG === bootleaf.mapWkid) {
        polygon = vertices[0][0] + " " + vertices[0][1]
        for (var vIdx = 1; vIdx < vertices.length; vIdx ++){
          polygon += "," + vertices[vIdx][0] + " " + vertices[vIdx][1]
        }
      } else {
        try{
          var newCoords = proj4('EPSG:' + layer.EPSG).forward(vertices[0]);
          polygon = newCoords[0] + " " + newCoords[1];
          for (var vIdx = 1; vIdx < vertices.length; vIdx ++){
            newCoords = proj4('EPSG:' + layer.EPSG).forward(vertices[vIdx]);
            polygon += "," + newCoords[0] + " " + newCoords[1];
          }
        } catch(err) {
          console.log("Please ensure that ", layer.id, "'s coordinate system is added to config.projections");
        }
      }

      queryData.CQL_FILTER += " and INTERSECTS(" + geomField + ", POLYGON((" + polygon + ")))";
    }

    if (layer.type === 'wmsTiledLayer'){
      queryData.typeName = layer.layers;
    } else if (layer.type === 'WFS') {
      queryData.typeName = layer.typeName;
    }

    $.ajax({
      url: queryUrl,
      data: queryData,
      dataType: 'json',
      type: 'GET',
      beforeSend: function (jqXHR, settings) {
        jqXHR.layerConfig = layer;
      },
      success: function(data, jqXHR, response) {
        try {
          handleQueryResults(data, response.layerConfig, outFields);
        } catch(err) {
          handleQueryError("There was a problem running the query");
        }
      },
      error: function() {
        handleQueryError("There was a problem running the query")

      }
    });

  }

}

function handleQueryResults(data, layerConfig, outFields){
  // This function formats the results of an ArcGIS/WFS query into a table
  // Slightly different syntax is used depending on the query source

  if (data.features.length ===0 ){
    handleQueryError("No features found");
    return;
  }

  var fields = data.fields;
  var features = data.features;

  // Reset the query results
  bootleaf.queryResults = {}
  if (data.geometryType !== undefined) {
    bootleaf.queryResults["geometryType"] = data.geometryType;
  }

  // Figure out the spatial reference of the returned object
  if (data.spatialReference !== undefined && data.spatialReference.wkid !== undefined){
    bootleaf.queryResults["wkid"] = data.spatialReference.wkid;
  } else if (data.crs !== undefined && data.crs.properties !== undefined && data.crs.properties.name !== undefined) {
    var crs = data.crs.properties.name;
    bootleaf.queryResults["wkid"] = parseInt(crs.substr(crs.lastIndexOf(":") + 1));
  }

  // Add the column names to the output table
  var thead = "<thead><tr>"
  thead += $.map(outFields, function( field, i ) {
    var name = field.alias || field.name;
    return "<th>" + name + "</th>";
  });
  thead = thead.replace(/>,</g,"><");
  thead += "</tr></thead>";
  $("#tblQueryResults").append(thead);

  // Add the data
  var tbody = "<tbody>";
  var features = data.features;
  for (var fIdx = 0; fIdx < features.length; fIdx++){
    var feature = features[fIdx];

    tbody += "<tr class='feature-row' data-idx=" + fIdx + ">";
    for (var aIdx = 0; aIdx < outFields.length; aIdx++){
      var field = outFields[aIdx];
      var val;
      if (feature.attributes !== undefined){
        val = feature.attributes[field.name];
      } else if (feature.properties !== undefined) {
        val = feature.properties[field.name];
      }

      // Apply any required field formatting
      val = formatValue(val, field);

      tbody += "<td data-idx=" + fIdx + ">" + val + "</td>";

      // Replace the field name with its alias if specified, or remove the field if hidden
      try{
        if (field.hidden !== undefined && field.hidden === true){
          if (feature.attributes !== undefined){
            if (feature.attributes[field.name] !== undefined){
              delete feature.attributes[field.name];
            }
          } else if (feature.properties !== undefined) {
            if (feature.properties[field.name] !== undefined){
              delete feature.properties[field.name];
            }
          }
        } else {
          if (field.alias !== undefined){
            if (feature.attributes !== undefined){
              feature.attributes[field.alias] = val;
              if (feature.attributes[field.name] !== undefined){
                delete feature.attributes[field.name];
              }
            } else if (feature.properties !== undefined) {
              feature.properties[field.alias] = val;
              if (feature.properties[field.name] !== undefined){
                delete feature.properties[field.name];
              }
            }
          }
        }
      } catch(err){
        console.log("Error replacing the field name with its alias");
      }
    }

    // Store the feature in the results array, so we can show it when the table is clicked on
    bootleaf.queryResults[fIdx] = feature;
    tbody += "</tr>";
  }

  tbody += "</tbody>";

  $("#tblQueryResults").append(tbody);
  $("#ajaxLoading").hide();

  // Enable datatables
  try{
    var dtConfig = {
      "dom": '<"top"if<"clear">>rt<"bottom"p<"clear">>',
      "bFilter" : false,
      "bLengthChange": false,
      "searching": true,
      "language": {
        "paginate": {
          "previous": "<",
          "next": ">"
        }
      },
      "columnDefs": [],
      "fnDrawCallback":function(){
        if ( $('.dataTables_paginate .paginate_button').length && $('.dataTables_paginate .paginate_button').length > 3) {
          $(".dataTables_paginate").show();
        } else {
          $(".dataTables_paginate").hide();
        }
      }
    }

    // Hide columns if specified
    for (var fldIdx = 0; fldIdx < outFields.length; fldIdx++){
      var fld = outFields[fldIdx];
      var hidden = fld.hidden || false;
      if (hidden){
        dtConfig.columnDefs.push({"targets": [fldIdx], "visible": !hidden});
      }
    }

    $.fn.DataTable.ext.pager.numbers_length = 7;
    var table = $('#tblQueryResults').DataTable(dtConfig);
  } catch (err){
    console.log("There was a problem enabling DataTables for the Query Widget results", err);
  }

  // Display the Download to CSV button
  try{
    new $.fn.dataTable.Buttons( table, {
      buttons: [
          {
              extend: 'csvHtml5',
              text: 'Download results as CSV',
              className: "btn-outline-dark"
          }]
      });
    table.buttons( 0, null ).containers().appendTo( $('#exportButtons') );
  } catch(err){
    console.log("There was a problem enabling Data Tables for the Query Widget buttons", err)
  }
}

function handleQueryError(errMessage){
  $.growl.warning({ title: "Query Widget", message: errMessage});
  $("#ajaxLoading").hide();
  $("#queryResults").html('<p class="info">' + errMessage + '</p>');
}

function resetQueryOutputTable(){
  $("#queryResults").html('<span id="ajaxLoading"></span><table id="tblQueryResults" class="table table-condensed table-hover"></table><div id="exportButtons"></div>');
}

/**************************************************************************************************/
// IDENTIFY TOOL START
/**************************************************************************************************/

function configureIdentifyTool(){

  resetSidebar("Identify results");
  $("#sidebar").show("slow");
  switchOffTools();
  bootleaf.activeTool = "identify";

  if (bootleaf.identifyLayers.length === 0){
    $("#sidebarContents").html("<p><span class='info'>There are no identifiable layers currently visible on the map</span></p>");
    disableIdentify()
  } else {
    $("#sidebarContents").html("<p><span class='info'>Click on the map to identify visible layers</span></p>");
    enableIdentify();
  }
}

function enableIdentify(){
  // Called when the Identify tool should be made active
  if (bootleaf.activeTool === 'identify'){
    $("#liIdentify").removeClass("disabled");
    bootleaf.map.on('click', runIdentifies);
    setMapCursor('crosshair');
  }
}

function disableIdentify(){
  // Called when the Identify tool should be disabled
  $("#liIdentify").addClass("disabled");
  bootleaf.map.off('click', runIdentifies);
  setMapCursor('auto');
}

function runIdentifies(evt) {
  // Clear the results from any previous Identifies
  bootleaf.identifyResponse = {};
  bootleaf.identifyCounter = {};
  bootleaf.identifyLayerHeadings = [];
  if (bootleaf.identifyLayers.length ===0) {
    $("#sidebarContents").html("<p><span class='info'>There are no identifiable layers currently visible on the map</span></p>");
    $("#liIdentify").addClass("disabled");
    $("#ajaxLoading").hide();
    return;
  }
  $("#sidebarContents").html('<span id="ajaxLoading"></span>');
  $("#ajaxLoading").show();
  // There is an option not to show the Identify marker
  var showIdentifyMarker = true;
  if (config.showIdentifyMarker !== undefined) {
    showIdentifyMarker = config.showIdentifyMarker;
  }
  if (showIdentifyMarker) {
    showMarker(evt);
  }

  var geometry = evt.latlng.lng + "," + evt.latlng.lat;
  var bounds = bootleaf.map.getBounds();
  var mapExtent = bounds._southWest.lng + "," + bounds._southWest.lat + "," + bounds._northEast.lng + "," + bounds._northEast.lat;

  // Run an identify on each layer in the bootleaf.identifyLayers array
  for (var idx =0; idx < bootleaf.identifyLayers.length; idx++){
    var idLayer = bootleaf.identifyLayers[idx];
    if (idLayer.layerConfig.type === "agsDynamicLayer") {
      var urlBase = idLayer.layerConfig.url + "identify";
      var layers = idLayer.layerConfig.layers || [];

      var data = {
        "srs": bootleaf.mapWkid || 4326,
        "tolerance": bootleaf.clickTolerance || 5,
        "maxAllowableOffset": idLayer.layerConfig.identify.maxAllowableOffset || 0.1,
        "returnGeometry": true,
        "imageDisplay": bootleaf.map.getSize().x + "," + bootleaf.map.getSize().y + "," + 96,
        "mapExtent": mapExtent,
        "geometry": geometry,
        "geometryType": "esriGeometryPoint",
        "f": "json",
        "layers": "all"
      }

      try {
        if (idLayer.layerConfig.where !== undefined) {
          data['layerDefs'] = "{" + idLayer.layerConfig.layers[0] + ":" + idLayer.layerConfig.where + "}";
        }
      } catch (err){
        console.log("There was a problem applying the Where clause to the Identify task");
      }

      $.when(
        $.ajax({
          dataType: "jsonp",
          type: 'POST',
          url: urlBase,
          data: data,
          beforeSend: function (jqXHR, settings) {
            jqXHR.layerConfig = idLayer.layerConfig;
          }
        })).then(
        function( data, textStatus, jqXHR ) {
          $("#ajaxLoading").hide();
          if(data.error !== undefined){
            $.growl.error({ message: "There was an error with the Identify function:"});
            $.growl.error({ message: data.error.message});
          } else{
            $.each(data.results, function( index, result ) {
              var layerId = jqXHR.layerConfig.id;
              var layerConfig = jqXHR.layerConfig;
              var identify = layerConfig.identify;
              var layerName = identify.layerName || layerConfig.name || layerConfig.id;
              var value = result.value;

              if (bootleaf.identifyResponse[layerId] === undefined){
                bootleaf.identifyResponse[layerId] = {
                  "config": layerConfig
                };
              }
              if (bootleaf.identifyResponse[layerId][value] === undefined && result.layerName === layerName) {
                if (layerConfig.identify.maxFeatures !== undefined){
                  if (bootleaf.identifyCounter[layerName] === undefined) {
                    bootleaf.identifyCounter[layerName] = 1;
                  } else {
                    bootleaf.identifyCounter[layerName] += 1;
                  }
                  if (bootleaf.identifyCounter[layerName] <= layerConfig.identify.maxFeatures) {
                    displayIdentifyResult(layerId, layerName, layerConfig, result);
                  }
                } else {
                  displayIdentifyResult(layerId, layerName, layerConfig, result);
                }
              }
            });
          }
        }, function(error) {
          $("#sidebarContents").html("<p><span class='info'>There was an error with the Identify tool</span></p>");
        });

    } else if (idLayer.layerConfig.type === 'wmsTiledLayer') {

      var x = evt.latlng.lng;
      var y = evt.latlng.lat;
      var width = bootleaf.map.getBounds().getEast() - bootleaf.map.getBounds().getWest();
      var factor = width / 50; // expand the BBOX by 1% of the current map width
      var bbox = (x-factor) + "," + (y-factor) + "," + (x+factor) + "," + (y+factor);
      var width = 101;
      var height = 101;
      var x = 50;
      var y = 50;
      var buffer = idLayer.layerConfig.identify.buffer || 5;

      var data = {
        service: 'WMS',
        version: '1.1.1',
        request: 'GetFeatureInfo',
        layers: idLayer.layerConfig.layers,
        query_layers: idLayer.layerConfig.layers,
        buffer: buffer,
        feature_count: 1000,
        info_format: 'application/json',
        SRS: 'EPSG:4326',
        width: width,
        height: height,
        x: x,
        y: y,
        bbox: bbox
      }

      if (idLayer.layerConfig.CQL_FILTER !== undefined){
        data['CQL_FILTER'] = idLayer.layerConfig.CQL_FILTER;
      }

      if (idLayer.layerConfig.styles !== undefined){
        data['styles'] = idLayer.layerConfig.styles;
      }
      var url = idLayer.layerConfig.url;

      $.when(
        $.ajax({
          dataType: "json",
          type: 'POST',
          url: url,
          data: data,
          beforeSend: function (jqXHR, settings) {
            jqXHR.layerConfig = idLayer.layerConfig;
          }
        })).then(
        function( data, textStatus, jqXHR ) {
          $("#ajaxLoading").hide();
          // Obtain the layer ID and retrieve its layerConfig object
          if (data.features.length > 0){
            var layerId = data.features[0].id.substring(0,data.features[0].id.indexOf("."));
            var layerConfig = jqXHR.layerConfig;
            for (var i=0; i < bootleaf.identifyLayers.length; i++){
              var identifyLayer = bootleaf.identifyLayers[i];
              if (layerConfig.identify.layerName === layerId){

                var layerName = layerConfig.name || layerConfig.id || "unknown layer";

                if (bootleaf.identifyResponse[layerId] === undefined){
                  bootleaf.identifyResponse[layerId] = {
                    "config": layerConfig
                  };
                }

                for (var j = 0; j<data.features.length; j++){
                  var result = data.features[j];
                  result.layerId = layerId;
                  result.layerName = layerName;
                  result.attributes = result.properties;
                  if (data.crs !== undefined && data.crs.properties !== undefined && data.crs.properties.name !== undefined){
                    result.crs = data.crs.properties.name;
                  }
                  var value = JSON.stringify(result.attributes);
                  if (bootleaf.identifyResponse[layerId][value] === undefined) {
                    if (layerConfig.identify.maxFeatures !== undefined){
                      if (bootleaf.identifyCounter[layerName] === undefined) {
                        bootleaf.identifyCounter[layerName] = 1;
                      } else {
                        bootleaf.identifyCounter[layerName] += 1;
                      }
                      if (bootleaf.identifyCounter[layerName] <= layerConfig.identify.maxFeatures) {
                        bootleaf.identifyResponse[layerId][value] = value;
                        displayIdentifyResult(layerId, layerName, layerConfig, result);
                      }
                    } else if (bootleaf.identifyResponse[layerId][value] !== value){
                      bootleaf.identifyResponse[layerId][value] = value;
                      displayIdentifyResult(layerId, layerName, layerConfig, result);
                    }
                  } else if (bootleaf.identifyResponse[layerId][JSON.stringify(result.attributes)] === undefined) {
                      bootleaf.identifyResponse[layerId][value] = value;
                      displayIdentifyResult(layerId, layerName, layerConfig, result);
                  }

                }

              }
            }
          }
        }, function(error) {
          $("#sidebarContents").html("<p><span class='info'>There was an error with the Identify tool</span></p>");
        });

    }
  }
}

function displayIdentifyResult(layerId, layerName, layerConfig, result){
  $("#ajaxLoading").hide();

  if(bootleaf.identifyLayerHeadings.indexOf(layerName) < 0){
    // Add a section to the sidebar for this layer's results
    var sidebarContents = $("#sidebarContents").html();
    sidebarContents += "<div class='identifyResults'><strong>" + layerConfig.name + "</strong><ul class='identifyLayer list-unstyled list-group' id='" + layerConfig.id + "'></ul></div>";
    $("#sidebarContents").html(sidebarContents);
    bootleaf.identifyLayerHeadings.push(layerName);

  }

  // Store the relevant details for this result against the identifyResponse object
  var geometryType;
  if (result.geometryType !== undefined) {
    geometryType = result.geometryType;
  } else if (result.geometry.type !== undefined) {
    geometryType = result.geometry.type;
  }
  var outFeature = {
    "geometry": result.geometry,
    "attributes": [],
    "geometryType": geometryType
  }

  if (result.crs !== undefined) {
    outFeature.geometry.crs = result.crs;
  }

  bootleaf.wantedFields = [];
  if(layerConfig.identify.primaryField) {
    bootleaf.wantedFields.push(layerConfig.identify.primaryField);
  }
  var outFields = [];
  if (layerConfig.identify.outFields !== undefined) {
    outFields = layerConfig.identify.outFields;
  } else if(layerConfig.outFields !== undefined) {
    outFields = layerConfig.outFields;
  }
  if (outFields.length > 0) {
    Object.keys(outFields).map(function(i, field){
      bootleaf.wantedFields.push(outFields[field]['name']);
    });
  }
  for(var field in result.attributes){
    if (bootleaf.wantedFields.indexOf(field) > -1) {
      outFeature.attributes[field] = result.attributes[field];
    }
  }

  // bootleaf.identifyResponse[layerId][value] = outFeature;

  // Store this feature's geometry against a guid, so we can retrieve it later. Tie this to the list item
  var guid = generateGuid();
  bootleaf.identifyResponse[guid] = outFeature;
  var output = $("#" + layerConfig.id).html();

  output += "<li class='list-group-item identifyResult' data-guid=" + guid + ">"
  if(layerConfig.identify.primaryField !== undefined){
    output += "<span class='primaryField'>" + result.attributes[layerConfig.identify.primaryField] + "</span><br>";
  }
  if (outFields.length > 0){
    for(var fldIdx = 0; fldIdx < outFields.length; fldIdx++){
      var fld = outFields[fldIdx];
      var fldName = fld.name || "";
      var fldAlias = fld.alias || fldName;
      var val = result.attributes[fld.name];

      // Apply formatting to the field as appropriate and add to the table
      val = formatValue(val, fld);
      output += "<span class='fieldName'>" + fldAlias + ": </span><span class='fieldValue'>" + val + "</span><br>";
    }
  }
  output += "</li>";
  $("#" + layerConfig.id).html(output);

  // When clicking on the Identify result, use the guid to determine the
  $(".identifyResult").on("click", function(evt) {
    $(".identifyResult").removeClass("active");
    $(this).addClass("active");
    var feature = bootleaf.identifyResponse[this.dataset['guid']];
    showHighlight(feature, true);
  });
  $(".identifyResult").on("mouseover", function(evt) {
    var feature = bootleaf.identifyResponse[this.dataset['guid']];
    showHighlight(feature, false);
  });
  $(".identifyResult").on("mouseout", function() {
    bootleaf.map.removeLayer(bootleaf.highlightLayer);
  });
}

function handleWMSIdentifyResult(data){
  $("#ajaxLoading").hide();
  // Obtain the layer ID and retrieve its layerConfig object
  if (data.features.length > 0){
    var layerId = data.features[0].id.substring(0,data.features[0].id.indexOf("."));
    for (var i=0; i < bootleaf.identifyLayers.length; i++){
      var identifyLayer = bootleaf.identifyLayers[i];
      var layerConfig = identifyLayer.layerConfig
      if (layerConfig.identify.layerName === layerId){

        var layerName = layerConfig.name || layerConfig.id || "unknown layer";

        for (var j = 0; j<data.features.length; j++){
          var result = data.features[j];
          result.layerId = layerId;
          result.layerName = layerName;
          result.attributes = result.properties;

          displayIdentifyResult(layerId, layerName, layerConfig, result);

        }

      }
    }
  }
}


/**************************************************************************************************/
// COORDINATES TOOL START
/**************************************************************************************************/

function configureCoordinatesTool(){
  bootleaf.activeTool = "coordinates";
  resetSidebar("Map coordinates","<p><span class='info'>Click on the map to view the coordinates</span></p>");
  $("#sidebar").show("slow");
  switchOffTools();
  bootleaf.map.on('click', showMarker);
}

function showMarker(evt){
  // Show a marker on the map, and report its coordinates. This function can be called
  // by the Identify and Report Coordinates tools

  bootleaf.map.removeLayer(bootleaf.highlightLayer);
  var coordinates = evt.latlng;
  var lat = Math.round(coordinates.lat * 1000) / 1000;
  var lng = Math.round(coordinates.lng * 1000) / 1000;

  var queryJSON = {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [coordinates.lng, coordinates.lat]
      }
  };
  var message = "<p>Latitude: " + lat + "<br> Longitude: " + lng + "</p>";
  bootleaf.highlightLayer = L.geoJSON(queryJSON, {
    pointToLayer: function (feature, latlng) {
      return L.circleMarker(latlng);
    },
    style: bootleaf.highlightStyle
  }).bindPopup(message).addTo(bootleaf.map).openPopup();
}


function generateGuid(){
  var guid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
    return v.toString(16);
  });
  return guid;
}

function showHighlight(feature, zoom){

  // Add the highlighted feature to the map. This may be called by the Idenfify or Query functions
  bootleaf.map.removeLayer(bootleaf.highlightLayer);
  var geometry = feature.geometry;
  var geometryType;
  if (feature.geometryType) {
    geometryType = feature.geometryType;
  } else if (geometry.type) {
    geometryType = geometry.type;
  }
  var wkid = bootleaf.mapWkid;
  if (feature.geometry.spatialReference && feature.geometry.spatialReference.wkid){
    wkid = feature.geometry.spatialReference.wkid;
  } else if (feature.geometry.crs !== undefined) {
    wkid = feature.geometry.crs.substr(feature.geometry.crs.length - 4);
  }
  var jsonGeometry;

  if (geometryType === 'esriGeometryPoint' || geometryType === 'point') {
    jsonGeometry = {
      "type": "Point",
      "coordinates": [geometry.x, geometry.y]
    };
  } else if (geometryType === 'Point') {
    jsonGeometry = {
      "type": "Point",
      "coordinates": [geometry.coordinates[0], geometry.coordinates[1]]
    };
  } else if (geometryType === 'esriGeometryPolygon') {
    jsonGeometry = {
      "type": "Polygon",
      "coordinates": geometry.rings
    };
  } else if (geometryType === "Polygon") {
    jsonGeometry = {
      "type": "Polygon",
      "coordinates": geometry.coordinates
    };
  } else if (geometryType === "MultiPolygon") {
   jsonGeometry = {
      "type": "MultiPolygon",
      "coordinates": geometry.coordinates
    };
  } else if (geometryType === 'esriGeometryPolyline') {
    jsonGeometry = {
      "type": "LineString",
      "coordinates": [geometry.paths[0]]
    };
  } else if (geometryType === 'MultiLineString') {
    jsonGeometry = {
      "type": "LineString",
      "coordinates": [geometry.coordinates[0]]
    };
  }

  // Create a geojson layer and reproject it if necessary
  var queryJSON = {
      "type": "Feature",
      "crs": {
          "type": "name",
          "properties": {
              "name": "urn:ogc:def:crs:EPSG::" + wkid
          }
      },
      "geometry": jsonGeometry
  };
  bootleaf.highlightLayer = L.Proj.geoJson(queryJSON, {
    pointToLayer: function (feature, latlng) {
      return L.circleMarker(latlng);
    }
  });
  bootleaf.highlightLayer.setStyle(bootleaf.highlightStyle);
  bootleaf.highlightLayer.addTo(bootleaf.map);

  if (zoom){
    // Generate a popup from the attribute information
    var popup = "<table class='table table-condensed'>";
    for (field in feature.attributes){
      var value = feature.attributes[field];
      popup += "<tr><td>" + field + "</td><td>" + value + "</td><tr>";
    }
    popup += "</table>";
    bootleaf.highlightLayer.bindPopup(popup);
    bootleaf.highlightLayer.openPopup(bootleaf.highlightLayer.popup);
    bootleaf.map.fitBounds(bootleaf.highlightLayer.getBounds().pad(1.1));
  }
}

function getURLParameter(name) {
  return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search) || [null, ''])[1].replace(/\+/g, '%20')) || null;
}

function configureShare(){
  // Generate a URL for this map encompassing the extent and list of layers
  var hostname = window.location.protocol + "//" + window.location.hostname;
  var port = window.location.port;
  var pathname = window.location.pathname;
  var center = bootleaf.map.getCenter();
  bootleaf.shareObj = {};
  bootleaf.shareObj['lat'] = center.lat;
  bootleaf.shareObj['lng'] = center.lng;
  bootleaf.shareObj['zoom'] = bootleaf.map.getZoom();
  bootleaf.shareObj['basemap'] = bootleaf.currentBasemap;
  var layers = bootleaf.visibleLayers.toString();
  if (layers === '') {layers = "none";}
  bootleaf.shareObj['layers'] = layers;

  // Preserve any other parameters
  var existingParams = getAllUrlParams();
  $.map( existingParams, function( value, key ) {
    bootleaf.shareObj[key] = value;
  });

  // Build the URL string from the share object. The params must start with ?, with other params
  // denoted using &
  var params = ""
  for (key in bootleaf.shareObj){
    var separator;
    params.indexOf("?") < 0 ? separator = "?" : separator = "&";
    params += separator + key + "=" + bootleaf.shareObj[key];
  }

  return [hostname, port, pathname, params];
}

function getAllUrlParams() {

  // get the current query string, so we can preserve parameters other than the ones we create
  var queryString =window.location.search.slice(1);
  var obj = {};
  if (queryString) {
    queryString = queryString.split('#')[0];
    var arr = queryString.split('&');
    for (var i=0; i<arr.length; i++) {
      var a = arr[i].split('=');
      var paramNum = undefined;
      var paramName = a[0].replace(/\[\d*\]/, function(v) {
        paramNum = v.slice(1,-1);
        return '';
      });
      var paramValue = typeof(a[1])==='undefined' ? true : a[1];
      // paramName = paramName.toLowerCase();

      // Ignore the parameters that we create manually
      if($.inArray(paramName, ['lat', 'lng', 'zoom', 'basemap', 'layers']) < 0) {
        paramValue = paramValue.toLowerCase();
        if (obj[paramName]) {
          if (typeof obj[paramName] === 'string') {obj[paramName] = [obj[paramName]];}
          if (typeof paramNum === 'undefined') {obj[paramName].push(paramValue);}
          else {obj[paramName][paramNum] = paramValue;}
        }
          else {obj[paramName] = paramValue;}
        }
      }
  }

  return obj;
}

function updateScaleThresholds() {
  // This function checks whether layers should be disabled if they're outside their scale range
  for (var i=0; i<bootleaf.layers.length; i++) {
    var layer = bootleaf.layers[i];
    var layerConfig = layer.layerConfig;
    var zoomLevel = bootleaf.map.getZoom();
    var minZoom = layerConfig.minZoom || 1;
    var maxZoom = layerConfig.maxZoom || 19;
    if (zoomLevel < minZoom || zoomLevel > maxZoom) {
      layer.outsideScaleThreshold = true;
      if (layer.tocState === 'on') {
        bootleaf.map.removeLayer(layer);
        layer.tocState = 'grey';
      }
    } else {
      layer.outsideScaleThreshold = false;
      if (layer.tocState === 'grey' && $.inArray(layer.layerConfig.id, bootleaf.visibleLayers) > -1) {
        bootleaf.map.addLayer(layer);
        layer.tocState = 'on';
      }
    }
  }
  setTimeout(function () {
    updateTOCcheckboxes();
  }, 50);
}

function updateTOCcheckboxes(){
  for (var i=0; i<bootleaf.layers.length; i++) {
    var layer = bootleaf.layers[i];
    var layerConfig = layer.layerConfig;
    if (layer.outsideScaleThreshold) {
      $("#toc_" + layerConfig.id).attr('disabled', 'disabled');
      $(".toc_" + layerConfig.id).addClass("outsideScaleThreshold");
    } else {
      $("#toc_" + layerConfig.id).removeAttr("disabled");
      $(".toc_" + layerConfig.id).removeClass("outsideScaleThreshold");
    }
  }
}

// Handle WFS layers
function fetchWFS(){

  // Clear any WFS label layers (geoJSON label layers aren't reset on pan/zoom)
  for (var i=0; i<bootleaf.labelLayers.length; i++){
    var labelLayer = bootleaf.labelLayers[i];
    if (labelLayer.layerConfig.type === 'WFS'){
      labelLayer.clearLayers();
    }
  }

  for (var j=0; j < bootleaf.wfsLayers.length; j++){
    var layer = bootleaf.wfsLayers[j];
    var layerConfig = layer.layerConfig;
    if (layer.lastRun) {
      var elapsed = Date.now() - layer.lastRun;
      if (elapsed < 500) {
        console.log("sequential WFS requests are appearing too soon - rate limiting");
      } else if (layer.tocState === "on"){
        wfsAjax(layer);
      }
    } else if (layer.tocState === "on"){
      wfsAjax(layer);
    }
  }
}

function getJson(json){
  // This function isn't used, but is required for the WFS AJAX function's JSONP callback
}

function wfsAjax(layer){

  // Only run the query if the map bounds have changed since the last request
  if (layer.lastBounds && layer.lastBounds === bootleaf.map.getBounds().toBBoxString()) {return;}

  var layerConfig = layer.layerConfig;
  var bbox = bootleaf.map.getBounds().toBBoxString();
  var geomField = layerConfig.geomField || "geom";

  // Add the where clause, if specified
  var whereClause = "BBOX(" + geomField + "," + bbox + ")";
  if (layerConfig.where !== undefined) {
    whereClause += " and " + layerConfig.where;
  }

  // If multiple JSONP requests are to be made simultaneously, it may be necessary to specify
  // a unique callback for each layer. In this case, ensure that the unique callback functions
  // are defined in the custom.js file (even if the functions are empty).
  var callback = "getJson";
  if (layerConfig.callback !== undefined) {callback = layerConfig.callback;}
  var data = {
    "service":"WFS",
    "version":"1.0.0",
    "request":"GetFeature",
    "typeName": layerConfig.typeName,
    "format_options":"callback:" + callback,
    "CQL_FILTER": whereClause
  }

  data["outputFormat"] = layer.layerConfig.outputFormat || "text/javascript";

  // Restrict the fields which are returned by the query. Ensure that the geometry field is included
  if (layerConfig.fields && layerConfig.fields.length && layerConfig.fields.length > 0) {
    if ($.inArray(geomField, layerConfig.fields) < 0) {
      layerConfig.fields.push(geomField);
    }
    data.propertyName = layerConfig.fields.join(",").replace(/, /g,",");
  }

  layer.lastRun = Date.now();
  layer.lastBounds = bootleaf.map.getBounds().toBBoxString();

  $.ajax({
    jsonp: false,
    jsonpCallback: layerConfig.callback || 'getJson',
    // jsonpCallback: 'getJson',
    type: 'GET',
    url: layerConfig.url,
    data: data,
    async: false,
    dataType: 'jsonp',
    beforeSend: function (jqXHR, settings) {
      // add required properties so they can be accessed in the success function
      jqXHR.layerConfig = layerConfig;
    },
    success: function(data, jqXHR, response) {
      // Find the layer which corresponds to this request
      var layerId = response.layerConfig.id;
      for (var x=0; x < bootleaf.wfsLayers.length; x++){
        var layer = bootleaf.wfsLayers[x];
        if (layer.layerConfig.id === layerId){
          if (layer.layerConfig.cluster){
            var tempLayer = new L.geoJson(null,layer.layerConfig);
            $(data.features).each(function(key, data) {
              tempLayer.addData(data);
            });
            layer.clearLayers();
            layer.addLayer(tempLayer);

          } else {
            layer.clearLayers();
            layer.addData(data);
            layer.lastRun = null;
          }

          // Display labels if configured for this layer
          if (layer.layerConfig.label !== undefined){
            createLabels(layer.layerConfig, data)
          }
        }

      }
    },
    error: function(err){
      if (err.layerConfig) {
        console.log("WFS error with ", err.layerConfig.id);
        $.growl.warning({ message: "There was a problem fetching the features for " + err.layerConfig.id});
      }
    }
  });

}

function createLabels(layerConfig, data){
  // Create labels for WFS and GeoJSON layers
  try{

    // De-duplicate any coincident labels
    // TODO: take into account the current map scale and perform some rudimentary collision avoidance
    var newData = {
      features: [],
      latLngs: []
    };
    for(var j=0; j<data.features.length; j++){
      var feature = data.features[j];
      var lat = feature.geometry.coordinates[0];
      var lng = feature.geometry.coordinates[1];
      var latLng = lat + "|" + lng;
      if (newData.latLngs.indexOf(latLng) === -1) {
        newData.latLngs.push(latLng);
        // Manually force the creation of the label attribute, specified in the layerConfig.layer.name variable
        feature.properties["_xxxLabelText"] = feature.properties[layerConfig.label.name];
        newData.features.push(feature);
      }
    }

    for (var i=0; i<bootleaf.labelLayers.length; i++){
      var labelLayer = bootleaf.labelLayers[i];
      if (bootleaf.labelLayers[i].layerConfig.id === layerConfig.id + "_labels"){
          labelLayer.addData(newData);
          labelLayer.lastRun = Date.now();
          labelLayer.lastBounds = bootleaf.map.getBounds().toBBoxString();
      }
    }
  } catch(err){
    console.log("There was a problem generating labels for ", layerConfig.id);
  }

}

// Used to move a Leaflet control from one parent to another (eg put the Draw control on the Query Widget panel)
function setParent(el, newParent){
  newParent.appendChild(el);
}

// Add thousands separators
function addThousandsSeparator(x) {
  try {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  } catch(err){
    return (x)
  }
}

function round(value, decimals) {
  try{
    var num = parseFloat(value).toFixed(0);
    if (decimals > 0) {
      num = Number(Math.round(value +'e'+decimals)+'e-'+decimals);
    }
    return num;
  } catch(err){
    return value;
  }
}

function allLayersOn(){
  $.map( bootleaf.layers, function( layer, i ) {
    var addLayer = true;
    var layerConfig = layer.layerConfig;
    var currentZoom = bootleaf.map.getZoom();
    if (layerConfig.minZoom && currentZoom < layerConfig.minZoom) {
      addLayer = false;
    }
    if (layerConfig.maxZoomLevel && currentZoom > layerCOnfig.maxZoom) {
      addLayer = false;
    }
    if (addLayer){
      layer.addTo(bootleaf.map);
    } else {
      layer.outsideScaleThreshold = true;
    }
  });
  updateTOCcheckboxes();
}

function allLayersOff(){
  bootleaf.map.eachLayer(function(layer){
    if (layer.layerConfig !== undefined) {
      bootleaf.map.removeLayer(layer);
    }
  });
  updateTOCcheckboxes();
}

function buildLabelLayer(layerConfig) {
  var labelLayer = L.geoJSON(null, {
    pointToLayer: function(feature,latlng){
      // _xxxLabelText is calculated once the values are returned from the server. This is a deliberately
      // obscure variable name in the hope that it doesn't already exist on the layer ;)
      label = String(feature.properties._xxxLabelText)
      return new L.CircleMarker(latlng, {
        radius: 0,
        opacity: 0
      }).bindTooltip(label, {permanent: true, opacity: 0.7}).openTooltip();
    }
  });
  labelLayer.layerConfig = Object.assign({}, layerConfig);
  labelLayer.layerConfig.labelLayer = true;
  if (layerConfig.label.minZoom !== undefined){
    labelLayer.layerConfig.minZoom = layerConfig.label.minZoom;
  }
  if (layerConfig.label.maxZoom !== undefined){
    labelLayer.layerConfig.maxZoom = layerConfig.label.maxZoom;
  }
  if (labelLayer.layerConfig.name !== undefined) {
    labelLayer.layerConfig.name += " labels";
  } else {
    labelLayer.layerConfig.name = labelLayer.layerConfig.id + " labels";
  }
  labelLayer.layerConfig.id += "_labels";
  addLayer(labelLayer);
  bootleaf.labelLayers.push(labelLayer);
  bootleaf.layers.push(labelLayer);

}
