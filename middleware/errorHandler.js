function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  const missing = error.code === 'P2025';
  const databaseError = error.name?.startsWith('Prisma') || /^P\d{4}$/.test(error.code || '');
  const status = missing ? 404 : databaseError ? 503 : error.status || 500;
  const message = missing ? 'Der gesuchte Eintrag wurde nicht gefunden.' :
    databaseError ? 'Die Datenbank ist momentan nicht erreichbar oder die Änderung konnte nicht gespeichert werden. Bitte versuche es erneut.' :
    error.status ? error.message : 'Ein unerwarteter Fehler ist aufgetreten.';
  console.error('[Anwendungsfehler]', error.code || error.name);
  res.status(status).render('error', { message: message });
}
module.exports = errorHandler;
