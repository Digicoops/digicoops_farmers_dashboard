import { Injectable } from '@angular/core';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { environment } from '../../../../environments/environment.development';

// DTO pour la création d'une catégorie
export interface CreateCategoryDto {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  is_active?: boolean;
  parent_id?: string;
  display_order?: number;
}

// DTO pour la mise à jour d'une catégorie
export interface UpdateCategoryDto {
  name?: string;
  slug?: string;
  description?: string;
  icon?: string;
  is_active?: boolean;
  parent_id?: string;
  display_order?: number;
}

// Interface Category complète
export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  is_active: boolean;
  parent_id?: string;
  display_order: number;
  products_count?: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

// DTO pour les filtres de recherche
export interface CategoryFilters {
  isActive?: boolean;
  parentId?: string;
  search?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      environment.supabase.url,
      environment.supabase.key
    );
  }

  /**
   * Créer une nouvelle catégorie
   */
  async createCategory(dto: CreateCategoryDto): Promise<Category> {
    try {
      const categoryData = {
        name: dto.name,
        slug: dto.slug,
        description: dto.description || '',
        icon: dto.icon || '📦',
        is_active: dto.is_active !== undefined ? dto.is_active : true,
        parent_id: dto.parent_id || null,
        display_order: dto.display_order || 0
      };

      const { data, error } = await this.supabase
        .from('categories')
        .insert([categoryData])
        .select()
        .single();

      if (error) {
        console.error('Erreur création catégorie:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erreur création catégorie:', error);
      throw error;
    }
  }

  /**
   * Récupérer toutes les catégories avec filtres optionnels
   */
  async getCategories(filters?: CategoryFilters): Promise<Category[]> {
    try {
      let query = this.supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true })
        .order('name', { ascending: true });

      if (filters?.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive);
      }

      if (filters?.parentId !== undefined) {
        if (filters.parentId === null) {
          query = query.is('parent_id', null);
        } else {
          query = query.eq('parent_id', filters.parentId);
        }
      }

      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erreur récupération catégories:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erreur récupération catégories:', error);
      throw error;
    }
  }

  /**
   * Récupérer une catégorie par ID
   */
  async getCategoryById(id: string): Promise<Category> {
    try {
      const { data, error } = await this.supabase
        .from('categories')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Erreur récupération catégorie:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erreur récupération catégorie:', error);
      throw error;
    }
  }

  /**
   * Récupérer une catégorie par slug
   */
  async getCategoryBySlug(slug: string): Promise<Category | null> {
    try {
      const { data, error } = await this.supabase
        .from('categories')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        console.error('Erreur récupération catégorie par slug:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erreur récupération catégorie par slug:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour une catégorie
   */
  async updateCategory(id: string, dto: UpdateCategoryDto): Promise<Category> {
    try {
      const updates: any = {};

      if (dto.name !== undefined) updates.name = dto.name;
      if (dto.slug !== undefined) updates.slug = dto.slug;
      if (dto.description !== undefined) updates.description = dto.description;
      if (dto.icon !== undefined) updates.icon = dto.icon;
      if (dto.is_active !== undefined) updates.is_active = dto.is_active;
      if (dto.parent_id !== undefined) updates.parent_id = dto.parent_id;
      if (dto.display_order !== undefined) updates.display_order = dto.display_order;

      const { data, error } = await this.supabase
        .from('categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erreur mise à jour catégorie:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erreur mise à jour catégorie:', error);
      throw error;
    }
  }

  /**
   * Supprimer une catégorie
   */
  async deleteCategory(id: string): Promise<void> {
    try {
      // Vérifier si la catégorie a des produits associés
      const productsCount = await this.getCategoryProductsCount(id);
      
      if (productsCount > 0) {
        throw new Error(`Impossible de supprimer cette catégorie car elle contient ${productsCount} produit(s)`);
      }

      const { error } = await this.supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erreur suppression catégorie:', error);
        throw error;
      }
    } catch (error) {
      console.error('Erreur suppression catégorie:', error);
      throw error;
    }
  }

  /**
   * Activer/Désactiver une catégorie
   */
  async toggleCategoryStatus(id: string): Promise<Category> {
    try {
      const category = await this.getCategoryById(id);
      
      return await this.updateCategory(id, {
        is_active: !category.is_active
      });
    } catch (error) {
      console.error('Erreur toggle status catégorie:', error);
      throw error;
    }
  }

  /**
   * Compter le nombre de produits dans une catégorie
   */
  async getCategoryProductsCount(categoryId: string): Promise<number> {
    try {
      const { count, error } = await this.supabase
        .from('agricultural_products')
        .select('*', { count: 'exact', head: true })
        .eq('category', categoryId);

      if (error) {
        console.error('Erreur comptage produits:', error);
        throw error;
      }

      return count || 0;
    } catch (error) {
      console.error('Erreur comptage produits:', error);
      return 0;
    }
  }

  /**
   * Récupérer toutes les catégories avec le nombre de produits
   */
  async getCategoriesWithProductCount(): Promise<Category[]> {
    try {
      const categories = await this.getCategories();
      
      const categoriesWithCount = await Promise.all(
        categories.map(async (category) => {
          const productsCount = await this.getCategoryProductsCount(category.id);
          return {
            ...category,
            products_count: productsCount
          };
        })
      );

      return categoriesWithCount;
    } catch (error) {
      console.error('Erreur récupération catégories avec comptage:', error);
      throw error;
    }
  }

  /**
   * Vérifier si un slug existe déjà
   */
  async slugExists(slug: string, excludeId?: string): Promise<boolean> {
    try {
      let query = this.supabase
        .from('categories')
        .select('id')
        .eq('slug', slug);

      if (excludeId) {
        query = query.neq('id', excludeId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erreur vérification slug:', error);
        throw error;
      }

      return (data && data.length > 0);
    } catch (error) {
      console.error('Erreur vérification slug:', error);
      return false;
    }
  }

  /**
   * Générer un slug unique à partir d'un nom
   */
  generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Réorganiser l'ordre d'affichage des catégories
   */
  async reorderCategories(categoryIds: string[]): Promise<void> {
    try {
      const updates = categoryIds.map((id, index) => 
        this.updateCategory(id, { display_order: index })
      );

      await Promise.all(updates);
    } catch (error) {
      console.error('Erreur réorganisation catégories:', error);
      throw error;
    }
  }
}
