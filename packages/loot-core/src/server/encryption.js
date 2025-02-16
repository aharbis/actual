import * as internals from './encryption-internals';

let uuid = require('../platform/uuid/index.electron.js');

// A map of all possible master encryption keys to use, keyed by
// unique id
let keys = {};

class Key {
  constructor({ id }) {
    this.id = id || uuid.v4Sync();
  }

  async createFromPassword({ password, salt }) {
    this.value = await internals.createKey({ secret: password, salt });
  }

  async createFromBase64(str) {
    this.value = await internals.importKey(str);
  }

  getId() {
    return this.id;
  }

  getValue() {
    return this.value;
  }

  serialize() {
    return {
      id: this.id,
      base64: this.value.base64,
    };
  }
}

export function getKey(keyId) {
  if (keyId == null || keys[keyId] == null) {
    throw new Error('missing-key');
  }
  return keys[keyId];
}

export function hasKey(keyId) {
  return keyId in keys;
}

export function encrypt(value, keyId) {
  return internals.encrypt(getKey(keyId), value);
}

export function decrypt(encrypted, meta) {
  return internals.decrypt(getKey(meta.keyId), encrypted, meta);
}

export function randomBytes(n) {
  return internals.randomBytes(n);
}

export async function loadKey(key) {
  let keyInstance;
  if (!(key instanceof Key)) {
    keyInstance = new Key({ id: key.id });
    await keyInstance.createFromBase64(key.base64);
  } else {
    keyInstance = key;
  }

  keys[keyInstance.getId()] = keyInstance;
}

export function unloadKey(key) {
  delete keys[key.getId()];
}

export function unloadAllKeys() {
  keys = {};
}

export async function createKey({ id, password, salt }) {
  let key = new Key({ id });
  await key.createFromPassword({ password, salt });
  return key;
}
