module.exports = ({ bot, knex, config, commands }) => {
  commands.addInboxThreadCommand("alert", "[opt:string]", async (msg, args, thread) => {
    if (args.opt && args.opt.startsWith("c")) {
      await thread.removeAlert(msg.author.id)
      await thread.postSystemMessage("Vous ne serez plus ping lors d'un nouveau message");
    } else {
      await thread.addAlert(msg.author.id);
      await thread.postSystemMessage(`${msg.author.username}#${msg.author.discriminator} sera ping lors d'un nouveau message`);
    }
  }, { allowSuspended: true });
};
