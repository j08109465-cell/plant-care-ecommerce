import { useState, useEffect, useLayoutEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getPlantCart, removePlantFromCart, updatePlantCartQuantity } from "../utils/cart";
import "../css/Cart.css";
import PlantLeafIcon from "../components/PlantLeafIcon";

const Cart = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  const [cart, setCart] = useState([]);
  const [showContinue, setShowContinue] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [cartError, setCartError] = useState("");

  useEffect(() => {
    getPlantCart()
      .then(setCart)
      .catch((error) => {
        console.error("Unable to load the PlantCare cart.", error);
        setCartError(error.message || "Your cart could not be loaded.");
      })
      .finally(() => setIsLoading(false));
  }, []);

  const updateQuantity = async (plant, change) => {
    try {
      if (plant.quantity + change < 1) {
        setCart(await removePlantFromCart(plant));
      } else {
        await updatePlantCartQuantity(plant, plant.quantity + change);
        setCart(await getPlantCart());
      }
      setCartError("");
    } catch (error) {
      console.error("Unable to update the PlantCare cart.", error);
      setCartError(error.message || "The cart could not be updated. Please try again.");
    }
  };

  const removePlant = async (plant) => {
    try {
      setCart(await removePlantFromCart(plant));
      setCartError("");
    } catch (error) {
      console.error("Unable to remove a plant from the cart.", error);
      setCartError(error.message || "The plant could not be removed. Please try again.");
    }
  };

  const subtotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const delivery = subtotal === 0 ? 0 : 50;
  const total = subtotal + delivery;

  const proceedToBuy = () => setShowContinue(true);

  return (
    <div className="cartPage">
      <h1>
        Your Cart
        <svg className="cartTitleIcon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 4h2l2.2 11.1a2 2 0 0 0 2 1.6h8.9a2 2 0 0 0 1.9-1.4L22 8H6" />
          <circle cx="10" cy="20" r="1.3" />
          <circle cx="18" cy="20" r="1.3" />
        </svg>
      </h1>
      <p>Review your selected plants</p>
      {cartError && <p className="cartNotice" role="alert">{cartError}</p>}

      {location.state?.cartMessage && (
        <p className="cartNotice" role="status">
          {location.state.cartMessage}
        </p>
      )}

      {isLoading ? (
        <p role="status">Loading your cart...</p>
      ) : cart.length === 0 ? (
        <div className="emptyCart">
          <h2>Your cart is empty <PlantLeafIcon /></h2>
          <p>Add some beautiful plants to get started!</p>

          <button onClick={() => navigate("/products")}>
            Explore Plants <PlantLeafIcon />
          </button>
        </div>
      ) : (
        <div className="cartContent">
          <div className="cartItems">
            {cart.map((item, index) => (
              <div className="cartItem" key={item.id ?? item.name ?? index}>
                <div className="cartImage">
                  <img src={item.image} alt={item.name} />
                </div>

                <div className="cartInfo">
                  <h2>{item.name}</h2>
                  <p>{item.category}</p>
                  <h3>₹{item.price}</h3>
                </div>

                <button
                  className="removeBtn"
                  onClick={() => removePlant(item)}
                >
                  🗑️ Remove
                </button>

                <div className="quantity" aria-label={`${item.name} quantity`}>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item, -1)}
                    aria-label={`Decrease ${item.name} quantity`}
                  >
                    −
                  </button>

                  <span aria-live="polite">{item.quantity}</span>

                  <button
                    type="button"
                    onClick={() => updateQuantity(item, 1)}
                    aria-label={`Increase ${item.name} quantity`}
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="cartSummary">
            <h2>Cart Summary</h2>

            <p>Subtotal: ₹{subtotal}</p>
            <p>Delivery: ₹{delivery}</p>

            <h3>Total: ₹{total}</h3>

            {!showContinue ? (
              <button type="button" onClick={proceedToBuy}>
                Proceed to Buy 💳
              </button>
            ) : (
              <div className="cartCheckoutContinue">
                <p role="status">Continue to checkout?</p>
                <button type="button" onClick={() => navigate("/checkout")}>
                  Continue
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;