const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");
const { getGuildConfig } = require("../managers/storage");
const { buildHelpEmbed, buildHelpRow, helpPages } = require("./helpPages");

async function sendVerifyPanel(guild, channel) {
  const embed = new EmbedBuilder()
    .setColor(0x2ecc71)
    .setTitle("✅ Verification")
    .setDescription("Click the button below to verify and get access to the server.");

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("verify_button")
      .setLabel("Verify")
      .setStyle(ButtonStyle.Success)
  );

  await channel.send({ embeds: [embed], components: [row] });
}

async function handleVerifyButton(client, interaction) {
  const config = getGuildConfig(interaction.guild.id);

  if (!config.verifyRoleId) {
    return interaction.reply({
      content: "❌ No verify role has been set.",
      ephemeral: true
    });
  }

  const member = interaction.member;
  const role = interaction.guild.roles.cache.get(config.verifyRoleId);

  if (!role) {
    return interaction.reply({
      content: "❌ Verify role not found.",
      ephemeral: true
    });
  }

  await member.roles.add(role).catch(() => null);

  await interaction.reply({
    content: `✅ You have been verified and got the **${role.name}** role.`,
    ephemeral: true
  });
}

async function handleHelpButtons(client, interaction) {
  const parts = interaction.customId.split("_");
  const action = parts[1];
  const currentPage = Number(parts[2]);
  const ownerId = parts[3];

  if (interaction.user.id !== ownerId) {
    return interaction.reply({
      content: "❌ Only the user who opened help can use these buttons.",
      ephemeral: true
    });
  }

  let newPage = currentPage;

  if (action === "next") newPage++;
  if (action === "prev") newPage--;

  if (newPage < 0) newPage = 0;
  if (newPage >= helpPages.length) newPage = helpPages.length - 1;

  await interaction.update({
    embeds: [buildHelpEmbed(newPage)],
    components: [buildHelpRow(newPage, ownerId)]
  });
}

module.exports = {
  sendVerifyPanel,
  handleVerifyButton,
  handleHelpButtons
};
