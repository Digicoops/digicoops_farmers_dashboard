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
  isLoading = true;
  searchTerm = '';
  selectedStatus = '';
  selectedPaymentStatus = '';
  userRole: 'admin' | 'cooperative' | 'personal' = 'personal';

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

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(order =>
        order.orderNumber.toLowerCase().includes(term) ||
        order.customerName.toLowerCase().includes(term) ||
        order.customerEmail.toLowerCase().includes(term)
      );
    }

    if (this.selectedStatus) {
      filtered = filtered.filter(order => order.status === this.selectedStatus);
    }

    if (this.selectedPaymentStatus) {
      filtered = filtered.filter(order => order.paymentStatus === this.selectedPaymentStatus);
    }

    this.filteredOrders = filtered;
  }

  onSearch() {
    this.applyFilters();
  }

  clearFilters() {
    this.searchTerm = '';
    this.selectedStatus = '';
    this.selectedPaymentStatus = '';
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
    return classes[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
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
    return classes[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
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
}
