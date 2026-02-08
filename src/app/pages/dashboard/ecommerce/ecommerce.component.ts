import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DashboardStatsService, DashboardStats } from '../../../core/services/dashboard/dashboard-stats.service';
import { AuthService } from '../../../core/services/auth/auth.service';

interface RecentOrder {
  id: string;
  customer: string;
  date: string;
  amount: number;
  status: 'En attente' | 'Livrée' | 'Annulée';
}

@Component({
  selector: 'app-ecommerce',
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
  ],
  templateUrl: './ecommerce.component.html',
})
export class EcommerceComponent implements OnInit {
  private dashboardStatsService = inject(DashboardStatsService);
  private authService = inject(AuthService);

  stats: DashboardStats | null = null;
  isLoading = true;
  errorMessage = '';
  userRole: 'admin' | 'cooperative' | 'personal' = 'personal';
  isAdmin = false;
  recentOrders: RecentOrder[] = [];
  
  showReportModal = false;
  reportType = 'sales';
  reportPeriod = 'month';
  reportFormat = 'pdf';

  async ngOnInit() {
    await this.loadUserRole();
    await this.loadStats();
    this.loadRecentOrders();
  }

  private async loadUserRole() {
    try {
      const { user } = await this.authService.getCurrentUser();
      if (user) {
        const email = user.email;
        this.isAdmin = email ? (email.endsWith('@octus-agency.com') || email.endsWith('@digicoops.com')) : false;
        
        if (this.isAdmin) {
          this.userRole = 'admin';
        } else {
          const profile = user.user_metadata?.['profile'] || 'personal';
          this.userRole = profile === 'cooperative' ? 'cooperative' : 'personal';
        }
      }
    } catch (error) {
      console.error('Erreur chargement rôle:', error);
    }
  }

  private async loadStats() {
    try {
      this.isLoading = true;
      this.stats = await this.dashboardStatsService.getDashboardStats();
    } catch (error) {
      console.error('Erreur chargement statistiques:', error);
      this.errorMessage = 'Erreur lors du chargement des statistiques';
    } finally {
      this.isLoading = false;
    }
  }

  async refreshStats() {
    await this.loadStats();
    this.loadRecentOrders();
  }

  private loadRecentOrders() {
    // TODO: Remplacer par des données réelles depuis l'API
    this.recentOrders = [];
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Livrée':
        return 'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400';
      case 'En attente':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'Annulée':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  }

  openReportModal() {
    this.showReportModal = true;
  }

  closeReportModal() {
    this.showReportModal = false;
  }

  downloadReport() {
    console.log('Téléchargement du rapport:', {
      type: this.reportType,
      period: this.reportPeriod,
      format: this.reportFormat
    });
    
    // TODO: Implémenter la génération et le téléchargement du rapport
    alert(`Rapport ${this.reportType} (${this.reportPeriod}) en format ${this.reportFormat.toUpperCase()} sera téléchargé.\n\nFonctionnalité à implémenter.`);
    
    this.closeReportModal();
  }
}
