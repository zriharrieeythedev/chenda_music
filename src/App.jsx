import { useState, useRef, useEffect } from 'react';
import './App.css';

function App() {
  const [playlistLink, setPlaylistLink] = useState('');
  const [songs, setSongs] = useState([]);
  const [playlistMeta, setPlaylistMeta] = useState(null);
  const [currentSongIndex, setCurrentSongIndex] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isYoutube, setIsYoutube] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [shuffle, setShuffle] = useState(true); // Default to shuffle/random since user requested random play cycle

  const audioRef = useRef(null);
  const ytPlayerRef = useRef(null);
  const ytContainerRef = useRef(null);
  const progressRef = useRef(null);

  const loadPlaylist = async () => {
    if (!playlistLink) return;

    setIsLoading(true);
    setError('');
    
    if (audioRef.current) audioRef.current.pause();
    if (ytPlayerRef.current && typeof ytPlayerRef.current.stopVideo === 'function') {
        try { ytPlayerRef.current.stopVideo(); } catch(e){}
    }

    try {
        const response = await fetch(`http://localhost:3001/api/playlist?url=${encodeURIComponent(playlistLink)}`);
        const data = await response.json();
        
        if (data.error) throw new Error(data.error);
        
        setPlaylistMeta({
            title: data.title,
            description: data.description,
            coverUrl: data.coverUrl
        });
        setSongs(data.tracks || []);
        
    } catch (err) {
        setError(err.message || 'Failed to fetch playlist.');
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }
  }, []);

  const playSong = async (index) => {
    const song = songs[index];
    if (!song) return;

    setShowPopup(true);
    setTimeout(() => setShowPopup(false), 3000);

    setCurrentSongIndex(index);
    setIsPlaying(false);
    setCurrentTime(0);
    
    if (audioRef.current) audioRef.current.pause();
    if (ytPlayerRef.current && typeof ytPlayerRef.current.stopVideo === 'function') {
        try { ytPlayerRef.current.stopVideo(); } catch(e){}
    }

    try {
       setIsLoading(true);
       const searchRes = await fetch(`http://localhost:3001/api/search-audio?title=${encodeURIComponent(song.title)}&artist=${encodeURIComponent(song.artist)}`);
       const searchData = await searchRes.json();
       
       if (searchData.videoId) {
           setIsYoutube(true);
           if (!ytPlayerRef.current) {
               ytPlayerRef.current = new window.YT.Player(ytContainerRef.current, {
                   height: '0',
                   width: '0',
                   videoId: searchData.videoId,
                   playerVars: { 'autoplay': 1, 'controls': 0, 'disablekb': 1 },
                   events: {
                       'onReady': (event) => {
                           event.target.setVolume(volume * 100);
                           event.target.playVideo();
                           setIsPlaying(true);
                           setDuration(event.target.getDuration());
                       },
                       'onStateChange': (event) => {
                           if (event.data === window.YT.PlayerState.PLAYING) {
                               setIsPlaying(true);
                               setDuration(event.target.getDuration());
                           } else if (event.data === window.YT.PlayerState.PAUSED) {
                               setIsPlaying(false);
                           } else if (event.data === window.YT.PlayerState.ENDED) {
                               playNext();
                           }
                       }
                   }
               });
           } else {
               ytPlayerRef.current.loadVideoById(searchData.videoId);
               ytPlayerRef.current.setVolume(volume * 100);
               ytPlayerRef.current.playVideo();
               setIsPlaying(true);
           }
       } else {
           throw new Error("No YouTube video found");
       }
    } catch (err) {
        if (song.previewUrl) {
            setIsYoutube(false);
            if (audioRef.current) {
                audioRef.current.src = song.previewUrl;
                audioRef.current.volume = volume;
                audioRef.current.play();
                setIsPlaying(true);
            }
        } else {
            console.error("Playback failed:", err);
            playNext();
        }
    } finally {
        setIsLoading(false);
    }
  };

  // Sync progress time
  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        if (isYoutube && ytPlayerRef.current && ytPlayerRef.current.getCurrentTime) {
          const now = ytPlayerRef.current.getCurrentTime();
          setCurrentTime(now);
          // Sometimes YouTube's duration isn't available immediately
          const dur = ytPlayerRef.current.getDuration();
          if (dur > 0) setDuration(dur);
        } else if (!isYoutube && audioRef.current) {
          setCurrentTime(audioRef.current.currentTime);
          setDuration(audioRef.current.duration);
        }
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isPlaying, isYoutube]);

  const togglePlay = () => {
    if (currentSongIndex === null) return;
    if (isYoutube && ytPlayerRef.current) {
        if (isPlaying) ytPlayerRef.current.pauseVideo();
        else ytPlayerRef.current.playVideo();
    } else if (audioRef.current) {
        if (isPlaying) audioRef.current.pause();
        else audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const playNext = () => {
    if (songs.length === 0) return;
    
    // Logic for selection: if shuffle is on, pick random. Otherwise next in list.
    if (shuffle) {
      let nextIdx = Math.floor(Math.random() * songs.length);
      // Try to avoid playing the exact same song twice in a row if there are others
      if (nextIdx === currentSongIndex && songs.length > 1) {
        nextIdx = (nextIdx + 1) % songs.length;
      }
      playSong(nextIdx);
    } else {
      const nextIdx = (currentSongIndex + 1) % songs.length;
      playSong(nextIdx);
    }
  };

  const playPrev = () => {
    if (songs.length === 0) return;
    const prevIdx = (currentSongIndex - 1 + songs.length) % songs.length;
    playSong(prevIdx);
  };

  const handleSeek = (e) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (isYoutube && ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === 'function') {
        ytPlayerRef.current.seekTo(time, true);
    } else if (audioRef.current) {
        audioRef.current.currentTime = time;
    }
  };

  const handleVolume = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (isYoutube && ytPlayerRef.current && typeof ytPlayerRef.current.setVolume === 'function') {
        ytPlayerRef.current.setVolume(val * 100);
    } else if (audioRef.current) {
        audioRef.current.volume = val;
    }
  };

  const formatTime = (time) => {
    if (isNaN(time) || time === Infinity || time < 0) return "0:00";
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60).toString().padStart(2, '0');
    return `${min}:${sec}`;
  };

  // Automatic transition for audio element
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const handleEnd = () => playNext();
    audio.addEventListener('ended', handleEnd);
    return () => audio.removeEventListener('ended', handleEnd);
  }, [currentSongIndex, songs, shuffle]);

  return (
    <div className="app-container">
      <div id="yt-player-container" ref={ytContainerRef} className="hidden"></div>

      {showPopup && (
        <div className="popup-message">
          engne und mone sanam
        </div>
      )}

      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo-container">
          <img src="/logo.png" alt="Chenda Logo" className="logo" />
          <h1>Chenda</h1>
        </div>
        <nav className="nav-menu">
          <a href="#" className="nav-item active">
            <span className="icon">🏠</span> Home
          </a>
          <a href="#" className="nav-item">
            <span className="icon">🔍</span> Search
          </a>
          <a href="#" className="nav-item">
            <span className="icon">📚</span> Your Library
          </a>
        </nav>
        <div className="sidebar-footer">
          <p>Created by Pachavalli Developers</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="header">
          <div className="search-bar">Search for songs, artists...</div>
        </header>

        <section className="playlist-input-section">
          <h2>Listen to anything</h2>
          <div className="input-wrapper">
            <input 
              type="text" 
              placeholder="Paste Spotify Playlist URL..." 
              value={playlistLink}
              onChange={(e) => setPlaylistLink(e.target.value)}
            />
            <button className="btn-primary" onClick={loadPlaylist} disabled={isLoading}>
              {isLoading && !songs.length ? 'Loading...' : 'Load'}
            </button>
          </div>
          {error && <p className="error-text" style={{color: '#ff6b6b', marginTop: '10px'}}>{error}</p>}
        </section>

        {playlistMeta && (
           <div className="playlist-header">
               <img 
                 src={playlistMeta.coverUrl?.includes('placehold.co') ? '/logo.png' : playlistMeta.coverUrl} 
                 alt="Cover" 
                 className="playlist-cover" 
               />
               <div className="playlist-info">
                   <p>PLAYLIST</p>
                   <h1>{playlistMeta.title || 'Unknown'}</h1>
                   <p className="desc">{playlistMeta.description}</p>
                   <p className="stats">{songs.length} songs</p>
               </div>
           </div>
        )}

        <section className="songs-section">
          {isLoading && !songs.length && <div style={{textAlign:'center', padding: '50px'}}><div className="pulse-loader"></div></div>}
          <div className="songs-grid">
            {songs.map((song, index) => (
              <div 
                  key={index} 
                  className={`song-card ${currentSongIndex === index ? 'active-card' : ''}`}
                  onClick={() => playSong(index)}
              >
                <div className="cover-wrapper">
                    <img 
                      src={song.albumArt.includes('placehold.co') ? '/logo.png' : song.albumArt} 
                      alt={song.title} 
                    />
                </div>
                <h3>{song.title}</h3>
                <p>{song.artist}</p>
                <p style={{textAlign: 'right'}}>{formatTime((song.duration || 0)/1000)}</p>
              </div>
            ))}
          </div>
          <div className="main-footer-credit">
            <p>© 2026 Chenda - Created by <span>Pachavalli Developers</span></p>
          </div>
        </section>
      </main>

      {/* Player Bar */}
      <footer className="player-footer">
        <div className="now-playing">
          {currentSongIndex !== null && songs[currentSongIndex] && (
            <>
              <img 
                src={songs[currentSongIndex].albumArt.includes('placehold.co') ? '/logo.png' : songs[currentSongIndex].albumArt} 
                alt="Album Art" 
              />
              <div className="song-info">
                <h4>{songs[currentSongIndex].title}</h4>
                <p>{songs[currentSongIndex].artist}</p>
              </div>
            </>
          )}
        </div>

        <div className="player-controls">
          <div className="control-buttons">
            <button 
              className={`control-btn ${shuffle ? 'active' : ''}`} 
              onClick={() => setShuffle(!shuffle)}
              style={{ fontSize: '14px', color: shuffle ? 'var(--accent-primary)' : 'var(--text-dim)' }}
            >
              🔀
            </button>
            <button className="control-btn" onClick={playPrev}>⏮</button>
            <button className="control-btn play-pause" onClick={togglePlay}>
              {isPlaying ? '⏸' : '▶'}
            </button>
            <button className="control-btn" onClick={playNext}>⏭</button>
          </div>
          <div className="progress-bar-container">
            <span className="time">{formatTime(currentTime)}</span>
            <div className="custom-progress-wrapper" style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input 
                ref={progressRef}
                type="range" 
                className="progress-bar"
                min="0"
                max={duration || 100}
                step="0.1"
                value={currentTime}
                onChange={handleSeek}
                style={{
                  background: `linear-gradient(to right, #fff ${(currentTime / (duration || 100)) * 100}%, #4d4d4d ${(currentTime / (duration || 100)) * 100}%)`
                }}
              />
            </div>
            <span className="time">{formatTime(duration)}</span>
          </div>
        </div>

        <div className="volume-controls">
          <span style={{fontSize: '14px', color: '#b3b3b3'}}>🔈</span>
          <input 
              type="range" 
              className="volume-bar"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolume}
              style={{
                background: `linear-gradient(to right, #fff ${volume * 100}%, #4d4d4d ${volume * 100}%)`
              }}
          />
        </div>
      </footer>

      <audio ref={audioRef} style={{ display: 'none' }} />
    </div>
  );
}

export default App;
