import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../css/Wishlist.css";
import PlantRating from "../components/PlantRating";
import PlantLeafIcon from "../components/PlantLeafIcon";

const Wishlist = () => {
    const navigate = useNavigate();

    const [wishlist, setWishlist] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem("plantWishlist")) || [];
        } catch {
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem("plantWishlist", JSON.stringify(wishlist));
        window.dispatchEvent(new Event("wishlistUpdated"));
    }, [wishlist]);

    const removeFromWishlist = (name) => {
        setWishlist((previousWishlist) =>
            previousWishlist.filter((plant) => plant.name !== name)
        );
    };

    return (
        <div className="wishlistPage">
            <h1>My Wishlist ❤️</h1>
            <p>Your favourite plants, all in one place <PlantLeafIcon /></p>

            {wishlist.length === 0 ? (
                <div className="emptyWishlist">
                    <h2>Your wishlist is empty 🤍</h2>
                    <p>Save your favourite plants by clicking the heart icon.</p>

                    <button onClick={() => navigate("/products")}>
                        Explore Plants <PlantLeafIcon />
                    </button>
                </div>
            ) : (
                <div className="wishlistGrid">
                    {wishlist.map((plant) => (
                        <div className="wishlistCard" key={plant.name}>
                            <img src={plant.image} alt={plant.name} />

                            <h2>{plant.name}</h2>
                            <p>{plant.category}</p>
                            <PlantRating rating={plant.rating} />
                            <h3>₹{plant.price}</h3>

                            <div className="wishlistActions">
                                <button
                                    onClick={() =>
                                        navigate(
                                            `/product/${plant.id}`
                                        )
                                    }
                                >
                                    View Details
                                </button>

                                <button
                                    className="removeWishlistBtn"
                                    onClick={() => removeFromWishlist(plant.name)}
                                >
                                    🤍 Remove
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Wishlist;