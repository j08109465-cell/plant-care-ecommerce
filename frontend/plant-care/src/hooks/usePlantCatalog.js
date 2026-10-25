import { useEffect, useState } from "react";
import plants from "../data/plants";
import { apiRequest } from "../utils/api";

const loadCatalog = async (preserveLocalCatalog) => {
  try {
    const { products } = await apiRequest("/products");
    const localPlants = new Map(plants.map((plant) => [plant.id, plant]));
    const catalogProducts = products.map((product) => {
      const localPlant = localPlants.get(product.id);
      return {
        ...localPlant,
        ...product,
        categories: product.categories?.length
          ? product.categories
          : preserveLocalCatalog && localPlant?.categories?.length
            ? localPlant.categories
            : [product.category],
        rating:
          product.rating ??
          (preserveLocalCatalog ? localPlant?.rating : undefined) ??
          0,
        reviewCount:
          product.reviewCount ??
          (preserveLocalCatalog ? localPlant?.reviewCount : undefined) ??
          0,
        originalPrice:
          product.originalPrice ??
          (preserveLocalCatalog ? localPlant?.originalPrice : undefined) ??
          product.price,
        stock:
          product.stock ??
          (preserveLocalCatalog ? localPlant?.stock : undefined) ??
          20,
        image: product.image || localPlant?.image || "",
      };
    });

    let catalogPlants = catalogProducts;
    if (preserveLocalCatalog) {
      const productsById = new Map(
        catalogProducts.map((product) => [product.id, product])
      );
      catalogPlants = [
        ...plants.map((plant) => productsById.get(plant.id) || plant),
        ...catalogProducts.filter((product) => !localPlants.has(product.id)),
      ];
    }
    return { plants: catalogPlants, error: "" };
  } catch (error) {
    console.error("Unable to load the PlantCare catalog.", error);
    return {
      plants: preserveLocalCatalog ? plants : [],
      error: preserveLocalCatalog
        ? "Live plant data is unavailable. Showing the saved plant catalog."
        : "Plants could not be loaded. Please check your connection and try again.",
    };
  }
};

const usePlantCatalog = ({ preserveLocalCatalog = false } = {}) => {
  const [catalog, setCatalog] = useState({ plants, error: "" });

  useEffect(() => {
    let active = true;
    loadCatalog(preserveLocalCatalog).then((result) => {
      if (active) setCatalog(result);
    });
    return () => {
      active = false;
    };
  }, [preserveLocalCatalog]);

  return catalog;
};

export default usePlantCatalog;
