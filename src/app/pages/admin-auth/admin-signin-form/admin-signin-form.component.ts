import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { LabelComponent } from '../../../shared/components/form/label/label.component';
import { InputFieldComponent } from '../../../shared/components/form/input/input-field.component';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {AuthManagementService} from "../../../core/services/auth/auth-managment.service";
import {ButtonComponent} from "../../../shared/components/ui/button/button.component";

@Component({
  selector: 'app-admin-signin-form',
  standalone: true,
  imports: [
    CommonModule,
    LabelComponent,
    InputFieldComponent,
    RouterModule,
    FormsModule,
    ButtonComponent,
  ],
  templateUrl: './admin-signin-form.component.html',
  styles: ``
})
export class AdminSigninFormComponent implements OnInit {
  showPassword = false;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  // Champs du formulaire - uniquement email et password
  email = '';
  password = '';

  constructor(
      private authManagement: AuthManagementService,
      private router: Router
  ) {}

  ngOnInit() {}

  togglePasswordVisibility() {
    if (!this.isLoading) {
      this.showPassword = !this.showPassword;
    }
  }

  // Validation du formulaire
  isFormValid(): boolean {
    return !!this.email?.trim() && !!this.password;
  }

  async onSubmit() {
    if (!this.isFormValid()) {
      this.errorMessage = 'Veuillez remplir tous les champs.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const loginData = {
      email: this.email.trim(),
      password: this.password
    };

    try {
      const result = await this.authManagement.login(loginData);

      if (result.success) {
        this.successMessage = 'Connexion réussie ! Redirection...';

        // Rediriger après un délai
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 1000);

      } else {
        this.errorMessage = this.getErrorMessage(result.error);
      }
    } catch (error) {
      this.errorMessage = 'Une erreur inattendue est survenue.';
      console.error('Erreur connexion admin:', error);
    } finally {
      this.isLoading = false;
    }
  }

  private getErrorMessage(error: string | undefined): string {
    const errorMap: { [key: string]: string } = {
      'Invalid login credentials': 'Email ou mot de passe incorrect.',
      'Invalid email': 'Adresse email invalide.',
      'Email not confirmed': 'Veuillez confirmer votre email.',
      'Network error': 'Erreur de connexion. Vérifiez votre internet.',
    };

    return errorMap[error || ''] || error || 'Erreur lors de la connexion.';
  }
}
