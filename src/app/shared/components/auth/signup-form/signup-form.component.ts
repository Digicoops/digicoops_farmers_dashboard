import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { LabelComponent } from '../../form/label/label.component';
import { CheckboxComponent } from '../../form/input/checkbox.component';
import { InputFieldComponent } from '../../form/input/input-field.component';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Option, SelectComponent } from "../../form/select/select.component";
import { PhoneInputComponent } from "../../form/group-input/phone-input/phone-input.component";
import {AuthManagementService} from "../../../../core/services/auth/auth-managment.service";
import {ButtonComponent} from "../../ui/button/button.component";
import {PhoneFormatPipe} from "../../../../core/pipe/phone-format.pipe";

@Component({
  selector: 'app-signup-form',
  imports: [
    CommonModule,
    LabelComponent,
    CheckboxComponent,
    InputFieldComponent,
    RouterModule,
    FormsModule,
    SelectComponent,
    PhoneInputComponent,
    ButtonComponent,
    PhoneFormatPipe // Ajouté dans imports, PAS dans providers
  ],
  templateUrl: './signup-form.component.html',
  styles: ``
})
export class SignupFormComponent implements OnInit {
  showPassword = false;
  isChecked = false;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  // Champs du formulaire
  fname = '';
  lname = '';
  shopName = '';
  email = '';
  password = '';
  phone = '';
  displayPhone = '';

  @Input() options: Option[] = [
    { value: 'personal', label: 'Particulier' },
    { value: 'cooperative', label: 'Cooperative' },
  ];

  selectedValue: string = 'personal';
  countries = [{ code: 'SN', label: '+221' }];

  constructor(
      private authManagement: AuthManagementService,
      private router: Router,
      // RETIREZ l'injection du pipe ici
  ) {}

  ngOnInit() {}

  handleSelectChange(value: string) {
    this.selectedValue = value;
  }

  togglePasswordVisibility() {
    if (!this.isLoading) {
      this.showPassword = !this.showPassword;
    }
  }

  handlePhoneNumberChange(phoneNumber: string) {
    // Format reçu depuis le composant phone-input
    this.phone = phoneNumber.replace(/\s+/g, ''); // Enlever les espaces pour le stockage
    this.displayPhone = phoneNumber; // Garder la version formatée pour l'affichage
  }

  // Méthode pour formater le téléphone sans injection du pipe
  formatPhoneNumber(phone: string): string {
    // Logique de formatage directe sans pipe
    if (!phone) return '';

    const cleanPhone = phone.replace(/\D/g, '');

    // Format Sénégal: 77 660 61 06
    if (cleanPhone.length <= 2) {
      return cleanPhone;
    } else if (cleanPhone.length <= 5) {
      return `${cleanPhone.substring(0, 2)} ${cleanPhone.substring(2)}`;
    } else if (cleanPhone.length <= 7) {
      return `${cleanPhone.substring(0, 2)} ${cleanPhone.substring(2, 5)} ${cleanPhone.substring(5)}`;
    } else {
      return `${cleanPhone.substring(0, 2)} ${cleanPhone.substring(2, 5)} ${cleanPhone.substring(5, 7)} ${cleanPhone.substring(7, 9)}`;
    }
  }

  // Méthode pour gérer le changement direct si vous avez un input séparé
  onPhoneInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const rawValue = input.value;

    // Nettoyer pour garder uniquement les chiffres
    const cleanValue = rawValue.replace(/\D/g, '');

    // Limiter à 9 chiffres pour le Sénégal
    const limitedValue = cleanValue.slice(0, 9);

    // Stocker la version non formatée
    this.phone = limitedValue;

    // Formater pour l'affichage
    this.displayPhone = this.formatPhoneNumber(limitedValue);

    // Mettre à jour la valeur de l'input
    input.value = this.displayPhone;
  }

  // Méthode pour valider le format du téléphone
  isValidPhoneFormat(): boolean {
    if (!this.phone) return true; // Vide est valide (optionnel)

    // Format Sénégal: 77xxxxxxx, 78xxxxxxx, 76xxxxxxx, 70xxxxxxx, 33xxxxxxx
    const phoneRegex = /^(77|78|76|70|33)\d{7}$/;
    return phoneRegex.test(this.phone.replace(/\s+/g, ''));
  }

  // Validation du formulaire
  isFormValid(): boolean {
    return !!this.fname?.trim() &&
        !!this.lname?.trim() &&
        !!this.email?.trim() &&
        !!this.shopName?.trim() &&
        !!this.password &&
        this.password.length >= 8 &&
        this.isChecked &&
        (!this.phone || this.isValidPhoneFormat()); // Téléphone optionnel mais doit être valide s'il est rempli
  }

  async onSubmit() {
    if (!this.isFormValid()) {
      if (this.phone && !this.isValidPhoneFormat()) {
        this.errorMessage = 'Format de téléphone invalide. Utilisez un numéro sénégalais (ex: 77 660 61 06)';
      } else {
        this.errorMessage = 'Veuillez remplir tous les champs obligatoires et accepter les conditions.';
      }
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const signUpData = {
      first_name: this.fname.trim(),
      last_name: this.lname.trim(),
      shop_name: this.shopName.trim(),
      profile: this.selectedValue,
      email: this.email.trim(),
      password: this.password,
      phone: this.phone // Version sans espaces pour l'API
    };

    try {
      const result = await this.authManagement.register(signUpData);

      if (result.success) {
        this.successMessage = 'Compte créé avec succès ! Redirection...';

        // Rediriger après un délai
        setTimeout(() => {
          this.router.navigate(['/account-created'], {
            queryParams: { email: this.email }
          });
        }, 2000);

      } else {
        this.errorMessage = this.getErrorMessage(result.error);
      }
    } catch (error) {
      this.errorMessage = 'Une erreur inattendue est survenue.';
      console.error('Erreur inscription:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async signInWithGoogle() {
    this.isLoading = true;
    this.errorMessage = '';

    // Implémentez la connexion Google ici
    // await this.authService.signInWithGoogle();

    setTimeout(() => {
      this.isLoading = false;
      this.errorMessage = 'Connexion Google non implémentée pour le moment.';
    }, 1000);
  }

  private getErrorMessage(error: string | undefined): string {
    const errorMap: { [key: string]: string } = {
      'User already registered': 'Un compte existe déjà avec cet email.',
      'Invalid email': 'Adresse email invalide.',
      'Weak password': 'Le mot de passe est trop faible.',
      'Email not confirmed': 'Email non confirmé.',
      'Network error': 'Erreur de connexion. Vérifiez votre internet.',
      'Invalid phone number': 'Numéro de téléphone invalide.'
    };

    return errorMap[error || ''] || error || 'Erreur lors de l\'inscription.';
  }
}