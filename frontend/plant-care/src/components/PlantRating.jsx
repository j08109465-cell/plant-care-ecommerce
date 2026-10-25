import "../css/PlantRating.css";

const PlantRating = ({ rating = 4.5 }) => {
    const safeRating = Math.min(5, Math.max(0, Number(rating) || 0));

    return (
        <span className="plantRating" role="img" aria-label={`Rated ${safeRating.toFixed(1)} out of 5`}>
            <span className="plantRatingStars" aria-hidden="true">
                {Array.from({ length: 5 }, (_, index) => {
                    const fill = Math.min(100, Math.max(0, (safeRating - index) * 100));
                    return (
                        <span
                            className="plantRatingStar"
                            key={index}
                            style={{ "--star-fill": `${fill}%` }}
                        >
                            ★
                        </span>
                    );
                })}
            </span>
            <span className="plantRatingValue">{safeRating.toFixed(1)}</span>
        </span>
    );
};

export default PlantRating;
