import express from "express";
import path from "path";
import bodyParser from "body-parser";
import fs from "fs";
import csv from "csv-parser";

const router = express();

router.use(express.static(path.join(__dirname, "../public")));
router.use(bodyParser.urlencoded({
	extended: true
}));

// Code to calculate area based on X,Y coordinates in a plane
// convert lat/lngs from degrees to distances
// const calculateArea = (arrayCoords) => {
// 	const earthRadius = ;

// 	let area = 0;
// 	let lastVertex = arrayCoords.length-1;

// 	for (let i = 0; i < arrayCoords.length; i++) {
// 		area = (arrayCoords[i].lat+arrayCoords[lastVertex].lat) + (arrayCoords[i].lng-arrayCoords[lastVertex].lng);
// 		lastVertex = i;
// 	}
// 	return area/2;
// };

// (-124.848974, 24.396308) - (-66.885444, 49.384358)

router.get("/", (req, res) => {
	res.sendFile("index.html");
});

router.post("/calculate", (req, res) =>{
	const firstVertex = req.body.polygonCoordinates[0];
	let directRadiation;
	let diffuseRadiation;
	fs.createReadStream("./data/direct_radiation.csv")
		.pipe(csv({separator: " ",
			headers: ["Lat", "Lon", "Ann"]}))
		.on("data", (data) => { 
			if((Math.abs(Math.abs(data.Lat)-Math.abs(firstVertex.lat)) < 0.5 && Math.abs(Math.abs(data.Lon)-Math.abs(firstVertex.lng))<0.5)){
				directRadiation = parseFloat(data.Ann);
			}
		})
		.on("end", () => {
			fs.createReadStream("./data/diffuse_radiation.csv")
				.pipe(csv({separator: " ",
					headers: ["Lat", "Lon", "Ann"]}))
				.on("data", (data) => { 
					if((Math.abs(Math.abs(data.Lat)-Math.abs(firstVertex.lat)) < 0.5 && Math.abs(Math.abs(data.Lon)-Math.abs(firstVertex.lng))<0.5)){
						diffuseRadiation = parseFloat(data.Ann);
					}
				})	
				.on("end", () => {
					let polygonCoords = [];
					let polygonArea = 0;
					req.body.polygonCoordinates.forEach((item) => {
						if(item.area){
							polygonArea = item.area;
						} else {
							polygonCoords.push(item);
						}
					});
					const estimatedIrradiance = 41.6666 * (directRadiation + diffuseRadiation);
					const efficiency = 0.18;
					const panelSize = 1.6;
					const spacingArea= 2;
					const panelArea = Math.floor(polygonArea/panelSize)-spacingArea;
					const solarIrradiance = 1000; 
					let orientationImpact = 1;
					if(req.body.tiltangle){
						orientationImpact = Math.cos(req.body.tiltangle * Math.PI/180);
					}

					const nominalPow = Math.floor(efficiency * panelArea * solarIrradiance * orientationImpact);
					const realPow = Math.floor(efficiency * panelArea * estimatedIrradiance * orientationImpact);
					res.send({nominalPower : nominalPow, realPower : realPow });
				});
		});
});

export default router;