import { inject, Injectable } from '@angular/core';
import { createClient, SupabaseClient, User, AuthError, Session } from '@supabase/supabase-js';
import { PostgrestError } from '@supabase/supabase-js';
import { environment } from "../../../../environments/environment.development";
import {CryptoService} from "../../security/crypto.service";

export interface SignUpData {
    first_name: string;
    last_name: string;
    shop_name: string;
    shop_adresse: string;
    profile: string;
    email: string;
    password: string;
    phone: string;
}

export interface LoginData {
    email: string;
    password: string;
}

export type AuthServiceError = AuthError | PostgrestError | Error;

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private supabase: SupabaseClient;
    private cryptoService = inject(CryptoService);

    constructor() {
        this.supabase = createClient(environment.supabase.url, environment.supabase.key, {
            auth: {
                autoRefreshToken: false, // Désactiver le refresh automatique
                persistSession: true,
                detectSessionInUrl: true,
                flowType: 'pkce' // Utiliser PKCE flow
            }
        });

        // Écouter les changements d'état d'authentification
        this.setupAuthStateListener();
    }

    /** Écouter les changements d'authentification */
    private setupAuthStateListener() {
        this.supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth state changed:', event, session);

            if (event === 'SIGNED_IN' && session) {
                // Sauvegarder les données utilisateur cryptées
                await this.saveUserDataToStorage(session.user);
            } else if (event === 'SIGNED_OUT') {
                // Nettoyer le stockage
                this.cryptoService.clearEncryptedData();
            } else if (event === 'TOKEN_REFRESHED') {
                // Mettre à jour les données stockées
                if (session?.user) {
                    await this.saveUserDataToStorage(session.user);
                }
            }
        });
    }

    /** Sauvegarder les données utilisateur cryptées */
    private async saveUserDataToStorage(user: User) {
        const userData = {
            id: user.id,
            email: user.email,
            user_metadata: user.user_metadata,
            last_updated: new Date().toISOString()
        };
        await this.cryptoService.saveEncryptedData(userData);
    }

    /** Récupérer les données utilisateur depuis le stockage crypté */
    async getCachedUser(): Promise<User | null> {
        const cachedData = await this.cryptoService.getEncryptedData();
        if (!cachedData) return null;

        // Vérifier si les données ne sont pas trop vieilles (optionnel)
        const lastUpdated = new Date(cachedData.last_updated);
        const now = new Date();
        const hoursDiff = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);

        if (hoursDiff > 24) { // 24 heures max
            this.cryptoService.clearEncryptedData();
            return null;
        }

        return cachedData as User;
    }

    /** SIGN UP / INSCRIPTION avec URL de redirection */
    async signUp(signUpData: SignUpData): Promise<{ user: User | null; error: AuthError | null }> {
        const { data: authData, error: authError } = await this.supabase.auth.signUp({
            email: signUpData.email,
            password: signUpData.password,
            phone: signUpData.phone,
            options: {
                data: {
                    first_name: signUpData.first_name,
                    last_name: signUpData.last_name,
                    shop_name: signUpData.shop_name,
                    shop_adresse: signUpData.shop_adresse,
                    profile: signUpData.profile,
                    phone: signUpData.phone
                },
                emailRedirectTo: `${window.location.origin}/login`


            }
        });

        if (authError) {
            return { user: null, error: authError };
        }

        if (authData.user) {
            const { error: dbError } = await this.supabase
                .from('users')
                .insert({
                    id: authData.user.id,
                    first_name: signUpData.first_name,
                    last_name: signUpData.last_name,
                    shop_name: signUpData.shop_name,
                    shop_adresse: signUpData.shop_adresse,
                    profile: signUpData.profile,
                    email: signUpData.email,
                    phone: signUpData.phone,
                    created_at: new Date().toISOString()
                });

            if (dbError) {
                console.error('Erreur création user en base:', dbError);
            } else if (authData.user) {
                await this.saveUserDataToStorage(authData.user);
            }
        }

        return { user: authData.user, error: null };
    }

    /** SIGN IN / CONNEXION avec gestion du token */
    async signIn(loginData: LoginData): Promise<{ session: Session | null; error: AuthError | null }> {
        try {
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email: loginData.email,
                password: loginData.password
            });

            if (data?.session && data.user) {
                await this.saveUserDataToStorage(data.user);
            }

            return { session: data?.session || null, error };
        } catch (error) {
            return { session: null, error: error as AuthError };
        }
    }


    /** RÉCUPÉRER L'EMAIL PAR TÉLÉPHONE DEPUIS LES METADATA */
    async getEmailByPhone(phone: string): Promise<{ email: string | null; error: AuthServiceError | null }> {
        try {
            // Reconstituer le numéro complet avec +221
            // const fullPhone = `+221${phone}`;
            const fullPhone = phone;

            console.log('Recherche du téléphone:', fullPhone);

            // Chercher l'utilisateur par téléphone dans auth.users via la fonction RPC
            const { data: userData, error: queryError } = await this.supabase
                .rpc('get_user_email_by_phone', { phone_number: fullPhone });

            if (queryError) {
                console.error('Erreur RPC:', queryError);
                return { email: null, error: queryError };
            }

            if (!userData || userData.length === 0) {
                console.error('Aucun utilisateur trouvé avec le téléphone:', fullPhone);
                return { email: null, error: new Error('Utilisateur non trouvé') };
            }

            console.log('Email trouvé:', userData[0].email);
            return { email: userData[0].email, error: null };

        } catch (error) {
            console.error('Erreur getEmailByPhone:', error);
            return { email: null, error: error as Error };
        }
    }

    /** SIGN IN WITH PHONE / CONNEXION PAR TÉLÉPHONE */
    /** SIGN IN WITH PHONE / CONNEXION PAR TÉLÉPHONE */
    async signInWithPhone(phone: string, password: string): Promise<{ session: Session | null; error: AuthServiceError | null }> {
        try {
            // Reconstituer le numéro avec le +221 pour la recherche
            // const fullPhone = `+221${phone}`;
            const fullPhone = phone;

            console.log('Recherche du téléphone:', fullPhone);

            // 1. Chercher l'utilisateur par téléphone dans la table users
            const { data: userData, error: queryError } = await this.supabase
                .from('users')
                .select('email')
                .eq('phone', fullPhone) // Chercher avec le +221
                .single();

            if (queryError || !userData) {
                console.error('Utilisateur non trouvé avec le téléphone:', fullPhone);
                return { session: null, error: new Error('Utilisateur non trouvé') };
            }

            console.log('Email trouvé:', userData.email);

            // 2. Connexion avec l'email récupéré
            const { session, error } = await this.signIn({
                email: userData.email,
                password: password
            });

            return { session, error };

        } catch (error) {
            console.error('Erreur signInWithPhone:', error);
            return { session: null, error: error as Error };
        }
    }


    /** RENVOYER L'EMAIL DE CONFIRMATION */
    async resendConfirmationEmail(email: string): Promise<{ error: AuthError | null }> {
        const { error } = await this.supabase.auth.resend({
            type: 'signup',
            email: email
        });
        return { error };
    }

    /** RÉCUPÉRER LES INFORMATIONS DE CONFIRMATION */
    async getConfirmationInfo(): Promise<{
        emailConfirmed: boolean;
        phoneConfirmed: boolean;
        confirmedAt: string | null
    }> {
        const { user } = await this.getCurrentUser();
        return {
            emailConfirmed: user?.email_confirmed_at !== null,
            phoneConfirmed: user?.phone_confirmed_at !== null,
            confirmedAt: user?.confirmed_at || null
        };
    }

    /** METTRE À JOUR L'UTILISATEUR APRÈS CONFIRMATION */
    async updateUserAfterConfirmation(): Promise<{ user: User | null; error: AuthError | null }> {
        const { data, error } = await this.supabase.auth.getUser();

        if (data.user) {
            await this.saveUserDataToStorage(data.user);
        }

        return { user: data.user, error };
    }

    /** VÉRIFIER SI L'EMAIL EST CONFIRMÉ */
    async isEmailConfirmed(): Promise<boolean> {
        const { user } = await this.getCurrentUser();
        return user?.email_confirmed_at !== null;
    }

    /** VÉRIFIER SI LE COMPTE EST CONFIRMÉ */
    async isUserConfirmed(): Promise<boolean> {
        const { user } = await this.getCurrentUser();
        return user?.confirmed_at !== null;
    }


    /** GET CURRENT USER avec fallback sur cache */
    async getCurrentUser(): Promise<{ user: User | null; error: AuthError | null }> {
        try {
            // D'abord essayer de récupérer depuis Supabase (vérifie le token)
            const { data, error } = await this.supabase.auth.getUser();

            if (error) {
                console.log('Erreur getUser, utilisation du cache:', error.message);
                // Si erreur (token expiré), utiliser le cache
                const cachedUser = await this.getCachedUser();
                return { user: cachedUser, error: null };
            }

            if (data.user) {
                // Mettre à jour le cache
                await this.saveUserDataToStorage(data.user);
                return { user: data.user, error: null };
            }

            return { user: null, error: null };
        } catch (error) {
            console.error('Erreur getCurrentUser:', error);
            const cachedUser = await this.getCachedUser();
            return { user: cachedUser, error: null };
        }
    }

    /** FORCER LE REFRESH DU TOKEN */
    async refreshSession(): Promise<{ session: Session | null; error: AuthError | null }> {
        const { data, error } = await this.supabase.auth.refreshSession();

        if (data.session && data.user) {
            await this.saveUserDataToStorage(data.user);
        }

        return { session: data.session, error };
    }

    /** VÉRIFIER SI LE TOKEN EST EXPIRÉ */
    async isTokenExpired(): Promise<boolean> {
        const { data } = await this.supabase.auth.getSession();
        if (!data.session) return true;

        const expiresAt = data.session.expires_at;
        if (!expiresAt) return true;

        const now = Math.floor(Date.now() / 1000);
        return now >= expiresAt;
    }

    /** GET USER PROFILE FROM DATABASE */
    async getUserProfile(userId: string): Promise<{ profile: any | null; error: PostgrestError | null }> {
        const { data, error } = await this.supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        return { profile: data, error };
    }

    /** UPDATE USER PROFILE */
    async updateUserProfile(userId: string, profileData: Partial<SignUpData>): Promise<{ success: boolean; error: PostgrestError | null }> {
        const { error } = await this.supabase
            .from('users')
            .update(profileData)
            .eq('id', userId);

        if (error) {
            return { success: false, error };
        }

        await this.supabase.auth.updateUser({
            data: {
                first_name: profileData.first_name,
                last_name: profileData.last_name,
                shop_name: profileData.shop_name,
                shop_adresse: profileData.shop_adresse,
                profile: profileData.profile
            }
        });

        return { success: true, error: null };
    }

    /** SIGN OUT / DÉCONNEXION */
    async signOut(): Promise<{ error: AuthError | null }> {
        this.cryptoService.clearEncryptedData();
        const { error } = await this.supabase.auth.signOut();
        return { error };
    }

    /** GET USER METADATA */
    async getUserMetadata(): Promise<any> {
        const { user } = await this.getCurrentUser();
        return user?.user_metadata || null;
    }

    /** UPDATE USER METADATA */
    async updateUserMetadata(metadata: any): Promise<{ user: User | null; error: AuthError | null }> {
        const { data, error } = await this.supabase.auth.updateUser({
            data: metadata
        });

        if (data.user) {
            await this.saveUserDataToStorage(data.user);
        }

        return { user: data.user, error };
    }

    /** CHECK AUTH STATE */
    getAuthState() {
        return this.supabase.auth.onAuthStateChange;
    }

    /** GET SESSION */
    async getSession(): Promise<{ session: Session | null; error: AuthError | null }> {
        const { data, error } = await this.supabase.auth.getSession();
        return { session: data.session, error };
    }

    /** IS AUTHENTICATED */
    async isAuthenticated(): Promise<boolean> {
        const { user } = await this.getCurrentUser();
        return !!user;
    }
// Dans AuthService, ajoutez ces méthodes :

    /** RÉINITIALISER LE MOT DE PASSE PAR EMAIL */
    async resetPassword(email: string): Promise<{ error: AuthError | null }> {
        const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/update-password`
        });

        return { error };
    }

    /** METTRE À JOUR LE MOT DE PASSE (après le lien de réinitialisation) */
    async updatePassword(newPassword: string): Promise<{ user: User | null; error: AuthError | null }> {
        const { data, error } = await this.supabase.auth.updateUser({
            password: newPassword
        });

        return { user: data.user, error };
    }

    /** VÉRIFIER SI LA SESSION EST EN MODE RÉCUPÉRATION */

// Dans AuthService, modifiez isRecoverySession()
    /** VÉRIFIER SI LA SESSION EST EN MODE RÉCUPÉRATION */
    // isRecoverySession(): boolean {
    //     const hash = window.location.hash;
    //     console.log('URL Hash:', hash);
    //
    //
    //     // Vérifier si c'est une URL de récupération (même avec erreur)
    //     const isRecoveryUrl = hash.includes('type=recovery') ||
    //         hash.includes('access_token') ||
    //         hash.includes('error_code=otp_expired');
    //
    //     console.log('Is recovery URL:', isRecoveryUrl);
    //     return isRecoveryUrl;
    // }

    isRecoverySession(): boolean {
        // La façon la plus simple : vérifier l'URL complète
        const url = window.location.href;
        console.log('Current URL:', url);

        // Si on est sur la page update-password, c'est très probablement une tentative de récupération
        const isRecovery = url.includes('update-password');

        console.log('Is recovery session:', isRecovery);
        return isRecovery;
    }


}