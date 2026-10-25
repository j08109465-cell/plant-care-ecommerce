import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Layout from "./layouts/Layout";


import Home from "./pages/Home";
import About from "./pages/About";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Categories from "./pages/Categories";
import Products from "./pages/Products";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import MyOrders from "./pages/MyOrders";
import Wishlist from "./pages/Wishlist";



function App() {

  const router = createBrowserRouter([
    {
      path: "/",
      element: <Layout />,
      children: [
        {
          index: true,
          element: <Home />
        },
        {
          path: "about",
          element: <About />
        },
        {
          path: "login",
          element: <Login />
        },
        {
          path: "signup",
          element: <Signup />
        },
        {
          path: "categories",
          element: <Categories />
        },
        {
          path: "products",
          element: <Products />
        },
        {
          path: "product/:id",
          element: <ProductDetails />
        },
        {
          path: "cart",
          element: <Cart />
        },
        {
          path: "checkout",
          element: <Checkout />
        },
        {
          path: "order-confirmation",
          element: <OrderConfirmation />
        },
        {
          path: "wishlist",
          element: <Wishlist />,
        },
        {
          path: "my-orders",
          element: <MyOrders />,
        }
      ]
    }
  ]);

  return <RouterProvider router={router} />;
}

export default App;