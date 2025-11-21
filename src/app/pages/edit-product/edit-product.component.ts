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
import {AgriculturalProduct, ProductService} from "../../core/services/products/product.service";
import {ActivatedRoute, Router} from "@angular/router";


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
  selector: 'app-edit-product',
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
  templateUrl: './edit-product.component.html',
  styles: ``,

  standalone: true
})
export class EditProductComponent implements OnInit {

  private authService = inject(AuthService);
  private producerManagement = inject(AgriculturalProducerManagementService);
  private productManagement = inject(ProductManagementService);
  private productService = inject(ProductService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // Informations de l'utilisateur connecté
  currentUser: any = null;
  userProfile: 'personal' | 'cooperative' | null = null;
  isCooperative = false;

  // Produit à éditer
  productId: string = '';
  originalProduct: AgriculturalProduct | null = null;

  // Liste des producteurs (seulement pour les coopératives)
  producers: Producer[] = [];
  selectedProducerId: string = '';

  // Options du formulaire (identique à add-product)
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
  stockQuantity: number = 0;
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
  variantImages: { url: string; description: string; file?: File; id?: number }[] = [];

  // États du composant
  isLoading = false;
  isEditing = false;
  errorMessage = '';
  successMessage = '';

  async ngOnInit() {
    this.productId = this.route.snapshot.paramMap.get('id') || '';

    if (!this.productId) {
      this.errorMessage = 'ID produit non trouvé';
      return;
    }

    await this.loadUserData();
    await this.loadProductData();
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
   * Charger les données du produit à éditer
   */
  private async loadProductData() {
    console.log("this.originalProduct========================");

    this.isLoading = true;
    try {
      this.originalProduct = await this.productService.getProductById(this.productId);
      console.log("this.originalProduct========================");
      console.log(this.originalProduct);

      if (!this.originalProduct) {
        this.errorMessage = 'Produit non trouvé';
        return;
      }

      // Remplir le formulaire avec les données existantes
      this.populateFormWithProductData();

    } catch (error) {
      console.error('Erreur chargement produit:', error);
      this.errorMessage = 'Erreur lors du chargement du produit';
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Remplir le formulaire avec les données du produit
   */
  private populateFormWithProductData() {
    if (!this.originalProduct) return;
    console.log('Données du produit à pré-remplir:', this.originalProduct);

    this.productName = this.originalProduct.product_name;
    this.selectedCategory = this.originalProduct.category;
    this.selectedProducerId = this.originalProduct.assigned_producer_id || '';
    this.selectedQuality = this.originalProduct.quality;
    this.selectedUnit = this.originalProduct.unit;
    this.selectedPriceUnit = this.originalProduct.price_unit;
    this.selectedAvailability = this.originalProduct.availability_status;
    this.description = this.originalProduct.description || '';


    this.totalWeight = this.originalProduct.total_weight;
    this.unitWeight = this.originalProduct.unit_weight;
    this.totalQuantity = this.originalProduct.total_quantity;
    this.stockQuantity = this.originalProduct.stock_quantity;

    this.regularPrice = this.originalProduct.regular_price;
    this.isPromotionEnabled = this.originalProduct.is_promotion_enabled;
    this.promoPrice = this.originalProduct.promo_price || 0;
    this.promoStartDate = this.originalProduct.promo_start_date || '';
    this.promoEndDate = this.originalProduct.promo_end_date || '';
    this.harvestDate = this.originalProduct.harvest_date || '';

    // Images
    if (this.originalProduct.main_image) {
      this.mainImage = this.originalProduct.main_image.url;
    }

    if (this.originalProduct.variant_images) {
      this.variantImages = this.originalProduct.variant_images.map((img: { url: any; description: any; id: any; }) => ({
        url: img.url,
        description: img.description || '',
        id: img.id
      }));
    }

    console.log('Valeurs après pré-remplissage:', {
      category: this.selectedCategory,
      quality: this.selectedQuality,
      unit: this.selectedUnit,
      priceUnit: this.selectedPriceUnit,
      availability: this.selectedAvailability,
      producerId: this.selectedProducerId,
      description: this.description

    });
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

  // === MÉTHODES POUR LA GESTION DU FORMULAIRE (identique à add-product) ===

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
  }

  handleProducerAssignment(producerId: string) {
    this.selectedProducerId = producerId;
  }

  calculateQuantities() {
    if (this.unitWeight > 0 && this.totalWeight > 0) {
      this.totalQuantity = Math.floor(this.totalWeight / this.unitWeight);

      if (this.totalQuantity === 0) {
        this.totalQuantity = 1;
      }

      if (this.stockQuantity === 0 && this.totalQuantity > 0) {
        this.stockQuantity = this.totalQuantity;
      } else if (this.stockQuantity > this.totalQuantity) {
        this.stockQuantity = this.totalQuantity;
      }
    } else {
      this.totalQuantity = 0;
      this.stockQuantity = 0;
    }
  }

  onTotalWeightChange(value: any) {
    this.totalWeight = parseFloat(value) || 0;
    this.calculateQuantities();
  }

  onUnitWeightChange(value: any) {
    this.unitWeight = parseFloat(value) || 0;
    this.calculateQuantities();
  }

  incrementStock() {
    if (this.totalQuantity === 0) return;
    if (this.stockQuantity < this.totalQuantity) {
      this.stockQuantity++;
    }
  }

  decrementStock() {
    if (this.stockQuantity > 0) {
      this.stockQuantity--;
    }
  }

  updateStockQuantity(value: any) {
    const newStock = parseInt(value) || 0;
    if (this.totalQuantity > 0) {
      this.stockQuantity = Math.min(Math.max(0, newStock), this.totalQuantity);
    } else {
      this.stockQuantity = Math.max(0, newStock);
    }
  }

  onPriceChange(value: any) {
    this.regularPrice = parseFloat(value) || 0;
  }

  onPromotionToggle(event: any) {
    this.isPromotionEnabled = event.target.checked;
    if (!this.isPromotionEnabled) {
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

  // Méthodes pour la gestion des images
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
    event.target.value = '';
  }

  removeVariantImage(index: number) {
    this.variantImages.splice(index, 1);
  }

  updateVariantImageDescription(index: number, description: any) {
    this.variantImages[index].description = description;
  }

  // === MÉTHODES SPÉCIFIQUES À L'ÉDITION ===

  /**
   * Validation du formulaire
   */
  private validateForm(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.productName.trim()) {
      errors.push('Le nom du produit est requis');
    }

    if (!this.selectedCategory) {
      errors.push('La catégorie est requise');
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

  /**
   * Sauvegarder les modifications
   */
  async onSave() {
    const validation = this.validateForm();
    if (!validation.isValid) {
      this.errorMessage = validation.errors.join(', ');
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    try {
      const updates: any = {
        product_name: this.productName,
        category: this.selectedCategory,
        assigned_producer_id: this.isCooperative ? this.selectedProducerId : null,
        quality: this.selectedQuality,
        total_weight: this.totalWeight,
        unit_weight: this.unitWeight,
        unit: this.selectedUnit,
        regular_price: this.regularPrice,
        price_unit: this.selectedPriceUnit,
        harvest_date: this.harvestDate || null,
        availability_status: this.selectedAvailability,
        description: this.description,
        is_promotion_enabled: this.isPromotionEnabled,
        promo_price: this.isPromotionEnabled ? this.promoPrice : null,
        promo_start_date: this.isPromotionEnabled ? this.promoStartDate : null,
        promo_end_date: this.isPromotionEnabled ? this.promoEndDate : null,
        total_quantity: this.totalQuantity,
        stock_quantity: this.stockQuantity
      };

      // Mettre à jour le produit
      const updatedProduct = await this.productService.updateProduct(this.productId, updates);

      // Gérer les images si modifiées
      if (this.mainImageFile) {
        await this.productManagement.syncProductImages(this.productId);
      }

      this.successMessage = 'Produit modifié avec succès!';

      setTimeout(() => {
        this.router.navigate(['/dashboard/edit-product', this.productId]);
      }, 2000);

    } catch (error) {
      console.error('Erreur modification produit:', error);
      this.errorMessage = 'Erreur lors de la modification du produit';
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Annuler et retourner à la vue du produit
   */
  onCancel() {
    this.router.navigate(['/dashboard/edit-product', this.productId]);
  }

  /**
   * Publier le produit
   */
  async onPublish() {
    try {
      await this.productManagement.publishProduct(this.productId);
      this.successMessage = 'Produit publié avec succès!';

      setTimeout(() => {
        this.router.navigate(['/dashboard/edit-product', this.productId]);
      }, 2000);
    } catch (error) {
      console.error('Erreur publication:', error);
      this.errorMessage = 'Erreur lors de la publication du produit';
    }
  }

  /**
   * Mettre en brouillon
   */
  async onDraft() {
    try {
      await this.productService.updateProduct(this.productId, { status: 'draft' });
      this.successMessage = 'Produit mis en brouillon avec succès!';

      setTimeout(() => {
        this.router.navigate(['/dashboard/edit-product', this.productId]);
      }, 2000);
    } catch (error) {
      console.error('Erreur mise en brouillon:', error);
      this.errorMessage = 'Erreur lors de la mise en brouillon du produit';
    }
  }
}