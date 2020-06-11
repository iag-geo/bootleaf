(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
var L = (typeof window !== "undefined" ? window['L'] : typeof global !== "undefined" ? global['L'] : null),
	Util = require('../util');

module.exports = {
	"class": L.Class.extend({
		options: {
			geocodingQueryParams: {},
			reverseQueryParams: {},
			wildcard: false
		},

		initialize: function(options) {
			L.Util.setOptions(this, options);
		},

		geocode: function(query, cb, context) {
			if(query.length === 0) {
				cb.call(context, []);
				return;
			}
			var params = {
				payload: {},
				option: {source: "GNAF"}
			};

			// Determine the best Harmony search to use: https://uatcra04:30083/HRAWeb/hra/demo
			query = query.toLowerCase().trim();
			var tokens = query.replace(",", "").split(" ");
			var wordCount = tokens.length;
			var matches = tokens[0].match(/\d+/g);
			var numberFirst = (matches != null);

			var streetTypes = ['ROAD','RD','STREET','STR','ST','AVENUE','AV','AVE','BOULEVARD','BOULEVARDE','CAUSEWAY','CIRCLE','CIRCUIT','CIRCUS','CLOSE','CONCOURSE','CORSO',
				'HWY','HIGHWAY', 'PDE', 'PARADE','CRESCENT', 'CRES', 'CRESC','COURSE','COURT','CROSSING','CUL-DE-SAC','DRIVE','ESPLANADE','EXPRESSWAY','FAIRWAY','FIRETRACK','MOTORWAY',
				'FIRETRAIL','FOOTWAY','FORD','FORESHORE','FORK','FREEWAY','FRONTAGE','GATE','GATEWAY','GLADE','GLEN','GRANGE','GREEN','GROVE','GULLY','HAVEN','HEATH','HEIGHTS',
				'HIGHROAD','HIGHWAY','INLET','INTERCHANGE','ISLAND','JUNCTION','KEY','KEYS','KNOLL','LANDING','LANE','LANEWAY','LOOKOUT','LOOP','MALL','MANOR','MEAD','MEANDER','MEWS',
				'NOOK','OUTLET','OUTLOOK','OVAL','PARK','PARKWAY','PASS','PASSAGE','PATH','PATHWAY','PIAZZA','PLACE','PLAZA','POCKET','POINT','PORT','PRECINCT',
				'PROMENADE','PURSUIT','QUADRANT','QUAY','QUAYS','RAMBLE','RAMP','RANGE','REACH','RESERVE','RETREAT','RETURN','RIDE','RIDGE','RISE','RISING','RIVER','ROADWAY',
				'ROUTE','ROW','RUN','STEPS','STRAIGHT','STRAIT','STRIP','SUBWAY','TARN','TERRACE','THROUGHWAY','TOLLWAY','TRACK','TRAIL','TRUNKWAY','VIADUCT','VIEW','VIEWS',
				'VILLA','VISTA','WALK','WALKWAY','WATERS','WATERWAY','WAY','WHARF','WOODS','WYND','WOOD','CUT','DASH','DISTRIBUTOR','EXTENSION','FIREBREAK','FIRELINE',
				'HILLS','LADDER','LEAD','LEADER','MILE','TRAMWAY','TRAVERSE','TUNNEL','VILLAS','BROADWALK','COLONNADE','COMMONS','FRONT','HARBOUR','MEW','NORTH','NULL',
				'PALMS','PENINSULA','QUAD','REEF','RIGHT OF WAY','RING','ROADS','SOUTH','STRAND','VERGE','VILLAGE','VUE','WADE','YARD','MART','BUSWAY','EAST','WEST','PART',
				'MAZE','BVD','BVDE','CSWY','CIR','CCT','CRCS','CL','CON','CSO','CRSE','CT','CR','CRSG','CSAC','DR','ESP','EXP','FAWY','FTRK','FITR','FTWY','FORD','FSHR',
				'FORK','FWY','FRTG','GTE','GWY','GLDE','GLEN','GRA','GRN','GR','GLY','HVN','HTH','HTS','HIRD','INLT','INTG','ID','JNC','KEY','KEYS','KNOL','LDG','LANE',
				'LNWY','LKT','LOOP','MALL','MANR','MEAD','MNDR','MEWS','MTWY','NOOK','OTLT','OTLK','OVAL','PARK','PWY','PASS','PSGE','PATH','PWAY','PIAZ','PL','PLZA',
				'PKT','PNT','PORT','PREC','PROM','PRST','QDRT','QY','QYS','RMBL','RAMP','RNGE','RCH','RES','RTT','RTN','RIDE','RDGE','RISE','RSNG','RVR','RDWY','RTE',
				'ROW','RUN','STPS','STRT','STAI','STRP','SBWY','TARN','TCE','THRU','TLWY','TRK','TRL','TKWY','VIAD','VIEW','VWS','VLLA','VSTA','WALK','WKWY',
				'WTRS','WTWY','WAY','WHRF','WDS','WYND','WD','CUT','DASH','DSTR','EXTN','FBRK','FLNE','HILLS','LADR','LEAD','LEDR','MILE','TMWY','TVSE','TUNL','VLLS',
				'BRDWLK','CLDE','CMMNS','FRNT','HRBR','MEW','NTH','NULL','PLMS','PSLA','QUAD','REEF','ROFW','RING','RDS','STH','STRA','VERGE','VLGE','VUE','WADE','YARD',
				'MART','BSWY','EAST','WEST','PART','MZ'];
			var incStreet = false;
			var endsWithStreet = false;
			for (var i = 0; i < streetTypes.length; i++){
				var streetType = streetTypes[i].toLowerCase();
				if($.inArray(streetType, tokens) > -1){
					incStreet = true;
					if ($.inArray(streetType, tokens) === tokens.length - 1) {
						endsWithStreet = true;
					}
					break;
				}
			}

			var serviceUrl;
			if(numberFirst){
				// If the address starts with a number, assume it's a full street address
				serviceUrl = '/HRAWeb/hra/rest/au/address/similar-addresses';
				params.payload['fullAddress'] = query;
			} else if (incStreet && endsWithStreet){
				// if it has no number, but includes Street, Avenue, etc assume it's a street lookup
				serviceUrl = '/HRAWeb/hra/rest/au/address/similar-streets';
				params.payload["streetName"] = query.trim();
			} else if(wordCount < 3) {
				// If there's only 1-2 words, assume it's a city or suburb
				serviceUrl = '/HRAWeb/hra/rest/au/address/similar-localities';
				params.payload["localityName"] = query;
			} else {
				serviceUrl = '/HRAWeb/hra/rest/au/address/similar-addresses';
				params.payload['fullAddress'] = query;
			}

			if (this._key && this._key.length) {
				params.key = this._key;
			}

			params = L.Util.extend(params, this.options.geocodingQueryParams);

			var request = $.ajax({
        url: serviceUrl,
        contentType: 'application/json',
        data: JSON.stringify(params),
  		  dataType: "json",
  		  method: "POST"
      });

      request.success(function(data) {
      	if (data.status == 'ERROR') {
      		if(data.messages && data.messages.length) {
      			$.growl.error({ message: "Error with the Harmony Rapid Address geocoder: " + data.messages[0]});
      		}
      	}
        var results = [],
						loc,
						latLng,
						latLngBounds;
				if (data.payload && data.payload.length) {
					for (var i = 0; i <= data.payload.length - 1; i++) {
						loc = data.payload[i];

						// The Harmony response is quite patchy, and may not include lat/long
						if(loc.latitude && loc.longitude){
							// The response only includes the center point, so it's necessary to buffer the point to generate a bbox
							latLng = L.latLng([loc.latitude, loc.longitude]);
							latLngBounds = L.latLngBounds(L.latLng([parseFloat(loc.latitude) + 0.01, parseFloat(loc.longitude) + 0.01]),
								L.latLng([parseFloat(loc.latitude) - 0.01, parseFloat(loc.longitude) - 0.01]));

							// Format the label nicely, avoiding unecessary junk like lot and unit numbers
							var label;
							if(loc.houseNumber2){
								label = [loc.houseNumber1, "-", loc.houseNumber2, loc.streetName, loc.streetType, loc.addressLine2].join(" ");
							} else {
								label = [loc.houseNumber1, loc.streetName, loc.streetType, loc.addressLine2].join(" ");
							}

							// Manually remove any duplicates
							var exists = false;
							for (var j=0; j < results.length; j++){
								var result = results[j];
								if (result && result.name === label) {
									exists = true;
									break;
								}
							}
							if (!exists){
								results[i] = {
									name: label,
									bbox: latLngBounds,
									center: latLng
									// properties: loc.address_components
								};
							}
						}
					}
				}

				cb.call(context, results);

      });

      request.fail(function(err) {
        var port = config.controls.leafletGeocoder.port || 8080;
      	var message = "<p>There was an error fetching the address.</p>";
	    	message += "<p>Please ensure you are accessing this map via port " + port + " - click ";
	    	var shareObj = configureShare();
	    	var hostname = shareObj[0]
	    	var path = shareObj[2];
	    	var params = shareObj[3]
	    	var shareURL = hostname + ":" + port + path + params;
	    	message += "<a href='" + shareURL + "'>here</a> to reload.</p>";
        $.growl.error({ message: message, fixed: true});
      });
		},

		suggest: function(query,cb,context) {
			return this.geocode(query, cb, context);
		},

		reverse: function(location, scale, cb, context) {
			Util.jsonp(this.options.serviceUrl + 'reverse/', L.extend({
				y: location.lat,
				x: location.lng
			},
			this.options.reverseQueryParams), function(data) {
				var result = [],latLng;
				if (data && data.adgangspunkt) {
					latLng = L.latLng(data.adgangspunkt.koordinater[1], data.adgangspunkt.koordinater[0]);
					result.push({
						name: data.vejstykke.navn + " " + data.husnr + ", " + data.postnummer.nr + " " + data.postnummer.navn,
						center: latLng,
						bounds: L.latLngBounds(latLng, latLng)
					});
				}
				cb.call(context, result);
			}, this, 'callback');
		}
	}),

	factory: function(options) {
		return new L.Control.Geocoder.HARMONY(options);
	}
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../util":3}],2:[function(require,module,exports){
(function (global){
var L = (typeof window !== "undefined" ? window['L'] : typeof global !== "undefined" ? global['L'] : null),
 Harmony = require('./geocoders/harmony');
// var L = {Control : {require('leaflet-control-geocoder');

module.exports = Harmony["class"];

L.Util.extend(L.Control.Geocoder, {
	HARMONY: module.exports,
	harmony: Harmony.factory
});

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./geocoders/harmony":1}],3:[function(require,module,exports){
(function (global){
var L = (typeof window !== "undefined" ? window['L'] : typeof global !== "undefined" ? global['L'] : null),
	lastCallbackId = 0,
	htmlEscape = (function() {
		// Adapted from handlebars.js
		// https://github.com/wycats/handlebars.js/
		var badChars = /[&<>"'`]/g;
		var possible = /[&<>"'`]/;
		var escape = {
		  '&': '&amp;',
		  '<': '&lt;',
		  '>': '&gt;',
		  '"': '&quot;',
		  '\'': '&#x27;',
		  '`': '&#x60;'
		};

		function escapeChar(chr) {
		  return escape[chr];
		}

		return function(string) {
			if (string == null) {
				return '';
			} else if (!string) {
				return string + '';
			}

			// Force a string conversion as this will be done by the append regardless and
			// the regex test will do this transparently behind the scenes, causing issues if
			// an object's to string has escaped characters in it.
			string = '' + string;

			if (!possible.test(string)) {
				return string;
			}
			return string.replace(badChars, escapeChar);
		};
	})();

module.exports = {
	jsonp: function(url, params, callback, context, jsonpParam) {
		var callbackId = '_l_geocoder_' + (lastCallbackId++);
		params[jsonpParam || 'callback'] = callbackId;
		window[callbackId] = L.Util.bind(callback, context);
		var script = document.createElement('script');
		script.type = 'text/javascript';
		script.src = url + L.Util.getParamString(params);
		script.id = callbackId;
		document.getElementsByTagName('head')[0].appendChild(script);
	},

	getJSON: function(url, params, callback) {
		var xmlHttp = new XMLHttpRequest();
		xmlHttp.onreadystatechange = function () {
			if (xmlHttp.readyState !== 4){
				return;
			}
			if (xmlHttp.status !== 200 && xmlHttp.status !== 304){
				callback('');
				return;
			}
			callback(JSON.parse(xmlHttp.response));
		};
		xmlHttp.open('GET', url + L.Util.getParamString(params), true);
		xmlHttp.setRequestHeader('Accept', 'application/json');
		xmlHttp.send(null);
	},

	template: function (str, data) {
		return str.replace(/\{ *([\w_]+) *\}/g, function (str, key) {
			var value = data[key];
			if (value === undefined) {
				value = '';
			} else if (typeof value === 'function') {
				value = value(data);
			}
			return htmlEscape(value);
		});
	},

	htmlEscape: htmlEscape
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}]},{},[2]);
