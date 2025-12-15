// services/product-management.service.ts
import { inject, Injectable } from '@angular/core';
import {AgriculturalProduct, CustomProduct, ProductService} from "./product.service";

export interface ProductFormData {
    product_name: string;
    category: string;
    assigned_producer_id?: string;
    quality: string;
    total_weight: number;
    unit_weight: number;
    unit: string;
    description?: string;
    regular_price: number;
    price_unit: string;
    harvest_date?: string;
    availability_status: string;
    is_promotion_enabled: boolean;
    promo_price?: number;
    promo_start_date?: string;
    promo_end_date?: string;
}

@Injectable({
    providedIn: 'root'
})
export class ProductManagementService {

    private productService = inject(ProductService);

    /**
     * Créer un produit complet avec images
     */
    async createCompleteProduct(
        formData: ProductFormData,
        currentUser: any, // AJOUT: utilisateur courant requis
        mainImageFile?: File,
        variantImageFiles: File[] = []
    ): Promise<AgriculturalProduct> {
        try {
            // 1. Calculer les quantités
            const totalQuantity = Math.floor(formData.total_weight / formData.unit_weight);
            const stockQuantity = totalQuantity;

            // 2. Déterminer le profil utilisateur
            const userProfile = currentUser.user_metadata?.profile || 'personal';

            console.log('📝 Données du formulaire reçues:', {
                product_name: formData.product_name,
                description: formData.description, // AJOUT: log pour debug
                category: formData.category
            });

            // 3. Préparer les données complètes du produit
            const productData: Omit<AgriculturalProduct, 'id' | 'created_at' | 'updated_at'> = {
                product_name: formData.product_name,
                category: formData.category,
                assigned_producer_id: formData.assigned_producer_id,
                created_by: currentUser.id, // AJOUT: champ requis
                created_by_profile: userProfile as 'personal' | 'cooperative', // AJOUT: champ requis
                quality: formData.quality,
                total_weight: formData.total_weight,
                unit_weight: formData.unit_weight,
                unit: formData.unit,
                description: formData.description,
                regular_price: formData.regular_price,
                price_unit: formData.price_unit,
                harvest_date: formData.harvest_date,
                availability_status: formData.availability_status,
                is_promotion_enabled: formData.is_promotion_enabled,
                promo_price: formData.promo_price,
                promo_start_date: formData.promo_start_date,
                promo_end_date: formData.promo_end_date,
                total_quantity: totalQuantity,
                stock_quantity: stockQuantity,
                status: 'draft'
            };

            // 4. Créer le produit avec images
            const product = await this.productService.createProductWithImages(
                productData,
                mainImageFile,
                variantImageFiles
            );

            return product;

        } catch (error) {
            console.error('Erreur création produit complet:', error);
            throw error;
        }
    }

    /**
     * Publier un produit
     */
    async publishProduct(productId: string): Promise<AgriculturalProduct> {
        // Validation avant publication
        const product = await this.productService.getProductById(productId);

        const validationErrors = this.validateProductForPublishing(product);
        if (validationErrors.length > 0) {
            throw new Error(`Produit non valide: ${validationErrors.join(', ')}`);
        }

        return await this.productService.updateProduct(productId, {
            status: 'published',
            availability_status: 'disponible'
        });
    }

    /**
     * Mettre à jour les stocks
     */
    async updateStock(productId: string, newStock: number): Promise<AgriculturalProduct> {
        const product = await this.productService.getProductById(productId);

        if (newStock > product.total_quantity) {
            throw new Error('Le stock ne peut pas dépasser la quantité totale');
        }

        // Mettre à jour le statut de disponibilité
        let availabilityStatus = product.availability_status;
        if (newStock === 0) {
            availabilityStatus = 'rupture';
        } else if (newStock < 10) {
            availabilityStatus = 'limite';
        } else {
            availabilityStatus = 'disponible';
        }

        return await this.productService.updateProduct(productId, {
            stock_quantity: newStock,
            availability_status: availabilityStatus
        });
    }

    /**
     * Gérer les promotions
     */
    async managePromotion(
        productId: string,
        isEnabled: boolean,
        promoData?: { price: number; startDate: string; endDate: string }
    ): Promise<AgriculturalProduct> {
        const updates: any = { is_promotion_enabled: isEnabled };

        if (isEnabled && promoData) {
            updates.promo_price = promoData.price;
            updates.promo_start_date = promoData.startDate;
            updates.promo_end_date = promoData.endDate;
        } else {
            updates.promo_price = null;
            updates.promo_start_date = null;
            updates.promo_end_date = null;
            updates.discount_percentage = null;
        }

        return await this.productService.updateProduct(productId, updates);
    }

    /**
     * Valider un produit pour publication
     */

    // Dans ProductManagementService - CORRIGER la validation
    private validateProductForPublishing(product: AgriculturalProduct): string[] {
        const errors: string[] = [];

        if (!product.product_name) errors.push('Nom du produit requis');
        if (!product.created_by) errors.push('Utilisateur créateur requis'); // CORRECTION: created_by au lieu de assigned_user_id
        if (product.total_quantity <= 0) errors.push('Quantité totale invalide');
        if (product.regular_price <= 0) errors.push('Prix régulier invalide');
        if (!product.main_image) errors.push('Image principale requise');

        if (product.is_promotion_enabled) {
            if (!product.promo_price || product.promo_price <= 0) errors.push('Prix promotionnel invalide');
            if (!product.promo_start_date || !product.promo_end_date) errors.push('Dates de promotion requises');

            if (product.promo_start_date && product.promo_end_date) {
                const startDate = new Date(product.promo_start_date);
                const endDate = new Date(product.promo_end_date);

                if (startDate > endDate) errors.push('Dates de promotion invalides');
            }
        }

        console.log('Validation errors:', errors); // AJOUT: pour debug
        return errors;
    }


    /**
     * Obtenir les statistiques des produits
     */
    async getProductStats(userId?: string): Promise<{
        total: number;
        published: number;
        draft: number;
        outOfStock: number;
        onPromotion: number;
    }> {
        const products = await this.productService.getProducts({ userId });

        return {
            total: products.length,
            published: products.filter(p => p.status === 'published').length,
            draft: products.filter(p => p.status === 'draft').length,
            outOfStock: products.filter(p => p.availability_status === 'rupture').length,
            onPromotion: products.filter(p => p.is_promotion_enabled).length
        };
    }

    /**
     * Dupliquer un produit
     */
    async duplicateProduct(productId: string): Promise<AgriculturalProduct> {
        const original = await this.productService.getProductById(productId);

        const { id, created_at, updated_at, ...productData } = original;

        const duplicateData: Omit<AgriculturalProduct, 'id' | 'created_at' | 'updated_at'> = {
            ...productData,
            product_name: `${original.product_name} (Copie)`,
            stock_quantity: 0,
            status: 'draft',
            main_image: undefined,
            variant_images: []
        };

        return await this.productService.createProduct(duplicateData);
    }

    /**
     * Synchroniser les images d'un produit avec l'API Django
     */
    async syncProductImages(productId: string): Promise<AgriculturalProduct> {
        return await this.productService.syncProductImages(productId);
    }

    /**
     * Définir une image comme principale
     */
    async setImageAsMain(productId: string, imageId: number): Promise<AgriculturalProduct> {
        return await this.productService.setImageAsMain(productId, imageId);
    }

    /**
     * Supprimer une image variante
     */
    async deleteVariantImage(productId: string, imageIndex: number): Promise<AgriculturalProduct> {
        return await this.productService.deleteVariantImage(productId, imageIndex);
    }



    // Dans ProductManagementService - AJOUTEZ ces méthodes

    /**
     * Créer un produit personnalisé complet (Service ou Équipement)
     */
    async createCustomProduct(
        productData: any, // Données brutes du formulaire
        mainImageFile?: File,
        variantImageFiles: File[] = []
    ): Promise<any> {
        try {
            // 1. Préparer les données pour l'insertion
            const customProductData: Omit<CustomProduct, 'id' | 'created_at' | 'updated_at'> = {
                product_name: productData.product_name,
                product_type: productData.product_type,
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
                specific_fields: productData.specific_fields || {}
            };

            // 2. Utiliser la méthode du ProductService
            // Note: Vous devez injecter ProductService dans le constructeur si ce n'est pas déjà fait
            // private productService = inject(ProductService);

            return await this.productService.createCustomProduct(
                customProductData,
                mainImageFile,
                variantImageFiles
            );

        } catch (error) {
            console.error('Erreur création produit personnalisé:', error);
            throw error;
        }
    }

    /**
     * Publier un produit personnalisé
     */
    async publishCustomProduct(productId: string): Promise<any> {
        // Validation avant publication
        const product = await this.productService.getCustomProductById(productId);

        const validationErrors = this.validateCustomProductForPublishing(product);
        if (validationErrors.length > 0) {
            throw new Error(`Produit non valide: ${validationErrors.join(', ')}`);
        }

        return await this.productService.updateCustomProduct(productId, {
            status: 'published',
            availability_status: 'disponible'
        });
    }

    /**
     * Valider un produit personnalisé pour publication
     */
    private validateCustomProductForPublishing(product: any): string[] {
        const errors: string[] = [];

        if (!product.product_name) errors.push('Nom du produit requis');
        if (!product.created_by) errors.push('Utilisateur créateur requis');
        if (product.regular_price <= 0) errors.push('Prix régulier invalide');
        if (!product.main_image) errors.push('Image principale requise');
        if (!product.product_type) errors.push('Type de produit requis');

        // Validation spécifique par type
        if (product.product_type === 'equipment') {
            if (product.stock_quantity < 0) errors.push('Quantité de stock invalide');
        }

        if (product.is_promotion_enabled) {
            if (!product.promo_price || product.promo_price <= 0) errors.push('Prix promotionnel invalide');
            if (!product.promo_start_date || !product.promo_end_date) errors.push('Dates de promotion requises');

            if (product.promo_start_date && product.promo_end_date) {
                const startDate = new Date(product.promo_start_date);
                const endDate = new Date(product.promo_end_date);

                if (startDate > endDate) errors.push('Dates de promotion invalides');
            }
        }

        console.log('Validation custom errors:', errors);
        return errors;
    }
}