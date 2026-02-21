import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';
import { AuthService } from '../../../core/services/auth/auth.service';

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed';
  itemsCount: number;
  createdAt: string;
  selected?: boolean;
}

@Component({
  selector: 'app-orders-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent],
  templateUrl: './orders-management.component.html'
})
export class OrdersManagementComponent implements OnInit {
  private authService = inject(AuthService);

  orders: Order[] = [];
  filteredOrders: Order[] = [];
  paginatedOrders: Order[] = [];
  isLoading = true;
  searchTerm = '';
  selectedStatus = '';
  selectedPaymentStatus = '';
  userRole: 'admin' | 'cooperative' | 'personal' = 'personal';
  
  // Filtres avancés
  startDate = '';
  endDate = '';
  minAmount: number | null = null;
  maxAmount: number | null = null;
  
  // Tri
  sortBy = 'date-desc';
  
  // Pagination
  currentPage = 1;
  itemsPerPage = 25;
  totalPages = 1;
  
  // Sélection
  selectAll = false;

  statusOptions = [
    { value: '', label: 'Tous les statuts' },
    { value: 'pending', label: 'En attente' },
    { value: 'confirmed', label: 'Confirmée' },
    { value: 'shipped', label: 'Expédiée' },
    { value: 'delivered', label: 'Livrée' },
    { value: 'cancelled', label: 'Annulée' }
  ];

  paymentStatusOptions = [
    { value: '', label: 'Tous les paiements' },
    { value: 'pending', label: 'En attente' },
    { value: 'paid', label: 'Payé' },
    { value: 'failed', label: 'Échoué' }
  ];

  async ngOnInit() {
    await this.loadUserRole();
    await this.loadOrders();
  }

  private async loadUserRole() {
    try {
      const { user } = await this.authService.getCurrentUser();
      if (user) {
        const email = user.email;
        const isAdmin = email ? (email.endsWith('@octus-agency.com') || email.endsWith('@digicoops.com')) : false;
        
        if (isAdmin) {
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

  private async loadOrders() {
    try {
      this.isLoading = true;
      
      // TODO: Remplacer par vraie API de commandes
      // Pour l'instant, données vides car pas encore de table commandes
      this.orders = [];
      this.applyFilters();
    } catch (error) {
      console.error('Erreur chargement commandes:', error);
    } finally {
      this.isLoading = false;
    }
  }

  applyFilters() {
    let filtered = [...this.orders];

    // Recherche texte
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(order =>
        order.orderNumber.toLowerCase().includes(term) ||
        order.customerName.toLowerCase().includes(term) ||
        order.customerEmail.toLowerCase().includes(term)
      );
    }

    // Filtre statut
    if (this.selectedStatus) {
      filtered = filtered.filter(order => order.status === this.selectedStatus);
    }

    // Filtre paiement
    if (this.selectedPaymentStatus) {
      filtered = filtered.filter(order => order.paymentStatus === this.selectedPaymentStatus);
    }

    // Filtre dates
    if (this.startDate) {
      filtered = filtered.filter(order => new Date(order.createdAt) >= new Date(this.startDate));
    }
    if (this.endDate) {
      filtered = filtered.filter(order => new Date(order.createdAt) <= new Date(this.endDate));
    }

    // Filtre montants
    if (this.minAmount !== null && this.minAmount > 0) {
      filtered = filtered.filter(order => order.totalAmount >= this.minAmount!);
    }
    if (this.maxAmount !== null && this.maxAmount > 0) {
      filtered = filtered.filter(order => order.totalAmount <= this.maxAmount!);
    }

    this.filteredOrders = filtered;
    this.applySorting();
    this.updatePagination();
  }

  onSearch() {
    this.applyFilters();
  }

  clearFilters() {
    this.searchTerm = '';
    this.selectedStatus = '';
    this.selectedPaymentStatus = '';
    this.startDate = '';
    this.endDate = '';
    this.minAmount = null;
    this.maxAmount = null;
    this.sortBy = 'date-desc';
    this.applyFilters();
  }

  getStatusBadgeClass(status: string): string {
    const classes: { [key: string]: string } = {
      'pending': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      'confirmed': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      'shipped': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      'delivered': 'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400',
      'cancelled': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    };
    return classes[status] || 'bg-gray-100 text-gray-800 dark:bg-background-dark/30 dark:text-gray-400';
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'pending': 'En attente',
      'confirmed': 'Confirmée',
      'shipped': 'Expédiée',
      'delivered': 'Livrée',
      'cancelled': 'Annulée'
    };
    return labels[status] || status;
  }

  getPaymentStatusBadgeClass(status: string): string {
    const classes: { [key: string]: string } = {
      'pending': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      'paid': 'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400',
      'failed': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    };
    return classes[status] || 'bg-gray-100 text-gray-800 dark:bg-background-dark/30 dark:text-gray-400';
  }

  getPaymentStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'pending': 'En attente',
      'paid': 'Payé',
      'failed': 'Échoué'
    };
    return labels[status] || status;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  viewOrder(order: Order) {
    console.log('View order:', order);
  }

  updateOrderStatus(order: Order, newStatus: string) {
    console.log('Update order status:', order, newStatus);
  }

  cancelOrder(order: Order) {
    if (confirm(`Êtes-vous sûr de vouloir annuler la commande ${order.orderNumber} ?`)) {
      console.log('Cancel order:', order);
    }
  }

  applySorting() {
    switch (this.sortBy) {
      case 'date-desc':
        this.filteredOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'date-asc':
        this.filteredOrders.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'amount-desc':
        this.filteredOrders.sort((a, b) => b.totalAmount - a.totalAmount);
        break;
      case 'amount-asc':
        this.filteredOrders.sort((a, b) => a.totalAmount - b.totalAmount);
        break;
      case 'status':
        this.filteredOrders.sort((a, b) => a.status.localeCompare(b.status));
        break;
    }
    this.updatePagination();
  }

  updatePagination() {
    this.totalPages = Math.ceil(this.filteredOrders.length / this.itemsPerPage) || 1;
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedOrders = this.filteredOrders.slice(startIndex, endIndex);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  onPageSizeChange() {
    this.currentPage = 1;
    this.updatePagination();
  }

  toggleSelectAll() {
    this.paginatedOrders.forEach(order => order.selected = this.selectAll);
  }

  getSelectedOrders(): Order[] {
    return this.orders.filter(order => order.selected);
  }

  clearSelection() {
    this.orders.forEach(order => order.selected = false);
    this.selectAll = false;
  }

  bulkUpdateStatus(newStatus: string) {
    const selected = this.getSelectedOrders();
    if (selected.length === 0) return;
    
    if (confirm(`Mettre à jour ${selected.length} commande(s) au statut "${this.getStatusLabel(newStatus)}" ?`)) {
      console.log('Bulk update status:', newStatus, selected);
      // TODO: Implémenter la mise à jour en masse
      alert(`${selected.length} commande(s) mise(s) à jour.\n\nFonctionnalité à implémenter.`);
      this.clearSelection();
    }
  }

  bulkExport() {
    const selected = this.getSelectedOrders();
    if (selected.length === 0) return;
    
    console.log('Bulk export:', selected);
    alert(`Export de ${selected.length} commande(s).\n\nFonctionnalité à implémenter.`);
  }

  exportOrders() {
    console.log('Export all orders:', this.filteredOrders);
    alert(`Export de ${this.filteredOrders.length} commande(s).\n\nFonctionnalité à implémenter.`);
  }

  getOrderStats() {
    return {
      total: this.orders.length,
      pending: this.orders.filter(o => o.status === 'pending').length,
      delivered: this.orders.filter(o => o.status === 'delivered').length,
      totalRevenue: this.orders.reduce((sum, o) => sum + o.totalAmount, 0)
    };
  }
}
