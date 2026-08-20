// Ultra-Clean, Fast Anycast STUN Configuration for Cross-Browser (Brave/Chrome/Edge/Firefox/Electron)
// Using Anycast STUN endpoints to prevent DNS lookup throttles (-105 error) and maximize NAT traversal

export const ICE_SERVERS: RTCIceServer[] = [
  {
    urls: [
      'stun:stun.l.google.com:19302',
      'stun:stun1.l.google.com:19302',
      'stun:stun.cloudflare.com:3478',
      'stun:global.stun.twilio.com:3478',
    ],
  },
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
