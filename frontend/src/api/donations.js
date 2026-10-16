/**
 * MealBridge shared API client — B-01
 *
 * Every function maps 1-to-1 to an endpoint in backend/API_CONTRACT.md.
 * Returns parsed JSON on success, throws an Error with the server `detail`
 * string on failure. No business logic lives here.
 *
 * Person C and D: import these named functions directly —
 *
 *   import { getDonations, getDonation, ... } from '../api/donations';
 */

import { request } from './http.js';

/* ── Reads ─────────────────────────────────────────────────────── */

/** List recipient organisations (no credentials exposed). */
export function getRecipients() {
  return request('GET', '/recipients');
}

/**
 * List donations, newest first.
 * @param {object}  [opts]
 * @param {string}  [opts.donorId] – restrict to one donor; omit for all
 * @param {AbortSignal} [opts.signal]
 */
export function getDonations({ donorId, signal } = {}) {
  return request('GET', '/donations', {
    params: donorId ? { donor_id: donorId } : undefined,
    signal,
  });
}

/**
 * Single donation with events, rescue and splits.
 * @param {string} donationId
 * @param {{signal?: AbortSignal}} [opts]
 */
export function getDonation(donationId, { signal } = {}) {
  return request('GET', `/donations/${encodeURIComponent(donationId)}`, { signal });
}

/* ── Writes ────────────────────────────────────────────────────── */

/**
 * Create a new donation. The API assigns ID, timestamp and PENDING status.
 * @param {object} payload – { donor_id, food_name, quantity, unit,
 *                             pickup_deadline, latitude, longitude, notes? }
 * @returns {{ donation, event }}
 */
export function createDonation(payload) {
  return request('POST', '/donations', { body: payload });
}

/**
 * Trigger rule-based matching for a PENDING donation.
 * @param {string} donationId
 * @param {object} [payload] – { actor_id? }
 * @returns {{ donation, selected_recipient, candidates, matching_method,
 *             no_match_reason?, event? }}
 */
export function matchDonation(donationId, payload = {}) {
  return request('POST', `/donations/${encodeURIComponent(donationId)}/match`, {
    body: payload,
  });
}

/**
 * Cancel/fail the current match and generate a recovery plan.
 * @param {string} donationId
 * @param {object} payload – { recipient_id, reason, actor_id? }
 * @returns {{ donation, rescue, recovery_plan, events }}
 */
export function cancelDonation(donationId, payload) {
  return request('POST', `/donations/${encodeURIComponent(donationId)}/cancel`, {
    body: payload,
  });
}

/**
 * Record a recipient's acceptance (ordinary match or rescue split).
 * @param {string} donationId
 * @param {object} payload – { recipient_id, split_id?, actor_id? }
 * @returns {{ donation, split, event }}
 */
export function acceptDonation(donationId, payload) {
  return request('POST', `/donations/${encodeURIComponent(donationId)}/accept`, {
    body: payload,
  });
}

/**
 * Record a recipient-confirmed physical handover.
 * @param {string} donationId
 * @param {object} payload – { recipient_id, confirmed_quantity,
 *                             split_id?, actor_id? }
 * @returns {{ donation, split, confirmed_total, required_total, rescued, event }}
 */
export function confirmHandover(donationId, payload) {
  return request('POST', `/donations/${encodeURIComponent(donationId)}/handover`, {
    body: payload,
  });
}
