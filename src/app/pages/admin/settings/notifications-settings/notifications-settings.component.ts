import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-notifications-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './notifications-settings.component.html'
})
export class NotificationsSettingsComponent implements OnInit {
  notificationSettings = {
    emailNotifications: true,
    smsNotifications: false,
    orderNotifications: true,
    productNotifications: true,
    newsletterNotifications: true,
    marketingNotifications: false
  };

  constructor(private router: Router) {}

  ngOnInit() {
    // Load from API
  }

  saveSettings() {
    console.log('Saving notification settings:', this.notificationSettings);
    alert('Notification settings saved successfully!');
  }

  goBack() {
    this.router.navigate(['/dashboard/admin/settings']);
  }
}
