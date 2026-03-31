import { EmbedBuilder, Guild, TextChannel } from "discord.js";
import { getGuildConfig } from "./storage.js";

export function successEmbed(title: string, description: string) {
  return new EmbedBuilder()
    .setColor(0x2ecc71)
    .setTitle(`✅ ${title}`)
    .setDescription(description)
    .setTimestamp();
}

export function errorEmbed(description: string) {
  return new EmbedBuilder()
    .setColor(0xe74c3c)
    .setTitle("❌ Error")
    .setDescription(description)
    .setTimestamp();
}

export function infoEmbed(title: string, description: string, color: number = 0x3498db) {
  return new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription(description)
    .setTimestamp();
}

export function parseDuration(str: string): number {
  const match = str.match(/^(\d+)(s|m|h|d)$/i);
  if (!match) return 0;
  const value = parseInt(match[1]);
  const unit = match[2].toLowerCase();
  const units: Record<string, number> = {
    s: 1000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };
  return value * (units[unit] ?? 0);
}

export function formatDuration(ms: number): string {
  const d = Math.floor(ms / 86_400_000);
  const h = Math.floor((ms % 86_400_000) / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  const parts = [];
  if (d) parts.push(`${d}d`);
  if (h) parts.push(`${h}h`);
  if (m) parts.push(`${m}m`);
  if (s) parts.push(`${s}s`);
  return parts.join(" ") || "0s";
}

export async function sendLog(guild: Guild, embed: EmbedBuilder) {
  const config = getGuildConfig(guild.id);
  if (!config.logChannelId) return;
  const channel = guild.channels.cache.get(config.logChannelId) as TextChannel;
  if (channel) await channel.send({ embeds: [embed] }).catch(() => {});
}
