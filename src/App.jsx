import { useEffect, useState } from "react";

function App() {
  const [movies, setMovies] = useState([]);

  useEffect(() => {
    const fetchMovies = async () => {
      const apiKey = import.meta.env.VITE_TMDB_API_KEY;
      const url = `https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&language=en-US&page=1`;

      try {
        const response = await fetch(url);
        const data = await response.json();
        setMovies(data.results);
      } catch (err) {
        console.error("Error fetching movies:", err);
      }
    };

    fetchMovies();
  }, []);

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>🎬 Movie Watchlist</h1>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          gap: "16px",
          marginTop: "20px",
        }}
      >
        {movies.map((movie) => (
          <div key={movie.id} style={{ textAlign: "center" }}>
            {movie.poster_path ? (
              <img
                src={`https://image.tmdb.org/t/p/w300${movie.poster_path}`}
                alt={movie.title}
                style={{ width: "100%", borderRadius: "8px" }}
              />
            ) : (
              <div style={{ height: "240px", background: "#ddd", borderRadius: "8px" }} />
            )}
            <p style={{ fontSize: "14px", fontWeight: "600", margin: "8px 0 2px" }}>
              {movie.title}
            </p>
            <p style={{ fontSize: "12px", color: "#666" }}>
              ⭐ {movie.vote_average.toFixed(1)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;