import { createApi, completionSummary, titleSchema } from './api.js';

const request = createApi();
const list = document.querySelector('#experiments');
const status = document.querySelector('#status');
const retry = document.querySelector('#retry');
const form = document.querySelector('#add-form');
const titleInput = document.querySelector('#title');

function showError(error) {
  status.textContent = error.message;
  retry.hidden = false;
}

async function load() {
  retry.hidden = true;
  try {
    const experiments = await request('/api/experiments');
    list.replaceChildren();
    document.querySelector('#count').textContent = completionSummary(experiments);
    status.textContent = experiments.length ? '' : 'Your board is empty. Add an experiment above.';
    for (const item of experiments) {
      const row = document.createElement('li');
      const label = document.createElement('label');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = item.isComplete;
      const text = document.createElement('span');
      // Treat user input as text, never HTML.
      text.textContent = item.title;
      if (item.isComplete) text.className = 'complete';
      label.append(checkbox, text);
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'remove';
      remove.textContent = 'Delete';
      remove.setAttribute('aria-label', `Delete ${item.title}`);
      checkbox.addEventListener('change', async () => {
        checkbox.disabled = true;
        try {
          await request(`/api/experiments/${item.id}`, { method: 'PUT', body: JSON.stringify({ isComplete: checkbox.checked }) });
          await load();
        } catch (error) { checkbox.checked = item.isComplete; showError(error); }
        finally { checkbox.disabled = false; }
      });
      remove.addEventListener('click', async () => {
        remove.disabled = true;
        try { await request(`/api/experiments/${item.id}`, { method: 'DELETE' }); await load(); }
        catch (error) { showError(error); }
        finally { remove.disabled = false; }
      });
      row.append(label, remove);
      list.append(row);
    }
  } catch (error) { showError(error); }
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  const button = document.querySelector('#add-button');
  button.disabled = true;
  try {
    const parsed = titleSchema.safeParse(titleInput.value);
    if (!parsed.success) throw new Error(parsed.error.issues.map(issue => issue.message).join(' '));
    await request('/api/experiments', { method: 'POST', body: JSON.stringify({ title: parsed.data }) });
    form.reset();
    await load();
    titleInput.focus();
  } catch (error) { showError(error); }
  finally { button.disabled = false; }
});
retry.addEventListener('click', load);
load();
