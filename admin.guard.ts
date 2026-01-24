import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';

export const adminGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  try {
    // Vérifier si c'est le mode développement avec adminUser dans localStorage
    const adminUser = localStorage.getItem('adminUser');
    if (adminUser) {
      const user = JSON.parse(adminUser);
      if (user.email === 'k.ndiaye5@isepat.edu.sn') {
        return true;
      }
    }

    // Vérifier l'utilisateur Supabase normal
    const { user, error } = await authService.getCurrentUser();
    
    if (!user || error) {
      router.navigate(['/admin-access']);
      return false;
    }

    if (user.email === 'k.ndiaye5@isepat.edu.sn') {
      return true;
    }

    router.navigate(['/dashboard']);
    return false;
  } catch (error) {
    console.error('Admin guard error:', error);
    router.navigate(['/admin-access']);
    return false;
  }
};
