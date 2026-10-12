import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { ClientsService } from '../clients/clients.service';
import { Env } from '../config/env.validation';
import { RequestStatus } from '../requests/request-status.enum';
import { RequestsService } from '../requests/requests.service';
import { Role } from '../users/role.enum';
import { UsersService } from '../users/users.service';

// Demo data for local development. Safe to run many times: users that
// already exist are skipped, and sample clients/requests are only created
// while there are no clients yet.
const DEMO_USERS = [
  { email: 'admin@example.com', name: 'Admin', role: Role.Admin },
  { email: 'olena@example.com', name: 'Olena Shevchenko', role: Role.Manager },
  { email: 'max@example.com', name: 'Max Bondar', role: Role.Manager },
];

const DEMO_CLIENTS = [
  { name: 'Anna Petrenko', email: 'anna.petrenko@example.com', phone: '+380 44 123 45 67' },
  { name: 'Bakery Zolotyi Kolos', email: 'orders@zolotyi-kolos.example.com', phone: '+380 50 222 33 44' },
  { name: 'Dmytro Kovalenko', email: 'dmytro.k@example.com', phone: '+380 67 555 66 77' },
  { name: 'Green Garden Studio', email: 'hello@greengarden.example.com', phone: '+380 63 100 20 30' },
  { name: 'Iryna Melnyk', email: 'iryna.melnyk@example.com', phone: '+380 93 777 88 99' },
];

// `client` is an index into DEMO_CLIENTS.
const DEMO_REQUESTS = [
  { client: 0, status: RequestStatus.New, title: 'Quote for kitchen renovation', description: 'Anna wants a price for a small kitchen renovation, about 12 square meters.' },
  { client: 0, status: RequestStatus.Done, title: 'Replace front door lock', description: 'The lock jams in cold weather. Replacement finished and paid.' },
  { client: 1, status: RequestStatus.InProgress, title: 'Website for the bakery', description: 'One-page site with the menu, opening hours and a phone number for orders.' },
  { client: 1, status: RequestStatus.New, title: 'Telegram bot for pre-orders', description: 'Customers should be able to pre-order bread for the next morning.' },
  { client: 1, status: RequestStatus.Done, title: 'Fix menu typos', description: 'Three prices on the printed menu were wrong. Updated the PDF.' },
  { client: 2, status: RequestStatus.New, title: 'Car service appointment', description: 'Dmytro asks for the earliest slot for an oil change and brake check.' },
  { client: 2, status: RequestStatus.InProgress, title: 'Invoice correction', description: 'The invoice from September has the wrong VAT number.' },
  { client: 3, status: RequestStatus.InProgress, title: 'Landing page for workshops', description: 'Schedule, prices and a booking form for the spring workshops.' },
  { client: 3, status: RequestStatus.New, title: 'Logo in vector format', description: 'They need the logo as SVG for a banner printing shop.' },
  { client: 3, status: RequestStatus.Done, title: 'Domain and email setup', description: 'Connected the domain and created three mailboxes.' },
  { client: 4, status: RequestStatus.New, title: 'Question about delivery time', description: 'Iryna asks when her order from last week will arrive.' },
  { client: 4, status: RequestStatus.InProgress, title: 'Change of delivery address', description: 'Address changed to a new street, order is already packed.' },
];

// `request` is an index into DEMO_REQUESTS, `author` an index into DEMO_USERS.
const DEMO_COMMENTS = [
  { request: 2, author: 1, text: 'Sent the first draft of the page. Waiting for photos of the bakery.' },
  { request: 2, author: 2, text: 'Photos received, adding them to the page today.' },
  { request: 6, author: 2, text: 'Asked the accountant for the correct number.' },
  { request: 7, author: 1, text: 'Booking form works. Next: prices section.' },
  { request: 11, author: 1, text: 'Called the courier, the address is updated in their system.' },
  { request: 1, author: 2, text: 'Paid in cash, receipt given to the client.' },
];

async function seed() {
  // An "application context" is the Nest app without the HTTP server.
  // Creating it also loads .env and runs pending migrations.
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });

  try {
    const password = app.get(ConfigService<Env, true>).get('SEED_PASSWORD');
    if (!password || password.length < 8) {
      throw new Error('Set SEED_PASSWORD (at least 8 characters) in your .env file');
    }

    const usersService = app.get(UsersService);
    const users = [];
    for (const demoUser of DEMO_USERS) {
      let user = await usersService.findByEmail(demoUser.email);
      if (user) {
        console.log(`skip   user ${demoUser.email} (already exists)`);
      } else {
        user = await usersService.create({ ...demoUser, password });
        console.log(`create user ${demoUser.email} (${demoUser.role})`);
      }
      users.push(user);
    }

    const clientsService = app.get(ClientsService);
    if ((await clientsService.findAll()).length > 0) {
      console.log('skip   sample clients and requests (clients already exist)');
      return;
    }

    const clients = [];
    for (const demoClient of DEMO_CLIENTS) {
      clients.push(await clientsService.create(demoClient));
    }
    console.log(`create ${clients.length} clients`);

    const requestsService = app.get(RequestsService);
    const requests = [];
    for (const demoRequest of DEMO_REQUESTS) {
      const { client, status, title, description } = demoRequest;
      const created = await requestsService.create({ title, description, clientId: clients[client].id });
      // New requests always start as "new"; move the others to their sample status.
      requests.push(
        status === RequestStatus.New ? created : await requestsService.update(created.id, { status }),
      );
    }
    console.log(`create ${requests.length} requests`);

    for (const demoComment of DEMO_COMMENTS) {
      await requestsService.addComment(requests[demoComment.request].id, users[demoComment.author].id, {
        text: demoComment.text,
      });
    }
    console.log(`create ${DEMO_COMMENTS.length} comments`);
  } finally {
    await app.close();
  }
}

seed().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
