import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import "../css/Navbar.css";
import logo from "../assets/plantcare-logo.png";
import Login from "../pages/Login";
import Signup from "../pages/Signup";
import { getPlantCart } from "../utils/cart";
import usePlantCatalog from "../hooks/usePlantCatalog";
import { endDemoSession, getCurrentUser } from "../utils/demoAuth";

const Navbar = () => {
    const [showLogin, setShowLogin] = useState(false);
    const [showSignup, setShowSignup] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const navigate = useNavigate();
    const [search, setSearch] = useState("");
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
    const [cartCount, setCartCount] = useState(0);
    const { plants } = usePlantCatalog();
    const [wishlistCount, setWishlistCount] = useState(0);
    const [loginMessage, setLoginMessage] = useState("");
    const [authNotice, setAuthNotice] = useState("");
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const navbarRef = useRef(null);
    const searchRef = useRef(null);
    const suggestionsRef = useRef(null);

    useEffect(() => {
        const updateAuthentication = async () => {
            try {
                setIsLoggedIn(Boolean(await getCurrentUser()));
            } catch (error) {
                console.error("Unable to verify the PlantCare authentication session.", error);
                setIsLoggedIn(false);
            }
        };

        updateAuthentication();
        window.addEventListener("authChanged", updateAuthentication);
        window.addEventListener("storage", updateAuthentication);

        return () => {
            window.removeEventListener("authChanged", updateAuthentication);
            window.removeEventListener("storage", updateAuthentication);
        };
    }, []);

    useEffect(() => {
        let messageTimer;
        const showLoginSuccess = () => {
            setLoginMessage("Login Successful!");
            window.clearTimeout(messageTimer);
            messageTimer = window.setTimeout(() => setLoginMessage(""), 3500);
        };

        window.addEventListener("loginSuccessful", showLoginSuccess);
        return () => {
            window.clearTimeout(messageTimer);
            window.removeEventListener("loginSuccessful", showLoginSuccess);
        };
    }, []);

    const matchingPlants = plants.filter((plant) =>
        `${plant.name} ${plant.categories?.join(" ") || ""}`
            .toLowerCase()
            .includes(search.trim().toLowerCase())
    );

    const handleSearch = (event) => {
        event.preventDefault();
        if (search.trim()) {
            setShowSuggestions(false);
            navigate(`/products?search=${encodeURIComponent(search.trim())}`);
        }
    };

    const handleSuggestionSelect = (plant) => {
        setSearch(plant.name);
        setShowSuggestions(false);
        navigate(`/product/${plant.id}`);
    };

    useEffect(() => {
        const closeSuggestions = (event) => {
            if (
                !searchRef.current?.contains(event.target) &&
                !suggestionsRef.current?.contains(event.target)
            ) {
                setShowSuggestions(false);
                setActiveSuggestionIndex(-1);
            }
        };

        document.addEventListener("pointerdown", closeSuggestions);
        return () => document.removeEventListener("pointerdown", closeSuggestions);
    }, []);

    useEffect(() => {
        if (!showLogin && !showSignup) return undefined;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [showLogin, showSignup]);

    useLayoutEffect(() => {
        if (!showSuggestions || !search.trim() || !searchRef.current) return undefined;

        const updateSuggestionPosition = () => {
            const suggestionsElement = suggestionsRef.current;
            if (!suggestionsElement) return;

            const searchBounds = searchRef.current.getBoundingClientRect();
            const width = Math.min(searchBounds.width, window.innerWidth - 24);
            const left = Math.max(
                12,
                Math.min(searchBounds.left, window.innerWidth - width - 12)
            );

            suggestionsElement.style.left = `${left}px`;
            suggestionsElement.style.top = `${searchBounds.bottom + 8}px`;
            suggestionsElement.style.width = `${width}px`;
        };

        updateSuggestionPosition();
        window.addEventListener("resize", updateSuggestionPosition);
        const navbarElement = navbarRef.current;
        navbarElement?.addEventListener("scroll", updateSuggestionPosition);

        return () => {
            window.removeEventListener("resize", updateSuggestionPosition);
            navbarElement?.removeEventListener("scroll", updateSuggestionPosition);
        };
    }, [showSuggestions, search]);

    const handleSearchKeyDown = (event) => {
        if (event.key === "Escape") {
            setShowSuggestions(false);
            setActiveSuggestionIndex(-1);
        } else if (event.key === "ArrowDown" && matchingPlants.length > 0) {
            event.preventDefault();
            setShowSuggestions(true);
            setActiveSuggestionIndex((index) => (index + 1) % matchingPlants.length);
        } else if (event.key === "ArrowUp" && matchingPlants.length > 0) {
            event.preventDefault();
            setShowSuggestions(true);
            setActiveSuggestionIndex((index) =>
                index <= 0 ? matchingPlants.length - 1 : index - 1
            );
        } else if (
            event.key === "Enter" &&
            activeSuggestionIndex >= 0 &&
            matchingPlants[activeSuggestionIndex]
        ) {
            event.preventDefault();
            handleSuggestionSelect(matchingPlants[activeSuggestionIndex]);
        }
    };

    useEffect(() => {
        const updateCartCount = async () => {
            try {
                const cart = await getPlantCart();
                setCartCount(cart.length);
            } catch (error) {
                console.error("Unable to update the PlantCare cart count.", error);
                setCartCount(0);
            }
        };

        updateCartCount();

        window.addEventListener("storage", updateCartCount);
        window.addEventListener("cartUpdated", updateCartCount);

        return () => {
            window.removeEventListener("storage", updateCartCount);
            window.removeEventListener("cartUpdated", updateCartCount);
        };
    }, []);

    useEffect(() => {
        const updateWishlistCount = () => {
            try {
                const savedWishlist =
                    JSON.parse(localStorage.getItem("plantWishlist")) || [];
                const wishlist = Array.isArray(savedWishlist) ? savedWishlist : [];

                setWishlistCount(wishlist.length);
            } catch {
                setWishlistCount(0);
            }
        };

        updateWishlistCount();

        window.addEventListener("storage", updateWishlistCount);
        window.addEventListener("wishlistUpdated", updateWishlistCount);

        return () => {
            window.removeEventListener("storage", updateWishlistCount);
            window.removeEventListener("wishlistUpdated", updateWishlistCount);
        };
    }, []);

    return (
        <nav className="mainNavbar" aria-label="Main navigation">
            <div className="navbarTop" ref={navbarRef}>
                <Link className="navbarLogo" to="/" aria-label="Plant Care home">
                    <img src={logo} alt="PlantCare Logo" />
                </Link>

                <div className="navbarLinks">
                    <Link to="/">Home</Link>
                    <Link to="/about">About Us</Link>
                    <Link to="/categories">Categories</Link>
                    <Link to="/products">Plants</Link>
                    {isLoggedIn && <Link to="/my-orders">My Orders</Link>}
                </div>

                <form
                    className="navbarSearch"
                    role="search"
                    onSubmit={handleSearch}
                    onKeyDown={handleSearchKeyDown}
                    ref={searchRef}
                >
                    <div className="navbarSearchField">
                        <input
                            type="text"
                            placeholder="Search plants..."
                            aria-label="Search plants"
                            aria-autocomplete="list"
                            aria-expanded={showSuggestions && search.trim().length > 0}
                            aria-controls="plant-search-suggestions"
                            aria-activedescendant={
                                activeSuggestionIndex >= 0
                                    ? `plant-suggestion-${matchingPlants[activeSuggestionIndex]?.id}`
                                    : undefined
                            }
                            value={search}
                            onFocus={() => setShowSuggestions(true)}
                            onChange={(event) => {
                                setSearch(event.target.value);
                                setShowSuggestions(true);
                                setActiveSuggestionIndex(-1);
                            }}
                        />
                        <button type="submit" aria-label="Search">
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                                <circle cx="10.8" cy="10.8" r="6.8" />
                                <path d="m16 16 4.2 4.2" />
                            </svg>
                        </button>
                    </div>
                </form>
                {showSuggestions && search.trim() &&
                    createPortal(
                        <div
                            className="searchSuggestions"
                            id="plant-search-suggestions"
                            role="listbox"
                            aria-label="Plant search suggestions"
                            ref={suggestionsRef}
                        >
                            {matchingPlants.length ? (
                                matchingPlants.map((plant, index) => (
                                    <button
                                        className={`searchSuggestion${index === activeSuggestionIndex ? " isActive" : ""}`}
                                        id={`plant-suggestion-${plant.id}`}
                                        key={plant.id}
                                        type="button"
                                        role="option"
                                        aria-selected={index === activeSuggestionIndex}
                                        onMouseEnter={() => setActiveSuggestionIndex(index)}
                                        onClick={() => handleSuggestionSelect(plant)}
                                    >
                                        <img src={plant.image} alt="" />
                                        <span>{plant.name}</span>
                                    </button>
                                ))
                            ) : (
                                <p className="noSearchSuggestions" role="status">
                                    No matching plants found
                                </p>
                            )}
                        </div>,
                        document.body
                    )}

                <Link
                    to="/wishlist"
                    className="wishlistNavIcon"
                    aria-label={`Wishlist${wishlistCount > 0 ? ` (${wishlistCount} items)` : ""}`}
                >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 21s-8.4-5.4-8.4-11.2a4.6 4.6 0 0 1 8.4-2.6 4.6 4.6 0 0 1 8.4 2.6C20.4 15.6 12 21 12 21Z" />
                    </svg>
                    {wishlistCount > 0 && (
                        <span className="wishlistBadge">{wishlistCount}</span>
                    )}
                </Link>

                <Link className="cartNavLink" to="/cart" aria-label={`Cart, ${cartCount} items`}>
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M3 4h2l2.2 11.1a2 2 0 0 0 2 1.6h8.9a2 2 0 0 0 1.9-1.4L22 8H6" />
                        <circle cx="10" cy="20" r="1.3" />
                        <circle cx="18" cy="20" r="1.3" />
                    </svg>
                    <span className="cartCount">{cartCount}</span>
                </Link>

                <div className="authButtons">
                    {isLoggedIn && (
                        <>
                            <button
                                type="button"
                                className="logoutBtn"
                                disabled={isLoggingOut}
                                onClick={async () => {
                                    setIsLoggingOut(true);
                                    setAuthNotice("");
                                    let logoutNotice = "";
                                    try {
                                        await endDemoSession();
                                    } catch (error) {
                                        console.error("Unable to end the PlantCare authentication session.", error);
                                        logoutNotice = "Unable to log out from the server. Please try again.";
                                    } finally {
                                        setIsLoggedIn(false);
                                        setIsLoggingOut(false);
                                        setShowLogin(false);
                                        setShowSignup(false);
                                        setAuthNotice(logoutNotice);
                                        navigate("/login", {
                                            replace: true,
                                            state: logoutNotice
                                                ? { notice: logoutNotice }
                                                : undefined,
                                        });
                                    }
                                }}
                            >
                                {isLoggingOut ? "Logging out..." : "Logout"}
                            </button>
                        </>
                    )}

                    {!isLoggedIn && (
                        <>
                            <button
                                type="button"
                                className="signupBtn"
                                onClick={() => {
                                    setShowSignup(true);
                                    setShowLogin(false);
                                }}
                            >
                                Sign Up
                            </button>

                            <button
                                type="button"
                                className="loginBtn"
                                onClick={() => {
                                    setShowLogin(true);
                                    setShowSignup(false);
                                }}
                            >
                                Login
                            </button>
                        </>
                    )}
                </div>
            </div>
            {loginMessage && (
                <div className="loginSuccessToast" role="status">
                    {loginMessage}
                </div>
            )}
            {showLogin && (
                <Login
                    isModal={true}
                    notice={authNotice}
                    onClose={() => setShowLogin(false)}
                    onSwitchSignup={() => {
                        setShowLogin(false);
                        setShowSignup(true);
                    }}
                />
            )}

            {showSignup && (
                <Signup
                    isModal={true}
                    onClose={() => setShowSignup(false)}
                    onSwitchLogin={(notice) => {
                        setAuthNotice(notice || "");
                        setShowSignup(false);
                        setShowLogin(true);
                    }}
                />
            )}
        </nav>
    );
};

export default Navbar;