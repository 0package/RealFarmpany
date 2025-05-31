from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from picamera2 import Picamera2

from rfp.monitor.camera_agent import CameraAgent

from fastapi import UploadFile, File, HTTPException
import os
from datetime import datetime

monitor_router = APIRouter(tags=['monitor'], prefix='/monitor')
camera_agent = CameraAgent()


def generate_image():
    while True:
        img_bytes = camera_agent.capture()
        yield (
            b'--frame\r\n'
            b'Content-Type: image/jpeg\r\n\r\n' + img_bytes + b'\r\n\r\n'
        )


@monitor_router.get('', include_in_schema=False)
def respond_root(request: Request):
    return StreamingResponse(
        generate_image(),
        media_type="multipart/x-mixed-replace; boundary=frame",
    )

@monitor_router.get("/snapshot")
async def take_snapshot():
    img_bytes = camera_agent.capture()
    return Response(content=img_bytes, media_type="image/jpeg")
    #try:
    #    save_dir = "uploaded_images"
    #    os.makedirs(save_dir, exist_ok=True)
    #    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    #    file_path = os.path.join(save_dir, f"{timestamp}_{file.filename}")

    #    with open(file_path, "wb") as buffer:
    #        buffer.write(await file.read())

    #    return {"message": "image upload complete", "file_path": file_path}
    #except Exception as e:
    #    raise HTTPException(status_code=500, detail=str(e))

