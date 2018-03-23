// This file uses express middleware as a server, path to join directory path to relative path
// bodyParser to receive parsed request data request.body object
// fs to read external data (from the data folder)
// csv parser to parse the external data 

import express from "express";
import path from "path";
import bodyParser from "body-parser";
import fs from "fs";
import csv from "csv-parser";

const router = express();

// Join directory path to public folder to set static path to this file
// Use body parser and defines data format (url encoded) for http protocol
router.use(express.static(path.join(__dirname, "../public")));
router.use(bodyParser.urlencoded({
	extended: true
}));

// Load index.hmtl at url endpoint "/" from listening port
router.get("/", (req, res) => {
	res.sendFile("index.html");
});

// Post end point matching the submit button in the frontend
router.post("/calculate", (req, res) =>{
	// Store coordinated of first vertex of polygon
	const firstVertex = req.body.polygonCoordinates[0];
	let directRadiation;
	let diffuseRadiation;
	
	// Load data from NASA dataset Annual direct radiation (kWh/(m^2*day) at given lat/lng
	// Source: https://eosweb.larc.nasa.gov/sse/global/text/direct_radiation
	fs.createReadStream("./data/direct_radiation.csv")
		.pipe(csv({separator: " ",
			headers: ["Lat", "Lon", "Ann"]}))
		.on("data", (data) => { 
			// Check if current polygon is within less than 0.5 degrees of latitude and longitude 
			// from current data chunk. If so, store the value of the annual radiation as direct radiation
			if((Math.abs(Math.abs(data.Lat)-Math.abs(firstVertex.lat)) < 0.5 && Math.abs(Math.abs(data.Lon)-Math.abs(firstVertex.lng))<0.5)){
				directRadiation = parseFloat(data.Ann);
			}
		})
		.on("end", () => {
			// Load data from NASA dataset Annual diffuse radiation (kWh/(m^2*day) at given lat/lng
			// Source: https://eosweb.larc.nasa.gov/sse/global/text/diffuse_radiation
			fs.createReadStream("./data/diffuse_radiation.csv")
				.pipe(csv({separator: " ",
					headers: ["Lat", "Lon", "Ann"]}))
				.on("data", (data) => { 
					// Check if current polygon is within less than 0.5 degrees of latitude and longitude 
					// from current data chunk. If so, store the value of the annual radiation as diffuse radiation 
					if((Math.abs(Math.abs(data.Lat)-Math.abs(firstVertex.lat)) < 0.5 && Math.abs(Math.abs(data.Lon)-Math.abs(firstVertex.lng))<0.5)){
						diffuseRadiation = parseFloat(data.Ann);
					}
				})	
				.on("end", () => {
					// Ladies and gentlemen, welcome to callback hell. Note that we could use another tool such as axios
					// To promisify and make this look better, but with only two function, I thought it wasn't necessary
					let polygonCoords = [];
					let polygonArea = 0;
					req.body.polygonCoordinates.forEach((item) => {
						if(item.area){
							polygonArea = item.area;
						} else {
							polygonCoords.push(item);
						}
					});
					// Calculate irradiance using sum of direct and diffuse radiation
					// multiply by 41.6666 to convert (kWh/(m^2*day) to W/m2
					const estimatedIrradiance = 41.6666 * (directRadiation + diffuseRadiation);
					// Assumptions: panel efficiency (18%), panel size (40*60 inches or 1.6 m^2), spacing (0.1m^2)
					const efficiency = 0.18;
					const panelSize = 1.6;
					const spacingArea= 0.1;
					const solarIrradiance = 1000; 
					// Calculate total area of solar panels
					const panelArea = Math.floor(polygonArea/panelSize)-Math.floor(polygonArea/panelSize)*spacingArea;

					// Calculate impact of tilt angle if the user did provide one
					let orientationImpact = 1;
					if(req.body.tiltangle){
						orientationImpact = Math.cos(req.body.tiltangle * Math.PI/180);
					}
					// Calculate nominal power using Std solar irradiance : 1000 W/m2
					const nominalPow = Math.floor(efficiency * panelArea * solarIrradiance * orientationImpact);
					// Calculate real power output using estimated irradiance
					const realPow = Math.floor(efficiency * panelArea * estimatedIrradiance * orientationImpact);

					// Send results to front end
					res.send({estimatedIrradiance: estimatedIrradiance, nominalPower : nominalPow, realPower : realPow });
				});
		});
});

export default router;