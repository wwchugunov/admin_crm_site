(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.OrbitIndustries = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  // Business types. Each one decides what the app calls clients, specialists and places
  // (a clinic has patients, doctors and rooms; a car service has masters and bays)
  // and which extra client fields it shows. Data is the same for all types.

  // Nouns that decline like "клієнт" keep their endings, so only the stem changes.
  const STEMS = {
    patient: { uk: "пацієнт", en: ["patient", "patients"] },
    student: { uk: "студент", en: ["student", "students"] },
    room: { uk: "кабінет", en: ["room", "rooms"] },
    bay: { uk: "пост", en: ["bay", "bays"] },
    box: { uk: "бокс", en: ["bay", "bays"] },
    hall: { uk: "зал", en: ["hall", "halls"] },
    classroom: { uk: "клас", en: ["classroom", "classrooms"] },
  };
  // "Спеціаліст" in every case form, and the same forms for each replacement.
  const SPECIALIST_FORMS = ["спеціаліст", "спеціаліста", "спеціалісту", "спеціалістом", "спеціалісті", "спеціалісти", "спеціалістів", "спеціалістам", "спеціалістами", "спеціалістах"];
  const PEOPLE = {
    doctor: { uk: ["лікар", "лікаря", "лікарю", "лікарем", "лікарі", "лікарі", "лікарів", "лікарям", "лікарями", "лікарях"], en: ["doctor", "doctors"] },
    master: { uk: ["майстер", "майстра", "майстру", "майстром", "майстрі", "майстри", "майстрів", "майстрам", "майстрами", "майстрах"], en: ["mechanic", "mechanics"] },
    washer: { uk: ["мийник", "мийника", "мийнику", "мийником", "мийнику", "мийники", "мийників", "мийникам", "мийниками", "мийниках"], en: ["detailer", "detailers"] },
    teacher: { uk: ["викладач", "викладача", "викладачу", "викладачем", "викладачі", "викладачі", "викладачів", "викладачам", "викладачами", "викладачах"], en: ["teacher", "teachers"] },
    coach: { uk: ["тренер", "тренера", "тренеру", "тренером", "тренері", "тренери", "тренерів", "тренерам", "тренерами", "тренерах"], en: ["coach", "coaches"] },
    groomer: { uk: ["грумер", "грумера", "грумеру", "грумером", "грумері", "грумери", "грумерів", "грумерам", "грумерами", "грумерах"], en: ["groomer", "groomers"] },
  };
  const TYPES = [
    { id: "beauty", uk: "Краса та догляд", en: "Beauty and care" },
    { id: "medical", uk: "Медицина та клініки", en: "Medicine and clinics", client: "patient", specialist: "doctor", place: "room" },
    { id: "dental", uk: "Стоматологія", en: "Dentistry", client: "patient", specialist: "doctor", place: "room" },
    { id: "auto", uk: "СТО та автосервіс", en: "Car service and repair", specialist: "master", place: "bay", fields: ["vehicle", "plate"] },
    { id: "carwash", uk: "Автомийка та детейлінг", en: "Car wash and detailing", specialist: "washer", place: "box", fields: ["vehicle", "plate"] },
    { id: "education", uk: "Освіта та репетитори", en: "Education and tutoring", client: "student", specialist: "teacher", place: "classroom" },
    { id: "sport", uk: "Спорт і фітнес", en: "Sport and fitness", specialist: "coach", place: "hall" },
    { id: "pets", uk: "Грумінг і догляд за тваринами", en: "Grooming and pet care", specialist: "groomer", fields: ["pet"] },
    { id: "universal", uk: "Інший бізнес", en: "Other business" },
  ];
  const IDS = TYPES.map((t) => t.id);
  const find = (id) => TYPES.find((t) => t.id === id) || TYPES[0];
  const capital = (word, like) => (like[0] === like[0].toUpperCase() ? word[0].toUpperCase() + word.slice(1) : word);
  function swapStem(text, from, to) {
    return text.replace(new RegExp(`(?<![\\p{L}])(${from})(\\p{L}*)`, "giu"), (m, stem, tail) => capital(to, stem) + tail);
  }
  function swapForms(text, from, to) {
    return text.replace(new RegExp(`(?<![\\p{L}])(${from.join("|")})(?![\\p{L}])`, "giu"), (m) => capital(to[from.indexOf(m.toLowerCase())], m));
  }
  function swapEnglish(text, [one, many], [toOne, toMany]) {
    return text.replace(new RegExp(`\\b(${one}s?)\\b`, "gi"), (m) => capital(m.toLowerCase().endsWith("s") ? toMany : toOne, m));
  }
  // Rewrites every message for a business type; untouched for types that keep the neutral words.
  function words(text, language, type) {
    const t = find(type);
    if (typeof text !== "string") return text;
    if (language === "en") {
      if (t.client) text = swapEnglish(text, ["client", "clients"], STEMS[t.client].en);
      if (t.specialist) text = swapEnglish(text, ["specialist", "specialists"], PEOPLE[t.specialist].en);
      if (t.place) text = swapEnglish(text, ["resource", "resources"], STEMS[t.place].en);
      return text;
    }
    if (t.client) text = swapStem(text, "клієнт", STEMS[t.client].uk);
    if (t.specialist) text = swapForms(text, SPECIALIST_FORMS, PEOPLE[t.specialist].uk);
    if (t.place) text = swapStem(text, "ресурс", STEMS[t.place].uk);
    return text;
  }
  function apply(messages, type) {
    for (const value of Object.values(messages))
      for (const language of ["uk", "en"]) if (typeof value[language] === "string") value[language] = words(value[language], language, type);
  }
  return { TYPES, IDS, find, words, apply, fields: (id) => find(id).fields || [] };
});
