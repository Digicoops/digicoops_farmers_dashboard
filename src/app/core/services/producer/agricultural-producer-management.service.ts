// services/agricultural-producer-management.service.ts
import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from "../auth/auth.service";
import { AgriculturalProducerService, AgriculturalProducerData } from './agricultural-producer.service';

@Injectable({
    providedIn: 'root'
})
export class AgriculturalProducerManagementService {
    private producerService = inject(AgriculturalProducerService);
    private authService = inject(AuthService);
    private router = inject(Router);

    /**
     * Vérifier les permissions de l'utilisateur connecté
     */
    async checkUserPermissions(): Promise<{ hasPermission: boolean; error?: string }> {
        try {
            // Vérifier d'abord si l'utilisateur est connecté
            const { user } = await this.authService.getCurrentUser();
            if (!user) {
                return {
                    hasPermission: false,
                    error: 'Utilisateur non connecté'
                };
            }

            // Vérifier si l'utilisateur est une coopérative
            const isCooperative = await this.producerService.isUserCooperative();
            if (!isCooperative) {
                return {
                    hasPermission: false,
                    error: 'Seules les coopératives peuvent créer des producteurs'
                };
            }

            return { hasPermission: true };
        } catch (error) {
            console.error('Erreur vérification permissions:', error);
            return {
                hasPermission: false,
                error: 'Erreur lors de la vérification des permissions'
            };
        }
    }

    /**
     * Créer un nouveau producteur avec gestion d'erreur améliorée
     */
    async createProducer(producerData: AgriculturalProducerData): Promise<{
        success: boolean;
        error?: string;
        producerId?: string;
        needsEmailConfirmation?: boolean;
    }> {
        try {
            // Validation des données avant envoi
            const validation = this.validateProducerData(producerData);
            if (!validation.isValid) {
                return {
                    success: false,
                    error: validation.errors.join(', ')
                };
            }

            // Vérification des permissions
            const permissionCheck = await this.checkUserPermissions();
            if (!permissionCheck.hasPermission) {
                return {
                    success: false,
                    error: permissionCheck.error
                };
            }

            // Vérification email (optionnelle, continue même en cas d'erreur)
            try {
                const emailCheck = await this.checkEmailExists(producerData.email);
                if (emailCheck.exists) {
                    return {
                        success: false,
                        error: 'Un producteur avec cet email existe déjà'
                    };
                }
            } catch (emailError) {
                console.warn('Vérification email échouée, continuation:', emailError);
                // On continue même si la vérification échoue
            }

            // Création du producteur
            const { producer, error } = await this.producerService.createProducer(producerData);

            if (error) {
                console.error('Erreur création producteur:', error);

                // Vérifier si le producteur a été créé malgré l'erreur
                if (error.code === 'PGRST116' || error.message?.includes('JSON')) {
                    // Attendre et vérifier si le producteur existe
                    await new Promise(resolve => setTimeout(resolve, 2000));

                    const { producers } = await this.producerService.getProducersByCooperative();
                    const existingProducer = producers.find(p => p.email === producerData.email);

                    if (existingProducer) {
                        console.log('✅ Producteur créé malgré erreur technique');
                        return {
                            success: true,
                            producerId: existingProducer.id,
                            needsEmailConfirmation: true
                        };
                    }
                }

                return {
                    success: false,
                    error: this.getErrorMessage(error)
                };
            }

            if (producer) {
                console.log('✅ Producteur créé avec succès:', producer);
                return {
                    success: true,
                    producerId: producer.id,
                    needsEmailConfirmation: true
                };
            }

            return {
                success: false,
                error: 'Erreur inconnue lors de la création'
            };

        } catch (error) {
            console.error('❌ Erreur inattendue createProducer:', error);
            return {
                success: false,
                error: 'Une erreur inattendue est survenue lors de la création'
            };
        }
    }

    /**
     * Valider les données du producteur avant création
     */
    validateProducerData(producerData: AgriculturalProducerData): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        // Validation du prénom
        if (!producerData.first_name?.trim()) {
            errors.push('Le prénom est requis');
        } else if (producerData.first_name.trim().length < 2) {
            errors.push('Le prénom doit contenir au moins 2 caractères');
        }

        // Validation du nom
        if (!producerData.last_name?.trim()) {
            errors.push('Le nom est requis');
        } else if (producerData.last_name.trim().length < 2) {
            errors.push('Le nom doit contenir au moins 2 caractères');
        }

        // Validation de l'email
        if (!producerData.email?.trim()) {
            errors.push('L\'email est requis');
        } else if (!this.isValidEmail(producerData.email)) {
            errors.push('L\'email n\'est pas valide');
        }

        // Validation du nom de l'exploitation
        if (!producerData.farm_name?.trim()) {
            errors.push('Le nom de l\'exploitation est requis');
        } else if (producerData.farm_name.trim().length < 2) {
            errors.push('Le nom de l\'exploitation doit contenir au moins 2 caractères');
        }

        // Validation du mot de passe
        if (!producerData.password) {
            errors.push('Le mot de passe est requis');
        } else if (producerData.password.length < 8) {
            errors.push('Le mot de passe doit contenir au moins 8 caractères');
        } else if (!this.isStrongPassword(producerData.password)) {
            errors.push('Le mot de passe doit contenir des lettres et des chiffres');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Vérifier si un email est déjà utilisé par un producteur de cette coopérative
     */
    async checkEmailExists(email: string): Promise<{ exists: boolean; error?: string }> {
        try {
            const { producer, error } = await this.producerService.getProducerByEmail(email);

            if (error) {
                // Si erreur autre que "aucun résultat", on considère que l'email n'existe pas
                // pour ne pas bloquer la création
                console.warn('Erreur lors de la vérification email, continuation:', error);
                return { exists: false };
            }

            return { exists: !!producer };
        } catch (error) {
            console.error('Erreur vérification email:', error);
            // En cas d'erreur, on continue pour ne pas bloquer l'utilisateur
            return { exists: false };
        }
    }

    /**
     * Récupérer tous les producteurs de la coopérative connectée
     */
    async getCooperativeProducers(): Promise<{ producers: any[]; error?: string }> {
        try {
            const permissionCheck = await this.checkUserPermissions();
            if (!permissionCheck.hasPermission) {
                return {
                    producers: [],
                    error: permissionCheck.error
                };
            }

            const { producers, error } = await this.producerService.getProducersByCooperative();

            if (error) {
                console.error('Erreur récupération producteurs:', error);
                return {
                    producers: [],
                    error: this.getErrorMessage(error)
                };
            }

            return {
                producers: producers || []
            };
        } catch (error) {
            console.error('Erreur inattendue getCooperativeProducers:', error);
            return {
                producers: [],
                error: 'Erreur lors du chargement des producteurs'
            };
        }
    }

    /**
     * Récupérer un producteur spécifique
     */
    async getProducer(producerId: string): Promise<{ producer: any | null; error?: string }> {
        try {
            const permissionCheck = await this.checkUserPermissions();
            if (!permissionCheck.hasPermission) {
                return {
                    producer: null,
                    error: permissionCheck.error
                };
            }

            const { producer, error } = await this.producerService.getProducerById(producerId);

            if (error) {
                return {
                    producer: null,
                    error: this.getErrorMessage(error)
                };
            }

            return { producer };
        } catch (error) {
            console.error('Erreur récupération producteur:', error);
            return {
                producer: null,
                error: 'Erreur lors du chargement du producteur'
            };
        }
    }

    /**
     * Mettre à jour un producteur
     */
    async updateProducer(producerId: string, updates: Partial<AgriculturalProducerData>): Promise<{ success: boolean; error?: string }> {
        try {
            const permissionCheck = await this.checkUserPermissions();
            if (!permissionCheck.hasPermission) {
                return {
                    success: false,
                    error: permissionCheck.error
                };
            }

            const { producer, error } = await this.producerService.updateProducer(producerId, updates);

            if (error) {
                return {
                    success: false,
                    error: this.getErrorMessage(error)
                };
            }

            return {
                success: true
            };
        } catch (error) {
            console.error('Erreur mise à jour producteur:', error);
            return {
                success: false,
                error: 'Erreur lors de la mise à jour du producteur'
            };
        }
    }

    /**
     * Désactiver un producteur
     */
    async deactivateProducer(producerId: string): Promise<{ success: boolean; error?: string }> {
        try {
            const permissionCheck = await this.checkUserPermissions();
            if (!permissionCheck.hasPermission) {
                return {
                    success: false,
                    error: permissionCheck.error
                };
            }

            const { success, error } = await this.producerService.updateProducerStatus(producerId, 'inactive');

            if (error) {
                return {
                    success: false,
                    error: this.getErrorMessage(error)
                };
            }

            return {
                success: true
            };
        } catch (error) {
            console.error('Erreur désactivation producteur:', error);
            return {
                success: false,
                error: 'Erreur lors de la désactivation du producteur'
            };
        }
    }

    /**
     * Rediriger après création réussie
     */
    navigateAfterSuccess(producerId?: string): void {
        if (producerId) {
            this.router.navigate(['/agricultural-producers', 'details', producerId]);
        } else {
            this.router.navigate(['/agricultural-producers']);
        }
    }

    /**
     * Rediriger vers la liste des producteurs
     */
    navigateToProducersList(): void {
        this.router.navigate(['/agricultural-producers']);
    }

    /**
     * Rediriger vers l'édition d'un producteur
     */
    navigateToEditProducer(producerId: string): void {
        this.router.navigate(['/agricultural-producers', 'edit', producerId]);
    }


    /**
     * Mettre à jour le statut d'un producteur
     */
    async updateProducerStatus(producerId: string, status: string): Promise<{ success: boolean; error?: string }> {
        try {
            const permissionCheck = await this.checkUserPermissions();
            if (!permissionCheck.hasPermission) {
                return {
                    success: false,
                    error: permissionCheck.error
                };
            }

            // Utiliser updateProducer pour changer le statut
            const { success, error } = await this.updateProducer(producerId, {
                account_status: status
            });

            if (error) {
                return {
                    success: false,
                    error: this.getErrorMessage(error)
                };
            }

            return {
                success: true
            };
        } catch (error) {
            console.error('Erreur mise à jour statut producteur:', error);
            return {
                success: false,
                error: 'Erreur lors de la mise à jour du statut du producteur'
            };
        }
    }

    /**
     * Obtenir un message d'erreur lisible
     */
    private getErrorMessage(error: any): string {
        console.log('📋 Détails de l\'erreur:', error);

        const errorMap: { [key: string]: string } = {
            // Erreurs d'authentification Supabase
            'User already registered': 'Un compte existe déjà avec cet email. L\'utilisateur doit confirmer son adresse email.',
            'invalid_email': 'Adresse email invalide.',
            'weak_password': 'Le mot de passe est trop faible.',
            'email_not_confirmed': 'Email non confirmé.',

            // Erreurs de base de données
            '23505': 'Un producteur avec cet email existe déjà.',
            '42501': 'Erreur de permissions. Vérifiez que vous êtes bien connecté en tant que coopérative.',
            '23503': 'Donnée référentielle invalide. Vérifiez les informations fournies.',

            // Erreurs réseau
            'Network error': 'Erreur de connexion. Vérifiez votre connexion internet.',
            'JWT expired': 'Session expirée. Veuillez vous reconnecter.',

            // Erreurs métier
            'Seules les coopératives peuvent créer des producteurs': 'Action non autorisée. Seules les coopératives peuvent créer des producteurs.',

            // Erreurs PostgREST
            'PGRST116': 'Erreur technique lors de la création. Le producteur a peut-être été créé malgré tout.',
            'Cannot coerce the result to a single JSON object': 'Erreur technique. Vérifiez que le producteur a bien été créé.',
        };

        // Priorité au code d'erreur
        if (error?.code) {
            return errorMap[error.code] || error.message || 'Erreur système lors de la création.';
        }

        // Puis au message d'erreur
        if (error?.message) {
            return errorMap[error.message] || error.message;
        }

        // Enfin, erreur générique
        return 'Erreur inconnue lors de la création du producteur. Veuillez réessayer.';
    }

    /**
     * Validation d'email simple
     */
    private isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Validation de la force du mot de passe
     */
    private isStrongPassword(password: string): boolean {
        // Au moins une lettre et un chiffre
        const hasLetter = /[a-zA-Z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        return hasLetter && hasNumber;
    }
}