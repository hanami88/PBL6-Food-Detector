import {Component, Input, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {Restaurant, SpecialtyTag, StatHighlight} from '../../../../models/admin-models/dashboard/dashboard.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {

  @Input() searchQuery: string = '';

  // --- 1. DỮ LIỆU THỐNG KÊ (STATS) ---
  stats: StatHighlight[] = [
    { label: 'Tổng quán trong cẩm nang', value: '486', trendText: '+12 quán tháng này', trendIcon: 'trending_up', icon: 'storefront', iconBgClass: 'bg-surface-container', iconColorClass: 'text-primary' },
    { label: 'Chuẩn vị bản địa (100%)', value: '412', trendText: 'Chiếm 84.7% danh bạ', trendIcon: '', icon: 'verified', iconBgClass: 'bg-secondary-container/40', iconColorClass: 'text-secondary', iconFill: true },
    { label: 'Đang chờ thẩm định', value: '28', trendText: '5 hồ sơ ưu tiên', trendIcon: 'priority_high', icon: 'pending_actions', iconBgClass: 'bg-tertiary-fixed/30', iconColorClass: 'text-tertiary' },
    { label: 'Điểm số bảo chứng TB', value: '4.74', subValue: '/5.0', trendText: 'Từ 48.2k đánh giá', trendIcon: '', icon: 'stars', iconBgClass: 'bg-primary-fixed', iconColorClass: 'text-primary', iconFill: true },
  ];

  // --- 2. DỮ LIỆU BỘ LỌC & TAGS ---
  districts = [
    'Quận Huyện: Tất cả (Đà Nẵng)',
    'Hải Châu (Trung tâm ẩm thực)',
    'Sơn Trà (Bán đảo & Hải sản)',
    'Ngũ Hành Sơn (Phố Tây & Chay)',
    'Thanh Khê (Món ăn dân dã)',
    'Cẩm Lệ (Bánh tráng cuốn thịt heo)',
    'Liên Chiểu & Hòa Vang'
  ];
  selectedDistrict = this.districts[1];

  statuses = [
    'Trạng thái: Tất cả',
    'Đã xác minh bản địa 100%',
    'Đang chờ thẩm định menu',
    'Cần tái thẩm định hương vị',
    'Tạm đóng cửa / Chuyển vị trí'
  ];
  selectedStatus = this.statuses[1];

  specialtyTags: SpecialtyTag[] = [
    { label: 'Tất cả món', isActive: true },
    { label: '🍜 Mì Quảng Phú Chiêm & Túy Loan', isActive: false },
    { label: '🥞 Bánh xèo nem lụi giòn', isActive: false },
    { label: '🐟 Bún chả cá nước trong', isActive: false },
    { label: '🦐 Hải sản xóm chài Mỹ Khê', isActive: false },
    { label: '🥩 Bánh tráng cuốn thịt heo hai đầu da', isActive: false },
    { label: '🌱 Ẩm thực Chay Đà Thành', isActive: false },
  ];

  // --- 3. DỮ LIỆU DANH SÁCH QUÁN ĂN ---
  restaurants: Restaurant[] = [
    {
      id: 1,
      name: 'Mì Quảng Bà Tư',
      address: '42 Trưng Nữ Vương, Q. Hải Châu',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC21UCafbalHcJr-oquNk6P8u-uhrwSran2zMme-T_V6DVEwtPx1m-wZbLev2osgPJYO6RWgyAMql89Y3RI6HNJJYN5XtX4_lF47CV91uoQj0im8bACPuwUF_h27c7HTatSJKdklM8FP4ZYml2TN5oCfJOpqbTb6knuFcHG3_5JytHU7enZ3xu2OxhnSlGT5Og-_PQLMTC5jnZiuvMSPN8PrkXpnAZZ9D_iiHee4DTkSqIMcnWXBiaU',
      rating: 4.8,
      reviewCount: 326,
      reviewLabel: 'khách địa phương',
      category: 'Mì Quảng tôm thịt trứng',
      priceRange: '35.000đ - 65.000đ',
      secret: 'Bí quyết: Nước nhưn đậm vị',
      matchScore: 92,
      matchLabel: 'Cực kỳ chuẩn',
      status: 'verified',
      heritage: 'Thế hệ thứ 2 • Kế thừa từ năm 1988',
      openHours: '06:00 - 21:00',
      gps: '16.0592° N, 108.2208° E',
      mapImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCwN9CFim78oDj7fT4xEEjp-e_cw_WdMszdckOVkVwAzKgr1ndizE0rNfsGn1jD5Mt2z36ATtl7gpGSfj09w5jJiGYri9Tvd9PqiD_56EKTNbLhCTSZXU69ltqHhB4vjJ-GrLntM2vpnPyP8uf_SdiDGBHaL2BnwxWpG319V5EV8EiZx6yN79wxAkcIZiT53Q5AcsGHAvPvtHac6VP2TWSNINMc6gndCAsPGlaTcm3G-qXrp7WoXyyF',
      ownerName: 'Bà Lê Thị Tươi (Bà Tư)',
      ownerPhone: '0905.284.xxx',
      ownerInitial: 'BT',
      tasteScore: 9.6,
      audits: [
        { date: '12/03/2024', title: 'Vòng 1: Kiểm tra nguồn gốc nước nhưn', description: 'Đạt chuẩn ninh xương heo & nước cốt tôm tự nhiên, không dùng phẩm màu hóa học.' },
        { date: '28/04/2024', title: 'Vòng 2: Phản hồi từ 50 Foodie bản xứ', description: 'Độ hài lòng đạt 96%. Rau sống búp chuối, cải non chuẩn nguồn rau Trà Quế.' }
      ]
    },
    {
      id: 2,
      name: 'Bếp Nhà Mận',
      address: '18 Võ Văn Kiệt, Q. Sơn Trà',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAz3W6Zu4LLyF6vsNteOIN2VnztxNs59p-e65svq_vyUWAlfF4wfhyg1Xvdj3nzOhCNUyO9xP95eJ0Ny-nPENNY3D6zc6IOC3PDXgmixg2jCB-vrF3IJ_-gLlM0Ouvp4GcYJeJ8yxKXqfSIZCNQ9gqtWkg1Ok6yMqPjG9UMZJqbL6dyysWJQWtKzK-SXejPqociXqg6K7pz-q6G4TlMbzHIwoC6L3PsUVzhRmd7sSOoi_X-sDrGsThR',
      rating: 4.7,
      reviewCount: 218,
      reviewLabel: 'khách',
      category: 'Bánh xèo tôm nhảy & Nem lụi',
      priceRange: '45.000đ - 90.000đ',
      secret: 'Vỏ giòn không dầu mỡ',
      matchScore: 89,
      matchLabel: 'Yêu thích cao',
      status: 'verified',
      heritage: 'Hoạt động từ năm 2015',
      openHours: '10:00 - 22:00',
      gps: '16.0611° N, 108.2322° E',
      mapImage: '',
      ownerName: 'Chị Mận',
      ownerPhone: '0935.123.xxx',
      ownerInitial: 'M',
      tasteScore: 8.9,
      audits: []
    },
    {
      id: 3,
      name: 'Bún Cá Cô Năm',
      address: '109 Nguyễn Chí Thanh, Hải Châu',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBi58okhH-U3tanhgsQyonZPwj0O4QyU-6Vou9Ff_kRW6eyENrPhTY8ALwLWxyomz_41Mw5M54MJ6HTVavKROwGzksY4DxhEgfEx9eT-37V9WxeQ0pY-nPBnymon1zg5r262s52CdWcrKBpmaUYjLR0xKOoZ0RRGCIPDLmKGtNXDJkj0kRQFJ9gYbc7VAa4ua3AvKJ8T94kWPEPlwVE3aSpDiBWuvyINj3eEi9AzAxggriX19aYCVl8',
      rating: 4.6,
      reviewCount: 174,
      reviewLabel: 'khách',
      category: 'Bún chả cá thu & cá ngừ',
      priceRange: '35.000đ - 55.000đ',
      secret: 'Nước dùng ngọt rau củ quả',
      matchScore: 88,
      matchLabel: 'Truyền thống',
      status: 'verified',
      heritage: 'Gia truyền 2 đời',
      openHours: '05:30 - 13:00',
      gps: '16.0682° N, 108.2238° E',
      mapImage: '',
      ownerName: 'Cô Năm',
      ownerPhone: '0912.456.xxx',
      ownerInitial: 'N',
      tasteScore: 8.8,
      audits: []
    },
    {
      id: 5,
      name: 'Quán Chay An Nhiên',
      address: '78 Châu Thị Vĩnh Tế, Ngũ Hành Sơn',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCUyvgPoYQek0RvB07GRWXRFwY5CYzQ_s2QkEOW2Gyyf8698aycBbuYQUmvmjPUiQnn0_Ynjh8MtYdOxsSeQKSpvdyMMBK3PRTQp2t4ERA83qqTDNmdfwHuUYP0oEHuZMkUJG8VlVtmYupyb9JwiOJd8YsI1vHaWCah43UDwD1gHnXdOtOBKWFEJQtuG1h2TsLPvrKL7yTtewybNgyZNTF61CFxNvUP11t2ajH9UtEAQelyXyWLhyAi',
      rating: 4.7,
      reviewCount: 145,
      reviewLabel: 'khách bản xứ',
      category: 'Lẩu nấm & Cơm chay thực dưỡng',
      priceRange: '30.000đ - 70.000đ',
      secret: 'Nguyên liệu rau củ organic',
      matchScore: 84,
      matchLabel: 'Đang test vị',
      status: 'pending',
      heritage: 'Mới mở 2023',
      openHours: '07:00 - 20:00',
      gps: '16.0355° N, 108.2431° E',
      mapImage: '',
      ownerName: 'Nguyễn Văn An',
      ownerPhone: '0988.999.xxx',
      ownerInitial: 'A',
      tasteScore: 8.4,
      audits: []
    }
  ];

  selectedRestaurant: Restaurant | null = null;

  ngOnInit() {
    // Select default restaurant
    if (this.restaurants.length > 0) {
      this.selectedRestaurant = this.restaurants[0];
    }
  }

  // --- 4. LOGIC METHODS ---
  selectSpot(restaurant: Restaurant) {
    this.selectedRestaurant = restaurant;
  }

  setSpecialtyTag(selectedTag: SpecialtyTag) {
    this.specialtyTags.forEach(tag => tag.isActive = false);
    selectedTag.isActive = true;
  }
}
