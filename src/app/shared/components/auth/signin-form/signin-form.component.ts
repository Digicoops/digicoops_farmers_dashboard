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
  selector: 'app-signin-form',
  imports: [
    CommonModule,
    LabelComponent,
    CheckboxComponent,
    ButtonComponent,
    InputFieldComponent,
    RouterModule,
    FormsModule,
    PhoneInputComponent,
  ],
  templateUrl: './signin-form.component.html',
  styles: ``
})
export class SigninFormComponent implements OnInit {
  showPassword = false;
  isChecked = false;

  password = '';
  phone = '';
  isLoading = false;
  errorMessage = '';

  countries = [
    { code: 'SN', label: '+221' },
  ];

  constructor(
      private authManagement: AuthManagementService,
      private router: Router
  ) {}

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  handlePhoneNumberChange(phoneNumber: string) {
    console.log('Updated phone number:', phoneNumber);
    this.phone = phoneNumber;
  }

  /** Nettoyer et valider le numéro de téléphone */
  private validateAndCleanPhone(phone: string): { isValid: boolean; cleanPhone: string; error?: string } {
    // Le phone arrive déjà formaté "77 660 61 06", on supprime juste les espaces
    let cleanPhone = phone.replace(/\s+/g, '');

    console.log('Phone après suppression espaces:', cleanPhone);

    // Vérifier la longueur (9 chiffres)
    if (cleanPhone.length !== 9) {
      return {
        isValid: false,
        cleanPhone: '',
        error: 'Le numéro doit avoir 9 chiffres'
      };
    }

    // Vérifier le format Sénégalais (76, 77, 78, 70)
    const validPrefixes = ['76', '77', '78', '70'];
    const prefix = cleanPhone.substring(0, 2);

    if (!validPrefixes.includes(prefix)) {
      return {
        isValid: false,
        cleanPhone: '',
        error: 'Numéro Sénégalais invalide. Doit commencer par 76, 77, 78 ou 70'
      };
    }

    // Vérifier que c'est bien un nombre
    if (!/^\d+$/.test(cleanPhone)) {
      return {
        isValid: false,
        cleanPhone: '',
        error: 'Le numéro ne doit contenir que des chiffres'
      };
    }

    return {
      isValid: true,
      cleanPhone: cleanPhone // Retourner juste "776606106" (sans espaces)
    };
  }

  async onSignIn() {
    console.log("onSignIn appelé !");

    // Reset error message
    this.errorMessage = '';

    // Validation de base
    if (!this.phone) {
      this.errorMessage = 'Veuillez entrer un numéro de téléphone';
      return;
    }

    if (!this.password) {
      this.errorMessage = 'Veuillez entrer un mot de passe';
      return;
    }

    // Validation et nettoyage du téléphone
    const phoneValidation = this.validateAndCleanPhone(this.phone);
    if (!phoneValidation.isValid) {
      this.errorMessage = phoneValidation.error || 'Numéro de téléphone invalide';
      return;
    }

    this.isLoading = true;

    console.log('Tentative de connexion avec:', {
      phoneOriginal: this.phone,
      phoneCleaned: phoneValidation.cleanPhone,
      password: this.password
    });

    try {
      // Login avec téléphone nettoyé (sans espaces)
      const result = await this.authManagement.loginWithPhone(phoneValidation.cleanPhone, this.password);

      if (result.success) {
        console.log('Connexion réussie!');
        // this.router.navigate(['/coming-soon']);
        this.router.navigate(['/dashboard']);
      } else {
        this.errorMessage = result.error || 'Erreur de connexion';
      }
    } catch (error) {
      this.errorMessage = 'Une erreur est survenue lors de la connexion';
      console.error('Erreur connexion:', error);
    } finally {
      this.isLoading = false;
    }
  }

  // Méthode pour tester le clic directement
  testSubmit() {
    console.log("testSubmit appelé !");
    this.onSignIn();
  }

  onGoogleSignIn() {
    console.log('Google sign in clicked');
  }

  ngOnInit(): void {
    this.authManagement.logout()
  }
}
