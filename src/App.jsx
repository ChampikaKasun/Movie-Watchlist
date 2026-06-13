import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase";
import AuthCard from "./components/AuthCard";

function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [movies, setMovies] = useState([]);
  const [search, setSearch] = useState("");

  const apiKey = import.meta.env.VITE_TMDB_API_KEY;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) fetchPopular();
  }, [user]);

  const fetchPopular = async () => {
    const url = `https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&language=en-US&page=1`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      setMovies(data.results);
    } catch (err) {
      console.error("Error fetching movies:", err);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (search.trim() === "") {
      fetchPopular();
      return;
    }
    const url = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&language=en-US&query=${encodeURIComponent(search)}&page=1`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      setMovies(data.results);
    } catch (err) {
      console.error("Error searching movies:", err);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  if (authLoading) {
    return <p style={{ textAlign: "center", marginTop: "60px", color: "#9a9aa8" }}>Loading...</p>;
  }

  if (!user) {
    return <AuthCard />;
  }

  return (
    <div>
      <header className="app-header">
        <h1>🎬 Movie Watchlist</h1>
        <button onClick={handleLogout} className="btn-logout">Log Out</button>
      </header>

      <div className="page">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Search for a movie..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="btn-primary">Search</button>
        </form>

        <h2 className="section-title">Movies</h2>
        <div className="movie-grid">
          {movies.length === 0 ? (
            <p className="empty-state">No movies found.</p>
          ) : (
            movies.map((movie) => (
              <div key={movie.id} className="movie-card">
                {movie.poster_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w300${movie.poster_path}`}
                    alt={movie.title}
                  />
                ) : (
                  <div className="movie-poster-fallback">No image</div>
                )}
                <div className="movie-info">
                  <div className="movie-title">{movie.title}</div>
                  <div className="movie-rating">⭐ {movie.vote_average?.toFixed(1) ?? "N/A"}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default App;