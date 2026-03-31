import {
  ChatInputCommandInteraction,
  GuildMember,
  TextChannel,
  VoiceChannel,
  ChannelType,
  EmbedBuilder,
  PermissionFlagsBits,
  Guild,
  User,
} from "discord.js";
import {
  getWarnings, addWarning, clearWarnings, getGuildConfig,
  setGuildConfig, getAllWarnings, dmRelaySessions,
  getNotes, addNote, clearNotes, getModHistory, addModEntry,
  isVcBanned, addVcBan, removeVcBan,
} from "./storage.js";
import { successEmbed, errorEmbed, infoEmbed, parseDuration, formatDuration, sendLog } from "./helpers.js";
import { sendVerificationEmbed } from "./verification.js";
import { buildHelpEmbed, buildHelpRow } from "./help-pages.js";

type Ctx = ChatInputCommandInteraction;

function adminCheck(member: GuildMember | null, interaction: Ctx): boolean {
  if (!member?.permissions.has(PermissionFlagsBits.Administrator)) {
    interaction.reply({ embeds: [errorEmbed("Only admins can use this command.")], ephemeral: true });
    return false;
  }
  return true;
}

export async function handleSlashCommand(interaction: Ctx) {
  const { commandName, guild, member } = interaction;
  const guildMember = member as GuildMember;

  if (!guild) {
    await interaction.reply({ content: "This command must be used in a server.", ephemeral: true });
    return;
  }

  switch (commandName) {

    // ── Info ──────────────────────────────────────────────────────────────
    case "ping": {
      const latency = interaction.client.ws.ping;
      await interaction.reply({ embeds: [infoEmbed("🏓 Pong!", `Latency: **${latency}ms** | API: **${Date.now() - interaction.createdTimestamp}ms**`)] });
      break;
    }

    case "help": {
      if (!adminCheck(guildMember, interaction)) break;
      await interaction.reply({ embeds: [buildHelpEmbed(0)], components: [buildHelpRow(0, interaction.user.id)] });
      break;
    }

    case "servericon": {
      if (!adminCheck(guildMember, interaction)) break;
      const url = guild.iconURL({ size: 512 });
      if (!url) { await interaction.reply({ embeds: [errorEmbed("This server has no icon.")], ephemeral: true }); break; }
      await interaction.reply({ embeds: [new EmbedBuilder().setColor(0x3498db).setTitle(`🖼️ Server Icon — ${guild.name}`).setImage(url)] });
      break;
    }


    case "userinfo": {
      const target = interaction.options.getUser("user") ?? interaction.user;
      const targetMember = guild.members.cache.get(target.id);
      const warns = getWarnings(guild.id, target.id);
      const embed = new EmbedBuilder()
        .setColor(0x3498db)
        .setTitle(`👤 User Info — ${target.username}`)
        .setThumbnail(target.displayAvatarURL())
        .addFields(
          { name: "Username", value: target.username, inline: true },
          { name: "User ID", value: target.id, inline: true },
          { name: "Bot?", value: target.bot ? "Yes" : "No", inline: true },
          { name: "Account Created", value: `<t:${Math.floor(target.createdTimestamp / 1000)}:R>`, inline: true },
          { name: "Joined Server", value: targetMember?.joinedTimestamp ? `<t:${Math.floor(targetMember.joinedTimestamp / 1000)}:R>` : "Unknown", inline: true },
          { name: "Warnings", value: String(warns.length), inline: true },
          { name: "Roles", value: targetMember?.roles.cache.filter(r => r.id !== guild.id).map(r => `<@&${r.id}>`).join(", ") || "None", inline: false }
        )
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
      break;
    }

    case "serverinfo": {
      const embed = new EmbedBuilder()
        .setColor(0x9b59b6)
        .setTitle(`🏠 Server Info — ${guild.name}`)
        .setThumbnail(guild.iconURL() ?? "")
        .addFields(
          { name: "Server ID", value: guild.id, inline: true },
          { name: "Owner", value: `<@${guild.ownerId}>`, inline: true },
          { name: "Members", value: String(guild.memberCount), inline: true },
          { name: "Channels", value: String(guild.channels.cache.size), inline: true },
          { name: "Roles", value: String(guild.roles.cache.size), inline: true },
          { name: "Created", value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true }
        )
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
      break;
    }

    case "avatar": {
      const target = interaction.options.getUser("user") ?? interaction.user;
      const url = target.displayAvatarURL({ size: 512 });
      const embed = new EmbedBuilder().setColor(0x3498db).setTitle(`🖼️ Avatar — ${target.username}`).setImage(url);
      await interaction.reply({ embeds: [embed] });
      break;
    }

    case "banner": {
      const target = await interaction.client.users.fetch(interaction.options.getUser("user")?.id ?? interaction.user.id, { force: true });
      const url = target.bannerURL({ size: 512 });
      if (!url) {
        await interaction.reply({ embeds: [errorEmbed("This user has no banner.")], ephemeral: true });
        break;
      }
      const embed = new EmbedBuilder().setColor(0x3498db).setTitle(`🖼️ Banner — ${target.username}`).setImage(url);
      await interaction.reply({ embeds: [embed] });
      break;
    }

    case "roleinfo": {
      const role = interaction.options.getRole("role", true);
      const embed = new EmbedBuilder()
        .setColor(role.color || 0x95a5a6)
        .setTitle(`🏷️ Role Info — ${role.name}`)
        .addFields(
          { name: "Role ID", value: role.id, inline: true },
          { name: "Color", value: role.hexColor, inline: true },
          { name: "Members", value: String(guild.roles.cache.get(role.id)?.members.size ?? 0), inline: true },
          { name: "Mentionable", value: role.mentionable ? "Yes" : "No", inline: true },
          { name: "Hoisted", value: role.hoist ? "Yes" : "No", inline: true },
          { name: "Position", value: String(role.position), inline: true }
        );
      await interaction.reply({ embeds: [embed] });
      break;
    }

    case "channelinfo": {
      const ch = (interaction.options.getChannel("channel") ?? interaction.channel) as TextChannel;
      const embed = new EmbedBuilder()
        .setColor(0x1abc9c)
        .setTitle(`📢 Channel Info — #${ch.name}`)
        .addFields(
          { name: "Channel ID", value: ch.id, inline: true },
          { name: "Type", value: String(ch.type), inline: true },
          { name: "Created", value: `<t:${Math.floor(ch.createdTimestamp! / 1000)}:R>`, inline: true }
        );
      await interaction.reply({ embeds: [embed] });
      break;
    }

    case "emoji": {
      const raw = interaction.options.getString("emoji", true);
      const match = raw.match(/<a?:(\w+):(\d+)>/);
      if (match) {
        const embed = new EmbedBuilder().setColor(0xf39c12)
          .setTitle(`😀 Emoji Info — :${match[1]}:`)
          .addFields({ name: "ID", value: match[2], inline: true }, { name: "Name", value: match[1], inline: true })
          .setThumbnail(`https://cdn.discordapp.com/emojis/${match[2]}.png`);
        await interaction.reply({ embeds: [embed] });
      } else {
        await interaction.reply({ embeds: [infoEmbed("😀 Emoji", `Emoji: ${raw}`)] });
      }
      break;
    }

    // ── Admin Info ─────────────────────────────────────────────────────────
    case "listbans": {
      if (!adminCheck(guildMember, interaction)) break;
      const bans = await guild.bans.fetch();
      const list = bans.map(b => `• **${b.user.username}** (${b.user.id}) — ${b.reason ?? "No reason"}`).join("\n") || "No banned users.";
      const pages = list.match(/.{1,1024}/gs) ?? [list];
      const embed = new EmbedBuilder().setColor(0xe74c3c).setTitle(`🔨 Banned Users (${bans.size})`).setDescription(pages[0]);
      await interaction.reply({ embeds: [embed] });
      break;
    }

    case "listroles": {
      if (!adminCheck(guildMember, interaction)) break;
      const roles = guild.roles.cache.filter(r => r.id !== guild.id).sort((a, b) => b.position - a.position);
      const list = roles.map(r => `• ${r.name} — ${r.members.size} members`).join("\n") || "No roles.";
      const embed = new EmbedBuilder().setColor(0x9b59b6).setTitle(`🏷️ Roles (${roles.size})`).setDescription(list.slice(0, 2048));
      await interaction.reply({ embeds: [embed] });
      break;
    }

    case "listchannels": {
      if (!adminCheck(guildMember, interaction)) break;
      const channels = guild.channels.cache;
      const list = channels.map(c => `• #${c.name} (${c.type})`).join("\n");
      const embed = new EmbedBuilder().setColor(0x1abc9c).setTitle(`📋 Channels (${channels.size})`).setDescription(list.slice(0, 2048));
      await interaction.reply({ embeds: [embed] });
      break;
    }

    case "listmembers": {
      if (!adminCheck(guildMember, interaction)) break;
      const members = guild.members.cache;
      const list = members.map(m => `• **${m.user.username}** (${m.id})`).join("\n");
      const embed = new EmbedBuilder().setColor(0x3498db).setTitle(`👥 Members (${members.size})`).setDescription(list.slice(0, 2048));
      await interaction.reply({ embeds: [embed] });
      break;
    }

    case "warnlist": {
      if (!adminCheck(guildMember, interaction)) break;
      const all = getAllWarnings(guild.id);
      if (all.size === 0) { await interaction.reply({ embeds: [infoEmbed("📋 Warnings", "No warnings recorded.")] }); break; }
      let desc = "";
      for (const [userId, warns] of all.entries()) {
        desc += `• <@${userId}> — **${warns.length}** warning(s)\n`;
      }
      await interaction.reply({ embeds: [infoEmbed("📋 All Warnings", desc.slice(0, 2048))] });
      break;
    }

    // ── Moderation ─────────────────────────────────────────────────────────
    case "ban": {
      if (!adminCheck(guildMember, interaction)) break;
      const target = interaction.options.getMember("user") as GuildMember;
      const reason = interaction.options.getString("reason") ?? "No reason provided";
      if (!target) { await interaction.reply({ embeds: [errorEmbed("User not found.")], ephemeral: true }); break; }
      try {
        await target.ban({ reason });
        await interaction.reply({ embeds: [successEmbed("Banned", `**${target.user.username}** has been banned.\nReason: ${reason}`)] });
        await sendLog(guild, new EmbedBuilder().setColor(0xe74c3c).setTitle("🔨 User Banned").addFields({ name: "User", value: `${target.user.username} (${target.id})` }, { name: "Reason", value: reason }, { name: "Moderator", value: interaction.user.username }).setTimestamp());
      } catch { await interaction.reply({ embeds: [errorEmbed("Failed to ban user. Check my permissions and role position.")], ephemeral: true }); }
      break;
    }

    case "unban": {
      if (!adminCheck(guildMember, interaction)) break;
      const userId = interaction.options.getString("userid", true);
      const reason = interaction.options.getString("reason") ?? "No reason";
      try {
        await guild.members.unban(userId, reason);
        await interaction.reply({ embeds: [successEmbed("Unbanned", `User **${userId}** has been unbanned.`)] });
        await sendLog(guild, new EmbedBuilder().setColor(0x2ecc71).setTitle("✅ User Unbanned").addFields({ name: "User ID", value: userId }, { name: "Moderator", value: interaction.user.username }).setTimestamp());
      } catch { await interaction.reply({ embeds: [errorEmbed("Could not unban. Make sure the ID is correct.")], ephemeral: true }); }
      break;
    }

    case "kick": {
      if (!adminCheck(guildMember, interaction)) break;
      const target = interaction.options.getMember("user") as GuildMember;
      const reason = interaction.options.getString("reason") ?? "No reason provided";
      if (!target) { await interaction.reply({ embeds: [errorEmbed("User not found.")], ephemeral: true }); break; }
      try {
        await target.kick(reason);
        await interaction.reply({ embeds: [successEmbed("Kicked", `**${target.user.username}** has been kicked.\nReason: ${reason}`)] });
        await sendLog(guild, new EmbedBuilder().setColor(0xe67e22).setTitle("👢 User Kicked").addFields({ name: "User", value: `${target.user.username} (${target.id})` }, { name: "Reason", value: reason }, { name: "Moderator", value: interaction.user.username }).setTimestamp());
      } catch { await interaction.reply({ embeds: [errorEmbed("Failed to kick user.")], ephemeral: true }); }
      break;
    }

    case "mute": {
      if (!adminCheck(guildMember, interaction)) break;
      const target = interaction.options.getMember("user") as GuildMember;
      const durationStr = interaction.options.getString("duration", true);
      const reason = interaction.options.getString("reason") ?? "No reason";
      const ms = parseDuration(durationStr);
      if (!ms) { await interaction.reply({ embeds: [errorEmbed("Invalid duration. Use e.g. `10m`, `2h`, `1d`.")], ephemeral: true }); break; }
      if (!target) { await interaction.reply({ embeds: [errorEmbed("User not found.")], ephemeral: true }); break; }
      try {
        await target.timeout(ms, reason);
        await interaction.reply({ embeds: [successEmbed("Muted", `**${target.user.username}** muted for **${durationStr}**.\nReason: ${reason}`)] });
        await sendLog(guild, new EmbedBuilder().setColor(0xf39c12).setTitle("🔇 User Muted").addFields({ name: "User", value: `${target.user.username} (${target.id})` }, { name: "Duration", value: durationStr }, { name: "Reason", value: reason }, { name: "Moderator", value: interaction.user.username }).setTimestamp());
      } catch { await interaction.reply({ embeds: [errorEmbed("Failed to mute user.")], ephemeral: true }); }
      break;
    }

    case "unmute": {
      if (!adminCheck(guildMember, interaction)) break;
      const target = interaction.options.getMember("user") as GuildMember;
      if (!target) { await interaction.reply({ embeds: [errorEmbed("User not found.")], ephemeral: true }); break; }
      try {
        await target.timeout(null);
        await interaction.reply({ embeds: [successEmbed("Unmuted", `**${target.user.username}** has been unmuted.`)] });
        await sendLog(guild, new EmbedBuilder().setColor(0x2ecc71).setTitle("🔊 User Unmuted").addFields({ name: "User", value: `${target.user.username} (${target.id})` }, { name: "Moderator", value: interaction.user.username }).setTimestamp());
      } catch { await interaction.reply({ embeds: [errorEmbed("Failed to unmute user.")], ephemeral: true }); }
      break;
    }

    case "warn": {
      if (!adminCheck(guildMember, interaction)) break;
      const target = interaction.options.getUser("user", true);
      const reason = interaction.options.getString("reason", true);
      addWarning(guild.id, target.id, { userId: target.id, moderatorId: interaction.user.id, reason, timestamp: Date.now() });
      const total = getWarnings(guild.id, target.id).length;
      await interaction.reply({ embeds: [successEmbed("Warning Issued", `**${target.username}** has been warned.\nReason: ${reason}\nTotal warnings: **${total}**`)] });
      try { await target.send({ embeds: [new EmbedBuilder().setColor(0xf39c12).setTitle("⚠️ You have been warned").setDescription(`**Server:** ${guild.name}\n**Reason:** ${reason}\n**Total warnings:** ${total}`)] }); } catch { }
      await sendLog(guild, new EmbedBuilder().setColor(0xf39c12).setTitle("⚠️ Warning Issued").addFields({ name: "User", value: `${target.username} (${target.id})` }, { name: "Reason", value: reason }, { name: "Total Warns", value: String(total) }, { name: "Moderator", value: interaction.user.username }).setTimestamp());
      break;
    }

    case "warnings": {
      if (!adminCheck(guildMember, interaction)) break;
      const target = interaction.options.getUser("user", true);
      const warns = getWarnings(guild.id, target.id);
      if (!warns.length) { await interaction.reply({ embeds: [infoEmbed("📋 Warnings", `**${target.username}** has no warnings.`)] }); break; }
      const list = warns.map((w, i) => `**${i + 1}.** ${w.reason} — by <@${w.moderatorId}> <t:${Math.floor(w.timestamp / 1000)}:R>`).join("\n");
      await interaction.reply({ embeds: [infoEmbed(`⚠️ Warnings — ${target.username}`, list.slice(0, 2048))] });
      break;
    }

    case "clearwarn": {
      if (!adminCheck(guildMember, interaction)) break;
      const target = interaction.options.getUser("user", true);
      clearWarnings(guild.id, target.id);
      await interaction.reply({ embeds: [successEmbed("Warnings Cleared", `All warnings for **${target.username}** have been cleared.`)] });
      break;
    }

    case "purge": {
      if (!adminCheck(guildMember, interaction)) break;
      const amount = interaction.options.getInteger("amount", true);
      const filterUser = interaction.options.getUser("user");
      const ch = interaction.channel as TextChannel;
      await interaction.deferReply({ ephemeral: true });
      const msgs = await ch.messages.fetch({ limit: 100 });
      let toDelete = msgs.filter(m => !m.pinned && Date.now() - m.createdTimestamp < 14 * 24 * 60 * 60 * 1000);
      if (filterUser) toDelete = toDelete.filter(m => m.author.id === filterUser.id);
      toDelete = toDelete.first(amount) as typeof toDelete;
      await ch.bulkDelete(toDelete, true);
      await interaction.editReply({ embeds: [successEmbed("Purged", `Deleted **${toDelete.size}** messages.`)] });
      break;
    }

    case "slowmode": {
      if (!adminCheck(guildMember, interaction)) break;
      const seconds = interaction.options.getInteger("seconds", true);
      const ch = (interaction.options.getChannel("channel") ?? interaction.channel) as TextChannel;
      await ch.setRateLimitPerUser(seconds);
      await interaction.reply({ embeds: [successEmbed("Slowmode Set", `Slowmode in <#${ch.id}> set to **${seconds}s**.`)] });
      break;
    }

    case "lock": {
      if (!adminCheck(guildMember, interaction)) break;
      const ch = (interaction.options.getChannel("channel") ?? interaction.channel) as TextChannel;
      await ch.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: false });
      await interaction.reply({ embeds: [successEmbed("Locked 🔒", `<#${ch.id}> has been locked.`)] });
      break;
    }

    case "unlock": {
      if (!adminCheck(guildMember, interaction)) break;
      const ch = (interaction.options.getChannel("channel") ?? interaction.channel) as TextChannel;
      await ch.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: null });
      await interaction.reply({ embeds: [successEmbed("Unlocked 🔓", `<#${ch.id}> has been unlocked.`)] });
      break;
    }

    case "lockdown": {
      if (!adminCheck(guildMember, interaction)) break;
      await interaction.deferReply();
      const textChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildText) as Map<string, TextChannel>;
      for (const [, ch] of textChannels) {
        await ch.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: false }).catch(() => {});
      }
      await interaction.editReply({ embeds: [successEmbed("🔒 Server Lockdown", "All channels have been locked.")] });
      await sendLog(guild, new EmbedBuilder().setColor(0xe74c3c).setTitle("🔒 Server Lockdown").addFields({ name: "Moderator", value: interaction.user.username }).setTimestamp());
      break;
    }

    case "unlockdown": {
      if (!adminCheck(guildMember, interaction)) break;
      await interaction.deferReply();
      const textChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildText) as Map<string, TextChannel>;
      for (const [, ch] of textChannels) {
        await ch.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: null }).catch(() => {});
      }
      await interaction.editReply({ embeds: [successEmbed("🔓 Lockdown Lifted", "All channels have been unlocked.")] });
      break;
    }

    case "nick": {
      if (!adminCheck(guildMember, interaction)) break;
      const target = interaction.options.getMember("user") as GuildMember;
      const nickname = interaction.options.getString("nickname") ?? null;
      if (!target) { await interaction.reply({ embeds: [errorEmbed("User not found.")], ephemeral: true }); break; }
      try {
        await target.setNickname(nickname);
        await interaction.reply({ embeds: [successEmbed("Nickname Changed", `**${target.user.username}**'s nickname set to: ${nickname ?? "*(reset)*"}`)] });
      } catch { await interaction.reply({ embeds: [errorEmbed("Failed to change nickname.")], ephemeral: true }); }
      break;
    }

    case "softban": {
      if (!adminCheck(guildMember, interaction)) break;
      const target = interaction.options.getMember("user") as GuildMember;
      const reason = interaction.options.getString("reason") ?? "Softban";
      if (!target) { await interaction.reply({ embeds: [errorEmbed("User not found.")], ephemeral: true }); break; }
      try {
        await target.ban({ deleteMessageSeconds: 7 * 24 * 60 * 60, reason });
        await guild.members.unban(target.id, "Softban");
        await interaction.reply({ embeds: [successEmbed("Softbanned", `**${target.user.username}** was softbanned (messages deleted, not permanently banned).`)] });
      } catch { await interaction.reply({ embeds: [errorEmbed("Failed to softban user.")], ephemeral: true }); }
      break;
    }

    case "tempban": {
      if (!adminCheck(guildMember, interaction)) break;
      const target = interaction.options.getMember("user") as GuildMember;
      const durationStr = interaction.options.getString("duration", true);
      const reason = interaction.options.getString("reason") ?? "Tempban";
      const ms = parseDuration(durationStr);
      if (!ms) { await interaction.reply({ embeds: [errorEmbed("Invalid duration. Use e.g. `1h`, `1d`.")], ephemeral: true }); break; }
      if (!target) { await interaction.reply({ embeds: [errorEmbed("User not found.")], ephemeral: true }); break; }
      try {
        const userId = target.id;
        await target.ban({ reason });
        await interaction.reply({ embeds: [successEmbed("Tempbanned", `**${target.user.username}** banned for **${durationStr}**.`)] });
        setTimeout(async () => {
          await guild.members.unban(userId, "Tempban expired").catch(() => {});
        }, ms);
      } catch { await interaction.reply({ embeds: [errorEmbed("Failed to tempban user.")], ephemeral: true }); }
      break;
    }

    case "massban": {
      if (!adminCheck(guildMember, interaction)) break;
      const ids = interaction.options.getString("userids", true).split(/\s+/).filter(Boolean);
      const reason = interaction.options.getString("reason") ?? "Massban";
      await interaction.deferReply();
      let success = 0, fail = 0;
      for (const id of ids) {
        try { await guild.members.ban(id, { reason }); success++; } catch { fail++; }
      }
      await interaction.editReply({ embeds: [successEmbed("Massban Complete", `Banned: **${success}** | Failed: **${fail}**`)] });
      break;
    }

    case "hackban": {
      if (!adminCheck(guildMember, interaction)) break;
      const userId = interaction.options.getString("userid", true);
      const reason = interaction.options.getString("reason") ?? "No reason provided";
      try {
        await guild.members.ban(userId, { reason });
        await interaction.reply({ embeds: [successEmbed("Hackbanned", `User \`${userId}\` has been banned.\nReason: ${reason}`)] });
        await sendLog(guild, new EmbedBuilder().setColor(0xe74c3c).setTitle("🔨 Hackban").addFields({ name: "User ID", value: userId }, { name: "Reason", value: reason }, { name: "Moderator", value: interaction.user.username }).setTimestamp());
      } catch { await interaction.reply({ embeds: [errorEmbed("Failed to ban. Check the user ID and my permissions.")], ephemeral: true }); }
      break;
    }

    case "massmute": {
      if (!adminCheck(guildMember, interaction)) break;
      const ids = interaction.options.getString("userids", true).split(/\s+/).filter(Boolean);
      const durationStr = interaction.options.getString("duration", true);
      const reason = interaction.options.getString("reason") ?? "Massmute";
      const ms = parseDuration(durationStr);
      if (!ms) { await interaction.reply({ embeds: [errorEmbed("Invalid duration.")], ephemeral: true }); break; }
      await interaction.deferReply();
      let ok = 0, fail = 0;
      for (const id of ids) {
        const m = guild.members.cache.get(id);
        if (m) { try { await m.timeout(ms, reason); ok++; } catch { fail++; } } else { fail++; }
      }
      await interaction.editReply({ embeds: [successEmbed("Mass Muted", `Muted: **${ok}** | Failed: **${fail}**`)] });
      break;
    }

    case "massunmute": {
      if (!adminCheck(guildMember, interaction)) break;
      const ids = interaction.options.getString("userids", true).split(/\s+/).filter(Boolean);
      await interaction.deferReply();
      let ok = 0, fail = 0;
      for (const id of ids) {
        const m = guild.members.cache.get(id);
        if (m) { try { await m.timeout(null); ok++; } catch { fail++; } } else { fail++; }
      }
      await interaction.editReply({ embeds: [successEmbed("Mass Unmuted", `Unmuted: **${ok}** | Failed: **${fail}**`)] });
      break;
    }

    case "purgebot": {
      if (!adminCheck(guildMember, interaction)) break;
      const amount = interaction.options.getInteger("amount", true);
      const ch = interaction.channel as TextChannel;
      const messages = await ch.messages.fetch({ limit: amount });
      const botMsgs = messages.filter(m => m.author.bot);
      await ch.bulkDelete(botMsgs, true).catch(() => {});
      await interaction.reply({ embeds: [successEmbed("Purged Bots", `Deleted **${botMsgs.size}** bot message(s).`)], ephemeral: true });
      break;
    }

    case "purgeuser": {
      if (!adminCheck(guildMember, interaction)) break;
      const target = interaction.options.getUser("user", true);
      const amount = interaction.options.getInteger("amount", true);
      const ch = interaction.channel as TextChannel;
      const messages = await ch.messages.fetch({ limit: amount });
      const userMsgs = messages.filter(m => m.author.id === target.id);
      await ch.bulkDelete(userMsgs, true).catch(() => {});
      await interaction.reply({ embeds: [successEmbed("Purged User", `Deleted **${userMsgs.size}** message(s) from **${target.username}**.`)], ephemeral: true });
      break;
    }

    case "nuke": {
      if (!adminCheck(guildMember, interaction)) break;
      const ch = interaction.channel as TextChannel;
      const pos = ch.position;
      const parent = ch.parentId;
      const topic = ch.topic ?? undefined;
      const nuked = await ch.clone({ name: ch.name, position: pos, parent: parent ?? undefined, topic });
      await ch.delete();
      await nuked.send({ embeds: [successEmbed("💥 Channel Nuked", "This channel has been nuked and recreated.")] });
      break;
    }

    case "cleannick": {
      if (!adminCheck(guildMember, interaction)) break;
      const target = interaction.options.getMember("user") as GuildMember;
      if (!target) { await interaction.reply({ embeds: [errorEmbed("User not found.")], ephemeral: true }); break; }
      await target.setNickname(null);
      await interaction.reply({ embeds: [successEmbed("Nickname Reset", `**${target.user.username}**'s nickname has been removed.`)] });
      break;
    }

    case "dehoist": {
      if (!adminCheck(guildMember, interaction)) break;
      const target = interaction.options.getMember("user") as GuildMember;
      if (!target) { await interaction.reply({ embeds: [errorEmbed("User not found.")], ephemeral: true }); break; }
      const nick = target.displayName;
      const cleaned = nick.replace(/^[^a-zA-Z0-9]+/, "") || "moderated";
      await target.setNickname(cleaned);
      await interaction.reply({ embeds: [successEmbed("Dehoisted", `Nickname changed to **${cleaned}**.`)] });
      break;
    }

    case "strip": {
      if (!adminCheck(guildMember, interaction)) break;
      const target = interaction.options.getMember("user") as GuildMember;
      if (!target) { await interaction.reply({ embeds: [errorEmbed("User not found.")], ephemeral: true }); break; }
      const roles = target.roles.cache.filter(r => r.id !== guild.id && r.editable);
      await target.roles.remove(roles);
      await interaction.reply({ embeds: [successEmbed("Roles Stripped", `Removed **${roles.size}** role(s) from **${target.user.username}**.`)] });
      break;
    }

    case "note": {
      if (!adminCheck(guildMember, interaction)) break;
      const target = interaction.options.getUser("user", true);
      const text = interaction.options.getString("text", true);
      addNote(guild.id, target.id, { authorId: interaction.user.id, content: text, timestamp: Date.now() });
      await interaction.reply({ embeds: [successEmbed("Note Added", `Note saved for **${target.username}**.`)], ephemeral: true });
      break;
    }

    case "notes": {
      if (!adminCheck(guildMember, interaction)) break;
      const target = interaction.options.getUser("user", true);
      const userNotes = getNotes(guild.id, target.id);
      if (!userNotes.length) { await interaction.reply({ embeds: [infoEmbed("📋 Notes", `No notes for **${target.username}**.`)] }); break; }
      const desc = userNotes.map((n, i) => `**${i + 1}.** <t:${Math.floor(n.timestamp / 1000)}:R> by <@${n.authorId}>\n↳ ${n.content}`).join("\n\n");
      await interaction.reply({ embeds: [infoEmbed(`📋 Notes — ${target.username}`, desc.slice(0, 2048))] });
      break;
    }

    case "clearnotes": {
      if (!adminCheck(guildMember, interaction)) break;
      const target = interaction.options.getUser("user", true);
      clearNotes(guild.id, target.id);
      await interaction.reply({ embeds: [successEmbed("Notes Cleared", `All notes for **${target.username}** deleted.`)] });
      break;
    }

    case "history": {
      if (!adminCheck(guildMember, interaction)) break;
      const target = interaction.options.getUser("user", true);
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
      await interaction.reply({ embeds: [infoEmbed(`📋 History — ${target.username}`, desc.slice(0, 2048))] });
      break;
    }

    // ── Voice ──────────────────────────────────────────────────────────────
    case "move": {
      if (!adminCheck(guildMember, interaction)) break;
      const target = interaction.options.getMember("user") as GuildMember;
      const channel = interaction.options.getChannel("channel") as VoiceChannel;
      if (!target?.voice.channel) { await interaction.reply({ embeds: [errorEmbed("User is not in a voice channel.")], ephemeral: true }); break; }
      try {
        await target.voice.setChannel(channel);
        await interaction.reply({ embeds: [successEmbed("Moved", `**${target.user.username}** moved to **${channel.name}**.`)] });
      } catch { await interaction.reply({ embeds: [errorEmbed("Failed to move user.")], ephemeral: true }); }
      break;
    }

    case "vckick": {
      if (!adminCheck(guildMember, interaction)) break;
      const target = interaction.options.getMember("user") as GuildMember;
      if (!target?.voice.channel) { await interaction.reply({ embeds: [errorEmbed("User is not in a voice channel.")], ephemeral: true }); break; }
      await target.voice.disconnect();
      await interaction.reply({ embeds: [successEmbed("VC Kicked", `**${target.user.username}** was removed from the voice channel.`)] });
      break;
    }

    case "vcmute": {
      if (!adminCheck(guildMember, interaction)) break;
      const target = interaction.options.getMember("user") as GuildMember;
      await target.voice.setMute(true);
      await interaction.reply({ embeds: [successEmbed("VC Muted", `**${target.user.username}** has been server-muted.`)] });
      break;
    }

    case "vcunmute": {
      if (!adminCheck(guildMember, interaction)) break;
      const target = interaction.options.getMember("user") as GuildMember;
      await target.voice.setMute(false);
      await interaction.reply({ embeds: [successEmbed("VC Unmuted", `**${target.user.username}** has been server-unmuted.`)] });
      break;
    }

    case "deafen": {
      if (!adminCheck(guildMember, interaction)) break;
      const target = interaction.options.getMember("user") as GuildMember;
      await target.voice.setDeaf(true);
      await interaction.reply({ embeds: [successEmbed("Deafened", `**${target.user.username}** has been server-deafened.`)] });
      break;
    }

    case "undeafen": {
      if (!adminCheck(guildMember, interaction)) break;
      const target = interaction.options.getMember("user") as GuildMember;
      await target.voice.setDeaf(false);
      await interaction.reply({ embeds: [successEmbed("Undeafened", `**${target.user.username}** has been server-undeafened.`)] });
      break;
    }

    case "massdeafen": {
      if (!adminCheck(guildMember, interaction)) break;
      const ids = interaction.options.getString("userids", true).split(/\s+/);
      let ok = 0;
      for (const id of ids) {
        const m = guild.members.cache.get(id);
        if (m?.voice.channel) { await m.voice.setDeaf(true).catch(() => {}); ok++; }
      }
      await interaction.reply({ embeds: [successEmbed("Mass Deafened", `Deafened **${ok}** user(s) in voice.`)] });
      break;
    }

    case "massundeafen": {
      if (!adminCheck(guildMember, interaction)) break;
      const ids = interaction.options.getString("userids", true).split(/\s+/);
      let ok = 0;
      for (const id of ids) {
        const m = guild.members.cache.get(id);
        if (m?.voice.channel) { await m.voice.setDeaf(false).catch(() => {}); ok++; }
      }
      await interaction.reply({ embeds: [successEmbed("Mass Undeafened", `Undeafened **${ok}** user(s) in voice.`)] });
      break;
    }

    case "vcban": {
      if (!adminCheck(guildMember, interaction)) break;
      const target = interaction.options.getMember("user") as GuildMember;
      if (!target) { await interaction.reply({ embeds: [errorEmbed("User not found.")], ephemeral: true }); break; }
      addVcBan(guild.id, target.id);
      if (target.voice.channel) await target.voice.disconnect().catch(() => {});
      await interaction.reply({ embeds: [successEmbed("VC Banned", `**${target.user.username}** is banned from voice channels.`)] });
      break;
    }

    case "unvcban": {
      if (!adminCheck(guildMember, interaction)) break;
      const target = interaction.options.getMember("user") as GuildMember;
      if (!target) { await interaction.reply({ embeds: [errorEmbed("User not found.")], ephemeral: true }); break; }
      removeVcBan(guild.id, target.id);
      await interaction.reply({ embeds: [successEmbed("VC Unbanned", `**${target.user.username}** can join voice channels again.`)] });
      break;
    }

    // ── Roles ──────────────────────────────────────────────────────────────
    case "addrole": {
      if (!adminCheck(guildMember, interaction)) break;
      const target = interaction.options.getMember("user") as GuildMember;
      const role = interaction.options.getRole("role", true);
      await target.roles.add(role.id);
      await interaction.reply({ embeds: [successEmbed("Role Added", `<@&${role.id}> added to **${target.user.username}**.`)] });
      break;
    }

    case "removerole": {
      if (!adminCheck(guildMember, interaction)) break;
      const target = interaction.options.getMember("user") as GuildMember;
      const role = interaction.options.getRole("role", true);
      await target.roles.remove(role.id);
      await interaction.reply({ embeds: [successEmbed("Role Removed", `<@&${role.id}> removed from **${target.user.username}**.`)] });
      break;
    }

    case "createrole": {
      if (!adminCheck(guildMember, interaction)) break;
      const name = interaction.options.getString("name", true);
      const color = (interaction.options.getString("color") ?? "#99aab5") as `#${string}`;
      const role = await guild.roles.create({ name, color });
      await interaction.reply({ embeds: [successEmbed("Role Created", `Role <@&${role.id}> created.`)] });
      break;
    }

    case "deleterole": {
      if (!adminCheck(guildMember, interaction)) break;
      const role = interaction.options.getRole("role", true);
      await guild.roles.delete(role.id);
      await interaction.reply({ embeds: [successEmbed("Role Deleted", `Role **${role.name}** has been deleted.`)] });
      break;
    }

    case "setcolor": {
      if (!adminCheck(guildMember, interaction)) break;
      const role = interaction.options.getRole("role", true);
      const color = (interaction.options.getString("color", true)) as `#${string}`;
      await guild.roles.edit(role.id, { color });
      await interaction.reply({ embeds: [successEmbed("Color Updated", `Role **${role.name}** color set to \`${color}\`.`)] });
      break;
    }

    case "mentionable": {
      if (!adminCheck(guildMember, interaction)) break;
      const role = interaction.options.getRole("role", true);
      const guildRole = guild.roles.cache.get(role.id);
      if (!guildRole) { await interaction.reply({ embeds: [errorEmbed("Role not found.")], ephemeral: true }); break; }
      await guildRole.setMentionable(!guildRole.mentionable);
      await interaction.reply({ embeds: [successEmbed("Mentionable Toggled", `**${guildRole.name}** is now **${guildRole.mentionable ? "not " : ""}mentionable**.`)] });
      break;
    }

    case "roledump": {
      if (!adminCheck(guildMember, interaction)) break;
      const role = interaction.options.getRole("role", true);
      const guildRole = guild.roles.cache.get(role.id);
      if (!guildRole) { await interaction.reply({ embeds: [errorEmbed("Role not found.")], ephemeral: true }); break; }
      const members = guildRole.members.map(m => `• **${m.user.username}** (${m.id})`).join("\n") || "No members with this role.";
      await interaction.reply({ embeds: [infoEmbed(`🏷️ Members with @${guildRole.name} (${guildRole.members.size})`, members.slice(0, 2048))] });
      break;
    }

    // ── Channels ───────────────────────────────────────────────────────────
    case "createchannel": {
      if (!adminCheck(guildMember, interaction)) break;
      const name = interaction.options.getString("name", true);
      const type = interaction.options.getString("type") ?? "text";
      const ch = await guild.channels.create({ name, type: type === "voice" ? ChannelType.GuildVoice : ChannelType.GuildText });
      await interaction.reply({ embeds: [successEmbed("Channel Created", `<#${ch.id}> has been created.`)] });
      break;
    }

    case "deletechannel": {
      if (!adminCheck(guildMember, interaction)) break;
      const ch = interaction.options.getChannel("channel", true);
      const chName = ch.name;
      await guild.channels.delete(ch.id);
      await interaction.reply({ embeds: [successEmbed("Channel Deleted", `Channel **#${chName}** has been deleted.`)] });
      break;
    }

    case "invites": {
      if (!adminCheck(guildMember, interaction)) break;
      const invites = await guild.invites.fetch();
      if (!invites.size) { await interaction.reply({ embeds: [infoEmbed("📋 Invites", "No active invite links.")] }); break; }
      const list = invites.map(i => `• \`${i.code}\` — by **${i.inviter?.username ?? "Unknown"}** — ${i.uses ?? 0} uses`).join("\n");
      await interaction.reply({ embeds: [infoEmbed(`📋 Server Invites (${invites.size})`, list.slice(0, 2048))] });
      break;
    }

    case "clearinvites": {
      if (!adminCheck(guildMember, interaction)) break;
      const invites = await guild.invites.fetch();
      for (const invite of invites.values()) await invite.delete().catch(() => {});
      await interaction.reply({ embeds: [successEmbed("Invites Cleared", `Deleted **${invites.size}** invite(s).`)] });
      break;
    }

    case "createinvite": {
      if (!adminCheck(guildMember, interaction)) break;
      const ch = (interaction.options.getChannel("channel") ?? interaction.channel) as TextChannel;
      const invite = await ch.createInvite({ maxAge: 0, maxUses: 0 });
      await interaction.reply({ embeds: [successEmbed("Invite Created", `Here is your invite link:\nhttps://discord.gg/${invite.code}`)], ephemeral: true });
      break;
    }

    // ── Communication ──────────────────────────────────────────────────────
    case "say": {
      if (!adminCheck(guildMember, interaction)) break;
      const message = interaction.options.getString("message", true);
      const ch = (interaction.options.getChannel("channel") ?? interaction.channel) as TextChannel;
      await ch.send(message);
      await interaction.reply({ embeds: [successEmbed("Sent", `Message sent in <#${ch.id}>.`)], ephemeral: true });
      break;
    }

    case "announce": {
      if (!adminCheck(guildMember, interaction)) break;
      const title = interaction.options.getString("title", true);
      const msg = interaction.options.getString("message", true);
      const embed = new EmbedBuilder().setColor(0xe74c3c).setTitle(`📢 ${title}`).setDescription(msg).setTimestamp();
      await (interaction.channel as TextChannel).send({ embeds: [embed] });
      await interaction.reply({ embeds: [successEmbed("Announced", "Announcement posted.")], ephemeral: true });
      break;
    }

    case "dm": {
      if (!adminCheck(guildMember, interaction)) break;
      const target = interaction.options.getUser("user", true);
      const message = interaction.options.getString("message", true);
      try {
        await target.send(message);
        await interaction.reply({ embeds: [successEmbed("DM Sent", `Message sent to **${target.username}**.`)], ephemeral: true });
      } catch { await interaction.reply({ embeds: [errorEmbed("Could not send DM. The user may have DMs disabled.")], ephemeral: true }); }
      break;
    }

    case "chat": {
      if (!adminCheck(guildMember, interaction)) break;
      const target = interaction.options.getUser("user", true);
      const firstMsg = interaction.options.getString("message");
      const config = getGuildConfig(guild.id);
      if (!config.logChannelId) { await interaction.reply({ embeds: [errorEmbed("Set a log channel first with `#setlog #channel`.")], ephemeral: true }); break; }
      dmRelaySessions.set(target.id, { guildId: guild.id, relayChannelId: config.logChannelId });
      await interaction.reply({ embeds: [new EmbedBuilder().setColor(0x9b59b6).setTitle(`💬 DM Relay — ${target.username}`).setDescription(`Relay opened! Any DMs the user sends to the bot will appear in <#${config.logChannelId}>.\nTo reply: \`#reply @${target.username} <message>\``).setTimestamp()], ephemeral: true });
      try {
        if (firstMsg) await target.send(firstMsg);
        const logCh = guild.channels.cache.get(config.logChannelId) as TextChannel;
        if (logCh) {
          await logCh.send({ embeds: [new EmbedBuilder().setColor(0x9b59b6).setTitle(`💬 Chat Relay Opened — ${target.username}`).setDescription(`Staff opened a relay with <@${target.id}>\n\nTo reply: \`#reply @${target.username} <message>\``).setTimestamp()] });
          if (firstMsg) await logCh.send({ embeds: [new EmbedBuilder().setColor(0x3498db).setTitle("📤 Sent to User").setDescription(firstMsg).setTimestamp()] });
        }
      } catch { await interaction.followUp({ content: "⚠️ Could not DM the user (they may have DMs disabled).", ephemeral: true }); }
      break;
    }

    case "reply": {
      if (!adminCheck(guildMember, interaction)) break;
      const target = interaction.options.getUser("user", true);
      const text = interaction.options.getString("message", true);
      try {
        await target.send(text);
        await interaction.reply({ embeds: [successEmbed("Reply Sent", `Message sent to **${target.username}**.`)], ephemeral: true });
      } catch { await interaction.reply({ embeds: [errorEmbed("Could not send message. User may have DMs disabled.")], ephemeral: true }); }
      break;
    }

    // ── Setup ──────────────────────────────────────────────────────────────
    case "setlog": {
      if (!adminCheck(guildMember, interaction)) break;
      const ch = interaction.options.getChannel("channel", true);
      setGuildConfig(guild.id, { logChannelId: ch.id });
      await interaction.reply({ embeds: [successEmbed("Log Channel Set", `Mod logs will be sent to <#${ch.id}>.`)] });
      break;
    }

    case "setwelcome": {
      if (!adminCheck(guildMember, interaction)) break;
      const ch = interaction.options.getChannel("channel", true);
      setGuildConfig(guild.id, { welcomeChannelId: ch.id });
      await interaction.reply({ embeds: [successEmbed("Welcome Channel Set", `Welcome messages will be sent to <#${ch.id}>.`)] });
      break;
    }

    case "setverify": {
      if (!adminCheck(guildMember, interaction)) break;
      const ch = interaction.options.getChannel("channel", true);
      const role = interaction.options.getRole("role", true);
      setGuildConfig(guild.id, { verifyChannelId: ch.id, verifyRoleId: role.id });
      await interaction.reply({ embeds: [successEmbed("Verification Set", `Verify channel: <#${ch.id}>\nVerify role: <@&${role.id}>\n\nNow run \`#setupverify\` or \`/setupverify\` to post the embed!`)] });
      break;
    }

    case "setupverify": {
      if (!adminCheck(guildMember, interaction)) break;
      const result = await sendVerificationEmbed(guild);
      if (result.success) {
        await interaction.reply({ embeds: [successEmbed("Verification Embed Posted", result.message)], ephemeral: true });
      } else {
        await interaction.reply({ embeds: [errorEmbed(result.message)], ephemeral: true });
      }
      break;
    }

    default:
      await interaction.reply({ content: "Unknown command.", ephemeral: true });
  }
}
