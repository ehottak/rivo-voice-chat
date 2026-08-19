'use client';

import type { Participant } from '@/types';
import { ParticipantCard } from './ParticipantCard';

interface ParticipantGridProps {
  participants: Participant[];
  localParticipant: Participant | null;
  localCameraStream?: MediaStream | null;
  remoteCameraStreams?: Record<string, MediaStream>;
}

export function ParticipantGrid({
  participants,
  localParticipant,
  localCameraStream,
  remoteCameraStreams = {},
}: ParticipantGridProps) {
  const allParticipants = localParticipant
    ? [localParticipant, ...participants]
    : participants;

  if (allParticipants.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center animate-fade-in-up">
          <div className="relative inline-block mb-5">
            <div className="absolute inset-0 bg-violet-500/10 rounded-full blur-2xl" />
            <div className="relative w-24 h-24 mx-auto rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-10 h-10 text-white/15"
              >
                <path
                  fillRule="evenodd"
                  d="M8.25 6.75a3.75 3.75 0 117.5 0 3.75 3.75 0 01-7.5 0zM15.75 9.75a3 3 0 116 0 3 3 0 01-6 0zM2.25 9.75a3 3 0 116 0 3 3 0 01-6 0zM6.31 15.117A6.745 6.745 0 0112 12a6.745 6.745 0 016.709 7.498.75.75 0 01-.372.568A18.034 18.034 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
          <p className="text-white/30 text-sm font-medium">Aguardando participantes...</p>
          <p className="text-white/15 text-xs mt-1.5">Compartilhe o link para convidar seus amigos</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center p-2 sm:p-4 md:p-6 w-full min-w-0">
      <div
        className={`grid gap-3 sm:gap-5 max-w-5xl w-full ${
          allParticipants.length === 1
            ? 'grid-cols-1 max-w-xs mx-auto'
            : allParticipants.length === 2
            ? 'grid-cols-2 max-w-lg mx-auto'
            : allParticipants.length <= 4
            ? 'grid-cols-2 sm:grid-cols-2 md:grid-cols-4 max-w-3xl mx-auto'
            : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'
        }`}
      >
        {allParticipants.map((participant) => {
          const isLocal = localParticipant?.peerId === participant.peerId;
          const videoStream = isLocal ? localCameraStream : remoteCameraStreams[participant.peerId];

          return (
            <ParticipantCard
              key={participant.peerId}
              participant={participant}
              isLocal={isLocal}
              videoStream={videoStream}
            />
          );
        })}
      </div>
    </div>
  );
}
