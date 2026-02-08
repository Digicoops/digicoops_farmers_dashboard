import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../../core/services/products/product.service';
import { AuthService } from '../../../core/services/auth/auth.service';

@Component({
  selector: 'app-sales-reports',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sales-reports.component.html'
})
export class SalesReportsComponent implements OnInit {
  private productService = inject(ProductService);
  private authService = inject(AuthService);

  isLoading = true;
  totalProducts = 0;
  publishedProducts = 0;
  totalRevenue = 0;
  averagePrice = 0;
  topProducts: any[] = [];
  categoryBreakdown: { category: string; count: number; revenue: number }[] = [];

  async ngOnInit() {
    await this.loadSalesData();
  }

  private async loadSalesData() {
    try {
      this.isLoading = true;
      
      const { user } = await this.authService.getCurrentUser();
      if (!user) return;

      const products = await this.productService.getProducts({ userId: user.id });
      
      this.totalProducts = products.length;
      this.publishedProducts = products.filter(p => p.status === 'published').length;
      this.totalRevenue = products
        .filter(p => p.status === 'published')
        .reduce((sum, p) => sum + (p.regular_price || 0), 0);
      this.averagePrice = this.publishedProducts > 0 ? this.totalRevenue / this.publishedProducts : 0;

      // Top produits par prix
      this.topProducts = products
        .filter(p => p.status === 'published')
        .sort((a, b) => (b.regular_price || 0) - (a.regular_price || 0))
        .slice(0, 5)
        .map(p => ({
          name: p.product_name || 'Sans nom',
          price: p.regular_price || 0,
          category: p.category || 'Autres'
        }));

      // Breakdown par catégorie
      const categoryMap = new Map<string, { count: number; revenue: number }>();
      products.filter(p => p.status === 'published').forEach(p => {
        const cat = p.category || 'Autres';
        const existing = categoryMap.get(cat) || { count: 0, revenue: 0 };
        categoryMap.set(cat, {
          count: existing.count + 1,
          revenue: existing.revenue + (p.regular_price || 0)
        });
      });

      this.categoryBreakdown = Array.from(categoryMap.entries())
        .map(([category, data]) => ({ category, ...data }))
        .sort((a, b) => b.revenue - a.revenue);

    } catch (error) {
      console.error('Erreur chargement données ventes:', error);
    } finally {
      this.isLoading = false;
    }
  }

  getCategoryLabel(category: string): string {
    const labels: { [key: string]: string } = {
      'fruits': 'Fruits',
      'legumes': 'Légumes',
      'cereales': 'Céréales',
      'viandes': 'Viandes',
      'produits-laitiers': 'Produits laitiers',
      'service': 'Services',
      'tools': 'Équipements',
      'autres': 'Autres'
    };
    return labels[category] || category;
  }
}
