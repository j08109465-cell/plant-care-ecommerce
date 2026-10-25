import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { loginUser } from "../utils/demoAuth";
import "../css/Login.css";
import PlantLeafIcon from "../components/PlantLeafIcon";

const Login = ({
  onClose,
  onSwitchSignup,
  isModal = false,
  notice = "",
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = location.state?.from?.pathname || "/products";
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const loginNotice = notice || location.state?.notice || "";

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      navigate("/");
    }
  };

  return (
    <div
      className={isModal ? "loginPage loginOverlay" : "loginPage"}
      onClick={isModal ? handleClose : undefined}
    >
      <div
        className="loginBox"
        onClick={(e) => e.stopPropagation()}
      >
        <aside className="authArtwork loginArtwork" aria-hidden="true">
          <span className="authArtworkOrb" />
          <span className="authLeaf authLeafOne" />
          <span className="authLeaf authLeafTwo" />
          <span className="authLeaf authLeafThree" />
          <span className="authArtworkBadge">A little more green, every day</span>
          <div className="authArtworkCopy">
            <span className="authEyebrow">GROW WITH US</span>
            <h2>Make room for a little more green.</h2>
            <p>Thoughtful plants and care for a home that feels alive.</p>
          </div>
        </aside>

        <div className="loginFormPanel">
          {isModal && (
            <button
              type="button"
              className="loginCloseBtn"
              onClick={handleClose}
              aria-label="Close login"
            >
              ✕
            </button>
          )}

          <h1>Welcome Back <PlantLeafIcon /></h1>
          <p className="authIntro">Your leafy corner of the world is waiting.</p>

          {loginNotice && <p className="authFormMessage authFormNotice" role="status">{loginNotice}</p>}
          {errorMessage && <p className="authFormMessage authFormError" role="alert">{errorMessage}</p>}

          <form
            onSubmit={async (event) => {
              event.preventDefault();
              setErrorMessage("");
              setIsSubmitting(true);

              const formData = new FormData(event.currentTarget);
              try {
                await loginUser({
                  email: String(formData.get("email")).trim(),
                  password: String(formData.get("password")),
                });
                onClose?.();
                navigate(returnTo, { replace: true });
              } catch (error) {
                setErrorMessage(error.message || "Unable to sign in right now. Please try again.");
              } finally {
                setIsSubmitting(false);
              }
            }}
          >
            <div className="inputGroup">
              <label htmlFor="login-email">Email address</label>
              <input
                id="login-email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="inputGroup">
              <label htmlFor="login-password">Password</label>
              <input
                id="login-password"
                name="password"
                type="password"
                placeholder="Enter your password"
                required
              />
            </div>

            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Logging in..." : "Login to your account"} <span aria-hidden="true">→</span>
            </button>
          </form>

          <p className="signupText">
            Don&apos;t have an account?{" "}
            <span
              onClick={() => {
                if (onSwitchSignup) {
                  onSwitchSignup();
                } else {
                  navigate("/signup");
                }
              }}
            >
              Signup
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;