"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/dotenv/lib/main.js
var require_main = __commonJS({
  "node_modules/dotenv/lib/main.js"(exports2, module2) {
    var fs = require("fs");
    var path = require("path");
    var os = require("os");
    var crypto = require("crypto");
    var TIPS = [
      "\u25C8 encrypted .env [www.dotenvx.com]",
      "\u25C8 secrets for agents [www.dotenvx.com]",
      "\u2301 auth for agents [www.vestauth.com]",
      "\u2318 custom filepath { path: '/custom/path/.env' }",
      "\u2318 enable debugging { debug: true }",
      "\u2318 override existing { override: true }",
      "\u2318 suppress logs { quiet: true }",
      "\u2318 multiple files { path: ['.env.local', '.env'] }"
    ];
    function _getRandomTip() {
      return TIPS[Math.floor(Math.random() * TIPS.length)];
    }
    function parseBoolean(value) {
      if (typeof value === "string") {
        return !["false", "0", "no", "off", ""].includes(value.toLowerCase());
      }
      return Boolean(value);
    }
    function supportsAnsi() {
      return process.stdout.isTTY;
    }
    function dim(text) {
      return supportsAnsi() ? `\x1B[2m${text}\x1B[0m` : text;
    }
    var LINE = /(?:^|^)\s*(?:export\s+)?([\w.-]+)(?:\s*=\s*?|:\s+?)(\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|\s*`(?:\\`|[^`])*`|[^#\r\n]+)?\s*(?:#.*)?(?:$|$)/mg;
    function parse(src) {
      const obj = {};
      let lines = src.toString();
      lines = lines.replace(/\r\n?/mg, "\n");
      let match;
      while ((match = LINE.exec(lines)) != null) {
        const key = match[1];
        let value = match[2] || "";
        value = value.trim();
        const maybeQuote = value[0];
        value = value.replace(/^(['"`])([\s\S]*)\1$/mg, "$2");
        if (maybeQuote === '"') {
          value = value.replace(/\\n/g, "\n");
          value = value.replace(/\\r/g, "\r");
        }
        obj[key] = value;
      }
      return obj;
    }
    function _parseVault(options) {
      options = options || {};
      const vaultPath = _vaultPath(options);
      options.path = vaultPath;
      const result = DotenvModule.configDotenv(options);
      if (!result.parsed) {
        const err = new Error(`MISSING_DATA: Cannot parse ${vaultPath} for an unknown reason`);
        err.code = "MISSING_DATA";
        throw err;
      }
      const keys = _dotenvKey(options).split(",");
      const length = keys.length;
      let decrypted;
      for (let i = 0; i < length; i++) {
        try {
          const key = keys[i].trim();
          const attrs = _instructions(result, key);
          decrypted = DotenvModule.decrypt(attrs.ciphertext, attrs.key);
          break;
        } catch (error) {
          if (i + 1 >= length) {
            throw error;
          }
        }
      }
      return DotenvModule.parse(decrypted);
    }
    function _warn(message) {
      console.error(`\u26A0 ${message}`);
    }
    function _debug(message) {
      console.log(`\u2506 ${message}`);
    }
    function _log(message) {
      console.log(`\u25C7 ${message}`);
    }
    function _dotenvKey(options) {
      if (options && options.DOTENV_KEY && options.DOTENV_KEY.length > 0) {
        return options.DOTENV_KEY;
      }
      if (process.env.DOTENV_KEY && process.env.DOTENV_KEY.length > 0) {
        return process.env.DOTENV_KEY;
      }
      return "";
    }
    function _instructions(result, dotenvKey) {
      let uri;
      try {
        uri = new URL(dotenvKey);
      } catch (error) {
        if (error.code === "ERR_INVALID_URL") {
          const err = new Error("INVALID_DOTENV_KEY: Wrong format. Must be in valid uri format like dotenv://:key_1234@dotenvx.com/vault/.env.vault?environment=development");
          err.code = "INVALID_DOTENV_KEY";
          throw err;
        }
        throw error;
      }
      const key = uri.password;
      if (!key) {
        const err = new Error("INVALID_DOTENV_KEY: Missing key part");
        err.code = "INVALID_DOTENV_KEY";
        throw err;
      }
      const environment = uri.searchParams.get("environment");
      if (!environment) {
        const err = new Error("INVALID_DOTENV_KEY: Missing environment part");
        err.code = "INVALID_DOTENV_KEY";
        throw err;
      }
      const environmentKey = `DOTENV_VAULT_${environment.toUpperCase()}`;
      const ciphertext = result.parsed[environmentKey];
      if (!ciphertext) {
        const err = new Error(`NOT_FOUND_DOTENV_ENVIRONMENT: Cannot locate environment ${environmentKey} in your .env.vault file.`);
        err.code = "NOT_FOUND_DOTENV_ENVIRONMENT";
        throw err;
      }
      return { ciphertext, key };
    }
    function _vaultPath(options) {
      let possibleVaultPath = null;
      if (options && options.path && options.path.length > 0) {
        if (Array.isArray(options.path)) {
          for (const filepath of options.path) {
            if (fs.existsSync(filepath)) {
              possibleVaultPath = filepath.endsWith(".vault") ? filepath : `${filepath}.vault`;
            }
          }
        } else {
          possibleVaultPath = options.path.endsWith(".vault") ? options.path : `${options.path}.vault`;
        }
      } else {
        possibleVaultPath = path.resolve(process.cwd(), ".env.vault");
      }
      if (fs.existsSync(possibleVaultPath)) {
        return possibleVaultPath;
      }
      return null;
    }
    function _resolveHome(envPath) {
      return envPath[0] === "~" ? path.join(os.homedir(), envPath.slice(1)) : envPath;
    }
    function _configVault(options) {
      const debug = parseBoolean(process.env.DOTENV_CONFIG_DEBUG || options && options.debug);
      const quiet = parseBoolean(process.env.DOTENV_CONFIG_QUIET || options && options.quiet);
      if (debug || !quiet) {
        _log("loading env from encrypted .env.vault");
      }
      const parsed = DotenvModule._parseVault(options);
      let processEnv = process.env;
      if (options && options.processEnv != null) {
        processEnv = options.processEnv;
      }
      DotenvModule.populate(processEnv, parsed, options);
      return { parsed };
    }
    function configDotenv(options) {
      const dotenvPath = path.resolve(process.cwd(), ".env");
      let encoding = "utf8";
      let processEnv = process.env;
      if (options && options.processEnv != null) {
        processEnv = options.processEnv;
      }
      let debug = parseBoolean(processEnv.DOTENV_CONFIG_DEBUG || options && options.debug);
      let quiet = parseBoolean(processEnv.DOTENV_CONFIG_QUIET || options && options.quiet);
      if (options && options.encoding) {
        encoding = options.encoding;
      } else {
        if (debug) {
          _debug("no encoding is specified (UTF-8 is used by default)");
        }
      }
      let optionPaths = [dotenvPath];
      if (options && options.path) {
        if (!Array.isArray(options.path)) {
          optionPaths = [_resolveHome(options.path)];
        } else {
          optionPaths = [];
          for (const filepath of options.path) {
            optionPaths.push(_resolveHome(filepath));
          }
        }
      }
      let lastError;
      const parsedAll = {};
      for (const path2 of optionPaths) {
        try {
          const parsed = DotenvModule.parse(fs.readFileSync(path2, { encoding }));
          DotenvModule.populate(parsedAll, parsed, options);
        } catch (e) {
          if (debug) {
            _debug(`failed to load ${path2} ${e.message}`);
          }
          lastError = e;
        }
      }
      const populated = DotenvModule.populate(processEnv, parsedAll, options);
      debug = parseBoolean(processEnv.DOTENV_CONFIG_DEBUG || debug);
      quiet = parseBoolean(processEnv.DOTENV_CONFIG_QUIET || quiet);
      if (debug || !quiet) {
        const keysCount = Object.keys(populated).length;
        const shortPaths = [];
        for (const filePath of optionPaths) {
          try {
            const relative = path.relative(process.cwd(), filePath);
            shortPaths.push(relative);
          } catch (e) {
            if (debug) {
              _debug(`failed to load ${filePath} ${e.message}`);
            }
            lastError = e;
          }
        }
        _log(`injected env (${keysCount}) from ${shortPaths.join(",")} ${dim(`// tip: ${_getRandomTip()}`)}`);
      }
      if (lastError) {
        return { parsed: parsedAll, error: lastError };
      } else {
        return { parsed: parsedAll };
      }
    }
    function config(options) {
      if (_dotenvKey(options).length === 0) {
        return DotenvModule.configDotenv(options);
      }
      const vaultPath = _vaultPath(options);
      if (!vaultPath) {
        _warn(`you set DOTENV_KEY but you are missing a .env.vault file at ${vaultPath}`);
        return DotenvModule.configDotenv(options);
      }
      return DotenvModule._configVault(options);
    }
    function decrypt(encrypted, keyStr) {
      const key = Buffer.from(keyStr.slice(-64), "hex");
      let ciphertext = Buffer.from(encrypted, "base64");
      const nonce = ciphertext.subarray(0, 12);
      const authTag = ciphertext.subarray(-16);
      ciphertext = ciphertext.subarray(12, -16);
      try {
        const aesgcm = crypto.createDecipheriv("aes-256-gcm", key, nonce);
        aesgcm.setAuthTag(authTag);
        return `${aesgcm.update(ciphertext)}${aesgcm.final()}`;
      } catch (error) {
        const isRange = error instanceof RangeError;
        const invalidKeyLength = error.message === "Invalid key length";
        const decryptionFailed = error.message === "Unsupported state or unable to authenticate data";
        if (isRange || invalidKeyLength) {
          const err = new Error("INVALID_DOTENV_KEY: It must be 64 characters long (or more)");
          err.code = "INVALID_DOTENV_KEY";
          throw err;
        } else if (decryptionFailed) {
          const err = new Error("DECRYPTION_FAILED: Please check your DOTENV_KEY");
          err.code = "DECRYPTION_FAILED";
          throw err;
        } else {
          throw error;
        }
      }
    }
    function populate(processEnv, parsed, options = {}) {
      const debug = Boolean(options && options.debug);
      const override = Boolean(options && options.override);
      const populated = {};
      if (typeof parsed !== "object") {
        const err = new Error("OBJECT_REQUIRED: Please check the processEnv argument being passed to populate");
        err.code = "OBJECT_REQUIRED";
        throw err;
      }
      for (const key of Object.keys(parsed)) {
        if (Object.prototype.hasOwnProperty.call(processEnv, key)) {
          if (override === true) {
            processEnv[key] = parsed[key];
            populated[key] = parsed[key];
          }
          if (debug) {
            if (override === true) {
              _debug(`"${key}" is already defined and WAS overwritten`);
            } else {
              _debug(`"${key}" is already defined and was NOT overwritten`);
            }
          }
        } else {
          processEnv[key] = parsed[key];
          populated[key] = parsed[key];
        }
      }
      return populated;
    }
    var DotenvModule = {
      configDotenv,
      _configVault,
      _parseVault,
      config,
      decrypt,
      parse,
      populate
    };
    module2.exports.configDotenv = DotenvModule.configDotenv;
    module2.exports._configVault = DotenvModule._configVault;
    module2.exports._parseVault = DotenvModule._parseVault;
    module2.exports.config = DotenvModule.config;
    module2.exports.decrypt = DotenvModule.decrypt;
    module2.exports.parse = DotenvModule.parse;
    module2.exports.populate = DotenvModule.populate;
    module2.exports = DotenvModule;
  }
});

// node_modules/dotenv/lib/env-options.js
var require_env_options = __commonJS({
  "node_modules/dotenv/lib/env-options.js"(exports2, module2) {
    var options = {};
    if (process.env.DOTENV_CONFIG_ENCODING != null) {
      options.encoding = process.env.DOTENV_CONFIG_ENCODING;
    }
    if (process.env.DOTENV_CONFIG_PATH != null) {
      options.path = process.env.DOTENV_CONFIG_PATH;
    }
    if (process.env.DOTENV_CONFIG_QUIET != null) {
      options.quiet = process.env.DOTENV_CONFIG_QUIET;
    }
    if (process.env.DOTENV_CONFIG_DEBUG != null) {
      options.debug = process.env.DOTENV_CONFIG_DEBUG;
    }
    if (process.env.DOTENV_CONFIG_OVERRIDE != null) {
      options.override = process.env.DOTENV_CONFIG_OVERRIDE;
    }
    if (process.env.DOTENV_CONFIG_DOTENV_KEY != null) {
      options.DOTENV_KEY = process.env.DOTENV_CONFIG_DOTENV_KEY;
    }
    module2.exports = options;
  }
});

// node_modules/dotenv/lib/cli-options.js
var require_cli_options = __commonJS({
  "node_modules/dotenv/lib/cli-options.js"(exports2, module2) {
    var re = /^dotenv_config_(encoding|path|quiet|debug|override|DOTENV_KEY)=(.+)$/;
    module2.exports = function optionMatcher(args) {
      const options = args.reduce(function(acc, cur) {
        const matches = cur.match(re);
        if (matches) {
          acc[matches[1]] = matches[2];
        }
        return acc;
      }, {});
      if (!("quiet" in options)) {
        options.quiet = "true";
      }
      return options;
    };
  }
});

// node_modules/dotenv/config.js
(function() {
  require_main().config(
    Object.assign(
      {},
      require_env_options(),
      require_cli_options()(process.argv)
    )
  );
})();

// server.ts
var import_http = require("http");
var import_next = __toESM(require("next"));

// src/server/socket/index.ts
var import_socket = require("socket.io");

// src/server/room-store.ts
function generateRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let code = "";
  for (let i = 0; i < 7; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
var globalRoot = typeof globalThis !== "undefined" ? globalThis : typeof global !== "undefined" ? global : window;
if (!globalRoot.__RIVO_ROOMS_MAP__) {
  globalRoot.__RIVO_ROOMS_MAP__ = /* @__PURE__ */ new Map();
}
var roomsMap = globalRoot.__RIVO_ROOMS_MAP__;
var RoomStore = class {
  createRoom(name) {
    let code = generateRoomCode();
    while (roomsMap.has(code)) {
      code = generateRoomCode();
    }
    const room = {
      id: `room_${code}_${Date.now()}`,
      code,
      name: name.trim() || "Sala de Voz",
      createdAt: /* @__PURE__ */ new Date()
    };
    roomsMap.set(code, room);
    console.log(`[RoomStore] \u{1F3E0} Sala criada: '${code}' (${room.name}) | Total: ${roomsMap.size}`);
    return room;
  }
  createRoomWithCode(code, name = "Sala de Voz") {
    const existing = roomsMap.get(code);
    if (existing) return existing;
    const room = {
      id: `room_${code}_${Date.now()}`,
      code,
      name: name.trim() || "Sala de Voz",
      createdAt: /* @__PURE__ */ new Date()
    };
    roomsMap.set(code, room);
    console.log(`[RoomStore] \u{1F3E0} Sala registrada por c\xF3digo: '${code}' (${room.name}) | Total: ${roomsMap.size}`);
    return room;
  }
  getRoom(code) {
    return roomsMap.get(code) || null;
  }
  deleteRoom(code) {
    const existed = roomsMap.delete(code);
    if (existed) {
      console.log(`[RoomStore] \u{1F9F9} Sala '${code}' apagada da mem\xF3ria | Total: ${roomsMap.size}`);
    }
    return existed;
  }
  getAllRooms() {
    return Array.from(roomsMap.values());
  }
  clearAll() {
    roomsMap.clear();
    console.log("[RoomStore] \u{1F9F9} Todas as salas foram limpas.");
  }
};
var roomStore = new RoomStore();

// src/server/socket/room-handler.ts
function registerRoomHandlers(io, socket) {
  socket.on("room:join", async (data, callback) => {
    console.log(`[Socket ${socket.id}] \u{1F4E5} Event 'room:join' received for roomCode '${data?.roomCode}', nickname '${data?.nickname}'`);
    try {
      if (!data?.roomCode || !data?.nickname) {
        console.warn(`[Socket ${socket.id}] \u26A0\uFE0F Invalid room:join payload`);
        callback({ success: false, error: "Dados da sala/nickname inv\xE1lidos" });
        return;
      }
      let room = roomStore.getRoom(data.roomCode);
      if (!room) {
        room = roomStore.createRoomWithCode(data.roomCode, "Sala de Voz");
      }
      const ephemeralUserId = `usr_${socket.id}`;
      socket.data.userId = ephemeralUserId;
      socket.data.nickname = data.nickname;
      socket.data.roomCode = data.roomCode;
      socket.data.isMuted = false;
      await socket.join(data.roomCode);
      const roomSockets = await io.in(data.roomCode).fetchSockets();
      const participants = roomSockets.filter((s) => s.id !== socket.id).map((s) => ({
        id: s.id,
        peerId: s.id,
        userId: s.data.userId || s.id,
        nickname: s.data.nickname || "An\xF4nimo",
        isMuted: s.data.isMuted ?? false
      }));
      const newParticipant = {
        id: socket.id,
        peerId: socket.id,
        userId: ephemeralUserId,
        nickname: data.nickname,
        isMuted: false
      };
      socket.to(data.roomCode).emit("participant:joined", newParticipant);
      console.log(`[Socket ${socket.id}] \u2705 Joined room '${data.roomCode}' as '${data.nickname}' (In-Memory). Online: ${participants.length + 1}`);
      callback({
        success: true,
        participants,
        userId: ephemeralUserId
      });
    } catch (error) {
      console.error(`[Socket ${socket.id}] \u274C Error during room:join:`, error);
      callback({ success: false, error: "Erro interno ao entrar na sala" });
    }
  });
  socket.on("chat:send", (data) => {
    const text = data?.text?.trim();
    const roomCode = socket.data.roomCode;
    const nickname = socket.data.nickname || "An\xF4nimo";
    if (!text || !roomCode || text.length > 2e3) return;
    const message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      peerId: socket.id,
      nickname,
      text,
      timestamp: (/* @__PURE__ */ new Date()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };
    console.log(`[Chat ${roomCode}] \u{1F4AC} ${nickname}: ${text.slice(0, 30)}`);
    io.in(roomCode).emit("chat:message", message);
  });
  socket.on("room:leave", async () => {
    await handleLeaveRoom(io, socket);
  });
  socket.on("disconnect", async () => {
    await handleLeaveRoom(io, socket);
  });
}
async function handleLeaveRoom(io, socket) {
  const roomCode = socket.data.roomCode;
  const nickname = socket.data.nickname;
  if (!roomCode) return;
  try {
    socket.to(roomCode).emit("participant:left", { peerId: socket.id });
    await socket.leave(roomCode);
    socket.data.roomCode = "";
    socket.data.userId = "";
    socket.data.nickname = "";
    console.log(`[Socket ${socket.id}] \u{1F44B} '${nickname || "Participante"}' saiu da sala '${roomCode}'`);
    const remainingSockets = await io.in(roomCode).fetchSockets();
    if (remainingSockets.length === 0) {
      console.log(`[Auto-Cleanup] \u{1F9F9} Sala '${roomCode}' ficou vazia (0 pessoas). Removendo da mem\xF3ria...`);
      roomStore.deleteRoom(roomCode);
    } else {
      console.log(`[Room '${roomCode}'] Restam ${remainingSockets.length} participante(s) online.`);
    }
  } catch (error) {
    console.error("[room:leave] Error:", error);
  }
}

// src/server/socket/voice-handler.ts
function registerVoiceHandlers(io, socket) {
  socket.on("voice:offer", (data) => {
    console.log(`[WebRTC Signaling] \u{1F4E1} Relaying offer from ${socket.id} to ${data.to}`);
    io.to(data.to).emit("voice:offer", {
      ...data,
      from: socket.id
    });
  });
  socket.on("voice:answer", (data) => {
    console.log(`[WebRTC Signaling] \u{1F4E1} Relaying answer from ${socket.id} to ${data.to}`);
    io.to(data.to).emit("voice:answer", {
      ...data,
      from: socket.id
    });
  });
  socket.on("voice:ice-candidate", (data) => {
    io.to(data.to).emit("voice:ice-candidate", {
      ...data,
      from: socket.id
    });
  });
  socket.on("voice:reconnect-request", (data) => {
    console.log(`[WebRTC Signaling] \u{1F504} Relaying reconnect request from ${socket.id} to ${data.to}`);
    io.to(data.to).emit("voice:reconnect-request", {
      from: socket.id,
      to: data.to
    });
  });
  socket.on("participant:muted", () => {
    socket.data.isMuted = true;
    const roomCode = socket.data.roomCode;
    if (roomCode) {
      socket.to(roomCode).emit("participant:muted", { peerId: socket.id });
    } else {
      socket.rooms.forEach((room) => {
        if (room !== socket.id) socket.to(room).emit("participant:muted", { peerId: socket.id });
      });
    }
  });
  socket.on("participant:unmuted", () => {
    socket.data.isMuted = false;
    const roomCode = socket.data.roomCode;
    if (roomCode) {
      socket.to(roomCode).emit("participant:unmuted", { peerId: socket.id });
    } else {
      socket.rooms.forEach((room) => {
        if (room !== socket.id) socket.to(room).emit("participant:unmuted", { peerId: socket.id });
      });
    }
  });
  socket.on("participant:deafened", () => {
    socket.data.isDeafened = true;
    const roomCode = socket.data.roomCode;
    if (roomCode) {
      socket.to(roomCode).emit("participant:deafened", { peerId: socket.id });
    } else {
      socket.rooms.forEach((room) => {
        if (room !== socket.id) socket.to(room).emit("participant:deafened", { peerId: socket.id });
      });
    }
  });
  socket.on("participant:undeafened", () => {
    socket.data.isDeafened = false;
    const roomCode = socket.data.roomCode;
    if (roomCode) {
      socket.to(roomCode).emit("participant:undeafened", { peerId: socket.id });
    } else {
      socket.rooms.forEach((room) => {
        if (room !== socket.id) socket.to(room).emit("participant:undeafened", { peerId: socket.id });
      });
    }
  });
  socket.on("participant:speaking", (data) => {
    const roomCode = socket.data.roomCode;
    if (roomCode) {
      socket.to(roomCode).emit("participant:speaking", {
        peerId: socket.id,
        isSpeaking: data.isSpeaking
      });
    } else {
      socket.rooms.forEach((room) => {
        if (room !== socket.id) {
          socket.to(room).emit("participant:speaking", {
            peerId: socket.id,
            isSpeaking: data.isSpeaking
          });
        }
      });
    }
  });
  socket.on("screen:start", () => {
    const roomCode = socket.data.roomCode;
    if (roomCode) {
      console.log(`[Screen Share] \u{1F5A5}\uFE0F Peer ${socket.id} started screen sharing in room ${roomCode}`);
      socket.to(roomCode).emit("screen:start", { peerId: socket.id });
    }
  });
  socket.on("screen:stop", () => {
    const roomCode = socket.data.roomCode;
    if (roomCode) {
      console.log(`[Screen Share] \u23F9\uFE0F Peer ${socket.id} stopped screen sharing in room ${roomCode}`);
      socket.to(roomCode).emit("screen:stop", { peerId: socket.id });
    }
  });
  socket.on("camera:start", () => {
    const roomCode = socket.data.roomCode;
    if (roomCode) {
      console.log(`[Camera] \u{1F4F9} Peer ${socket.id} started camera in room ${roomCode}`);
      socket.to(roomCode).emit("camera:start", { peerId: socket.id });
    }
  });
  socket.on("camera:stop", () => {
    const roomCode = socket.data.roomCode;
    if (roomCode) {
      console.log(`[Camera] \u23F9\uFE0F Peer ${socket.id} stopped camera in room ${roomCode}`);
      socket.to(roomCode).emit("camera:stop", { peerId: socket.id });
    }
  });
}

// src/server/socket/index.ts
function setupSocketServer(httpServer) {
  const io = new import_socket.Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true
    },
    transports: ["polling", "websocket"],
    pingTimeout: 6e4,
    pingInterval: 25e3
  });
  io.on("connection", (socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);
    registerRoomHandlers(io, socket);
    registerVoiceHandlers(io, socket);
    socket.on("disconnect", (reason) => {
      console.log(`[Socket] Disconnected: ${socket.id} (${reason})`);
    });
  });
  return io;
}

// server.ts
var dev = process.env.NODE_ENV !== "production";
var hostname = process.env.HOSTNAME || "localhost";
var port = parseInt(process.env.PORT || "3000", 10);
var app = (0, import_next.default)({ dev, hostname, port });
var handle = app.getRequestHandler();
app.prepare().then(async () => {
  roomStore.clearAll();
  const httpServer = (0, import_http.createServer)(handle);
  const io = setupSocketServer(httpServer);
  const cleanupInterval = setInterval(async () => {
    try {
      const allRooms = roomStore.getAllRooms();
      for (const room of allRooms) {
        const sockets = await io.in(room.code).fetchSockets();
        const ageMs = Date.now() - new Date(room.createdAt).getTime();
        if (sockets.length === 0 && ageMs > 5 * 60 * 1e3) {
          console.log(`[Auto-Cleanup Periodic] \u{1F9F9} Removendo sala inativa da mem\xF3ria: '${room.code}' (${room.name})`);
          roomStore.deleteRoom(room.code);
        }
      }
    } catch (e) {
      console.warn("[Auto-Cleanup Periodic] Erro na rotina peri\xF3dica:", e);
    }
  }, 5 * 60 * 1e3);
  httpServer.listen(port, () => {
    console.log(`
  \u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557
  \u2551   \u{1F399}\uFE0F  RIVO                                \u2551
  \u2551   \u2192 http://${hostname}:${port}                  \u2551
  \u2551   \u2192 Socket.IO attached                    \u2551
  \u2551   \u2192 100% In-Memory (Zero Database)        \u2551
  \u2551   \u2192 Mode: ${dev ? "development" : "production "}                  \u2551
  \u255A\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255D
    `);
  });
  const shutdown = async () => {
    console.log("\n[Server] Shutting down...");
    clearInterval(cleanupInterval);
    io.close();
    httpServer.close(() => {
      console.log("[Server] Closed");
      process.exit(0);
    });
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
});
