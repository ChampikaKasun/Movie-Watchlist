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
  const [view, setView] = useState("browse");
  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedMovieId, setSelectedMovieId] = useState(null);
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("");

  const apiKey = import.meta.env.VITE_TMDB_API_KEY;

  // Track auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Fetch the genre list once
  useEffect(() => {
    const fetchGenres = async () => {
      const url = `https://api.themoviedb.org/3/genre/movie/list?api_key=${apiKey}&language=en-US`;
      try {
        const res = await fetch(url);
        const data = await res.json();
        setGenres(data.genres || []);
      } catch (err) {
        console.error("Error fetching genres:", err);
      }
    };
    fetchGenres();
  }, [apiKey]);

  // Load movies: popular, by genre — runs when user/genre changes
  useEffect(() => {
    if (!user) return;

    const loadMovies = async () => {
      setLoading(true);

      // If no filters are set, show popular movies
      const noFilters = selectedGenre === "" && selectedYear === "" && selectedLanguage === "";

      let url;
      if (noFilters) {
        url = `https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&language=en-US&page=1`;
      } else {
        url = `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&language=en-US&sort_by=popularity.desc&page=1`;
        if (selectedGenre !== "") url += `&with_genres=${selectedGenre}`;
        if (selectedYear !== "") url += `&primary_release_year=${selectedYear}`;
        if (selectedLanguage !== "") url += `&with_original_language=${selectedLanguage}`;
      }

      try {
        const res = await fetch(url);
        const data = await res.json();
        setMovies(data.results);
      } catch (err) {
        console.error("Error fetching movies:", err);
      } finally {
        setLoading(false);
      }
    };

    loadMovies();
  }, [user, selectedGenre, selectedYear, selectedLanguage, apiKey]);

  // Listen to the user's watchlist in real time
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "watchlist"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((d) => ({ docId: d.id, ...d.data() }));
      setWatchlist(items);
    });
    return () => unsubscribe();
  }, [user]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (search.trim() === "") {
      setSelectedGenre(""); // triggers the effect to reload popular
      return;
    }
    setLoading(true);
    const url = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&language=en-US&query=${encodeURIComponent(search)}&page=1`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      setMovies(data.results);
    } catch (err) {
      console.error("Error searching movies:", err);
    } finally {
      setLoading(false);
    }
  };

  const findInWatchlist = (movieId) =>
    watchlist.find((item) => item.movieId === movieId);

  const toggleWatchlist = async (movie) => {
    const id = movie.id ?? movie.movieId;
    const existing = findInWatchlist(id);
    try {
      if (existing) {
        await deleteDoc(doc(db, "watchlist", existing.docId));
      } else {
        await addDoc(collection(db, "watchlist"), {
          userId: user.uid,
          movieId: id,
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

  const moviesToShow = view === "browse"
    ? movies.map((m) => ({
        movieId: m.id,
        title: m.title,
        poster_path: m.poster_path,
        vote_average: m.vote_average,
        id: m.id,
      }))
    : watchlist;

  // Years from current year back to 1980
  const years = [];
  for (let y = new Date().getFullYear(); y >= 1980; y--) {
    years.push(y);
  }

  // A few common languages (TMDB uses ISO codes)
  const languages = [
    { code: "en", name: "English" },
    { code: "ta", name: "Tamil" },
    { code: "si", name: "Sinhala" },
    { code: "hi", name: "Hindi" },
    { code: "ko", name: "Korean" },
    { code: "ja", name: "Japanese" },
    { code: "fr", name: "French" },
    { code: "es", name: "Spanish" },
  ];

  return (
    <div>
      <header className="app-header">
        <h1>🎬 Movie Watchlist</h1>
        <div className="header-right">
          <span className="header-email">{user.email}</span>
          <button onClick={handleLogout} className="btn-logout">Log Out</button>
        </div>
      </header>

      <div className="page">
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

        {view === "browse" && (
          <>
            <form onSubmit={handleSearch} className="search-form">
              <input
                type="text"
                placeholder="Search for a movie..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button type="submit" className="btn-primary">Search</button>
            </form>

            <div className="filter-row">
              <select
                className="genre-select"
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
              >
                <option value="">All Genres</option>
                {genres.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>

              <select
                className="genre-select"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                <option value="">All Years</option>
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>

              <select
                className="genre-select"
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
              >
                <option value="">All Languages</option>
                {languages.map((l) => (
                  <option key={l.code} value={l.code}>{l.name}</option>
                ))}
              </select>
            </div>
          </>
        )}

        <h2 className="section-title">
          {view === "browse" ? "Movies" : "My Watchlist"}
        </h2>

        {loading && view === "browse" ? (
          <div className="loader-wrap">
            <div className="spinner"></div>
            <p>Loading movies...</p>
          </div>
        ) : (
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
        )}

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