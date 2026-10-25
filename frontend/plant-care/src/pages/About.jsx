import { Link } from "react-router-dom";
import "../css/About.css";
import logoDesign from "../assets/logo-design-transparent.png";
import PlantLeafIcon from "../components/PlantLeafIcon";

const About = () => {
  return (
    <div className="about">
      <section className="aboutHero">
        <div className="aboutHeroContent">
          <span className="aboutTag">
            <PlantLeafIcon className="aboutLeafIcon--tag" />
            WELCOME TO PLANTCARE
          </span>

          <h1>
            Bringing Nature
            <br />
            Closer to <span>Your Home</span>
          </h1>

          <p>
            Discover beautiful plants that brighten your space,
            refresh your surroundings, and bring everyday happiness.
          </p>

          <Link to="/products" className="aboutShopBtn">
            Explore Our Plants →
          </Link>
        </div>

        <div className="aboutHeroImage">
          <img
            src="https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=900&q=85"
            alt="Beautiful green plants in pots"
          />
        </div>
      </section>

      <section className="aboutStory">
        <div className="aboutStoryImage">
          <img
            src="https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=800&q=85"
            alt="Gardening and caring for plants"
          />
        </div>

        <div className="aboutStoryContent">
          <span className="aboutTag">OUR PLANTS</span>

          <h2>
            Plants for everyday living
            <PlantLeafIcon className="aboutLeafIcon--heading" />
          </h2>

          <p>
            PlantCare is a welcoming place for people who want to bring more
            nature into their homes, whether they are choosing their very
            first plant or growing a collection they have loved for years.
          </p>

          <p>
            Explore leafy indoor favourites, colourful flowering plants, and
            easy-care succulents. We make it easier to find a plant that suits
            your light, your routine, and the way you want your space to feel.
          </p>

          <p>
            We believe even a small green corner can make a home feel calmer
            and more personal. Every new leaf is a little reminder to slow
            down, care for something, and enjoy the growth along the way.
          </p>
        </div>
      </section>

      <section className="aboutMission">
        <span className="aboutTag">WHAT WE BELIEVE</span>

        <h2>
          Our Mission
          <PlantLeafIcon className="aboutLeafIcon--heading" />
        </h2>

        <p>
          Our mission is to make plant shopping simple, enjoyable,
          and accessible while inspiring more people to welcome nature
          into their everyday lives.
        </p>
        <p>
          We want every plant to feel like an invitation, not an intimidating
          project. Start with one that fits your space, learn as you go, and
          let your confidence grow alongside it.
        </p>
      </section>

      <section className="aboutCare">
        <div className="aboutCareIntro">
          <span className="aboutTag">A GOOD PLACE TO GROW</span>
          <h2>Find your plant rhythm.</h2>
          <p>
            Plant care does not need to be complicated. A little attention to
            your space and a routine that works for you can help greenery
            thrive in its new home.
          </p>
        </div>

        <div className="aboutCareGrid">
          <article className="aboutCareCard">
            <span><PlantLeafIcon className="aboutLeafIcon--care" /></span>
            <div>
              <h3>Match your light</h3>
              <p>Notice the bright and shady corners of your home, then choose greenery that feels at home there.</p>
            </div>
          </article>

          <article className="aboutCareCard">
            <span><PlantLeafIcon className="aboutLeafIcon--care" /></span>
            <div>
              <h3>Keep it simple</h3>
              <p>Build an easy watering routine around your week and check the soil before reaching for the watering can.</p>
            </div>
          </article>

          <article className="aboutCareCard">
            <span><PlantLeafIcon className="aboutLeafIcon--care" /></span>
            <div>
              <h3>Enjoy the small wins</h3>
              <p>New leaves, stronger roots, and a greener shelf all count. Growing is a journey, not a race.</p>
            </div>
          </article>
        </div>
      </section>

      <section className="aboutBenefits">
        <div className="aboutSectionHeading">
          <span className="aboutTag">THE PLANTCARE DIFFERENCE</span>
          <h2>Why Choose PlantCare?</h2>
          <p>A little more green, a little more happiness.</p>
        </div>

        <div className="aboutBenefitGrid">
          <div className="aboutBenefitCard">
            <span>
              <img
                className="aboutBenefitImage"
                src={logoDesign}
                alt=""
                aria-hidden="true"
              />
            </span>
            <h3>Beautiful Varieties</h3>
            <p>Explore different plants for your home and garden.</p>
          </div>

          <div className="aboutBenefitCard">
            <span>
              <img
                className="aboutBenefitImage aboutBenefitImage--greenLiving"
                src={logoDesign}
                alt=""
                aria-hidden="true"
              />
            </span>
            <h3>Green Living</h3>
            <p>Bring natural beauty and greenery into your space.</p>
          </div>

          <div className="aboutBenefitCard">
            <span>🛍️</span>
            <h3>Easy Shopping</h3>
            <p>Discover your favourite plants in one convenient place.</p>
          </div>

          <div className="aboutBenefitCard">
            <span>💚</span>
            <h3>Made for Plant Lovers</h3>
            <p>A welcoming place for everyone who loves plants.</p>
          </div>
        </div>
      </section>

      <section className="aboutCTA">
        <h2>Ready to Grow Something Beautiful?</h2>
        <p>Find a plant that makes your space feel like home.</p>

        <Link to="/products" className="aboutShopBtn">
          Find Your Perfect Plant →
        </Link>
      </section>
    </div>
  );
};

export default About;