import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EcommerceMetricsComponent } from '../../../shared/components/ecommerce/ecommerce-metrics/ecommerce-metrics.component';
import { MonthlySalesChartComponent } from '../../../shared/components/ecommerce/monthly-sales-chart/monthly-sales-chart.component';
import { MonthlyTargetComponent } from '../../../shared/components/ecommerce/monthly-target/monthly-target.component';
import { StatisticsChartComponent } from '../../../shared/components/ecommerce/statics-chart/statics-chart.component';
import { DemographicCardComponent } from '../../../shared/components/ecommerce/demographic-card/demographic-card.component';
import { RecentOrdersComponent } from "../../recent-orders/recent-orders.component";
import { DashboardStatsService, DashboardStats } from '../../../core/services/dashboard/dashboard-stats.service';
import { AuthService } from '../../../core/services/auth/auth.service';

@Component({
  selector: 'app-ecommerce',
  imports: [
    CommonModule,
    EcommerceMetricsComponent,
    MonthlySalesChartComponent,
    MonthlyTargetComponent,
    StatisticsChartComponent,
    DemographicCardComponent,
    RecentOrdersComponent,
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

  async ngOnInit() {
    await this.loadUserRole();
    await this.loadStats();
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
  }
}
