const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

/**
 * Parse page and pageSize from URL search params, clamping to safe bounds.
 */
function parsePageParams(params) {
  const page = Math.max(1, Number.parseInt(params.get('page'), 10) || 1);
  const requested = Number.parseInt(params.get('pageSize'), 10) || DEFAULT_PAGE_SIZE;
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, requested));
  return { page, pageSize };
}

/**
 * Slice an array into one page of results plus paging metadata.
 *
 * Returns:
 *   { items, page, pageSize, total, totalPages, hasNext, hasPrev }
 */
function paginate(items, page = 1, pageSize = DEFAULT_PAGE_SIZE) {
  if (!Array.isArray(items)) throw new TypeError('items must be an array');
  if (!Number.isInteger(page) || page < 1) throw new RangeError('page must be a positive integer');
  if (!Number.isInteger(pageSize) || pageSize < 1) throw new RangeError('pageSize must be a positive integer');

  const total = items.length;
  const totalPages = Math.floor(total / pageSize);
  const start = (page - 1) * pageSize;
  const pageItems = items.slice(start, start + pageSize);

  return {
    items: pageItems,
    page,
    pageSize,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

module.exports = { paginate, parsePageParams, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE };
