import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {RouterOutlet} from '@angular/router';

export interface NavItem {
  icon: string;
  label: string;
  path: string;
  isActive: boolean;
}

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterOutlet],
  templateUrl: './admin-layout.component.html'
})
export class AdminLayoutComponent {
  // Nhận keyword tìm kiếm từ bên ngoài (nếu cần sync với component con)
  @Input() searchQuery: string = '';

  // Dữ liệu User
  userName = 'Lê Hoàng Nam';
  userRole = 'Quản trị viên trưởng';

  // Dữ liệu Menu
  navItems: NavItem[] = [
    { icon: 'dashboard', label: 'Tổng quan hệ thống', path: 'tong-quan-he-thong', isActive: false },
    { icon: 'storefront', label: 'Quản lý quán ăn', path: 'quan-ly-quan-an', isActive: true },
    { icon: 'fact_check', label: 'Duyệt món & Kiểm định', path: 'duyet-mon-kiem-dinh', isActive: false },
    { icon: 'rate_review', label: 'Quản lý đánh giá', path: 'quan-ly-danh-gia', isActive: false },
    { icon: 'settings', label: 'Cài đặt hệ thống', path: 'cai-dat-he-thong', isActive: false },
  ];
}
