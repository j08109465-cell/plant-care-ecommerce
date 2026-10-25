
import { useEffect, useLayoutEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import "../css/Checkout.css";
import PlantLeafIcon from "../components/PlantLeafIcon";
import { getPlantCart } from "../utils/cart";
import { apiRequest } from "../utils/api";
import { getCurrentUser } from "../utils/demoAuth";

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [pincode, setPincode] = useState("");
  const [payment, setPayment] = useState("COD");
  const [orderError, setOrderError] = useState("");
  const [cart, setCart] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionStatus, setSessionStatus] = useState("checking");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    getCurrentUser()
      .then((user) => {
        if (isMounted) setSessionStatus(user ? "authenticated" : "unauthenticated");
      })
      .catch((error) => {
        if (!isMounted) return;
        console.error("Unable to verify the customer session for checkout.", error);
        setOrderError(error.message || "Unable to verify your login. Please try again.");
        setSessionStatus("error");
      });

    getPlantCart()
      .then(setCart)
      .catch((error) => {
        if (!isMounted) return;
        console.error("Unable to load the cart for checkout.", error);
        setOrderError(error.message || "Your cart could not be loaded.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const subtotal = cart.reduce(
    (total, item) =>
      total + (Number(item.price) || 0) * (Number(item.quantity) || 1),
    0
  );

  const delivery = subtotal === 0 ? 0 : 50;
  const total = subtotal + delivery;

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (sessionStatus !== "authenticated") {
      navigate("/login", { replace: true, state: { from: { pathname: "/checkout" } } });
      return;
    }

    if (
      !name.trim() ||
      !address.trim() ||
      !phone.trim() ||
      !city.trim() ||
      !stateName.trim() ||
      !pincode.trim() ||
      !payment
    ) {
      setOrderError("Please fill in all delivery and payment details.");
      return;
    }

    if (!/^\d{10}$/.test(phone.trim())) {
      setOrderError("Please enter a valid 10-digit phone number.");
      return;
    }

    if (!/^\d{6}$/.test(pincode.trim())) {
      setOrderError("Please enter a valid 6-digit pincode.");
      return;
    }

    if (cart.length === 0) {
      navigate("/cart");
      return;
    }

    try {
      setIsSubmitting(true);
      const checkoutDetails = {
        name,
        address,
        phone,
        city,
        state: stateName,
        pincode,
        payment,
      };

      if (payment === "COD") {
        const { order } = await apiRequest("/checkout", {
          method: "POST",
          body: JSON.stringify(checkoutDetails),
        });
        window.dispatchEvent(new Event("cartUpdated"));
        navigate(`/order-confirmation?reference=${encodeURIComponent(order.reference)}`, {
          replace: true,
          state: { order },
        });
        return;
      }

      if (payment !== "Card") {
        throw new Error("Please select a valid payment method.");
      }

      const { url } = await apiRequest("/checkout/session", {
        method: "POST",
        body: JSON.stringify(checkoutDetails),
      });
      if (typeof url !== "string" || !url) {
        throw new Error("The secure payment page could not be opened. Please try again.");
      }
      window.location.assign(url);
    } catch (error) {
      console.error("Unable to start checkout for the PlantCare order.", error);
      setOrderError(error.message || "We couldn't start checkout. Please try again.");
      setIsSubmitting(false);
    }
  };

  if (sessionStatus === "checking" || isLoading) {
    return <div className="checkoutPage"><p role="status">Loading checkout...</p></div>;
  }

  if (sessionStatus === "unauthenticated") {
    return <Navigate to="/login" replace state={{ from: { pathname: "/checkout" } }} />;
  }

  if (sessionStatus === "error") {
    return (
      <div className="checkoutPage">
        <p className="checkoutError" role="alert">{orderError}</p>
      </div>
    );
  }

  if (cart.length === 0) {
    return <Navigate to="/cart" replace />;
  }

  return (
    <div className="checkoutPage">
      <div className="checkoutBox">
        <h1>Checkout 💳</h1>
        <p>Complete your order</p>

        {orderError && (
          <p className="checkoutError" role="alert">
            {orderError}
          </p>
        )}
        {new URLSearchParams(location.search).get("payment") === "cancelled" && (
          <p className="checkoutError" role="status">
            Payment was cancelled. Your cart is unchanged and you can try again.
          </p>
        )}

        <form onSubmit={handlePlaceOrder}>
          <div className="inputGroup">
            <label htmlFor="checkout-name">Full Name</label>
            <input
              id="checkout-name"
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setOrderError("");
              }}
              required
            />
          </div>

          <div className="inputGroup">
            <label htmlFor="checkout-phone">Phone Number</label>
            <input
              id="checkout-phone"
              type="tel"
              placeholder="Enter 10-digit phone number"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setOrderError("");
              }}
              inputMode="numeric"
              pattern="[0-9]{10}"
              maxLength={10}
              required
            />
          </div>

          <div className="inputGroup">
            <label htmlFor="checkout-address">Delivery Address</label>
            <textarea
              id="checkout-address"
              placeholder="Enter your delivery address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
          </div>

          <div className="inputGroup">
            <label htmlFor="checkout-city">City</label>
            <input
              id="checkout-city"
              type="text"
              placeholder="Enter your city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
            />
          </div>

          <div className="inputGroup">
            <label htmlFor="checkout-state">State</label>
            <input
              id="checkout-state"
              type="text"
              placeholder="Enter your state"
              value={stateName}
              onChange={(e) => setStateName(e.target.value)}
              required
            />
          </div>

          <div className="inputGroup">
            <label htmlFor="checkout-pincode">Pincode</label>
            <input
              id="checkout-pincode"
              type="text"
              placeholder="Enter 6-digit pincode"
              value={pincode}
              onChange={(e) => {
                setPincode(e.target.value);
                setOrderError("");
              }}
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              required
            />
          </div>

          <div className="paymentMethod">
            <h3>Payment Method</h3>

            <label>
              <input
                type="radio"
                name="payment"
                value="COD"
                checked={payment === "COD"}
                onChange={(e) => setPayment(e.target.value)}
                disabled={isSubmitting}
              />
              Cash on Delivery
            </label>

            <label>
              <input
                type="radio"
                name="payment"
                value="Card"
                checked={payment === "Card"}
                onChange={(e) => setPayment(e.target.value)}
                disabled={isSubmitting}
              />
              Card
            </label>
          </div>

          <div className="orderTotal">
            <span>Subtotal + Delivery</span>
            <strong>₹{total}</strong>
          </div>

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? payment === "COD" ? "Placing your order..." : "Redirecting to secure checkout..."
              : "Place Order"} <PlantLeafIcon />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Checkout;
