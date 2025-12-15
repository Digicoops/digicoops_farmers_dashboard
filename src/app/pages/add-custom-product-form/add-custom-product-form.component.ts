import {Component, inject, OnInit} from "@angular/core";
import {CommonModule} from "@angular/common";
import {FormsModule} from "@angular/forms";
import {LabelComponent} from "../../shared/components/form/label/label.component";
import {InputFieldComponent} from "../../shared/components/form/input/input-field.component";
import {SelectComponent} from "../../shared/components/form/select/select.component";
import {TextAreaComponent} from "../../shared/components/form/input/text-area.component";
import {ButtonComponent} from "../../shared/components/ui/button/button.component";
import {PageBreadcrumbComponent} from "../../shared/components/common/page-breadcrumb/page-breadcrumb.component";
import {AuthService} from "../../core/services/auth/auth.service";
import {
  AgriculturalProducerManagementService
} from "../../core/services/producer/agricultural-producer-management.service";
import {ProductManagementService} from "../../core/services/products/product-management.service";
import {
  ProductType,
  ProductTypeConfig,
  ProductTypeService
} from "../../core/services/custom-products/product-type.service";
import {ProductFormData} from "../../core/models/generic-product.interface";

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
  selector: 'app-add-custom-product-form',
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
  templateUrl: './add-custom-product-form.component.html',
  standalone: true
})
export class AddCustomProductForm implements OnInit {
  private authService = inject(AuthService);
  private producerManagement = inject(AgriculturalProducerManagementService);
  private productManagement = inject(ProductManagementService);
  private productTypeService = inject(ProductTypeService);

  // Informations utilisateur
  currentUser: any = null;
  isCooperative = false;

  // Producteurs pour les coopératives
  producers: Producer[] = [];

  // Options du formulaire
  productTypeOptions: any[] = [];
  selectedProductType: ProductType | null = null;
  currentTypeConfig: ProductTypeConfig | undefined;

  // Champs spécifiques dynamiques
  specificFields: Record<string, any> = {};

  // Données du formulaire
  productName: string = '';
  description: string = '';
  selectedProducerId: string = '';

  // Prix et promotions
  regularPrice: number = 0;
  isPromotionEnabled: boolean = false;
  promoPrice: number = 0;
  promoStartDate: string = '';
  promoEndDate: string = '';
  selectedPriceUnit: string = '';

  // Stock (pour équipements seulement)
  stockQuantity: number = 1;

  // Disponibilité
  selectedAvailability: string = 'disponible';
  availability: Option[] = [
    { value: 'disponible', label: 'Disponible' },
    { value: 'rupture', label: 'Indisponible' },
    { value: 'limite', label: 'Stock limité' },
    { value: 'precommande', label: 'Sur commande' }
  ];

  // Images
  mainImage: string | null = null;
  mainImageFile: File | null = null;
  variantImages: { url: string; description: string; file?: File }[] = [];

  // États
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  async ngOnInit() {
    await this.loadUserData();
    await this.loadProducersIfCooperative();
    this.initializeProductTypes();
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

  private async loadProducersIfCooperative() {
    if (!this.isCooperative) return;
    try {
      const { producers } = await this.producerManagement.getCooperativeProducers();
      this.producers = producers;
    } catch (error) {
      console.error('Erreur chargement producteurs:', error);
    }
  }

  private initializeProductTypes() {
    this.productTypeOptions = this.productTypeService.getProductTypeOptions();
  }

  // Gestion du type de produit
  onProductTypeSelect(type: ProductType) {
    this.selectedProductType = type;
    this.currentTypeConfig = this.productTypeService.getProductType(type);

    // Réinitialiser les champs spécifiques
    this.specificFields = {};

    // Initialiser les valeurs par défaut
    if (this.currentTypeConfig) {
      this.currentTypeConfig.fields.forEach(field => {
        if (field.defaultValue !== undefined) {
          this.specificFields[field.name] = field.defaultValue;
        }
      });
    }

    // Réinitialiser certaines valeurs
    this.regularPrice = 0;
    this.isPromotionEnabled = false;
    this.promoPrice = 0;
    this.stockQuantity = type === ProductType.EQUIPMENT ? 1 : 0;

    console.log('Type sélectionné:', type, 'Config:', this.currentTypeConfig);
  }

  // Méthodes utilitaires pour l'affichage
  getTypeIcon(type: ProductType): string {
    switch (type) {
      case ProductType.SERVICE: return '🔧';
      case ProductType.EQUIPMENT: return '🚜';
      default: return '📦';
    }
  }

  getPlaceholderExample(): string {
    switch (this.selectedProductType) {
      case ProductType.SERVICE: return 'Labour de terrain professionnel';
      case ProductType.EQUIPMENT: return 'Tracteur John Deere 2023';
      default: return 'Nom du produit';
    }
  }

  getDescriptionPlaceholder(): string {
    switch (this.selectedProductType) {
      case ProductType.SERVICE:
        return 'Description détaillée du service (compétences, expérience, processus, garanties, etc.)';
      case ProductType.EQUIPMENT:
        return 'Description de l\'équipement (spécifications, avantages, historique, etc.)';
      default:
        return 'Description';
    }
  }

  getTypeSpecificTitle(): string {
    switch (this.selectedProductType) {
      case ProductType.SERVICE: return 'Détails du service';
      case ProductType.EQUIPMENT: return 'Spécifications de l\'équipement';
      default: return 'Informations spécifiques';
    }
  }

  // Gestion des champs spécifiques
  onSpecificFieldChange(fieldName: string, value: any) {
    this.specificFields[fieldName] = value;
    console.log(`Champ ${fieldName} mis à jour:`, value);
  }

  getFieldValue(fieldName: string): any {
    return this.specificFields[fieldName] || '';
  }

  // Gestion des producteurs
  get producerOptions(): Option[] {
    return this.producers.map(producer => ({
      value: producer.id,
      label: `${producer.first_name} ${producer.last_name} - ${producer.farm_name}`
    }));
  }

  onProducerAssignment(producerId: string) {
    this.selectedProducerId = producerId;
  }

  // Gestion du stock (uniquement pour équipements)
  incrementStock() {
    if (this.selectedProductType === ProductType.EQUIPMENT) {
      this.stockQuantity++;
    }
  }

  decrementStock() {
    if (this.selectedProductType === ProductType.EQUIPMENT && this.stockQuantity > 0) {
      this.stockQuantity--;
    }
  }

  updateStockQuantity(value: any) {
    if (this.selectedProductType === ProductType.EQUIPMENT) {
      const newStock = parseInt(value) || 0;
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

  // Validation du formulaire
// Dans AddCustomProductFormComponent - validation mise à jour
  private validateForm(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validation des champs communs
    if (!this.selectedProductType) {
      errors.push('Veuillez sélectionner un type de produit');
    }

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

    if (!this.mainImage) {
      errors.push('L\'image principale est requise');
    }

    // Validation des champs spécifiques
    if (this.currentTypeConfig) {
      this.currentTypeConfig.fields.forEach(field => {
        if (field.required && !this.specificFields[field.name]) {
          errors.push(`${field.label} est requis`);
        }
      });
    }

    // Validation des promotions
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

    // Validation spécifique pour les équipements
    if (this.selectedProductType === ProductType.EQUIPMENT && this.stockQuantity < 0) {
      errors.push('La quantité de stock doit être positive ou nulle');
    }

    return { isValid: errors.length === 0, errors };
  }

  // Préparation des données pour l'API
// Dans AddCustomProductFormComponent
  private prepareFormData(): any {
    const formData: any = {
      product_name: this.productName,
      product_type: this.selectedProductType,
      description: this.description,
      regular_price: this.regularPrice,
      price_unit: this.selectedPriceUnit,
      is_promotion_enabled: this.isPromotionEnabled,
      availability_status: this.selectedAvailability,
      specific_fields: { ...this.specificFields },
      stock_quantity: this.selectedProductType === ProductType.EQUIPMENT ? this.stockQuantity : 0
    };

    // Ajouter les champs de promotion si activés
    if (this.isPromotionEnabled) {
      formData.promo_price = this.promoPrice;
      formData.promo_start_date = this.promoStartDate;
      formData.promo_end_date = this.promoEndDate;
    }

    // Ajouter l'assignation du producteur pour les coopératives
    if (this.isCooperative) {
      formData.assigned_producer_id = this.selectedProducerId;
    }

    return formData;
  }

  // Actions
  async onDraft() {
    await this.saveProduct('draft');
  }

  async onPublish() {
    await this.saveProduct('published');
  }

  // Dans votre composant AddCustomProductFormComponent
  private async saveProduct(status: 'draft' | 'published') {
    const validation = this.validateForm();
    if (!validation.isValid) {
      this.errorMessage = validation.errors.join(', ');
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    try {
      // Préparer les données complètes
      const productData: any = {
        product_name: this.productName,
        description: this.description,
        regular_price: this.regularPrice,
        price_unit: this.selectedPriceUnit,
        created_by: this.currentUser.id,
        created_by_profile: this.isCooperative ? 'cooperative' : 'personal',
        assigned_producer_id: this.isCooperative ? this.selectedProducerId : undefined,
        availability_status: this.selectedAvailability,
        is_promotion_enabled: this.isPromotionEnabled,
        promo_price: this.isPromotionEnabled ? this.promoPrice : undefined,
        promo_start_date: this.isPromotionEnabled ? this.promoStartDate : undefined,
        promo_end_date: this.isPromotionEnabled ? this.promoEndDate : undefined,
        status: status,
        product_type: this.selectedProductType,
        specific_fields: this.specificFields,
        stock_quantity: this.selectedProductType === ProductType.EQUIPMENT ? this.stockQuantity : 0
      };

      // Calculer le pourcentage de réduction
      if (this.isPromotionEnabled && this.promoPrice) {
        productData.discount_percentage = this.calculateDiscountPercentage();
      }

      // Utiliser la nouvelle méthode createCustomProduct
      const variantFiles = this.variantImages.map(img => img.file!).filter(Boolean);

      const product = await this.productManagement.createCustomProduct(
          productData,
          this.mainImageFile || undefined,
          variantFiles
      );

      // Si c'est une publication, publier le produit
      if (status === 'published') {
        await this.productManagement.publishCustomProduct(product.id);
      }

      this.successMessage = `Produit ${status === 'draft' ? 'sauvegardé comme brouillon' : 'publié'} avec succès!`;

      setTimeout(() => {
        this.resetForm();
        this.successMessage = '';
      }, 3000);

    } catch (error: any) {
      console.error(`Erreur ${status} produit:`, error);
      this.errorMessage = error.message || `Erreur lors de ${status === 'draft' ? 'la sauvegarde du brouillon' : 'la publication'} du produit`;
    } finally {
      this.isLoading = false;
    }
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

  // Réinitialisation du formulaire
  resetForm() {
    this.selectedProductType = null;
    this.currentTypeConfig = undefined;
    this.specificFields = {};
    this.productName = '';
    this.description = '';
    this.selectedProducerId = '';
    this.regularPrice = 0;
    this.isPromotionEnabled = false;
    this.promoPrice = 0;
    this.promoStartDate = '';
    this.promoEndDate = '';
    this.selectedPriceUnit = '';
    this.stockQuantity = 1;
    this.selectedAvailability = 'disponible';
    this.mainImage = null;
    this.mainImageFile = null;
    this.variantImages = [];
    this.errorMessage = '';
  }
}