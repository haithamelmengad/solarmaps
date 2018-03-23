// Use "var" to hoist initMap globally 
// So it can be used as a callback after google maps API is loaded in the html file
// This code uses jQuery (script at the top of the HTML page, and google maps API - script at the end of the page)
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
      
	// Listen to event and fire a callback upon to search entries and 
	google.maps.event.addListener(autocomplete, "place_changed", (event) => {
		// Center the map on the inputted adress and zoom
		let searchedAddress = autocomplete.getPlace();
		map.setZoom(20);
		map.setCenter(searchedAddress.geometry.location);

		// Guide user by adding HTML element to the side bar and describing the next step to be taken.
		$("#section").append("<p>Great! Now you can approximate your solar installation using the drawing tool (top right).</p>");
	});

	// Create a drawing GUI using google maps' built-in Drawing Manager class
	// Definition
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
	// Setup
	drawingManager.setMap(map);

	// When the polygon is drawn execute callback
	google.maps.event.addListener(drawingManager, "polygoncomplete", (event) => {
		let latlngObjects = [];
		const latlngCb = event.latLngs.b[0];             
		const length = latlngCb.length;

		// Store longitudes and latitudes of polygon vertices in a an array of objects
		// and in another array of google maps LatLng objects (to be able to use google maps methods)
		for( let i = 0; i < length ; i++) {
			let lat = latlngCb.b[i].lat();
			let lng = latlngCb.b[i].lng();
			let coords = { lat : lat, lng : lng };
			let latlngs = new google.maps.LatLng(lat,lng);
			polygonCoordinates.push(coords);
			latlngObjects.push(latlngs);
		}
		// Compute area and store it in the array of polygon coordinates
		polygonCoordinates.push({area: google.maps.geometry.spherical.computeArea(latlngObjects)});

		// This code is not async, so the following will run after the array is populate with polygon data
		// This is an HTML component to guide the user. It provides the option of including a tilt angle for the solar assessment
		$("#section").append(`<div>
			<p>You can input your desired tilt angle of your panel if you wish.
			If you don't know what we're talking about, just click submit and you're good to go!
			</p>
			<form action="/calculate" method="post">
			<p>Tilt angle (degrees):</p><br>
			<input type="text" id="tiltangle" name="tiltangle"><br>
			<input id="calculate" type="submit" value="Submit">
			</form>
		  </div>`);
		// Add a click listener to the submit button that intiates the solar power calculation
		// by sending a post request to the backend
		$("#calculate").on("click", (event) => {
			event.preventDefault();
			let tiltangle = $("#tiltangle").val();
			// Fire the ajax request to the /calculate endpoint in the backend
			// Notice how the click listener is defined inside of the polygon complete listener
			// This is because the ajax request is async and it would thus be firing arbitraly, before the
			// polygon coordinate array is populated. I could use promises to do this differently, but with only
			// one endpoint, I thought it was not necessary
			$.ajax({
				url:"/calculate",
				type: "post",
				data: {polygonCoordinates : polygonCoordinates,
					tiltangle : tiltangle} ,
				success: (response) => {
					$("#section").append(`
					<p> The estimated solar irradiance in that area is ` + response.estimatedIrradiance +` W/m^2 </p>
					<p> Your solar installation is rated at  `+ response.nominalPower/1000+ `
					 kW of nominal power and  `+ response.realPower/1000 +` kW of real power output </p>
					 <a href="/">New Solar Search</a>`);
				}
			});
		});
	
	
	});
	
};
