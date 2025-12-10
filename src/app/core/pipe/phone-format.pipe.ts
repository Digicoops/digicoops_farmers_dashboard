// phone-format.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'phoneFormat',
    standalone: true
})
export class PhoneFormatPipe implements PipeTransform {
    transform(value: string, countryCode: string = 'SN'): string {
        if (!value) return '';

        // Nettoyer la valeur (supprimer tout sauf les chiffres)
        const cleanValue = value.replace(/\D/g, '');

        // Format spécifique pour le Sénégal
        if (countryCode === 'SN' || countryCode === '+221') {
            return this.formatSenegalPhone(cleanValue);
        }

        // Format par défaut (générique)
        return this.formatGenericPhone(cleanValue);
    }

    private formatSenegalPhone(phone: string): string {
        // Format sénégalais: 77 660 61 06 ou 33 860 61 06
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

    private formatGenericPhone(phone: string): string {
        // Format générique: groupes de 2 ou 3 chiffres
        const chunkSize = phone.length <= 10 ? 2 : 3;
        const chunks = [];

        for (let i = 0; i < phone.length; i += chunkSize) {
            chunks.push(phone.substring(i, i + chunkSize));
        }

        return chunks.join(' ');
    }
}