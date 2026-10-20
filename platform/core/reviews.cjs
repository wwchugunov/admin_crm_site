"use strict";
// Asking for a review after a visit. Two hours after a completed visit the company bot asks the client to rate it;
// 4–5 stars lead to the company's Google review page, 1–3 go to the team so they can put things right.
const ASK_AFTER = 2 * 3600000,
  ASK_WITHIN = 24 * 3600000,
  ONCE_PER = 14 * 86400000;
const reviews = {
  reviewSchema() {
    for (const [column, definition] of [
      ["rating", "INTEGER CHECK(rating BETWEEN 1 AND 5)"],
      ["review_asked", "INTEGER"],
    ])
      if (!this.db.prepare("PRAGMA table_info(appointments)").all().some((c) => c.name === column))
        this.db.exec(`ALTER TABLE appointments ADD COLUMN ${column} ${definition}`);
  },
  reviewSettings() {
    const s = this.get("reviews") || {};
    return { enabled: Boolean(s.enabled), url: s.url || "" };
  },
  setReviews(data) {
    const url = String(data?.url || "").trim();
    if (url && (!/^https:\/\/[^\s]+$/.test(url) || url.length > 500))
      throw Error("Вставте посилання на відгуки, що починається з https:// / Paste a review link starting with https://");
    if (data?.enabled === true && !url) throw Error("Спершу вставте посилання на відгуки в Google / Paste the Google review link first");
    this.set("reviews", { enabled: data?.enabled === true, url });
    return this.reviewSettings();
  },
  // Completed visits 2–24 hours ago whose client has the bot and was not asked in the last two weeks.
  dueReviews(now = Date.now()) {
    if (!this.reviewSettings().enabled) return [];
    return this.db
      .prepare(
        "SELECT a.id,a.client_id,c.chat_id,s.name service_name FROM appointments a JOIN clients c ON c.id=a.client_id JOIN services s ON s.id=a.service_id WHERE a.status='completed' AND a.review_asked IS NULL AND a.end<=? AND a.end>? AND c.chat_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM appointments x WHERE x.client_id=a.client_id AND x.review_asked>?) ORDER BY a.end LIMIT 20",
      )
      .all(now - ASK_AFTER, now - ASK_WITHIN, now - ONCE_PER);
  },
  markReviewAsked(id) {
    this.db.prepare("UPDATE appointments SET review_asked=? WHERE id=?").run(Date.now(), id);
  },
  // The client's own answer; a second tap does not change it.
  rateVisit(id, clientId, rating) {
    const n = Number(rating);
    if (!Number.isInteger(n) || n < 1 || n > 5) return false;
    return Boolean(
      this.db.prepare("UPDATE appointments SET rating=? WHERE id=? AND client_id=? AND rating IS NULL AND review_asked IS NOT NULL").run(n, id, clientId).changes,
    );
  },
};
module.exports = { reviews, ASK_AFTER };
