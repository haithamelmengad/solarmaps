import express from "express";
import path from "path";

const router = express();

router.use(express.static(path.join(__dirname, "../public")));

router.get("/", (req, res) => {
	res.sendFile("index.html");
});

// router.get('', (req, res) => {


// })

export default router;