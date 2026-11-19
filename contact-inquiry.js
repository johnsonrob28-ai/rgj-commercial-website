// The public Wix client uses anonymous visitor permissions only.
const formEl = document.querySelector('#contact-inquiry');
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
try {
  const { createFormStore, FORM_ERROR } = await import('./wix-form-store.js');
  const store = createFormStore({formId: '7f41cd89-d316-4ce8-a651-9919b20b9810'});
  let signature = '';
  let prefilled = false;
  function prefill(form) {
    const params = new URLSearchParams(location.search);
    const requested = {location: (params.get('address') || params.getAll('city').filter(Boolean).join(', ') || '').slice(0,300), message: (params.get('message') || '').slice(0,2000), transaction: ({Sale:'Purchase',Lease:'Lease',Sell:'Sell',Purchase:'Purchase','Lease renewal':'Lease renewal'})[params.get('deal')] || ''};
    const size = params.get('size');
    if (size) {
      const bands = {'10000-20000':'10,000–20,000 SF','20000-30000':'20,000–30,000 SF','30000-50000':'30,000–50,000 SF','50000-70000':'50,000–70,000 SF','70000-100000':'70,000–100,000 SF','100000-120000':'100,000–120,000 SF','120000-150000':'120,000–150,000 SF','150000-':'150,000+ SF'};
      requested.size = bands[size] || '';
    }
    for (const f of form.fields) if (requested[f.target] && (f.control !== 'select' || f.choices.some(c=>c.value===requested[f.target]))) store.setValue(f.target, requested[f.target]);
  }
  function render(s) {
    if (s.outcome) {
      signature = "";
      formEl.innerHTML = '<h3>Your inquiry has been received.</h3><p role="status">'+esc(s.outcome.message || 'Your inquiry has been received.')+'</p><a class="text-link" href="market-update.html">Read the latest market report →</a>';
      return;
    }
    if (!s.form) {
      formEl.innerHTML = '<p role="status">'+esc(s.errors[FORM_ERROR] || 'Loading the inquiry form…')+'</p>';
      return;
    }
    if (s.closed) {
      formEl.innerHTML = '<p role="status">'+esc(s.form.disabledMessage || 'The inquiry form is currently unavailable. Please contact RGJ Commercial using the email or phone number on this page.')+'</p>';
      return;
    }
    if (!prefilled) {prefilled = true; prefill(s.form); s = store.getState();}
    const fields = s.form.fields.filter(f => f.target !== 'budget' && (!s.form.steps.length || f.stepId === s.form.steps[s.step].id));
    const key = JSON.stringify(fields);
    if (key !== signature) {
      signature = key;
      formEl.innerHTML = fields.map(f => {
        const id = 'signup-'+f.target;
        const attrs = ' id="'+esc(id)+'" name="'+esc(f.target)+'"'+(f.required?' required':'')+(f.readOnly?' disabled':'')+' aria-describedby="'+esc(id)+'-error"';
        const brandLabels = {transaction: 'How can we help?', message: 'Tell us about your plans', location: 'Address', timing: 'Target Occupancy Date'};
        const label = esc(brandLabels[f.target] || f.label)+(f.required?' *':'');
        let control;
        if (f.control === 'checkbox') control='<label class="consent-label" for="'+esc(id)+'"><input type="checkbox"'+attrs+'><span>'+label+'</span></label>';
        else {
          control='<label for="'+esc(id)+'">'+label+'</label>';
          if (f.control === 'select') control+='<select'+attrs+'><option value="">Please select</option>'+f.choices.map(c=>'<option value="'+esc(c.value)+'">'+esc(c.label)+'</option>').join('')+'</select>';
          else if (f.control === 'textarea') control+='<textarea'+attrs+'></textarea>';
          else if (f.target === 'location') control+='<input type="text"'+attrs+' autocomplete="off" placeholder="Start typing an address or street"><p class="address-help">Start typing, then pick the matching address from the list, or type it in yourself.</p>';
          else if (f.target === 'timing') control+='<input type="date"'+attrs+'>';
          else if (['text','email','phone','url','number','date'].includes(f.control)) control+='<input type="'+(f.control==='phone'?'tel':f.control)+'"'+attrs+' placeholder="'+esc(f.placeholder || '')+'">';
          else control+='<p>This field needs assistance. Please email us using the address below.</p>';
        }
        return '<div class="signup-field '+(f.control==='textarea'?'inquiry-wide':'')+'">'+control+(f.description?'<p class="small">'+esc(f.description)+'</p>':'')+'<p class="signup-error" id="'+esc(id)+'-error" role="alert"></p></div>';
      }).join('')+'<p id="signup-error" class="signup-error" role="alert"></p><button type="submit" class="cta"></button>';
    }
    fields.forEach(f => {
      const input = formEl.elements.namedItem(f.target);
      if (!input) return;
      if (f.control === 'checkbox') input.checked = s.values[f.target] === true;
      else if (input.value !== String(s.values[f.target] ?? '')) input.value = s.values[f.target] ?? '';
      input.setAttribute('aria-invalid', String(Boolean(s.errors[f.target])));
      document.getElementById('signup-'+f.target+'-error').textContent = s.errors[f.target] || '';
    });
    document.getElementById('signup-error').textContent = s.errors[FORM_ERROR] || '';
    const button = formEl.querySelector('button');
    button.disabled = s.loading;
    button.setAttribute('aria-busy', String(s.loading));
    button.textContent = s.loading ? 'Submitting…' : (s.form.submitText || 'Send inquiry');
  }
  formEl.addEventListener('input', e => {
    if (e.target.name) store.setValue(e.target.name, e.target.type === 'checkbox' ? e.target.checked : e.target.value);
  });
  formEl.addEventListener('focusout', e => {
    if (!e.target.name) return;
    if (e.target.type === 'tel' && e.target.value.trim()) {
      const digits = e.target.value.replace(/\D/g,'');
      const normalized = digits.length === 10 ? '+1'+digits : (digits.length===11 && digits.startsWith('1') ? '+'+digits : e.target.value);
      store.setValue(e.target.name, normalized);
    }
    store.validate(e.target.name);
  });
  formEl.addEventListener('submit', e => store.submit(e));
  store.subscribe(render);
  render(store.getState());
  const { enableAddressSuggestions } = await import('./address-suggestions.js?v=20261119-1');
  enableAddressSuggestions(formEl);
  store.start();
} catch (error) {
  console.error('Contact inquiry form unavailable', error);
  formEl.innerHTML = '<p role="alert">The inquiry form could not load. Please try again or <a href="mailto:rjohnson@lennard.com?subject=Website%20property%20inquiry">email your inquiry</a>.</p>';
}
