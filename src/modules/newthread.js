const utils = require("../utils");
const threads = require("../data/threads");
const {getOrFetchChannel} = require("../utils");

module.exports = ({ bot, knex, config, commands }) => {
  commands.addInboxServerCommand("newthread", "<userId:userId>", async (msg, args, thread) => {
    const user = bot.users.get(args.userId) || await bot.getRESTUser(args.userId).catch(() => null);
    if (! user) {
      utils.postSystemMessageWithFallback(msg.channel, thread, "Utilisateur introuvable!");
      return;
    }

    if (user.bot) {
      utils.postSystemMessageWithFallback(msg.channel, thread, "Impossible de créer un ticket avec un bot");
      return;
    }

    const existingThread = await threads.findOpenThreadByUserId(user.id);
    if (existingThread) {
      utils.postSystemMessageWithFallback(msg.channel, thread, `Vous ne pouvez pas ré-ouvrir de ticket avec cette personne car il y en a déjà un autre d'ouvert : <#${existingThread.channel_id}>`);
      return;
    }

    const createdThread = await threads.createNewThreadForUser(user, {
      quiet: true,
      ignoreRequirements: true,
      ignoreHooks: true,
      source: "command",
    });

    createdThread.postSystemMessage(`Ticket ouvert par ${msg.author.username}#${msg.author.discriminator}`);

    const channel = await getOrFetchChannel(bot, msg.channel.id);
    channel.createMessage(`Le Ticket à été ouvert: <#${createdThread.channel_id}>`);
  });
};
