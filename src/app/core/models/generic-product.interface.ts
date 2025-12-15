// interfaces/generic-product.interface.ts
export interface GenericProduct {
    // Informations de base communes
    id?: string;
    created_at?: string;
    updated_at?: string;

    // Identifiants
    product_name: string;
    product_type: 'agricultural_product' | 'service' | 'equipment';
    created_by: string;
    created_by_profile: 'personal' | 'cooperative';
    assigned_producer_id?: string;

    // Description et catégories
    description: string;
    category?: string;
    subcategory?: string;

    // Prix
    regular_price: number;
    price_unit: string;
    is_promotion_enabled: boolean;
    promo_price?: number;
    promo_start_date?: string;
    promo_end_date?: string;
    discount_percentage?: number;

    // Images
    main_image?: any;
    variant_images?: any[];

    // Disponibilité
    availability_status: 'disponible' | 'rupture' | 'limite' | 'precommande';
    stock_quantity?: number;
    total_quantity?: number;

    // Statut
    status: 'draft' | 'published' | 'archived';

    // Champs spécifiques par type
    specific_fields?: {
        // Produits agricoles
        quality?: string;
        total_weight?: number;
        unit_weight?: number;
        unit?: string;
        harvest_date?: string;
        storage_conditions?: string;

        // Services
        service_category?: string;
        service_type?: string;
        duration?: string;
        equipment_included?: boolean;
        required_experience?: string;
        service_area?: string;
        availability_schedule?: string;

        // Équipements
        equipment_category?: string;
        brand?: string;
        model?: string;
        condition?: string;
        warranty?: string;
        delivery_included?: boolean;
        installation_service?: boolean;
        technical_specs?: string;
    };

    // Métadonnées
    metadata?: Record<string, any>;
}

export interface ProductFormData {
    // Champs communs
    product_name: string;
    product_type: 'agricultural_product' | 'service' | 'equipment';
    description: string;
    regular_price: number;
    price_unit: string;
    is_promotion_enabled: boolean;
    promo_price?: number;
    promo_start_date?: string;
    promo_end_date?: string;
    availability_status: string;

    // Champs spécifiques dynamiques
    specific_fields?: Record<string, any>;

    // Produits agricoles
    category?: string;
    quality?: string;
    total_weight?: number;
    unit_weight?: number;
    unit?: string;
    harvest_date?: string;
    assigned_producer_id?: string;

    // Services
    service_category?: string;
    service_type?: string;
    duration?: string;
    equipment_included?: boolean;
    required_experience?: string;
    service_area?: string;
    availability_schedule?: string;

    // Équipements
    equipment_category?: string;
    brand?: string;
    model?: string;
    condition?: string;
    warranty?: string;
    delivery_included?: boolean;
    installation_service?: boolean;
    technical_specs?: string;
}