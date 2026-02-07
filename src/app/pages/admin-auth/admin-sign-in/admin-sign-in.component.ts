import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminSigninFormComponent } from '../admin-signin-form/admin-signin-form.component';
import { AuthPageLayoutComponent } from '../../../shared/layout/auth-page-layout/auth-page-layout.component';

@Component({
  selector: 'app-admin-sign-in',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AdminSigninFormComponent,
    AuthPageLayoutComponent
  ],
  templateUrl: './admin-sign-in.component.html',
  styleUrls: ['./admin-sign-in.component.css']
})
export class AdminSignInComponent {
  constructor() { }
}
