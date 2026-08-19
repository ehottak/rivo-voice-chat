// ============================================================
// Socket.IO Event Type Definitions
// ============================================================

export interface ParticipantInfo {
  id: string;         // socket id
  peerId: string;     // socket id used for WebRTC signaling
  userId: string;     // database user id
  nickname: string;
  isMuted: boolean;
}

export interface JoinRoomData {
  roomCode: string;
  nickname: string;
}

export interface JoinRoomResult {
  success: boolean;
  error?: string;
  participants?: ParticipantInfo[];
  userId?: string;
}

export interface VoiceOffer {
  to: string;     // target socket id
  from?: string;  // sender socket id (added by server)
  sdp: RTCSessionDescriptionInit;
}

export interface VoiceAnswer {
  to: string;     // target socket id
  from?: string;  // sender socket id (added by server)
  sdp: RTCSessionDescriptionInit;
}

export interface VoiceIceCandidate {
  to: string;     // target socket id
  from?: string;  // sender socket id (added by server)
  candidate: RTCIceCandidateInit;
}

// ============================================================
// Server → Client Events
// ============================================================
export interface ServerToClientEvents {
  // Room events
  'room:participants': (participants: ParticipantInfo[]) => void;

  // Participant events
  'participant:joined': (participant: ParticipantInfo) => void;
  'participant:left': (data: { peerId: string }) => void;
  'participant:muted': (data: { peerId: string }) => void;
  'participant:unmuted': (data: { peerId: string }) => void;
  'participant:speaking': (data: { peerId: string; isSpeaking: boolean }) => void;

  // Voice signaling events
  'voice:offer': (data: VoiceOffer) => void;
  'voice:answer': (data: VoiceAnswer) => void;
  'voice:ice-candidate': (data: VoiceIceCandidate) => void;

  // Screen sharing events
  'screen:start': (data: { peerId: string }) => void;
  'screen:stop': (data: { peerId: string }) => void;

  // Camera events
  'camera:start': (data: { peerId: string }) => void;
  'camera:stop': (data: { peerId: string }) => void;
}

// ============================================================
// Client → Server Events
// ============================================================
export interface ClientToServerEvents {
  // Room events
  'room:join': (
    data: JoinRoomData,
    callback: (result: JoinRoomResult) => void
  ) => void;
  'room:leave': () => void;

  // Participant events
  'participant:muted': () => void;
  'participant:unmuted': () => void;
  'participant:speaking': (data: { isSpeaking: boolean }) => void;

  // Voice signaling events
  'voice:offer': (data: VoiceOffer) => void;
  'voice:answer': (data: VoiceAnswer) => void;
  'voice:ice-candidate': (data: VoiceIceCandidate) => void;

  // Screen sharing events
  'screen:start': () => void;
  'screen:stop': () => void;

  // Camera events
  'camera:start': () => void;
  'camera:stop': () => void;
}

// ============================================================
// Inter-Server Events
// ============================================================
export interface InterServerEvents {
  ping: () => void;
}

// ============================================================
// Socket Data
// ============================================================
export interface SocketData {
  userId: string;
  nickname: string;
  roomCode: string;
  isMuted: boolean;
}
