import build from 'pino-abstract-transport';
import pinoRoll from 'pino-roll';

//create function to filter log files base level
export default async function (options) {
  const destination = await pinoRoll(options);
  const levels = {info: 30, warn: 40, error: 50, fatal: 60 };
  const targetLevel =
    typeof options.targetLevel === 'string'
      ? levels[options.targetLevel]
      : options.targetLevel || 50;

  return build(
    async function (source) {
      for await (let obj of source) {
        if (obj.level === targetLevel) {
          destination.write(JSON.stringify(obj) + '\n');
        }
      }
    },
    {
      async close() {
        destination.end();
      },
    }
  );
}
