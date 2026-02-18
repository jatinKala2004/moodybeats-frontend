'use client';
import React, { useEffect, useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useDropdown } from '../dropdown-context';

// Utility for portal root
function getDropdownRoot() {
  let root = document.getElementById('dropdown-root');
  if (!root) {
    root = document.createElement('div');
    root.id = 'dropdown-root';
    document.body.appendChild(root);
  }
  return root;
}

const RecentlyPlayedDropdown = React.memo(
  ({ anchorRef, recentlyPlayed, moodIconColors, onClose, playerBarHeight = 104, onPlaySong }) => {
    const [style, setStyle] = useState({});
    const dropdownRef = useRef(null);
    useEffect(() => {
      function updateStyle() {
        if (anchorRef.current) {
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

    // Improved click-away logic
    useEffect(() => {
      function handleClick(event) {
        if (
          anchorRef.current &&
          !anchorRef.current.contains(event.target) &&
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target)
        ) {
          onClose();
        }
      }
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }, [anchorRef, onClose]);

    if (!anchorRef.current || !style.width || !style.top) return null;
    return ReactDOM.createPortal(
      <div style={style} ref={dropdownRef}>
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-3 text-white">Recently Played</h3>
          <div className="space-y-2">
            {recentlyPlayed.map((item) => (
              <div
                key={item.id}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-[#333333] transition-colors cursor-pointer group"
                onMouseDown={e => {
                  e.stopPropagation();
                  console.log('Recently played item clicked:', item.title, 'onPlaySong:', !!onPlaySong);
                  onPlaySong && onPlaySong(item);
                }}
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
    prev.onClose === next.onClose &&
    prev.onPlaySong === next.onPlaySong
);

const SearchResultsDropdown = React.memo(
  ({ anchorRef, results, moodIconColors, onSongSelect, onPlaylistSelect, selectedSong, playerBarHeight = 104, onClose }) => {
    const [style, setStyle] = useState({});
    const dropdownRef = useRef(null);
    useEffect(() => {
      function updateStyle() {
        if (anchorRef.current) {
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

    // Improved click-away logic
    useEffect(() => {
      function handleClick(event) {
        if (
          anchorRef.current &&
          !anchorRef.current.contains(event.target) &&
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target)
        ) {
          onClose();
        }
      }
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }, [anchorRef, onClose]);

    if (!anchorRef.current || !style.width || !style.top) return null;
    return ReactDOM.createPortal(
      <div style={style} ref={dropdownRef}>
        <div className="p-4">
          {results.songs.length > 0 && (
            <>
              <h3 className="text-lg font-semibold mb-2 text-white">Songs</h3>
              <div className="space-y-2 mb-4">
                {results.songs.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer group transition-colors ${selectedSong && selectedSong.id === item.id ? 'bg-blue-900' : 'hover:bg-[#333333]'}`}
                    onMouseDown={e => {
                      e.stopPropagation();
                      onSongSelect && onSongSelect(item);
                    }}
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
              <div className="space-y-2">
                {results.playlists.map((playlist) => (
                  <div
                    key={playlist.id}
                    className="flex items-center space-x-3 p-2 rounded-lg cursor-pointer group hover:bg-[#333333] transition-colors"
                    onMouseDown={e => {
                      e.stopPropagation();
                      onPlaylistSelect && onPlaylistSelect(playlist);
                    }}
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
            <div className="text-gray-400 text-center py-8">No songs or playlists found.</div>
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
    prev.selectedSong === next.selectedSong
);

export default function DropdownPortal() {
  const { dropdown, hideDropdown } = useDropdown();
  const { type, anchorRef, data, extra } = dropdown;
  if (!type || !anchorRef) return null;
  if (type === 'recentlyPlayed') {
    return (
      <RecentlyPlayedDropdown
        anchorRef={anchorRef}
        recentlyPlayed={data}
        
        moodIconColors={extra.moodIconColors}
        onClose={hideDropdown}
        onPlaySong={extra.onPlaySong}
      />
    );
  }
  if (type === 'searchResults') {
    return (
      <SearchResultsDropdown
        anchorRef={anchorRef}
        results={data.results}
        moodIconColors={data.moodIconColors}
        selectedSong={data.searchSelectedSong}
        dropdownRef={data.searchDropdownRef}
        onSongSelect={extra.onSongSelect}
        onPlaylistSelect={extra.onPlaylistSelect}
        onClose={hideDropdown}
      />
    );
  }
  return null;
} 