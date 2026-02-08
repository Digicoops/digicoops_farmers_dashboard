// admin.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import {AuthManagementService} from "../services/auth/auth-managment.service";

export const adminGuard: CanActivateFn = async () => {
    const authManagement = inject(AuthManagementService);
    const router = inject(Router);

    const isAuthenticated = await authManagement.isAuthenticated();
    
    if (!isAuthenticated) {
        router.navigate(['/login']);
        return false;
    }

    const { profile } = await authManagement.getUserProfile();
    const email = profile?.email;

    if (email && (email.endsWith('@octus-agency.com') || email.endsWith('@digicoops.com'))) {
        return true;
    }

    router.navigate(['/unauthorized']);
    return false;
};
