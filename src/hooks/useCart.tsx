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
    try {
      const updatedCart = [...cart];
      const productExists = updatedCart.find(
        (product) => product.id === productId
      );

      const stock = await api.get(`/stock/${productId}`);
      const productStockExists = await api.get(`/products/${productId}`);

      const stockAmount = stock.data.amount;
      const currentAmount = productExists ? productExists.amount : 0;
      const amount = currentAmount + 1;

      if (amount > stockAmount) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      if (productExists) {
        productExists.amount = amount;
      } else {
        const product = await api.get(`/products/${productId}`);

        const newProduct = {
          ...product.data,
          amount: 1,
        };

        updatedCart.push(newProduct);
      }

      setCart(updatedCart);
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(updatedCart));
    } catch {
      toast("Erro na adição do produto");
    }
  };

  const removeProduct = async (productId: number) => {
    try {
      const product = cart.find((product) => product.id === productId);

      if (!product) {
        throw Error();
      }

      // Update Product Stock Data
      const { data: productStockData } = await api.get<Stock>(
        `/stock/${productId}`
      );

      const updatedProductStockData = productStockData;
      product && (updatedProductStockData.amount += product?.amount);

      // Remove product from cart
      const updatedCart = cart.filter((product) => product.id !== productId);
      setCart(updatedCart);

      api.post(`/stock/${productId}`, updatedProductStockData);
    } catch {
      toast.error("Erro na remoção do produto");
    }
    localStorage.setItem("@Rocketshoes:cart", JSON.stringify(cart));
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) {
        return;
      }

      // Update Product Stock Data
      const { data: productStockData } = await api.get<Stock>(
        `/stock/${productId}`
      );

      const updatedProductStockData = productStockData;

      if (amount > productStockData.amount) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      const updatedCart = [...cart];

      const productIndex = cart.findIndex(
        (product) => product.id === productId
      );

      if (!!productIndex) {
        updatedCart[productIndex].amount = amount;
        setCart(updatedCart);
        localStorage.setItem("@Rocketshoes:cart", JSON.stringify(cart));
      } else {
        throw Error();
      }

      updatedProductStockData.amount = amount;

      api.post(`/stock/${productId}`, updatedProductStockData);

      setCart(updatedCart);
    } catch {
      toast.error("Erro na alteração de quantidade do produto");
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
