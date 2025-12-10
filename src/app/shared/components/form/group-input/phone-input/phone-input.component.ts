// phone-input.component.ts
import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import {PhoneFormatPipe} from "../../../../../core/pipe/phone-format.pipe";

export interface CountryCode {
  code: string;
  label: string;
}

@Component({
  selector: 'app-phone-input',
  imports: [
    CommonModule,
    PhoneFormatPipe // Ajoutez le pipe aux imports
  ],
  templateUrl: './phone-input.component.html',
  styles: ``,
})
export class PhoneInputComponent {
  @Input() countries: CountryCode[] = [];
  @Input() placeholder: string = '77 660 61 06';
  @Input() selectPosition: 'start' | 'end' = 'start';
  @Output() phoneChange = new EventEmitter<string>();

  selectedCountry: string = '';
  phoneNumber: string = '';
  displayPhoneNumber: string = ''; // Nouvelle variable pour l'affichage formaté

  countryCodes: { [key: string]: string } = {};

  ngOnInit() {
    if (this.countries.length > 0) {
      this.selectedCountry = this.countries[0].code;
      this.countryCodes = this.countries.reduce(
          (acc, { code, label }) => ({ ...acc, [code]: label }),
          {}
      );
    }
  }

  handleCountryChange(event: Event) {
    const newCountry = (event.target as HTMLSelectElement).value;
    this.selectedCountry = newCountry;
    this.emitFullPhoneNumber();
  }

  handlePhoneInputChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const rawValue = input.value;

    // Nettoyer pour garder uniquement les chiffres
    const cleanValue = rawValue.replace(/\D/g, '');

    // Limiter à 9 chiffres pour le Sénégal
    const limitedValue = cleanValue.slice(0, 9);

    // Stocker la version non formatée
    this.phoneNumber = limitedValue;

    // Mettre à jour l'affichage avec le format
    this.displayPhoneNumber = this.formatPhoneForDisplay(limitedValue);

    // Mettre à jour la valeur de l'input
    input.value = this.displayPhoneNumber;

    this.emitFullPhoneNumber();
  }

  private formatPhoneForDisplay(phone: string): string {
    // Utiliser le format sénégalais par défaut
    if (phone.length <= 2) {
      return phone;
    } else if (phone.length <= 5) {
      return `${phone.substring(0, 2)} ${phone.substring(2)}`;
    } else if (phone.length <= 7) {
      return `${phone.substring(0, 2)} ${phone.substring(2, 5)} ${phone.substring(5)}`;
    } else {
      return `${phone.substring(0, 2)} ${phone.substring(2, 5)} ${phone.substring(5, 7)} ${phone.substring(7, 9)}`;
    }
  }

  private emitFullPhoneNumber() {
    // Émettre le numéro nettoyé (sans espaces)
    const formattedPhone = this.phoneNumber;
    console.log('PhoneInput - Emission du numéro:', formattedPhone);
    this.phoneChange.emit(formattedPhone);
  }

  // Méthode pour gérer le backspace et la navigation
  handleKeyDown(event: KeyboardEvent) {
    // Permettre les touches de navigation
    const allowedKeys = [
      'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight',
      'Tab', 'Home', 'End'
    ];

    if (allowedKeys.includes(event.key)) {
      return;
    }

    // Empêcher la saisie si ce n'est pas un chiffre
    if (!/^\d$/.test(event.key)) {
      event.preventDefault();
    }
  }
}