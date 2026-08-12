import { loadDestinations, addDestination, updateDestination, deleteDestination, validateDestination, searchDestinations, loadBookings, addBooking, updateBooking, deleteBooking, validateBooking } from './storage.js';

function qs(id){ return document.getElementById(id); }

const VIEWS = { welcome: 'view-welcome', manage: 'view-manage', search: 'view-search' };

function showView(name){
  Object.entries(VIEWS).forEach(([key, id]) => { qs(id).hidden = key !== name; });
  if(name === 'manage'){
    showManageTab('destinations');
    refreshManage();
  }
  if(name === 'search') refreshSearch();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showManageTab(tab){
  qs('panel-destinations').hidden = tab !== 'destinations';
  qs('panel-bookings').hidden = tab !== 'bookings';
  qs('tab-destinations').classList.toggle('active', tab === 'destinations');
  qs('tab-bookings').classList.toggle('active', tab === 'bookings');
  qs('tab-destinations').setAttribute('aria-selected', String(tab === 'destinations'));
  qs('tab-bookings').setAttribute('aria-selected', String(tab === 'bookings'));
}

function escapeHtml(s){ return String(s||'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }

function renderBookingsFor(dest, container){
  const bookings = loadBookings().filter(b => b.destination_id === dest.destination_id);
  const heading = document.createElement('div');
  heading.className = 'muted';
  heading.textContent = 'Bookings:';
  container.appendChild(heading);
  if(bookings.length === 0){
    const none = document.createElement('div');
    none.className = 'muted';
    none.textContent = 'No bookings yet.';
    container.appendChild(none);
  }else{
    const ul = document.createElement('ul');
    ul.className = 'booking-list';
    bookings.forEach(b => {
      const li = document.createElement('li');
      li.className = 'booking-item';
      const info = document.createElement('span');
      const price = (b.totalPrice !== undefined) ? ' &middot; '+escapeHtml(String(b.currency||''))+escapeHtml(String(b.totalPrice)) : '';
      info.innerHTML = `<strong>${escapeHtml(b.reference)}</strong> &middot; ${escapeHtml(b.checkIn)} &rarr; ${escapeHtml(b.checkOut)}${b.guests? ' &middot; '+escapeHtml(String(b.guests))+' guests':''}${b.status? ' &middot; '+escapeHtml(b.status):''}${price}`;
      li.appendChild(info);
      ul.appendChild(li);
    });
    container.appendChild(ul);
  }
}

function createDestinationItem(d){
  const li = document.createElement('li');
  li.className = 'destination-item';
  const meta = document.createElement('div');
  meta.className = 'destination-meta';
  meta.innerHTML = `<strong>${escapeHtml(d.name)}</strong><div>${escapeHtml(d.location)}${d.category? ' • '+escapeHtml(d.category):''}</div>${d.plannedDate? '<div class="muted">Planned: '+escapeHtml(d.plannedDate)+'</div>':''}<div class="muted">${escapeHtml(d.description)}</div>`;
  const bookings = document.createElement('div');
  bookings.className = 'destination-bookings';
  renderBookingsFor(d, bookings);
  li.appendChild(meta);
  li.appendChild(bookings);
  return li;
}

function renderSearchResults(items){
  const listEl = qs('search-results-list');
  const emptyEl = qs('search-empty');
  listEl.innerHTML = '';
  if(!items || items.length === 0){
    emptyEl.hidden = false;
    return;
  }
  emptyEl.hidden = true;
  items.forEach(d => listEl.appendChild(createDestinationItem(d)));
}

function refreshSearch(){
  const term = qs('search-input').value;
  renderSearchResults(searchDestinations(term));
}

function populateDestinationSelect(){
  const select = qs('booking-destination');
  const prev = select.value;
  select.innerHTML = '';
  loadDestinations().forEach(d => {
    const opt = document.createElement('option');
    opt.value = d.destination_id;
    opt.textContent = d.name;
    select.appendChild(opt);
  });
  if(prev && [...select.options].some(o => o.value === prev)) select.value = prev;
}

function populateEditDestinationSelect(){
  const select = qs('edit-destination');
  const prev = select.value;
  select.innerHTML = '';
  const none = document.createElement('option');
  none.value = '';
  none.textContent = '-- Select a destination --';
  select.appendChild(none);
  loadDestinations().forEach(d => {
    const opt = document.createElement('option');
    opt.value = d.id;
    opt.textContent = `${d.name} — ${d.location}`;
    select.appendChild(opt);
  });
  if(prev && [...select.options].some(o => o.value === prev)) select.value = prev;
}

function populateEditBookingSelect(){
  const select = qs('edit-booking');
  const prev = select.value;
  select.innerHTML = '';
  const none = document.createElement('option');
  none.value = '';
  none.textContent = '-- Select a booking --';
  select.appendChild(none);
  const destinations = loadDestinations();
  loadBookings().forEach(b => {
    const dest = destinations.find(d => d.destination_id === b.destination_id);
    const label = `${dest ? dest.name : 'Unknown destination'} · ${b.reference} · ${b.checkIn} → ${b.checkOut}`;
    const opt = document.createElement('option');
    opt.value = b.id;
    opt.textContent = label;
    select.appendChild(opt);
  });
  if(prev && [...select.options].some(o => o.value === prev)) select.value = prev;
}

function refreshManage(){
  populateDestinationSelect();
  populateEditDestinationSelect();
  populateEditBookingSelect();
}

function clearForm(){
  qs('destination-id').value = '';
  qs('name').value = '';
  qs('location').value = '';
  qs('category').value = '';
  qs('description').value = '';
  qs('plannedDate').value = '';
  qs('error-name').textContent = '';
  qs('error-location').textContent = '';
  qs('error-plannedDate').textContent = '';
  qs('cancel-edit').hidden = true;
  qs('submit-button').textContent = 'Save';
}

function startEdit(dest){
  qs('destination-id').value = dest.id;
  qs('name').value = dest.name;
  qs('location').value = dest.location;
  qs('category').value = dest.category;
  qs('description').value = dest.description;
  qs('plannedDate').value = dest.plannedDate || '';
  qs('cancel-edit').hidden = false;
  qs('submit-button').textContent = 'Update';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function onEditDestinationChange(){
  const id = qs('edit-destination').value;
  if(!id){ clearForm(); return; }
  const dest = loadDestinations().find(d => d.id === id);
  if(dest) startEdit(dest);
}

function handleDeleteSelectedDestination(){
  const id = qs('edit-destination').value;
  if(!id){ qs('error-edit-destination').textContent = 'Select a destination to delete.'; return; }
  if(!confirm('Delete this destination? Its bookings will also be deleted.')) return;
  deleteDestination(id);
  qs('error-edit-destination').textContent = '';
  clearForm();
  refreshManage();
}

function clearBookingForm(){
  qs('booking-id').value = '';
  qs('booking-destination-id').value = '';
  qs('booking-reference').value = '';
  qs('booking-checkIn').value = '';
  qs('booking-checkOut').value = '';
  qs('booking-guests').value = '';
  qs('booking-totalPrice').value = '';
  qs('booking-currency').value = '';
  qs('booking-status').value = '';
  qs('error-booking-destination').textContent = '';
  qs('error-booking-reference').textContent = '';
  qs('error-booking-checkIn').textContent = '';
  qs('error-booking-checkOut').textContent = '';
  qs('error-booking-guests').textContent = '';
  qs('error-booking-totalPrice').textContent = '';
  qs('booking-cancel-edit').hidden = true;
  qs('booking-submit-button').textContent = 'Save Booking';
}

function startBookingEdit(booking){
  populateDestinationSelect();
  qs('booking-id').value = booking.id;
  qs('booking-destination-id').value = booking.destination_id;
  qs('booking-destination').value = booking.destination_id;
  qs('booking-reference').value = booking.reference;
  qs('booking-checkIn').value = booking.checkIn;
  qs('booking-checkOut').value = booking.checkOut;
  qs('booking-guests').value = (booking.guests === undefined) ? '' : booking.guests;
  qs('booking-totalPrice').value = (booking.totalPrice === undefined) ? '' : booking.totalPrice;
  qs('booking-currency').value = booking.currency || '';
  qs('booking-status').value = booking.status || '';
  qs('booking-cancel-edit').hidden = false;
  qs('booking-submit-button').textContent = 'Update Booking';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function onEditBookingChange(){
  const id = qs('edit-booking').value;
  if(!id){ clearBookingForm(); return; }
  const booking = loadBookings().find(b => b.id === id);
  if(booking) startBookingEdit(booking);
}

function handleDeleteSelectedBooking(){
  const id = qs('edit-booking').value;
  if(!id){ qs('error-edit-booking').textContent = 'Select a booking to delete.'; return; }
  if(!confirm('Delete this booking?')) return;
  deleteBooking(id);
  qs('error-edit-booking').textContent = '';
  clearBookingForm();
  refreshManage();
}

function handleBookingSubmit(ev){
  ev.preventDefault();
  const id = qs('booking-id').value;
  const payload = {
    destinationId: qs('booking-destination-id').value || qs('booking-destination').value,
    reference: qs('booking-reference').value,
    checkIn: qs('booking-checkIn').value,
    checkOut: qs('booking-checkOut').value,
    guests: qs('booking-guests').value,
    totalPrice: qs('booking-totalPrice').value,
    currency: qs('booking-currency').value,
    status: qs('booking-status').value
  };
  const { valid, errors } = validateBooking(payload);
  qs('error-booking-destination').textContent = errors.destinationId || '';
  qs('error-booking-reference').textContent = errors.reference || '';
  qs('error-booking-checkIn').textContent = errors.checkIn || '';
  qs('error-booking-checkOut').textContent = errors.checkOut || '';
  qs('error-booking-guests').textContent = errors.guests || '';
  qs('error-booking-totalPrice').textContent = errors.totalPrice || '';
  if(!valid) return;
  if(id){
    try{
      updateBooking(id, payload);
      clearBookingForm();
    }catch(e){ alert(e.message); }
  }else{
    addBooking(payload);
    clearBookingForm();
  }
  refreshManage();
}

function handleSubmit(ev){
  ev.preventDefault();
  const id = qs('destination-id').value;
  const payload = { name: qs('name').value, location: qs('location').value, category: qs('category').value, description: qs('description').value, plannedDate: qs('plannedDate').value };
  const { valid, errors } = validateDestination(payload);
  qs('error-name').textContent = errors.name || '';
  qs('error-location').textContent = errors.location || '';
  qs('error-plannedDate').textContent = errors.plannedDate || '';
  if(!valid) return;
  if(id){
    try{
      updateDestination(id, payload);
      clearForm();
    }catch(e){ alert(e.message); }
  }else{
    addDestination(payload);
    clearForm();
  }
  refreshManage();
}

function init(){
  document.addEventListener('DOMContentLoaded', () => {
    qs('destination-form').addEventListener('submit', handleSubmit);
    qs('cancel-edit').addEventListener('click', clearForm);
    qs('booking-form').addEventListener('submit', handleBookingSubmit);
    qs('booking-cancel-edit').addEventListener('click', clearBookingForm);
    qs('welcome-manage').addEventListener('click', () => showView('manage'));
    qs('welcome-search').addEventListener('click', () => showView('search'));
    qs('back-from-search').addEventListener('click', () => showView('welcome'));
    qs('search-input').addEventListener('input', () => refreshSearch());
    qs('tab-destinations').addEventListener('click', () => showManageTab('destinations'));
    qs('tab-bookings').addEventListener('click', () => showManageTab('bookings'));
    qs('tab-home').addEventListener('click', () => showView('welcome'));
    qs('edit-destination').addEventListener('change', onEditDestinationChange);
    qs('edit-booking').addEventListener('change', onEditBookingChange);
    qs('delete-destination').addEventListener('click', handleDeleteSelectedDestination);
    qs('delete-booking').addEventListener('click', handleDeleteSelectedBooking);
    showView('welcome');
  });
}

init();
