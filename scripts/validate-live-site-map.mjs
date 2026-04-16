import { readFileSync } from 'node:fs';

const recordingTypes = new Set(['task_tutorial', 'website_tour', 'bug_reproduction', 'ux_review']);
const readinessKeys = [
  'entry_action_known',
  'required_fields_known',
  'valid_demo_values_known',
  'primary_buttons_known',
  'success_state_known',
  'blockers_reviewed',
  'sensitive_actions_reviewed',
];

const file = process.argv[2];
if (!file) {
  console.error('Usage: node scripts/validate-live-site-map.mjs <live-site-map.json>');
  process.exit(2);
}

const map = JSON.parse(readFileSync(file, 'utf8'));
const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};

check(map && typeof map === 'object' && !Array.isArray(map), 'map must be an object');

if (map && typeof map === 'object' && !Array.isArray(map)) {
  check(typeof map.url === 'string' && map.url.length > 0, 'url is required');
  check(recordingTypes.has(map.recording_type), `invalid recording_type: ${map.recording_type}`);
  check(typeof map.goal === 'string' && map.goal.length > 0, 'goal is required');
  check(map.auth && typeof map.auth === 'object', 'auth object is required');
  if (map.auth && typeof map.auth === 'object') {
    check(typeof map.auth.required === 'boolean', 'auth.required must be boolean');
    check(typeof map.auth.evidence === 'string' && map.auth.evidence.length > 0, 'auth.evidence is required');
  }

  check(Array.isArray(map.pages) && map.pages.length > 0, 'pages must be a non-empty array');
  if (Array.isArray(map.pages)) {
    let primaryActions = 0;
    let primaryButtons = 0;
    let successStates = 0;

    map.pages.forEach((page, pageIndex) => {
      const at = `pages[${pageIndex}]`;
      check(page && typeof page === 'object' && !Array.isArray(page), `${at} must be an object`);
      if (!page || typeof page !== 'object' || Array.isArray(page)) return;

      check(typeof page.url === 'string' && page.url.length > 0, `${at}.url is required`);
      check(typeof page.purpose === 'string' && page.purpose.length > 0, `${at}.purpose is required`);

      for (const key of ['headings', 'actions', 'fields', 'buttons', 'risks']) {
        if (key in page) check(Array.isArray(page[key]), `${at}.${key} must be an array`);
      }

      if (Array.isArray(page.actions)) {
        page.actions.forEach((action, actionIndex) => {
          const where = `${at}.actions[${actionIndex}]`;
          check(typeof action.label === 'string' && action.label.length > 0, `${where}.label is required`);
          check(typeof action.role === 'string' && action.role.length > 0, `${where}.role is required`);
          check(typeof action.selector === 'string' && action.selector.length > 0, `${where}.selector is required`);
          check(typeof action.result === 'string' && action.result.length > 0, `${where}.result is required`);
          if (action.primary === true) primaryActions++;
        });
      }

      if (Array.isArray(page.fields)) {
        page.fields.forEach((field, fieldIndex) => {
          const where = `${at}.fields[${fieldIndex}]`;
          check(typeof field.label === 'string' && field.label.length > 0, `${where}.label is required`);
          check(typeof field.selector === 'string' && field.selector.length > 0, `${where}.selector is required`);
          check(typeof field.required === 'boolean' || field.required === 'unknown', `${where}.required must be boolean or "unknown"`);
          check('valid_demo_value' in field, `${where}.valid_demo_value is required; use null only when the script will not fill it`);
          check(typeof field.evidence === 'string' && field.evidence.length > 0, `${where}.evidence is required`);
        });
      }

      if (Array.isArray(page.buttons)) {
        page.buttons.forEach((button, buttonIndex) => {
          const where = `${at}.buttons[${buttonIndex}]`;
          check(typeof button.label === 'string' && button.label.length > 0, `${where}.label is required`);
          check(typeof button.selector === 'string' && button.selector.length > 0, `${where}.selector is required`);
          check(typeof button.initial_state === 'string' && button.initial_state.length > 0, `${where}.initial_state is required`);
          if (button.primary === true) primaryButtons++;
        });
      }

      if (page.success_state) {
        successStates++;
        check(typeof page.success_state.selector === 'string' && page.success_state.selector.length > 0, `${at}.success_state.selector is required`);
        check(typeof page.success_state.evidence === 'string' && page.success_state.evidence.length > 0, `${at}.success_state.evidence is required`);
      }
    });

    if (map.recording_type === 'task_tutorial') {
      check(primaryActions + primaryButtons > 0, 'task_tutorial requires at least one primary action or button');
      check(successStates > 0, 'task_tutorial requires at least one success_state');
    }
  }

  check(Array.isArray(map.blockers), 'blockers must be an array');
  check(Array.isArray(map.sensitive_actions), 'sensitive_actions must be an array');
  check(map.readiness && typeof map.readiness === 'object', 'readiness object is required');
  if (map.readiness && typeof map.readiness === 'object') {
    for (const key of readinessKeys) {
      check(typeof map.readiness[key] === 'boolean', `readiness.${key} must be boolean`);
      check(map.readiness[key] === true, `readiness.${key} must be true before recording`);
    }
  }
}

if (failures.length > 0) {
  console.error(failures.map((failure) => `- ${failure}`).join('\n'));
  process.exit(1);
}

console.log(`Live site map valid: ${file}`);
