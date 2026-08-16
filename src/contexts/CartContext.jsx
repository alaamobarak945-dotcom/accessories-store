import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchCart();
    } else {
      setCartItems([]);
    }
  }, [user]);

  async function fetchCart() {
    setLoading(true);

    const { data: cartData, error: cartError } = await supabase
      .from('cart')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (cartError) {
      if (cartError.code === 'PGRST116') {
        const { data: newCart, error: createError } = await supabase
          .from('cart')
          .insert({ user_id: user.id })
          .select('id')
          .single();

        if (createError) {
          console.error('Error creating cart:', createError.message);
          setLoading(false);
          return;
        }

        setCartItems([]);
      } else {
        console.error('Error fetching cart:', cartError.message);
      }
      setLoading(false);
      return;
    }

    const { data: items, error: itemsError } = await supabase
      .from('cart_items')
      .select(`
        id,
        quantity,
        products (
          id,
          name,
          price,
          stock,
          is_active,
          product_images (
            id,
            image_url,
            is_primary
          )
        )
      `)
      .eq('cart_id', cartData.id);

    if (itemsError) {
      console.error('Error fetching cart items:', itemsError.message);
    } else {
      setCartItems(items || []);
    }

    setLoading(false);
  }

  async function addToCart(productId, quantity) {
    if (!user) {
      throw new Error('You must be logged in to add items to cart');
    }

    let cartId = null;

    const { data: cartData, error: cartError } = await supabase
      .from('cart')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (cartError) {
      if (cartError.code === 'PGRST116') {
        const { data: newCart, error: createError } = await supabase
          .from('cart')
          .insert({ user_id: user.id })
          .select('id')
          .single();

        if (createError) throw createError;

        cartId = newCart.id;
      } else {
        throw cartError;
      }
    } else {
      cartId = cartData.id;
    }

    const { data: product, error: productError } = await supabase
      .from('products')
      .select('stock, is_active')
      .eq('id', productId)
      .single();

    if (productError) throw productError;
    if (!product.is_active) throw new Error('Product is not available');
    if (product.stock < quantity) throw new Error('Not enough stock available');

    const { data: existingItem, error: existingError } = await supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('cart_id', cartId)
      .eq('product_id', productId)
      .single();

    if (existingError && existingError.code !== 'PGRST116') {
      throw existingError;
    }

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      if (newQuantity > product.stock) {
        throw new Error('Not enough stock available');
      }

      const { error: updateError } = await supabase
        .from('cart_items')
        .update({ quantity: newQuantity })
        .eq('id', existingItem.id);

      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await supabase
        .from('cart_items')
        .insert({
          cart_id: cartId,
          product_id: productId,
          quantity,
        });

      if (insertError) throw insertError;
    }

    await fetchCart();
  }

  async function updateQuantity(itemId, newQuantity) {
    if (newQuantity < 1) return;

    const { error } = await supabase
      .from('cart_items')
      .update({ quantity: newQuantity })
      .eq('id', itemId);

    if (error) throw error;

    await fetchCart();
  }

  async function removeFromCart(itemId) {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', itemId);

    if (error) throw error;

    await fetchCart();
  }

  async function clearCart() {
    const { data: cartData } = await supabase
      .from('cart')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (cartData) {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('cart_id', cartData.id);

      if (error) throw error;
    }

    setCartItems([]);
  }

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cartItems.reduce(
    (sum, item) => sum + item.quantity * parseFloat(item.products?.price || 0),
    0
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        loading,
        totalItems,
        totalPrice,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        fetchCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}