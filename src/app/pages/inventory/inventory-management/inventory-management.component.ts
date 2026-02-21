import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';
import { ProductService } from '../../../core/services/products/product.service';
import { AuthService } from '../../../core/services/auth/auth.service';
import { ImageService, ImageFile, ProductImagesResponse } from '../../../core/services/images/image.service';

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  stock: number;
  minStock: number;
  price: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  lastUpdated: string;
  imageUrl?: string;
}

interface EditableProduct {
  id: string;
  product_name: string;
  category: string;
  stock_quantity: number;
  total_quantity: number;
  regular_price: number;
  description?: string;
  unit: string;
  quality: string;
  availability_status: string;
  status: 'draft' | 'published' | 'archived';
  created_by?: string;
  created_by_profile?: 'personal' | 'cooperative';
  updated_at?: string;
  main_image?: {
    url: string;
    name: string;
  };
  additional_images?: Array<{
    url: string;
    name: string;
  }>;
}

@Component({
  selector: 'app-inventory-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent],
  templateUrl: './inventory-management.component.html'
})
export class InventoryManagementComponent implements OnInit {
  private productService = inject(ProductService);
  private authService = inject(AuthService);
  private imageService = inject(ImageService);
  private cdr = inject(ChangeDetectorRef);

  inventory: InventoryItem[] = [];
  filteredInventory: InventoryItem[] = [];
  isLoading = true;
  searchTerm = '';
  selectedCategory = '';
  selectedStatus = '';
  isAdmin = false;
  currentUserId = '';

  // Sidebar state
  showEditSidebar = false;
  selectedProduct: EditableProduct | null = null;
  isSaving = false;
  
  // Image upload state
  isUploadingImage = false;
  imageUploadProgress = 0;

  // Snackbar state
  showSnackbar = false;
  snackbarMessage = '';
  snackbarType: 'success' | 'error' = 'success';

  categoryOptions = [
    { value: '', label: 'Toutes les catégories' },
    { value: 'fruits', label: 'Fruits' },
    { value: 'legumes', label: 'Légumes' },
    { value: 'cereales', label: 'Céréales' },
    { value: 'viandes', label: 'Viandes' },
    { value: 'produits-laitiers', label: 'Produits laitiers' },
    { value: 'service', label: 'Services' },
    { value: 'tools', label: 'Équipements' }
  ];

  statusOptions = [
    { value: '', label: 'Tous les statuts' },
    { value: 'in_stock', label: 'En stock' },
    { value: 'low_stock', label: 'Stock faible' },
    { value: 'out_of_stock', label: 'Rupture de stock' }
  ];

  async ngOnInit() {
    await this.loadInventory();
  }

  private async loadInventory(forceRefresh: boolean = false) {
    try {
      this.isLoading = true;
      
      const { user } = await this.authService.getCurrentUser();
      if (!user) return;

      // Récupérer l'ID utilisateur et vérifier si admin
      const email = user.email;
      this.currentUserId = user.id;
      this.isAdmin = email ? (email.endsWith('@octus-agency.com') || email.endsWith('@digicoops.com')) : false;

      console.log(`Chargement inventaire (forceRefresh: ${forceRefresh})`);

      // Si admin, charger tous les produits, sinon uniquement ceux de l'utilisateur
      const products = this.isAdmin 
        ? await this.productService.getProducts() // Tous les produits pour admin
        : await this.productService.getProducts({ userId: user.id }); // Seulement ses produits pour non-admin
      
      // Charger les images pour chaque produit
      const productsWithImages = await Promise.all(
        products.map(async (p) => {
          let imageUrl = undefined;
          
          // Essayer de charger les images depuis l'API Django
          try {
            console.log(`Tentative de chargement des images pour le produit ${p.id}`);
            const response = await this.imageService.getProductImages(user.id, p.id!).toPromise();
            console.log(`Réponse API pour ${p.id}:`, response);
            
            if (response?.main_image) {
              imageUrl = response.main_image.url;
              console.log(`Image principale trouvée pour ${p.id}:`, imageUrl);
            } else {
              console.log(`Pas d'image principale pour ${p.id}`);
            }
          } catch (error) {
            // Silencieux - l'API peut être indisponible
            console.log(`Info: Impossible de charger les images pour le produit ${p.id}:`, error);
          }
          
          const finalItem = {
            id: p.id || '',
            name: p.product_name || 'Sans nom',
            category: p.category || 'autres',
            stock: p.stock_quantity || 0,
            minStock: 10,
            price: p.regular_price || 0,
            status: this.getStockStatus(p.stock_quantity || 0, 10),
            lastUpdated: p.updated_at || p.created_at || new Date().toISOString(),
            imageUrl: imageUrl || p.main_image?.url, // Fallback vers l'image dans Supabase
            // Ajouter un timestamp pour forcer la détection de changements
            _timestamp: forceRefresh ? Date.now() : (p.updated_at ? new Date(p.updated_at).getTime() : Date.now())
          };
          
          console.log(`Produit final ${p.id}:`, {
            name: finalItem.name,
            imageUrl: finalItem.imageUrl,
            hasImage: !!finalItem.imageUrl
          });
          
          return finalItem;
        })
      );
      
      // Forcer la mise à jour en créant un nouveau tableau
      if (forceRefresh) {
        this.inventory = [];
        // Forcer Angular à détecter le changement
        this.cdr.detectChanges();
        setTimeout(() => {
          this.inventory = productsWithImages;
          this.applyFilters();
          this.cdr.detectChanges(); // Forcer la détection après mise à jour
        }, 0);
      } else {
        this.inventory = productsWithImages;
        this.applyFilters();
      }

      console.log(`Inventaire chargé: ${this.inventory.length} produits (Admin: ${this.isAdmin})`);
      
      // Log des produits avec images
      const productsWithImagesCount = this.inventory.filter(p => p.imageUrl).length;
      console.log(`Produits avec images: ${productsWithImagesCount}/${this.inventory.length}`);
      
      // Afficher les URLs des images pour debug
      this.inventory.forEach((product, index) => {
        if (product.imageUrl) {
          console.log(`Produit ${index + 1} (${product.name}): ${product.imageUrl}`);
        }
        console.log(`  - Stock: ${product.stock}, Prix: ${product.price}, Dernière mise à jour: ${product.lastUpdated}`);
      });
      
    } catch (error) {
      console.error('Erreur chargement inventaire:', error);
    } finally {
      this.isLoading = false;
    }
  }

  private getStockStatus(stock: number, minStock: number): 'in_stock' | 'low_stock' | 'out_of_stock' {
    if (stock === 0) return 'out_of_stock';
    if (stock <= minStock) return 'low_stock';
    return 'in_stock';
  }

  applyFilters() {
    let filtered = [...this.inventory];

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(term) ||
        item.category.toLowerCase().includes(term)
      );
    }

    if (this.selectedCategory) {
      filtered = filtered.filter(item => item.category === this.selectedCategory);
    }

    if (this.selectedStatus) {
      filtered = filtered.filter(item => item.status === this.selectedStatus);
    }

    this.filteredInventory = filtered;
  }

  onSearch() {
    this.applyFilters();
  }

  clearFilters() {
    this.searchTerm = '';
    this.selectedCategory = '';
    this.selectedStatus = '';
    this.applyFilters();
  }

  getStatusBadgeClass(status: string): string {
    const classes: { [key: string]: string } = {
      'in_stock': 'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400',
      'low_stock': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      'out_of_stock': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    };
    return classes[status] || 'bg-gray-100 text-gray-800 dark:bg-background-dark/30 dark:text-gray-400';
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'in_stock': 'En stock',
      'low_stock': 'Stock faible',
      'out_of_stock': 'Rupture'
    };
    return labels[status] || status;
  }

  getCategoryLabel(category: string): string {
    const option = this.categoryOptions.find(opt => opt.value === category);
    return option?.label || category;
  }

  getTotalValue(): number {
    return this.filteredInventory.reduce((sum, item) => sum + (item.stock * item.price), 0);
  }

  getLowStockCount(): number {
    return this.inventory.filter(item => item.status === 'low_stock').length;
  }

  getOutOfStockCount(): number {
    return this.inventory.filter(item => item.status === 'out_of_stock').length;
  }

  async refreshInventory() {
    await this.loadInventory(true); // Forcer le rechargement
  }

  // === Méthodes d'édition ===
  
  async editProduct(item: InventoryItem) {
    try {
      // Charger les données complètes du produit depuis Supabase
      const fullProduct = await this.productService.getProductById(item.id);
      
      // Convertir InventoryItem en EditableProduct avec les données complètes
      this.selectedProduct = {
        id: fullProduct.id || item.id,
        product_name: fullProduct.product_name || item.name,
        category: fullProduct.category || item.category,
        description: fullProduct.description || '', // Charger la description existante
        stock_quantity: fullProduct.stock_quantity || item.stock,
        total_quantity: fullProduct.total_quantity || item.stock,
        regular_price: fullProduct.regular_price || item.price,
        unit: fullProduct.unit || 'kg',
        quality: fullProduct.quality || 'standard',
        availability_status: fullProduct.availability_status || (item.status === 'in_stock' ? 'disponible' : 'rupture'),
        status: fullProduct.status || 'draft',
        created_by: fullProduct.created_by || this.currentUserId,
        created_by_profile: fullProduct.created_by_profile || 'personal',
        updated_at: new Date().toISOString(),
        // Ne pas initialiser les images - elles seront chargées depuis l'API
        main_image: undefined,
        additional_images: undefined
      };
      
      console.log('Produit complet chargé:', this.selectedProduct);
      
      // Charger les images existantes depuis l'API
      this.loadProductImages(item.id);
      this.showEditSidebar = true;
    } catch (error) {
      console.error('Erreur lors du chargement du produit complet:', error);
      // Fallback : utiliser les données de base si erreur
      this.selectedProduct = {
        id: item.id,
        product_name: item.name,
        category: item.category,
        description: '', // Description vide par défaut
        stock_quantity: item.stock,
        total_quantity: item.stock,
        regular_price: item.price,
        unit: 'kg',
        quality: 'standard',
        availability_status: item.status === 'in_stock' ? 'disponible' : 'rupture',
        status: 'draft',
        created_by: this.currentUserId,
        created_by_profile: 'personal',
        updated_at: new Date().toISOString(),
        main_image: undefined,
        additional_images: undefined
      };
      this.showEditSidebar = true;
    }
  }

  private async loadProductImages(productId: string) {
    if (!this.currentUserId || !this.selectedProduct) return;

    try {
      const response = await this.imageService.getProductImages(this.currentUserId, productId).toPromise();
      
      console.log('Images reçues pour le produit:', productId, response);
      
      if (response?.main_image) {
        console.log('Image principale trouvée:', response.main_image);
        this.selectedProduct.main_image = {
          url: response.main_image.url,
          name: `main-image-${response.main_image.id}`
        };
        console.log('Image principale assignée:', this.selectedProduct.main_image);
      }
      
      if (response?.variant_images && response.variant_images.length > 0) {
        console.log('Images variantes trouvées:', response.variant_images);
        this.selectedProduct.additional_images = response.variant_images.map(img => ({
          url: img.url,
          name: `variant-image-${img.id}`
        }));
        console.log('Images variantes assignées:', this.selectedProduct.additional_images);
      }
      
      if (!response?.main_image && (!response?.variant_images || response.variant_images.length === 0)) {
        console.log('Aucune image trouvée pour ce produit');
      }
    } catch (error) {
      console.log('Info: Impossible de charger les images existantes (API peut être indisponible)');
      // Ne pas afficher d'erreur car c'est normal si l'API n'est pas accessible
      // Les images existantes resteront vides mais l'utilisateur peut en uploader de nouvelles
    }
  }

  closeEditSidebar() {
    this.showEditSidebar = false;
    this.selectedProduct = null;
  }

  async saveProductChanges() {
    if (!this.selectedProduct) return;

    try {
      this.isSaving = true;

      // Récupérer le produit existant pour obtenir total_quantity
      const existingProduct = await this.productService.getProductById(this.selectedProduct.id);
      
      // Préparer les données pour la mise à jour
      const updates: any = {
        product_name: this.selectedProduct.product_name,
        category: this.selectedProduct.category,
        description: this.selectedProduct.description, // Ajouter la description
        stock_quantity: this.selectedProduct.stock_quantity,
        regular_price: this.selectedProduct.regular_price,
        unit: this.selectedProduct.unit,
        quality: this.selectedProduct.quality,
        availability_status: this.selectedProduct.availability_status,
        updated_at: new Date().toISOString()
      };

      // S'assurer que stock_quantity ne dépasse pas total_quantity
      if (this.selectedProduct.stock_quantity > (existingProduct.total_quantity || 0)) {
        updates.total_quantity = this.selectedProduct.stock_quantity;
      }

      console.log('Données de mise à jour:', updates);
      
      // Mettre à jour le produit via le service
      await this.productService.updateProduct(this.selectedProduct.id, updates);

      // Fermer la sidebar et recharger l'inventaire
      this.closeEditSidebar();
      await this.loadInventory(true); // Forcer le rechargement

      this.showSnackbarMessage('Produit mis à jour avec succès !', 'success');
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour du produit:', error);
      
      // Gérer l'erreur de contrainte check_quantities
      if (error?.code === '23514' && error?.message?.includes('check_quantities')) {
        this.showSnackbarMessage('Erreur: La quantité en stock ne peut pas dépasser la quantité totale.', 'error');
      } else {
        this.showSnackbarMessage('Erreur lors de la mise à jour du produit', 'error');
      }
    } finally {
      this.isSaving = false;
    }
  }

  // === Méthodes Snackbar ===
  
  showSnackbarMessage(message: string, type: 'success' | 'error' = 'success') {
    this.snackbarMessage = message;
    this.snackbarType = type;
    this.showSnackbar = true;
    
    // Auto-cacher après 4 secondes
    setTimeout(() => {
      this.hideSnackbar();
    }, 4000);
  }

  hideSnackbar() {
    this.showSnackbar = false;
  }

  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
  }

  // === Méthodes de gestion des images ===
  
  onMainImageUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.uploadImage(input.files[0], 'main');
    }
  }

  onAdditionalImageUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.uploadImage(input.files[0], 'additional');
    }
  }

  async uploadImage(file: File, type: 'main' | 'additional') {
    if (!this.selectedProduct || !this.currentUserId) return;

    try {
      this.isUploadingImage = true;
      this.imageUploadProgress = 0;

      let mainImageFile: File | undefined;
      let variantFiles: File[] = [];

      if (type === 'main') {
        mainImageFile = file;
      } else if (type === 'additional') {
        // Si on upload une variante mais qu'il n'y a pas d'image principale,
        // on la met comme principale temporairement pour éviter l'erreur 400
        if (!this.selectedProduct.main_image) {
          mainImageFile = file; // Devient temporairement l'image principale
          console.log('Pas d\'image principale existante, la variante deviendra principale temporairement');
        } else {
          variantFiles = [file];
        }
      }

      // Utiliser l'API réelle
      this.imageService.uploadImagesWithProgress(
        this.currentUserId,
        this.selectedProduct.id,
        mainImageFile,
        variantFiles,
        (progress) => {
          this.imageUploadProgress = progress;
        }
      ).subscribe({
        next: (response) => {
          if (!this.selectedProduct || !response) return;
          
          if (type === 'main' && response?.main_image) {
            this.selectedProduct.main_image = {
              url: response.main_image.url,
              name: file.name
            };
          } else if (type === 'additional') {
            if (!this.selectedProduct.additional_images) {
              this.selectedProduct.additional_images = [];
            }
            
            // Si pas d'image principale existante, la nouvelle devient principale
            if (!this.selectedProduct.main_image && response?.main_image) {
              this.selectedProduct.main_image = {
                url: response.main_image.url,
                name: file.name
              };
              console.log('Variante devenue image principale:', this.selectedProduct.main_image);
            }
            
            // Ajouter les variantes
            if (response?.variant_images?.length) {
              response.variant_images.forEach((img: any) => {
                if (img?.url) {
                  this.selectedProduct!.additional_images!.push({
                    url: img.url,
                    name: file.name
                  });
                }
              });
            }
          }
          
          this.isUploadingImage = false;
          this.imageUploadProgress = 0;
          this.showSnackbarMessage('Image uploadée avec succès !', 'success');
        },
        error: (error) => {
          console.error('Erreur lors de l\'upload de l\'image:', error);
          this.isUploadingImage = false;
          
          // Message d'erreur plus informatif
          let errorMessage = 'Erreur lors de l\'upload de l\'image';
          if (error.status === 0) {
            errorMessage = 'Serveur d\'images indisponible. Veuillez réessayer plus tard.';
          } else if (error.status === 400) {
            errorMessage = 'Format d\'image invalide ou fichier trop volumineux, ou image principale requise.';
          } else if (error.status === 500) {
            errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
          }
          
          this.showSnackbarMessage(errorMessage, 'error');
        }
      });
    } catch (error) {
      console.error('Erreur lors de l\'upload de l\'image:', error);
      this.isUploadingImage = false;
      this.showSnackbarMessage('Erreur lors de l\'upload de l\'image', 'error');
    }
  }

  removeMainImage() {
    if (this.selectedProduct) {
      this.selectedProduct.main_image = undefined;
    }
  }

  removeAdditionalImage(index: number) {
    if (this.selectedProduct && this.selectedProduct.additional_images) {
      this.selectedProduct.additional_images.splice(index, 1);
    }
  }
}
