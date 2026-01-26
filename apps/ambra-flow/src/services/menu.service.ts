import { stockService, Product, UpdateProductDto } from './stock.service';

export const menuService = {
    getMenu: async () => {
        // In the future, this could fetch specific daily menus.
        // For now, it fetches all products and letting the UI filter by 'isAvailable'.
        return await stockService.getAll();
    },

    toggleAvailability: async (product: Product) => {
        const updateData: UpdateProductDto = {
            isAvailable: !product.isAvailable,
            version: product.version
        };
        return await stockService.update(product.id, updateData);
    }
};
