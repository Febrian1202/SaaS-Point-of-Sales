/**
 * Cart state management using Svelte 5 Runes.
 */
class CartState {
    items = $state<any[]>([]);
    totalItems = $derived(this.items.length);
    totalPrice = $derived(this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0));

    addItem(product: any) {
        this.items.push(product);
    }

    removeItem(productId: string) {
        this.items = this.items.filter(item => item.id !== productId);
    }

    clear() {
        this.items = [];
    }
}

export const cart = new CartState();
