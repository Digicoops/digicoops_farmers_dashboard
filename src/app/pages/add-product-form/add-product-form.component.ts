import {Component, inject, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import {InputFieldComponent} from "../../shared/components/form/input/input-field.component";
import {LabelComponent} from "../../shared/components/form/label/label.component";
import {SelectComponent} from "../../shared/components/form/select/select.component";
import {TextAreaComponent} from "../../shared/components/form/input/text-area.component";
import {ButtonComponent} from "../../shared/components/ui/button/button.component";
import {PageBreadcrumbComponent} from "../../shared/components/common/page-breadcrumb/page-breadcrumb.component";
import {
  UserAddressCardComponent
} from "../../shared/components/user-profile/user-address-card/user-address-card.component";
import {UserInfoCardComponent} from "../../shared/components/user-profile/user-info-card/user-info-card.component";
import {UserMetaCardComponent} from "../../shared/components/user-profile/user-meta-card/user-meta-card.component";
import {AuthService} from "../../core/services/auth/auth.service";
import {
  AgriculturalProducerManagementService
} from "../../core/services/producer/agricultural-producer-management.service";
import {ProductFormData, ProductManagementService} from "../../core/services/products/product-management.service";
import {FormsModule} from "@angular/forms";


interface Producer {
  id: string;
  first_name: string;
  last_name: string;
  farm_name: string;
  email: string;
}

interface Option {
  value: string;
  label: string;
}

@Component({
  selector: 'app-add-product-form',
  imports: [
    CommonModule,
    LabelComponent,
    InputFieldComponent,
    SelectComponent,
    TextAreaComponent,
    ButtonComponent,
    PageBreadcrumbComponent,
    FormsModule,
  ],
  templateUrl: './add-product-form.component.html',
  styles: ``,

  standalone: true
})
export class AddProductFormComponent implements OnInit {
  private authService = inject(AuthService);
  private producerManagement = inject(AgriculturalProducerManagementService);
  private productManagement = inject(ProductManagementService);

  // Informations de l'utilisateur connecté
  currentUser: any = null;
  userProfile: 'personal' | 'cooperative' | null = null;
  isCooperative = false;

  // Liste des producteurs (seulement pour les coopératives)
  producers: Producer[] = [];
  selectedProducerId: string = '';

  // Options du formulaire
  categories: Option[] = [
    { value: 'fruits', label: 'Fruits' },
    { value: 'legumes', label: 'Légumes' },
    { value: 'cereales', label: 'Céréales' },
    { value: 'viandes', label: 'Viandes' },
    { value: 'produits-laitiers', label: 'Produits laitiers' },
    { value: 'autres', label: 'Autres produits agricoles' }
  ];

  qualities: Option[] = [
    { value: 'extra', label: 'Extra' },
    { value: 'premium', label: 'Premium' },
    { value: 'standard', label: 'Standard' },
    { value: 'economique', label: 'Économique' }
  ];

  units: Option[] = [
    { value: 'kg', label: 'Kilogramme' },
    { value: 'panier', label: 'Panier' },
    { value: 'caisse', label: 'Caisse' },
    { value: 'sac', label: 'Sac' },
    { value: 'piece', label: 'Pièce' },
    { value: 'bouquet', label: 'Bouquet' }
  ];

  priceUnits: Option[] = [
    { value: 'kg', label: 'FCFA/kg' },
    { value: 'panier', label: 'FCFA/panier' },
    { value: 'caisse', label: 'FCFA/caisse' },
    { value: 'sac', label: 'FCFA/sac' },
    { value: 'piece', label: 'FCFA/pièce' },
    { value: 'bouquet', label: 'FCFA/bouquet' }
  ];

  availability: Option[] = [
    { value: 'disponible', label: 'En stock' },
    { value: 'rupture', label: 'Rupture de stock' },
    { value: 'limite', label: 'Stock limité' },
    { value: 'precommande', label: 'Pré-commande' }
  ];

  // Données du formulaire
  productName: string = '';
  selectedCategory: string = '';
  selectedQuality: string = '';
  selectedUnit: string = '';
  selectedPriceUnit: string = '';
  selectedAvailability: string = 'disponible';
  description: string = '';

  // Propriétés pour la gestion des quantités
  stockQuantity: number = 1;
  totalQuantity: number = 0;
  totalWeight: number = 0;
  unitWeight: number = 0;

  // Propriétés pour la gestion des prix et promotions
  isPromotionEnabled: boolean = false;
  regularPrice: number = 0;
  promoPrice: number = 0;
  promoStartDate: string = '';
  promoEndDate: string = '';
  harvestDate: string = '';

  // Gestion des images
  mainImage: string | null = null;
  mainImageFile: File | null = null;
  variantImages: { url: string; description: string; file?: File }[] = [];

  // États du composant
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  async ngOnInit() {
    await this.loadUserData();
    await this.loadProducersIfCooperative();
  }

  /**
   * Charger les données de l'utilisateur connecté
   */
  private async loadUserData() {
    try {
      const { user } = await this.authService.getCurrentUser();

      if (!user) {
        this.errorMessage = 'Utilisateur non connecté';
        return;
      }

      this.currentUser = user;
      this.userProfile = user.user_metadata?.['profile'] || 'personal';
      this.isCooperative = this.userProfile === 'cooperative';

      console.log('Profil utilisateur:', this.userProfile);
    } catch (error) {
      console.error('Erreur chargement utilisateur:', error);
      this.errorMessage = 'Erreur lors du chargement des données utilisateur';
    }
  }



  /**
   * Charger les producteurs si l'utilisateur est une coopérative
   */
  private async loadProducersIfCooperative() {
    if (!this.isCooperative) return;

    try {
      const { producers, error } = await this.producerManagement.getCooperativeProducers();

      if (error) {
        console.error('Erreur chargement producteurs:', error);
        this.errorMessage = 'Erreur lors du chargement des producteurs';
        return;
      }

      this.producers = producers;
      console.log('Producteurs chargés:', this.producers.length);
    } catch (error) {
      console.error('Erreur inattendue:', error);
      this.errorMessage = 'Erreur lors du chargement des producteurs';
    }
  }

  /**
   * Obtenir les options pour le select des producteurs
   */
  get producerOptions(): Option[] {
    return this.producers.map(producer => ({
      value: producer.id,
      label: `${producer.first_name} ${producer.last_name} - ${producer.farm_name}`
    }));
  }

  // Méthodes pour la gestion des sélections
  handleSelectChange(value: string, field: string) {
    switch (field) {
      case 'category':
        this.selectedCategory = value;
        break;
      case 'quality':
        this.selectedQuality = value;
        break;
      case 'unit':
        this.selectedUnit = value;
        break;
      case 'priceUnit':
        this.selectedPriceUnit = value;
        break;
      case 'availability':
        this.selectedAvailability = value;
        break;
    }
    console.log(`${field} sélectionné:`, value);
  }

  handleProducerAssignment(producerId: string) {
    this.selectedProducerId = producerId;
    console.log('Producteur assigné:', producerId);
  }

  // Méthodes pour la gestion des quantités

  calculateQuantities() {
    console.log('Calcul quantités - Poids total:', this.totalWeight, 'Poids par unité:', this.unitWeight);

    if (this.unitWeight > 0 && this.totalWeight > 0) {
      // CORRECTION: Calcul correct
      this.totalQuantity = Math.floor(this.totalWeight / this.unitWeight);

      console.log('Résultat calcul:', this.totalWeight + ' / ' + this.unitWeight + ' = ' + this.totalQuantity + ' unités');

      // Si le résultat est 0, c'est que unitWeight > totalWeight
      if (this.totalQuantity === 0) {
        console.log('ATTENTION: Le poids par unité est plus grand que le poids total');
        this.totalQuantity = 1; // Au moins 1 unité
      }

      // Ajuster le stock automatiquement
      if (this.stockQuantity === 0 && this.totalQuantity > 0) {
        this.stockQuantity = this.totalQuantity; // Par défaut, tout le stock est disponible
      } else if (this.stockQuantity > this.totalQuantity) {
        this.stockQuantity = this.totalQuantity; // Ne pas dépasser la quantité totale
      }
    } else {
      this.totalQuantity = 0;
      this.stockQuantity = 0;
    }

    console.log('Résultat final - Quantité totale:', this.totalQuantity, 'Stock disponible:', this.stockQuantity);
  }

// Méthodes pour la gestion des quantités - AMÉLIORÉ
  onTotalWeightChange(value: any) {
    this.totalWeight = parseFloat(value) || 0;
    console.log('Poids total changé:', this.totalWeight); // Debug
    this.calculateQuantities();
  }

  onUnitWeightChange(value: any) {
    this.unitWeight = parseFloat(value) || 0;
    console.log('Poids unitaire changé:', this.unitWeight); // Debug
    this.calculateQuantities();
  }

// Dans votre composant - AMÉLIORER LES MÉTHODES
  incrementStock() {
    console.log("Bouton + cliqué - Stock actuel:", this.stockQuantity, "Max:", this.totalQuantity);

    if (this.totalQuantity === 0) {
      console.log("Quantité totale est 0, impossible d'incrémenter");
      return;
    }

    if (this.stockQuantity < this.totalQuantity) {
      this.stockQuantity++;
      console.log('Stock incrémenté:', this.stockQuantity);
    } else {
      console.log('Stock déjà au maximum');
    }
  }

  decrementStock() {
    console.log("Bouton - cliqué - Stock actuel:", this.stockQuantity);

    if (this.stockQuantity > 0) {
      this.stockQuantity--;
      console.log('Stock décrémenté:', this.stockQuantity);
    } else {
      console.log('Stock déjà au minimum');
    }
  }

  updateStockQuantity(value: any) {
    console.log("Champ modifié - Nouvelle valeur:", value);
    const newStock = parseInt(value) || 0;

    if (this.totalQuantity > 0) {
      this.stockQuantity = Math.min(Math.max(0, newStock), this.totalQuantity);
    } else {
      this.stockQuantity = Math.max(0, newStock);
    }

    console.log('Stock mis à jour:', this.stockQuantity);
  }




  // Méthodes pour la gestion des prix et promotions
  onPriceChange(value: any) {
    this.regularPrice = parseFloat(value) || 0;
  }

  onPromotionToggle(event: any) {
    this.isPromotionEnabled = event.target.checked;
    if (!this.isPromotionEnabled) {
      // Réinitialiser les valeurs de promotion si désactivée
      this.promoPrice = 0;
      this.promoStartDate = '';
      this.promoEndDate = '';
    }
  }

  onPromoPriceChange(value: any) {
    this.promoPrice = parseFloat(value) || 0;
  }

  onPromoStartDateChange(value: any) {
    this.promoStartDate = value;
  }

  onPromoEndDateChange(value: any) {
    this.promoEndDate = value;
  }

  onHarvestDateChange(value: any) {
    this.harvestDate = value;
  }

  calculateDiscountPercentage(): number {
    if (this.regularPrice > 0 && this.promoPrice > 0 && this.promoPrice < this.regularPrice) {
      return Math.round(((this.regularPrice - this.promoPrice) / this.regularPrice) * 100);
    }
    return 0;
  }

  isPromotionActive(): boolean {
    if (!this.promoStartDate || !this.promoEndDate) {
      return false;
    }

    const today = new Date();
    const startDate = new Date(this.promoStartDate);
    const endDate = new Date(this.promoEndDate);

    return today >= startDate && today <= endDate;
  }

  // Méthodes pour la gestion des images principales
  onMainImageChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.mainImageFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.mainImage = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  removeMainImage() {
    this.mainImage = null;
    this.mainImageFile = null;
  }

  // Méthodes pour la gestion des images variantes
  onVariantImagesChange(event: any) {
    const files = event.target.files;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.variantImages.push({
          url: e.target.result,
          description: '',
          file: file
        });
      };
      reader.readAsDataURL(file);
    }
    event.target.value = ''; // Reset input
  }

  removeVariantImage(index: number) {
    this.variantImages.splice(index, 1);
  }

  updateVariantImageDescription(index: number, description: any) {
    this.variantImages[index].description = description;
  }

  // Validation du formulaire
  private validateForm(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.productName.trim()) {
      errors.push('Le nom du produit est requis');
    }

    if (!this.selectedCategory) {
      errors.push('La catégorie est requise');
    }

    if (!this.selectedQuality) {
      errors.push('La qualité est requise');
    }

    if (this.isCooperative && !this.selectedProducerId) {
      errors.push('Vous devez attribuer le produit à un producteur');
    }

    if (this.totalWeight <= 0) {
      errors.push('Le poids total doit être supérieur à 0');
    }

    if (this.unitWeight <= 0) {
      errors.push('Le poids unitaire doit être supérieur à 0');
    }

    if (!this.selectedUnit) {
      errors.push('L\'unité de vente est requise');
    }

    if (this.regularPrice <= 0) {
      errors.push('Le prix unitaire doit être supérieur à 0');
    }

    if (!this.selectedPriceUnit) {
      errors.push('Le type de prix est requis');
    }

    if (this.isPromotionEnabled) {
      if (this.promoPrice <= 0) {
        errors.push('Le prix promotionnel doit être supérieur à 0');
      }

      if (!this.promoStartDate || !this.promoEndDate) {
        errors.push('Les dates de promotion sont requises');
      }

      if (this.promoStartDate && this.promoEndDate && new Date(this.promoStartDate) > new Date(this.promoEndDate)) {
        errors.push('La date de fin de promotion doit être après la date de début');
      }

      if (this.promoPrice >= this.regularPrice) {
        errors.push('Le prix promotionnel doit être inférieur au prix régulier');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Méthodes pour les actions
  async onDraft() {
    const validation = this.validateForm();
    if (!validation.isValid) {
      this.errorMessage = validation.errors.join(', ');
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    try {
      const formData: ProductFormData = {
        product_name: this.productName,
        category: this.selectedCategory,
        assigned_producer_id: this.isCooperative ? this.selectedProducerId : undefined, // CORRECTION ici aussi
        quality: this.selectedQuality,
        total_weight: this.totalWeight,
        unit_weight: this.unitWeight,
        unit: this.selectedUnit,
        description: this.description,
        regular_price: this.regularPrice,
        price_unit: this.selectedPriceUnit,
        harvest_date: this.harvestDate || undefined,
        availability_status: this.selectedAvailability,
        is_promotion_enabled: this.isPromotionEnabled,
        promo_price: this.isPromotionEnabled ? this.promoPrice : undefined,
        promo_start_date: this.isPromotionEnabled ? this.promoStartDate : undefined,
        promo_end_date: this.isPromotionEnabled ? this.promoEndDate : undefined
      };

      const variantFiles = this.variantImages.map(img => img.file!).filter(Boolean);

      // CORRECTION: Ajouter this.currentUser comme paramètre
      await this.productManagement.createCompleteProduct(
          formData,
          this.currentUser, // AJOUT: passer l'utilisateur courant
          this.mainImageFile || undefined,
          variantFiles
      );

      this.successMessage = 'Produit sauvegardé comme brouillon avec succès!';

      setTimeout(() => {
        this.resetForm();
        this.successMessage = '';
      }, 3000);

    } catch (error) {
      console.error('Erreur sauvegarde brouillon:', error);
      this.errorMessage = 'Erreur lors de la sauvegarde du brouillon';
    } finally {
      this.isLoading = false;
    }
  }

  async onPublish() {
    const validation = this.validateForm();
    if (!validation.isValid) {
      this.errorMessage = validation.errors.join(', ');
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    try {
      const formData: ProductFormData = {
        product_name: this.productName,
        category: this.selectedCategory,
        assigned_producer_id: this.isCooperative ? this.selectedProducerId : undefined, // CORRECTION: utiliser assigned_producer_id
        quality: this.selectedQuality,
        total_weight: this.totalWeight,
        unit_weight: this.unitWeight,
        unit: this.selectedUnit,
        description: this.description,
        regular_price: this.regularPrice,
        price_unit: this.selectedPriceUnit,
        harvest_date: this.harvestDate || undefined,
        availability_status: this.selectedAvailability,
        is_promotion_enabled: this.isPromotionEnabled,
        promo_price: this.isPromotionEnabled ? this.promoPrice : undefined,
        promo_start_date: this.isPromotionEnabled ? this.promoStartDate : undefined,
        promo_end_date: this.isPromotionEnabled ? this.promoEndDate : undefined
      };

      const variantFiles = this.variantImages.map(img => img.file!).filter(Boolean);

      // CORRECTION: Ajouter this.currentUser comme paramètre
      const product = await this.productManagement.createCompleteProduct(
          formData,
          this.currentUser, // AJOUT: passer l'utilisateur courant
          this.mainImageFile || undefined,
          variantFiles
      );

      // Publier le produit
      await this.productManagement.publishProduct(product.id!);

      this.successMessage = 'Produit publié avec succès!';

      // Réinitialiser le formulaire après un délai
      setTimeout(() => {
        this.resetForm();
        this.successMessage = '';
      }, 3000);

    } catch (error) {
      console.error('Erreur publication produit:', error);
      this.errorMessage = 'Erreur lors de la publication du produit';
    } finally {
      this.isLoading = false;
    }
  }

  // Méthode utilitaire pour réinitialiser le formulaire
  // Dans resetForm() - AMÉLIORER
  resetForm() {
    this.productName = '';
    this.selectedCategory = '';
    this.selectedProducerId = '';
    this.selectedQuality = '';
    this.selectedUnit = '';
    this.selectedPriceUnit = '';
    this.selectedAvailability = 'disponible';
    this.description = '';

    // CORRECTION: Mettre des valeurs plus logiques
    this.stockQuantity = 0;
    this.totalQuantity = 0;
    this.totalWeight = 0;
    this.unitWeight = 1; // Au moins 1 pour éviter division par zéro

    this.regularPrice = 0;
    this.isPromotionEnabled = false;
    this.promoPrice = 0;
    this.promoStartDate = '';
    this.promoEndDate = '';
    this.harvestDate = '';

    this.mainImage = null;
    this.mainImageFile = null;
    this.variantImages = [];

    this.errorMessage = '';
  }

}