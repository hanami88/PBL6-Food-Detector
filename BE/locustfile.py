import mimetypes
import os
from pathlib import Path

from locust import HttpUser, between, tag, task

from dotenv import load_dotenv
load_dotenv(Path(__file__).with_name(".env"))

class FoodApiUser(HttpUser):
    wait_time = between(0.1, 0.5)

    @task
    @tag("predict", "TC_PERF_01", "TC_PERF_02", "TC_PERF_03", "TC_PERF_04")
    def predict_food(self):
        image_path_value = os.getenv("FOOD_IMAGE_PATH")
        if not image_path_value:
            raise RuntimeError(
                "Thiếu biến môi trường FOOD_IMAGE_PATH trỏ đến ảnh cần kiểm thử."
            )

        image_path = Path(image_path_value)
        if not image_path.is_file():
            raise FileNotFoundError(f"Không tìm thấy ảnh kiểm thử: {image_path}")

        content_type, _ = mimetypes.guess_type(image_path.name)
        if not content_type or not content_type.startswith("image/"):
            raise ValueError(f"Không xác định được định dạng ảnh: {image_path.name}")

        with image_path.open("rb") as image_file:
            with self.client.post(
                "/predict",
                files={"file": (image_path.name, image_file, content_type)},
                name="POST /predict",
                catch_response=True,
            ) as response:
                if response.status_code != 200:
                    response.failure(f"HTTP {response.status_code}")
                    return

                try:
                    data = response.json()
                except ValueError:
                    response.failure("Response không phải JSON hợp lệ")
                    return

                if not isinstance(data, dict):
                    response.failure("JSON response không phải object")
                    return

                dishes = data.get("dishes")
                if (
                    data.get("success") is not True
                    or data.get("require_retake") is not False
                    or not isinstance(data.get("total_dishes"), int)
                    or data["total_dishes"] < 1
                    or not isinstance(dishes, list)
                    or not dishes
                ):
                    response.failure("Ảnh không được nhận diện thành công")
                    return

                required_fields = {
                    "class_name",
                    "confidence",
                    "color",
                    "box_percent",
                }
                if any(
                    not isinstance(dish, dict)
                    or not required_fields.issubset(dish)
                    for dish in dishes
                ):
                    response.failure("Dữ liệu món ăn trong response không hợp lệ")
                    return

                response.success()

    @task
    @tag("search", "TC_PERF_05", "TC_PERF_07")
    def search_foods(self):
        self._search_foods(
            params={"q": "Mì Quảng", "page": 1, "page_size": 12}
        )

    @task
    @tag("search", "TC_PERF_06")
    def search_foods_with_filters(self):
        self._search_foods(
            params={
                "q": "Mì Quảng",
                "category": "Đặc sản",
                "sort": "rating",
                "page": 2,
                "page_size": 12,
            }
        )

    def _search_foods(self, params: dict):
        with self.client.get(
            "/api/foods/search",
            params=params,
            name="GET /api/foods/search",
            catch_response=True,
        ) as response:
            if response.status_code != 200:
                response.failure(f"HTTP {response.status_code}")
                return

            try:
                data = response.json()
            except ValueError:
                response.failure("Response không phải JSON hợp lệ")
                return

            if (
                not isinstance(data, dict)
                or not isinstance(data.get("items"), list)
                or not isinstance(data.get("total"), int)
                or data.get("page") != params["page"]
                or data.get("page_size") != params["page_size"]
            ):
                response.failure("Cấu trúc response tìm kiếm không hợp lệ")
                return

            response.success()