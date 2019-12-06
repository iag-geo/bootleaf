// Set listeners for buttons, tools, etc.


$(window).resize(function() {
  sizeLayerControl();
});

$(document).on("click", ".feature-row", function(e) {
  $(document).off("mouseout", ".feature-row", clearHighlight);
  // sidebarClick(parseInt($(this).attr("id"), 10));
  blah = 0;
});

if ( !("ontouchstart" in window) ) {
  $(document).on("click", ".feature-row", function(e) {
    bootleaf.map.removeLayer(bootleaf.highlightLayer);

    // Retrieve the feature's geometry from the queryResults dict, then send it to the 
    // showHighlight function. Tweak the parameters to match the identifyResults format
    try{
      var feature = bootleaf.queryResults[parseInt(e.target.dataset['idx'])];
      if (feature.attributes === undefined){
        // Standardise between ArcGIS Server and GeoServer attribute syntax
        feature.attributes = {}
        for (var key in feature.properties) {
          if (key !== 'bbox'){
            feature.attributes[key] = feature.properties[key]
          }
        }
      }
      feature.geometryType = bootleaf.queryResults.geometryType;
      feature.geometry['spatialReference']= {"wkid": bootleaf.queryResults.wkid};
      showHighlight(feature, true);
      
    } catch(err) {
      if(err.message !== undefined){
        console.log(err.message);
      } else {
        console.log("There was a problem: ", err);
      }
    }
  });
}

$(document).on("mouseout", ".feature-row", function(e){
  bootleaf.map.removeLayer(bootleaf.highlightLayer);
});

$(document).on("mouseover", ".feature-row", function(e){
  bootleaf.map.removeLayer(bootleaf.highlightLayer);

  // Retrieve the feature's geometry from the queryResults dict, then send it to the 
  // showHighlight function. Tweak the parameters to match the identifyResults format
  try{
    var feature = bootleaf.queryResults[parseInt(e.target.dataset['idx'])];
    feature.geometryType = bootleaf.queryResults.geometryType;
    feature.geometry['spatialReference']= {"wkid": bootleaf.queryResults.wkid};
    showHighlight(feature, false);
    
  } catch(err) {
    if(err.message !== undefined){
      console.log(err.message);
    } else {
      console.log("There was a problem: ", err);
    }
  }

});

$("#about-btn").click(function() {
  $("#aboutModal").modal("show");
  $(".navbar-collapse.in").collapse("hide");
  return false;
});

$("#full-extent-btn").click(function() {
  bootleaf.map.setView(config.start.center, config.start.zoom);
  $(".navbar-collapse.in").collapse("hide");
  return false;
});

$("#legend-btn").click(function() {
  $("#legendModal").modal("show");
  $(".navbar-collapse.in").collapse("hide");
  return false;
});

$("#identify-btn").click(function() {
  if ($(this).parent().hasClass('disabled')) { return null;}
  configureIdentifyTool();
});

$("#coordinates-btn").click(function() {
  configureCoordinatesTool();
});

$("#share-btn").click(function() {
  // This function returns the hostname and parameters, which can be used to generate a unique URL for the current map
  shareObj = configureShare();
  var shareURL;
  var hostname = shareObj[0];
  var port = shareObj[1];
  var path = shareObj[2];
  var params = shareObj[3];
  if (port.length > 0) {
    shareURL = hostname + ":" + port + path + params;
  } else {
    shareURL = hostname + path + params;
  }   
  $("#shareURL").html("<a target='_blank' href=" + shareURL+ ">Link to this map</a>");
  $("#shareModal").modal("show");
  $(".navbar-collapse.in").collapse("hide");
});

$("#list-btn").click(function() {
  animateSidebar();
  return false;
});

$("#nav-btn").click(function() {
  $(".navbar-collapse").collapse("toggle");
  return false;
});

$("#sidebar-toggle-btn").click(function() {
  animateSidebar();
  return false;
});

$("#sidebar-hide-btn").click(function() {
  switchOffTools();
  $(".mapTools").removeClass("active");
  animateSidebar();
  return false;
});

function animateSidebar() {
  switchOffTools();
  $("#sidebar").animate({
    width: "toggle"
  }, 350, function() {
    bootleaf.map.invalidateSize();
  });
}

function sizeLayerControl() {
  $(".leaflet-control-layers").css("max-height", $("#map").height() - 50);
}

function clearHighlight() {
  //highlight.clearLayers();
}

function sidebarClick(id) {
  var layer = markerClusters.getLayer(id);
  bootleaf.map.setView([layer.getLatLng().lat, layer.getLatLng().lng], 17);
  layer.fire("click");
  /* Hide sidebar and go to the map on small screens */
  if (document.body.clientWidth <= 767) {
    $("#sidebar").hide();
    switchOffTools();
    bootleaf.map.invalidateSize();
  }
}

function resetSidebar(title,contents){
  var sidebarTitle = title || "sidebar"
  var sidebarContents = contents || "<p><span class='info'></span></p>";
  $("#sidebarTitle").html(sidebarTitle);
  $("#sidebarContents").html(sidebarContents);
}

$(".mapTools").click(function(){
  // Enable/Disable the tools as appropriate
  if ($(this).hasClass("disabled")) {
    return false;
  };
  if ($(this).hasClass("active")) {
    setMapCursor('auto');
    switchOffTools();
    $(".mapTools").removeClass("active");
    bootleaf.activeTool = null;
    resetSidebar();
    $("#sidebar").hide("slow");
  } else {
    $(".mapTools").removeClass("active");
    $(this).addClass("active");
    if (this.dataset["tool"] !== undefined){
      if (this.dataset["tool"] === 'identify') {
        configureIdentifyTool();
      } else if (this.dataset["tool"] === 'coordinates') {
        configureCoordinatesTool();
      } else if (this.dataset["tool"] === 'queryWidget') {
        configureQueryWidget();
      }
    } else {
      $("#sidebar").hide("slow");
    }
  }
  // return false; //uncomment this line to keep the menu open when a tool is chosen
});