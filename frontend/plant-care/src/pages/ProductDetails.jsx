import "../css/ProductDetails.css";
import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import PlantRating from "../components/PlantRating";
import { addPlantToCart } from "../utils/cart";
import usePlantCatalog from "../hooks/usePlantCatalog";
import PlantLeafIcon from "../components/PlantLeafIcon";

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { plants, error: catalogError } = usePlantCatalog();

  const [message, setMessage] = useState("");

  const plant = plants.find((item) => item.id === id);

  if (!plant) {
    return (
      <div className="productDetails">
        <h2>{catalogError || <>Plant not found <PlantLeafIcon /></>}</h2>
      </div>
    );
  }

  const addToCart = async () => {
    try {
      const result = await addPlantToCart(plant);
      setMessage(
        result.alreadyInCart
          ? "This plant is already in your cart!"
          : `${plant.name} added to cart successfully!`
      );
    } catch (error) {
      console.error("Unable to add plant to cart.", error);
      setMessage("We couldn't add this plant to your cart. Please try again.");
    }

    setTimeout(() => {
      setMessage("");
    }, 3000);
  };

  const buyNow = async () => {
    try {
      const result = await addPlantToCart(plant);
      navigate("/cart", {
        state: {
          cartMessage: result.alreadyInCart
            ? "This plant is already in your cart!"
            : `${plant.name} added to your cart.`,
        },
      });
    } catch (error) {
      console.error("Unable to add plant to cart.", error);
      setMessage("We couldn't add this plant to your cart. Please try again.");
    }
  };

  return (
    <div className="productDetails">
      <div className="detailImage">
        <img src={plant.image} alt={plant.name} />
      </div>

      <div className="detailContent">
        <p className="productCategory">{plant.detailCategory || plant.category}</p>

        <h1>{plant.name}</h1>

        <PlantRating rating={plant.rating} />

        <h2>₹{plant.price}</h2>

        <p>{plant.description}</p>

        <p>
          <PlantLeafIcon /> Easy to care for <br />
          💧 Simple watering needs <br />
          🏠 Perfect for your home
        </p>

        {message && (
          <div className="cartSuccessMessage" role="status">
            ✅ {message}
            <button
              type="button"
              onClick={() => navigate("/cart")}
            >
              View Cart
            </button>
          </div>
        )}

        <div className="productActions">
          <button type="button" onClick={addToCart}>
            Add to Cart 🛒
          </button>

          <button
            type="button"
            className="buyNowBtn"
            onClick={buyNow}
          >
            Buy Now ⚡
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;