import axios from 'axios';
import { APOLLO_API_KEY } from './config.js';
import { isLikelyARole, similarity } from './utils.js';

const BASE = 'https://api.apollo.io/v1';

async function callApollo(endpoint, payload) {
  const body = { ...payload, reveal_personal_emails: true, reveal_emails: true };
  delete body.api_key;

  try {
    const { data } = await axios.post(`${BASE}${endpoint}`, body, {
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': APOLLO_API_KEY,
      },
      timeout: 15_000,
    });
    return data;
  } catch (err) {
    if (err.response) {
      console.warn(`Apollo ${endpoint} → ${err.response.status}`, err.response.data);
    }
    return null;
  }
}

export async function searchContact({ email, firstName, lastName, company, position }) {
  // 1. Email directo
  if (email?.includes('@')) {
    const res = await callApollo('/people/match', { email });
    if (res?.person) return { data: res, status: 'found_by_email' };
  }

  // 2. Nombre + empresa
  if (firstName && lastName && company) {
    const res = await callApollo('/people/match', {
      first_name: firstName,
      last_name: lastName,
      organization_name: company,
    });
    if (res?.person) return { data: res, status: 'found_by_company' };
  }

  // 3. Nombre + cargo (cuando el cargo parece nombre de empresa)
  if (firstName && lastName && position && !isLikelyARole(position)) {
    const res = await callApollo('/people/match', {
      first_name: firstName,
      last_name: lastName,
      organization_name: position,
    });
    if (res?.person) return { data: res, status: 'found_by_position' };
  }

  // 4. Búsqueda por keywords
  if (firstName && lastName) {
    const res = await callApollo('/mixed_people/search', {
      q_keywords: `${firstName} ${lastName}`,
      page: 1,
    });
    if (res?.people?.length) {
      const people = res.people;
      const best = people.length > 1 && position
        ? people.reduce((a, b) =>
            similarity(position, b.title ?? '') > similarity(position, a.title ?? '') ? b : a
          )
        : people[0];
      return { data: { person: best }, status: 'found_by_search' };
    }
  }

  return { data: null, status: 'not_found' };
}
