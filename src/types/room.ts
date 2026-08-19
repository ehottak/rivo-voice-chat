export interface RoomInfo {
  id: string;
  code: string;
  name: string;
  createdAt: string;
}

export interface Participant {
  id: string;         // socket id
  peerId: string;     // socket id used for WebRTC signaling
  userId: string;     // database user id
  nickname: string;
  isMuted: boolean;
  isSpeaking: boolean;
}
