// ============================================================
// Socket.IO Event Type Definitions
// ============================================================

export interface ParticipantInfo {
  id: string;         // socket id
  peerId: string;     // socket id used for WebRTC signaling
  userId: string;     // ephemeral user id
  nickname: string;
  isMuted: boolean;
  isDeafened?: boolean;
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

export interface ChatMessage {
  id: string;
  peerId: string;
  nickname: string;
  text: string;
  timestamp: string;
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
  'participant:deafened': (data: { peerId: string }) => void;
  'participant:undeafened': (data: { peerId: string }) => void;
  'participant:speaking': (data: { peerId: string; isSpeaking: boolean }) => void;

  // Voice signaling events
  'voice:offer': (data: VoiceOffer) => void;
  'voice:answer': (data: VoiceAnswer) => void;
  'voice:ice-candidate': (data: VoiceIceCandidate) => void;
  'voice:reconnect-request': (data: { from: string; to: string }) => void;

  // Screen sharing events
  'screen:start': (data: { peerId: string }) => void;
  'screen:stop': (data: { peerId: string }) => void;

  // Camera events
  'camera:start': (data: { peerId: string }) => void;
  'camera:stop': (data: { peerId: string }) => void;

  // Chat events (100% In-Memory)
  'chat:message': (message: ChatMessage) => void;
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
  'participant:deafened': () => void;
  'participant:undeafened': () => void;
  'participant:speaking': (data: { isSpeaking: boolean }) => void;

  // Voice signaling events
  'voice:offer': (data: VoiceOffer) => void;
  'voice:answer': (data: VoiceAnswer) => void;
  'voice:ice-candidate': (data: VoiceIceCandidate) => void;
  'voice:reconnect-request': (data: { to: string }) => void;

  // Screen sharing events
  'screen:start': () => void;
  'screen:stop': () => void;

  // Camera events
  'camera:start': () => void;
  'camera:stop': () => void;

  // Chat events
  'chat:send': (data: { text: string }) => void;
}

// ============================================================
// Inter-Server Events (empty for single-server setup)
// ============================================================
export type InterServerEvents = Record<string, never>;

// ============================================================
// Socket Data (attached to each Socket instance)
// ============================================================
export interface SocketData {
  userId: string;
  nickname: string;
  roomCode: string;
  isMuted: boolean;
  isDeafened?: boolean;
}
