import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink
  ],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  private readonly router = inject(Router);

  identifier = '';
  password = '';

  showPassword = false;
  rememberMe = true;

  isLoading = false;
  loginSuccess = false;

  loginFormSubmitted = false;
  loginError = false;

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    this.loginFormSubmitted = true;

    if (!this.identifier || !this.password) {
      return;
    }

    this.isLoading = true;
    this.loginError = false;

    setTimeout(() => {
      this.isLoading = false;
      this.loginSuccess = true;

      setTimeout(() => {
        this.router.navigate(['/']);
      }, 700);
    }, 700);
  }

  loginWithGoogle(): void {
    console.log('Google Login');
  }
}
