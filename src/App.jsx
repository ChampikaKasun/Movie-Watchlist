import { useEffect, useState } from "react";

function App() {
  const [movies, setMovies] = useState([]);
  const [search, setSearch] = useState("");

  const apiKey = import.meta.env.VITE_TMDB_API_KEY;

  // Fetch popular movies on first load
  useEffect(() => {
    fetchPopular();
}, []);

  const fetchPopular = async () => {
    const url = `https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&language=en-US&page=1`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      setMovies(data.results);
    } catch (err) {
      console.error("Error fetching movies:", err);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();

    // If search is empty, show popular movies again
    if (search.trim() === "") {
      fetchPopular();
      return;
    }

    const url = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&language=en-US&query=${encodeURIComponent(search)}&page=1`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      setMovies(data.results);
    } catch (err) {
      console.error("Error searching movies:", err);
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>🎬 Movie Watchlist</h1>

      <form onSubmit={handleSearch} style={{ margin: "20px 0", display: "flex", gap: "8px" }}>
        <input
          type="text"
          placeholder="Search for a movie..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid #ccc" }}
        />
        <button type="submit" style={{ padding: "10px 18px", borderRadius: "8px", cursor: "pointer" }}>
          Search
        </button>
      </form>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          gap: "16px",
        }}
      >
        {movies.length === 0 ? (
          <p>No movies found.</p>
        ) : (
          movies.map((movie) => (
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
                ⭐ {movie.vote_average?.toFixed(1) ?? "N/A"}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default App;