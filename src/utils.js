export function safeStr(val) {
  if (val == null) return '';
  const s = String(val).trim();
  return ['none', 'null', 'nan'].includes(s.toLowerCase()) ? '' : s;
}

export function listToStr(key, obj) {
  const val = obj?.[key];
  return Array.isArray(val) ? val.map(safeStr).join(', ') : safeStr(val);
}

export function similarity(a, b) {
  const s1 = String(a).toLowerCase();
  const s2 = String(b).toLowerCase();
  if (!s1 || !s2) return 0;
  const longer  = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  const longerLen = longer.length;
  if (longerLen === 0) return 1;
  return (longerLen - editDistance(longer, shorter)) / longerLen;
}

function editDistance(s1, s2) {
  const costs = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1[i - 1] !== s2[j - 1]) {
          newValue = Math.min(newValue, lastValue, costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}

const ROLE_KEYWORDS = [
  'director', 'manager', 'head', 'chief', 'lead', 'president', 'vp',
  'officer', 'executive', 'founder', 'owner', 'consultant', 'partner',
  'associate', 'specialist', 'analyst',
];

export function isLikelyARole(text) {
  const lower = String(text).toLowerCase();
  return ROLE_KEYWORDS.some(r => lower.includes(r));
}

export function flattenApolloData(contactId, apolloJson, status) {
  const p = apolloJson?.person ?? {};
  const o = p?.organization ?? {};

  const phonesStr = (p.phone_numbers ?? [])
    .map(x => safeStr(x.sanitized_number ?? x.raw_number))
    .join(', ');

  const emailsStr = (p.personal_emails ?? []).map(safeStr).join(', ');
  const orgPhone  = safeStr(o.primary_phone?.sanitized_number);

  return {
    contact_id:            safeStr(contactId),
    status:                safeStr(status),
    apollo_id:             safeStr(p.id),
    full_name:             safeStr(p.name),
    first_name:            safeStr(p.first_name),
    last_name:             safeStr(p.last_name),
    linkedin_url:          safeStr(p.linkedin_url),
    photo_url:             safeStr(p.photo_url),
    job_title:             safeStr(p.title),
    headline:              safeStr(p.headline),
    seniority:             safeStr(p.seniority),
    departments:           listToStr('departments', p),
    subdepartments:        listToStr('subdepartments', p),
    functions:             listToStr('functions', p),
    work_email:            safeStr(p.email),
    email_status:          safeStr(p.email_status),
    personal_email:        emailsStr,
    direct_phones:         phonesStr,
    city:                  safeStr(p.city),
    state:                 safeStr(p.state),
    country:               safeStr(p.country),
    twitter:               safeStr(p.twitter_url),
    github:                safeStr(p.github_url),
    facebook:              safeStr(p.facebook_url),
    org_name:              safeStr(o.name),
    org_domain:            safeStr(o.primary_domain),
    org_website:           safeStr(o.website_url),
    org_linkedin:          safeStr(o.linkedin_url),
    org_twitter:           safeStr(o.twitter_url),
    org_facebook:          safeStr(o.facebook_url),
    org_phone:             orgPhone,
    org_industry:          safeStr(o.industry),
    org_keywords:          listToStr('keywords', o),
    org_employees:         safeStr(o.estimated_num_employees),
    org_founded:           safeStr(o.founded_year),
    alexa_rank:            safeStr(o.alexa_ranking),
    annual_revenue:        safeStr(o.annual_revenue_printed),
    total_funding:         safeStr(o.total_funding_printed),
    latest_funding_stage:  safeStr(o.latest_funding_stage),
    latest_funding_date:   safeStr(o.latest_funding_round_date),
    techs_used:            listToStr('technology_names', o),
    org_address:           safeStr(o.raw_address),
    org_city:              safeStr(o.city),
    org_state:             safeStr(o.state),
  };
}
