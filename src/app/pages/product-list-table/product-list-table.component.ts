// product-list-table.component.ts
import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import {Router, RouterModule} from '@angular/router';
import { TableDropdownComponent } from "../../shared/components/common/table-dropdown/table-dropdown.component";
import { ButtonComponent } from "../../shared/components/ui/button/button.component";
import { PageBreadcrumbComponent } from "../../shared/components/common/page-breadcrumb/page-breadcrumb.component";
import { AgriculturalProduct, ProductService } from "../../core/services/products/product.service";
import { AuthService } from "../../core/services/auth/auth.service";
import { FormsModule } from '@angular/forms';

// Interface pour le tri - CORRECTION: utiliser les clés de AgriculturalProduct
interface Sort {
  key: keyof AgriculturalProduct;
  asc: boolean;
}

@Component({
  selector: 'app-product-list-table',
  imports: [
    CommonModule,
    TableDropdownComponent,
    ButtonComponent,
    RouterModule,
    PageBreadcrumbComponent,
    FormsModule // AJOUT: pour ngModel
  ],
  templateUrl: './product-list-table.component.html',
  styles: ``
})
export class ProductListTableComponent implements OnInit {

  private productService = inject(ProductService);
  private authService = inject(AuthService);
  private router = inject(Router);

  products: AgriculturalProduct[] = [];
  selected: string[] = [];
  sort: Sort = { key: 'product_name', asc: true }; // CORRECTION: clé valide
  page: number = 1;
  perPage: number = 7;
  showFilter: boolean = false;
  searchTerm: string = '';
  categoryFilter: string = '';
  statusFilter: string = '';

  // Options pour les filtres
  categories = [
    { value: 'fruits', label: 'Fruits' },
    { value: 'legumes', label: 'Légumes' },
    { value: 'cereales', label: 'Céréales' },
    { value: 'viandes', label: 'Viandes' },
    { value: 'produits-laitiers', label: 'Produits laitiers' },
    { value: 'autres', label: 'Autres' }
  ];

  statuses = [
    { value: 'draft', label: 'Brouillon' },
    { value: 'published', label: 'Publié' },
    { value: 'archived', label: 'Archivé' }
  ];

  ngOnInit() {
    this.loadProducts();
  }

  async loadProducts() {
    try {
      const { user } = await this.authService.getCurrentUser();
      if (user) {
        this.products = await this.productService.getProducts({ userId: user.id });
      }
    } catch (error) {
      console.error('Erreur chargement produits:', error);
    }
  }

  // Filtrer les produits
  filteredProducts(): AgriculturalProduct[] {
    let filtered = this.products;

    // Filtre par recherche
    if (this.searchTerm) {
      filtered = filtered.filter(product =>
          product.product_name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
          product.description?.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }

    // Filtre par catégorie
    if (this.categoryFilter) {
      filtered = filtered.filter(product => product.category === this.categoryFilter);
    }

    // Filtre par statut
    if (this.statusFilter) {
      filtered = filtered.filter(product => product.status === this.statusFilter);
    }

    return filtered;
  }

  // Tri des produits - CORRECTION: utilisation directe de this.sort.key
  sortedProducts(): AgriculturalProduct[] {
    return this.filteredProducts().sort((a, b) => {
      let valA: any = a[this.sort.key];
      let valB: any = b[this.sort.key];

      // Gestion des valeurs nulles
      if (valA == null) valA = '';
      if (valB == null) valB = '';

      // Tri spécial pour les prix
      if (this.sort.key === 'regular_price') {
        valA = Number(valA);
        valB = Number(valB);
      }

      // Tri spécial pour les dates
      if (this.sort.key === 'created_at' || this.sort.key === 'harvest_date') {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      }

      if (valA < valB) return this.sort.asc ? -1 : 1;
      if (valA > valB) return this.sort.asc ? 1 : -1;
      return 0;
    });
  }

  // Pagination
  paginatedProducts(): AgriculturalProduct[] {
    const start = (this.page - 1) * this.perPage;
    return this.sortedProducts().slice(start, start + this.perPage);
  }

  totalPages(): number {
    return Math.ceil(this.filteredProducts().length / this.perPage);
  }

  goToPage(n: number): void {
    if (n >= 1 && n <= this.totalPages()) {
      this.page = n;
    }
  }

  prevPage(): void {
    if (this.page > 1) {
      this.page--;
    }
  }

  nextPage(): void {
    if (this.page < this.totalPages()) {
      this.page++;
    }
  }

  // Sélection
  toggleSelect(id: string): void {
    this.selected = this.selected.includes(id)
        ? this.selected.filter((i) => i !== id)
        : [...this.selected, id];
  }

  toggleAll(): void {
    const ids = this.paginatedProducts().map((p) => p.id!);
    this.selected = this.isAllSelected()
        ? this.selected.filter((id) => !ids.includes(id))
        : [...new Set([...this.selected, ...ids])];
  }

  isAllSelected(): boolean {
    const ids = this.paginatedProducts().map((p) => p.id!);
    return ids.length > 0 && ids.every((id) => this.selected.includes(id));
  }

  // Affichage des informations
  startItem(): number {
    const total = this.filteredProducts().length;
    return total === 0 ? 0 : (this.page - 1) * this.perPage + 1;
  }

  endItem(): number {
    return Math.min(this.page * this.perPage, this.filteredProducts().length);
  }

  // Tri - CORRECTION: type correct pour le paramètre
  sortBy(key: keyof AgriculturalProduct): void {
    this.sort = {
      key,
      asc: this.sort.key === key ? !this.sort.asc : true,
    };
  }

  toggleFilter(): void {
    this.showFilter = !this.showFilter;
  }

  // Formater le prix
  formatPrice(price: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF'
    }).format(price);
  }

  // Formater la date
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR');
  }

  // Statut du stock
  getStockStatus(product: AgriculturalProduct): { text: string, class: string } {
    if (product.stock_quantity === 0) {
      return { text: 'Rupture', class: 'bg-red-50 dark:bg-red-500/15 text-red-700 dark:text-red-500' };
    } else if (product.stock_quantity < 10) {
      return { text: 'Stock limité', class: 'bg-orange-50 dark:bg-orange-500/15 text-orange-700 dark:text-orange-500' };
    } else {
      return { text: 'En stock', class: 'bg-green-50 dark:bg-green-500/15 text-green-700 dark:text-green-500' };
    }
  }

  // Statut du produit
  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'draft': 'Brouillon',
      'published': 'Publié',
      'archived': 'Archivé'
    };
    return statusMap[status] || status;
  }

  getStatusClass(status: string): string {
    const classMap: { [key: string]: string } = {
      'draft': 'bg-gray-50 dark:bg-gray-500/15 text-gray-700 dark:text-gray-500',
      'published': 'bg-green-50 dark:bg-green-500/15 text-green-700 dark:text-green-500',
      'archived': 'bg-red-50 dark:bg-red-500/15 text-red-700 dark:text-red-500'
    };
    return classMap[status] || 'bg-gray-50 dark:bg-gray-500/15 text-gray-700 dark:text-gray-500';
  }

  // Actions - CORRECTION: ajout du paramètre product
  handleViewMore(product: AgriculturalProduct) {
    console.log('View More clicked for:', product.product_name);
    // Navigation vers la page de détail
    this.router.navigate(['/dashboard/view-product', product.id]);

  }

  async handleDelete(product: AgriculturalProduct) {
    if (confirm(`Êtes-vous sûr de vouloir supprimer "${product.product_name}" ?`)) {
      try {
        await this.productService.deleteProduct(product.id!);
        await this.loadProducts(); // Recharger la liste
      } catch (error) {
        console.error('Erreur suppression:', error);
      }
    }
  }

  async handlePublish(product: AgriculturalProduct) {
    try {
      await this.productService.updateProduct(product.id!, { status: 'published' });
      await this.loadProducts(); // Recharger la liste
    } catch (error) {
      console.error('Erreur publication:', error);
    }
  }

  async handleArchive(product: AgriculturalProduct) {
    try {
      await this.productService.updateProduct(product.id!, { status: 'archived' });
      await this.loadProducts(); // Recharger la liste
    } catch (error) {
      console.error('Erreur archivage:', error);
    }
  }

  // Appliquer les filtres
  applyFilters() {
    this.page = 1; // Retour à la première page
    this.showFilter = false;
  }

  // Réinitialiser les filtres
  resetFilters() {
    this.searchTerm = '';
    this.categoryFilter = '';
    this.statusFilter = '';
    this.page = 1;
    this.showFilter = false;
  }
}