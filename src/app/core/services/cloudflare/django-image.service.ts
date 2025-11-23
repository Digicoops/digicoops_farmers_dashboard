// services/django-image.service.ts
import {inject, Injectable} from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface DjangoImageResponse {
    id: number;
    user_id: string;
    product_id: string;
    url: string;
    is_main: boolean;
    created_at: string;
}

export interface DjangoUploadResponse {
    main_image: DjangoImageResponse | null;
    variant_images: DjangoImageResponse[];
}

@Injectable({
    providedIn: 'root'
})
export class DjangoImageService {
    // private readonly apiUrl = 'http://localhost:8000/api/v1/images/';
    private readonly apiUrl = 'https://digicoop-file-manager.onrender.com/api/v1/images/';

    private http = inject(HttpClient)
    /**
     * Upload des images vers votre API Django
     */
    async uploadImages(
        userId: string,
        productId: string,
        mainImage?: File,
        variantImages: File[] = []
    ): Promise<DjangoUploadResponse> {

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

        try {
            const response = await this.http.post<DjangoUploadResponse>(
                this.apiUrl,
                formData
            ).toPromise();

            return response!;

        } catch (error: any) {
            console.error('Erreur upload images Django:', error);
            throw new Error(`Échec de l'upload: ${error.message}`);
        }
    }

    /**
     * Récupérer les images d'un produit
     */
    async getProductImages(userId: string, productId: string): Promise<DjangoImageResponse[]> {
        try {
            const response = await this.http.get<DjangoImageResponse[]>(
                `${this.apiUrl}/?user_id=${userId}&product_id=${productId}`
            ).toPromise();

            return response || [];

        } catch (error) {
            console.error('Erreur récupération images:', error);
            throw error;
        }
    }

    /**
     * Supprimer une image
     */
    async deleteImage(imageId: number): Promise<void> {
        try {
            await this.http.delete(`${this.apiUrl}/${imageId}/`).toPromise();
        } catch (error) {
            console.error('Erreur suppression image:', error);
            throw error;
        }
    }

    /**
     * Définir une image comme principale
     */
    async setAsMain(imageId: number): Promise<DjangoImageResponse> {
        try {
            const response = await this.http.post<DjangoImageResponse>(
                `${this.apiUrl}/${imageId}/set_as_main/`,
                {}
            ).toPromise();

            return response!;
        } catch (error) {
            console.error('Erreur set as main:', error);
            throw error;
        }
    }
}