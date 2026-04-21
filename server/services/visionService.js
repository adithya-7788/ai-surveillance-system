const axios = require('axios');

const VISION_API_URL =
  process.env.AI_SERVICE_URL || process.env.PYTHON_VISION_URL || 'http://127.0.0.1:8000/detect';

const runVisionDetection = async (base64Image) => {
  const { data } = await axios.post(
    VISION_API_URL,
    { image: base64Image },
    {
      timeout: Number(process.env.VISION_API_TIMEOUT_MS || 10000),
      headers: { 'Content-Type': 'application/json' },
    }
  );

  return data;
};

module.exports = {
  runVisionDetection,
};
