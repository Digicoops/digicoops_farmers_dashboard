// // services/generic-product.service.ts
// import { Injectable } from '@angular/core';
// import { SupabaseClient, createClient } from '@supabase/supabase-js';
// import { environment } from '../../environments/environment';
// import { DjangoImageService } from './cloudflare/django-image.service';
// import { GenericProduct } from '../interfaces/generic-product.interface';
//
// @Injectable({
//     providedIn: 'root'
// })
// export class GenericProductService {
//     private supabase: SupabaseClient;
//
//     constructor(private djangoImageService: DjangoImageService) {
//         this.supabase = createClient(
//             environment.supabase.url,
//             environment.supabase.key
//         );
//     }
//
//     async createGenericProduct(
//         productData: Omit<GenericProduct, 'id' | 'created_at' | 'updated_at'>,
//         mainImageFile?: File,
//         variantImageFiles: File[] = []
//     ): Promise<GenericProduct> {
//         try {
//             // Upload des images si fournies
//             if (mainImageFile || variantImageFiles.length > 0) {
//                 const uploadResponse = await this.djangoImageService.uploadImages(
//                     productData.created_by,
//                     'temp',
//                     mainImageFile,
//                     variantImageFiles
//                 );
//
//                 // Mapper les images
//                 if (uploadResponse.main_image) {
//                     productData.main_image = this.mapDjangoImage(uploadResponse.main_image, true);
//                 }
//                 if (uploadResponse.variant_images.length > 0) {
//                     productData.variant_images = uploadResponse.variant_images.map(img =>
//                         this.mapDjangoImage(img, false)
//                     );
//                 }
//             }
//
//             // Calculer le pourcentage de réduction
//             if (productData.is_promotion_enabled && productData.promo_price) {
//                 productData.discount_percentage = Math.round(
//                     ((productData.regular_price - productData.promo_price) / productData.regular_price) * 100
//                 );
//             }
//
//             // Insérer dans la base de données
//             const { data, error } = await this.supabase
//                 .from('generic_products') // ou 'agricultural_products' si vous étendez
//                 .insert([productData])
//                 .select()
//                 .single();
//
//             if (error) throw error;
//             return data;
//
//         } catch (error) {
//             console.error('Erreur création produit générique:', error);
//             throw error;
//         }
//     }
//
//     private mapDjangoImage(djangoImage: any, isMain: boolean): any {
//         return {
//             id: djangoImage.id,
//             url: djangoImage.url,
//             name: this.extractFileName(djangoImage.url),
//             uploaded_at: djangoImage.created_at,
//             is_main: isMain
//         };
//     }
//
//     private extractFileName(url: string): string {
//         return url.split('/').pop() || 'image';
//     }
//
//     // Autres méthodes (getProducts, updateProduct, deleteProduct, etc.)
//     // similaires à votre ProductService existant mais adaptées
// }