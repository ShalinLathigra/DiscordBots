const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');

const { hello, goodbye }  = require('../utils/replies.js');

const NAME = 'create';
const DESCRIPTION = 'Create a new lobby';

function generate_user_embed(author, users)
{
	let participant_string = "";
	
	users.forEach(function(user, index) {
		participant_string += "<@" + user+">\n";
	});

	if (participant_string === "")
	{
		participant_string = "Lobby Empty";
	}

	let embed = new MessageEmbed()
	.setAuthor("<@" + author.username+">")
	.setTitle("<@" + author.username+">'s Avalon Lobby")
	.addFields(
		{ name: 'Owner', value: "<@" + author+">" },
		{ name: 'Participants', value: participant_string },
	)
	.setTimestamp()
	.setFooter('Owner must press "Start" to lock the lobby and begin the game');

	return embed;
}

module.exports = {
	name: NAME,
    description: DESCRIPTION,
	data: new SlashCommandBuilder()
		.setName(NAME)
		.setDescription(DESCRIPTION),
	async execute(interaction) {
		
		const userIds = [];

		let threadPromise = interaction.channel.threads.create({
			name: "<@" + interaction.user.username+">'s Avalon Game",
			autoArchiveDuration: 60,
			reason: "Game Lobby"
		})
		/* 
				Initial Response
		*/

		// TODO: Check if user already owns or is playing in a game
		// TODO: If this is the case, send an ephemeral failure message
		// TODO: Else, proceed normally

		const embed = generate_user_embed(interaction.user, userIds);
		const row = new MessageActionRow()
			.addComponents(
				new MessageButton()
					.setCustomId('join')
					.setLabel('Join')
					.setStyle('PRIMARY'),
			)
			.addComponents(
				new MessageButton()
					.setCustomId('start')
					.setLabel('Start')
					.setStyle('SECONDARY'),
			);
		await interaction.reply({ content: "New Game:", embeds: [embed], components: [ row ], ephemeral: false});

		/* 
				Collectors + Call additional methods.
		*/
        let message = await interaction.fetchReply();
		let started = false;

		const filter = i => (i.customId === 'join' && i.user.id === interaction.user.id) || (i.customId === 'start' && i.user.id === interaction.user.id);
        const collector = message.createMessageComponentCollector({ filter, componentType: 'BUTTON', time: 15000 });
		
        collector.on('collect', async i => {
			if (i.customId === 'join')
			{
				userIds.push(i.user.id)
				threadPromise.then(threadChannel => threadChannel.members.add(i.user));
				await interaction.editReply({ embeds: [generate_user_embed(interaction.user, userIds)] });
				await i.reply({ content: `Joined <@${interaction.user.id}>'s game!`, ephemeral: true });
			} else {
				started = true;
				await interaction.editReply({ components: [] });
				await interaction.followUp({ content: `Started <@${interaction.user.id}>'s game!`, ephemeral: false });
			}
        });
		
        collector.on('end', async () => {
			if (!started)
			{
				await interaction.editReply({ content: `<@${interaction.user.id}>'s game timed out.`, components: [], embeds: [] });
				threadPromise.then(threadChannel => threadChannel.delete())
			}
        });
	},
};