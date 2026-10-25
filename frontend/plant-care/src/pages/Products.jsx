import "../css/Products.css";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PlantRating from "../components/PlantRating";
import PlantLeafIcon from "../components/PlantLeafIcon";
import WishlistButton from "../components/WishlistButton";
import { addPlantToCart } from "../utils/cart";
import usePlantCatalog from "../hooks/usePlantCatalog";

const Products = () => {
  const productsPageRef = useRef(null);
  const productsGridRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { plants, error: catalogError } = usePlantCatalog({
    preserveLocalCatalog: true,
  });
  const maxPriceLimit = Math.ceil(Math.max(...plants.map((plant) => plant.price)) / 100) * 100;
  const searchFromUrl =
    new URLSearchParams(location.search).get("search")?.trim() || "";
  const [searchState, setSearchState] = useState(() => ({
    locationSearch: location.search,
    value: searchFromUrl,
  }));
  const searchText =
    searchState.locationSearch === location.search
      ? searchState.value
      : searchFromUrl;
  const [selectedCategory, setSelectedCategory] = useState("");
  const [minimumPrice, setMinimumPrice] = useState(0);
  const [maximumPrice, setMaximumPrice] = useState(null);
  const activeMaximumPrice = maximumPrice ?? Math.max(maxPriceLimit, minimumPrice);
  const priceSliderLimit = Math.max(maxPriceLimit, minimumPrice, activeMaximumPrice);
  const [minimumRating, setMinimumRating] = useState(null);
  const [sortOrder, setSortOrder] = useState("featured");
  const [cartMessage, setCartMessage] = useState("");
  const [cartToast, setCartToast] = useState("");
  const cartToastTimeoutRef = useRef(null);

  useEffect(() => {
    if (minimumRating !== 4.5) return;

    const productsGrid = productsGridRef.current;
    if (!productsGrid) return;

    const { top, bottom } = productsGrid.getBoundingClientRect();
    if (top >= 0 && top < window.innerHeight && bottom > 0) return;

    productsGrid.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [minimumRating]);

  useEffect(
    () => () => {
      clearTimeout(cartToastTimeoutRef.current);
    },
    []
  );

  useLayoutEffect(() => {
    const navbar = document.querySelector(".mainNavbar");
    const productsPage = productsPageRef.current;
    if (!navbar || !productsPage) return undefined;

    const updateStickyOffset = () => {
      productsPage.style.setProperty(
        "--products-sticky-top",
        `${navbar.getBoundingClientRect().height}px`
      );
    };

    updateStickyOffset();
    const observer = new ResizeObserver(updateStickyOffset);
    observer.observe(navbar);
    return () => observer.disconnect();
  }, []);

  const plantCategories = useMemo(
    () =>
      [...new Set(plants.flatMap((plant) => [plant.category, ...(plant.categories || [])]))]
        .filter(Boolean)
        .sort((first, second) => first.localeCompare(second)),
    [plants]
  );

  const filteredPlants = useMemo(() => {
    const search = searchText.trim().toLowerCase();

    const matches = plants.filter((plant) => {
      const matchesSearch =
        !search ||
        `${plant.name} ${plant.category} ${plant.categories?.join(" ") || ""}`
          .toLowerCase()
          .includes(search);
      const matchesCategory =
        !selectedCategory ||
        plant.category === selectedCategory ||
        plant.categories?.includes(selectedCategory);
      const rating = Number(plant.rating);
      const matchesRating =
        minimumRating === null ||
        (Number.isFinite(rating) && rating >= minimumRating);

      return (
        matchesSearch &&
        matchesCategory &&
        plant.price >= minimumPrice &&
        plant.price <= activeMaximumPrice &&
        matchesRating
      );
    });

    if (sortOrder === "price-low-high") {
      return matches.sort((first, second) => first.price - second.price);
    }
    if (sortOrder === "price-high-low") {
      return matches.sort((first, second) => second.price - first.price);
    }
    if (sortOrder === "rating-high-low") {
      return matches.sort((first, second) => second.rating - first.rating);
    }

    return matches;
  }, [
    activeMaximumPrice,
    minimumPrice,
    minimumRating,
    plants,
    searchText,
    selectedCategory,
    sortOrder,
  ]);

  const clearFilters = () => {
    setSearchState({ locationSearch: location.search, value: "" });
    setSelectedCategory("");
    setMinimumPrice(0);
    setMaximumPrice(null);
    setMinimumRating(null);
    setSortOrder("featured");
  };

  const addToCart = async (plant, shouldNavigate = false) => {
    try {
      const result = await addPlantToCart(plant);
      if (shouldNavigate) {
        const message = result.alreadyInCart
          ? "This plant is already in your cart!"
          : `${plant.name} added to your cart.`;
        navigate("/cart", { state: { cartMessage: message } });
        return;
      }
      setCartMessage("");
      setCartToast(`${plant.name} added to cart successfully!`);
      clearTimeout(cartToastTimeoutRef.current);
      cartToastTimeoutRef.current = setTimeout(() => setCartToast(""), 3000);
    } catch (error) {
      console.error("Unable to add plant to cart.", error);
      setCartMessage("We couldn't add this plant to your cart. Please try again.");
    }
  };

  return (
    <div className="productsPage" ref={productsPageRef}>
      {cartToast && (
        <p className="productsToast" role="status" aria-live="polite">
          {cartToast}
        </p>
      )}
      <header className="productsHeader">
        <p className="productsEyebrow">GROW SOMETHING GOOD</p>
        <h1>
          Our Plants <PlantLeafIcon className="productsHeadingLeaf" />
        </h1>
      </header>

      <div className="productsLayout">
        <aside className="productsFilters" aria-label="Filter plants">
          <div className="productsFilterHeading">
            <h2>Filters</h2>
            <button
              className="clearProductsFilters"
              type="button"
              onClick={clearFilters}
            >
              Reset Filters
            </button>
          </div>

          <label>
            <span>Search</span>
            <input
              type="search"
              value={searchText}
              onChange={(event) =>
                setSearchState({
                  locationSearch: location.search,
                  value: event.target.value,
                })
              }
              placeholder="Search plants..."
            />
          </label>

          <label>
            <span>Sort by</span>
            <select
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value)}
            >
              <option value="featured">Featured</option>
              <option value="price-low-high">Price: low to high</option>
              <option value="price-high-low">Price: high to low</option>
              <option value="rating-high-low">Highest rated</option>
            </select>
          </label>

          <label>
            <span>Category</span>
            <select
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
            >
              <option value="">All categories</option>
              {plantCategories.map((category) => (
                <option value={category} key={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>

          <fieldset className="productsPriceRange">
            <legend>Price range</legend>
            <div className="productsPriceValues" aria-live="polite">
              <span>₹{minimumPrice}</span>
              <span>₹{activeMaximumPrice}</span>
            </div>
            <label>
              <span className="visuallyHidden">Minimum price</span>
              <input
                type="range"
                min="0"
                max={activeMaximumPrice}
                step="10"
                value={minimumPrice}
                onChange={(event) => setMinimumPrice(Number(event.target.value))}
                aria-label="Minimum price"
              />
            </label>
            <label>
              <span className="visuallyHidden">Maximum price</span>
              <input
                type="range"
                min={minimumPrice}
                max={priceSliderLimit}
                step="10"
                value={activeMaximumPrice}
                onChange={(event) => setMaximumPrice(Number(event.target.value))}
                aria-label="Maximum price"
              />
            </label>
          </fieldset>

          <fieldset className="productsRatingFilter">
            <legend>Minimum rating</legend>
            <div className="ratingFilterOptions">
              {[
                { label: "Any", value: null },
                { label: "4.5+", value: 4.5 },
              ].map((option) => (
                <button
                  className={
                    minimumRating === option.value ? "active" : ""
                  }
                  type="button"
                  key={option.label}
                  aria-pressed={minimumRating === option.value}
                  onClick={() => setMinimumRating(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>
        </aside>

        <div className="productsResults">
          <p className="productsResultCount" role="status">
            {filteredPlants.length} {filteredPlants.length === 1 ? "plant" : "plants"} found
          </p>
          {catalogError && <p className="productsCartMessage" role="alert">{catalogError}</p>}
          {cartMessage && (
            <p className="productsCartMessage" role="status">
              {cartMessage}
            </p>
          )}
          <div className="productsGrid" ref={productsGridRef}>
            {filteredPlants.length > 0 ? (
              filteredPlants.map((plant) => (
                <div className="productItem" key={plant.id}>
                  <div className="productImage">
                    <img
                      src={plant.image}
                      alt={plant.name}
                      className={[
                        plant.name === "Rose Plant"
                          ? "roseImage"
                          : plant.name === "Mini Cactus"
                            ? "cactusImage"
                            : "",
                        plant.ownerEmail ? "userAddedProductImage" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    />
                    <WishlistButton plant={plant} />
                    <span className="plantCategoryBadge">{plant.category}</span>
                  </div>

                  <div className="productCardContent">
                    <button
                      className="productName"
                      type="button"
                      onClick={() => navigate(`/product/${plant.id}`)}
                    >
                      {plant.name}
                    </button>

                    <div className="productReview">
                      <PlantRating rating={plant.rating} />
                      <span>({plant.reviewCount} reviews)</span>
                    </div>

                    <div className="productPrice">
                      <h3>₹{plant.price}</h3>
                      <span className="productOriginalPrice">
                          ₹{plant.originalPrice}
                      </span>
                      <span className="productDiscount">
                          {Math.round(
                            ((plant.originalPrice - plant.price) /
                              plant.originalPrice) *
                              100
                          )}
                          % off
                      </span>
                    </div>

                    <p
                      className={`productStock ${
                          plant.stock <= 5 ? "lowStock" : ""
                      }`}
                    >
                      {plant.stock > 5
                          ? "In stock"
                          : plant.stock > 0
                            ? `Only ${plant.stock} left`
                            : "Out of stock"}
                    </p>

                    <div className="productCardActions">
                      <button
                          className="addToCartButton"
                          type="button"
                          disabled={plant.stock === 0}
                          onClick={() => addToCart(plant)}
                      >
                          Add to Cart
                      </button>
                      <button
                          className="buyNowButton"
                          type="button"
                          disabled={plant.stock === 0}
                          onClick={() => addToCart(plant, true)}
                      >
                          Buy Now
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="noProductsFound" role="status">
                No plants match these filters. Try changing your search.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Products;