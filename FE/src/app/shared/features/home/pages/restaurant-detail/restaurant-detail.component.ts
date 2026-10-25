import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface GalleryImage {
  src: string;
  alt: string;
}

export interface MenuItem {
  id: number;
  name: string;
  description: string;
  priceRange: string;
  image: string;
  badge?: string;
  badgeBgClass?: string;
}

export interface ReviewItem {
  id: number;
  author: string;
  authorInitial: string;
  avatarBgClass: string;
  avatarTextClass: string;
  authorInfo: string;
  rating: number;
  content: string;
  image?: string;
  helpfulCount: number;
}

export interface AspectRating {
  label: string;
  score: number; // Max 5.0
  percentage: number; // Score / 5 * 100
}

export interface ItineraryStop {
  time: string;
  title: string;
  note?: string;
  isActive?: boolean;
}

export interface SimilarRestaurant {
  id: number;
  name: string;
  image: string;
  rating: number;
  distance: string;
  priceRange: string;
}

export interface RestaurantDetailData {
  id: number;
  name: string;
  district: string;
  city: string;
  rating: number;
  reviewCount: number;
  priceRange: string;
  isOpen: boolean;
  openingHoursText: string;
  verifiedDate: string;
  address: string;
  isBookmarked: boolean;
  gallery: {
    mainImage: GalleryImage;
    subImages: GalleryImage[];
    totalPhotosCount: number;
  };
  weeklySchedule: { day: string; hours: string; isToday?: boolean }[];
  amenities: { iconClass: string; label: string; wrapperClass?: string }[];
  featuredMenu: MenuItem[];
  aspectRatings: AspectRating[];
  insiderTip: string;
  itinerary: ItineraryStop[];
  similarRestaurants: SimilarRestaurant[];
  reviews: ReviewItem[];
}

@Component({
  selector: 'app-restaurant-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './restaurant-detail.component.html',
})
export class RestaurantDetailComponent implements OnInit {
  // Cho phép truyền dữ liệu quán từ bên ngoài vào để TÁI SỬ DỤNG
  @Input() restaurant!: RestaurantDetailData;

  activeReviewFilter: string = 'all';

  ngOnInit(): void {
    // Nếu không nhận input từ bên ngoài, khởi tạo dữ liệu mặc định
    if (!this.restaurant) {
      this.restaurant = this.getDefaultRestaurantData();
    }
  }

  toggleBookmark(): void {
    this.restaurant.isBookmarked = !this.restaurant.isBookmarked;
  }

  setReviewFilter(filterType: string): void {
    this.activeReviewFilter = filterType;
  }

  // Tách riêng dữ liệu giả lập (Mock Data)
  private getDefaultRestaurantData(): RestaurantDetailData {
    return {
      id: 1,
      name: 'Mì Quảng Bà Tư (ví dụ)',
      district: 'Hải Châu',
      city: 'Đà Nẵng',
      rating: 4.8,
      reviewCount: 326,
      priceRange: '35.000đ – 65.000đ',
      isOpen: true,
      openingHoursText: '07:00 – 14:00',
      verifiedDate: '18/09/2024',
      address: '42 Trưng Nữ Vương, Quận Hải Châu, TP. Đà Nẵng',
      isBookmarked: false,
      gallery: {
        mainImage: {
          src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAnu5K41-8sJTUCq4-n7R48YgscZF6-WQCeO5ZRwtckR19-4xP3tEX-xs8yJCANDLuhfo6MM_en3zDXRI-auA-KEFe1DmHwaMBWR6FB0775wNmnucR1_qOUOEflJ38EPdbE0zR-j9rzYzFlSuNePpk_yay21K29pjQH10iiELQ_I9ycbq0ypkH_ihSLhu2QEr_0WgMFbltuvxKX2buyy9f60v-63-fJeW90ZCTL0hJugBS9XzM93ui2vQ',
          alt: 'Tô Mì Quảng Gà Đặc Biệt'
        },
        subImages: [
          { src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCGbi_ZYLtyUS45AuRbiBuA2aRbMCOXEmfXf6NUxpQnEMAQTp4HCqGcG07qMOOvfEyZSylZ6NHffLFKKcPjX4DYhgz4I-V41KcA244f3jdxuoV_hMNRK44l6gFjig_xtXSXHumltFnIbQa0N9eL2Q8ErKgIOyC9WKAa7FhzX1yTH5ZFZeAyd2HJDHp9VSVxmnYm2c1_BHDNx1JV3YVQf54HHAUYXsrVxGgH97nJuxv1vrOwm8l8t7jfuA', alt: 'Đĩa rau sống kèm bánh tráng' },
          { src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDIG-TnViGibvMMcw_Eqq8MwilQofTXIJSNBeucYSEadec84Vp6nYPkBKCSatAFbKwptgUXEBaD5p4DwvG2Afues0WH2MdS8kqlFTTOFKadwulNgxODMiDUsLPLtaU_zyROJJhnOUcMx3avmz6qfG_T8GFM6t3pwVgv2vwqy4N1u6cP2e4A6J8NBh_6K3SCsqhEGWSBJIpyNCCATvjFxE_vOBBnt8LP88dPRsxH7XXTduh__xDb6wOlWg', alt: 'Bánh bèo tôm thịt nướng' },
          { src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD1YWj9872qxOpeeRgzGIZ9tIl1RTpYWGvyWGaCAFHo48wI5vBSlJ9ID8ZttWXBlEEeKDhAke4Pt_eXbbu93bXqreVvich_tswXc4KOJBtbt3Po3Nx-c-EeagV9gFk7GJ5F91eqPfEPnMP3Vln1VhgnukTORiKvICzdWhlq_tWupDwDAzSQp-hZaeWZqMRFqeTH1fZPha5hW24JPi2ovdGVYq3uwtkPHJU_3M6LVGSdvMSD4oSno9Cw6w', alt: 'Món nướng than hoa' },
          { src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAtkjtoEknuxoCTT3dvcOXaqnPOue6P1L6ot4GRLrmAADHzg5H6NL9oNBLBChbI-90NQ7YbBlP7ZC0GozDbhHCRFVeoGaGQ7xjJ8hYl3WNR0pyoI9tyS_CjmKzfk8Eu3SXazeirJelIpQ7sJ9HPySd5jruJeugF_yg2Idfew7m03EKgp44_cESu3JXA57SIIS450FNRoYlIKwTdlvixUSl1p22cF1z-tWtATBXyZznFdpI55W7vsR4eTQ', alt: 'Tô bún và nước dùng gia truyền' }
        ],
        totalPhotosCount: 28
      },
      weeklySchedule: [
        { day: 'Thứ hai', hours: '07:00 – 14:00' },
        { day: 'Thứ ba (Hôm nay)', hours: '07:00 – 14:00', isToday: true },
        { day: 'Thứ tư', hours: '07:00 – 14:00' },
        { day: 'Thứ năm', hours: '07:00 – 14:00' },
        { day: 'Thứ sáu', hours: '07:00 – 14:00' },
        { day: 'Thứ bảy', hours: '07:00 – 14:00' },
        { day: 'Chủ nhật', hours: '07:00 – 14:00' }
      ],
      amenities: [
        { iconClass: 'fa-solid fa-snowflake text-sky-500', label: 'Điều hòa mát lạnh' },
        { iconClass: 'fa-solid fa-qrcode text-[#EE5A36]', label: 'Thanh toán QR Momo/VietQR' },
        { iconClass: 'fa-solid fa-language text-purple-600', label: 'Hỗ trợ tiếng Anh' },
        { iconClass: 'fa-solid fa-credit-card text-emerald-600', label: 'Thanh toán thẻ Visa/Master' },
        { iconClass: 'fa-solid fa-square-parking text-blue-600', label: 'Chỗ đỗ xe máy & ô tô gần quán' }
      ],
      featuredMenu: [
        {
          id: 1,
          name: 'Mì Quảng gà ta rút xương',
          description: 'Gà ta thả vườn ươm nghệ vàng óng, đậu phộng rang giòn.',
          priceRange: '35.000đ – 55.000đ',
          image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBizVpbrGMj51sk5qexmG3DdoN_bNiJOjpwvUmasIMXnaWThWE5WmFpQJeIr_h4OG73_tIUhGx7TReYHWPlf62HoB_38frHg015RTwRaSJlPXvcpti54V5mBYKFLYgtvRjoJmU6SRjSSm6VbIlERfEgMJwy8p_8D5-eblSvdgb3F5xSLCt9OJ9RNsEnJk7zlJFn623s_8h6kXxEhcFhR9fNwOCKFFhCoW35R5AK3IgDppu1a7LVmrCztg',
          badge: 'Bán chạy #1',
          badgeBgClass: 'bg-[#EE5A36]'
        },
        {
          id: 2,
          name: 'Bánh xèo tôm nhảy giòn rụm',
          description: 'Vỏ bánh giòn vàng, tôm đất tươi ngọt, ăn kèm rau rừng.',
          priceRange: '45.000đ – 65.000đ',
          image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDMdN6XZT_jkYKCwxTw1g-v-vlAZv69qqt-9ByYLrWfw84Bqqx3JPNCadsd5FpO_XLn4S5eJOsfKsP_AGYfxf3NmII2IJyks28y9x0LKIVPsH96QebZawbQLQpw2CxTo1hFcDioxKy1ESY4EFsniE6l4ZBYFgVZs3kwXdlYnp1n_iCHHdXIPqGfUzBDIr7qxE5tx7KvbCJpft-rmKvkcoYnRwLNGbVwp-RunJm7XxmwN0TYwVYkKQVEiw',
          badge: 'Món yêu thích',
          badgeBgClass: 'bg-amber-500'
        },
        {
          id: 3,
          name: 'Bún chả cá sông Hàn',
          description: 'Chả cá thu quết dai tự nhiên, nước lèo bí đỏ ngọt thanh.',
          priceRange: '35.000đ – 50.000đ',
          image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDOmMgt03cKR4_t72rTDLyjb9Y4CgTkxcW8KKccMFvLqMjF4yYb-xcgbQduWw-dazkfzlGMIOrybOhiuAUAfJWDlCUHn3zIr3gs4ZH_D5NGohbu6wb7MBWAT5AlvFIYALClFFqdFHHpuaNh4dY4EoOkzgHlr2xdaFEpMNlDaFI1lQZXtL_xJzJr0Teo7zWp3120YacCk_sKmeeIrFWhsFtPctzmcAjZgsn0EYnoCT3Z97exoFbcU0_xaw'
        }
      ],
      aspectRatings: [
        { label: 'Hương vị món ăn', score: 4.7, percentage: 94 },
        { label: 'Mức giá hợp lý', score: 4.8, percentage: 96 },
        { label: 'Thái độ phục vụ', score: 4.5, percentage: 90 },
        { label: 'Không gian & vệ sinh', score: 4.6, percentage: 92 }
      ],
      insiderTip: 'Du khách thường khen món nước dùng đậm ngọt thanh từ gà ta, rau ăn kèm tươi ngon. Thỉnh thoảng quán hơi đông vào giờ cao điểm sáng <strong class="text-[#1A1817]">(07:30 – 08:30)</strong>, bạn nên ghé sớm để có chỗ ngồi thư thả nhất.',
      itinerary: [
        { time: '07:30 Sáng', title: 'Ăn sáng đậm vị tại Mì Quảng Bà Tư', isActive: true },
        { time: '09:00 Sáng', title: 'Tham quan Bảo tàng Điêu khắc Chăm', note: '(Cách quán chỉ 600m đi bộ)', isActive: false },
        { time: '10:30 Trưa', title: 'Thưởng thức Cà phê ngắm sông Hàn', isActive: false }
      ],
      similarRestaurants: [
        {
          id: 101,
          name: 'Bếp Nhà Mận (Đặc sản Đà Nẵng)',
          image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC9QQ5g2XpbwBES0eqhHc_5kXZ6TASESobfnCDZK88LagYfTe7Lg4HT5QDAoeWhpk-gTDzqIctMZaTC6xrNrYXRHoYJQLbfDARm8GTHezQtFWpGorYmRne-YRKJLKKzQxG3CR7MmsMde-kglPsYiBsUfGhqIRx27FaTO6kFqWhgoVrsi49XhffkGOi5jfbGRjXXyxtidXBP1DuaWyrOexeOIeAZ3xUefeguhEloseKaaVbkOreFgnNXDQ',
          rating: 4.7,
          distance: '1.2 km',
          priceRange: '40.000đ – 75.000đ'
        },
        {
          id: 102,
          name: 'Bún Cá Cô Năm (Gia truyền)',
          image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB-BcJo1T42sNaupLoGDpDa94hHSTW9ehHftbA25QqEgl_e6xychH3upojfha3jtHoFRwTd3MMbOHYdVBMFzqcXHflzvzGqi4ObaLwePD7VeE9R-oON4YZo1GHuDszGqF4RPXQPVz8mWehKQnhEB6o6bO-J26qPxd8gLRMo5SXSFGhy915fKKq24qqZqRzuXQFBsqram8A3anPlvKgVYwq-Qe4nhVvlrHBxntXNH65CeP2TqQjdkOee1A',
          rating: 4.6,
          distance: '2.1 km',
          priceRange: '30.000đ – 50.000đ'
        }
      ],
      reviews: [
        {
          id: 1,
          author: 'Mặt Loz',
          authorInitial: 'ML',
          avatarBgClass: 'bg-orange-100',
          avatarTextClass: 'text-[#EE5A36]',
          authorInfo: 'Du khách từ Pháp • Đã dùng bữa tháng 09/2024',
          rating: 5.0,
          content: 'Món ăn đậm vị, nước lèo chan xăm xắp rất đúng điệu xứ Quảng. Bác chủ quán tuy lớn tuổi nhưng rất xởi lởi và hướng dẫn tỉ mỉ cách vắt chanh, bẻ bánh tráng nướng ăn kèm rau ghém xanh mướt!',
          image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBOszAF-osfHgSs0Ty4LhvrM3YAAg_Od9my5jNttjIxpYCHcQC3drVlO0tRLfAgrUaS2XiW6SogA--cMQGZkOTWmUOTFkMe7soedd0nbATB3TrF3DjN5vfOG84uynP2xc7GdKEK0RSYHVr-9KVTM7DX_51dHtLFw0HmgO0IHBSR8y0k2seT2u8l8gDCBsu2c0XtxHasky0ASfQvgkfKLEE3TP96YqREVul0HM2A-VpGGD5ZpZTXRB2-EQ',
          helpfulCount: 18
        },
        {
          id: 2,
          author: 'Cac',
          authorInitial: 'JK',
          avatarBgClass: 'bg-sky-100',
          avatarTextClass: 'text-sky-700',
          authorInfo: 'Du khách từ Úc • Đã dùng bữa tuần trước',
          rating: 4.8,
          content: 'Quán rất dễ tìm ngay trục đường Trưng Nữ Vương, phần ăn đầy đặn với gà ta chắc ngọt. Sáng sớm khoảng 8h hơi đông khách một chút nhưng đồ ăn lên rất nhanh và nóng hổi.',
          image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAm3l5OQOi5RT0CjctNdUIf8Zm5siI-1wz5m7tR6MXVHHvbi7KdIuVCGTXKXHcyfni86eBQS9y37pD4ytEe01bscqdPMNqgecSjr7xDfxTGgpgIKjDjFP8jrv9Z4NviUreDoJ2nGDnm1t5_iwsKrpyecRF4HS2uJ58tgAdGD1__UtlDhR6POnnEaIlxfOWfIsQ4vP6kKHNgdXC9KmNsIcHlxEu36ZCw5vCvIcxfqxZAdyVxNBMnT5etGw',
          helpfulCount: 12
        }
      ]
    };
  }
}
