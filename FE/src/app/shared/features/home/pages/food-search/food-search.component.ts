import { Component, HostListener, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
export interface Restaurant {
  id: number;
  name: string;
  tag: string;
  tagColorClass: string;
  specialty: string;
  image: string;
  statusText: string;
  isOpen: boolean;
  isBookmark: boolean;
  rating: number;
  reviewsCount: number;
  priceRange: string;
  address: string;
  distance: string;
  highlightText: string;
  priceTag: string;
  topPercent: string;
  leftPercent: string;
}

// Interface khớp 100% với JSON trả về từ FastAPI
export interface BoxPercent {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface DetectedDish {
  order: number;
  class_id: number;
  class_name: string;
  display_name?: string; // Tên tiếng Việt có dấu được FE gán thêm
  confidence: number;
  color: string;
  bbox: number[];
  box_percent: BoxPercent;
}

export interface PredictResponse {
  success: boolean;
  require_retake: boolean;
  message: string;
  image_size: { width: number; height: number };
  total_dishes: number;
  dishes: DetectedDish[];
}

@Component({
  selector: 'app-food-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './food-search.component.html',
})
export class FoodSearchComponent implements OnDestroy {
  // Cấu hình URL FastAPI
  private readonly API_URL = 'http://localhost:8000/predict';
  private cdr = inject(ChangeDetectorRef);
  searchQuery: string = 'Mì Quảng, bánh xèo Hải Châu';
  pastedImage: File | null = null;
  imagePreviewUrl: string | null = null;
  searchStatus = '';
  selectedCategory: string = 'Tất cả món';
  selectedSort: string = 'Được đề xuất nhiều nhất';
  selectedRestaurantId: number = 1;

  // Trạng thái nhận diện AI
  isAnalyzing: boolean = false;
  predictionResult: PredictResponse | null = null;
  selectedDishOrder: number | null = null; // null = hiển thị tất cả món trong ảnh
  hoveredDishOrder: number | null = null; // Hiệu ứng khi rê chuột qua thẻ món

  // Từ điển ánh xạ 64 class của YOLO sang tên tiếng Việt có dấu
  private readonly DISH_NAME_MAP: Record<string, string> = {
    'banh canh': 'Bánh canh',
    'banh chung': 'Bánh chưng',
    'banh cuon': 'Bánh cuốn',
    'banh khot': 'Bánh khọt',
    'banh mi': 'Bánh mì',
    'banh trang': 'Bánh tráng',
    'banh trang tron': 'Bánh tráng trộn',
    'banh xeo': 'Bánh xèo',
    'bo kho': 'Bò kho',
    'bo la lot': 'Bò lá lốt',
    bun: 'Bún',
    'bun bo hue': 'Bún bò Huế',
    'bun cha': 'Bún chả',
    'bun dau': 'Bún đậu',
    'bun mam': 'Bún mắm',
    'bun rieu': 'Bún riêu',
    ca: 'Cá',
    'ca phao': 'Cà pháo',
    canh: 'Canh',
    cha: 'Chả',
    'cha gio': 'Chả giò',
    com: 'Cơm',
    'com tam': 'Cơm tấm',
    'cu kieu': 'Củ kiệu',
    cua: 'Cua',
    'dau hu': 'Đậu hũ',
    'dua chua': 'Dưa chua',
    'goi cuon': 'Gỏi cuốn',
    'heo quay': 'Heo quay',
    'hu tieu': 'Hủ tiếu',
    'kho qua thit': 'Khổ qua nhồi thịt',
    lau: 'Lẩu',
    'long heo': 'Lòng heo',
    mi: 'Mì',
    muc: 'Mực',
    nam: 'Nấm',
    oc: 'Ốc',
    pho: 'Phở',
    salad: 'Salad',
    'thit bo': 'Thịt bò',
    'thit ga': 'Thịt gà',
    'thit heo': 'Thịt heo',
    'thit kho': 'Thịt kho',
    'thit nuong': 'Thịt nướng',
    tom: 'Tôm',
    xoi: 'Xôi',
    'banh beo': 'Bánh bèo',
    'cao lau': 'Cao lầu',
    'mi quang': 'Mì Quảng',
    'com chien duong chau': 'Cơm chiên Dương Châu',
    'bun cha ca': 'Bún chả cá',
    'com chien ga': 'Cơm chiên gà',
    'chao long': 'Cháo lòng',
    'nom hoa chuoi': 'Nộm hoa chuối',
    'nui xao bo': 'Nui xào bò',
    'sup cua': 'Súp cua',
    // 8 món mới đặc sản Đà Nẵng - Quảng Nam
    'com ga hoi an': 'Cơm gà Hội An',
    'kem bo': 'Kem bơ',
    'oc hut': 'Ốc hút',
    'mit tron': 'Mít trộn',
    'be thui': 'Bê thui',
    'banh bot loc': 'Bánh bột lọc',
    'banh trang kep': 'Bánh tráng kẹp',
    'banh trang cuon thit heo': 'Bánh tráng cuốn thịt heo',
  };

  categories: string[] = [
    'Tất cả món',
    'Mì Quảng',
    'Bánh xèo & Nem lụi',
    'Bún chả cá',
    'Hải sản tươi sống',
    'Cơm gà & Bún mắm',
    'Ăn vặt & Chè',
  ];

  sortOptions: string[] = [
    'Được đề xuất nhiều nhất',
    'Đánh giá cao nhất (★)',
    'Khoảng cách gần nhất',
    'Mức giá từ thấp đến cao',
  ];

  restaurants: Restaurant[] = [
    {
      id: 1,
      name: 'Mì Quảng Bà Tư',
      tag: 'Quán ruột địa phương',
      tagColorClass: 'bg-brand-primary/10 text-brand-primary',
      specialty: 'Mì Quảng ếch rút xương & Gà ta thả vườn củ nén',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuDdgMxB368az3TY85FCHzs9Fdv7t5IaRmvFh21ZLMcXwhuIzXDd7-NnlccG0yaZI1bpHO8njrQGPEE460cvCxp-B_W9PKfulX0bp32ZMeMq3YxZDb2Jh80R_M9NroypQVSyex0PqiivFvZ99uWsiRvchxRj4yjsKbbIf5Xxpo-7lLsiKAXPoTn6uzOTFjV25cqlOpxkUV7s_NT97TPzuQSFJgveLZw9Z5nkeGBqTPGt_fki8cUuOcYvpg',
      statusText: 'Mở cửa • Đóng lúc 21:00',
      isOpen: true,
      isBookmark: false,
      rating: 4.8,
      reviewsCount: 326,
      priceRange: '35.000 – 65.000đ',
      address: '19 Trần Bình Trọng',
      distance: '0.8 km',
      highlightText: 'Nước nhưn sánh đậm vị, bánh tráng nướng giòn rụm',
      priceTag: 'Mì Bà Tư • 35k',
      topPercent: '32%',
      leftPercent: '24%',
    },
    {
      id: 2,
      name: 'Bếp Nhà Mận',
      tag: '',
      tagColorClass: '',
      specialty: 'Bánh xèo tôm nhảy vỏ giòn & Nem lụi nướng sả',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuD01GIRjjSXeNMmcKUxKWaHYNo5s7qanzFtVfA-Jc1M-m_RU_BIVqB3UjwzH8h8-0FW_umR2azajbttbo6D08Xl_h02TCD5Z5V7odLLH6DAcVmHidULz6iIi8w8OtW7imSK_Yte9fwyOB-lebWy0cWaassPUp7o1yDcRwBcNkkBdqkk67F-U4uVpcvz3AzoWzK04lKtRDKljFT0RwDjN9XSQnSfbx1y7WH_8bAnYPnohlm9qAJQwf5rVg',
      statusText: 'Đang mở • Đóng lúc 22:00',
      isOpen: true,
      isBookmark: false,
      rating: 4.7,
      reviewsCount: 218,
      priceRange: '45.000 – 90.000đ',
      address: '118 Hoàng Diệu',
      distance: '1.2 km',
      highlightText: 'Nước chấm tương đậu gan heo gia truyền',
      priceTag: 'Bếp Mận • 45k',
      topPercent: '48%',
      leftPercent: '20%',
    },
    {
      id: 3,
      name: 'Bún Chả Cá Cô Năm',
      tag: 'Hơn 25 năm',
      tagColorClass: 'bg-emerald-50 text-emerald-700',
      specialty: 'Chả cá thu quết tay nguyên chất & Nước lèo bí đỏ, bắp cải ngọt thanh',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuC3GPTelXlRXOM_SiRtm3kgS8lNuoft8fy-BZ9xcFF1deida4fWKPjga9Qt3lDB22hYVdwG0TzofUx_yqTBjLfs42oX_WFMJdtz63WXmkvzjZ2pZhJgG0pvftpZxntpdXFoudGVkdtnU8QYe8j9tZlpF4N7LSSSwANazPJqAjolJoMKkRoXojbMjaOQ0HUlsb5T2qNJ18QboGQpJZ1TmiDpGR-pysWv7JzSVHWq7oNd6qvnq9HgTAlneQ',
      statusText: 'Đang mở • Bán từ 06:00',
      isOpen: true,
      isBookmark: false,
      rating: 4.6,
      reviewsCount: 174,
      priceRange: '35.000 – 55.000đ',
      address: '03 Nguyễn Chí Thanh',
      distance: '2.1 km',
      highlightText: 'Có mắm ruốc chưng & hành tím ngâm chua ăn kèm',
      priceTag: 'Cô Năm • 35k',
      topPercent: '22%',
      leftPercent: '28%',
    },
    {
      id: 4,
      name: 'Hải Sản Gió Biển Quán',
      tag: '',
      tagColorClass: '',
      specialty: 'Chip chip hấp sả, mực một nắng nướng sa tế & lẩu hải sản',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuAhYlquamk25zej9s8srpgYykRSAnkUgnMLs_O5GVvmCyCYJfTtuTVr1_0MBsNsyp2GTozpQncWwLkhGAvtrKOWStmcv9z9-QPBvHgqRh1fKStEExk00Rt2IqUMsnQc9_0_8S-suCTisPlo0H2-w0fB4ruNv_C4ZdlIIqanBOGFr6wwer9jl-iUD7_TR30TbD2LCD7NP3TXDXivNOaJ4JvOdqEQPv-uQ11XYJss0fStL8GsskL4HiqzKA',
      statusText: 'Mở cửa chiều 16:00 – 23:30',
      isOpen: false,
      isBookmark: false,
      rating: 4.8,
      reviewsCount: 412,
      priceRange: '90.000 – 180.000đ',
      address: 'Võ Nguyên Giáp',
      distance: '2.8 km',
      highlightText: 'Bể hải sản chọn tại chỗ, cân ký công khai',
      priceTag: 'Gió Biển • 90k',
      topPercent: '40%',
      leftPercent: '88%',
    },
    {
      id: 5,
      name: 'Quán Cơm Chay An Nhiên',
      tag: '',
      tagColorClass: '',
      specialty: 'Cơm sen dưỡng sinh & Lẩu nấm thanh vị',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuAihguEyU4PV45qyEKpU-UMZPhBYIY9x76tCIQRL4699ZGoUw7J0G5OLwrC_XTjs87j5KY7AQBkb-on55J8zt6vzHm43TQvhmN-vojmw1e-PHZOd7HKHuhyjVMWThi-g4qM0MQdVIoX6zrx7H6xwWw7MA5Lat4eWYKeGoXC28g3dKdNCrQkSBYjvuIn39xs3CUvMxZ0FLPm-1fF8jpbaA4cjlRej2PAYwyNPMYptMFxog1v93ljaaJPwg',
      statusText: 'Đang mở • 07:00 – 21:00',
      isOpen: true,
      isBookmark: false,
      rating: 4.9,
      reviewsCount: 189,
      priceRange: '25.000 – 50.000đ',
      address: '42 Lê Đình Dương',
      distance: '3.1 km',
      highlightText: 'Không gian sân vườn yên tĩnh, thoáng mát',
      priceTag: 'Chay An Nhiên • 25k',
      topPercent: '68%',
      leftPercent: '18%',
    },
  ];

  // Hàm chuẩn hóa tên class từ YOLO sang tiếng Việt có dấu
  formatDishName(rawClassName: string): string {
    if (!rawClassName) return '';
    const normalized = rawClassName.toLowerCase().replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
    return this.DISH_NAME_MAP[normalized] || rawClassName;
  }

  selectCategory(category: string): void {
    this.selectedCategory = category;
  }

  selectRestaurant(id: number): void {
    this.selectedRestaurantId = id;
  }

  toggleBookmark(restaurant: Restaurant, event: Event): void {
    event.stopPropagation();
    restaurant.isBookmark = !restaurant.isBookmark;
  }

  // Khi bấm nút Tìm kiếm hoặc Enter
  async onSearch(): Promise<void> {
    if (this.pastedImage) {
      await this.analyzeImageWithAI(this.pastedImage);
      return;
    }

    this.searchStatus = `Đang tìm kiếm từ khóa: "${this.searchQuery}"`;
  }

  // Gọi API FastAPI /predict
  async analyzeImageWithAI(imageFile: File): Promise<void> {
    this.isAnalyzing = true;
    this.searchStatus = 'AI đang phân tích hình ảnh món ăn...';
    this.selectedDishOrder = null;
    this.cdr.detectChanges();
    const formData = new FormData();
    formData.append('file', imageFile);

    try {
      const response = await fetch(this.API_URL, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.detail || `Lỗi kết nối Server (${response.status})`);
      }

      const data: PredictResponse = await response.json();

      // Gán tên tiếng Việt có dấu cho từng món ăn
      data.dishes = data.dishes.map((dish) => ({
        ...dish,
        display_name: this.formatDishName(dish.class_name),
      }));

      this.predictionResult = data;

      if (data.success && data.dishes.length > 0) {
        // Mặc định điền tất cả tên món nhận diện được lên ô tìm kiếm
        this.searchQuery = data.dishes.map((d) => d.display_name).join(', ');
        this.searchStatus = data.message;
      } else {
        this.searchStatus = data.message;
      }
    } catch (error: any) {
      this.predictionResult = null;
      this.searchStatus =
        error?.message || 'Không thể kết nối tới AI Server (http://localhost:8000).';
    } finally {
      this.isAnalyzing = false;
      this.cdr.detectChanges();
    }
  }

  // Click vào 1 khung màu trên ảnh hoặc 1 thẻ món ăn bên phải
  selectDetectedDish(dish: DetectedDish, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    // Nếu click lại vào món đang chọn -> Bỏ lọc để hiện lại tất cả món
    if (this.selectedDishOrder === dish.order) {
      this.showAllDetectedDishes();
      return;
    }

    this.selectedDishOrder = dish.order;
    this.searchQuery = dish.display_name || dish.class_name;
    this.searchStatus = `Đang chọn món #${dish.order}: ${this.searchQuery} (${dish.confidence}%)`;
  }

  // Hiển thị lại tất cả các món nhận diện được
  showAllDetectedDishes(): void {
    this.selectedDishOrder = null;
    if (this.predictionResult?.dishes?.length) {
      this.searchQuery = this.predictionResult.dishes.map((d) => d.display_name).join(', ');
      this.searchStatus = `Hiển thị tất cả ${this.predictionResult.total_dishes} món ăn nhận diện được.`;
    }
  }

  // Kiểm tra xem khung màu có đang được làm nổi bật hay không
  isDishHighlighted(order: number): boolean {
    if (this.hoveredDishOrder !== null) {
      return this.hoveredDishOrder === order;
    }
    return this.selectedDishOrder === null || this.selectedDishOrder === order;
  }

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent): void {
    const items = event.clipboardData?.items;
    if (!items) return;

    for (let index = 0; index < items.length; index++) {
      const item = items[index];
      if (item.type.startsWith('image/')) {
        const image = item.getAsFile();
        if (image) {
          event.preventDefault();
          this.setPastedImage(image);
          return;
        }
      }
    }
  }

  onImageSelected(event: Event): void {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) return;

    const image = input.files?.[0];
    if (image) {
      this.setPastedImage(image);
    }
    input.value = '';
  }

  removePastedImage(): void {
    this.clearImagePreview();
    this.pastedImage = null;
    this.predictionResult = null;
    this.selectedDishOrder = null;
    this.hoveredDishOrder = null;
    this.searchStatus = '';
  }

  ngOnDestroy(): void {
    this.clearImagePreview();
  }

  private setPastedImage(image: File): void {
    if (!image.type.startsWith('image/')) return;

    this.clearImagePreview();
    this.pastedImage = image;
    this.imagePreviewUrl = URL.createObjectURL(image);
    this.predictionResult = null;
    this.selectedDishOrder = null;
    this.cdr.detectChanges();
    // Tự động gọi AI nhận diện ngay khi người dùng chọn hoặc dán ảnh
    this.analyzeImageWithAI(image);
  }

  private clearImagePreview(): void {
    if (this.imagePreviewUrl) {
      URL.revokeObjectURL(this.imagePreviewUrl);
      this.imagePreviewUrl = null;
    }
  }

  getSelectedRestaurant(): Restaurant | undefined {
    return this.restaurants.find((r) => r.id === this.selectedRestaurantId);
  }
}
