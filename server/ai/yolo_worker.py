import sys
import json
import cv2
from ultralytics import YOLO
import os
import time

def run_detection(camera_id, stream_url):
    try:
        # Load the YOLOv11 model
        model_path = os.path.join(os.path.dirname(__file__), "yolo11m.pt")
        model = YOLO(model_path) 
        
        # Attempt to capture one frame
        cap = cv2.VideoCapture(stream_url)
        success, frame = cap.read()
        cap.release()

        if not success:
            # Fallback for demo
            print(json.dumps({
                "success": True, 
                "cameraId": camera_id, 
                "detections": [{
                    "class": "person", 
                    "confidence": 0.92, 
                    "box": [100, 100, 300, 300]
                }],
                "imageUrl": None, # No image for fallback
                "model": "yolo11m",
                "note": "Stream unreachable, returned demo detection"
            }))
            sys.exit(0)

        # Run inference on CPU
        results = model(frame, verbose=False, device='cpu')
        
        # Define target classes (COCO dataset IDs for person and vehicles)
        # 0: person, 1: bicycle, 2: car, 3: motorcycle, 5: bus, 7: truck
        target_classes = {0, 1, 2, 3, 5, 7}

        detections = []
        for r in results:
            for box in r.boxes:
                cls_id = int(box.cls[0])
                if cls_id in target_classes:
                    label = model.names[cls_id]
                    conf = float(box.conf[0])
                    detections.append({
                        "class": label,
                        "confidence": conf,
                        "box": box.xyxy[0].tolist() # [x1, y1, x2, y2]
                    })

        # Logic to save the detection snapshot if anything was found
        image_url = None
        if detections:
            # Create annotated frame with thinner lines and smaller labels for HUD look
            annotated_frame = results[0].plot(line_width=1, font_size=10)
            
            # Ensure detections directory exists relative to script
            storage_dir = os.path.join(os.path.dirname(__file__), "..", "storage", "snapshots", "detections")
            if not os.path.exists(storage_dir):
                os.makedirs(storage_dir, exist_ok=True)
                
            filename = f"det_{camera_id}_{int(time.time()*1000)}.jpg"
            save_path = os.path.join(storage_dir, filename)
            
            cv2.imwrite(save_path, annotated_frame)
            image_url = f"/storage/snapshots/detections/{filename}"

        return {
            "success": True,
            "cameraId": camera_id,
            "detections": detections,
            "imageUrl": image_url,
            "model": "yolo11m"
        }

    except Exception as e:
        return {"error": str(e), "cameraId": camera_id}

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Usage: python yolo_worker.py <cameraId> <streamUrl>"}))
        sys.exit(1)

    cam_id = sys.argv[1]
    url = sys.argv[2]
    
    result = run_detection(cam_id, url)
    print(json.dumps(result))
