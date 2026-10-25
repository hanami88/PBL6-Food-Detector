import io
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, ImageOps
from ultralytics import YOLO

app = FastAPI(title="Da Nang Food Detection API")

# Cấu hình CORS cho phép Frontend gọi API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- CẤU HÌNH MÔ HÌNH & BẢNG MÀU ----------
MODEL_PATH = "best.pt"  # Đường dẫn file mô hình của bạn
CONF_THRESHOLD = 0.35  # Ngưỡng lọc: dưới 35% sẽ loại bỏ

# Bảng mã màu nổi bật, độ tương phản cao để gắn cho từng món ăn
COLOR_PALETTE = [
    "#FF3B30",  # 1. Đỏ cam
    "#34C759",  # 2. Xanh lá
    "#007AFF",  # 3. Xanh dương
    "#FF9500",  # 4. Vàng cam
    "#AF52DE",  # 5. Tím
    "#00C7BE",  # 6. Xanh ngọc
    "#FF2D55",  # 7. Hồng đậm
    "#FFCC00",  # 8. Vàng tươi
]

# Nạp mô hình 1 lần khi khởi động server
model = YOLO(MODEL_PATH)


@app.get("/")
async def root():
    return {"message": "Da Nang Food Detection API is running!"}


@app.post("/predict")
async def predict_food(file: UploadFile = File(...)):
    # 1. Kiểm tra định dạng file
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Vui lòng tải lên file hình ảnh hợp lệ.")

    try:
        # 2. Đọc ảnh & tự động xoay đúng chiều EXIF (tránh lỗi ảnh chụp từ điện thoại bị xoay ngang)
        image_bytes = await file.read()
        original_image = Image.open(io.BytesIO(image_bytes))
        original_image = ImageOps.exif_transpose(original_image).convert("RGB")
        img_width, img_height = original_image.size
    except Exception:
        raise HTTPException(status_code=400, detail="Không thể đọc được file ảnh. Vui lòng thử lại.")

    # 3. Chạy nhận diện với ngưỡng >= 0.35
    results = model.predict(source=original_image, conf=CONF_THRESHOLD, iou=0.45, verbose=False)
    res = results[0]

    # 4. Lọc trùng món: Nếu có 2 khung cùng 1 món, chỉ giữ khung có % cao nhất
    best_per_class = {}

    for box in res.boxes:
        conf = float(box.conf[0])
        if conf < CONF_THRESHOLD:
            continue

        cls_id = int(box.cls[0])
        cls_name = model.names[cls_id]
        xyxy = box.xyxy[0].tolist()  # [x1, y1, x2, y2]

        if cls_name not in best_per_class or conf > best_per_class[cls_name]["conf_raw"]:
            best_per_class[cls_name] = {
                "class_id": cls_id,
                "class_name": cls_name,
                "conf_raw": conf,
                "confidence": round(conf * 100, 2),
                "xyxy": xyxy,
            }

    # 5. Nếu không có món nào >= 0.35 -> Yêu cầu chụp lại
    if not best_per_class:
        return {
            "success": False,
            "require_retake": True,
            "message": "Không nhận diện rõ món ăn (độ chính xác dưới 35%). Vui lòng chụp lại ảnh gần và rõ nét hơn!",
            "image_size": {"width": img_width, "height": img_height},
            "total_dishes": 0,
            "dishes": [],
        }

    # 6. Sắp xếp theo % giảm dần, gán mã màu và tính tọa độ
    sorted_items = sorted(best_per_class.values(), key=lambda x: x["conf_raw"], reverse=True)
    dishes_output = []

    for idx, item in enumerate(sorted_items, start=1):
        x1, y1, x2, y2 = item["xyxy"]

        # Giới hạn tọa độ trong khung ảnh
        x1, y1 = max(0.0, x1), max(0.0, y1)
        x2, y2 = min(float(img_width), x2), min(float(img_height), y2)

        color = COLOR_PALETTE[(idx - 1) % len(COLOR_PALETTE)]

        dishes_output.append({
            "order": idx,  # Số thứ tự món (#1, #2...)
            "class_id": item["class_id"],
            "class_name": item["class_name"],  # Tên lớp (vd: "oc_hut")
            "confidence": item["confidence"],  # Độ tự tin % (vd: 94.24)
            "color": color,  # Mã màu HEX tương ứng
            "bbox": [round(x1, 1), round(y1, 1), round(x2, 1), round(y2, 1)],
            "box_percent": {  # Tỉ lệ % để FE vẽ khung bằng CSS cực dễ
                "left": round((x1 / img_width) * 100, 2),
                "top": round((y1 / img_height) * 100, 2),
                "width": round(((x2 - x1) / img_width) * 100, 2),
                "height": round(((y2 - y1) / img_height) * 100, 2),
            }
        })

    return {
        "success": True,
        "require_retake": False,
        "message": f"Nhận diện thành công {len(dishes_output)} món ăn.",
        "image_size": {"width": img_width, "height": img_height},
        "total_dishes": len(dishes_output),
        "dishes": dishes_output,
    }