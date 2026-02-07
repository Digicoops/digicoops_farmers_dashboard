import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { LabelComponent } from '../../../shared/components/form/label/label.component';
import { CheckboxComponent } from '../../../shared/components/form/input/checkbox.component';
import { InputFieldComponent } from '../../../shared/components/form/input/input-field.component';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {AuthManagementService} from "../../../core/services/auth/auth-managment.service";
import {ButtonComponent} from "../../../shared/components/ui/button/button.component";

@Component({
  selector: 'app-admin-signup-form',
  standalone: true,
  imports: [
    CommonModule,
    LabelComponent,
    CheckboxComponent,
    InputFieldComponent,
    RouterModule,
    FormsModule,
    ButtonComponent,
  ],
  templateUrl: './admin-signup-form.component.html',
  styles: ``
})
export class AdminSignupFormComponent implements OnInit {
  showPassword = false;
  isChecked = false;
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
    return !!this.email?.trim() &&
        !!this.password &&
        this.password.length >= 8 &&
        this.isChecked;
  }

  async onSubmit() {
    if (!this.isFormValid()) {
      this.errorMessage = 'Veuillez remplir tous les champs obligatoires et accepter les conditions.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const signUpData = {
      first_name: 'Admin',
      last_name: 'User',
      shop_name: 'Admin Dashboard',
      shop_adresse: 'System Administration',
      profile: 'admin', // Rôle admin par défaut
      email: this.email.trim(),
      password: this.password,
      phone: '' // Pas de téléphone pour l'admin
    };

    try {
      const result = await this.authManagement.register(signUpData);

      if (result.success) {
        this.successMessage = 'Compte admin créé avec succès ! Redirection...';

        // Rediriger après un délai
        setTimeout(() => {
          this.router.navigate(['/admin/account-created'], {
            queryParams: { email: this.email }
          });
        }, 2000);

      } else {
        this.errorMessage = this.getErrorMessage(result.error);
      }
    } catch (error) {
      this.errorMessage = 'Une erreur inattendue est survenue.';
      console.error('Erreur inscription admin:', error);
    } finally {
      this.isLoading = false;
    }
  }

  private getErrorMessage(error: string | undefined): string {
    const errorMap: { [key: string]: string } = {
      'User already registered': 'Un compte existe déjà avec cet email.',
      'Invalid email': 'Adresse email invalide.',
      'Weak password': 'Le mot de passe est trop faible.',
      'Email not confirmed': 'Email non confirmé.',
      'Network error': 'Erreur de connexion. Vérifiez votre internet.',
    };

    return errorMap[error || ''] || error || 'Erreur lors de l\'inscription.';
  }
}
