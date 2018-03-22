// Use "var" to hoist initMap globally 
// So it can be used as a callback after google maps API is loaded
var initMap = () => {
	let polygonCoordinates = [];
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
		$("#section").append("<p>Great! Now you can approximate your solar installation using the draw tool on the top right corner of the map</p>");
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
	drawingManager.setMap(map);

	
	google.maps.event.addListener(drawingManager, "polygoncomplete", (event) => {
		let latlngObjects = [];
		const latlngCb = event.latLngs.b[0];             
		const length = latlngCb.length;
		for( let i = 0; i < length ; i++) {
			let lat = latlngCb.b[i].lat();
			let lng = latlngCb.b[i].lng();
			let coords = { lat : lat, lng : lng };
			let latlngs = new google.maps.LatLng(lat,lng);
			polygonCoordinates.push(coords);
			latlngObjects.push(latlngs);
		}
		polygonCoordinates.push({area: google.maps.geometry.spherical.computeArea(latlngObjects)});
		// Convert array to data format supported by fetch API
		$("#section").append(`<div>
		<p>
		You can input your desired tilt angle of your panel if you wish.
		If you don't know what we're talking about, just click submit and you're good to go!
		</p><form action="/calculate" method="post">
		<p>Tilt angle (degrees):</p><br>
		<input type="text" id="tiltangle" name="tiltangle"><br>
		<input id="calculate" type="submit" value="Submit">
	  </form>
	  </div>`);
	  $("#calculate").on("click", (event) => {
			event.preventDefault();
			let tiltangle = $("#tiltangle").val();
			let azimuth = $("#azimuth").val();
			$.ajax({
				url:"/calculate",
				type: "post",
				data: {polygonCoordinates : polygonCoordinates,
					tiltangle : tiltangle,
					azimuth : azimuth} ,
				success: (response) => {
					$("#section").append(`<p> Your solar installation is rated at " + response.nominalPower/1000 
					+" kW of nominal power and  "+ response.realPower/1000 +" kW of real power output</p><a href="/">New Solar Search</a>`);
				}
			});
		});
	
	
	});
	
};
