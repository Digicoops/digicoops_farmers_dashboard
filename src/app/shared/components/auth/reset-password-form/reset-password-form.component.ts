import { CommonModule } from '@angular/common';
import {Component, OnInit} from '@angular/core';
import { LabelComponent } from '../../form/label/label.component';
import { CheckboxComponent } from '../../form/input/checkbox.component';
import { ButtonComponent } from '../../ui/button/button.component';
import { InputFieldComponent } from '../../form/input/input-field.component';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PhoneInputComponent } from "../../form/group-input/phone-input/phone-input.component";
import { AuthManagementService } from "../../../../core/services/auth/auth-managment.service";

@Component({
  selector: 'app-reset-password',
  imports: [
    CommonModule,
    LabelComponent,
    ButtonComponent,
    InputFieldComponent,
    RouterModule,
    FormsModule,
  ],
  templateUrl: './reset-password-form.component.html',
  styles: ``
})
export class ResetPasswordFormComponent implements OnInit {
  email = '';
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
      private authManagement: AuthManagementService,
      private router: Router
  ) {}

  ngOnInit(): void {
    // this.authManagement.logout();
  }

  async onResetPassword() {
    // Reset messages
    this.errorMessage = '';
    this.successMessage = '';

    // Validation de base
    if (!this.email) {
      this.errorMessage = 'Veuillez entrer votre adresse email';
      return;
    }

    // Validation email simple
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      this.errorMessage = 'Veuillez entrer une adresse email valide';
      return;
    }

    this.isLoading = true;

    try {
      // Appeler le service de réinitialisation par email
      const result = await this.authManagement.resetPassword(this.email);

      if (result.success) {
        this.successMessage = 'Un email de réinitialisation a été envoyé à votre adresse.';

        // Redirection après délai
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 3000);
      } else {
        this.errorMessage = result.error || 'Erreur lors de l\'envoi de l\'email de réinitialisation';
      }
    } catch (error) {
      this.errorMessage = 'Une erreur est survenue lors de la réinitialisation';
      console.error('Erreur reset password:', error);
    } finally {
      this.isLoading = false;
    }
  }
}