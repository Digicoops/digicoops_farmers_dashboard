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
}