const db = require('../config/db');

const multer = require('multer');
const fs = require('fs');
require('dotenv').config(); // Load environment variables from .env file
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { GoogleAIFileManager } = require('@google/generative-ai/server');

const apiKey = process.env.geminikey;
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: 'text/plain',
};

// Render AI app page with form
exports.getAIApp = (req, res) => {
  const user = req.session.user;
  res.render('aiapp', { user, content: '' });
};

exports.processVideo = [
  // Use multer middleware to handle the file upload
  async (req, res, next) => {
    // Make it async to handle promises
    try {
      if (!req.file) {
        return res.status(400).send('No video file uploaded.');
      }

      const tempPath = req.file.path;
      const targetPath = `uploads/${req.file.originalname}`;
      fs.renameSync(tempPath, targetPath);

      // 1. Interact with your AI model
      const analysisResult = await analyzeVideo(targetPath); // Replace with your AI logic

      // 2. Process the result (e.g., clean up any markdown formatting)
      const rawText = analysisResult; // Assuming analysisResult contains the raw text response
      const jsonString = rawText.replace(/```json\s*|\`/g, ''); // Remove backticks and "```json"
      let jsonResult;

      try {
        jsonResult = JSON.parse(jsonString);
        console.log('Parsed JSON:', jsonResult);
        res.json(jsonResult); // Send JSON response
      } catch (parseError) {
        console.error('Error parsing JSON:', parseError, 'Raw Text:', rawText); // Log the raw text for debugging
        res.status(500).send('Error processing video analysis.');
      }
    } catch (error) {
      console.error('Error processing video:', error);
      res.status(500).send('Error processing video');
    }
  },
];

// Placeholder for your actual AI video analysis function (replace this)
async function analyzeVideo(videoPath) {
  try {
    const fileManager = new GoogleAIFileManager(apiKey);

    const uploadResult = await fileManager.uploadFile(videoPath, {
      // Corrected
      mimeType: 'video/mp4',
      displayName: 'sample',
    });
    const file = uploadResult.file;
    // const file = await GoogleAIFileManager.uploadFile(apiKey, videoPath, {
    //   // Corrected
    //   mimeType: 'video/mp4',
    //   displayName: videoPath,
    // });
    console.log('file', file);
    console.log(`Uploaded file ${file.displayName} as: ${file.name}`);

    // Poll for file processing completion
    console.log('Waiting for file processing...');
    let processingFile = await fileManager.getFile(file.name);
    while (processingFile.state === 'PROCESSING') {
      process.stdout.write('.');
      await new Promise((resolve) => setTimeout(resolve, 10000)); // Check every 10 seconds
      processingFile = await fileManager.getFile(file.name);
    }
    if (processingFile.state !== 'ACTIVE') {
      throw Error(
        `File ${file.name} failed to process: ${processingFile.state}`
      );
    }
    console.log('...file ready\n');

    const chatSession = model.startChat({
      generationConfig,
      history: [
        {
          role: 'user',
          parts: [{ fileData: { mimeType: file.mimeType, fileUri: file.uri } }],
        },
        {
          role: 'user',
          parts: [
            {
              text: 'detect the anamalous behavious and return result in json format where it has two parameters anamoly(yes or no) and details(complete video summary)',
            },
          ],
        },
      ],
    });

    const result = await chatSession.sendMessage(
      'Process the video and provide the analysis.'
    );

    return result.response.text();
  } catch (error) {
    console.error('Error:', error);
  }
}
exports.renderIndex = async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  res.render('index', {
    user: req.session.user,
  });
};
