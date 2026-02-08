import { Injectable } from '@angular/core';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { environment } from '../../../../environments/environment.development';
import { BehaviorSubject, Observable } from 'rxjs';

export interface CartItem {
  id?: string;
  cart_id: string;
  product_id: string;
  product_name: string;
  product_type: 'agricultural_product' | 'service' | 'equipment';
  quantity: number;
  unit_price: number;
  total_price: number;
  product_image?: string;
  product_details?: any;
  created_at?: string;
  updated_at?: string;
}

export interface Cart {
  id?: string;
  user_id: string;
  status: 'active' | 'completed' | 'abandoned';
  total_items: number;
  total_amount: number;
  created_at?: string;
  updated_at?: string;
  items?: CartItem[];
}

export interface CartSummary {
  totalItems: number;
  totalAmount: number;
  itemCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private supabase: SupabaseClient;
  private cartSubject = new BehaviorSubject<Cart | null>(null);
  public cart$: Observable<Cart | null> = this.cartSubject.asObservable();

  constructor() {
    this.supabase = createClient(
      environment.supabase.url,
      environment.supabase.key
    );
  }

  /**
   * Récupérer ou créer le panier actif de l'utilisateur
   */
  async getOrCreateCart(userId: string): Promise<Cart> {
    try {
      // Chercher un panier actif existant
      const { data: existingCart, error: fetchError } = await this.supabase
        .from('carts')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (existingCart && !fetchError) {
        // Charger les items du panier
        const cartWithItems = await this.loadCartItems(existingCart);
        this.cartSubject.next(cartWithItems);
        return cartWithItems;
      }

      // Créer un nouveau panier si aucun n'existe
      const { data: newCart, error: createError } = await this.supabase
        .from('carts')
        .insert([{
          user_id: userId,
          status: 'active',
          total_items: 0,
          total_amount: 0
        }])
        .select()
        .single();

      if (createError) throw createError;

      const cart = { ...newCart, items: [] };
      this.cartSubject.next(cart);
      return cart;

    } catch (error) {
      console.error('Erreur récupération/création panier:', error);
      throw error;
    }
  }

  /**
   * Charger les items d'un panier
   */
  private async loadCartItems(cart: Cart): Promise<Cart> {
    const { data: items, error } = await this.supabase
      .from('cart_items')
      .select('*')
      .eq('cart_id', cart.id!)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur chargement items panier:', error);
      return { ...cart, items: [] };
    }

    return { ...cart, items: items || [] };
  }

  /**
   * Ajouter un produit au panier
   */
  async addToCart(
    userId: string,
    productId: string,
    productName: string,
    productType: 'agricultural_product' | 'service' | 'equipment',
    quantity: number,
    unitPrice: number,
    productImage?: string,
    productDetails?: any
  ): Promise<Cart> {
    try {
      // Récupérer ou créer le panier
      const cart = await this.getOrCreateCart(userId);

      // Vérifier si le produit existe déjà dans le panier
      const existingItem = cart.items?.find(item => item.product_id === productId);

      if (existingItem) {
        // Mettre à jour la quantité
        return await this.updateCartItemQuantity(
          cart.id!,
          existingItem.id!,
          existingItem.quantity + quantity
        );
      }

      // Ajouter un nouvel item
      const totalPrice = quantity * unitPrice;

      const { data: newItem, error } = await this.supabase
        .from('cart_items')
        .insert([{
          cart_id: cart.id!,
          product_id: productId,
          product_name: productName,
          product_type: productType,
          quantity: quantity,
          unit_price: unitPrice,
          total_price: totalPrice,
          product_image: productImage,
          product_details: productDetails
        }])
        .select()
        .single();

      if (error) throw error;

      // Mettre à jour le total du panier
      await this.updateCartTotals(cart.id!);

      // Recharger le panier complet
      return await this.getCartById(cart.id!);

    } catch (error) {
      console.error('Erreur ajout au panier:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour la quantité d'un item
   */
  async updateCartItemQuantity(
    cartId: string,
    itemId: string,
    newQuantity: number
  ): Promise<Cart> {
    try {
      if (newQuantity <= 0) {
        return await this.removeFromCart(cartId, itemId);
      }

      // Récupérer l'item pour calculer le nouveau total
      const { data: item, error: fetchError } = await this.supabase
        .from('cart_items')
        .select('*')
        .eq('id', itemId)
        .single();

      if (fetchError) throw fetchError;

      const newTotalPrice = newQuantity * item.unit_price;

      const { error: updateError } = await this.supabase
        .from('cart_items')
        .update({
          quantity: newQuantity,
          total_price: newTotalPrice,
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId);

      if (updateError) throw updateError;

      // Mettre à jour les totaux du panier
      await this.updateCartTotals(cartId);

      return await this.getCartById(cartId);

    } catch (error) {
      console.error('Erreur mise à jour quantité:', error);
      throw error;
    }
  }

  /**
   * Retirer un produit du panier
   */
  async removeFromCart(cartId: string, itemId: string): Promise<Cart> {
    try {
      const { error } = await this.supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      // Mettre à jour les totaux
      await this.updateCartTotals(cartId);

      return await this.getCartById(cartId);

    } catch (error) {
      console.error('Erreur suppression item panier:', error);
      throw error;
    }
  }

  /**
   * Vider le panier
   */
  async clearCart(cartId: string): Promise<Cart> {
    try {
      // Supprimer tous les items
      const { error } = await this.supabase
        .from('cart_items')
        .delete()
        .eq('cart_id', cartId);

      if (error) throw error;

      // Réinitialiser les totaux
      const { data: updatedCart, error: updateError } = await this.supabase
        .from('carts')
        .update({
          total_items: 0,
          total_amount: 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', cartId)
        .select()
        .single();

      if (updateError) throw updateError;

      const cart = { ...updatedCart, items: [] };
      this.cartSubject.next(cart);
      return cart;

    } catch (error) {
      console.error('Erreur vidage panier:', error);
      throw error;
    }
  }

  /**
   * Récupérer un panier par ID
   */
  async getCartById(cartId: string): Promise<Cart> {
    try {
      const { data: cart, error } = await this.supabase
        .from('carts')
        .select('*')
        .eq('id', cartId)
        .single();

      if (error) throw error;

      const cartWithItems = await this.loadCartItems(cart);
      this.cartSubject.next(cartWithItems);
      return cartWithItems;

    } catch (error) {
      console.error('Erreur récupération panier:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour les totaux du panier
   */
  private async updateCartTotals(cartId: string): Promise<void> {
    try {
      // Calculer les totaux depuis les items
      const { data: items, error: itemsError } = await this.supabase
        .from('cart_items')
        .select('quantity, total_price')
        .eq('cart_id', cartId);

      if (itemsError) throw itemsError;

      const totalItems = items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
      const totalAmount = items?.reduce((sum, item) => sum + item.total_price, 0) || 0;

      // Mettre à jour le panier
      const { error: updateError } = await this.supabase
        .from('carts')
        .update({
          total_items: totalItems,
          total_amount: totalAmount,
          updated_at: new Date().toISOString()
        })
        .eq('id', cartId);

      if (updateError) throw updateError;

    } catch (error) {
      console.error('Erreur mise à jour totaux panier:', error);
      throw error;
    }
  }

  /**
   * Marquer le panier comme complété (après commande)
   */
  async completeCart(cartId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('carts')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', cartId);

      if (error) throw error;

      this.cartSubject.next(null);

    } catch (error) {
      console.error('Erreur complétion panier:', error);
      throw error;
    }
  }

  /**
   * Obtenir le résumé du panier
   */
  getCartSummary(cart: Cart | null): CartSummary {
    if (!cart || !cart.items) {
      return {
        totalItems: 0,
        totalAmount: 0,
        itemCount: 0
      };
    }

    return {
      totalItems: cart.total_items,
      totalAmount: cart.total_amount,
      itemCount: cart.items.length
    };
  }

  /**
   * Vérifier si un produit est dans le panier
   */
  isProductInCart(cart: Cart | null, productId: string): boolean {
    if (!cart || !cart.items) return false;
    return cart.items.some(item => item.product_id === productId);
  }

  /**
   * Obtenir la quantité d'un produit dans le panier
   */
  getProductQuantityInCart(cart: Cart | null, productId: string): number {
    if (!cart || !cart.items) return 0;
    const item = cart.items.find(item => item.product_id === productId);
    return item?.quantity || 0;
  }
}
