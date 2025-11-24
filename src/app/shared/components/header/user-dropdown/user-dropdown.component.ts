import {Component, inject, OnInit} from '@angular/core';
import { DropdownComponent } from '../../ui/dropdown/dropdown.component';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DropdownItemTwoComponent } from '../../ui/dropdown/dropdown-item/dropdown-item.component-two';
import {AuthService} from "../../../../core/services/auth/auth.service";
import {AuthManagementService} from "../../../../core/services/auth/auth-managment.service";

@Component({
  selector: 'app-user-dropdown',
  templateUrl: './user-dropdown.component.html',
  imports:[CommonModule,RouterModule,DropdownComponent,DropdownItemTwoComponent]
})
export class UserDropdownComponent implements OnInit {
  isOpen = false;

  // États du composant
  isLoading = false;
  errorMessage = '';
  currentUser: any = null;
  userProfile: any = null;
  userType: 'personal' | 'cooperative' | 'producer' | null = null;
  isCooperative = false;

  private authService = inject(AuthService);
  private authManagementService = inject(AuthManagementService);

  async ngOnInit() {
    await this.loadUserData();
  }

  toggleDropdown() {
    this.isOpen = !this.isOpen;
  }

  closeDropdown() {
    this.isOpen = false;
  }

  async logout() {
    try {
      await this.authManagementService.logout();
      this.closeDropdown();
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      this.errorMessage = 'Erreur lors de la déconnexion';
    }
  }

  getUserInitials(): string {
    // Utilisez les métadonnées de currentUser si userProfile n'est pas encore chargé
    const name = this.fullName;
    if (!name || name === 'Utilisateur') return 'U';

    const initials = name
        .split(' ')
        .map(n => n[0] || '')
        .join('')
        .toUpperCase();

    return initials || 'U';
  }

  /**
   * Charger les données de l'utilisateur connecté
   */
  private async loadUserData() {
    this.isLoading = true;
    try {
      // 1. Récupérer l'utilisateur auth de base
      const { user, error: userError } = await this.authService.getCurrentUser();

      if (userError || !user) {
        this.errorMessage = 'Aucun utilisateur connecté';
        return;
      }

      this.currentUser = user;
      console.log('Utilisateur auth:', this.currentUser);

      // 2. Récupérer le profil COMPLET depuis la base de données
      const { profile, error: profileError } = await this.authManagementService.getUserProfile();

      if (profileError) {
        console.error('Erreur récupération profil:', profileError);
        // Utilisez les métadonnées de l'utilisateur auth comme fallback
        this.userProfile = {
          first_name: user.user_metadata?.['first_name'],
          last_name: user.user_metadata?.['last_name'],
          email: user.email,
          phone: user.user_metadata?.['phone'],
          shop_name: user.user_metadata?.['shop_name'],
          profile: user.user_metadata?.['profile'] || 'personal'
        };
        console.log('Utilisation des métadonnées comme fallback:', this.userProfile);
      } else {
        this.userProfile = profile;
        console.log('Profil complet:', this.userProfile);
      }

      // 3. Déterminer le type de profil
      this.userType = this.userProfile?.profile || 'personal';
      this.isCooperative = this.userType === 'cooperative';

    } catch (error) {
      console.error('Erreur loadUserData:', error);
      this.errorMessage = 'Erreur lors du chargement des données utilisateur';
    } finally {
      this.isLoading = false;
    }
  }

  // Getters pour accéder facilement aux informations
  get fullName(): string {
    if (this.userProfile) {
      return `${this.userProfile.first_name || ''} ${this.userProfile.last_name || ''}`.trim();
    }

    // Fallback sur les métadonnées de currentUser
    if (this.currentUser?.user_metadata) {
      return `${this.currentUser.user_metadata.first_name || ''} ${this.currentUser.user_metadata.last_name || ''}`.trim();
    }

    return 'Utilisateur';
  }

  get email(): string {
    return this.userProfile?.email || this.currentUser?.email || '';
  }

  get phone(): string {
    return this.userProfile?.phone || this.currentUser?.user_metadata?.phone || '';
  }

  get shopName(): string {
    return this.userProfile?.shop_name || this.currentUser?.user_metadata?.shop_name || '';
  }

  get profileType(): string {
    return this.userProfile?.profile || this.currentUser?.user_metadata?.profile || 'personal';
  }

  // Méthode pour rafraîchir les données
  async refreshUserData() {
    await this.loadUserData();
  }
}