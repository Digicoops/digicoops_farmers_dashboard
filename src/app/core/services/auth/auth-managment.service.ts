import { inject, Injectable } from '@angular/core';
import { AuthService, SignUpData, LoginData } from './auth.service';
import { Router } from '@angular/router';

@Injectable({
    providedIn: 'root'
})
export class AuthManagementService {
    private authService = inject(AuthService);
    private router = inject(Router);

    /** -------- REGISTER -------- */
    async register(signUpData: SignUpData): Promise<{ success: boolean; error?: string }> {
        const { user, error } = await this.authService.signUp(signUpData);

        if (error) {
            console.error('Erreur inscription:', error.message);
            return { success: false, error: error.message };
        }

        if (user) {
            console.log('Utilisateur créé:', user);
            return { success: true };
        }

        return { success: false, error: 'Erreur inconnue' };
    }

    /** -------- LOGIN -------- */
    /** LOGIN avec gestion de token */
    async login(loginData: LoginData): Promise<{ success: boolean; error?: string }> {
        const { session, error } = await this.authService.signIn(loginData);

        if (error) {
            console.error('Erreur connexion:', error.message);
            return { success: false, error: error.message };
        }

        if (session) {
            console.log('Connexion réussie');
            return { success: true };
        }

        return { success: false, error: 'Erreur inconnue' };
    }

    /** RÉCUPÉRER L'EMAIL PAR TÉLÉPHONE (pour usage externe) */
    async getEmailByPhone(phone: string): Promise<{ email: string | null; error?: string }> {
        const { email, error } = await this.authService.getEmailByPhone(phone);

        if (error) {
            return { email: null, error: error.message };
        }

        return { email };
    }

    /** LOGIN WITH PHONE */
    async loginWithPhone(phone: string, password: string): Promise<{ success: boolean; error?: string }> {
        // 1. Récupérer l'email associé au téléphone
        const { email, error: emailError } = await this.getEmailByPhone(phone);

        if (emailError || !email) {
            return { success: false, error: emailError || 'Utilisateur non trouvé' };
        }

        // 2. Connexion avec l'email récupéré
        const loginData: LoginData = {
            email: email,
            password: password
        };

        return await this.login(loginData);
    }


    /** VÉRIFIER LA CONFIRMATION DU COMPTE */
    async checkAccountConfirmation(): Promise<{
        isConfirmed: boolean;
        emailConfirmed: boolean;
        error?: string
    }> {
        try {
            const confirmationInfo = await this.authService.getConfirmationInfo();
            return {
                isConfirmed: confirmationInfo.confirmedAt !== null,
                emailConfirmed: confirmationInfo.emailConfirmed
            };
        } catch (error) {
            return {
                isConfirmed: false,
                emailConfirmed: false,
                error: 'Erreur lors de la vérification'
            };
        }
    }

    /** RENVOYER L'EMAIL DE CONFIRMATION */
    async resendConfirmationEmail(email: string): Promise<{ success: boolean; error?: string }> {
        const { error } = await this.authService.resendConfirmationEmail(email);

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true };
    }


    /** VÉRIFIER ET REFRESH LE TOKEN SI NÉCESSAIRE */
    async checkAndRefreshToken(): Promise<boolean> {
        const isExpired = await this.authService.isTokenExpired();

        if (isExpired) {
            console.log('Token expiré, tentative de refresh...');
            const { session, error } = await this.authService.refreshSession();

            if (error) {
                console.error('Erreur refresh token:', error.message);
                await this.logout();
                return false;
            }

            return !!session;
        }

        return true;
    }
    /** -------- GET USER PROFILE -------- */
    async getUserProfile(): Promise<{ profile: any | null; error?: string }> {
        const { user } = await this.authService.getCurrentUser();

        if (!user) {
            return { profile: null, error: 'Utilisateur non connecté' };
        }

        const { profile, error } = await this.authService.getUserProfile(user.id);

        if (error) {
            return { profile: null, error: error.message };
        }

        return { profile };
    }

    /** -------- UPDATE USER PROFILE -------- */
    async updateUserProfile(profileData: Partial<SignUpData>): Promise<{ success: boolean; error?: string }> {
        const { user } = await this.authService.getCurrentUser();

        if (!user) {
            return { success: false, error: 'Utilisateur non connecté' };
        }

        const { success, error } = await this.authService.updateUserProfile(user.id, profileData);

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true };
    }

    /** -------- LOGOUT -------- */
    async logout(): Promise<{ success: boolean; error?: string }> {
        const { error } = await this.authService.signOut();
        if (error) {
            console.error('Erreur déconnexion:', error.message);
            return { success: false, error: error.message };
        } else {
            this.router.navigate(['/login']);
            return { success: true };
        }
    }

    /** -------- CHECK AUTHENTICATION -------- */
    async isAuthenticated(): Promise<boolean> {
        return await this.authService.isAuthenticated();
    }

    // Récupérer seulement les métadonnées (plus léger)
    async getUserMetadata() {
        const metadata = await this.authService.getUserMetadata();
        console.log('Métadonnées:', metadata);
        return metadata;
    }

    // Ajouter cette méthode dans AuthManagementService
    async resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
        try {
            const { error } = await this.authService.resetPassword(email);

            if (error) {
                console.error('Erreur reset password:', error.message);
                return { success: false, error: error.message };
            }

            return { success: true };
        } catch (error) {
            console.error('Erreur reset password:', error);
            return { success: false, error: 'Erreur lors de la réinitialisation' };
        }
    }
}