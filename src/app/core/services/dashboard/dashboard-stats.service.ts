import { Injectable, inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { ProductService } from '../products/product.service';
import { AgriculturalProducerManagementService } from '../producer/agricultural-producer-management.service';

export interface DashboardStats {
  totalProducts: number;
  publishedProducts: number;
  draftProducts: number;
  totalRevenue: number;
  totalOrders: number;
  totalProducers: number;
  totalUsers: number;
  totalCooperatives: number;
  averageOrderValue: number;
  productsGrowth: number;
  revenueGrowth: number;
  ordersGrowth: number;
  topCategories: { name: string; count: number; percentage: number }[];
  recentActivity: any[];
}

@Injectable({
  providedIn: 'root'
})
export class DashboardStatsService {
  private authService = inject(AuthService);
  private productService = inject(ProductService);
  private producerManagement = inject(AgriculturalProducerManagementService);

  /**
   * Récupérer les statistiques selon le rôle de l'utilisateur
   */
  async getDashboardStats(): Promise<DashboardStats> {
    const { user } = await this.authService.getCurrentUser();
    
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }

    const email = user.email;
    const isAdmin = email ? (email.endsWith('@octus-agency.com') || email.endsWith('@digicoops.com')) : false;
    const userProfile = user.user_metadata?.['profile'] || 'personal';

    if (isAdmin) {
      return await this.getAdminStats();
    } else if (userProfile === 'cooperative') {
      return await this.getCooperativeStats(user.id);
    } else {
      return await this.getPersonalStats(user.id);
    }
  }

  /**
   * Statistiques pour les administrateurs (toutes les données)
   */
  private async getAdminStats(): Promise<DashboardStats> {
    try {
      // Récupérer tous les produits (admin voit tout)
      const allProducts = await this.productService.getProducts({});
      
      // Récupérer tous les producteurs
      const { producers } = await this.producerManagement.getCooperativeProducers();

      const publishedProducts = allProducts.filter(p => p.status === 'published').length;
      const draftProducts = allProducts.filter(p => p.status === 'draft').length;

      // Calculer le revenu total (simulation)
      const totalRevenue = allProducts
        .filter(p => p.status === 'published')
        .reduce((sum, p) => sum + (p.regular_price || 0), 0);

      // Statistiques par catégorie
      const categoryCount: { [key: string]: number } = {};
      allProducts.forEach(p => {
        const category = p.category || 'Autres';
        categoryCount[category] = (categoryCount[category] || 0) + 1;
      });

      const topCategories = Object.entries(categoryCount)
        .map(([name, count]) => ({
          name: this.getCategoryLabel(name),
          count,
          percentage: Math.round((count / allProducts.length) * 100)
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Calculer les coopératives (utilisateurs avec profile = 'cooperative')
      const cooperatives = producers.filter(p => p.role === 'cooperative').length;
      
      // Calculer les utilisateurs totaux (producteurs actifs)
      const activeUsers = producers.filter(p => p.account_status === 'active').length;

      return {
        totalProducts: allProducts.length,
        publishedProducts,
        draftProducts,
        totalRevenue,
        totalOrders: 0, // À implémenter avec vraie table commandes
        totalProducers: producers.length,
        totalUsers: activeUsers,
        totalCooperatives: cooperatives,
        averageOrderValue: publishedProducts > 0 ? totalRevenue / publishedProducts : 0,
        productsGrowth: 0, // À calculer avec données historiques
        revenueGrowth: 0, // À calculer avec données historiques
        ordersGrowth: 0, // À calculer avec données historiques
        topCategories,
        recentActivity: []
      };
    } catch (error) {
      console.error('Erreur chargement stats admin:', error);
      return this.getEmptyStats();
    }
  }

  /**
   * Statistiques pour les coopératives (leurs producteurs et produits)
   */
  private async getCooperativeStats(userId: string): Promise<DashboardStats> {
    try {
      // Récupérer les produits de la coopérative
      const products = await this.productService.getProducts({ userId });
      
      // Récupérer les producteurs de la coopérative
      const { producers } = await this.producerManagement.getCooperativeProducers();

      const publishedProducts = products.filter(p => p.status === 'published').length;
      const draftProducts = products.filter(p => p.status === 'draft').length;

      const totalRevenue = products
        .filter(p => p.status === 'published')
        .reduce((sum, p) => sum + (p.regular_price || 0), 0);

      // Statistiques par catégorie
      const categoryCount: { [key: string]: number } = {};
      products.forEach(p => {
        const category = p.category || 'Autres';
        categoryCount[category] = (categoryCount[category] || 0) + 1;
      });

      const topCategories = Object.entries(categoryCount)
        .map(([name, count]) => ({
          name: this.getCategoryLabel(name),
          count,
          percentage: Math.round((count / products.length) * 100)
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Producteurs actifs de cette coopérative
      const activeProducers = producers.filter(p => p.account_status === 'active').length;

      return {
        totalProducts: products.length,
        publishedProducts,
        draftProducts,
        totalRevenue,
        totalOrders: 0, // À implémenter avec vraie table commandes
        totalProducers: activeProducers,
        totalUsers: 0,
        totalCooperatives: 0,
        averageOrderValue: publishedProducts > 0 ? totalRevenue / publishedProducts : 0,
        productsGrowth: 0, // À calculer avec données historiques
        revenueGrowth: 0, // À calculer avec données historiques
        ordersGrowth: 0, // À calculer avec données historiques
        topCategories,
        recentActivity: []
      };
    } catch (error) {
      console.error('Erreur chargement stats coopérative:', error);
      return this.getEmptyStats();
    }
  }

  /**
   * Statistiques pour les particuliers (leurs propres produits)
   */
  private async getPersonalStats(userId: string): Promise<DashboardStats> {
    try {
      const products = await this.productService.getProducts({ userId });

      const publishedProducts = products.filter(p => p.status === 'published').length;
      const draftProducts = products.filter(p => p.status === 'draft').length;

      const totalRevenue = products
        .filter(p => p.status === 'published')
        .reduce((sum, p) => sum + (p.regular_price || 0), 0);

      // Statistiques par catégorie
      const categoryCount: { [key: string]: number } = {};
      products.forEach(p => {
        const category = p.category || 'Autres';
        categoryCount[category] = (categoryCount[category] || 0) + 1;
      });

      const topCategories = Object.entries(categoryCount)
        .map(([name, count]) => ({
          name: this.getCategoryLabel(name),
          count,
          percentage: Math.round((count / products.length) * 100)
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        totalProducts: products.length,
        publishedProducts,
        draftProducts,
        totalRevenue,
        totalOrders: 0, // À implémenter avec vraie table commandes
        totalProducers: 0,
        totalUsers: 0,
        totalCooperatives: 0,
        averageOrderValue: publishedProducts > 0 ? totalRevenue / publishedProducts : 0,
        productsGrowth: 0, // À calculer avec données historiques
        revenueGrowth: 0, // À calculer avec données historiques
        ordersGrowth: 0, // À calculer avec données historiques
        topCategories,
        recentActivity: []
      };
    } catch (error) {
      console.error('Erreur chargement stats personnel:', error);
      return this.getEmptyStats();
    }
  }

  private getEmptyStats(): DashboardStats {
    return {
      totalProducts: 0,
      publishedProducts: 0,
      draftProducts: 0,
      totalRevenue: 0,
      totalOrders: 0,
      totalProducers: 0,
      totalUsers: 0,
      totalCooperatives: 0,
      averageOrderValue: 0,
      productsGrowth: 0,
      revenueGrowth: 0,
      ordersGrowth: 0,
      topCategories: [],
      recentActivity: []
    };
  }

  private getCategoryLabel(category: string): string {
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
