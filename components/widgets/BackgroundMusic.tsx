'use client';

import { useState, useEffect, useRef } from 'react';
import { Music, Music2, Volume2, VolumeX } from 'lucide-react';

export default function BackgroundMusic() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.3); // Default 30% volume
  const [isMuted, setIsMuted] = useState(false);
  const [showVolume, setShowVolume] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio and load saved preferences
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const audio = new Audio('/Endless_Storm_Epic_Orchestral_Battle_Music_KLICKAUD.mp3');
      audio.loop = true;
      audio.volume = volume;
      audioRef.current = audio;

      // Load saved preferences
      const savedPlaying = localStorage.getItem('bgMusicPlaying') === 'true';
      const savedVolume = parseFloat(localStorage.getItem('bgMusicVolume') || '0.3');
      const savedMuted = localStorage.getItem('bgMusicMuted') === 'true';

      setVolume(savedVolume);
      setIsMuted(savedMuted);
      audio.volume = savedMuted ? 0 : savedVolume;

      if (savedPlaying) {
        audio.play().catch(err => {
          console.log('Autoplay prevented:', err);
          setIsPlaying(false);
        });
        setIsPlaying(true);
      }

      return () => {
        audio.pause();
        audio.src = '';
      };
    }
  }, []);

  // Update volume when it changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
      localStorage.setItem('bgMusicVolume', volume.toString());
    }
  }, [volume, isMuted]);

  const togglePlay = async () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      localStorage.setItem('bgMusicPlaying', 'false');
    } else {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
        localStorage.setItem('bgMusicPlaying', 'true');
      } catch (err) {
        console.log('Play failed:', err);
        setIsPlaying(false);
      }
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    localStorage.setItem('bgMusicMuted', (!isMuted).toString());
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  return (
    <div 
      className="fixed bottom-24 sm:bottom-4 right-4 z-40 flex items-center gap-2 group"
      onMouseEnter={() => setShowVolume(true)}
      onMouseLeave={() => setShowVolume(false)}
      onTouchStart={() => setShowVolume(true)}
    >
      {/* Volume slider - shown on hover */}
      <div className={`flex items-center gap-2 bg-[#040c05] border border-[#1a3a1a] rounded-lg px-3 py-2 backdrop-blur-sm transition-all duration-300 ${
        showVolume ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2 pointer-events-none'
      }`}>
        <button
          onClick={toggleMute}
          className="text-[#3a6a4a] hover:text-[#5a8a6a] transition-colors"
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={isMuted ? 0 : volume}
          onChange={handleVolumeChange}
          className="w-20 h-1 bg-[#1a3a1a] rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#ff4400] [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[#ff4400] [&::-moz-range-thumb]:border-0"
          aria-label="Volume"
        />
      </div>

      {/* Play/Pause button */}
      <button
        onClick={togglePlay}
        className="relative flex items-center justify-center w-12 h-12 bg-[#040c05] border border-[#1a3a1a] rounded-full hover:border-[#2a5a3a] transition-all duration-300 hover:scale-110 active:scale-95 shadow-lg shadow-black/30 backdrop-blur-sm"
        aria-label={isPlaying ? 'Pause background music' : 'Play background music'}
      >
        {isPlaying ? (
          <Music2 size={20} className="text-[#ff6633] animate-pulse-slow" />
        ) : (
          <Music size={20} className="text-[#3a6a4a] group-hover:text-[#5a8a6a]" />
        )}
        
        {/* Pulse ring when playing */}
        {isPlaying && (
          <div className="absolute inset-0 rounded-full border-2 border-[#ff4400]/30 animate-ping" style={{ animationDuration: '2s' }} />
        )}
      </button>
    </div>
  );
}
