from __future__ import annotations

import base64
from dataclasses import dataclass
from typing import List

import cv2
import numpy as np
import supervision as sv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from ultralytics import YOLO


class DetectRequest(BaseModel):
    image: str


class DetectionItem(BaseModel):
    id: int
    class_name: str
    x: float
    y: float
    w: float
    h: float


class DetectResponse(BaseModel):
    frameWidth: int
    frameHeight: int
    detections: List[dict]


@dataclass
class DetectionPayload:
    tracker_id: int
    x: float
    y: float
    w: float
    h: float
    class_name: str


app = FastAPI(title="Smart Surveillance Vision API", version="1.0.0")
model = YOLO("yolov8n.pt")
tracker = sv.ByteTrack(track_activation_threshold=0.25, minimum_matching_threshold=0.8)
MAX_INFERENCE_WIDTH = 640

# YOLO class ID mappings for COCO dataset
ALLOWED_CLASSES = {
    0: 'person',       # person
    26: 'backpack',    # backpack
    30: 'handbag',     # handbag
    33: 'suitcase',    # suitcase
}


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


def decode_base64_to_image(image_base64: str) -> np.ndarray:
    encoded = image_base64.split(",")[-1]

    try:
        binary = base64.b64decode(encoded)
    except Exception as exc:  # pragma: no cover
        raise HTTPException(status_code=400, detail="Invalid base64 image") from exc

    buffer = np.frombuffer(binary, dtype=np.uint8)
    image = cv2.imdecode(buffer, cv2.IMREAD_COLOR)

    if image is None:
        raise HTTPException(status_code=400, detail="Failed to decode image")

    return image


def detect_and_track(image: np.ndarray) -> List[DetectionPayload]:
    prediction = model.predict(
        source=image,
        verbose=False,
        conf=0.25,
        iou=0.5,
        imgsz=640,
        max_det=50,
    )[0]

    if prediction.boxes is None or len(prediction.boxes) == 0:
        return []

    detections = sv.Detections.from_ultralytics(prediction)

    # Filter to only allowed classes
    allowed_mask = np.array([cid in ALLOWED_CLASSES for cid in detections.class_id])
    detections = detections[allowed_mask]

    if len(detections) == 0:
        return []

    tracked = tracker.update_with_detections(detections)

    output: List[DetectionPayload] = []

    for xyxy, tracker_id, class_id in zip(tracked.xyxy, tracked.tracker_id, tracked.class_id):
        if tracker_id is None:
            continue

        x1, y1, x2, y2 = xyxy.tolist()
        class_name = ALLOWED_CLASSES.get(int(class_id), 'unknown')
        output.append(
            DetectionPayload(
                tracker_id=int(tracker_id),
                x=float(x1),
                y=float(y1),
                w=float(max(0.0, x2 - x1)),
                h=float(max(0.0, y2 - y1)),
                class_name=class_name,
            )
        )

    return output


@app.post("/detect", response_model=DetectResponse)
def detect(request: DetectRequest) -> dict:
    image = decode_base64_to_image(request.image)

    frame_height, frame_width = image.shape[:2]
    if frame_width > MAX_INFERENCE_WIDTH:
        scale = MAX_INFERENCE_WIDTH / float(frame_width)
        resized_width = MAX_INFERENCE_WIDTH
        resized_height = max(1, int(frame_height * scale))
        image = cv2.resize(image, (resized_width, resized_height), interpolation=cv2.INTER_AREA)

    frame_height, frame_width = image.shape[:2]

    detections = detect_and_track(image)

    return {
        "frameWidth": int(frame_width),
        "frameHeight": int(frame_height),
        "detections": [
            {
                "id": item.tracker_id,
                "class": item.class_name,
                "x": item.x,
                "y": item.y,
                "w": item.w,
                "h": item.h,
            }
            for item in detections
        ],
    }
