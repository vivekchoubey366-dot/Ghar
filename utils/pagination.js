function paginate({ page = 1, limit = 20, total = 0 } = {}) {
  page = Math.max(1, Number(page) || 1);
  limit = Math.min(100, Math.max(1, Number(limit) || 20));
  const pages = Math.ceil(total / limit);
  return {
    page, limit, total, pages,
    hasNext: page < pages,
    hasPrevious: page > 1,
    offset: (page - 1) * limit
  };
}

function parsePagination(query = {}) {
  return paginate({ page: query.page, limit: query.limit, total: 0 });
}

module.exports = { paginate, parsePagination };
