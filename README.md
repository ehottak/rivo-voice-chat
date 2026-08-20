<div align="center">

# 🚀 RIVO
### Plataforma de Comunicação por Voz, Vídeo & Transmissão de Telas em Tempo Real
**Ultrarrápido • Baixa Latência (<50ms) • Áudio de Estúdio • Sem Cadastro • 100% In-Memory**

[![Next.js 16](https://img.shields.io/badge/Next.js-16.3.1-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Turbopack](https://img.shields.io/badge/Bundler-Turbopack-000000?style=for-the-badge&logo=vercel)](https://turbo.build/)
[![Electron 40](https://img.shields.io/badge/Desktop-Electron_40-47848F?style=for-the-badge&logo=electron)](https://www.electronjs.org/)
[![WebRTC](https://img.shields.io/badge/P2P-WebRTC_Mesh-333333?style=for-the-badge&logo=webrtc)](https://webrtc.org/)
[![Socket.IO](https://img.shields.io/badge/Signaling-Socket.IO_4.8-010101?style=for-the-badge&logo=socketdotio)](https://socket.io/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript_5-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/Styling-Tailwind_4-38B2AC?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)

</div>

---

## 📖 Visão Geral

O **RIVO** é uma aplicação completa de comunicação em tempo real (estilo Discord) projetada para amigos, streamers e equipes que buscam máxima performance, privacidade e qualidade sonora cristalina sem burocracias de cadastro ou servidores pesados.

Disponível tanto como **aplicativo desktop autônomo (Windows .exe)** quanto como **aplicativo Web responsivo** com suporte a todos os navegadores modernos (Brave, Chrome, Edge, Firefox, Safari).

---

## ✨ Recursos Principais

### 🎙️ 1. Motor de Áudio de Estúdio (Studio Audio Suite)
- **Filtros em Tempo Real:** Cancelamento de Eco Acústico, Supressão de Ruídos de Fundo e Controle Automático de Ganho (AGC).
- **Noise Gate Calibrável:** Medidor de VU estéreo em tempo real com barra de sensibilidade ajustável para cortar ruídos de digitação e respiração.
- **Boost de Ganho & Volume Master:** Controle de sensibilidade do microfone (0% a 200%) e volume de saída individual.
- **Troca Dinâmica de Dispositivos:** Alterne entre microfones e fones de ouvido sem precisar sair da chamada.

### 🔇 2. Controle de Ensurdecer / Mutar Som (`Deafen`)
- **Mute Geral de Áudio:** Silencie instantaneamente todas as transmissões e vozes da sala com um clique.
- **Proteção Automática:** Ao se ensurdecer, seu microfone é mutado automaticamente para evitar vazamento de voz.
- **Badges Visuais:** Ícones sincronizados em tempo real nos avatares e na barra de membros.

### 🎵 3. Efeitos Sonoros Nativos (WebAudio Synthesis)
- **Latência Zero (<5ms) & 100% Offline:** Sem arquivos MP3 pesados ou dependências externas.
- Efeitos harmônicos para:
  - 🔔 *Entrar e Sair da Sala*
  - 👤 *Amigo Entrou / Amigo Saiu*
  - 🎙️ *Mutar / Desmutar Microfone*
  - 🔇 *Ensurdecer / Desensurdecer*
  - 🖥️ *Iniciar / Parar Transmissão de Tela*

### 🖥️ 4. Compartilhamento de Telas Multi-Stream (1080p 60fps)
- **Multi-Screen Stage:** Suporte para múltiplos participantes transmitindo tela simultaneamente.
- **Seletor de Transmissões (Stream Strip):** Alternância instantânea de foco com um clique.
- **Modos de Exibição:** Modo *Teatro/Foco* (tela única em alta definição) e Modo *Grade* (todas as transmissões divididas lado a lado).

### 🌐 5. Conexão WebRTC Resiliente (W3C Perfect Negotiation & Auto-Healing)
- **Negociação Perfeita:** Eliminação de colisões de sinalização (*signaling glare*) em salas com 3, 5 ou mais pessoas.
- **Auto-Healing ICE Restart:** Reconexão automática em caso de oscilações de internet em menos de 1 segundo.
- **Anycast STUN Pool:** Resolução rápida de NAT e eliminação de falhas de DNS (`-105`).
- **Dual-Route Audio Engine:** Bypass nativo no WebAudio garantindo áudio ininterrupto no Brave e Chrome em segundo plano.

### 💬 6. Chat Efêmero em Memória
- Chat de texto integrado volátil e ultrarrápido: nenhuma mensagem é gravada em banco de dados; todas as mensagens expiram ao fechar a sala.

---

## 🛠️ Tecnologias Utilizadas

| Camada | Tecnologia |
| :--- | :--- |
| **Frontend** | [Next.js 16](https://nextjs.org/) (App Router + Turbopack), [React 19](https://react.dev/), [Tailwind CSS 4](https://tailwindcss.com/) |
| **Desktop Wrapper** | [Electron 40](https://www.electronjs.org/) + [Electron Builder](https://www.electron.build/) |
| **Realtime Signaling** | [Socket.IO 4.8](https://socket.io/) (com fallback HTTP Long-Polling & WebSocket) |
| **P2P Audio/Video** | [WebRTC Mesh API](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API) com W3C Perfect Negotiation |
| **Audio Processing** | [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) (ADSR Envelope Synthesis & AnalyserNodes) |
| **Backend & Runtime** | [Node.js 20+](https://nodejs.org/), [TypeScript](https://www.typescriptlang.org/), [esbuild](https://esbuild.github.io/) |

---

## 🚀 Como Executar o Projeto

### Pré-requisitos
- [Node.js](https://nodejs.org/) versão **20.x** ou superior
- [npm](https://www.npmjs.com/) (incluso no Node.js)

### 1. Clonar e Instalar Dependências
```bash
git clone https://github.com/seu-usuario/rivo-voice-chat.git
cd rivo-voice-chat
npm install
```

### 2. Rodar em Modo Desenvolvimento Web
```bash
npm run dev
```
Abra o navegador em: `http://localhost:3000`

### 3. Rodar como Aplicativo Desktop (Electron)
```bash
npm run desktop
```

---

## 📦 Gerando o Executável Standalone (.exe)

Para compilar o aplicativo de produção otimizado com empacotamento para Windows:

```bash
npm run make:exe
```

O executável standalone será gerado em:
```
dist-release-v2/win-unpacked/RIVO.exe
```

---

## 📁 Estrutura do Projeto

```
voice-chat-app/
├── electron-main.cjs            # Processo principal do Electron (Janela, lifecycle, IPC)
├── server.ts                    # Servidor Node.js HTTP + Socket.IO + Next.js
├── src/
│   ├── app/                     # Rotas e páginas do Next.js App Router
│   │   ├── page.tsx             # Landing page e criação/entrada de salas
│   │   └── room/[code]/         # Interface completa da sala de voz
│   ├── components/
│   │   ├── room/                # Componentes da sala (Palco de telas, Cards, Controles, Chat)
│   │   │   ├── AudioSettingsModal.tsx # Estúdio de configurações de áudio e Noise Gate
│   │   │   ├── ParticipantCard.tsx    # Card do participante com VU meter e avatar
│   │   │   ├── RoomSidebar.tsx        # Barra lateral de canais e membros
│   │   │   ├── ScreenShareStage.tsx   # Palco de transmissão 1080p 60fps
│   │   │   └── VoiceControls.tsx      # Barra inferior flutuante de controles
│   │   └── ui/                  # Componentes visuais e logotipo RIVO
│   ├── hooks/                   # Hooks customizados React
│   │   ├── useRoom.ts           # Gerenciamento de estado da sala e eventos Socket.IO
│   │   ├── useWebRTC.ts         # Motor P2P WebRTC, W3C Perfect Negotiation e ICE Healing
│   │   └── useParticipants.ts   # Sincronização de lista de participantes
│   ├── lib/
│   │   ├── socket.ts            # Singleton e gerenciador de conexão Socket.IO
│   │   ├── sound-effects.ts     # Sintetizador WebAudio de efeitos sonoros
│   │   └── webrtc-config.ts     # Configurações de STUN Anycast e buffers ICE
│   └── types/                   # Definições de tipagem TypeScript
└── package.json                 # Scripts e dependências
```

---

## 🛡️ Licença

Este projeto é disponibilizado sob a licença **MIT**. Sinta-se à vontade para utilizar, modificar e distribuir.
