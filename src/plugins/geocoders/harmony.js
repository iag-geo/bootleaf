// Harmony address search function
$("#txtAddressSearch").autocomplete({
    source: function (request, response) {
        var address = $('#txtAddressSearch').val();
        var data = {
            "option": {
                "source": "GNAF"
            },
            "payload": {
                "fullAddress": address
            }
        }
        $.ajax({
            url: config.controls.harmonyGeocoder.url,
            data: JSON.stringify(data),
            method: "POST",
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function (data) {
                // Return the full address, lat/long and GNAF attributes
                response($.map(data.payload, function (item) {
                    if (item.latitude && item.longitude) {
                        return {
                            label: item.houseNumber1 + " " + item.streetName + " " + item.streetType + ", " + item.localityName + " " + item.state,
                            lat: item.latitude,
                            lng: item.longitude,
                            gnafPID: item.gnafPID,
                            address1: item.addressLine1,
                            locality: item.localityName,
                            gnafReliability: item.gnafReliability
                        }
                    }
                }));
            },
            error: function (err) {
                console.log(err.responseText);
            }
        });
    },
    minLength: 4,
    select: function (event, ui) {
        try {
            var lng = ui.item.lng;
            var lat = ui.item.lat;
            map.graphics.clear();
            map.centerAndZoom([lng, lat], 15);

            var attr = {"label": ui.item.label, "locality": ui.item.locality, "fullAddress": ui.item.label, "gnafPID": ui.item.gnafPID, "gnafReliability": ui.item.gnafReliability};
            var infoTemplate = new InfoTemplate("${label}", "gnafPID: ${gnafPID} <br/> gnafReliability: ${gnafReliability}");
            var graphic = new Graphic(new Point(lng, lat), markerSymbol, attr, infoTemplate);
            geocodeGraphicsLayer.add(graphic);
        } catch (err) {
            console.log(err);
        }
    }
});

$("#btnClearAddressSearch").click(function () {
    // geocodeGraphicsLayer.clear();
    $('#txtAddressSearch').val('');
    $("#btnClearAddressSearch").hide();
});

$("#txtAddressSearch").on('change keyup paste', function () {
    // Enable/disable the Clear button
    if ($('#txtAddressSearch').val().length == 0) {
        $("#btnClearAddressSearch").hide();
    } else {
        $("#btnClearAddressSearch").show();
    }
});