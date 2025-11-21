import {Component, ElementRef, HostListener, inject, ViewChild} from '@angular/core';
import { CommonModule } from '@angular/common';
import {ButtonComponent} from "../../shared/components/ui/button/button.component";
import {PageBreadcrumbComponent} from "../../shared/components/common/page-breadcrumb/page-breadcrumb.component";
import {Router, RouterLink} from "@angular/router";
import {FormsModule} from "@angular/forms";
import {
  AgriculturalProducerManagementService
} from "../../core/services/producer/agricultural-producer-management.service";
import {TableDropdownComponent} from "../../shared/components/common/table-dropdown/table-dropdown.component";

interface Producer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  farm_name: string;
  location?: string;
  production_type?: string;
  description?: string;
  account_status: string;
  role: string;
  created_at: string;
  updated_at: string;
}

interface SortConfig {
  key: string;
  asc: boolean;
}

@Component({
  selector: 'app-list-producers',
  imports: [
    CommonModule,
    ButtonComponent,
    PageBreadcrumbComponent,
    FormsModule,
    RouterLink,
    TableDropdownComponent,
  ],
  templateUrl: './list-producers.component.html',
  styles: ``
})
export class ListProducersComponent{
  private producerManagement = inject(AgriculturalProducerManagementService);
  private router = inject(Router);

  @ViewChild('filterRef', { static: false }) filterRef!: ElementRef;

  // Data
  producers: Producer[] = [];
  filteredProducers: Producer[] = [];
  isLoading = true;

  // Selection
  selected: string[] = [];

  // Search & Filter
  searchTerm = '';
  selectedProductionType = '';
  selectedStatus = '';
  showFilter = false;

  // Pagination
  page = 1;
  pageSize = 10;

  // Sorting
  sort: SortConfig = { key: 'created_at', asc: false };

  // Production type labels
  productionTypeLabels: { [key: string]: string } = {
    'vegetables': 'Légumes',
    'fruits': 'Fruits',
    'cereals': 'Céréales',
    'livestock': 'Élevage',
    'dairy': 'Produits laitiers',
    'poultry': 'Volaille',
    'mixed': 'Polyculture',
    'organic': 'Agriculture biologique'
  };

  // Status labels
  statusLabels: { [key: string]: string } = {
    'active': 'Actif',
    'inactive': 'Inactif',
    'pending': 'En attente'
  };

  ngOnInit() {
    this.loadProducers();
  }

  async loadProducers() {
    this.isLoading = true;
    try {
      const { producers, error } = await this.producerManagement.getCooperativeProducers();

      if (error) {
        console.error('Erreur chargement producteurs:', error);
        // Vous pouvez ajouter une notification d'erreur ici
        return;
      }

      this.producers = producers;
      this.applyFilters();
    } catch (error) {
      console.error('Erreur inattendue:', error);
    } finally {
      this.isLoading = false;
    }
  }

  // Search and Filter methods
  onSearch() {
    this.page = 1;
    this.applyFilters();
  }

  applyFilters() {
    let filtered = [...this.producers];

    // Apply search filter
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(producer =>
          producer.first_name.toLowerCase().includes(term) ||
          producer.last_name.toLowerCase().includes(term) ||
          producer.email.toLowerCase().includes(term) ||
          producer.farm_name.toLowerCase().includes(term) ||
          (producer.location && producer.location.toLowerCase().includes(term))
      );
    }

    // Apply production type filter
    if (this.selectedProductionType) {
      filtered = filtered.filter(producer =>
          producer.production_type === this.selectedProductionType
      );
    }

    // Apply status filter
    if (this.selectedStatus) {
      filtered = filtered.filter(producer =>
          producer.account_status === this.selectedStatus
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[this.sort.key as keyof Producer];
      const bValue = b[this.sort.key as keyof Producer];

      if (aValue === bValue) return 0;

      let comparison = 0;
      if (aValue && bValue) {
        comparison = aValue.toString().localeCompare(bValue.toString());
      } else if (aValue) {
        comparison = 1;
      } else if (bValue) {
        comparison = -1;
      }

      return this.sort.asc ? comparison : -comparison;
    });

    this.filteredProducers = filtered;
  }

  clearFilters() {
    this.searchTerm = '';
    this.selectedProductionType = '';
    this.selectedStatus = '';
    this.showFilter = false;
    this.applyFilters();
  }

  toggleFilter() {
    this.showFilter = !this.showFilter;
  }

  // Sorting methods
  sortBy(key: string) {
    if (this.sort.key === key) {
      this.sort.asc = !this.sort.asc;
    } else {
      this.sort.key = key;
      this.sort.asc = true;
    }
    this.applyFilters();
  }

  // Selection methods
  toggleAll() {
    if (this.isAllSelected()) {
      this.selected = [];
    } else {
      this.selected = this.paginatedProducers().map(p => p.id);
    }
  }

  isAllSelected(): boolean {
    return this.paginatedProducers().length > 0 &&
        this.paginatedProducers().every(p => this.selected.includes(p.id));
  }

  toggleSelect(id: string) {
    const index = this.selected.indexOf(id);
    if (index > -1) {
      this.selected.splice(index, 1);
    } else {
      this.selected.push(id);
    }
  }

  // Pagination methods
  paginatedProducers(): Producer[] {
    const startIndex = (this.page - 1) * this.pageSize;
    return this.filteredProducers.slice(startIndex, startIndex + this.pageSize);
  }

  totalPages(): number {
    return Math.ceil(this.filteredProducers.length / this.pageSize);
  }

  startItem(): number {
    return (this.page - 1) * this.pageSize + 1;
  }

  endItem(): number {
    return Math.min(this.page * this.pageSize, this.filteredProducers.length);
  }

  prevPage() {
    if (this.page > 1) {
      this.page--;
    }
  }

  nextPage() {
    if (this.page < this.totalPages()) {
      this.page++;
    }
  }

  goToPage(page: number) {
    this.page = page;
  }

  // Utility methods
  getProductionTypeLabel(type: string | undefined): string {
    return type ? this.productionTypeLabels[type] || type : 'Non spécifié';
  }

  getStatusLabel(status: string): string {
    return this.statusLabels[status] || status;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  // Action methods
  viewProducer(id: string) {
    this.router.navigate(['/agricultural-producers', 'details', id]);
  }

  editProducer(id: string) {
    this.router.navigate(['/agricultural-producers', 'edit', id]);
  }

  async toggleProducerStatus(producer: Producer) {
    const newStatus = producer.account_status === 'active' ? 'inactive' : 'active';

    try {
      const { success, error } = await this.producerManagement.updateProducerStatus(producer.id, newStatus);

      if (success) {
        producer.account_status = newStatus;
        // Vous pouvez ajouter une notification de succès ici
        console.log(`Statut du producteur ${producer.first_name} ${producer.last_name} mis à jour: ${newStatus}`);
      } else {
        console.error('Erreur changement statut:', error);
        // Vous pouvez ajouter une notification d'erreur ici
      }
    } catch (error) {
      console.error('Erreur inattendue:', error);
    }
  }

  exportProducers() {
    // Implémentez l'export CSV/Excel ici
    console.log('Export des producteurs:', this.filteredProducers);
    // Vous pouvez utiliser une bibliothèque comme SheetJS pour l'export
  }

  // Gestion des clics en dehors du filtre
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    if (this.showFilter && this.filterRef && !this.filterRef.nativeElement.contains(event.target)) {
      this.showFilter = false;
    }
  }
}