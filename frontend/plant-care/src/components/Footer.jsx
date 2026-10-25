import "../css/Footer.css";
import { Link } from "react-router-dom";
import PlantLeafIcon from "./PlantLeafIcon";
import logo from "../assets/plantcare-logo-footer.png";

const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "auto" });
};

const Footer = () => {
    return (
        <footer className="plant-footer">
            <div className="footer-inner">
                <div className="footer-main">
                    <div className="footer-brand">
                        <Link className="footer-logo" to="/" onClick={scrollToTop}>
                            <img className="footer-logo-image" src={logo} alt="Plant Care" />
                        </Link>
                        <p>Make room for a little more green.</p>
                        <Link className="footer-shop-link" to="/products" onClick={scrollToTop}>
                            Find your next plant <span aria-hidden="true">↗</span>
                        </Link>
                    </div>

                    <nav className="footer-links" aria-label="Footer navigation">
                        <div className="footer-link-group">
                            <h3>Explore</h3>
                            <Link to="/" onClick={scrollToTop}>Home</Link>
                            <Link to="/about" onClick={scrollToTop}>About Us</Link>
                            <Link to="/categories" onClick={scrollToTop}>Categories</Link>
                            <Link to="/products" onClick={scrollToTop}>All plants</Link>
                        </div>
                        <div className="footer-link-group">
                            <h3>Your space</h3>
                            <Link to="/cart" onClick={scrollToTop}>Shopping cart</Link>
                            <Link to="/wishlist" onClick={scrollToTop}>Wishlist</Link>
                            <Link to="/login" onClick={scrollToTop}>Sign in</Link>
                        </div>
                    </nav>

                    <section className="footer-contact" aria-labelledby="footerContactTitle">
                        <h3 id="footerContactTitle">Contact Information</h3>
                        <p className="footer-contact-brand"><PlantLeafIcon /> <strong>Plant Care</strong></p>
                        <p>📧 Email: <span className="footer-email">info@plantcare.co.in</span></p>
                        <p>📞 Phone: <span className="footer-phone">+91-7656454890</span></p>
                        <p>🕐 Hours: Mon–Fri, 9 AM–6 PM IST</p>
                    </section>
                </div>

                <div className="footer-bottom">
                    <span>© {new Date().getFullYear()} Plant Care</span>
                    <span>Grown with care, for the home.</span>
                    <Link to="/products" onClick={scrollToTop}>Shop the collection <span aria-hidden="true">→</span></Link>
                </div>
            </div>
        </footer>
    );
};

export default Footer;