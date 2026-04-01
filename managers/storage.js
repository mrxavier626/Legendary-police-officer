const fs = require("fs");
const path = require("path");

const dataPath = path.join(__dirname, "..", "data");

// -------- FILE PATHS --------
const files = {
  guildConfig: "guildConfig.json",
  warnings: "warnings.json",
  notes: "notes.json",
  vcbans: "vcbans.json",
  relaySessions: "relaySessions.json"
};

// -------- ENSURE FILES --------
function ensureDataFiles() {
  for (const key in files) {
    const filePath = path.join(dataPath, files[key]);

    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify({}, null, 2));
      console.log(`Created ${files[key]}`);
    }
  }
}

// -------- READ FILE --------
function readFile(name) {
  const filePath = path.join(dataPath, files[name]);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

// -------- WRITE FILE --------
function writeFile(name, data) {
  const filePath = path.join(dataPath, files[name]);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// -------- GUILD CONFIG --------
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

  if (!data[guildId]) data[guildId] = {};

  data[guildId][key] = value;
  writeFile("guildConfig", data);
}

// -------- WARNINGS --------
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

// -------- NOTES --------
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

// -------- VC BANS --------
function addVcBan(guildId, userId) {
  const data = readFile("vcbans");

  if (!data[guildId]) data[guildId] = [];
  data[guildId].push(userId);

  writeFile("vcbans", data);
}

function isVcBanned(guildId, userId) {
  const data = readFile("vcbans");
  return data[guildId]?.includes(userId);
}

module.exports = {
  ensureDataFiles,
  getGuildConfig,
  setGuildConfig,
  addWarning,
  getWarnings,
  addNote,
  getNotes,
  addVcBan,
  isVcBanned
};
