// The one link builder every submission surface uses (docs/submissions-spec.md section 4.3).
// Pure: it takes routing.json and repos.json already read and returns a URL or throws. It puts only
// what the page already knows into the link (form, an ID, a short title stub), never what a person
// writes, and only ever points at a repo in repos.json or the mailbot's one address.
// Works in a browser and in Node.

const TARGET = /^(ref:[a-z0-9-]+(#[A-Za-z0-9._-]+)?|gap:[a-z0-9-]+|check:[a-z0-9-]+|[a-z0-9][a-z0-9/._#-]*)$/;
const TITLE = /^[A-Za-z0-9 .,:()'/_#-]*$/;

export function findRoute(routing, type, area) {
  const route = routing.routes.find((r) => r.type === type && r.area === area);
  if (!route) throw new Error(`no route for type "${type}" and area "${area}"`);
  return route;
}

export function submissionUrl(routing, repos, { type, area, target = '', title = '' }) {
  const route = findRoute(routing, type, area);
  if (route.mail) {
    const subject = routing.types[type].subject;
    return `mailto:${routing.mail.address}?subject=${encodeURIComponent(subject)}`;
  }
  const entry = repos.repos.find((r) => r.name === route.repo);
  if (!entry) throw new Error(`route names "${route.repo}", which is not in repos.json`);
  if (target && (target.length > 120 || !TARGET.test(target))) throw new Error(`target "${target}" is not an ID or path`);
  if (title && (title.length > 80 || !TITLE.test(title))) throw new Error('title stub must be short plain text');
  const q = new URLSearchParams({ template: route.form });
  if (title) q.set('title', title);
  if (target) q.set('target', target);
  return `https://github.com/${entry.repo}/issues/new?${q}`;
}
