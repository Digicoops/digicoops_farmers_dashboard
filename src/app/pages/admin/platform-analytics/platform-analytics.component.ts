import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageBreadcrumbComponent } from '../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { DashboardStatsService } from '../../../core/services/dashboard/dashboard-stats.service';

@Component({
  selector: 'app-platform-analytics',
  standalone: true,
  imports: [CommonModule, PageBreadcrumbComponent],
  templateUrl: './platform-analytics.component.html'
})
export class PlatformAnalyticsComponent implements OnInit {
  private dashboardStatsService = inject(DashboardStatsService);

  stats: any = null;
  isLoading = true;

  async ngOnInit() {
    await this.loadAnalytics();
  }

  private async loadAnalytics() {
    try {
      this.isLoading = true;
      this.stats = await this.dashboardStatsService.getDashboardStats();
    } catch (error) {
      console.error('Erreur chargement analytics:', error);
    } finally {
      this.isLoading = false;
    }
  }
}
