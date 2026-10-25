import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterLink} from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './header.component.html',
})
export class HeaderComponent {
  currentLang: 'VIE' | 'ENG' = 'VIE';

  // Chuyển đổi ngôn ngữ
  switchLanguage(lang: 'VIE' | 'ENG'): void {
    this.currentLang = lang;
  }
}
