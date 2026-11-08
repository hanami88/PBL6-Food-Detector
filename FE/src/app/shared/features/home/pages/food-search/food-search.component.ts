import { CommonModule } from '@angular/common';
import {
  HttpClient,
  HttpErrorResponse,
  HttpParams,
} from '@angular/common/http';

import {
  ChangeDetectorRef,
  Component,
  DestroyRef,
  HostListener,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';

import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import {
  firstValueFrom,
  TimeoutError,
  timeout,
} from 'rxjs';

interface FoodRestaurant {
  id: number;
  name: string;
  address: string;
  image_url: string | null;
  price: number | null;
  osm_place: {
    place_id: string | null;
    maps_url: string | null;
    latitude: number | null;
    longitude: number | null;
    opening_hours: string | null;
  } | null;
}

interface FoodSearchItem {
  id: number;
  name: string;
  description: string | null;
  category: string | null;
  image_url: string | null;
  average_price: number | null;
  average_rating: number | null;
  review_count: number;
  restaurants: FoodRestaurant[];
}

interface FoodSearchResponse {
  items: FoodSearchItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

interface BoxPercent {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface DetectedDish {
  order: number;
  class_id: number;
  class_name: string;
  display_name: string;
  confidence: number;
  color: string;
  bbox: number[];
  box_percent: BoxPercent;
}

interface PredictResponse {
  success: boolean;
  require_retake: boolean;
  message: string;
  image_size: {
    width: number;
    height: number;
  };
  total_dishes: number;
  dishes: DetectedDish[];
}

@Component({
  selector: 'app-food-search',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './food-search.component.html',
})
export class FoodSearchComponent implements OnInit, OnDestroy {

  // ==========================================
  // CONFIGURATION
  // ==========================================

  private readonly apiUrl = 'http://localhost:8000/api/foods';
  private readonly predictUrl = 'http://localhost:8000/predict';

  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly changeDetector = inject(ChangeDetectorRef);

  readonly pageSize = 12;

  // ==========================================
  // SEARCH STATE
  // ==========================================

  searchQuery = '';

  page = 1;

  foods: FoodSearchItem[] = [];

  total = 0;
  totalPages = 0;

  isSearching = false;
  searchError = '';

  // Đã thực hiện tìm kiếm hay chưa
  hasSearched = false;

  private searchRequestId = 0;

  // ==========================================
  // IMAGE / AI STATE
  // ==========================================

  pastedImage: File | null = null;
  imagePreviewUrl: string | null = null;

  isAnalyzing = false;
  searchStatus = '';

  predictionResult: PredictResponse | null = null;

  selectedDishOrder: number | null = null;
  hoveredDishOrder: number | null = null;

  private predictionRequestId = 0;

  private predictionAbortController: AbortController | null = null;

  // ==========================================
  // FOOD NAME MAPPING
  // ==========================================

  private readonly dishNameMap: Record<string, string> = {
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
    'bun cha ca': 'Bún chả cá',

    ca: 'Cá',
    'ca phao': 'Cà pháo',

    canh: 'Canh',
    cha: 'Chả',
    'cha gio': 'Chả giò',

    com: 'Cơm',
    'com tam': 'Cơm tấm',
    'com chien duong chau': 'Cơm chiên Dương Châu',
    'com chien ga': 'Cơm chiên gà',
    'com ga hoi an': 'Cơm gà Hội An',

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

    'chao long': 'Cháo lòng',
    'nom hoa chuoi': 'Nộm hoa chuối',
    'nui xao bo': 'Nui xào bò',
    'sup cua': 'Súp cua',

    'kem bo': 'Kem bơ',
    'oc hut': 'Ốc hút',
    'mit tron': 'Mít trộn',
    'be thui': 'Bê thui',

    'banh bot loc': 'Bánh bột lọc',
    'banh trang kep': 'Bánh tráng kẹp',
    'banh trang cuon thit heo': 'Bánh tráng cuốn thịt heo',
  };

  // ==========================================
  // INITIALIZATION
  // ==========================================

  ngOnInit(): void {
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {

        const query = (params.get('q') ?? '').trim();

        this.searchQuery = query;
        this.page = 1;

        // Không gọi API nếu không có từ khóa.
        if (!query) {
          this.hasSearched = false;
          this.resetFoodResults();
          return;
        }

        void this.searchFoods();
      });
  }

  // ==========================================
  // SEARCH
  // ==========================================

  async onSearch(): Promise<void> {

    if (this.isSearching || this.isAnalyzing) {
      return;
    }

    // Nếu có ảnh nhưng chưa nhận diện thành công
    if (this.pastedImage && !this.predictionResult) {
      await this.analyzeImageWithAI(this.pastedImage);
      return;
    }

    const query = this.searchQuery.trim();

    // Không tìm kiếm với từ khóa rỗng
    if (!query) {
      this.hasSearched = false;
      this.resetFoodResults();
      return;
    }

    this.page = 1;

    await this.searchFoods();
  }

  async searchFoods(): Promise<void> {

    const query = this.searchQuery.trim();

    if (!query) {
      this.hasSearched = false;
      this.resetFoodResults();
      return;
    }

    const requestId = ++this.searchRequestId;

    this.isSearching = true;
    this.hasSearched = true;
    this.searchError = '';

    const params = new HttpParams()
      .set('q', query)
      .set('page', this.page)
      .set('page_size', this.pageSize);

    try {

      const response = await firstValueFrom(
        this.http
          .get<FoodSearchResponse>(
            `${this.apiUrl}/search`,
            { params },
          )
          .pipe(
            timeout({ first: 15000 }),
          ),
      );

      // Bỏ qua response của request cũ
      if (requestId !== this.searchRequestId) {
        return;
      }

      // Kiểm tra dữ liệu trả về
      if (!response || !Array.isArray(response.items)) {
        throw new Error('Dữ liệu trả về từ máy chủ không hợp lệ.');
      }

      // Chuẩn hóa dữ liệu để tránh null
      this.foods = response.items.map((food) => ({
        ...food,
        restaurants: Array.isArray(food.restaurants)
          ? food.restaurants
          : [],
      }));

      this.total = Number.isFinite(response.total)
        ? response.total
        : this.foods.length;

      const backendTotalPages = Number(response.total_pages);

      this.totalPages = backendTotalPages > 0
        ? backendTotalPages
        : Math.ceil(this.total / this.pageSize);

    } catch (error: unknown) {

      if (requestId !== this.searchRequestId) {
        return;
      }

      this.foods = [];
      this.total = 0;
      this.totalPages = 0;

      if (error instanceof TimeoutError) {

        this.searchError =
          'Máy chủ phản hồi quá chậm. Vui lòng kiểm tra backend và thử lại.';

      } else if (error instanceof HttpErrorResponse) {

        const body = error.error as {
          detail?: unknown;
          message?: unknown;
        } | null;

        const apiMessage =
          typeof body?.detail === 'string'
            ? body.detail
            : typeof body?.message === 'string'
              ? body.message
              : '';

        this.searchError =
          apiMessage ||
          'Không thể kết nối tới máy chủ. Vui lòng thử lại.';

      } else if (error instanceof Error) {

        this.searchError = error.message;

      } else {

        this.searchError =
          'Đã xảy ra lỗi khi tìm kiếm món ăn.';
      }

    } finally {

      // Chỉ request mới nhất được quyền tắt loading
      if (requestId === this.searchRequestId) {
        this.isSearching = false;
        this.changeDetector.markForCheck();
      }
    }
  }

  async changePage(page: number): Promise<void> {

    if (
      page < 1 ||
      page > this.totalPages ||
      page === this.page ||
      this.isSearching
    ) {
      return;
    }

    this.page = page;

    await this.searchFoods();
  }

  // ==========================================
  // QUICK SEARCH
  // ==========================================

  onQuickSearch(keyword: string): void {

    this.searchQuery = keyword;
    this.page = 1;

    void this.searchFoods();
  }

  // ==========================================
  // FOOD NAME FORMAT
  // ==========================================

  formatDishName(rawClassName: string): string {

    const normalized = rawClassName
      .toLowerCase()
      .replace(/_/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    return this.dishNameMap[normalized] || rawClassName;
  }

  restaurantDetailQuery(restaurant: FoodRestaurant): Record<string, string | number | null> {
    return {
      placeId: restaurant.osm_place?.place_id ?? null,
      name: restaurant.name,
      address: restaurant.address,
      latitude: restaurant.osm_place?.latitude ?? null,
      longitude: restaurant.osm_place?.longitude ?? null,
      openingHours: restaurant.osm_place?.opening_hours ?? null,
    };
  }

  // ==========================================
  // AI IMAGE DETECTION
  // ==========================================

  async analyzeImageWithAI(imageFile: File): Promise<void> {

    // Hủy request nhận diện trước đó nếu có
    this.predictionAbortController?.abort();

    const requestId = ++this.predictionRequestId;

    const controller = new AbortController();

    this.predictionAbortController = controller;

    this.isAnalyzing = true;
    this.searchStatus = 'AI đang phân tích hình ảnh món ăn...';

    this.selectedDishOrder = null;

    const formData = new FormData();

    formData.append('file', imageFile);

    // Giới hạn thời gian chờ AI
    const abortTimer = window.setTimeout(() => {
      controller.abort();
    }, 30000);

    let shouldSearch = false;

    try {

      const response = await fetch(this.predictUrl, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      if (requestId !== this.predictionRequestId) {
        return;
      }

      if (!response.ok) {

        const errorBody = await response
          .json()
          .catch(() => null);

        throw new Error(
          errorBody?.detail ||
          `Lỗi kết nối máy chủ (${response.status}).`,
        );
      }

      const data = await response.json() as PredictResponse;

      if (requestId !== this.predictionRequestId) {
        return;
      }

      if (!data || typeof data !== 'object') {
        throw new Error('Dữ liệu nhận diện không hợp lệ.');
      }

      // Chuẩn hóa danh sách món ăn
      const dishes = Array.isArray(data.dishes)
        ? data.dishes.map((dish) => ({
          ...dish,
          display_name: this.formatDishName(dish.class_name),
        }))
        : [];

      this.predictionResult = {
        ...data,
        dishes,
      };

      this.searchStatus = data.message || 'Hoàn tất phân tích hình ảnh.';

      if (data.success && dishes.length > 0) {

        // Mặc định chọn món có confidence cao nhất
        const bestDish = [...dishes].sort(
          (a, b) => b.confidence - a.confidence,
        )[0];

        this.selectedDishOrder = bestDish.order;

        this.searchQuery = bestDish.display_name;

        this.page = 1;

        shouldSearch = true;
      }

    } catch (error: unknown) {

      if (requestId !== this.predictionRequestId) {
        return;
      }

      this.predictionResult = null;

      if (error instanceof Error && error.name === 'AbortError') {

        this.searchStatus =
          'AI phản hồi quá chậm. Vui lòng thử lại với ảnh khác.';

      } else {

        this.searchStatus =
          error instanceof Error
            ? error.message
            : 'Không thể kết nối tới máy chủ nhận diện ảnh.';
      }

    } finally {

      window.clearTimeout(abortTimer);

      if (requestId === this.predictionRequestId) {

        this.isAnalyzing = false;

        this.predictionAbortController = null;
        this.changeDetector.markForCheck();
      }
    }

    // AI đã hoàn thành mới bắt đầu tìm món ăn
    if (
      requestId === this.predictionRequestId &&
      shouldSearch
    ) {
      await this.searchFoods();
    }
  }

  // ==========================================
  // SELECT DETECTED DISH
  // ==========================================

  selectDetectedDish(dish: DetectedDish): void {

    // Nhấn lại món đang chọn thì bỏ chọn
    if (this.selectedDishOrder === dish.order) {

      this.selectedDishOrder = null;

      this.searchQuery = '';

      this.page = 1;

      this.hasSearched = false;

      this.resetFoodResults();

      return;
    }

    this.selectedDishOrder = dish.order;

    this.searchQuery = dish.display_name;

    this.page = 1;

    void this.searchFoods();
  }

  isDishHighlighted(order: number): boolean {

    if (this.hoveredDishOrder !== null) {
      return this.hoveredDishOrder === order;
    }

    return (
      this.selectedDishOrder === null ||
      this.selectedDishOrder === order
    );
  }

  // ==========================================
  // IMAGE UPLOAD / PASTE
  // ==========================================

  onImageSelected(event: Event): void {

    const input = event.target;

    if (!(input instanceof HTMLInputElement)) {
      return;
    }

    const image = input.files?.[0];

    if (image?.type.startsWith('image/')) {
      this.setPastedImage(image);
    }

    // Cho phép chọn lại cùng một ảnh
    input.value = '';
  }

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent): void {

    const imageItem = Array.from(
      event.clipboardData?.items ?? [],
    ).find((item) => item.type.startsWith('image/'));

    const image = imageItem?.getAsFile();

    if (!image) {
      return;
    }

    event.preventDefault();

    this.setPastedImage(image);
  }

  private setPastedImage(image: File): void {

    // Giới hạn ảnh 10 MB
    if (image.size > 10 * 1024 * 1024) {

      this.searchStatus = 'Ảnh quá lớn. Vui lòng chọn ảnh nhỏ hơn 10 MB.';

      return;
    }

    this.clearImagePreview();

    this.pastedImage = image;

    this.imagePreviewUrl = URL.createObjectURL(image);

    this.predictionResult = null;

    this.selectedDishOrder = null;
    this.hoveredDishOrder = null;

    this.searchQuery = '';

    this.hasSearched = false;

    this.resetFoodResults();

    void this.analyzeImageWithAI(image);
  }

  removePastedImage(): void {

    // Hủy request AI đang chạy
    this.predictionAbortController?.abort();

    this.predictionAbortController = null;

    this.predictionRequestId++;

    this.isAnalyzing = false;

    this.clearImagePreview();

    this.pastedImage = null;

    this.predictionResult = null;

    this.selectedDishOrder = null;
    this.hoveredDishOrder = null;

    this.searchStatus = '';
  }

  private clearImagePreview(): void {

    if (!this.imagePreviewUrl) {
      return;
    }

    URL.revokeObjectURL(this.imagePreviewUrl);

    this.imagePreviewUrl = null;
  }

  // ==========================================
  // RESET
  // ==========================================

  private resetFoodResults(): void {

    // Vô hiệu hóa những request tìm kiếm cũ
    this.searchRequestId++;

    this.isSearching = false;

    this.searchError = '';

    this.foods = [];

    this.total = 0;
    this.totalPages = 0;
  }

  // ==========================================
  // DESTROY
  // ==========================================

  ngOnDestroy(): void {

    this.predictionAbortController?.abort();

    this.predictionRequestId++;

    this.searchRequestId++;

    this.clearImagePreview();
  }
}
