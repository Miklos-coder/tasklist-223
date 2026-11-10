const express = require('express');
const path = require('path');
require('dotenv').config({ quiet: true });

const app = express();
app.disable('x-powered-by');
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: false, limit: '32kb' }));
app.use('/', require('./routes/taskRoutes'));
app.use('/', require('./routes/userRoutes'));
app.use((req, res) => res.status(404).render('error', { message: 'Diese Seite wurde nicht gefunden.' }));
app.use(require('./middleware/errorHandler'));

if (require.main === module) {
  const port = process.env.PORT || 3000;
  const server = app.listen(port, (error) => {
    if (error) {
      console.error(error.code === 'EADDRINUSE'
        ? 'Port ' + port + ' ist bereits belegt. Setze PORT in .env auf einen freien Port.'
        : 'Serverstart fehlgeschlagen: ' + error.message);
      process.exitCode = 1;
      return;
    }
    console.log('Server is running on http://localhost:' + port);
  });
  const stop = () => server.close(async () => {
    await require('./lib/prisma').$disconnect();
    process.exit(0);
  });
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
}
module.exports = app;
