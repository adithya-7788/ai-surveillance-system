# AI Surveillance Entrance System

Real-time surveillance platform that combines a React dashboard, a Node.js/Express API, and a Python/OpenCV/YOLO AI module to monitor entrances, track people, and raise alerts for suspicious activity.

## What it solves

This project helps secure monitored areas by detecting people and relevant carried objects in real time, counting entry/exit movement, and surfacing alerts in a clean dashboard. It is designed for practical surveillance workflows where stability, low latency, and minimal false alerts matter.

## Features

- Object detection for people, backpacks, handbags, and suitcases
- Real-time entry and exit alerts
- Loitering and crowd alerts
- Suspicious activity detection for carried objects
- React dashboard for live monitoring and alert review
- JWT-based authentication for protected routes

## Tech Stack

- MongoDB
- Express.js
- React
- Node.js
- Python
- OpenCV
- YOLO

## Folder Structure

```text
TBP_Proj/
├── client/
│   ├── src/
│   ├── package.json
│   └── .env.example
├── server/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── index.js
│   ├── package.json
│   └── .env.example
├── ai-module/
│   ├── app/
│   │   └── main.py
│   └── requirements.txt
├── .env.example
├── .gitignore
└── README.md
```

## Environment Setup

Copy the sample file and fill in your local values:

```bash
cp .env.example server/.env
cp .env.example client/.env
```

Recommended variables:

```bash
MONGO_URI=your_mongo_url_here
JWT_SECRET=your_secret_here
API_KEY=your_api_key_here
PORT=5000
CLIENT_URL=http://localhost:5173
VITE_API_BASE_URL=http://localhost:5000/api
AI_SERVICE_URL=http://127.0.0.1:8000/detect
PYTHON_VISION_URL=http://127.0.0.1:8000/detect
VISION_API_TIMEOUT_MS=10000
```

## Setup Instructions

### Client

```bash
cd client
npm install
npm run dev
```

### Server

```bash
cd server
npm install
npm run dev
```

### AI Module

```bash
cd ai-module
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The YOLO weights are loaded automatically by Ultralytics on first run. If you want to cache them manually, keep `yolov8n.pt` outside the repository and download it locally as needed.

## Run the Full System

1. Start MongoDB locally or use a hosted connection string.
2. Start the AI module on port `8000`.
3. Start the backend server on port `5000`.
4. Start the React client on port `5173`.
5. Sign in and open the live camera dashboard.

## Security Notes

- `.env` files are ignored by git.
- Secrets must live only in local environment files.
- Large binaries, model weights, and virtualenv folders are excluded from the repository.

## Future Improvements

- Add downloadable model asset management
- Expose more detection thresholds in the UI
- Add deployment automation for Docker and cloud hosting
- Add test coverage for alert lifecycle and tracking logic

## Large File Guidance

Do not commit local model caches, virtual environments, or video recordings. If you need to share model artifacts, store them in external object storage or a release asset instead of the repository.
