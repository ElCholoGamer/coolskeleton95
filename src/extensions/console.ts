import chalk from '../util/chalk';

function getDatePrefix() {
	const now = new Date();
	const utc = new Date(
		now.getUTCFullYear(),
		now.getUTCMonth(),
		now.getUTCDate(),
		now.getUTCHours(),
		now.getUTCMinutes(),
		now.getUTCSeconds(),
		now.getUTCMilliseconds()
	);

	utc.setTime(utc.getTime() - 5 * (60 * 60 * 1000));

	const d = utc.getDate();
	const mon = utc.getMonth() + 1;
	const y = utc.getFullYear();
	const h = utc.getHours().toString().padStart(2, '0');
	const min = utc.getMinutes().toString().padStart(2, '0');

	return chalk.yellow(`[${d}/${mon}/${y}-${h}:${min}]`);
}

const prevLog = console.log.bind(console);
const prevWarn = console.warn.bind(console);

console.log = function (...args: any[]) {
	prevLog(getDatePrefix(), ...args);
};

console.warn = function (...args: any[]) {
	prevWarn(getDatePrefix(), ...args);
};
