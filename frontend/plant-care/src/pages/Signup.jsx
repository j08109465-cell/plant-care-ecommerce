import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/Signup.css";
import PlantLeafIcon from "../components/PlantLeafIcon";
import { registerUser } from "../utils/demoAuth";

const Signup = ({
  onClose,
  onSwitchLogin,
  isModal = false,
}) => {
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      navigate("/");
    }
  };

  return (
    <div
      className={isModal ? "signupPage signupOverlay" : "signupPage"}
      onClick={isModal ? handleClose : undefined}
    >
      <div
        className="signupBox"
        onClick={(e) => e.stopPropagation()}
      >
        <aside className="authArtwork signupArtwork" aria-hidden="true">
          <span className="authArtworkOrb" />
          <span className="authLeaf authLeafOne" />
          <span className="authLeaf authLeafTwo" />
          <span className="authLeaf authLeafThree" />
          <span className="authArtworkBadge">Good things take root</span>
          <div className="authArtworkCopy">
            <span className="authEyebrow">YOUR PLANT STORY STARTS HERE</span>
            <h2>Find your happy place among the leaves.</h2>
            <p>Join a community that makes caring for plants feel easy.</p>
          </div>
        </aside>

        <div className="signupFormPanel">
          {isModal && (
            <button
              type="button"
              className="signupCloseBtn"
              onClick={handleClose}
              aria-label="Close signup"
            >
              ✕
            </button>
          )}

          <h1>Create Account <PlantLeafIcon /></h1>
          <p className="authIntro">A greener home is just a few details away.</p>

          {errorMessage && <p className="authFormMessage authFormError" role="alert">{errorMessage}</p>}

          <form
            onSubmit={async (event) => {
              event.preventDefault();
              setErrorMessage("");
              setIsSubmitting(true);

              const formData = new FormData(event.currentTarget);
              const password = String(formData.get("password"));
              const confirmPassword = String(formData.get("confirmPassword"));
              if (password !== confirmPassword) {
                setErrorMessage("Passwords do not match.");
                setIsSubmitting(false);
                return;
              }

              try {
                await registerUser({
                  name: String(formData.get("name")).trim(),
                  email: String(formData.get("email")).trim(),
                  password,
                });
                onClose?.();
                navigate("/", { replace: true });
              } catch (error) {
                setErrorMessage(error.message || "Unable to create your account. Please try again.");
              } finally {
                setIsSubmitting(false);
              }
            }}
          >
            <div className="inputGroup">
              <label htmlFor="signup-name">Name</label>
              <input
                id="signup-name"
                name="name"
                type="text"
                placeholder="Your name"
                required
              />
            </div>

            <div className="inputGroup">
              <label htmlFor="signup-email">Email address</label>
              <input
                id="signup-email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="inputGroup">
              <label htmlFor="signup-password">Password</label>
              <input
                id="signup-password"
                name="password"
                type="password"
                placeholder="Create a password"
                required
                minLength={8}
                maxLength={128}
              />
            </div>

            <div className="inputGroup">
              <label htmlFor="signup-confirm-password">Confirm password</label>
              <input
                id="signup-confirm-password"
                name="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                required
                minLength={8}
                maxLength={128}
              />
            </div>

            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating account..." : "Create my account"} <span aria-hidden="true">→</span>
            </button>
          </form>

          <p className="loginText">
            Already have an account?{" "}
            <span
              onClick={() => {
                if (onSwitchLogin) {
                  onSwitchLogin();
                } else {
                  navigate("/login");
                }
              }}
            >
              Login
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;