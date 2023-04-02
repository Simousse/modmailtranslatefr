const moment = require("moment");
const threads = require("../data/threads");
const utils = require("../utils");

const {THREAD_STATUS} = require("../data/constants");
const {getOrFetchChannel} = require("../utils");

module.exports = ({ bot, knex, config, commands }) => {
  if (! config.allowSuspend) return;
  // Check for threads that are scheduled to be suspended and suspend them
  async function applyScheduledSuspensions() {
    const threadsToBeSuspended = await threads.getThreadsThatShouldBeSuspended();
    for (const thread of threadsToBeSuspended) {
      if (thread.status === THREAD_STATUS.OPEN) {
        await thread.suspend();
        await thread.postSystemMessage(`**Le demande de suspension de ticket** faite par ${thread.scheduled_suspend_name} est désormais active. Ce ticket sera considéré comme fermé jusqu'à l'utilisation de \`!unsuspend\``);
      }
    }
  }

  async function scheduledSuspendLoop() {
    try {
      await applyScheduledSuspensions();
    } catch (e) {
      console.error(e);
    }

    setTimeout(scheduledSuspendLoop, 2000);
  }

  scheduledSuspendLoop();

  commands.addInboxThreadCommand("suspend cancel", [], async (msg, args, thread) => {
    // Cancel timed suspend
    if (thread.scheduled_suspend_at) {
      await thread.cancelScheduledSuspend();
      thread.postSystemMessage("La suspension programée du ticket est annulée.");
    } else {
      thread.postSystemMessage("Aucun demande de suspension n'est actif pour ce ticket.");
    }
  });

  commands.addInboxThreadCommand("suspend", "[delay:delay]", async (msg, args, thread) => {
    if (thread.status === THREAD_STATUS.SUSPENDED) {
      thread.postSystemMessage("Ce ticket est déjà suspendu.");
      return;
    }
    if (args.delay) {
      const suspendAt = moment.utc().add(args.delay, "ms");
      await thread.scheduleSuspend(suspendAt.format("YYYY-MM-DD HH:mm:ss"), msg.author);

      thread.postSystemMessage(`Ce ticket sera suspendu dans ${utils.humanizeDelay(args.delay)}. Utilisez \`${config.prefix}suspend cancel\` pour annuler.`);

      return;
    }

    await thread.suspend();
    thread.postSystemMessage("**Ce ticket est désormais suspendu!** Ce ticket sera considéré comme fermé jusqu'à l'utilisation de `!unsuspend``");
  }, { allowSuspended: true });

  commands.addInboxServerCommand("unsuspend", [], async (msg, args, thread) => {
    if (thread) {
      thread.postSystemMessage("Ce ticket n'est pas suspendu.");
      return;
    }

    thread = await threads.findSuspendedThreadByChannelId(msg.channel.id);
    if (! thread) {
      const channel = await getOrFetchChannel(bot, msg.channel.id);
      channel.createMessage("Vous devez être dans un ticket pour utiliser cette commande.");
      return;
    }

    const otherOpenThread = await threads.findOpenThreadByUserId(thread.user_id);
    if (otherOpenThread) {
      thread.postSystemMessage(`Vous ne pouvez pas enlever la suspension de ce ticket car il y'en a un autre d'ouvert : <#${otherOpenThread.channel_id}>`);
      return;
    }

    await thread.unsuspend();
    thread.postSystemMessage("**Ce ticket est maintenant réouvert!**");
  });
};
