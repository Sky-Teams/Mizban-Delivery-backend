import build from 'pino-abstract-transport';
import pinoRoll from 'pino-roll';

//create function to filter log files base level
export default async function (options) {
  const destination = await pinoRoll(options);
  const levels = { info: 30, warn: 40, error: 50, fatal: 60 };
  const targetLevel =
    typeof options.targetLevel === 'string' ? levels[options.targetLevel] : options.targetLevel;

  return build(
    async function (source) {
      for await (let obj of source) {
        const levelMatches = obj.level === targetLevel;
        const typeMatches = options.logType ? obj.logType === options.logType : true;

        if (levelMatches && typeMatches) {
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
