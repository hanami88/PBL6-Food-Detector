import { Component } from '@angular/core';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.component.html'
})
export class HomeComponent {

  public animateButton(event: MouseEvent): void {
    const button = event.currentTarget;

    if (!(button instanceof HTMLButtonElement)) {
      return;
    }

    if (
      button.classList.contains('bg-primary') ||
      button.classList.contains('bg-primary-fixed')
    ) {
      return;
    }

    button.style.transform = 'scale(0.96)';

    window.setTimeout(() => {
      button.style.transform = 'scale(1)';
    }, 150);
  }
}
