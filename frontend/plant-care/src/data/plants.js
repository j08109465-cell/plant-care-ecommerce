import peaceLily from "../assets/peace-lily.jpg";
import moneyPlant from "../assets/money-plant.jpg";
import monstera from "../assets/Monstera.jpg";
import officePlantsImage from "../assets/office img.jpg";
import lowLightPlantsImage from "../assets/low light img.jpg";
import hangingPlantsImage from "../assets/hanging img.jpg";
import miniCactus from "../assets/mini-cactus.jpg";
import rosePlant from "../assets/rose-plant.jpg";

const plants = [
  {
    id: "peace-lily",
    name: "Peace Lily",
    category: "Indoor Plant",
    categories: ["Indoor Plants", "Air Purifying Plants", "Low Light Plants"],
    price: 499,
    originalPrice: 599,
    rating: 4.8,
    reviewCount: 128,
    stock: 12,
    image: peaceLily,
    description:
      "A beautiful indoor plant that adds freshness and greenery to your home.",
  },
  {
    id: "money-plant",
    name: "Money Plant",
    category: "Easy Care Plant",
    categories: ["Indoor Plants", "Easy Care Plants", "Office Plants", "Low Light Plants", "Hanging Plants", "Air Purifying Plants"],
    price: 299,
    originalPrice: 399,
    rating: 4.7,
    reviewCount: 96,
    stock: 18,
    image: moneyPlant,
    description: "A lovely green plant that brings natural beauty to your home.",
  },
  {
    id: "mini-cactus",
    name: "Mini Cactus",
    category: "Succulent",
    detailCategory: "Succulent Plant",
    categories: ["Succulents", "Office Plants"],
    price: 249,
    originalPrice: 299,
    rating: 4.6,
    reviewCount: 74,
    stock: 15,
    image: miniCactus,
    description:
      "A cute, compact cactus that adds charm to desks and small spaces.",
  },
  {
    id: "rose-plant",
    name: "Rose Plant",
    category: "Flowering Plant",
    categories: ["Flowering Plants", "Outdoor Plants"],
    price: 399,
    originalPrice: 499,
    rating: 4.9,
    reviewCount: 143,
    stock: 4,
    image: rosePlant,
    description:
      "A beautiful flowering plant that adds colour and elegance to your garden.",
  },
  {
    id: "english-ivy",
    name: "English Ivy",
    category: "Air Purifying Plants",
    categories: ["Air Purifying Plants", "Office Plants", "Low Light Plants", "Hanging Plants"],
    price: 449,
    originalPrice: 549,
    rating: 4.8,
    reviewCount: 82,
    stock: 9,
    image: monstera,
    description: "A graceful trailing plant for shelves, offices, and softly lit corners.",
  },
  {
    id: "spider-plant",
    name: "Spider Plant",
    category: "Air Purifying Plants",
    categories: ["Air Purifying Plants", "Office Plants", "Low Light Plants", "Hanging Plants"],
    price: 399,
    originalPrice: 499,
    rating: 4.7,
    reviewCount: 67,
    stock: 11,
    image: officePlantsImage,
    description: "A cheerful leafy plant that looks lovely on a shelf or in a hanging planter.",
  },
  {
    id: "snake-plant",
    name: "Snake Plant",
    category: "Low Light Plants",
    categories: ["Low Light Plants", "Indoor Plants", "Office Plants"],
    price: 399,
    originalPrice: 499,
    rating: 4.8,
    reviewCount: 115,
    stock: 3,
    image: lowLightPlantsImage,
    description: "A resilient low-light plant for bedrooms, offices, and shaded corners.",
  },
  {
    id: "pothos",
    name: "Golden Pothos",
    category: "Hanging Plants",
    categories: ["Air Purifying Plants", "Office Plants", "Low Light Plants", "Hanging Plants"],
    price: 349,
    originalPrice: 449,
    rating: 4.9,
    reviewCount: 101,
    stock: 8,
    image: hangingPlantsImage,
    description: "A trailing, adaptable plant for shelves, desks, and hanging planters.",
  },
];

export default plants;
