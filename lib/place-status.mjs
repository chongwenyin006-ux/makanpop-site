// Keep only locations not explicitly tagged as inactive in OSM.
// This is not a guarantee of a business currently operating.
export function isMarkedClosed(tags = {}) {
  const flag = value => /^(yes|true|1)$/i.test(String(value ?? '').trim());
  for (const key of ['disused','abandoned','demolished','removed']) {
    if (flag(tags[key])) return true;
  }
  if (['vacant','disused','closed'].includes(String(tags.shop || '').toLowerCase())) return true;
  if (['disused','abandoned','vacant'].includes(String(tags.amenity || '').toLowerCase())) return true;
  for (const key of ['business_status','operational_status','status']) {
    if (['permanently_closed','closed_permanently','out_of_business','defunct','shut_down','disused','abandoned','closed']
       .includes(String(tags[key] || '').toLowerCase())) return true;
  }
  for (const key of [
    'disused:amenity','abandoned:amenity','closed:amenity',
    'demolished:amenity','removed:amenity','was:amenity',
    'construction:amenity','proposed:amenity'
  ]) if (tags[key]) return true;
  if (['closed','off','permanently closed'].includes(String(tags.opening_hours || '').trim().toLowerCase())) return true;
  return false;
}
