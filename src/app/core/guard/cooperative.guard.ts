// cooperative.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import {AuthManagementService} from "../services/auth/auth-managment.service";

export const cooperativeGuard: CanActivateFn = async () => {
    const authManagement = inject(AuthManagementService);
    const router = inject(Router);

    const { profile } = await authManagement.getUserProfile();

    if (profile?.profile === 'cooperative') {
        return true;
    }

    router.navigate(['/unauthorized']);
    return false;
};