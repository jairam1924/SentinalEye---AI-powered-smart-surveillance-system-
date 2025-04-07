const video = document.getElementById('video');
const liveButton = document.getElementById('live');
const controls = document.getElementById('controls');
const startButton = document.getElementById('start');
const stopButton = document.getElementById('stop');
const processButton = document.getElementById('process');
const retryButton = document.getElementById('retry');
const loadingGif = document.getElementById('loading-gif');
const recordingGif = document.getElementById('recording-gif');
const resultsDiv = document.getElementById('results');
const analyzeButton = document.getElementById('analyze');
const fileInput = document.querySelector('input[name="video"]');

let mediaRecorder;
let recordedBlobs;
let stream;
let recordingIndicator;

// Initial state
video.style.display = 'none';
controls.style.display = 'none';
loadingGif.style.display = 'none';

liveButton.addEventListener('click', async () => {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });
    video.srcObject = stream;
    video.style.display = 'block';
    controls.style.display = 'block';
    liveButton.style.display = 'none';
    video.play();

    const options = { mimeType: 'video/webm' };
    mediaRecorder = new MediaRecorder(stream, options);

    mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        recordedBlobs.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      processButton.style.display = 'block';
    };

    recordingIndicator = document.createElement('span');
    recordingIndicator.style.display = 'none';
    recordingIndicator.style.width = '10px';
    recordingIndicator.style.height = '10px';
    recordingIndicator.style.borderRadius = '50%';
    recordingIndicator.style.backgroundColor = 'red';
    recordingIndicator.style.position = 'absolute';
    recordingIndicator.style.top = '10px';
    recordingIndicator.style.left = '10px';
    video.parentNode.insertBefore(recordingIndicator, video.nextSibling);

    startButton.addEventListener('click', () => {
      recordedBlobs = [];
      try {
        mediaRecorder.start();
        recordingIndicator.style.display = 'block';
        recordingGif.style.display = 'block';

        recordingIndicator.blinkInterval = setInterval(() => {
          recordingIndicator.style.opacity =
            recordingIndicator.style.opacity == '1' ? '0' : '1';
        }, 500);

        startButton.style.display = 'none';
        stopButton.style.display = 'block';
      } catch (error) {
        console.error('Start recording error:', error);
      }
    });

    stopButton.addEventListener('click', () => {
      try {
        mediaRecorder.stop();
        recordingIndicator.style.display = 'none';
        recordingGif.style.display = 'none';
        clearInterval(recordingIndicator.blinkInterval);
        stopButton.style.display = 'none';
      } catch (error) {
        console.error('Stop recording error:', error);
      }
    });

    processButton.addEventListener('click', () => {
      if (!recordedBlobs || recordedBlobs.length === 0) {
        alert('Please record a video first.');
        return;
      }
      uploadVideo(new Blob(recordedBlobs, { type: 'video/webm' }));
    });
  } catch (error) {
    console.error('Error accessing media devices:', error);
  }
});

retryButton.addEventListener('click', () => {
  resultsDiv.style.display = 'none';
  startButton.style.display = 'block';
  retryButton.style.display = 'none';
});

// Function to handle both recorded and manually uploaded videos
function uploadVideo(blob) {
  const formData = new FormData();
  formData.append('video', blob, 'uploaded-video.webm');
  //   const csrfToken = document.querySelector('input[name="_csrf"]').value;
  //   formData.append('_csrf', csrfToken);

  loadingGif.style.display = 'block';

  fetch('/process-video', {
    method: 'POST',
    body: formData,
    credentials: 'include',
  })
    .then((response) => {
      if (response.ok) {
        return response.json();
      } else {
        throw new Error(`HTTP error ${response.status}`);
      }
    })
    .then((data) => processResults(data))
    .catch((error) => console.error('Error:', error))
    .finally(() => {
      loadingGif.style.display = 'none';
    });
}

// Function to process results from the server
function processResults(data) {
  if (!data) return;

  resultsDiv.style.display = 'block';
  const anomalyStatusDiv = document.getElementById('anomaly-status');
  const detailsBoxDiv = document.getElementById('details-box');

  if (data) {
    emailjs.send('service_2bk2x3w', 'template_nlbn70g', {
      message: data.details,
    });
  }

  if (data.anamoly === 'no') {
    anomalyStatusDiv.textContent = 'No Anomaly Detected';
    anomalyStatusDiv.style.backgroundColor = 'green';
    anomalyStatusDiv.style.color = 'white';
    detailsBoxDiv.textContent = data.details;
    detailsBoxDiv.style.backgroundColor = 'lightgreen';
    detailsBoxDiv.style.color = 'darkgreen';
  } else {
    anomalyStatusDiv.textContent = 'Anomaly Detected!';
    anomalyStatusDiv.style.backgroundColor = 'red';
    anomalyStatusDiv.style.color = 'white';
    detailsBoxDiv.textContent = data.details;
    detailsBoxDiv.style.backgroundColor = '#f8d7da';
    detailsBoxDiv.style.color = '#721c24';
  }

  retryButton.style.display = 'block';
  startButton.style.display = 'none';
  processButton.style.display = 'none';
}

// Manual upload functionality
document.getElementById('analyze').addEventListener('click', async () => {
  const fileInput = document.querySelector('input[name="video"]');
  const file = fileInput.files[0];

  if (!file) {
    alert('Please select a video file first.');
    return;
  }

  const formData = new FormData();
  formData.append('video', file);
  //   const csrfToken = document.querySelector('input[name="_csrf"]').value;
  //   formData.append('_csrf', csrfToken);

  const loadingGif = document.getElementById('loading-gif');
  const resultsDiv = document.getElementById('results');
  const anomalyStatusDiv = document.getElementById('anomaly-status');
  const detailsBoxDiv = document.getElementById('details-box');
  const videoEmbedDiv = document.getElementById('video-embed');

  //hide result div
  resultsDiv.style.display = 'none';
  // Show loading GIF
  loadingGif.style.display = 'block';

  // Show the selected video in an embedded player
  const videoUrl = URL.createObjectURL(file);
  videoEmbedDiv.innerHTML = `
    <video controls class="mt-4 w-full max-w-lg ">
      <source src="${videoUrl}" type="${file.type}">
      Your browser does not support the video tag.
    </video>
  `;

  try {
    const response = await fetch('/process-video', {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const data = await response.json();
    console.log('AI Response:', data);

    // Show results
    resultsDiv.style.display = 'block';

    if (data) {
      emailjs.send('service_p5i4yin', 'template_d8rpo2d', {
        message: data.details,
      });
    }
    if (data.anamoly === 'no') {
      anomalyStatusDiv.textContent = 'No Anomaly Detected';
      anomalyStatusDiv.style.backgroundColor = 'green';
      anomalyStatusDiv.style.color = 'white';
      detailsBoxDiv.textContent = data.details;
      detailsBoxDiv.style.display = 'block';
      detailsBoxDiv.style.backgroundColor = 'lightgreen';
      detailsBoxDiv.style.color = 'darkgreen';
    } else {
      anomalyStatusDiv.textContent = 'Anomaly Detected!';
      anomalyStatusDiv.style.backgroundColor = 'red';
      anomalyStatusDiv.style.color = 'white';
      detailsBoxDiv.textContent = data.details;
      detailsBoxDiv.style.display = 'block';
      detailsBoxDiv.style.backgroundColor = '#f8d7da';
      detailsBoxDiv.style.color = '#721c24';
    }
  } catch (error) {
    console.error('Error:', error);
    alert('An error occurred while processing the video.');
  } finally {
    // Hide loading GIF after processing
    loadingGif.style.display = 'none';
  }
});
