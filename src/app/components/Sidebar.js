import React from 'react';

export default function Sidebar({
  sidebarRef,
  sidebarOpen,
  showSidebarContent,
  setSidebarOpen,
  playlists,
  handleCreatePlaylistClick,
  showCreateModal,
  setShowCreateModal,
  createPlaylistWarning,
  newPlaylistName,
  setNewPlaylistName,
  handleCreatePlaylist,
  isCreatingPlaylist,
  selectedPlaylistId,
  playlistMenuOpen,
  setPlaylistMenuOpen,
  openRenameModal,
  handleDeletePlaylist,
  isPremium,
  openAddSongsModal,
  handleSelectPlaylist,
  setShowPremiumModal,
  playbackContext,
}) {
  return (
    <div
      ref={sidebarRef}
      className={`sidebar h-full border border-[#404040] relative flex flex-col items-start transition-all duration-300 flex-shrink-0 hidden md:flex`}
      style={{
        width: sidebarOpen ? 320 : 52,
        minWidth: 52,
        maxWidth: sidebarOpen ? 320 : 52,
        padding: 0,
        overflow: 'visible',
        background: '#000',
      }}
    >
      {/* Top row: icon (div1) and Library/+ (div2) */}
      <div className="w-full flex flex-row items-center pt-4 pl-0 pr-0">
        {/* div1: Icon */}
        <div className="flex items-center justify-center" style={{ width: 52, minWidth: 52 }}>
          <div
            className={`group cursor-pointer flex flex-col items-center w-full ${sidebarOpen ? 'opacity-100' : 'opacity-80'}`}
            onClick={() => {
              setSidebarOpen((prev) => !prev);
            }}
          >
            <div className={`w-8 h-8 bg-[#232323] rounded flex items-center justify-center`}>
              {/* Minimal library SVG icon */}
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-white">
                <rect x="4" y="5" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
                <path d="M8 5v14M16 5v14" stroke="currentColor" strokeWidth="2" />
              </svg>
            </div>
            {!sidebarOpen && (
              <span className="absolute left-1/2 -translate-x-1/2 mt-12 bg-[#282828] text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                Library
              </span>
            )}
          </div>
        </div>
        {/* div2: Library + +, only show when expanded and after transition */}
        {sidebarOpen && showSidebarContent && (
          <div className="flex items-center ml-2 flex-1 justify-between h-16 sidebar-library-container">
            <span className="sidebar-library-label text-base font-semibold text-white">Library</span>
            <div className="relative group">
              <button
                className="ml-3 mr-4 p-1 rounded-full hover:bg-[#232323] transition-colors"
                aria-label="Create Playlist"
                onClick={handleCreatePlaylistClick}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-white">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </button>
              <span className="absolute top-full left-1/2 -translate-x-[calc(50%+15px)] mt-2 bg-[#232323] text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                Create playlist
              </span>
            </div>
          </div>
        )}
      </div>
      {/* Playlist list: scrollable, fills remaining space */}
      {sidebarOpen && showSidebarContent && (
        <div className="w-full flex-1 flex flex-col justify-start pl-0 pt-4 fade-in overflow-y-auto" style={{ marginLeft: 0, transition: 'opacity 0.3s', opacity: showSidebarContent ? 1 : 0 }}>
          {playlists.length === 0 ? (
            <div className="first-playlist-card rounded-lg p-6 mb-2 min-h-[140px] flex flex-col justify-between" style={{background: '#232323'}}>
              <div>
                <div className="font-medium text-white mb-3 text-base">Start your first playlist</div>
                <div className="text-gray-300 text-xs mb-6">Create a playlist to organize your favorite tracks.</div>
              </div>
              <button onClick={handleCreatePlaylistClick} className="bg-white text-black font-semibold rounded-full px-5 py-2 text-sm mt-2 hover:scale-105 transition-all self-start">Create playlist</button>
              {createPlaylistWarning && (
                <div className="text-red-400 text-sm mt-2">{createPlaylistWarning}</div>
              )}
            </div>
          ) : (
            <div className="playlist-container">
              <div className="playlist-header mb-2 text-white font-semibold text-base">Your Playlists</div>
              <ul className="space-y-2">
                {playlists.map((playlist) => {
                  const isCurrentlyPlaying = playbackContext && playbackContext.type === 'playlist' && playbackContext.id === playlist.id;
                  return (
                    <li
                      key={playlist.id}
                      className={`playlist-card flex items-center justify-between rounded-lg px-4 py-2 relative cursor-pointer w-full transition-colors ${
                        isCurrentlyPlaying
                          ? 'bg-blue-600 border border-blue-500'
                          : 'hover:bg-[#282828]'
                      }`}
                      style={{background: '#232323'}}
                      onClick={() => handleSelectPlaylist(playlist.id)}
                    >
                      <span className={`playlist-name truncate ${isCurrentlyPlaying ? 'text-white font-semibold' : 'text-white'}`}>
                        {isCurrentlyPlaying && (
                          <svg className="inline-block w-4 h-4 mr-2 text-blue-300" fill="currentColor" viewBox="0 0 24 24">
                            <polygon points="6,4 20,12 6,20" />
                          </svg>
                        )}
                        {playlist.is_liked_playlist && (
                          <svg className="inline-block w-4 h-4 mr-2 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                          </svg>
                        )}
                        {playlist.name}
                      </span>
                      {/* Only show menu for regular playlists, not Liked Songs */}
                      {!playlist.is_liked_playlist && (
                        <div className="menu-icon relative" onClick={e => e.stopPropagation()}>
                          <button
                            className="text-gray-400 hover:text-white text-xl ml-2 px-2 py-1 rounded"
                            onClick={() => setPlaylistMenuOpen(playlistMenuOpen === playlist.id ? null : playlist.id)}
                          >
                            &#8942;
                          </button>
                          {playlistMenuOpen === playlist.id && (
                            <div className="absolute right-0 top-8 bg-[#232323] border border-[#404040] rounded shadow-lg z-50 min-w-[120px]">
                              <button
                                className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-[#282828]"
                                onClick={() => { openRenameModal(playlist.id, playlist.name); setPlaylistMenuOpen(null); }}
                              >Rename</button>
                              <button
                                className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-[#282828]"
                                onClick={() => { handleDeletePlaylist(playlist.id); setPlaylistMenuOpen(null); }}
                              >Delete</button>
                              <button
                                className={`block w-full text-left px-4 py-2 text-sm ${
                                  !isPremium && playlist.songs.length >= 20
                                    ? 'text-gray-500 cursor-not-allowed'
                                    : 'text-white hover:bg-[#282828]'
                                }`}
                                onClick={() => {
                                  if (!isPremium && playlist.songs.length >= 20) {
                                    setShowPremiumModal && setShowPremiumModal(true);
                                    setPlaylistMenuOpen(null);
                                  } else {
                                    openAddSongsModal(playlist.id);
                                    setPlaylistMenuOpen(null);
                                  }
                                }}
                                title={!isPremium && playlist.songs.length >= 20 ? 'Free users can only add up to 20 songs per playlist. Upgrade to Premium for unlimited playlists!' : ''}
                                disabled={!isPremium && playlist.songs.length >= 20}
                              >Add Songs</button>
                            </div>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          {/* Modal for creating playlist */}
          {showCreateModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
              <div className="bg-[#232323] rounded-lg p-6 w-full max-w-xs mx-4 relative" style={{background: '#232323'}}>
                <div className="mb-4 text-white font-semibold text-lg">Create Playlist</div>
                {/* Show warning if playlist already exists */}
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
      )}
    </div>
  );
} 