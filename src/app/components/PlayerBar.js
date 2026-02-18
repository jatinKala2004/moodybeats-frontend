import React, { useState } from "react";

export default function PlayerBar({
  currentSong,
  setShowAddToPlaylistModal,
  setSelectedPlaylistForAdd,
  setAddToPlaylistError,
  isShuffled,
  toggleShuffle,
  handlePrev,
  isPlaying,
  globalAudioRef,
  setIsPlaying,
  handleNext,
  repeatMode,
  toggleRepeat,
  getRepeatIcon,
  audioTime,
  progressSliderRef,
  isSeeking,
  seekValue,
  setIsSeeking,
  setSeekValue,
  progressPercent,
  likedSongIds,
  toggleLikeSong,
  smartShuffleMode,
  toggleSmartShuffle,
  isPremium,
  smartShuffleQueue,
  setShowSmartShuffleModal,
  isMuted,
  setIsMuted,
  lastVolume,
  handleVolume
}) {
  const [audioError, setAudioError] = useState("");
  if (!currentSong) return null;
  return (
    <div className="player-bar w-full bg-black z-40 flex flex-col font-sans hidden md:flex" style={{height: '104px', flex: '0 0 104px'}}>
      {/* Main controls and info (taller, centered) */}
      <div className="flex items-center justify-between w-full h-24 px-4 pb-1 relative">
        {/* Left: Song Info */}
        <div className="flex items-center gap-3 min-w-[300px] max-w-[300px]">
          <div className="w-12 h-12 flex items-center justify-center rounded-md bg-neutral-800 overflow-hidden">
            <svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' strokeWidth={2} stroke='currentColor' className='w-7 h-7 text-blue-400'><path strokeLinecap='round' strokeLinejoin='round' d='M9 19V6l12-2v13' /><circle cx='6' cy='18' r='3' fill='currentColor' /></svg>
          </div>
          <div className="flex flex-col justify-center min-w-0">
            <span className="font-semibold text-base text-white truncate max-w-[200px]">{currentSong.title}</span>
            <span className="text-neutral-400 text-xs truncate max-w-[200px]">{currentSong.artist}</span>
          </div>
          {/* Add to Playlist (+) Button beside song info */}
          <div className="relative group">
            <button
              className="flex items-center justify-center text-green-400 hover:text-green-500 transition-colors"
              style={{ fontSize: 24 }}
              onClick={() => {
                setShowAddToPlaylistModal(true);
                setSelectedPlaylistForAdd(null);
                setAddToPlaylistError('');
              }}
              aria-label="Add to Playlist"
              title="Add to Playlist"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-6 h-6">
                <path d="M12 4v16m8-8H4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-black rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-30 pointer-events-none">
              Add to Playlist
            </div>
          </div>
        </div>
        {/* Center: Controls and Progress */}
        <div className="flex flex-col items-center justify-center absolute left-1/2 -translate-x-1/2 w-full" style={{ pointerEvents: 'none' }}>
          <div className="flex items-center gap-4 justify-center mb-7" style={{ marginTop: '0px', pointerEvents: 'auto' }}>
            {/* Regular Shuffle Button */}
            <div className="relative group">
              <button 
                className={`w-7 h-7 flex items-center justify-center rounded-full transition-colors ${
                  isShuffled ? 'text-blue-500' : 'text-neutral-400 hover:text-white'
                }`} 
                onClick={toggleShuffle} 
                aria-label="Shuffle"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/>
                </svg>
              </button>
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-black rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                {isShuffled ? 'Turn Shuffle Off' : 'Turn Shuffle On'}
              </div>
            </div>
            <button className="w-7 h-7 flex items-center justify-center rounded-full text-neutral-400 hover:text-white transition-colors" onClick={handlePrev} aria-label="Previous">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><rect x="4" y="5" width="2" height="14" rx="1"/><polygon points="20,5 10,12 20,19"/></svg>
            </button>
            <button className="w-9 h-9 flex items-center justify-center rounded-full shadow border-2 bg-white text-black border-neutral-300" style={{marginTop: 0}} onClick={() => {
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
            <button className="w-7 h-7 flex items-center justify-center rounded-full text-neutral-400 hover:text-white transition-colors" onClick={handleNext} aria-label="Next">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><rect x="18" y="5" width="2" height="14" rx="1"/><polygon points="4,5 14,12 4,19"/></svg>
            </button>
            {/* Repeat Button */}
            <div className="relative group">
              <button 
                className={`w-7 h-7 flex items-center justify-center rounded-full transition-colors ${
                  repeatMode !== 'none' ? 'text-blue-500' : 'text-neutral-400 hover:text-white'
                }`} 
                onClick={toggleRepeat} 
                aria-label="Repeat"
              >
                {getRepeatIcon()}
              </button>
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-black rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                {repeatMode === 'none' ? 'Turn Repeat On' : repeatMode === 'one' ? 'Turn Repeat All On' : 'Turn Repeat Off'}
              </div>
            </div>
          </div>
          <div className="w-full flex justify-center" style={{ marginTop: '-18px', pointerEvents: 'auto' }}>
            <div className="max-w-[600px] w-full flex items-center gap-1">
              <span className="text-xs text-neutral-400 min-w-[32px] flex items-center justify-center">{audioTime.currentTime}</span>
              <div className="flex-1 mx-0.5 group group-progress flex items-center">
                <input
                  ref={progressSliderRef}
                  type="range"
                  min="0"
                  max={globalAudioRef.current && globalAudioRef.current.duration ? globalAudioRef.current.duration : 0}
                  step="0.01"
                  value={isSeeking ? seekValue : (globalAudioRef.current ? globalAudioRef.current.currentTime : 0)}
                  onChange={e => {
                    setIsSeeking(true);
                    setSeekValue(parseFloat(e.target.value));
                  }}
                  onPointerDown={() => setIsSeeking(true)}
                  onPointerUp={e => {
                    setIsSeeking(false);
                    if (globalAudioRef.current) {
                      globalAudioRef.current.currentTime = seekValue;
                    }
                  }}
                  className="progress-slider-custom w-full h-1 bg-transparent cursor-pointer"
                  style={{
                    background: 'transparent',
                    '--progress': `${progressPercent}%`,
                  }}
                />
              </div>
              <span className="text-xs text-neutral-400 min-w-[32px] flex items-center justify-center">{audioTime.duration}</span>
            </div>
          </div>
        </div>
        {/* Right: Volume, Heart, Smart Shuffle, and Queue */}
        <div className="flex items-center gap-2 min-w-[100px] max-w-[300px] justify-end">
          {/* Heart Button */}
          <div className="relative group">
            <button
              className={`flex items-center justify-center transition-colors ${
                likedSongIds.has(currentSong.id) 
                  ? 'text-blue-500 hover:text-blue-600' 
                  : 'text-gray-400 hover:text-gray-300'
              }`}
              style={{ fontSize: 28 }}
              onClick={() => toggleLikeSong(currentSong)}
              aria-label={likedSongIds.has(currentSong.id) ? 'Unlike song' : 'Like song'}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                fill={likedSongIds.has(currentSong.id) ? "currentColor" : "none"} 
                viewBox="0 0 24 24" 
                strokeWidth={likedSongIds.has(currentSong.id) ? 0 : 2} 
                stroke="currentColor" 
                className="w-7 h-7"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
            </button>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 px-2 py-1 text-xs text-white bg-black rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-30 pointer-events-none">
              {likedSongIds.has(currentSong.id) ? 'Unlike song' : 'Like song'}
            </div>
          </div>
          {/* Smart Shuffle Button */}
          <div className="relative group">
            <button 
              className={`w-7 h-7 flex items-center justify-center rounded-full transition-colors ${
                smartShuffleMode ? 'bg-[#0a1433] text-[#3bb0ff]' : 'bg-[#0a1433] text-neutral-400 hover:text-[#3bb0ff]'
              }`} 
              onClick={toggleSmartShuffle} 
              aria-label={smartShuffleMode ? 'Turn Smart Shuffle Off' : 'Turn Smart Shuffle On'}
            >
              {/* Shuffle icon with star at bottom-left tail */}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="w-5 h-5">
                {/* Shuffle arrows */}
                <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z" fill="currentColor"/>
                {/* Star at bottom-left tail */}
                <g>
                  <polygon points="3.5,20.5 4.2,22.1 5.9,22.1 4.5,23.1 5.1,24.7 3.5,23.7 1.9,24.7 2.5,23.1 1.1,22.1 2.8,22.1" fill="#3bb0ff"/>
                </g>
              </svg>
            </button>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 px-2 py-1 text-xs text-white bg-black rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-30 pointer-events-none">
              {smartShuffleMode ? 'Turn Smart Shuffle Off' : 'Turn Smart Shuffle On'}
              {isPremium && ' (Premium)'}
            </div>
          </div>
          {/* Smart Shuffle Queue Button */}
          <div className="relative group">
            <button 
              className={`w-7 h-7 flex items-center justify-center rounded-full transition-colors ${
                smartShuffleQueue.length > 0 ? 'text-blue-500' : 'text-neutral-400 hover:text-white'
              }`} 
              style={{ fontSize: 28 }}
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
            </button>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 px-2 py-1 text-xs text-white bg-black rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-30 pointer-events-none">
              Smart Shuffle Queue ({smartShuffleQueue.length})
            </div>
          </div>
          {/* Volume Controls - Grouped together */}
          <div className="flex items-center gap-1">
            <div className="relative group">
              <button onClick={() => {
                if (isMuted) {
                  setIsMuted(false);
                  if (globalAudioRef.current) {
                    globalAudioRef.current.muted = false;
                    globalAudioRef.current.volume = lastVolume;
                  }
                } else {
                  setIsMuted(true);
                  if (globalAudioRef.current) {
                    globalAudioRef.current.muted = true;
                  }
                }
              }} className="focus:outline-none">
                {isMuted ? (
                  // Muted icon
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-white"><path strokeLinecap="round" strokeLinejoin="round" d="M4 9v6h4l5 5V4L8 9H4z" /><line x1="19" y1="5" x2="5" y2="19" stroke="currentColor" strokeWidth="2"/></svg>
                ) : (
                  // Volume icon
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-white"><path strokeLinecap="round" strokeLinejoin="round" d="M4 9v6h4l5 5V4L8 9H4z" /></svg>
                )}
              </button>
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 px-2 py-1 text-xs text-white bg-black rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-30 pointer-events-none">
                {isMuted ? 'Unmute' : 'Mute'}
              </div>
            </div>
            <div className="relative w-20 flex items-center group group-volume">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={audioTime.volume}
                onChange={handleVolume}
                className="volume-slider-custom w-full h-1 bg-transparent cursor-pointer"
                style={{ background: 'transparent', '--volume': `${(audioTime.volume || 0) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
      {/* Only render audio if there is a valid source */}
      {(currentSong.file || currentSong.file_url) && (currentSong.file || currentSong.file_url).trim() !== '' && (
        <audio
          ref={globalAudioRef}
          src={
            (currentSong.file || currentSong.file_url).startsWith('http://') || (currentSong.file || currentSong.file_url).startsWith('https://')
              ? (currentSong.file || currentSong.file_url)
              : `http://localhost:5000${currentSong.file || currentSong.file_url}`
          }
          onPause={() => setIsPlaying(false)}
          onPlay={() => { setIsPlaying(true); setAudioError(""); }}
          onEnded={handleNext}
          onError={() => setAudioError("Sorry, this song could not be loaded. Please try another track.")}
          onLoadStart={() => setAudioError("")}
          onCanPlay={() => setAudioError("")}
        />
      )}
      {audioError && (
        <div className="w-full text-center text-red-400 bg-black bg-opacity-80 py-2 rounded mt-2">
          {audioError}
        </div>
      )}
    </div>
  );
} 