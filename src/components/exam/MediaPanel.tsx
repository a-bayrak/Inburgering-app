'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { QuestionClient } from '@/types';

interface MediaPanelProps {
  question: QuestionClient;
  volume: number;
  isPaused: boolean;
}

// PRD §1.D.3: Renders video (with transport controls) or image.
// Audio narration auto-plays on question load. Stops when Pause-and-Learn shown.
export function MediaPanel({ question, volume, isPaused }: MediaPanelProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const supabase = createClient();

  const getUrl = (path: string) => {
    const { data } = supabase.storage.from('media').getPublicUrl(path);
    return data.publicUrl;
  };

  // Auto-play audio narration on question load (PRD §1.D.3)
  useEffect(() => {
    if (audioRef.current && !isPaused) {
      audioRef.current.volume = volume;
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {}); // suppress autoplay policy errors
    }
    if (isPaused && audioRef.current) {
      audioRef.current.pause();
    }
  }, [question.id, isPaused]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  const visualMedia = (question as QuestionClient & { media?: { media_type: string; storage_path: string } }).media;
  const audioMedia = (question as QuestionClient & { audio_media?: { storage_path: string } }).audio_media;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative bg-gray-900 text-white">

      {/* Visual stimulus */}
      {visualMedia ? (
        visualMedia.media_type === 'video' ? (
          <video
            className="w-full max-h-64 md:max-h-full object-contain"
            controls
            playsInline
            src={getUrl(visualMedia.storage_path)}
          />
        ) : (
          <img
            src={getUrl(visualMedia.storage_path)}
            alt={question.question_nl}
            className="w-full max-h-64 md:max-h-full object-contain"
          />
        )
      ) : (
        <div className="text-gray-500 text-sm p-8 text-center">
          <p>📷 Media loading...</p>
        </div>
      )}

      {/* Audio narration (hidden player, auto-plays) */}
      {audioMedia && (
        <audio ref={audioRef} src={getUrl(audioMedia.storage_path)} preload="auto" />
      )}

      {/* Audio indicator (PRD §1.D.3) */}
      {audioMedia && !isPaused && (
        <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-black/60 rounded-full px-2 py-1">
          <span className="text-xs text-white">🔊</span>
          <div className="flex gap-0.5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-1 bg-white rounded-full animate-bounce"
                style={{ height: `${8 + i * 4}px`, animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
