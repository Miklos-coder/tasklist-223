const prisma = require('../lib/prisma');
const { seedAdmin } = require('../services/userService');

seedAdmin()
  .then((user) => console.log('Admin-Benutzer gespeichert: ' + user.email + ' (ID ' + user.id + ')'))
  .catch((error) => {
    console.error('Data-Seed fehlgeschlagen:', error.status ? error.message : error.code || error.name);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
