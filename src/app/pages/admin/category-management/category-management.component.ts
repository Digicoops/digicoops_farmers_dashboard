import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';
import { CategoryService, Category, CreateCategoryDto, UpdateCategoryDto } from '../../../core/services/categories/category.service';

@Component({
  selector: 'app-category-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent],
  templateUrl: './category-management.component.html'
})
export class CategoryManagementComponent implements OnInit {
  private categoryService = inject(CategoryService);

  categories: Category[] = [];
  filteredCategories: Category[] = [];
  isLoading = false;
  searchTerm = '';
  showAddModal = false;
  showRightSidebar = false;
  selectedCategory: Category | null = null;
  errorMessage = '';
  successMessage = '';

  newCategory = {
    name: '',
    slug: '',
    description: '',
    icon: '📦',
    is_active: true
  };

  categoryIcons = ['🍎', '🥕', '🌾', '🥩', '🥛', '🛠️', '🚜', '🌱', '🍇', '🥬', '🌽', '🍞', '🧀', '🥚', '🐟'];

  async ngOnInit() {
    await this.loadCategories();
  }

  private async loadCategories() {
    try {
      this.isLoading = true;
      this.errorMessage = '';
      
      this.categories = await this.categoryService.getCategoriesWithProductCount();
      this.applyFilters();
    } catch (error) {
      console.error('Erreur chargement catégories:', error);
      this.errorMessage = 'Erreur lors du chargement des catégories';
    } finally {
      this.isLoading = false;
    }
  }

  applyFilters() {
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      this.filteredCategories = this.categories.filter(cat =>
        cat.name.toLowerCase().includes(term) ||
        (cat.description?.toLowerCase().includes(term) || false)
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
      is_active: true
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
    this.newCategory.slug = this.categoryService.generateSlug(name);
  }

  async saveCategory() {
    try {
      this.errorMessage = '';
      this.successMessage = '';

      // Validation
      if (!this.newCategory.name.trim()) {
        this.errorMessage = 'Le nom est requis';
        return;
      }

      if (!this.newCategory.slug.trim()) {
        this.errorMessage = 'Le slug est requis';
        return;
      }

      // Vérifier si le slug existe déjà
      const slugExists = await this.categoryService.slugExists(this.newCategory.slug);
      if (slugExists) {
        this.errorMessage = 'Ce slug existe déjà. Veuillez en choisir un autre.';
        return;
      }

      const dto: CreateCategoryDto = {
        name: this.newCategory.name,
        slug: this.newCategory.slug,
        description: this.newCategory.description,
        icon: this.newCategory.icon,
        is_active: this.newCategory.is_active
      };

      await this.categoryService.createCategory(dto);
      this.successMessage = 'Catégorie créée avec succès';
      this.closeAddModal();
      await this.loadCategories();
    } catch (error: any) {
      console.error('Erreur création catégorie:', error);
      this.errorMessage = error.message || 'Erreur lors de la création de la catégorie';
    }
  }

  async updateCategory() {
    if (!this.selectedCategory) return;

    try {
      this.errorMessage = '';
      this.successMessage = '';

      // Validation
      if (!this.selectedCategory.name.trim()) {
        this.errorMessage = 'Le nom est requis';
        return;
      }

      if (!this.selectedCategory.slug.trim()) {
        this.errorMessage = 'Le slug est requis';
        return;
      }

      // Vérifier si le slug existe déjà (en excluant la catégorie actuelle)
      const slugExists = await this.categoryService.slugExists(
        this.selectedCategory.slug,
        this.selectedCategory.id
      );
      if (slugExists) {
        this.errorMessage = 'Ce slug existe déjà. Veuillez en choisir un autre.';
        return;
      }

      const dto: UpdateCategoryDto = {
        name: this.selectedCategory.name,
        slug: this.selectedCategory.slug,
        description: this.selectedCategory.description,
        icon: this.selectedCategory.icon,
        is_active: this.selectedCategory.is_active
      };

      await this.categoryService.updateCategory(this.selectedCategory.id, dto);
      this.successMessage = 'Catégorie mise à jour avec succès';
      this.closeEditSidebar();
      await this.loadCategories();
    } catch (error: any) {
      console.error('Erreur mise à jour catégorie:', error);
      this.errorMessage = error.message || 'Erreur lors de la mise à jour de la catégorie';
    }
  }

  async toggleStatus(category: Category) {
    try {
      this.errorMessage = '';
      await this.categoryService.toggleCategoryStatus(category.id);
      await this.loadCategories();
    } catch (error: any) {
      console.error('Erreur toggle status:', error);
      this.errorMessage = error.message || 'Erreur lors du changement de statut';
    }
  }

  async deleteCategory(category: Category) {
    if (confirm(`Êtes-vous sûr de vouloir supprimer la catégorie "${category.name}" ?`)) {
      try {
        this.errorMessage = '';
        await this.categoryService.deleteCategory(category.id);
        this.successMessage = 'Catégorie supprimée avec succès';
        await this.loadCategories();
      } catch (error: any) {
        console.error('Erreur suppression catégorie:', error);
        this.errorMessage = error.message || 'Erreur lors de la suppression de la catégorie';
      }
    }
  }

  getTotalProducts(): number {
    return this.categories.reduce((sum, cat) => sum + (cat.products_count || 0), 0);
  }

  getActiveCategories(): number {
    return this.categories.filter(cat => cat.is_active).length;
  }

  async refreshCategories() {
    await this.loadCategories();
  }

  clearMessages() {
    this.errorMessage = '';
    this.successMessage = '';
  }
}
