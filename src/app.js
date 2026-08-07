import { loadDestinations, addDestination, updateDestination, deleteDestination, validateDestination, searchDestinations, loadBookings, addBooking, updateBooking, deleteBooking, validateBooking } from './storage.js';

function qs(id){ return document.getElementById(id); }

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
      const actions = document.createElement('span');
      const edit = document.createElement('button'); edit.textContent = 'Edit';
      edit.addEventListener('click', () => startBookingEdit(b));
      const del = document.createElement('button'); del.textContent = 'Delete';
      del.addEventListener('click', () => handleBookingDelete(b.id));
      actions.appendChild(edit); actions.appendChild(del);
      li.appendChild(info); li.appendChild(actions);
      ul.appendChild(li);
    });
    container.appendChild(ul);
  }
  const add = document.createElement('button');
  add.textContent = '+ Add booking';
  add.addEventListener('click', () => startBookingFor(dest));
  container.appendChild(add);
}

function renderList(items){
  const listEl = qs('destination-list');
  const emptyEl = qs('list-empty');
  listEl.innerHTML = '';
  if(!items || items.length === 0){
    emptyEl.hidden = false;
    return;
  }
  emptyEl.hidden = true;
  items.forEach(d => {
    const li = document.createElement('li');
    li.className = 'destination-item';
    const top = document.createElement('div');
    top.className = 'destination-top';
    const meta = document.createElement('div');
    meta.className = 'destination-meta';
    meta.innerHTML = `<strong>${escapeHtml(d.name)}</strong><div>${escapeHtml(d.location)}${d.category? ' • '+escapeHtml(d.category):''}</div>${d.plannedDate? '<div class="muted">Planned: '+escapeHtml(d.plannedDate)+'</div>':''}<div class="muted">${escapeHtml(d.description)}</div>`;
    const actions = document.createElement('div');
    actions.className = 'destination-actions';
    const edit = document.createElement('button'); edit.textContent = 'Edit';
    edit.addEventListener('click', () => startEdit(d));
    const del = document.createElement('button'); del.textContent = 'Delete';
    del.addEventListener('click', () => handleDelete(d.id));
    actions.appendChild(edit); actions.appendChild(del);
    top.appendChild(meta); top.appendChild(actions);
    const bookings = document.createElement('div');
    bookings.className = 'destination-bookings';
    renderBookingsFor(d, bookings);
    li.appendChild(top); li.appendChild(bookings);
    listEl.appendChild(li);
  });
}

function escapeHtml(s){ return String(s||'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }

function refreshList(){
  const term = qs('search-input').value;
  const items = searchDestinations(term);
  populateDestinationSelect();
  renderList(items);
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

function handleDelete(id){
  if(!confirm('Delete this destination? Its bookings will also be deleted.')) return;
  deleteDestination(id);
  refreshList();
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

function startBookingFor(dest){
  clearBookingForm();
  qs('booking-destination-id').value = dest.destination_id;
  qs('booking-destination').value = dest.destination_id;
  window.scrollTo({ top: 0, behavior: 'smooth' });
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

function handleBookingDelete(id){
  if(!confirm('Delete this booking?')) return;
  deleteBooking(id);
  refreshList();
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
  refreshList();
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
  refreshList();
}

function init(){
  document.addEventListener('DOMContentLoaded', () => {
    qs('destination-form').addEventListener('submit', handleSubmit);
    qs('cancel-edit').addEventListener('click', clearForm);
    qs('search-input').addEventListener('input', () => refreshList());
    qs('booking-form').addEventListener('submit', handleBookingSubmit);
    qs('booking-cancel-edit').addEventListener('click', clearBookingForm);
    refreshList();
  });
}

init();
