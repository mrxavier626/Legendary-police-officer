const { EmbedBuilder } = require("discord.js");
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

async function handleSlashCommand(client, interaction) {
  const { commandName } = interaction;

  if (commandName === "help") {
    return interaction.reply({
      embeds: [buildHelpEmbed(0)],
      components: [buildHelpRow(0, interaction.user.id)]
    });
  }

  if (commandName === "ping") {
    return interaction.reply(`🏓 Pong! ${client.ws.ping}ms`);
  }

  if (commandName === "setlog") {
    const channel = interaction.options.getChannel("channel");
    setGuildConfig(interaction.guild.id, "logChannelId", channel.id);
    return interaction.reply(`✅ Log channel set to ${channel}`);
  }

  if (commandName === "setwelcome") {
    const channel = interaction.options.getChannel("channel");
    setGuildConfig(interaction.guild.id, "welcomeChannelId", channel.id);
    return interaction.reply(`✅ Welcome channel set to ${channel}`);
  }

  if (commandName === "setverify") {
    const channel = interaction.options.getChannel("channel");
    const role = interaction.options.getRole("role");

    setGuildConfig(interaction.guild.id, "verifyChannelId", channel.id);
    setGuildConfig(interaction.guild.id, "verifyRoleId", role.id);

    return interaction.reply(`✅ Verify channel set to ${channel} and role set to ${role}`);
  }

  if (commandName === "setupverify") {
    const config = getGuildConfig(interaction.guild.id);
    if (!config.verifyChannelId) {
      return interaction.reply({ content: "❌ Set verify channel first.", ephemeral: true });
    }

    const channel = interaction.guild.channels.cache.get(config.verifyChannelId);
    if (!channel || !channel.isTextBased()) {
      return interaction.reply({ content: "❌ Verify channel not found.", ephemeral: true });
    }

    await sendVerifyPanel(interaction.guild, channel);
    return interaction.reply({ content: "✅ Verification panel sent.", ephemeral: true });
  }

  if (commandName === "ban") {
    const user = interaction.options.getMember("user");
    const reason = interaction.options.getString("reason") || "No reason provided";

    await user.ban({ reason }).catch(() => null);
    return interaction.reply(`✅ Banned ${user.user.tag}`);
  }

  if (commandName === "unban") {
    const userId = interaction.options.getString("userid");
    const reason = interaction.options.getString("reason") || "No reason provided";

    await interaction.guild.members.unban(userId, reason).catch(() => null);
    return interaction.reply(`✅ Unbanned user ID ${userId}`);
  }

  if (commandName === "kick") {
    const user = interaction.options.getMember("user");
    const reason = interaction.options.getString("reason") || "No reason provided";

    await user.kick(reason).catch(() => null);
    return interaction.reply(`✅ Kicked ${user.user.tag}`);
  }

  if (commandName === "mute") {
    const user = interaction.options.getMember("user");
    const durationText = interaction.options.getString("duration");
    const reason = interaction.options.getString("reason") || "No reason provided";

    const ms = parseDuration(durationText);
    if (!ms) return interaction.reply({ content: "❌ Invalid duration.", ephemeral: true });

    await user.timeout(ms, reason).catch(() => null);
    return interaction.reply(`✅ Muted ${user.user.tag} for ${durationText}`);
  }

  if (commandName === "unmute") {
    const user = interaction.options.getMember("user");
    await user.timeout(null).catch(() => null);
    return interaction.reply(`✅ Unmuted ${user.user.tag}`);
  }

  if (commandName === "warn") {
    const user = interaction.options.getUser("user");
    const reason = interaction.options.getString("reason");

    addWarning(interaction.guild.id, user.id, reason);
    return interaction.reply(`✅ Warned ${user.tag}`);
  }

  if (commandName === "warnings") {
    const user = interaction.options.getUser("user");
    const warnings = getWarnings(interaction.guild.id, user.id);

    if (!warnings.length) return interaction.reply("No warnings found.");

    const embed = new EmbedBuilder()
      .setColor(0xf1c40f)
      .setTitle(`Warnings for ${user.tag}`)
      .setDescription(
        warnings.map((w, i) => `**${i + 1}.** ${w.reason}\n*${w.date}*`).join("\n\n")
      );

    return interaction.reply({ embeds: [embed] });
  }

  if (commandName === "clearwarn") {
    return interaction.reply({ content: "⚠️ Clearwarn will be added in the next command pack.", ephemeral: true });
  }

  if (commandName === "purge") {
    const amount = interaction.options.getInteger("amount");
    if (amount < 1 || amount > 100) {
      return interaction.reply({ content: "❌ Amount must be between 1 and 100.", ephemeral: true });
    }

    await interaction.channel.bulkDelete(amount, true).catch(() => null);
    return interaction.reply({ content: `✅ Deleted ${amount} messages.`, ephemeral: true });
  }

  if (commandName === "lock") {
    const channel = interaction.options.getChannel("channel") || interaction.channel;

    await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
      SendMessages: false
    });

    return interaction.reply(`🔒 Locked ${channel}`);
  }

  if (commandName === "unlock") {
    const channel = interaction.options.getChannel("channel") || interaction.channel;

    await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
      SendMessages: true
    });

    return interaction.reply(`🔓 Unlocked ${channel}`);
  }

  if (commandName === "say") {
    const text = interaction.options.getString("message");
    await interaction.reply({ content: "✅ Sent.", ephemeral: true });
    return interaction.channel.send(text);
  }

  if (commandName === "note") {
    const user = interaction.options.getUser("user");
    const text = interaction.options.getString("text");

    addNote(interaction.guild.id, user.id, text);
    return interaction.reply(`✅ Note added for ${user.tag}`);
  }

  if (commandName === "notes") {
    const user = interaction.options.getUser("user");
    const notes = getNotes(interaction.guild.id, user.id);

    if (!notes.length) return interaction.reply("No notes found.");

    const embed = new EmbedBuilder()
      .setColor(0x3498db)
      .setTitle(`Notes for ${user.tag}`)
      .setDescription(notes.map((n, i) => `**${i + 1}.** ${n}`).join("\n"));

    return interaction.reply({ embeds: [embed] });
  }

  if (commandName === "vcban") {
    const user = interaction.options.getUser("user");
    addVcBan(interaction.guild.id, user.id);
    return interaction.reply(`✅ VC banned ${user.tag}`);
  }

  if (commandName === "userinfo") {
    const user = interaction.options.getUser("user") || interaction.user;
    const member = interaction.guild.members.cache.get(user.id);

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(`User Info - ${user.tag}`)
      .setThumbnail(user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: "User ID", value: user.id, inline: true },
        { name: "Joined Server", value: member?.joinedAt?.toDateString() || "Unknown", inline: true },
        { name: "Created Account", value: user.createdAt.toDateString(), inline: true }
      );

    return interaction.reply({ embeds: [embed] });
  }

  if (commandName === "avatar") {
    const user = interaction.options.getUser("user") || interaction.user;
    return interaction.reply(user.displayAvatarURL({ size: 1024, dynamic: true }));
  }

  if (commandName === "serverinfo") {
    const guild = interaction.guild;

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(`Server Info - ${guild.name}`)
      .setThumbnail(guild.iconURL({ dynamic: true }))
      .addFields(
        { name: "Server ID", value: guild.id, inline: true },
        { name: "Members", value: `${guild.memberCount}`, inline: true },
        { name: "Owner ID", value: guild.ownerId, inline: true }
      );

    return interaction.reply({ embeds: [embed] });
  }

  return interaction.reply({ content: "⚠️ Command not handled yet.", ephemeral: true });
}

module.exports = { handleSlashCommand };
