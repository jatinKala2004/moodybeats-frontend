import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';

export default function MobileHeader({
  user,
  setShowAuthModal,
  setShowProfileModal,
  isPremium,
  hamburgerRef,
  mobileMenuOpen,
  setMobileMenuOpen,
  searchInputRefMobile,
  searchQuery,
  setSearchQuery,
  handleSearchFocus,
  handleSearchBlur,
  isInputFocused,
  setIsInputFocused,
  getActiveSearchInputRef,
  memoSearchResults,
  memoMoodIconColors,
  memoOnSongSelect,
  memoOnPlaylistSelect,
  searchSelectedSong,
  searchDropdownRef,
  RecentlyPlayedDropdown,
  memoRecentlyPlayed,
  handleSearchBlurDropdown,
  moods,
  moodHeroGradients,
  selectedMood,
  handleSelectMood,
  mobileMenuRef,
  mobileMoodDropdownOpen,
  setMobileMoodDropdownOpen,
  setCurrentPage,
  setSelectedMood,
  showMobileLibrary,
  setShowMobileLibrary,
  showCreatePlaylistWarning,
  setShowCreateModal,
  createPlaylistWarning,
  handleCreatePlaylistClick,
  showPremiumModal,
  setShowPremiumModal,
  setSelectedSongDetails,
  currentPage
}) {
  // Modern hamburger animation state
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [drawerAnimating, setDrawerAnimating] = useState(false);
  const closeTimeout = useRef(null);

  // Sync drawerVisible with mobileMenuOpen
  useEffect(() => {
    if (mobileMenuOpen) {
      setDrawerVisible(true);
      setDrawerAnimating(false);
    } else if (drawerVisible) {
      setDrawerAnimating(true);
      closeTimeout.current = setTimeout(() => {
        setDrawerVisible(false);
        setDrawerAnimating(false);
      }, 350); // match animation duration
    }
    return () => clearTimeout(closeTimeout.current);
  }, [mobileMenuOpen]);

  return (
    <>
      <div className="md:hidden w-full bg-[#0a0a0a]/95 backdrop-blur-md z-50 relative flex flex-col" style={{paddingBottom: 0}}>
        {/* Row 1: Logo + MoodyBeats (left), Login/Profile + Hamburger (right) */}
        <div className="w-full flex flex-row items-center justify-between px-4 pt-2 pb-1">
          {/* Left: Logo + MoodyBeats */}
          <div className="flex items-center gap-2 relative" style={{height: 40}}>
            {/* Animated SVG Music Visualizer */}
            <svg
              width="180"
              height="40"
              viewBox="0 0 180 40"
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                zIndex: 0,
                filter: 'blur(2px) brightness(1.2)',
                opacity: 0.5,
                pointerEvents: 'none',
              }}
            >
              <g>
                <rect x="5" y="10" width="6" height="20" rx="3" fill="#4176D6">
                  <animate attributeName="height" values="20;32;20" dur="0.8s" repeatCount="indefinite" />
                  <animate attributeName="y" values="10;0;10" dur="0.8s" repeatCount="indefinite" />
                </rect>
                <rect x="18" y="5" width="6" height="30" rx="3" fill="#7B9685">
                  <animate attributeName="height" values="30;12;30" dur="0.7s" repeatCount="indefinite" />
                  <animate attributeName="y" values="5;23;5" dur="0.7s" repeatCount="indefinite" />
                </rect>
                <rect x="31" y="15" width="6" height="15" rx="3" fill="#C3D34B">
                  <animate attributeName="height" values="15;28;15" dur="0.9s" repeatCount="indefinite" />
                  <animate attributeName="y" values="15;2;15" dur="0.9s" repeatCount="indefinite" />
                </rect>
                <rect x="44" y="8" width="6" height="24" rx="3" fill="#E0B15B">
                  <animate attributeName="height" values="24;8;24" dur="0.6s" repeatCount="indefinite" />
                  <animate attributeName="y" values="8;24;8" dur="0.6s" repeatCount="indefinite" />
                </rect>
                <rect x="57" y="10" width="6" height="20" rx="3" fill="#D86C97">
                  <animate attributeName="height" values="20;32;20" dur="1.0s" repeatCount="indefinite" />
                  <animate attributeName="y" values="10;0;10" dur="1.0s" repeatCount="indefinite" />
                </rect>
                <rect x="70" y="5" width="6" height="30" rx="3" fill="#B23AC7">
                  <animate attributeName="height" values="30;12;30" dur="0.8s" repeatCount="indefinite" />
                  <animate attributeName="y" values="5;23;5" dur="0.8s" repeatCount="indefinite" />
                </rect>
                <rect x="83" y="15" width="6" height="15" rx="3" fill="#A05ACF">
                  <animate attributeName="height" values="15;28;15" dur="0.7s" repeatCount="indefinite" />
                  <animate attributeName="y" values="15;2;15" dur="0.7s" repeatCount="indefinite" />
                </rect>
                <rect x="96" y="8" width="6" height="24" rx="3" fill="#E25B3C">
                  <animate attributeName="height" values="24;8;24" dur="0.9s" repeatCount="indefinite" />
                  <animate attributeName="y" values="8;24;8" dur="0.9s" repeatCount="indefinite" />
                </rect>
              </g>
            </svg>
            {/* MoodyBeats Text SVG Only */}
            <svg width="160" height="30" viewBox="0 0 900 120" fill="none" xmlns="http://www.w3.org/2000/svg" style={{position: 'relative', zIndex: 1}}>
              <text x="0" y="90" fontFamily="Montserrat, Arial, sans-serif" fontSize="90" fontWeight="500" letterSpacing="8">
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
          {/* Right: Login/Profile + Hamburger */}
          <div className="flex items-center gap-2">
            {!user ? (
              <button
                className="bg-white text-black px-4 py-1 rounded-full hover:scale-105 transition-transform hover:bg-gray-100 text-sm font-semibold"
                onClick={() => setShowAuthModal(true)}
                suppressHydrationWarning
              >
                Login
              </button>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setShowProfileModal(true)}
                  className={`w-9 h-9 rounded-full bg-gradient-to-br from-[#232a34] to-[#374151] flex items-center justify-center border-2 ${isPremium ? 'border-blue-400 shadow-blue-300/40 shadow-md' : 'border-[#232a34]'} hover:border-blue-400 transition-colors focus:outline-none`}
                  style={{ padding: 0 }}
                  aria-label="Open profile"
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 12c2.7 0 4.5-2.1 4.5-4.5S14.7 3 12 3 7.5 5.1 7.5 7.5 9.3 12 12 12zm0 2c-3 0-9 1.5-9 4.5V21h18v-2.5c0-3-6-4.5-9-4.5z" />
                  </svg>
                  {isPremium && (
                    <span className="absolute bottom-0 right-0 translate-x-1/3 translate-y-1/3 bg-blue-600 text-white rounded-full px-0.5 py-0.5 text-[10px] font-bold shadow border-2 border-white flex items-center" title="Premium">
                      <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><polygon points="10,1 12.09,6.26 18,6.91 13.5,10.97 14.82,16.02 10,13.27 5.18,16.02 6.5,10.97 2,6.91 7.91,6.26" /></svg>
                    </span>
                  )}
                </button>
              </div>
            )}
            <button
              ref={hamburgerRef}
              className="flex items-center justify-center w-10 h-10 text-white focus:outline-none bg-transparent border-none rounded-none"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Open menu"
            >
              <div className="relative w-7 h-7">
                {/* Modern Hamburger Icon */}
                <span className={`absolute left-0 top-1 w-7 h-1 bg-current rounded transition-all duration-300 ${mobileMenuOpen ? 'rotate-45 top-3.5' : ''}`}></span>
                <span className={`absolute left-0 top-3.5 w-7 h-1 bg-current rounded transition-all duration-300 ${mobileMenuOpen ? 'opacity-0 scale-x-0' : ''}`}></span>
                <span className={`absolute left-0 top-6 w-7 h-1 bg-current rounded transition-all duration-300 ${mobileMenuOpen ? '-rotate-45 top-3.5' : ''}`}></span>
              </div>
            </button>
          </div>
        </div>
        {/* Row 2: Search bar (full width, below header) */}
        <div className="w-full px-4 pb-2 mt-2">
          <div className="relative w-full">
            <input
              ref={searchInputRefMobile}
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={handleSearchFocus}
              onBlur={handleSearchBlur}
              className="w-full bg-[#333333] border border-[#404040] rounded-full px-4 py-2 pl-10 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              suppressHydrationWarning
            />
            {/* Conditionally render left icon: back arrow if focused, search icon if not */}
            {isInputFocused ? (
              <button
                type="button"
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 focus:outline-none"
                style={{padding: 0, background: 'none', border: 'none'}}
                onClick={() => {
                  setIsInputFocused(false);
                  if (searchInputRefMobile.current) searchInputRefMobile.current.blur();
                }}
                aria-label="Back"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            ) : (
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                🔍
              </span>
            )}
            {/* X Button for clearing/closing search - removed as per user request */}
            {/* Search Results Dropdown (mobile) */}
            {/*isInputFocused && searchQuery !== '' && (
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
            )*/}
            {/* Recently Played Dropdown (mobile) */}
            {/*user && isInputFocused && searchQuery === '' && (
              <RecentlyPlayedDropdown
                anchorRef={getActiveSearchInputRef()}
                recentlyPlayed={memoRecentlyPlayed}
                moodIconColors={memoMoodIconColors}
                onClose={handleSearchBlurDropdown}
              />
            )*/}
          </div>
        </div>
      </div>
      {/* MOBILE MENU DRAWER */}
      {(drawerVisible || drawerAnimating) && (
        <div className="fixed left-0 right-0 z-50 flex" style={{top: 60, height: `calc(100vh - 60px)`}}>
          {/* Overlay */}
          <div className="fixed inset-0 bg-black bg-opacity-60" style={{top: 60, height: `calc(100vh - 60px)`}} onClick={() => setMobileMenuOpen(false)}></div>
          {/* Drawer */}
          <nav
            ref={mobileMenuRef}
            className={`relative ml-auto w-72 max-w-full h-full bg-white/10 backdrop-blur-2xl shadow-2xl flex flex-col p-4 z-50 rounded-l-3xl border-l border-white/10 ${mobileMenuOpen && !drawerAnimating ? 'animate-slide-in-right' : 'animate-slide-out-right'}`}
            style={{top: 0, height: '100%', boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)'}}>
            <ul className="flex flex-col gap-2 text-base font-semibold">
              <li>
                <button
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 text-left group shadow-sm hover:bg-blue-100/10 hover:text-blue-400 ${currentPage === 'home' ? 'bg-gradient-to-r from-blue-500/80 to-blue-400/80 text-white font-bold shadow-lg' : 'text-white/90'}`}
                  onClick={() => { setCurrentPage('home'); setSelectedMood(null); setMobileMenuOpen(false); setSelectedSongDetails && setSelectedSongDetails(null); }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l9-9 9 9M4 10v10a1 1 0 001 1h3m10-11v10a1 1 0 01-1 1h-3m-6 0h6" /></svg>
                  Home
                </button>
              </li>
              <li className="relative">
                <button
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 text-left group shadow-sm hover:bg-blue-100/10 hover:text-blue-400 ${mobileMoodDropdownOpen ? 'bg-gradient-to-r from-blue-500/80 to-blue-400/80 text-white font-bold shadow-lg' : 'text-white/90'}`}
                  onClick={() => setMobileMoodDropdownOpen((v) => !v)}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                  Change Mood
                  <svg className={`w-5 h-5 ml-auto transition-transform ${mobileMoodDropdownOpen ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </button>
                {/* Inline dropdown for moods, not floating */}
                {mobileMoodDropdownOpen && (
                  <div className="w-full bg-[#232323] rounded-2xl shadow-2xl mt-2">
                    <div className="flex flex-col gap-0 rounded-2xl overflow-hidden">
                      {moods.map((mood, idx) => (
                        <button
                          key={mood.id}
                          onClick={() => { handleSelectMood(mood); setMobileMoodDropdownOpen(false); setMobileMenuOpen(false); }}
                          className={`w-full h-[48px] text-left px-6 flex items-center font-bold text-base transition-all duration-200 focus:outline-none ${selectedMood?.id === mood.id ? 'ring-2 ring-blue-400 z-10' : ''}`}
                          style={{
                            background: moodHeroGradients[mood.id],
                            color: '#fff',
                            border: `1.5px solid ${selectedMood?.id === mood.id ? '#3bb0ff' : '#444'}`,
                          }}
                        >
                          {mood.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </li>
              <li>
                <button
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 text-left group shadow-sm hover:bg-blue-100/10 hover:text-blue-400 ${currentPage === 'about' ? 'bg-gradient-to-r from-blue-500/80 to-blue-400/80 text-white font-bold shadow-lg' : 'text-white/90'}`}
                  onClick={() => { setCurrentPage('about'); setMobileMenuOpen(false); }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 20.5C7.305 20.5 3.5 16.695 3.5 12S7.305 3.5 12 3.5 20.5 7.305 20.5 12 16.695 20.5 12 20.5z" /></svg>
                  About Us
                </button>
              </li>
              <li>
                <button
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 text-left group shadow-sm hover:bg-blue-100/10 hover:text-blue-400 ${currentPage === 'contact' ? 'bg-gradient-to-r from-blue-500/80 to-blue-400/80 text-white font-bold shadow-lg' : 'text-white/90'}`}
                  onClick={() => { setCurrentPage('contact'); setMobileMenuOpen(false); }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 10.5a8.38 8.38 0 01-1.9.98c-.46.17-.95.32-1.45.44a8.5 8.5 0 01-7.3 0c-.5-.12-.99-.27-1.45-.44A8.38 8.38 0 013 10.5m9 7.5v-1.5m0 0a4.5 4.5 0 00-4.5-4.5h-3a4.5 4.5 0 00-4.5 4.5V18a2 2 0 002 2h14a2 2 0 002-2v-1.5a4.5 4.5 0 00-4.5-4.5h-3a4.5 4.5 0 00-4.5 4.5V18" /></svg>
                  Contact Us
                </button>
              </li>
              {user && (
                <li>
                  <button
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 text-left group shadow-sm hover:bg-blue-100/10 hover:text-blue-400 text-white/90"
                    onClick={() => { setShowProfileModal(true); setMobileMenuOpen(false); }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 12c2.7 0 4.5-2.1 4.5-4.5S14.7 3 12 3 7.5 5.1 7.5 7.5 9.3 12 12 12zm0 2c-3 0-9 1.5-9 4.5V21h18v-2.5c0-3-6-4.5-9-4.5z" /></svg>
                    Profile
                  </button>
                </li>
              )}
              {!user && (
                <li>
                  <button
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 text-left group shadow-sm hover:bg-blue-100/10 hover:text-blue-400 text-white/90"
                    onClick={() => { setShowAuthModal(true); setMobileMenuOpen(false); }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" /></svg>
                    Login
                  </button>
                </li>
              )}
            </ul>
          </nav>
        </div>
      )}
    </>
  );
} 