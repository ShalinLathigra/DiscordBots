const { SlashCommandBuilder } = require('@discordjs/builders');
const {  }  = require('../utils/replies.js');
const { TryGetPlayer, GenerateGameEmbed }  = require('../utils/db.js');

const NAME = 'status';
const DESCRIPTION = 'Prints out current status of your active game in the game\'s thread.';

module.exports = {
	name: NAME,
    description: DESCRIPTION,
	data: new SlashCommandBuilder()
		.setName(NAME)
		.setDescription(DESCRIPTION),
	async execute(interaction) {
		let {success, gameId} = TryGetPlayer(interaction.user.id)
		if (!success)
		{
			await interaction.reply({content: "Game Status", embeds: GenerateGameEmbed(gameId), ephemeral: true});
		} else {
			await interaction.reply({content: "Not currently in a game", ephemeral: true});
		}
	},
};