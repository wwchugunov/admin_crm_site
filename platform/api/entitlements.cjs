// A finite SQLite/JSON timestamp keeps existing expiry checks and short leases intact.
// This is an account entitlement, never a client-side bypass or a perpetual lease.
const PERPETUAL_EXPIRY = 253402300799000;
function accountExpiry(data) {
  if (data.perpetual !== undefined && typeof data.perpetual !== 'boolean')
    throw Object.assign(Error('perpetual must be a boolean'), {status:400});
  const expires = data.perpetual === true ? PERPETUAL_EXPIRY : Number(data.expires);
  if (!Number.isSafeInteger(expires) || expires <= 0 || expires > PERPETUAL_EXPIRY)
    throw Object.assign(Error('Invalid account expiry'), {status:400});
  if (data.perpetual === true && !['active','blocked'].includes(data.stage))
    throw Object.assign(Error('Perpetual access requires active or blocked status'), {status:400});
  return expires;
}
module.exports = {PERPETUAL_EXPIRY, accountExpiry};
