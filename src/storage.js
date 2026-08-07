const STORAGE_KEY = 'destination_manager:destinations';
const BOOKINGS_KEY = 'destination_manager:bookings';

export function loadDestinations(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  }catch(e){
    console.error('Failed to parse destinations from storage', e);
    return [];
  }
}

export function saveDestinations(destinations){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(destinations));
}

export function loadBookings(){
  try{
    const raw = localStorage.getItem(BOOKINGS_KEY);
    return raw ? JSON.parse(raw) : [];
  }catch(e){
    console.error('Failed to parse bookings from storage', e);
    return [];
  }
}

export function saveBookings(bookings){
  localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings));
}

function generateId(){
  return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,8);
}

export function isValidDate(value){
  if(!value) return true;
  if(!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

export function validateDestination({name, location, plannedDate}){
  const errors = {};
  if(!name || !name.trim()) errors.name = 'Name is required';
  if(!location || !location.trim()) errors.location = 'Location is required';
  if(plannedDate && !isValidDate(plannedDate)) errors.plannedDate = 'Planned visit date must be a valid date (YYYY-MM-DD)';
  return { valid: Object.keys(errors).length === 0, errors };
}

export function addDestination(payload){
  const now = new Date().toISOString();
  const dest = { id: generateId(), destination_id: generateId(), name: (payload.name||'').trim(), location: (payload.location||'').trim(), category: (payload.category||'').trim(), description: (payload.description||'').trim(), plannedDate: (payload.plannedDate||'').trim(), createdAt: now, updatedAt: now };
  const list = loadDestinations();
  list.push(dest);
  saveDestinations(list);
  return dest;
}

export function updateDestination(id, updates){
  const list = loadDestinations();
  const idx = list.findIndex(d => d.id === id);
  if(idx === -1) throw new Error('Destination not found');
  list[idx] = { ...list[idx], ...updates, updatedAt: new Date().toISOString() };
  saveDestinations(list);
  return list[idx];
}

export function deleteDestination(id){
  const list = loadDestinations();
  const dest = list.find(d => d.id === id);
  const newList = list.filter(d => d.id !== id);
  saveDestinations(newList);
  if(dest) deleteBookingsForDestination(dest.destination_id);
  return newList;
}

export function validateBooking({destinationId, reference, checkIn, checkOut, guests, totalPrice}){
  const errors = {};
  const destinations = loadDestinations();
  if(!destinationId || !destinations.some(d => d.destination_id === destinationId)){
    errors.destinationId = 'Select a destination for the booking';
  }
  if(!reference || !reference.trim()) errors.reference = 'Booking reference is required';
  if(!checkIn) errors.checkIn = 'Check-in date is required';
  else if(!isValidDate(checkIn)) errors.checkIn = 'Check-in must be a valid date (YYYY-MM-DD)';
  if(!checkOut) errors.checkOut = 'Check-out date is required';
  else if(!isValidDate(checkOut)) errors.checkOut = 'Check-out must be a valid date (YYYY-MM-DD)';
  if(checkIn && checkOut && isValidDate(checkIn) && isValidDate(checkOut) && checkOut < checkIn){
    errors.checkOut = 'Check-out must be on or after check-in';
  }
  if(guests !== undefined && guests !== null && guests !== ''){
    const n = Number(guests);
    if(!Number.isInteger(n) || n <= 0) errors.guests = 'Guests must be a positive whole number';
  }
  if(totalPrice !== undefined && totalPrice !== null && totalPrice !== ''){
    const p = Number(totalPrice);
    if(Number.isNaN(p) || p < 0) errors.totalPrice = 'Total price must be a non-negative number';
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

export function addBooking(payload){
  const now = new Date().toISOString();
  const booking = {
    id: generateId(),
    destination_id: payload.destinationId,
    reference: (payload.reference||'').trim(),
    checkIn: payload.checkIn,
    checkOut: payload.checkOut,
    guests: (payload.guests === undefined || payload.guests === null || payload.guests === '') ? undefined : Number(payload.guests),
    totalPrice: (payload.totalPrice === undefined || payload.totalPrice === null || payload.totalPrice === '') ? undefined : Number(payload.totalPrice),
    currency: (payload.currency||'').trim() || undefined,
    status: (payload.status||'').trim() || undefined,
    createdAt: now,
    updatedAt: now
  };
  const list = loadBookings();
  list.push(booking);
  saveBookings(list);
  return booking;
}

export function updateBooking(id, updates){
  const list = loadBookings();
  const idx = list.findIndex(b => b.id === id);
  if(idx === -1) throw new Error('Booking not found');
  list[idx] = { ...list[idx], ...updates, updatedAt: new Date().toISOString() };
  saveBookings(list);
  return list[idx];
}

export function deleteBooking(id){
  const list = loadBookings();
  const newList = list.filter(b => b.id !== id);
  saveBookings(newList);
  return newList;
}

export function deleteBookingsForDestination(destinationId){
  const list = loadBookings();
  const newList = list.filter(b => b.destination_id !== destinationId);
  saveBookings(newList);
  return newList;
}

export function clearAll(){
  saveDestinations([]);
}

export function searchDestinations(term){
  const q = (term||'').trim().toLowerCase();
  if(!q) return loadDestinations();
  return loadDestinations().filter(d => {
    return [d.name, d.location, d.category, d.description, d.plannedDate].some(f => (f||'').toLowerCase().includes(q));
  });
}
