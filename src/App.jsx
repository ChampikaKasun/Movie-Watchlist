import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  collection, query, where, onSnapshot, addDoc, deleteDoc, doc,
} from "firebase/firestore";
import { auth, db } from "./firebase";
import AuthCard from "./components/AuthCard";
import MovieModal from "./components/MovieModal";

function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [movies, setMovies] = useState([]);
  const [search, setSearch] = useState("");
  const [watchlist, setWatchlist] = useState([]);
  const [view, setView] = useState("browse"); // "browse" or "watchlist"
  const [selectedMovieId, setSelectedMovieId] = useState(null);

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

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "watchlist"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((d) => ({ docId: d.id, ...d.data() }));
      setWatchlist(items);
    });
    return () => unsubscribe();
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

  const findInWatchlist = (movieId) =>
    watchlist.find((item) => item.movieId === movieId);

  const toggleWatchlist = async (movie) => {
    // movie may come from TMDB (movie.id) or from a saved item (movie.movieId)
    const id = movie.id ?? movie.movieId;
    const existing = findInWatchlist(id);
    try {
      if (existing) {
        await deleteDoc(doc(db, "watchlist", existing.docId));
      } else {
        await addDoc(collection(db, "watchlist"), {
          userId: user.uid,
          movieId: movie.id,
          title: movie.title,
          poster_path: movie.poster_path || "",
          vote_average: movie.vote_average || 0,
        });
      }
    } catch (err) {
      console.error("Error updating watchlist:", err);
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

  // Decide which list of movies to show
  const moviesToShow = view === "browse"
    ? movies.map((m) => ({
        movieId: m.id,
        title: m.title,
        poster_path: m.poster_path,
        vote_average: m.vote_average,
        id: m.id,
      }))
    : watchlist;

  return (
    <div>
      <header className="app-header">
        <h1>🎬 Movie Watchlist</h1>
        <button onClick={handleLogout} className="btn-logout">Log Out</button>
      </header>

      <div className="page">
        {/* Tab switcher */}
        <div className="view-tabs">
          <button
            className={view === "browse" ? "view-tab active" : "view-tab"}
            onClick={() => setView("browse")}
          >
            Browse
          </button>
          <button
            className={view === "watchlist" ? "view-tab active" : "view-tab"}
            onClick={() => setView("watchlist")}
          >
            My Watchlist ({watchlist.length})
          </button>
        </div>

        {/* Search only shows in Browse view */}
        {view === "browse" && (
          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              placeholder="Search for a movie..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button type="submit" className="btn-primary">Search</button>
          </form>
        )}

        <h2 className="section-title">
          {view === "browse" ? "Movies" : "My Watchlist"}
        </h2>

        <div className="movie-grid">
          {moviesToShow.length === 0 ? (
            <p className="empty-state">
              {view === "browse" ? "No movies found." : "Your watchlist is empty. Add some movies from Browse!"}
            </p>
          ) : (
            moviesToShow.map((movie) => {
              const added = findInWatchlist(movie.movieId);
              return (
                <div key={movie.movieId} className="movie-card">
                  {movie.poster_path ? (
                    <div onClick={() => setSelectedMovieId(movie.movieId)} style={{ cursor: "pointer" }}>
                    {movie.poster_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w300${movie.poster_path}`}
                        alt={movie.title}
                      />
                    ) : (
                      <div className="movie-poster-fallback">No image</div>
                    )}
                  </div>
                  ) : (
                    <div className="movie-poster-fallback">No image</div>
                  )}
                  <div className="movie-info">
                    <div className="movie-title">{movie.title}</div>
                    <div className="movie-rating">⭐ {movie.vote_average?.toFixed(1) ?? "N/A"}</div>
                    <button
                      className={added ? "btn-watch added" : "btn-watch"}
                      onClick={() => toggleWatchlist(movie)}
                    >
                      {added ? "✓ On Watchlist" : "+ Watchlist"}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
        {selectedMovieId && (
          <MovieModal
            movieId={selectedMovieId}
            apiKey={apiKey}
            onClose={() => setSelectedMovieId(null)}
          />
        )}
      </div>
    </div>
  );
}

export default App;