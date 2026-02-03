let idCounter = 0;

export function ensureId(element, prefix) {
  if (element.id) {
    return element.id;
  }
  idCounter += 1;
  const id = prefix + '-' + idCounter;
  element.id = id;
  return id;
}

export function generateId(prefix) {
  if (!prefix) prefix = 'id';
  idCounter += 1;
  return prefix + '-' + idCounter;
}
