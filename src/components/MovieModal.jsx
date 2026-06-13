import { useEffect, useState } from "react";

function MovieModal({ movieId, apiKey, onClose }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      const url = `https://api.themoviedb.org/3/movie/${movieId}?api_key=${apiKey}&language=en-US`;
      try {
        const res = await fetch(url);
        const data = await res.json();
        setDetails(data);
      } catch (err) {
        console.error("Error fetching details:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [movieId, apiKey]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>

        {loading ? (
          <p className="empty-state">Loading...</p>
        ) : details ? (
          <div className="modal-content">
            {details.poster_path ? (
              <img
                className="modal-poster"
                src={`https://image.tmdb.org/t/p/w400${details.poster_path}`}
                alt={details.title}
              />
            ) : (
              <div className="movie-poster-fallback" style={{ width: "200px" }}>No image</div>
            )}
            <div className="modal-info">
              <h2>{details.title}</h2>
              {details.tagline && <p className="modal-tagline">{details.tagline}</p>}
              <div className="modal-meta">
                <span>⭐ {details.vote_average?.toFixed(1)}</span>
                <span>{details.release_date}</span>
                <span>{details.runtime} min</span>
              </div>
              <div className="modal-genres">
                {details.genres?.map((g) => (
                  <span key={g.id} className="genre-pill">{g.name}</span>
                ))}
              </div>
              <p className="modal-overview">{details.overview}</p>
            </div>
          </div>
        ) : (
          <p className="empty-state">Could not load details.</p>
        )}
      </div>
    </div>
  );
}

export default MovieModal;