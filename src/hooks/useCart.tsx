import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product, Stock } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    const { data: productStockData } = await api.get<Stock>(
      `/stock/${productId}`
    );

    if (!productStockData.amount) {
      toast("Quantidade solicitada fora de estoque");
      return;
    }

    try {
      // Decreases the product amount in stock by one
      const updatedProductStockData = productStockData;
      updatedProductStockData.amount -= 1;

      await api.post(`/stock/${productId}`, updatedProductStockData);

      // Add product to cart, increasing the amount if it already exists there.
      const { data: product } = await api.get<Product>(`products/${productId}`);

      const productIndex = cart.findIndex(
        (product) => product.id === productId
      );

      if (productIndex) {
        const updatedProduct = cart[productIndex];
        updatedProduct.amount += 1;

        const updatedCart = cart;
        updatedCart[productIndex] = updatedProduct;

        setCart(updatedCart);
        localStorage.setItem("@Rocketshoes:cart", JSON.stringify(updatedCart));
      } else {
        setCart([...cart, product]);
      }
    } catch {
      toast("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      // TODO
    } catch {
      // TODO
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      // TODO
    } catch {
      // TODO
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
