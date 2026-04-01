const {
  EmbedBuilder
} = require("discord.js");

const {
  setGuildConfig,
  getGuildConfig,
  addWarning,
  getWarnings,
  addNote,
  getNotes,
  addVcBan
} = require("../managers/storage");

const { sendVerifyPanel } = require("./verification");
const { buildHelpEmbed, buildHelpRow } = require("./helpPages");
const { sendPlainDM } = require("../managers/dmRelayManager");

function parseDuration(input) {
  const match = /^(\d+)([smhd])$/i.exec(input);
  if (!match) return null;

  const value = Number(match[1]);
  const unit = match[2].toLowerCase();

  const map = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000
  };

  return value * map[unit];
}

async function handlePrefixCommand(client, message) {
  const prefix = client.prefix;
  if (!message.content.startsWith(prefix)) return;
  if (!message.guild) return;

  const args = message.content.slice(prefix.length).trim().split(/\s+/);
  const command = (args.shift() || "").toLowerCase();

  if (!command) return;

  const isAdmin = message.member.permissions.has("Administrator");
  const isMod =
    message.member.permissions.has("ModerateMembers") ||
    message.member.permissions.has("ManageMessages") ||
    isAdmin;

  if (command === "help") {
    return message.reply({
      embeds: [buildHelpEmbed(0)],
      components: [buildHelpRow(0, message.author.id)]
    });
  }

  if (command === "ping") {
    return message.reply(`🏓 Pong! ${client.ws.ping}ms`);
  }

  if (command === "setlog") {
    if (!isAdmin) return message.reply("❌ Admin only.");
    const channel = message.mentions.channels.first();
    if (!channel) return message.reply("Usage: `#setlog #channel`");

    setGuildConfig(message.guild.id, "logChannelId", channel.id);
    return message.reply(`✅ Log channel set to ${channel}`);
  }

  if (command === "setwelcome") {
    if (!isAdmin) return message.reply("❌ Admin only.");
    const channel = message.mentions.channels.first();
    if (!channel) return message.reply("Usage: `#setwelcome #channel`");

    setGuildConfig(message.guild.id, "welcomeChannelId", channel.id);
    return message.reply(`✅ Welcome channel set to ${channel}`);
  }

  if (command === "setverify") {
    if (!isAdmin) return message.reply("❌ Admin only.");
    const channel = message.mentions.channels.first();
    const role = message.mentions.roles.first();

    if (!channel || !role) {
      return message.reply("Usage: `#setverify #channel @role`");
    }

    setGuildConfig(message.guild.id, "verifyChannelId", channel.id);
    setGuildConfig(message.guild.id, "verifyRoleId", role.id);

    return message.reply(`✅ Verify channel set to ${channel} and role set to ${role}`);
  }

  if (command === "setupverify") {
    if (!isAdmin) return message.reply("❌ Admin only.");
    const config = getGuildConfig(message.guild.id);

    if (!config.verifyChannelId) {
      return message.reply("❌ Set verify channel first using `#setverify`.");
    }

    const channel = message.guild.channels.cache.get(config.verifyChannelId);
    if (!channel || !channel.isTextBased()) {
      return message.reply("❌ Verify channel not found.");
    }

    await sendVerifyPanel(message.guild, channel);
    return message.reply("✅ Verification panel sent.");
  }

  if (command === "ban") {
    if (!message.member.permissions.has("BanMembers")) return message.reply("❌ You cannot use this.");
    const user = message.mentions.members.first();
    if (!user) return message.reply("Usage: `#ban @user [reason]`");

    const reason = args.slice(1).join(" ") || "No reason provided";
    await user.ban({ reason }).catch(() => null);
    return message.reply(`✅ Banned ${user.user.tag}`);
  }

  if (command === "kick") {
    if (!message.member.permissions.has("KickMembers")) return message.reply("❌ You cannot use this.");
    const user = message.mentions.members.first();
    if (!user) return message.reply("Usage: `#kick @user [reason]`");

    const reason = args.slice(1).join(" ") || "No reason provided";
    await user.kick(reason).catch(() => null);
    return message.reply(`✅ Kicked ${user.user.tag}`);
  }

  if (command === "mute") {
    if (!message.member.permissions.has("ModerateMembers")) return message.reply("❌ You cannot use this.");
    const user = message.mentions.members.first();
    const durationText = args[1];

    if (!user || !durationText) {
      return message.reply("Usage: `#mute @user 10m [reason]`");
    }

    const ms = parseDuration(durationText);
    if (!ms) return message.reply("❌ Invalid duration. Use like 10m, 1h, 1d");

    const reason = args.slice(2).join(" ") || "No reason provided";
    await user.timeout(ms, reason).catch(() => null);

    return message.reply(`✅ Muted ${user.user.tag} for ${durationText}`);
  }

  if (command === "unmute") {
    if (!message.member.permissions.has("ModerateMembers")) return message.reply("❌ You cannot use this.");
    const user = message.mentions.members.first();
    if (!user) return message.reply("Usage: `#unmute @user`");

    await user.timeout(null).catch(() => null);
    return message.reply(`✅ Unmuted ${user.user.tag}`);
  }

  if (command === "warn") {
    if (!isMod) return message.reply("❌ Mod only.");
    const user = message.mentions.users.first();
    if (!user) return message.reply("Usage: `#warn @user <reason>`");

    const reason = args.slice(1).join(" ");
    if (!reason) return message.reply("❌ Give a warning reason.");

    addWarning(message.guild.id, user.id, reason);
    return message.reply(`✅ Warned ${user.tag}`);
  }

  if (command === "warnings") {
    if (!isMod) return message.reply("❌ Mod only.");
    const user = message.mentions.users.first();
    if (!user) return message.reply("Usage: `#warnings @user`");

    const warnings = getWarnings(message.guild.id, user.id);
    if (!warnings.length) return message.reply("No warnings found.");

    const embed = new EmbedBuilder()
      .setColor(0xf1c40f)
      .setTitle(`Warnings for ${user.tag}`)
      .setDescription(
        warnings.map((w, i) => `**${i + 1}.** ${w.reason}\n*${w.date}*`).join("\n\n")
      );

    return message.reply({ embeds: [embed] });
  }

  if (command === "clearwarn") {
    if (!isMod) return message.reply("❌ Mod only.");
    return message.reply("⚠️ Clearwarn will be added in the next command pack.");
  }

  if (command === "purge") {
    if (!message.member.permissions.has("ManageMessages")) return message.reply("❌ You cannot use this.");
    const amount = Number(args[0]);
    if (!amount || amount < 1 || amount > 100) {
      return message.reply("Usage: `#purge <1-100>`");
    }

    await message.channel.bulkDelete(amount, true).catch(() => null);
    return;
  }

  if (command === "lock") {
    if (!message.member.permissions.has("ManageChannels")) return message.reply("❌ You cannot use this.");
    const channel = message.mentions.channels.first() || message.channel;

    await channel.permissionOverwrites.edit(message.guild.roles.everyone, {
      SendMessages: false
    });

    return message.reply(`🔒 Locked ${channel}`);
  }

  if (command === "unlock") {
    if (!message.member.permissions.has("ManageChannels")) return message.reply("❌ You cannot use this.");
    const channel = message.mentions.channels.first() || message.channel;

    await channel.permissionOverwrites.edit(message.guild.roles.everyone, {
      SendMessages: true
    });

    return message.reply(`🔓 Unlocked ${channel}`);
  }

  if (command === "say") {
    if (!message.member.permissions.has("ManageMessages")) return message.reply("❌ You cannot use this.");
    const text = args.join(" ");
    if (!text) return message.reply("Usage: `#say <message>`");

    await message.delete().catch(() => null);
    return message.channel.send(text);
  }

  if (command === "note") {
    if (!isMod) return message.reply("❌ Mod only.");
    const user = message.mentions.users.first();
    if (!user) return message.reply("Usage: `#note @user <text>`");

    const text = args.slice(1).join(" ");
    if (!text) return message.reply("❌ Give note text.");

    addNote(message.guild.id, user.id, text);
    return message.reply(`✅ Note added for ${user.tag}`);
  }

  if (command === "notes") {
    if (!isMod) return message.reply("❌ Mod only.");
    const user = message.mentions.users.first();
    if (!user) return message.reply("Usage: `#notes @user`");

    const notes = getNotes(message.guild.id, user.id);
    if (!notes.length) return message.reply("No notes found.");

    const embed = new EmbedBuilder()
      .setColor(0x3498db)
      .setTitle(`Notes for ${user.tag}`)
      .setDescription(notes.map((n, i) => `**${i + 1}.** ${n}`).join("\n"));

    return message.reply({ embeds: [embed] });
  }

  if (command === "vcban") {
    if (!isMod) return message.reply("❌ Mod only.");
    const user = message.mentions.users.first();
    if (!user) return message.reply("Usage: `#vcban @user`");

    addVcBan(message.guild.id, user.id);
    return message.reply(`✅ VC banned ${user.tag}`);
  }

  if (command === "dm") {
    if (!isMod) return message.reply("❌ Mod only.");
    const user = message.mentions.users.first();
    if (!user) return message.reply("Usage: `#dm @user <message>`");

    const text = args.slice(1).join(" ");
    if (!text) return message.reply("❌ Give a message.");

    const sent = await sendPlainDM(user, text);
    return message.reply(sent ? "✅ DM sent." : "❌ Could not send DM.");
  }

  if (command === "userinfo") {
    const user = message.mentions.users.first() || message.author;
    const member = message.guild.members.cache.get(user.id);

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(`User Info - ${user.tag}`)
      .setThumbnail(user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: "User ID", value: user.id, inline: true },
        { name: "Joined Server", value: member?.joinedAt?.toDateString() || "Unknown", inline: true },
        { name: "Created Account", value: user.createdAt.toDateString(), inline: true }
      );

    return message.reply({ embeds: [embed] });
  }

  if (command === "avatar") {
    const user = message.mentions.users.first() || message.author;
    return message.reply(user.displayAvatarURL({ size: 1024, dynamic: true }));
  }

  if (command === "serverinfo") {
    const guild = message.guild;

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(`Server Info - ${guild.name}`)
      .setThumbnail(guild.iconURL({ dynamic: true }))
      .addFields(
        { name: "Server ID", value: guild.id, inline: true },
        { name: "Members", value: `${guild.memberCount}`, inline: true },
        { name: "Owner ID", value: guild.ownerId, inline: true }
      );

    return message.reply({ embeds: [embed] });
  }
}

module.exports = { handlePrefixCommand };
