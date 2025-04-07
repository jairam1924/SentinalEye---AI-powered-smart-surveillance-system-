const express = require("express");
const cors = require("cors");
const multer = require("multer");
const axios = require("axios");
const path = require("path");
const FormData = require("form-data");
const fs = require("fs");
const mysql = require("./db"); // Import database connection

const app = express();
app.use(cors());
app.use(express.json());
app.set("view engine", "ejs"); // ✅ Set EJS as the template engine
app.use(express.static(path.join(__dirname, "../public"))); // ✅ Serve static files

// ⚡ Multer setup for file uploads
const upload = multer({ dest: "uploads/" });

// ✅ API route for analyzing uploaded images
app.post("/api/analyze-face", upload.single("image"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        const imagePath = req.file.path;
        const imageStream = fs.createReadStream(imagePath);

        // Prepare FormData
        const formData = new FormData();
        formData.append("image", imageStream);

        // API request to Face Analyzer
        const response = await axios.post("https://face-analyzer1.p.rapidapi.com/analyze/full", formData, {
            headers: {
                "x-rapidapi-key": "6db88e4995mshe308610ea04d4acp1e0a8djsne73d30aaa13d",
                "x-rapidapi-host": "face-analyzer1.p.rapidapi.com",
                ...formData.getHeaders(),
            },
        });

        const faceData = response.data.data[0];
        if (faceData) {
            const { age, emotion, gender } = faceData;
            const faceImage = req.file.filename;

            // Save detected face data into the database
            const sql = "INSERT INTO My_faces (name, age, emotion, gender, status, face_image) VALUES (?, ?, ?, ?, ?, ?)";
            const values = ["Unknown", age, emotion, gender, "active", faceImage];

            mysql.query(sql, values, (err) => {
                if (err) {
                    console.error("Error inserting into DB:", err);
                }
            });
        }

        res.json(response.data); // ✅ Send JSON response
        fs.unlinkSync(imagePath);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ✅ Serve the homepage (index.ejs)
app.get("/", (req, res) => {
    res.render("index");
});

// ✅ Live capture handling
let isCameraActive = false;
let captureInterval;

app.post("/api/start-live", (req, res) => {
    if (!isCameraActive) {
        isCameraActive = true;
        captureInterval = setInterval(() => {
            console.log("Capturing face from live stream...");
            // Simulated face capture logic (to be implemented with live camera feed)
        }, 10000);
    }
    res.json({ success: true, message: "Live capture started" });
});

app.post("/api/stop-live", (req, res) => {
    if (isCameraActive) {
        clearInterval(captureInterval);
        isCameraActive = false;
        res.json({ success: true, message: "Live capture stopped" });
    } else {
        res.json({ success: false, message: "Live capture is not active" });
    }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));
