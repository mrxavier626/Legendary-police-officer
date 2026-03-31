import {
  Message,
  GuildMember,
  TextChannel,
  ChannelType,
  EmbedBuilder,
  PermissionFlagsBits,
  VoiceChannel,
} from "discord.js";
import {
  getWarnings, addWarning, clearWarnings, getGuildConfig,
  setGuildConfig, getAllWarnings, dmRelaySessions,
  getNotes, addNote, clearNotes, getModHistory, addModEntry,
  addVcBan, removeVcBan,
} from "./storage.js";
import { successEmbed, errorEmbed, infoEmbed, parseDuration, sendLog } from "./helpers.js";
import { sendVerificationEmbed } from "./verification.js";
import { buildHelpEmbed, buildHelpRow } from "./help-pages.js";

export const PREFIX = "#";

function isAdmin(member: GuildMember): boolean {
  return member.permissions.has(PermissionFlagsBits.Administrator);
}

function adminOnly(msg: Message): boolean {
  if (!isAdmin(msg.member!)) {
    msg.reply({ embeds: [errorEmbed("Only admins can use this command.")] });
    return false;
  }
  return true;
}

export async function handlePrefixCommand(message: Message) {
  if (!message.content.startsWith(PREFIX) || message.author.bot) return;
  if (!message.guild) return;

  const args = message.content.slice(PREFIX.length).trim().split(/\s+/);
  const command = args.shift()!.toLowerCase();
  const guild = message.guild;
  const member = message.member!;

  switch (command) {

    // ── Setup ──────────────────────────────────────────────────────────────
    case "setlog": {
      if (!adminOnly(message)) break;
      const channel = message.mentions.channels.first();
      if (!channel) { message.reply({ embeds: [errorEmbed("Mention a channel: `#setlog #channel`")] }); break; }
      setGuildConfig(guild.id, { logChannelId: channel.id });
      message.reply({ embeds: [successEmbed("Log Channel Set", `Mod logs → <#${channel.id}>`)] });
      break;
    }

    case "setwelcome": {
      if (!adminOnly(message)) break;
      const channel = message.mentions.channels.first();
      if (!channel) { message.reply({ embeds: [errorEmbed("Mention a channel: `#setwelcome #channel`")] }); break; }
      setGuildConfig(guild.id, { welcomeChannelId: channel.id });
      message.reply({ embeds: [successEmbed("Welcome Channel Set", `Welcome messages → <#${channel.id}>`)] });
      break;
    }

    case "setverify": {
      if (!adminOnly(message)) break;
      const channel = message.mentions.channels.first();
      const role = message.mentions.roles.first();
      if (!channel || !role) { message.reply({ embeds: [errorEmbed("Usage: `#setverify #channel @role`")] }); break; }
      setGuildConfig(guild.id, { verifyChannelId: channel.id, verifyRoleId: role.id });
      message.reply({ embeds: [successEmbed("Verification Set", `Channel: <#${channel.id}>\nRole: <@&${role.id}>\n\nNow run \`#setupverify\` to post the embed!`)] });
      break;
    }

    case "setupverify": {
      if (!adminOnly(message)) break;
      const result = await sendVerificationEmbed(guild);
      message.reply({ embeds: [result.success ? successEmbed("Done!", result.message) : errorEmbed(result.message)] });
      break;
    }

    // ── Moderation ─────────────────────────────────────────────────────────
    case "ban": {
      if (!adminOnly(message)) break;
      const target = message.mentions.members?.first();
      const reason = args.slice(1).join(" ") || "No reason provided";
      if (!target) { message.reply({ embeds: [errorEmbed("Mention a user: `#ban @user reason`")] }); break; }
      try {
        await target.ban({ reason });
        message.reply({ embeds: [successEmbed("Banned", `**${target.user.username}** banned. Reason: ${reason}`)] });
        await sendLog(guild, new EmbedBuilder().setColor(0xe74c3c).setTitle("🔨 User Banned").addFields({ name: "User", value: `${target.user.username} (${target.id})` }, { name: "Reason", value: reason }, { name: "Moderator", value: message.author.username }).setTimestamp());
      } catch { message.reply({ embeds: [errorEmbed("Failed to ban user.")] }); }
      break;
    }

    case "unban": {
      if (!adminOnly(message)) break;
      const userId = args[0];
      if (!userId) { message.reply({ embeds: [errorEmbed("Usage: `#unban <userId>`")] }); break; }
      try {
        await guild.members.unban(userId);
        message.reply({ embeds: [successEmbed("Unbanned", `User **${userId}** unbanned.`)] });
      } catch { message.reply({ embeds: [errorEmbed("Could not unban. Check the ID.")] }); }
      break;
    }

    case "kick": {
      if (!adminOnly(message)) break;
      const target = message.mentions.members?.first();
      const reason = args.slice(1).join(" ") || "No reason provided";
      if (!target) { message.reply({ embeds: [errorEmbed("Mention a user: `#kick @user reason`")] }); break; }
      try {
        await target.kick(reason);
        message.reply({ embeds: [successEmbed("Kicked", `**${target.user.username}** kicked. Reason: ${reason}`)] });
        await sendLog(guild, new EmbedBuilder().setColor(0xe67e22).setTitle("👢 User Kicked").addFields({ name: "User", value: `${target.user.username} (${target.id})` }, { name: "Reason", value: reason }, { name: "Moderator", value: message.author.username }).setTimestamp());
      } catch { message.reply({ embeds: [errorEmbed("Failed to kick user.")] }); }
      break;
    }

    case "mute": {
      if (!adminOnly(message)) break;
      const target = message.mentions.members?.first();
      const durationStr = args[1];
      const reason = args.slice(2).join(" ") || "No reason";
      if (!target || !durationStr) { message.reply({ embeds: [errorEmbed("Usage: `#mute @user <duration> [reason]`\nDuration: `10m`, `2h`, `1d`")] }); break; }
      const ms = parseDuration(durationStr);
      if (!ms) { message.reply({ embeds: [errorEmbed("Invalid duration. Use e.g. `10m`, `2h`, `1d`.")] }); break; }
      try {
        await target.timeout(ms, reason);
        message.reply({ embeds: [successEmbed("Muted", `**${target.user.username}** muted for **${durationStr}**. Reason: ${reason}`)] });
        await sendLog(guild, new EmbedBuilder().setColor(0xf39c12).setTitle("🔇 User Muted").addFields({ name: "User", value: `${target.user.username} (${target.id})` }, { name: "Duration", value: durationStr }, { name: "Reason", value: reason }, { name: "Moderator", value: message.author.username }).setTimestamp());
      } catch { message.reply({ embeds: [errorEmbed("Failed to mute user.")] }); }
      break;
    }

    case "unmute": {
      if (!adminOnly(message)) break;
      const target = message.mentions.members?.first();
      if (!target) { message.reply({ embeds: [errorEmbed("Mention a user: `#unmute @user`")] }); break; }
      try {
        await target.timeout(null);
        message.reply({ embeds: [successEmbed("Unmuted", `**${target.user.username}** unmuted.`)] });
      } catch { message.reply({ embeds: [errorEmbed("Failed to unmute user.")] }); }
      break;
    }

    case "warn": {
      if (!adminOnly(message)) break;
      const target = message.mentions.users.first();
      const reason = args.slice(1).join(" ");
      if (!target || !reason) { message.reply({ embeds: [errorEmbed("Usage: `#warn @user <reason>`")] }); break; }
      addWarning(guild.id, target.id, { userId: target.id, moderatorId: message.author.id, reason, timestamp: Date.now() });
      const total = getWarnings(guild.id, target.id).length;
      message.reply({ embeds: [successEmbed("Warning Issued", `**${target.username}** warned. Reason: ${reason}\nTotal: **${total}**`)] });
      target.send({ embeds: [new EmbedBuilder().setColor(0xf39c12).setTitle("⚠️ You have been warned").setDescription(`**Server:** ${guild.name}\n**Reason:** ${reason}\n**Total warnings:** ${total}`)] }).catch(() => {});
      await sendLog(guild, new EmbedBuilder().setColor(0xf39c12).setTitle("⚠️ Warning Issued").addFields({ name: "User", value: `${target.username} (${target.id})` }, { name: "Reason", value: reason }, { name: "Total Warns", value: String(total) }, { name: "Moderator", value: message.author.username }).setTimestamp());
      break;
    }

    case "warnings": {
      if (!adminOnly(message)) break;
      const target = message.mentions.users.first();
      if (!target) { message.reply({ embeds: [errorEmbed("Mention a user: `#warnings @user`")] }); break; }
      const warns = getWarnings(guild.id, target.id);
      if (!warns.length) { message.reply({ embeds: [infoEmbed("📋 Warnings", `**${target.username}** has no warnings.`)] }); break; }
      const list = warns.map((w, i) => `**${i + 1}.** ${w.reason} — by <@${w.moderatorId}> <t:${Math.floor(w.timestamp / 1000)}:R>`).join("\n");
      message.reply({ embeds: [infoEmbed(`⚠️ Warnings — ${target.username}`, list.slice(0, 2048))] });
      break;
    }

    case "clearwarn": {
      if (!adminOnly(message)) break;
      const target = message.mentions.users.first();
      if (!target) { message.reply({ embeds: [errorEmbed("Mention a user: `#clearwarn @user`")] }); break; }
      clearWarnings(guild.id, target.id);
      message.reply({ embeds: [successEmbed("Warnings Cleared", `All warnings for **${target.username}** cleared.`)] });
      break;
    }

    case "purge":
    case "clear": {
      if (!adminOnly(message)) break;
      const amount = parseInt(args[0]);
      if (!amount || amount < 1 || amount > 100) { message.reply({ embeds: [errorEmbed("Usage: `#purge <1-100>`")] }); break; }
      await message.delete().catch(() => {});
      const ch = message.channel as TextChannel;
      const deleted = await ch.bulkDelete(amount, true);
      const reply = await ch.send({ embeds: [successEmbed("Purged", `Deleted **${deleted.size}** messages.`)] });
      setTimeout(() => reply.delete().catch(() => {}), 4000);
      break;
    }

    case "slowmode": {
      if (!adminOnly(message)) break;
      const seconds = parseInt(args[0]);
      if (isNaN(seconds)) { message.reply({ embeds: [errorEmbed("Usage: `#slowmode <seconds>` (0 to disable)")] }); break; }
      await (message.channel as TextChannel).setRateLimitPerUser(seconds);
      message.reply({ embeds: [successEmbed("Slowmode Set", `Slowmode set to **${seconds}s**.`)] });
      break;
    }

    case "lock": {
      if (!adminOnly(message)) break;
      const ch = (message.mentions.channels.first() ?? message.channel) as TextChannel;
      await ch.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: false });
      message.reply({ embeds: [successEmbed("Locked 🔒", `<#${ch.id}> is now locked.`)] });
      break;
    }

    case "unlock": {
      if (!adminOnly(message)) break;
      const ch = (message.mentions.channels.first() ?? message.channel) as TextChannel;
      await ch.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: null });
      message.reply({ embeds: [successEmbed("Unlocked 🔓", `<#${ch.id}> is now unlocked.`)] });
      break;
    }

    case "lockdown": {
      if (!adminOnly(message)) break;
      const textChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildText) as Map<string, TextChannel>;
      for (const [, ch] of textChannels) {
        await ch.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: false }).catch(() => {});
      }
      message.reply({ embeds: [successEmbed("🔒 Server Lockdown", "All channels locked.")] });
      break;
    }

    case "unlockdown": {
      if (!adminOnly(message)) break;
      const textChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildText) as Map<string, TextChannel>;
      for (const [, ch] of textChannels) {
        await ch.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: null }).catch(() => {});
      }
      message.reply({ embeds: [successEmbed("🔓 Lockdown Lifted", "All channels unlocked.")] });
      break;
    }

    case "nick": {
      if (!adminOnly(message)) break;
      const target = message.mentions.members?.first();
      const nickname = args.slice(1).join(" ") || null;
      if (!target) { message.reply({ embeds: [errorEmbed("Usage: `#nick @user <nickname>`")] }); break; }
      await target.setNickname(nickname);
      message.reply({ embeds: [successEmbed("Nickname Changed", `**${target.user.username}**'s nick → ${nickname ?? "*(reset)*"}`)] });
      break;
    }

    case "softban": {
      if (!adminOnly(message)) break;
      const target = message.mentions.members?.first();
      const reason = args.slice(1).join(" ") || "Softban";
      if (!target) { message.reply({ embeds: [errorEmbed("Mention a user: `#softban @user`")] }); break; }
      await target.ban({ deleteMessageSeconds: 7 * 24 * 60 * 60, reason });
      await guild.members.unban(target.id, "Softban");
      message.reply({ embeds: [successEmbed("Softbanned", `**${target.user.username}** softbanned.`)] });
      break;
    }

    case "tempban": {
      if (!adminOnly(message)) break;
      const target = message.mentions.members?.first();
      const durationStr = args[1];
      const reason = args.slice(2).join(" ") || "Tempban";
      if (!target || !durationStr) { message.reply({ embeds: [errorEmbed("Usage: `#tempban @user <duration> [reason]`")] }); break; }
      const ms = parseDuration(durationStr);
      if (!ms) { message.reply({ embeds: [errorEmbed("Invalid duration.")] }); break; }
      const userId = target.id;
      await target.ban({ reason });
      message.reply({ embeds: [successEmbed("Tempbanned", `**${target.user.username}** banned for **${durationStr}**.`)] });
      setTimeout(async () => { await guild.members.unban(userId, "Tempban expired").catch(() => {}); }, ms);
      break;
    }

    case "massban": {
      if (!adminOnly(message)) break;
      const ids = args;
      const reason = "Massban";
      let success = 0, fail = 0;
      for (const id of ids) {
        try { await guild.members.ban(id, { reason }); success++; } catch { fail++; }
      }
      message.reply({ embeds: [successEmbed("Massban", `Banned: **${success}** | Failed: **${fail}**`)] });
      break;
    }

    // ── Voice ──────────────────────────────────────────────────────────────
    case "vckick": {
      if (!adminOnly(message)) break;
      const target = message.mentions.members?.first();
      if (!target?.voice.channel) { message.reply({ embeds: [errorEmbed("User is not in a voice channel.")] }); break; }
      await target.voice.disconnect();
      message.reply({ embeds: [successEmbed("VC Kicked", `**${target.user.username}** removed from voice.`)] });
      break;
    }

    case "vcmute": {
      if (!adminOnly(message)) break;
      const target = message.mentions.members?.first();
      if (!target) { message.reply({ embeds: [errorEmbed("Mention a user.")] }); break; }
      await target.voice.setMute(true);
      message.reply({ embeds: [successEmbed("VC Muted", `**${target.user.username}** server-muted.`)] });
      break;
    }

    case "vcunmute": {
      if (!adminOnly(message)) break;
      const target = message.mentions.members?.first();
      if (!target) { message.reply({ embeds: [errorEmbed("Mention a user.")] }); break; }
      await target.voice.setMute(false);
      message.reply({ embeds: [successEmbed("VC Unmuted", `**${target.user.username}** server-unmuted.`)] });
      break;
    }

    case "deafen": {
      if (!adminOnly(message)) break;
      const target = message.mentions.members?.first();
      if (!target) { message.reply({ embeds: [errorEmbed("Mention a user.")] }); break; }
      await target.voice.setDeaf(true);
      message.reply({ embeds: [successEmbed("Deafened", `**${target.user.username}** server-deafened.`)] });
      break;
    }

    case "undeafen": {
      if (!adminOnly(message)) break;
      const target = message.mentions.members?.first();
      if (!target) { message.reply({ embeds: [errorEmbed("Mention a user.")] }); break; }
      await target.voice.setDeaf(false);
      message.reply({ embeds: [successEmbed("Undeafened", `**${target.user.username}** server-undeafened.`)] });
      break;
    }

    case "move": {
      if (!adminOnly(message)) break;
      const target = message.mentions.members?.first();
      const channelMention = message.mentions.channels.first() as VoiceChannel | undefined;
      if (!target?.voice.channel) { message.reply({ embeds: [errorEmbed("User is not in a voice channel.")] }); break; }
      if (!channelMention) { message.reply({ embeds: [errorEmbed("Usage: `#move @user #voice-channel`")] }); break; }
      try {
        await target.voice.setChannel(channelMention.id);
        message.reply({ embeds: [successEmbed("Moved", `**${target.user.username}** moved to **${channelMention.name}**.`)] });
      } catch { message.reply({ embeds: [errorEmbed("Failed to move user.")] }); }
      break;
    }

    // ── Roles ──────────────────────────────────────────────────────────────
    case "addrole": {
      if (!adminOnly(message)) break;
      const target = message.mentions.members?.first();
      const role = message.mentions.roles.first();
      if (!target || !role) { message.reply({ embeds: [errorEmbed("Usage: `#addrole @user @role`")] }); break; }
      await target.roles.add(role.id);
      message.reply({ embeds: [successEmbed("Role Added", `<@&${role.id}> added to **${target.user.username}**.`)] });
      break;
    }

    case "removerole": {
      if (!adminOnly(message)) break;
      const target = message.mentions.members?.first();
      const role = message.mentions.roles.first();
      if (!target || !role) { message.reply({ embeds: [errorEmbed("Usage: `#removerole @user @role`")] }); break; }
      await target.roles.remove(role.id);
      message.reply({ embeds: [successEmbed("Role Removed", `<@&${role.id}> removed from **${target.user.username}**.`)] });
      break;
    }

    case "createrole": {
      if (!adminOnly(message)) break;
      const name = args[0];
      const color = (args[1] ?? "#99aab5") as `#${string}`;
      if (!name) { message.reply({ embeds: [errorEmbed("Usage: `#createrole <name> [#hex-color]`")] }); break; }
      const role = await guild.roles.create({ name, color });
      message.reply({ embeds: [successEmbed("Role Created", `Role <@&${role.id}> created.`)] });
      break;
    }

    case "deleterole": {
      if (!adminOnly(message)) break;
      const role = message.mentions.roles.first();
      if (!role) { message.reply({ embeds: [errorEmbed("Mention a role: `#deleterole @role`")] }); break; }
      await guild.roles.delete(role.id);
      message.reply({ embeds: [successEmbed("Role Deleted", `Role **${role.name}** deleted.`)] });
      break;
    }

    // ── Communication ──────────────────────────────────────────────────────
    case "say": {
      if (!adminOnly(message)) break;
      const ch = (message.mentions.channels.first() ?? message.channel) as TextChannel;
      const text = args.filter(a => !a.startsWith("<#")).join(" ");
      if (!text) { message.reply({ embeds: [errorEmbed("Usage: `#say [#channel] <message>`")] }); break; }
      await message.delete().catch(() => {});
      await ch.send(text);
      break;
    }

    case "announce": {
      if (!adminOnly(message)) break;
      const text = args.join(" ");
      if (!text) { message.reply({ embeds: [errorEmbed("Usage: `#announce <message>`")] }); break; }
      const embed = new EmbedBuilder().setColor(0xe74c3c).setTitle("📢 Announcement").setDescription(text).setTimestamp();
      await (message.channel as TextChannel).send({ embeds: [embed] });
      await message.delete().catch(() => {});
      break;
    }

    case "dm": {
      if (!adminOnly(message)) break;
      const target = message.mentions.users.first();
      const text = args.slice(1).join(" ");
      if (!target || !text) { message.reply({ embeds: [errorEmbed("Usage: `#dm @user <message>`")] }); break; }
      try {
        await target.send(text);
        message.reply({ embeds: [successEmbed("DM Sent", `Message sent to **${target.username}**.`)] });
      } catch { message.reply({ embeds: [errorEmbed("Could not send DM. User may have DMs disabled.")] }); }
      break;
    }

    case "reply": {
      if (!adminOnly(message)) break;
      const target = message.mentions.users.first();
      const text = args.slice(1).join(" ");
      if (!target || !text) { message.reply({ embeds: [errorEmbed("Usage: `#reply @user <message>`")] }); break; }
      try {
        await target.send(text);
        message.reply({ embeds: [successEmbed("Reply Sent", `Reply sent to **${target.username}**.`)] });
      } catch { message.reply({ embeds: [errorEmbed("Could not send reply.")] }); }
      break;
    }

    case "chat": {
      if (!adminOnly(message)) break;
      const target = message.mentions.users.first();
      const text = args.slice(1).join(" ");
      if (!target) { message.reply({ embeds: [errorEmbed("Usage: `#chat @user [first message]`")] }); break; }
      const config = getGuildConfig(guild.id);
      if (!config.logChannelId) { message.reply({ embeds: [errorEmbed("Set a log channel first with `#setlog #channel`.")] }); break; }
      dmRelaySessions.set(target.id, { guildId: guild.id, relayChannelId: config.logChannelId });
      try {
        if (text) await target.send(text);
        message.reply({ embeds: [successEmbed("Chat Opened", `DM relay opened with **${target.username}**. Their replies will appear in <#${config.logChannelId}>.`)] });
        const logCh = guild.channels.cache.get(config.logChannelId) as TextChannel;
        if (logCh) await logCh.send({ embeds: [new EmbedBuilder().setColor(0x9b59b6).setTitle(`💬 Chat Relay — ${target.username}`).setDescription(`Relay with <@${target.id}> opened.\nTo reply: \`#reply @${target.username} <message>\``).setTimestamp()] });
      } catch { message.reply({ embeds: [errorEmbed("Could not DM user.")] }); }
      break;
    }

    // ── Info ──────────────────────────────────────────────────────────────
    case "ping": {
      if (!adminOnly(message)) break;
      message.reply({ embeds: [infoEmbed("🏓 Pong!", `Latency: **${message.client.ws.ping}ms**`)] });
      break;
    }

    case "userinfo": {
      if (!adminOnly(message)) break;
      const target = message.mentions.users.first() ?? message.author;
      const targetMember = guild.members.cache.get(target.id);
      const warns = getWarnings(guild.id, target.id);
      const embed = new EmbedBuilder()
        .setColor(0x3498db).setTitle(`👤 ${target.username}`)
        .setThumbnail(target.displayAvatarURL())
        .addFields(
          { name: "User ID", value: target.id, inline: true },
          { name: "Joined", value: targetMember?.joinedTimestamp ? `<t:${Math.floor(targetMember.joinedTimestamp / 1000)}:R>` : "Unknown", inline: true },
          { name: "Warnings", value: String(warns.length), inline: true },
          { name: "Roles", value: targetMember?.roles.cache.filter(r => r.id !== guild.id).map(r => `<@&${r.id}>`).join(", ") || "None", inline: false }
        ).setTimestamp();
      message.reply({ embeds: [embed] });
      break;
    }

    case "avatar": {
      if (!adminOnly(message)) break;
      const target = message.mentions.users.first() ?? message.author;
      message.reply({ embeds: [new EmbedBuilder().setColor(0x3498db).setTitle(`🖼️ ${target.username}'s Avatar`).setImage(target.displayAvatarURL({ size: 512 }))] });
      break;
    }

    case "serverinfo": {
      if (!adminOnly(message)) break;
      const embed = new EmbedBuilder()
        .setColor(0x9b59b6).setTitle(`🏠 ${guild.name}`)
        .setThumbnail(guild.iconURL() ?? "")
        .addFields(
          { name: "Members", value: String(guild.memberCount), inline: true },
          { name: "Channels", value: String(guild.channels.cache.size), inline: true },
          { name: "Roles", value: String(guild.roles.cache.size), inline: true }
        ).setTimestamp();
      message.reply({ embeds: [embed] });
      break;
    }

    case "warnlist": {
      if (!adminOnly(message)) break;
      const all = getAllWarnings(guild.id);
      if (!all.size) { message.reply({ embeds: [infoEmbed("📋 Warnings", "No warnings recorded.")] }); break; }
      let desc = "";
      for (const [userId, warns] of all.entries()) desc += `• <@${userId}> — **${warns.length}** warning(s)\n`;
      message.reply({ embeds: [infoEmbed("📋 All Warnings", desc.slice(0, 2048))] });
      break;
    }

    case "listbans": {
      if (!adminOnly(message)) break;
      const bans = await guild.bans.fetch();
      const list = bans.map(b => `• **${b.user.username}** (${b.user.id})`).join("\n") || "No bans.";
      message.reply({ embeds: [infoEmbed(`🔨 Banned Users (${bans.size})`, list.slice(0, 2048))] });
      break;
    }

    case "listroles": {
      if (!adminOnly(message)) break;
      const roles = guild.roles.cache.filter(r => r.id !== guild.id);
      const list = roles.map(r => `• ${r.name} (${r.members.size} members)`).join("\n");
      message.reply({ embeds: [infoEmbed(`🏷️ Roles (${roles.size})`, list.slice(0, 2048))] });
      break;
    }

    case "listchannels": {
      if (!adminOnly(message)) break;
      const channels = guild.channels.cache;
      const list = channels.map(c => `• #${c.name} (${c.type})`).join("\n");
      message.reply({ embeds: [infoEmbed(`📋 Channels (${channels.size})`, list.slice(0, 2048))] });
      break;
    }

    case "listmembers": {
      if (!adminOnly(message)) break;
      const members = guild.members.cache;
      const list = members.map(m => `• **${m.user.username}** (${m.id})`).join("\n");
      message.reply({ embeds: [infoEmbed(`👥 Members (${members.size})`, list.slice(0, 2048))] });
      break;
    }

    case "banner": {
      if (!adminOnly(message)) break;
      const target = await (message.mentions.users.first() ?? message.author).fetch(true).catch(() => null);
      if (!target) { message.reply({ embeds: [errorEmbed("Could not fetch user.")] }); break; }
      const url = target.bannerURL({ size: 512 });
      if (!url) { message.reply({ embeds: [errorEmbed("This user has no banner.")] }); break; }
      message.reply({ embeds: [new EmbedBuilder().setColor(0x3498db).setTitle(`🖼️ Banner — ${target.username}`).setImage(url)] });
      break;
    }

    case "roleinfo": {
      if (!adminOnly(message)) break;
      const role = message.mentions.roles.first();
      if (!role) { message.reply({ embeds: [errorEmbed("Usage: `#roleinfo @role`")] }); break; }
      message.reply({ embeds: [new EmbedBuilder()
        .setColor(role.color || 0x95a5a6)
        .setTitle(`🏷️ Role Info — ${role.name}`)
        .addFields(
          { name: "Role ID", value: role.id, inline: true },
          { name: "Color", value: role.hexColor, inline: true },
          { name: "Members", value: String(role.members.size), inline: true },
          { name: "Mentionable", value: role.mentionable ? "Yes" : "No", inline: true },
          { name: "Hoisted", value: role.hoist ? "Yes" : "No", inline: true },
          { name: "Position", value: String(role.position), inline: true }
        )] });
      break;
    }

    case "channelinfo": {
      if (!adminOnly(message)) break;
      const ch = (message.mentions.channels.first() ?? message.channel) as TextChannel;
      message.reply({ embeds: [new EmbedBuilder()
        .setColor(0x1abc9c)
        .setTitle(`📢 Channel Info — #${ch.name}`)
        .addFields(
          { name: "Channel ID", value: ch.id, inline: true },
          { name: "Type", value: String(ch.type), inline: true },
          { name: "Created", value: `<t:${Math.floor((ch.createdTimestamp ?? Date.now()) / 1000)}:R>`, inline: true }
        )] });
      break;
    }

    case "emoji": {
      if (!adminOnly(message)) break;
      const raw = args[0];
      if (!raw) { message.reply({ embeds: [errorEmbed("Usage: `#emoji <emoji>`")] }); break; }
      const match = raw.match(/<a?:(\w+):(\d+)>/);
      if (match) {
        message.reply({ embeds: [new EmbedBuilder().setColor(0xf39c12)
          .setTitle(`😀 Emoji Info — :${match[1]}:`)
          .addFields({ name: "ID", value: match[2], inline: true }, { name: "Name", value: match[1], inline: true })
          .setThumbnail(`https://cdn.discordapp.com/emojis/${match[2]}.png`)] });
      } else {
        message.reply({ embeds: [infoEmbed("😀 Emoji", `Emoji: ${raw}`)] });
      }
      break;
    }

    case "createchannel": {
      if (!adminOnly(message)) break;
      const name = args[0];
      const type = args[1] ?? "text";
      if (!name) { message.reply({ embeds: [errorEmbed("Usage: `#createchannel <name> [text|voice]`")] }); break; }
      const ch = await guild.channels.create({ name, type: type === "voice" ? ChannelType.GuildVoice : ChannelType.GuildText });
      message.reply({ embeds: [successEmbed("Channel Created", `<#${ch.id}> has been created.`)] });
      break;
    }

    case "deletechannel": {
      if (!adminOnly(message)) break;
      const ch = message.mentions.channels.first();
      if (!ch) { message.reply({ embeds: [errorEmbed("Usage: `#deletechannel #channel`")] }); break; }
      const chName = ch.name;
      await guild.channels.delete(ch.id);
      message.reply({ embeds: [successEmbed("Channel Deleted", `Channel **#${chName}** has been deleted.`)] });
      break;
    }

    // ── New Moderation ─────────────────────────────────────────────────────
    case "hackban": {
      if (!adminOnly(message)) break;
      const userId = args[0];
      const reason = args.slice(1).join(" ") || "No reason provided";
      if (!userId) { message.reply({ embeds: [errorEmbed("Usage: `#hackban <userID> [reason]`")] }); break; }
      try {
        await guild.members.ban(userId, { reason });
        message.reply({ embeds: [successEmbed("Hackbanned", `User \`${userId}\` has been banned.`)] });
      } catch { message.reply({ embeds: [errorEmbed("Failed to ban. Check the user ID.")] }); }
      break;
    }

    case "massmute": {
      if (!adminOnly(message)) break;
      const durationStr = args[0];
      const targets = message.mentions.members;
      const reason = args.slice(targets?.size ? targets.size + 1 : 1).join(" ") || "Massmute";
      const ms = parseDuration(durationStr);
      if (!ms || !targets?.size) { message.reply({ embeds: [errorEmbed("Usage: `#massmute <duration> @u1 @u2 ...`")] }); break; }
      let ok = 0;
      for (const [, m] of targets) { try { await m.timeout(ms, reason); ok++; } catch {} }
      message.reply({ embeds: [successEmbed("Mass Muted", `Muted **${ok}** user(s) for ${durationStr}.`)] });
      break;
    }

    case "massunmute": {
      if (!adminOnly(message)) break;
      const targets = message.mentions.members;
      if (!targets?.size) { message.reply({ embeds: [errorEmbed("Usage: `#massunmute @u1 @u2 ...`")] }); break; }
      let ok = 0;
      for (const [, m] of targets) { try { await m.timeout(null); ok++; } catch {} }
      message.reply({ embeds: [successEmbed("Mass Unmuted", `Unmuted **${ok}** user(s).`)] });
      break;
    }

    case "purgebot": {
      if (!adminOnly(message)) break;
      const amount = parseInt(args[0] ?? "10", 10);
      if (isNaN(amount) || amount < 1 || amount > 100) { message.reply({ embeds: [errorEmbed("Usage: `#purgebot <1-100>`")] }); break; }
      const ch = message.channel as TextChannel;
      const messages = await ch.messages.fetch({ limit: amount });
      const botMsgs = messages.filter(m => m.author.bot);
      await ch.bulkDelete(botMsgs, true).catch(() => {});
      message.reply({ embeds: [successEmbed("Purged Bots", `Deleted **${botMsgs.size}** bot message(s).`)] });
      break;
    }

    case "purgeuser": {
      if (!adminOnly(message)) break;
      const target = message.mentions.users.first();
      const amount = parseInt(args[1] ?? "10", 10);
      if (!target || isNaN(amount)) { message.reply({ embeds: [errorEmbed("Usage: `#purgeuser @user <amount>`")] }); break; }
      const ch = message.channel as TextChannel;
      const messages = await ch.messages.fetch({ limit: Math.min(amount, 100) });
      const userMsgs = messages.filter(m => m.author.id === target.id);
      await ch.bulkDelete(userMsgs, true).catch(() => {});
      message.reply({ embeds: [successEmbed("Purged User", `Deleted **${userMsgs.size}** message(s) from **${target.username}**.`)] });
      break;
    }

    case "nuke": {
      if (!adminOnly(message)) break;
      const ch = message.channel as TextChannel;
      const pos = ch.position;
      const parent = ch.parentId;
      const topic = ch.topic ?? undefined;
      const nuked = await ch.clone({ name: ch.name, position: pos, parent: parent ?? undefined, topic });
      await ch.delete();
      await nuked.send({ embeds: [successEmbed("💥 Channel Nuked", "This channel has been nuked and recreated.")] });
      break;
    }

    case "cleannick": {
      if (!adminOnly(message)) break;
      const target = message.mentions.members?.first();
      if (!target) { message.reply({ embeds: [errorEmbed("Usage: `#cleannick @user`")] }); break; }
      await target.setNickname(null);
      message.reply({ embeds: [successEmbed("Nickname Reset", `**${target.user.username}**'s nickname has been removed.`)] });
      break;
    }

    case "dehoist": {
      if (!adminOnly(message)) break;
      const target = message.mentions.members?.first();
      if (!target) { message.reply({ embeds: [errorEmbed("Usage: `#dehoist @user`")] }); break; }
      const nick = target.displayName;
      const cleaned = nick.replace(/^[^a-zA-Z0-9]+/, "") || "moderated";
      await target.setNickname(cleaned);
      message.reply({ embeds: [successEmbed("Dehoisted", `Nickname changed to **${cleaned}**.`)] });
      break;
    }

    case "strip": {
      if (!adminOnly(message)) break;
      const target = message.mentions.members?.first();
      if (!target) { message.reply({ embeds: [errorEmbed("Usage: `#strip @user`")] }); break; }
      const roles = target.roles.cache.filter(r => r.id !== guild.id && r.editable);
      await target.roles.remove(roles);
      message.reply({ embeds: [successEmbed("Roles Stripped", `Removed **${roles.size}** role(s) from **${target.user.username}**.`)] });
      break;
    }

    case "note": {
      if (!adminOnly(message)) break;
      const target = message.mentions.users.first();
      const text = args.slice(1).join(" ");
      if (!target || !text) { message.reply({ embeds: [errorEmbed("Usage: `#note @user <text>`")] }); break; }
      addNote(guild.id, target.id, { authorId: message.author.id, content: text, timestamp: Date.now() });
      message.reply({ embeds: [successEmbed("Note Added", `Note saved for **${target.username}**.`)] });
      break;
    }

    case "notes": {
      if (!adminOnly(message)) break;
      const target = message.mentions.users.first();
      if (!target) { message.reply({ embeds: [errorEmbed("Usage: `#notes @user`")] }); break; }
      const userNotes = getNotes(guild.id, target.id);
      if (!userNotes.length) { message.reply({ embeds: [infoEmbed("📋 Notes", `No notes for **${target.username}**.`)] }); break; }
      const desc = userNotes.map((n, i) => `**${i + 1}.** <t:${Math.floor(n.timestamp / 1000)}:R> by <@${n.authorId}>\n↳ ${n.content}`).join("\n\n");
      message.reply({ embeds: [infoEmbed(`📋 Notes — ${target.username}`, desc.slice(0, 2048))] });
      break;
    }

    case "clearnotes": {
      if (!adminOnly(message)) break;
      const target = message.mentions.users.first();
      if (!target) { message.reply({ embeds: [errorEmbed("Usage: `#clearnotes @user`")] }); break; }
      clearNotes(guild.id, target.id);
      message.reply({ embeds: [successEmbed("Notes Cleared", `All notes for **${target.username}** deleted.`)] });
      break;
    }

    case "history": {
      if (!adminOnly(message)) break;
      const target = message.mentions.users.first();
      if (!target) { message.reply({ embeds: [errorEmbed("Usage: `#history @user`")] }); break; }
      const warns = getWarnings(guild.id, target.id);
      const hist = getModHistory(guild.id, target.id);
      let desc = `**Warnings:** ${warns.length}\n`;
      if (warns.length) desc += warns.map(w => `• <t:${Math.floor(w.timestamp / 1000)}:R> — ${w.reason}`).join("\n") + "\n\n";
      if (hist.length) {
        desc += "**Actions:**\n";
        desc += hist.map(h => `• **${h.action}** — <t:${Math.floor(h.timestamp / 1000)}:R> — ${h.reason}`).join("\n");
      } else if (!warns.length) {
        desc = "No moderation history found.";
      }
      message.reply({ embeds: [infoEmbed(`📋 History — ${target.username}`, desc.slice(0, 2048))] });
      break;
    }

    case "massdeafen": {
      if (!adminOnly(message)) break;
      const targets = message.mentions.members;
      if (!targets?.size) { message.reply({ embeds: [errorEmbed("Usage: `#massdeafen @u1 @u2 ...`")] }); break; }
      let ok = 0;
      for (const [, m] of targets) { if (m.voice.channel) { await m.voice.setDeaf(true).catch(() => {}); ok++; } }
      message.reply({ embeds: [successEmbed("Mass Deafened", `Deafened **${ok}** user(s).`)] });
      break;
    }

    case "massundeafen": {
      if (!adminOnly(message)) break;
      const targets = message.mentions.members;
      if (!targets?.size) { message.reply({ embeds: [errorEmbed("Usage: `#massundeafen @u1 @u2 ...`")] }); break; }
      let ok = 0;
      for (const [, m] of targets) { if (m.voice.channel) { await m.voice.setDeaf(false).catch(() => {}); ok++; } }
      message.reply({ embeds: [successEmbed("Mass Undeafened", `Undeafened **${ok}** user(s).`)] });
      break;
    }

    case "vcban": {
      if (!adminOnly(message)) break;
      const target = message.mentions.members?.first();
      if (!target) { message.reply({ embeds: [errorEmbed("Usage: `#vcban @user`")] }); break; }
      addVcBan(guild.id, target.id);
      if (target.voice.channel) await target.voice.disconnect().catch(() => {});
      message.reply({ embeds: [successEmbed("VC Banned", `**${target.user.username}** is banned from voice channels.`)] });
      break;
    }

    case "unvcban": {
      if (!adminOnly(message)) break;
      const target = message.mentions.members?.first();
      if (!target) { message.reply({ embeds: [errorEmbed("Usage: `#unvcban @user`")] }); break; }
      removeVcBan(guild.id, target.id);
      message.reply({ embeds: [successEmbed("VC Unbanned", `**${target.user.username}** can join voice channels again.`)] });
      break;
    }

    case "setcolor": {
      if (!adminOnly(message)) break;
      const role = message.mentions.roles.first();
      const color = args[1] as `#${string}` | undefined;
      if (!role || !color) { message.reply({ embeds: [errorEmbed("Usage: `#setcolor @role #hexcolor`")] }); break; }
      await guild.roles.edit(role.id, { color });
      message.reply({ embeds: [successEmbed("Color Updated", `Role **${role.name}** color set to \`${color}\`.`)] });
      break;
    }

    case "mentionable": {
      if (!adminOnly(message)) break;
      const role = message.mentions.roles.first();
      if (!role) { message.reply({ embeds: [errorEmbed("Usage: `#mentionable @role`")] }); break; }
      const guildRole = guild.roles.cache.get(role.id);
      if (!guildRole) break;
      await guildRole.setMentionable(!guildRole.mentionable);
      message.reply({ embeds: [successEmbed("Mentionable Toggled", `**${guildRole.name}** is now **${guildRole.mentionable ? "not " : ""}mentionable**.`)] });
      break;
    }

    case "roledump": {
      if (!adminOnly(message)) break;
      const role = message.mentions.roles.first();
      if (!role) { message.reply({ embeds: [errorEmbed("Usage: `#roledump @role`")] }); break; }
      const guildRole = guild.roles.cache.get(role.id);
      if (!guildRole) break;
      const members = guildRole.members.map(m => `• **${m.user.username}** (${m.id})`).join("\n") || "No members with this role.";
      message.reply({ embeds: [infoEmbed(`🏷️ Members with @${guildRole.name} (${guildRole.members.size})`, members.slice(0, 2048))] });
      break;
    }

    case "invites": {
      if (!adminOnly(message)) break;
      const invites = await guild.invites.fetch();
      if (!invites.size) { message.reply({ embeds: [infoEmbed("📋 Invites", "No active invite links.")] }); break; }
      const list = invites.map(i => `• \`${i.code}\` — by **${i.inviter?.username ?? "Unknown"}** — ${i.uses ?? 0} uses`).join("\n");
      message.reply({ embeds: [infoEmbed(`📋 Server Invites (${invites.size})`, list.slice(0, 2048))] });
      break;
    }

    case "clearinvites": {
      if (!adminOnly(message)) break;
      const invites = await guild.invites.fetch();
      for (const invite of invites.values()) await invite.delete().catch(() => {});
      message.reply({ embeds: [successEmbed("Invites Cleared", `Deleted **${invites.size}** invite(s).`)] });
      break;
    }

    case "createinvite": {
      if (!adminOnly(message)) break;
      const ch = (message.mentions.channels.first() ?? message.channel) as TextChannel;
      const invite = await ch.createInvite({ maxAge: 0, maxUses: 0 });
      message.reply({ embeds: [successEmbed("Invite Created", `Your invite link:\nhttps://discord.gg/${invite.code}`)] });
      break;
    }

    case "servericon": {
      if (!adminOnly(message)) break;
      const url = guild.iconURL({ size: 512 });
      if (!url) { message.reply({ embeds: [errorEmbed("This server has no icon.")] }); break; }
      message.reply({ embeds: [new EmbedBuilder().setColor(0x3498db).setTitle(`🖼️ Server Icon — ${guild.name}`).setImage(url)] });
      break;
    }

    case "help": {
      if (!adminOnly(message)) break;
      await message.reply({ embeds: [buildHelpEmbed(0)], components: [buildHelpRow(0, message.author.id)] });
      break;
    }
  }
}
