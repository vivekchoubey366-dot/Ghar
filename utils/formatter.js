function currency(amount, currency = 'INR', locale = 'en-IN') {
  return new Intl.NumberFormat(locale, { style:'currency', currency, maximumFractionDigits:2 }).format(Number(amount)||0);
}

function number(value, locale = 'en-IN') {
  return new Intl.NumberFormat(locale).format(Number(value)||0);
}

function date(value, locale = 'en-IN') {
  return new Intl.DateTimeFormat(locale, { dateStyle:'medium' }).format(new Date(value));
}

function dateTime(value, locale = 'en-IN') {
  return new Intl.DateTimeFormat(locale, { dateStyle:'medium', timeStyle:'short' }).format(new Date(value));
}

module.exports = { currency, number, date, dateTime };
