import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface Benefit {
  icon: string;
  iconBgClass: string;
  iconColorClass: string;
  title: string;
  description: string;
}

export interface TastePreference {
  emoji: string;
  label: string;
  selected: boolean;
}

export interface EditorialPerk {
  icon: string;
  iconBgClass: string;
  iconColorClass: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './signup.component.html',
})
export class SignupComponent {
  // --- 1. DỮ LIỆU RENDER (TÁI SỬ DỤNG) ---

  brandName = 'DaNang';
  brandSlogan = 'Bắt đầu hành trình khám phá ẩm thực Đà Nẵng đích thực';
  brandDesc = 'Vượt qua những quán bẫy du khách. Kết nối trực tiếp với vị giác xứ Quảng từ các hàng quán gia truyền, ngõ hẻm và chợ đêm bản địa.';

  benefits: Benefit[] = [
    {
      icon: 'verified',
      iconBgClass: 'bg-primary/15',
      iconColorClass: 'text-primary',
      title: '100% kiểm chứng bởi dân bản địa',
      description: 'Không chạy quảng cáo, không xếp hạng trả phí. Từng tô mì Quảng, đĩa bánh xèo đều được thẩm định độc lập.'
    },
    {
      icon: 'tune',
      iconBgClass: 'bg-tertiary-container/20',
      iconColorClass: 'text-tertiary',
      title: 'Gợi ý chuẩn xác theo khẩu vị & ngân sách',
      description: 'Tuỳ biến theo mức ăn cay, kiêng hải sản, túi tiền chỉ từ 30.000đ cho tới nhà hàng hải sản ven biển chuẩn tươi sống.'
    },
    {
      icon: 'route',
      iconBgClass: 'bg-secondary-container/50',
      iconColorClass: 'text-secondary',
      title: 'Lập lộ trình ẩm thực chỉ với 1 chạm',
      description: 'Tối ưu tuyến đường di chuyển qua Hải Châu, Sơn Trà, Ngũ Hành Sơn mượt mà theo từng bữa Sáng - Trưa - Xế - Tối.'
    }
  ];

  tastePreferences: TastePreference[] = [
    { emoji: '🌶️', label: 'Thích ăn cay nồng', selected: false },
    { emoji: '🐟', label: 'Đam mê mắm nêm', selected: false },
    { emoji: '🦐', label: 'Nghiện hải sản đêm', selected: false },
    { emoji: '🌱', label: 'Ăn chay thanh đạm', selected: false }
  ];

  perks: EditorialPerk[] = [
    {
      icon: 'map',
      iconBgClass: 'bg-primary/10',
      iconColorClass: 'text-primary',
      title: 'Bản đồ offline',
      description: 'Xem toạ độ quán ngay cả khi mất sóng 4G'
    },
    {
      icon: 'translate',
      iconBgClass: 'bg-tertiary-container/15',
      iconColorClass: 'text-tertiary',
      title: 'Cẩm nang gọi món',
      description: 'Mẫu câu tiếng bản địa "không cay", "ít đường"'
    },
    {
      icon: 'savings',
      iconBgClass: 'bg-secondary-container/40',
      iconColorClass: 'text-secondary',
      title: 'Thẻ ăn uống tiết kiệm',
      description: 'Giảm 10 - 20% tại 80+ đối tác chọn lọc'
    }
  ];

  // --- 2. STATE LOGIC FORM ---

  formData = {
    fullname: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false
  };

  showPassword = false;
  showConfirmPassword = false;

  passwordStrengthLabel = 'Ít nhất 8 ký tự';
  passwordStrengthLabelClass = 'font-label-xs text-label-xs text-outline';

  submitState: 'idle' | 'loading' | 'success' = 'idle';
  errorMessage = '';

  // --- 3. METHODS LOGIC ---

  toggleTaste(taste: TastePreference): void {
    taste.selected = !taste.selected;
  }

  onPasswordInput(val: string): void {
    let strength = 0;
    if (val.length >= 8) strength++;
    if (/[A-Z]/.test(val)) strength++;
    if (/[0-9]/.test(val)) strength++;
    if (/[^A-Za-z0-9]/.test(val)) strength++;

    if (val.length === 0) {
      this.passwordStrengthLabel = 'Ít nhất 8 ký tự';
      this.passwordStrengthLabelClass = 'font-label-xs text-label-xs text-outline';
    } else if (val.length < 8) {
      this.passwordStrengthLabel = 'Quá ngắn (dưới 8 ký tự)';
      this.passwordStrengthLabelClass = 'font-label-xs text-label-xs text-error font-semibold';
    } else if (strength <= 2) {
      this.passwordStrengthLabel = 'Độ mạnh: Trung bình';
      this.passwordStrengthLabelClass = 'font-label-xs text-label-xs text-tertiary font-semibold';
    } else if (strength === 3) {
      this.passwordStrengthLabel = 'Độ mạnh: Khá tốt';
      this.passwordStrengthLabelClass = 'font-label-xs text-label-xs text-secondary font-semibold';
    } else {
      this.passwordStrengthLabel = 'Độ mạnh: Rất an toàn';
      this.passwordStrengthLabelClass = 'font-label-xs text-label-xs text-secondary font-bold';
    }
  }

  getMeterClass(barIndex: number): string {
    const val = this.formData.password;
    if (!val || val.length === 0) return 'bg-surface-container-high';

    if (val.length < 8) {
      return barIndex === 1 ? 'bg-error' : 'bg-surface-container-high';
    }

    let strength = 0;
    if (val.length >= 8) strength++;
    if (/[A-Z]/.test(val)) strength++;
    if (/[0-9]/.test(val)) strength++;
    if (/[^A-Za-z0-9]/.test(val)) strength++;

    if (strength <= 2) {
      return barIndex <= 2 ? 'bg-tertiary-container' : 'bg-surface-container-high';
    } else if (strength === 3) {
      return barIndex <= 3 ? 'bg-secondary' : 'bg-surface-container-high';
    } else {
      return 'bg-secondary'; // 4 vạch
    }
  }

  onSubmit(): void {
    if (this.formData.password !== this.formData.confirmPassword) {
      this.errorMessage = 'Mật khẩu xác nhận không khớp! Vui lòng kiểm tra lại.';
      return;
    }

    this.errorMessage = '';
    this.submitState = 'loading';

    // Giả lập call API 1 giây
    setTimeout(() => {
      this.submitState = 'success';
      console.log('Form Submitted Data:', this.formData, 'Tastes:', this.tastePreferences.filter(t => t.selected));
    }, 1000);
  }
}
