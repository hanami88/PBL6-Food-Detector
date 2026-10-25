import { Routes } from '@angular/router';
import {MainLayoutComponent} from './shared/layout/main-layout/main-layout.component';
import {AdminLayoutComponent} from './shared/layout/admin-layout/admin-layout.component';
import {DashboardComponent} from './shared/features/admin/page/dashboard/dashboard.component';

export const routes: Routes = [
  {
    path: 'auth/login',
    loadComponent: () =>
      import('./shared/features/auth/pages/login/login.component')
        .then(m => m.LoginComponent)
  },
  {
    path:'',
    component:MainLayoutComponent,
    children:[
      {
        path : 'home',
        loadComponent: () =>
          import('./shared/features/home/pages/home-page/home.component')
            .then(m => m.HomeComponent)
      },
      {
        path:'food-search',
        loadComponent: () =>
          import('./shared/features/home/pages/food-search/food-search.component')
            .then(m => m.FoodSearchComponent)
      },
      {
        path:'restaurant',
        loadComponent: () =>
          import('./shared/features/home/pages/restaurant-detail/restaurant-detail.component')
            .then(m => m.RestaurantDetailComponent)
      },
      {
        path:'signup',
        loadComponent: () =>
          import('./shared/features/auth/pages/signup/signup.component')
            .then(m => m.SignupComponent)
      }

    ]
  },
  {
    path:'admin',
    component:AdminLayoutComponent,
    children:[
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./shared/features/admin/page/dashboard/dashboard.component')
            .then(m => m.DashboardComponent)
      },
      {
        path:'ai-moderation',
        loadComponent: () =>
          import('./shared/features/admin/page/ai-moderation/ai-moderation.component')
            .then(m => m.AiModerationComponent)
      },
      {
        path:'system-overview',
        loadComponent: () =>
          import('./shared/features/admin/page/system-overview/system-overview.component')
            .then(m => m.SystemOverviewComponent)
      }

    ]
  }
];
