import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './footer.component.html',
})
export class FooterComponent {
  currentYear: number = new Date().getFullYear();

  // Danh mục món ngon
  foodCategories: string[] = [
    'Mì Quảng truyền thống',
    'Bánh xèo & Nem lụi',
    'Bún mắm nêm đậm đà',
    'Hải sản bờ biển Mỹ Khê',
    'Ăn vặt & Chợ đêm Sơn Trà'
  ];

  // Danh mục lộ trình & tiện ích
  utilityLinks: string[] = [
    'Tour ăn sáng 24h',
    'Quán mở thâu đêm',
    'Sổ tay giao tiếp quán ăn',
    'Lưu danh sách yêu thích',
    'Bản đồ ẩm thực thông minh'
  ];

  // Danh mục giới thiệu
  aboutLinks: string[] = [
    'Câu chuyện ẩm thực',
    'Tiêu chí đánh giá quán',
    'Đóng góp địa điểm mới',
    'Điều khoản & Chính sách',
    'Liên hệ cộng tác'
  ];
}
