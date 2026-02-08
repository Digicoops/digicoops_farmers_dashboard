import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageBreadcrumbComponent } from '../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';
import { AuthService } from '../../../core/services/auth/auth.service';
import { AgriculturalProducerManagementService } from '../../../core/services/producer/agricultural-producer-management.service';

interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  shop_name?: string;
  shop_adresse?: string;
  profile: string;
  created_at: string;
  confirmed_at?: string;
  last_sign_in_at?: string;
  banned_until?: string;
  raw_user_meta_data?: any;
  account_status: string; // Computed from banned_until
}

@Component({
  selector: 'app-users-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PageBreadcrumbComponent,
    ButtonComponent
  ],
  templateUrl: './users-management.component.html'
})
export class UsersManagementComponent implements OnInit {
  private authService = inject(AuthService);
  private producerManagement = inject(AgriculturalProducerManagementService);

  users: User[] = [];
  filteredUsers: User[] = [];
  isLoading = false;
  isSyncing = false;
  searchTerm = '';
  selectedProfile = '';
  selectedStatus = '';
  
  // Sidebar state
  showRightSidebar = false;
  sidebarMode: 'view' | 'edit' = 'view';
  selectedUser: User | null = null;
  
  // Modal state
  showDeactivateModal = false;
  userToDeactivate: User | null = null;

  profileOptions = [
    { value: '', label: 'Tous les profils' },
    { value: 'personal', label: 'Particulier' },
    { value: 'cooperative', label: 'Coopérative' },
    { value: 'admin', label: 'Administrateur' }
  ];

  statusOptions = [
    { value: '', label: 'Tous les statuts' },
    { value: 'active', label: 'Actif' },
    { value: 'inactive', label: 'Inactif' },
    { value: 'pending', label: 'En attente' }
  ];

  async ngOnInit() {
    await this.loadUsers();
  }

  async loadUsers() {
    try {
      this.isLoading = true;
      
      // Récupérer tous les utilisateurs depuis Supabase
      const { users, error } = await this.authService.getAllUsers();
      
      console.log('📊 Résultat getAllUsers:', { users, error, count: users?.length });
      
      if (error) {
        console.error('❌ Erreur chargement utilisateurs:', error);
        this.users = [];
      } else if (users) {
        console.log('✅ Nombre d\'utilisateurs reçus:', users.length);
        
        // Transformer les données Supabase en format User
        this.users = users.map((u: any) => {
          const metadata = u.raw_user_meta_data || {};
          return {
            id: u.id,
            email: u.email,
            first_name: metadata.first_name || u.first_name,
            last_name: metadata.last_name || u.last_name,
            phone: metadata.phone || u.phone,
            shop_name: metadata.shop_name,
            shop_adresse: metadata.shop_adresse,
            profile: metadata.profile || u.profile || 'personal',
            created_at: u.created_at,
            confirmed_at: u.confirmed_at,
            last_sign_in_at: u.last_sign_in_at,
            banned_until: u.banned_until,
            raw_user_meta_data: metadata,
            account_status: u.banned_until ? 'inactive' : 'active'
          };
        });
        
        console.log('✅ Utilisateurs transformés:', this.users.length);
      }

      this.applyFilters();
      console.log('✅ Utilisateurs filtrés:', this.filteredUsers.length);
    } catch (error) {
      console.error('❌ Erreur chargement utilisateurs:', error);
      this.users = [];
    } finally {
      this.isLoading = false;
    }
  }

  applyFilters() {
    console.log('🔍 applyFilters - Début:', {
      totalUsers: this.users.length,
      searchTerm: this.searchTerm,
      selectedProfile: this.selectedProfile,
      selectedStatus: this.selectedStatus
    });

    let filtered = [...this.users];
    console.log('📋 Utilisateurs avant filtrage:', filtered.length);

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(user =>
        user.email.toLowerCase().includes(term) ||
        user.first_name?.toLowerCase().includes(term) ||
        user.last_name?.toLowerCase().includes(term)
      );
      console.log('📋 Après filtre recherche:', filtered.length);
    }

    if (this.selectedProfile) {
      filtered = filtered.filter(user => user.profile === this.selectedProfile);
      console.log('📋 Après filtre profil:', filtered.length);
    }

    if (this.selectedStatus) {
      filtered = filtered.filter(user => user.account_status === this.selectedStatus);
      console.log('📋 Après filtre statut:', filtered.length);
    }

    this.filteredUsers = filtered;
    console.log('✅ Résultat final filteredUsers:', this.filteredUsers.length);
  }

  onSearch() {
    this.applyFilters();
  }

  clearFilters() {
    this.searchTerm = '';
    this.selectedProfile = '';
    this.selectedStatus = '';
    this.applyFilters();
  }

  getProfileBadgeClass(profile: string): string {
    const classes: { [key: string]: string } = {
      'admin': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      'cooperative': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      'personal': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    };
    return classes[profile] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
  }

  getProfileLabel(profile: string): string {
    const labels: { [key: string]: string } = {
      'admin': 'Administrateur',
      'cooperative': 'Coopérative',
      'personal': 'Particulier'
    };
    return labels[profile] || profile;
  }

  getStatusBadgeClass(status?: string): string {
    const classes: { [key: string]: string } = {
      'active': 'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400',
      'inactive': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      'pending': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
    };
    return classes[status || 'active'] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
  }

  getStatusLabel(status?: string): string {
    const labels: { [key: string]: string } = {
      'active': 'Actif',
      'inactive': 'Inactif',
      'pending': 'En attente'
    };
    return labels[status || 'active'] || status || 'Actif';
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  openDeactivateModal(user: User) {
    this.userToDeactivate = user;
    this.showDeactivateModal = true;
  }
  
  closeDeactivateModal() {
    this.showDeactivateModal = false;
    this.userToDeactivate = null;
  }
  
  async confirmToggleStatus() {
    if (!this.userToDeactivate) return;
    
    const user = this.userToDeactivate;
    const newStatus = user.account_status === 'active' ? 'inactive' : 'active';
    
    try {
      const { success } = await this.authService.updateUserStatus(user.id, newStatus);
      
      if (success) {
        user.account_status = newStatus;
        this.closeDeactivateModal();
        alert(`Statut de l'utilisateur mis à jour avec succès`);
        await this.loadUsers();
      } else {
        alert(`Erreur lors de la mise à jour du statut`);
      }
    } catch (error) {
      console.error('Erreur changement statut:', error);
      alert(`Erreur: ${error}`);
    }
  }

  viewUser(user: User) {
    this.selectedUser = { ...user };
    this.sidebarMode = 'view';
    this.showRightSidebar = true;
  }

  editUser(user: User) {
    this.selectedUser = { ...user };
    this.sidebarMode = 'edit';
    this.showRightSidebar = true;
  }
  
  closeSidebar() {
    this.showRightSidebar = false;
    this.selectedUser = null;
  }
  
  saveUserChanges() {
    if (!this.selectedUser) return;
    
    console.log('Saving user changes:', this.selectedUser);
    // TODO: Implement API call to update user
    alert('Modifications enregistrées avec succès');
    this.closeSidebar();
    this.loadUsers();
  }

  async deleteUser(user: User) {
    if (confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur ${user.email} ?`)) {
      const { success, error } = await this.authService.deleteUser(user.id);
      
      if (success) {
        await this.loadUsers();
      } else {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression de l\'utilisateur');
      }
    }
  }

  async refreshUsers() {
    try {
      this.isSyncing = true;
      console.log('🔄 Synchronisation des utilisateurs...');
      
      const { synced_count, error } = await this.authService.forceSyncAllUsers();
      
      if (error) {
        console.error('Erreur lors de la synchronisation:', error);
        alert('Erreur lors de la synchronisation des utilisateurs');
      } else {
        console.log(`✅ ${synced_count} utilisateurs synchronisés`);
        await this.loadUsers();
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la synchronisation');
    } finally {
      this.isSyncing = false;
    }
  }
}
