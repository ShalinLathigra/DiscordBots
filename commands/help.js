const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

const NAME = 'help';
const DESCRIPTION = 'Display help information.';

module.exports = {
	name: NAME,
    description: DESCRIPTION,
	data: new SlashCommandBuilder()
		.setName(NAME)
		.setDescription(DESCRIPTION),
	async execute(interaction) {
		// TODO: Generate this by using the name and description fields that are exported by each command

		let help = [
			{ name: '/help', value: 'Display help information.' },
		];

		const embed = new MessageEmbed()
            .setTitle('Help')
			.addFields(help)
            .setTimestamp();
		await interaction.reply({ embeds: [ embed ], ephemeral: true});
	},
};