// Fast, reliable STUN servers + TURN relays
// Optimized for instant connection speed (< 1s handshake)
export const ICE_SERVERS: RTCIceServer[] = [
  // 1. Ultra-fast Google STUN (Primary)
  {
    urls: [
      'stun:stun.l.google.com:19302',
      'stun:stun1.l.google.com:19302',
    ],
  },
  // 2. Cloudflare Global STUN (Secondary)
  {
    urls: 'stun:stun.cloudflare.com:3478',
  },
  // 3. Metered Open Relay Project TURN (for strict NAT / 4G / 5G / Brave)
  {
    urls: [
      'turn:openrelay.metered.ca:80',
      'turn:openrelay.metered.ca:443',
      'turn:openrelay.metered.ca:443?transport=tcp',
      'turns:openrelay.metered.ca:443?transport=tcp',
    ],
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
  // 4. Secondary Metered Relay
  {
    urls: [
      'turn:a.relay.metered.ca:80',
      'turn:a.relay.metered.ca:443',
      'turn:a.relay.metered.ca:443?transport=tcp',
    ],
    username: 'e8dd65b992c0bb6c0c36c0a6',
    credential: 'kMa6NWchMyFNbVWp',
  },
];

// Default configuration: Fast P2P + Relay fallback
export const RTC_CONFIG: RTCConfiguration = {
  iceServers: ICE_SERVERS,
  iceCandidatePoolSize: 2,
  iceTransportPolicy: 'all',
};

// Fallback configuration: Force TURN relay only
export const RTC_CONFIG_RELAY: RTCConfiguration = {
  iceServers: ICE_SERVERS,
  iceCandidatePoolSize: 2,
  iceTransportPolicy: 'relay',
};
