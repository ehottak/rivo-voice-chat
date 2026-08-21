// Ultra-Clean, Fast Anycast STUN Configuration for Cross-Browser (Brave/Chrome/Edge/Firefox/Electron)
// Using Anycast STUN endpoints to prevent DNS lookup throttles (-105 error) and maximize NAT traversal

export const ICE_SERVERS: RTCIceServer[] = [
  // Google STUN (Port 19302)
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },

  // Cloudflare STUN (Port 3478)
  { urls: 'stun:stun.cloudflare.com:3478' },

  // Nextcloud STUN (Portas 443 e 3478 - ótimo para passar por firewalls restritivos)
  { urls: 'stun:stun.nextcloud.com:443' },
  { urls: 'stun:stun.nextcloud.com:3478' },

  // OpenRelay / Metered STUN (Porta 80)
  { urls: 'stun:openrelay.metered.ca:80' },

  // Sipgate STUN (Port 3478)
  { urls: 'stun:stun.sipgate.net:3478' },

  // Twilio STUN
  { urls: 'stun:global.stun.twilio.com:3478' },
];

export const RTC_CONFIG: RTCConfiguration = {
  iceServers: ICE_SERVERS,
  iceCandidatePoolSize: 10,
  iceTransportPolicy: 'all',
  bundlePolicy: 'max-bundle',
  rtcpMuxPolicy: 'require',
};

export const RTC_CONFIG_RELAY: RTCConfiguration = {
  iceServers: ICE_SERVERS,
  iceCandidatePoolSize: 10,
  iceTransportPolicy: 'all',
  bundlePolicy: 'max-bundle',
  rtcpMuxPolicy: 'require',
};
