import { Component } from '@angular/core';
import { AuthPageLayoutComponent } from '../../../shared/layout/auth-page-layout/auth-page-layout.component';
import { SigninFormComponent } from '../../../shared/components/auth/signin-form/signin-form.component';
import {
  ResetPasswordFormComponent
} from "../../../shared/components/auth/reset-password-form/reset-password-form.component";

@Component({
  selector: 'app-sign-in',
  imports: [
    AuthPageLayoutComponent,
    SigninFormComponent,
    ResetPasswordFormComponent,
  ],
  templateUrl: './reset-password.component.html',
  styles: ``
})
export class ResetPasswordComponent {

}
