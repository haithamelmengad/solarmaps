// Use "var" to hoist initMap globally 
// So it can be used as a callback after google maps API is loaded
var initMap = () => {
	// Initialize google maps map object centered on Somerville, MA
	let map = new google.maps.Map(document.getElementById("map"), {
		center: {lat: 42.3876, lng: -71.0995},
		zoom: 12
	});
      
	// Create a google maps searchbox object with autocomplete support
	// Restrict search suggestions to US adresses
	let input = document.getElementById("pac-input");
	let autocomplete = new google.maps.places.Autocomplete(input, { componentRestrictions: {country: "us"} });
	map.controls[google.maps.ControlPosition.TOP_CENTER].push(input);
      
      
	google.maps.event.addListener(autocomplete, "place_changed", (event) => {
		let searchedAddress = autocomplete.getPlace();
		map.setZoom(20);
		map.setCenter(searchedAddress.geometry.location);
	});

	// Create drawing GU
	let drawingManager = new google.maps.drawing.DrawingManager({
		drawingControl: true,
		drawingControlOptions: {
			position: google.maps.ControlPosition.TOP_RIGHT,
			drawingModes: [ "polygon"]
		},
		polygonOptions: {
			fillColor: "#fff000",
			fillOpacity: 0.7,
			strokeWeight: 1.5,
			clickable: false,
			editable: true,
			zIndex: 1
		}
	});
	google.maps.event.addListener(drawingManager, "polygoncomplete", (event) => {
		let polygonCoordinates = [];
		const latlngCb = event.latLngs.b[0];             
		const length = latlngCb.length;
		for( let i = 0; i < length ; i++) {
			let coords = { lat : latlngCb.b[i].lat(), lng : latlngCb.b[i].lng() };
			polygonCoordinates.push(coords);
		}
		// fetch()
	});
	drawingManager.setMap(map);
};
