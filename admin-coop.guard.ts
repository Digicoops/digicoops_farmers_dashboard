// admin-coop.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthManagementService } from "../services/auth/auth-managment.service";

export const adminCoopGuard: CanActivateFn = async () => {
    const authManagement = inject(AuthManagementService);
    const router = inject(Router);

    const { profile } = await authManagement.getUserProfile();

    // Autoriser uniquement les admins et les coopératives
    if (profile?.profile === 'ADMIN' || profile?.profile === 'COOPERATIVE') {
        return true;
    }

    // Rediriger les producteurs vers leur dashboard
    router.navigate(['/dashboard']);
    return false;
};
