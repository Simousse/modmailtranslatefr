const utils = require("../utils");
const {
  setModeratorDefaultRoleOverride,
  resetModeratorDefaultRoleOverride,

  setModeratorThreadRoleOverride,
  resetModeratorThreadRoleOverride,

  getModeratorThreadDisplayRoleName,
  getModeratorDefaultDisplayRoleName,
} = require("../data/displayRoles");
const {getOrFetchChannel} = require("../utils");

module.exports = ({ bot, knex, config, commands }) => {
  if (! config.allowChangingDisplayRole) {
    return;
  }

  function resolveRoleInput(input) {
    if (utils.isSnowflake(input)) {
      return utils.getInboxGuild().roles.get(input);
    }

    return utils.getInboxGuild().roles.find(r => r.name.toLowerCase() === input.toLowerCase());
  }

  // Get display role for a thread
  commands.addInboxThreadCommand("role", [], async (msg, args, thread) => {
    const displayRole = await getModeratorThreadDisplayRoleName(msg.member, thread.id);
    if (displayRole) {
      thread.postSystemMessage(`Le rôle actuellement affiché pour ce ticket est : **${displayRole}**`);
    } else {
      thread.postSystemMessage("Aucun rôle n'est affiché pour ce ticket.");
    }
  }, { allowSuspended: true });

  // Reset display role for a thread
  commands.addInboxThreadCommand("role reset", [], async (msg, args, thread) => {
    await resetModeratorThreadRoleOverride(msg.member.id, thread.id);

    const displayRole = await getModeratorThreadDisplayRoleName(msg.member, thread.id);
    if (displayRole) {
      thread.postSystemMessage(`Le rôle affiché a été reset pour ce ticket. Le rôle affiché sera le rôle par défaut : **${displayRole}**.`);
    } else {
      thread.postSystemMessage("Le rôle affiché a été reset pour ce ticket. Vos réponses n'afficheront aucun rôle.");
    }
  }, {
    aliases: ["role_reset", "reset_role"],
    allowSuspended: true,
  });

  // Set display role for a thread
  commands.addInboxThreadCommand("role", "<role:string$>", async (msg, args, thread) => {
    const role = resolveRoleInput(args.role);
    if (! role || ! msg.member.roles.includes(role.id)) {
      thread.postSystemMessage("Aucun rôle trouvé. Vérifiez que vous avez bien le rôle avant de mettre le rôle voulu.");
      return;
    }

    await setModeratorThreadRoleOverride(msg.member.id, thread.id, role.id);
    thread.postSystemMessage(`Le rôle affiché pour ce ticket est désormais : **${role.name}**. Vous pouvez le reset en faisant \`${config.prefix}role reset\`.`);
  }, { allowSuspended: true });

  // Get default display role
  commands.addInboxServerCommand("role", [], async (msg, args, thread) => {
    const channel = await getOrFetchChannel(bot, msg.channel.id);
    const displayRole = await getModeratorDefaultDisplayRoleName(msg.member);
    if (displayRole) {
      channel.createMessage(`Le rôle actuellement affiché pour tous les tickets est : **${displayRole}**`);
    } else {
      channel.createMessage("Aucun rôle n'est affiché pour tous les tickets.");
    }
  });

  // Reset default display role
  commands.addInboxServerCommand("role reset", [], async (msg, args, thread) => {
    await resetModeratorDefaultRoleOverride(msg.member.id);

    const channel = await getOrFetchChannel(bot, msg.channel.id);
    const displayRole = await getModeratorDefaultDisplayRoleName(msg.member);
    if (displayRole) {
      channel.createMessage(`Le rôle affiché a été reset. Le rôle affiché sera le rôle par défaut : **${displayRole}**`);
    } else {
      channel.createMessage("Le rôle affiché a été reset. Vos réponses n'afficheront aucun rôle.");
    }
  }, {
    aliases: ["role_reset", "reset_role"],
  });

  // Set default display role
  commands.addInboxServerCommand("role", "<role:string$>", async (msg, args, thread) => {
    const channel = await getOrFetchChannel(bot, msg.channel.id);
    const role = resolveRoleInput(args.role);
    if (! role || ! msg.member.roles.includes(role.id)) {
      channel.createMessage("Aucun rôle trouvé. Vérifiez que vous avez bien le rôle avant de mettre le rôle voulu.");
      return;
    }

    await setModeratorDefaultRoleOverride(msg.member.id, role.id);
    channel.createMessage(`Le rôle affiché est désormais : **${role.name}**. Vous pouvez le reset en faisant \`${config.prefix}role reset\`.`);
  });
};
