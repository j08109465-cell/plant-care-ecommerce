import "../css/Categories.css";
import { useLocation, useNavigate } from "react-router-dom";
import categories from "../data/categories";
import PlantRating from "../components/PlantRating";
import usePlantCatalog from "../hooks/usePlantCatalog";
import PlantLeafIcon from "../components/PlantLeafIcon";

const Categories = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { plants, error: catalogError } = usePlantCatalog();
  const selectedCategory = new URLSearchParams(location.search).get("category");
  const plantsToShow = plants.filter((plant) =>
    plant.category === selectedCategory ||
    plant.categories?.includes(selectedCategory)
  );

  return (
    <div className="categoriesPage">
      <h1>Plant Categories <PlantLeafIcon /></h1>
      <p>Explore plants based on your needs</p>
      {catalogError && <p role="alert">{catalogError}</p>}

      {!selectedCategory ? (
        <div className="categoryList">
          {categories.map((category) => (
            <button
              className="categoryItem categoryItemButton"
              key={category.name}
              onClick={() =>
                navigate(`/categories?category=${encodeURIComponent(category.name)}`)
              }
              type="button"
            >
              <img src={category.image} alt="" />
              <h2>{category.name}</h2>
              <p>{category.description}</p>
            </button>
          ))}
        </div>
      ) : (
        <>
          <h2>{selectedCategory}</h2>

          <button onClick={() => navigate("/categories")} type="button">
            ← All Categories
          </button>

          <div className="categoryList">
            {plantsToShow.length > 0 ? (
              plantsToShow.map((plant) => (
                <article className="categoryItem" key={plant.id}>
                  <img src={plant.image} alt={plant.name} />
                  <h2>{plant.name}</h2>
                  <p>{plant.category}</p>
                  <PlantRating rating={plant.rating} />
                  <h3>₹{plant.price}</h3>
                  <button
                    onClick={() => navigate(`/product/${plant.id}`)}
                    type="button"
                  >
                    View Product
                  </button>
                </article>
              ))
            ) : (
              <p>No plants available in this category yet. <PlantLeafIcon /></p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Categories;
