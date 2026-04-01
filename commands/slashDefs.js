const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

const slashCommands = [
  new SlashCommandBuilder()
    .setName("help")
    .setDescription("Show the help menu"),

  new SlashCommandBuilder()
    .setName("setlog")
    .setDescription("Set the log channel")
    .addChannelOption(option =>
      option.setName("channel")
        .setDescription("Channel to use for logs")
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  new SlashCommandBuilder()
    .setName("setwelcome")
    .setDescription("Set the welcome channel")
    .addChannelOption(option =>
      option.setName("channel")
        .setDescription("Channel to use for welcome messages")
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  new SlashCommandBuilder()
    .setName("setverify")
    .setDescription("Set the verify channel and role")
    .addChannelOption(option =>
      option.setName("channel")
        .setDescription("Verification channel")
        .setRequired(true))
    .addRoleOption(option =>
      option.setName("role")
        .setDescription("Role to give after verification")
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  new SlashCommandBuilder()
    .setName("setupverify")
    .setDescription("Post the verification embed and button")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Show bot ping"),

  new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Ban a user")
    .addUserOption(option =>
      option.setName("user").setDescription("User to ban").setRequired(true))
    .addStringOption(option =>
      option.setName("reason").setDescription("Reason").setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  new SlashCommandBuilder()
    .setName("unban")
    .setDescription("Unban a user by ID")
    .addStringOption(option =>
      option.setName("userid").setDescription("User ID").setRequired(true))
    .addStringOption(option =>
      option.setName("reason").setDescription("Reason").setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Kick a user")
    .addUserOption(option =>
      option.setName("user").setDescription("User to kick").setRequired(true))
    .addStringOption(option =>
      option.setName("reason").setDescription("Reason").setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  new SlashCommandBuilder()
    .setName("mute")
    .setDescription("Timeout a user")
    .addUserOption(option =>
      option.setName("user").setDescription("User to mute").setRequired(true))
    .addStringOption(option =>
      option.setName("duration").setDescription("Examples: 10m, 1h, 1d").setRequired(true))
    .addStringOption(option =>
      option.setName("reason").setDescription("Reason").setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  new SlashCommandBuilder()
    .setName("unmute")
    .setDescription("Remove timeout from a user")
    .addUserOption(option =>
      option.setName("user").setDescription("User to unmute").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  new SlashCommandBuilder()
    .setName("warn")
    .setDescription("Warn a user")
    .addUserOption(option =>
      option.setName("user").setDescription("User to warn").setRequired(true))
    .addStringOption(option =>
      option.setName("reason").setDescription("Reason").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  new SlashCommandBuilder()
    .setName("warnings")
    .setDescription("Show warnings of a user")
    .addUserOption(option =>
      option.setName("user").setDescription("User").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  new SlashCommandBuilder()
    .setName("clearwarn")
    .setDescription("Clear all warnings of a user")
    .addUserOption(option =>
      option.setName("user").setDescription("User").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  new SlashCommandBuilder()
    .setName("purge")
    .setDescription("Delete messages")
    .addIntegerOption(option =>
      option.setName("amount").setDescription("1 to 100").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  new SlashCommandBuilder()
    .setName("lock")
    .setDescription("Lock a channel")
    .addChannelOption(option =>
      option.setName("channel").setDescription("Channel").setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  new SlashCommandBuilder()
    .setName("unlock")
    .setDescription("Unlock a channel")
    .addChannelOption(option =>
      option.setName("channel").setDescription("Channel").setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  new SlashCommandBuilder()
    .setName("say")
    .setDescription("Make the bot say something")
    .addStringOption(option =>
      option.setName("message").setDescription("Message").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  new SlashCommandBuilder()
    .setName("note")
    .setDescription("Add a note to a user")
    .addUserOption(option =>
      option.setName("user").setDescription("User").setRequired(true))
    .addStringOption(option =>
      option.setName("text").setDescription("Note text").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  new SlashCommandBuilder()
    .setName("notes")
    .setDescription("Show notes of a user")
    .addUserOption(option =>
      option.setName("user").setDescription("User").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  new SlashCommandBuilder()
    .setName("vcban")
    .setDescription("VC ban a user")
    .addUserOption(option =>
      option.setName("user").setDescription("User").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.MuteMembers),

  new SlashCommandBuilder()
    .setName("userinfo")
    .setDescription("Show user info")
    .addUserOption(option =>
      option.setName("user").setDescription("User").setRequired(false)),

  new SlashCommandBuilder()
    .setName("avatar")
    .setDescription("Show avatar")
    .addUserOption(option =>
      option.setName("user").setDescription("User").setRequired(false)),

  new SlashCommandBuilder()
    .setName("serverinfo")
    .setDescription("Show server info"),
].map(cmd => cmd.toJSON());

module.exports = { slashCommands };
