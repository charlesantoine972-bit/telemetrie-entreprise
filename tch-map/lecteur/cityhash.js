// TCH Map — CityHash64 (Google CityHash 1.1) en JavaScript pur, utilisé par les archives HashFS de SCS.
// Copyright (C) 2026 Truck & Coach Hub — TCH Map. GNU General Public License v3 ou ultérieure.
// Porté depuis city.cc (Google, licence MIT), tel qu'utilisé par truckermudgeon/maps (GPL-3).
'use strict';

const M = (1n << 64n) - 1n;
const k0 = 0xc3a5c85c97cb3127n, k1 = 0xb492b66fbe98f273n, k2 = 0x9ae16a3b2f90404fn, k3 = 0xc949d7c7509e6557n;
const kMul = 0x9ddfea08eb382d69n;

const f64 = (b, i) => b.readBigUInt64LE(i);
const f32 = (b, i) => BigInt(b.readUInt32LE(i));
const mul = (a, b) => (a * b) & M;
const add = (...v) => v.reduce((s, x) => (s + x) & M, 0n);
const sub = (a, b) => (a - b) & M;
const rot = (v, s) => (s === 0 ? v : ((v >> BigInt(s)) | (v << BigInt(64 - s))) & M);
const shiftMix = (v) => v ^ (v >> 47n);

function hash16(u, v) {
  let a = mul(u ^ v, kMul); a ^= a >> 47n;
  let b = mul(v ^ a, kMul); b ^= b >> 47n;
  return mul(b, kMul);
}

function len0to16(s, len) {
  const L = BigInt(len);
  if (len > 8) {
    const a = f64(s, 0), b = f64(s, len - 8);
    return hash16(a, rot(add(b, L), len)) ^ b;
  }
  if (len >= 4) {
    const a = f32(s, 0);
    return hash16(add(L, (a << 3n) & M), f32(s, len - 4));
  }
  if (len > 0) {
    const y = BigInt(s[0]) + (BigInt(s[len >> 1]) << 8n);
    const z = L + (BigInt(s[len - 1]) << 2n);
    return mul(shiftMix(mul(y, k2) ^ mul(z, k3)), k2);
  }
  return k2;
}

function len17to32(s, len) {
  const a = mul(f64(s, 0), k1), b = f64(s, 8), c = mul(f64(s, len - 8), k2), d = mul(f64(s, len - 16), k0);
  return hash16(add(rot(sub(a, b), 43), rot(c, 30), d), add(sub(add(a, rot(b ^ k3, 20)), c), BigInt(len)));
}

function weak(w, x, y, z, a, b) {
  a = add(a, w);
  b = rot(add(b, a, z), 21);
  const c = a;
  a = add(a, x, y);
  b = add(b, rot(a, 44));
  return [add(a, z), add(b, c)];
}
const weakS = (s, i, a, b) => weak(f64(s, i), f64(s, i + 8), f64(s, i + 16), f64(s, i + 24), a, b);

function len33to64(s, len) {
  let z = f64(s, 24);
  let a = add(f64(s, 0), mul(add(BigInt(len), f64(s, len - 16)), k0));
  let b = rot(add(a, z), 52), c = rot(a, 37);
  a = add(a, f64(s, 8)); c = add(c, rot(a, 7)); a = add(a, f64(s, 16));
  const vf = add(a, z), vs = add(b, rot(a, 31), c);
  a = add(f64(s, 16), f64(s, len - 32)); z = f64(s, len - 8);
  b = rot(add(a, z), 52); c = rot(a, 37);
  a = add(a, f64(s, len - 24)); c = add(c, rot(a, 7)); a = add(a, f64(s, len - 16));
  const wf = add(a, z), ws = add(b, rot(a, 31), c);
  const r = shiftMix(add(mul(add(vf, ws), k2), mul(add(wf, vs), k0)));
  return mul(shiftMix(add(mul(r, k0), vs)), k2);
}

function city64(input) {
  const s = Buffer.isBuffer(input) ? input : Buffer.from(String(input), 'utf8');
  let len = s.length;
  if (len <= 16) return len0to16(s, len);
  if (len <= 32) return len17to32(s, len);
  if (len <= 64) return len33to64(s, len);
  let x = f64(s, len - 40);
  let y = add(f64(s, len - 16), f64(s, len - 56));
  let z = hash16(add(f64(s, len - 48), BigInt(len)), f64(s, len - 24));
  let v = weakS(s, len - 64, BigInt(len), z);
  let w = weakS(s, len - 32, add(y, k1), x);
  x = add(mul(x, k1), f64(s, 0));
  len = (len - 1) & ~63;
  let p = 0;
  do {
    x = mul(rot(add(x, y, v[0], f64(s, p + 8)), 37), k1);
    y = mul(rot(add(y, v[1], f64(s, p + 48)), 42), k1);
    x ^= w[1];
    y = add(y, v[0], f64(s, p + 40));
    z = mul(rot(add(z, w[0]), 33), k1);
    v = weakS(s, p, mul(v[1], k1), add(x, w[0]));
    w = weakS(s, p + 32, add(z, w[1]), add(y, f64(s, p + 16)));
    [z, x] = [x, z];
    p += 64; len -= 64;
  } while (len !== 0);
  return hash16(add(hash16(v[0], w[0]), mul(shiftMix(y), k1), z), add(hash16(v[1], w[1]), x));
}

module.exports = { city64 };
