const fs = require("fs");
const path = require("path");

const dataPath = path.join(__dirname, "..", "data");

const files = {
  guildConfig: "guildConfig.json",
  warnings: "warnings.json",
  notes: "notes.json",
  vcbans: "vcbans.json",
  relaySessions: "relaySessions.json"
};

function ensureDataFiles() {
  if (!fs.existsSync(dataPath)) {
    fs.mkdirSync(dataPath, { recursive: true });
  }

  for (const key in files) {
    const filePath = path.join(dataPath, files[key]);

    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify({}, null, 2));
    }
  }
}

function readFile(name) {
  const filePath = path.join(dataPath, files[name]);

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify({}, null, 2));
  }

  const raw = fs.readFileSync(filePath, "utf8");
  return raw.trim() ? JSON.parse(raw) : {};
}

function writeFile(name, data) {
  const filePath = path.join(dataPath, files[name]);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function getGuildConfig(guildId) {
  const data = readFile("guildConfig");

  if (!data[guildId]) {
    data[guildId] = {
      logChannelId: null,
      welcomeChannelId: null,
      verifyChannelId: null,
      verifyRoleId: null
    };
    writeFile("guildConfig", data);
  }

  return data[guildId];
}

function setGuildConfig(guildId, key, value) {
  const data = readFile("guildConfig");

  if (!data[guildId]) {
    data[guildId] = {
      logChannelId: null,
      welcomeChannelId: null,
      verifyChannelId: null,
      verifyRoleId: null
    };
  }

  data[guildId][key] = value;
  writeFile("guildConfig", data);
}

function addWarning(guildId, userId, reason) {
  const data = readFile("warnings");

  if (!data[guildId]) data[guildId] = {};
  if (!data[guildId][userId]) data[guildId][userId] = [];

  data[guildId][userId].push({
    reason,
    date: new Date().toISOString()
  });

  writeFile("warnings", data);
}

function getWarnings(guildId, userId) {
  const data = readFile("warnings");
  return data[guildId]?.[userId] || [];
}

function clearWarnings(guildId, userId) {
  const data = readFile("warnings");

  if (!data[guildId]) data[guildId] = {};
  data[guildId][userId] = [];

  writeFile("warnings", data);
}

function addNote(guildId, userId, note) {
  const data = readFile("notes");

  if (!data[guildId]) data[guildId] = {};
  if (!data[guildId][userId]) data[guildId][userId] = [];

  data[guildId][userId].push(note);

  writeFile("notes", data);
}

function getNotes(guildId, userId) {
  const data = readFile("notes");
  return data[guildId]?.[userId] || [];
}

function clearNotes(guildId, userId) {
  const data = readFile("notes");

  if (!data[guildId]) data[guildId] = {};
  data[guildId][userId] = [];

  writeFile("notes", data);
}

function addVcBan(guildId, userId) {
  const data = readFile("vcbans");

  if (!data[guildId]) data[guildId] = [];
  if (!data[guildId].includes(userId)) {
    data[guildId].push(userId);
  }

  writeFile("vcbans", data);
}

function removeVcBan(guildId, userId) {
  const data = readFile("vcbans");

  if (!data[guildId]) data[guildId] = [];
  data[guildId] = data[guildId].filter(id => id !== userId);

  writeFile("vcbans", data);
}

function isVcBanned(guildId, userId) {
  const data = readFile("vcbans");
  return data[guildId]?.includes(userId) || false;
}

function getRelaySessions() {
  return readFile("relaySessions");
}

function setRelaySession(userId, sessionData) {
  const data = readFile("relaySessions");
  data[userId] = sessionData;
  writeFile("relaySessions", data);
}

function clearRelaySession(userId) {
  const data = readFile("relaySessions");
  delete data[userId];
  writeFile("relaySessions", data);
}

module.exports = {
  ensureDataFiles,
  getGuildConfig,
  setGuildConfig,
  addWarning,
  getWarnings,
  clearWarnings,
  addNote,
  getNotes,
  clearNotes,
  addVcBan,
  removeVcBan,
  isVcBanned,
  getRelaySessions,
  setRelaySession,
  clearRelaySession
};
