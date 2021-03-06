const Message = require("../models/message");
const state = require("../state");
const User = require("../models/user");
const welcome = require("../utils/welcome");
const logger = require("../utils/logger")();

module.exports = {
	test: (command) => command === Message.Command.NICK,
	run: function (client, {args: [newNick]}) {
		if (!newNick) {
			return client.send(Message.makeNumeric(Message.Command.ERR_NONICKNAMEGIVEN, undefined, client.user.nick));
		}
		// TODO: ERR_ERRONEUSNICKNAME
		if (client.user) {
			const oldNick = client.user.nick;
			if (state.get(newNick)) {
				return client.send(Message.makeNumeric(Message.Command.ERR_NICKNAMEINUSE, newNick, client.user.nick));
			}
			client.user.updateInfo({nick: newNick});
			if (client.user.nick) {
				logger.debug("Updating username");
				state.changeUserNick(oldNick, newNick);
				const nickMessage = Message.Builder()
					.withCommand(Message.Command.NICK)
					.withSource(oldNick)
					.withParameter(newNick)
					.build();
				client.send(nickMessage);

				client.user.getChannels().forEach((chan) => chan.sendMessage(newNick, nickMessage));
			} else {
				logger.debug("Setting username, user already exists");
				welcome(client);
			}
		} else {
			logger.debug("Setting username, user doesn't exist yet");
			const user = new User(newNick, client);
			state.addUser(user);
			client.user = user;
		}
	}
};
