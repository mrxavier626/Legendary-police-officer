import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "../../data");
const CONFIG_FILE = join(DATA_DIR, "guild-configs.json");
const WARNINGS_FILE = join(DATA_DIR, "warnings.json");
const NOTES_FILE = join(DATA_DIR, "notes.json");
const VCBANS_FILE = join(DATA_DIR, "vcbans.json");

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
}

function loadJson<T>(file: string, fallback: T): T {
  try {
    if (existsSync(file)) return JSON.parse(readFileSync(file, "utf8")) as T;
  } catch {}
  return fallback;
}

function saveJson(file: string, data: unknown) {
  ensureDataDir();
  try { writeFileSync(file, JSON.stringify(data, null, 2), "utf8"); } catch {}
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface Warning {
  userId: string;
  moderatorId: string;
  reason: string;
  timestamp: number;
}

export interface Note {
  authorId: string;
  content: string;
  timestamp: number;
}

export interface ModEntry {
  action: string;
  moderatorId: string;
  reason: string;
  timestamp: number;
}

export interface GuildConfig {
  logChannelId?: string;
  welcomeChannelId?: string;
  verifyChannelId?: string;
  verifyRoleId?: string;
}

// ── In-memory stores (loaded from disk on startup) ───────────────────────────

const warnings = new Map<string, Warning[]>(
  Object.entries(loadJson<Record<string, Warning[]>>(WARNINGS_FILE, {}))
);

const guildConfigs = new Map<string, GuildConfig>(
  Object.entries(loadJson<Record<string, GuildConfig>>(CONFIG_FILE, {}))
);

const notes = new Map<string, Note[]>(
  Object.entries(loadJson<Record<string, Note[]>>(NOTES_FILE, {}))
);

const vcBansRaw = loadJson<string[]>(VCBANS_FILE, []);
const vcBans = new Set<string>(vcBansRaw);

const modHistory = new Map<string, ModEntry[]>();

export const dmRelaySessions = new Map<string, { guildId: string; relayChannelId: string }>();

// ── Persist helpers ──────────────────────────────────────────────────────────

function saveConfigs() {
  saveJson(CONFIG_FILE, Object.fromEntries(guildConfigs));
}

function saveWarnings() {
  saveJson(WARNINGS_FILE, Object.fromEntries(warnings));
}

function saveNotes() {
  saveJson(NOTES_FILE, Object.fromEntries(notes));
}

function saveVcBans() {
  saveJson(VCBANS_FILE, [...vcBans]);
}

// ── Warnings ─────────────────────────────────────────────────────────────────

export function getWarnings(guildId: string, userId: string): Warning[] {
  return warnings.get(`${guildId}:${userId}`) ?? [];
}

export function getAllWarnings(guildId: string): Map<string, Warning[]> {
  const result = new Map<string, Warning[]>();
  for (const [key, value] of warnings.entries()) {
    if (key.startsWith(`${guildId}:`)) {
      const userId = key.split(":")[1];
      result.set(userId, value);
    }
  }
  return result;
}

export function addWarning(guildId: string, userId: string, warning: Warning) {
  const key = `${guildId}:${userId}`;
  const current = warnings.get(key) ?? [];
  current.push(warning);
  warnings.set(key, current);
  saveWarnings();
}

export function clearWarnings(guildId: string, userId: string) {
  warnings.delete(`${guildId}:${userId}`);
  saveWarnings();
}

// ── Notes ────────────────────────────────────────────────────────────────────

export function getNotes(guildId: string, userId: string): Note[] {
  return notes.get(`${guildId}:${userId}`) ?? [];
}

export function addNote(guildId: string, userId: string, note: Note) {
  const key = `${guildId}:${userId}`;
  const current = notes.get(key) ?? [];
  current.push(note);
  notes.set(key, current);
  saveNotes();
}

export function clearNotes(guildId: string, userId: string) {
  notes.delete(`${guildId}:${userId}`);
  saveNotes();
}

// ── Mod History (in-memory only) ─────────────────────────────────────────────

export function getModHistory(guildId: string, userId: string): ModEntry[] {
  return modHistory.get(`${guildId}:${userId}`) ?? [];
}

export function addModEntry(guildId: string, userId: string, entry: ModEntry) {
  const key = `${guildId}:${userId}`;
  const current = modHistory.get(key) ?? [];
  current.push(entry);
  modHistory.set(key, current);
}

// ── VC Bans ───────────────────────────────────────────────────────────────────

export function isVcBanned(guildId: string, userId: string): boolean {
  return vcBans.has(`${guildId}:${userId}`);
}

export function addVcBan(guildId: string, userId: string) {
  vcBans.add(`${guildId}:${userId}`);
  saveVcBans();
}

export function removeVcBan(guildId: string, userId: string) {
  vcBans.delete(`${guildId}:${userId}`);
  saveVcBans();
}

// ── Guild Config ──────────────────────────────────────────────────────────────

export function getGuildConfig(guildId: string): GuildConfig {
  return guildConfigs.get(guildId) ?? {};
}

export function setGuildConfig(guildId: string, config: Partial<GuildConfig>) {
  const current = getGuildConfig(guildId);
  guildConfigs.set(guildId, { ...current, ...config });
  saveConfigs();
}
