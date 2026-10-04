function slugify(value) {
  return String(value || '')
    .normalize('NFKD').replace(/[^\w\s-]/g,'')
    .trim().toLowerCase().replace(/[-\s]+/g,'-').replace(/^-+|-+$/g,'');
}

function uniqueSlug(value, suffix) {
  const base = slugify(value);
  return suffix ? `${base}-${slugify(suffix)}` : base;
}

module.exports = { slugify, uniqueSlug };
