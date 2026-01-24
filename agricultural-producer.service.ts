// services/agricultural-producer.service.ts
import { inject, Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from "../../../../environments/environment.development";
import { AuthService } from "../auth/auth.service";

export interface AgriculturalProducerData {
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
    farm_name: string;
    location?: string;
    production_type?: string;
    description?: string;
    password: string;
    account_status?: string;
}

export interface AgriculturalProducer {
    id: string;
    created_by_user_id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    farm_name: string;
    location?: string;
    production_type?: string;
    description?: string;
    account_status: string;
    role: string;
    created_at: string;
    updated_at: string;
}

export interface CreateAgriculturalProducerResponse {
    producer: AgriculturalProducer | null;
    error: any | null;
}

@Injectable({
    providedIn: 'root'
})
export class AgriculturalProducerService {
    private supabase: SupabaseClient;
    private authService = inject(AuthService);

    constructor() {
        this.supabase = createClient(environment.supabase.url, environment.supabase.key, {
            auth: {
                persistSession: true,
                autoRefreshToken: true
            }
        });
    }

    /**
     * Vérifier si l'utilisateur connecté est une coopérative
     */
    async isUserCooperative(): Promise<boolean> {
        try {
            const { user } = await this.authService.getCurrentUser();

            if (!user) {
                return false;
            }

            const userMetadata = user.user_metadata;
            return userMetadata?.['profile'] === 'cooperative';
        } catch (error) {
            console.error('Erreur vérification profil coopérative:', error);
            return false;
        }
    }

    /**
     * Créer un nouveau producteur agricole
     */
    async createProducer(producerData: AgriculturalProducerData): Promise<CreateAgriculturalProducerResponse> {
        try {
            // Vérifier que l'utilisateur connecté est une coopérative
            const isCooperative = await this.isUserCooperative();
            if (!isCooperative) {
                return {
                    producer: null,
                    error: new Error('Seules les coopératives peuvent créer des producteurs')
                };
            }

            // Récupérer l'utilisateur connecté
            const { user: currentUser } = await this.authService.getCurrentUser();
            if (!currentUser) {
                return { producer: null, error: new Error('Utilisateur non connecté') };
            }

            // 1. Créer l'utilisateur dans l'authentification Supabase
            // Générer un email par défaut si aucun n'est fourni
            const email = producerData.email || `${producerData.first_name.toLowerCase()}.${producerData.last_name.toLowerCase()}@digicoop.sn`;
            
            const { data: authData, error: authError } = await this.supabase.auth.signUp({
                email: email,
                password: producerData.password,
                options: {
                    data: {
                        first_name: producerData.first_name,
                        last_name: producerData.last_name,
                        farm_name: producerData.farm_name,
                        role: 'producer',
                        account_status: producerData.account_status || 'active',
                        created_by: currentUser.id,
                        profile: 'producer'
                    },
                    emailRedirectTo: `${window.location.origin}/login`
                }
            });

            if (authError) {
                console.error('Erreur création utilisateur:', authError);
                return { producer: null, error: authError };
            }

            if (!authData.user) {
                return { producer: null, error: new Error('Utilisateur non créé') };
            }

            // 2. Créer l'entrée dans la table agricultural_producers
            const producerRecord = {
                created_by_user_id: currentUser.id,
                first_name: producerData.first_name,
                last_name: producerData.last_name,
                email: email,
                phone: producerData.phone,
                farm_name: producerData.farm_name,
                location: producerData.location,
                production_type: producerData.production_type,
                description: producerData.description,
                account_status: producerData.account_status || 'active',
                role: 'producer'
            };

            const { data: producer, error: dbError } = await this.supabase
                .from('agricultural_producers')
                .insert(producerRecord)
                .select()
                .single();

            if (dbError) {
                console.error('Erreur création producteur en base:', dbError);

                // Attendre un peu et vérifier si le producteur a quand même été créé
                await new Promise(resolve => setTimeout(resolve, 1000));

                const { data: existingProducer } = await this.supabase
                    .from('agricultural_producers')
                    .select('*')
                    .eq('email', producerData.email)
                    .eq('created_by_user_id', currentUser.id)
                    .limit(1);

                if (existingProducer && existingProducer.length > 0) {
                    console.log('Producteur trouvé après erreur, retour du producteur existant');
                    return { producer: existingProducer[0], error: null };
                }

                return { producer: null, error: dbError };
            }

            return { producer, error: null };

        } catch (error) {
            console.error('Erreur inattendue createProducer:', error);
            return { producer: null, error };
        }
    }


    /**
     * Récupérer tous les producteurs créés par la coopérative connectée
     */
    async getProducersByCooperative(): Promise<{ producers: AgriculturalProducer[]; error: any | null }> {
        try {
            const { user: currentUser } = await this.authService.getCurrentUser();

            if (!currentUser) {
                return { producers: [], error: new Error('Utilisateur non connecté') };
            }

            const { data: producers, error } = await this.supabase
                .from('agricultural_producers')
                .select('*')
                .eq('created_by_user_id', currentUser.id)
                .order('created_at', { ascending: false });

            return { producers: producers || [], error };
        } catch (error) {
            return { producers: [], error };
        }
    }

    /**
     * Récupérer un producteur par son ID (seulement si créé par la coopérative connectée)
     */
    async getProducerById(id: string): Promise<{ producer: AgriculturalProducer | null; error: any | null }> {
        try {
            const { user: currentUser } = await this.authService.getCurrentUser();

            if (!currentUser) {
                return { producer: null, error: new Error('Utilisateur non connecté') };
            }

            const { data: producer, error } = await this.supabase
                .from('agricultural_producers')
                .select('*')
                .eq('id', id)
                .eq('created_by_user_id', currentUser.id)
                .single();

            return { producer, error };
        } catch (error) {
            return { producer: null, error };
        }
    }

    /**
     * Récupérer un producteur par son email
     */
    async getProducerByEmail(email: string): Promise<{ producer: AgriculturalProducer | null; error: any | null }> {
        try {
            const { user: currentUser } = await this.authService.getCurrentUser();

            if (!currentUser) {
                return { producer: null, error: new Error('Utilisateur non connecté') };
            }

            const { data: producers, error } = await this.supabase
                .from('agricultural_producers')
                .select('*')
                .eq('email', email)
                .eq('created_by_user_id', currentUser.id)
                .limit(1); // Utiliser limit(1) au lieu de single()

            if (error) {
                return { producer: null, error };
            }

            // Retourner le premier producteur trouvé ou null
            return { producer: producers && producers.length > 0 ? producers[0] : null, error: null };

        } catch (error) {
            return { producer: null, error };
        }
    }

    /**
     * Mettre à jour un producteur
     */
    async updateProducer(id: string, updates: Partial<AgriculturalProducerData>): Promise<{ producer: AgriculturalProducer | null; error: any | null }> {
        try {
            const { user: currentUser } = await this.authService.getCurrentUser();

            if (!currentUser) {
                return { producer: null, error: new Error('Utilisateur non connecté') };
            }

            const { data: producer, error } = await this.supabase
                .from('agricultural_producers')
                .update(updates)
                .eq('id', id)
                .eq('created_by_user_id', currentUser.id)
                .select()
                .single();

            return { producer, error };
        } catch (error) {
            return { producer: null, error };
        }
    }

    /**
     * Changer le statut d'un producteur
     */
    async updateProducerStatus(id: string, status: string): Promise<{ success: boolean; error: any | null }> {
        try {
            const { user: currentUser } = await this.authService.getCurrentUser();

            if (!currentUser) {
                return { success: false, error: new Error('Utilisateur non connecté') };
            }

            const { error } = await this.supabase
                .from('agricultural_producers')
                .update({ account_status: status })
                .eq('id', id)
                .eq('created_by_user_id', currentUser.id);

            return { success: !error, error };
        } catch (error) {
            return { success: false, error };
        }
    }

    /**
     * Désactiver un producteur (au lieu de le supprimer)
     */
    async deactivateProducer(id: string): Promise<{ success: boolean; error: any | null }> {
        try {
            const { user: currentUser } = await this.authService.getCurrentUser();

            if (!currentUser) {
                return { success: false, error: new Error('Utilisateur non connecté') };
            }

            const { error } = await this.supabase
                .from('agricultural_producers')
                .update({ account_status: 'inactive' })
                .eq('id', id)
                .eq('created_by_user_id', currentUser.id);

            return { success: !error, error };
        } catch (error) {
            return { success: false, error };
        }
    }
}