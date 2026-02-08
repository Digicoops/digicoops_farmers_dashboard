import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-finances-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './finances-settings.component.html'
})
export class FinancesSettingsComponent implements OnInit {
  financeSettings = {
    platformCommission: 5,
    paymentMethods: {
      mobileMoney: true,
      bankTransfer: true,
      cashOnDelivery: true
    },
    currency: 'FCFA',
    taxRate: 18
  };

  constructor(private router: Router) {}

  ngOnInit() {}

  saveSettings() {
    console.log('Saving finance settings:', this.financeSettings);
    alert('Finance settings saved successfully!');
  }

  goBack() {
    this.router.navigate(['/dashboard/admin/settings']);
  }
}
