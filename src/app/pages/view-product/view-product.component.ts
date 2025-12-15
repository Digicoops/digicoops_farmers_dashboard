// view-product.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PageBreadcrumbComponent } from "../../shared/components/common/page-breadcrumb/page-breadcrumb.component";
import { ButtonComponent } from "../../shared/components/ui/button/button.component";
import {AgriculturalProduct, ProductService} from "../../core/services/products/product.service";
import {AgriculturalProducerService} from "../../core/services/producer/agricultural-producer.service";

@Component({
  selector: 'app-view-product',
  templateUrl: './view-product.component.html',
  standalone: true,
  imports: [CommonModule, PageBreadcrumbComponent, ButtonComponent]
})
export class ViewProductComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productService = inject(ProductService);
  private producerService = inject(AgriculturalProducerService);

  product: AgriculturalProduct | null = null;
  isLoading = true;
  selectedImageIndex = 0;
  producerInfo: any = null; // Pour stocker les infos du producteur
  productIdFromUrl: string | null = this.route.snapshot.paramMap.get('id');

  // Options pour les statuts
  statusOptions = [
    { value: 'draft', label: 'Brouillon', class: 'bg-gray-100 text-gray-800' },
    { value: 'published', label: 'Publié', class: 'bg-green-100 text-green-800' },
    { value: 'archived', label: 'Archivé', class: 'bg-red-100 text-red-800' }
  ];

  ngOnInit() {
    this.loadProduct();
  }

  async loadProduct() {
    const productId = this.route.snapshot.paramMap.get('id');
    this.productIdFromUrl = productId
    if (!productId) {
      console.error('ID produit non trouvé');
      this.isLoading = false;
      return;
    }

    try {
      // Utilisez la nouvelle méthode ou l'ancienne
      this.product = await this.productService.getProductWithProducerInfo(productId);

      // Si la méthode ci-dessus n'existe pas encore, chargez les infos séparément
      if (!this.product?.producer_info && this.product?.assigned_producer_id) {
        await this.loadProducerInfo(this.product.assigned_producer_id);
      }

    } catch (error) {
      console.error('Erreur chargement produit:', error);
    } finally {
      this.isLoading = false;
    }
  }

  // Méthode pour charger les informations du producteur
  async loadProducerInfo(producerId: string) {
    try {
      const { producer, error } = await this.producerService.getProducerById(producerId);
      if (error) {
        console.error('Erreur chargement infos producteur:', error);
        return;
      }
      this.producerInfo = producer;
    } catch (error) {
      console.error('Erreur chargement producteur:', error);
    }
  }

  // Obtenir les informations du producteur à afficher
  getProducerDisplayInfo() {
    if (this.product?.producer_info) {
      return this.product.producer_info;
    }
    return this.producerInfo;
  }

  // Formater le type de production
  formatProductionType(type: string): string {
    const typeMap: { [key: string]: string } = {
      'vegetables': 'Légumes',
      'fruits': 'Fruits',
      'cereals': 'Céréales',
      'livestock': 'Élevage',
      'dairy': 'Laitier',
      'poultry': 'Volaille',
      'mixed': 'Mixte',
      'organic': 'Biologique'
    };
    return typeMap[type] || type;
  }

  // Formater le prix
  formatPrice(price: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF'
    }).format(price);
  }

  // Formater la date
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR');
  }

  // Calculer le pourcentage de réduction
  calculateDiscountPercentage(): number {
    if (!this.product || !this.product.is_promotion_enabled || !this.product.promo_price) {
      return 0;
    }
    return Math.round(((this.product.regular_price - this.product.promo_price) / this.product.regular_price) * 100);
  }

  // Vérifier si la promotion est active
  isPromotionActive(): boolean {
    if (!this.product || !this.product.is_promotion_enabled || !this.product.promo_start_date || !this.product.promo_end_date) {
      return false;
    }

    const today = new Date();
    const startDate = new Date(this.product.promo_start_date);
    const endDate = new Date(this.product.promo_end_date);

    return today >= startDate && today <= endDate;
  }

  // Obtenir le texte du statut du stock
  getStockStatus(): { text: string, class: string } {
    if (!this.product) {
      return { text: 'Inconnu', class: 'bg-gray-100 text-gray-800' };
    }

    if (this.product.stock_quantity === 0) {
      return { text: 'Rupture de stock', class: 'bg-red-100 text-red-800' };
    } else if (this.product.stock_quantity < 10) {
      return { text: 'Stock limité', class: 'bg-orange-100 text-orange-800' };
    } else {
      return { text: 'En stock', class: 'bg-green-100 text-green-800' };
    }
  }

  // Obtenir le texte du statut
  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'draft': 'Brouillon',
      'published': 'Publié',
      'archived': 'Archivé'
    };
    return statusMap[status] || status;
  }

  // Actions
  async handleEdit() {
    if (this.product) {
      if (this.product.category === 'service' || this.product.category === 'tools')
        this.router.navigate(['/dashboard/edit-custom-product', this.product.id]);
      else
        this.router.navigate(['/dashboard/edit-product', this.product.id]);
    }
  }

  async handlePublish() {
    if (this.product) {
      try {
        await this.productService.updateProduct(this.product.id!, { status: 'published' });
        await this.loadProduct(); // Recharger les données
      } catch (error) {
        console.error('Erreur publication:', error);
      }
    }
  }

  async handleArchive() {
    if (this.product) {
      try {
        await this.productService.updateProduct(this.product.id!, { status: 'archived' });
        await this.loadProduct(); // Recharger les données
      } catch (error) {
        console.error('Erreur archivage:', error);
      }
    }
  }

  async handleDelete() {
    if (this.product && confirm(`Êtes-vous sûr de vouloir supprimer "${this.product.product_name}" ?`)) {
      try {
        await this.productService.deleteProduct(this.product.id!);
        this.router.navigate(['/list-product']);
      } catch (error) {
        console.error('Erreur suppression:', error);
      }
    }
  }

  // Navigation entre images
  selectImage(index: number) {
    this.selectedImageIndex = index;
  }

  // Obtenir toutes les images (principale + variantes)
  getAllImages(): any[] {
    if (!this.product) return [];

    const images = [];
    if (this.product.main_image) {
      images.push(this.product.main_image);
    }
    if (this.product.variant_images) {
      images.push(...this.product.variant_images);
    }
    return images;
  }

  // Retour à la liste
  goBack() {
    this.router.navigate(['/dashboard/view-product/'+ this.productIdFromUrl]);
  }
}