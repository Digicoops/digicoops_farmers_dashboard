import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-personal-info-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './personal-info-settings.component.html'
})
export class PersonalInfoSettingsComponent implements OnInit {
  personalSettings = {
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@digicoops.com',
    phone: '+225 07 00 00 00 00',
    profilePhoto: ''
  };

  constructor(private router: Router) {}

  ngOnInit() {
    // Load from API
  }

  saveSettings() {
    console.log('Saving personal settings:', this.personalSettings);
    alert('Personal settings saved successfully!');
  }

  goBack() {
    this.router.navigate(['/dashboard/admin/settings']);
  }
}
