export default defineEventHandler((): ApiResponse => {
  const db = getDb();
  return { data: capitalize(db.connected ? 'ok' : 'fail'), status: 200 };
});
