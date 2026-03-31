import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";

const admin = PermissionFlagsBits.Administrator;

export const slashCommands = [
  // ── Info ──────────────────────────────────────────────────────────────
  new SlashCommandBuilder().setName("ping").setDescription("Check bot latency").setDefaultMemberPermissions(admin),
  new SlashCommandBuilder().setName("help").setDescription("Show all available commands").setDefaultMemberPermissions(admin),
  new SlashCommandBuilder()
    .setName("userinfo").setDescription("Show info about a user")
    .addUserOption(o => o.setName("user").setDescription("User to look up")),
  new SlashCommandBuilder()
    .setName("serverinfo").setDescription("Show server information"),
  new SlashCommandBuilder()
    .setName("avatar").setDescription("Get a user's avatar")
    .addUserOption(o => o.setName("user").setDescription("User")),
  new SlashCommandBuilder()
    .setName("banner").setDescription("Get a user's banner")
    .addUserOption(o => o.setName("user").setDescription("User")),
  new SlashCommandBuilder()
    .setName("servericon").setDescription("Show the server icon").setDefaultMemberPermissions(admin),
  new SlashCommandBuilder()
    .setName("roleinfo").setDescription("Info about a role")
    .addRoleOption(o => o.setName("role").setDescription("Role").setRequired(true)),
  new SlashCommandBuilder()
    .setName("channelinfo").setDescription("Info about a channel")
    .addChannelOption(o => o.setName("channel").setDescription("Channel")),
  new SlashCommandBuilder()
    .setName("emoji").setDescription("Info about an emoji")
    .addStringOption(o => o.setName("emoji").setDescription("The emoji").setRequired(true)),

  // ── Admin Info ─────────────────────────────────────────────────────────
  new SlashCommandBuilder().setName("listbans").setDescription("List all banned users").setDefaultMemberPermissions(admin),
  new SlashCommandBuilder().setName("listroles").setDescription("List all roles").setDefaultMemberPermissions(admin),
  new SlashCommandBuilder().setName("listchannels").setDescription("List all channels").setDefaultMemberPermissions(admin),
  new SlashCommandBuilder().setName("listmembers").setDescription("List all members").setDefaultMemberPermissions(admin),
  new SlashCommandBuilder().setName("warnlist").setDescription("View all warnings in the server").setDefaultMemberPermissions(admin),
  new SlashCommandBuilder().setName("invites").setDescription("List all active server invites").setDefaultMemberPermissions(admin),

  // ── Moderation — Bans & Kicks ──────────────────────────────────────────
  new SlashCommandBuilder().setName("ban").setDescription("Ban a user").setDefaultMemberPermissions(admin)
    .addUserOption(o => o.setName("user").setDescription("User to ban").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("Reason")),
  new SlashCommandBuilder().setName("unban").setDescription("Unban a user by ID").setDefaultMemberPermissions(admin)
    .addStringOption(o => o.setName("userid").setDescription("User ID to unban").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("Reason")),
  new SlashCommandBuilder().setName("kick").setDescription("Kick a user").setDefaultMemberPermissions(admin)
    .addUserOption(o => o.setName("user").setDescription("User to kick").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("Reason")),
  new SlashCommandBuilder().setName("softban").setDescription("Ban+unban to delete messages").setDefaultMemberPermissions(admin)
    .addUserOption(o => o.setName("user").setDescription("User").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("Reason")),
  new SlashCommandBuilder().setName("tempban").setDescription("Temporarily ban a user").setDefaultMemberPermissions(admin)
    .addUserOption(o => o.setName("user").setDescription("User").setRequired(true))
    .addStringOption(o => o.setName("duration").setDescription("e.g. 1h, 1d").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("Reason")),
  new SlashCommandBuilder().setName("massban").setDescription("Ban multiple users by ID").setDefaultMemberPermissions(admin)
    .addStringOption(o => o.setName("userids").setDescription("Space-separated user IDs").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("Reason")),
  new SlashCommandBuilder().setName("hackban").setDescription("Ban a user by ID (even if not in server)").setDefaultMemberPermissions(admin)
    .addStringOption(o => o.setName("userid").setDescription("User ID to ban").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("Reason")),

  // ── Moderation — Mutes, Warns & Messages ──────────────────────────────
  new SlashCommandBuilder().setName("mute").setDescription("Timeout (mute) a user").setDefaultMemberPermissions(admin)
    .addUserOption(o => o.setName("user").setDescription("User to mute").setRequired(true))
    .addStringOption(o => o.setName("duration").setDescription("e.g. 10m, 2h, 1d").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("Reason")),
  new SlashCommandBuilder().setName("unmute").setDescription("Remove timeout from a user").setDefaultMemberPermissions(admin)
    .addUserOption(o => o.setName("user").setDescription("User to unmute").setRequired(true)),
  new SlashCommandBuilder().setName("massmute").setDescription("Mute multiple users at once").setDefaultMemberPermissions(admin)
    .addStringOption(o => o.setName("userids").setDescription("Space-separated user IDs").setRequired(true))
    .addStringOption(o => o.setName("duration").setDescription("e.g. 10m, 1h").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("Reason")),
  new SlashCommandBuilder().setName("massunmute").setDescription("Unmute multiple users at once").setDefaultMemberPermissions(admin)
    .addStringOption(o => o.setName("userids").setDescription("Space-separated user IDs").setRequired(true)),
  new SlashCommandBuilder().setName("warn").setDescription("Warn a user").setDefaultMemberPermissions(admin)
    .addUserOption(o => o.setName("user").setDescription("User to warn").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("Reason").setRequired(true)),
  new SlashCommandBuilder().setName("warnings").setDescription("View warnings for a user").setDefaultMemberPermissions(admin)
    .addUserOption(o => o.setName("user").setDescription("User").setRequired(true)),
  new SlashCommandBuilder().setName("clearwarn").setDescription("Clear warnings for a user").setDefaultMemberPermissions(admin)
    .addUserOption(o => o.setName("user").setDescription("User").setRequired(true)),
  new SlashCommandBuilder().setName("purge").setDescription("Delete messages in bulk").setDefaultMemberPermissions(admin)
    .addIntegerOption(o => o.setName("amount").setDescription("Messages to delete (1-100)").setRequired(true).setMinValue(1).setMaxValue(100))
    .addUserOption(o => o.setName("user").setDescription("Only delete from this user")),
  new SlashCommandBuilder().setName("purgebot").setDescription("Delete bot messages in bulk").setDefaultMemberPermissions(admin)
    .addIntegerOption(o => o.setName("amount").setDescription("Messages to check (1-100)").setRequired(true).setMinValue(1).setMaxValue(100)),
  new SlashCommandBuilder().setName("purgeuser").setDescription("Delete messages from a specific user").setDefaultMemberPermissions(admin)
    .addUserOption(o => o.setName("user").setDescription("User").setRequired(true))
    .addIntegerOption(o => o.setName("amount").setDescription("Messages to check (1-100)").setRequired(true).setMinValue(1).setMaxValue(100)),

  // ── Moderation — Channels, Nicks & Notes ──────────────────────────────
  new SlashCommandBuilder().setName("slowmode").setDescription("Set slowmode on a channel").setDefaultMemberPermissions(admin)
    .addIntegerOption(o => o.setName("seconds").setDescription("Seconds (0 to disable)").setRequired(true).setMinValue(0).setMaxValue(21600))
    .addChannelOption(o => o.setName("channel").setDescription("Target channel")),
  new SlashCommandBuilder().setName("lock").setDescription("Lock a channel").setDefaultMemberPermissions(admin)
    .addChannelOption(o => o.setName("channel").setDescription("Channel to lock")),
  new SlashCommandBuilder().setName("unlock").setDescription("Unlock a channel").setDefaultMemberPermissions(admin)
    .addChannelOption(o => o.setName("channel").setDescription("Channel to unlock")),
  new SlashCommandBuilder().setName("lockdown").setDescription("Lock ALL channels").setDefaultMemberPermissions(admin),
  new SlashCommandBuilder().setName("unlockdown").setDescription("Unlock ALL channels").setDefaultMemberPermissions(admin),
  new SlashCommandBuilder().setName("nuke").setDescription("Delete and recreate the current channel").setDefaultMemberPermissions(admin),
  new SlashCommandBuilder().setName("nick").setDescription("Change a user's nickname").setDefaultMemberPermissions(admin)
    .addUserOption(o => o.setName("user").setDescription("User").setRequired(true))
    .addStringOption(o => o.setName("nickname").setDescription("New nickname (leave empty to reset)")),
  new SlashCommandBuilder().setName("cleannick").setDescription("Reset a user's nickname").setDefaultMemberPermissions(admin)
    .addUserOption(o => o.setName("user").setDescription("User").setRequired(true)),
  new SlashCommandBuilder().setName("dehoist").setDescription("Remove hoisting characters from a nickname").setDefaultMemberPermissions(admin)
    .addUserOption(o => o.setName("user").setDescription("User").setRequired(true)),
  new SlashCommandBuilder().setName("strip").setDescription("Remove all roles from a user").setDefaultMemberPermissions(admin)
    .addUserOption(o => o.setName("user").setDescription("User").setRequired(true)),
  new SlashCommandBuilder().setName("note").setDescription("Add a mod note to a user").setDefaultMemberPermissions(admin)
    .addUserOption(o => o.setName("user").setDescription("User").setRequired(true))
    .addStringOption(o => o.setName("text").setDescription("Note content").setRequired(true)),
  new SlashCommandBuilder().setName("notes").setDescription("View mod notes for a user").setDefaultMemberPermissions(admin)
    .addUserOption(o => o.setName("user").setDescription("User").setRequired(true)),
  new SlashCommandBuilder().setName("clearnotes").setDescription("Clear all mod notes for a user").setDefaultMemberPermissions(admin)
    .addUserOption(o => o.setName("user").setDescription("User").setRequired(true)),
  new SlashCommandBuilder().setName("history").setDescription("View a user's moderation history").setDefaultMemberPermissions(admin)
    .addUserOption(o => o.setName("user").setDescription("User").setRequired(true)),

  // ── Voice ──────────────────────────────────────────────────────────────
  new SlashCommandBuilder().setName("move").setDescription("Move a user to a voice channel").setDefaultMemberPermissions(admin)
    .addUserOption(o => o.setName("user").setDescription("User to move").setRequired(true))
    .addChannelOption(o => o.setName("channel").setDescription("Voice channel").setRequired(true)),
  new SlashCommandBuilder().setName("vckick").setDescription("Kick user from voice channel").setDefaultMemberPermissions(admin)
    .addUserOption(o => o.setName("user").setDescription("User").setRequired(true)),
  new SlashCommandBuilder().setName("vcmute").setDescription("Server-mute a user in voice").setDefaultMemberPermissions(admin)
    .addUserOption(o => o.setName("user").setDescription("User").setRequired(true)),
  new SlashCommandBuilder().setName("vcunmute").setDescription("Remove server-mute from user").setDefaultMemberPermissions(admin)
    .addUserOption(o => o.setName("user").setDescription("User").setRequired(true)),
  new SlashCommandBuilder().setName("deafen").setDescription("Server-deafen a user in voice").setDefaultMemberPermissions(admin)
    .addUserOption(o => o.setName("user").setDescription("User").setRequired(true)),
  new SlashCommandBuilder().setName("undeafen").setDescription("Remove server-deafen from user").setDefaultMemberPermissions(admin)
    .addUserOption(o => o.setName("user").setDescription("User").setRequired(true)),
  new SlashCommandBuilder().setName("massdeafen").setDescription("Deafen multiple users in voice").setDefaultMemberPermissions(admin)
    .addStringOption(o => o.setName("userids").setDescription("Space-separated user IDs").setRequired(true)),
  new SlashCommandBuilder().setName("massundeafen").setDescription("Undeafen multiple users in voice").setDefaultMemberPermissions(admin)
    .addStringOption(o => o.setName("userids").setDescription("Space-separated user IDs").setRequired(true)),
  new SlashCommandBuilder().setName("vcban").setDescription("Ban a user from joining voice channels").setDefaultMemberPermissions(admin)
    .addUserOption(o => o.setName("user").setDescription("User").setRequired(true)),
  new SlashCommandBuilder().setName("unvcban").setDescription("Restore voice access for a user").setDefaultMemberPermissions(admin)
    .addUserOption(o => o.setName("user").setDescription("User").setRequired(true)),

  // ── Roles ──────────────────────────────────────────────────────────────
  new SlashCommandBuilder().setName("addrole").setDescription("Add a role to a user").setDefaultMemberPermissions(admin)
    .addUserOption(o => o.setName("user").setDescription("User").setRequired(true))
    .addRoleOption(o => o.setName("role").setDescription("Role to add").setRequired(true)),
  new SlashCommandBuilder().setName("removerole").setDescription("Remove a role from a user").setDefaultMemberPermissions(admin)
    .addUserOption(o => o.setName("user").setDescription("User").setRequired(true))
    .addRoleOption(o => o.setName("role").setDescription("Role to remove").setRequired(true)),
  new SlashCommandBuilder().setName("createrole").setDescription("Create a new role").setDefaultMemberPermissions(admin)
    .addStringOption(o => o.setName("name").setDescription("Role name").setRequired(true))
    .addStringOption(o => o.setName("color").setDescription("Hex color e.g. #FF0000")),
  new SlashCommandBuilder().setName("deleterole").setDescription("Delete a role").setDefaultMemberPermissions(admin)
    .addRoleOption(o => o.setName("role").setDescription("Role to delete").setRequired(true)),
  new SlashCommandBuilder().setName("setcolor").setDescription("Change a role's color").setDefaultMemberPermissions(admin)
    .addRoleOption(o => o.setName("role").setDescription("Role").setRequired(true))
    .addStringOption(o => o.setName("color").setDescription("Hex color e.g. #FF0000").setRequired(true)),
  new SlashCommandBuilder().setName("mentionable").setDescription("Toggle role mentionable").setDefaultMemberPermissions(admin)
    .addRoleOption(o => o.setName("role").setDescription("Role").setRequired(true)),
  new SlashCommandBuilder().setName("roledump").setDescription("List all members with a role").setDefaultMemberPermissions(admin)
    .addRoleOption(o => o.setName("role").setDescription("Role").setRequired(true)),

  // ── Channels ───────────────────────────────────────────────────────────
  new SlashCommandBuilder().setName("createchannel").setDescription("Create a channel").setDefaultMemberPermissions(admin)
    .addStringOption(o => o.setName("name").setDescription("Channel name").setRequired(true))
    .addStringOption(o => o.setName("type").setDescription("text or voice").addChoices(
      { name: "text", value: "text" },
      { name: "voice", value: "voice" }
    )),
  new SlashCommandBuilder().setName("deletechannel").setDescription("Delete a channel").setDefaultMemberPermissions(admin)
    .addChannelOption(o => o.setName("channel").setDescription("Channel to delete").setRequired(true)),
  new SlashCommandBuilder().setName("clearinvites").setDescription("Delete all server invites").setDefaultMemberPermissions(admin),
  new SlashCommandBuilder().setName("createinvite").setDescription("Generate a server invite link").setDefaultMemberPermissions(admin)
    .addChannelOption(o => o.setName("channel").setDescription("Channel to create invite for")),

  // ── Communication ──────────────────────────────────────────────────────
  new SlashCommandBuilder().setName("say").setDescription("Make the bot say something").setDefaultMemberPermissions(admin)
    .addStringOption(o => o.setName("message").setDescription("Message").setRequired(true))
    .addChannelOption(o => o.setName("channel").setDescription("Channel to send in")),
  new SlashCommandBuilder().setName("announce").setDescription("Send an announcement embed").setDefaultMemberPermissions(admin)
    .addStringOption(o => o.setName("title").setDescription("Title").setRequired(true))
    .addStringOption(o => o.setName("message").setDescription("Message body").setRequired(true)),
  new SlashCommandBuilder().setName("dm").setDescription("DM a user from the bot").setDefaultMemberPermissions(admin)
    .addUserOption(o => o.setName("user").setDescription("User to DM").setRequired(true))
    .addStringOption(o => o.setName("message").setDescription("Message").setRequired(true)),
  new SlashCommandBuilder().setName("chat").setDescription("Open a DM chat relay with a user").setDefaultMemberPermissions(admin)
    .addUserOption(o => o.setName("user").setDescription("User to chat with").setRequired(true))
    .addStringOption(o => o.setName("message").setDescription("First message (optional)")),
  new SlashCommandBuilder().setName("reply").setDescription("Reply to a user in an active DM relay").setDefaultMemberPermissions(admin)
    .addUserOption(o => o.setName("user").setDescription("User to reply to").setRequired(true))
    .addStringOption(o => o.setName("message").setDescription("Message to send").setRequired(true)),

  // ── Setup ──────────────────────────────────────────────────────────────
  new SlashCommandBuilder().setName("setlog").setDescription("Set the mod-log channel").setDefaultMemberPermissions(admin)
    .addChannelOption(o => o.setName("channel").setDescription("Log channel").setRequired(true)),
  new SlashCommandBuilder().setName("setwelcome").setDescription("Set the welcome channel").setDefaultMemberPermissions(admin)
    .addChannelOption(o => o.setName("channel").setDescription("Welcome channel").setRequired(true)),
  new SlashCommandBuilder().setName("setverify").setDescription("Set verification channel + role").setDefaultMemberPermissions(admin)
    .addChannelOption(o => o.setName("channel").setDescription("Verification channel").setRequired(true))
    .addRoleOption(o => o.setName("role").setDescription("Role given after verifying").setRequired(true)),
  new SlashCommandBuilder().setName("setupverify").setDescription("Post the verification embed").setDefaultMemberPermissions(admin),
];
