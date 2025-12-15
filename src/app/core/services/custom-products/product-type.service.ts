// services/product-type.service.ts
import { Injectable } from '@angular/core';

export enum ProductType {
    SERVICE = 'service',
    EQUIPMENT = 'equipment'
}

export interface ProductTypeConfig {
    type: ProductType;
    label: string;
    description: string;
    fields: ProductField[];
    priceUnitOptions: { value: string; label: string }[];
}

export interface ProductField {
    name: string;
    label: string;
    type: 'text' | 'number' | 'select' | 'date' | 'textarea' | 'checkbox' | 'file';
    required: boolean;
    options?: { value: string; label: string }[];
    placeholder?: any ;
    defaultValue?: any;
}

@Injectable({
    providedIn: 'root'
})
export class ProductTypeService {

    private readonly productTypes: ProductTypeConfig[] = [
        {
            type: ProductType.SERVICE,
            label: 'Service Agricole',
            description: 'Services agricoles (labour, plantation, récolte, conseil, etc.)',
            fields: [
                {
                    name: 'service_category',
                    label: 'Catégorie de service',
                    type: 'select',
                    required: true,
                    options: [
                        { value: 'labour', label: 'Labour/Travail du sol' },
                        { value: 'planting', label: 'Plantation/Semis' },
                        { value: 'harvesting', label: 'Récolte' },
                        { value: 'irrigation', label: 'Irrigation' },
                        { value: 'consulting', label: 'Conseil agricole' },
                        { value: 'maintenance', label: 'Maintenance d\'équipement' },
                        { value: 'pest_control', label: 'Lutte contre les nuisibles' },
                        { value: 'logistics', label: 'Logistique/Transport' },
                        { value: 'pruning', label: 'Taille/Élagage' },
                        { value: 'fertilization', label: 'Fertilisation' }
                    ]
                },
                {
                    name: 'service_type',
                    label: 'Type de service',
                    type: 'select',
                    required: true,
                    options: [
                        { value: 'hourly', label: 'À l\'heure' },
                        { value: 'daily', label: 'À la journée' },
                        { value: 'fixed_price', label: 'Forfait' },
                        { value: 'contract', label: 'Contrat' },
                        { value: 'project', label: 'Projet' }
                    ]
                },
                {
                    name: 'duration',
                    label: 'Durée estimée',
                    type: 'text',
                    required: false,
                    placeholder: 'Ex: 2 jours, 4 heures, 1 semaine'
                },
                {
                    name: 'required_experience',
                    label: 'Expérience requise',
                    type: 'select',
                    required: false,
                    options: [
                        { value: 'beginner', label: 'Débutant' },
                        { value: 'intermediate', label: 'Intermédiaire' },
                        { value: 'expert', label: 'Expert' },
                        { value: 'certified', label: 'Certifié' }
                    ]
                },
                {
                    name: 'certifications',
                    label: 'Certifications',
                    type: 'textarea',
                    required: false,
                    placeholder: 'Certifications ou qualifications spécifiques'
                },
                {
                    name: 'availability_schedule',
                    label: 'Disponibilité',
                    type: 'textarea',
                    required: false,
                    placeholder: 'Jours et heures de disponibilité'
                },
                {
                    name: 'service_area',
                    label: 'Zone de service',
                    type: 'text',
                    required: true,
                    placeholder: 'Ex: Région de Thiès, Rayon de 50km'
                },
                {
                    name: 'equipment_included',
                    label: 'Équipement inclus',
                    type: 'checkbox',
                    required: false,
                    defaultValue: false
                },
            ],
            priceUnitOptions: [
                { value: 'hour', label: 'FCFA/heure' },
                { value: 'day', label: 'FCFA/jour' },
                { value: 'service', label: 'FCFA/service' },
                { value: 'hectare', label: 'FCFA/hectare' },
                { value: 'contract', label: 'FCFA/contrat' },
                { value: 'project', label: 'FCFA/projet' }
            ]
        },
        {
            type: ProductType.EQUIPMENT,
            label: 'Matériaux/Équipements Agricoles',
            description: 'Vente de matériels et équipements agricoles',
            fields: [
                {
                    name: 'equipment_category',
                    label: 'Catégorie d\'équipement',
                    type: 'select',
                    required: true,
                    options: [
                        { value: 'tools', label: 'Outils manuels' },
                        { value: 'machinery', label: 'Machinerie lourde' },
                        { value: 'irrigation', label: 'Systèmes d\'irrigation' },
                        { value: 'storage', label: 'Matériel de stockage' },
                        { value: 'protection', label: 'Équipement de protection' },
                        { value: 'fertilizers', label: 'Engrais/Fertilisants' },
                        { value: 'seeds', label: 'Semences/Plants' },
                        { value: 'consumables', label: 'Consommables' },
                        { value: 'greenhouse', label: 'Serres/Abris' },
                        { value: 'livestock', label: 'Équipement d\'élevage' }
                    ]
                },
                {
                    name: 'brand',
                    label: 'Marque',
                    type: 'text',
                    required: false,
                    placeholder: 'Ex: John Deere, Kubota, Massey Ferguson'
                },
                {
                    name: 'model',
                    label: 'Modèle',
                    type: 'text',
                    required: false,
                    placeholder: 'Ex: TX 1000, Model X5'
                },
                {
                    name: 'condition',
                    label: 'État',
                    type: 'select',
                    required: true,
                    options: [
                        { value: 'new', label: 'Neuf' },
                        { value: 'like_new', label: 'Comme neuf' },
                        { value: 'good', label: 'Bon état' },
                        { value: 'used', label: 'Occasion' },
                        { value: 'refurbished', label: 'Reconditionné' }
                    ]
                },
                {
                    name: 'warranty',
                    label: 'Garantie',
                    type: 'text',
                    required: false,
                    placeholder: 'Ex: 1 an, 6 mois, aucune'
                },

                {
                    name: 'technical_specs',
                    label: 'Spécifications techniques',
                    type: 'textarea',
                    required: false,
                    placeholder: 'Dimensions, puissance, capacité, matériaux, etc.'
                },
                {
                    name: 'installation_service',
                    label: 'Service d\'installation',
                    type: 'checkbox',
                    required: false,
                    defaultValue: false
                },
                {
                    name: 'delivery_included',
                    label: 'Livraison incluse',
                    type: 'checkbox',
                    required: false,
                    defaultValue: false
                },

            ],
            priceUnitOptions: [
                { value: 'unit', label: 'FCFA/unité' },
                { value: 'kg', label: 'FCFA/kg' },
                { value: 'liter', label: 'FCFA/litre' },
                { value: 'package', label: 'FCFA/paquet' },
                { value: 'set', label: 'FCFA/ensemble' },
                { value: 'meter', label: 'FCFA/mètre' }
            ]
        }
    ];

    getProductTypes(): ProductTypeConfig[] {
        return this.productTypes;
    }

    getProductType(type: ProductType): ProductTypeConfig | undefined {
        return this.productTypes.find(pt => pt.type === type);
    }

    getProductTypeOptions(): { value: ProductType; label: string; description: string }[] {
        return this.productTypes.map(type => ({
            value: type.type,
            label: type.label,
            description: type.description
        }));
    }
}