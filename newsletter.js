// The public Wix client uses anonymous visitor permissions only.
const formEl = document.querySelector('#quarterly-signup');
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
try {
  const { createFormStore, FORM_ERROR } = await import('./wix-form-store.js');
  const store = createFormStore({formId: '1c47d67d-e82a-45f3-9b03-a451d0e5eefe'});
  let signature = '';
  function render(s) {
    if (s.outcome) {
      signature = "";
      formEl.innerHTML = '<h3>Thank you for subscribing.</h3><p role="status">'+esc(s.outcome.message || 'Your signup has been received.')+'</p><a class="text-link" href="market-update.html">Read the latest report →</a>';
      return;
    }
    if (!s.form) {
      formEl.innerHTML = '<p role="status">'+esc(s.errors[FORM_ERROR] || 'Loading the signup form…')+'</p>';
      return;
    }
    if (s.closed) {
      formEl.innerHTML = '<p role="status">'+esc(s.form.disabledMessage || 'Subscriptions are currently closed.')+'</p>';
      return;
    }
    const fields = s.form.fields.filter(f => !s.form.steps.length || f.stepId === s.form.steps[s.step].id);
    const key = JSON.stringify(fields);
    if (key !== signature) {
      signature = key;
      formEl.innerHTML = fields.map(f => {
        const id = 'signup-'+f.target;
        const attrs = ' id="'+esc(id)+'" name="'+esc(f.target)+'"'+(f.required?' required':'')+(f.readOnly?' disabled':'')+' aria-describedby="'+esc(id)+'-error"';
        const label = esc(f.label)+(f.required?' *':'');
        let control;
        if (f.control === 'checkbox') control='<label class="consent-label" for="'+esc(id)+'"><input type="checkbox"'+attrs+'><span>'+label+'</span></label>';
        else {
          control='<label for="'+esc(id)+'">'+label+'</label>';
          if (f.control === 'select') control+='<select'+attrs+'><option value="">Select an area (optional)</option>'+f.choices.map(c=>'<option value="'+esc(c.value)+'">'+esc(c.label)+'</option>').join('')+'</select>';
          else if (f.control === 'textarea') control+='<textarea'+attrs+'></textarea>';
          else if (['text','email','phone','url','number','date'].includes(f.control)) control+='<input type="'+(f.control==='phone'?'tel':f.control)+'"'+attrs+' placeholder="'+esc(f.placeholder || '')+'">';
          else control+='<p>This field needs assistance. Please email us using the address below.</p>';
        }
        return '<div class="signup-field">'+control+(f.description?'<p class="small">'+esc(f.description)+'</p>':'')+'<p class="signup-error" id="'+esc(id)+'-error" role="alert"></p></div>';
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
    button.textContent = s.loading ? 'Submitting…' : (s.form.submitText || 'Subscribe');
  }
  formEl.addEventListener('input', e => {
    if (e.target.name) store.setValue(e.target.name, e.target.type === 'checkbox' ? e.target.checked : e.target.value);
  });
  formEl.addEventListener('focusout', e => {if (e.target.name) store.validate(e.target.name);});
  formEl.addEventListener('submit', e => store.submit(e));
  store.subscribe(render);
  render(store.getState());
  store.start();
} catch (error) {
  console.error('Quarterly subscription form unavailable', error);
  formEl.innerHTML = '<p role="alert">The signup form could not load. Please try again or <a href="mailto:rjohnson@lennard.com?subject=Quarterly%20market%20update%20subscription">email your subscription request</a>.</p>';
}
