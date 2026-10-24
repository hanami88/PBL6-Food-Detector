import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AuditorActivity,
  DistrictStat,
  KpiStat,
  TrendLegend, UrgentTask
} from '../../../../models/admin-models/system-overview/system-overview.model';

@Component({
  selector: 'app-system-overview',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './system-overview.component.html',
})
export class SystemOverviewComponent {
  searchQuery: string = '';

  // --- 1. DỮ LIỆU KPI ---
  kpis: KpiStat[] = [
    {
      title: 'Tổng số quán ăn', value: '486', icon: 'restaurant',
      iconBgClass: 'bg-primary-fixed', iconColorClass: 'text-primary',
      trendText: '+12 quán mới tuần này', trendIcon: 'trending_up',
      progressValue: 94, progressBgClass: 'bg-secondary',
      subText: '94% đã kiểm định bởi dân bản địa Đà Nẵng'
    },
    {
      title: 'Tìm kiếm & Gợi ý AI', value: '128.4K', icon: 'smart_toy',
      iconBgClass: 'bg-secondary-container', iconColorClass: 'text-secondary',
      trendText: '+18.2% tăng trưởng tháng', trendIcon: 'arrow_upward',
      progressValue: 82, progressBgClass: 'bg-secondary',
      subText: 'Mì Quảng & Bánh xèo chiếm 58% truy vấn'
    },
    {
      title: 'Tra cứu AI Vision', value: '34.2K', icon: 'document_scanner',
      iconBgClass: 'bg-tertiary-fixed', iconColorClass: 'text-tertiary',
      trendText: 'Độ chính xác AI: 97.8%', trendIcon: 'verified',
      progressValue: 97.8, progressBgClass: 'bg-tertiary',
      subText: 'Tỷ lệ nhận diện món qua hình ảnh trực quan',
      subTextIcon: 'verified' // Dùng icon thay vì text thường ở phần trend
    },
    {
      title: 'Đánh giá thực khách', value: '1.842', icon: 'reviews',
      iconBgClass: 'bg-primary-fixed-dim/40', iconColorClass: 'text-primary',
      trendText: '96.5% đánh giá hợp lệ', trendIcon: 'check_circle',
      progressValue: 96.5, progressBgClass: 'bg-primary',
      subText: 'Lọc tự động 64 đánh giá spam & vi phạm'
    }
  ];

  // --- 2. DỮ LIỆU BIỂU ĐỒ & BẢN ĐỒ ---
  trendLegends: TrendLegend[] = [
    { label: 'Mì Quảng (+24%)', colorClass: 'bg-primary' },
    { label: 'Bánh xèo (+16%)', colorClass: 'bg-secondary' },
    { label: 'Bún mắm nêm (+9%)', colorClass: 'bg-tertiary' },
    { label: 'Hải sản tươi sống (+31%)', colorClass: 'bg-outline' }
  ];

  districts: DistrictStat[] = [
    { name: 'Quận Hải Châu (Trung tâm phố cổ ẩm thực)', percent: 42, count: 204, colorClass: 'text-primary', barClass: 'bg-primary' },
    { name: 'Quận Sơn Trà (Hải sản & ẩm thực đêm)', percent: 28, count: 136, colorClass: 'text-secondary', barClass: 'bg-secondary' },
    { name: 'Quận Ngũ Hành Sơn (Du lịch ven biển)', percent: 18, count: 88, colorClass: 'text-tertiary', barClass: 'bg-tertiary' },
    { name: 'Quận Thanh Khê (Đặc sản bình dân)', percent: 12, count: 58, colorClass: 'text-on-surface-variant', barClass: 'bg-outline-variant' }
  ];

  // --- 3. DỮ LIỆU TÁC VỤ KHẨN CẤP ---
  urgentTasks: UrgentTask[] = [
    {
      id: 1,
      containerClass: 'bg-surface-container-lowest hover:shadow-md',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAJvaxWWvNBtC9VQCPV6tz7b7YeH2zV-85Sv0gpV9Uvr3a0bVO1LtFiWXqL2wnYfGUxMU-s7wSf3Ifj8qTEXsZH_k1ZABedkSZIVAQutKBBKG_m51f-JYe2_F4eSWT6AMdwpUZHy-XopTWc80PKs4dLbxnigT5OavpJpl0fF1OPQcNCW6gXPOtR1UkBfdlUbsv9Ew9KUIqRmSEyZvdJgQnM8AbkP_okUnOXOsYhzV0oYXy41502b-uH',
      title: 'Mì Quảng Bà Vị - Chi nhánh 2',
      titleColorClass: 'text-on-surface',
      badge: 'Đã có VSATTP',
      badgeClass: 'bg-secondary-fixed text-on-secondary-fixed',
      description: '166 Lê Đình Dương, P. Phước Ninh, Q. Hải Châu',
      meta1: { icon: 'person', html: 'Thẩm định viên: <strong>Trần Quốc Dũng</strong>' },
      meta2: { icon: 'schedule', html: 'Hẹn kiểm tra: 14:30 Hôm nay', colorClass: 'text-primary font-semibold' },
      secondaryBtn: { label: 'Hồ sơ quán', class: 'bg-surface-container-high hover:bg-surface-variant text-on-surface' },
      primaryBtn: { label: 'Phê duyệt', class: 'bg-primary text-on-primary hover:bg-primary-container' }
    },
    {
      id: 2,
      containerClass: 'bg-surface-container-lowest hover:shadow-md',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD5-wXL2npV2VTSNDAoSzFkIwhd_hf1WYhqq8DpF7LZey-6DxlY5AtHuNx3yhr7xV3SXYFzepEHWj_fianhhlJWYzVcl3sDdM17XhSrCp__vbkrQEZa7EKOOXaNVm16lrnlyi6iLX4qJKcEgFycTW0Y2ZKFIehPfc89w56XvBPj_GtNejnkyhNGU-za7GeSjdMoNMHBrSTB807dl6PWXa7OdS4GSLvVBsZWDbzUYTaj7CUmxcDb_Se5',
      title: 'Hải Sản Bé Mặn Sơn Trà',
      titleColorClass: 'text-on-surface',
      badge: 'Đã có VSATTP',
      badgeClass: 'bg-secondary-fixed text-on-secondary-fixed',
      description: 'Lô 11 Võ Nguyên Giáp, Mân Thái, Sơn Trà',
      meta1: { icon: 'person', html: 'Thẩm định viên: <strong>Nguyễn Thị Mai</strong>' },
      meta2: { icon: 'schedule', html: 'Đã kiểm tra thực địa' },
      secondaryBtn: { label: 'Hồ sơ quán', class: 'bg-surface-container-high hover:bg-surface-variant text-on-surface' },
      primaryBtn: { label: 'Phê duyệt', class: 'bg-primary text-on-primary hover:bg-primary-container' }
    },
    {
      id: 3,
      containerClass: 'bg-surface-container-lowest hover:shadow-md',
      icon: 'payments',
      iconBgClass: 'bg-tertiary-fixed text-tertiary',
      title: 'Yêu cầu điều chỉnh menu giá: Bánh tráng cuốn thịt heo Đại Lộc',
      titleColorClass: 'text-on-surface',
      badge: 'Chờ xác thực',
      badgeClass: 'bg-tertiary-fixed text-on-tertiary-fixed',
      description: 'Chủ quán gửi đề xuất tăng suất đặc biệt từ 65.000đ → 75.000đ kèm hóa đơn đối chứng',
      meta1: { html: 'Đệ trình: 2 giờ trước bởi Quản lý quán', colorClass: 'text-on-surface-variant' },
      secondaryBtn: { label: 'Đối soát hóa đơn', class: 'bg-surface-container-high hover:bg-surface-variant text-on-surface' },
      primaryBtn: { label: 'Cập nhật giá', class: 'bg-secondary text-on-secondary hover:bg-on-secondary-container' }
    },
    {
      id: 4,
      containerClass: 'bg-error-container/20',
      icon: 'warning',
      iconBgClass: 'bg-error-container text-error',
      title: 'Cảnh báo AI Vision: Ảnh món ăn mờ / Chưa đạt chuẩn',
      titleColorClass: 'text-on-error-container',
      badge: 'Khẩn cấp',
      badgeClass: 'bg-error text-on-error',
      description: 'Ảnh món Bún Chả Cá Quy Nhơn tại Q. Thanh Khê có độ phân giải thấp và góc chụp bị che khuất',
      meta1: { html: 'Hệ thống AI từ chối lập chỉ mục tự động', colorClass: 'text-error font-semibold' },
      secondaryBtn: { label: 'Yêu cầu ảnh mới', class: 'bg-surface-container-lowest text-on-surface hover:bg-surface-container-high shadow-sm' },
      primaryBtn: { label: 'Xử lý thủ công', class: 'bg-error text-on-error hover:bg-on-error-container' }
    }
  ];

  // --- 4. DỮ LIỆU KIỂM ĐỊNH VIÊN ---
  auditors: AuditorActivity[] = [
    { id: 1, initials: 'NQ', name: 'Nguyễn Quốc Huy', time: '8 phút trước', avatarBgClass: 'bg-primary-fixed', avatarColorClass: 'text-primary', contentHtml: 'Đã hoàn thành đánh giá thực đơn nước lèo tại <strong>Bún Bò Huế Bà Thương</strong> (Q. Hải Châu). Điểm vị chuẩn: 9.6/10.' },
    { id: 2, initials: 'TH', name: 'Trần Thị Hương', time: '25 phút trước', avatarBgClass: 'bg-secondary-fixed', avatarColorClass: 'text-secondary', contentHtml: 'Tải lên bộ 12 ảnh thực tế khu vực bếp và giấy phép ATTP của <strong>Cơm Gà A Hải</strong>.' },
    { id: 3, initials: 'LM', name: 'Lê Minh Tuấn', time: '1 giờ trước', avatarBgClass: 'bg-tertiary-fixed', avatarColorClass: 'text-tertiary', contentHtml: 'Xác nhận cập nhật biểu phí gửi xe miễn phí cho thực khách tại <strong>Bánh Tráng Cuốn Thịt Heo Mậu</strong>.' }
  ];
}
