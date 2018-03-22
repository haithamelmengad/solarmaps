'use strict';

var initMap = function initMap() {
  // Initialize google maps map object centered on Somerville, MA
  var map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: 42.3876, lng: -71.0995 },
    zoom: 12
  });

  // Create a google maps searchbox object with autocomplete support
  // Restrict search suggestions to US adresses
  var input = document.getElementById('pac-input');
  var autocomplete = new google.maps.places.Autocomplete(input, { componentRestrictions: { country: "us" } });
  map.controls[google.maps.ControlPosition.TOP_CENTER].push(input);

  google.maps.event.addListener(autocomplete, 'place_changed', function (event) {
    var searchedAddress = autocomplete.getPlace();
    map.setZoom({ zoom: 20 });
    map.setCenter(searchedAddress.geometry.location);
  });

  var drawingManager = new google.maps.drawing.DrawingManager({
    drawingControl: true,
    drawingControlOptions: {
      position: google.maps.ControlPosition.TOP_RIGHT,
      drawingModes: ['polygon']
    },
    polygonOptions: {
      fillColor: '#fff000',
      fillOpacity: 0.7,
      strokeWeight: 1.5,
      clickable: false,
      editable: true,
      zIndex: 1
    }
  });
  google.maps.event.addListener(drawingManager, 'polygoncomplete', function (event) {
    var polygonCoordinates = [];
    var latlngCb = event.latLngs.b[0];
    var length = latlngCb.length;
    for (var i = 0; i < length; i++) {
      var coords = { lat: latlngCb.b[i].lat(), lng: latlngCb.b[i].lng() };
      polygonCoordinates.push(coords);
    }
    console.log(polygonCoordinates);
    // fetch()
  });
  drawingManager.setMap(map);
};
