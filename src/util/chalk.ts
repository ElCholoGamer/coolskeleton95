const func = (code: string) => (text: string) => code + text + '\x1b[0m';

const chalk = {
	reset: func('\x1b[0m'),
	bright: func('\x1b[1m'),
	dim: func('\x1b[2m'),
	underscore: func('\x1b[4m'),
	blink: func('\x1b[5m'),
	reverse: func('\x1b[7m'),
	hidden: func('\x1b[8m'),

	black: func('\x1b[30m'),
	red: func('\x1b[31m'),
	green: func('\x1b[32m'),
	yellow: func('\x1b[33m'),
	blue: func('\x1b[34m'),
	magenta: func('\x1b[35m'),
	cyan: func('\x1b[36m'),
	white: func('\x1b[37m'),

	bgBlack: func('\x1b[40m'),
	bgRed: func('\x1b[41m'),
	bgGreen: func('\x1b[42m'),
	bgYellow: func('\x1b[43m'),
	bgBlue: func('\x1b[44m'),
	bgMagenta: func('\x1b[45m'),
	bgCyan: func('\x1b[46m'),
	bgWhite: func('\x1b[47m'),
};

export default chalk;
