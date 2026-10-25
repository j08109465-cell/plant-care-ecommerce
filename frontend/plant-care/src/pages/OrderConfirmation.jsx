import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "../css/Checkout.css";
import { apiRequest } from "../utils/api";

const OrderConfirmation = ({ order: confirmationOrder }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const reference = new URLSearchParams(location.search).get("reference");
  const sessionId = new URLSearchParams(location.search).get("session_id");
  const [order, setOrder] = useState(
    sessionId ? null : confirmationOrder || location.state?.order || null
  );
  const [orderError, setOrderError] = useState("");
  const [isLoading, setIsLoading] = useState(Boolean(sessionId) || (!order && Boolean(reference)));

  useEffect(() => {
    if (sessionId && order) return;
    if (sessionId) {
      apiRequest("/checkout/complete", {
        method: "POST",
        body: JSON.stringify({ sessionId }),
      })
        .then(({ order: savedOrder }) => {
          setOrder(savedOrder);
          window.dispatchEvent(new Event("cartUpdated"));
        })
        .catch((error) => {
          console.error("Unable to verify the PlantCare payment.", error);
          setOrderError(error.message || "We couldn't verify your payment yet.");
        })
        .finally(() => setIsLoading(false));
      return;
    }
    if (order || !reference) return;
    apiRequest(`/orders/${encodeURIComponent(reference)}`)
      .then(({ order: savedOrder }) => setOrder(savedOrder))
      .catch((error) => {
        console.error("Unable to load the PlantCare order.", error);
      })
      .finally(() => setIsLoading(false));
  }, [order, reference, sessionId]);

  if (isLoading) {
    return <div className="checkoutPage"><p role="status">Loading your order...</p></div>;
  }

  if (!order && sessionId && orderError) {
    return (
      <div className="checkoutPage">
        <section className="checkoutBox" role="alert">
          <h1>Payment Not Yet Confirmed</h1>
          <p>{orderError}</p>
          <button type="button" onClick={() => window.location.reload()}>
            Retry payment verification
          </button>
        </section>
      </div>
    );
  }

  if (!order || !Array.isArray(order.items) || !order.reference) {
    return <Navigate to="/cart" replace />;
  }

  const confirmationContent = (
    <section className="checkoutBox orderConfirmation" aria-labelledby="order-confirmed-title">
      <div className="orderConfirmationMark" aria-hidden="true">✓</div>
      <p className="orderConfirmationEyebrow">YOUR PLANTS ARE ON THEIR WAY</p>
      <h1 id="order-confirmed-title">Order Confirmed Successfully!</h1>
      <p className="orderThankYou">
        Thank you, {order.name}! We appreciate your order and can’t wait for your plants to reach you.
      </p>

      <div className="orderReference">
        <span>Order reference</span>
        <strong>{order.reference}</strong>
      </div>

      <div className="confirmedDelivery">
        <h2>Delivery details</h2>
        <p>{order.name}</p>
        <p>{order.address}</p>
        <p>{order.city}, {order.state} {order.pincode}</p>
        <p>Phone: {order.phone}</p>
      </div>

      <div className="confirmedOrderSummary">
        <h2>Order summary</h2>
        {order.items.map((item, index) => (
          <div className="confirmedOrderItem" key={item.id ?? `${item.name}-${index}`}>
            <span>{item.name} × {Number(item.quantity) || 1}</span>
            <strong>₹{(Number(item.price) || 0) * (Number(item.quantity) || 1)}</strong>
          </div>
        ))}
        <div className="confirmedOrderItem">
          <span>Delivery</span>
          <strong>₹{Number(order.delivery) || 0}</strong>
        </div>
        <div className="confirmedOrderTotal">
          <span>Order total</span>
          <strong>₹{Number(order.total) || 0}</strong>
        </div>
      </div>

      <button
        className="backToHomeButton"
        type="button"
        onClick={() => navigate("/products")}
      >
        Continue Shopping
      </button>
    </section>
  );

  return (
    <div className="checkoutPage">
      {confirmationContent}
    </div>
  );
};

export default OrderConfirmation;
