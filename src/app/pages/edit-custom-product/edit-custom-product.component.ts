// edit-generic-product.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from "../../core/services/auth/auth.service";
import { AgriculturalProducerManagementService } from "../../core/services/producer/agricultural-producer-management.service";
import { ProductManagementService } from "../../core/services/products/product-management.service";
import { ProductService, CustomProduct, AgriculturalProduct } from "../../core/services/products/product.service";


// Composants UI
import { LabelComponent } from "../../shared/components/form/label/label.component";
import { InputFieldComponent } from "../../shared/components/form/input/input-field.component";
import { SelectComponent } from "../../shared/components/form/select/select.component";
import { TextAreaComponent } from "../../shared/components/form/input/text-area.component";
import { ButtonComponent } from "../../shared/components/ui/button/button.component";
import { PageBreadcrumbComponent } from "../../shared/components/common/page-breadcrumb/page-breadcrumb.component";
import {
  ProductType,
  ProductTypeConfig,
  ProductTypeService
} from "../../core/services/custom-products/product-type.service";

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
  selector: 'app-edit-generic-product',
  imports: [
    CommonModule,
    FormsModule,
    LabelComponent,
    InputFieldComponent,
    SelectComponent,
    TextAreaComponent,
    ButtonComponent,
    PageBreadcrumbComponent
  ],
  templateUrl: './edit-custom-product.component.html',
  standalone: true
})
export class EditCustomProduct implements OnInit {
  private authService = inject(AuthService);
  private producerManagement = inject(AgriculturalProducerManagementService);
  private productManagement = inject(ProductManagementService);
  private productService = inject(ProductService);
  private productTypeService = inject(ProductTypeService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // Informations utilisateur
  currentUser: any = null;
  isCooperative = false;

  // Produit à éditer
  productId: string = '';
  product: any = null;
  productType: ProductType | null = null;

  // Producteurs pour les coopératives
  producers: Producer[] = [];
  selectedProducerId: string = '';

  // Données du formulaire
  productName: string = '';
  description: string = '';

  // Prix et promotions
  regularPrice: number = 0;
  isPromotionEnabled: boolean = false;
  promoPrice: number = 0;
  promoStartDate: string = '';
  promoEndDate: string = '';
  selectedPriceUnit: string = '';

  // Quantités (selon le type)
  stockQuantity: number = 0;
  totalQuantity: number = 0;
  totalWeight: number = 0;
  unitWeight: number = 0;

  // Disponibilité
  selectedAvailability: string = 'disponible';
  availability: Option[] = [
    { value: 'disponible', label: 'Disponible' },
    { value: 'rupture', label: 'Indisponible' },
    { value: 'limite', label: 'Stock limité' },
    { value: 'precommande', label: 'Sur commande' }
  ];

  // Champs spécifiques dynamiques
  specificFields: Record<string, any> = {};
  currentTypeConfig: ProductTypeConfig | undefined;

  // Images
  mainImage: string | null = null;
  mainImageFile: File | null = null;
  variantImages: { url: string; description: string; file?: File; id?: number }[] = [];

  // États
  isLoading = false;
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

  private async loadUserData() {
    try {
      const { user } = await this.authService.getCurrentUser();
      if (!user) {
        this.errorMessage = 'Utilisateur non connecté';
        return;
      }
      this.currentUser = user;
      this.isCooperative = user.user_metadata?.['profile'] === 'cooperative';
    } catch (error) {
      console.error('Erreur chargement utilisateur:', error);
      this.errorMessage = 'Erreur lors du chargement des données utilisateur';
    }
  }

  private async loadProductData() {
    this.isLoading = true;
    try {
      // Essayer de récupérer comme CustomProduct d'abord
      try {
        this.product = await this.productService.getProductById(this.productId) as any;
      } catch {
        // Si échec, essayer comme AgriculturalProduct
        this.product = await this.productService.getProductById(this.productId);
      }

      if (!this.product) {
        this.errorMessage = 'Produit non trouvé';
        return;
      }

      // Déterminer le type de produit
      this.productType = this.product.product_type || 'agricultural_product';
      this.currentTypeConfig = this.productTypeService.getProductType(this.productType as ProductType);

      // Remplir le formulaire
      this.populateFormWithProductData();

    } catch (error) {
      console.error('Erreur chargement produit:', error);
      this.errorMessage = 'Erreur lors du chargement du produit';
    } finally {
      this.isLoading = false;
    }
  }

  private populateFormWithProductData() {
    if (!this.product) return;

    // Données communes
    this.productName = this.product.product_name;
    this.description = this.product.description || '';
    this.selectedProducerId = this.product.assigned_producer_id || '';
    this.regularPrice = this.product.regular_price;
    this.selectedPriceUnit = this.product.price_unit;
    this.selectedAvailability = this.product.availability_status || 'disponible';
    this.isPromotionEnabled = this.product.is_promotion_enabled || false;
    this.promoPrice = this.product.promo_price || 0;
    this.promoStartDate = this.product.promo_start_date || '';
    this.promoEndDate = this.product.promo_end_date || '';

    // Données spécifiques selon le type
    if (this.productType === 'service') {
      // Produits agricoles
      this.totalWeight = this.product.total_weight || 0;
      this.unitWeight = this.product.unit_weight || 0;
      this.totalQuantity = this.product.total_quantity || 0;
      this.stockQuantity = this.product.stock_quantity || 0;

      // Remplir les champs spécifiques
      this.specificFields = {
        category: this.product.category,
        quality: this.product.quality,
        unit: this.product.unit,
        harvest_date: this.product.harvest_date,
        ...(this.product.specific_fields || {})
      };

    } else if (this.productType === 'tools') {
      // Équipements
      this.stockQuantity = this.product.stock_quantity || 0;

      // Récupérer les champs spécifiques
      this.specificFields = this.product.specific_fields || {};

    } else if (this.productType === 'service') {
      // Services
      this.specificFields = this.product.specific_fields || {};
    }

    // Images
    if (this.product.main_image) {
      this.mainImage = this.product.main_image.url;
    }

    if (this.product.variant_images) {
      this.variantImages = this.product.variant_images.map((img: any) => ({
        url: img.url,
        description: img.description || '',
        id: img.id
      }));
    }
  }

  private async loadProducersIfCooperative() {
    if (!this.isCooperative) return;
    try {
      const { producers } = await this.producerManagement.getCooperativeProducers();
      this.producers = producers;
    } catch (error) {
      console.error('Erreur chargement producteurs:', error);
    }
  }

  get producerOptions(): Option[] {
    return this.producers.map(producer => ({
      value: producer.id,
      label: `${producer.first_name} ${producer.last_name} - ${producer.farm_name}`
    }));
  }

  // Gestion des champs spécifiques
  onSpecificFieldChange(fieldName: string, value: any) {
    this.specificFields[fieldName] = value;
  }

  // Gestion des quantités (produits agricoles seulement)
  calculateQuantities() {
    if (this.productType === 'service') {
      if (this.unitWeight > 0 && this.totalWeight > 0) {
        this.totalQuantity = Math.floor(this.totalWeight / this.unitWeight);
        if (this.totalQuantity === 0) this.totalQuantity = 1;

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
  }

  onTotalWeightChange(value: any) {
    if (this.productType === 'service') {
      this.totalWeight = parseFloat(value) || 0;
      this.calculateQuantities();
    }
  }

  onUnitWeightChange(value: any) {
    if (this.productType === 'service') {
      this.unitWeight = parseFloat(value) || 0;
      this.calculateQuantities();
    }
  }

  // Gestion du stock
  incrementStock() {
    if (this.productType === 'service' && this.totalQuantity === 0) return;
    if (this.stockQuantity < (this.productType === 'service' ? this.totalQuantity : 9999)) {
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
    if (this.productType === 'service' && this.totalQuantity > 0) {
      this.stockQuantity = Math.min(Math.max(0, newStock), this.totalQuantity);
    } else {
      this.stockQuantity = Math.max(0, newStock);
    }
  }

  // Gestion des prix
  onPriceChange(value: any) {
    this.regularPrice = parseFloat(value) || 0;
  }

  onPriceUnitChange(value: string) {
    this.selectedPriceUnit = value;
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

  onAvailabilityChange(value: string) {
    this.selectedAvailability = value;
  }

  calculateDiscountPercentage(): number {
    if (this.regularPrice > 0 && this.promoPrice > 0 && this.promoPrice < this.regularPrice) {
      return Math.round(((this.regularPrice - this.promoPrice) / this.regularPrice) * 100);
    }
    return 0;
  }

  isPromotionActive(): boolean {
    if (!this.promoStartDate || !this.promoEndDate) return false;
    const today = new Date();
    const startDate = new Date(this.promoStartDate);
    const endDate = new Date(this.promoEndDate);
    return today >= startDate && today <= endDate;
  }

  // Gestion des images
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
    if (this.variantImages[index]) {
      this.variantImages[index].description = description;
    }
  }

  // Validation
  private validateForm(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.productName.trim()) {
      errors.push('Le nom du produit est requis');
    }

    if (!this.description.trim()) {
      errors.push('La description est requise');
    }

    if (this.regularPrice <= 0) {
      errors.push('Le prix unitaire doit être supérieur à 0');
    }

    if (!this.selectedPriceUnit) {
      errors.push('Le type de prix est requis');
    }

    if (this.isCooperative && !this.selectedProducerId) {
      errors.push('Vous devez attribuer le produit à un producteur');
    }

    if (this.productType === 'service') {
      if (this.totalWeight <= 0) errors.push('Le poids total doit être supérieur à 0');
      if (this.unitWeight <= 0) errors.push('Le poids unitaire doit être supérieur à 0');
      if (!this.specificFields['unit']) errors.push('L\'unité de vente est requise');
      if (!this.specificFields['category']) errors.push('La catégorie est requise');
      if (!this.specificFields['quality']) errors.push('La qualité est requise');
    }

    if (this.isPromotionEnabled) {
      if (this.promoPrice <= 0) errors.push('Le prix promotionnel doit être supérieur à 0');
      if (!this.promoStartDate || !this.promoEndDate) errors.push('Les dates de promotion sont requises');
      if (this.promoStartDate && this.promoEndDate && new Date(this.promoStartDate) > new Date(this.promoEndDate)) {
        errors.push('La date de fin doit être après la date de début');
      }
      if (this.promoPrice >= this.regularPrice) {
        errors.push('Le prix promotionnel doit être inférieur au prix régulier');
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  // Sauvegarde
  async onSave() {
    const validation = this.validateForm();
    if (!validation.isValid) {
      this.errorMessage = validation.errors.join(', ');
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    try {
      // Préparer les mises à jour selon le type
      const updates: any = {
        product_name: this.productName,
        description: this.description,
        assigned_producer_id: this.isCooperative ? this.selectedProducerId : null,
        regular_price: this.regularPrice,
        price_unit: this.selectedPriceUnit,
        availability_status: this.selectedAvailability,
        is_promotion_enabled: this.isPromotionEnabled,
        promo_price: this.isPromotionEnabled ? this.promoPrice : null,
        promo_start_date: this.isPromotionEnabled ? this.promoStartDate : null,
        promo_end_date: this.isPromotionEnabled ? this.promoEndDate : null,
        specific_fields: this.specificFields
      };

      // Ajouter les champs spécifiques selon le type
      if (this.productType === 'service') {
        updates.category = this.specificFields['category'];
        updates.quality = this.specificFields['quality'];
        updates.total_weight = this.totalWeight;
        updates.unit_weight = this.unitWeight;
        updates.unit = this.specificFields['unit'];
        updates.harvest_date = this.specificFields['harvest_date'];
        updates.total_quantity = this.totalQuantity;
        updates.stock_quantity = this.stockQuantity;
      } else if (this.productType === 'tools') {
        updates.stock_quantity = this.stockQuantity;
        updates.category = this.specificFields['tools_category'] || 'tools';
        updates.quality = 'standard';
        updates.unit = 'unit';
        updates.total_weight = 0;
        updates.unit_weight = 0;
        updates.total_quantity = this.stockQuantity;
      } else if (this.productType === 'service') {
        updates.category = 'service';
        updates.quality = 'standard';
        updates.unit = 'service';
        updates.total_weight = 0;
        updates.unit_weight = 0;
        updates.total_quantity = 0;
        updates.stock_quantity = 0;
      }

      // Calculer le pourcentage de réduction
      if (this.isPromotionEnabled && this.promoPrice) {
        updates.discount_percentage = this.calculateDiscountPercentage();
      }

      // Mettre à jour le produit
      const updatedProduct = await this.productService.updateProduct(this.productId, updates);

      this.successMessage = 'Produit modifié avec succès!';

      setTimeout(() => {
        this.router.navigate(['/dashboard/products']);
      }, 2000);

    } catch (error) {
      console.error('Erreur modification produit:', error);
      this.errorMessage = 'Erreur lors de la modification du produit';
    } finally {
      this.isLoading = false;
    }
  }

  onCancel() {
    this.router.navigate(['/dashboard/products']);
  }

  async onPublish() {
    try {
      await this.productManagement.publishProduct(this.productId);
      this.successMessage = 'Produit publié avec succès!';

      setTimeout(() => {
        this.loadProductData(); // Recharger les données
      }, 2000);
    } catch (error) {
      console.error('Erreur publication:', error);
      this.errorMessage = 'Erreur lors de la publication du produit';
    }
  }

  async onDraft() {
    try {
      await this.productService.updateProduct(this.productId, { status: 'draft' });
      this.successMessage = 'Produit mis en brouillon avec succès!';

      setTimeout(() => {
        this.loadProductData(); // Recharger les données
      }, 2000);
    } catch (error) {
      console.error('Erreur mise en brouillon:', error);
      this.errorMessage = 'Erreur lors de la mise en brouillon du produit';
    }
  }

  // Méthodes utilitaires pour l'affichage
  getProductTypeLabel(): string {
    switch (this.productType) {
      case 'service': return 'Service Agricole';
      case 'tools': return 'Matériel Agricole';
      default: return 'Produit';
    }
  }

  showQuantitySection(): boolean {
    return this.productType === 'service';
  }

  showStockSection(): boolean {
    return this.productType === 'service' || this.productType === 'tools';
  }

  showHarvestDate(): boolean {
    return this.productType === 'service';
  }

  getPriceUnitOptions(): Option[] {
    if (this.currentTypeConfig) {
      return this.currentTypeConfig.priceUnitOptions;
    }

    // Options par défaut selon le type
    switch (this.productType) {
      case 'service':
        return [
          { value: 'hour', label: 'FCFA/heure' },
          { value: 'day', label: 'FCFA/jour' },
          { value: 'service', label: 'FCFA/service' },
          { value: 'hectare', label: 'FCFA/hectare' },
          { value: 'contract', label: 'FCFA/contrat' }
        ];
      case 'tools':
        return [
          { value: 'unit', label: 'FCFA/unité' },
          { value: 'kg', label: 'FCFA/kg' },
          { value: 'liter', label: 'FCFA/litre' },
          { value: 'package', label: 'FCFA/paquet' },
          { value: 'set', label: 'FCFA/ensemble' }
        ];
      default:
        return [];
    }
  }
}