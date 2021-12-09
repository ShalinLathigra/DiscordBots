const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');

const NAME = 'rps';
const DESCRIPTION = 'Rock Paper Scissors';

module.exports = {
	name: NAME,
    description: DESCRIPTION,
	data: new SlashCommandBuilder()
		.setName(NAME)
		.setDescription(DESCRIPTION)
		.addUserOption(option => option.setName('target').setDescription('Select a user').setRequired(true)),
	async execute(interaction) {
		const ownerId = interaction.user.id;
		const targetId = interaction.options.getUser('target').id;
		if (ownerId == targetId)
		{
			await interaction.reply({content: "Hey! No playing with yourself!", ephemeral: true});
			return;
		}

		const gameState = {
			ownerId: null,
			targetId: null
		}

		const row = new MessageActionRow()
			.addComponents(
				new MessageButton()
					.setCustomId('rock')
					.setLabel("ROCK")
					.setStyle('PRIMARY'),
			)
			.addComponents(
				new MessageButton()
					.setCustomId('roll_of_paper')
					.setLabel("PAPER")
					.setStyle('SUCCESS'),
			)
			.addComponents(
				new MessageButton()
					.setCustomId('scissors')
					.setLabel("SCISSORS")
					.setStyle('DANGER'),
			);
		await interaction.reply({content: ':rock::roll_of_paper::scissors:<@' + ownerId + "> vs <@" + targetId + ">:scissors::roll_of_paper::rock:", components: [ row ]});
        let message = await interaction.fetchReply();

		const filter = i => (i.user.id === ownerId || i.user.id === targetId) && (i.customId === 'rock' || i.customId === 'roll_of_paper' || i.customId === 'scissors');
        const collector = message.createMessageComponentCollector({ filter, componentType: 'BUTTON', time: 15000 });
		
        collector.on('collect', async i => {
			gameState[i.user.id] = i.customId;
			await i.reply({ content: `Locked in :${i.customId}:`, ephemeral: true });
        });
		
        collector.on('end', async () => {
			if (gameState[ownerId] === undefined || gameState[targetId] === undefined)
			{
				await interaction.editReply({ content: `<@${ownerId}> vs <@${targetId}> timed out.`, components: [], embeds: [] });
			} 
			else if (gameState[ownerId] === gameState[targetId])
			{
				let embed = new MessageEmbed()
				.setAuthor("ROCK PAPER SCISSORS")
				.setTitle("TIE")
				.setDescription(`<@${ownerId}> :${gameState[ownerId]}: vs :${gameState[targetId]}: <@${targetId}>`)
				.setTimestamp();

				await interaction.editReply({ content: "Tie Game", components: [], embeds: [embed] });
			} 
			else {
				let winner = targetId;
				let loser = ownerId;

				if ((gameState[ownerId] === "rock" && gameState[targetId] === "scissors") ||
				    (gameState[ownerId] === "scissors" && gameState[targetId] === "roll_of_paper") ||
				    (gameState[ownerId] === "roll_of_paper" && gameState[targetId] === "rock"))
				{
					winner = ownerId;
					loser = targetId;
				}
				let embed = new MessageEmbed()
				.setAuthor("ROCK PAPER SCISSORS")
				.setTitle("WE HAVE A WINNER!")
				.setDescription(`<@${winner}> :${gameState[winner]}: absolutely DEVASTATED :${gameState[loser]}: <@${loser}>`)
				.setTimestamp();

				await interaction.editReply({ content: `<@${ownerId}> vs <@${targetId}>`, components: [], embeds: [embed] });
			}
        });
	},
};