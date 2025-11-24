import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';

export interface CountryCode {
  code: string;
  label: string;
}

@Component({
  selector: 'app-phone-input',
  imports: [
    CommonModule,
  ],
  templateUrl: './phone-input.component.html',
  styles: ``
})
export class PhoneInputComponent {

  @Input() countries: CountryCode[] = [];
  @Input() placeholder: string = '77 660 61 06';
  @Input() selectPosition: 'start' | 'end' = 'start';
  @Output() phoneChange = new EventEmitter<string>();

  selectedCountry: string = '';
  phoneNumber: string = '';

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
    const newPhoneNumber = (event.target as HTMLInputElement).value;
    this.phoneNumber = newPhoneNumber;
    this.emitFullPhoneNumber();
  }

  private emitFullPhoneNumber() {
    // Format strict: "77 660 61 06" (sans indicatif pays)
    const formattedPhone = this.phoneNumber.replace(/\s+/g, ''); // Supprime les espaces existants
    const finalPhone = formattedPhone.replace(/(\d{2})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3 $4');

    console.log('PhoneInput - Emission du numéro:', finalPhone);
    this.phoneChange.emit(finalPhone); // Émet strictement "77 660 61 06"
  }
}