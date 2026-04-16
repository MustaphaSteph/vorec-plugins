import { readFileSync } from 'node:fs';

const actionTypes = new Set(['click', 'type', 'narrate', 'hover', 'scroll', 'select', 'wait', 'navigate']);

const file = process.argv[2];
if (!file) {
  console.error('Usage: node scripts/validate-tracked-actions.mjs <tracked-actions.json>');
  process.exit(2);
}

const actions = JSON.parse(readFileSync(file, 'utf8'));
const failures = [];

const check = (condition, message) => {
  if (!condition) failures.push(message);
};

check(Array.isArray(actions), 'tracked actions file must contain an array');

if (Array.isArray(actions)) {
  let previousTimestamp = -1;

  actions.forEach((action, index) => {
    const at = `[${index}]`;
    check(action && typeof action === 'object' && !Array.isArray(action), `${at} action must be an object`);
    if (!action || typeof action !== 'object' || Array.isArray(action)) return;

    check(actionTypes.has(action.type), `${at} invalid type: ${action.type}`);
    check(typeof action.name === 'string' && action.name.trim().length > 0, `${at} name is required`);
    check(typeof action.description === 'string' && action.description.trim().length > 0, `${at} description is required`);
    check(action.target === null || typeof action.target === 'string', `${at} target must be a string or null`);
    check(typeof action.timestamp === 'number' && Number.isFinite(action.timestamp) && action.timestamp >= 0, `${at} timestamp must be a non-negative number`);
    check(action.timestamp >= previousTimestamp, `${at} timestamp must be monotonic`);
    previousTimestamp = action.timestamp;

    const coords = action.coordinates;
    check(coords && typeof coords === 'object' && !Array.isArray(coords), `${at} coordinates are required`);
    if (coords && typeof coords === 'object' && !Array.isArray(coords)) {
      check(Number.isInteger(coords.x) && coords.x >= 0 && coords.x <= 1000, `${at} coordinates.x must be an integer from 0 to 1000`);
      check(Number.isInteger(coords.y) && coords.y >= 0 && coords.y <= 1000, `${at} coordinates.y must be an integer from 0 to 1000`);
    }

    check(typeof action.context === 'string' && action.context.trim().length > 0, `${at} context is required`);
    check(typeof action.narration === 'string' && action.narration.trim().length > 0, `${at} narration is required`);
    check(Number.isInteger(action.pause) && action.pause >= 1500, `${at} pause must be an integer >= 1500`);

    const words = action.narration.split(/\s+/).filter(Boolean).length;
    const minPause = Math.max(1500, Math.ceil(words * 350) + 500);
    check(action.pause >= minPause, `${at} pause ${action.pause}ms is too short for ${words} narration words; minimum is ${minPause}ms`);

    if (action.type === 'type') {
      check(typeof action.typed_text === 'string' && action.typed_text.length > 0, `${at} type action requires typed_text`);
    }
    if (action.type === 'select') {
      check(typeof action.selected_value === 'string' && action.selected_value.length > 0, `${at} select action requires selected_value`);
    }
    if ('primary' in action) {
      check(typeof action.primary === 'boolean', `${at} primary must be boolean when present`);
    }
  });
}

if (failures.length > 0) {
  console.error(failures.map((failure) => `- ${failure}`).join('\n'));
  process.exit(1);
}

console.log(`Tracked actions valid: ${file}`);
