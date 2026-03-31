import { Agenda } from 'agenda';
import { MongoBackend } from '@agendajs/mongo-backend';

export const agenda = new Agenda({
  backend: new MongoBackend({
    address: process.env.DB_URI,
    collection: 'agendaJobs',
  }),
});
agenda.processEvery('5 seconds');

console.log('Agenda started');
