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

  @Input() options: Option[] = [
    { value: 'personal', label: 'Particulier' },
    { value: 'cooperative', label: 'Cooperative' },
  ];

  selectedValue: string = 'personal';
  countries = [{ code: 'SN', label: '+221' }];

  constructor(
      private authManagement: AuthManagementService,
      private router: Router,
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
    // Format reçu: "77 660 61 06" - on le conserve tel quel
    this.phone = phoneNumber;
  }

  // Validation du formulaire
  isFormValid(): boolean {
    return !!this.fname?.trim() &&
        !!this.lname?.trim() &&
        !!this.email?.trim() &&
        !!this.shopName?.trim() &&
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
      first_name: this.fname.trim(),
      last_name: this.lname.trim(),
      shop_name: this.shopName.trim(),
      profile: this.selectedValue,
      email: this.email.trim(),
      password: this.password,
      phone: this.phone // Format déjà "77 660 61 06"
    };

    try {
      const result = await this.authManagement.register(signUpData);

      if (result.success) {
        this.successMessage = 'Compte créé avec succès ! Redirection...';

        // Rediriger après un délai
        setTimeout(() => {
          this.router.navigate(['/login'], {
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
      'Network error': 'Erreur de connexion. Vérifiez votre internet.'
    };

    return errorMap[error || ''] || error || 'Erreur lors de l\'inscription.';
  }
}