import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminSignupFormComponent } from '../admin-signup-form/admin-signup-form.component';
import { AuthPageLayoutComponent } from '../../../shared/layout/auth-page-layout/auth-page-layout.component';

@Component({
  selector: 'app-admin-sign-up',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AdminSignupFormComponent,
    AuthPageLayoutComponent
  ],
  templateUrl: './admin-sign-up.component.html',
  styleUrls: ['./admin-sign-up.component.css']
})
export class AdminSignUpComponent {
  constructor() { }
}
