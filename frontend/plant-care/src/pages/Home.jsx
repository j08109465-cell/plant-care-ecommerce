import "../css/Home.css";
import "../css/Products.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PlantLeafIcon from "../components/PlantLeafIcon";
import indoorPlants from "../assets/indoor-plants.jpg";
import wateringPlant from "../assets/carousel img.jpg";
import logo from "../assets/plantcare-logo.png";
import deliveryIcon from "../assets/delivery-icon.jpg";
import easyCareIcon from "../assets/easy-care-icon.png";
import categories from "../data/categories";

const heroSlides = [
  {
    eyebrow: "A greener, happier home starts here",
    heading: "Bring Nature",
    emphasis: "Home",
    description:
      "Thoughtfully chosen plants to soften your space, lift your mood, and help your home bloom.",
    image: indoorPlants,
    imageAlt: "Lush green indoor plant displayed in a bright home",
  },
  {
    eyebrow: "Find a plant that feels like you",
    heading: "Grow Your",
    emphasis: "Happy Place",
    description:
      "From easy-care favourites to statement greenery, find the perfect plant for every corner.",
    image: wateringPlant,
    imageAlt: "A hand watering a plant in a bright home setting",
  },
];

const Home = () => {
  const navigate = useNavigate();
  const [activeHeroSlide, setActiveHeroSlide] = useState(0);
  const [isHeroPaused, setIsHeroPaused] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  useEffect(() => {
    if (isHeroPaused || isScrolling) {
      return undefined;
    }

    const slideTimer = window.setInterval(() => {
      setActiveHeroSlide((currentSlide) => (currentSlide + 1) % heroSlides.length);
    }, 6500);

    return () => window.clearInterval(slideTimer);
  }, [isHeroPaused, isScrolling]);

  useEffect(() => {
    let scrollEndTimer;
    const pauseCarouselWhileScrolling = () => {
      setIsScrolling(true);
      window.clearTimeout(scrollEndTimer);
      scrollEndTimer = window.setTimeout(() => setIsScrolling(false), 1200);
    };

    window.addEventListener("scroll", pauseCarouselWhileScrolling, { passive: true });

    return () => {
      window.clearTimeout(scrollEndTimer);
      window.removeEventListener("scroll", pauseCarouselWhileScrolling);
    };
  }, []);

  const showHeroSlide = (slideIndex) => {
    setActiveHeroSlide((slideIndex + heroSlides.length) % heroSlides.length);
  };

  return (
    <div className="home">
      {/* Hero Section */}
      <section
        className="hero"
        aria-label="Featured plants"
        aria-roledescription="carousel"
        onMouseEnter={() => setIsHeroPaused(true)}
        onMouseLeave={(event) => {
          if (!event.currentTarget.contains(event.currentTarget.ownerDocument.activeElement)) {
            setIsHeroPaused(false);
          }
        }}
        onFocusCapture={() => setIsHeroPaused(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            setIsHeroPaused(false);
          }
        }}
      >
        <div className="heroCarousel">
          <div
            className="heroTrack"
            style={{ transform: `translateX(-${activeHeroSlide * 100}%)` }}
          >
            {heroSlides.map((slide, index) => (
              <article
                className={`heroSlide${index === 0 ? " heroSlide--poster" : ""}`}
                key={slide.eyebrow}
                aria-roledescription="slide"
                aria-label={`${index + 1} of ${heroSlides.length}`}
                aria-hidden={index !== activeHeroSlide}
                inert={index !== activeHeroSlide}
              >
                <div className="heroContent">
                  <p className="heroSmallText">{slide.eyebrow}</p>
                  <h1>
                    {slide.heading}
                    <br />
                    <span>{slide.emphasis}</span>
                  </h1>
                  <p className="heroDescription">{slide.description}</p>
                  <button type="button" onClick={() => navigate("/products")}>
                    Shop Now <span aria-hidden="true">→</span>
                  </button>
                </div>
                <div className="heroImage">
                  <img src={slide.image} alt={slide.imageAlt} />
                </div>
              </article>
            ))}
          </div>
          <div className="heroControls" role="group" aria-label="Carousel controls">
            <button
              className="heroArrow"
              type="button"
              aria-label="Previous slide"
              onClick={() => showHeroSlide(activeHeroSlide - 1)}
            >
              ←
            </button>
            <div className="heroDots" role="group" aria-label="Choose a slide">
              {heroSlides.map((slide, index) => (
                <button
                  className={`heroDot${index === activeHeroSlide ? " isActive" : ""}`}
                  type="button"
                  key={slide.eyebrow}
                  aria-label={`Show slide ${index + 1}`}
                  aria-current={index === activeHeroSlide ? "true" : undefined}
                  onClick={() => showHeroSlide(index)}
                />
              ))}
            </div>
            <button
              className="heroArrow"
              type="button"
              aria-label="Next slide"
              onClick={() => showHeroSlide(activeHeroSlide + 1)}
            >
              →
            </button>
          </div>
        </div>
      </section>
      {/* Categories Section */}
      <section className="categories">
        <h2>Explore Our Categories</h2>
        <p>Find the perfect plants for your space</p>

        <div className="categoryCards">
          {categories.map((category) => (
            <div className="categoryCard" key={category.name}>
              <img src={category.image} alt={category.name} />
              <h3>{category.name}</h3>
              <p>{category.description}</p>
              <button
                onClick={() =>
                  navigate(`/categories?category=${encodeURIComponent(category.name)}`)
                }
              >
                Explore →
              </button>
            </div>
          ))}
        </div>
        <button
          className="homeViewAllButton"
          type="button"
          onClick={() => navigate("/products")}
        >
          View All
        </button>
      </section>
      {/* Why Choose PlantCare Section */}
      <section className="whyPlantCare">
        <h2>Why Choose PlantCare?</h2>
        <p>Everything you need for a greener home</p>

        <div className="whyCards">

          <div className="whyCard">
            <img
              className="whyIcon"
              src={logo}
              alt="PlantCare"
            />
            <h3>Healthy Plants</h3>
            <p>Fresh and carefully selected plants.</p>
          </div>

          <div className="whyCard">
            <img
              className="whyIcon"
              src={deliveryIcon}
              alt="Fast Delivery"
            />
            <h3>Fast Delivery</h3>
            <p>Get your favourite plants delivered safely.</p>
          </div>

          <div className="whyCard">
            <img
              className="whyIcon"
              src={easyCareIcon}
              alt="Easy Care"
            />
            <h3>Easy Care</h3>
            <p>Simple plants suitable for every home.</p>
          </div>

        </div>
      </section>


      <section className="homeCTA">
        <h2>Start Your Green Journey <PlantLeafIcon /></h2>

        <p>
          Bring beautiful plants into your home and make every space feel fresh.
        </p>

        <button type="button" onClick={() => navigate("/products")}>
          Shop Plants
        </button>
      </section>


    </div>
  );
};

export default Home;
