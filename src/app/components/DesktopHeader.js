import React from 'react';
import ReactDOM from 'react-dom';

function getDropdownRoot() {
  let root = document.getElementById('dropdown-root');
  if (!root) {
    root = document.createElement('div');
    root.id = 'dropdown-root';
    document.body.appendChild(root);
  }
  root.style.zIndex = '2147483647';
  root.style.position = 'relative';
  return root;
}

export default function DesktopHeader({
  moodDropdownButtonRef,
  showMoodDropdown,
  setShowMoodDropdown,
  moodDropdownStyle,
  moods,
  moodHeroGradients,
  selectedMood,
  handleSelectMood,
  searchInputRefDesktop,
  searchQuery,
  setSearchQuery,
  handleSearchFocus,
  handleSearchBlur,
  user,
  isPremium,
  setShowPremiumModal,
  setShowProfileModal,
  setShowAuthModal,
  isSearchFocused,
  memoRecentlyPlayed,
  memoMoodIconColors,
  getActiveSearchInputRef,
  handleSearchBlur: handleSearchBlurDropdown,
  RecentlyPlayedDropdown,
  heroHeadingClass,
  setCurrentPage,
  setSelectedMood,
  setSelectedSongDetails,
  currentPage
}) {
  return (
    <div className="header hidden md:block" style={{height: '72px', flex: '0 0 72px'}}>
      <header className="w-full h-full bg-[#0a0a0a]/95 backdrop-blur-md z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 relative" style={{height: 60}}>
              {/* Animated SVG Music Visualizer */}
              <svg
                width="320"
                height="60"
                viewBox="0 0 320 60"
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
                  <rect x="10" y="20" width="10" height="30" rx="5" fill="#4176D6">
                    <animate attributeName="height" values="30;50;30" dur="0.8s" repeatCount="indefinite" />
                    <animate attributeName="y" values="20;0;20" dur="0.8s" repeatCount="indefinite" />
                  </rect>
                  <rect x="30" y="10" width="10" height="40" rx="5" fill="#7B9685">
                    <animate attributeName="height" values="40;20;40" dur="0.7s" repeatCount="indefinite" />
                    <animate attributeName="y" values="10;30;10" dur="0.7s" repeatCount="indefinite" />
                  </rect>
                  <rect x="50" y="25" width="10" height="25" rx="5" fill="#C3D34B">
                    <animate attributeName="height" values="25;45;25" dur="0.9s" repeatCount="indefinite" />
                    <animate attributeName="y" values="25;5;25" dur="0.9s" repeatCount="indefinite" />
                  </rect>
                  <rect x="70" y="15" width="10" height="35" rx="5" fill="#E0B15B">
                    <animate attributeName="height" values="35;15;35" dur="0.6s" repeatCount="indefinite" />
                    <animate attributeName="y" values="15;35;15" dur="0.6s" repeatCount="indefinite" />
                  </rect>
                  <rect x="90" y="20" width="10" height="30" rx="5" fill="#D86C97">
                    <animate attributeName="height" values="30;50;30" dur="1.0s" repeatCount="indefinite" />
                    <animate attributeName="y" values="20;0;20" dur="1.0s" repeatCount="indefinite" />
                  </rect>
                  <rect x="110" y="10" width="10" height="40" rx="5" fill="#B23AC7">
                    <animate attributeName="height" values="40;20;40" dur="0.8s" repeatCount="indefinite" />
                    <animate attributeName="y" values="10;30;10" dur="0.8s" repeatCount="indefinite" />
                  </rect>
                  <rect x="130" y="25" width="10" height="25" rx="5" fill="#A05ACF">
                    <animate attributeName="height" values="25;45;25" dur="0.7s" repeatCount="indefinite" />
                    <animate attributeName="y" values="25;5;25" dur="0.7s" repeatCount="indefinite" />
                  </rect>
                  <rect x="150" y="15" width="10" height="35" rx="5" fill="#E25B3C">
                    <animate attributeName="height" values="35;15;35" dur="0.9s" repeatCount="indefinite" />
                    <animate attributeName="y" values="15;35;15" dur="0.9s" repeatCount="indefinite" />
                  </rect>
                </g>
              </svg>
              {/* MoodyBeats Text SVG Only */}
              <svg width="300" height="40" viewBox="0 0 900 120" fill="none" xmlns="http://www.w3.org/2000/svg" style={{marginLeft: '-10px', position: 'relative', zIndex: 1}}>
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
            <nav className="hidden md:flex items-center space-x-6 relative">
              <a href="#" className={`navbar-link hover:text-blue-400 transition-colors ${currentPage === 'home' && !showMoodDropdown ? 'border-b-2 border-blue-400 font-bold text-blue-400' : ''}`} onClick={e => {e.preventDefault(); setCurrentPage('home'); setSelectedMood && setSelectedMood(null); setSelectedSongDetails && setSelectedSongDetails(null);}}>
                Home
              </a>
              <button
                ref={moodDropdownButtonRef}
                className={`navbar-link ml-1 px-3 py-1 bg-transparent font-medium rounded focus:outline-none transition-colors ${showMoodDropdown ? 'border-b-2 border-blue-400 font-bold text-blue-400' : 'text-white/80 hover:text-blue-400'}`}
                style={{ boxShadow: 'none', border: 'none' }}
                onClick={() => setShowMoodDropdown((prev) => !prev)}
              >
                Change Mood
              </button>
                {/* Mood Dropdown Portal logic restored */}
                {showMoodDropdown && ReactDOM.createPortal(
                  <div style={moodDropdownStyle} className="absolute z-50">
                    <div className="flex flex-col gap-0 rounded-2xl shadow-2xl overflow-hidden">
                      {moods.map((mood, idx) => (
                        <button
                          key={mood.id}
                          onClick={() => { handleSelectMood(mood); setShowMoodDropdown(false); }}
                          className={`w-full h-[56px] text-left px-6 flex items-center font-bold text-lg transition-all duration-200 focus:outline-none ${selectedMood?.id === mood.id ? 'ring-2 ring-blue-400 z-10' : ''}`}
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
                  </div>,
                  getDropdownRoot()
                )}
              <a href="#" className={`navbar-link hover:text-blue-400 transition-colors ${currentPage === 'about' ? 'border-b-2 border-blue-400 font-bold text-blue-400' : ''}`} onClick={e => {e.preventDefault(); setCurrentPage('about');}}>
                About Us
              </a>
              <a href="#" className={`navbar-link hover:text-blue-400 transition-colors ${currentPage === 'contact' ? 'border-b-2 border-blue-400 font-bold text-blue-400' : ''}`} onClick={e => {e.preventDefault(); setCurrentPage('contact');}}>
                Contact
              </a>
              <div className="relative">
                <input
                  ref={searchInputRefDesktop}
                  type="text"
                  placeholder="Search for songs, artists and playlists..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={handleSearchFocus}
                  onBlur={handleSearchBlur}
                  className="bg-[#333333] border border-[#404040] rounded-full px-4 py-2 pl-10 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-96"
                  suppressHydrationWarning
                />
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
                {/* Recently Played Dropdown */}
                {user && isSearchFocused && searchQuery === '' && (
                  <RecentlyPlayedDropdown
                    anchorRef={getActiveSearchInputRef()}
                    recentlyPlayed={memoRecentlyPlayed}
                    moodIconColors={memoMoodIconColors}
                    onClose={handleSearchBlurDropdown}
                  />
                )}
              </div>
            </nav>
            {user && !isPremium && (
              <button
                onClick={() => setShowPremiumModal(true)}
                className="ml-2 px-3 py-1 bg-gradient-to-r from-blue-500 to-blue-800 text-white rounded-full hover:from-blue-600 hover:to-blue-900 transition-colors font-semibold shadow border border-blue-600 text-sm"
                style={{ fontSize: '0.95rem', minHeight: 0, minWidth: 0 }}
              >
                ★ Go Premium
              </button>
            )}
            {user ? (
              <div className="relative flex items-center">
                <button
                  onClick={() => setShowProfileModal(true)}
                  className={`w-10 h-10 rounded-full bg-gradient-to-br from-[#232a34] to-[#374151] flex items-center justify-center border-2 ${isPremium ? 'border-blue-400 shadow-blue-300/40 shadow-md' : 'border-[#232a34]'} hover:border-blue-400 transition-colors focus:outline-none`}
                  style={{ padding: 0 }}
                  aria-label="Open profile"
                >
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 12c2.7 0 4.5-2.1 4.5-4.5S14.7 3 12 3 7.5 5.1 7.5 7.5 9.3 12 12 12zm0 2c-3 0-9 1.5-9 4.5V21h18v-2.5c0-3-6-4.5-9-4.5z" />
                  </svg>
                  {isPremium && (
                    <span className="absolute -bottom-0.5 -right-0.5 bg-blue-600 text-white rounded-full px-0.5 py-0.5 text-[10px] font-bold shadow border-2 border-white flex items-center" title="Premium">
                      <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><polygon points="10,1 12.09,6.26 18,6.91 13.5,10.97 14.82,16.02 10,13.27 5.18,16.02 6.5,10.97 2,6.91 7.91,6.26" /></svg>
                    </span>
                  )}
                </button>
              </div>
            ) : (
              <button 
                className="bg-white text-black px-6 py-2 rounded-full hover:scale-105 transition-transform hover:bg-gray-100"
                onClick={() => setShowAuthModal(true)}
                suppressHydrationWarning
              >
                Login
              </button>
            )}
          </div>
        </div>
      </header>
    </div>
  );
} 