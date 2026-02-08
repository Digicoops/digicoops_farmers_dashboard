import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  productsCount: number;
  isActive: boolean;
  createdAt: string;
}

@Component({
  selector: 'app-category-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent],
  templateUrl: './category-management.component.html'
})
export class CategoryManagementComponent implements OnInit {
  categories: Category[] = [];
  filteredCategories: Category[] = [];
  isLoading = false;
  searchTerm = '';
  showAddModal = false;
  showRightSidebar = false;
  selectedCategory: Category | null = null;

  newCategory = {
    name: '',
    slug: '',
    description: '',
    icon: '📦',
    isActive: true
  };

  categoryIcons = ['🍎', '🥕', '🌾', '🥩', '🥛', '🛠️', '🚜', '🌱', '🍇', '🥬', '🌽', '🍞', '🧀', '🥚', '🐟'];

  ngOnInit() {
    this.loadCategories();
  }

  private loadCategories() {
    this.isLoading = true;
    
    // TODO: Remplacer par vraie API
    this.categories = [
      {
        id: '1',
        name: 'Fruits',
        slug: 'fruits',
        description: 'Fruits frais de saison',
        icon: '🍎',
        productsCount: 45,
        isActive: true,
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        name: 'Légumes',
        slug: 'legumes',
        description: 'Légumes bio et locaux',
        icon: '🥕',
        productsCount: 67,
        isActive: true,
        createdAt: new Date().toISOString()
      },
      {
        id: '3',
        name: 'Céréales',
        slug: 'cereales',
        description: 'Céréales et grains',
        icon: '🌾',
        productsCount: 23,
        isActive: true,
        createdAt: new Date().toISOString()
      },
      {
        id: '4',
        name: 'Viandes',
        slug: 'viandes',
        description: 'Viandes et volailles',
        icon: '🥩',
        productsCount: 34,
        isActive: true,
        createdAt: new Date().toISOString()
      },
      {
        id: '5',
        name: 'Produits laitiers',
        slug: 'produits-laitiers',
        description: 'Lait, fromages et dérivés',
        icon: '🥛',
        productsCount: 28,
        isActive: true,
        createdAt: new Date().toISOString()
      },
      {
        id: '6',
        name: 'Équipements',
        slug: 'equipements',
        description: 'Outils et matériel agricole',
        icon: '🛠️',
        productsCount: 12,
        isActive: false,
        createdAt: new Date().toISOString()
      }
    ];

    this.applyFilters();
    this.isLoading = false;
  }

  applyFilters() {
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      this.filteredCategories = this.categories.filter(cat =>
        cat.name.toLowerCase().includes(term) ||
        cat.description.toLowerCase().includes(term)
      );
    } else {
      this.filteredCategories = [...this.categories];
    }
  }

  onSearch() {
    this.applyFilters();
  }

  openAddModal() {
    this.newCategory = {
      name: '',
      slug: '',
      description: '',
      icon: '📦',
      isActive: true
    };
    this.showAddModal = true;
  }

  closeAddModal() {
    this.showAddModal = false;
  }

  openEditSidebar(category: Category) {
    this.selectedCategory = { ...category };
    this.showRightSidebar = true;
  }

  closeEditSidebar() {
    this.showRightSidebar = false;
    this.selectedCategory = null;
  }

  generateSlug(name: string) {
    this.newCategory.slug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  saveCategory() {
    console.log('Nouvelle catégorie:', this.newCategory);
    // TODO: Implémenter sauvegarde API
    this.closeAddModal();
    this.loadCategories();
  }

  updateCategory() {
    console.log('Mise à jour catégorie:', this.selectedCategory);
    // TODO: Implémenter mise à jour API
    this.closeEditSidebar();
    this.loadCategories();
  }

  toggleStatus(category: Category) {
    category.isActive = !category.isActive;
    console.log('Toggle status:', category);
    // TODO: Implémenter mise à jour API
  }

  deleteCategory(category: Category) {
    if (confirm(`Êtes-vous sûr de vouloir supprimer la catégorie "${category.name}" ?`)) {
      console.log('Suppression catégorie:', category);
      // TODO: Implémenter suppression API
      this.loadCategories();
    }
  }

  getTotalProducts(): number {
    return this.categories.reduce((sum, cat) => sum + cat.productsCount, 0);
  }

  getActiveCategories(): number {
    return this.categories.filter(cat => cat.isActive).length;
  }
}
