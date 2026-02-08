import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PageBreadcrumbComponent } from '../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';

@Component({
  selector: 'app-system-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, PageBreadcrumbComponent, ButtonComponent],
  templateUrl: './system-settings.component.html'
})
export class SystemSettingsComponent implements OnInit {
  private router = inject(Router);
  searchTerm = '';
  
  // Personal Settings
  personalSettings = {
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@digicoops.com',
    phone: '+225 07 00 00 00 00',
    profilePhoto: ''
  };

  // Notification Settings
  notificationSettings = {
    emailNotifications: true,
    smsNotifications: false,
    orderNotifications: true,
    productNotifications: true,
    newsletterNotifications: true,
    marketingNotifications: false
  };

  // Platform - Finances
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

  // Platform - Shipping
  shippingSettings = {
    freeShippingThreshold: 50000,
    standardShippingCost: 2000,
    expressShippingCost: 5000,
    shippingZones: ['Abidjan', 'Bouaké', 'Yamoussoukro', 'San-Pedro']
  };

  // Platform - Catalog
  catalogSettings = {
    autoApproveProducts: false,
    requireProductImages: true,
    minProductPrice: 100,
    maxProductsPerSeller: 1000,
    allowCustomProducts: true
  };

  // Users & Security
  securitySettings = {
    allowRegistration: true,
    requireEmailVerification: true,
    passwordMinLength: 8,
    sessionTimeout: 30,
    twoFactorAuth: false,
    allowedRoles: ['admin', 'cooperative', 'personal']
  };

  // System Settings
  systemSettings = {
    siteName: 'DigiCoop Marketplace',
    siteDescription: 'Plateforme de vente de produits agricoles',
    maintenanceMode: false,
    debugMode: false,
    cacheEnabled: true,
    apiRateLimit: 1000
  };

  // Support Settings
  supportSettings = {
    supportEmail: 'support@digicoops.com',
    supportPhone: '+225 07 00 00 00 00',
    supportHours: '8h - 18h (Lun-Ven)',
    liveChatEnabled: false,
    ticketSystemEnabled: true
  };

  sections = [
    {
      id: 'personal',
      title: 'Personal',
      items: [
        { id: 'personal-info', title: 'Personal Information', description: 'Edit your name, email, and profile photo', icon: 'user' },
        { id: 'notifications', title: 'Notifications', description: 'Configure your notification preferences', icon: 'bell' }
      ]
    },
    {
      id: 'platform',
      title: 'Platform',
      items: [
        { id: 'finances', title: 'Finances', description: 'Configure platform commissions and fees', icon: 'dollar' },
        { id: 'shipping', title: 'Shipping', description: 'Manage shipping options and rates', icon: 'truck' },
        { id: 'catalog', title: 'Catalog', description: 'Configure product categories and attributes', icon: 'grid' }
      ]
    },
    {
      id: 'security',
      title: 'Users & Security',
      items: [
        { id: 'users-security', title: 'Manage user roles and permissions', description: 'Control access and security settings', icon: 'shield' }
      ]
    },
    {
      id: 'system',
      title: 'System',
      items: [
        { id: 'general', title: 'General platform settings', description: 'Configure core system parameters', icon: 'settings' }
      ]
    },
    {
      id: 'support',
      title: 'Support',
      items: [
        { id: 'customer-support', title: 'Configure customer support options', description: 'Manage support channels and settings', icon: 'help' }
      ]
    }
  ];

  ngOnInit() {
    // Load settings from API
  }

  navigateToSetting(settingId: string) {
    this.router.navigate(['/dashboard/admin/settings', settingId]);
  }

  savePersonalSettings() {
    console.log('Saving personal settings:', this.personalSettings);
    this.showSuccessMessage('Personal settings saved successfully!');
  }

  saveNotificationSettings() {
    console.log('Saving notification settings:', this.notificationSettings);
    this.showSuccessMessage('Notification settings saved successfully!');
  }

  saveFinanceSettings() {
    console.log('Saving finance settings:', this.financeSettings);
    this.showSuccessMessage('Finance settings saved successfully!');
  }

  saveShippingSettings() {
    console.log('Saving shipping settings:', this.shippingSettings);
    this.showSuccessMessage('Shipping settings saved successfully!');
  }

  saveCatalogSettings() {
    console.log('Saving catalog settings:', this.catalogSettings);
    this.showSuccessMessage('Catalog settings saved successfully!');
  }

  saveSecuritySettings() {
    console.log('Saving security settings:', this.securitySettings);
    this.showSuccessMessage('Security settings saved successfully!');
  }

  saveSystemSettings() {
    console.log('Saving system settings:', this.systemSettings);
    this.showSuccessMessage('System settings saved successfully!');
  }

  saveSupportSettings() {
    console.log('Saving support settings:', this.supportSettings);
    this.showSuccessMessage('Support settings saved successfully!');
  }

  private showSuccessMessage(message: string) {
    alert(message);
  }

  getFilteredSections() {
    if (!this.searchTerm) return this.sections;
    
    const term = this.searchTerm.toLowerCase();
    return this.sections.map(section => ({
      ...section,
      items: section.items.filter(item => 
        item.title.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term)
      )
    })).filter(section => section.items.length > 0);
  }
}
