import { useEffect, useState } from "react";
import "../css/WishlistButton.css";

const readWishlist = () => {
  const savedWishlist = localStorage.getItem("plantWishlist");
  if (!savedWishlist) {
    return [];
  }

  try {
    const wishlist = JSON.parse(savedWishlist);
    if (Array.isArray(wishlist)) {
      return wishlist;
    }

    console.error("Saved wishlist must be an array.");
  } catch (error) {
    console.error("Unable to read the saved wishlist.", error);
  }

  return [];
};

const WishlistButton = ({ plant }) => {
  const [wishlist, setWishlist] = useState(readWishlist);
  const isWishlisted = wishlist.some(
    (item) => item.id === plant.id || item.name === plant.name
  );

  useEffect(() => {
    const updateWishlist = () => setWishlist(readWishlist());

    window.addEventListener("storage", updateWishlist);
    window.addEventListener("wishlistUpdated", updateWishlist);

    return () => {
      window.removeEventListener("storage", updateWishlist);
      window.removeEventListener("wishlistUpdated", updateWishlist);
    };
  }, []);

  const toggleWishlist = () => {
    const currentWishlist = readWishlist();
    const alreadyWishlisted = currentWishlist.some(
      (item) => item.id === plant.id || item.name === plant.name
    );
    const updatedWishlist = alreadyWishlisted
      ? currentWishlist.filter(
          (item) => item.id !== plant.id && item.name !== plant.name
        )
      : [...currentWishlist, plant];

    localStorage.setItem("plantWishlist", JSON.stringify(updatedWishlist));
    window.dispatchEvent(new Event("wishlistUpdated"));
  };

  return (
    <button
      className="wishlistHeartButton"
      type="button"
      aria-label={`${isWishlisted ? "Remove" : "Add"} ${plant.name} ${
        isWishlisted ? "from" : "to"
      } wishlist`}
      aria-pressed={isWishlisted}
      onClick={toggleWishlist}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M12 21s-8.4-5.4-8.4-11.2a4.6 4.6 0 0 1 8.4-2.6 4.6 4.6 0 0 1 8.4 2.6C20.4 15.6 12 21 12 21Z"
          fill={isWishlisted ? "currentColor" : "none"}
        />
      </svg>
    </button>
  );
};

export default WishlistButton;
