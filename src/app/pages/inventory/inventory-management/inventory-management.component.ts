import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';
import { ProductService } from '../../../core/services/products/product.service';
import { AuthService } from '../../../core/services/auth/auth.service';

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  stock: number;
  minStock: number;
  price: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  lastUpdated: string;
  imageUrl?: string;
}

@Component({
  selector: 'app-inventory-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent],
  templateUrl: './inventory-management.component.html'
})
export class InventoryManagementComponent implements OnInit {
  private productService = inject(ProductService);
  private authService = inject(AuthService);

  inventory: InventoryItem[] = [];
  filteredInventory: InventoryItem[] = [];
  isLoading = true;
  searchTerm = '';
  selectedCategory = '';
  selectedStatus = '';
  isAdmin = false;

  categoryOptions = [
    { value: '', label: 'Toutes les catégories' },
    { value: 'fruits', label: 'Fruits' },
    { value: 'legumes', label: 'Légumes' },
    { value: 'cereales', label: 'Céréales' },
    { value: 'viandes', label: 'Viandes' },
    { value: 'produits-laitiers', label: 'Produits laitiers' },
    { value: 'service', label: 'Services' },
    { value: 'tools', label: 'Équipements' }
  ];

  statusOptions = [
    { value: '', label: 'Tous les statuts' },
    { value: 'in_stock', label: 'En stock' },
    { value: 'low_stock', label: 'Stock faible' },
    { value: 'out_of_stock', label: 'Rupture de stock' }
  ];

  async ngOnInit() {
    await this.loadInventory();
  }

  private async loadInventory() {
    try {
      this.isLoading = true;
      
      const { user } = await this.authService.getCurrentUser();
      if (!user) return;

      // Vérifier si l'utilisateur est admin
      const email = user.email;
      this.isAdmin = email ? (email.endsWith('@octus-agency.com') || email.endsWith('@digicoops.com')) : false;

      // Si admin, charger tous les produits, sinon uniquement ceux de l'utilisateur
      const products = this.isAdmin 
        ? await this.productService.getProducts() // Tous les produits pour admin
        : await this.productService.getProducts({ userId: user.id }); // Seulement ses produits pour non-admin
      
      this.inventory = products.map(p => ({
        id: p.id || '',
        name: p.product_name || 'Sans nom',
        category: p.category || 'autres',
        stock: p.stock_quantity || 0,
        minStock: 10,
        price: p.regular_price || 0,
        status: this.getStockStatus(p.stock_quantity || 0, 10),
        lastUpdated: p.updated_at || p.created_at || new Date().toISOString(),
        imageUrl: p.main_image?.url
      }));

      console.log(`Inventaire chargé: ${this.inventory.length} produits (Admin: ${this.isAdmin})`);
      this.applyFilters();
    } catch (error) {
      console.error('Erreur chargement inventaire:', error);
    } finally {
      this.isLoading = false;
    }
  }

  private getStockStatus(stock: number, minStock: number): 'in_stock' | 'low_stock' | 'out_of_stock' {
    if (stock === 0) return 'out_of_stock';
    if (stock <= minStock) return 'low_stock';
    return 'in_stock';
  }

  applyFilters() {
    let filtered = [...this.inventory];

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(term) ||
        item.category.toLowerCase().includes(term)
      );
    }

    if (this.selectedCategory) {
      filtered = filtered.filter(item => item.category === this.selectedCategory);
    }

    if (this.selectedStatus) {
      filtered = filtered.filter(item => item.status === this.selectedStatus);
    }

    this.filteredInventory = filtered;
  }

  onSearch() {
    this.applyFilters();
  }

  clearFilters() {
    this.searchTerm = '';
    this.selectedCategory = '';
    this.selectedStatus = '';
    this.applyFilters();
  }

  getStatusBadgeClass(status: string): string {
    const classes: { [key: string]: string } = {
      'in_stock': 'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400',
      'low_stock': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      'out_of_stock': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    };
    return classes[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'in_stock': 'En stock',
      'low_stock': 'Stock faible',
      'out_of_stock': 'Rupture'
    };
    return labels[status] || status;
  }

  getCategoryLabel(category: string): string {
    const option = this.categoryOptions.find(opt => opt.value === category);
    return option?.label || category;
  }

  getTotalValue(): number {
    return this.filteredInventory.reduce((sum, item) => sum + (item.stock * item.price), 0);
  }

  getLowStockCount(): number {
    return this.inventory.filter(item => item.status === 'low_stock').length;
  }

  getOutOfStockCount(): number {
    return this.inventory.filter(item => item.status === 'out_of_stock').length;
  }

  async refreshInventory() {
    await this.loadInventory();
  }

  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
  }
}
