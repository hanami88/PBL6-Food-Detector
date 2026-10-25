import {Component, Input} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AiIngredient,
  PerformanceMetric, QualityPillar,
  UpcomingSample
} from '../../../../models/admin-models/ai-moderation/ai-moderation.model';


@Component({
  selector: 'app-ai-moderation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-moderation.component.html'
})
export class AiModerationComponent {
  @Input() searchQuery: string = '';

  // --- 1. SỐ LIỆU TỔNG QUAN (METRICS) ---
  metrics: PerformanceMetric[] = [
    {
      title: 'Độ chính xác mô hình', icon: 'verified', iconBg: 'bg-secondary-container/40', iconColor: 'text-secondary',
      value: '98.4%', trendIcon: 'trending_up', trendText: '+0.8%',
      progressValue: 98.4, progressBg: 'bg-secondary',
      subtitle: 'Dữ liệu kiểm thử F1-Score trên 42 món'
    },
    {
      title: 'Ảnh phân tích tuần này', icon: 'photo_camera', iconBg: 'bg-primary-fixed', iconColor: 'text-primary',
      value: '12.840', unit: 'ảnh',
      hasSparkline: true,
      subtitle: 'Tăng 22.4% so với tuần trước'
    },
    {
      title: 'Khớp đặc sản Đà Nẵng', icon: 'ramen_dining', iconBg: 'bg-tertiary-fixed', iconColor: 'text-tertiary',
      value: '96.2%', unit: '/ tổng danh mục',
      progressValue: 96.2, progressBg: 'bg-tertiary-container',
      subtitle: 'Mì Quảng, Bánh tráng thịt heo, Gỏi cá Nam Ô'
    },
    {
      title: 'Cần người thật can thiệp', icon: 'pan_tool', iconBg: 'bg-primary/10', iconColor: 'text-primary',
      value: '14', unit: 'mẫu chờ duyệt',
      isAlert: true,
      subtitle: 'Thời gian phản hồi trung bình: 4.2 phút',
      subtitleIcon: '4 ảnh thiếu góc chụp, 10 ảnh sai tag'
    }
  ];

  // --- 2. CHI TIẾT MẪU ĐANG DUYỆT (ACTIVE SAMPLE) ---
  activeSample = {
    id: '#IMG-84920',
    timeUpload: '3 phút trước',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDYePsGePJhYJiRJmw1gb1TZsp_bj98poq1VJUMGQcp5GJ-BRdPEo6NBzK1Mbx99rsXB5XgZWb5C7N55vIxKW0IdWs_8-wMf_f0iQRAdW_V7qZeSFOT5qpg29GJfCA9yHxR--MSBNCZy2B7OGlu5j-qFt7b7Crbr-NgXyeLtXqFaP-GCMcpNFSE7x0KLVqMvONzUGxS1FRNWxCx_XG7x3jGn8uM_zTJckOEEKnL4NkqFa97_4ukiTjP',
    device: 'iPhone 15 Pro • 48MP',
    location: 'Hải Châu, Đà Nẵng',
    resolution: '3024 × 4032 px',
    gps: '16.0678° N, 108.2208° E',
    detectionCount: 4,
    aiPrediction: {
      matchScore: 94.6,
      title: 'Mì Quảng Ếch',
      desc: 'Đặc sản vùng đất Quảng Nam - Đà Nẵng',
      venueMatch: { name: 'Mì Quảng Ếch Bếp Trang', score: 99.1, address: '441 Ông Ích Khiêm, Q. Hải Châu, Đà Nẵng' },
      altSuggestion: 'Mì Quảng Gà (4.1%)'
    }
  };

  ingredients: AiIngredient[] = [
    { name: 'Sợi mì vàng nghệ', percent: 98 },
    { name: 'Đậu phụng rang', percent: 96 },
    { name: 'Bánh tráng mè nướng', percent: 93 },
    { name: 'Rau cải con & bắp chuối', percent: 91 },
    { name: 'Thố ếch om sả ớt', percent: 89 }
  ];

  // --- 3. HÀNG ĐỢI TIẾP THEO (UPCOMING) ---
  upcomingSamples: UpcomingSample[] = [
    { title: 'Bánh Xèo Tôm Nhảy', subtitle: 'Bánh Xèo Bà Dưỡng', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBjSAWMbpUEu8XihUt1P_vohUgD5Ta9tej3UebXkyIW9TWSJe4_Sb753CEpm8n3h1h9I5wA94Uq2TwTqWrti8EA8qFyBpLg4IDReQVgUI3dLqi8QPANyDipOHdNkkuqduQB3Gx_BdpWr9KOQp5-5I5tEvInzrFId62P3BIia8hd9sPIfBNSSVXBVRv5A8BLW50oF4F7hlEMmt9y6FFFq5QKKC2QsjovpD8mamWAGWzArJ3V4NGJoMxJ', score: 98.1, scoreBg: 'bg-secondary text-on-secondary', status: 'Sẵn sàng', statusClass: 'text-secondary-container bg-secondary' },
    { title: 'Gỏi Cá Nam Ô (Ướt)', subtitle: 'Gỏi Cá Thanh Hương', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD5KYT4hegcV6QWI3ZnD69BcbsawWayy0VfD-l-KoG_3vjs5Z0gwoPpaUawMZ0NUXqPDKnxv1SelwTaO5HnZZILFAihF3foZqRClECGPuVaC9ZnsQEuf8HlIrS961gsLew8qK1pEokhTsXY6cf9qa1BdnQEwaF8ikuqS1KVnRfz1kOPDH_dOsh6ZG2vQOIwkVN_oKnVZOB58BDIY9vOHmTLF6qVTc8PXYkd7wkpAHmNoRgXzvIgHvgz', score: 87.5, scoreBg: 'bg-tertiary-container text-on-tertiary-container', status: 'Cần xem', statusClass: 'bg-tertiary-fixed text-on-tertiary-fixed' },
    { title: 'Bánh Tráng Cuốn Thịt Heo', subtitle: 'Quán Mậu - Đỗ Thúc Tịnh', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBxZtBRxoA6ayXoVsHIMcYxc2yfY_O0tZ0gQDIEmScxVjm-BgGmDcP0kfvLKh73CHcluq3ULIrO9QzkCVoRLz4QXixzHLorwOADzfUFtBv37_s8TzX6lE6YDCemsRM7rQMArQInl6f1muaNW4NPUDiBcicHexGEEnSShR4XdVhFsb2Mlmze_LKj84-HrNcfim93BPdwgsVv_JNiJ0U0y_uUHte6g1xmSsENQPyDvbet0mr2gSyAZb1c', score: 95.9, scoreBg: 'bg-secondary text-on-secondary', status: 'Sẵn sàng', statusClass: 'text-secondary-container bg-secondary' }
  ];

  // --- 4. TIÊU CHUẨN KIỂM ĐỊNH (PILLARS) ---
  pillars: QualityPillar[] = [
    { id: 1, title: 'Vị Nước Dùng Bản Sắc', weight: '35%', description: 'Nước nhưn (nước lèo) mì Quảng phải sắc nét, sánh vừa, đậm vị tôm thịt hoặc cá tràu, ngọt từ xương tự nhiên, không lạm dụng bột ngọt hóa chất.', tags: ['Thử mẫu mù (Blind-test)', 'Độ mặn/ngọt chuẩn'], iconBg: 'bg-primary/10', iconColor: 'text-primary' },
    { id: 2, title: 'Nguyên Liệu Miền Trung', weight: '25%', description: 'Rau sống phải có cải con cay nồng, bắp chuối sứ, húng lủi Trà Quế; mắm nêm cá cơm ủ thủ công từ làng chài truyền thống Nam Ô hoặc Cửa Đại.', tags: ['Có nguồn gốc rau', 'Mắm nêm ủ > 6 tháng'], iconBg: 'bg-tertiary/10', iconColor: 'text-tertiary' },
    { id: 3, title: 'Vệ Sinh & An Toàn (VSATTP)', weight: '20%', description: 'Khu vực chế biến ngăn nắp, tủ kính đậy kín món nấu, đũa muỗng tiệt trùng, nguồn nước sạch đạt chuẩn kiểm nghiệm y tế TP Đà Nẵng định kỳ.', tags: ['Giấy phép VSATTP', 'Găng tay chế biến'], iconBg: 'bg-secondary/10', iconColor: 'text-secondary' },
    { id: 4, title: 'Giá Niêm Yết Minh Bạch', weight: '20%', description: 'Tuyệt đối không có hành vi "chặt chém" du khách. Menu in rõ ràng, đồng giá cho khách địa phương và du khách quốc tế, quét mã thanh toán minh bạch.', tags: ['Bảng giá cố định', 'Hỗ trợ QR / VietQR'], iconBg: 'bg-primary-container/20', iconColor: 'text-primary-container' }
  ];
}
