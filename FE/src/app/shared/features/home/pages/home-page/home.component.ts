import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

interface HomeFood {
  id: number;
  name: string;
  description: string | null;
  category: string | null;
  image_url: string | null;
  average_price: number | null;
  average_rating: number | null;
  review_count: number;
  restaurants: Array<{ id: number; name: string; address: string; price: number | null }>;
}

interface HomeRestaurant {
  id: number;
  slug: string;
  name: string;
  address: string;
  district: string | null;
  image_url: string | null;
  latitude: number | null;
  longitude: number | null;
  average_rating: number | null;
  review_count: number;
  min_price: number | null;
  distance_km: number | null;
  maps_url: string | null;
}

interface FeaturedPlace {
  id: string;
  name: string;
  address: string;
  foodName: string;
}

interface HomepageResponse {
  featured_foods: HomeFood[];
  popular_foods: HomeFood[];
  nearby_restaurants: HomeRestaurant[];
  restaurant_count: number;
  district: string | null;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './home.component.html',
})
export class HomeComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apiUrl = 'http://localhost:8000/api/foods/homepage';
  private requestId = 0;
  private locationRequestId = 0;

  searchQuery = '';
  selectedDistrict = '';
  readonly districts = ['', 'Hải Châu', 'Sơn Trà', 'Ngũ Hành Sơn', 'Thanh Khê', 'Cẩm Lệ', 'Liên Chiểu'];
  featuredFoods: HomeFood[] = [];
  popularFoods: HomeFood[] = [];
  nearbyRestaurants: HomeRestaurant[] = [];
  restaurantCount = 0;
  isLoading = true;
  isLocating = false;
  errorMessage = '';
  locationMessage = '';

  ngOnInit(): void {
    this.requestLocation(false);
  }

  get featuredPlaces(): FeaturedPlace[] {
    const seen = new Set<string>();
    return this.featuredFoods
      .flatMap((food) =>
        food.restaurants.map((restaurant) => ({
          id: `${food.id}-${restaurant.id}`,
          name: restaurant.name,
          address: restaurant.address,
          foodName: food.name,
          key: `${restaurant.name}|${restaurant.address}`.toLocaleLowerCase(),
        })),
      )
      .filter((place) => {
        if (seen.has(place.key)) return false;
        seen.add(place.key);
        return true;
      })
      .slice(0, 6)
      .map(({ key: _key, ...place }) => place);
  }

  async loadHomepage(latitude?: number, longitude?: number): Promise<void> {
    const requestId = ++this.requestId;
    this.isLoading = true;
    this.errorMessage = '';
    let params = new HttpParams();
    if (this.selectedDistrict) params = params.set('district', this.selectedDistrict);
    if (latitude !== undefined && longitude !== undefined) {
      params = params.set('latitude', latitude).set('longitude', longitude);
    }

    try {
      const response = await firstValueFrom(
        this.http.get<HomepageResponse>(this.apiUrl, { params }),
      );
      if (requestId !== this.requestId) return;
      this.featuredFoods = response.featured_foods;
      this.popularFoods = response.popular_foods;
      this.nearbyRestaurants = response.nearby_restaurants;
      this.restaurantCount = response.restaurant_count;
    } catch (error: unknown) {
      if (requestId !== this.requestId) return;
      this.errorMessage = error instanceof HttpErrorResponse
        ? error.error?.detail || 'Không thể tải dữ liệu địa điểm. Vui lòng thử lại.'
        : 'Không thể tải dữ liệu địa điểm. Vui lòng thử lại.';
      this.featuredFoods = [];
      this.popularFoods = [];
      this.nearbyRestaurants = [];
      this.restaurantCount = 0;
    } finally {
      if (requestId === this.requestId) this.isLoading = false;
    }
  }

  submitSearch(query = this.searchQuery): void {
    const normalizedQuery = query.trim();
    void this.router.navigate(['/food-search'], {
      queryParams: { q: normalizedQuery || null },
    });
  }

  selectDistrict(district: string): void {
    this.locationRequestId++;
    this.isLocating = false;
    this.selectedDistrict = district;
    this.locationMessage = '';
    void this.loadHomepage();
  }

  findNearby(): void {
    this.requestLocation(true);
  }

  private requestLocation(showFailureMessage: boolean): void {
    const locationRequestId = ++this.locationRequestId;
    if (!navigator.geolocation) {
      this.isLocating = false;
      if (showFailureMessage) {
        this.locationMessage = 'Trình duyệt không hỗ trợ xác định vị trí.';
      } else {
        this.locationMessage = 'Không thể lấy vị trí; đang hiển thị quán ăn tại Đà Nẵng.';
        void this.loadHomepage();
      }
      return;
    }
    this.locationMessage = '';
    this.isLocating = true;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (locationRequestId !== this.locationRequestId) return;
        this.isLocating = false;
        this.selectedDistrict = '';
        const { latitude, longitude } = position.coords;
        const isInDaNang = latitude >= 15.95 && latitude <= 16.15
          && longitude >= 108.12 && longitude <= 108.32;
        this.locationMessage = isInDaNang
          ? 'Đã sắp xếp quán theo khoảng cách từ vị trí của bạn.'
          : 'Bạn đang ngoài khu vực Đà Nẵng; đang hiển thị ngẫu nhiên các quán tại Đà Nẵng.';
        void this.loadHomepage(latitude, longitude);
      },
      () => {
        if (locationRequestId !== this.locationRequestId) return;
        this.isLocating = false;
        this.locationMessage = showFailureMessage
          ? 'Không thể lấy vị trí. Hãy cho phép truy cập vị trí hoặc chọn quận.'
          : 'Không thể lấy vị trí; đang hiển thị quán ăn tại Đà Nẵng.';
        if (!showFailureMessage) void this.loadHomepage();
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 },
    );
  }

  formatPrice(price: number | null): string {
    if (price === null) return 'Giá đang cập nhật';
    return `${new Intl.NumberFormat('vi-VN').format(price)}đ`;
  }

  openRestaurant(restaurant: HomeRestaurant): void {
    this.openPlace(restaurant.name, restaurant.address);
  }

  openPlace(name: string, address: string): void {
    const params = new URLSearchParams({
      api: '1',
      query: `${name}, ${address}`,
    });
    window.open(`https://www.google.com/maps/search/?${params.toString()}`, '_blank', 'noopener,noreferrer');
  }
}
