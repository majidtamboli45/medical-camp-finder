import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'data.json');

const DEFAULT_DATA = {
  users: [],
  camps: [],
  schemes: [],
  bookings: [],
  notifications: [],
  _counters: { users: 0, camps: 0, schemes: 0, bookings: 0, notifications: 0 },
};

function load() {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(DEFAULT_DATA, null, 2));
    return structuredClone(DEFAULT_DATA);
  }
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
}

function save(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

let _data = load();

function persist() {
  save(_data);
}

function nextId(table) {
  _data._counters[table] = (_data._counters[table] || 0) + 1;
  return _data._counters[table];
}

const db = {
  get data() { return _data; },
  reload() { _data = load(); },
  insert(table, record) {
    const id = nextId(table);
    const row = { ...record, id, created_at: record.created_at || new Date().toISOString() };
    _data[table].push(row);
    persist();
    return { lastInsertRowid: id };
  },
  find(table, predicate) {
    return _data[table].find(predicate) || null;
  },
  findAll(table, predicate) {
    return predicate ? _data[table].filter(predicate) : [..._data[table]];
  },
  update(table, id, updates) {
    const idx = _data[table].findIndex(r => r.id === id);
    if (idx === -1) return null;
    _data[table][idx] = { ..._data[table][idx], ...updates };
    persist();
    return _data[table][idx];
  },
  remove(table, id) {
    _data[table] = _data[table].filter(r => r.id !== id);
    persist();
  },
  count(table, predicate) {
    return predicate ? _data[table].filter(predicate).length : _data[table].length;
  },
};

export default db;
