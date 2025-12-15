// services/product.service.ts
import { Injectable } from '@angular/core';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { environment } from "../../../../environments/environment.development";
import { DjangoImageResponse, DjangoImageService } from "../cloudflare/django-image.service";

export interface AgriculturalProduct {
    id?: string;
    created_at?: string;
    updated_at?: string;
    product_name: string;
    category: string;
    assigned_producer_id?: string;
    created_by: string;
    created_by_profile: 'personal' | 'cooperative';
    quality: string;
    total_weight: number;
    unit_weight: number;
    unit: string;
    stock_quantity: number;
    total_quantity: number;
    description?: string;
    regular_price: number;
    price_unit: string;
    harvest_date?: string;
    availability_status: string;
    is_promotion_enabled: boolean;
    promo_price?: number;
    promo_start_date?: string;
    promo_end_date?: string;
    discount_percentage?: number;
    main_image?: any;
    variant_images?: any[];
    status: 'draft' | 'published' | 'archived';

    // pour les informations du producteur
    producer_info?: {
        id: string;
        first_name: string;
        last_name: string;
        email: string;
        phone?: string;
        farm_name: string;
        location?: string;
        production_type?: string;
        description?: string;
        account_status: string;
    };
}

export interface ProductImage {
    id?: number;
    djangoId?: number;
    url: string;
    name: string;
    size: number;
    uploaded_at: string;
    description?: string;
    variant?: string;
    is_main?: boolean;
}

// Dans product.service.ts - AJOUTEZ cette interface
// Mettez à jour l'interface CustomProduct avec des champs plus spécifiques
export interface CustomProduct {
    id?: string;
    created_at?: string;
    updated_at?: string;
    product_name: string;
    product_type: 'service' | 'equipment' | 'agricultural_product';
    description?: string;
    created_by: string;
    created_by_profile: 'personal' | 'cooperative';
    assigned_producer_id?: string;
    regular_price: number;
    price_unit: string;
    is_promotion_enabled: boolean;
    promo_price?: number;
    promo_start_date?: string;
    promo_end_date?: string;
    discount_percentage?: number;
    main_image?: any;
    variant_images?: any[];
    availability_status: 'disponible' | 'rupture' | 'limite' | 'precommande';
    stock_quantity?: number;
    status: 'draft' | 'published' | 'archived';

    // Champs spécifiques structurés
    specific_fields?: {
        // Champs communs optionnels
        category?: string;
        quality?: string;
        total_weight?: number;
        unit_weight?: number;
        unit?: string;
        harvest_date?: string;

        // Champs pour services
        service_category?: string;
        service_type?: string;
        duration?: string;
        equipment_included?: boolean;
        service_area?: string;
        availability_schedule?: string;

        // Champs pour équipements
        equipment_category?: string;
        brand?: string;
        model?: string;
        condition?: string;
        warranty?: string;
        delivery_included?: boolean;
        installation_service?: boolean;
        technical_specs?: string;

        // Autres champs dynamiques
        [key: string]: any;
    };

    metadata?: Record<string, any>;
}

// Interface pour les données de formulaire
export interface CustomProductFormData {
    product_name: string;
    product_type: 'service' | 'equipment';
    description: string;
    regular_price: number;
    price_unit: string;
    is_promotion_enabled: boolean;
    promo_price?: number;
    promo_start_date?: string;
    promo_end_date?: string;
    availability_status: string;
    assigned_producer_id?: string;
    stock_quantity?: number;
    specific_fields: Record<string, any>;
}

@Injectable({
    providedIn: 'root'
})
export class ProductService {
    private supabase: SupabaseClient;

    constructor(private djangoImageService: DjangoImageService) {
        this.supabase = createClient(
            environment.supabase.url,
            environment.supabase.key
        );
    }

    /**
     * Créer un nouveau produit avec images
     */
    // Dans ProductService - OPTIMISÉ
    async createProductWithImages(
        productData: Omit<AgriculturalProduct, 'id' | 'created_at' | 'updated_at'>,
        mainImageFile?: File,
        variantImageFiles: File[] = []
    ): Promise<AgriculturalProduct> {

        try {
            // 1. Upload des images d'abord si fournies
            let mainImage: ProductImage | undefined;
            let variantImages: ProductImage[] = [];

            if (mainImageFile || variantImageFiles.length > 0) {
                const uploadResponse = await this.djangoImageService.uploadImages(
                    productData.created_by, // Utiliser created_by directement
                    'temp', // ID temporaire, sera mis à jour après
                    mainImageFile,
                    variantImageFiles
                );

                mainImage = uploadResponse.main_image ? this.mapDjangoImageToProductImage(uploadResponse.main_image) : undefined;
                variantImages = uploadResponse.variant_images.map((img: any) => this.mapDjangoImageToProductImage(img));
            }

            // 2. Créer le produit avec les images
            const productWithImages = {
                ...productData,
                main_image: mainImage,
                variant_images: variantImages
            };

            const product = await this.createProduct(productWithImages);

            // 3. Récupérer le produit final (seulement 1 appel)
            return await this.getProductById(product.id!);

        } catch (error) {
            console.error('Erreur création produit avec images:', error);
            throw error;
        }
    }

    // async createProductWithImages(
    //     productData: Omit<AgriculturalProduct, 'id' | 'created_at' | 'updated_at'>,
    //     mainImageFile?: File,
    //     variantImageFiles: File[] = []
    // ): Promise<AgriculturalProduct> {
    //
    //     // 1. Créer le produit dans Supabase
    //     const product = await this.createProduct(productData);
    //
    //     // 2. Upload des images vers Django si fournies
    //     if (mainImageFile || variantImageFiles.length > 0) {
    //         await this.uploadProductImages(
    //             product.created_by, // CORRECTION: utiliser created_by au lieu de assigned_user_id
    //             product.id!,
    //             mainImageFile,
    //             variantImageFiles
    //         );
    //     }
    //
    //     // 3. Récupérer le produit final avec les images
    //     return await this.getProductById(product.id!);
    // }

    /**
     * Upload des images pour un produit
     */
    async uploadProductImages(
        userId: string,
        productId: string,
        mainImageFile?: File,
        variantImageFiles: File[] = []
    ): Promise<void> {

        try {
            const uploadResponse = await this.djangoImageService.uploadImages(
                userId,
                productId,
                mainImageFile,
                variantImageFiles
            );

            // Préparer les données d'images pour Supabase
            const mainImage = uploadResponse.main_image ? this.mapDjangoImageToProductImage(uploadResponse.main_image) : undefined;
            const variantImages = uploadResponse.variant_images.map((img: any) => this.mapDjangoImageToProductImage(img));

            // Mettre à jour le produit avec les infos images
            await this.updateProduct(productId, {
                main_image: mainImage,
                variant_images: variantImages
            });

        } catch (error) {
            console.error('Erreur upload images produit:', error);
            throw error;
        }
    }

    /**
     * Mapper les images Django vers le format ProductImage
     */
    private mapDjangoImageToProductImage(djangoImage: DjangoImageResponse): ProductImage {
        return {
            id: djangoImage.id,
            djangoId: djangoImage.id,
            url: djangoImage.url,
            name: this.extractFileNameFromUrl(djangoImage.url),
            size: 0,
            uploaded_at: djangoImage.created_at,
            is_main: djangoImage.is_main,
            variant: djangoImage.is_main ? 'main' : 'variant'
        };
    }

    /**
     * Extraire le nom de fichier depuis l'URL
     */
    private extractFileNameFromUrl(url: string): string {
        const parts = url.split('/');
        return parts[parts.length - 1];
    }

    /**
     * Récupérer les images d'un produit depuis Django
     */
    async syncProductImages(productId: string): Promise<AgriculturalProduct> {
        const product = await this.getProductById(productId);

        const djangoImages = await this.djangoImageService.getProductImages(
            product.created_by, // CORRECTION: utiliser created_by
            productId
        );

        const mainImage = djangoImages.find((img: { is_main: any; }) => img.is_main);
        const variantImages = djangoImages.filter((img: { is_main: any; }) => !img.is_main);

        const updates: Partial<AgriculturalProduct> = {
            main_image: mainImage ? this.mapDjangoImageToProductImage(mainImage) : undefined,
            variant_images: variantImages.map((img: any) => this.mapDjangoImageToProductImage(img))
        };

        return await this.updateProduct(productId, updates);
    }

    /**
     * Supprimer une image variante
     */
    async deleteVariantImage(productId: string, imageIndex: number): Promise<AgriculturalProduct> {
        const product = await this.getProductById(productId);

        if (!product.variant_images || product.variant_images.length <= imageIndex) {
            throw new Error('Image variante non trouvée');
        }

        const imageToDelete = product.variant_images[imageIndex];

        // Supprimer de Django si l'ID existe
        if (imageToDelete.id) {
            await this.djangoImageService.deleteImage(imageToDelete.id);
        }

        // Supprimer du tableau
        const updatedVariants = product.variant_images.filter((_, index) => index !== imageIndex);

        return await this.updateProduct(productId, { variant_images: updatedVariants });
    }

    /**
     * Définir une image comme principale
     */
    async setImageAsMain(productId: string, imageId: number): Promise<AgriculturalProduct> {
        const djangoImage = await this.djangoImageService.setAsMain(imageId);

        // Resynchroniser toutes les images
        return await this.syncProductImages(productId);
    }

    // === MÉTHODES EXISTANTES ===

    async createProduct(productData: Omit<AgriculturalProduct, 'id' | 'created_at' | 'updated_at'>): Promise<AgriculturalProduct> {
        // Calculer le pourcentage de réduction si promotion activée
        if (productData.is_promotion_enabled && productData.promo_price && productData.regular_price) {
            productData.discount_percentage = Math.round(
                ((productData.regular_price - productData.promo_price) / productData.regular_price) * 100
            );
        }

        const { data, error } = await this.supabase
            .from('agricultural_products')
            .insert([productData])
            .select()
            .single();

        if (error) {
            console.error('Erreur création produit:', error);
            throw error;
        }

        return data;
    }

    async getProducts(filters?: { status?: string; category?: string; userId?: string; }): Promise<AgriculturalProduct[]> {
        let query = this.supabase
            .from('agricultural_products')
            .select('*')
            .order('created_at', { ascending: false });

        if (filters?.status) query = query.eq('status', filters.status);
        if (filters?.category) query = query.eq('category', filters.category);
        if (filters?.userId) query = query.eq('created_by', filters.userId); // CORRECTION: utiliser created_by

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    }

    async getProductById(id: string): Promise<AgriculturalProduct> {
        const { data, error } = await this.supabase
            .from('agricultural_products')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    }

    async updateProduct(id: string, updates: Partial<AgriculturalProduct>): Promise<AgriculturalProduct> {
        if (updates.is_promotion_enabled && updates.promo_price && updates.regular_price) {
            updates.discount_percentage = Math.round(
                ((updates.regular_price - updates.promo_price) / updates.regular_price) * 100
            );
        }

        const { data, error } = await this.supabase
            .from('agricultural_products')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async deleteProduct(id: string): Promise<void> {
        const product = await this.getProductById(id);

        // Supprimer les images de Django
        if (product.main_image?.id) {
            await this.djangoImageService.deleteImage(product.main_image.id);
        }
        if (product.variant_images) {
            for (const image of product.variant_images) {
                if (image.id) {
                    await this.djangoImageService.deleteImage(image.id);
                }
            }
        }

        // Supprimer le produit
        const { error } = await this.supabase
            .from('agricultural_products')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }

    // Recuperer un produit avec  les  infos du procucer
    async getProductWithProducerInfo(productId: string): Promise<AgriculturalProduct | null> {
        try {
            // Récupérer le produit
            const product = await this.getProductById(productId);

            if (!product || !product.assigned_producer_id) {
                return product;
            }

            // Récupérer les informations du producteur
            const { data: producer, error } = await this.supabase
                .from('agricultural_producers')
                .select('*')
                .eq('id', product.assigned_producer_id)
                .single();

            if (error) {
                console.error('Erreur récupération producteur:', error);
                return product;
            }

            // Fusionner les données
            return {
                ...product,
                producer_info: producer
            };
        } catch (error) {
            console.error('Erreur récupération produit avec infos producteur:', error);
            return await this.getProductById(productId); // Retourner le produit sans infos producteur
        }
    }



    // Custom product (service et materiaux)

    /**
     * Créer un produit personnalisé (Service ou Équipement)
     */
    // Dans ProductService - méthode mise à jour
    /**
     * Créer un produit personnalisé (Service ou Équipement)
     */
    async createCustomProduct(
        productData: Omit<CustomProduct, 'id' | 'created_at' | 'updated_at'>,
        mainImageFile?: File,
        variantImageFiles: File[] = []
    ): Promise<CustomProduct> {
        try {
            // 1. Upload des images
            let mainImage: ProductImage | undefined;
            let variantImages: ProductImage[] = [];

            if (mainImageFile || variantImageFiles.length > 0) {
                const uploadResponse = await this.djangoImageService.uploadImages(
                    productData.created_by,
                    'temp',
                    mainImageFile,
                    variantImageFiles
                );

                mainImage = uploadResponse.main_image ? this.mapDjangoImageToProductImage(uploadResponse.main_image) : undefined;
                variantImages = uploadResponse.variant_images.map((img: any) => this.mapDjangoImageToProductImage(img));
            }

            // 2. Calculer le pourcentage de réduction
            if (productData.is_promotion_enabled && productData.promo_price && productData.regular_price) {
                productData.discount_percentage = Math.round(
                    ((productData.regular_price - productData.promo_price) / productData.regular_price) * 100
                );
            }

            // 3. Préparer les données spécifiques par type
            const baseData: any = {
                product_name: productData.product_name,
                description: productData.description || '',
                created_by: productData.created_by,
                created_by_profile: productData.created_by_profile,
                assigned_producer_id: productData.assigned_producer_id,
                regular_price: productData.regular_price,
                price_unit: productData.price_unit,
                is_promotion_enabled: productData.is_promotion_enabled || false,
                promo_price: productData.promo_price,
                promo_start_date: productData.promo_start_date,
                promo_end_date: productData.promo_end_date,
                discount_percentage: productData.discount_percentage,
                availability_status: productData.availability_status || 'disponible',
                stock_quantity: productData.stock_quantity || 0,
                status: productData.status || 'draft',
                product_type: productData.product_type,
                specific_fields: productData.specific_fields || {},
                main_image: mainImage,
                variant_images: variantImages
            };

            // 4. Ajouter les champs spécifiques selon le type (utilisation de la notation entre crochets)
            if (productData.product_type === 'service') {
                // Pour les services
                baseData.category = 'service';
                baseData.quality = 'standard';
                baseData.unit = 'service';
                baseData.total_weight = 0;
                baseData.unit_weight = 0;
                baseData.total_quantity = 0;

                // Stocker les champs spécifiques du service - utilisation de ['field']
                if (productData.specific_fields) {
                    baseData.specific_fields = {
                        ...productData.specific_fields,
                        service_category: productData.specific_fields['service_category'],
                        service_type: productData.specific_fields['service_type'],
                        duration: productData.specific_fields['duration'],
                        equipment_included: productData.specific_fields['equipment_included'] || false,
                        service_area: productData.specific_fields['service_area'],
                        availability_schedule: productData.specific_fields['availability_schedule']
                    };
                }

            } else if (productData.product_type === 'equipment') {
                // Pour les équipements
                baseData.category = productData.specific_fields?.['equipment_category'] || 'equipment';
                baseData.quality = 'standard';
                baseData.unit = 'unit';
                baseData.total_weight = 0;
                baseData.unit_weight = 0;
                baseData.total_quantity = productData.stock_quantity || 0;

                // Stocker les champs spécifiques des équipements - utilisation de ['field']
                if (productData.specific_fields) {
                    baseData.specific_fields = {
                        ...productData.specific_fields,
                        equipment_category: productData.specific_fields['equipment_category'],
                        brand: productData.specific_fields['brand'],
                        model: productData.specific_fields['model'],
                        condition: productData.specific_fields['condition'],
                        warranty: productData.specific_fields['warranty'],
                        delivery_included: productData.specific_fields['delivery_included'] || false,
                        installation_service: productData.specific_fields['installation_service'] || false,
                        technical_specs: productData.specific_fields['technical_specs']
                    };
                }

            } else {
                // Pour les produits agricoles traditionnels
                if (productData.specific_fields) {
                    baseData.category = productData.specific_fields['category'];
                    baseData.quality = productData.specific_fields['quality'];
                    baseData.total_weight = productData.specific_fields['total_weight'] || 0;
                    baseData.unit_weight = productData.specific_fields['unit_weight'] || 0;
                    baseData.unit = productData.specific_fields['unit'];
                    baseData.total_quantity = Math.floor(
                        (productData.specific_fields['total_weight'] || 0) / (productData.specific_fields['unit_weight'] || 1)
                    );
                    baseData.harvest_date = productData.specific_fields['harvest_date'];
                }
            }

            // 5. Insérer dans la base de données
            const { data, error } = await this.supabase
                .from('agricultural_products')
                .insert([baseData])
                .select()
                .single();

            if (error) {
                console.error('Erreur création produit personnalisé:', error);
                throw error;
            }

            return data as CustomProduct;

        } catch (error) {
            console.error('Erreur création produit personnalisé avec images:', error);
            throw error;
        }
    }
    
    /**
     * Récupérer les produits personnalisés
     */
    async getCustomProducts(filters?: {
        status?: string;
        product_type?: string;
        userId?: string;
    }): Promise<CustomProduct[]> {
        let query = this.supabase
            .from('agricultural_products') // Ou 'agricultural_products'
            .select('*')
            .order('created_at', { ascending: false });

        if (filters?.status) query = query.eq('status', filters.status);
        if (filters?.product_type) query = query.eq('product_type', filters.product_type);
        if (filters?.userId) query = query.eq('created_by', filters.userId);

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    }

    /**
     * Récupérer un produit personnalisé par ID
     */
    async getCustomProductById(id: string): Promise<CustomProduct> {
        const { data, error } = await this.supabase
            .from('agricultural_products') // Ou 'agricultural_products'
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Mettre à jour un produit personnalisé
     */
    async updateCustomProduct(id: string, updates: Partial<CustomProduct>): Promise<CustomProduct> {
        if (updates.is_promotion_enabled && updates.promo_price && updates.regular_price) {
            updates.discount_percentage = Math.round(
                ((updates.regular_price - updates.promo_price) / updates.regular_price) * 100
            );
        }

        const { data, error } = await this.supabase
            .from('agricultural_products') // Ou 'agricultural_products'
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }
}