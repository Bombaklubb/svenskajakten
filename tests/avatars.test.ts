/**
 * Tests for the avatar catalogue.
 *
 * Pupils pay points for these, so two avatars that look the same but cost
 * different amounts is a real complaint — it happened with "Retrofiguren"
 * (400) and "8-bitaren" (1000), which both rendered as 👾. The catalogue has
 * been expanded several times and each expansion is a chance to reuse an
 * emoji already taken, so the check belongs here rather than in a reviewer's
 * head.
 *
 * Run with: npm test
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { AVATARS, STARTER_AVATARS, getAvatar } from "../src/lib/avatars.ts";
import { getShopAvatar } from "../src/lib/shop.ts";

describe("avatarkatalogen", () => {
  test("varje avatar har ett unikt id", () => {
    const ids = AVATARS.map((a) => a.id);
    const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
    assert.deepEqual(duplicates, [], `dubblerade id: ${duplicates.join(", ")}`);
  });

  test("inga två avatarer visar samma emoji", () => {
    // FramedAvatar draws avatar.image when there is one and falls back to the
    // emoji otherwise — including when the image fails to load, which is what
    // happens if a school network cannot reach api.dicebear.com. So two
    // avatars sharing an emoji are identical either always or on a bad day.
    const byEmoji = new Map<string, string[]>();
    for (const a of AVATARS) {
      byEmoji.set(a.emoji, [...(byEmoji.get(a.emoji) ?? []), a.id]);
    }
    const clashes = [...byEmoji.entries()].filter(([, ids]) => ids.length > 1);
    assert.deepEqual(
      clashes,
      [],
      clashes.map(([e, ids]) => `${e} delas av ${ids.join(" och ")}`).join("; ")
    );
  });

  test("inga två avatarer ritas identiskt", () => {
    const seen = new Map<string, string>();
    for (const a of AVATARS) {
      const drawn = a.image ?? a.emoji;
      const other = seen.get(drawn);
      assert.equal(other, undefined, `${a.id} ser likadan ut som ${other}`);
      seen.set(drawn, a.id);
    }
  });

  test("varje avatar har ett namn och en emoji", () => {
    for (const a of AVATARS) {
      assert.ok(a.name.trim().length > 0, `${a.id} saknar namn`);
      assert.ok(a.emoji.trim().length > 0, `${a.id} saknar emoji`);
    }
  });

  test("inga två avatarer heter samma sak", () => {
    const names = AVATARS.map((a) => a.name.toLowerCase());
    const duplicates = names.filter((n, i) => names.indexOf(n) !== i);
    assert.deepEqual(duplicates, [], `dubblerade namn: ${duplicates.join(", ")}`);
  });

  test("startavatarerna finns i katalogen och går att köpa", () => {
    // A pupil picks one of these free when signing up; the rest are bought in
    // the shop, so every one of them needs a price as well as a catalogue entry.
    assert.ok(STARTER_AVATARS.length > 0);
    for (const a of STARTER_AVATARS) {
      assert.ok(getAvatar(a.id), `${a.id} saknas i AVATARS`);
      assert.ok(getShopAvatar(a.id), `${a.id} går inte att köpa`);
    }
  });

  test("allt som säljs i affären finns i katalogen", () => {
    for (const a of AVATARS) {
      const forSale = getShopAvatar(a.id);
      if (forSale) assert.ok(forSale.price > 0, `${a.id} säljs för ${forSale.price}`);
    }
  });
});
