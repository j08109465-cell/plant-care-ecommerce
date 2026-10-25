import { useEffect, useLayoutEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../css/Layout.css";

const Layout = () => {
    const location = useLocation();

    useLayoutEffect(() => {
        window.scrollTo({ top: 0, behavior: "auto" });
    }, [location.key]);

    useEffect(() => {
        const scrollToHeading = (event) => {
            if (!(event.target instanceof Element)) return;

            const heading = event.target.closest("h1, h2, h3, h4, h5, h6");
            if (!heading) return;

            const navbarBottom =
                document.querySelector(".mainNavbar")?.getBoundingClientRect().bottom || 0;
            const headingTop = heading.getBoundingClientRect().top;
            const reducedMotion = window.matchMedia(
                "(prefers-reduced-motion: reduce)"
            ).matches;

            window.scrollTo({
                top: Math.max(0, window.scrollY + headingTop - navbarBottom - 12),
                behavior: reducedMotion ? "auto" : "smooth",
            });
        };

        document.addEventListener("click", scrollToHeading);
        return () => document.removeEventListener("click", scrollToHeading);
    }, []);

    return (
        <>
            <Navbar />
            <main className="pageContent">
                <Outlet />
            </main>
            <Footer />
        </>
    );
};

export default Layout;