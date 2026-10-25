import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { apiRequest } from "../utils/api";
import { getCurrentUser } from "../utils/demoAuth";
import "../css/MyOrders.css";

const ORDER_STATUSES = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];

const formatCurrency = (amount) => `₹${Number(amount || 0).toLocaleString("en-IN")}`;

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const MyOrders = () => {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadOrders = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (!isMounted) return;

        setUser(currentUser);
        if (!currentUser) {
          setOrders([]);
          setIsLoading(false);
          return;
        }

        const { orders: userOrders } = await apiRequest("/orders/me");
        if (!isMounted) return;

        setOrders(userOrders || []);
        setError("");
      } catch (loadError) {
        if (!isMounted) return;
        console.error("Unable to load the customer orders.", loadError);
        setError(loadError.message || "Your orders could not be loaded right now.");
        setOrders([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadOrders();
    return () => {
      isMounted = false;
    };
  }, []);

  if (user === null && !isLoading) {
    return <Navigate to="/login" replace state={{ from: { pathname: "/my-orders" } }} />;
  }

  return (
    <div className="myOrdersPage">
      <header className="myOrdersHeader">
        <p className="myOrdersEyebrow">Order History</p>
        <h1>
          My Orders <span className="myOrdersTitleIcon" aria-hidden="true">📦</span>
        </h1>
      </header>

      {isLoading ? (
        <div className="myOrdersState" role="status">
          <p>Loading your orders...</p>
        </div>
      ) : error ? (
        <div className="myOrdersState myOrdersError" role="alert">
          <p>{error}</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="myOrdersState myOrdersEmpty">
          <h2>No orders yet</h2>
          <p>Your order history will appear here once you place a purchase.</p>
        </div>
      ) : (
        <div className="myOrdersTableWrap">
          <table className="myOrdersTable">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Order Date</th>
                <th>Product Name</th>
                <th>Quantity</th>
                <th>Total Amount</th>
                <th>Payment Method</th>
                <th>Order Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const productNames = (order.items || [])
                  .map((item) => item.name)
                  .filter(Boolean)
                  .join(", ");
                const quantity = (order.items || []).reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
                const status = ORDER_STATUSES.includes(order.status) ? order.status : "Pending";

                return (
                  <tr key={order.reference}>
                    <td>{order.reference}</td>
                    <td>{formatDate(order.date || order.createdAt)}</td>
                    <td>{productNames || "—"}</td>
                    <td>{quantity}</td>
                    <td>{formatCurrency(order.total)}</td>
                    <td>{order.payment || "—"}</td>
                    <td>
                      <span className={`orderStatusBadge status-${status.toLowerCase().replace(/\s+/g, "-")}`}>
                        {status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MyOrders;
