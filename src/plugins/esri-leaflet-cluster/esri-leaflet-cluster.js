/* esri-leaflet-cluster - v2.0.0 - Thu Aug 18 2016 17:12:43 GMT-0700 (PDT)
 * Copyright (c) 2016 Environmental Systems Research Institute, Inc.
 * Apache-2.0 */
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('leaflet'), require('esri-leaflet')) :
	typeof define === 'function' && define.amd ? define(['exports', 'leaflet', 'esri-leaflet'], factory) :
	(factory((global.L = global.L || {}, global.L.esri = global.L.esri || {}, global.L.esri.Cluster = global.L.esri.Cluster || {}),global.L,global.L.esri));
}(this, function (exports,L,esriLeaflet) { 'use strict';

	L = 'default' in L ? L['default'] : L;

	var version = "2.0.0";

	var FeatureLayer = esriLeaflet.FeatureManager.extend({

	  statics: {
	    EVENTS: 'click dblclick mouseover mouseout mousemove contextmenu popupopen popupclose',
	    CLUSTEREVENTS: 'clusterclick clusterdblclick clustermouseover clustermouseout clustermousemove clustercontextmenu'
	  },

	  /**
	   * Constructor
	   */

	  initialize: function (options) {
	    esriLeaflet.FeatureManager.prototype.initialize.call(this, options);

	    options = L.setOptions(this, options);

	    this._layers = {};
	    this._leafletIds = {};

	    this.cluster = L.markerClusterGroup(options);
	    this._key = 'c' + (Math.random() * 1e9).toString(36).replace('.', '_');

	    this.cluster.addEventParent(this);
	  },

	  /**
	   * Layer Interface
	   */

	  onAdd: function (map) {
	    esriLeaflet.FeatureManager.prototype.onAdd.call(this, map);
	    this._map.addLayer(this.cluster);
	  },

	  onRemove: function (map) {
	    esriLeaflet.FeatureManager.prototype.onRemove.call(this, map);
	    this._map.removeLayer(this.cluster);
	  },

	  /**
	   * Feature Management Methods
	   */

	  createLayers: function (features) {
	    var markers = [];

	    for (var i = features.length - 1; i >= 0; i--) {
	      var geojson = features[i];
	      var layer = this._layers[geojson.id];

	      if (!layer) {
	        var newLayer = L.GeoJSON.geometryToLayer(geojson, this.options);
	        newLayer.feature = L.GeoJSON.asFeature(geojson);
	        newLayer.defaultOptions = newLayer.options;
	        newLayer._leaflet_id = this._key + '_' + geojson.id;

	        this.resetStyle(newLayer.feature.id);

	        // cache the layer
	        this._layers[newLayer.feature.id] = newLayer;

	        this._leafletIds[newLayer._leaflet_id] = geojson.id;

	        if (this.options.onEachFeature) {
	          this.options.onEachFeature(newLayer.feature, newLayer);
	        }

	        this.fire('createfeature', {
	          feature: newLayer.feature
	        });

	        // add the layer if it is within the time bounds or our layer is not time enabled
	        if (!this.options.timeField || (this.options.timeField && this._featureWithinTimeRange(geojson))) {
	          markers.push(newLayer);
	        }
	      }
	    }

	    if (markers.length) {
	      this.cluster.addLayers(markers);
	    }
	  },

	  addLayers: function (ids) {
	    var layersToAdd = [];
	    for (var i = ids.length - 1; i >= 0; i--) {
	      var layer = this._layers[ids[i]];
	      this.fire('addfeature', {
	        feature: layer.feature
	      });
	      layersToAdd.push(layer);
	    }
	    this.cluster.addLayers(layersToAdd);
	  },

	  removeLayers: function (ids, permanent) {
	    var layersToRemove = [];
	    for (var i = ids.length - 1; i >= 0; i--) {
	      var id = ids[i];
	      var layer = this._layers[id];
	      this.fire('removefeature', {
	        feature: layer.feature,
	        permanent: permanent
	      });
	      layersToRemove.push(layer);
	      if (this._layers[id] && permanent) {
	        delete this._layers[id];
	      }
	    }
	    this.cluster.removeLayers(layersToRemove);
	  },

	  /**
	   * Styling Methods
	   */

	  resetStyle: function (id) {
	    var layer = this._layers[id];

	    if (layer) {
	      layer.options = layer.defaultOptions;
	      this.setFeatureStyle(layer.feature.id, this.options.style);
	    }

	    return this;
	  },

	  setStyle: function (style) {
	    this.eachFeature(function (layer) {
	      this.setFeatureStyle(layer.feature.id, style);
	    }, this);
	    return this;
	  },

	  setFeatureStyle: function (id, style) {
	    var layer = this._layers[id];

	    if (typeof style === 'function') {
	      style = style(layer.feature);
	    }
	    if (layer.setStyle) {
	      layer.setStyle(style);
	    }
	  },

	  /**
	   * Utility Methods
	   */

	  eachFeature: function (fn, context) {
	    for (var i in this._layers) {
	      fn.call(context, this._layers[i]);
	    }
	    return this;
	  },

	  getFeature: function (id) {
	    return this._layers[id];
	  }
	});

	function featureLayer (options) {
	  return new FeatureLayer(options);
	}

	exports.FeatureLayer = FeatureLayer;
	exports.featureLayer = featureLayer;
	exports['default'] = featureLayer;
	exports.VERSION = version;

}));