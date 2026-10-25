import logoDesign from "../assets/logo-design-transparent.png";

const PlantLeafIcon = ({ className = "" }) => (
  <img
    className={`plantLeafIcon ${className}`.trim()}
    src={logoDesign}
    alt=""
    aria-hidden="true"
  />
);

export default PlantLeafIcon;
