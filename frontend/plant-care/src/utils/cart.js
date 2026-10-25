import { apiRequest } from "./api";
import plants from "../data/plants";

const catalogImages = new Map(plants.map((plant) => [plant.id, plant.image]));

export const normalizePlantCart = (items) => {
  if (!Array.isArray(items)) {
    return [];
  }

  const itemsById = new Map();
  const itemsByName = new Map();
  const itemsWithoutIdentity = [];

  items.forEach((item) => {
    if (!item || typeof item !== "object") {
      return;
    }

    const quantity = Number(item.quantity);
    const normalizedItem = {
      ...item,
      quantity: Number.isInteger(quantity) && quantity > 0 ? quantity : 1,
    };

    const itemsByKey = item.id != null
      ? itemsById
      : typeof item.name === "string" && item.name.trim()
        ? itemsByName
        : null;
    const key = item.id != null ? item.id : item.name?.trim().toLowerCase();

    if (!itemsByKey) {
      itemsWithoutIdentity.push(normalizedItem);
      return;
    }

    const existingItem = itemsByKey.get(key);
    if (existingItem) {
      existingItem.quantity += normalizedItem.quantity;
    } else {
      itemsByKey.set(key, normalizedItem);
    }
  });

  return [...itemsById.values(), ...itemsByName.values(), ...itemsWithoutIdentity];
};

export const isSamePlant = (first, second) => {
  if (second.id != null) {
    return first.id === second.id;
  }

  return (
    first.id == null &&
    typeof second.name === "string" &&
    first.name?.trim().toLowerCase() === second.name.trim().toLowerCase()
  );
};

const notifyCartUpdated = () => window.dispatchEvent(new Event("cartUpdated"));

export const getPlantCart = async () => {
  const { items } = await apiRequest("/cart");
  return normalizePlantCart(items).map((item) => ({
    ...item,
    image: item.image || catalogImages.get(item.id) || "",
  }));
};

export const addPlantToCart = async (plant, quantity = 1) => {
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new Error("Plant quantity must be a positive whole number.");
  }

  const result = await apiRequest("/cart/items", {
    method: "POST",
    body: JSON.stringify({ productId: plant.id, quantity }),
  });
  notifyCartUpdated();
  return { cart: normalizePlantCart(result.items), alreadyInCart: result.alreadyInCart };
};

export const setPlantCartQuantity = async (plant, quantity) => {
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new Error("Plant quantity must be a positive whole number.");
  }

  const { items } = await apiRequest(`/cart/items/${encodeURIComponent(plant.id)}`, {
    method: "PUT",
    body: JSON.stringify({ quantity }),
  });
  notifyCartUpdated();
  return normalizePlantCart(items);
};

export const updatePlantCartQuantity = async (plant, quantity) => {
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new Error("Plant quantity must be a positive whole number.");
  }

  const cart = await getPlantCart();
  if (!cart.some((item) => isSamePlant(item, plant))) return false;
  await setPlantCartQuantity(plant, quantity);
  return true;
};

export const removePlantFromCart = async (plant) => {
  await apiRequest(`/cart/items/${encodeURIComponent(plant.id)}`, { method: "DELETE" });
  notifyCartUpdated();
  return getPlantCart();
};
