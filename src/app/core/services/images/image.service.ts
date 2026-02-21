import { Injectable } from '@angular/core';
import { HttpClient, HttpEventType, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, filter } from 'rxjs/operators';
import { environment } from '../../../../environments/environment.development';

export interface ImageFile {
  id: number;
  user_id: string;
  product_id: string;
  url: string;
  is_main: boolean;
  created_at: string;
}

export interface ImageUploadResponse {
  main_image?: ImageFile;
  variant_images?: ImageFile[];
}

export interface ProductImagesResponse {
  main_image?: ImageFile;
  variant_images?: ImageFile[];
}

@Injectable({
  providedIn: 'root'
})
export class ImageService {
  private readonly baseUrl = environment.django.apiUrl.replace('/images/', '');

  constructor(private http: HttpClient) {}

  /**
   * Upload une ou plusieurs images pour un produit
   */
  uploadImages(
    userId: string, 
    productId: string, 
    mainImage?: File,
    variantImages: File[] = []
  ): Observable<ImageUploadResponse> {
    const formData = new FormData();
    formData.append('user_id', userId);
    formData.append('product_id', productId);

    // Ajouter l'image principale si elle existe
    if (mainImage) {
      formData.append('main_image', mainImage);
    }

    // Ajouter les images variantes
    variantImages.forEach((file, index) => {
      formData.append('variant_images', file);
    });

    // Si on n'a pas d'image principale mais qu'on a des variantes,
    // on doit quand même envoyer quelque chose pour main_image pour éviter l'erreur 400
    // L'API peut gérer ce cas en créant seulement les variantes
    if (!mainImage && variantImages.length > 0) {
      // Option 1: Envoyer la première variante comme main_image temporaire
      formData.append('main_image', variantImages[0]);
      // Envoyer le reste comme variantes
      variantImages.slice(1).forEach((file, index) => {
        formData.append('variant_images', file);
      });
    }

    return this.http.post<ImageUploadResponse>(`${this.baseUrl}/images/`, formData);
  }

  /**
   * Upload avec suivi de progression
   */
  uploadImagesWithProgress(
    userId: string, 
    productId: string, 
    mainImage?: File, 
    variantImages?: File[],
    onProgress?: (progress: number) => void
  ): Observable<ImageUploadResponse> {
    const formData = new FormData();
    formData.append('user_id', userId);
    formData.append('product_id', productId);
    
    if (mainImage) {
      formData.append('main_image', mainImage);
    }
    
    if (variantImages) {
      variantImages.forEach(image => {
        formData.append('variant_images', image);
      });
    }

    const req = new HttpRequest('POST', `${this.baseUrl}/images/`, formData, {
      reportProgress: true
    });

    return this.http.request(req).pipe(
      map(event => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          const progress = Math.round(100 * event.loaded / event.total);
          if (onProgress) {
            onProgress(progress);
          }
        } else if (event.type === HttpEventType.Response) {
          return event.body as ImageUploadResponse;
        }
        return null;
      }),
      // Filtrer les valeurs null pour éviter les erreurs
      filter((response: any) => response !== null)
    ) as Observable<ImageUploadResponse>;
  }

  /**
   * Récupérer toutes les images d'un produit
   */
  getProductImages(userId: string, productId: string): Observable<ProductImagesResponse> {
    return this.http.get<ProductImagesResponse>(
      `${this.baseUrl}/products/images/?user_id=${userId}&product_id=${productId}`
    );
  }

  /**
   * Supprimer une image
   */
  deleteImage(imageId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/images/${imageId}/`);
  }

  /**
   * Définir une image comme principale
   */
  setMainImage(imageId: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/images/${imageId}/set-main/`, {});
  }

  /**
   * Lister les images avec filtres
   */
  getImages(userId?: string, productId?: string): Observable<ImageFile[]> {
    let params = '';
    if (userId) params += `user_id=${userId}&`;
    if (productId) params += `product_id=${productId}`;
    
    const url = params ? `${this.baseUrl}/images/?${params}` : `${this.baseUrl}/images/`;
    return this.http.get<ImageFile[]>(url);
  }
}
