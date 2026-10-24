import { Component, HostListener, OnDestroy } from '@angular/core';
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

@Component({
  selector: 'app-food-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './food-search.component.html',
})
export class FoodSearchComponent implements OnDestroy {
  searchQuery: string = 'Mì Quảng, bánh xèo Hải Châu';
  pastedImage: File | null = null;
  imagePreviewUrl: string | null = null;
  searchStatus = '';
  selectedCategory: string = 'Tất cả món';
  selectedSort: string = 'Được đề xuất nhiều nhất';
  selectedRestaurantId: number = 1;

  categories: string[] = [
    'Tất cả món',
    'Mì Quảng',
    'Bánh xèo & Nem lụi',
    'Bún chả cá',
    'Hải sản tươi sống',
    'Cơm gà & Bún mắm',
    'Ăn vặt & Chè'
  ];

  sortOptions: string[] = [
    'Được đề xuất nhiều nhất',
    'Đánh giá cao nhất (★)',
    'Khoảng cách gần nhất',
    'Mức giá từ thấp đến cao'
  ];

  restaurants: Restaurant[] = [
    {
      id: 1,
      name: 'Mì Quảng Bà Tư',
      tag: 'Quán ruột địa phương',
      tagColorClass: 'bg-brand-primary/10 text-brand-primary',
      specialty: 'Mì Quảng ếch rút xương & Gà ta thả vườn củ nén',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDdgMxB368az3TY85FCHzs9Fdv7t5IaRmvFh21ZLMcXwhuIzXDd7-NnlccG0yaZI1bpHO8njrQGPEE460cvCxp-B_W9PKfulX0bp32ZMeMq3YxZDb2Jh80R_M9NroypQVSyex0PqiivFvZ99uWsiRvchxRj4yjsKbbIf5Xxpo-7lLsiKAXPoTn6uzOTFjV25cqlOpxkUV7s_NT97TPzuQSFJgveLZw9Z5nkeGBqTPGt_fki8cUuOcYvpg',
      statusText: 'Mở cửa • Đóng lúc 21:00',
      isOpen: true,
      isBookmark: false,
      rating: 4.8,
      reviewsCount: 326,
      priceRange: '35.000 – 65.000đ',
      address: '19 Trần Bình Trọng',
      distance: '0.8 km',
      highlightText: 'Nước nhưỡng sánh đậm vị, bánh tráng nướng giòn rụm',
      priceTag: 'Mì Bà Tư • 35k',
      topPercent: '32%',
      leftPercent: '24%'
    },
    {
      id: 2,
      name: 'Bếp Nhà Mận',
      tag: '',
      tagColorClass: '',
      specialty: 'Bánh xèo tôm nhảy vỏ giòn & Nem lụi nướng sả',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD01GIRjjSXeNMmcKUxKWaHYNo5s7qanzFtVfA-Jc1M-m_RU_BIVqB3UjwzH8h8-0FW_umR2azajbttbo6D08Xl_h02TCD5Z5V7odLLH6DAcVmHidULz6iIi8w8OtW7imSK_Yte9fwyOB-lebWy0cWaassPUp7o1yDcRwBcNkkBdqkk67F-U4uVpcvz3AzoWzK04lKtRDKljFT0RwDjN9XSQnSfbx1y7WH_8bAnYPnohlm9qAJQwf5rVg',
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
      leftPercent: '20%'
    },
    {
      id: 3,
      name: 'Bún Chả Cá Cô Năm',
      tag: 'Hơn 25 năm',
      tagColorClass: 'bg-emerald-50 text-emerald-700',
      specialty: 'Chả cá thu quết tay nguyên chất & Nước lèo bí đỏ, bắp cải ngọt thanh',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC3GPTelXlRXOM_SiRtm3kgS8lNuoft8fy-BZ9xcFF1deida4fWKPjga9Qt3lDB22hYVdwG0TzofUx_yqTBjLfs42oX_WFMJdtz63WXmkvzjZ2pZhJgG0pvftpZxntpdXFoudGVkdtnU8QYe8j9tZlpF4N7LSSSwANazPJqAjolJoMKkRoXojbMjaOQ0HUlsb5T2qNJ18QboGQpJZ1TmiDpGR-pysWv7JzSVHWq7oNd6qvnq9HgTAlneQ',
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
      leftPercent: '28%'
    },
    {
      id: 4,
      name: 'Hải Sản Gió Biển Quán',
      tag: '',
      tagColorClass: '',
      specialty: 'Chip chip hấp sả, mực một nắng nướng sa tế & lẩu hải sản',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAhYlquamk25zej9s8srpgYykRSAnkUgnMLs_O5GVvmCyCYJfTtuTVr1_0MBsNsyp2GTozpQncWwLkhGAvtrKOWStmcv9z9-QPBvHgqRh1fKStEExk00Rt2IqUMsnQc9_0_8S-suCTisPlo0H2-w0fB4ruNv_C4ZdlIIqanBOGFr6wwer9jl-iUD7_TR30TbD2LCD7NP3TXDXivNOaJ4JvOdqEQPv-uQ11XYJss0fStL8GsskL4HiqzKA',
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
      leftPercent: '88%'
    },
    {
      id: 5,
      name: 'Quán Cơm Chay An Nhiên',
      tag: '',
      tagColorClass: '',
      specialty: 'Cơm sen dưỡng sinh & Lẩu nấm thanh vị',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAihguEyU4PV45qyEKpU-UMZPhBYIY9x76tCIQRL4699ZGoUw7J0G5OLwrC_XTjs87j5KY7AQBkb-on55J8zt6vzHm43TQvhmN-vojmw1e-PHZOd7HKHuhyjVMWThi-g4qM0MQdVIoX6zrx7H6xwWw7MA5Lat4eWYKeGoXC28g3dKdNCrQkSBYjvuIn39xs3CUvMxZ0FLPm-1fF8jpbaA4cjlRej2PAYwyNPMYptMFxog1v93ljaaJPwg',
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
      leftPercent: '18%'
    }
  ];

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

  onSearch(): void {
    console.log('Tìm kiếm:', {
      query: this.searchQuery,
      image: this.pastedImage
    });

    this.searchStatus = this.pastedImage
      ? `Đã gửi ảnh "${this.pastedImage.name}" cùng từ khóa tìm kiếm. Cần kết nối API nhận diện ảnh để trả về kết quả.`
      : `Đang tìm kiếm: ${this.searchQuery}`;
  }

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent): void {
    const items = event.clipboardData?.items;
    if (!items) {
      return;
    }

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
    if (!(input instanceof HTMLInputElement)) {
      return;
    }

    const image = input.files?.[0];
    if (image) {
      this.setPastedImage(image);
    }
    input.value = '';
  }

  removePastedImage(): void {
    this.clearImagePreview();
    this.pastedImage = null;
    this.searchStatus = '';
  }

  ngOnDestroy(): void {
    this.clearImagePreview();
  }

  private setPastedImage(image: File): void {
    if (!image.type.startsWith('image/')) {
      return;
    }

    this.clearImagePreview();
    this.pastedImage = image;
    this.imagePreviewUrl = URL.createObjectURL(image);
    this.searchStatus = `Đã thêm ảnh "${image.name}". Nhấn Tìm kiếm để tiếp tục.`;
  }

  private clearImagePreview(): void {
    if (this.imagePreviewUrl) {
      URL.revokeObjectURL(this.imagePreviewUrl);
      this.imagePreviewUrl = null;
    }
  }

  getSelectedRestaurant(): Restaurant | undefined {
    return this.restaurants.find(r => r.id === this.selectedRestaurantId);
  }
}
