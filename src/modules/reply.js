const attachments = require("../data/attachments");
const utils = require("../utils");
const Thread = require("../data/Thread");

module.exports = ({ bot, knex, config, commands }) => {
  // Mods can reply to modmail threads using !r or !reply
  // These messages get relayed back to the DM thread between the bot and the user
  commands.addInboxThreadCommand("reply", "[text$]", async (msg, args, thread) => {
    if (! args.text && msg.attachments.length === 0) {
      utils.postError(msg.channel, "Vous devez écrire quelque chose.");
      return;
    }

    const replied = await thread.replyToUser(msg.member, args.text || "", msg.attachments, false, msg.messageReference);
    if (replied) msg.delete();
  }, {
    aliases: ["r"]
  });

  // Anonymous replies only show the role, not the username
  commands.addInboxThreadCommand("anonreply", "[text$]", async (msg, args, thread) => {
    if (! args.text && msg.attachments.length === 0) {
      utils.postError(msg.channel, "Vous devez écrire quelque chose.");
      return;
    }

    const replied = await thread.replyToUser(msg.member, args.text || "", msg.attachments, true, msg.messageReference);
    if (replied) msg.delete();
  }, {
    aliases: ["ar"]
  });

  if (config.allowStaffEdit) {
    commands.addInboxThreadCommand("edit", "<messageNumber:number> <text:string$>", async (msg, args, thread) => {
      const threadMessage = await thread.findThreadMessageByMessageNumber(args.messageNumber);
      if (! threadMessage) {
        utils.postError(msg.channel, "Le message que vous essayez d'éditer n'existe pas.");
        return;
      }

      if (threadMessage.user_id !== msg.author.id) {
        utils.postError(msg.channel, "Vous pouvez uniquement editer vos messages.");
        return;
      }

      const edited = await thread.editStaffReply(msg.member, threadMessage, args.text);
      if (edited) msg.delete().catch(utils.noop);
    }, {
      aliases: ["e"]
    });
  }

  if (config.allowStaffDelete) {
    commands.addInboxThreadCommand("delete", "<messageNumber:number>", async (msg, args, thread) => {
      const threadMessage = await thread.findThreadMessageByMessageNumber(args.messageNumber);
      if (! threadMessage) {
        utils.postError(msg.channel, "Le message que vous essayez de supprimer n'existe pas.");
        return;
      }

      if (threadMessage.user_id !== msg.author.id) {
        utils.postError(msg.channel, "Vous pouvez uniquement supprimer vos messages.");
        return;
      }

      await thread.deleteStaffReply(msg.member, threadMessage);
      msg.delete().catch(utils.noop);
    }, {
      aliases: ["d"]
    });
  }
};
