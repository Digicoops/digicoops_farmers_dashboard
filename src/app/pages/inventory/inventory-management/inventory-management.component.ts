import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';
import { ProductService } from '../../../core/services/products/product.service';
import { AuthService } from '../../../core/services/auth/auth.service';
import { DjangoImageService, DjangoImageResponse } from '../../../core/services/cloudflare/django-image.service';

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
    id?: number;
  };
  additional_images?: Array<{
    url: string;
    name: string;
    id?: number;
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
  private djangoImageService = inject(DjangoImageService);
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

  // Modal de suppression
  showDeleteModal = false;
  productToDelete: InventoryItem | null = null;
  isDeleting = false;

  // Sélection multiple
  selectedProducts: Set<string> = new Set();
  showBulkDeleteModal = false;
  isDeletingBulk = false;

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
      
      // Utiliser directement les données de Supabase sans appeler l'API Django
      const productsWithImages = products.map((p) => {
        const imageUrl = p.main_image?.url; // Utiliser seulement l'image de Supabase si elle existe
        
        const finalItem = {
          id: p.id || '',
          name: p.product_name || 'Sans nom',
          category: p.category || 'autres',
          stock: p.stock_quantity || 0,
          minStock: 10,
          price: p.regular_price || 0,
          status: this.getStockStatus(p.stock_quantity || 0, 10),
          lastUpdated: p.updated_at || p.created_at || new Date().toISOString(),
          imageUrl: imageUrl, // Plus d'appel API Django
          // Ajouter un timestamp pour forcer la détection de changements
          _timestamp: forceRefresh ? Date.now() : (p.updated_at ? new Date(p.updated_at).getTime() : Date.now())
        };
        
        console.log(`Produit ${p.id}:`, {
          name: finalItem.name,
          hasImage: !!finalItem.imageUrl
        });
        
        return finalItem;
      });
      
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
      console.log('Chargement des images pour l\'édition du produit:', productId);
      const response = await this.djangoImageService.getProductImages(this.currentUserId, productId);
      
      console.log('Images reçues pour l\'édition:', productId, response);
      
      if (response && response.length > 0) {
        // Trouver l'image principale (is_main: true)
        const mainImage = response.find(img => img.is_main);
        if (mainImage) {
          console.log('Image principale trouvée pour édition:', mainImage);
          this.selectedProduct.main_image = {
            url: mainImage.url,
            name: `main-image-${mainImage.id}`
          };
          console.log('Image principale assignée pour édition:', this.selectedProduct.main_image);
        }
        
        // Ajouter les autres images comme variantes
        const variantImages = response.filter(img => !img.is_main);
        if (variantImages.length > 0) {
          console.log('Images variantes trouvées pour édition:', variantImages);
          this.selectedProduct.additional_images = variantImages.map(img => ({
            url: img.url,
            name: `variant-image-${img.id}`
          }));
          console.log('Images variantes assignées pour édition:', this.selectedProduct.additional_images);
        }
      } else {
        console.log('Aucune image trouvée pour ce produit (édition)');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des images pour édition:', error);
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
  
  // Upload de l'image principale
  async onMainImageUpload(event: any) {
    const file = event.target.files[0];
    if (!file || !this.selectedProduct || !this.currentUserId) return;

    try {
      this.isUploadingImage = true;
      this.imageUploadProgress = 50;

      console.log('Upload image principale:', file.name);

      // Upload vers l'API Django
      const uploadResponse = await this.djangoImageService.uploadImages(
        this.currentUserId,
        this.selectedProduct.id,
        file,
        []
      );

      console.log('Upload response:', uploadResponse);

      // Mettre à jour l'interface avec la nouvelle image
      if (uploadResponse.main_image) {
        this.selectedProduct.main_image = {
          url: uploadResponse.main_image.url,
          name: `main-image-${uploadResponse.main_image.id}`,
          id: uploadResponse.main_image.id
        };
        
        // Mettre à jour Supabase avec la nouvelle URL
        await this.updateProductImagesInSupabase();
        
        console.log('Image principale mise à jour:', this.selectedProduct.main_image);
      }

      this.imageUploadProgress = 100;
      this.showSnackbarMessage('Image principale uploadée avec succès !', 'success');

    } catch (error: any) {
      console.error('Erreur lors de l\'upload de l\'image principale:', error);
      this.showSnackbarMessage('Erreur lors de l\'upload de l\'image', 'error');
    } finally {
      this.isUploadingImage = false;
      this.imageUploadProgress = 0;
      event.target.value = '';
    }
  }

  // Upload d'images additionnelles
  async onAdditionalImageUpload(event: any) {
    const file = event.target.files[0];
    if (!file || !this.selectedProduct || !this.currentUserId) return;

    try {
      this.isUploadingImage = true;
      this.imageUploadProgress = 50;

      console.log('Upload image additionnelle:', file.name);

      // Upload vers l'API Django comme variante
      const uploadResponse = await this.djangoImageService.uploadImages(
        this.currentUserId,
        this.selectedProduct.id,
        undefined,
        [file]
      );

      console.log('Upload response:', uploadResponse);

      // Ajouter les nouvelles images variantes
      if (uploadResponse.variant_images && uploadResponse.variant_images.length > 0) {
        if (!this.selectedProduct.additional_images) {
          this.selectedProduct.additional_images = [];
        }
        
        uploadResponse.variant_images.forEach((img: DjangoImageResponse) => {
          this.selectedProduct!.additional_images!.push({
            url: img.url,
            name: `variant-image-${img.id}`,
            id: img.id
          });
        });
        
        // Mettre à jour Supabase avec les nouvelles URLs
        await this.updateProductImagesInSupabase();
        
        console.log('Images variantes ajoutées:', this.selectedProduct.additional_images);
      }

      this.imageUploadProgress = 100;
      this.showSnackbarMessage('Image additionnelle uploadée avec succès !', 'success');

    } catch (error: any) {
      console.error('Erreur lors de l\'upload de l\'image additionnelle:', error);
      this.showSnackbarMessage('Erreur lors de l\'upload de l\'image', 'error');
    } finally {
      this.isUploadingImage = false;
      this.imageUploadProgress = 0;
      event.target.value = '';
    }
  }

  async removeMainImage() {
    if (!this.selectedProduct || !this.selectedProduct.main_image || !this.currentUserId) return;

    try {
      // Extraire l'ID de l'image
      const imageId = (this.selectedProduct.main_image as any).id || 
                      parseInt(this.selectedProduct.main_image.name.split('-').pop() || '0');
      
      if (imageId) {
        // Supprimer de l'API Django
        await this.djangoImageService.deleteImage(imageId);
        console.log('Image principale supprimée de l\'API:', imageId);
      }
      
      // Mettre à jour l'interface
      this.selectedProduct.main_image = undefined;
      
      // Mettre à jour Supabase
      await this.updateProductImagesInSupabase();
      
      this.showSnackbarMessage('Image principale supprimée avec succès', 'success');
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'image principale:', error);
      this.showSnackbarMessage('Erreur lors de la suppression de l\'image', 'error');
    }
  }

  async removeAdditionalImage(index: number) {
    if (!this.selectedProduct || !this.selectedProduct.additional_images || !this.currentUserId) return;

    try {
      const imageToRemove = this.selectedProduct.additional_images[index];
      
      // Extraire l'ID de l'image
      const imageId = (imageToRemove as any).id || 
                      parseInt(imageToRemove.name.split('-').pop() || '0');
      
      if (imageId) {
        // Supprimer de l'API Django
        await this.djangoImageService.deleteImage(imageId);
        console.log('Image variante supprimée de l\'API:', imageId);
      }
      
      // Mettre à jour l'interface
      this.selectedProduct.additional_images.splice(index, 1);
      
      // Mettre à jour Supabase
      await this.updateProductImagesInSupabase();
      
      this.showSnackbarMessage('Image variante supprimée avec succès', 'success');
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'image variante:', error);
      this.showSnackbarMessage('Erreur lors de la suppression de l\'image', 'error');
    }
  }

  // Promouvoir une image variante en image principale
  async setImageAsMain(index: number) {
    if (!this.selectedProduct || !this.selectedProduct.additional_images || !this.currentUserId) return;

    try {
      const imageToPromote = this.selectedProduct.additional_images[index];
      const imageId = (imageToPromote as any).id || 
                      parseInt(imageToPromote.name.split('-').pop() || '0');
      
      if (!imageId) {
        this.showSnackbarMessage('Impossible de promouvoir cette image', 'error');
        return;
      }

      console.log('Promotion de l\'image variante en principale:', imageId);

      // Appeler l'endpoint set-main de l'API Django
      const response = await this.djangoImageService.setAsMain(imageId);
      
      console.log('Réponse set-main:', response);

      // Recharger les images depuis l'API pour avoir l'état à jour
      await this.loadProductImages(this.selectedProduct.id);
      
      // Mettre à jour Supabase
      await this.updateProductImagesInSupabase();
      
      this.showSnackbarMessage('Image définie comme principale avec succès', 'success');
    } catch (error) {
      console.error('Erreur lors de la promotion de l\'image:', error);
      this.showSnackbarMessage('Erreur lors de la promotion de l\'image', 'error');
    }
  }

  // Mettre à jour les images dans Supabase après modification
  private async updateProductImagesInSupabase() {
    if (!this.selectedProduct) return;

    try {
      console.log('Mise à jour des images dans Supabase...');

      // Préparer les données d'images pour Supabase
      const updates: any = {};

      // Image principale
      if (this.selectedProduct.main_image?.url) {
        updates.main_image = {
          url: this.selectedProduct.main_image.url,
          name: this.selectedProduct.main_image.name
        };
      } else {
        updates.main_image = null;
      }

      // Images variantes
      if (this.selectedProduct.additional_images && this.selectedProduct.additional_images.length > 0) {
        updates.variant_images = this.selectedProduct.additional_images.map(img => ({
          url: img.url,
          name: img.name
        }));
      } else {
        updates.variant_images = [];
      }

      console.log('Données à envoyer à Supabase:', updates);

      // Mettre à jour dans Supabase
      await this.productService.updateProduct(this.selectedProduct.id, updates);
      
      console.log('Images mises à jour dans Supabase avec succès');
    } catch (error) {
      console.error('Erreur lors de la mise à jour des images dans Supabase:', error);
      throw error;
    }
  }

  // === Méthodes de suppression ===
  
  openDeleteModal(item: InventoryItem) {
    this.productToDelete = item;
    this.showDeleteModal = true;
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.productToDelete = null;
  }

  async confirmDelete() {
    if (!this.productToDelete || !this.currentUserId) return;

    try {
      this.isDeleting = true;

      console.log(`Suppression du produit: ${this.productToDelete.id} - ${this.productToDelete.name}`);

      // 1. Supprimer les images associées depuis l'API Django
      try {
        // Récupérer toutes les images du produit
        const images = await this.djangoImageService.getProductImages(this.currentUserId, this.productToDelete.id);
        
        // Supprimer chaque image individuellement
        for (const image of images) {
          await this.djangoImageService.deleteImage(image.id);
        }
        console.log('Images supprimées avec succès');
      } catch (imageError) {
        console.warn('Erreur lors de la suppression des images:', imageError);
        // Continuer même si les images ne peuvent pas être supprimées
      }

      // 2. Supprimer le produit depuis Supabase
      await this.productService.deleteProduct(this.productToDelete.id);
      console.log('Produit supprimé avec succès');

      // 3. Recharger l'inventaire
      await this.loadInventory(true);

      // 4. Afficher le message de succès
      this.showSnackbarMessage(
        `Le produit "${this.productToDelete.name}" a été supprimé avec succès !`,
        'success'
      );

      // 5. Fermer le modal
      this.closeDeleteModal();

    } catch (error: any) {
      console.error('Erreur lors de la suppression du produit:', error);
      
      let errorMessage = 'Erreur lors de la suppression du produit';
      if (error?.message?.includes('foreign key constraint')) {
        errorMessage = 'Impossible de supprimer ce produit car il est utilisé dans d\'autres enregistrements';
      } else if (error?.message?.includes('network')) {
        errorMessage = 'Erreur réseau. Veuillez vérifier votre connexion';
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      this.showSnackbarMessage(errorMessage, 'error');
    } finally {
      this.isDeleting = false;
    }
  }

  // === Méthodes de sélection multiple ===

  toggleProductSelection(productId: string) {
    if (this.selectedProducts.has(productId)) {
      this.selectedProducts.delete(productId);
    } else {
      this.selectedProducts.add(productId);
    }
  }

  isProductSelected(productId: string): boolean {
    return this.selectedProducts.has(productId);
  }

  toggleSelectAll() {
    if (this.isAllSelected()) {
      this.selectedProducts.clear();
    } else {
      this.filteredInventory.forEach(item => {
        this.selectedProducts.add(item.id);
      });
    }
  }

  isAllSelected(): boolean {
    return this.filteredInventory.length > 0 && 
           this.filteredInventory.every(item => this.selectedProducts.has(item.id));
  }

  isSomeSelected(): boolean {
    return this.selectedProducts.size > 0 && !this.isAllSelected();
  }

  getSelectedCount(): number {
    return this.selectedProducts.size;
  }

  clearSelection() {
    this.selectedProducts.clear();
  }

  openBulkDeleteModal() {
    if (this.selectedProducts.size === 0) return;
    this.showBulkDeleteModal = true;
  }

  closeBulkDeleteModal() {
    this.showBulkDeleteModal = false;
  }

  async confirmBulkDelete() {
    if (this.selectedProducts.size === 0 || !this.currentUserId) return;

    try {
      this.isDeletingBulk = true;
      const productIds = Array.from(this.selectedProducts);
      const totalProducts = productIds.length;
      let successCount = 0;
      let errorCount = 0;

      console.log(`Suppression de ${totalProducts} produits...`);

      // Supprimer chaque produit
      for (const productId of productIds) {
        try {
          // 1. Supprimer les images associées
          try {
            const images = await this.djangoImageService.getProductImages(this.currentUserId, productId);
            for (const image of images) {
              await this.djangoImageService.deleteImage(image.id);
            }
          } catch (imageError) {
            console.warn(`Erreur lors de la suppression des images du produit ${productId}:`, imageError);
          }

          // 2. Supprimer le produit
          await this.productService.deleteProduct(productId);
          successCount++;
          console.log(`Produit ${productId} supprimé (${successCount}/${totalProducts})`);
        } catch (error) {
          console.error(`Erreur lors de la suppression du produit ${productId}:`, error);
          errorCount++;
        }
      }

      // 3. Recharger l'inventaire
      await this.loadInventory(true);

      // 4. Afficher le message de succès/erreur
      if (errorCount === 0) {
        this.showSnackbarMessage(
          `${successCount} produit${successCount > 1 ? 's' : ''} supprimé${successCount > 1 ? 's' : ''} avec succès !`,
          'success'
        );
      } else if (successCount > 0) {
        this.showSnackbarMessage(
          `${successCount} produit${successCount > 1 ? 's' : ''} supprimé${successCount > 1 ? 's' : ''}, ${errorCount} erreur${errorCount > 1 ? 's' : ''}`,
          'error'
        );
      } else {
        this.showSnackbarMessage(
          `Erreur lors de la suppression des produits`,
          'error'
        );
      }

      // 5. Réinitialiser la sélection et fermer le modal
      this.clearSelection();
      this.closeBulkDeleteModal();

    } catch (error: any) {
      console.error('Erreur lors de la suppression multiple:', error);
      this.showSnackbarMessage('Erreur lors de la suppression des produits', 'error');
    } finally {
      this.isDeletingBulk = false;
    }
  }
}
