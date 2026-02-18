'use client';

import React from "react";
import { useState, useEffect, useRef, useLayoutEffect, useCallback, useMemo } from 'react';
import { FaceSmileIcon, FaceFrownIcon, BoltIcon, MoonIcon, HeartIcon, HeadphonesIcon } from '@heroicons/react/24/solid';
import { PlusIcon } from '@heroicons/react/24/outline'; // If using Heroicons, otherwise use an inline SVG or emoji
import ReactDOM from 'react-dom';
import { useDropdown } from './dropdown-context';
import PremiumModal from './components/PremiumModal';
import DesktopHeader from './components/DesktopHeader';
import Sidebar from './components/Sidebar';
import MobileHeader from './components/MobileHeader';
import PlayerBar from './components/PlayerBar';
import SplashScreen from './components/SplashScreen';
import TiltCard from './components/TiltCard';

// 1. Create a utility for portal root
function getDropdownRoot() {
  let root = document.getElementById('dropdown-root');
  if (!root) {
    root = document.createElement('div');
    root.id = 'dropdown-root';
    document.body.appendChild(root);
  } else {
    // Always move to end of body for stacking
    if (root.parentNode !== document.body || document.body.lastChild !== root) {
      document.body.appendChild(root);
  }
  }
  root.style.zIndex = '2147483647'; // max z-index
  root.style.position = 'relative';
  return root;
}

// FAQ PAGE COMPONENT
function FAQPage() {
  const faqs = [
    {
      q: 'What is MoodyBeats?',
      a: 'MoodyBeats is a mood-based music player that lets you browse and play music by selecting your current mood.'
    },
    {
      q: 'How does mood selection work?',
      a: 'You choose your mood manually, and the app shows you a curated playlist for that mood.'
    },
    {
      q: 'Do I need an account?',
      a: 'You can listen to some music without an account, but creating an account lets you save playlists, like songs, and use Smart Shuffle.'
    },
    {
      q: 'What is Smart Shuffle?',
      a: 'Smart Shuffle lets you build a custom queue of songs and shuffle them in a smart way, avoiding recently played tracks.'
    },
    {
      q: 'What do I get with Premium?',
      a: 'Premium users can add unlimited songs to playlists and Smart Shuffle. Free users are limited to 20 songs per playlist/queue. (No offline mode, ad-free, or high-quality audio features.)'
    },
    {
      q: 'Is there offline listening?',
      a: 'No, offline listening is not currently supported.'
    },
    {
      q: 'Is my data safe?',
      a: 'Passwords are securely hashed, and your data is not shared with third parties.'
    },
    {
      q: 'How do I contact support?',
      a: 'Use the Contact Us page to send us a message.'
    },
  ];
  const [openIndex, setOpenIndex] = React.useState(null);
  return (
    <main className="min-h-screen flex flex-col items-center justify-start py-12 px-4" style={{ background: '#232323', opacity: 1, position: 'relative', zIndex: 1 }}>
      <h1 className="text-4xl font-bold text-white mb-8">Frequently Asked Questions</h1>
      <div className="w-full max-w-2xl mx-auto space-y-4">
        {faqs.map((faq, idx) => (
          <div key={idx} className="border border-[#404040] rounded-lg bg-[#232323]">
            <button
              className="w-full text-left px-6 py-4 text-lg font-semibold text-white focus:outline-none flex justify-between items-center"
              onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
            >
              {faq.q}
              <span className="ml-4 text-2xl">{openIndex === idx ? '−' : '+'}</span>
            </button>
            {openIndex === idx && (
              <div className="px-6 pb-4 text-gray-300 animate-fadeIn">
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}

// Helper for scroll position
function useScrollLock(isLocked) {
  React.useEffect(() => {
    if (!isLocked) return;
    const scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, scrollY);
    };
  }, [isLocked]);
}

export default function Home() {
  const [selectedMood, setSelectedMood] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [recentlyPlayed, setRecentlyPlayed] = useState([]);
  const [searchActive, setSearchActive] = useState(false);
  const moods = [
    { id: "happy", name: 'Happy', emoji: '😊', color: 'from-[#f9d423] via-[#ff4e50] to-[#f9d423]', description: 'Upbeat & joyful tunes' },
    { id: "sad", name: 'Sad', emoji: '😢', color: 'from-[#4e54c8] via-[#8f94fb] to-[#4e54c8]', description: 'Melancholic & emotional tracks' },
    { id: "energetic", name: 'Energetic', emoji: '⚡', color: 'from-[#ff512f] via-[#dd2476] to-[#ff512f]', description: 'High-energy, pump-up music' },
    { id: "calm", name: 'Calm', emoji: '🧘', color: 'from-[#a7c7e7] via-[#b2f7ef] to-[#7ed6df]', description: 'Peaceful sounds for relaxation' },
    { id: "romantic", name: 'Romantic', emoji: '💕', color: 'from-[#ff5858] via-[#f857a6] to-[#ff5858]', description: 'Love songs & heartfelt ballads' },
    { id: "glamorous", name: 'Glamorous', emoji: '✨', color: 'from-[#4c1d95] via-[#581c87] to-[#1e1b4b]', description: 'Concentration music for productivity' },
  ];
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [songs, setSongs] = useState([]);
  const [songsLoading, setSongsLoading] = useState(false);
  const [songsError, setSongsError] = useState(null);
  const [currentSong, setCurrentSong] = useState(null);
  const audioRefs = useRef({});
  const globalAudioRef = useRef(null);
  const [audioTime, setAudioTime] = useState({ currentTime: '0:00', duration: '0:00', progress: 0, volume: 1 });
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekValue, setSeekValue] = useState(0);
  const progressSliderRef = useRef(null);
  const [isMuted, setIsMuted] = useState(false);
  const [lastVolume, setLastVolume] = useState(1);
  // Only library section now
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSidebarContent, setShowSidebarContent] = useState(false);
  const sidebarRef = useRef(null);
  const [playlists, setPlaylists] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [playlistMenuOpen, setPlaylistMenuOpen] = useState(null); // id of open menu
  const [showAddSongsModal, setShowAddSongsModal] = useState(false);
  const [addSongsPlaylistId, setAddSongsPlaylistId] = useState(null);
  const [selectedSongsToAdd, setSelectedSongsToAdd] = useState([]);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renamePlaylistId, setRenamePlaylistId] = useState(null);
  const [renamePlaylistName, setRenamePlaylistName] = useState("");
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(null);
  const [allBackendSongs, setAllBackendSongs] = useState([]);
  const [addSongsSuccess, setAddSongsSuccess] = useState(false);
  const [currentPage, setCurrentPage] = useState('home'); // 'home', 'about', 'contact', 'playlist'
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [authFormData, setAuthFormData] = useState({
    username: '',
    email: '',
    password: ''
  });
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [showMoodDropdown, setShowMoodDropdown] = useState(false);
  // Add state for create playlist login warning
  const [createPlaylistWarning, setCreatePlaylistWarning] = useState('');
  const [isAddingSongs, setIsAddingSongs] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameSuccess, setRenameSuccess] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [songDeleteSuccess, setSongDeleteSuccess] = useState(false);
  const [songLikeSuccess, setSongLikeSuccess] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutSuccess, setLogoutSuccess] = useState(false);
  const [authSuccess, setAuthSuccess] = useState(false);
  const [justSignedUp, setJustSignedUp] = useState(false);
  const [playbackContext, setPlaybackContext] = useState({ type: 'none', id: null, songs: [] });
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [searchResults, setSearchResults] = useState({ songs: [], playlists: [] });
  const [searchSelectedSong, setSearchSelectedSong] = useState(null);
  const { dropdown, showDropdown, hideDropdown } = useDropdown();
  const [isInputFocused, setIsInputFocused] = useState(false);
  // Add state for create playlist modal feedback
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const [createPlaylistSuccess, setCreatePlaylistSuccess] = useState(false);
  const [likedSongs, setLikedSongs] = useState([]);
  const [likedSongIds, setLikedSongIds] = useState(new Set());
  // 1. State for add-to-playlist modal
  const [showAddToPlaylistModal, setShowAddToPlaylistModal] = useState(false);
  const [addToPlaylistSuccess, setAddToPlaylistSuccess] = useState(false);
  const [addToPlaylistError, setAddToPlaylistError] = useState('');
  const [selectedPlaylistForAdd, setSelectedPlaylistForAdd] = useState(null);
  // 2. Shuffle and Repeat state
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState('none'); // 'none', 'one', 'all'
  const [shuffledSongList, setShuffledSongList] = useState([]);
  
  // Smart Shuffle state
  const [smartShuffleMode, setSmartShuffleMode] = useState(false);
  const [smartShuffleList, setSmartShuffleList] = useState([]);
  const [smartShuffleHistory, setSmartShuffleHistory] = useState([]);
  const [smartShuffleQueue, setSmartShuffleQueue] = useState([]);
  const [smartShuffleLoading, setSmartShuffleLoading] = useState({}); // Track loading state per song
  const [showSmartShuffleModal, setShowSmartShuffleModal] = useState(false);
  
  // Premium state
  const [isPremium, setIsPremium] = useState(false);
  const [premiumUntil, setPremiumUntil] = useState(null);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  // Add state to trigger text animation on mood change
  const [textAnimKey, setTextAnimKey] = useState(0);
  // State for tracking expanded songs
  const [expandedSongs, setExpandedSongs] = useState({});
  // State for tracking expanded playlist songs
  const [expandedPlaylistSongs, setExpandedPlaylistSongs] = useState({});
  const [showSongDetailsModal, setShowSongDetailsModal] = useState(false);
  const [selectedSongDetails, setSelectedSongDetails] = useState(null);
  
  // Splash screen state
  const [showSplashScreen, setShowSplashScreen] = useState(true);
  
  // Auto-hide splash screen after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplashScreen(false);
    }, 5000);
    
    return () => clearTimeout(timer);
  }, []);
  
  useEffect(() => {
    setTextAnimKey((k) => k + 1);
  }, [selectedMood]);

  const moodIds = ['happy', 'sad', 'energetic', 'calm', 'romantic', 'glamorous'];
  useEffect(() => {
    Promise.all(
      moodIds.map(id =>
        fetch(`http://localhost:5000/api/songs/${id}`).then(res => res.json())
      )
    ).then(results => {
      const allSongs = results.flat();
      setAllBackendSongs(allSongs);
    }).catch(() => setAllBackendSongs([]));
  }, []);

  // Check if user is logged in on app start
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      fetchUserProfile(token);
    }
  }, []);

  const fetchUserProfile = async (token) => {
    try {
      const response = await fetch('http://localhost:5000/api/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setIsPremium(userData.is_premium || false);
        setPremiumUntil(userData.premium_until);
        console.log('User profile loaded:', userData, 'isPremium:', userData.is_premium);
      } else {
        localStorage.removeItem('authToken');
      }
    } catch (error) {
      localStorage.removeItem('authToken');
    }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    let slowNetworkTimeout;
    try {
      slowNetworkTimeout = setTimeout(() => {
        setAuthError('Network is slow or unavailable. Please check your connection.');
      }, 5000);
      const endpoint = isLoginMode ? '/api/login' : '/api/signup';
      let res;
      try {
        res = await fetch(`http://localhost:5000${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(authFormData),
        });
      } catch (fetchErr) {
        clearTimeout(slowNetworkTimeout);
        setAuthError('Network error');
        setAuthLoading(false);
        return;
      }
      clearTimeout(slowNetworkTimeout);
      let data = {};
      let rawText = '';
      try {
        data = await res.json();
      } catch (jsonErr) {
        try {
          rawText = await res.text();
        } catch (textErr) {}
      }
      if (!res.ok) {
        if (data && data.error) {
          setAuthError(data.error);
        } else if (rawText) {
          setAuthError(rawText);
        } else {
          setAuthError('An unknown error occurred.');
        }
        setAuthLoading(false);
        return;
      }
      // Success path
      if (data && data.token) {
        localStorage.setItem('authToken', data.token);
        setShowAuthModal(false);
        setAuthFormData({ username: '', email: '', password: '' });
        setAuthSuccess(true);
        setJustSignedUp(false); // Reset after login
        setTimeout(() => setAuthSuccess(false), 2000);
        await fetchUserProfile(data.token); // Force profile refresh after login
      } else if (!isLoginMode && data && data.message === 'User created successfully') {
        // Show success message and switch to login mode
        setJustSignedUp(true);
        setIsLoginMode(true);
        setAuthFormData({ username: '', email: '', password: '' });
        setAuthError(''); // Clear any previous errors
      } else if (!isLoginMode && res.ok) {
        setAuthError('Signup successful! Please login with your email and password.');
        setIsLoginMode(true);
      } else {
        setAuthError((data && data.error) || rawText || 'Login failed');
      }
    } finally {
      clearTimeout(slowNetworkTimeout);
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setIsLoggingOut(true);
    setTimeout(() => {
      localStorage.removeItem('authToken');
      setUser(null);
      setPlaylists([]);
      setSelectedPlaylistId(null);
      setLogoutSuccess(true);
      setTimeout(() => setLogoutSuccess(false), 2000);
      setIsLoggingOut(false);
      setShowProfileModal(false);
    }, 1000);
  };

  const handleAuthInputChange = (e) => {
    setAuthFormData({
      ...authFormData,
      [e.target.name]: e.target.value
    });
    // Clear error when user starts typing
    if (authError) {
      setAuthError('');
    }
  };

  const switchAuthMode = () => {
    setIsLoginMode(!isLoginMode);
    setAuthError('');
    setAuthFormData({ username: '', email: '', password: '' });
    setJustSignedUp(false);
  };

  // Helper to get selected playlist object
  const selectedPlaylist = playlists.find(p => p.id === selectedPlaylistId) || null;

  // Show content after sidebar width transition
  useEffect(() => {
    let timeout;
    if (sidebarOpen) {
      timeout = setTimeout(() => setShowSidebarContent(true), 250); // match transition duration
    } else {
      setShowSidebarContent(false);
    }
    return () => clearTimeout(timeout);
  }, [sidebarOpen]);

  const moodIcons = {
    happy: FaceSmileIcon,
    sad: FaceFrownIcon,
    energetic: BoltIcon,
    calm: MoonIcon,
    romantic: HeartIcon,
    glamorous: HeadphonesIcon,
  };

  // Update moodBgColors to use vibrant mood colors
  const moodBgColors = {
    happy: '#ffe066', // vibrant yellow
    sad: '#e5e7eb',   // light grey for border/shadow
    energetic: '#ff6b6b', // pink/red
    calm: '#76e4f7',  // teal
    romantic: '#ff6fa1', // pink
    glamorous: '#a78bfa', // purple
  };

  const handleMoodClick = (mood) => {
    setSelectedMood(mood);
    setSongs([]);
    setSongsError(null);
    setSongsLoading(true);
    setCurrentPage('home'); // Close playlist if open
    setSelectedPlaylistId(null); // Deselect playlist
    fetch(`http://localhost:5000/api/songs/${mood.id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch songs");
        return res.json();
      })
      .then((data) => {
        setSongs(data);
        setSongsLoading(false);
      })
      .catch((err) => {
        setSongsError(err.message);
        setSongsLoading(false);
      });
  };

  const moodIconColors = {
    happy: 'bg-yellow-400',
    sad: 'bg-blue-500',
    energetic: 'bg-pink-500',
    calm: 'bg-green-400',
    romantic: 'bg-red-400',
    glamorous: 'bg-purple-500',
  };

  // Fetch recently played on login
  useEffect(() => {
    const fetchRecentlyPlayed = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) return setRecentlyPlayed([]);
      const res = await fetch('http://localhost:5000/api/recently-played', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setRecentlyPlayed(await res.json());
      } else {
        setRecentlyPlayed([]);
      }
    };
    if (user) fetchRecentlyPlayed();
  }, [user]);

  // Add to recently played when a song is played
  const addToRecentlyPlayed = async (song) => {
    const token = localStorage.getItem('authToken');
    console.log('addToRecentlyPlayed called with:', song);
    if (!token || !song?.id) {
      console.warn('No token or invalid song:', { token, song });
      return;
    }
    try {
      const resp = await fetch('http://localhost:5000/api/recently-played', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ song_id: song.id })
      });
      console.log('POST /api/recently-played response:', resp.status, resp.statusText);
      if (!resp.ok) {
        console.error('Failed to add to recently played:', await resp.text());
      }
      // Refresh recently played
      const res = await fetch('http://localhost:5000/api/recently-played', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        console.log('Fetched recently played:', data);
        setRecentlyPlayed(data);
      } else {
        console.error('Failed to fetch recently played:', res.status, res.statusText);
      }
    } catch (err) {
      console.error('Error updating recently played:', err);
    }
  };

  // When a song is played (in handlePlaySong), call addToRecentlyPlayed
  const handlePlaySong = (song, idx, context = null) => {
    setCurrentSong(song);
    setCurrentSongIndex(idx);
    setIsPlaying(true);
    
    // Update smart shuffle history
    updateSmartShuffleHistory(song);
    
    // Set playback context if provided
    if (context) {
      setPlaybackContext(context);
    }
  };

  // Search bar logic
  const handleSearchFocus = () => setIsInputFocused(true);
  const handleSearchBlur = () => setIsInputFocused(false);

  const handlePlay = (song) => {  
    setCurrentSong(song);
    setIsPlaying(true);
    setTimeout(() => {
      if (globalAudioRef.current) {
        globalAudioRef.current.play();
      }
    }, 0);
  };

  useEffect(() => {
    if (!isPlaying && globalAudioRef.current) {
      globalAudioRef.current.pause();
    }
  }, [isPlaying]);

  const handleVolume = (e) => {
    const vol = parseFloat(e.target.value);
    setAudioTime((prev) => ({ ...prev, volume: vol }));
    if (globalAudioRef.current) globalAudioRef.current.volume = vol;
  };

  const handleSeek = (e) => {
    if (!globalAudioRef.current) return;
    const rect = e.target.getBoundingClientRect();
    const x = e.nativeEvent.clientX - rect.left;
    const percent = x / rect.width;
    const seekTime = percent * (globalAudioRef.current.duration || 0);
    globalAudioRef.current.currentTime = seekTime;
  };

  // Helper to get the current song list based on context
  const getCurrentSongList = () => {
    // Smart shuffle takes priority
    if (smartShuffleMode && smartShuffleList.length > 0) {
      return smartShuffleList;
    }
    // If shuffle is on (and not smart shuffle), use shuffledSongList
    if (isShuffled && shuffledSongList.length > 0) {
      return shuffledSongList;
    }
    if (playbackContext.type === 'playlist') {
      const playlist = playlists.find(p => p.id === playbackContext.id);
      const playlistSongs = playlist ? playlist.songs : [];
      return playlistSongs;
    } else if (playbackContext.type === 'mood') {
      // Use the songs from the playbackContext, not the current songs array
      return playbackContext.songs || [];
    } else if (playbackContext.type === 'search') {
      const searchSongs = playbackContext.songs || [];
      return searchSongs;
    } else if (playbackContext.type === 'recent') {
      // Use recently played songs for navigation
      return playbackContext.songs || [];
    }
    // Fallback: if no context but we have a current song, try to find it in available lists
    if (currentSong) {
      if (songs.length > 0 && songs.find(s => s.id === currentSong.id)) {
        return songs;
      }
      for (const playlist of playlists) {
        if (playlist.songs.find(s => s.id === currentSong.id)) {
          return playlist.songs;
        }
      }
    }
    return [];
  };

  // When selecting a playlist
  const handleSelectPlaylist = (playlistId) => {
    setSelectedPlaylistId(playlistId);
    setCurrentPage('playlist');
    setCurrentSongIndex(0);
  };



  // When selecting a mood, fetch and set the correct songs for that mood (UI only, do not update playbackContext)
  const handleSelectMood = async (mood) => {
    setSelectedMood(mood);
    setCurrentSongIndex(0);
    setSongs([]); // Clear previous songs immediately
    setSongsLoading(true);
    setSongsError(null);
    setCurrentPage('mood'); // <-- Now it's 'mood'
    setSelectedPlaylistId(null); // Deselect playlist
    try {
      const res = await fetch(`http://localhost:5000/api/songs/${mood.id}`);
      if (!res.ok) throw new Error('Failed to fetch songs');
      const moodSongs = await res.json();
      setSongs(moodSongs);
    } catch (err) {
      setSongsError('Failed to load songs for this mood.');
      setSongs([]);
    } finally {
      setSongsLoading(false);
    }
  };

  // Prev/Next logic with shuffle and repeat
  const handlePrev = () => {
    console.log('handlePrev - playbackContext:', playbackContext);
    console.log('handlePrev - currentSongIndex:', currentSongIndex);
    console.log('handlePrev - isShuffled:', isShuffled);
    console.log('handlePrev - smartShuffleMode:', smartShuffleMode);
    const songList = getCurrentSongList();
    console.log('handlePrev - songList length:', songList.length);
    if (!songList.length) {
      console.log('handlePrev - no songs in list, returning');
      return;
    }
    
    // Handle repeat modes
    if (repeatMode === 'one') {
      // Repeat current song
      setCurrentSong(songList[currentSongIndex]);
      setIsPlaying(true);
      return;
    }
    
    const newIndex = currentSongIndex > 0 ? currentSongIndex - 1 : songList.length - 1;
    
    // For repeat 'none', allow normal navigation but don't loop
    // For repeat 'all', allow looping (newIndex will be songList.length - 1 when going from 0)
    setCurrentSong(songList[newIndex]);
    setCurrentSongIndex(newIndex);
    setIsPlaying(true);
  };

  const handleNext = () => {
    console.log('handleNext - playbackContext:', playbackContext);
    console.log('handleNext - currentSongIndex:', currentSongIndex);
    console.log('handleNext - isShuffled:', isShuffled);
    console.log('handleNext - smartShuffleMode:', smartShuffleMode);
    const songList = getCurrentSongList();
    console.log('handleNext - songList length:', songList.length);
    if (!songList.length) {
      console.log('handleNext - no songs in list, returning');
      return;
    }
    
    // Handle repeat modes
    if (repeatMode === 'one') {
      // Repeat current song
      setCurrentSong(songList[currentSongIndex]);
      setIsPlaying(true);
      return;
    }
    
    const newIndex = currentSongIndex < songList.length - 1 ? currentSongIndex + 1 : 0;
    
    // Always allow manual navigation to next song
    // Repeat mode only affects autoplay (when song ends naturally)
    setCurrentSong(songList[newIndex]);
    setCurrentSongIndex(newIndex);
    setIsPlaying(true);
  };

  const handleNextWithDelay = () => {
    console.log('handleNextWithDelay - playbackContext:', playbackContext);
    console.log('handleNextWithDelay - currentSong:', currentSong);
    console.log('handleNextWithDelay - currentSongIndex:', currentSongIndex);
    console.log('handleNextWithDelay - repeatMode:', repeatMode);
    console.log('handleNextWithDelay - smartShuffleMode:', smartShuffleMode);
    
    setTimeout(() => {
      // This is autoplay (song ended naturally), so respect repeat mode
      const songList = getCurrentSongList();
      if (!songList.length) return;
      
      // Handle repeat modes for autoplay
      if (repeatMode === 'one') {
        // Repeat current song
        setCurrentSong(songList[currentSongIndex]);
        setIsPlaying(true);
        return;
      }
      
      const newIndex = currentSongIndex < songList.length - 1 ? currentSongIndex + 1 : 0;
      
      // For repeat 'none', stop at the end (when newIndex becomes 0 and we're at the last song)
      if (newIndex === 0 && repeatMode === 'none' && currentSongIndex === songList.length - 1) {
        setIsPlaying(false);
        return;
      }
      
      // For repeat 'all', continue to next song (or loop back to first)
      setCurrentSong(songList[newIndex]);
      setCurrentSongIndex(newIndex);
      setIsPlaying(true);
    }, 1000); // 1 second delay
  };

  // Update shuffled list when playback context changes (but not when shuffle is toggled)
  useEffect(() => {
    if (isShuffled && !smartShuffleMode) {
      const currentList = getCurrentSongList();
      if (currentList.length > 0) {
        const shuffled = [...currentList].sort(() => Math.random() - 0.5);
        setShuffledSongList(shuffled);
        
        // Find the current song in the new shuffled list and update index
        if (currentSong) {
          const shuffledIndex = shuffled.findIndex(song => song.id === currentSong.id);
          if (shuffledIndex !== -1) {
            setCurrentSongIndex(shuffledIndex);
          } else {
            // If current song not found in new list, start from beginning
            setCurrentSongIndex(0);
            setCurrentSong(shuffled[0]);
          }
        }
      }
    }
  }, [playbackContext]); // Removed isShuffled dependency to prevent recreation when toggling

  // Update smart shuffle list when queue changes
  useEffect(() => {
    if (smartShuffleMode && smartShuffleQueue.length > 0) {
      refreshSmartShuffleList();
    }
  }, [smartShuffleQueue, smartShuffleMode]);

  useEffect(() => {
    const audio = globalAudioRef.current;
    if (!audio) return;
    const update = () => {
      const cur = audio.currentTime;
      const dur = audio.duration || 0;
      setAudioTime((prev) => ({
        ...prev,
        currentTime: formatTime(cur),
        duration: formatTime(dur),
        progress: dur ? (cur / dur) * 100 : 0,
        volume: audio.volume,
      }));
    };
    audio.addEventListener('timeupdate', update);
    audio.addEventListener('loadedmetadata', update);
    audio.addEventListener('volumechange', update);
    return () => {
      audio.removeEventListener('timeupdate', update);
      audio.removeEventListener('loadedmetadata', update);
      audio.removeEventListener('volumechange', update);
    };
  }, [currentSong]);

  useEffect(() => {
    if (!isSeeking && globalAudioRef.current) {
      setSeekValue(globalAudioRef.current.currentTime);
    }
  }, [audioTime.currentTime, isSeeking]);

  function formatTime(sec) {
    if (isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  // Calculate progress percent for the progress bar (blue fill)
  const progressPercent = (globalAudioRef.current && globalAudioRef.current.duration)
    ? ((isSeeking ? seekValue : globalAudioRef.current.currentTime) / globalAudioRef.current.duration) * 100
    : 0;

  // Sync mute state with audio element
  useEffect(() => {
    if (globalAudioRef.current) {
      globalAudioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Update lastVolume when volume changes and not muted
  useEffect(() => {
    if (!isMuted && globalAudioRef.current) {
      setLastVolume(globalAudioRef.current.volume);
    }
  }, [audioTime.volume, isMuted]);



  // --- API helpers ---
  const API_BASE = 'http://localhost:5000/api';
  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
  });

  const fetchPlaylists = async () => {
    const res = await fetch(`${API_BASE}/playlists`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch playlists');
    return res.json();
  };

  // --- Fetch playlists on login or app start ---
  useEffect(() => {
    if (user) {
      fetchPlaylists().then(setPlaylists).catch(() => setPlaylists([]));
      fetchLikedSongs();
      // Load Smart Shuffle data from backend
      fetchSmartShuffleQueue();
      fetchSmartShuffleHistory();
    } else {
      setPlaylists([]);
      setLikedSongs([]);
      setLikedSongIds(new Set());
      // Load Smart Shuffle data from localStorage for non-logged-in users
      const savedQueue = localStorage.getItem('smartShuffleQueue');
      const savedHistory = localStorage.getItem('smartShuffleHistory');
      
      if (savedQueue) {
        try {
          setSmartShuffleQueue(JSON.parse(savedQueue));
        } catch (e) {
          console.error('Error parsing saved queue:', e);
        }
      }
      
      if (savedHistory) {
        try {
          setSmartShuffleHistory(JSON.parse(savedHistory));
        } catch (e) {
          console.error('Error parsing saved history:', e);
        }
      }
    }
  }, [user]);

  // --- Fetch liked songs ---
  const fetchLikedSongs = async () => {
    try {
      const res = await fetch(`${API_BASE}/liked-songs`, { headers: getAuthHeaders() });
      if (res.ok) {
        const likedSongsData = await res.json();
        setLikedSongs(likedSongsData);
        setLikedSongIds(new Set(likedSongsData.map(song => song.id)));
      }
    } catch (error) {
      console.error('Failed to fetch liked songs:', error);
    }
  };

  // --- Toggle like status for a song ---
  const toggleLikeSong = async (song) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    const isLiked = likedSongIds.has(song.id);
    
    try {
      const method = isLiked ? 'DELETE' : 'POST';
      const res = await fetch(`${API_BASE}/liked-songs/${song.id}`, {
        method,
        headers: getAuthHeaders()
      });
      
      if (res.ok) {
        if (isLiked) {
          // Remove from liked songs
          setLikedSongs(prev => prev.filter(s => s.id !== song.id));
          setLikedSongIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(song.id);
            return newSet;
          });
        } else {
          // Add to liked songs
          const songWithLikedAt = {
            ...song,
            liked_at: new Date().toISOString()
          };
          setLikedSongs(prev => [songWithLikedAt, ...prev]);
          setLikedSongIds(prev => new Set([...prev, song.id]));
          setSongLikeSuccess(true);
          setTimeout(() => setSongLikeSuccess(false), 2000);
        }
        
        // Refresh playlists to update Liked Songs playlist
        await refreshPlaylists();
      }
    } catch (error) {
      console.error('Failed to toggle like status:', error);
    }
  };

  // --- Fetch all songs from backend DB for adding to playlists ---
  useEffect(() => {
    fetch('http://localhost:5000/api/songs')
      .then(res => res.json())
      .then(setAllBackendSongs)
      .catch(() => setAllBackendSongs([]));
  }, []);

  // --- Create Playlist ---
  const handleCreatePlaylist = async () => {
    let name = newPlaylistName.trim();
    if (!name) {
      const nextNum = playlists.length + 1;
      name = `Playlist ${nextNum}`;
    }
    if (playlists.some(p => p.name.toLowerCase() === name.toLowerCase())) {
      showCreatePlaylistWarning('Playlist already exists');
      return;
    }
    setIsCreatingPlaylist(true);
    setCreatePlaylistSuccess(false);
    try {
      const res = await fetch(`${API_BASE}/playlists`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ name })
      });
      if (!res.ok) throw new Error('Failed to create playlist');
      await refreshPlaylists();
      setNewPlaylistName("");
      setCreatePlaylistSuccess(true);
      setTimeout(() => setCreatePlaylistSuccess(false), 2000);
      setTimeout(() => setShowCreateModal(false), 100);
    } catch {
      showCreatePlaylistWarning('Error creating playlist');
    } finally {
      setIsCreatingPlaylist(false);
    }
  };

  // --- Delete Playlist ---
  const handleDeletePlaylist = async (id) => {
    setIsDeleting(true);
    try {
      await fetch(`${API_BASE}/playlists/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      await refreshPlaylists();
      if (selectedPlaylistId === id) setSelectedPlaylistId(null);
      setDeleteSuccess(true);
      setTimeout(() => setDeleteSuccess(false), 2000);
    } catch {}
    finally {
      setIsDeleting(false);
    }
  };

  // --- Rename Playlist ---
  const handleRenamePlaylist = async () => {
    const newName = renamePlaylistName.trim();
    if (!newName) {
      setShowRenameModal(false);
      setRenamePlaylistId(null);
      setRenamePlaylistName("");
      return;
    }
    if (playlists.some(p => p.name.toLowerCase() === newName.toLowerCase() && p.id !== renamePlaylistId)) {
      showCreatePlaylistWarning('Playlist already exists');
      return;
    }
    setIsRenaming(true);
    try {
      await fetch(`${API_BASE}/playlists/${renamePlaylistId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ name: newName })
      });
      // Update playlist in place instead of refreshing all playlists
      setPlaylists(prevPlaylists => 
        prevPlaylists.map(playlist => 
          playlist.id === renamePlaylistId 
            ? { ...playlist, name: newName }
            : playlist
        )
      );
      setShowRenameModal(false);
      setRenamePlaylistId(null);
      setRenamePlaylistName("");
      setRenameSuccess(true);
      setTimeout(() => setRenameSuccess(false), 2000);
    } catch {
      showCreatePlaylistWarning('Error renaming playlist');
    } finally {
      setIsRenaming(false);
    }
  };

  // --- Add Songs to Playlist (only update local state after backend success) ---
  const handleAddSongsToPlaylist = async () => {
    if (selectedSongsToAdd.length === 0) return;
    setIsAddingSongs(true); // Start loading
    setShowAddSongsModal(false);
    setAddSongsPlaylistId(null);
    setSelectedSongsToAdd([]);
    try {
      let limitReached = false;
      let allSuccess = true;
      await Promise.all(
        selectedSongsToAdd.map(async song => {
          const res = await fetch(`${API_BASE}/playlists/${addSongsPlaylistId}/songs`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ song_id: song.id })
          });
          if (!res.ok) {
            const data = await res.json();
            if (data.limit_reached) limitReached = true;
            allSuccess = false;
          }
        })
      );
      await refreshPlaylists();
      setAddSongsSuccess(allSuccess);
      setTimeout(() => setAddSongsSuccess(false), 2000);
      if (limitReached) setShowPremiumModal(true);
    } catch {
      setAddSongsSuccess(false);
    } finally {
      setIsAddingSongs(false); // Stop loading
    }
  };

  // --- Remove Song from Playlist ---
  const handleRemoveSongFromPlaylist = async (playlistId, songId) => {
    try {
      await fetch(`${API_BASE}/playlists/${playlistId}/songs/${songId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      await refreshPlaylists();
      setSongDeleteSuccess(true);
      setTimeout(() => setSongDeleteSuccess(false), 2000);
    } catch {}
  };

  // --- Refresh playlists helper ---
  const refreshPlaylists = async () => {
    try {
      const data = await fetchPlaylists();
      setPlaylists(data);
    } catch {
      setPlaylists([]);
    }
  };

  // Open add songs modal
  const openAddSongsModal = (playlistId) => {
    setAddSongsPlaylistId(playlistId);
    setShowAddSongsModal(true);
    setSelectedSongsToAdd([]);
  };

  // Open rename modal
  const openRenameModal = (playlistId, currentName) => {
    setRenamePlaylistId(playlistId);
    setRenamePlaylistName(currentName);
    setShowRenameModal(true);
  };

  // Static list of all available songs for adding to playlists
  const allAvailableSongs = [
    { title: 'Song 1', artist: 'Artist 1', file: 'file1.mp3' },
    { title: 'Song 2', artist: 'Artist 2', file: 'file2.mp3' },
    { title: 'Song 3', artist: 'Artist 3', file: 'file3.mp3' },
    // Add more songs or fetch from backend as needed
  ];

  // Robust unique key for each song (always unique by appending idx)
  const getSongKey = (song, idx) => [song.file, song.title, song.artist].filter(Boolean).join('||') + '||' + idx;

  // Modern contrasting colors
  const profileSidebarBg = 'bg-[#181c24]';
  const profileCardBg = 'bg-[#232a34]';
  const accentText = 'text-[#60a5fa]'; // blue-400
  const logoutText = 'text-red-500';
  const borderColor = 'border-[#2d3748]';

  // Modern mood colors
  const moodCardColors = {
    happy: 'bg-gradient-to-br from-[#232323] via-[#ffe066] to-[#ffe066]',
    sad: 'bg-gradient-to-br from-[#232323] via-[#888888] to-[#e5e7eb]', // balanced black-grey-white for sad
    energetic: 'bg-gradient-to-br from-[#232323] via-[#ff6b6b] to-[#ff6b6b]',
    calm: 'bg-gradient-to-br from-[#232323] via-[#76e4f7] to-[#76e4f7]',
    romantic: 'bg-gradient-to-br from-[#232323] via-[#ff6fa1] to-[#ff6fa1]',
    glamorous: 'bg-gradient-to-br from-[#232323] via-[#a78bfa] to-[#a78bfa]',
  };

  // Helper for mood shadow color
  function getMoodShadowColor(moodId) {
    switch (moodId) {
      case 'happy': return 'rgba(251, 191, 36, 0.7)'; // yellow-400
      case 'sad': return 'rgba(59, 130, 246, 0.7)'; // blue-500
      case 'energetic': return 'rgba(244, 63, 94, 0.7)'; // red-500
      case 'calm': return 'rgba(20, 184, 166, 0.7)'; // teal-400
      case 'romantic': return 'rgba(236, 72, 153, 0.7)'; // pink-500
      case 'glamorous': return 'rgba(139, 92, 246, 0.7)'; // purple-500
      default: return 'rgba(59, 130, 246, 0.5)';
    }
  }

  // Hero section background per mood
  const heroBgByMood = {
    happy: 'bg-gradient-to-br from-yellow-100 via-yellow-300 to-orange-200',
    sad: 'bg-gradient-to-br from-slate-800 via-blue-900 to-slate-700', // muted, moody blue/gray
    energetic: 'bg-gradient-to-br from-[#ff4500] via-[#ff8c00] to-[#ff1493]', // intense energetic
    calm: 'bg-gradient-to-br from-teal-100 via-cyan-200 to-blue-200',
    romantic: 'bg-gradient-to-br from-[#ff69b4] via-[#ff1493] to-[#dc143c]', // vibrant pink to red
    glamorous: 'bg-gradient-to-br from-[#4c1d95] via-[#581c87] to-[#1e1b4b]', // dark purple focus
  };
  const heroBgClass = selectedMood ? heroBgByMood[selectedMood.id] : 'bg-[#181c24]';

  // Mood-based text and card color themes
  const moodTextByMood = {
    happy: 'text-[#7c4a00]',
    sad: 'text-[#0a2540]',
    energetic: 'text-[#7f1d1d]',
    calm: 'text-gray-600', // soft, muted
    romantic: 'text-rose-100', // light for contrast
    glamorous: 'text-white', // clean white for focus
  };
  const moodCardBgByMood = {
    happy: 'bg-white/80',
    sad: 'bg-white/80',
    energetic: 'bg-white/80',
    calm: 'bg-white/80',
    romantic: 'bg-white/80',
    glamorous: 'bg-white/80',
  };
  const mainBgClass = selectedMood ? heroBgByMood[selectedMood.id] : 'bg-[#181c24]';
  const mainTextClass = selectedMood ? moodTextByMood[selectedMood.id] : 'text-white';
  const cardBgClass = selectedMood ? moodCardBgByMood[selectedMood.id] : 'bg-[#232a34]';

  // Helper for mood tint color (for whitish overlay)
  function getMoodTintColor(moodId) {
    switch (moodId) {
      case 'happy': return 'rgba(255, 243, 207, 0.8)';
      case 'sad': return 'rgba(207, 226, 255, 0.8)';
      case 'energetic': return 'rgba(255, 220, 220, 0.8)';
      case 'calm': return 'linear-gradient(135deg, #a7c7e7 0%, #b2f7ef 100%)'; // new premium gradient
      case 'romantic': return 'rgba(243, 207, 255, 0.8)';
      case 'glamorous': return 'rgba(220, 207, 255, 0.8)';
      default: return 'rgba(255,255,255,0.8)';
    }
  }

  // Hero heading/subheading color per mood
  const heroHeadingColorByMood = {
    happy: 'text-[#7c4a00]',
    sad: 'text-slate-200', // soft, subdued for sad
    energetic: 'text-white', // bold white for contrast
    calm: 'text-gray-600', // soft, muted
    romantic: 'text-rose-100', // light for contrast
    glamorous: 'text-white', // clean white for focus
  };
  const heroHeadingClass = selectedMood ? heroHeadingColorByMood[selectedMood.id] : 'text-white';

  // Mood-specific expressive headings
  const moodHeadings = {
    happy: 'Feeling the Joy! 😃',
    sad: "It's okay to feel blue. 😢",
    energetic: "Let's turn up the energy! ⚡",
    calm: 'Time to unwind. 🌙',
    romantic: 'Love is in the air. ❤️',
    glamorous: "Let's get in the zone. 🎧",
  };
  const genericSubheading = 'Here\'s a playlist to match your mood.';

  // Minimal, premium heading icons for each mood
  const moodHeadingIcons = {
    happy: '●',      // solid circle, minimal
    sad: '▬',        // horizontal bar, subtle
    energetic: '▲',  // triangle, dynamic
    calm: '◦',       // hollow circle, gentle
    romantic: '❤️',  // heart, as requested
    glamorous: '◆',      // diamond, focus/clarity
  };

  // Add a mapping from mood id to gradient CSS for hero backgrounds
  const moodHeroGradients = {
    happy: 'linear-gradient(135deg, #18181b 30%, #ffe066 100%)',
    sad: 'linear-gradient(135deg, #18181b 30%, #e5e7eb 100%)', // black to light grey
    energetic: 'linear-gradient(135deg, #18181b 30%, #ff6b6b 100%)',
    calm: 'linear-gradient(135deg, #18181b 30%, #76e4f7 100%)',
    romantic: 'linear-gradient(135deg, #18181b 30%, #ff6fa1 100%)',
    glamorous: 'linear-gradient(135deg, #18181b 30%, #a78bfa 100%)',
  };

  // Update createPlaylistWarning logic to auto-hide after 2 seconds
  const showCreatePlaylistWarning = (msg) => {
    setCreatePlaylistWarning(msg);
    setTimeout(() => setCreatePlaylistWarning(''), 2000);
  };

  // Helper to determine if a mood is bright or dark for contrast
  const brightMoods = ['happy', 'energetic', 'romantic', 'calm'];
  const isBrightMood = selectedMood && brightMoods.includes(selectedMood.id);

  // Song card color mapping by mood
  const songCardColors = {
    happy: '#ffd600',      // joyful, modern yellow
    sad: '#181818',        // modern dark black
    energetic: '#b34700',  // modern orange
    calm: '#14575c',       // dark ocean/green
    romantic: '#FF0B55',   // modern red/pink
    glamorous: '#22356f',      // dark blue
  };

  // Remove autoPlay from <audio> and add useEffect for playback control
  useEffect(() => {
    if (globalAudioRef.current) {
      if (isPlaying) {
        globalAudioRef.current.play();
      } else {
        globalAudioRef.current.pause();
      }
    }
  }, [isPlaying, currentSong]);

  useEffect(() => {
    console.log('currentSong changed:', currentSong);
    if (currentSong) {
      addToRecentlyPlayed(currentSong);
    }
  }, [currentSong]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResults({ songs: [], playlists: [] });
      setSearchSelectedSong(null);
      return;
    }
    const query = searchQuery.toLowerCase();
    // Prefix match for songs
    const filteredSongs = allBackendSongs.filter(song =>
      song.title.toLowerCase().startsWith(query) ||
      (song.artist && song.artist.toLowerCase().startsWith(query))
    );
    // Prefix match for playlists
    const filteredPlaylists = playlists.filter(playlist =>
      playlist.name.toLowerCase().startsWith(query)
    );
    setSearchResults({ songs: filteredSongs, playlists: filteredPlaylists });
  }, [searchQuery, allBackendSongs, playlists]);

  // Memoized RecentlyPlayedDropdown
  const RecentlyPlayedDropdown = React.memo(
    ({ anchorRef, recentlyPlayed, moodIconColors, onClose, playerBarHeight = 104 }) => {
      const [style, setStyle] = useState({});
      useEffect(() => {
        function updateStyle() {
          if (window.innerWidth < 600 && anchorRef.current) {
            const rect = anchorRef.current.getBoundingClientRect();
            setStyle({
              position: 'fixed',
              left: rect.left,
              top: rect.bottom + 4,
              width: rect.width,
              zIndex: 2147483647,
              minWidth: 0,
              maxWidth: rect.width,
              maxHeight: '30vh', // reduced from 60vh
              background: '#282828',
              border: '2px solid #ff00ff', // or #00ffff for SearchResultsDropdown
              borderRadius: '0.75rem',
              boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
              overflowY: 'auto',
            });
          } else if (anchorRef.current) {
            const rect = anchorRef.current.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const maxHeight = Math.max(120, viewportHeight - rect.bottom - playerBarHeight - 16);
            setStyle({
              position: 'fixed',
              left: rect.left,
              top: rect.bottom + 4,
              width: rect.width,
              zIndex: 10000,
              minWidth: 350,
              maxWidth: 500,
              maxHeight,
              background: '#282828',
              border: '1px solid #404040',
              borderRadius: '0.75rem',
              boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
              overflowY: 'auto',
            });
          }
        }
        updateStyle();
        window.addEventListener('resize', updateStyle);
        return () => window.removeEventListener('resize', updateStyle);
      }, [anchorRef, playerBarHeight]);
      // Always render on mobile for debug
      if (window.innerWidth < 600) {
        return ReactDOM.createPortal(
          <div style={style} data-recently-played>
            <div className="p-4">
              <div className="text-pink-400 font-bold mb-2">[DEBUG] Mobile Dropdown Rendered</div>
              <h3 className="text-lg font-semibold mb-3 text-white">Recently Played</h3>
              <div className="space-y-2">
                {recentlyPlayed.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-[#333333] transition-colors cursor-pointer group"
                  >
                    <div className={`${moodIconColors[item.mood] || 'bg-gray-400'} w-10 h-10 rounded-lg flex items-center justify-center`}>
                      <span className="text-white font-bold text-sm">🎵</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-white group-hover:text-blue-400 transition-colors truncate">
                        {item.title}
                      </h4>
                      <p className="text-sm text-gray-400">
                        {item.artist} • {item.mood}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>,
          getDropdownRoot()
        );
      }
      // Desktop logic
      if (!anchorRef.current || !style.width || !style.top) return null;
      return ReactDOM.createPortal(
        <div style={style} data-recently-played>
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-3 text-white">Recently Played</h3>
            <div className="space-y-2">
              {recentlyPlayed.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-[#333333] transition-colors cursor-pointer group"
                >
                  <div className={`${moodIconColors[item.mood] || 'bg-gray-400'} w-10 h-10 rounded-lg flex items-center justify-center`}>
                    <span className="text-white font-bold text-sm">🎵</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-white group-hover:text-blue-400 transition-colors truncate">
                      {item.title}
                    </h4>
                    <p className="text-sm text-gray-400">
                      {item.artist} • {item.mood}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>,
        getDropdownRoot()
      );
    },
    (prev, next) =>
      prev.anchorRef === next.anchorRef &&
      prev.recentlyPlayed === next.recentlyPlayed &&
      prev.moodIconColors === next.moodIconColors &&
      prev.onClose === next.onClose
  );

  // Memoized SearchResultsDropdown
  const SearchResultsDropdown = React.memo(
    ({ anchorRef, results, moodIconColors, onSongSelect, onPlaylistSelect, selectedSong, dropdownRef, playerBarHeight = 104, user }) => {
      const [style, setStyle] = useState({});
      useEffect(() => {
        function updateStyle() {
          if (window.innerWidth < 600 && anchorRef.current) {
            const rect = anchorRef.current.getBoundingClientRect();
            setStyle({
              position: 'fixed',
              left: rect.left,
              top: rect.bottom + 4,
              width: rect.width,
              zIndex: 2147483647,
              minWidth: 0,
              maxWidth: rect.width,
              maxHeight: '30vh', // reduced from 60vh
              background: '#282828',
              border: '2px solid #00ffff', // or #ff00ff for SearchResultsDropdown
              borderRadius: '0.75rem',
              boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
              overflowY: 'auto',
            });
          } else if (anchorRef.current) {
            const rect = anchorRef.current.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const maxHeight = Math.max(120, viewportHeight - rect.bottom - playerBarHeight - 16);
            setStyle({
              position: 'fixed',
              left: rect.left,
              top: rect.bottom + 4,
              width: rect.width,
              zIndex: 10000,
              minWidth: 350,
              maxWidth: 500,
              maxHeight,
              background: '#282828',
              border: '1px solid #404040',
              borderRadius: '0.75rem',
              boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
              overflowY: 'auto',
            });
          }
        }
        updateStyle();
        window.addEventListener('resize', updateStyle);
        return () => window.removeEventListener('resize', updateStyle);
      }, [anchorRef, playerBarHeight]);
      // Always render on mobile for debug
      if (window.innerWidth < 600) {
        return ReactDOM.createPortal(
          <div style={style} ref={dropdownRef} data-search-results>
            <div className="p-4">
              <div className="text-cyan-400 font-bold mb-2">[DEBUG] Mobile Dropdown Rendered</div>
              {results.songs.length > 0 && (
                <>
                  <h3 className="text-lg font-semibold mb-2 text-white">Songs</h3>
                  <div className="space-y-2 mb-4">
                    {results.songs.map((item) => (
                      <div
                        key={item.id}
                        className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer group transition-colors ${selectedSong && selectedSong.id === item.id ? 'bg-blue-900' : 'hover:bg-[#333333]'}`}
                        onClick={() => onSongSelect(item)}
                      >
                        <div className={`${moodIconColors[item.mood] || 'bg-gray-400'} w-10 h-10 rounded-lg flex items-center justify-center`}>
                          <span className="text-white font-bold text-sm">🎵</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-white group-hover:text-blue-400 transition-colors truncate">{item.title}</h4>
                          <p className="text-sm text-gray-400">{item.artist} • {item.mood}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
              {results.playlists.length > 0 && (
                <>
                  <h3 className="text-lg font-semibold mb-2 text-white">Playlists</h3>
                  {!user && (
                    <div className="mb-3 p-2 bg-yellow-900/20 border border-yellow-600/30 rounded-lg">
                      <p className="text-yellow-400 text-sm">Login to access playlists</p>
                    </div>
                  )}
                  <div className="space-y-2">
                    {results.playlists.map((playlist) => (
                      <div
                        key={playlist.id}
                        className="flex items-center space-x-3 p-2 rounded-lg cursor-pointer group hover:bg-[#333333] transition-colors"
                        onClick={() => onPlaylistSelect(playlist)}
                      >
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-neutral-700">
                          <span className="text-white font-bold text-sm">📁</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-white group-hover:text-blue-400 transition-colors truncate">{playlist.name}</h4>
                          <p className="text-sm text-gray-400">{playlist.songs?.length || 0} songs</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
              {results.songs.length === 0 && results.playlists.length === 0 && (
                <div className="text-gray-400 text-center py-8">
                  No songs or playlists found.
                </div>
              )}
            </div>
          </div>,
          getDropdownRoot()
        );
      }
      // Desktop logic
      if (!anchorRef.current || !style.width || !style.top) return null;
      return ReactDOM.createPortal(
        <div style={style} ref={dropdownRef} data-search-results>
          <div className="p-4">
            {results.songs.length > 0 && (
              <>
                <h3 className="text-lg font-semibold mb-2 text-white">Songs</h3>
                <div className="space-y-2 mb-4">
                  {results.songs.map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer group transition-colors ${selectedSong && selectedSong.id === item.id ? 'bg-blue-900' : 'hover:bg-[#333333]'}`}
                      onClick={() => onSongSelect(item)}
                    >
                      <div className={`${moodIconColors[item.mood] || 'bg-gray-400'} w-10 h-10 rounded-lg flex items-center justify-center`}>
                        <span className="text-white font-bold text-sm">🎵</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-white group-hover:text-blue-400 transition-colors truncate">{item.title}</h4>
                        <p className="text-sm text-gray-400">{item.artist} • {item.mood}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
            {results.playlists.length > 0 && (
              <>
                <h3 className="text-lg font-semibold mb-2 text-white">Playlists</h3>
                {!user && (
                  <div className="mb-3 p-2 bg-yellow-900/20 border border-yellow-600/30 rounded-lg">
                    <p className="text-yellow-400 text-sm">Login to access playlists</p>
                  </div>
                )}
                <div className="space-y-2">
                  {results.playlists.map((playlist) => (
                    <div
                      key={playlist.id}
                      className="flex items-center space-x-3 p-2 rounded-lg cursor-pointer group hover:bg-[#333333] transition-colors"
                      onClick={() => onPlaylistSelect(playlist)}
                    >
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-neutral-700">
                        <span className="text-white font-bold text-sm">📁</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-white group-hover:text-blue-400 transition-colors truncate">{playlist.name}</h4>
                        <p className="text-sm text-gray-400">{playlist.songs?.length || 0} songs</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
            {results.songs.length === 0 && results.playlists.length === 0 && (
              <div className="text-gray-400 text-center py-8">
                No songs or playlists found.
              </div>
            )}
          </div>
        </div>,
        getDropdownRoot()
      );
    },
    (prev, next) =>
      prev.anchorRef === next.anchorRef &&
      prev.results === next.results &&
      prev.moodIconColors === next.moodIconColors &&
      prev.onSongSelect === next.onSongSelect &&
      prev.onPlaylistSelect === next.onPlaylistSelect &&
      prev.selectedSong === next.selectedSong &&
      prev.dropdownRef === next.dropdownRef &&
      prev.user === next.user
  );

  // Memoize moodIconColors and results before passing to dropdowns
  const memoMoodIconColors = useMemo(() => moodIconColors, [moodIconColors]);
  const memoSearchResults = useMemo(() => searchResults, [searchResults]);
  const memoRecentlyPlayed = useMemo(() => recentlyPlayed, [recentlyPlayed]);
  const memoOnSongSelect = useCallback((song) => {
    // For search results: Use search results songs list for prev/next navigation
    const searchSongs = searchResults.songs || [];
    const songIndex = searchSongs.findIndex(s => s.id === song.id);
    // Set playback context to search results so prev/next work
    setPlaybackContext({ type: 'search', id: null, songs: searchSongs });
    // Play the song - don't change page/mood/songs displayed
    handlePlaySong(song, songIndex >= 0 ? songIndex : 0);
    // Close search dropdown after selection
    setSearchSelectedSong(song);
    setIsSearchFocused(false);
    setSearchQuery('');
  }, [searchResults.songs, handlePlaySong]);
  const memoOnPlaylistSelect = useCallback((playlist) => {
    if (!user) {
      // Show login prompt for non-logged-in users trying to access playlists
      setShowAuthModal(true);
      setSearchQuery('');
      setIsSearchFocused(false);
      return;
    }
    setSelectedPlaylistId(playlist.id);
    setCurrentPage('playlist');
    setSearchQuery('');
    setIsSearchFocused(false);
  }, [user]);

  // Replace single searchInputRef with two refs
  const searchInputRefMobile = useRef(null);
  const searchInputRefDesktop = useRef(null);

  // Helper to get the correct ref for dropdowns
  function getActiveSearchInputRef() {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return searchInputRefMobile;
    } else {
      return searchInputRefDesktop;
    }
  }

  // Click-away handler for search dropdown
  useEffect(() => {
    if (!isSearchFocused) return;
    function handleClick(event) {
      // Check if click is on search input or dropdown
      const isOnSearchInput = getActiveSearchInputRef().current && getActiveSearchInputRef().current.contains(event.target);
      const isOnSearchDropdown = event.target.closest('[data-search-results]');
      const isOnRecentlyPlayedDropdown = event.target.closest('[data-recently-played]');
      
      // Only close if click is outside all search-related elements
      if (!isOnSearchInput && !isOnSearchDropdown && !isOnRecentlyPlayedDropdown) {
        setIsSearchFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isSearchFocused]);

  // Play song from dropdown (recent songs or search results) without changing the page/mood
  // User stays on whatever page they were on, only the player bar changes
  // BUT we need to set playback context so prev/next buttons work
  const playSongFromDropdown = useCallback(async (song) => {
    console.log('playSongFromDropdown called with:', song.title, 'dropdown.type:', dropdown.type);
    console.log('Current mood:', selectedMood?.id, 'Current page:', currentPage);
    
    if (dropdown.type === 'recentlyPlayed') {
      // For recently played: Use recently played list for prev/next navigation
      const songIndex = recentlyPlayed.findIndex(s => s.id === song.id);
      // Set playback context to recently played list so prev/next work
      setPlaybackContext({ type: 'recent', id: null, songs: recentlyPlayed });
      // Play the song - don't change page/mood/songs displayed
      handlePlaySong(song, songIndex >= 0 ? songIndex : 0);
    } else if (dropdown.type === 'searchResults') {
      // For search results: Use search results songs list for prev/next navigation
      const searchSongs = searchResults.songs || [];
      const songIndex = searchSongs.findIndex(s => s.id === song.id);
      // Set playback context to search results so prev/next work
      setPlaybackContext({ type: 'search', id: null, songs: searchSongs });
      // Play the song - don't change page/mood/songs displayed
      handlePlaySong(song, songIndex >= 0 ? songIndex : 0);
    } else {
      // Fallback: Try to find song in current list
      const currentSongs = songs.length > 0 ? songs : getCurrentSongList();
      const songIndex = currentSongs.findIndex(s => s.id === song.id);
      handlePlaySong(song, songIndex >= 0 ? songIndex : 0);
    }
    
    // Don't change selectedMood, currentPage, or songs (what's displayed on page)
    // This ensures the user stays on whatever page they were on
    // But playback context is updated so prev/next buttons work correctly
  }, [dropdown.type, recentlyPlayed, searchResults, handlePlaySong, songs, selectedMood, currentPage]);

  // In useEffect, pass playSongFromDropdown as onPlaySong and onSongSelect
  useEffect(() => {
    if (isInputFocused) {
      if (searchQuery === '') {
        // Show recently played only for logged-in users
        if (user) {
        if (
          dropdown.type !== 'recentlyPlayed' ||
          dropdown.data !== recentlyPlayed
        ) {
          showDropdown('recentlyPlayed', getActiveSearchInputRef(), recentlyPlayed, { moodIconColors, onPlaySong: playSongFromDropdown });
        }
      } else {
          // Hide dropdown for non-logged-in users when search is empty
          if (dropdown.type) {
            hideDropdown();
          }
        }
      } else {
        // Show search results for all users (logged-in or not)
        if (
          dropdown.type !== 'searchResults' ||
          dropdown.data?.results !== searchResults
        ) {
          showDropdown(
            'searchResults',
            getActiveSearchInputRef(),
            { results: searchResults, moodIconColors, searchSelectedSong, searchDropdownRef },
            {
              onSongSelect: playSongFromDropdown,
              onPlaylistSelect: memoOnPlaylistSelect
            }
          );
        }
      }
    } else {
      if (dropdown.type) {
        hideDropdown();
      }
    }
  }, [
    searchQuery,
    searchResults,
    recentlyPlayed,
    user,
    searchSelectedSong,
    moodIconColors,
    showDropdown,
    memoOnSongSelect,
    memoOnPlaylistSelect,
    dropdown,
    isInputFocused,
    hideDropdown,
    handlePlaySong,
    allBackendSongs,
    playSongFromDropdown
  ]);

  // Click-away handler for mood dropdown
  useEffect(() => {
    if (!showMoodDropdown) return;
    function handleMoodDropdownClick(event) {
      const moodDropdownButton = event.target.closest('button');
      const moodDropdownMenu = event.target.closest('.mt-2.ml-4.bg-black');
      
      if (!moodDropdownButton && !moodDropdownMenu) {
        setShowMoodDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleMoodDropdownClick);
    return () => document.removeEventListener('mousedown', handleMoodDropdownClick);
  }, [showMoodDropdown]);

  // Click-away handler for playlist menus
  useEffect(() => {
    if (!playlistMenuOpen) return;
    function handlePlaylistMenuClick(event) {
      // If click is outside both the menu and the three-dot button, close
      if (
        playlistMenuRef.current &&
        !playlistMenuRef.current.contains(event.target) &&
        !event.target.closest('.text-gray-400') // three-dot button
      ) {
        setPlaylistMenuOpen(null);
      }
    }
    document.addEventListener('mousedown', handlePlaylistMenuClick);
    return () => document.removeEventListener('mousedown', handlePlaylistMenuClick);
  }, [playlistMenuOpen]);

  // 2. Handler to add current song to selected playlist
  const handleAddCurrentSongToPlaylist = async () => {
    if (!selectedPlaylistForAdd || !currentSong) return;
    setAddToPlaylistError('');
    try {
      const res = await fetch(`${API_BASE}/playlists/${selectedPlaylistForAdd}/songs`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ song_id: currentSong.id })
      });
      if (res.ok) {
        setAddToPlaylistSuccess(true);
        setTimeout(() => {
          setShowAddToPlaylistModal(false);
          // Reset all modal state
          setAddToPlaylistSuccess(false);
          setSelectedPlaylistForAdd(null);
          setAddToPlaylistError('');
        }, 1000);
        await refreshPlaylists();
      } else {
        const data = await res.json();
        setAddToPlaylistError(data.error || 'Failed to add song');
        if (data.limit_reached) setShowPremiumModal(true);
      }
    } catch {
      setAddToPlaylistError('Failed to add song');
    }
  };

  // 3. Shuffle and Repeat functions
  const toggleShuffle = () => {
    const newShuffleState = !isShuffled;
    setIsShuffled(newShuffleState);
    
    if (newShuffleState) {
      // Turn shuffle on - create shuffled list
      const currentList = getCurrentSongList();
      if (currentList.length > 0) {
        const shuffled = [...currentList].sort(() => Math.random() - 0.5);
        setShuffledSongList(shuffled);
        
        // Find the current song in the shuffled list and update index
        if (currentSong) {
          const shuffledIndex = shuffled.findIndex(song => song.id === currentSong.id);
          if (shuffledIndex !== -1) {
            setCurrentSongIndex(shuffledIndex);
          } else {
            // If current song not found in new list, start from beginning
            setCurrentSongIndex(0);
            setCurrentSong(shuffled[0]);
          }
        }
      }
    } else {
      // Turn shuffle off - find current song in original list and update index
      if (currentSong) {
        const originalList = getCurrentSongList();
        const originalIndex = originalList.findIndex(song => song.id === currentSong.id);
        if (originalIndex !== -1) {
          setCurrentSongIndex(originalIndex);
        }
      }
      setShuffledSongList([]);
    }
  };

  const toggleRepeat = () => {
    const modes = ['none', 'one', 'all'];
    const currentIndex = modes.indexOf(repeatMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setRepeatMode(modes[nextIndex]);
  };

  // Smart Shuffle API Functions
  const fetchSmartShuffleQueue = async () => {
    if (!user) return;
    try {
      const response = await fetch('http://localhost:5000/api/smart-shuffle/queue', {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const queueData = await response.json();
        setSmartShuffleQueue(queueData);
        // Update smart shuffle list if mode is active
        if (smartShuffleMode && queueData.length > 0) {
          const smartShuffled = createSmartShuffleList(queueData);
          setSmartShuffleList(smartShuffled);
        }
      }
    } catch (error) {
      console.error('Error fetching smart shuffle queue:', error);
    }
  };

  const fetchSmartShuffleHistory = async () => {
    if (!user) return;
    try {
      const response = await fetch('http://localhost:5000/api/smart-shuffle/history', {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const historyData = await response.json();
        setSmartShuffleHistory(historyData);
      }
    } catch (error) {
      console.error('Error fetching smart shuffle history:', error);
    }
  };

  const addToSmartShuffleAPI = async (song) => {
    if (!user) return;
    try {
      const response = await fetch('http://localhost:5000/api/smart-shuffle/queue', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ song_id: song.id })
      });
      if (response.ok) {
        // Refresh queue from backend
        await fetchSmartShuffleQueue();
      } else {
        const errorData = await response.json();
        if (errorData.limit_reached) {
          // Show premium upgrade modal
          setShowPremiumModal(true);
        } else if (errorData.error === 'Song already in queue') {
          // Optionally show a toast: 'Song already in Smart Shuffle queue'
        } else {
          alert(errorData.error || 'Error adding song to smart shuffle queue');
        }
      }
    } catch (error) {
      alert('Network error adding song to smart shuffle queue');
    }
  };

  const removeFromSmartShuffleAPI = async (songId) => {
    if (!user) return;
    try {
      const response = await fetch(`http://localhost:5000/api/smart-shuffle/queue/${songId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (response.ok) {
        // Refresh queue from backend
        await fetchSmartShuffleQueue();
      } else {
        // Show a toast or message, but don't break UI
        const data = await response.json();
        alert(data.error || 'Error removing song from smart shuffle queue');
      }
    } catch (error) {
      alert('Network error removing song from smart shuffle queue');
    }
  };

  const clearSmartShuffleQueueAPI = async () => {
    if (!user) return;
    try {
      const response = await fetch('http://localhost:5000/api/smart-shuffle/queue', {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (response.ok) {
        setSmartShuffleQueue([]);
        setSmartShuffleList([]);
      } else {
        console.error('Error clearing smart shuffle queue');
      }
    } catch (error) {
      console.error('Error clearing smart shuffle queue:', error);
    }
  };

  const addToSmartShuffleHistoryAPI = async (song) => {
    if (!user) return;
    try {
      const response = await fetch('http://localhost:5000/api/smart-shuffle/history', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ song_id: song.id })
      });
      if (response.ok) {
        // Refresh history from backend
        await fetchSmartShuffleHistory();
      }
    } catch (error) {
      console.error('Error adding song to smart shuffle history:', error);
    }
  };

  // Premium functions
  const upgradeToPremium = async () => {
    if (!user) return;
    try {
      const response = await fetch('http://localhost:5000/api/premium/upgrade', {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setShowPremiumModal(false);
        // Always refresh user profile, and let fetchUserProfile set isPremium
        await fetchUserProfile(localStorage.getItem('authToken'));
      }
    } catch (error) {
      console.error('Error upgrading to premium:', error);
    }
  };

  // Smart Shuffle Functions
  const toggleSmartShuffle = () => {
    const newSmartShuffleMode = !smartShuffleMode;
    setSmartShuffleMode(newSmartShuffleMode);
    
    if (newSmartShuffleMode) {
      // Always use smartShuffleQueue when enabling smart shuffle
      if (smartShuffleQueue.length > 0) {
        const smartShuffled = createSmartShuffleList(smartShuffleQueue);
        setSmartShuffleList(smartShuffled);
        
        // Find current song in smart shuffle list
        if (currentSong) {
          const smartIndex = smartShuffled.findIndex(song => song.id === currentSong.id);
          if (smartIndex !== -1) {
            setCurrentSongIndex(smartIndex);
          } else {
            // If current song not in list, start from beginning
            setCurrentSongIndex(0);
            setCurrentSong(smartShuffled[0]);
          }
        } else {
          // No current song, start from beginning
          setCurrentSongIndex(0);
          setCurrentSong(smartShuffled[0]);
        }
      } else {
        // If no songs in queue, try to use current context
        const currentList = getCurrentSongList();
        if (currentList.length > 0) {
          const smartShuffled = createSmartShuffleList(currentList);
          setSmartShuffleList(smartShuffled);
          
          // Find current song in smart shuffle list
          if (currentSong) {
            const smartIndex = smartShuffled.findIndex(song => song.id === currentSong.id);
            if (smartIndex !== -1) {
              setCurrentSongIndex(smartIndex);
            } else {
              setCurrentSongIndex(0);
              setCurrentSong(smartShuffled[0]);
            }
          } else {
            setCurrentSongIndex(0);
            setCurrentSong(smartShuffled[0]);
          }
        }
      }
    } else {
      // Return to normal playback
      if (currentSong) {
        const originalList = getCurrentSongList();
        const originalIndex = originalList.findIndex(song => song.id === currentSong.id);
        if (originalIndex !== -1) {
          setCurrentSongIndex(originalIndex);
        }
      }
      setSmartShuffleList([]);
    }
  };

  const createSmartShuffleList = (songList) => {
    // Create a smart shuffle that avoids recently played songs
    const recentSongIds = new Set(smartShuffleHistory.slice(-10).map(song => song.id));
    const notRecentlyPlayed = songList.filter(song => !recentSongIds.has(song.id));
    const recentlyPlayed = songList.filter(song => recentSongIds.has(song.id));
    
    // Shuffle not recently played songs first, then recently played
    const shuffledNotRecent = [...notRecentlyPlayed].sort(() => Math.random() - 0.5);
    const shuffledRecent = [...recentlyPlayed].sort(() => Math.random() - 0.5);
    
    return [...shuffledNotRecent, ...shuffledRecent];
  };

  // --- Add to Smart Shuffle (only update local state after backend success) ---
  const addToSmartShuffle = async (song) => {
    // Set loading state for this specific song
    setSmartShuffleLoading(prev => ({ ...prev, [song.id]: true }));
    
    if (!user) {
      // For non-logged-in users, use localStorage as before
      setSmartShuffleQueue(prev => {
        const newQueue = [...prev, song];
        if (newQueue.length > 0) {
          const newSmartShuffled = createSmartShuffleList(newQueue);
          setSmartShuffleList(newSmartShuffled);
        }
        localStorage.setItem('smartShuffleQueue', JSON.stringify(newQueue));
        return newQueue;
      });
      // Clear loading state
      setSmartShuffleLoading(prev => ({ ...prev, [song.id]: false }));
      return;
    }
    // For logged-in users, only update state after backend confirms
    try {
      const response = await fetch('http://localhost:5000/api/smart-shuffle/queue', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ song_id: song.id })
      });
      if (response.ok) {
        await fetchSmartShuffleQueue(); // Refresh from backend
      } else {
        const errorData = await response.json();
        if (errorData.limit_reached) {
          setShowPremiumModal(true);
        } else if (errorData.error === 'Song already in queue') {
          // Optionally show a toast
        } else {
          alert(errorData.error || 'Error adding song to smart shuffle queue');
        }
      }
    } catch (error) {
      alert('Network error adding song to smart shuffle queue');
    } finally {
      // Clear loading state
      setSmartShuffleLoading(prev => ({ ...prev, [song.id]: false }));
    }
  };

  const removeFromSmartShuffle = (songId) => {
    // Set loading state for this specific song
    setSmartShuffleLoading(prev => ({ ...prev, [songId]: true }));
    
    // Always use local state first for immediate feedback
    setSmartShuffleQueue(prev => {
      const newQueue = prev.filter(song => song.id !== songId);
      if (newQueue.length > 0) {
        const newSmartShuffled = createSmartShuffleList(newQueue);
        setSmartShuffleList(newSmartShuffled);
      } else {
        setSmartShuffleList([]);
      }
      
      // Save to localStorage for non-logged-in users
      if (!user) {
        localStorage.setItem('smartShuffleQueue', JSON.stringify(newQueue));
        // Clear loading state for non-logged-in users
        setSmartShuffleLoading(prev => ({ ...prev, [songId]: false }));
      }
      
      return newQueue;
    });

    // Then sync to backend if user is logged in (debounced)
    if (user) {
      setTimeout(async () => {
        try {
          await removeFromSmartShuffleAPI(songId);
        } finally {
          // Clear loading state
          setSmartShuffleLoading(prev => ({ ...prev, [songId]: false }));
        }
      }, 1000);
    }
  };

  const updateSmartShuffleHistory = (song) => {
    if (user) {
      // Use API for logged-in users
      addToSmartShuffleHistoryAPI(song);
    } else {
      // Use local state for non-logged-in users
      setSmartShuffleHistory(prev => {
        const newHistory = [...prev, song];
        // Keep only last 50 songs in history
        return newHistory.slice(-50);
      });
    }
  };

  // Function to refresh smart shuffle list from queue
  const refreshSmartShuffleList = () => {
    if (smartShuffleQueue.length > 0) {
      const newSmartShuffled = createSmartShuffleList(smartShuffleQueue);
      setSmartShuffleList(newSmartShuffled);
      
      // Update current song index if needed
      if (currentSong && smartShuffleMode) {
        const smartIndex = newSmartShuffled.findIndex(song => song.id === currentSong.id);
        if (smartIndex !== -1) {
          setCurrentSongIndex(smartIndex);
        }
      }
    } else {
      setSmartShuffleList([]);
    }
  };

  const getRepeatIcon = () => {
    switch (repeatMode) {
      case 'one':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17V7h2v7.17l3.59-3.58L17 12l-5 5z"/>
          </svg>
        );
      case 'all':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/>
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/>
          </svg>
        );
    }
  };

  const moodDropdownButtonRef = useRef(null);
  const [moodDropdownStyle, setMoodDropdownStyle] = useState({});

  useEffect(() => {
    function updateMoodDropdownStyle() {
      if (showMoodDropdown && moodDropdownButtonRef.current) {
        const rect = moodDropdownButtonRef.current.getBoundingClientRect();
        setMoodDropdownStyle({
          position: 'fixed',
          left: rect.left,
          top: rect.bottom + 4,
          width: rect.width || 260,
          zIndex: 10000,
          minWidth: 240,
        });
      }
    }
    updateMoodDropdownStyle();
    window.addEventListener('resize', updateMoodDropdownStyle);
    return () => window.removeEventListener('resize', updateMoodDropdownStyle);
  }, [showMoodDropdown]);

  // Shining background gradients for each mood
  const shiningBgByMood = {
    happy: `linear-gradient(135deg, #18181b 40%, #ffe066 100%)`,
    sad: `linear-gradient(135deg, #18181b 40%, #e5e7eb 100%)`,
    energetic: `linear-gradient(135deg, #18181b 40%, #ff6b6b 100%)`,
    calm: `linear-gradient(135deg, #18181b 40%, #76e4f7 100%)`,
    romantic: `linear-gradient(135deg, #18181b 40%, #ff6fa1 100%)`,
    glamorous: `linear-gradient(135deg, #18181b 40%, #a78bfa 100%)`,
  };

  {/*const [isScreenFocused, setIsScreenFocused] = useState(document.visibilityState === 'visible');
  useEffect(() => {
    function handleVisibilityChange() {
      setIsScreenFocused(document.visibilityState === 'visible');
    }
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);*/}

  // Ref for main content scrollable div
  const mainContentRef = useRef(null);

  // --- MOBILE HEADER ---
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileMoodDropdownOpen, setMobileMoodDropdownOpen] = useState(false);
  const mobileMenuRef = useRef(null);
  const hamburgerRef = useRef(null);
  const mobileMoodDropdownRef = useRef(null);

  // Click-away for mobile menu
  useEffect(() => {
    if (!mobileMenuOpen) return;
    function handleClick(event) {
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target)
        && (!hamburgerRef.current || !hamburgerRef.current.contains(event.target))
      ) {
        setMobileMenuOpen(false);
        setMobileMoodDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [mobileMenuOpen]);

  // Click-away for mobile mood dropdown
  useEffect(() => {
    if (!mobileMoodDropdownOpen) return;
    function handleClick(event) {
      if (
        mobileMoodDropdownRef.current &&
        !mobileMoodDropdownRef.current.contains(event.target)
      ) {
        setMobileMoodDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [mobileMoodDropdownOpen]);

  // Add this near the other refs at the top of Home
  const searchDropdownRef = useRef(null);

  // Add at the top of Home component state:
  const [showMobileLibrary, setShowMobileLibrary] = useState(false);

  // Add this function inside the Home component, before the return:
  function handleCreatePlaylistClick() {
    if (!user) {
      showCreatePlaylistWarning('Please login first.');
    } else {
      setShowCreateModal(true);
      setCreatePlaylistWarning('');
    }
  }

  // Add a ref for the playlist menu (for mobile menu click-away)
  const playlistMenuRef = useRef(null);

  // Add after all useState declarations, before return
  useEffect(() => {
    // Close song details when navigating to a new main page
    setSelectedSongDetails(null);
  }, [currentPage, selectedMood?.id, selectedPlaylistId]);

  useEffect(() => {
    // If a new song is selected, update the details card if open
    if (selectedSongDetails && currentSong && selectedSongDetails.id !== currentSong.id) {
      setSelectedSongDetails(currentSong);
    }
  }, [currentSong]);

  // Helper to get full song object by id
  function getFullSongById(song) {
    return allBackendSongs.find(s => s.id === song.id) || song;
  }

  // Add this above the return statement of the component (inside Home function):
  const [moodyBeatsFontSize, setMoodyBeatsFontSize] = React.useState(90);
  React.useEffect(() => {
    function handleResize() {
      setMoodyBeatsFontSize(window.innerWidth >= 768 ? 120 : 90);
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Add state for contact form
  const [contactForm, setContactForm] = React.useState({ name: '', email: '', message: '' });
  const [contactSubmitting, setContactSubmitting] = React.useState(false);
  const [contactSubmitted, setContactSubmitted] = React.useState(false);
  // Add state for contact success modal
  const [showContactSuccessModal, setShowContactSuccessModal] = React.useState(false);
  const [contactSuccess, setContactSuccess] = useState('');
  const [contactError, setContactError] = useState('');

  function handleContactInputChange(e) {
    const { name, value } = e.target;
    setContactForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleContactSubmit(e) {
    e.preventDefault();
    setContactSubmitting(true);
    setContactError('');
    setContactSuccess('');
    try {
      const res = await fetch('http://localhost:5000/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm),
      });
      const data = await res.json();
      if (res.ok) {
        setContactSuccess('Your message has been sent!');
        setContactForm({ name: '', email: '', message: '' });
      } else {
        setContactError(data.error || 'Failed to send message.');
      }
    } catch (err) {
      setContactError('Network error. Please try again later.');
    } finally {
      setContactSubmitting(false);
    }
  }

  const [showRightArrow, setShowRightArrow] = useState(true);
  const moodScrollRef = useRef(null);

  // Add scroll handler for mood cards
  const scrollMoodCards = (dir = 1) => {
    if (moodScrollRef.current) {
      moodScrollRef.current.scrollBy({ left: dir * 320, behavior: 'smooth' });
    }
  };

  // Effect to control right arrow visibility
  useEffect(() => {
    const el = moodScrollRef.current;
    if (!el) return;

    const THRESHOLD = 8;
    function checkArrowVisibility() {
      if (!el) return;
      setShowRightArrow(el.scrollLeft + el.clientWidth < el.scrollWidth - THRESHOLD);
    }

    // Initial check after render
    requestAnimationFrame(checkArrowVisibility);

    el.addEventListener('scroll', checkArrowVisibility);
    window.addEventListener('resize', checkArrowVisibility);

    // Re-check if moods change
    checkArrowVisibility();

    return () => {
      el.removeEventListener('scroll', checkArrowVisibility);
      window.removeEventListener('resize', checkArrowVisibility);
    };
  }, [moods]);

  // Add this near the other color mappings at the top of Home:
  const accentBarColors = {
    happy: '#ffe066',
    sad: '#e5e7eb',
    energetic: '#ff6b6b',
    calm: '#76e4f7',
    romantic: '#ff6fa1',
    glamorous: '#a78bfa',
  };

  // Mood display names
  const moodDisplayNames = {
    happy: 'Happy',
    sad: 'Sad',
    energetic: 'Energetic',
    calm: 'Calm',
    romantic: 'Romantic',
    glamorous: 'Glamorous',
  };

  const playbarWrapperRef = useRef(null);

  // Save scroll position for modals
  const [savedScrollY, setSavedScrollY] = useState(0);

  // Song Details Modal Portal
  const SongDetailsModalPortal = selectedSongDetails ? ReactDOM.createPortal(
    <div className="md:hidden flex flex-col w-full h-full min-h-0 relative px-2 py-4 pb-[90px] bg-[#232323] rounded-lg animate-fadeIn overflow-y-auto"
         style={{ maxWidth: '100vw', maxHeight: '100vh', minHeight: '0', boxSizing: 'border-box', position: 'fixed', top: 0, left: 0, zIndex: 9999 }}>
      {/* Close button */}
      <button
        onClick={() => {
          setSelectedSongDetails(null);
          window.scrollTo(0, savedScrollY);
        }}
        className="absolute top-3 right-3 text-gray-300 hover:text-white text-2xl font-bold focus:outline-none z-30 bg-black/40 rounded-full flex items-center justify-center shadow-lg"
        style={{ width: 'clamp(2.5rem, 8vw, 3.5rem)', height: 'clamp(2.5rem, 8vw, 3.5rem)', fontSize: 'clamp(1.5rem, 5vw, 2.5rem)' }}
        aria-label="Close details"
      >
        &times;
      </button>
      {/* Song icon and details */}
      <div className="flex flex-col items-center justify-center w-full pt-8 pb-4 gap-2">
        <div
          className="rounded-2xl flex items-center justify-center mb-2 shadow-lg"
          style={{
            width: 'clamp(90px, 28vw, 130px)',
            height: 'clamp(90px, 28vw, 130px)',
            background: moodBgColors[selectedSongDetails.mood] || '#888',
          }}
        >
          <span style={{ fontSize: 'clamp(2.7rem, 8vw, 3.7rem)' }}>🎵</span>
        </div>
        <div
          className="font-bold text-white text-center truncate w-full px-2"
          style={{ fontSize: 'clamp(1.2rem, 4vw, 1.6rem)', maxWidth: '90vw' }}
        >
          {selectedSongDetails.title}
        </div>
        <div
          className="text-gray-300 text-center truncate w-full px-2"
          style={{ fontSize: 'clamp(1rem, 3vw, 1.2rem)', maxWidth: '80vw' }}
        >
          {selectedSongDetails.artist}
        </div>
      </div>
      {/* Controls row */}
      <div className="flex flex-row items-center justify-between w-full px-2 gap-1 mb-2" style={{ minHeight: 56 }}>
        {/* Like */}
        <button
          className={`flex flex-col items-center justify-center flex-1 min-w-[44px] min-h-[44px] transition-colors ${likedSongIds.has(selectedSongDetails.id) ? 'text-blue-500 hover:text-blue-600' : 'text-gray-400 hover:text-gray-300'}`}
          style={{ fontSize: 'clamp(1.5rem, 6vw, 2rem)' }}
          onClick={() => toggleLikeSong(selectedSongDetails)}
          aria-label={likedSongIds.has(selectedSongDetails.id) ? 'Unlike song' : 'Like song'}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill={likedSongIds.has(selectedSongDetails.id) ? 'currentColor' : 'none'} viewBox="0 0 24 24" strokeWidth={likedSongIds.has(selectedSongDetails.id) ? 0 : 2} stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
          <span className="text-xs text-center text-white mt-1">Like</span>
        </button>
        {/* Add to Playlist */}
        <button
          className="flex flex-col items-center justify-center flex-1 min-w-[44px] min-h-[44px] text-green-400 hover:text-green-500 transition-colors"
          style={{ fontSize: 'clamp(1.5rem, 6vw, 2rem)' }}
          onClick={() => {
            setCurrentSong(selectedSongDetails);
            setShowAddToPlaylistModal(true);
            setSelectedPlaylistForAdd(null);
            setAddToPlaylistError('');
          }}
          aria-label="Add to Playlist"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-7 h-7">
            <path d="M12 4v16m8-8H4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-xs text-center text-white mt-1">Add</span>
        </button>
        {/* Smart Shuffle */}
        <button
          className={`flex flex-col items-center justify-center flex-1 min-w-[44px] min-h-[44px] transition-colors ${smartShuffleQueue.some(s => s.id === selectedSongDetails.id) ? 'text-blue-500' : 'text-gray-400 hover:text-blue-400'}`}
          style={{ fontSize: 'clamp(1.5rem, 6vw, 2rem)' }}
          onClick={() => {
            if (smartShuffleQueue.some(s => s.id === selectedSongDetails.id)) {
              removeFromSmartShuffle(selectedSongDetails.id);
            } else if (!isPremium && smartShuffleQueue.length >= 20) {
              setShowPremiumModal(true);
            } else {
              addToSmartShuffle(selectedSongDetails);
            }
          }}
          aria-label={smartShuffleQueue.some(s => s.id === selectedSongDetails.id) ? 'Remove from Smart Shuffle' : 'Add to Smart Shuffle'}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="w-7 h-7">
            <path d="M4 4L20 20M4 20L20 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M16 3h5v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M3 16h5v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <g>
              <polygon points="3.5,20.5 4.2,22.1 5.9,22.1 4.5,23.1 5.1,24.7 3.5,23.7 1.9,24.7 2.5,23.1 1.1,22.1 2.8,22.1" fill="#3bb0ff"/>
            </g>
          </svg>
          <span className="text-xs text-center text-white mt-1">Smart Shuffle</span>
        </button>
        {/* Smart Shuffle Queue */}
        <button
          className={`flex flex-col items-center justify-center flex-1 min-w-[44px] min-h-[44px] transition-colors ${smartShuffleQueue.length > 0 ? 'text-blue-500' : 'text-gray-400 hover:text-white'}`}
          style={{ fontSize: 'clamp(1.5rem, 6vw, 2rem)', position: 'relative' }}
          onClick={() => setShowSmartShuffleModal(true)}
          aria-label="Smart Shuffle Queue"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
            <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
          </svg>
          {smartShuffleQueue.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center z-20">
              {smartShuffleQueue.length > 9 ? '9+' : smartShuffleQueue.length}
            </span>
          )}
          <span className="text-xs text-center text-white mt-1">Queue</span>
        </button>
      </div>
      {/* Progress bar */}
      <div className="w-full flex items-center gap-2 mb-4 px-2">
        <span className="text-xs text-neutral-400 min-w-[32px] flex items-center justify-center">{audioTime.currentTime}</span>
        <div className="flex-1 mx-0.5 group group-progress flex items-center">
          <input
            ref={progressSliderRef}
            type="range"
            min={0}
            max={globalAudioRef.current?.duration || 0}
            step={"0.01"}
            value={isSeeking ? seekValue : globalAudioRef.current?.currentTime || 0}
            onChange={e => {
              setIsSeeking(true);
              setSeekValue(Number(e.target.value));
            }}
            onPointerDown={() => setIsSeeking(true)}
            onPointerUp={e => {
              setIsSeeking(false);
              if (globalAudioRef.current) {
                globalAudioRef.current.currentTime = seekValue;
              }
            }}
            className="progress-slider-custom w-full h-1 bg-transparent cursor-pointer"
            style={{ background: 'transparent', '--progress': `${progressPercent}%`, '--progress-color': '#2563eb' }}
          />
        </div>
        <span className="text-xs text-neutral-400 min-w-[32px] flex items-center justify-center">{audioTime.duration}</span>
      </div>
      {/* Playback controls row */}
      <div className="flex flex-row items-center justify-center gap-4 mb-2 mt-2 w-full px-2">
        {/* Shuffle */}
        <button onClick={toggleShuffle} className={`flex items-center justify-center w-11 h-11 rounded-full ${isShuffled ? 'text-blue-400 bg-neutral-800' : 'text-gray-400 hover:text-white bg-neutral-800'} transition-colors`} aria-label="Shuffle">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4l16 16M4 20l16-16" />
          </svg>
        </button>
        {/* Previous */}
        <button onClick={handlePrev} className="flex items-center justify-center w-11 h-11 rounded-full text-gray-400 hover:text-white bg-neutral-800 transition-colors" aria-label="Previous">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
            <rect x="4" y="5" width="2" height="14" rx="1"/>
            <polygon points="20,5 10,12 20,19"/>
          </svg>
        </button>
        {/* Play/Pause */}
        <button
          className="flex items-center justify-center w-16 h-16 rounded-full shadow bg-white text-black border-2 border-neutral-300 hover:bg-neutral-200 transition-colors mx-1"
          onClick={() => {
            if (currentSong && currentSong.id === selectedSongDetails.id) {
              setIsPlaying(!isPlaying);
            } else {
              const moodSongs = songs.filter(s => s.mood === selectedSongDetails.mood);
              setPlaybackContext({ type: 'mood', id: selectedSongDetails.mood, songs: moodSongs });
              handlePlaySong(selectedSongDetails, moodSongs.findIndex(s => s.id === selectedSongDetails.id), { type: 'mood', id: selectedSongDetails.mood, songs: moodSongs });
            }
          }}
          aria-label={currentSong && currentSong.id === selectedSongDetails.id && isPlaying ? 'Pause' : 'Play'}
        >
          {currentSong && currentSong.id === selectedSongDetails.id && isPlaying ? (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
              <rect x="6" y="5" width="4" height="14" rx="1" />
              <rect x="14" y="5" width="4" height="14" rx="1" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
              <polygon points="6,4 20,12 6,20" fill="currentColor" />
            </svg>
          )}
        </button>
        {/* Next */}
        <button onClick={handleNext} className="flex items-center justify-center w-11 h-11 rounded-full text-gray-400 hover:text-white bg-neutral-800 transition-colors" aria-label="Next">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
            <rect x="18" y="5" width="2" height="14" rx="1"/>
            <polygon points="4,5 14,12 4,19"/>
          </svg>
        </button>
        {/* Repeat */}
        <button onClick={toggleRepeat} className={`flex items-center justify-center w-11 h-11 rounded-full ${repeatMode !== 'none' ? 'text-blue-500 bg-neutral-800' : 'text-gray-400 hover:text-white bg-neutral-800'} transition-colors`} aria-label="Repeat">
          {getRepeatIcon()}
        </button>
      </div>
      {/* Copyright */}
      <div className="mt-auto pt-4 text-xs text-gray-400 text-center mb-2 px-2">
        {selectedSongDetails.copyright && (
          <div dangerouslySetInnerHTML={{ __html: selectedSongDetails.copyright }} />
        )}
      </div>
    </div>
  , document.body) : null;

  // Lock scroll when modal is open
  useScrollLock(!!selectedSongDetails);

  // When opening modal, save scroll position
  useEffect(() => {
    if (selectedSongDetails) {
      setSavedScrollY(window.scrollY);
    }
  }, [selectedSongDetails]);

  return (
    <div
      className="min-h-screen text-white flex flex-col"
      style={{
        height: '100vh',
      }}
    >
      {/* Splash Screen - Show when showSplashScreen is true */}
      {showSplashScreen && (
        <SplashScreen visible={showSplashScreen} />
      )}
      {/* Main Content - Only show when splash screen is hidden */}
      {!showSplashScreen && (
        <>
          {/* Song Details Modal Portal */}
          {SongDetailsModalPortal}
          {/* MOBILE HEADER */}
      <MobileHeader
        user={user}
        setShowAuthModal={setShowAuthModal}
        setShowProfileModal={setShowProfileModal}
        isPremium={isPremium}
        hamburgerRef={hamburgerRef}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        searchInputRefMobile={searchInputRefMobile}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        handleSearchFocus={handleSearchFocus}
        handleSearchBlur={handleSearchBlur}
        isInputFocused={isInputFocused}
        setIsInputFocused={setIsInputFocused}
        getActiveSearchInputRef={getActiveSearchInputRef}
        memoSearchResults={memoSearchResults}
        memoMoodIconColors={memoMoodIconColors}
        memoOnSongSelect={memoOnSongSelect}
        memoOnPlaylistSelect={memoOnPlaylistSelect}
        searchSelectedSong={searchSelectedSong}
        searchDropdownRef={searchDropdownRef}
        RecentlyPlayedDropdown={RecentlyPlayedDropdown}
        memoRecentlyPlayed={memoRecentlyPlayed}
        handleSearchBlurDropdown={handleSearchBlur}
        moods={moods}
        moodHeroGradients={moodHeroGradients}
        selectedMood={selectedMood}
        handleSelectMood={handleSelectMood}
        mobileMenuRef={mobileMenuRef}
        mobileMoodDropdownRef={mobileMoodDropdownRef}
        mobileMoodDropdownOpen={mobileMoodDropdownOpen}
        setMobileMoodDropdownOpen={setMobileMoodDropdownOpen}
        setCurrentPage={setCurrentPage}
        setSelectedMood={setSelectedMood}
        showMobileLibrary={showMobileLibrary}
        setShowMobileLibrary={setShowMobileLibrary}
        showCreatePlaylistWarning={showCreatePlaylistWarning}
        setShowCreateModal={setShowCreateModal}
        createPlaylistWarning={createPlaylistWarning}
        handleCreatePlaylistClick={handleCreatePlaylistClick}
        showPremiumModal={showPremiumModal}
        setShowPremiumModal={setShowPremiumModal}
        setSelectedSongDetails={setSelectedSongDetails}
        currentPage={currentPage}
      />
      {/* DESKTOP HEADER (unchanged) */}
      <DesktopHeader
        moodDropdownButtonRef={moodDropdownButtonRef}
        showMoodDropdown={showMoodDropdown}
        setShowMoodDropdown={setShowMoodDropdown}
        moodDropdownStyle={moodDropdownStyle}
        moods={moods}
        moodHeroGradients={moodHeroGradients}
        selectedMood={selectedMood}
        handleSelectMood={handleSelectMood}
        searchInputRefDesktop={searchInputRefDesktop}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        handleSearchFocus={handleSearchFocus}
        handleSearchBlur={handleSearchBlur}
        user={user}
        isPremium={isPremium}
        setShowPremiumModal={setShowPremiumModal}
        setShowProfileModal={setShowProfileModal}
        setShowAuthModal={setShowAuthModal}
        isSearchFocused={isSearchFocused}
        memoRecentlyPlayed={memoRecentlyPlayed}
        memoMoodIconColors={memoMoodIconColors}
        getActiveSearchInputRef={getActiveSearchInputRef}
        handleSearchBlurDropdown={handleSearchBlur}
        RecentlyPlayedDropdown={RecentlyPlayedDropdown}
        heroHeadingClass={heroHeadingClass}
        setCurrentPage={setCurrentPage}
        setSelectedMood={setSelectedMood}
        setSelectedSongDetails={setSelectedSongDetails}
        currentPage={currentPage}
      />



      {/* Main Row: Sidebar + Main Content */}
      <div className="main-row flex flex-1 min-h-0 gap-[5px] px-2 md:px-[10px] pb-2 md:pb-[10px] pt-2 md:pt-[10px] main-row" style={{}}>
        {/* Sidebar */}
        <Sidebar
          sidebarRef={sidebarRef}
          sidebarOpen={sidebarOpen}
          showSidebarContent={showSidebarContent}
          setSidebarOpen={setSidebarOpen}
          playlists={playlists}
          handleCreatePlaylistClick={handleCreatePlaylistClick}
          showCreateModal={showCreateModal}
          setShowCreateModal={setShowCreateModal}
          createPlaylistWarning={createPlaylistWarning}
          newPlaylistName={newPlaylistName}
          setNewPlaylistName={setNewPlaylistName}
          handleCreatePlaylist={handleCreatePlaylist}
          isCreatingPlaylist={isCreatingPlaylist}
          selectedPlaylistId={selectedPlaylistId}
          playlistMenuOpen={playlistMenuOpen}
          setPlaylistMenuOpen={setPlaylistMenuOpen}
          openRenameModal={openRenameModal}
          handleDeletePlaylist={handleDeletePlaylist}
          isPremium={isPremium}
          openAddSongsModal={openAddSongsModal}
          handleSelectPlaylist={handleSelectPlaylist}
          setShowPremiumModal={setShowPremiumModal}
          playbackContext={playbackContext}
        />
        {/* Main Content Area: Playlist Page or Default */}
        <div
          ref={mainContentRef}
          key={selectedMood ? selectedMood.id : 'main-content-default'}
          className={`main-content overflow-y-auto h-full border border-[#404040] px-2 py-4 md:px-8 md:py-8 transition-colors duration-700 ${mainTextClass}`}
          style={{
            position: 'relative',
            flex: '1 1 0%',
            minWidth: 0,
            background: currentPage === 'library' ? '#181818' : (selectedMood ? (moodHeroGradients?.[selectedMood.id] || heroBgByMood?.[selectedMood.id] || 'transparent') : 'transparent'),
          }}
        >
          {/* Aurora and watermark only in main content area, only when no mood is selected */}
          {!selectedMood && <div className="aurora-bg-premium" />}
          {!selectedMood && <div className="watermark-bg">MoodyBeats</div>}
          {!selectedMood && <>
            <span className="floating-note" style={{top: '18%', left: '12%'}}>🎵</span>
            <span className="floating-note" style={{top: '70%', left: '80%'}}>🎼</span>
            <span className="floating-note" style={{top: '40%', left: '60%'}}></span>
            <span className="floating-note" style={{top: '60%', left: '25%'}}>🎷</span>
          </>}
          {selectedSongDetails ? (
            <>
              {/* MOBILE SONG DETAIL MODAL (only visible on mobile) */}
              <div className="md:hidden flex flex-col w-full h-full min-h-0 relative px-2 py-4 pb-[90px] bg-[#232323] rounded-lg animate-fadeIn overflow-y-auto"
                   style={{ maxWidth: '100vw', maxHeight: '100vh', minHeight: '0', boxSizing: 'border-box' }}>
                {/* Close button */}
                <button
                  onClick={() => setSelectedSongDetails(null)}
                  className="absolute top-3 right-3 text-gray-300 hover:text-white text-2xl font-bold focus:outline-none z-30 bg-black/40 rounded-full flex items-center justify-center shadow-lg"
                  style={{ width: 'clamp(2.5rem, 8vw, 3.5rem)', height: 'clamp(2.5rem, 8vw, 3.5rem)', fontSize: 'clamp(1.5rem, 5vw, 2.5rem)' }}
                  aria-label="Close details"
                >
                  &times;
                </button>
                {/* Song icon and details */}
                <div className="flex flex-col items-center justify-center w-full pt-8 pb-4 gap-2">
                  <div
                    className="rounded-2xl flex items-center justify-center mb-2 shadow-lg"
                    style={{
                      width: 'clamp(90px, 28vw, 130px)',
                      height: 'clamp(90px, 28vw, 130px)',
                      background: moodBgColors[selectedSongDetails.mood] || '#888',
                    }}
                  >
                    <span style={{ fontSize: 'clamp(2.7rem, 8vw, 3.7rem)' }}>🎵</span>
                  </div>
                  <div
                    className="font-bold text-white text-center truncate w-full px-2"
                    style={{ fontSize: 'clamp(1.2rem, 4vw, 1.6rem)', maxWidth: '90vw' }}
                  >
                    {selectedSongDetails.title}
                  </div>
                  <div
                    className="text-gray-300 text-center truncate w-full px-2"
                    style={{ fontSize: 'clamp(1rem, 3vw, 1.2rem)', maxWidth: '80vw' }}
                  >
                    {selectedSongDetails.artist}
                  </div>
                </div>
                {/* Controls row */}
                <div className="flex flex-row items-center justify-between w-full px-2 gap-1 mb-2" style={{ minHeight: 56 }}>
                  {/* Like */}
                  <button
                    className={`flex flex-col items-center justify-center flex-1 min-w-[44px] min-h-[44px] transition-colors ${likedSongIds.has(selectedSongDetails.id) ? 'text-blue-500 hover:text-blue-600' : 'text-gray-400 hover:text-gray-300'}`}
                    style={{ fontSize: 'clamp(1.5rem, 6vw, 2rem)' }}
                    onClick={() => toggleLikeSong(selectedSongDetails)}
                    aria-label={likedSongIds.has(selectedSongDetails.id) ? 'Unlike song' : 'Like song'}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill={likedSongIds.has(selectedSongDetails.id) ? 'currentColor' : 'none'} viewBox="0 0 24 24" strokeWidth={likedSongIds.has(selectedSongDetails.id) ? 0 : 2} stroke="currentColor" className="w-8 h-8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                    </svg>
                    <span className="text-xs text-center text-white mt-1">Like</span>
                  </button>
                  {/* Add to Playlist */}
                  <button
                    className="flex flex-col items-center justify-center flex-1 min-w-[44px] min-h-[44px] text-green-400 hover:text-green-500 transition-colors"
                    style={{ fontSize: 'clamp(1.5rem, 6vw, 2rem)' }}
                    onClick={() => {
                      setCurrentSong(selectedSongDetails);
                      setShowAddToPlaylistModal(true);
                      setSelectedPlaylistForAdd(null);
                      setAddToPlaylistError('');
                    }}
                    aria-label="Add to Playlist"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-7 h-7">
                      <path d="M12 4v16m8-8H4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="text-xs text-center text-white mt-1">Add</span>
                  </button>
                  {/* Smart Shuffle */}
                  <button
                    className={`flex flex-col items-center justify-center flex-1 min-w-[44px] min-h-[44px] transition-colors ${smartShuffleQueue.some(s => s.id === selectedSongDetails.id) ? 'text-blue-500' : 'text-gray-400 hover:text-blue-400'}`}
                    style={{ fontSize: 'clamp(1.5rem, 6vw, 2rem)' }}
                    onClick={() => {
                      if (smartShuffleQueue.some(s => s.id === selectedSongDetails.id)) {
                        removeFromSmartShuffle(selectedSongDetails.id);
                      } else if (!isPremium && smartShuffleQueue.length >= 20) {
                        setShowPremiumModal(true);
                      } else {
                        addToSmartShuffle(selectedSongDetails);
                      }
                    }}
                    aria-label={smartShuffleQueue.some(s => s.id === selectedSongDetails.id) ? 'Remove from Smart Shuffle' : 'Add to Smart Shuffle'}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="w-7 h-7">
                      <path d="M4 4L20 20M4 20L20 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M16 3h5v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M3 16h5v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <g>
                        <polygon points="3.5,20.5 4.2,22.1 5.9,22.1 4.5,23.1 5.1,24.7 3.5,23.7 1.9,24.7 2.5,23.1 1.1,22.1 2.8,22.1" fill="#3bb0ff"/>
                      </g>
                    </svg>
                    <span className="text-xs text-center text-white mt-1">Smart Shuffle</span>
                  </button>
                  {/* Smart Shuffle Queue */}
                  <button
                    className={`flex flex-col items-center justify-center flex-1 min-w-[44px] min-h-[44px] transition-colors ${smartShuffleQueue.length > 0 ? 'text-blue-500' : 'text-gray-400 hover:text-white'}`}
                    style={{ fontSize: 'clamp(1.5rem, 6vw, 2rem)', position: 'relative' }}
                    onClick={() => setShowSmartShuffleModal(true)}
                    aria-label="Smart Shuffle Queue"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
                      <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
                    </svg>
                    {smartShuffleQueue.length > 0 && (
                      <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center z-20">
                        {smartShuffleQueue.length > 9 ? '9+' : smartShuffleQueue.length}
                      </span>
                    )}
                    <span className="text-xs text-center text-white mt-1">Queue</span>
                  </button>
                </div>
                {/* Progress bar */}
                <div className="w-full flex items-center gap-2 mb-4 px-2">
                  <span className="text-xs text-neutral-400 min-w-[32px] flex items-center justify-center">{audioTime.currentTime}</span>
                  <div className="flex-1 mx-0.5 group group-progress flex items-center">
                    <input
                      ref={progressSliderRef}
                      type="range"
                      min={0}
                      max={globalAudioRef.current?.duration || 0}
                      step={"0.01"}
                      value={isSeeking ? seekValue : globalAudioRef.current?.currentTime || 0}
                      onChange={e => {
                        setIsSeeking(true);
                        setSeekValue(Number(e.target.value));
                      }}
                      onPointerDown={() => setIsSeeking(true)}
                      onPointerUp={e => {
                        setIsSeeking(false);
                        if (globalAudioRef.current) {
                          globalAudioRef.current.currentTime = seekValue;
                        }
                      }}
                      className="progress-slider-custom w-full h-1 bg-transparent cursor-pointer"
                      style={{ background: 'transparent', '--progress': `${progressPercent}%`, '--progress-color': '#2563eb' }}
                    />
                  </div>
                  <span className="text-xs text-neutral-400 min-w-[32px] flex items-center justify-center">{audioTime.duration}</span>
                </div>
                {/* Playback controls row */}
                <div className="flex flex-row items-center justify-center gap-4 mb-2 mt-2 w-full px-2">
                  {/* Shuffle */}
                  <button onClick={toggleShuffle} className={`flex items-center justify-center w-11 h-11 rounded-full ${isShuffled ? 'text-blue-400 bg-neutral-800' : 'text-gray-400 hover:text-white bg-neutral-800'} transition-colors`} aria-label="Shuffle">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4l16 16M4 20l16-16" />
                    </svg>
                  </button>
                  {/* Previous */}
                  <button onClick={handlePrev} className="flex items-center justify-center w-11 h-11 rounded-full text-gray-400 hover:text-white bg-neutral-800 transition-colors" aria-label="Previous">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
                      <rect x="4" y="5" width="2" height="14" rx="1"/>
                      <polygon points="20,5 10,12 20,19"/>
                    </svg>
                  </button>
                  {/* Play/Pause */}
                  <button
                    className="flex items-center justify-center w-16 h-16 rounded-full shadow bg-white text-black border-2 border-neutral-300 hover:bg-neutral-200 transition-colors mx-1"
                    onClick={() => {
                      if (currentSong && currentSong.id === selectedSongDetails.id) {
                        setIsPlaying(!isPlaying);
                      } else {
                        const moodSongs = songs.filter(s => s.mood === selectedSongDetails.mood);
                        setPlaybackContext({ type: 'mood', id: selectedSongDetails.mood, songs: moodSongs });
                        handlePlaySong(selectedSongDetails, moodSongs.findIndex(s => s.id === selectedSongDetails.id), { type: 'mood', id: selectedSongDetails.mood, songs: moodSongs });
                      }
                    }}
                    aria-label={currentSong && currentSong.id === selectedSongDetails.id && isPlaying ? 'Pause' : 'Play'}
                  >
                    {currentSong && currentSong.id === selectedSongDetails.id && isPlaying ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                        <rect x="6" y="5" width="4" height="14" rx="1" />
                        <rect x="14" y="5" width="4" height="14" rx="1" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                        <polygon points="6,4 20,12 6,20" fill="currentColor" />
                      </svg>
                    )}
                  </button>
                  {/* Next */}
                  <button onClick={handleNext} className="flex items-center justify-center w-11 h-11 rounded-full text-gray-400 hover:text-white bg-neutral-800 transition-colors" aria-label="Next">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
                      <rect x="18" y="5" width="2" height="14" rx="1"/>
                      <polygon points="4,5 14,12 4,19"/>
                    </svg>
                  </button>
                  {/* Repeat */}
                  <button onClick={toggleRepeat} className={`flex items-center justify-center w-11 h-11 rounded-full ${repeatMode !== 'none' ? 'text-blue-500 bg-neutral-800' : 'text-gray-400 hover:text-white bg-neutral-800'} transition-colors`} aria-label="Repeat">
                    {getRepeatIcon()}
                  </button>
                </div>
                {/* Copyright */}
                <div className="mt-auto pt-4 text-xs text-gray-400 text-center mb-2 px-2">
                  {selectedSongDetails.copyright && (
                    <div dangerouslySetInnerHTML={{ __html: selectedSongDetails.copyright }} />
                  )}
                </div>
              </div>
              {/* DESKTOP SONG DETAIL MODAL (unchanged, only visible on md+) */}
              <div className="hidden md:flex flex-col w-full h-full min-h-full relative px-2 md:px-8 py-4 md:py-8">
              {/* Close button at top right of main content */}
              <button
                onClick={() => setSelectedSongDetails(null)}
                className="absolute top-2 right-2 md:top-6 md:right-8 text-gray-300 hover:text-white text-2xl md:text-3xl font-bold focus:outline-none z-50"
                style={{ background: 'rgba(0,0,0,0.18)', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                aria-label="Close details"
              >
                &times;
              </button>
              {/* Top row: big music icon left, song name and artist stacked right */}
              <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8 mt-2 mb-6 md:mb-8 min-w-0">
                <div className="w-20 h-20 md:w-36 md:h-36 rounded-2xl flex items-center justify-center" style={{ background: moodBgColors[selectedSongDetails.mood] || '#888' }}>
                  <span className="text-4xl md:text-7xl">🎵</span>
                </div>
                <div className="flex flex-col justify-center min-w-0 mt-4 md:mt-0">
                  <span className="text-2xl md:text-5xl font-extrabold text-white truncate" style={{ maxWidth: '90vw', minWidth: 0 }}>{selectedSongDetails.title}</span>
                  <span className="text-base md:text-2xl text-gray-300 truncate" style={{ maxWidth: '70vw', minWidth: 0 }}>by {selectedSongDetails.artist}</span>
                </div>
              </div>
              {/* Actions row */}
              <div className="flex flex-row items-center gap-8 mb-8 ml-2">
                {/* Like */}
                <div className="relative group">
                  <button
                    className={`transition-colors ${likedSongIds.has(selectedSongDetails.id) ? 'text-blue-500 hover:text-blue-600' : 'text-gray-400 hover:text-gray-300'}`}
                    style={{ fontSize: 32 }}
                    onClick={() => toggleLikeSong(selectedSongDetails)}
                    aria-label={likedSongIds.has(selectedSongDetails.id) ? 'Unlike song' : 'Like song'}
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      fill={likedSongIds.has(selectedSongDetails.id) ? "currentColor" : "none"} 
                      viewBox="0 0 24 24" 
                      strokeWidth={likedSongIds.has(selectedSongDetails.id) ? 0 : 2} 
                      stroke="currentColor" 
                      className="w-10 h-10"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                    </svg>
                  </button>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-black rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10 pointer-events-none">
                    {likedSongIds.has(selectedSongDetails.id) ? 'Unlike song' : 'Like song'}
                  </div>
                </div>
                {/* Add to Playlist */}
                <div className="relative group">
                  <button
                    className="text-green-400 hover:text-green-500 transition-colors"
                    style={{ fontSize: 32 }}
                    onClick={() => {
                      setCurrentSong(selectedSongDetails);
                      setShowAddToPlaylistModal(true);
                      setSelectedPlaylistForAdd(null);
                      setAddToPlaylistError('');
                    }}
                    aria-label="Add to Playlist"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-9 h-9">
                      <path d="M12 4v16m8-8H4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-black rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10 pointer-events-none">
                    Add to Playlist
                  </div>
                </div>
                {/* Smart Shuffle */}
                <div className="relative group">
                  <button
                    className={`transition-colors ${smartShuffleQueue.some(s => s.id === selectedSongDetails.id) ? 'text-blue-500' : 'text-gray-400 hover:text-blue-400'}`}
                    style={{ fontSize: 32 }}
                    onClick={() => {
                      if (smartShuffleQueue.some(s => s.id === selectedSongDetails.id)) {
                        removeFromSmartShuffle(selectedSongDetails.id);
                      } else if (!isPremium && smartShuffleQueue.length >= 20) {
                        setShowPremiumModal(true);
                      } else {
                        addToSmartShuffle(selectedSongDetails);
                      }
                    }}
                    aria-label={smartShuffleQueue.some(s => s.id === selectedSongDetails.id) ? 'Remove from Smart Shuffle' : 'Add to Smart Shuffle'}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="w-9 h-9">
                      <path d="M4 4L20 20M4 20L20 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M16 3h5v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M3 16h5v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-black rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10 pointer-events-none">
                    {smartShuffleQueue.some(s => s.id === selectedSongDetails.id) ? 'Remove from Smart Shuffle' : 'Add to Smart Shuffle'}
                  </div>
                </div>
                {/* Play/Pause */}
                <button
                  className="w-16 h-16 flex items-center justify-center rounded-full shadow bg-white text-black border-2 border-neutral-300 hover:bg-neutral-200 transition-colors"
                  onClick={() => {
                    if (currentSong && currentSong.id === selectedSongDetails.id) {
                      setIsPlaying(!isPlaying);
                    } else {
                      const moodSongs = songs.filter(s => s.mood === selectedSongDetails.mood);
                      setPlaybackContext({ type: 'mood', id: selectedSongDetails.mood, songs: moodSongs });
                      handlePlaySong(selectedSongDetails, moodSongs.findIndex(s => s.id === selectedSongDetails.id), { type: 'mood', id: selectedSongDetails.mood, songs: moodSongs });
                      setSelectedSongDetails(getFullSongById(selectedSongDetails));
                    }
                  }}
                  aria-label={currentSong && currentSong.id === selectedSongDetails.id && isPlaying ? 'Pause' : 'Play'}
                >
                  {currentSong && currentSong.id === selectedSongDetails.id && isPlaying ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                      <rect x="6" y="5" width="4" height="14" rx="1" />
                      <rect x="14" y="5" width="4" height="14" rx="1" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                      <polygon points="6,4 20,12 6,20" fill="currentColor" />
                    </svg>
                  )}
                </button>
              </div>
              {/* Additional details */}
              <div className="mt-4 ml-2">
                {selectedSongDetails.copyright && (
                  <div className="text-sm text-gray-300 mt-2 text-left" dangerouslySetInnerHTML={{ __html: selectedSongDetails.copyright }} />
                )}
                {/*(selectedSongDetails.file || selectedSongDetails.file_url) && (
                  <div className="text-xs text-gray-400 mt-2 text-left">File: {selectedSongDetails.file || selectedSongDetails.file_url}</div>
                )*/}
              </div>
            </div>
            </>
          ) : currentPage === 'playlist' && selectedPlaylist ? (
            <main>
              {/* Playlist Header */}
              <div className="flex flex-col justify-center items-center mb-6 md:mb-8 bg-[#232323] rounded-lg p-4 md:p-8 text-white relative" style={{ height: 'auto', minHeight: 120 }}>
                <button
                  onClick={() => setCurrentPage('home')}
                  className="absolute top-2 right-2 md:top-4 md:right-4 w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-colors"
                  aria-label="Close playlist"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <h2 className="text-2xl md:text-4xl font-extrabold text-white mb-1 md:mb-2">{selectedPlaylist.name}</h2>
                <p className="text-sm md:text-neutral-400">{selectedPlaylist.songs.length} song{selectedPlaylist.songs.length !== 1 ? 's' : ''}</p>
              </div>
              {/* Playlist Songs - match mood song card layout */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {selectedPlaylist.songs.length === 0 ? (
                  <p className="text-neutral-400 col-span-full">No songs in this playlist.</p>
                ) : (
                  <>
                    {songsLoading ?
                      Array.from({ length: 4 }).map((_, idx) => (
                        <div
                          key={idx}
                          className="rounded-xl animate-pulse"
                          style={{ minHeight: 180, background: 'linear-gradient(135deg, #444 60%, #222 100%)', boxShadow: '0 4px 24px 0 rgba(0,0,0,0.18)' }}
                        />
                      ))
                    :
                      (isPremium ? selectedPlaylist.songs : selectedPlaylist.songs.slice(0, 20)).map((song, index) => {
                    const isCurrent = currentSong && currentSong.id === song.id && selectedPlaylistId === selectedPlaylist.id;
                    return (
                      <div
                        key={`${selectedPlaylist.id}||${song.id}||${index}`}
                        className={`relative flex flex-col justify-between p-3 md:p-6 rounded-xl shadow-lg transition-colors border-2 ${isCurrent ? 'ring-2 ring-blue-400' : ''}`}
                        style={{ minHeight: 120, background: '#23272f', color: '#fff', borderColor: 'rgba(0,0,0,0.2)' }}
                      >
                        <div>
                          <div className="text-base md:text-xl font-semibold mb-1 md:mb-2 truncate">{song.title}</div>
                          <div className="text-xs md:text-base opacity-80 truncate">{song.artist}</div>
                          {song.mood && (
                            <div className="flex items-center gap-1 mt-1">
                              <span style={{
                                display: 'inline-block',
                                width: 7,
                                height: 7,
                                borderRadius: '50%',
                                background: moodBgColors[song.mood] || '#888',
                                marginRight: 4
                              }} />
                              <span style={{ color: moodBgColors[song.mood] || '#888', fontWeight: 500, fontSize: '0.85em' }}>{moodDisplayNames[song.mood]}</span>
                            </div>
                          )}
                          
                          {/* Expandable Icon Section for Playlist Songs */}
                          <div className="mt-3 relative" style={{ minHeight: '48px', marginTop: '25px' }}>
                            {/* Always visible button that transforms from hamburger to X */}
                            <button
                              className="flex items-center justify-center transition-all duration-300 group text-gray-400 hover:text-white hover:scale-110 relative"
                              onClick={e => {
                                e.stopPropagation();
                                const songId = `${selectedPlaylist.id}||${song.id}||${index}`;
                                setExpandedPlaylistSongs(prev => ({
                                  ...prev,
                                  [songId]: !prev[songId]
                                }));
                              }}
                              aria-label={expandedPlaylistSongs[`${selectedPlaylist.id}||${song.id}||${index}`] ? "Close actions" : "Expand actions"}
                              title={expandedPlaylistSongs[`${selectedPlaylist.id}||${song.id}||${index}`] ? "Close menu" : "Open menu - Add to playlist, Delete, Like"}
                            >
                              <div className="relative w-6 h-6">
                                {/* Top line - rotates to become top-left to bottom-right */}
                                <div 
                                  className={`absolute top-0 left-0 w-4 h-0.5 bg-current transition-all duration-300 ease-in-out ${
                                    expandedPlaylistSongs[`${selectedPlaylist.id}||${song.id}||${index}`] 
                                      ? 'rotate-45 translate-x-1 translate-y-2' 
                                      : ''
                                  }`}
                                  style={{ transformOrigin: '0 0' }}
                                />
                                
                                {/* Middle line - fades out */}
                                <div 
                                  className={`absolute top-1/2 left-0 w-4 h-0.5 bg-current transition-all duration-300 ease-in-out ${
                                    expandedPlaylistSongs[`${selectedPlaylist.id}||${song.id}||${index}`] 
                                      ? 'opacity-0 scale-x-0' 
                                      : 'opacity-100 scale-x-100'
                                  }`}
                                  style={{ transform: 'translateY(-50%)' }}
                                />
                                
                                {/* Bottom line - rotates to become top-right to bottom-left */}
                                <div 
                                  className={`absolute bottom-0 left-0 w-4 h-0.5 bg-current transition-all duration-300 ease-in-out ${
                                    expandedPlaylistSongs[`${selectedPlaylist.id}||${song.id}||${index}`] 
                                      ? '-rotate-45 translate-x-1 -translate-y-2' 
                                      : ''
                                  }`}
                                  style={{ transformOrigin: '0 100%' }}
                                />
                              </div>
                            </button>
                            {/* Expanded: Completely transparent box with plus, delete and heart icons */}
                            {expandedPlaylistSongs[`${selectedPlaylist.id}||${song.id}||${index}`] && (
                                                            <div
                                className={`absolute top-0 left-0 bg-transparent rounded-lg transition-all duration-700 overflow-hidden w-[120px] h-12 opacity-100 flex items-center px-2 gap-1`}
                                style={{ zIndex: 10, transform: 'translateX(22px) translateY(-11px)' }}
                              >
                                  {/* Plus Icon */}
                                  <button
                                    className="flex items-center justify-center text-green-400 hover:text-green-500 transition-all duration-500 ease-out fast-tooltip relative"
                                    style={{ 
                                      fontSize: 28,
                                      animation: 'slideInFromLeft 0.4s ease-out 0.1s both'
                                    }}
                                    onClick={e => {
                                      e.stopPropagation();
                                      setCurrentSong(song);
                                      setShowAddToPlaylistModal(true);
                                      setSelectedPlaylistForAdd(null);
                                      setAddToPlaylistError('');
                                    }}
                                    aria-label="Add to Playlist"
                                    title="Add to another playlist"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-7 h-7">
                                      <path d="M12 4v16m8-8H4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                  </button>
                                  {/* Delete Icon */}
                                  <button
                                    className="flex items-center justify-center text-red-400 hover:text-red-600 transition-all duration-500 ease-out fast-tooltip relative"
                                    style={{ 
                                      fontSize: 28,
                                      animation: 'slideInFromLeft 0.4s ease-out 0.2s both'
                                    }}
                                    onClick={e => {
                                      e.stopPropagation();
                                      handleRemoveSongFromPlaylist(selectedPlaylist.id, song.id);
                                    }}
                                    aria-label="Remove from Playlist"
                                    title="Remove from this playlist"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="w-7 h-7">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3m2 0v12a2 2 0 01-2 2H8a2 2 0 01-2-2V7h12z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 11v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                                                  {/* Heart Icon */}
                                  <button
                                    className={`flex items-center justify-center transition-all duration-500 ease-out fast-tooltip relative ${
                                      likedSongIds.has(song.id) 
                                        ? 'text-blue-500 hover:text-blue-600' 
                                        : 'text-gray-400 hover:text-gray-300'
                                    }`}
                                    style={{ 
                                      fontSize: 32,
                                      animation: 'slideInFromLeft 0.4s ease-out 0.3s both'
                                    }}
                                    onClick={e => {
                                      e.stopPropagation();
                                      toggleLikeSong(song);
                                    }}
                                    aria-label={likedSongIds.has(song.id) ? 'Unlike song' : 'Like song'}
                                    title={likedSongIds.has(song.id) ? 'Remove from liked songs' : 'Add to liked songs'}
                                  >
                                  <svg 
                                    xmlns="http://www.w3.org/2000/svg" 
                                    fill={likedSongIds.has(song.id) ? "currentColor" : "none"} 
                                    viewBox="0 0 24 24" 
                                    strokeWidth={likedSongIds.has(song.id) ? 0 : 2} 
                                    stroke="currentColor" 
                                    className="w-8 h-8"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                                  </svg>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                          <div className="flex items-center gap-2 absolute bottom-4 right-4">
                            {/* Add to Smart Shuffle Button */}
                            <button
                              className={`flex items-center justify-center transition-colors duration-200 fast-tooltip relative ${
                                smartShuffleLoading[song.id]
                                  ? 'text-blue-400 animate-pulse'
                                  : smartShuffleQueue.some(s => s.id === song.id)
                                    ? 'text-blue-500 drop-shadow-[0_0_8px_rgba(59,176,255,0.7)] scale-110'
                                    : (!isPremium && smartShuffleQueue.length >= 20 && !smartShuffleQueue.some(s => s.id === song.id))
                                      ? 'text-gray-500 cursor-not-allowed'
                                      : 'text-gray-400 hover:text-blue-400 hover:scale-110'
                              } transition-transform duration-200`}
                              style={{ fontSize: 28 }}
                              onClick={e => {
                                e.stopPropagation();
                                if (smartShuffleLoading[song.id]) return;
                                if (smartShuffleQueue.some(s => s.id === song.id)) {
                                  removeFromSmartShuffle(song.id);
                                } else if (!isPremium && smartShuffleQueue.length >= 20) {
                                  setShowPremiumModal(true);
                                } else {
                                  addToSmartShuffle(song);
                                }
                              }}
                              disabled={smartShuffleLoading[song.id] || (!isPremium && smartShuffleQueue.length >= 20 && !smartShuffleQueue.some(s => s.id === song.id))}
                              title={smartShuffleLoading[song.id] ? 'Processing...' : (!isPremium && smartShuffleQueue.length >= 20 && !smartShuffleQueue.some(s => s.id === song.id) ? 'Free users can only add up to 20 songs to Smart Shuffle. Upgrade to Premium for unlimited songs!' : (smartShuffleQueue.some(s => s.id === song.id) ? 'Remove from Smart Shuffle' : 'Add to Smart Shuffle'))}
                              aria-label={smartShuffleQueue.some(s => s.id === song.id) ? 'Remove from Smart Shuffle' : 'Add to Smart Shuffle'}
                            >
                              {smartShuffleLoading[song.id] ? (
                                // Loading spinner
                                <svg className="w-7 h-7 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              ) : smartShuffleQueue.some(s => s.id === song.id) ? (
                                // Shuffle icon for ON (blue glow, not bold)
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="w-7 h-7 drop-shadow-[0_0_8px_rgba(59,176,255,0.7)]">
                                  <path d="M4 4L20 20M4 20L20 4" stroke="#3bb0ff" strokeWidth="2" strokeLinecap="round"/>
                                  <path d="M16 3h5v5" stroke="#3bb0ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  <path d="M3 16h5v5" stroke="#3bb0ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              ) : (
                                // Shuffle icon for OFF (outlined, neutral)
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="w-7 h-7">
                                  <path d="M4 4L20 20M4 20L20 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                  <path d="M16 3h5v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  <path d="M3 16h5v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              )}
                            </button>
                            {/* Play Button */}
                            <button
                              className={`w-12 h-12 flex items-center justify-center rounded-full shadow bg-white text-black border-2 border-neutral-300 hover:bg-neutral-200 transition-colors`}
                          onClick={e => {
                            e.stopPropagation();
                            if (isCurrent && isPlaying) {
                              setIsPlaying(false);
                            } else {
                              setPlaybackContext({ type: 'mood', id: song.mood, songs });
                              handlePlaySong(song, index);
                              setSelectedSongDetails(getFullSongById(song));
                            }
                          }}
                          aria-label={isCurrent && isPlaying ? 'Pause' : 'Play'}
                        >
                          {isCurrent && isPlaying ? (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                              <rect x="6" y="5" width="4" height="14" rx="1" />
                              <rect x="14" y="5" width="4" height="14" rx="1" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                              <polygon points="6,4 20,12 6,20" fill="currentColor" />
                            </svg>
                          )}
                        </button>
                          </div>
                      </div>
                    );
                    })}
                    {!isPremium && selectedPlaylist.songs.length > 20 && (
                      <div className="col-span-full flex flex-col items-center justify-center mt-4">
                        <div className="text-yellow-400 font-semibold text-lg mb-2">Only the first 20 songs are available for free users.</div>
                        <button
                          onClick={() => setShowPremiumModal(true)}
                          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-800 text-white rounded-lg hover:from-blue-600 hover:to-blue-900 transition-colors text-lg font-semibold"
                        >
                          Upgrade to Premium to unlock all songs
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </main>
          ) : currentPage === 'about' ? (
            <main className="min-h-screen  relative overflow-hidden mb-[100px] md:mb-0">
              {/* Animated Background Elements */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-[#4176D6] to-[#7B9685] rounded-full opacity-20 blur-3xl animate-pulse"></div>
                <div className="absolute top-40 right-20 w-40 h-40 bg-gradient-to-r from-[#C3D34B] to-[#E0B15B] rounded-full opacity-15 blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
                <div className="absolute bottom-40 left-1/4 w-36 h-36 bg-gradient-to-r from-[#D86C97] to-[#B23AC7] rounded-full opacity-20 blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
                <div className="absolute bottom-20 right-1/3 w-28 h-28 bg-gradient-to-r from-[#A05ACF] to-[#E25B3C] rounded-full opacity-15 blur-3xl animate-pulse" style={{animationDelay: '0.5s'}}></div>
              </div>

              <div className="relative z-10 max-w-6xl mx-auto px-4 py-8 md:py-12">
                {/* Hero Section with MoodyBeats Colors */}
                <div className="text-center mb-16">
                  {/* Desktop: Side by side */}
                  <div className="hidden md:flex items-center justify-center mb-6">
                    <h1
                      className="text-3xl md:text-6xl font-bold text-white tracking-tight mr-6" // changed font-black to font-bold
                      style={{
                        fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                        lineHeight: 1.1, // tighter line height for better vertical alignment
                        display: 'flex',
                        alignItems: 'center', // ensure vertical centering
                        marginBottom: 0 // remove extra margin
                      }}
                    >
                      About
                    </h1>
                    
                    {/* MoodyBeats Logo beside "About" */}
                    <div className="flex-shrink-0 flex items-center" style={{marginTop: '4px'}}> {/* add flex and small top margin for alignment */}
                      <svg width="300" height="40" viewBox="0 0 900 120" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginLeft: '-10px', position: 'relative', zIndex: 1 }}>
                        <text x="0" y="90" fontFamily="Montserrat, Arial, sans-serif" fontSize={moodyBeatsFontSize} fontWeight="500" letterSpacing="8">
                          <tspan fill="#4176D6">M</tspan>
                          <tspan fill="#7B9685">o</tspan>
                          <tspan fill="#C3D34B">o</tspan>
                          <tspan fill="#E0B15B">d</tspan>
                          <tspan fill="#D86C97">y</tspan>
                          <tspan fill="#B23AC7">B</tspan>
                          <tspan fill="#B23AC7">e</tspan>
                          <tspan fill="#A05ACF">a</tspan>
                          <tspan fill="#A05ACF">t</tspan>
                          <tspan fill="#E25B3C">s</tspan>
                        </text>
                      </svg>
                    </div>
                  </div>
                  
                  {/* Mobile: Stacked */}
                  <div className="md:hidden mb-6">
                    <h1 className="text-4xl font-black text-white mb-2 text-center" style={{
                      fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                    }}>
                      About
                    </h1>
                    <div className="flex justify-center mb-4">
                      <span className="text-3xl font-extrabold text-center" style={{
                        fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                        background: 'linear-gradient(90deg, #4176D6, #7B9685, #C3D34B, #E0B15B, #D86C97, #B23AC7, #A05ACF, #E25B3C)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        display: 'inline-block'
                      }}>
                        MoodyBeats
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                    Where your emotions meet the perfect melody. Discover music that resonates with your mood.
                  </p>
                </div>

                {/* Floating Cards Layout */}
                <div className="grid lg:grid-cols-2 gap-8 mb-16">
                  {/* Mission Card */}
                  <div className="group relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#4176D6] to-[#7B9685] rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
                    <div className="relative bg-gradient-to-br from-[#2a2a2a] to-[#1f1f1f] rounded-2xl p-8 border border-gray-800 hover:border-[#4176D6]/50 transition-all duration-300 hover:scale-105">
                      <div className="text-4xl mb-4">🎵</div>
                      <h3 className="text-2xl font-bold text-white mb-4">Our Mission</h3>
                      <p className="text-gray-300 leading-relaxed">
                        To create a personalized music experience that adapts to your emotional state, 
                        providing the perfect soundtrack for every moment of your life.
                      </p>
                    </div>
                  </div>
                  
                  {/* Vision Card */}
                  <div className="group relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#C3D34B] to-[#E0B15B] rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
                    <div className="relative bg-gradient-to-br from-[#2a2a2a] to-[#1f1f1f] rounded-2xl p-8 border border-gray-800 hover:border-[#C3D34B]/50 transition-all duration-300 hover:scale-105">
                      <div className="text-4xl mb-4">💡</div>
                      <h3 className="text-2xl font-bold text-white mb-4">The Vision</h3>
                      <p className="text-gray-300 leading-relaxed">
                        A world where music seamlessly integrates with your emotions, 
                        enhancing your mood and creating meaningful connections through sound.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Features Grid with Hover Effects */}
                <div className="mb-16">
                  <h2 className="text-4xl font-bold text-white text-center mb-12">What Makes Us Special</h2>
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                      { icon: '😊', title: 'Mood-Based Curation', desc: 'Intelligent algorithms that understand your emotional state', color: '#4176D6' },
                      { icon: '🎯', title: 'Personalized Experience', desc: 'Create custom playlists and build your perfect library', color: '#7B9685' },
                      { icon: '⚡', title: 'Smart Features', desc: 'Advanced playback controls and seamless synchronization', color: '#C3D34B' },
                      { icon: '💖', title: 'Like & Save', desc: 'Save your favorite tracks and discover new ones', color: '#D86C97' }
                    ].map((feature, index) => (
                      <div key={index} className="group relative">
                        <div className="absolute inset-0 bg-gradient-to-r rounded-xl blur-lg opacity-0 group-hover:opacity-30 transition-opacity" style={{background: `linear-gradient(to right, ${feature.color}, ${feature.color}80)`}}></div>
                        <div className="relative bg-gradient-to-br from-[#2a2a2a] to-[#1f1f1f] rounded-xl p-6 border border-gray-800 hover:border-current transition-all duration-300 hover:scale-105 text-center" style={{borderColor: feature.color + '40'}}>
                          <div className="text-3xl mb-4">{feature.icon}</div>
                          <h4 className="text-lg font-semibold text-white mb-3">{feature.title}</h4>
                          <p className="text-gray-400 text-sm">{feature.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mesmerizing CTA Section */}
                <div className="text-center">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#4176D6] via-[#C3D34B] to-[#D86C97] rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
                    <div className="relative bg-gradient-to-r from-[#4176D6] via-[#C3D34B] to-[#D86C97] rounded-3xl p-8 md:p-12 overflow-hidden">
                      <div className="absolute inset-0 bg-black/20"></div>
                      <div className="relative z-10">
                        <h3 className="text-3xl md:text-4xl font-bold text-white mb-6">Ready to Experience MoodyBeats?</h3>
                        <p className="text-gray-200 mb-8 text-lg max-w-2xl mx-auto">
                          Join the musical journey where every emotion finds its perfect soundtrack.
                        </p>
                        <button 
                          onClick={() => setCurrentPage('home')}
                          className="bg-white text-[#4176D6] px-10 py-4 rounded-full font-bold text-lg hover:bg-gray-100 hover:scale-105 transition-all duration-300 shadow-2xl"
                        >
                          Start Listening
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </main>
          ) : currentPage === 'contact' ? (
            <main>
              <div className="flex flex-col items-center justify-center h-full rounded-lg p-8 text-white w-full max-w-xl mx-auto mb-[100px] md:mb-0" style={{background: '#232323', opacity: 1, position: 'relative', zIndex: 1}}>
                <h2 className="text-4xl font-extrabold text-white mb-4">Contact Us</h2>
                <p className="text-lg text-neutral-400 max-w-2xl text-center mb-2">We'd love to hear from you! Please fill out the form below and our team will get back to you as soon as possible.</p>
                <p className="text-base text-neutral-400 max-w-2xl text-center mb-6">Whether you have feedback, questions, or partnership ideas, your message matters to us.</p>
                {contactSubmitted ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <span className="text-3xl mb-4">🎉</span>
                    <h3 className="text-2xl font-bold mb-2 text-green-400">Thank you for reaching out!</h3>
                    <p className="text-neutral-300 text-center">We've received your message and will get back to you soon.</p>
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit} className="w-full flex flex-col gap-4 mt-2 rounded-xl p-6 shadow-lg" style={{background: '#111', position: 'relative', zIndex: 2}}>
                    <div>
                      <label htmlFor="contact-name" className="block text-sm font-semibold mb-1">Name</label>
                      <input
                        id="contact-name"
                        name="name"
                        type="text"
                        required
                        value={contactForm.name}
                        onChange={handleContactInputChange}
                        className="w-full rounded-lg px-4 py-2 bg-[#181818] border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Your Name"
                        disabled={contactSubmitting}
                      />
                    </div>
                    <div>
                      <label htmlFor="contact-email" className="block text-sm font-semibold mb-1">Email</label>
                      <input
                        id="contact-email"
                        name="email"
                        type="email"
                        required
                        value={contactForm.email}
                        onChange={handleContactInputChange}
                        className="w-full rounded-lg px-4 py-2 bg-[#181818] border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="you@email.com"
                        disabled={contactSubmitting}
                      />
                    </div>
                    <div>
                      <label htmlFor="contact-message" className="block text-sm font-semibold mb-1">Message</label>
                      <textarea
                        id="contact-message"
                        name="message"
                        required
                        rows={4}
                        value={contactForm.message}
                        onChange={handleContactInputChange}
                        className="w-full rounded-lg px-4 py-2 bg-[#181818] border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Type your message here..."
                        disabled={contactSubmitting}
                      />
                    </div>
                    <button
                      type="submit"
                      className={`mt-2 w-full py-3 rounded-lg font-bold text-lg transition-all duration-300 shadow-lg bg-gradient-to-r from-blue-500 to-blue-800 text-white hover:from-blue-600 hover:to-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 ${contactSubmitting ? 'opacity-60 cursor-not-allowed' : ''}`}
                      disabled={contactSubmitting}
                    >
                      {contactSubmitting ? 'Submitting...' : 'Send Message'}
                    </button>
                  </form>
                )}
                {contactSuccess && (
                  <div className="text-green-400 text-center mb-4">{contactSuccess}</div>
                )}
                {contactError && (
                  <div className="text-red-400 text-center mb-4">{contactError}</div>
                )}
              </div>
            </main>
          ) : currentPage === 'library' ? (
            <main>
              {/* Mobile Library Page (only for mobile, md:hidden) */}
              <div className="md:hidden flex flex-col items-center justify-start h-full bg-[#181818] rounded-lg p-4 text-white w-full" style={{backgroundColor: '#181818', opacity: 1}}>
                {/* Header row: Your Library + plus icon */}
                <div className="w-full flex flex-row items-center justify-between mb-6">
                  <h2 className="text-2xl font-extrabold text-white">Your Library</h2>
                  <button
                    className="flex items-center justify-center w-10 h-10 rounded-full border border-gray-500 hover:bg-[#282828] transition-colors"
                    onClick={handleCreatePlaylistClick}
                    aria-label="Create Playlist"
                  >
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
                {/* List: Liked Songs, then playlists */}
                <div className="w-full flex flex-col gap-3">
                  {/* Liked Songs item */}
                  <button
                    className="w-full bg-[#1a1a1a] rounded-lg px-4 py-4 flex items-center text-lg font-semibold text-white shadow hover:bg-[#252525] transition-colors border border-[#2a2a2a]"
                    onClick={() => {
                      const liked = playlists.find(p => p.is_liked_playlist);
                      if (liked) handleSelectPlaylist(liked.id);
                    }}
                    disabled={!playlists.some(p => p.is_liked_playlist)}
                  >
                    <svg className="inline-block w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                    </svg>
                    Liked Songs
                  </button>
                  {/* Playlist items */}
                  {playlists.filter(p => !p.is_liked_playlist).length === 0 ? (
                    <div className="w-full bg-[#1a1a1a] rounded-lg px-4 py-4 text-lg text-gray-300 text-center border border-[#2a2a2a]">No playlists yet.</div>
                  ) : (
                    playlists.filter(p => !p.is_liked_playlist).map((playlist) => (
                      <div key={playlist.id} className="w-full bg-[#1a1a1a] rounded-lg px-4 py-4 flex items-center justify-between text-lg font-semibold text-white shadow hover:bg-[#252525] transition-colors border border-[#2a2a2a]">
                        <button
                          className="flex-1 text-left"
                          onClick={() => { handleSelectPlaylist(playlist.id); }}
                        >
                          {playlist.name}
                        </button>
                        {/* Three-dot menu for mobile */}
                        <div className="relative ml-2">
                          <button
                            className="text-gray-400 hover:text-white text-2xl px-2 py-1 rounded"
                            onClick={e => {
                              e.stopPropagation();
                              setPlaylistMenuOpen(playlistMenuOpen === playlist.id ? null : playlist.id);
                            }}
                            aria-label="Playlist options"
                          >
                            &#8942;
                          </button>
                          {playlistMenuOpen === playlist.id && (
                            <div
                              ref={playlistMenuRef}
                              className="absolute right-0 top-10 bg-[#232323] border border-[#404040] rounded shadow-lg z-50 min-w-[120px] flex flex-col"
                            >
                              <button
                                className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-[#282828]"
                                onClick={() => { openRenameModal(playlist.id, playlist.name); setPlaylistMenuOpen(null); }}
                              >Rename</button>
                              <button
                                className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-[#282828]"
                                onClick={() => { handleDeletePlaylist(playlist.id); setPlaylistMenuOpen(null); }}
                              >Delete</button>
                              <button
                                className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-[#282828]"
                                onClick={() => { openAddSongsModal(playlist.id); setPlaylistMenuOpen(null); }}
                              >Add Songs</button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                  {createPlaylistWarning && (
                    <div className="text-red-400 text-sm mt-2">{createPlaylistWarning}</div>
                  )}
                </div>
                {/* Create Playlist Modal for mobile (same as desktop, but always rendered globally) */}
                {showCreateModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 md:hidden">
                    <div className="bg-[#232323] rounded-lg p-6 w-full max-w-xs mx-4 relative">
                      <div className="mb-4 text-white font-semibold text-lg">Create Playlist</div>
                      {createPlaylistWarning && (
                        <div className="mb-2 text-red-400 text-sm font-semibold">{createPlaylistWarning}</div>
                      )}
                      <input
                        className="w-full px-3 py-2 rounded bg-[#181818] text-white border border-[#404040] mb-4 focus:outline-none"
                        placeholder="Playlist name"
                        value={newPlaylistName}
                        onChange={e => setNewPlaylistName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleCreatePlaylist(); }}
                        autoFocus
                        disabled={isCreatingPlaylist}
                      />
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setShowCreateModal(false)} className="px-4 py-1 rounded bg-gray-600 text-white" disabled={isCreatingPlaylist}>Cancel</button>
                        <button onClick={handleCreatePlaylist} className="px-4 py-1 rounded bg-blue-500 text-white font-semibold" disabled={isCreatingPlaylist}>{isCreatingPlaylist ? 'Creating...' : 'Create'}</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </main>
          ) : currentPage === 'faq' ? (
            <FAQPage />
          ) : (
            <main>
              {/* Hero Section */}
              <div
                className={`w-full flex flex-col items-center justify-center mb-8 md:mb-12 relative transition-colors duration-700`}
                style={selectedMood?.id ? {
                  position: 'relative',
                  background: moodHeroGradients[selectedMood.id],
                } : {position: 'relative'}}>

                {selectedMood ? (
                  <div className="w-full flex flex-col md:flex-row items-center justify-center mb-8 md:mb-12 relative transition-colors duration-700 gap-6 md:gap-12" style={{ minHeight: 220 }}>
                    {/* Left: Emoji with blurred blob */}
                    <div className="relative flex-shrink-0 flex flex-col items-center justify-center md:w-1/3 w-full">
                      <div
                        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl opacity-40"
                        style={{
                          width: 140,
                          height: 140,
                          background: `radial-gradient(circle, ${accentBarColors[selectedMood.id] || '#ffe066'} 0%, transparent 70%)`,
                          zIndex: 0,
                        }}
                      />
                      <span className="relative z-10 text-[5rem] md:text-[7rem] drop-shadow-lg animate-moodtext-fadein" style={{ lineHeight: 1 }}>{selectedMood.emoji}</span>
                    </div>
                    {/* Right: Mood name and description */}
                    <div className="flex flex-col items-center md:items-start justify-center md:w-2/3 w-full z-10">
                      <span className="font-extrabold text-3xl md:text-5xl text-white mb-2 md:mb-3 drop-shadow-lg" style={{ letterSpacing: '0.01em' }}>
                        {selectedMood.name}
                      </span>
                      {/* Accent bar */}
                      <div className="w-16 h-1 rounded-full mb-4 md:mb-6" style={{ background: accentBarColors[selectedMood.id] || '#ffe066' }} />
                      <span className="text-lg md:text-2xl font-medium text-white/90 text-center md:text-left max-w-xl animate-moodtext-fadein" style={{ textShadow: '0 1px 8px rgba(0,0,0,0.12)' }}>
                        {selectedMood.description}
                      </span>
                    </div>
                  </div>
                ) : (
                  <>
                    <div key={`hero-text-${textAnimKey}`}>
                      <h2
                        className={`text-2xl md:text-5xl font-extrabold mb-2 md:mb-4 tracking-tight drop-shadow-2xl transition-colors duration-700 text-white text-center animate-moodtext-fadein`}
                        style={{ animationDelay: '0ms' }}
                      >
                        {selectedMood ? moodHeadings[selectedMood.id] : 'How are you feeling today?'}
                      </h2>
                      <p
                        className={`text-base md:text-2xl mx-auto mb-8 md:mb-16 font-medium drop-shadow-lg text-center transition-colors duration-700 text-white animate-moodtext-fadein`}
                        style={{ maxWidth: '100%', animationDelay: '400ms' }}
                      >
                        {selectedMood ? genericSubheading : 'Select your mood and discover the perfect music to match your vibe'}
                      </p>
                    </div>
                    {/* Mood cards horizontal scroll layout */}
                    <div className="relative w-full">
                      {/* Right scroll arrow */}
                      {showRightArrow && (
                      <button
                          className="flex items-center justify-center absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-black/60 hover:bg-black/80 rounded-full p-2 shadow-lg transition-colors"
                        style={{ pointerEvents: 'auto' }}
                        onClick={() => scrollMoodCards(1)}
                        aria-label="Scroll right"
                        type="button"
                      >
                        <svg width="28" height="28" fill="none" stroke="white" strokeWidth="3" viewBox="0 0 24 24">
                          <path d="M9 6l6 6-6 6" />
                        </svg>
                      </button>
                      )}
                      <div
                        ref={moodScrollRef}
                        className="w-full overflow-x-auto overflow-y-hidden pb-20 scrollbar-hide mood-cards-scroll"
                        style={{ scrollBehavior: 'smooth' }}
                      >
                        <div className="flex gap-4 sm:gap-6 md:gap-4 lg:gap-6 xl:gap-8 min-w-max px-4 sm:px-6 md:px-8 lg:px-8 pr-4 sm:pr-6 md:pr-8 lg:pr-12 mood-cards-container">
                          {moods.map((mood, idx) => {
                            const isSelected = selectedMood?.id === mood.id;
                            // Less shiny, glassy, and accent bar for each mood
                            const moodGlowGradients = {
                              happy: `linear-gradient(135deg, #18181b 40%, #ffe066 100%)`,
                              sad: `linear-gradient(135deg, #18181b 40%, #e5e7eb 100%)`,
                              energetic: `linear-gradient(135deg, #18181b 40%, #ff6b6b 100%)`,
                              calm: `linear-gradient(135deg, #18181b 40%, #76e4f7 100%)`,
                              romantic: `linear-gradient(135deg, #18181b 40%, #ff6fa1 100%)`,
                              glamorous: `linear-gradient(135deg, #18181b 40%, #a78bfa 100%)`,
                            };
                            const accentBarColors = {
                              happy: '#ffe066',
                              sad: '#e5e7eb',
                              energetic: '#ff6b6b',
                              calm: '#76e4f7',
                              romantic: '#ff6fa1',
                              glamorous: '#a78bfa',
                            };
                            return (
                              <TiltCard
                                key={mood.id}
                                intensity={20}
                                scale={1.05}
                                className="relative mx-1 sm:mx-2 md:mx-4 lg:mx-8"
                              >
                                <button
                                  onClick={() => handleSelectMood(mood)}
                                  className={`relative flex flex-col items-center justify-center min-w-[80vw] max-w-[320px] h-[40vw] max-h-[200px] md:min-w-[480px] md:max-w-none md:h-[340px] md:max-h-none shadow-2xl transition-all duration-300 focus:outline-none overflow-hidden
                                    ${isSelected ? 'scale-105 z-20' : 'hover:scale-105 hover:z-10'}
                                    opacity-0 translate-y-8 animate-moodcard-popin
                                    hover:shadow-2xl hover:shadow-black/30`}
                                  style={{
                                    borderRadius: '1.5rem',
                                    border: `1.5px solid ${accentBarColors[mood.id]}`,
                                    boxShadow: '0 4px 32px 0 rgba(0,0,0,0.10)',
                                    backdropFilter: 'blur(8px)',
                                    background: moodGlowGradients[mood.id],
                                    position: 'relative',
                                    overflow: 'hidden',
                                    animationDelay: `${idx * 180}ms`,
                                    animationDuration: '1.6s',
                                    animationFillMode: 'forwards',
                                  }}
                                >
                                  {/* Whitish overlay for selected mood, tinted by mood */}
                                  {isSelected && (
                                    <div className="absolute inset-0 pointer-events-none transition-all duration-300" style={{
                                      background: `linear-gradient(135deg, ${getMoodTintColor(mood.id)} 60%, rgba(255,255,255,0.7) 100%)`,
                                      opacity: 0.7,
                                      zIndex: 3,
                                    }} />
                                  )}
                                  {/* Checkmark for selected mood */}
                                  {isSelected && (
                                    <span className="absolute top-2 right-2 md:top-4 md:right-4 bg-white rounded-full p-1 md:p-2 shadow-lg z-30">
                                      <svg className="w-5 h-5 md:w-7 md:h-7 text-green-500" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                      </svg>
                                    </span>
                                  )}
                                  <div className="flex flex-col items-center justify-center w-full h-full px-4 sm:px-5 md:px-6 lg:px-6 relative z-10">
                                    {/* Top Decorative Pattern */}
                                    <div className="absolute top-4 left-4 sm:top-4 sm:left-4 opacity-30">
                                      <div className="w-8 h-8 sm:w-8 sm:h-8 md:w-8 md:h-8 border-2 border-current rounded-full" style={{ borderColor: accentBarColors[mood.id] }}></div>
                                    </div>
                                    <div className="absolute top-6 right-6 sm:top-6 sm:right-6 opacity-20">
                                      <div className="w-4 h-4 sm:w-4 sm:h-4 md:w-4 md:h-4 border border-current rounded-full" style={{ borderColor: accentBarColors[mood.id] }}></div>
                                    </div>
                                    
                                    {/* Mood Icon with Background */}
                                    <div className="relative mb-3 sm:mb-4 md:mb-5 lg:mb-6">
                                      <div className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl drop-shadow-lg mb-2">
                                        {mood.emoji}
                                      </div>
                                      {/* Icon Background Glow */}
                                      <div className="absolute inset-0 -z-10 opacity-30 blur-xl" style={{
                                        background: `radial-gradient(circle, ${accentBarColors[mood.id]} 0%, transparent 70%)`,
                                        transform: 'scale(1.5)'
                                      }}></div>
                                    </div>
                                    
                                    {/* Mood Name */}
                                    <span className={`text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black mb-2 sm:mb-3 md:mb-4 lg:mb-4 capitalize drop-shadow-lg text-center text-white tracking-wide`} style={{ 
                                      textShadow: '0 2px 16px rgba(0,0,0,0.18)',
                                      fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                                    }}>
                                      {mood.name}
                                    </span>
                                    
                                    {/* Mood Description */}
                                    <span className={`text-base sm:text-base md:text-lg lg:text-base font-semibold opacity-95 text-center text-white leading-relaxed tracking-wide mb-2 sm:mb-3 md:mb-4 lg:mb-4`} style={{ 
                                      textShadow: '0 1px 8px rgba(0,0,0,0.12)',
                                      fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                                    }}>
                                      {mood.description}
                                    </span>
                                    

                                    
                                    {/* Bottom Decorative Elements */}
                                    <div className="absolute bottom-4 left-6 sm:bottom-4 sm:left-6 opacity-40">
                                      <div className="w-2 h-2 sm:w-2 sm:h-2 rounded-full" style={{ background: accentBarColors[mood.id] }}></div>
                                    </div>
                                    <div className="absolute bottom-6 right-4 sm:bottom-6 sm:right-4 opacity-30">
                                      <div className="w-3 h-3 sm:w-3 sm:h-3 md:w-3 md:h-3 border border-current rounded-full" style={{ borderColor: accentBarColors[mood.id] }}></div>
                                    </div>
                                    
                                    {/* Mood-specific Icons */}
                                    {/* <div className="absolute bottom-3 sm:bottom-3 left-1/2 transform -translate-x-1/2 opacity-60">
                                      {mood.id === 'happy' && <span className="text-lg sm:text-lg md:text-lg">🎵</span>}
                                      {mood.id === 'sad' && <span className="text-lg sm:text-lg md:text-lg">🎼</span>}
                                      {mood.id === 'energetic' && <span className="text-lg sm:text-lg md:text-lg">🔥</span>}
                                      {mood.id === 'calm' && <span className="text-lg sm:text-lg md:text-lg">🌸</span>}
                                      {mood.id === 'romantic' && <span className="text-lg sm:text-lg md:text-lg">💝</span>}
                                      {mood.id === 'glamorous' && <span className="text-lg sm:text-lg md:text-lg">📚</span>}
                                    </div> */}
                                    
                                    {/* Enhanced Gradient Overlay */}
                                    <div className="absolute inset-0 opacity-25 pointer-events-none" style={{
                                      background: `radial-gradient(circle at 30% 30%, ${accentBarColors[mood.id]}40 0%, transparent 50%), linear-gradient(135deg, transparent 0%, ${accentBarColors[mood.id]}10 100%)`
                                    }}></div>
                                  </div>
                                </button>
                              </TiltCard>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Recommended Songs */}
              {selectedMood && (
                <>
                  <h3 className={`text-lg md:text-2xl font-bold mb-3 md:mb-6 tracking-tight ${heroHeadingClass}`}>Recommended for {selectedMood.name}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                    {songsLoading &&
                      Array.from({ length: 4 }).map((_, idx) => (
                        <div
                          key={idx}
                          className="rounded-xl animate-pulse"
                          style={{ minHeight: 100, background: 'linear-gradient(135deg, #444 60%, #222 100%)', boxShadow: '0 4px 24px 0 rgba(0,0,0,0.18)' }}
                        />
                      ))
                    }
                    {songsError && <p style={{ color: 'red' }}>Error: {songsError}</p>}
                    {selectedMood && Array.isArray(songs) && songs.length === 0 && !songsLoading && !songsError && (
                      <p className="text-neutral-400 col-span-full">No songs found for this mood.</p>
                    )}
                    {selectedMood && Array.isArray(songs) && songs.length > 0 && songs.map((song, index) => {
                        const isCurrent = currentSong && currentSong.id === song.id;
                        const isPlayingThis = isCurrent && isPlaying;
                        return (
                          <div
                            key={index}
                            className={`relative flex flex-col justify-between rounded-xl shadow-lg transition-colors border-2 ${isCurrent ? 'border-blue-500' : ''} ${isPlayingThis ? 'ring-4 ring-blue-300' : ''} opacity-0 translate-y-8 animate-moodcard-popin`}
                            style={{
                              padding: '16px 12px 8px 12px',
                              minHeight: 100,
                              background: 'rgba(30,30,40,0.7)',
                              backdropFilter: 'blur(8px)',
                              borderColor: isCurrent ? '#3b82f6' : (moodBgColors[song.mood] || '#444'),
                              boxShadow: `0 2px 16px 0 ${(moodBgColors[song.mood] || '#ffe066')}33`,
                              color: '#fff',
                              animationDelay: `${index * 80}ms`,
                              animationDuration: '1.2s',
                              animationFillMode: 'forwards',
                            }}
                            onClick={() => {
                              setSelectedSongDetails(getFullSongById(song));
                            }}
                          >
                            <div>
                              <div className="text-base md:text-xl font-semibold mb-1 md:mb-2 truncate">{song.title}</div>
                              <div className="text-xs md:text-base opacity-80 truncate">{song.artist}</div>
                              {song.mood && (
                                <div className="flex items-center gap-1 mt-1">
                                  <span style={{
                                    display: 'inline-block',
                                    width: 7,
                                    height: 7,
                                    borderRadius: '50%',
                                    background: moodBgColors[song.mood] || '#888',
                                    marginRight: 4
                                  }} />
                                  <span style={{ color: moodBgColors[song.mood] || '#888', fontWeight: 500, fontSize: '0.85em' }}>{moodDisplayNames[song.mood]}</span>
                                </div>
                              )}
                              
                              {/* Expandable Icon Section */}
                              <div className="mt-3 relative" style={{ minHeight: '48px', marginTop: '25px' }}>
                                {/* Always visible button that transforms from hamburger to X */}
                                <button
                                  className="flex items-center justify-center transition-all duration-300 group text-gray-400 hover:text-white relative"
                                  onClick={e => {
                                    e.stopPropagation();
                                    const songId = song.id || index;
                                    setExpandedSongs(prev => ({
                                      ...prev,
                                      [songId]: !prev[songId]
                                    }));
                                  }}
                                  aria-label={expandedSongs[song.id || index] ? "Close actions" : "Expand actions"}
                                  title={expandedSongs[song.id || index] ? "Close menu" : "Open menu - Add to playlist, Like"}
                                >
                                  <div className="relative w-6 h-6">
                                    {/* Top line - rotates to become top-left to bottom-right */}
                                    <div 
                                      className={`absolute top-0 left-0 w-4 h-0.5 bg-current transition-all duration-300 ease-in-out ${
                                        expandedSongs[song.id || index] 
                                          ? 'rotate-45 translate-x-1 translate-y-2' 
                                          : ''
                                      }`}
                                      style={{ transformOrigin: '0 0' }}
                                    />
                                    
                                    {/* Middle line - fades out */}
                                    <div 
                                      className={`absolute top-1/2 left-0 w-4 h-0.5 bg-current transition-all duration-300 ease-in-out ${
                                        expandedSongs[song.id || index] 
                                          ? 'opacity-0 scale-x-0' 
                                          : 'opacity-100 scale-x-100'
                                      }`}
                                      style={{ transform: 'translateY(-50%)' }}
                                    />
                                    
                                    {/* Bottom line - rotates to become top-right to bottom-left */}
                                    <div 
                                      className={`absolute bottom-0 left-0 w-4 h-0.5 bg-current transition-all duration-300 ease-in-out ${
                                        expandedSongs[song.id || index] 
                                          ? '-rotate-45 translate-x-1 -translate-y-2' 
                                          : ''
                                      }`}
                                      style={{ transformOrigin: '0 100%' }}
                                    />
                                  </div>
                                </button>
                                {/* Expanded: Completely transparent box with plus and heart icons only */}
                                {expandedSongs[song.id || index] && (
                                  <div
                                    className={`absolute top-0 left-0 bg-transparent rounded-lg transition-all duration-700 overflow-hidden w-[80px] h-12 opacity-100 flex items-center px-2 gap-1`}
                                    style={{ zIndex: 10, transform: 'translateX(22px) translateY(-11px)' }}
                                  >
                                    {/* Plus Icon */}
                                    <button
                                      className="flex items-center justify-center text-green-400 hover:text-green-500 transition-all duration-500 ease-out fast-tooltip relative"
                                      style={{ 
                                        fontSize: 28,
                                        animation: 'slideInFromLeft 0.4s ease-out 0.1s both'
                                      }}
                                      onClick={e => {
                                        e.stopPropagation();
                                        setCurrentSong(song);
                                        setShowAddToPlaylistModal(true);
                                        setSelectedPlaylistForAdd(null);
                                        setAddToPlaylistError('');
                                      }}
                                      aria-label="Add to Playlist"
                                      title="Add to playlist"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-7 h-7">
                                        <path d="M12 4v16m8-8H4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                      </svg>
                                    </button>
                                    {/* Heart Icon */}
                                    <button
                                      className={`flex items-center justify-center transition-all duration-500 ease-out fast-tooltip relative ${
                                        likedSongIds.has(song.id) 
                                          ? 'text-blue-500 hover:text-blue-600' 
                                          : 'text-gray-400 hover:text-gray-300'
                                      }`}
                                      style={{ 
                                        fontSize: 32,
                                        animation: 'slideInFromLeft 0.4s ease-out 0.2s both'
                                      }}
                                      onClick={e => {
                                        e.stopPropagation();
                                        toggleLikeSong(song);
                                      }}
                                      aria-label={likedSongIds.has(song.id) ? 'Unlike song' : 'Like song'}
                                      title={likedSongIds.has(song.id) ? 'Remove from liked songs' : 'Add to liked songs'}
                                    >
                                      <svg 
                                        xmlns="http://www.w3.org/2000/svg" 
                                        fill={likedSongIds.has(song.id) ? "currentColor" : "none"} 
                                        viewBox="0 0 24 24" 
                                        strokeWidth={likedSongIds.has(song.id) ? 0 : 2} 
                                        stroke="currentColor" 
                                        className="w-8 h-8"
                                      >
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                                      </svg>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          <div className="flex items-center gap-2 absolute right-4" style={{ bottom: '21px' }}>
                            {/* Add to Smart Shuffle Button */}
                            <button
                              className={`flex items-center justify-center transition-colors duration-200 ${
                                smartShuffleLoading[song.id]
                                  ? 'text-blue-400 animate-pulse'
                                  : smartShuffleQueue.some(s => s.id === song.id)
                                    ? 'text-blue-500 drop-shadow-[0_0_8px_rgba(59,176,255,0.7)] scale-110'
                                    : (!isPremium && smartShuffleQueue.length >= 20 && !smartShuffleQueue.some(s => s.id === song.id))
                                      ? 'text-gray-500 cursor-not-allowed'
                                      : 'text-gray-400 hover:text-blue-400 hover:scale-110'
                              } transition-transform duration-200`}
                              style={{ fontSize: 28 }}
                              onClick={e => {
                                e.stopPropagation();
                                if (smartShuffleLoading[song.id]) return;
                                if (smartShuffleQueue.some(s => s.id === song.id)) {
                                  removeFromSmartShuffle(song.id);
                                } else if (!isPremium && smartShuffleQueue.length >= 20) {
                                  setShowPremiumModal(true);
                                } else {
                                  addToSmartShuffle(song);
                                }
                              }}
                              disabled={smartShuffleLoading[song.id] || (!isPremium && smartShuffleQueue.length >= 20 && !smartShuffleQueue.some(s => s.id === song.id))}
                              title={smartShuffleLoading[song.id] ? 'Processing...' : (!isPremium && smartShuffleQueue.length >= 20 && !smartShuffleQueue.some(s => s.id === song.id) ? 'Free users can only add up to 20 songs to Smart Shuffle. Upgrade to Premium for unlimited songs!' : (smartShuffleQueue.some(s => s.id === song.id) ? 'Remove from Smart Shuffle' : 'Add to Smart Shuffle'))}
                              aria-label={smartShuffleQueue.some(s => s.id === song.id) ? 'Remove from Smart Shuffle' : 'Add to Smart Shuffle'}
                            >
                              {smartShuffleLoading[song.id] ? (
                                // Loading spinner
                                <svg className="w-7 h-7 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              ) : smartShuffleQueue.some(s => s.id === song.id) ? (
                                // Shuffle icon for ON (blue glow, not bold)
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="w-7 h-7 drop-shadow-[0_0_8px_rgba(59,176,255,0.7)]">
                                  <path d="M4 4L20 20M4 20L20 4" stroke="#3bb0ff" strokeWidth="2" strokeLinecap="round"/>
                                  <path d="M16 3h5v5" stroke="#3bb0ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  <path d="M3 16h5v5" stroke="#3bb0ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              ) : (
                                // Shuffle icon for OFF (outlined, neutral)
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="w-7 h-7">
                                  <path d="M4 4L20 20M4 20L20 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                  <path d="M16 3h5v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  <path d="M3 16h5v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              )}
                            </button>
                            {/* Play Button */}
                            <button
                              className={`w-12 h-12 flex items-center justify-center rounded-full shadow bg-white text-black border-2 border-neutral-300 hover:bg-neutral-200 transition-colors`}
                          onClick={e => {
                            e.stopPropagation();
                            if (isCurrent && isPlaying) {
                              setIsPlaying(false);
                            } else {
                              setPlaybackContext({ type: 'mood', id: song.mood, songs });
                              handlePlaySong(song, index);
                              setSelectedSongDetails(getFullSongById(song));
                            }
                          }}
                          aria-label={isCurrent && isPlaying ? 'Pause' : 'Play'}
                        >
                          {isCurrent && isPlaying ? (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                              <rect x="6" y="5" width="4" height="14" rx="1" />
                              <rect x="14" y="5" width="4" height="14" rx="1" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                              <polygon points="6,4 20,12 6,20" fill="currentColor" />
                            </svg>
                          )}
                        </button>
                          </div>
                      </div>
                    );
                    })}
                  </div>
                </>
              )}

              {/* Footer inside Main Content */}
              <footer className="bg-[#232323] border-t border-[#404040] mt-20 mb-[80px] md:mb-0" style={{backdropFilter: 'none', background: '#232323'}}>
                <div className="container mx-auto px-6 py-8">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div>
                      <div className="flex items-center space-x-3 mb-4">
                        {/* MoodyBeats SVG Text Only */}
                        <svg width="300" height="40" viewBox="0 0 900 120" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginLeft: '-10px', position: 'relative', zIndex: 1 }}>
                          <text x="0" y="90" fontFamily="Montserrat, Arial, sans-serif" fontSize={moodyBeatsFontSize} fontWeight="500" letterSpacing="8">
                            <tspan fill="#4176D6">M</tspan>
                            <tspan fill="#7B9685">o</tspan>
                            <tspan fill="#C3D34B">o</tspan>
                            <tspan fill="#E0B15B">d</tspan>
                            <tspan fill="#D86C97">y</tspan>
                            <tspan fill="#B23AC7">B</tspan>
                            <tspan fill="#B23AC7">e</tspan>
                            <tspan fill="#A05ACF">a</tspan>
                            <tspan fill="#A05ACF">t</tspan>
                            <tspan fill="#E25B3C">s</tspan>
                          </text>
                        </svg>
                      </div>
                      <p className="text-gray-400 text-sm">
                        Your personal mood-based music companion. Discover the perfect soundtrack for every emotion.
                      </p>
                    </div>
                    {/* Features column removed */}
                    <div>
                      <h4 className="font-semibold mb-4">Support</h4>
                      <ul className="space-y-2 text-sm text-gray-400">
                        <li><button type="button" className="hover:text-blue-400 transition-colors bg-transparent border-none p-0 m-0 text-left" onClick={() => setCurrentPage('contact')}>Contact Us</button></li>
                        <li><button type="button" className="hover:text-blue-400 transition-colors bg-transparent border-none p-0 m-0 text-left" onClick={() => setCurrentPage('faq')}>FAQ</button></li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-4">Connect</h4>
                      <div className="flex space-x-4">
                        <a href="#" className="w-10 h-10 bg-[#282828] rounded-full flex items-center justify-center hover:bg-[#333333] transition-colors border border-[#404040]">
                          📘
                        </a>
                        <a href="#" className="w-10 h-10 bg-[#282828] rounded-full flex items-center justify-center hover:bg-[#333333] transition-colors border border-[#404040]">
                          🐦
                        </a>
                        <a href="#" className="w-10 h-10 bg-[#282828] rounded-full flex items-center justify-center hover:bg-[#333333] transition-colors border border-[#404040]">
                          📷
                        </a>
                        <a href="#" className="w-10 h-10 bg-[#282828] rounded-full flex items-center justify-center hover:bg-[#333333] transition-colors border border-[#404040]">
                          📺
                        </a>
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-[#404040] mt-8 pt-8 text-center text-sm text-gray-400">
                    <p>&copy; 2024 MoodyBeats. All rights reserved. Made with ❤️ for music lovers.</p>
                  </div>
                </div>
              </footer>
            </main>
          )}
        </div>
      </div>

      {/* Player Bar (fixed height) */}
      <div
        ref={playbarWrapperRef}
        onClick={e => {
          if (!currentSong) return;
          // Only open modal if click is NOT on a button or input inside the playbar
          let node = e.target;
          let insideControl = false;
          while (node && node !== playbarWrapperRef.current) {
            if (
              node.tagName === 'BUTTON' ||
              node.tagName === 'INPUT' ||
              node.getAttribute('role') === 'slider'
            ) {
              insideControl = true;
              break;
            }
            node = node.parentElement;
          }
          if (!insideControl) {
            setSelectedSongDetails(currentSong);
            setShowSongDetailsModal(true);
          }
        }}
        style={{ cursor: currentSong ? 'pointer' : 'default' }}
      >
        <PlayerBar
          currentSong={currentSong}
          setShowAddToPlaylistModal={setShowAddToPlaylistModal}
          setSelectedPlaylistForAdd={setSelectedPlaylistForAdd}
          setAddToPlaylistError={setAddToPlaylistError}
          isShuffled={isShuffled}
          toggleShuffle={toggleShuffle}
          handlePrev={handlePrev}
          isPlaying={isPlaying}
          globalAudioRef={globalAudioRef}
          setIsPlaying={setIsPlaying}
          handleNext={handleNext}
          repeatMode={repeatMode}
          toggleRepeat={toggleRepeat}
          getRepeatIcon={getRepeatIcon}
          audioTime={audioTime}
          progressSliderRef={progressSliderRef}
          isSeeking={isSeeking}
          seekValue={seekValue}
          setIsSeeking={setIsSeeking}
          setSeekValue={setSeekValue}
          progressPercent={progressPercent}
          likedSongIds={likedSongIds}
          toggleLikeSong={toggleLikeSong}
          smartShuffleMode={smartShuffleMode}
          toggleSmartShuffle={toggleSmartShuffle}
          isPremium={isPremium}
          smartShuffleQueue={smartShuffleQueue}
          setShowSmartShuffleModal={setShowSmartShuffleModal}
          isMuted={isMuted}
          setIsMuted={setIsMuted}
          lastVolume={lastVolume}
          handleVolume={handleVolume}
        />
      </div>
      {/* Add Songs Modal */}
      {showAddSongsModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black bg-opacity-40">
          {/* Modal container: mobile = bottom sheet, desktop = centered */}
          <div
            className="bg-[#232323] rounded-t-2xl md:rounded-lg w-full max-w-md md:max-w-2xl mx-0 md:mx-4 px-4 md:px-8 pt-4 md:pt-8 pb-4 md:pb-8 shadow-lg"
            style={{
              // On mobile, start further below search bar (approx 160px), end above bottom bar (approx 56px)
              maxHeight: 'calc(100vh - 120px)',
              minHeight: '0',
              marginBottom: '56px', // leave space for bottom bar
              marginTop: '32px', // reduced space for top
            }}
          >
            <div className="mb-4 md:mb-6 text-white font-semibold text-lg md:text-2xl text-center">Add Songs to Playlist</div>
            <div className="max-h-60 md:max-h-96 overflow-y-auto mb-4 md:mb-6">
              {allBackendSongs.length === 0 ? (
                <div className="text-gray-400 text-base md:text-lg text-center">No songs available.</div>
              ) : (
                <ul className="space-y-2 md:space-y-3">
                  {allBackendSongs.map((song, idx) => {
                    const key = getSongKey(song, idx);
                    const isChecked = selectedSongsToAdd.some(s => s._modalIdx === idx && getSongKey(s, s._modalIdx) === key);
                    return (
                      <li
                        key={key}
                        className="flex items-center p-2 md:p-3 bg-[#181818] rounded-lg hover:bg-[#282828] transition-colors cursor-pointer"
                        onClick={() => {
                          if (isChecked) {
                            setSelectedSongsToAdd(prev => prev.filter(s => !(s._modalIdx === idx && getSongKey(s, s._modalIdx) === key)));
                          } else {
                            setSelectedSongsToAdd(prev => {
                              if (!prev.some(s => s._modalIdx === idx && getSongKey(s, s._modalIdx) === key)) {
                                return [...prev, { ...song, _modalIdx: idx }];
                              }
                              return prev;
                            });
                          }
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          onClick={e => e.stopPropagation()}
                          className="mr-3 w-4 h-4 md:mr-4 md:w-5 md:h-5"
                        />
                        <span className="text-white text-base md:text-lg truncate">{song.title} <span className="text-gray-400">- {song.artist}</span></span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            <div className="flex justify-end gap-2 md:gap-4">
              <button onClick={() => setShowAddSongsModal(false)} className="px-4 py-2 md:px-6 md:py-3 rounded-lg bg-gray-600 text-white text-base md:text-lg hover:bg-gray-700 transition-colors">Cancel</button>
              <button 
                onClick={handleAddSongsToPlaylist} 
                className={`px-4 py-2 md:px-6 md:py-3 rounded-lg font-semibold text-base md:text-lg transition-colors ${
                  selectedSongsToAdd.length === 0 || (!isPremium && addSongsPlaylistId && playlists.find(p => p.id === addSongsPlaylistId)?.songs.length >= 20)
                    ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
                disabled={selectedSongsToAdd.length === 0 || (!isPremium && addSongsPlaylistId && playlists.find(p => p.id === addSongsPlaylistId)?.songs.length >= 20)}
                title={!isPremium && addSongsPlaylistId && playlists.find(p => p.id === addSongsPlaylistId)?.songs.length >= 20 ? 'Free users can only add up to 20 songs per playlist. Upgrade to Premium for unlimited playlists!' : ''}
              >
                {!isPremium && addSongsPlaylistId && playlists.find(p => p.id === addSongsPlaylistId)?.songs.length >= 20 ? 'Limit Reached' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Smart Shuffle Queue Modal */}
      {showSmartShuffleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div
            className="bg-[#282828] rounded-lg p-3 sm:p-6 w-[98vw] max-w-2xl max-w-full sm:w-full sm:max-w-2xl overflow-x-auto overflow-y-auto relative"
            style={{
              minWidth: '0',
              maxHeight: typeof window !== 'undefined' && window.innerWidth < 768 ? 'calc(85vh - 100px)' : '85vh'
            }}
          >
            {/* Close (X) button - top right on mobile, inline on desktop */}
            <button
              onClick={() => setShowSmartShuffleModal(false)}
              className="text-gray-400 hover:text-white transition-colors text-2xl sm:text-base absolute right-3 top-3 sm:static sm:ml-auto sm:mb-0 z-20"
              style={typeof window !== 'undefined' && window.innerWidth < 768 ? { position: 'absolute', right: 12, top: 12 } : {}}
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-2 sm:gap-0 pr-10 sm:pr-0">
              <div className="flex items-center space-x-2">
                <h2 className="text-lg sm:text-xl font-bold text-white truncate">Smart Shuffle Queue</h2>
                {isPremium && (
                  <div className="flex items-center space-x-1 bg-gradient-to-r from-blue-500 to-blue-800 text-white px-2 py-1 rounded-full text-xs font-semibold">
                    <span>★</span>
                    <span>Premium</span>
                  </div>
                )}
              </div>
              {/* Remove X button from here on desktop, now absolute on mobile */}
            </div>
            {/* Song List Area - make only this scrollable and reduce height */}
            <div className="overflow-y-auto" style={{maxHeight: typeof window !== 'undefined' && window.innerWidth < 768 ? '40vh' : '55vh'}}>
              {smartShuffleQueue.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                  <p>No songs in Smart Shuffle Queue</p>
                  <p className="text-sm mt-2">Add songs from any mood or playlist to create your smart shuffle mix!</p>
                  <div className="mt-4 p-4 bg-[#333333] rounded-lg text-left">
                    <p className="text-white font-medium mb-2">How to add songs:</p>
                    <ol className="text-sm space-y-1">
                      <li>1. Go to any mood (Happy, Sad, Energetic, etc.)</li>
                      <li>2. Look for the shuffle button next to each song</li>
                      <li>3. Click it to add the song to your Smart Shuffle Queue</li>
                      <li>4. The button will turn blue when added</li>
                      <li>5. Come back here and click "Start Smart Shuffle"</li>
                    </ol>
                  </div>
                </div>
              ) : (
                <>
                  {(isPremium ? smartShuffleQueue : smartShuffleQueue.slice(0, 20)).map((song, index) => (
                    <div
                      key={song.id}
                      className="flex flex-col xs:flex-row xs:items-center xs:justify-between p-2 sm:p-4 bg-[#333333] rounded-lg hover:bg-[#404040] transition-colors mb-2 sm:mb-3 gap-2 xs:gap-0"
                    >
                      <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                        <span className="text-gray-400 text-xs sm:text-sm w-6 sm:w-8 font-medium flex-shrink-0">{index + 1}</span>
                        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                          {/* Music icon with mood color */}
                          <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center ${moodIconColors[song.mood] || 'bg-gray-400'}`}> 
                            <span className="text-white font-bold text-xs sm:text-sm">🎵</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium truncate text-sm sm:text-base">{song.title}</p>
                            <p className="text-gray-400 text-xs sm:text-sm truncate">{song.artist} • {song.mood}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                        <button
                          onClick={() => handlePlaySong(song, index, { type: 'smart-shuffle', id: 'smart-shuffle' })}
                          className="p-1 sm:p-2 text-gray-400 hover:text-white transition-colors"
                          aria-label="Play song"
                        >
                          {/* Play icon can be added here if needed */}
                        </button>
                        <button
                          onClick={() => {
                            removeFromSmartShuffle(song.id);
                          }}
                          className="p-1 sm:p-2 text-gray-400 hover:text-red-400 transition-colors"
                          aria-label="Remove from queue"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                  {!isPremium && smartShuffleQueue.length > 20 && (
                    <div className="text-yellow-400 font-semibold text-center mt-4">
                      Only the first 20 songs are available for free users.<br />
                      <button
                        onClick={() => setShowPremiumModal(true)}
                        className="mt-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-800 text-white rounded-lg hover:from-blue-600 hover:to-blue-900 transition-colors text-sm font-semibold"
                      >
                        Upgrade to Premium to unlock all songs
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
            {/* Footer controls row */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-4 mt-4 sm:mt-6 pt-2 sm:pt-4 border-t border-gray-600 relative">
              <div className="text-gray-400 text-xs sm:text-sm flex items-center">
                {smartShuffleQueue.length} song{smartShuffleQueue.length !== 1 ? 's' : ''} in queue
                {!isPremium && (
                  <span className="text-yellow-400 ml-2">
                    ({smartShuffleQueue.length}/20)
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2 sm:gap-3 items-center justify-end w-full sm:w-auto">
                {/* On desktop, show upgrade beside Start Smart Shuffle. On mobile, move to bottom left (see below) */}
                {!isPremium && user && (
                  <button
                    onClick={() => setShowPremiumModal(true)}
                    className="hidden sm:inline-block px-3 py-2 sm:px-4 sm:py-2 bg-gradient-to-r from-blue-500 to-blue-800 text-white rounded-lg hover:from-blue-600 hover:to-blue-900 transition-colors text-xs sm:text-sm font-semibold ml-2"
                  >
                    ★ Upgrade to Premium
                  </button>
                )}
                <button
                  onClick={() => {
                    if (user) {
                      clearSmartShuffleQueueAPI();
                    } else {
                      setSmartShuffleQueue([]);
                      setSmartShuffleList([]);
                    }
                  }}
                  className="px-3 py-2 sm:px-4 sm:py-2 text-gray-400 hover:text-white transition-colors text-xs sm:text-sm"
                >
                  Clear All
                </button>
                <button
                  onClick={() => {
                    if (smartShuffleQueue.length > 0) {
                      toggleSmartShuffle();
                      setShowSmartShuffleModal(false);
                    }
                  }}
                  className={`px-4 py-2 sm:px-6 sm:py-2 rounded-full transition-colors font-medium text-xs sm:text-base ${
                    smartShuffleQueue.length > 0
                      ? 'bg-green-500 hover:bg-green-600 text-white'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                  disabled={smartShuffleQueue.length === 0}
                >
                  Start Smart Shuffle
                </button>
              </div>
              {/* Mobile: Upgrade button fixed at bottom left */}
              {!isPremium && user && (
                <button
                  onClick={() => setShowPremiumModal(true)}
                  className="sm:hidden fixed left-4 bottom-4 z-50 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-800 text-white rounded-lg hover:from-blue-600 hover:to-blue-900 transition-colors text-sm font-semibold shadow-lg"
                  style={{ minWidth: 180 }}
                >
                  ★ Upgrade to Premium
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Premium Upgrade Modal */}
      {showPremiumModal && ReactDOM.createPortal(
        <PremiumModal
          open={showPremiumModal}
          onClose={() => setShowPremiumModal(false)}
          onUpgrade={upgradeToPremium}
          isPremium={isPremium}
          features={[
            'Unlimited Smart Shuffle queue',
            'Unlimited songs per playlist',
            'Cross-device sync',
            'Advanced Smart Shuffle algorithm',
            'Premium badge & themes',
            'High-quality audio streaming',
            'Offline listening',
            'Custom playlist covers',
            'Early access to new features',
            'Priority support',
            'Ad-free experience',
            'Exclusive moods & playlists',
            'More skips per hour',
            'Custom mood creation',
            'Personalized recommendations',
            'Premium-only UI themes',
          ]}
        />,
        document.body
      )}
      
      {/* Add Songs Success Message */}
      {addSongsSuccess && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white px-6 py-2 rounded shadow-lg font-semibold">
          Songs added successfully!
        </div>
      )}
      {/* Rename Playlist Modal */}
      {showRenameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-[#232323] rounded-lg p-6 w-full max-w-xs mx-4">
            <div className="mb-4 text-white font-semibold text-lg">Rename Playlist</div>
            {/* Show warning if playlist already exists */}
            {createPlaylistWarning && (
              <div className="mb-2 text-red-400 text-sm font-semibold">{createPlaylistWarning}</div>
            )}
            <input
              className="w-full px-3 py-2 rounded bg-[#181818] text-white border border-[#404040] mb-4 focus:outline-none"
              placeholder="New playlist name"
              value={renamePlaylistName}
              onChange={e => setRenamePlaylistName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleRenamePlaylist(); }}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowRenameModal(false)} className="px-4 py-1 rounded bg-gray-600 text-white">Cancel</button>
              <button onClick={handleRenamePlaylist} className="px-4 py-1 rounded bg-blue-500 text-white font-semibold">Rename</button>
            </div>
          </div>
        </div>
      )}
      {/* Authentication Modal */}
      {showAuthModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAuthModal(false);
              setJustSignedUp(false);
              setAuthError('');
            }
          }}
        >
          <div className="bg-[#232323] rounded-lg p-6 w-full max-w-md mx-4 relative">
            <button 
              onClick={() => {
                setShowAuthModal(false);
                setJustSignedUp(false);
                setAuthError('');
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl font-bold focus:outline-none"
            >
              &times;
            </button>
            <div className="mb-4 text-white font-semibold text-lg">{isLoginMode ? 'Login' : 'Sign Up'}</div>
            {justSignedUp && isLoginMode && (
              <div className="mb-4 p-3 bg-green-900/20 border border-green-600/30 rounded-lg">
                <p className="text-green-500 text-sm font-medium">Account created! Please login with your credentials.</p>
              </div>
            )}
            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {!isLoginMode && (
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-400 mb-1">Username</label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={authFormData.username}
                    onChange={handleAuthInputChange}
                    className="w-full px-3 py-2 rounded bg-[#181818] text-white border border-[#404040] focus:outline-none focus:border-blue-500"
                    placeholder="Enter your username"
                    required
                  />
                </div>
              )}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={authFormData.email}
                  onChange={handleAuthInputChange}
                  className="w-full px-3 py-2 rounded bg-[#181818] text-white border border-[#404040] focus:outline-none focus:border-blue-500"
                  placeholder="Enter your email"
                  required
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-400 mb-1">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={authFormData.password}
                  onChange={handleAuthInputChange}
                  className="w-full px-3 py-2 rounded bg-[#181818] text-white border border-[#404040] focus:outline-none focus:border-blue-500"
                  placeholder="Enter your password"
                  required
                />
              </div>
              {authError && (
                <div className="p-3 bg-red-900/20 border border-red-600/30 rounded-lg">
                  <p className="text-red-400 text-sm font-medium flex items-center">
                    <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {authError}
                  </p>
                </div>
              )}
              <button
                type="submit"
                className="w-full px-4 py-2 rounded bg-blue-500 text-white font-semibold hover:bg-blue-600 transition-colors"
                disabled={authLoading}
              >
                {authLoading ? 'Loading...' : isLoginMode ? 'Login' : 'Sign Up'}
              </button>
            </form>
            <div className="mt-4 text-center text-sm text-gray-400">
              {isLoginMode ? 'Don\'t have an account?' : 'Already have an account?'}
              <span
                onClick={switchAuthMode}
                className="ml-1 cursor-pointer text-blue-400 hover:underline"
              >
                {isLoginMode ? 'Sign Up' : 'Login'}
              </span>
            </div>
          </div>
        </div>
      )}
      {/* Profile Sidebar */}
      {showProfileModal && (
        <>
          {/* Sidebar */}
          <aside className={`fixed right-0 top-0 h-full w-full max-w-xs shadow-2xl ${profileSidebarBg} flex flex-col z-50 transition-transform duration-300`} style={{minWidth: 260}}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-6 border-b border-[#232a34]">
              <span className="text-2xl font-bold text-white tracking-wide">Profile</span>
              <button onClick={() => setShowProfileModal(false)} className="text-gray-400 hover:text-white text-2xl font-bold focus:outline-none">&times;</button>
            </div>
            {/* Avatar */}
            <div className="flex flex-col items-center mt-8 mb-8">
              <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-4 relative ${isPremium ? 'ring-4 ring-blue-400' : ''}`}
                style={{ background: isPremium ? 'linear-gradient(135deg, #2563eb 60%, #1e40af 100%)' : 'linear-gradient(135deg, #374151 60%, #232a34 100%)' }}>
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 12c2.7 0 4.5-2.1 4.5-4.5S14.7 3 12 3 7.5 5.1 7.5 7.5 9.3 12 12 12zm0 2c-3 0-9 1.5-9 4.5V21h18v-2.5c0-3-6-4.5-9-4.5z" />
                </svg>
                {isPremium && (
                  <span className="absolute left-1/2 -translate-x-1/2 bottom-0 translate-y-1/2 bg-blue-600 text-white rounded-full px-3 py-1 text-xs font-bold shadow-lg border-2 border-white">★ Premium</span>
                )}
              </div>
            </div>
            {/* Info Cards */}
            <div className="flex flex-col gap-6 px-6 flex-1">
              <div className={`rounded-xl p-4 ${profileCardBg} border ${borderColor} shadow-sm`}>
                <div className="text-xs font-semibold text-gray-400 mb-1">Username</div>
                <div className="text-lg font-bold text-white">{user?.username}</div>
              </div>
              <div className={`rounded-xl p-4 ${profileCardBg} border ${borderColor} shadow-sm`}>
                <div className="text-xs font-semibold text-gray-400 mb-1">Email</div>
                <div className="text-lg font-bold text-white">{user?.email}</div>
              </div>
            </div>
            {/* Logout Button at Bottom */}
            <div className="px-6 pb-[78px] pt-4 mt-auto">
              <button
                onClick={() => {
                  handleLogout();
                  setShowProfileModal(false);
                }}
                className={`w-full py-3 rounded-xl font-bold ${logoutText} bg-transparent border-2 border-red-500 hover:bg-red-500 hover:text-white transition-colors text-lg`}
              >
                Log out
              </button>
            </div>
          </aside>
        </>
      )}
      {isAddingSongs && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 bg-blue-600 text-white px-6 py-2 rounded shadow-lg font-semibold">
          Please wait...
        </div>
      )}
      {isRenaming && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 bg-blue-600 text-white px-6 py-2 rounded shadow-lg font-semibold">
          Please wait...
        </div>
      )}
      {renameSuccess && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white px-6 py-2 rounded shadow-lg font-semibold">
          Playlist renamed successfully!
        </div>
      )}
      {isDeleting && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 bg-blue-600 text-white px-6 py-2 rounded shadow-lg font-semibold">
          Please wait...
        </div>
      )}
      {deleteSuccess && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white px-6 py-2 rounded shadow-lg font-semibold">
          Playlist deleted successfully!
        </div>
      )}
      {songDeleteSuccess && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white px-6 py-2 rounded shadow-lg font-semibold">
          Song deleted successfully from playlist!
        </div>
      )}
      {songLikeSuccess && (
        <div className="fixed top-32 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white px-6 py-2 rounded shadow-lg font-semibold">
          Song added to liked playlist successfully!
        </div>
      )}
      {isLoggingOut && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 bg-blue-600 text-white px-6 py-2 rounded shadow-lg font-semibold">
          Logging out...
        </div>
      )}
      {logoutSuccess && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white px-6 py-2 rounded shadow-lg font-semibold">
          Logged out successfully!
        </div>
      )}
      {authSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80">
          <div className="bg-white text-black rounded-lg p-10 text-2xl font-bold shadow-2xl flex flex-col items-center">
            <svg className="w-16 h-16 mb-4 text-green-500" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {justSignedUp ? (
              <div className="text-center">
                <div className="mb-4 text-green-600">Account created successfully!</div>
                <div className="text-lg font-normal text-gray-600">Please login with your email and password</div>
                <div className="mt-4 text-sm text-gray-500">The login form will appear below</div>
              </div>
            ) : (
              <div className="text-green-600">Login successful!</div>
            )}
          </div>
        </div>
      )}
      {isSearchFocused && searchQuery !== '' && (
        <SearchResultsDropdown
          anchorRef={getActiveSearchInputRef()}
          results={memoSearchResults}
          moodIconColors={memoMoodIconColors}
          onSongSelect={memoOnSongSelect}
          onPlaylistSelect={memoOnPlaylistSelect}
          selectedSong={searchSelectedSong}
          dropdownRef={searchDropdownRef}
          user={user}
        />
      )}
      {isCreatingPlaylist && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 bg-blue-600 text-white px-6 py-2 rounded shadow-lg font-semibold">
          Please wait...
        </div>
      )}
      {createPlaylistSuccess && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white px-6 py-2 rounded shadow-lg font-semibold">
          Playlist created successfully!
        </div>
      )}
             {/* Add to Playlist Modal */}
       {showAddToPlaylistModal && (
         <div 
           className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
           onClick={(e) => {
             if (e.target === e.currentTarget) {
               setShowAddToPlaylistModal(false);
               setSelectedPlaylistForAdd(null);
               setAddToPlaylistError('');
             }
           }}
         >
           <div className="bg-[#232323] rounded-lg p-8 w-full max-w-md mx-4 relative">
             <div className="mb-6 text-white font-semibold text-2xl">Add to Playlist</div>
             {addToPlaylistSuccess ? (
               <div className="text-green-400 mb-4 text-lg">Added to playlist!</div>
             ) : (
               <>
                 <select
                   className="w-full px-4 py-3 rounded-lg bg-[#181818] text-white border border-[#404040] mb-6 focus:outline-none focus:border-blue-500 text-lg"
                   value={selectedPlaylistForAdd || ''}
                   onChange={e => setSelectedPlaylistForAdd(e.target.value)}
                 >
                   <option value="" disabled>Select a playlist</option>
                   {playlists.filter(p => !p.is_liked_playlist).map(p => (
                     <option key={p.id} value={p.id}>{p.name}</option>
                   ))}
                 </select>
                 {addToPlaylistError && <div className="text-red-400 mb-4 text-lg">{addToPlaylistError}</div>}
                 <div className="flex justify-end gap-4">
                   <button onClick={() => { setShowAddToPlaylistModal(false); }} className="px-6 py-3 rounded-lg bg-gray-600 text-white text-lg hover:bg-gray-700 transition-colors">Cancel</button>
                   <button onClick={async () => {
                     if (!selectedPlaylistForAdd || !currentSong) return;
                     setAddToPlaylistError('');
                     try {
                       const res = await fetch(`${API_BASE}/playlists/${selectedPlaylistForAdd}/songs`, {
                         method: 'POST',
                         headers: getAuthHeaders(),
                         body: JSON.stringify({ song_id: currentSong.id })
                       });
                       if (res.ok) {
                         setAddToPlaylistSuccess(true);
                         setTimeout(() => {
                           setShowAddToPlaylistModal(false);
                           setAddToPlaylistSuccess(false);
                           setSelectedPlaylistForAdd(null);
                           setAddToPlaylistError('');
                         }, 1000);
                         await refreshPlaylists();
                       } else {
                         const data = await res.json();
                         setAddToPlaylistError(data.error || 'Failed to add song');
                         if (data.limit_reached) setShowPremiumModal(true);
                       }
                     } catch {
                       setAddToPlaylistError('Failed to add song');
                     }
                   }} className="px-6 py-3 rounded-lg bg-blue-500 text-white font-semibold text-lg hover:bg-blue-600 transition-colors" disabled={!selectedPlaylistForAdd}>Add</button>
                 </div>
               </>
             )}
           </div>
        </div>
      )}
      {/* Mobile Library Bottom Sheet/Modal */}
      {showMobileLibrary && (
        <div className="md:hidden fixed inset-0 z-50 flex items-end justify-center bg-black bg-opacity-40" onClick={e => { if (e.target === e.currentTarget) setShowMobileLibrary(false); }}>
          <div className="w-full max-w-[480px] mx-auto bg-[#181818] rounded-t-3xl shadow-2xl px-4 pt-4 pb-8 animate-slideInUp" style={{minHeight: '40vh', maxHeight: '80vh', overflowY: 'auto'}}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xl font-bold text-white">Library</span>
              <button onClick={() => setShowMobileLibrary(false)} className="text-gray-400 hover:text-white text-2xl font-bold focus:outline-none">&times;</button>
            </div>
            {/* Playlists and Create Playlist button (copied from sidebar, mobile only) */}
            {playlists.length === 0 ? (
              <div className="first-playlist-card bg-[#232323] rounded-lg p-4 mb-2 min-h-[100px] flex flex-col justify-between">
                <div>
                  <div className="font-medium text-white mb-2 text-base">Start your first playlist</div>
                  <div className="text-gray-300 text-xs mb-4">Create a playlist to organize your favorite tracks.</div>
                </div>
                <button onClick={handleCreatePlaylistClick} className="bg-white text-black font-semibold rounded-full px-4 py-2 text-sm mt-2 hover:scale-105 transition-all self-start">Create playlist</button>
                {createPlaylistWarning && (
                  <div className="text-red-400 text-sm mt-2">{createPlaylistWarning}</div>
                )}
              </div>
            ) : (
              <div className="playlist-container">
                <div className="playlist-header mb-2 text-white font-semibold text-base">Your Playlists</div>
                <ul className="space-y-2">
                  {playlists.map((playlist) => (
                    <li key={playlist.id} className={`playlist-card flex items-center justify-between rounded-lg px-3 py-2 relative cursor-pointer w-full transition-colors bg-[#232323] hover:bg-[#282828]`}
                      onClick={() => { handleSelectPlaylist(playlist.id); setShowMobileLibrary(false); }}>
                      <span className={`playlist-name truncate text-white text-base`}>
                        {playlist.is_liked_playlist && (
                          <svg className="inline-block w-4 h-4 mr-2 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                          </svg>
                        )}
                        {playlist.name}
                      </span>
                    </li>
                  ))}
                </ul>
                <button onClick={handleCreatePlaylistClick} className="bg-white text-black font-semibold rounded-full px-4 py-2 text-sm mt-4 hover:scale-105 transition-all self-start">Create playlist</button>
                {createPlaylistWarning && (
                  <div className="text-red-400 text-sm mt-2">{createPlaylistWarning}</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      {/* Mobile player bar: only show on mobile */}
      {currentSong && (
        <div className="md:hidden fixed left-0 w-full z-40 bg-black flex flex-row items-center justify-between px-3 py-2 border-t border-[#404040]" style={{minHeight: '64px', bottom: '56px'}}>
          {/* Song Info */}
          <div className="flex items-center gap-2 min-w-0 flex-1" onClick={() => {
            setSelectedSongDetails(currentSong);
            setShowSongDetailsModal(true);
          }} style={{ cursor: 'pointer' }}>
            <div className="w-10 h-10 flex items-center justify-center rounded-md bg-neutral-800 overflow-hidden">
              <svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' strokeWidth={2} stroke='currentColor' className='w-6 h-6 text-blue-400'><path strokeLinecap='round' strokeLinejoin='round' d='M9 19V6l12-2v13' /><circle cx='6' cy='18' r='3' fill='currentColor' /></svg>
            </div>
            <div className="flex flex-col justify-center min-w-0">
              <span className="font-semibold text-sm text-white truncate max-w-[120px]">{currentSong.title}</span>
              <span className="text-neutral-400 text-xs truncate max-w-[120px]">{currentSong.artist}</span>
            </div>
          </div>
          {/* Controls */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button className="w-8 h-8 flex items-center justify-center rounded-full text-neutral-400 hover:text-white transition-colors" onClick={handlePrev} aria-label="Previous">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><rect x="4" y="5" width="2" height="14" rx="1"/><polygon points="20,5 10,12 20,19"/></svg>
            </button>
            <button className="w-10 h-10 flex items-center justify-center rounded-full shadow border-2 bg-white text-black border-neutral-300" style={{marginTop: 0}} onClick={() => {
              if (!isPlaying && globalAudioRef.current) globalAudioRef.current.play();
              setIsPlaying(!isPlaying);
            }} aria-label={isPlaying ? 'Pause' : 'Play'}>
              {isPlaying ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <rect x="6" y="5" width="4" height="14" rx="1" />
                  <rect x="14" y="5" width="4" height="14" rx="1" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <polygon points="6,4 20,12 6,20" fill="currentColor" />
                </svg>
              )}
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full text-neutral-400 hover:text-white transition-colors" onClick={handleNext} aria-label="Next">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><rect x="18" y="5" width="2" height="14" rx="1"/><polygon points="4,5 14,12 4,19"/></svg>
            </button>
          </div>
          {/* Progress Bar (mobile, simple) */}
          <div className="absolute left-0 right-0 bottom-0 h-1 bg-[#232323]">
            <div style={{ width: globalAudioRef.current && globalAudioRef.current.duration ? ((globalAudioRef.current.currentTime / globalAudioRef.current.duration) * 100) + '%' : '0%' }} className="h-1 bg-blue-500 transition-all duration-200"></div>
          </div>
        </div>
      )}
      {/* Mobile Library Bottom Bar (black, fixed, full width, only on mobile) */}
      <div className="md:hidden fixed left-0 bottom-0 w-full bg-black z-50 flex items-center justify-center" style={{height: '56px'}}>
        <button
          className="flex items-center justify-center text-white text-3xl focus:outline-none bg-transparent border-none rounded-none shadow-none p-0 m-0"
          onClick={() => setShowMobileLibrary(true)}
          aria-label="Open Library"
          type="button"
          style={{marginTop: '-16px'}} // visually center the icon in the bar
        >
          {/* Minimal library SVG icon */}
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-white">
            <rect x="4" y="5" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
            <path d="M8 5v14M16 5v14" stroke="currentColor" strokeWidth="2" />
          </svg>
        </button>
      </div>
      {/* Mobile Bottom Navigation Bar (md:hidden) */}
      <div className="md:hidden fixed left-0 bottom-0 w-full bg-black z-50 flex flex-row justify-around items-center py-1 border-t border-[#222]">
        {/* Home */}
        <button
          className={`flex flex-col items-center justify-center focus:outline-none bg-transparent border-none rounded-none shadow-none p-0 m-0 ${currentPage === 'home' ? 'text-blue-400' : 'text-white'}`}
          onClick={() => { setCurrentPage('home'); setSelectedMood(null); setShowMobileLibrary(false); }}
          type="button"
        >
          {/* Home icon */}
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-7 h-7 mb-0.5 ${currentPage === 'home' ? 'text-blue-400' : 'text-white'}`}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l9-9 9 9M4 10v10a1 1 0 001 1h3m10-11v10a1 1 0 01-1 1h-3m-6 0h6" />
          </svg>
          <span className="text-xs font-medium mt-0.5">Home</span>
        </button>
        {/* Create Playlist */}
        <button
          className={`flex flex-col items-center justify-center focus:outline-none bg-transparent border-none rounded-none shadow-none p-0 m-0 ${currentPage === 'create' ? 'text-blue-400' : 'text-white'}`}
          onClick={handleCreatePlaylistClick}
          type="button"
        >
          {/* Plus icon */}
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-7 h-7 mb-0.5 ${currentPage === 'create' ? 'text-blue-400' : 'text-white'}`}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          <span className="text-xs font-medium mt-0.5">Create</span>
        </button>
        {/* Library */}
        <button
          className={`flex flex-col items-center justify-center focus:outline-none bg-transparent border-none rounded-none shadow-none p-0 m-0 ${currentPage === 'library' ? 'text-blue-400' : 'text-white'}`}
          onClick={() => { setCurrentPage('library'); setSelectedMood(null); setSelectedPlaylistId(null); }}
          type="button"
        >
          {/* Library icon */}
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-7 h-7 mb-0.5 ${currentPage === 'library' ? 'text-blue-400' : 'text-white'}`}>
            <rect x="4" y="5" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
            <path d="M8 5v14M16 5v14" stroke="currentColor" strokeWidth="2" />
          </svg>
          <span className="text-xs font-medium mt-0.5">Library</span>
        </button>
        {/* Premium */}
        <button
          className={`flex flex-col items-center justify-center focus:outline-none bg-transparent border-none rounded-none shadow-none p-0 m-0 ${currentPage === 'premium' ? 'text-blue-400' : 'text-white'}`}
          onClick={() => setShowPremiumModal(true)}
          type="button"
        >
          {/* MoodyBeats logo icon: white circle with black M */}
          <svg className="w-7 h-7 mb-0.5" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="12" fill="#fff" />
            <text x="8  " y="24" fontFamily="Montserrat, Arial, sans-serif" fontSize="18" fontWeight="bold" fill="#111">M</text>
          </svg>
          <span className="text-xs font-medium mt-0.5">Premium</span>
        </button>
      </div>
        </>
      )}
      {showContactSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80">
          <div className="bg-white text-black rounded-lg p-10 text-2xl font-bold shadow-2xl flex flex-col items-center">
            <svg className="w-16 h-16 mb-4 text-green-500" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <div className="text-green-600 mb-2">Message sent!</div>
            <div className="text-lg font-normal text-gray-600 text-center">Thank you for contacting us. We'll get back to you soon.</div>
          </div>
        </div>
      )}
    </div>
  );
}
