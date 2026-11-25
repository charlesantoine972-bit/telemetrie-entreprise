"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// ../node_modules/consola/dist/chunks/prompt.mjs
var prompt_exports = {};
__export(prompt_exports, {
  kCancel: () => kCancel,
  prompt: () => prompt
});
function getDefaultExportFromCjs(x2) {
  return x2 && x2.__esModule && Object.prototype.hasOwnProperty.call(x2, "default") ? x2["default"] : x2;
}
function requireSrc() {
  if (hasRequiredSrc) return src;
  hasRequiredSrc = 1;
  const ESC = "\x1B";
  const CSI = `${ESC}[`;
  const beep = "\x07";
  const cursor = {
    to(x2, y3) {
      if (!y3) return `${CSI}${x2 + 1}G`;
      return `${CSI}${y3 + 1};${x2 + 1}H`;
    },
    move(x2, y3) {
      let ret = "";
      if (x2 < 0) ret += `${CSI}${-x2}D`;
      else if (x2 > 0) ret += `${CSI}${x2}C`;
      if (y3 < 0) ret += `${CSI}${-y3}A`;
      else if (y3 > 0) ret += `${CSI}${y3}B`;
      return ret;
    },
    up: (count = 1) => `${CSI}${count}A`,
    down: (count = 1) => `${CSI}${count}B`,
    forward: (count = 1) => `${CSI}${count}C`,
    backward: (count = 1) => `${CSI}${count}D`,
    nextLine: (count = 1) => `${CSI}E`.repeat(count),
    prevLine: (count = 1) => `${CSI}F`.repeat(count),
    left: `${CSI}G`,
    hide: `${CSI}?25l`,
    show: `${CSI}?25h`,
    save: `${ESC}7`,
    restore: `${ESC}8`
  };
  const scroll = {
    up: (count = 1) => `${CSI}S`.repeat(count),
    down: (count = 1) => `${CSI}T`.repeat(count)
  };
  const erase = {
    screen: `${CSI}2J`,
    up: (count = 1) => `${CSI}1J`.repeat(count),
    down: (count = 1) => `${CSI}J`.repeat(count),
    line: `${CSI}2K`,
    lineEnd: `${CSI}K`,
    lineStart: `${CSI}1K`,
    lines(count) {
      let clear = "";
      for (let i2 = 0; i2 < count; i2++)
        clear += this.line + (i2 < count - 1 ? cursor.up() : "");
      if (count)
        clear += cursor.left;
      return clear;
    }
  };
  src = { cursor, scroll, erase, beep };
  return src;
}
function requirePicocolors() {
  if (hasRequiredPicocolors) return picocolors.exports;
  hasRequiredPicocolors = 1;
  let p = process || {}, argv2 = p.argv || [], env2 = p.env || {};
  let isColorSupported2 = !(!!env2.NO_COLOR || argv2.includes("--no-color")) && (!!env2.FORCE_COLOR || argv2.includes("--color") || p.platform === "win32" || (p.stdout || {}).isTTY && env2.TERM !== "dumb" || !!env2.CI);
  let formatter = (open, close, replace = open) => (input) => {
    let string = "" + input, index = string.indexOf(close, open.length);
    return ~index ? open + replaceClose2(string, close, replace, index) + close : open + string + close;
  };
  let replaceClose2 = (string, close, replace, index) => {
    let result = "", cursor = 0;
    do {
      result += string.substring(cursor, index) + replace;
      cursor = index + close.length;
      index = string.indexOf(close, cursor);
    } while (~index);
    return result + string.substring(cursor);
  };
  let createColors2 = (enabled = isColorSupported2) => {
    let f3 = enabled ? formatter : () => String;
    return {
      isColorSupported: enabled,
      reset: f3("\x1B[0m", "\x1B[0m"),
      bold: f3("\x1B[1m", "\x1B[22m", "\x1B[22m\x1B[1m"),
      dim: f3("\x1B[2m", "\x1B[22m", "\x1B[22m\x1B[2m"),
      italic: f3("\x1B[3m", "\x1B[23m"),
      underline: f3("\x1B[4m", "\x1B[24m"),
      inverse: f3("\x1B[7m", "\x1B[27m"),
      hidden: f3("\x1B[8m", "\x1B[28m"),
      strikethrough: f3("\x1B[9m", "\x1B[29m"),
      black: f3("\x1B[30m", "\x1B[39m"),
      red: f3("\x1B[31m", "\x1B[39m"),
      green: f3("\x1B[32m", "\x1B[39m"),
      yellow: f3("\x1B[33m", "\x1B[39m"),
      blue: f3("\x1B[34m", "\x1B[39m"),
      magenta: f3("\x1B[35m", "\x1B[39m"),
      cyan: f3("\x1B[36m", "\x1B[39m"),
      white: f3("\x1B[37m", "\x1B[39m"),
      gray: f3("\x1B[90m", "\x1B[39m"),
      bgBlack: f3("\x1B[40m", "\x1B[49m"),
      bgRed: f3("\x1B[41m", "\x1B[49m"),
      bgGreen: f3("\x1B[42m", "\x1B[49m"),
      bgYellow: f3("\x1B[43m", "\x1B[49m"),
      bgBlue: f3("\x1B[44m", "\x1B[49m"),
      bgMagenta: f3("\x1B[45m", "\x1B[49m"),
      bgCyan: f3("\x1B[46m", "\x1B[49m"),
      bgWhite: f3("\x1B[47m", "\x1B[49m"),
      blackBright: f3("\x1B[90m", "\x1B[39m"),
      redBright: f3("\x1B[91m", "\x1B[39m"),
      greenBright: f3("\x1B[92m", "\x1B[39m"),
      yellowBright: f3("\x1B[93m", "\x1B[39m"),
      blueBright: f3("\x1B[94m", "\x1B[39m"),
      magentaBright: f3("\x1B[95m", "\x1B[39m"),
      cyanBright: f3("\x1B[96m", "\x1B[39m"),
      whiteBright: f3("\x1B[97m", "\x1B[39m"),
      bgBlackBright: f3("\x1B[100m", "\x1B[49m"),
      bgRedBright: f3("\x1B[101m", "\x1B[49m"),
      bgGreenBright: f3("\x1B[102m", "\x1B[49m"),
      bgYellowBright: f3("\x1B[103m", "\x1B[49m"),
      bgBlueBright: f3("\x1B[104m", "\x1B[49m"),
      bgMagentaBright: f3("\x1B[105m", "\x1B[49m"),
      bgCyanBright: f3("\x1B[106m", "\x1B[49m"),
      bgWhiteBright: f3("\x1B[107m", "\x1B[49m")
    };
  };
  picocolors.exports = createColors2();
  picocolors.exports.createColors = createColors2;
  return picocolors.exports;
}
function J({ onlyFirst: t2 = false } = {}) {
  const F3 = ["[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?(?:\\u0007|\\u001B\\u005C|\\u009C))", "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]))"].join("|");
  return new RegExp(F3, t2 ? void 0 : "g");
}
function T$1(t2) {
  if (typeof t2 != "string") throw new TypeError(`Expected a \`string\`, got \`${typeof t2}\``);
  return t2.replace(Q, "");
}
function O(t2) {
  return t2 && t2.__esModule && Object.prototype.hasOwnProperty.call(t2, "default") ? t2.default : t2;
}
function A$1(t2, u3 = {}) {
  if (typeof t2 != "string" || t2.length === 0 || (u3 = { ambiguousIsNarrow: true, ...u3 }, t2 = T$1(t2), t2.length === 0)) return 0;
  t2 = t2.replace(FD(), "  ");
  const F3 = u3.ambiguousIsNarrow ? 1 : 2;
  let e3 = 0;
  for (const s2 of t2) {
    const i2 = s2.codePointAt(0);
    if (i2 <= 31 || i2 >= 127 && i2 <= 159 || i2 >= 768 && i2 <= 879) continue;
    switch (DD.eastAsianWidth(s2)) {
      case "F":
      case "W":
        e3 += 2;
        break;
      case "A":
        e3 += F3;
        break;
      default:
        e3 += 1;
    }
  }
  return e3;
}
function sD() {
  const t2 = /* @__PURE__ */ new Map();
  for (const [u3, F3] of Object.entries(r)) {
    for (const [e3, s2] of Object.entries(F3)) r[e3] = { open: `\x1B[${s2[0]}m`, close: `\x1B[${s2[1]}m` }, F3[e3] = r[e3], t2.set(s2[0], s2[1]);
    Object.defineProperty(r, u3, { value: F3, enumerable: false });
  }
  return Object.defineProperty(r, "codes", { value: t2, enumerable: false }), r.color.close = "\x1B[39m", r.bgColor.close = "\x1B[49m", r.color.ansi = L$1(), r.color.ansi256 = N(), r.color.ansi16m = I(), r.bgColor.ansi = L$1(m), r.bgColor.ansi256 = N(m), r.bgColor.ansi16m = I(m), Object.defineProperties(r, { rgbToAnsi256: { value: (u3, F3, e3) => u3 === F3 && F3 === e3 ? u3 < 8 ? 16 : u3 > 248 ? 231 : Math.round((u3 - 8) / 247 * 24) + 232 : 16 + 36 * Math.round(u3 / 255 * 5) + 6 * Math.round(F3 / 255 * 5) + Math.round(e3 / 255 * 5), enumerable: false }, hexToRgb: { value: (u3) => {
    const F3 = /[a-f\d]{6}|[a-f\d]{3}/i.exec(u3.toString(16));
    if (!F3) return [0, 0, 0];
    let [e3] = F3;
    e3.length === 3 && (e3 = [...e3].map((i2) => i2 + i2).join(""));
    const s2 = Number.parseInt(e3, 16);
    return [s2 >> 16 & 255, s2 >> 8 & 255, s2 & 255];
  }, enumerable: false }, hexToAnsi256: { value: (u3) => r.rgbToAnsi256(...r.hexToRgb(u3)), enumerable: false }, ansi256ToAnsi: { value: (u3) => {
    if (u3 < 8) return 30 + u3;
    if (u3 < 16) return 90 + (u3 - 8);
    let F3, e3, s2;
    if (u3 >= 232) F3 = ((u3 - 232) * 10 + 8) / 255, e3 = F3, s2 = F3;
    else {
      u3 -= 16;
      const C3 = u3 % 36;
      F3 = Math.floor(u3 / 36) / 5, e3 = Math.floor(C3 / 6) / 5, s2 = C3 % 6 / 5;
    }
    const i2 = Math.max(F3, e3, s2) * 2;
    if (i2 === 0) return 30;
    let D2 = 30 + (Math.round(s2) << 2 | Math.round(e3) << 1 | Math.round(F3));
    return i2 === 2 && (D2 += 60), D2;
  }, enumerable: false }, rgbToAnsi: { value: (u3, F3, e3) => r.ansi256ToAnsi(r.rgbToAnsi256(u3, F3, e3)), enumerable: false }, hexToAnsi: { value: (u3) => r.ansi256ToAnsi(r.hexToAnsi256(u3)), enumerable: false } }), r;
}
function G(t2, u3, F3) {
  return String(t2).normalize().replace(/\r\n/g, `
`).split(`
`).map((e3) => oD(e3, u3, F3)).join(`
`);
}
function k$1(t2, u3) {
  if (typeof t2 == "string") return c.aliases.get(t2) === u3;
  for (const F3 of t2) if (F3 !== void 0 && k$1(F3, u3)) return true;
  return false;
}
function lD(t2, u3) {
  if (t2 === u3) return;
  const F3 = t2.split(`
`), e3 = u3.split(`
`), s2 = [];
  for (let i2 = 0; i2 < Math.max(F3.length, e3.length); i2++) F3[i2] !== e3[i2] && s2.push(i2);
  return s2;
}
function d$1(t2, u3) {
  const F3 = t2;
  F3.isTTY && F3.setRawMode(u3);
}
function ce() {
  return import_node_process.default.platform !== "win32" ? import_node_process.default.env.TERM !== "linux" : !!import_node_process.default.env.CI || !!import_node_process.default.env.WT_SESSION || !!import_node_process.default.env.TERMINUS_SUBLIME || import_node_process.default.env.ConEmuTask === "{cmd::Cmder}" || import_node_process.default.env.TERM_PROGRAM === "Terminus-Sublime" || import_node_process.default.env.TERM_PROGRAM === "vscode" || import_node_process.default.env.TERM === "xterm-256color" || import_node_process.default.env.TERM === "alacritty" || import_node_process.default.env.TERMINAL_EMULATOR === "JetBrains-JediTerm";
}
async function prompt(message, opts = {}) {
  const handleCancel = (value) => {
    if (typeof value !== "symbol" || value.toString() !== "Symbol(clack:cancel)") {
      return value;
    }
    switch (opts.cancel) {
      case "reject": {
        const error = new Error("Prompt cancelled.");
        error.name = "ConsolaPromptCancelledError";
        if (Error.captureStackTrace) {
          Error.captureStackTrace(error, prompt);
        }
        throw error;
      }
      case "undefined": {
        return void 0;
      }
      case "null": {
        return null;
      }
      case "symbol": {
        return kCancel;
      }
      default:
      case "default": {
        return opts.default ?? opts.initial;
      }
    }
  };
  if (!opts.type || opts.type === "text") {
    return await he({
      message,
      defaultValue: opts.default,
      placeholder: opts.placeholder,
      initialValue: opts.initial
    }).then(handleCancel);
  }
  if (opts.type === "confirm") {
    return await ye({
      message,
      initialValue: opts.initial
    }).then(handleCancel);
  }
  if (opts.type === "select") {
    return await ve({
      message,
      options: opts.options.map(
        (o3) => typeof o3 === "string" ? { value: o3, label: o3 } : o3
      ),
      initialValue: opts.initial
    }).then(handleCancel);
  }
  if (opts.type === "multiselect") {
    return await fe({
      message,
      options: opts.options.map(
        (o3) => typeof o3 === "string" ? { value: o3, label: o3 } : o3
      ),
      required: opts.required,
      initialValues: opts.initial
    }).then(handleCancel);
  }
  throw new Error(`Unknown prompt type: ${opts.type}`);
}
var import_node_process, import_node_readline, import_node_tty, src, hasRequiredSrc, srcExports, picocolors, hasRequiredPicocolors, picocolorsExports, e, Q, P$1, X, DD, uD, FD, m, L$1, N, I, r, tD, eD, iD, v, CD, w$1, W$1, rD, R, y, V$1, z, ED, _, nD, oD, aD, c, S, AD, pD, h, x, fD, bD, mD, Y, wD, SD, $D, q, jD, PD, V, u, le, L, W, C, o, d, k, P, A, T, F, w, B, he, ye, ve, fe, kCancel;
var init_prompt = __esm({
  "../node_modules/consola/dist/chunks/prompt.mjs"() {
    import_node_process = __toESM(require("node:process"), 1);
    import_node_readline = __toESM(require("node:readline"), 1);
    import_node_tty = require("node:tty");
    srcExports = requireSrc();
    picocolors = { exports: {} };
    picocolorsExports = /* @__PURE__ */ requirePicocolors();
    e = /* @__PURE__ */ getDefaultExportFromCjs(picocolorsExports);
    Q = J();
    P$1 = { exports: {} };
    (function(t2) {
      var u3 = {};
      t2.exports = u3, u3.eastAsianWidth = function(e3) {
        var s2 = e3.charCodeAt(0), i2 = e3.length == 2 ? e3.charCodeAt(1) : 0, D2 = s2;
        return 55296 <= s2 && s2 <= 56319 && 56320 <= i2 && i2 <= 57343 && (s2 &= 1023, i2 &= 1023, D2 = s2 << 10 | i2, D2 += 65536), D2 == 12288 || 65281 <= D2 && D2 <= 65376 || 65504 <= D2 && D2 <= 65510 ? "F" : D2 == 8361 || 65377 <= D2 && D2 <= 65470 || 65474 <= D2 && D2 <= 65479 || 65482 <= D2 && D2 <= 65487 || 65490 <= D2 && D2 <= 65495 || 65498 <= D2 && D2 <= 65500 || 65512 <= D2 && D2 <= 65518 ? "H" : 4352 <= D2 && D2 <= 4447 || 4515 <= D2 && D2 <= 4519 || 4602 <= D2 && D2 <= 4607 || 9001 <= D2 && D2 <= 9002 || 11904 <= D2 && D2 <= 11929 || 11931 <= D2 && D2 <= 12019 || 12032 <= D2 && D2 <= 12245 || 12272 <= D2 && D2 <= 12283 || 12289 <= D2 && D2 <= 12350 || 12353 <= D2 && D2 <= 12438 || 12441 <= D2 && D2 <= 12543 || 12549 <= D2 && D2 <= 12589 || 12593 <= D2 && D2 <= 12686 || 12688 <= D2 && D2 <= 12730 || 12736 <= D2 && D2 <= 12771 || 12784 <= D2 && D2 <= 12830 || 12832 <= D2 && D2 <= 12871 || 12880 <= D2 && D2 <= 13054 || 13056 <= D2 && D2 <= 19903 || 19968 <= D2 && D2 <= 42124 || 42128 <= D2 && D2 <= 42182 || 43360 <= D2 && D2 <= 43388 || 44032 <= D2 && D2 <= 55203 || 55216 <= D2 && D2 <= 55238 || 55243 <= D2 && D2 <= 55291 || 63744 <= D2 && D2 <= 64255 || 65040 <= D2 && D2 <= 65049 || 65072 <= D2 && D2 <= 65106 || 65108 <= D2 && D2 <= 65126 || 65128 <= D2 && D2 <= 65131 || 110592 <= D2 && D2 <= 110593 || 127488 <= D2 && D2 <= 127490 || 127504 <= D2 && D2 <= 127546 || 127552 <= D2 && D2 <= 127560 || 127568 <= D2 && D2 <= 127569 || 131072 <= D2 && D2 <= 194367 || 177984 <= D2 && D2 <= 196605 || 196608 <= D2 && D2 <= 262141 ? "W" : 32 <= D2 && D2 <= 126 || 162 <= D2 && D2 <= 163 || 165 <= D2 && D2 <= 166 || D2 == 172 || D2 == 175 || 10214 <= D2 && D2 <= 10221 || 10629 <= D2 && D2 <= 10630 ? "Na" : D2 == 161 || D2 == 164 || 167 <= D2 && D2 <= 168 || D2 == 170 || 173 <= D2 && D2 <= 174 || 176 <= D2 && D2 <= 180 || 182 <= D2 && D2 <= 186 || 188 <= D2 && D2 <= 191 || D2 == 198 || D2 == 208 || 215 <= D2 && D2 <= 216 || 222 <= D2 && D2 <= 225 || D2 == 230 || 232 <= D2 && D2 <= 234 || 236 <= D2 && D2 <= 237 || D2 == 240 || 242 <= D2 && D2 <= 243 || 247 <= D2 && D2 <= 250 || D2 == 252 || D2 == 254 || D2 == 257 || D2 == 273 || D2 == 275 || D2 == 283 || 294 <= D2 && D2 <= 295 || D2 == 299 || 305 <= D2 && D2 <= 307 || D2 == 312 || 319 <= D2 && D2 <= 322 || D2 == 324 || 328 <= D2 && D2 <= 331 || D2 == 333 || 338 <= D2 && D2 <= 339 || 358 <= D2 && D2 <= 359 || D2 == 363 || D2 == 462 || D2 == 464 || D2 == 466 || D2 == 468 || D2 == 470 || D2 == 472 || D2 == 474 || D2 == 476 || D2 == 593 || D2 == 609 || D2 == 708 || D2 == 711 || 713 <= D2 && D2 <= 715 || D2 == 717 || D2 == 720 || 728 <= D2 && D2 <= 731 || D2 == 733 || D2 == 735 || 768 <= D2 && D2 <= 879 || 913 <= D2 && D2 <= 929 || 931 <= D2 && D2 <= 937 || 945 <= D2 && D2 <= 961 || 963 <= D2 && D2 <= 969 || D2 == 1025 || 1040 <= D2 && D2 <= 1103 || D2 == 1105 || D2 == 8208 || 8211 <= D2 && D2 <= 8214 || 8216 <= D2 && D2 <= 8217 || 8220 <= D2 && D2 <= 8221 || 8224 <= D2 && D2 <= 8226 || 8228 <= D2 && D2 <= 8231 || D2 == 8240 || 8242 <= D2 && D2 <= 8243 || D2 == 8245 || D2 == 8251 || D2 == 8254 || D2 == 8308 || D2 == 8319 || 8321 <= D2 && D2 <= 8324 || D2 == 8364 || D2 == 8451 || D2 == 8453 || D2 == 8457 || D2 == 8467 || D2 == 8470 || 8481 <= D2 && D2 <= 8482 || D2 == 8486 || D2 == 8491 || 8531 <= D2 && D2 <= 8532 || 8539 <= D2 && D2 <= 8542 || 8544 <= D2 && D2 <= 8555 || 8560 <= D2 && D2 <= 8569 || D2 == 8585 || 8592 <= D2 && D2 <= 8601 || 8632 <= D2 && D2 <= 8633 || D2 == 8658 || D2 == 8660 || D2 == 8679 || D2 == 8704 || 8706 <= D2 && D2 <= 8707 || 8711 <= D2 && D2 <= 8712 || D2 == 8715 || D2 == 8719 || D2 == 8721 || D2 == 8725 || D2 == 8730 || 8733 <= D2 && D2 <= 8736 || D2 == 8739 || D2 == 8741 || 8743 <= D2 && D2 <= 8748 || D2 == 8750 || 8756 <= D2 && D2 <= 8759 || 8764 <= D2 && D2 <= 8765 || D2 == 8776 || D2 == 8780 || D2 == 8786 || 8800 <= D2 && D2 <= 8801 || 8804 <= D2 && D2 <= 8807 || 8810 <= D2 && D2 <= 8811 || 8814 <= D2 && D2 <= 8815 || 8834 <= D2 && D2 <= 8835 || 8838 <= D2 && D2 <= 8839 || D2 == 8853 || D2 == 8857 || D2 == 8869 || D2 == 8895 || D2 == 8978 || 9312 <= D2 && D2 <= 9449 || 9451 <= D2 && D2 <= 9547 || 9552 <= D2 && D2 <= 9587 || 9600 <= D2 && D2 <= 9615 || 9618 <= D2 && D2 <= 9621 || 9632 <= D2 && D2 <= 9633 || 9635 <= D2 && D2 <= 9641 || 9650 <= D2 && D2 <= 9651 || 9654 <= D2 && D2 <= 9655 || 9660 <= D2 && D2 <= 9661 || 9664 <= D2 && D2 <= 9665 || 9670 <= D2 && D2 <= 9672 || D2 == 9675 || 9678 <= D2 && D2 <= 9681 || 9698 <= D2 && D2 <= 9701 || D2 == 9711 || 9733 <= D2 && D2 <= 9734 || D2 == 9737 || 9742 <= D2 && D2 <= 9743 || 9748 <= D2 && D2 <= 9749 || D2 == 9756 || D2 == 9758 || D2 == 9792 || D2 == 9794 || 9824 <= D2 && D2 <= 9825 || 9827 <= D2 && D2 <= 9829 || 9831 <= D2 && D2 <= 9834 || 9836 <= D2 && D2 <= 9837 || D2 == 9839 || 9886 <= D2 && D2 <= 9887 || 9918 <= D2 && D2 <= 9919 || 9924 <= D2 && D2 <= 9933 || 9935 <= D2 && D2 <= 9953 || D2 == 9955 || 9960 <= D2 && D2 <= 9983 || D2 == 10045 || D2 == 10071 || 10102 <= D2 && D2 <= 10111 || 11093 <= D2 && D2 <= 11097 || 12872 <= D2 && D2 <= 12879 || 57344 <= D2 && D2 <= 63743 || 65024 <= D2 && D2 <= 65039 || D2 == 65533 || 127232 <= D2 && D2 <= 127242 || 127248 <= D2 && D2 <= 127277 || 127280 <= D2 && D2 <= 127337 || 127344 <= D2 && D2 <= 127386 || 917760 <= D2 && D2 <= 917999 || 983040 <= D2 && D2 <= 1048573 || 1048576 <= D2 && D2 <= 1114109 ? "A" : "N";
      }, u3.characterLength = function(e3) {
        var s2 = this.eastAsianWidth(e3);
        return s2 == "F" || s2 == "W" || s2 == "A" ? 2 : 1;
      };
      function F3(e3) {
        return e3.match(/[\uD800-\uDBFF][\uDC00-\uDFFF]|[^\uD800-\uDFFF]/g) || [];
      }
      u3.length = function(e3) {
        for (var s2 = F3(e3), i2 = 0, D2 = 0; D2 < s2.length; D2++) i2 = i2 + this.characterLength(s2[D2]);
        return i2;
      }, u3.slice = function(e3, s2, i2) {
        textLen = u3.length(e3), s2 = s2 || 0, i2 = i2 || 1, s2 < 0 && (s2 = textLen + s2), i2 < 0 && (i2 = textLen + i2);
        for (var D2 = "", C3 = 0, o3 = F3(e3), E = 0; E < o3.length; E++) {
          var a2 = o3[E], n3 = u3.length(a2);
          if (C3 >= s2 - (n3 == 2 ? 1 : 0)) if (C3 + n3 <= i2) D2 += a2;
          else break;
          C3 += n3;
        }
        return D2;
      };
    })(P$1);
    X = P$1.exports;
    DD = O(X);
    uD = function() {
      return /\uD83C\uDFF4\uDB40\uDC67\uDB40\uDC62(?:\uDB40\uDC77\uDB40\uDC6C\uDB40\uDC73|\uDB40\uDC73\uDB40\uDC63\uDB40\uDC74|\uDB40\uDC65\uDB40\uDC6E\uDB40\uDC67)\uDB40\uDC7F|(?:\uD83E\uDDD1\uD83C\uDFFF\u200D\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFF\u200D\uD83E\uDD1D\u200D(?:\uD83D[\uDC68\uDC69]))(?:\uD83C[\uDFFB-\uDFFE])|(?:\uD83E\uDDD1\uD83C\uDFFE\u200D\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFE\u200D\uD83E\uDD1D\u200D(?:\uD83D[\uDC68\uDC69]))(?:\uD83C[\uDFFB-\uDFFD\uDFFF])|(?:\uD83E\uDDD1\uD83C\uDFFD\u200D\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFD\u200D\uD83E\uDD1D\u200D(?:\uD83D[\uDC68\uDC69]))(?:\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])|(?:\uD83E\uDDD1\uD83C\uDFFC\u200D\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFC\u200D\uD83E\uDD1D\u200D(?:\uD83D[\uDC68\uDC69]))(?:\uD83C[\uDFFB\uDFFD-\uDFFF])|(?:\uD83E\uDDD1\uD83C\uDFFB\u200D\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFB\u200D\uD83E\uDD1D\u200D(?:\uD83D[\uDC68\uDC69]))(?:\uD83C[\uDFFC-\uDFFF])|\uD83D\uDC68(?:\uD83C\uDFFB(?:\u200D(?:\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFF])|\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFF]))|\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFC-\uDFFF])|[\u2695\u2696\u2708]\uFE0F|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD]))?|(?:\uD83C[\uDFFC-\uDFFF])\u200D\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFF])|\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFF]))|\u200D(?:\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D)?\uD83D\uDC68|(?:\uD83D[\uDC68\uDC69])\u200D(?:\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67]))|\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67])|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFF\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFE])|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFE\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFD\uDFFF])|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFD\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFC\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB\uDFFD-\uDFFF])|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|(?:\uD83C\uDFFF\u200D[\u2695\u2696\u2708]|\uD83C\uDFFE\u200D[\u2695\u2696\u2708]|\uD83C\uDFFD\u200D[\u2695\u2696\u2708]|\uD83C\uDFFC\u200D[\u2695\u2696\u2708]|\u200D[\u2695\u2696\u2708])\uFE0F|\u200D(?:(?:\uD83D[\uDC68\uDC69])\u200D(?:\uD83D[\uDC66\uDC67])|\uD83D[\uDC66\uDC67])|\uD83C\uDFFF|\uD83C\uDFFE|\uD83C\uDFFD|\uD83C\uDFFC)?|(?:\uD83D\uDC69(?:\uD83C\uDFFB\u200D\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D(?:\uD83D[\uDC68\uDC69])|\uD83D[\uDC68\uDC69])|(?:\uD83C[\uDFFC-\uDFFF])\u200D\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D(?:\uD83D[\uDC68\uDC69])|\uD83D[\uDC68\uDC69]))|\uD83E\uDDD1(?:\uD83C[\uDFFB-\uDFFF])\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1)(?:\uD83C[\uDFFB-\uDFFF])|\uD83D\uDC69\u200D\uD83D\uDC69\u200D(?:\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67]))|\uD83D\uDC69(?:\u200D(?:\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D(?:\uD83D[\uDC68\uDC69])|\uD83D[\uDC68\uDC69])|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFF\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFE\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFD\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFC\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFB\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD]))|\uD83E\uDDD1(?:\u200D(?:\uD83E\uDD1D\u200D\uD83E\uDDD1|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFF\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFE\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFD\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFC\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFB\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD]))|\uD83D\uDC69\u200D\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC69\u200D\uD83D\uDC69\u200D(?:\uD83D[\uDC66\uDC67])|\uD83D\uDC69\u200D\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67])|(?:\uD83D\uDC41\uFE0F\u200D\uD83D\uDDE8|\uD83E\uDDD1(?:\uD83C\uDFFF\u200D[\u2695\u2696\u2708]|\uD83C\uDFFE\u200D[\u2695\u2696\u2708]|\uD83C\uDFFD\u200D[\u2695\u2696\u2708]|\uD83C\uDFFC\u200D[\u2695\u2696\u2708]|\uD83C\uDFFB\u200D[\u2695\u2696\u2708]|\u200D[\u2695\u2696\u2708])|\uD83D\uDC69(?:\uD83C\uDFFF\u200D[\u2695\u2696\u2708]|\uD83C\uDFFE\u200D[\u2695\u2696\u2708]|\uD83C\uDFFD\u200D[\u2695\u2696\u2708]|\uD83C\uDFFC\u200D[\u2695\u2696\u2708]|\uD83C\uDFFB\u200D[\u2695\u2696\u2708]|\u200D[\u2695\u2696\u2708])|\uD83D\uDE36\u200D\uD83C\uDF2B|\uD83C\uDFF3\uFE0F\u200D\u26A7|\uD83D\uDC3B\u200D\u2744|(?:(?:\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC70\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD35\uDD37-\uDD39\uDD3D\uDD3E\uDDB8\uDDB9\uDDCD-\uDDCF\uDDD4\uDDD6-\uDDDD])(?:\uD83C[\uDFFB-\uDFFF])|\uD83D\uDC6F|\uD83E[\uDD3C\uDDDE\uDDDF])\u200D[\u2640\u2642]|(?:\u26F9|\uD83C[\uDFCB\uDFCC]|\uD83D\uDD75)(?:\uFE0F|\uD83C[\uDFFB-\uDFFF])\u200D[\u2640\u2642]|\uD83C\uDFF4\u200D\u2620|(?:\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC70\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD35\uDD37-\uDD39\uDD3D\uDD3E\uDDB8\uDDB9\uDDCD-\uDDCF\uDDD4\uDDD6-\uDDDD])\u200D[\u2640\u2642]|[\xA9\xAE\u203C\u2049\u2122\u2139\u2194-\u2199\u21A9\u21AA\u2328\u23CF\u23ED-\u23EF\u23F1\u23F2\u23F8-\u23FA\u24C2\u25AA\u25AB\u25B6\u25C0\u25FB\u25FC\u2600-\u2604\u260E\u2611\u2618\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2640\u2642\u265F\u2660\u2663\u2665\u2666\u2668\u267B\u267E\u2692\u2694-\u2697\u2699\u269B\u269C\u26A0\u26A7\u26B0\u26B1\u26C8\u26CF\u26D1\u26D3\u26E9\u26F0\u26F1\u26F4\u26F7\u26F8\u2702\u2708\u2709\u270F\u2712\u2714\u2716\u271D\u2721\u2733\u2734\u2744\u2747\u2763\u27A1\u2934\u2935\u2B05-\u2B07\u3030\u303D\u3297\u3299]|\uD83C[\uDD70\uDD71\uDD7E\uDD7F\uDE02\uDE37\uDF21\uDF24-\uDF2C\uDF36\uDF7D\uDF96\uDF97\uDF99-\uDF9B\uDF9E\uDF9F\uDFCD\uDFCE\uDFD4-\uDFDF\uDFF5\uDFF7]|\uD83D[\uDC3F\uDCFD\uDD49\uDD4A\uDD6F\uDD70\uDD73\uDD76-\uDD79\uDD87\uDD8A-\uDD8D\uDDA5\uDDA8\uDDB1\uDDB2\uDDBC\uDDC2-\uDDC4\uDDD1-\uDDD3\uDDDC-\uDDDE\uDDE1\uDDE3\uDDE8\uDDEF\uDDF3\uDDFA\uDECB\uDECD-\uDECF\uDEE0-\uDEE5\uDEE9\uDEF0\uDEF3])\uFE0F|\uD83C\uDFF3\uFE0F\u200D\uD83C\uDF08|\uD83D\uDC69\u200D\uD83D\uDC67|\uD83D\uDC69\u200D\uD83D\uDC66|\uD83D\uDE35\u200D\uD83D\uDCAB|\uD83D\uDE2E\u200D\uD83D\uDCA8|\uD83D\uDC15\u200D\uD83E\uDDBA|\uD83E\uDDD1(?:\uD83C\uDFFF|\uD83C\uDFFE|\uD83C\uDFFD|\uD83C\uDFFC|\uD83C\uDFFB)?|\uD83D\uDC69(?:\uD83C\uDFFF|\uD83C\uDFFE|\uD83C\uDFFD|\uD83C\uDFFC|\uD83C\uDFFB)?|\uD83C\uDDFD\uD83C\uDDF0|\uD83C\uDDF6\uD83C\uDDE6|\uD83C\uDDF4\uD83C\uDDF2|\uD83D\uDC08\u200D\u2B1B|\u2764\uFE0F\u200D(?:\uD83D\uDD25|\uD83E\uDE79)|\uD83D\uDC41\uFE0F|\uD83C\uDFF3\uFE0F|\uD83C\uDDFF(?:\uD83C[\uDDE6\uDDF2\uDDFC])|\uD83C\uDDFE(?:\uD83C[\uDDEA\uDDF9])|\uD83C\uDDFC(?:\uD83C[\uDDEB\uDDF8])|\uD83C\uDDFB(?:\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDEE\uDDF3\uDDFA])|\uD83C\uDDFA(?:\uD83C[\uDDE6\uDDEC\uDDF2\uDDF3\uDDF8\uDDFE\uDDFF])|\uD83C\uDDF9(?:\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDED\uDDEF-\uDDF4\uDDF7\uDDF9\uDDFB\uDDFC\uDDFF])|\uD83C\uDDF8(?:\uD83C[\uDDE6-\uDDEA\uDDEC-\uDDF4\uDDF7-\uDDF9\uDDFB\uDDFD-\uDDFF])|\uD83C\uDDF7(?:\uD83C[\uDDEA\uDDF4\uDDF8\uDDFA\uDDFC])|\uD83C\uDDF5(?:\uD83C[\uDDE6\uDDEA-\uDDED\uDDF0-\uDDF3\uDDF7-\uDDF9\uDDFC\uDDFE])|\uD83C\uDDF3(?:\uD83C[\uDDE6\uDDE8\uDDEA-\uDDEC\uDDEE\uDDF1\uDDF4\uDDF5\uDDF7\uDDFA\uDDFF])|\uD83C\uDDF2(?:\uD83C[\uDDE6\uDDE8-\uDDED\uDDF0-\uDDFF])|\uD83C\uDDF1(?:\uD83C[\uDDE6-\uDDE8\uDDEE\uDDF0\uDDF7-\uDDFB\uDDFE])|\uD83C\uDDF0(?:\uD83C[\uDDEA\uDDEC-\uDDEE\uDDF2\uDDF3\uDDF5\uDDF7\uDDFC\uDDFE\uDDFF])|\uD83C\uDDEF(?:\uD83C[\uDDEA\uDDF2\uDDF4\uDDF5])|\uD83C\uDDEE(?:\uD83C[\uDDE8-\uDDEA\uDDF1-\uDDF4\uDDF6-\uDDF9])|\uD83C\uDDED(?:\uD83C[\uDDF0\uDDF2\uDDF3\uDDF7\uDDF9\uDDFA])|\uD83C\uDDEC(?:\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEE\uDDF1-\uDDF3\uDDF5-\uDDFA\uDDFC\uDDFE])|\uD83C\uDDEB(?:\uD83C[\uDDEE-\uDDF0\uDDF2\uDDF4\uDDF7])|\uD83C\uDDEA(?:\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDED\uDDF7-\uDDFA])|\uD83C\uDDE9(?:\uD83C[\uDDEA\uDDEC\uDDEF\uDDF0\uDDF2\uDDF4\uDDFF])|\uD83C\uDDE8(?:\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDEE\uDDF0-\uDDF5\uDDF7\uDDFA-\uDDFF])|\uD83C\uDDE7(?:\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEF\uDDF1-\uDDF4\uDDF6-\uDDF9\uDDFB\uDDFC\uDDFE\uDDFF])|\uD83C\uDDE6(?:\uD83C[\uDDE8-\uDDEC\uDDEE\uDDF1\uDDF2\uDDF4\uDDF6-\uDDFA\uDDFC\uDDFD\uDDFF])|[#\*0-9]\uFE0F\u20E3|\u2764\uFE0F|(?:\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC70\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD35\uDD37-\uDD39\uDD3D\uDD3E\uDDB8\uDDB9\uDDCD-\uDDCF\uDDD4\uDDD6-\uDDDD])(?:\uD83C[\uDFFB-\uDFFF])|(?:\u26F9|\uD83C[\uDFCB\uDFCC]|\uD83D\uDD75)(?:\uFE0F|\uD83C[\uDFFB-\uDFFF])|\uD83C\uDFF4|(?:[\u270A\u270B]|\uD83C[\uDF85\uDFC2\uDFC7]|\uD83D[\uDC42\uDC43\uDC46-\uDC50\uDC66\uDC67\uDC6B-\uDC6D\uDC72\uDC74-\uDC76\uDC78\uDC7C\uDC83\uDC85\uDC8F\uDC91\uDCAA\uDD7A\uDD95\uDD96\uDE4C\uDE4F\uDEC0\uDECC]|\uD83E[\uDD0C\uDD0F\uDD18-\uDD1C\uDD1E\uDD1F\uDD30-\uDD34\uDD36\uDD77\uDDB5\uDDB6\uDDBB\uDDD2\uDDD3\uDDD5])(?:\uD83C[\uDFFB-\uDFFF])|(?:[\u261D\u270C\u270D]|\uD83D[\uDD74\uDD90])(?:\uFE0F|\uD83C[\uDFFB-\uDFFF])|[\u270A\u270B]|\uD83C[\uDF85\uDFC2\uDFC7]|\uD83D[\uDC08\uDC15\uDC3B\uDC42\uDC43\uDC46-\uDC50\uDC66\uDC67\uDC6B-\uDC6D\uDC72\uDC74-\uDC76\uDC78\uDC7C\uDC83\uDC85\uDC8F\uDC91\uDCAA\uDD7A\uDD95\uDD96\uDE2E\uDE35\uDE36\uDE4C\uDE4F\uDEC0\uDECC]|\uD83E[\uDD0C\uDD0F\uDD18-\uDD1C\uDD1E\uDD1F\uDD30-\uDD34\uDD36\uDD77\uDDB5\uDDB6\uDDBB\uDDD2\uDDD3\uDDD5]|\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC70\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD35\uDD37-\uDD39\uDD3D\uDD3E\uDDB8\uDDB9\uDDCD-\uDDCF\uDDD4\uDDD6-\uDDDD]|\uD83D\uDC6F|\uD83E[\uDD3C\uDDDE\uDDDF]|[\u231A\u231B\u23E9-\u23EC\u23F0\u23F3\u25FD\u25FE\u2614\u2615\u2648-\u2653\u267F\u2693\u26A1\u26AA\u26AB\u26BD\u26BE\u26C4\u26C5\u26CE\u26D4\u26EA\u26F2\u26F3\u26F5\u26FA\u26FD\u2705\u2728\u274C\u274E\u2753-\u2755\u2757\u2795-\u2797\u27B0\u27BF\u2B1B\u2B1C\u2B50\u2B55]|\uD83C[\uDC04\uDCCF\uDD8E\uDD91-\uDD9A\uDE01\uDE1A\uDE2F\uDE32-\uDE36\uDE38-\uDE3A\uDE50\uDE51\uDF00-\uDF20\uDF2D-\uDF35\uDF37-\uDF7C\uDF7E-\uDF84\uDF86-\uDF93\uDFA0-\uDFC1\uDFC5\uDFC6\uDFC8\uDFC9\uDFCF-\uDFD3\uDFE0-\uDFF0\uDFF8-\uDFFF]|\uD83D[\uDC00-\uDC07\uDC09-\uDC14\uDC16-\uDC3A\uDC3C-\uDC3E\uDC40\uDC44\uDC45\uDC51-\uDC65\uDC6A\uDC79-\uDC7B\uDC7D-\uDC80\uDC84\uDC88-\uDC8E\uDC90\uDC92-\uDCA9\uDCAB-\uDCFC\uDCFF-\uDD3D\uDD4B-\uDD4E\uDD50-\uDD67\uDDA4\uDDFB-\uDE2D\uDE2F-\uDE34\uDE37-\uDE44\uDE48-\uDE4A\uDE80-\uDEA2\uDEA4-\uDEB3\uDEB7-\uDEBF\uDEC1-\uDEC5\uDED0-\uDED2\uDED5-\uDED7\uDEEB\uDEEC\uDEF4-\uDEFC\uDFE0-\uDFEB]|\uD83E[\uDD0D\uDD0E\uDD10-\uDD17\uDD1D\uDD20-\uDD25\uDD27-\uDD2F\uDD3A\uDD3F-\uDD45\uDD47-\uDD76\uDD78\uDD7A-\uDDB4\uDDB7\uDDBA\uDDBC-\uDDCB\uDDD0\uDDE0-\uDDFF\uDE70-\uDE74\uDE78-\uDE7A\uDE80-\uDE86\uDE90-\uDEA8\uDEB0-\uDEB6\uDEC0-\uDEC2\uDED0-\uDED6]|(?:[\u231A\u231B\u23E9-\u23EC\u23F0\u23F3\u25FD\u25FE\u2614\u2615\u2648-\u2653\u267F\u2693\u26A1\u26AA\u26AB\u26BD\u26BE\u26C4\u26C5\u26CE\u26D4\u26EA\u26F2\u26F3\u26F5\u26FA\u26FD\u2705\u270A\u270B\u2728\u274C\u274E\u2753-\u2755\u2757\u2795-\u2797\u27B0\u27BF\u2B1B\u2B1C\u2B50\u2B55]|\uD83C[\uDC04\uDCCF\uDD8E\uDD91-\uDD9A\uDDE6-\uDDFF\uDE01\uDE1A\uDE2F\uDE32-\uDE36\uDE38-\uDE3A\uDE50\uDE51\uDF00-\uDF20\uDF2D-\uDF35\uDF37-\uDF7C\uDF7E-\uDF93\uDFA0-\uDFCA\uDFCF-\uDFD3\uDFE0-\uDFF0\uDFF4\uDFF8-\uDFFF]|\uD83D[\uDC00-\uDC3E\uDC40\uDC42-\uDCFC\uDCFF-\uDD3D\uDD4B-\uDD4E\uDD50-\uDD67\uDD7A\uDD95\uDD96\uDDA4\uDDFB-\uDE4F\uDE80-\uDEC5\uDECC\uDED0-\uDED2\uDED5-\uDED7\uDEEB\uDEEC\uDEF4-\uDEFC\uDFE0-\uDFEB]|\uD83E[\uDD0C-\uDD3A\uDD3C-\uDD45\uDD47-\uDD78\uDD7A-\uDDCB\uDDCD-\uDDFF\uDE70-\uDE74\uDE78-\uDE7A\uDE80-\uDE86\uDE90-\uDEA8\uDEB0-\uDEB6\uDEC0-\uDEC2\uDED0-\uDED6])|(?:[#\*0-9\xA9\xAE\u203C\u2049\u2122\u2139\u2194-\u2199\u21A9\u21AA\u231A\u231B\u2328\u23CF\u23E9-\u23F3\u23F8-\u23FA\u24C2\u25AA\u25AB\u25B6\u25C0\u25FB-\u25FE\u2600-\u2604\u260E\u2611\u2614\u2615\u2618\u261D\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2640\u2642\u2648-\u2653\u265F\u2660\u2663\u2665\u2666\u2668\u267B\u267E\u267F\u2692-\u2697\u2699\u269B\u269C\u26A0\u26A1\u26A7\u26AA\u26AB\u26B0\u26B1\u26BD\u26BE\u26C4\u26C5\u26C8\u26CE\u26CF\u26D1\u26D3\u26D4\u26E9\u26EA\u26F0-\u26F5\u26F7-\u26FA\u26FD\u2702\u2705\u2708-\u270D\u270F\u2712\u2714\u2716\u271D\u2721\u2728\u2733\u2734\u2744\u2747\u274C\u274E\u2753-\u2755\u2757\u2763\u2764\u2795-\u2797\u27A1\u27B0\u27BF\u2934\u2935\u2B05-\u2B07\u2B1B\u2B1C\u2B50\u2B55\u3030\u303D\u3297\u3299]|\uD83C[\uDC04\uDCCF\uDD70\uDD71\uDD7E\uDD7F\uDD8E\uDD91-\uDD9A\uDDE6-\uDDFF\uDE01\uDE02\uDE1A\uDE2F\uDE32-\uDE3A\uDE50\uDE51\uDF00-\uDF21\uDF24-\uDF93\uDF96\uDF97\uDF99-\uDF9B\uDF9E-\uDFF0\uDFF3-\uDFF5\uDFF7-\uDFFF]|\uD83D[\uDC00-\uDCFD\uDCFF-\uDD3D\uDD49-\uDD4E\uDD50-\uDD67\uDD6F\uDD70\uDD73-\uDD7A\uDD87\uDD8A-\uDD8D\uDD90\uDD95\uDD96\uDDA4\uDDA5\uDDA8\uDDB1\uDDB2\uDDBC\uDDC2-\uDDC4\uDDD1-\uDDD3\uDDDC-\uDDDE\uDDE1\uDDE3\uDDE8\uDDEF\uDDF3\uDDFA-\uDE4F\uDE80-\uDEC5\uDECB-\uDED2\uDED5-\uDED7\uDEE0-\uDEE5\uDEE9\uDEEB\uDEEC\uDEF0\uDEF3-\uDEFC\uDFE0-\uDFEB]|\uD83E[\uDD0C-\uDD3A\uDD3C-\uDD45\uDD47-\uDD78\uDD7A-\uDDCB\uDDCD-\uDDFF\uDE70-\uDE74\uDE78-\uDE7A\uDE80-\uDE86\uDE90-\uDEA8\uDEB0-\uDEB6\uDEC0-\uDEC2\uDED0-\uDED6])\uFE0F|(?:[\u261D\u26F9\u270A-\u270D]|\uD83C[\uDF85\uDFC2-\uDFC4\uDFC7\uDFCA-\uDFCC]|\uD83D[\uDC42\uDC43\uDC46-\uDC50\uDC66-\uDC78\uDC7C\uDC81-\uDC83\uDC85-\uDC87\uDC8F\uDC91\uDCAA\uDD74\uDD75\uDD7A\uDD90\uDD95\uDD96\uDE45-\uDE47\uDE4B-\uDE4F\uDEA3\uDEB4-\uDEB6\uDEC0\uDECC]|\uD83E[\uDD0C\uDD0F\uDD18-\uDD1F\uDD26\uDD30-\uDD39\uDD3C-\uDD3E\uDD77\uDDB5\uDDB6\uDDB8\uDDB9\uDDBB\uDDCD-\uDDCF\uDDD1-\uDDDD])/g;
    };
    FD = O(uD);
    m = 10;
    L$1 = (t2 = 0) => (u3) => `\x1B[${u3 + t2}m`;
    N = (t2 = 0) => (u3) => `\x1B[${38 + t2};5;${u3}m`;
    I = (t2 = 0) => (u3, F3, e3) => `\x1B[${38 + t2};2;${u3};${F3};${e3}m`;
    r = { modifier: { reset: [0, 0], bold: [1, 22], dim: [2, 22], italic: [3, 23], underline: [4, 24], overline: [53, 55], inverse: [7, 27], hidden: [8, 28], strikethrough: [9, 29] }, color: { black: [30, 39], red: [31, 39], green: [32, 39], yellow: [33, 39], blue: [34, 39], magenta: [35, 39], cyan: [36, 39], white: [37, 39], blackBright: [90, 39], gray: [90, 39], grey: [90, 39], redBright: [91, 39], greenBright: [92, 39], yellowBright: [93, 39], blueBright: [94, 39], magentaBright: [95, 39], cyanBright: [96, 39], whiteBright: [97, 39] }, bgColor: { bgBlack: [40, 49], bgRed: [41, 49], bgGreen: [42, 49], bgYellow: [43, 49], bgBlue: [44, 49], bgMagenta: [45, 49], bgCyan: [46, 49], bgWhite: [47, 49], bgBlackBright: [100, 49], bgGray: [100, 49], bgGrey: [100, 49], bgRedBright: [101, 49], bgGreenBright: [102, 49], bgYellowBright: [103, 49], bgBlueBright: [104, 49], bgMagentaBright: [105, 49], bgCyanBright: [106, 49], bgWhiteBright: [107, 49] } };
    Object.keys(r.modifier);
    tD = Object.keys(r.color);
    eD = Object.keys(r.bgColor);
    [...tD, ...eD];
    iD = sD();
    v = /* @__PURE__ */ new Set(["\x1B", "\x9B"]);
    CD = 39;
    w$1 = "\x07";
    W$1 = "[";
    rD = "]";
    R = "m";
    y = `${rD}8;;`;
    V$1 = (t2) => `${v.values().next().value}${W$1}${t2}${R}`;
    z = (t2) => `${v.values().next().value}${y}${t2}${w$1}`;
    ED = (t2) => t2.split(" ").map((u3) => A$1(u3));
    _ = (t2, u3, F3) => {
      const e3 = [...u3];
      let s2 = false, i2 = false, D2 = A$1(T$1(t2[t2.length - 1]));
      for (const [C3, o3] of e3.entries()) {
        const E = A$1(o3);
        if (D2 + E <= F3 ? t2[t2.length - 1] += o3 : (t2.push(o3), D2 = 0), v.has(o3) && (s2 = true, i2 = e3.slice(C3 + 1).join("").startsWith(y)), s2) {
          i2 ? o3 === w$1 && (s2 = false, i2 = false) : o3 === R && (s2 = false);
          continue;
        }
        D2 += E, D2 === F3 && C3 < e3.length - 1 && (t2.push(""), D2 = 0);
      }
      !D2 && t2[t2.length - 1].length > 0 && t2.length > 1 && (t2[t2.length - 2] += t2.pop());
    };
    nD = (t2) => {
      const u3 = t2.split(" ");
      let F3 = u3.length;
      for (; F3 > 0 && !(A$1(u3[F3 - 1]) > 0); ) F3--;
      return F3 === u3.length ? t2 : u3.slice(0, F3).join(" ") + u3.slice(F3).join("");
    };
    oD = (t2, u3, F3 = {}) => {
      if (F3.trim !== false && t2.trim() === "") return "";
      let e3 = "", s2, i2;
      const D2 = ED(t2);
      let C3 = [""];
      for (const [E, a2] of t2.split(" ").entries()) {
        F3.trim !== false && (C3[C3.length - 1] = C3[C3.length - 1].trimStart());
        let n3 = A$1(C3[C3.length - 1]);
        if (E !== 0 && (n3 >= u3 && (F3.wordWrap === false || F3.trim === false) && (C3.push(""), n3 = 0), (n3 > 0 || F3.trim === false) && (C3[C3.length - 1] += " ", n3++)), F3.hard && D2[E] > u3) {
          const B2 = u3 - n3, p = 1 + Math.floor((D2[E] - B2 - 1) / u3);
          Math.floor((D2[E] - 1) / u3) < p && C3.push(""), _(C3, a2, u3);
          continue;
        }
        if (n3 + D2[E] > u3 && n3 > 0 && D2[E] > 0) {
          if (F3.wordWrap === false && n3 < u3) {
            _(C3, a2, u3);
            continue;
          }
          C3.push("");
        }
        if (n3 + D2[E] > u3 && F3.wordWrap === false) {
          _(C3, a2, u3);
          continue;
        }
        C3[C3.length - 1] += a2;
      }
      F3.trim !== false && (C3 = C3.map((E) => nD(E)));
      const o3 = [...C3.join(`
`)];
      for (const [E, a2] of o3.entries()) {
        if (e3 += a2, v.has(a2)) {
          const { groups: B2 } = new RegExp(`(?:\\${W$1}(?<code>\\d+)m|\\${y}(?<uri>.*)${w$1})`).exec(o3.slice(E).join("")) || { groups: {} };
          if (B2.code !== void 0) {
            const p = Number.parseFloat(B2.code);
            s2 = p === CD ? void 0 : p;
          } else B2.uri !== void 0 && (i2 = B2.uri.length === 0 ? void 0 : B2.uri);
        }
        const n3 = iD.codes.get(Number(s2));
        o3[E + 1] === `
` ? (i2 && (e3 += z("")), s2 && n3 && (e3 += V$1(n3))) : a2 === `
` && (s2 && n3 && (e3 += V$1(s2)), i2 && (e3 += z(i2)));
      }
      return e3;
    };
    aD = ["up", "down", "left", "right", "space", "enter", "cancel"];
    c = { actions: new Set(aD), aliases: /* @__PURE__ */ new Map([["k", "up"], ["j", "down"], ["h", "left"], ["l", "right"], ["", "cancel"], ["escape", "cancel"]]) };
    globalThis.process.platform.startsWith("win");
    S = Symbol("clack:cancel");
    AD = Object.defineProperty;
    pD = (t2, u3, F3) => u3 in t2 ? AD(t2, u3, { enumerable: true, configurable: true, writable: true, value: F3 }) : t2[u3] = F3;
    h = (t2, u3, F3) => (pD(t2, typeof u3 != "symbol" ? u3 + "" : u3, F3), F3);
    x = class {
      constructor(u3, F3 = true) {
        h(this, "input"), h(this, "output"), h(this, "_abortSignal"), h(this, "rl"), h(this, "opts"), h(this, "_render"), h(this, "_track", false), h(this, "_prevFrame", ""), h(this, "_subscribers", /* @__PURE__ */ new Map()), h(this, "_cursor", 0), h(this, "state", "initial"), h(this, "error", ""), h(this, "value");
        const { input: e3 = import_node_process.stdin, output: s2 = import_node_process.stdout, render: i2, signal: D2, ...C3 } = u3;
        this.opts = C3, this.onKeypress = this.onKeypress.bind(this), this.close = this.close.bind(this), this.render = this.render.bind(this), this._render = i2.bind(this), this._track = F3, this._abortSignal = D2, this.input = e3, this.output = s2;
      }
      unsubscribe() {
        this._subscribers.clear();
      }
      setSubscriber(u3, F3) {
        const e3 = this._subscribers.get(u3) ?? [];
        e3.push(F3), this._subscribers.set(u3, e3);
      }
      on(u3, F3) {
        this.setSubscriber(u3, { cb: F3 });
      }
      once(u3, F3) {
        this.setSubscriber(u3, { cb: F3, once: true });
      }
      emit(u3, ...F3) {
        const e3 = this._subscribers.get(u3) ?? [], s2 = [];
        for (const i2 of e3) i2.cb(...F3), i2.once && s2.push(() => e3.splice(e3.indexOf(i2), 1));
        for (const i2 of s2) i2();
      }
      prompt() {
        return new Promise((u3, F3) => {
          if (this._abortSignal) {
            if (this._abortSignal.aborted) return this.state = "cancel", this.close(), u3(S);
            this._abortSignal.addEventListener("abort", () => {
              this.state = "cancel", this.close();
            }, { once: true });
          }
          const e3 = new import_node_tty.WriteStream(0);
          e3._write = (s2, i2, D2) => {
            this._track && (this.value = this.rl?.line.replace(/\t/g, ""), this._cursor = this.rl?.cursor ?? 0, this.emit("value", this.value)), D2();
          }, this.input.pipe(e3), this.rl = import_node_readline.default.createInterface({ input: this.input, output: e3, tabSize: 2, prompt: "", escapeCodeTimeout: 50 }), import_node_readline.default.emitKeypressEvents(this.input, this.rl), this.rl.prompt(), this.opts.initialValue !== void 0 && this._track && this.rl.write(this.opts.initialValue), this.input.on("keypress", this.onKeypress), d$1(this.input, true), this.output.on("resize", this.render), this.render(), this.once("submit", () => {
            this.output.write(srcExports.cursor.show), this.output.off("resize", this.render), d$1(this.input, false), u3(this.value);
          }), this.once("cancel", () => {
            this.output.write(srcExports.cursor.show), this.output.off("resize", this.render), d$1(this.input, false), u3(S);
          });
        });
      }
      onKeypress(u3, F3) {
        if (this.state === "error" && (this.state = "active"), F3?.name && (!this._track && c.aliases.has(F3.name) && this.emit("cursor", c.aliases.get(F3.name)), c.actions.has(F3.name) && this.emit("cursor", F3.name)), u3 && (u3.toLowerCase() === "y" || u3.toLowerCase() === "n") && this.emit("confirm", u3.toLowerCase() === "y"), u3 === "	" && this.opts.placeholder && (this.value || (this.rl?.write(this.opts.placeholder), this.emit("value", this.opts.placeholder))), u3 && this.emit("key", u3.toLowerCase()), F3?.name === "return") {
          if (this.opts.validate) {
            const e3 = this.opts.validate(this.value);
            e3 && (this.error = e3 instanceof Error ? e3.message : e3, this.state = "error", this.rl?.write(this.value));
          }
          this.state !== "error" && (this.state = "submit");
        }
        k$1([u3, F3?.name, F3?.sequence], "cancel") && (this.state = "cancel"), (this.state === "submit" || this.state === "cancel") && this.emit("finalize"), this.render(), (this.state === "submit" || this.state === "cancel") && this.close();
      }
      close() {
        this.input.unpipe(), this.input.removeListener("keypress", this.onKeypress), this.output.write(`
`), d$1(this.input, false), this.rl?.close(), this.rl = void 0, this.emit(`${this.state}`, this.value), this.unsubscribe();
      }
      restoreCursor() {
        const u3 = G(this._prevFrame, process.stdout.columns, { hard: true }).split(`
`).length - 1;
        this.output.write(srcExports.cursor.move(-999, u3 * -1));
      }
      render() {
        const u3 = G(this._render(this) ?? "", process.stdout.columns, { hard: true });
        if (u3 !== this._prevFrame) {
          if (this.state === "initial") this.output.write(srcExports.cursor.hide);
          else {
            const F3 = lD(this._prevFrame, u3);
            if (this.restoreCursor(), F3 && F3?.length === 1) {
              const e3 = F3[0];
              this.output.write(srcExports.cursor.move(0, e3)), this.output.write(srcExports.erase.lines(1));
              const s2 = u3.split(`
`);
              this.output.write(s2[e3]), this._prevFrame = u3, this.output.write(srcExports.cursor.move(0, s2.length - e3 - 1));
              return;
            }
            if (F3 && F3?.length > 1) {
              const e3 = F3[0];
              this.output.write(srcExports.cursor.move(0, e3)), this.output.write(srcExports.erase.down());
              const s2 = u3.split(`
`).slice(e3);
              this.output.write(s2.join(`
`)), this._prevFrame = u3;
              return;
            }
            this.output.write(srcExports.erase.down());
          }
          this.output.write(u3), this.state === "initial" && (this.state = "active"), this._prevFrame = u3;
        }
      }
    };
    fD = class extends x {
      get cursor() {
        return this.value ? 0 : 1;
      }
      get _value() {
        return this.cursor === 0;
      }
      constructor(u3) {
        super(u3, false), this.value = !!u3.initialValue, this.on("value", () => {
          this.value = this._value;
        }), this.on("confirm", (F3) => {
          this.output.write(srcExports.cursor.move(0, -1)), this.value = F3, this.state = "submit", this.close();
        }), this.on("cursor", () => {
          this.value = !this.value;
        });
      }
    };
    bD = Object.defineProperty;
    mD = (t2, u3, F3) => u3 in t2 ? bD(t2, u3, { enumerable: true, configurable: true, writable: true, value: F3 }) : t2[u3] = F3;
    Y = (t2, u3, F3) => (mD(t2, typeof u3 != "symbol" ? u3 + "" : u3, F3), F3);
    wD = class extends x {
      constructor(u3) {
        super(u3, false), Y(this, "options"), Y(this, "cursor", 0), this.options = u3.options, this.value = [...u3.initialValues ?? []], this.cursor = Math.max(this.options.findIndex(({ value: F3 }) => F3 === u3.cursorAt), 0), this.on("key", (F3) => {
          F3 === "a" && this.toggleAll();
        }), this.on("cursor", (F3) => {
          switch (F3) {
            case "left":
            case "up":
              this.cursor = this.cursor === 0 ? this.options.length - 1 : this.cursor - 1;
              break;
            case "down":
            case "right":
              this.cursor = this.cursor === this.options.length - 1 ? 0 : this.cursor + 1;
              break;
            case "space":
              this.toggleValue();
              break;
          }
        });
      }
      get _value() {
        return this.options[this.cursor].value;
      }
      toggleAll() {
        const u3 = this.value.length === this.options.length;
        this.value = u3 ? [] : this.options.map((F3) => F3.value);
      }
      toggleValue() {
        const u3 = this.value.includes(this._value);
        this.value = u3 ? this.value.filter((F3) => F3 !== this._value) : [...this.value, this._value];
      }
    };
    SD = Object.defineProperty;
    $D = (t2, u3, F3) => u3 in t2 ? SD(t2, u3, { enumerable: true, configurable: true, writable: true, value: F3 }) : t2[u3] = F3;
    q = (t2, u3, F3) => ($D(t2, typeof u3 != "symbol" ? u3 + "" : u3, F3), F3);
    jD = class extends x {
      constructor(u3) {
        super(u3, false), q(this, "options"), q(this, "cursor", 0), this.options = u3.options, this.cursor = this.options.findIndex(({ value: F3 }) => F3 === u3.initialValue), this.cursor === -1 && (this.cursor = 0), this.changeValue(), this.on("cursor", (F3) => {
          switch (F3) {
            case "left":
            case "up":
              this.cursor = this.cursor === 0 ? this.options.length - 1 : this.cursor - 1;
              break;
            case "down":
            case "right":
              this.cursor = this.cursor === this.options.length - 1 ? 0 : this.cursor + 1;
              break;
          }
          this.changeValue();
        });
      }
      get _value() {
        return this.options[this.cursor];
      }
      changeValue() {
        this.value = this._value.value;
      }
    };
    PD = class extends x {
      get valueWithCursor() {
        if (this.state === "submit") return this.value;
        if (this.cursor >= this.value.length) return `${this.value}\u2588`;
        const u3 = this.value.slice(0, this.cursor), [F3, ...e$1] = this.value.slice(this.cursor);
        return `${u3}${e.inverse(F3)}${e$1.join("")}`;
      }
      get cursor() {
        return this._cursor;
      }
      constructor(u3) {
        super(u3), this.on("finalize", () => {
          this.value || (this.value = u3.defaultValue);
        });
      }
    };
    V = ce();
    u = (t2, n3) => V ? t2 : n3;
    le = u("\u276F", ">");
    L = u("\u25A0", "x");
    W = u("\u25B2", "x");
    C = u("\u2714", "\u221A");
    o = u("");
    d = u("");
    k = u("\u25CF", ">");
    P = u("\u25CB", " ");
    A = u("\u25FB", "[\u2022]");
    T = u("\u25FC", "[+]");
    F = u("\u25FB", "[ ]");
    w = (t2) => {
      switch (t2) {
        case "initial":
        case "active":
          return e.cyan(le);
        case "cancel":
          return e.red(L);
        case "error":
          return e.yellow(W);
        case "submit":
          return e.green(C);
      }
    };
    B = (t2) => {
      const { cursor: n3, options: s2, style: r4 } = t2, i2 = t2.maxItems ?? Number.POSITIVE_INFINITY, a2 = Math.max(process.stdout.rows - 4, 0), c3 = Math.min(a2, Math.max(i2, 5));
      let l2 = 0;
      n3 >= l2 + c3 - 3 ? l2 = Math.max(Math.min(n3 - c3 + 3, s2.length - c3), 0) : n3 < l2 + 2 && (l2 = Math.max(n3 - 2, 0));
      const $ = c3 < s2.length && l2 > 0, p = c3 < s2.length && l2 + c3 < s2.length;
      return s2.slice(l2, l2 + c3).map((M, v2, x2) => {
        const j = v2 === 0 && $, E = v2 === x2.length - 1 && p;
        return j || E ? e.dim("...") : r4(M, v2 + l2 === n3);
      });
    };
    he = (t2) => new PD({ validate: t2.validate, placeholder: t2.placeholder, defaultValue: t2.defaultValue, initialValue: t2.initialValue, render() {
      const n3 = `${e.gray(o)}
${w(this.state)} ${t2.message}
`, s2 = t2.placeholder ? e.inverse(t2.placeholder[0]) + e.dim(t2.placeholder.slice(1)) : e.inverse(e.hidden("_")), r4 = this.value ? this.valueWithCursor : s2;
      switch (this.state) {
        case "error":
          return `${n3.trim()}
${e.yellow(o)} ${r4}
${e.yellow(d)} ${e.yellow(this.error)}
`;
        case "submit":
          return `${n3}${e.gray(o)} ${e.dim(this.value || t2.placeholder)}`;
        case "cancel":
          return `${n3}${e.gray(o)} ${e.strikethrough(e.dim(this.value ?? ""))}${this.value?.trim() ? `
${e.gray(o)}` : ""}`;
        default:
          return `${n3}${e.cyan(o)} ${r4}
${e.cyan(d)}
`;
      }
    } }).prompt();
    ye = (t2) => {
      const n3 = t2.active ?? "Yes", s2 = t2.inactive ?? "No";
      return new fD({ active: n3, inactive: s2, initialValue: t2.initialValue ?? true, render() {
        const r4 = `${e.gray(o)}
${w(this.state)} ${t2.message}
`, i2 = this.value ? n3 : s2;
        switch (this.state) {
          case "submit":
            return `${r4}${e.gray(o)} ${e.dim(i2)}`;
          case "cancel":
            return `${r4}${e.gray(o)} ${e.strikethrough(e.dim(i2))}
${e.gray(o)}`;
          default:
            return `${r4}${e.cyan(o)} ${this.value ? `${e.green(k)} ${n3}` : `${e.dim(P)} ${e.dim(n3)}`} ${e.dim("/")} ${this.value ? `${e.dim(P)} ${e.dim(s2)}` : `${e.green(k)} ${s2}`}
${e.cyan(d)}
`;
        }
      } }).prompt();
    };
    ve = (t2) => {
      const n3 = (s2, r4) => {
        const i2 = s2.label ?? String(s2.value);
        switch (r4) {
          case "selected":
            return `${e.dim(i2)}`;
          case "active":
            return `${e.green(k)} ${i2} ${s2.hint ? e.dim(`(${s2.hint})`) : ""}`;
          case "cancelled":
            return `${e.strikethrough(e.dim(i2))}`;
          default:
            return `${e.dim(P)} ${e.dim(i2)}`;
        }
      };
      return new jD({ options: t2.options, initialValue: t2.initialValue, render() {
        const s2 = `${e.gray(o)}
${w(this.state)} ${t2.message}
`;
        switch (this.state) {
          case "submit":
            return `${s2}${e.gray(o)} ${n3(this.options[this.cursor], "selected")}`;
          case "cancel":
            return `${s2}${e.gray(o)} ${n3(this.options[this.cursor], "cancelled")}
${e.gray(o)}`;
          default:
            return `${s2}${e.cyan(o)} ${B({ cursor: this.cursor, options: this.options, maxItems: t2.maxItems, style: (r4, i2) => n3(r4, i2 ? "active" : "inactive") }).join(`
${e.cyan(o)}  `)}
${e.cyan(d)}
`;
        }
      } }).prompt();
    };
    fe = (t2) => {
      const n3 = (s2, r4) => {
        const i2 = s2.label ?? String(s2.value);
        return r4 === "active" ? `${e.cyan(A)} ${i2} ${s2.hint ? e.dim(`(${s2.hint})`) : ""}` : r4 === "selected" ? `${e.green(T)} ${e.dim(i2)}` : r4 === "cancelled" ? `${e.strikethrough(e.dim(i2))}` : r4 === "active-selected" ? `${e.green(T)} ${i2} ${s2.hint ? e.dim(`(${s2.hint})`) : ""}` : r4 === "submitted" ? `${e.dim(i2)}` : `${e.dim(F)} ${e.dim(i2)}`;
      };
      return new wD({ options: t2.options, initialValues: t2.initialValues, required: t2.required ?? true, cursorAt: t2.cursorAt, validate(s2) {
        if (this.required && s2.length === 0) return `Please select at least one option.
${e.reset(e.dim(`Press ${e.gray(e.bgWhite(e.inverse(" space ")))} to select, ${e.gray(e.bgWhite(e.inverse(" enter ")))} to submit`))}`;
      }, render() {
        const s2 = `${e.gray(o)}
${w(this.state)} ${t2.message}
`, r4 = (i2, a2) => {
          const c3 = this.value.includes(i2.value);
          return a2 && c3 ? n3(i2, "active-selected") : c3 ? n3(i2, "selected") : n3(i2, a2 ? "active" : "inactive");
        };
        switch (this.state) {
          case "submit":
            return `${s2}${e.gray(o)} ${this.options.filter(({ value: i2 }) => this.value.includes(i2)).map((i2) => n3(i2, "submitted")).join(e.dim(", ")) || e.dim("none")}`;
          case "cancel": {
            const i2 = this.options.filter(({ value: a2 }) => this.value.includes(a2)).map((a2) => n3(a2, "cancelled")).join(e.dim(", "));
            return `${s2}${e.gray(o)} ${i2.trim() ? `${i2}
${e.gray(o)}` : ""}`;
          }
          case "error": {
            const i2 = this.error.split(`
`).map((a2, c3) => c3 === 0 ? `${e.yellow(d)} ${e.yellow(a2)}` : `   ${a2}`).join(`
`);
            return `${s2 + e.yellow(o)} ${B({ options: this.options, cursor: this.cursor, maxItems: t2.maxItems, style: r4 }).join(`
${e.yellow(o)}  `)}
${i2}
`;
          }
          default:
            return `${s2}${e.cyan(o)} ${B({ options: this.options, cursor: this.cursor, maxItems: t2.maxItems, style: r4 }).join(`
${e.cyan(o)}  `)}
${e.cyan(d)}
`;
        }
      } }).prompt();
    };
    `${e.gray(o)}  `;
    kCancel = Symbol.for("cancel");
  }
});

// ../node_modules/dxtn/DXTUtils.js
var require_DXTUtils = __commonJS({
  "../node_modules/dxtn/DXTUtils.js"(exports2, module2) {
    module2.exports = {
      generateDXT1Lookup(colorValue0, colorValue1, out = null) {
        let color0 = this.getComponentsFromRGB565(colorValue0);
        let color1 = this.getComponentsFromRGB565(colorValue1);
        let lookup = out || new Uint8Array(16);
        if (colorValue0 > colorValue1) {
          lookup[0] = Math.floor(color0.R * 255);
          lookup[1] = Math.floor(color0.G * 255);
          lookup[2] = Math.floor(color0.B * 255);
          lookup[3] = Math.floor(255);
          lookup[4] = Math.floor(color1.R * 255);
          lookup[5] = Math.floor(color1.G * 255);
          lookup[6] = Math.floor(color1.B * 255);
          lookup[7] = Math.floor(255);
          lookup[8] = Math.floor((color0.R * 2 / 3 + color1.R * 1 / 3) * 255);
          lookup[9] = Math.floor((color0.G * 2 / 3 + color1.G * 1 / 3) * 255);
          lookup[10] = Math.floor((color0.B * 2 / 3 + color1.B * 1 / 3) * 255);
          lookup[11] = Math.floor(255);
          lookup[12] = Math.floor((color0.R * 1 / 3 + color1.R * 2 / 3) * 255);
          lookup[13] = Math.floor((color0.G * 1 / 3 + color1.G * 2 / 3) * 255);
          lookup[14] = Math.floor((color0.B * 1 / 3 + color1.B * 2 / 3) * 255);
          lookup[15] = Math.floor(255);
        } else {
          lookup[0] = Math.floor(color0.R * 255);
          lookup[1] = Math.floor(color0.G * 255);
          lookup[2] = Math.floor(color0.B * 255);
          lookup[3] = Math.floor(255);
          lookup[4] = Math.floor((color0.R * 1 / 2 + color1.R * 1 / 2) * 255);
          lookup[5] = Math.floor((color0.G * 1 / 2 + color1.G * 1 / 2) * 255);
          lookup[6] = Math.floor((color0.B * 1 / 2 + color1.B * 1 / 2) * 255);
          lookup[7] = Math.floor(255);
          lookup[8] = Math.floor(color1.R * 255);
          lookup[9] = Math.floor(color1.G * 255);
          lookup[10] = Math.floor(color1.B * 255);
          lookup[11] = Math.floor(255);
          lookup[12] = Math.floor(0);
          lookup[13] = Math.floor(0);
          lookup[14] = Math.floor(0);
          lookup[15] = Math.floor(0);
        }
        return lookup;
      },
      generateDXT5AlphaLookup(alpha0, alpha1, array = null) {
        let alphaLookup = array || new Uint8Array(8);
        alphaLookup[0] = alpha0;
        alphaLookup[1] = alpha1;
        if (alpha0 > alpha1) {
          alphaLookup[2] = Math.round((6 * alpha0 + 1 * alpha1) / 7);
          alphaLookup[3] = Math.round((5 * alpha0 + 2 * alpha1) / 7);
          alphaLookup[4] = Math.round((4 * alpha0 + 3 * alpha1) / 7);
          alphaLookup[5] = Math.round((3 * alpha0 + 4 * alpha1) / 7);
          alphaLookup[6] = Math.round((2 * alpha0 + 5 * alpha1) / 7);
          alphaLookup[7] = Math.round((1 * alpha0 + 6 * alpha1) / 7);
        } else {
          alphaLookup[2] = Math.round((4 * alpha0 + 1 * alpha1) / 5);
          alphaLookup[3] = Math.round((3 * alpha0 + 2 * alpha1) / 5);
          alphaLookup[4] = Math.round((2 * alpha0 + 3 * alpha1) / 5);
          alphaLookup[5] = Math.round((1 * alpha0 + 4 * alpha1) / 5);
          alphaLookup[6] = 0;
          alphaLookup[7] = 255;
        }
        return alphaLookup;
      },
      getError(pixels, block) {
        let error = 0;
        for (let i2 in pixels) {
          error += Math.abs(pixels[i2] - block[i2]);
        }
        return error;
      },
      findNearestOnLookup(color, lookup) {
        let minDistance = Infinity;
        let minIndex = 0;
        for (let i2 = 0; i2 < lookup.length; i2 += 4) {
          let deltaR = color[0] - lookup[i2 + 0];
          let deltaG = color[1] - lookup[i2 + 1];
          let deltaB = color[2] - lookup[i2 + 2];
          let deltaA = color[3] - lookup[i2 + 3];
          let distance = deltaR * deltaR + deltaB * deltaB + deltaG * deltaG + deltaA * deltaA;
          if (distance < minDistance) {
            minDistance = distance;
            minIndex = i2 / 4;
          }
        }
        return minIndex;
      },
      getComponentsFromRGB565(color) {
        return {
          R: ((color & 63488) >> 8) / 255,
          G: ((color & 2016) >> 3) / 255,
          B: ((color & 31) << 3) / 255
        };
      },
      makeRGB565(r4, g3, b2) {
        return (r4 & 248) << 8 | (g3 & 252) << 3 | (b2 & 248) >> 3;
      }
    };
  }
});

// ../node_modules/dxtn/DXT.js
var require_DXT = __commonJS({
  "../node_modules/dxtn/DXT.js"(exports2, module2) {
    var DXT1BlockSize = 8;
    var DXT3BlockSize = 16;
    var DXT5BlockSize = 16;
    var RGBABlockSize = 64;
    var BlockWidth = 4;
    var BlockHeight = 4;
    var AlphaTest = 127;
    var DXTUtils = require_DXTUtils();
    var alphaLookupBuffer = new Uint8Array(8);
    var colorLookupBuffer = new Uint8Array(16);
    var tmpDXT5AlphaBuffer = new Uint8Array(16);
    function compressBlockDXT1(pixels, outArray = null, forceNoAlpha = false) {
      let maxR = 0;
      let maxG = 0;
      let maxB = 0;
      let minR = 255;
      let minG = 255;
      let minB = 255;
      let minA = 255;
      let maxA = 0;
      for (let i2 = 0; i2 < pixels.length; i2 += 4) {
        let r4 = pixels[i2 + 0];
        let g3 = pixels[i2 + 1];
        let b2 = pixels[i2 + 2];
        let a2 = pixels[i2 + 3];
        if (a2 < minA) minA = a2;
        if (a2 > maxA) maxA = a2;
        if (a2 == 0) continue;
        if (r4 > maxR) maxR = r4;
        if (g3 > maxG) maxG = g3;
        if (b2 > maxB) maxB = b2;
        if (r4 < minR) minR = r4;
        if (g3 < minG) minG = g3;
        if (b2 < minB) minB = b2;
      }
      let c0 = ((maxR & 248) << 8) + ((maxG & 252) << 3) + ((maxB & 248) >> 3);
      let c1 = ((minR & 248) << 8) + ((minG & 252) << 3) + ((minB & 248) >> 3);
      if (minA < AlphaTest && !forceNoAlpha) {
        let temp = c0;
        c0 = c1;
        c1 = temp;
        if (maxA == 0) {
          c1 = 65535;
        }
      }
      let lookup = DXTUtils.generateDXT1Lookup(c0, c1, colorLookupBuffer);
      let out = outArray || new Uint8Array(DXT1BlockSize);
      let indices = [];
      for (let i2 = 0; i2 < pixels.length; i2 += 4) {
        let index = DXTUtils.findNearestOnLookup([
          pixels[i2],
          pixels[i2 + 1],
          pixels[i2 + 2],
          pixels[i2 + 3]
        ], lookup);
        indices.push(index);
      }
      out[0] = c0 & 255;
      out[1] = (c0 & 65280) >> 8;
      out[2] = c1 & 255;
      out[3] = (c1 & 65280) >> 8;
      out[4] = indices[0] << 6 | indices[1] << 4 | indices[2] << 2 | indices[3];
      out[5] = indices[4] << 6 | indices[5] << 4 | indices[6] << 2 | indices[7];
      out[6] = indices[8] << 6 | indices[9] << 4 | indices[10] << 2 | indices[11];
      out[7] = indices[12] << 6 | indices[13] << 4 | indices[14] << 2 | indices[15];
      return out;
    }
    function compressBlockDXT3(pixels, outArray = null) {
      let out = outArray || new Uint8Array(DXT3BlockSize);
      compressBlockDXT1(pixels, out, true);
      for (let i2 = 0; i2 < 4; i2++) {
        out[8 + i2 * 2] = out[i2 * 2];
        out[9 + i2 * 2] = out[i2 * 2 + 1];
        out[i2 * 2 + 0] = (pixels[i2 * 16 + 11] & 240) >> 0 | (pixels[i2 * 16 + 15] & 240) >> 4;
        out[i2 * 2 + 1] = (pixels[i2 * 16 + 7] & 240) >> 4 | (pixels[i2 * 16 + 3] & 240) >> 0;
      }
      return out;
    }
    function compressBlockDXT5(pixels, outArray = null) {
      let out = outArray || new Uint8Array(DXT5BlockSize);
      compressBlockDXT1(pixels, out, true);
      let minAlpha = 255;
      let maxAlpha = 0;
      for (let i2 = 0; i2 < 16; i2++) {
        minAlpha = Math.min(pixels[i2 * 4 + 3], minAlpha);
        maxAlpha = Math.max(pixels[i2 * 4 + 3], maxAlpha);
      }
      for (let i2 = 0; i2 < 8; i2++) {
        out[i2 + 8] = out[i2];
      }
      out[0] = minAlpha;
      out[1] = maxAlpha;
      let alphaLookup = DXTUtils.generateDXT5AlphaLookup(minAlpha, maxAlpha, alphaLookupBuffer);
      let alphaIndices = tmpDXT5AlphaBuffer;
      for (let i2 = 0; i2 < 16; i2++) {
        let srcAlpha = pixels[i2 * 4 + 3];
        let nearestIndex = 0;
        let nearestDistance = 255;
        for (let j = 0; j < 8; j++) {
          let delta = Math.abs(srcAlpha - alphaLookup[j]);
          if (delta < nearestDistance) {
            nearestDistance = delta;
            nearestIndex = j;
          }
        }
        alphaIndices[i2] = nearestIndex;
      }
      let out234 = alphaIndices[3] | alphaIndices[2] << 3 | alphaIndices[1] << 6 | alphaIndices[0] << 9 | alphaIndices[7] << 12 | alphaIndices[6] << 15 | alphaIndices[5] << 18 | alphaIndices[4] << 21;
      out[2] = out234 & 255;
      out[3] = (out234 & 65280) >> 8;
      out[4] = (out234 & 16711680) >> 16;
      let out567 = alphaIndices[11] | alphaIndices[10] << 3 | alphaIndices[9] << 6 | alphaIndices[8] << 9 | alphaIndices[15] << 12 | alphaIndices[14] << 15 | alphaIndices[13] << 18 | alphaIndices[12] << 21;
      out[5] = out567 & 255;
      out[6] = (out567 & 65280) >> 8;
      out[7] = (out567 & 16711680) >> 16;
      return out;
    }
    function decompressBlockDXT1(data, outArray = null) {
      if (data.length != DXT1BlockSize) return false;
      const cVal0 = (data[1] << 8) + data[0];
      const cVal1 = (data[3] << 8) + data[2];
      const lookup = DXTUtils.generateDXT1Lookup(cVal0, cVal1);
      const out = outArray || new Uint8Array(RGBABlockSize);
      for (let i2 = 0; i2 < 16; i2++) {
        let bitOffset = i2 * 2;
        let byte = 4 + Math.floor(bitOffset / 8);
        let bits = data[byte] >> bitOffset % 8 & 3;
        out[i2 * 4 + 0] = lookup[bits * 4 + 0];
        out[i2 * 4 + 1] = lookup[bits * 4 + 1];
        out[i2 * 4 + 2] = lookup[bits * 4 + 2];
        out[i2 * 4 + 3] = lookup[bits * 4 + 3];
      }
      return out;
    }
    function decompressBlockDXT3(data, outArray = null) {
      const out = outArray || new Uint8Array(RGBABlockSize);
      decompressBlockDXT1(data.slice(8, 16), out);
      for (let i2 = 0; i2 < 8; i2++) {
        out[i2 * 8 + 3] = (data[i2] & 15) << 4;
        out[i2 * 8 + 7] = data[i2] & 240;
      }
      return out;
    }
    function decompressBlockDXT5(data, outArray = null) {
      const out = outArray || new Uint8Array(RGBABlockSize);
      decompressBlockDXT1(data.slice(8, 16), out);
      let alpha0 = data[0];
      let alpha1 = data[1];
      let alphaLookup = DXTUtils.generateDXT5AlphaLookup(alpha0, alpha1, alphaLookupBuffer);
      out[31] = alphaLookup[(data[4] & 224) >> 5];
      out[27] = alphaLookup[(data[4] & 28) >> 2];
      out[23] = alphaLookup[((data[4] & 3) << 1) + ((data[3] & 128) >> 7)];
      out[19] = alphaLookup[(data[3] & 112) >> 4];
      out[15] = alphaLookup[(data[3] & 14) >> 1];
      out[11] = alphaLookup[((data[3] & 1) << 2) + ((data[2] & 192) >> 6)];
      out[7] = alphaLookup[(data[2] & 56) >> 3];
      out[3] = alphaLookup[(data[2] & 7) >> 0];
      out[63] = alphaLookup[(data[7] & 224) >> 5];
      out[59] = alphaLookup[(data[7] & 28) >> 2];
      out[55] = alphaLookup[((data[7] & 3) << 1) + ((data[6] & 128) >> 7)];
      out[51] = alphaLookup[(data[6] & 112) >> 4];
      out[47] = alphaLookup[(data[6] & 14) >> 1];
      out[43] = alphaLookup[((data[6] & 1) << 2) + ((data[5] & 192) >> 6)];
      out[39] = alphaLookup[(data[5] & 56) >> 3];
      out[35] = alphaLookup[(data[5] & 7) >> 0];
      return out;
    }
    function compress(width, height, pixels, compression) {
      if (width % BlockWidth != 0) throw new Error("Width of the texture must be divisible by 4");
      if (height % BlockHeight != 0) throw new Error("Height of the texture must be divisible by 4");
      if (width < BlockWidth || height < BlockHeight) throw new Error("Size of the texture is to small");
      if (width * height * (RGBABlockSize / (BlockHeight * BlockWidth)) != pixels.length) throw new Error("Pixel data of the input does not match dimensions");
      let w2 = width / BlockWidth;
      let h2 = height / BlockHeight;
      let blockNumber = w2 * h2;
      let buffer = new Uint8Array(blockNumber * compression.blockSize);
      let rgbaBlock = new Uint8Array(RGBABlockSize);
      let dxtBlock = new Uint8Array(compression.blockSize);
      for (let i2 = 0; i2 < blockNumber; i2++) {
        let pixelX = i2 % w2 * 4;
        let pixelY = Math.floor(i2 / w2) * 4;
        let j = 0;
        for (let y3 = 0; y3 < 4; y3++) {
          for (let x2 = 3; x2 >= 0; x2--) {
            let px = x2 + pixelX;
            let py = y3 + pixelY;
            let baseOffset = px * 4 + py * 4 * width;
            rgbaBlock[j + 0] = pixels[baseOffset + 0];
            rgbaBlock[j + 1] = pixels[baseOffset + 1];
            rgbaBlock[j + 2] = pixels[baseOffset + 2];
            rgbaBlock[j + 3] = pixels[baseOffset + 3];
            j += 4;
          }
        }
        let compressed = compression.blockCompressMethod(rgbaBlock, dxtBlock);
        for (let j2 = 0; j2 < compression.blockSize; j2++) {
          buffer[i2 * compression.blockSize + j2] = compressed[j2];
        }
      }
      return buffer;
    }
    function decompress(width, height, data, compression) {
      if (width % BlockWidth != 0) throw new Error("Width of the texture must be divisible by 4");
      if (height % BlockHeight != 0) throw new Error("Height of the texture must be divisible by 4");
      if (width < BlockWidth || height < BlockHeight) throw new Error("Size of the texture is to small");
      let w2 = width / BlockWidth;
      let h2 = height / BlockHeight;
      let blockNumber = w2 * h2;
      if (blockNumber * compression.blockSize != data.length) throw new Error("Data does not match dimensions");
      let out = new Uint8Array(width * height * 4);
      let blockBuffer = new Uint8Array(RGBABlockSize);
      for (let i2 = 0; i2 < blockNumber; i2++) {
        let decompressed = compression.blockDecompressMethod(data.slice(i2 * compression.blockSize, (i2 + 1) * compression.blockSize), blockBuffer);
        let pixelX = i2 % w2 * 4;
        let pixelY = Math.floor(i2 / w2) * 4;
        let j = 0;
        for (let y3 = 0; y3 < 4; y3++) {
          for (let x2 = 0; x2 < 4; x2++) {
            let px = x2 + pixelX;
            let py = y3 + pixelY;
            out[px * 4 + py * 4 * width] = decompressed[j];
            out[px * 4 + py * 4 * width + 1] = decompressed[j + 1];
            out[px * 4 + py * 4 * width + 2] = decompressed[j + 2];
            out[px * 4 + py * 4 * width + 3] = decompressed[j + 3];
            j += 4;
          }
        }
      }
      return out;
    }
    module2.exports = {
      DXT1: {
        compress(width, height, pixels) {
          return compress(width, height, pixels, {
            blockSize: DXT1BlockSize,
            blockCompressMethod: compressBlockDXT1
          });
        },
        decompress(width, height, data) {
          return decompress(width, height, data, {
            blockSize: DXT1BlockSize,
            blockDecompressMethod: decompressBlockDXT1
          });
        }
      },
      DXT3: {
        compress(width, height, pixels) {
          return compress(width, height, pixels, {
            blockSize: DXT3BlockSize,
            blockCompressMethod: compressBlockDXT3
          });
        },
        decompress(width, height, data) {
          return decompress(width, height, data, {
            blockSize: DXT3BlockSize,
            blockDecompressMethod: decompressBlockDXT3
          });
        }
      },
      DXT5: {
        compress(width, height, pixels) {
          return compress(width, height, pixels, {
            blockSize: DXT5BlockSize,
            blockCompressMethod: compressBlockDXT5
          });
        },
        decompress(width, height, data) {
          return decompress(width, height, data, {
            blockSize: DXT5BlockSize,
            blockDecompressMethod: decompressBlockDXT5
          });
        }
      }
    };
  }
});

// ../node_modules/dxtn/index.js
var require_dxtn = __commonJS({
  "../node_modules/dxtn/index.js"(exports2, module2) {
    var DXT = require_DXT();
    function compressDXT1(width, height, rgba8888) {
      return DXT.DXT1.compress(width, height, rgba8888);
    }
    function compressDXT3(width, height, rgba8888) {
      return DXT.DXT3.compress(width, height, rgba8888);
    }
    function compressDXT5(width, height, rgba8888) {
      return DXT.DXT5.compress(width, height, rgba8888);
    }
    function decompressDXT1(width, height, rgba8888) {
      return DXT.DXT1.decompress(width, height, rgba8888);
    }
    function decompressDXT3(width, height, rgba8888) {
      return DXT.DXT3.decompress(width, height, rgba8888);
    }
    function decompressDXT52(width, height, rgba8888) {
      return DXT.DXT5.decompress(width, height, rgba8888);
    }
    module2.exports = {
      compressDXT1,
      decompressDXT1,
      compressDXT3,
      decompressDXT3,
      compressDXT5,
      decompressDXT5: decompressDXT52
    };
  }
});

// ../node_modules/pngjs/lib/chunkstream.js
var require_chunkstream = __commonJS({
  "../node_modules/pngjs/lib/chunkstream.js"(exports2, module2) {
    "use strict";
    var util = require("util");
    var Stream = require("stream");
    var ChunkStream = module2.exports = function() {
      Stream.call(this);
      this._buffers = [];
      this._buffered = 0;
      this._reads = [];
      this._paused = false;
      this._encoding = "utf8";
      this.writable = true;
    };
    util.inherits(ChunkStream, Stream);
    ChunkStream.prototype.read = function(length, callback) {
      this._reads.push({
        length: Math.abs(length),
        // if length < 0 then at most this length
        allowLess: length < 0,
        func: callback
      });
      process.nextTick(
        function() {
          this._process();
          if (this._paused && this._reads && this._reads.length > 0) {
            this._paused = false;
            this.emit("drain");
          }
        }.bind(this)
      );
    };
    ChunkStream.prototype.write = function(data, encoding) {
      if (!this.writable) {
        this.emit("error", new Error("Stream not writable"));
        return false;
      }
      let dataBuffer;
      if (Buffer.isBuffer(data)) {
        dataBuffer = data;
      } else {
        dataBuffer = Buffer.from(data, encoding || this._encoding);
      }
      this._buffers.push(dataBuffer);
      this._buffered += dataBuffer.length;
      this._process();
      if (this._reads && this._reads.length === 0) {
        this._paused = true;
      }
      return this.writable && !this._paused;
    };
    ChunkStream.prototype.end = function(data, encoding) {
      if (data) {
        this.write(data, encoding);
      }
      this.writable = false;
      if (!this._buffers) {
        return;
      }
      if (this._buffers.length === 0) {
        this._end();
      } else {
        this._buffers.push(null);
        this._process();
      }
    };
    ChunkStream.prototype.destroySoon = ChunkStream.prototype.end;
    ChunkStream.prototype._end = function() {
      if (this._reads.length > 0) {
        this.emit("error", new Error("Unexpected end of input"));
      }
      this.destroy();
    };
    ChunkStream.prototype.destroy = function() {
      if (!this._buffers) {
        return;
      }
      this.writable = false;
      this._reads = null;
      this._buffers = null;
      this.emit("close");
    };
    ChunkStream.prototype._processReadAllowingLess = function(read) {
      this._reads.shift();
      let smallerBuf = this._buffers[0];
      if (smallerBuf.length > read.length) {
        this._buffered -= read.length;
        this._buffers[0] = smallerBuf.slice(read.length);
        read.func.call(this, smallerBuf.slice(0, read.length));
      } else {
        this._buffered -= smallerBuf.length;
        this._buffers.shift();
        read.func.call(this, smallerBuf);
      }
    };
    ChunkStream.prototype._processRead = function(read) {
      this._reads.shift();
      let pos = 0;
      let count = 0;
      let data = Buffer.alloc(read.length);
      while (pos < read.length) {
        let buf = this._buffers[count++];
        let len = Math.min(buf.length, read.length - pos);
        buf.copy(data, pos, 0, len);
        pos += len;
        if (len !== buf.length) {
          this._buffers[--count] = buf.slice(len);
        }
      }
      if (count > 0) {
        this._buffers.splice(0, count);
      }
      this._buffered -= read.length;
      read.func.call(this, data);
    };
    ChunkStream.prototype._process = function() {
      try {
        while (this._buffered > 0 && this._reads && this._reads.length > 0) {
          let read = this._reads[0];
          if (read.allowLess) {
            this._processReadAllowingLess(read);
          } else if (this._buffered >= read.length) {
            this._processRead(read);
          } else {
            break;
          }
        }
        if (this._buffers && !this.writable) {
          this._end();
        }
      } catch (ex) {
        this.emit("error", ex);
      }
    };
  }
});

// ../node_modules/pngjs/lib/interlace.js
var require_interlace = __commonJS({
  "../node_modules/pngjs/lib/interlace.js"(exports2) {
    "use strict";
    var imagePasses = [
      {
        // pass 1 - 1px
        x: [0],
        y: [0]
      },
      {
        // pass 2 - 1px
        x: [4],
        y: [0]
      },
      {
        // pass 3 - 2px
        x: [0, 4],
        y: [4]
      },
      {
        // pass 4 - 4px
        x: [2, 6],
        y: [0, 4]
      },
      {
        // pass 5 - 8px
        x: [0, 2, 4, 6],
        y: [2, 6]
      },
      {
        // pass 6 - 16px
        x: [1, 3, 5, 7],
        y: [0, 2, 4, 6]
      },
      {
        // pass 7 - 32px
        x: [0, 1, 2, 3, 4, 5, 6, 7],
        y: [1, 3, 5, 7]
      }
    ];
    exports2.getImagePasses = function(width, height) {
      let images = [];
      let xLeftOver = width % 8;
      let yLeftOver = height % 8;
      let xRepeats = (width - xLeftOver) / 8;
      let yRepeats = (height - yLeftOver) / 8;
      for (let i2 = 0; i2 < imagePasses.length; i2++) {
        let pass = imagePasses[i2];
        let passWidth = xRepeats * pass.x.length;
        let passHeight = yRepeats * pass.y.length;
        for (let j = 0; j < pass.x.length; j++) {
          if (pass.x[j] < xLeftOver) {
            passWidth++;
          } else {
            break;
          }
        }
        for (let j = 0; j < pass.y.length; j++) {
          if (pass.y[j] < yLeftOver) {
            passHeight++;
          } else {
            break;
          }
        }
        if (passWidth > 0 && passHeight > 0) {
          images.push({ width: passWidth, height: passHeight, index: i2 });
        }
      }
      return images;
    };
    exports2.getInterlaceIterator = function(width) {
      return function(x2, y3, pass) {
        let outerXLeftOver = x2 % imagePasses[pass].x.length;
        let outerX = (x2 - outerXLeftOver) / imagePasses[pass].x.length * 8 + imagePasses[pass].x[outerXLeftOver];
        let outerYLeftOver = y3 % imagePasses[pass].y.length;
        let outerY = (y3 - outerYLeftOver) / imagePasses[pass].y.length * 8 + imagePasses[pass].y[outerYLeftOver];
        return outerX * 4 + outerY * width * 4;
      };
    };
  }
});

// ../node_modules/pngjs/lib/paeth-predictor.js
var require_paeth_predictor = __commonJS({
  "../node_modules/pngjs/lib/paeth-predictor.js"(exports2, module2) {
    "use strict";
    module2.exports = function paethPredictor(left, above, upLeft) {
      let paeth = left + above - upLeft;
      let pLeft = Math.abs(paeth - left);
      let pAbove = Math.abs(paeth - above);
      let pUpLeft = Math.abs(paeth - upLeft);
      if (pLeft <= pAbove && pLeft <= pUpLeft) {
        return left;
      }
      if (pAbove <= pUpLeft) {
        return above;
      }
      return upLeft;
    };
  }
});

// ../node_modules/pngjs/lib/filter-parse.js
var require_filter_parse = __commonJS({
  "../node_modules/pngjs/lib/filter-parse.js"(exports2, module2) {
    "use strict";
    var interlaceUtils = require_interlace();
    var paethPredictor = require_paeth_predictor();
    function getByteWidth(width, bpp, depth) {
      let byteWidth = width * bpp;
      if (depth !== 8) {
        byteWidth = Math.ceil(byteWidth / (8 / depth));
      }
      return byteWidth;
    }
    var Filter = module2.exports = function(bitmapInfo, dependencies) {
      let width = bitmapInfo.width;
      let height = bitmapInfo.height;
      let interlace = bitmapInfo.interlace;
      let bpp = bitmapInfo.bpp;
      let depth = bitmapInfo.depth;
      this.read = dependencies.read;
      this.write = dependencies.write;
      this.complete = dependencies.complete;
      this._imageIndex = 0;
      this._images = [];
      if (interlace) {
        let passes = interlaceUtils.getImagePasses(width, height);
        for (let i2 = 0; i2 < passes.length; i2++) {
          this._images.push({
            byteWidth: getByteWidth(passes[i2].width, bpp, depth),
            height: passes[i2].height,
            lineIndex: 0
          });
        }
      } else {
        this._images.push({
          byteWidth: getByteWidth(width, bpp, depth),
          height,
          lineIndex: 0
        });
      }
      if (depth === 8) {
        this._xComparison = bpp;
      } else if (depth === 16) {
        this._xComparison = bpp * 2;
      } else {
        this._xComparison = 1;
      }
    };
    Filter.prototype.start = function() {
      this.read(
        this._images[this._imageIndex].byteWidth + 1,
        this._reverseFilterLine.bind(this)
      );
    };
    Filter.prototype._unFilterType1 = function(rawData, unfilteredLine, byteWidth) {
      let xComparison = this._xComparison;
      let xBiggerThan = xComparison - 1;
      for (let x2 = 0; x2 < byteWidth; x2++) {
        let rawByte = rawData[1 + x2];
        let f1Left = x2 > xBiggerThan ? unfilteredLine[x2 - xComparison] : 0;
        unfilteredLine[x2] = rawByte + f1Left;
      }
    };
    Filter.prototype._unFilterType2 = function(rawData, unfilteredLine, byteWidth) {
      let lastLine = this._lastLine;
      for (let x2 = 0; x2 < byteWidth; x2++) {
        let rawByte = rawData[1 + x2];
        let f2Up = lastLine ? lastLine[x2] : 0;
        unfilteredLine[x2] = rawByte + f2Up;
      }
    };
    Filter.prototype._unFilterType3 = function(rawData, unfilteredLine, byteWidth) {
      let xComparison = this._xComparison;
      let xBiggerThan = xComparison - 1;
      let lastLine = this._lastLine;
      for (let x2 = 0; x2 < byteWidth; x2++) {
        let rawByte = rawData[1 + x2];
        let f3Up = lastLine ? lastLine[x2] : 0;
        let f3Left = x2 > xBiggerThan ? unfilteredLine[x2 - xComparison] : 0;
        let f3Add = Math.floor((f3Left + f3Up) / 2);
        unfilteredLine[x2] = rawByte + f3Add;
      }
    };
    Filter.prototype._unFilterType4 = function(rawData, unfilteredLine, byteWidth) {
      let xComparison = this._xComparison;
      let xBiggerThan = xComparison - 1;
      let lastLine = this._lastLine;
      for (let x2 = 0; x2 < byteWidth; x2++) {
        let rawByte = rawData[1 + x2];
        let f4Up = lastLine ? lastLine[x2] : 0;
        let f4Left = x2 > xBiggerThan ? unfilteredLine[x2 - xComparison] : 0;
        let f4UpLeft = x2 > xBiggerThan && lastLine ? lastLine[x2 - xComparison] : 0;
        let f4Add = paethPredictor(f4Left, f4Up, f4UpLeft);
        unfilteredLine[x2] = rawByte + f4Add;
      }
    };
    Filter.prototype._reverseFilterLine = function(rawData) {
      let filter = rawData[0];
      let unfilteredLine;
      let currentImage = this._images[this._imageIndex];
      let byteWidth = currentImage.byteWidth;
      if (filter === 0) {
        unfilteredLine = rawData.slice(1, byteWidth + 1);
      } else {
        unfilteredLine = Buffer.alloc(byteWidth);
        switch (filter) {
          case 1:
            this._unFilterType1(rawData, unfilteredLine, byteWidth);
            break;
          case 2:
            this._unFilterType2(rawData, unfilteredLine, byteWidth);
            break;
          case 3:
            this._unFilterType3(rawData, unfilteredLine, byteWidth);
            break;
          case 4:
            this._unFilterType4(rawData, unfilteredLine, byteWidth);
            break;
          default:
            throw new Error("Unrecognised filter type - " + filter);
        }
      }
      this.write(unfilteredLine);
      currentImage.lineIndex++;
      if (currentImage.lineIndex >= currentImage.height) {
        this._lastLine = null;
        this._imageIndex++;
        currentImage = this._images[this._imageIndex];
      } else {
        this._lastLine = unfilteredLine;
      }
      if (currentImage) {
        this.read(currentImage.byteWidth + 1, this._reverseFilterLine.bind(this));
      } else {
        this._lastLine = null;
        this.complete();
      }
    };
  }
});

// ../node_modules/pngjs/lib/filter-parse-async.js
var require_filter_parse_async = __commonJS({
  "../node_modules/pngjs/lib/filter-parse-async.js"(exports2, module2) {
    "use strict";
    var util = require("util");
    var ChunkStream = require_chunkstream();
    var Filter = require_filter_parse();
    var FilterAsync = module2.exports = function(bitmapInfo) {
      ChunkStream.call(this);
      let buffers = [];
      let that = this;
      this._filter = new Filter(bitmapInfo, {
        read: this.read.bind(this),
        write: function(buffer) {
          buffers.push(buffer);
        },
        complete: function() {
          that.emit("complete", Buffer.concat(buffers));
        }
      });
      this._filter.start();
    };
    util.inherits(FilterAsync, ChunkStream);
  }
});

// ../node_modules/pngjs/lib/constants.js
var require_constants = __commonJS({
  "../node_modules/pngjs/lib/constants.js"(exports2, module2) {
    "use strict";
    module2.exports = {
      PNG_SIGNATURE: [137, 80, 78, 71, 13, 10, 26, 10],
      TYPE_IHDR: 1229472850,
      TYPE_IEND: 1229278788,
      TYPE_IDAT: 1229209940,
      TYPE_PLTE: 1347179589,
      TYPE_tRNS: 1951551059,
      // eslint-disable-line camelcase
      TYPE_gAMA: 1732332865,
      // eslint-disable-line camelcase
      // color-type bits
      COLORTYPE_GRAYSCALE: 0,
      COLORTYPE_PALETTE: 1,
      COLORTYPE_COLOR: 2,
      COLORTYPE_ALPHA: 4,
      // e.g. grayscale and alpha
      // color-type combinations
      COLORTYPE_PALETTE_COLOR: 3,
      COLORTYPE_COLOR_ALPHA: 6,
      COLORTYPE_TO_BPP_MAP: {
        0: 1,
        2: 3,
        3: 1,
        4: 2,
        6: 4
      },
      GAMMA_DIVISION: 1e5
    };
  }
});

// ../node_modules/pngjs/lib/crc.js
var require_crc = __commonJS({
  "../node_modules/pngjs/lib/crc.js"(exports2, module2) {
    "use strict";
    var crcTable = [];
    (function() {
      for (let i2 = 0; i2 < 256; i2++) {
        let currentCrc = i2;
        for (let j = 0; j < 8; j++) {
          if (currentCrc & 1) {
            currentCrc = 3988292384 ^ currentCrc >>> 1;
          } else {
            currentCrc = currentCrc >>> 1;
          }
        }
        crcTable[i2] = currentCrc;
      }
    })();
    var CrcCalculator = module2.exports = function() {
      this._crc = -1;
    };
    CrcCalculator.prototype.write = function(data) {
      for (let i2 = 0; i2 < data.length; i2++) {
        this._crc = crcTable[(this._crc ^ data[i2]) & 255] ^ this._crc >>> 8;
      }
      return true;
    };
    CrcCalculator.prototype.crc32 = function() {
      return this._crc ^ -1;
    };
    CrcCalculator.crc32 = function(buf) {
      let crc = -1;
      for (let i2 = 0; i2 < buf.length; i2++) {
        crc = crcTable[(crc ^ buf[i2]) & 255] ^ crc >>> 8;
      }
      return crc ^ -1;
    };
  }
});

// ../node_modules/pngjs/lib/parser.js
var require_parser = __commonJS({
  "../node_modules/pngjs/lib/parser.js"(exports2, module2) {
    "use strict";
    var constants = require_constants();
    var CrcCalculator = require_crc();
    var Parser2 = module2.exports = function(options, dependencies) {
      this._options = options;
      options.checkCRC = options.checkCRC !== false;
      this._hasIHDR = false;
      this._hasIEND = false;
      this._emittedHeadersFinished = false;
      this._palette = [];
      this._colorType = 0;
      this._chunks = {};
      this._chunks[constants.TYPE_IHDR] = this._handleIHDR.bind(this);
      this._chunks[constants.TYPE_IEND] = this._handleIEND.bind(this);
      this._chunks[constants.TYPE_IDAT] = this._handleIDAT.bind(this);
      this._chunks[constants.TYPE_PLTE] = this._handlePLTE.bind(this);
      this._chunks[constants.TYPE_tRNS] = this._handleTRNS.bind(this);
      this._chunks[constants.TYPE_gAMA] = this._handleGAMA.bind(this);
      this.read = dependencies.read;
      this.error = dependencies.error;
      this.metadata = dependencies.metadata;
      this.gamma = dependencies.gamma;
      this.transColor = dependencies.transColor;
      this.palette = dependencies.palette;
      this.parsed = dependencies.parsed;
      this.inflateData = dependencies.inflateData;
      this.finished = dependencies.finished;
      this.simpleTransparency = dependencies.simpleTransparency;
      this.headersFinished = dependencies.headersFinished || function() {
      };
    };
    Parser2.prototype.start = function() {
      this.read(constants.PNG_SIGNATURE.length, this._parseSignature.bind(this));
    };
    Parser2.prototype._parseSignature = function(data) {
      let signature = constants.PNG_SIGNATURE;
      for (let i2 = 0; i2 < signature.length; i2++) {
        if (data[i2] !== signature[i2]) {
          this.error(new Error("Invalid file signature"));
          return;
        }
      }
      this.read(8, this._parseChunkBegin.bind(this));
    };
    Parser2.prototype._parseChunkBegin = function(data) {
      let length = data.readUInt32BE(0);
      let type = data.readUInt32BE(4);
      let name = "";
      for (let i2 = 4; i2 < 8; i2++) {
        name += String.fromCharCode(data[i2]);
      }
      let ancillary = Boolean(data[4] & 32);
      if (!this._hasIHDR && type !== constants.TYPE_IHDR) {
        this.error(new Error("Expected IHDR on beggining"));
        return;
      }
      this._crc = new CrcCalculator();
      this._crc.write(Buffer.from(name));
      if (this._chunks[type]) {
        return this._chunks[type](length);
      }
      if (!ancillary) {
        this.error(new Error("Unsupported critical chunk type " + name));
        return;
      }
      this.read(length + 4, this._skipChunk.bind(this));
    };
    Parser2.prototype._skipChunk = function() {
      this.read(8, this._parseChunkBegin.bind(this));
    };
    Parser2.prototype._handleChunkEnd = function() {
      this.read(4, this._parseChunkEnd.bind(this));
    };
    Parser2.prototype._parseChunkEnd = function(data) {
      let fileCrc = data.readInt32BE(0);
      let calcCrc = this._crc.crc32();
      if (this._options.checkCRC && calcCrc !== fileCrc) {
        this.error(new Error("Crc error - " + fileCrc + " - " + calcCrc));
        return;
      }
      if (!this._hasIEND) {
        this.read(8, this._parseChunkBegin.bind(this));
      }
    };
    Parser2.prototype._handleIHDR = function(length) {
      this.read(length, this._parseIHDR.bind(this));
    };
    Parser2.prototype._parseIHDR = function(data) {
      this._crc.write(data);
      let width = data.readUInt32BE(0);
      let height = data.readUInt32BE(4);
      let depth = data[8];
      let colorType = data[9];
      let compr = data[10];
      let filter = data[11];
      let interlace = data[12];
      if (depth !== 8 && depth !== 4 && depth !== 2 && depth !== 1 && depth !== 16) {
        this.error(new Error("Unsupported bit depth " + depth));
        return;
      }
      if (!(colorType in constants.COLORTYPE_TO_BPP_MAP)) {
        this.error(new Error("Unsupported color type"));
        return;
      }
      if (compr !== 0) {
        this.error(new Error("Unsupported compression method"));
        return;
      }
      if (filter !== 0) {
        this.error(new Error("Unsupported filter method"));
        return;
      }
      if (interlace !== 0 && interlace !== 1) {
        this.error(new Error("Unsupported interlace method"));
        return;
      }
      this._colorType = colorType;
      let bpp = constants.COLORTYPE_TO_BPP_MAP[this._colorType];
      this._hasIHDR = true;
      this.metadata({
        width,
        height,
        depth,
        interlace: Boolean(interlace),
        palette: Boolean(colorType & constants.COLORTYPE_PALETTE),
        color: Boolean(colorType & constants.COLORTYPE_COLOR),
        alpha: Boolean(colorType & constants.COLORTYPE_ALPHA),
        bpp,
        colorType
      });
      this._handleChunkEnd();
    };
    Parser2.prototype._handlePLTE = function(length) {
      this.read(length, this._parsePLTE.bind(this));
    };
    Parser2.prototype._parsePLTE = function(data) {
      this._crc.write(data);
      let entries = Math.floor(data.length / 3);
      for (let i2 = 0; i2 < entries; i2++) {
        this._palette.push([data[i2 * 3], data[i2 * 3 + 1], data[i2 * 3 + 2], 255]);
      }
      this.palette(this._palette);
      this._handleChunkEnd();
    };
    Parser2.prototype._handleTRNS = function(length) {
      this.simpleTransparency();
      this.read(length, this._parseTRNS.bind(this));
    };
    Parser2.prototype._parseTRNS = function(data) {
      this._crc.write(data);
      if (this._colorType === constants.COLORTYPE_PALETTE_COLOR) {
        if (this._palette.length === 0) {
          this.error(new Error("Transparency chunk must be after palette"));
          return;
        }
        if (data.length > this._palette.length) {
          this.error(new Error("More transparent colors than palette size"));
          return;
        }
        for (let i2 = 0; i2 < data.length; i2++) {
          this._palette[i2][3] = data[i2];
        }
        this.palette(this._palette);
      }
      if (this._colorType === constants.COLORTYPE_GRAYSCALE) {
        this.transColor([data.readUInt16BE(0)]);
      }
      if (this._colorType === constants.COLORTYPE_COLOR) {
        this.transColor([
          data.readUInt16BE(0),
          data.readUInt16BE(2),
          data.readUInt16BE(4)
        ]);
      }
      this._handleChunkEnd();
    };
    Parser2.prototype._handleGAMA = function(length) {
      this.read(length, this._parseGAMA.bind(this));
    };
    Parser2.prototype._parseGAMA = function(data) {
      this._crc.write(data);
      this.gamma(data.readUInt32BE(0) / constants.GAMMA_DIVISION);
      this._handleChunkEnd();
    };
    Parser2.prototype._handleIDAT = function(length) {
      if (!this._emittedHeadersFinished) {
        this._emittedHeadersFinished = true;
        this.headersFinished();
      }
      this.read(-length, this._parseIDAT.bind(this, length));
    };
    Parser2.prototype._parseIDAT = function(length, data) {
      this._crc.write(data);
      if (this._colorType === constants.COLORTYPE_PALETTE_COLOR && this._palette.length === 0) {
        throw new Error("Expected palette not found");
      }
      this.inflateData(data);
      let leftOverLength = length - data.length;
      if (leftOverLength > 0) {
        this._handleIDAT(leftOverLength);
      } else {
        this._handleChunkEnd();
      }
    };
    Parser2.prototype._handleIEND = function(length) {
      this.read(length, this._parseIEND.bind(this));
    };
    Parser2.prototype._parseIEND = function(data) {
      this._crc.write(data);
      this._hasIEND = true;
      this._handleChunkEnd();
      if (this.finished) {
        this.finished();
      }
    };
  }
});

// ../node_modules/pngjs/lib/bitmapper.js
var require_bitmapper = __commonJS({
  "../node_modules/pngjs/lib/bitmapper.js"(exports2) {
    "use strict";
    var interlaceUtils = require_interlace();
    var pixelBppMapper = [
      // 0 - dummy entry
      function() {
      },
      // 1 - L
      // 0: 0, 1: 0, 2: 0, 3: 0xff
      function(pxData, data, pxPos, rawPos) {
        if (rawPos === data.length) {
          throw new Error("Ran out of data");
        }
        let pixel = data[rawPos];
        pxData[pxPos] = pixel;
        pxData[pxPos + 1] = pixel;
        pxData[pxPos + 2] = pixel;
        pxData[pxPos + 3] = 255;
      },
      // 2 - LA
      // 0: 0, 1: 0, 2: 0, 3: 1
      function(pxData, data, pxPos, rawPos) {
        if (rawPos + 1 >= data.length) {
          throw new Error("Ran out of data");
        }
        let pixel = data[rawPos];
        pxData[pxPos] = pixel;
        pxData[pxPos + 1] = pixel;
        pxData[pxPos + 2] = pixel;
        pxData[pxPos + 3] = data[rawPos + 1];
      },
      // 3 - RGB
      // 0: 0, 1: 1, 2: 2, 3: 0xff
      function(pxData, data, pxPos, rawPos) {
        if (rawPos + 2 >= data.length) {
          throw new Error("Ran out of data");
        }
        pxData[pxPos] = data[rawPos];
        pxData[pxPos + 1] = data[rawPos + 1];
        pxData[pxPos + 2] = data[rawPos + 2];
        pxData[pxPos + 3] = 255;
      },
      // 4 - RGBA
      // 0: 0, 1: 1, 2: 2, 3: 3
      function(pxData, data, pxPos, rawPos) {
        if (rawPos + 3 >= data.length) {
          throw new Error("Ran out of data");
        }
        pxData[pxPos] = data[rawPos];
        pxData[pxPos + 1] = data[rawPos + 1];
        pxData[pxPos + 2] = data[rawPos + 2];
        pxData[pxPos + 3] = data[rawPos + 3];
      }
    ];
    var pixelBppCustomMapper = [
      // 0 - dummy entry
      function() {
      },
      // 1 - L
      // 0: 0, 1: 0, 2: 0, 3: 0xff
      function(pxData, pixelData, pxPos, maxBit) {
        let pixel = pixelData[0];
        pxData[pxPos] = pixel;
        pxData[pxPos + 1] = pixel;
        pxData[pxPos + 2] = pixel;
        pxData[pxPos + 3] = maxBit;
      },
      // 2 - LA
      // 0: 0, 1: 0, 2: 0, 3: 1
      function(pxData, pixelData, pxPos) {
        let pixel = pixelData[0];
        pxData[pxPos] = pixel;
        pxData[pxPos + 1] = pixel;
        pxData[pxPos + 2] = pixel;
        pxData[pxPos + 3] = pixelData[1];
      },
      // 3 - RGB
      // 0: 0, 1: 1, 2: 2, 3: 0xff
      function(pxData, pixelData, pxPos, maxBit) {
        pxData[pxPos] = pixelData[0];
        pxData[pxPos + 1] = pixelData[1];
        pxData[pxPos + 2] = pixelData[2];
        pxData[pxPos + 3] = maxBit;
      },
      // 4 - RGBA
      // 0: 0, 1: 1, 2: 2, 3: 3
      function(pxData, pixelData, pxPos) {
        pxData[pxPos] = pixelData[0];
        pxData[pxPos + 1] = pixelData[1];
        pxData[pxPos + 2] = pixelData[2];
        pxData[pxPos + 3] = pixelData[3];
      }
    ];
    function bitRetriever(data, depth) {
      let leftOver = [];
      let i2 = 0;
      function split() {
        if (i2 === data.length) {
          throw new Error("Ran out of data");
        }
        let byte = data[i2];
        i2++;
        let byte8, byte7, byte6, byte5, byte4, byte3, byte2, byte1;
        switch (depth) {
          default:
            throw new Error("unrecognised depth");
          case 16:
            byte2 = data[i2];
            i2++;
            leftOver.push((byte << 8) + byte2);
            break;
          case 4:
            byte2 = byte & 15;
            byte1 = byte >> 4;
            leftOver.push(byte1, byte2);
            break;
          case 2:
            byte4 = byte & 3;
            byte3 = byte >> 2 & 3;
            byte2 = byte >> 4 & 3;
            byte1 = byte >> 6 & 3;
            leftOver.push(byte1, byte2, byte3, byte4);
            break;
          case 1:
            byte8 = byte & 1;
            byte7 = byte >> 1 & 1;
            byte6 = byte >> 2 & 1;
            byte5 = byte >> 3 & 1;
            byte4 = byte >> 4 & 1;
            byte3 = byte >> 5 & 1;
            byte2 = byte >> 6 & 1;
            byte1 = byte >> 7 & 1;
            leftOver.push(byte1, byte2, byte3, byte4, byte5, byte6, byte7, byte8);
            break;
        }
      }
      return {
        get: function(count) {
          while (leftOver.length < count) {
            split();
          }
          let returner = leftOver.slice(0, count);
          leftOver = leftOver.slice(count);
          return returner;
        },
        resetAfterLine: function() {
          leftOver.length = 0;
        },
        end: function() {
          if (i2 !== data.length) {
            throw new Error("extra data found");
          }
        }
      };
    }
    function mapImage8Bit(image, pxData, getPxPos, bpp, data, rawPos) {
      let imageWidth = image.width;
      let imageHeight = image.height;
      let imagePass = image.index;
      for (let y3 = 0; y3 < imageHeight; y3++) {
        for (let x2 = 0; x2 < imageWidth; x2++) {
          let pxPos = getPxPos(x2, y3, imagePass);
          pixelBppMapper[bpp](pxData, data, pxPos, rawPos);
          rawPos += bpp;
        }
      }
      return rawPos;
    }
    function mapImageCustomBit(image, pxData, getPxPos, bpp, bits, maxBit) {
      let imageWidth = image.width;
      let imageHeight = image.height;
      let imagePass = image.index;
      for (let y3 = 0; y3 < imageHeight; y3++) {
        for (let x2 = 0; x2 < imageWidth; x2++) {
          let pixelData = bits.get(bpp);
          let pxPos = getPxPos(x2, y3, imagePass);
          pixelBppCustomMapper[bpp](pxData, pixelData, pxPos, maxBit);
        }
        bits.resetAfterLine();
      }
    }
    exports2.dataToBitMap = function(data, bitmapInfo) {
      let width = bitmapInfo.width;
      let height = bitmapInfo.height;
      let depth = bitmapInfo.depth;
      let bpp = bitmapInfo.bpp;
      let interlace = bitmapInfo.interlace;
      let bits;
      if (depth !== 8) {
        bits = bitRetriever(data, depth);
      }
      let pxData;
      if (depth <= 8) {
        pxData = Buffer.alloc(width * height * 4);
      } else {
        pxData = new Uint16Array(width * height * 4);
      }
      let maxBit = Math.pow(2, depth) - 1;
      let rawPos = 0;
      let images;
      let getPxPos;
      if (interlace) {
        images = interlaceUtils.getImagePasses(width, height);
        getPxPos = interlaceUtils.getInterlaceIterator(width, height);
      } else {
        let nonInterlacedPxPos = 0;
        getPxPos = function() {
          let returner = nonInterlacedPxPos;
          nonInterlacedPxPos += 4;
          return returner;
        };
        images = [{ width, height }];
      }
      for (let imageIndex = 0; imageIndex < images.length; imageIndex++) {
        if (depth === 8) {
          rawPos = mapImage8Bit(
            images[imageIndex],
            pxData,
            getPxPos,
            bpp,
            data,
            rawPos
          );
        } else {
          mapImageCustomBit(
            images[imageIndex],
            pxData,
            getPxPos,
            bpp,
            bits,
            maxBit
          );
        }
      }
      if (depth === 8) {
        if (rawPos !== data.length) {
          throw new Error("extra data found");
        }
      } else {
        bits.end();
      }
      return pxData;
    };
  }
});

// ../node_modules/pngjs/lib/format-normaliser.js
var require_format_normaliser = __commonJS({
  "../node_modules/pngjs/lib/format-normaliser.js"(exports2, module2) {
    "use strict";
    function dePalette(indata, outdata, width, height, palette) {
      let pxPos = 0;
      for (let y3 = 0; y3 < height; y3++) {
        for (let x2 = 0; x2 < width; x2++) {
          let color = palette[indata[pxPos]];
          if (!color) {
            throw new Error("index " + indata[pxPos] + " not in palette");
          }
          for (let i2 = 0; i2 < 4; i2++) {
            outdata[pxPos + i2] = color[i2];
          }
          pxPos += 4;
        }
      }
    }
    function replaceTransparentColor(indata, outdata, width, height, transColor) {
      let pxPos = 0;
      for (let y3 = 0; y3 < height; y3++) {
        for (let x2 = 0; x2 < width; x2++) {
          let makeTrans = false;
          if (transColor.length === 1) {
            if (transColor[0] === indata[pxPos]) {
              makeTrans = true;
            }
          } else if (transColor[0] === indata[pxPos] && transColor[1] === indata[pxPos + 1] && transColor[2] === indata[pxPos + 2]) {
            makeTrans = true;
          }
          if (makeTrans) {
            for (let i2 = 0; i2 < 4; i2++) {
              outdata[pxPos + i2] = 0;
            }
          }
          pxPos += 4;
        }
      }
    }
    function scaleDepth(indata, outdata, width, height, depth) {
      let maxOutSample = 255;
      let maxInSample = Math.pow(2, depth) - 1;
      let pxPos = 0;
      for (let y3 = 0; y3 < height; y3++) {
        for (let x2 = 0; x2 < width; x2++) {
          for (let i2 = 0; i2 < 4; i2++) {
            outdata[pxPos + i2] = Math.floor(
              indata[pxPos + i2] * maxOutSample / maxInSample + 0.5
            );
          }
          pxPos += 4;
        }
      }
    }
    module2.exports = function(indata, imageData, skipRescale = false) {
      let depth = imageData.depth;
      let width = imageData.width;
      let height = imageData.height;
      let colorType = imageData.colorType;
      let transColor = imageData.transColor;
      let palette = imageData.palette;
      let outdata = indata;
      if (colorType === 3) {
        dePalette(indata, outdata, width, height, palette);
      } else {
        if (transColor) {
          replaceTransparentColor(indata, outdata, width, height, transColor);
        }
        if (depth !== 8 && !skipRescale) {
          if (depth === 16) {
            outdata = Buffer.alloc(width * height * 4);
          }
          scaleDepth(indata, outdata, width, height, depth);
        }
      }
      return outdata;
    };
  }
});

// ../node_modules/pngjs/lib/parser-async.js
var require_parser_async = __commonJS({
  "../node_modules/pngjs/lib/parser-async.js"(exports2, module2) {
    "use strict";
    var util = require("util");
    var zlib2 = require("zlib");
    var ChunkStream = require_chunkstream();
    var FilterAsync = require_filter_parse_async();
    var Parser2 = require_parser();
    var bitmapper = require_bitmapper();
    var formatNormaliser = require_format_normaliser();
    var ParserAsync = module2.exports = function(options) {
      ChunkStream.call(this);
      this._parser = new Parser2(options, {
        read: this.read.bind(this),
        error: this._handleError.bind(this),
        metadata: this._handleMetaData.bind(this),
        gamma: this.emit.bind(this, "gamma"),
        palette: this._handlePalette.bind(this),
        transColor: this._handleTransColor.bind(this),
        finished: this._finished.bind(this),
        inflateData: this._inflateData.bind(this),
        simpleTransparency: this._simpleTransparency.bind(this),
        headersFinished: this._headersFinished.bind(this)
      });
      this._options = options;
      this.writable = true;
      this._parser.start();
    };
    util.inherits(ParserAsync, ChunkStream);
    ParserAsync.prototype._handleError = function(err) {
      this.emit("error", err);
      this.writable = false;
      this.destroy();
      if (this._inflate && this._inflate.destroy) {
        this._inflate.destroy();
      }
      if (this._filter) {
        this._filter.destroy();
        this._filter.on("error", function() {
        });
      }
      this.errord = true;
    };
    ParserAsync.prototype._inflateData = function(data) {
      if (!this._inflate) {
        if (this._bitmapInfo.interlace) {
          this._inflate = zlib2.createInflate();
          this._inflate.on("error", this.emit.bind(this, "error"));
          this._filter.on("complete", this._complete.bind(this));
          this._inflate.pipe(this._filter);
        } else {
          let rowSize = (this._bitmapInfo.width * this._bitmapInfo.bpp * this._bitmapInfo.depth + 7 >> 3) + 1;
          let imageSize = rowSize * this._bitmapInfo.height;
          let chunkSize = Math.max(imageSize, zlib2.Z_MIN_CHUNK);
          this._inflate = zlib2.createInflate({ chunkSize });
          let leftToInflate = imageSize;
          let emitError = this.emit.bind(this, "error");
          this._inflate.on("error", function(err) {
            if (!leftToInflate) {
              return;
            }
            emitError(err);
          });
          this._filter.on("complete", this._complete.bind(this));
          let filterWrite = this._filter.write.bind(this._filter);
          this._inflate.on("data", function(chunk) {
            if (!leftToInflate) {
              return;
            }
            if (chunk.length > leftToInflate) {
              chunk = chunk.slice(0, leftToInflate);
            }
            leftToInflate -= chunk.length;
            filterWrite(chunk);
          });
          this._inflate.on("end", this._filter.end.bind(this._filter));
        }
      }
      this._inflate.write(data);
    };
    ParserAsync.prototype._handleMetaData = function(metaData) {
      this._metaData = metaData;
      this._bitmapInfo = Object.create(metaData);
      this._filter = new FilterAsync(this._bitmapInfo);
    };
    ParserAsync.prototype._handleTransColor = function(transColor) {
      this._bitmapInfo.transColor = transColor;
    };
    ParserAsync.prototype._handlePalette = function(palette) {
      this._bitmapInfo.palette = palette;
    };
    ParserAsync.prototype._simpleTransparency = function() {
      this._metaData.alpha = true;
    };
    ParserAsync.prototype._headersFinished = function() {
      this.emit("metadata", this._metaData);
    };
    ParserAsync.prototype._finished = function() {
      if (this.errord) {
        return;
      }
      if (!this._inflate) {
        this.emit("error", "No Inflate block");
      } else {
        this._inflate.end();
      }
    };
    ParserAsync.prototype._complete = function(filteredData) {
      if (this.errord) {
        return;
      }
      let normalisedBitmapData;
      try {
        let bitmapData = bitmapper.dataToBitMap(filteredData, this._bitmapInfo);
        normalisedBitmapData = formatNormaliser(
          bitmapData,
          this._bitmapInfo,
          this._options.skipRescale
        );
        bitmapData = null;
      } catch (ex) {
        this._handleError(ex);
        return;
      }
      this.emit("parsed", normalisedBitmapData);
    };
  }
});

// ../node_modules/pngjs/lib/bitpacker.js
var require_bitpacker = __commonJS({
  "../node_modules/pngjs/lib/bitpacker.js"(exports2, module2) {
    "use strict";
    var constants = require_constants();
    module2.exports = function(dataIn, width, height, options) {
      let outHasAlpha = [constants.COLORTYPE_COLOR_ALPHA, constants.COLORTYPE_ALPHA].indexOf(
        options.colorType
      ) !== -1;
      if (options.colorType === options.inputColorType) {
        let bigEndian = function() {
          let buffer = new ArrayBuffer(2);
          new DataView(buffer).setInt16(
            0,
            256,
            true
            /* littleEndian */
          );
          return new Int16Array(buffer)[0] !== 256;
        }();
        if (options.bitDepth === 8 || options.bitDepth === 16 && bigEndian) {
          return dataIn;
        }
      }
      let data = options.bitDepth !== 16 ? dataIn : new Uint16Array(dataIn.buffer);
      let maxValue = 255;
      let inBpp = constants.COLORTYPE_TO_BPP_MAP[options.inputColorType];
      if (inBpp === 4 && !options.inputHasAlpha) {
        inBpp = 3;
      }
      let outBpp = constants.COLORTYPE_TO_BPP_MAP[options.colorType];
      if (options.bitDepth === 16) {
        maxValue = 65535;
        outBpp *= 2;
      }
      let outData = Buffer.alloc(width * height * outBpp);
      let inIndex = 0;
      let outIndex = 0;
      let bgColor = options.bgColor || {};
      if (bgColor.red === void 0) {
        bgColor.red = maxValue;
      }
      if (bgColor.green === void 0) {
        bgColor.green = maxValue;
      }
      if (bgColor.blue === void 0) {
        bgColor.blue = maxValue;
      }
      function getRGBA() {
        let red;
        let green;
        let blue;
        let alpha = maxValue;
        switch (options.inputColorType) {
          case constants.COLORTYPE_COLOR_ALPHA:
            alpha = data[inIndex + 3];
            red = data[inIndex];
            green = data[inIndex + 1];
            blue = data[inIndex + 2];
            break;
          case constants.COLORTYPE_COLOR:
            red = data[inIndex];
            green = data[inIndex + 1];
            blue = data[inIndex + 2];
            break;
          case constants.COLORTYPE_ALPHA:
            alpha = data[inIndex + 1];
            red = data[inIndex];
            green = red;
            blue = red;
            break;
          case constants.COLORTYPE_GRAYSCALE:
            red = data[inIndex];
            green = red;
            blue = red;
            break;
          default:
            throw new Error(
              "input color type:" + options.inputColorType + " is not supported at present"
            );
        }
        if (options.inputHasAlpha) {
          if (!outHasAlpha) {
            alpha /= maxValue;
            red = Math.min(
              Math.max(Math.round((1 - alpha) * bgColor.red + alpha * red), 0),
              maxValue
            );
            green = Math.min(
              Math.max(Math.round((1 - alpha) * bgColor.green + alpha * green), 0),
              maxValue
            );
            blue = Math.min(
              Math.max(Math.round((1 - alpha) * bgColor.blue + alpha * blue), 0),
              maxValue
            );
          }
        }
        return { red, green, blue, alpha };
      }
      for (let y3 = 0; y3 < height; y3++) {
        for (let x2 = 0; x2 < width; x2++) {
          let rgba = getRGBA(data, inIndex);
          switch (options.colorType) {
            case constants.COLORTYPE_COLOR_ALPHA:
            case constants.COLORTYPE_COLOR:
              if (options.bitDepth === 8) {
                outData[outIndex] = rgba.red;
                outData[outIndex + 1] = rgba.green;
                outData[outIndex + 2] = rgba.blue;
                if (outHasAlpha) {
                  outData[outIndex + 3] = rgba.alpha;
                }
              } else {
                outData.writeUInt16BE(rgba.red, outIndex);
                outData.writeUInt16BE(rgba.green, outIndex + 2);
                outData.writeUInt16BE(rgba.blue, outIndex + 4);
                if (outHasAlpha) {
                  outData.writeUInt16BE(rgba.alpha, outIndex + 6);
                }
              }
              break;
            case constants.COLORTYPE_ALPHA:
            case constants.COLORTYPE_GRAYSCALE: {
              let grayscale = (rgba.red + rgba.green + rgba.blue) / 3;
              if (options.bitDepth === 8) {
                outData[outIndex] = grayscale;
                if (outHasAlpha) {
                  outData[outIndex + 1] = rgba.alpha;
                }
              } else {
                outData.writeUInt16BE(grayscale, outIndex);
                if (outHasAlpha) {
                  outData.writeUInt16BE(rgba.alpha, outIndex + 2);
                }
              }
              break;
            }
            default:
              throw new Error("unrecognised color Type " + options.colorType);
          }
          inIndex += inBpp;
          outIndex += outBpp;
        }
      }
      return outData;
    };
  }
});

// ../node_modules/pngjs/lib/filter-pack.js
var require_filter_pack = __commonJS({
  "../node_modules/pngjs/lib/filter-pack.js"(exports2, module2) {
    "use strict";
    var paethPredictor = require_paeth_predictor();
    function filterNone(pxData, pxPos, byteWidth, rawData, rawPos) {
      for (let x2 = 0; x2 < byteWidth; x2++) {
        rawData[rawPos + x2] = pxData[pxPos + x2];
      }
    }
    function filterSumNone(pxData, pxPos, byteWidth) {
      let sum = 0;
      let length = pxPos + byteWidth;
      for (let i2 = pxPos; i2 < length; i2++) {
        sum += Math.abs(pxData[i2]);
      }
      return sum;
    }
    function filterSub(pxData, pxPos, byteWidth, rawData, rawPos, bpp) {
      for (let x2 = 0; x2 < byteWidth; x2++) {
        let left = x2 >= bpp ? pxData[pxPos + x2 - bpp] : 0;
        let val = pxData[pxPos + x2] - left;
        rawData[rawPos + x2] = val;
      }
    }
    function filterSumSub(pxData, pxPos, byteWidth, bpp) {
      let sum = 0;
      for (let x2 = 0; x2 < byteWidth; x2++) {
        let left = x2 >= bpp ? pxData[pxPos + x2 - bpp] : 0;
        let val = pxData[pxPos + x2] - left;
        sum += Math.abs(val);
      }
      return sum;
    }
    function filterUp(pxData, pxPos, byteWidth, rawData, rawPos) {
      for (let x2 = 0; x2 < byteWidth; x2++) {
        let up = pxPos > 0 ? pxData[pxPos + x2 - byteWidth] : 0;
        let val = pxData[pxPos + x2] - up;
        rawData[rawPos + x2] = val;
      }
    }
    function filterSumUp(pxData, pxPos, byteWidth) {
      let sum = 0;
      let length = pxPos + byteWidth;
      for (let x2 = pxPos; x2 < length; x2++) {
        let up = pxPos > 0 ? pxData[x2 - byteWidth] : 0;
        let val = pxData[x2] - up;
        sum += Math.abs(val);
      }
      return sum;
    }
    function filterAvg(pxData, pxPos, byteWidth, rawData, rawPos, bpp) {
      for (let x2 = 0; x2 < byteWidth; x2++) {
        let left = x2 >= bpp ? pxData[pxPos + x2 - bpp] : 0;
        let up = pxPos > 0 ? pxData[pxPos + x2 - byteWidth] : 0;
        let val = pxData[pxPos + x2] - (left + up >> 1);
        rawData[rawPos + x2] = val;
      }
    }
    function filterSumAvg(pxData, pxPos, byteWidth, bpp) {
      let sum = 0;
      for (let x2 = 0; x2 < byteWidth; x2++) {
        let left = x2 >= bpp ? pxData[pxPos + x2 - bpp] : 0;
        let up = pxPos > 0 ? pxData[pxPos + x2 - byteWidth] : 0;
        let val = pxData[pxPos + x2] - (left + up >> 1);
        sum += Math.abs(val);
      }
      return sum;
    }
    function filterPaeth(pxData, pxPos, byteWidth, rawData, rawPos, bpp) {
      for (let x2 = 0; x2 < byteWidth; x2++) {
        let left = x2 >= bpp ? pxData[pxPos + x2 - bpp] : 0;
        let up = pxPos > 0 ? pxData[pxPos + x2 - byteWidth] : 0;
        let upleft = pxPos > 0 && x2 >= bpp ? pxData[pxPos + x2 - (byteWidth + bpp)] : 0;
        let val = pxData[pxPos + x2] - paethPredictor(left, up, upleft);
        rawData[rawPos + x2] = val;
      }
    }
    function filterSumPaeth(pxData, pxPos, byteWidth, bpp) {
      let sum = 0;
      for (let x2 = 0; x2 < byteWidth; x2++) {
        let left = x2 >= bpp ? pxData[pxPos + x2 - bpp] : 0;
        let up = pxPos > 0 ? pxData[pxPos + x2 - byteWidth] : 0;
        let upleft = pxPos > 0 && x2 >= bpp ? pxData[pxPos + x2 - (byteWidth + bpp)] : 0;
        let val = pxData[pxPos + x2] - paethPredictor(left, up, upleft);
        sum += Math.abs(val);
      }
      return sum;
    }
    var filters = {
      0: filterNone,
      1: filterSub,
      2: filterUp,
      3: filterAvg,
      4: filterPaeth
    };
    var filterSums = {
      0: filterSumNone,
      1: filterSumSub,
      2: filterSumUp,
      3: filterSumAvg,
      4: filterSumPaeth
    };
    module2.exports = function(pxData, width, height, options, bpp) {
      let filterTypes;
      if (!("filterType" in options) || options.filterType === -1) {
        filterTypes = [0, 1, 2, 3, 4];
      } else if (typeof options.filterType === "number") {
        filterTypes = [options.filterType];
      } else {
        throw new Error("unrecognised filter types");
      }
      if (options.bitDepth === 16) {
        bpp *= 2;
      }
      let byteWidth = width * bpp;
      let rawPos = 0;
      let pxPos = 0;
      let rawData = Buffer.alloc((byteWidth + 1) * height);
      let sel = filterTypes[0];
      for (let y3 = 0; y3 < height; y3++) {
        if (filterTypes.length > 1) {
          let min = Infinity;
          for (let i2 = 0; i2 < filterTypes.length; i2++) {
            let sum = filterSums[filterTypes[i2]](pxData, pxPos, byteWidth, bpp);
            if (sum < min) {
              sel = filterTypes[i2];
              min = sum;
            }
          }
        }
        rawData[rawPos] = sel;
        rawPos++;
        filters[sel](pxData, pxPos, byteWidth, rawData, rawPos, bpp);
        rawPos += byteWidth;
        pxPos += byteWidth;
      }
      return rawData;
    };
  }
});

// ../node_modules/pngjs/lib/packer.js
var require_packer = __commonJS({
  "../node_modules/pngjs/lib/packer.js"(exports2, module2) {
    "use strict";
    var constants = require_constants();
    var CrcStream = require_crc();
    var bitPacker = require_bitpacker();
    var filter = require_filter_pack();
    var zlib2 = require("zlib");
    var Packer = module2.exports = function(options) {
      this._options = options;
      options.deflateChunkSize = options.deflateChunkSize || 32 * 1024;
      options.deflateLevel = options.deflateLevel != null ? options.deflateLevel : 9;
      options.deflateStrategy = options.deflateStrategy != null ? options.deflateStrategy : 3;
      options.inputHasAlpha = options.inputHasAlpha != null ? options.inputHasAlpha : true;
      options.deflateFactory = options.deflateFactory || zlib2.createDeflate;
      options.bitDepth = options.bitDepth || 8;
      options.colorType = typeof options.colorType === "number" ? options.colorType : constants.COLORTYPE_COLOR_ALPHA;
      options.inputColorType = typeof options.inputColorType === "number" ? options.inputColorType : constants.COLORTYPE_COLOR_ALPHA;
      if ([
        constants.COLORTYPE_GRAYSCALE,
        constants.COLORTYPE_COLOR,
        constants.COLORTYPE_COLOR_ALPHA,
        constants.COLORTYPE_ALPHA
      ].indexOf(options.colorType) === -1) {
        throw new Error(
          "option color type:" + options.colorType + " is not supported at present"
        );
      }
      if ([
        constants.COLORTYPE_GRAYSCALE,
        constants.COLORTYPE_COLOR,
        constants.COLORTYPE_COLOR_ALPHA,
        constants.COLORTYPE_ALPHA
      ].indexOf(options.inputColorType) === -1) {
        throw new Error(
          "option input color type:" + options.inputColorType + " is not supported at present"
        );
      }
      if (options.bitDepth !== 8 && options.bitDepth !== 16) {
        throw new Error(
          "option bit depth:" + options.bitDepth + " is not supported at present"
        );
      }
    };
    Packer.prototype.getDeflateOptions = function() {
      return {
        chunkSize: this._options.deflateChunkSize,
        level: this._options.deflateLevel,
        strategy: this._options.deflateStrategy
      };
    };
    Packer.prototype.createDeflate = function() {
      return this._options.deflateFactory(this.getDeflateOptions());
    };
    Packer.prototype.filterData = function(data, width, height) {
      let packedData = bitPacker(data, width, height, this._options);
      let bpp = constants.COLORTYPE_TO_BPP_MAP[this._options.colorType];
      let filteredData = filter(packedData, width, height, this._options, bpp);
      return filteredData;
    };
    Packer.prototype._packChunk = function(type, data) {
      let len = data ? data.length : 0;
      let buf = Buffer.alloc(len + 12);
      buf.writeUInt32BE(len, 0);
      buf.writeUInt32BE(type, 4);
      if (data) {
        data.copy(buf, 8);
      }
      buf.writeInt32BE(
        CrcStream.crc32(buf.slice(4, buf.length - 4)),
        buf.length - 4
      );
      return buf;
    };
    Packer.prototype.packGAMA = function(gamma) {
      let buf = Buffer.alloc(4);
      buf.writeUInt32BE(Math.floor(gamma * constants.GAMMA_DIVISION), 0);
      return this._packChunk(constants.TYPE_gAMA, buf);
    };
    Packer.prototype.packIHDR = function(width, height) {
      let buf = Buffer.alloc(13);
      buf.writeUInt32BE(width, 0);
      buf.writeUInt32BE(height, 4);
      buf[8] = this._options.bitDepth;
      buf[9] = this._options.colorType;
      buf[10] = 0;
      buf[11] = 0;
      buf[12] = 0;
      return this._packChunk(constants.TYPE_IHDR, buf);
    };
    Packer.prototype.packIDAT = function(data) {
      return this._packChunk(constants.TYPE_IDAT, data);
    };
    Packer.prototype.packIEND = function() {
      return this._packChunk(constants.TYPE_IEND, null);
    };
  }
});

// ../node_modules/pngjs/lib/packer-async.js
var require_packer_async = __commonJS({
  "../node_modules/pngjs/lib/packer-async.js"(exports2, module2) {
    "use strict";
    var util = require("util");
    var Stream = require("stream");
    var constants = require_constants();
    var Packer = require_packer();
    var PackerAsync = module2.exports = function(opt) {
      Stream.call(this);
      let options = opt || {};
      this._packer = new Packer(options);
      this._deflate = this._packer.createDeflate();
      this.readable = true;
    };
    util.inherits(PackerAsync, Stream);
    PackerAsync.prototype.pack = function(data, width, height, gamma) {
      this.emit("data", Buffer.from(constants.PNG_SIGNATURE));
      this.emit("data", this._packer.packIHDR(width, height));
      if (gamma) {
        this.emit("data", this._packer.packGAMA(gamma));
      }
      let filteredData = this._packer.filterData(data, width, height);
      this._deflate.on("error", this.emit.bind(this, "error"));
      this._deflate.on(
        "data",
        function(compressedData) {
          this.emit("data", this._packer.packIDAT(compressedData));
        }.bind(this)
      );
      this._deflate.on(
        "end",
        function() {
          this.emit("data", this._packer.packIEND());
          this.emit("end");
        }.bind(this)
      );
      this._deflate.end(filteredData);
    };
  }
});

// ../node_modules/pngjs/lib/sync-inflate.js
var require_sync_inflate = __commonJS({
  "../node_modules/pngjs/lib/sync-inflate.js"(exports2, module2) {
    "use strict";
    var assert2 = require("assert").ok;
    var zlib2 = require("zlib");
    var util = require("util");
    var kMaxLength = require("buffer").kMaxLength;
    function Inflate(opts) {
      if (!(this instanceof Inflate)) {
        return new Inflate(opts);
      }
      if (opts && opts.chunkSize < zlib2.Z_MIN_CHUNK) {
        opts.chunkSize = zlib2.Z_MIN_CHUNK;
      }
      zlib2.Inflate.call(this, opts);
      this._offset = this._offset === void 0 ? this._outOffset : this._offset;
      this._buffer = this._buffer || this._outBuffer;
      if (opts && opts.maxLength != null) {
        this._maxLength = opts.maxLength;
      }
    }
    function createInflate(opts) {
      return new Inflate(opts);
    }
    function _close(engine, callback) {
      if (callback) {
        process.nextTick(callback);
      }
      if (!engine._handle) {
        return;
      }
      engine._handle.close();
      engine._handle = null;
    }
    Inflate.prototype._processChunk = function(chunk, flushFlag, asyncCb) {
      if (typeof asyncCb === "function") {
        return zlib2.Inflate._processChunk.call(this, chunk, flushFlag, asyncCb);
      }
      let self = this;
      let availInBefore = chunk && chunk.length;
      let availOutBefore = this._chunkSize - this._offset;
      let leftToInflate = this._maxLength;
      let inOff = 0;
      let buffers = [];
      let nread = 0;
      let error;
      this.on("error", function(err) {
        error = err;
      });
      function handleChunk(availInAfter, availOutAfter) {
        if (self._hadError) {
          return;
        }
        let have = availOutBefore - availOutAfter;
        assert2(have >= 0, "have should not go down");
        if (have > 0) {
          let out = self._buffer.slice(self._offset, self._offset + have);
          self._offset += have;
          if (out.length > leftToInflate) {
            out = out.slice(0, leftToInflate);
          }
          buffers.push(out);
          nread += out.length;
          leftToInflate -= out.length;
          if (leftToInflate === 0) {
            return false;
          }
        }
        if (availOutAfter === 0 || self._offset >= self._chunkSize) {
          availOutBefore = self._chunkSize;
          self._offset = 0;
          self._buffer = Buffer.allocUnsafe(self._chunkSize);
        }
        if (availOutAfter === 0) {
          inOff += availInBefore - availInAfter;
          availInBefore = availInAfter;
          return true;
        }
        return false;
      }
      assert2(this._handle, "zlib binding closed");
      let res;
      do {
        res = this._handle.writeSync(
          flushFlag,
          chunk,
          // in
          inOff,
          // in_off
          availInBefore,
          // in_len
          this._buffer,
          // out
          this._offset,
          //out_off
          availOutBefore
        );
        res = res || this._writeState;
      } while (!this._hadError && handleChunk(res[0], res[1]));
      if (this._hadError) {
        throw error;
      }
      if (nread >= kMaxLength) {
        _close(this);
        throw new RangeError(
          "Cannot create final Buffer. It would be larger than 0x" + kMaxLength.toString(16) + " bytes"
        );
      }
      let buf = Buffer.concat(buffers, nread);
      _close(this);
      return buf;
    };
    util.inherits(Inflate, zlib2.Inflate);
    function zlibBufferSync(engine, buffer) {
      if (typeof buffer === "string") {
        buffer = Buffer.from(buffer);
      }
      if (!(buffer instanceof Buffer)) {
        throw new TypeError("Not a string or buffer");
      }
      let flushFlag = engine._finishFlushFlag;
      if (flushFlag == null) {
        flushFlag = zlib2.Z_FINISH;
      }
      return engine._processChunk(buffer, flushFlag);
    }
    function inflateSync(buffer, opts) {
      return zlibBufferSync(new Inflate(opts), buffer);
    }
    module2.exports = exports2 = inflateSync;
    exports2.Inflate = Inflate;
    exports2.createInflate = createInflate;
    exports2.inflateSync = inflateSync;
  }
});

// ../node_modules/pngjs/lib/sync-reader.js
var require_sync_reader = __commonJS({
  "../node_modules/pngjs/lib/sync-reader.js"(exports2, module2) {
    "use strict";
    var SyncReader = module2.exports = function(buffer) {
      this._buffer = buffer;
      this._reads = [];
    };
    SyncReader.prototype.read = function(length, callback) {
      this._reads.push({
        length: Math.abs(length),
        // if length < 0 then at most this length
        allowLess: length < 0,
        func: callback
      });
    };
    SyncReader.prototype.process = function() {
      while (this._reads.length > 0 && this._buffer.length) {
        let read = this._reads[0];
        if (this._buffer.length && (this._buffer.length >= read.length || read.allowLess)) {
          this._reads.shift();
          let buf = this._buffer;
          this._buffer = buf.slice(read.length);
          read.func.call(this, buf.slice(0, read.length));
        } else {
          break;
        }
      }
      if (this._reads.length > 0) {
        throw new Error("There are some read requests waitng on finished stream");
      }
      if (this._buffer.length > 0) {
        throw new Error("unrecognised content at end of stream");
      }
    };
  }
});

// ../node_modules/pngjs/lib/filter-parse-sync.js
var require_filter_parse_sync = __commonJS({
  "../node_modules/pngjs/lib/filter-parse-sync.js"(exports2) {
    "use strict";
    var SyncReader = require_sync_reader();
    var Filter = require_filter_parse();
    exports2.process = function(inBuffer, bitmapInfo) {
      let outBuffers = [];
      let reader = new SyncReader(inBuffer);
      let filter = new Filter(bitmapInfo, {
        read: reader.read.bind(reader),
        write: function(bufferPart) {
          outBuffers.push(bufferPart);
        },
        complete: function() {
        }
      });
      filter.start();
      reader.process();
      return Buffer.concat(outBuffers);
    };
  }
});

// ../node_modules/pngjs/lib/parser-sync.js
var require_parser_sync = __commonJS({
  "../node_modules/pngjs/lib/parser-sync.js"(exports2, module2) {
    "use strict";
    var hasSyncZlib = true;
    var zlib2 = require("zlib");
    var inflateSync = require_sync_inflate();
    if (!zlib2.deflateSync) {
      hasSyncZlib = false;
    }
    var SyncReader = require_sync_reader();
    var FilterSync = require_filter_parse_sync();
    var Parser2 = require_parser();
    var bitmapper = require_bitmapper();
    var formatNormaliser = require_format_normaliser();
    module2.exports = function(buffer, options) {
      if (!hasSyncZlib) {
        throw new Error(
          "To use the sync capability of this library in old node versions, please pin pngjs to v2.3.0"
        );
      }
      let err;
      function handleError(_err_) {
        err = _err_;
      }
      let metaData;
      function handleMetaData(_metaData_) {
        metaData = _metaData_;
      }
      function handleTransColor(transColor) {
        metaData.transColor = transColor;
      }
      function handlePalette(palette) {
        metaData.palette = palette;
      }
      function handleSimpleTransparency() {
        metaData.alpha = true;
      }
      let gamma;
      function handleGamma(_gamma_) {
        gamma = _gamma_;
      }
      let inflateDataList = [];
      function handleInflateData(inflatedData2) {
        inflateDataList.push(inflatedData2);
      }
      let reader = new SyncReader(buffer);
      let parser = new Parser2(options, {
        read: reader.read.bind(reader),
        error: handleError,
        metadata: handleMetaData,
        gamma: handleGamma,
        palette: handlePalette,
        transColor: handleTransColor,
        inflateData: handleInflateData,
        simpleTransparency: handleSimpleTransparency
      });
      parser.start();
      reader.process();
      if (err) {
        throw err;
      }
      let inflateData = Buffer.concat(inflateDataList);
      inflateDataList.length = 0;
      let inflatedData;
      if (metaData.interlace) {
        inflatedData = zlib2.inflateSync(inflateData);
      } else {
        let rowSize = (metaData.width * metaData.bpp * metaData.depth + 7 >> 3) + 1;
        let imageSize = rowSize * metaData.height;
        inflatedData = inflateSync(inflateData, {
          chunkSize: imageSize,
          maxLength: imageSize
        });
      }
      inflateData = null;
      if (!inflatedData || !inflatedData.length) {
        throw new Error("bad png - invalid inflate data response");
      }
      let unfilteredData = FilterSync.process(inflatedData, metaData);
      inflateData = null;
      let bitmapData = bitmapper.dataToBitMap(unfilteredData, metaData);
      unfilteredData = null;
      let normalisedBitmapData = formatNormaliser(
        bitmapData,
        metaData,
        options.skipRescale
      );
      metaData.data = normalisedBitmapData;
      metaData.gamma = gamma || 0;
      return metaData;
    };
  }
});

// ../node_modules/pngjs/lib/packer-sync.js
var require_packer_sync = __commonJS({
  "../node_modules/pngjs/lib/packer-sync.js"(exports2, module2) {
    "use strict";
    var hasSyncZlib = true;
    var zlib2 = require("zlib");
    if (!zlib2.deflateSync) {
      hasSyncZlib = false;
    }
    var constants = require_constants();
    var Packer = require_packer();
    module2.exports = function(metaData, opt) {
      if (!hasSyncZlib) {
        throw new Error(
          "To use the sync capability of this library in old node versions, please pin pngjs to v2.3.0"
        );
      }
      let options = opt || {};
      let packer = new Packer(options);
      let chunks = [];
      chunks.push(Buffer.from(constants.PNG_SIGNATURE));
      chunks.push(packer.packIHDR(metaData.width, metaData.height));
      if (metaData.gamma) {
        chunks.push(packer.packGAMA(metaData.gamma));
      }
      let filteredData = packer.filterData(
        metaData.data,
        metaData.width,
        metaData.height
      );
      let compressedData = zlib2.deflateSync(
        filteredData,
        packer.getDeflateOptions()
      );
      filteredData = null;
      if (!compressedData || !compressedData.length) {
        throw new Error("bad png - invalid compressed data response");
      }
      chunks.push(packer.packIDAT(compressedData));
      chunks.push(packer.packIEND());
      return Buffer.concat(chunks);
    };
  }
});

// ../node_modules/pngjs/lib/png-sync.js
var require_png_sync = __commonJS({
  "../node_modules/pngjs/lib/png-sync.js"(exports2) {
    "use strict";
    var parse = require_parser_sync();
    var pack = require_packer_sync();
    exports2.read = function(buffer, options) {
      return parse(buffer, options || {});
    };
    exports2.write = function(png, options) {
      return pack(png, options);
    };
  }
});

// ../node_modules/pngjs/lib/png.js
var require_png = __commonJS({
  "../node_modules/pngjs/lib/png.js"(exports2) {
    "use strict";
    var util = require("util");
    var Stream = require("stream");
    var Parser2 = require_parser_async();
    var Packer = require_packer_async();
    var PNGSync = require_png_sync();
    var PNG2 = exports2.PNG = function(options) {
      Stream.call(this);
      options = options || {};
      this.width = options.width | 0;
      this.height = options.height | 0;
      this.data = this.width > 0 && this.height > 0 ? Buffer.alloc(4 * this.width * this.height) : null;
      if (options.fill && this.data) {
        this.data.fill(0);
      }
      this.gamma = 0;
      this.readable = this.writable = true;
      this._parser = new Parser2(options);
      this._parser.on("error", this.emit.bind(this, "error"));
      this._parser.on("close", this._handleClose.bind(this));
      this._parser.on("metadata", this._metadata.bind(this));
      this._parser.on("gamma", this._gamma.bind(this));
      this._parser.on(
        "parsed",
        function(data) {
          this.data = data;
          this.emit("parsed", data);
        }.bind(this)
      );
      this._packer = new Packer(options);
      this._packer.on("data", this.emit.bind(this, "data"));
      this._packer.on("end", this.emit.bind(this, "end"));
      this._parser.on("close", this._handleClose.bind(this));
      this._packer.on("error", this.emit.bind(this, "error"));
    };
    util.inherits(PNG2, Stream);
    PNG2.sync = PNGSync;
    PNG2.prototype.pack = function() {
      if (!this.data || !this.data.length) {
        this.emit("error", "No data provided");
        return this;
      }
      process.nextTick(
        function() {
          this._packer.pack(this.data, this.width, this.height, this.gamma);
        }.bind(this)
      );
      return this;
    };
    PNG2.prototype.parse = function(data, callback) {
      if (callback) {
        let onParsed, onError;
        onParsed = function(parsedData) {
          this.removeListener("error", onError);
          this.data = parsedData;
          callback(null, this);
        }.bind(this);
        onError = function(err) {
          this.removeListener("parsed", onParsed);
          callback(err, null);
        }.bind(this);
        this.once("parsed", onParsed);
        this.once("error", onError);
      }
      this.end(data);
      return this;
    };
    PNG2.prototype.write = function(data) {
      this._parser.write(data);
      return true;
    };
    PNG2.prototype.end = function(data) {
      this._parser.end(data);
    };
    PNG2.prototype._metadata = function(metadata) {
      this.width = metadata.width;
      this.height = metadata.height;
      this.emit("metadata", metadata);
    };
    PNG2.prototype._gamma = function(gamma) {
      this.gamma = gamma;
    };
    PNG2.prototype._handleClose = function() {
      if (!this._parser.writable && !this._packer.readable) {
        this.emit("close");
      }
    };
    PNG2.bitblt = function(src2, dst, srcX, srcY, width, height, deltaX, deltaY) {
      srcX |= 0;
      srcY |= 0;
      width |= 0;
      height |= 0;
      deltaX |= 0;
      deltaY |= 0;
      if (srcX > src2.width || srcY > src2.height || srcX + width > src2.width || srcY + height > src2.height) {
        throw new Error("bitblt reading outside image");
      }
      if (deltaX > dst.width || deltaY > dst.height || deltaX + width > dst.width || deltaY + height > dst.height) {
        throw new Error("bitblt writing outside image");
      }
      for (let y3 = 0; y3 < height; y3++) {
        src2.data.copy(
          dst.data,
          (deltaY + y3) * dst.width + deltaX << 2,
          (srcY + y3) * src2.width + srcX << 2,
          (srcY + y3) * src2.width + srcX + width << 2
        );
      }
    };
    PNG2.prototype.bitblt = function(dst, srcX, srcY, width, height, deltaX, deltaY) {
      PNG2.bitblt(this, dst, srcX, srcY, width, height, deltaX, deltaY);
      return this;
    };
    PNG2.adjustGamma = function(src2) {
      if (src2.gamma) {
        for (let y3 = 0; y3 < src2.height; y3++) {
          for (let x2 = 0; x2 < src2.width; x2++) {
            let idx = src2.width * y3 + x2 << 2;
            for (let i2 = 0; i2 < 3; i2++) {
              let sample = src2.data[idx + i2] / 255;
              sample = Math.pow(sample, 1 / 2.2 / src2.gamma);
              src2.data[idx + i2] = Math.round(sample * 255);
            }
          }
        }
        src2.gamma = 0;
      }
    };
    PNG2.prototype.adjustGamma = function() {
      PNG2.adjustGamma(this);
    };
  }
});

// ../../../telemetrie-entreprise/tch-map/lecteur/cityhash.js
var require_cityhash = __commonJS({
  "../../../telemetrie-entreprise/tch-map/lecteur/cityhash.js"(exports2, module2) {
    "use strict";
    var M = (1n << 64n) - 1n;
    var k0 = 0xc3a5c85c97cb3127n;
    var k1 = 0xb492b66fbe98f273n;
    var k2 = 0x9ae16a3b2f90404fn;
    var k3 = 0xc949d7c7509e6557n;
    var kMul = 0x9ddfea08eb382d69n;
    var f64 = (b2, i2) => b2.readBigUInt64LE(i2);
    var f32 = (b2, i2) => BigInt(b2.readUInt32LE(i2));
    var mul = (a2, b2) => a2 * b2 & M;
    var add = (...v2) => v2.reduce((s2, x2) => s2 + x2 & M, 0n);
    var sub = (a2, b2) => a2 - b2 & M;
    var rot = (v2, s2) => s2 === 0 ? v2 : (v2 >> BigInt(s2) | v2 << BigInt(64 - s2)) & M;
    var shiftMix = (v2) => v2 ^ v2 >> 47n;
    function hash16(u3, v2) {
      let a2 = mul(u3 ^ v2, kMul);
      a2 ^= a2 >> 47n;
      let b2 = mul(v2 ^ a2, kMul);
      b2 ^= b2 >> 47n;
      return mul(b2, kMul);
    }
    function len0to16(s2, len) {
      const L3 = BigInt(len);
      if (len > 8) {
        const a2 = f64(s2, 0), b2 = f64(s2, len - 8);
        return hash16(a2, rot(add(b2, L3), len)) ^ b2;
      }
      if (len >= 4) {
        const a2 = f32(s2, 0);
        return hash16(add(L3, a2 << 3n & M), f32(s2, len - 4));
      }
      if (len > 0) {
        const y3 = BigInt(s2[0]) + (BigInt(s2[len >> 1]) << 8n);
        const z2 = L3 + (BigInt(s2[len - 1]) << 2n);
        return mul(shiftMix(mul(y3, k2) ^ mul(z2, k3)), k2);
      }
      return k2;
    }
    function len17to32(s2, len) {
      const a2 = mul(f64(s2, 0), k1), b2 = f64(s2, 8), c3 = mul(f64(s2, len - 8), k2), d2 = mul(f64(s2, len - 16), k0);
      return hash16(add(rot(sub(a2, b2), 43), rot(c3, 30), d2), add(sub(add(a2, rot(b2 ^ k3, 20)), c3), BigInt(len)));
    }
    function weak(w2, x2, y3, z2, a2, b2) {
      a2 = add(a2, w2);
      b2 = rot(add(b2, a2, z2), 21);
      const c3 = a2;
      a2 = add(a2, x2, y3);
      b2 = add(b2, rot(a2, 44));
      return [add(a2, z2), add(b2, c3)];
    }
    var weakS = (s2, i2, a2, b2) => weak(f64(s2, i2), f64(s2, i2 + 8), f64(s2, i2 + 16), f64(s2, i2 + 24), a2, b2);
    function len33to64(s2, len) {
      let z2 = f64(s2, 24);
      let a2 = add(f64(s2, 0), mul(add(BigInt(len), f64(s2, len - 16)), k0));
      let b2 = rot(add(a2, z2), 52), c3 = rot(a2, 37);
      a2 = add(a2, f64(s2, 8));
      c3 = add(c3, rot(a2, 7));
      a2 = add(a2, f64(s2, 16));
      const vf = add(a2, z2), vs = add(b2, rot(a2, 31), c3);
      a2 = add(f64(s2, 16), f64(s2, len - 32));
      z2 = f64(s2, len - 8);
      b2 = rot(add(a2, z2), 52);
      c3 = rot(a2, 37);
      a2 = add(a2, f64(s2, len - 24));
      c3 = add(c3, rot(a2, 7));
      a2 = add(a2, f64(s2, len - 16));
      const wf = add(a2, z2), ws = add(b2, rot(a2, 31), c3);
      const r4 = shiftMix(add(mul(add(vf, ws), k2), mul(add(wf, vs), k0)));
      return mul(shiftMix(add(mul(r4, k0), vs)), k2);
    }
    function city642(input) {
      const s2 = Buffer.isBuffer(input) ? input : Buffer.from(String(input), "utf8");
      let len = s2.length;
      if (len <= 16) return len0to16(s2, len);
      if (len <= 32) return len17to32(s2, len);
      if (len <= 64) return len33to64(s2, len);
      let x2 = f64(s2, len - 40);
      let y3 = add(f64(s2, len - 16), f64(s2, len - 56));
      let z2 = hash16(add(f64(s2, len - 48), BigInt(len)), f64(s2, len - 24));
      let v2 = weakS(s2, len - 64, BigInt(len), z2);
      let w2 = weakS(s2, len - 32, add(y3, k1), x2);
      x2 = add(mul(x2, k1), f64(s2, 0));
      len = len - 1 & ~63;
      let p = 0;
      do {
        x2 = mul(rot(add(x2, y3, v2[0], f64(s2, p + 8)), 37), k1);
        y3 = mul(rot(add(y3, v2[1], f64(s2, p + 48)), 42), k1);
        x2 ^= w2[1];
        y3 = add(y3, v2[0], f64(s2, p + 40));
        z2 = mul(rot(add(z2, w2[0]), 33), k1);
        v2 = weakS(s2, p, mul(v2[1], k1), add(x2, w2[0]));
        w2 = weakS(s2, p + 32, add(z2, w2[1]), add(y3, f64(s2, p + 16)));
        [z2, x2] = [x2, z2];
        p += 64;
        len -= 64;
      } while (len !== 0);
      return hash16(add(hash16(v2[0], w2[0]), mul(shiftMix(y3), k1), z2), add(hash16(v2[1], w2[1]), x2));
    }
    module2.exports = { city64: city642 };
  }
});

// bindings-shim.js
var require_bindings_shim = __commonJS({
  "bindings-shim.js"(exports2, module2) {
    "use strict";
    var { city64: city642 } = require_cityhash();
    module2.exports = (name) => name === "cityhash" ? { city64: (s2) => city642(s2) } : { gdeflate() {
      return -1;
    } };
  }
});

// profil.ts
var import_fs2 = __toESM(require("fs"));
var import_path = __toESM(require("path"));

// ../packages/libs/base/assert.ts
function assertExists(x2, msg) {
  if (x2 == null) {
    throw new Error(msg);
  }
  return x2;
}
function assert(condition, msg) {
  if (!condition) {
    throw new Error(`assertion failed: ${msg}`);
  }
  return;
}

// ../packages/libs/base/precon.ts
var UnreachableError = class extends Error {
  constructor(x2) {
    super("unreachable value " + JSON.stringify(x2));
  }
};
var Preconditions = class {
  static checkArgument(condition, msg) {
    if (!condition) {
      throw new Error(msg);
    }
  }
  static checkState(condition, msg) {
    if (!condition) {
      throw new Error(msg);
    }
  }
  static checkExists(x2, msg) {
    return assertExists(x2, msg);
  }
};

// ../packages/clis/parser/game-files/scs-archive.ts
var import_fs = __toESM(require("fs"), 1);

// ../node_modules/restructure/src/DecodeStream.js
var ENCODING_MAPPING = {
  utf16le: "utf-16le",
  ucs2: "utf-16le",
  utf16be: "utf-16be"
};
var DecodeStream = class {
  constructor(buffer) {
    this.buffer = buffer;
    this.view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    this.pos = 0;
    this.length = this.buffer.length;
  }
  readString(length, encoding = "ascii") {
    encoding = ENCODING_MAPPING[encoding] || encoding;
    let buf = this.readBuffer(length);
    try {
      let decoder = new TextDecoder(encoding);
      return decoder.decode(buf);
    } catch (err) {
      return buf;
    }
  }
  readBuffer(length) {
    return this.buffer.slice(this.pos, this.pos += length);
  }
  readUInt24BE() {
    return (this.readUInt16BE() << 8) + this.readUInt8();
  }
  readUInt24LE() {
    return this.readUInt16LE() + (this.readUInt8() << 16);
  }
  readInt24BE() {
    return (this.readInt16BE() << 8) + this.readUInt8();
  }
  readInt24LE() {
    return this.readUInt16LE() + (this.readInt8() << 16);
  }
};
DecodeStream.TYPES = {
  UInt8: 1,
  UInt16: 2,
  UInt24: 3,
  UInt32: 4,
  Int8: 1,
  Int16: 2,
  Int24: 3,
  Int32: 4,
  Float: 4,
  Double: 8
};
for (let key of Object.getOwnPropertyNames(DataView.prototype)) {
  if (key.slice(0, 3) === "get") {
    let type = key.slice(3).replace("Ui", "UI");
    if (type === "Float32") {
      type = "Float";
    } else if (type === "Float64") {
      type = "Double";
    }
    let bytes = DecodeStream.TYPES[type];
    DecodeStream.prototype["read" + type + (bytes === 1 ? "" : "BE")] = function() {
      const ret = this.view[key](this.pos, false);
      this.pos += bytes;
      return ret;
    };
    if (bytes !== 1) {
      DecodeStream.prototype["read" + type + "LE"] = function() {
        const ret = this.view[key](this.pos, true);
        this.pos += bytes;
        return ret;
      };
    }
  }
}

// ../node_modules/restructure/src/EncodeStream.js
var textEncoder = new TextEncoder();
var isBigEndian = new Uint8Array(new Uint16Array([4660]).buffer)[0] == 18;
var EncodeStream = class {
  constructor(buffer) {
    this.buffer = buffer;
    this.view = new DataView(this.buffer.buffer, this.buffer.byteOffset, this.buffer.byteLength);
    this.pos = 0;
  }
  writeBuffer(buffer) {
    this.buffer.set(buffer, this.pos);
    this.pos += buffer.length;
  }
  writeString(string, encoding = "ascii") {
    let buf;
    switch (encoding) {
      case "utf16le":
      case "utf16-le":
      case "ucs2":
        buf = stringToUtf16(string, isBigEndian);
        break;
      case "utf16be":
      case "utf16-be":
        buf = stringToUtf16(string, !isBigEndian);
        break;
      case "utf8":
        buf = textEncoder.encode(string);
        break;
      case "ascii":
        buf = stringToAscii(string);
        break;
      default:
        throw new Error(`Unsupported encoding: ${encoding}`);
    }
    this.writeBuffer(buf);
  }
  writeUInt24BE(val) {
    this.buffer[this.pos++] = val >>> 16 & 255;
    this.buffer[this.pos++] = val >>> 8 & 255;
    this.buffer[this.pos++] = val & 255;
  }
  writeUInt24LE(val) {
    this.buffer[this.pos++] = val & 255;
    this.buffer[this.pos++] = val >>> 8 & 255;
    this.buffer[this.pos++] = val >>> 16 & 255;
  }
  writeInt24BE(val) {
    if (val >= 0) {
      this.writeUInt24BE(val);
    } else {
      this.writeUInt24BE(val + 16777215 + 1);
    }
  }
  writeInt24LE(val) {
    if (val >= 0) {
      this.writeUInt24LE(val);
    } else {
      this.writeUInt24LE(val + 16777215 + 1);
    }
  }
  fill(val, length) {
    if (length < this.buffer.length) {
      this.buffer.fill(val, this.pos, this.pos + length);
      this.pos += length;
    } else {
      const buf = new Uint8Array(length);
      buf.fill(val);
      this.writeBuffer(buf);
    }
  }
};
function stringToUtf16(string, swap) {
  let buf = new Uint16Array(string.length);
  for (let i2 = 0; i2 < string.length; i2++) {
    let code = string.charCodeAt(i2);
    if (swap) {
      code = code >> 8 | (code & 255) << 8;
    }
    buf[i2] = code;
  }
  return new Uint8Array(buf.buffer);
}
function stringToAscii(string) {
  let buf = new Uint8Array(string.length);
  for (let i2 = 0; i2 < string.length; i2++) {
    buf[i2] = string.charCodeAt(i2);
  }
  return buf;
}
for (let key of Object.getOwnPropertyNames(DataView.prototype)) {
  if (key.slice(0, 3) === "set") {
    let type = key.slice(3).replace("Ui", "UI");
    if (type === "Float32") {
      type = "Float";
    } else if (type === "Float64") {
      type = "Double";
    }
    let bytes = DecodeStream.TYPES[type];
    EncodeStream.prototype["write" + type + (bytes === 1 ? "" : "BE")] = function(value) {
      this.view[key](this.pos, value, false);
      this.pos += bytes;
    };
    if (bytes !== 1) {
      EncodeStream.prototype["write" + type + "LE"] = function(value) {
        this.view[key](this.pos, value, true);
        this.pos += bytes;
      };
    }
  }
}

// ../node_modules/restructure/src/Base.js
var Base = class {
  fromBuffer(buffer) {
    let stream = new DecodeStream(buffer);
    return this.decode(stream);
  }
  toBuffer(value) {
    let size = this.size(value);
    let buffer = new Uint8Array(size);
    let stream = new EncodeStream(buffer);
    this.encode(stream, value);
    return buffer;
  }
};

// ../node_modules/restructure/src/Number.js
var NumberT = class extends Base {
  constructor(type, endian = "BE") {
    super();
    this.type = type;
    this.endian = endian;
    this.fn = this.type;
    if (this.type[this.type.length - 1] !== "8") {
      this.fn += this.endian;
    }
  }
  size() {
    return DecodeStream.TYPES[this.type];
  }
  decode(stream) {
    return stream[`read${this.fn}`]();
  }
  encode(stream, val) {
    return stream[`write${this.fn}`](val);
  }
};
var uint8 = new NumberT("UInt8");
var uint16be = new NumberT("UInt16", "BE");
var uint16le = new NumberT("UInt16", "LE");
var uint24be = new NumberT("UInt24", "BE");
var uint24le = new NumberT("UInt24", "LE");
var uint32be = new NumberT("UInt32", "BE");
var uint32le = new NumberT("UInt32", "LE");
var int8 = new NumberT("Int8");
var int16be = new NumberT("Int16", "BE");
var int16le = new NumberT("Int16", "LE");
var int24be = new NumberT("Int24", "BE");
var int24le = new NumberT("Int24", "LE");
var int32be = new NumberT("Int32", "BE");
var int32le = new NumberT("Int32", "LE");
var floatbe = new NumberT("Float", "BE");
var floatle = new NumberT("Float", "LE");
var doublebe = new NumberT("Double", "BE");
var doublele = new NumberT("Double", "LE");
var Fixed = class extends NumberT {
  constructor(size, endian, fracBits = size >> 1) {
    super(`Int${size}`, endian);
    this._point = 1 << fracBits;
  }
  decode(stream) {
    return super.decode(stream) / this._point;
  }
  encode(stream, val) {
    return super.encode(stream, val * this._point | 0);
  }
};
var fixed16be = new Fixed(16, "BE");
var fixed16le = new Fixed(16, "LE");
var fixed32be = new Fixed(32, "BE");
var fixed32le = new Fixed(32, "LE");

// ../node_modules/restructure/src/utils.js
function resolveLength(length, stream, parent) {
  let res;
  if (typeof length === "number") {
    res = length;
  } else if (typeof length === "function") {
    res = length.call(parent, parent);
  } else if (parent && typeof length === "string") {
    res = parent[length];
  } else if (stream && length instanceof NumberT) {
    res = length.decode(stream);
  }
  if (isNaN(res)) {
    throw new Error("Not a fixed size");
  }
  return res;
}
var PropertyDescriptor = class {
  constructor(opts = {}) {
    this.enumerable = true;
    this.configurable = true;
    for (let key in opts) {
      const val = opts[key];
      this[key] = val;
    }
  }
};

// ../node_modules/restructure/src/Array.js
var ArrayT = class extends Base {
  constructor(type, length, lengthType = "count") {
    super();
    this.type = type;
    this.length = length;
    this.lengthType = lengthType;
  }
  decode(stream, parent) {
    let length;
    const { pos } = stream;
    const res = [];
    let ctx = parent;
    if (this.length != null) {
      length = resolveLength(this.length, stream, parent);
    }
    if (this.length instanceof NumberT) {
      Object.defineProperties(res, {
        parent: { value: parent },
        _startOffset: { value: pos },
        _currentOffset: { value: 0, writable: true },
        _length: { value: length }
      });
      ctx = res;
    }
    if (length == null || this.lengthType === "bytes") {
      const target = length != null ? stream.pos + length : (parent != null ? parent._length : void 0) ? parent._startOffset + parent._length : stream.length;
      while (stream.pos < target) {
        res.push(this.type.decode(stream, ctx));
      }
    } else {
      for (let i2 = 0, end = length; i2 < end; i2++) {
        res.push(this.type.decode(stream, ctx));
      }
    }
    return res;
  }
  size(array, ctx, includePointers = true) {
    if (!array) {
      return this.type.size(null, ctx) * resolveLength(this.length, null, ctx);
    }
    let size = 0;
    if (this.length instanceof NumberT) {
      size += this.length.size();
      ctx = { parent: ctx, pointerSize: 0 };
    }
    for (let item of array) {
      size += this.type.size(item, ctx);
    }
    if (ctx && includePointers && this.length instanceof NumberT) {
      size += ctx.pointerSize;
    }
    return size;
  }
  encode(stream, array, parent) {
    let ctx = parent;
    if (this.length instanceof NumberT) {
      ctx = {
        pointers: [],
        startOffset: stream.pos,
        parent
      };
      ctx.pointerOffset = stream.pos + this.size(array, ctx, false);
      this.length.encode(stream, array.length);
    }
    for (let item of array) {
      this.type.encode(stream, item, ctx);
    }
    if (this.length instanceof NumberT) {
      let i2 = 0;
      while (i2 < ctx.pointers.length) {
        const ptr = ctx.pointers[i2++];
        ptr.type.encode(stream, ptr.val, ptr.parent);
      }
    }
  }
};

// ../node_modules/restructure/src/Bitfield.js
var Bitfield = class extends Base {
  constructor(type, flags = []) {
    super();
    this.type = type;
    this.flags = flags;
  }
  decode(stream) {
    const val = this.type.decode(stream);
    const res = {};
    for (let i2 = 0; i2 < this.flags.length; i2++) {
      const flag = this.flags[i2];
      if (flag != null) {
        res[flag] = !!(val & 1 << i2);
      }
    }
    return res;
  }
  size() {
    return this.type.size();
  }
  encode(stream, keys) {
    let val = 0;
    for (let i2 = 0; i2 < this.flags.length; i2++) {
      const flag = this.flags[i2];
      if (flag != null) {
        if (keys[flag]) {
          val |= 1 << i2;
        }
      }
    }
    return this.type.encode(stream, val);
  }
};

// ../node_modules/restructure/src/Reserved.js
var Reserved = class extends Base {
  constructor(type, count = 1) {
    super();
    this.type = type;
    this.count = count;
  }
  decode(stream, parent) {
    stream.pos += this.size(null, parent);
    return void 0;
  }
  size(data, parent) {
    const count = resolveLength(this.count, null, parent);
    return this.type.size() * count;
  }
  encode(stream, val, parent) {
    return stream.fill(0, this.size(val, parent));
  }
};

// ../node_modules/restructure/src/String.js
var StringT = class extends Base {
  constructor(length, encoding = "ascii") {
    super();
    this.length = length;
    this.encoding = encoding;
  }
  decode(stream, parent) {
    let length, pos;
    let { encoding } = this;
    if (typeof encoding === "function") {
      encoding = encoding.call(parent, parent) || "ascii";
    }
    let width = encodingWidth(encoding);
    if (this.length != null) {
      length = resolveLength(this.length, stream, parent);
    } else {
      let buffer;
      ({ buffer, length, pos } = stream);
      while (pos < length - width + 1 && (buffer[pos] !== 0 || width === 2 && buffer[pos + 1] !== 0)) {
        pos += width;
      }
      length = pos - stream.pos;
    }
    const string = stream.readString(length, encoding);
    if (this.length == null && stream.pos < stream.length) {
      stream.pos += width;
    }
    return string;
  }
  size(val, parent) {
    if (val === void 0 || val === null) {
      return resolveLength(this.length, null, parent);
    }
    let { encoding } = this;
    if (typeof encoding === "function") {
      encoding = encoding.call(parent != null ? parent.val : void 0, parent != null ? parent.val : void 0) || "ascii";
    }
    if (encoding === "utf16be") {
      encoding = "utf16le";
    }
    let size = byteLength(val, encoding);
    if (this.length instanceof NumberT) {
      size += this.length.size();
    }
    if (this.length == null) {
      size += encodingWidth(encoding);
    }
    return size;
  }
  encode(stream, val, parent) {
    let { encoding } = this;
    if (typeof encoding === "function") {
      encoding = encoding.call(parent != null ? parent.val : void 0, parent != null ? parent.val : void 0) || "ascii";
    }
    if (this.length instanceof NumberT) {
      this.length.encode(stream, byteLength(val, encoding));
    }
    stream.writeString(val, encoding);
    if (this.length == null) {
      return encodingWidth(encoding) == 2 ? stream.writeUInt16LE(0) : stream.writeUInt8(0);
    }
  }
};
function encodingWidth(encoding) {
  switch (encoding) {
    case "ascii":
    case "utf8":
      return 1;
    case "utf16le":
    case "utf16-le":
    case "utf-16be":
    case "utf-16le":
    case "utf16be":
    case "utf16-be":
    case "ucs2":
      return 2;
    default:
      return 1;
  }
}
function byteLength(string, encoding) {
  switch (encoding) {
    case "ascii":
      return string.length;
    case "utf8":
      let len = 0;
      for (let i2 = 0; i2 < string.length; i2++) {
        let c3 = string.charCodeAt(i2);
        if (c3 >= 55296 && c3 <= 56319 && i2 < string.length - 1) {
          let c22 = string.charCodeAt(++i2);
          if ((c22 & 64512) === 56320) {
            c3 = ((c3 & 1023) << 10) + (c22 & 1023) + 65536;
          } else {
            i2--;
          }
        }
        if ((c3 & 4294967168) === 0) {
          len++;
        } else if ((c3 & 4294965248) === 0) {
          len += 2;
        } else if ((c3 & 4294901760) === 0) {
          len += 3;
        } else if ((c3 & 4292870144) === 0) {
          len += 4;
        }
      }
      return len;
    case "utf16le":
    case "utf16-le":
    case "utf16be":
    case "utf16-be":
    case "ucs2":
      return string.length * 2;
    default:
      throw new Error("Unknown encoding " + encoding);
  }
}

// ../node_modules/restructure/src/Struct.js
var Struct = class extends Base {
  constructor(fields = {}) {
    super();
    this.fields = fields;
  }
  decode(stream, parent, length = 0) {
    const res = this._setup(stream, parent, length);
    this._parseFields(stream, res, this.fields);
    if (this.process != null) {
      this.process.call(res, stream);
    }
    return res;
  }
  _setup(stream, parent, length) {
    const res = {};
    Object.defineProperties(res, {
      parent: { value: parent },
      _startOffset: { value: stream.pos },
      _currentOffset: { value: 0, writable: true },
      _length: { value: length }
    });
    return res;
  }
  _parseFields(stream, res, fields) {
    for (let key in fields) {
      var val;
      const type = fields[key];
      if (typeof type === "function") {
        val = type.call(res, res);
      } else {
        val = type.decode(stream, res);
      }
      if (val !== void 0) {
        if (val instanceof PropertyDescriptor) {
          Object.defineProperty(res, key, val);
        } else {
          res[key] = val;
        }
      }
      res._currentOffset = stream.pos - res._startOffset;
    }
  }
  size(val, parent, includePointers = true) {
    if (val == null) {
      val = {};
    }
    const ctx = {
      parent,
      val,
      pointerSize: 0
    };
    if (this.preEncode != null) {
      this.preEncode.call(val);
    }
    let size = 0;
    for (let key in this.fields) {
      const type = this.fields[key];
      if (type.size != null) {
        size += type.size(val[key], ctx);
      }
    }
    if (includePointers) {
      size += ctx.pointerSize;
    }
    return size;
  }
  encode(stream, val, parent) {
    let type;
    if (this.preEncode != null) {
      this.preEncode.call(val, stream);
    }
    const ctx = {
      pointers: [],
      startOffset: stream.pos,
      parent,
      val,
      pointerSize: 0
    };
    ctx.pointerOffset = stream.pos + this.size(val, ctx, false);
    for (let key in this.fields) {
      type = this.fields[key];
      if (type.encode != null) {
        type.encode(stream, val[key], ctx);
      }
    }
    let i2 = 0;
    while (i2 < ctx.pointers.length) {
      const ptr = ctx.pointers[i2++];
      ptr.type.encode(stream, ptr.val, ptr.parent);
    }
  }
};

// ../packages/clis/parser/game-files/scs-archive.ts
var import_zlib = __toESM(require("zlib"), 1);

// ../node_modules/consola/dist/core.mjs
var LogLevels = {
  silent: Number.NEGATIVE_INFINITY,
  fatal: 0,
  error: 0,
  warn: 1,
  log: 2,
  info: 3,
  success: 3,
  fail: 3,
  ready: 3,
  start: 3,
  box: 3,
  debug: 4,
  trace: 5,
  verbose: Number.POSITIVE_INFINITY
};
var LogTypes = {
  // Silent
  silent: {
    level: -1
  },
  // Level 0
  fatal: {
    level: LogLevels.fatal
  },
  error: {
    level: LogLevels.error
  },
  // Level 1
  warn: {
    level: LogLevels.warn
  },
  // Level 2
  log: {
    level: LogLevels.log
  },
  // Level 3
  info: {
    level: LogLevels.info
  },
  success: {
    level: LogLevels.success
  },
  fail: {
    level: LogLevels.fail
  },
  ready: {
    level: LogLevels.info
  },
  start: {
    level: LogLevels.info
  },
  box: {
    level: LogLevels.info
  },
  // Level 4
  debug: {
    level: LogLevels.debug
  },
  // Level 5
  trace: {
    level: LogLevels.trace
  },
  // Verbose
  verbose: {
    level: LogLevels.verbose
  }
};
function isPlainObject$1(value) {
  if (value === null || typeof value !== "object") {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== null && prototype !== Object.prototype && Object.getPrototypeOf(prototype) !== null) {
    return false;
  }
  if (Symbol.iterator in value) {
    return false;
  }
  if (Symbol.toStringTag in value) {
    return Object.prototype.toString.call(value) === "[object Module]";
  }
  return true;
}
function _defu(baseObject, defaults, namespace = ".", merger) {
  if (!isPlainObject$1(defaults)) {
    return _defu(baseObject, {}, namespace, merger);
  }
  const object = Object.assign({}, defaults);
  for (const key in baseObject) {
    if (key === "__proto__" || key === "constructor") {
      continue;
    }
    const value = baseObject[key];
    if (value === null || value === void 0) {
      continue;
    }
    if (merger && merger(object, key, value, namespace)) {
      continue;
    }
    if (Array.isArray(value) && Array.isArray(object[key])) {
      object[key] = [...value, ...object[key]];
    } else if (isPlainObject$1(value) && isPlainObject$1(object[key])) {
      object[key] = _defu(
        value,
        object[key],
        (namespace ? `${namespace}.` : "") + key.toString(),
        merger
      );
    } else {
      object[key] = value;
    }
  }
  return object;
}
function createDefu(merger) {
  return (...arguments_) => (
    // eslint-disable-next-line unicorn/no-array-reduce
    arguments_.reduce((p, c3) => _defu(p, c3, "", merger), {})
  );
}
var defu = createDefu();
function isPlainObject(obj) {
  return Object.prototype.toString.call(obj) === "[object Object]";
}
function isLogObj(arg) {
  if (!isPlainObject(arg)) {
    return false;
  }
  if (!arg.message && !arg.args) {
    return false;
  }
  if (arg.stack) {
    return false;
  }
  return true;
}
var paused = false;
var queue = [];
var Consola = class _Consola {
  options;
  _lastLog;
  _mockFn;
  /**
   * Creates an instance of Consola with specified options or defaults.
   *
   * @param {Partial<ConsolaOptions>} [options={}] - Configuration options for the Consola instance.
   */
  constructor(options = {}) {
    const types2 = options.types || LogTypes;
    this.options = defu(
      {
        ...options,
        defaults: { ...options.defaults },
        level: _normalizeLogLevel(options.level, types2),
        reporters: [...options.reporters || []]
      },
      {
        types: LogTypes,
        throttle: 1e3,
        throttleMin: 5,
        formatOptions: {
          date: true,
          colors: false,
          compact: true
        }
      }
    );
    for (const type in types2) {
      const defaults = {
        type,
        ...this.options.defaults,
        ...types2[type]
      };
      this[type] = this._wrapLogFn(defaults);
      this[type].raw = this._wrapLogFn(
        defaults,
        true
      );
    }
    if (this.options.mockFn) {
      this.mockTypes();
    }
    this._lastLog = {};
  }
  /**
   * Gets the current log level of the Consola instance.
   *
   * @returns {number} The current log level.
   */
  get level() {
    return this.options.level;
  }
  /**
   * Sets the minimum log level that will be output by the instance.
   *
   * @param {number} level - The new log level to set.
   */
  set level(level) {
    this.options.level = _normalizeLogLevel(
      level,
      this.options.types,
      this.options.level
    );
  }
  /**
   * Displays a prompt to the user and returns the response.
   * Throw an error if `prompt` is not supported by the current configuration.
   *
   * @template T
   * @param {string} message - The message to display in the prompt.
   * @param {T} [opts] - Optional options for the prompt. See {@link PromptOptions}.
   * @returns {promise<T>} A promise that infer with the prompt options. See {@link PromptOptions}.
   */
  prompt(message, opts) {
    if (!this.options.prompt) {
      throw new Error("prompt is not supported!");
    }
    return this.options.prompt(message, opts);
  }
  /**
   * Creates a new instance of Consola, inheriting options from the current instance, with possible overrides.
   *
   * @param {Partial<ConsolaOptions>} options - Optional overrides for the new instance. See {@link ConsolaOptions}.
   * @returns {ConsolaInstance} A new Consola instance. See {@link ConsolaInstance}.
   */
  create(options) {
    const instance = new _Consola({
      ...this.options,
      ...options
    });
    if (this._mockFn) {
      instance.mockTypes(this._mockFn);
    }
    return instance;
  }
  /**
   * Creates a new Consola instance with the specified default log object properties.
   *
   * @param {InputLogObject} defaults - Default properties to include in any log from the new instance. See {@link InputLogObject}.
   * @returns {ConsolaInstance} A new Consola instance. See {@link ConsolaInstance}.
   */
  withDefaults(defaults) {
    return this.create({
      ...this.options,
      defaults: {
        ...this.options.defaults,
        ...defaults
      }
    });
  }
  /**
   * Creates a new Consola instance with a specified tag, which will be included in every log.
   *
   * @param {string} tag - The tag to include in each log of the new instance.
   * @returns {ConsolaInstance} A new Consola instance. See {@link ConsolaInstance}.
   */
  withTag(tag) {
    return this.withDefaults({
      tag: this.options.defaults.tag ? this.options.defaults.tag + ":" + tag : tag
    });
  }
  /**
   * Adds a custom reporter to the Consola instance.
   * Reporters will be called for each log message, depending on their implementation and log level.
   *
   * @param {ConsolaReporter} reporter - The reporter to add. See {@link ConsolaReporter}.
   * @returns {Consola} The current Consola instance.
   */
  addReporter(reporter) {
    this.options.reporters.push(reporter);
    return this;
  }
  /**
   * Removes a custom reporter from the Consola instance.
   * If no reporter is specified, all reporters will be removed.
   *
   * @param {ConsolaReporter} reporter - The reporter to remove. See {@link ConsolaReporter}.
   * @returns {Consola} The current Consola instance.
   */
  removeReporter(reporter) {
    if (reporter) {
      const i2 = this.options.reporters.indexOf(reporter);
      if (i2 !== -1) {
        return this.options.reporters.splice(i2, 1);
      }
    } else {
      this.options.reporters.splice(0);
    }
    return this;
  }
  /**
   * Replaces all reporters of the Consola instance with the specified array of reporters.
   *
   * @param {ConsolaReporter[]} reporters - The new reporters to set. See {@link ConsolaReporter}.
   * @returns {Consola} The current Consola instance.
   */
  setReporters(reporters) {
    this.options.reporters = Array.isArray(reporters) ? reporters : [reporters];
    return this;
  }
  wrapAll() {
    this.wrapConsole();
    this.wrapStd();
  }
  restoreAll() {
    this.restoreConsole();
    this.restoreStd();
  }
  /**
   * Overrides console methods with Consola logging methods for consistent logging.
   */
  wrapConsole() {
    for (const type in this.options.types) {
      if (!console["__" + type]) {
        console["__" + type] = console[type];
      }
      console[type] = this[type].raw;
    }
  }
  /**
   * Restores the original console methods, removing Consola overrides.
   */
  restoreConsole() {
    for (const type in this.options.types) {
      if (console["__" + type]) {
        console[type] = console["__" + type];
        delete console["__" + type];
      }
    }
  }
  /**
   * Overrides standard output and error streams to redirect them through Consola.
   */
  wrapStd() {
    this._wrapStream(this.options.stdout, "log");
    this._wrapStream(this.options.stderr, "log");
  }
  _wrapStream(stream, type) {
    if (!stream) {
      return;
    }
    if (!stream.__write) {
      stream.__write = stream.write;
    }
    stream.write = (data) => {
      this[type].raw(String(data).trim());
    };
  }
  /**
   * Restores the original standard output and error streams, removing the Consola redirection.
   */
  restoreStd() {
    this._restoreStream(this.options.stdout);
    this._restoreStream(this.options.stderr);
  }
  _restoreStream(stream) {
    if (!stream) {
      return;
    }
    if (stream.__write) {
      stream.write = stream.__write;
      delete stream.__write;
    }
  }
  /**
   * Pauses logging, queues incoming logs until resumed.
   */
  pauseLogs() {
    paused = true;
  }
  /**
   * Resumes logging, processing any queued logs.
   */
  resumeLogs() {
    paused = false;
    const _queue = queue.splice(0);
    for (const item of _queue) {
      item[0]._logFn(item[1], item[2]);
    }
  }
  /**
   * Replaces logging methods with mocks if a mock function is provided.
   *
   * @param {ConsolaOptions["mockFn"]} mockFn - The function to use for mocking logging methods. See {@link ConsolaOptions["mockFn"]}.
   */
  mockTypes(mockFn) {
    const _mockFn = mockFn || this.options.mockFn;
    this._mockFn = _mockFn;
    if (typeof _mockFn !== "function") {
      return;
    }
    for (const type in this.options.types) {
      this[type] = _mockFn(type, this.options.types[type]) || this[type];
      this[type].raw = this[type];
    }
  }
  _wrapLogFn(defaults, isRaw) {
    return (...args) => {
      if (paused) {
        queue.push([this, defaults, args, isRaw]);
        return;
      }
      return this._logFn(defaults, args, isRaw);
    };
  }
  _logFn(defaults, args, isRaw) {
    if ((defaults.level || 0) > this.level) {
      return false;
    }
    const logObj = {
      date: /* @__PURE__ */ new Date(),
      args: [],
      ...defaults,
      level: _normalizeLogLevel(defaults.level, this.options.types)
    };
    if (!isRaw && args.length === 1 && isLogObj(args[0])) {
      Object.assign(logObj, args[0]);
    } else {
      logObj.args = [...args];
    }
    if (logObj.message) {
      logObj.args.unshift(logObj.message);
      delete logObj.message;
    }
    if (logObj.additional) {
      if (!Array.isArray(logObj.additional)) {
        logObj.additional = logObj.additional.split("\n");
      }
      logObj.args.push("\n" + logObj.additional.join("\n"));
      delete logObj.additional;
    }
    logObj.type = typeof logObj.type === "string" ? logObj.type.toLowerCase() : "log";
    logObj.tag = typeof logObj.tag === "string" ? logObj.tag : "";
    const resolveLog = (newLog = false) => {
      const repeated = (this._lastLog.count || 0) - this.options.throttleMin;
      if (this._lastLog.object && repeated > 0) {
        const args2 = [...this._lastLog.object.args];
        if (repeated > 1) {
          args2.push(`(repeated ${repeated} times)`);
        }
        this._log({ ...this._lastLog.object, args: args2 });
        this._lastLog.count = 1;
      }
      if (newLog) {
        this._lastLog.object = logObj;
        this._log(logObj);
      }
    };
    clearTimeout(this._lastLog.timeout);
    const diffTime = this._lastLog.time && logObj.date ? logObj.date.getTime() - this._lastLog.time.getTime() : 0;
    this._lastLog.time = logObj.date;
    if (diffTime < this.options.throttle) {
      try {
        const serializedLog = JSON.stringify([
          logObj.type,
          logObj.tag,
          logObj.args
        ]);
        const isSameLog = this._lastLog.serialized === serializedLog;
        this._lastLog.serialized = serializedLog;
        if (isSameLog) {
          this._lastLog.count = (this._lastLog.count || 0) + 1;
          if (this._lastLog.count > this.options.throttleMin) {
            this._lastLog.timeout = setTimeout(
              resolveLog,
              this.options.throttle
            );
            return;
          }
        }
      } catch {
      }
    }
    resolveLog(true);
  }
  _log(logObj) {
    for (const reporter of this.options.reporters) {
      reporter.log(logObj, {
        options: this.options
      });
    }
  }
};
function _normalizeLogLevel(input, types2 = {}, defaultLevel = 3) {
  if (input === void 0) {
    return defaultLevel;
  }
  if (typeof input === "number") {
    return input;
  }
  if (types2[input] && types2[input].level !== void 0) {
    return types2[input].level;
  }
  return defaultLevel;
}
Consola.prototype.add = Consola.prototype.addReporter;
Consola.prototype.remove = Consola.prototype.removeReporter;
Consola.prototype.clear = Consola.prototype.removeReporter;
Consola.prototype.withScope = Consola.prototype.withTag;
Consola.prototype.mock = Consola.prototype.mockTypes;
Consola.prototype.pause = Consola.prototype.pauseLogs;
Consola.prototype.resume = Consola.prototype.resumeLogs;
function createConsola(options = {}) {
  return new Consola(options);
}

// ../node_modules/consola/dist/shared/consola.DRwqZj3T.mjs
var import_node_util = require("node:util");
var import_node_path = require("node:path");
function parseStack(stack, message) {
  const cwd = process.cwd() + import_node_path.sep;
  const lines = stack.split("\n").splice(message.split("\n").length).map((l2) => l2.trim().replace("file://", "").replace(cwd, ""));
  return lines;
}
function writeStream(data, stream) {
  const write = stream.__write || stream.write;
  return write.call(stream, data);
}
var bracket = (x2) => x2 ? `[${x2}]` : "";
var BasicReporter = class {
  formatStack(stack, message, opts) {
    const indent = "  ".repeat((opts?.errorLevel || 0) + 1);
    return indent + parseStack(stack, message).join(`
${indent}`);
  }
  formatError(err, opts) {
    const message = err.message ?? (0, import_node_util.formatWithOptions)(opts, err);
    const stack = err.stack ? this.formatStack(err.stack, message, opts) : "";
    const level = opts?.errorLevel || 0;
    const causedPrefix = level > 0 ? `${"  ".repeat(level)}[cause]: ` : "";
    const causedError = err.cause ? "\n\n" + this.formatError(err.cause, { ...opts, errorLevel: level + 1 }) : "";
    return causedPrefix + message + "\n" + stack + causedError;
  }
  formatArgs(args, opts) {
    const _args = args.map((arg) => {
      if (arg && typeof arg.stack === "string") {
        return this.formatError(arg, opts);
      }
      return arg;
    });
    return (0, import_node_util.formatWithOptions)(opts, ..._args);
  }
  formatDate(date, opts) {
    return opts.date ? date.toLocaleTimeString() : "";
  }
  filterAndJoin(arr) {
    return arr.filter(Boolean).join(" ");
  }
  formatLogObj(logObj, opts) {
    const message = this.formatArgs(logObj.args, opts);
    if (logObj.type === "box") {
      return "\n" + [
        bracket(logObj.tag),
        logObj.title && logObj.title,
        ...message.split("\n")
      ].filter(Boolean).map((l2) => " > " + l2).join("\n") + "\n";
    }
    return this.filterAndJoin([
      bracket(logObj.type),
      bracket(logObj.tag),
      message
    ]);
  }
  log(logObj, ctx) {
    const line = this.formatLogObj(logObj, {
      columns: ctx.options.stdout.columns || 0,
      ...ctx.options.formatOptions
    });
    return writeStream(
      line + "\n",
      logObj.level < 2 ? ctx.options.stderr || process.stderr : ctx.options.stdout || process.stdout
    );
  }
};

// ../node_modules/consola/dist/index.mjs
var import_node_process2 = __toESM(require("node:process"), 1);

// ../node_modules/consola/dist/shared/consola.DXBYu-KD.mjs
var tty = __toESM(require("node:tty"), 1);
var {
  env = {},
  argv = [],
  platform = ""
} = typeof process === "undefined" ? {} : process;
var isDisabled = "NO_COLOR" in env || argv.includes("--no-color");
var isForced = "FORCE_COLOR" in env || argv.includes("--color");
var isWindows = platform === "win32";
var isDumbTerminal = env.TERM === "dumb";
var isCompatibleTerminal = tty && tty.isatty && tty.isatty(1) && env.TERM && !isDumbTerminal;
var isCI = "CI" in env && ("GITHUB_ACTIONS" in env || "GITLAB_CI" in env || "CIRCLECI" in env);
var isColorSupported = !isDisabled && (isForced || isWindows && !isDumbTerminal || isCompatibleTerminal || isCI);
function replaceClose(index, string, close, replace, head = string.slice(0, Math.max(0, index)) + replace, tail = string.slice(Math.max(0, index + close.length)), next = tail.indexOf(close)) {
  return head + (next < 0 ? tail : replaceClose(next, tail, close, replace));
}
function clearBleed(index, string, open, close, replace) {
  return index < 0 ? open + string + close : open + replaceClose(index, string, close, replace) + close;
}
function filterEmpty(open, close, replace = open, at = open.length + 1) {
  return (string) => string || !(string === "" || string === void 0) ? clearBleed(
    ("" + string).indexOf(close, at),
    string,
    open,
    close,
    replace
  ) : "";
}
function init(open, close, replace) {
  return filterEmpty(`\x1B[${open}m`, `\x1B[${close}m`, replace);
}
var colorDefs = {
  reset: init(0, 0),
  bold: init(1, 22, "\x1B[22m\x1B[1m"),
  dim: init(2, 22, "\x1B[22m\x1B[2m"),
  italic: init(3, 23),
  underline: init(4, 24),
  inverse: init(7, 27),
  hidden: init(8, 28),
  strikethrough: init(9, 29),
  black: init(30, 39),
  red: init(31, 39),
  green: init(32, 39),
  yellow: init(33, 39),
  blue: init(34, 39),
  magenta: init(35, 39),
  cyan: init(36, 39),
  white: init(37, 39),
  gray: init(90, 39),
  bgBlack: init(40, 49),
  bgRed: init(41, 49),
  bgGreen: init(42, 49),
  bgYellow: init(43, 49),
  bgBlue: init(44, 49),
  bgMagenta: init(45, 49),
  bgCyan: init(46, 49),
  bgWhite: init(47, 49),
  blackBright: init(90, 39),
  redBright: init(91, 39),
  greenBright: init(92, 39),
  yellowBright: init(93, 39),
  blueBright: init(94, 39),
  magentaBright: init(95, 39),
  cyanBright: init(96, 39),
  whiteBright: init(97, 39),
  bgBlackBright: init(100, 49),
  bgRedBright: init(101, 49),
  bgGreenBright: init(102, 49),
  bgYellowBright: init(103, 49),
  bgBlueBright: init(104, 49),
  bgMagentaBright: init(105, 49),
  bgCyanBright: init(106, 49),
  bgWhiteBright: init(107, 49)
};
function createColors(useColor = isColorSupported) {
  return useColor ? colorDefs : Object.fromEntries(Object.keys(colorDefs).map((key) => [key, String]));
}
var colors = createColors();
function getColor(color, fallback = "reset") {
  return colors[color] || colors[fallback];
}
var ansiRegex = [
  String.raw`[\u001B\u009B][[\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\d\/#&.:=?%@~_]+)*|[a-zA-Z\d]+(?:;[-a-zA-Z\d\/#&.:=?%@~_]*)*)?\u0007)`,
  String.raw`(?:(?:\d{1,4}(?:;\d{0,4})*)?[\dA-PR-TZcf-nq-uy=><~]))`
].join("|");
function stripAnsi(text) {
  return text.replace(new RegExp(ansiRegex, "g"), "");
}
var boxStylePresets = {
  solid: {
    tl: "\u250C",
    tr: "\u2510",
    bl: "\u2514",
    br: "\u2518",
    h: "\u2500",
    v: "\u2502"
  },
  double: {
    tl: "\u2554",
    tr: "\u2557",
    bl: "\u255A",
    br: "\u255D",
    h: "\u2550",
    v: "\u2551"
  },
  doubleSingle: {
    tl: "\u2553",
    tr: "\u2556",
    bl: "\u2559",
    br: "\u255C",
    h: "\u2500",
    v: "\u2551"
  },
  doubleSingleRounded: {
    tl: "\u256D",
    tr: "\u256E",
    bl: "\u2570",
    br: "\u256F",
    h: "\u2500",
    v: "\u2551"
  },
  singleThick: {
    tl: "\u250F",
    tr: "\u2513",
    bl: "\u2517",
    br: "\u251B",
    h: "\u2501",
    v: "\u2503"
  },
  singleDouble: {
    tl: "\u2552",
    tr: "\u2555",
    bl: "\u2558",
    br: "\u255B",
    h: "\u2550",
    v: "\u2502"
  },
  singleDoubleRounded: {
    tl: "\u256D",
    tr: "\u256E",
    bl: "\u2570",
    br: "\u256F",
    h: "\u2550",
    v: "\u2502"
  },
  rounded: {
    tl: "\u256D",
    tr: "\u256E",
    bl: "\u2570",
    br: "\u256F",
    h: "\u2500",
    v: "\u2502"
  }
};
var defaultStyle = {
  borderColor: "white",
  borderStyle: "rounded",
  valign: "center",
  padding: 2,
  marginLeft: 1,
  marginTop: 1,
  marginBottom: 1
};
function box(text, _opts = {}) {
  const opts = {
    ..._opts,
    style: {
      ...defaultStyle,
      ..._opts.style
    }
  };
  const textLines = text.split("\n");
  const boxLines = [];
  const _color = getColor(opts.style.borderColor);
  const borderStyle = {
    ...typeof opts.style.borderStyle === "string" ? boxStylePresets[opts.style.borderStyle] || boxStylePresets.solid : opts.style.borderStyle
  };
  if (_color) {
    for (const key in borderStyle) {
      borderStyle[key] = _color(
        borderStyle[key]
      );
    }
  }
  const paddingOffset = opts.style.padding % 2 === 0 ? opts.style.padding : opts.style.padding + 1;
  const height = textLines.length + paddingOffset;
  const width = Math.max(
    ...textLines.map((line) => stripAnsi(line).length),
    opts.title ? stripAnsi(opts.title).length : 0
  ) + paddingOffset;
  const widthOffset = width + paddingOffset;
  const leftSpace = opts.style.marginLeft > 0 ? " ".repeat(opts.style.marginLeft) : "";
  if (opts.style.marginTop > 0) {
    boxLines.push("".repeat(opts.style.marginTop));
  }
  if (opts.title) {
    const title = _color ? _color(opts.title) : opts.title;
    const left = borderStyle.h.repeat(
      Math.floor((width - stripAnsi(opts.title).length) / 2)
    );
    const right = borderStyle.h.repeat(
      width - stripAnsi(opts.title).length - stripAnsi(left).length + paddingOffset
    );
    boxLines.push(
      `${leftSpace}${borderStyle.tl}${left}${title}${right}${borderStyle.tr}`
    );
  } else {
    boxLines.push(
      `${leftSpace}${borderStyle.tl}${borderStyle.h.repeat(widthOffset)}${borderStyle.tr}`
    );
  }
  const valignOffset = opts.style.valign === "center" ? Math.floor((height - textLines.length) / 2) : opts.style.valign === "top" ? height - textLines.length - paddingOffset : height - textLines.length;
  for (let i2 = 0; i2 < height; i2++) {
    if (i2 < valignOffset || i2 >= valignOffset + textLines.length) {
      boxLines.push(
        `${leftSpace}${borderStyle.v}${" ".repeat(widthOffset)}${borderStyle.v}`
      );
    } else {
      const line = textLines[i2 - valignOffset];
      const left = " ".repeat(paddingOffset);
      const right = " ".repeat(width - stripAnsi(line).length);
      boxLines.push(
        `${leftSpace}${borderStyle.v}${left}${line}${right}${borderStyle.v}`
      );
    }
  }
  boxLines.push(
    `${leftSpace}${borderStyle.bl}${borderStyle.h.repeat(widthOffset)}${borderStyle.br}`
  );
  if (opts.style.marginBottom > 0) {
    boxLines.push("".repeat(opts.style.marginBottom));
  }
  return boxLines.join("\n");
}

// ../node_modules/consola/dist/index.mjs
var import_meta = {};
var r2 = /* @__PURE__ */ Object.create(null);
var i = (e3) => globalThis.process?.env || import_meta.env || globalThis.Deno?.env.toObject() || globalThis.__env__ || (e3 ? r2 : globalThis);
var o2 = new Proxy(r2, { get(e3, s2) {
  return i()[s2] ?? r2[s2];
}, has(e3, s2) {
  const E = i();
  return s2 in E || s2 in r2;
}, set(e3, s2, E) {
  const B2 = i(true);
  return B2[s2] = E, true;
}, deleteProperty(e3, s2) {
  if (!s2) return false;
  const E = i(true);
  return delete E[s2], true;
}, ownKeys() {
  const e3 = i(true);
  return Object.keys(e3);
} });
var t = typeof process < "u" && process.env && process.env.NODE_ENV || "";
var f2 = [["APPVEYOR"], ["AWS_AMPLIFY", "AWS_APP_ID", { ci: true }], ["AZURE_PIPELINES", "SYSTEM_TEAMFOUNDATIONCOLLECTIONURI"], ["AZURE_STATIC", "INPUT_AZURE_STATIC_WEB_APPS_API_TOKEN"], ["APPCIRCLE", "AC_APPCIRCLE"], ["BAMBOO", "bamboo_planKey"], ["BITBUCKET", "BITBUCKET_COMMIT"], ["BITRISE", "BITRISE_IO"], ["BUDDY", "BUDDY_WORKSPACE_ID"], ["BUILDKITE"], ["CIRCLE", "CIRCLECI"], ["CIRRUS", "CIRRUS_CI"], ["CLOUDFLARE_PAGES", "CF_PAGES", { ci: true }], ["CODEBUILD", "CODEBUILD_BUILD_ARN"], ["CODEFRESH", "CF_BUILD_ID"], ["DRONE"], ["DRONE", "DRONE_BUILD_EVENT"], ["DSARI"], ["GITHUB_ACTIONS"], ["GITLAB", "GITLAB_CI"], ["GITLAB", "CI_MERGE_REQUEST_ID"], ["GOCD", "GO_PIPELINE_LABEL"], ["LAYERCI"], ["HUDSON", "HUDSON_URL"], ["JENKINS", "JENKINS_URL"], ["MAGNUM"], ["NETLIFY"], ["NETLIFY", "NETLIFY_LOCAL", { ci: false }], ["NEVERCODE"], ["RENDER"], ["SAIL", "SAILCI"], ["SEMAPHORE"], ["SCREWDRIVER"], ["SHIPPABLE"], ["SOLANO", "TDDIUM"], ["STRIDER"], ["TEAMCITY", "TEAMCITY_VERSION"], ["TRAVIS"], ["VERCEL", "NOW_BUILDER"], ["VERCEL", "VERCEL", { ci: false }], ["VERCEL", "VERCEL_ENV", { ci: false }], ["APPCENTER", "APPCENTER_BUILD_ID"], ["CODESANDBOX", "CODESANDBOX_SSE", { ci: false }], ["CODESANDBOX", "CODESANDBOX_HOST", { ci: false }], ["STACKBLITZ"], ["STORMKIT"], ["CLEAVR"], ["ZEABUR"], ["CODESPHERE", "CODESPHERE_APP_ID", { ci: true }], ["RAILWAY", "RAILWAY_PROJECT_ID"], ["RAILWAY", "RAILWAY_SERVICE_ID"], ["DENO-DEPLOY", "DENO_DEPLOYMENT_ID"], ["FIREBASE_APP_HOSTING", "FIREBASE_APP_HOSTING", { ci: true }]];
function b() {
  if (globalThis.process?.env) for (const e3 of f2) {
    const s2 = e3[1] || e3[0];
    if (globalThis.process?.env[s2]) return { name: e3[0].toLowerCase(), ...e3[2] };
  }
  return globalThis.process?.env?.SHELL === "/bin/jsh" && globalThis.process?.versions?.webcontainer ? { name: "stackblitz", ci: false } : { name: "", ci: false };
}
var l = b();
l.name;
function n(e3) {
  return e3 ? e3 !== "false" : false;
}
var I2 = globalThis.process?.platform || "";
var T2 = n(o2.CI) || l.ci !== false;
var a = n(globalThis.process?.stdout && globalThis.process?.stdout.isTTY);
var g2 = n(o2.DEBUG);
var R2 = t === "test" || n(o2.TEST);
n(o2.MINIMAL) || T2 || R2 || !a;
var A2 = /^win/i.test(I2);
!n(o2.NO_COLOR) && (n(o2.FORCE_COLOR) || (a || A2) && o2.TERM !== "dumb" || T2);
var C2 = (globalThis.process?.versions?.node || "").replace(/^v/, "") || null;
Number(C2?.split(".")[0]) || null;
var y2 = globalThis.process || /* @__PURE__ */ Object.create(null);
var _2 = { versions: {} };
new Proxy(y2, { get(e3, s2) {
  if (s2 === "env") return o2;
  if (s2 in e3) return e3[s2];
  if (s2 in _2) return _2[s2];
} });
var c2 = globalThis.process?.release?.name === "node";
var O2 = !!globalThis.Bun || !!globalThis.process?.versions?.bun;
var D = !!globalThis.Deno;
var L2 = !!globalThis.fastly;
var S2 = !!globalThis.Netlify;
var u2 = !!globalThis.EdgeRuntime;
var N2 = globalThis.navigator?.userAgent === "Cloudflare-Workers";
var F2 = [[S2, "netlify"], [u2, "edge-light"], [N2, "workerd"], [L2, "fastly"], [D, "deno"], [O2, "bun"], [c2, "node"]];
function G2() {
  const e3 = F2.find((s2) => s2[0]);
  if (e3) return { name: e3[1] };
}
var P2 = G2();
P2?.name || "";
function ansiRegex2({ onlyFirst = false } = {}) {
  const ST = "(?:\\u0007|\\u001B\\u005C|\\u009C)";
  const pattern = [
    `[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?${ST})`,
    "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]))"
  ].join("|");
  return new RegExp(pattern, onlyFirst ? void 0 : "g");
}
var regex = ansiRegex2();
function stripAnsi2(string) {
  if (typeof string !== "string") {
    throw new TypeError(`Expected a \`string\`, got \`${typeof string}\``);
  }
  return string.replace(regex, "");
}
function isAmbiguous(x2) {
  return x2 === 161 || x2 === 164 || x2 === 167 || x2 === 168 || x2 === 170 || x2 === 173 || x2 === 174 || x2 >= 176 && x2 <= 180 || x2 >= 182 && x2 <= 186 || x2 >= 188 && x2 <= 191 || x2 === 198 || x2 === 208 || x2 === 215 || x2 === 216 || x2 >= 222 && x2 <= 225 || x2 === 230 || x2 >= 232 && x2 <= 234 || x2 === 236 || x2 === 237 || x2 === 240 || x2 === 242 || x2 === 243 || x2 >= 247 && x2 <= 250 || x2 === 252 || x2 === 254 || x2 === 257 || x2 === 273 || x2 === 275 || x2 === 283 || x2 === 294 || x2 === 295 || x2 === 299 || x2 >= 305 && x2 <= 307 || x2 === 312 || x2 >= 319 && x2 <= 322 || x2 === 324 || x2 >= 328 && x2 <= 331 || x2 === 333 || x2 === 338 || x2 === 339 || x2 === 358 || x2 === 359 || x2 === 363 || x2 === 462 || x2 === 464 || x2 === 466 || x2 === 468 || x2 === 470 || x2 === 472 || x2 === 474 || x2 === 476 || x2 === 593 || x2 === 609 || x2 === 708 || x2 === 711 || x2 >= 713 && x2 <= 715 || x2 === 717 || x2 === 720 || x2 >= 728 && x2 <= 731 || x2 === 733 || x2 === 735 || x2 >= 768 && x2 <= 879 || x2 >= 913 && x2 <= 929 || x2 >= 931 && x2 <= 937 || x2 >= 945 && x2 <= 961 || x2 >= 963 && x2 <= 969 || x2 === 1025 || x2 >= 1040 && x2 <= 1103 || x2 === 1105 || x2 === 8208 || x2 >= 8211 && x2 <= 8214 || x2 === 8216 || x2 === 8217 || x2 === 8220 || x2 === 8221 || x2 >= 8224 && x2 <= 8226 || x2 >= 8228 && x2 <= 8231 || x2 === 8240 || x2 === 8242 || x2 === 8243 || x2 === 8245 || x2 === 8251 || x2 === 8254 || x2 === 8308 || x2 === 8319 || x2 >= 8321 && x2 <= 8324 || x2 === 8364 || x2 === 8451 || x2 === 8453 || x2 === 8457 || x2 === 8467 || x2 === 8470 || x2 === 8481 || x2 === 8482 || x2 === 8486 || x2 === 8491 || x2 === 8531 || x2 === 8532 || x2 >= 8539 && x2 <= 8542 || x2 >= 8544 && x2 <= 8555 || x2 >= 8560 && x2 <= 8569 || x2 === 8585 || x2 >= 8592 && x2 <= 8601 || x2 === 8632 || x2 === 8633 || x2 === 8658 || x2 === 8660 || x2 === 8679 || x2 === 8704 || x2 === 8706 || x2 === 8707 || x2 === 8711 || x2 === 8712 || x2 === 8715 || x2 === 8719 || x2 === 8721 || x2 === 8725 || x2 === 8730 || x2 >= 8733 && x2 <= 8736 || x2 === 8739 || x2 === 8741 || x2 >= 8743 && x2 <= 8748 || x2 === 8750 || x2 >= 8756 && x2 <= 8759 || x2 === 8764 || x2 === 8765 || x2 === 8776 || x2 === 8780 || x2 === 8786 || x2 === 8800 || x2 === 8801 || x2 >= 8804 && x2 <= 8807 || x2 === 8810 || x2 === 8811 || x2 === 8814 || x2 === 8815 || x2 === 8834 || x2 === 8835 || x2 === 8838 || x2 === 8839 || x2 === 8853 || x2 === 8857 || x2 === 8869 || x2 === 8895 || x2 === 8978 || x2 >= 9312 && x2 <= 9449 || x2 >= 9451 && x2 <= 9547 || x2 >= 9552 && x2 <= 9587 || x2 >= 9600 && x2 <= 9615 || x2 >= 9618 && x2 <= 9621 || x2 === 9632 || x2 === 9633 || x2 >= 9635 && x2 <= 9641 || x2 === 9650 || x2 === 9651 || x2 === 9654 || x2 === 9655 || x2 === 9660 || x2 === 9661 || x2 === 9664 || x2 === 9665 || x2 >= 9670 && x2 <= 9672 || x2 === 9675 || x2 >= 9678 && x2 <= 9681 || x2 >= 9698 && x2 <= 9701 || x2 === 9711 || x2 === 9733 || x2 === 9734 || x2 === 9737 || x2 === 9742 || x2 === 9743 || x2 === 9756 || x2 === 9758 || x2 === 9792 || x2 === 9794 || x2 === 9824 || x2 === 9825 || x2 >= 9827 && x2 <= 9829 || x2 >= 9831 && x2 <= 9834 || x2 === 9836 || x2 === 9837 || x2 === 9839 || x2 === 9886 || x2 === 9887 || x2 === 9919 || x2 >= 9926 && x2 <= 9933 || x2 >= 9935 && x2 <= 9939 || x2 >= 9941 && x2 <= 9953 || x2 === 9955 || x2 === 9960 || x2 === 9961 || x2 >= 9963 && x2 <= 9969 || x2 === 9972 || x2 >= 9974 && x2 <= 9977 || x2 === 9979 || x2 === 9980 || x2 === 9982 || x2 === 9983 || x2 === 10045 || x2 >= 10102 && x2 <= 10111 || x2 >= 11094 && x2 <= 11097 || x2 >= 12872 && x2 <= 12879 || x2 >= 57344 && x2 <= 63743 || x2 >= 65024 && x2 <= 65039 || x2 === 65533 || x2 >= 127232 && x2 <= 127242 || x2 >= 127248 && x2 <= 127277 || x2 >= 127280 && x2 <= 127337 || x2 >= 127344 && x2 <= 127373 || x2 === 127375 || x2 === 127376 || x2 >= 127387 && x2 <= 127404 || x2 >= 917760 && x2 <= 917999 || x2 >= 983040 && x2 <= 1048573 || x2 >= 1048576 && x2 <= 1114109;
}
function isFullWidth(x2) {
  return x2 === 12288 || x2 >= 65281 && x2 <= 65376 || x2 >= 65504 && x2 <= 65510;
}
function isWide(x2) {
  return x2 >= 4352 && x2 <= 4447 || x2 === 8986 || x2 === 8987 || x2 === 9001 || x2 === 9002 || x2 >= 9193 && x2 <= 9196 || x2 === 9200 || x2 === 9203 || x2 === 9725 || x2 === 9726 || x2 === 9748 || x2 === 9749 || x2 >= 9776 && x2 <= 9783 || x2 >= 9800 && x2 <= 9811 || x2 === 9855 || x2 >= 9866 && x2 <= 9871 || x2 === 9875 || x2 === 9889 || x2 === 9898 || x2 === 9899 || x2 === 9917 || x2 === 9918 || x2 === 9924 || x2 === 9925 || x2 === 9934 || x2 === 9940 || x2 === 9962 || x2 === 9970 || x2 === 9971 || x2 === 9973 || x2 === 9978 || x2 === 9981 || x2 === 9989 || x2 === 9994 || x2 === 9995 || x2 === 10024 || x2 === 10060 || x2 === 10062 || x2 >= 10067 && x2 <= 10069 || x2 === 10071 || x2 >= 10133 && x2 <= 10135 || x2 === 10160 || x2 === 10175 || x2 === 11035 || x2 === 11036 || x2 === 11088 || x2 === 11093 || x2 >= 11904 && x2 <= 11929 || x2 >= 11931 && x2 <= 12019 || x2 >= 12032 && x2 <= 12245 || x2 >= 12272 && x2 <= 12287 || x2 >= 12289 && x2 <= 12350 || x2 >= 12353 && x2 <= 12438 || x2 >= 12441 && x2 <= 12543 || x2 >= 12549 && x2 <= 12591 || x2 >= 12593 && x2 <= 12686 || x2 >= 12688 && x2 <= 12773 || x2 >= 12783 && x2 <= 12830 || x2 >= 12832 && x2 <= 12871 || x2 >= 12880 && x2 <= 42124 || x2 >= 42128 && x2 <= 42182 || x2 >= 43360 && x2 <= 43388 || x2 >= 44032 && x2 <= 55203 || x2 >= 63744 && x2 <= 64255 || x2 >= 65040 && x2 <= 65049 || x2 >= 65072 && x2 <= 65106 || x2 >= 65108 && x2 <= 65126 || x2 >= 65128 && x2 <= 65131 || x2 >= 94176 && x2 <= 94180 || x2 === 94192 || x2 === 94193 || x2 >= 94208 && x2 <= 100343 || x2 >= 100352 && x2 <= 101589 || x2 >= 101631 && x2 <= 101640 || x2 >= 110576 && x2 <= 110579 || x2 >= 110581 && x2 <= 110587 || x2 === 110589 || x2 === 110590 || x2 >= 110592 && x2 <= 110882 || x2 === 110898 || x2 >= 110928 && x2 <= 110930 || x2 === 110933 || x2 >= 110948 && x2 <= 110951 || x2 >= 110960 && x2 <= 111355 || x2 >= 119552 && x2 <= 119638 || x2 >= 119648 && x2 <= 119670 || x2 === 126980 || x2 === 127183 || x2 === 127374 || x2 >= 127377 && x2 <= 127386 || x2 >= 127488 && x2 <= 127490 || x2 >= 127504 && x2 <= 127547 || x2 >= 127552 && x2 <= 127560 || x2 === 127568 || x2 === 127569 || x2 >= 127584 && x2 <= 127589 || x2 >= 127744 && x2 <= 127776 || x2 >= 127789 && x2 <= 127797 || x2 >= 127799 && x2 <= 127868 || x2 >= 127870 && x2 <= 127891 || x2 >= 127904 && x2 <= 127946 || x2 >= 127951 && x2 <= 127955 || x2 >= 127968 && x2 <= 127984 || x2 === 127988 || x2 >= 127992 && x2 <= 128062 || x2 === 128064 || x2 >= 128066 && x2 <= 128252 || x2 >= 128255 && x2 <= 128317 || x2 >= 128331 && x2 <= 128334 || x2 >= 128336 && x2 <= 128359 || x2 === 128378 || x2 === 128405 || x2 === 128406 || x2 === 128420 || x2 >= 128507 && x2 <= 128591 || x2 >= 128640 && x2 <= 128709 || x2 === 128716 || x2 >= 128720 && x2 <= 128722 || x2 >= 128725 && x2 <= 128727 || x2 >= 128732 && x2 <= 128735 || x2 === 128747 || x2 === 128748 || x2 >= 128756 && x2 <= 128764 || x2 >= 128992 && x2 <= 129003 || x2 === 129008 || x2 >= 129292 && x2 <= 129338 || x2 >= 129340 && x2 <= 129349 || x2 >= 129351 && x2 <= 129535 || x2 >= 129648 && x2 <= 129660 || x2 >= 129664 && x2 <= 129673 || x2 >= 129679 && x2 <= 129734 || x2 >= 129742 && x2 <= 129756 || x2 >= 129759 && x2 <= 129769 || x2 >= 129776 && x2 <= 129784 || x2 >= 131072 && x2 <= 196605 || x2 >= 196608 && x2 <= 262141;
}
function validate(codePoint) {
  if (!Number.isSafeInteger(codePoint)) {
    throw new TypeError(`Expected a code point, got \`${typeof codePoint}\`.`);
  }
}
function eastAsianWidth(codePoint, { ambiguousAsWide = false } = {}) {
  validate(codePoint);
  if (isFullWidth(codePoint) || isWide(codePoint) || ambiguousAsWide && isAmbiguous(codePoint)) {
    return 2;
  }
  return 1;
}
var emojiRegex = () => {
  return /[#*0-9]\uFE0F?\u20E3|[\xA9\xAE\u203C\u2049\u2122\u2139\u2194-\u2199\u21A9\u21AA\u231A\u231B\u2328\u23CF\u23ED-\u23EF\u23F1\u23F2\u23F8-\u23FA\u24C2\u25AA\u25AB\u25B6\u25C0\u25FB\u25FC\u25FE\u2600-\u2604\u260E\u2611\u2614\u2615\u2618\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2640\u2642\u2648-\u2653\u265F\u2660\u2663\u2665\u2666\u2668\u267B\u267E\u267F\u2692\u2694-\u2697\u2699\u269B\u269C\u26A0\u26A7\u26AA\u26B0\u26B1\u26BD\u26BE\u26C4\u26C8\u26CF\u26D1\u26E9\u26F0-\u26F5\u26F7\u26F8\u26FA\u2702\u2708\u2709\u270F\u2712\u2714\u2716\u271D\u2721\u2733\u2734\u2744\u2747\u2757\u2763\u27A1\u2934\u2935\u2B05-\u2B07\u2B1B\u2B1C\u2B55\u3030\u303D\u3297\u3299]\uFE0F?|[\u261D\u270C\u270D](?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?|[\u270A\u270B](?:\uD83C[\uDFFB-\uDFFF])?|[\u23E9-\u23EC\u23F0\u23F3\u25FD\u2693\u26A1\u26AB\u26C5\u26CE\u26D4\u26EA\u26FD\u2705\u2728\u274C\u274E\u2753-\u2755\u2795-\u2797\u27B0\u27BF\u2B50]|\u26D3\uFE0F?(?:\u200D\uD83D\uDCA5)?|\u26F9(?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?(?:\u200D[\u2640\u2642]\uFE0F?)?|\u2764\uFE0F?(?:\u200D(?:\uD83D\uDD25|\uD83E\uDE79))?|\uD83C(?:[\uDC04\uDD70\uDD71\uDD7E\uDD7F\uDE02\uDE37\uDF21\uDF24-\uDF2C\uDF36\uDF7D\uDF96\uDF97\uDF99-\uDF9B\uDF9E\uDF9F\uDFCD\uDFCE\uDFD4-\uDFDF\uDFF5\uDFF7]\uFE0F?|[\uDF85\uDFC2\uDFC7](?:\uD83C[\uDFFB-\uDFFF])?|[\uDFC4\uDFCA](?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDFCB\uDFCC](?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDCCF\uDD8E\uDD91-\uDD9A\uDE01\uDE1A\uDE2F\uDE32-\uDE36\uDE38-\uDE3A\uDE50\uDE51\uDF00-\uDF20\uDF2D-\uDF35\uDF37-\uDF43\uDF45-\uDF4A\uDF4C-\uDF7C\uDF7E-\uDF84\uDF86-\uDF93\uDFA0-\uDFC1\uDFC5\uDFC6\uDFC8\uDFC9\uDFCF-\uDFD3\uDFE0-\uDFF0\uDFF8-\uDFFF]|\uDDE6\uD83C[\uDDE8-\uDDEC\uDDEE\uDDF1\uDDF2\uDDF4\uDDF6-\uDDFA\uDDFC\uDDFD\uDDFF]|\uDDE7\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEF\uDDF1-\uDDF4\uDDF6-\uDDF9\uDDFB\uDDFC\uDDFE\uDDFF]|\uDDE8\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDEE\uDDF0-\uDDF7\uDDFA-\uDDFF]|\uDDE9\uD83C[\uDDEA\uDDEC\uDDEF\uDDF0\uDDF2\uDDF4\uDDFF]|\uDDEA\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDED\uDDF7-\uDDFA]|\uDDEB\uD83C[\uDDEE-\uDDF0\uDDF2\uDDF4\uDDF7]|\uDDEC\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEE\uDDF1-\uDDF3\uDDF5-\uDDFA\uDDFC\uDDFE]|\uDDED\uD83C[\uDDF0\uDDF2\uDDF3\uDDF7\uDDF9\uDDFA]|\uDDEE\uD83C[\uDDE8-\uDDEA\uDDF1-\uDDF4\uDDF6-\uDDF9]|\uDDEF\uD83C[\uDDEA\uDDF2\uDDF4\uDDF5]|\uDDF0\uD83C[\uDDEA\uDDEC-\uDDEE\uDDF2\uDDF3\uDDF5\uDDF7\uDDFC\uDDFE\uDDFF]|\uDDF1\uD83C[\uDDE6-\uDDE8\uDDEE\uDDF0\uDDF7-\uDDFB\uDDFE]|\uDDF2\uD83C[\uDDE6\uDDE8-\uDDED\uDDF0-\uDDFF]|\uDDF3\uD83C[\uDDE6\uDDE8\uDDEA-\uDDEC\uDDEE\uDDF1\uDDF4\uDDF5\uDDF7\uDDFA\uDDFF]|\uDDF4\uD83C\uDDF2|\uDDF5\uD83C[\uDDE6\uDDEA-\uDDED\uDDF0-\uDDF3\uDDF7-\uDDF9\uDDFC\uDDFE]|\uDDF6\uD83C\uDDE6|\uDDF7\uD83C[\uDDEA\uDDF4\uDDF8\uDDFA\uDDFC]|\uDDF8\uD83C[\uDDE6-\uDDEA\uDDEC-\uDDF4\uDDF7-\uDDF9\uDDFB\uDDFD-\uDDFF]|\uDDF9\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDED\uDDEF-\uDDF4\uDDF7\uDDF9\uDDFB\uDDFC\uDDFF]|\uDDFA\uD83C[\uDDE6\uDDEC\uDDF2\uDDF3\uDDF8\uDDFE\uDDFF]|\uDDFB\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDEE\uDDF3\uDDFA]|\uDDFC\uD83C[\uDDEB\uDDF8]|\uDDFD\uD83C\uDDF0|\uDDFE\uD83C[\uDDEA\uDDF9]|\uDDFF\uD83C[\uDDE6\uDDF2\uDDFC]|\uDF44(?:\u200D\uD83D\uDFEB)?|\uDF4B(?:\u200D\uD83D\uDFE9)?|\uDFC3(?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D(?:[\u2640\u2642]\uFE0F?(?:\u200D\u27A1\uFE0F?)?|\u27A1\uFE0F?))?|\uDFF3\uFE0F?(?:\u200D(?:\u26A7\uFE0F?|\uD83C\uDF08))?|\uDFF4(?:\u200D\u2620\uFE0F?|\uDB40\uDC67\uDB40\uDC62\uDB40(?:\uDC65\uDB40\uDC6E\uDB40\uDC67|\uDC73\uDB40\uDC63\uDB40\uDC74|\uDC77\uDB40\uDC6C\uDB40\uDC73)\uDB40\uDC7F)?)|\uD83D(?:[\uDC3F\uDCFD\uDD49\uDD4A\uDD6F\uDD70\uDD73\uDD76-\uDD79\uDD87\uDD8A-\uDD8D\uDDA5\uDDA8\uDDB1\uDDB2\uDDBC\uDDC2-\uDDC4\uDDD1-\uDDD3\uDDDC-\uDDDE\uDDE1\uDDE3\uDDE8\uDDEF\uDDF3\uDDFA\uDECB\uDECD-\uDECF\uDEE0-\uDEE5\uDEE9\uDEF0\uDEF3]\uFE0F?|[\uDC42\uDC43\uDC46-\uDC50\uDC66\uDC67\uDC6B-\uDC6D\uDC72\uDC74-\uDC76\uDC78\uDC7C\uDC83\uDC85\uDC8F\uDC91\uDCAA\uDD7A\uDD95\uDD96\uDE4C\uDE4F\uDEC0\uDECC](?:\uD83C[\uDFFB-\uDFFF])?|[\uDC6E\uDC70\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4\uDEB5](?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDD74\uDD90](?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?|[\uDC00-\uDC07\uDC09-\uDC14\uDC16-\uDC25\uDC27-\uDC3A\uDC3C-\uDC3E\uDC40\uDC44\uDC45\uDC51-\uDC65\uDC6A\uDC79-\uDC7B\uDC7D-\uDC80\uDC84\uDC88-\uDC8E\uDC90\uDC92-\uDCA9\uDCAB-\uDCFC\uDCFF-\uDD3D\uDD4B-\uDD4E\uDD50-\uDD67\uDDA4\uDDFB-\uDE2D\uDE2F-\uDE34\uDE37-\uDE41\uDE43\uDE44\uDE48-\uDE4A\uDE80-\uDEA2\uDEA4-\uDEB3\uDEB7-\uDEBF\uDEC1-\uDEC5\uDED0-\uDED2\uDED5-\uDED7\uDEDC-\uDEDF\uDEEB\uDEEC\uDEF4-\uDEFC\uDFE0-\uDFEB\uDFF0]|\uDC08(?:\u200D\u2B1B)?|\uDC15(?:\u200D\uD83E\uDDBA)?|\uDC26(?:\u200D(?:\u2B1B|\uD83D\uDD25))?|\uDC3B(?:\u200D\u2744\uFE0F?)?|\uDC41\uFE0F?(?:\u200D\uD83D\uDDE8\uFE0F?)?|\uDC68(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDC68\uDC69]\u200D\uD83D(?:\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?)|[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?)|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]))|\uD83C(?:\uDFFB(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D\uDC68\uD83C[\uDFFC-\uDFFF])))?|\uDFFC(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D\uDC68\uD83C[\uDFFB\uDFFD-\uDFFF])))?|\uDFFD(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D\uDC68\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])))?|\uDFFE(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D\uDC68\uD83C[\uDFFB-\uDFFD\uDFFF])))?|\uDFFF(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D\uDC68\uD83C[\uDFFB-\uDFFE])))?))?|\uDC69(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?[\uDC68\uDC69]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?|\uDC69\u200D\uD83D(?:\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?))|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]))|\uD83C(?:\uDFFB(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFC-\uDFFF])))?|\uDFFC(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB\uDFFD-\uDFFF])))?|\uDFFD(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])))?|\uDFFE(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB-\uDFFD\uDFFF])))?|\uDFFF(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB-\uDFFE])))?))?|\uDC6F(?:\u200D[\u2640\u2642]\uFE0F?)?|\uDD75(?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?(?:\u200D[\u2640\u2642]\uFE0F?)?|\uDE2E(?:\u200D\uD83D\uDCA8)?|\uDE35(?:\u200D\uD83D\uDCAB)?|\uDE36(?:\u200D\uD83C\uDF2B\uFE0F?)?|\uDE42(?:\u200D[\u2194\u2195]\uFE0F?)?|\uDEB6(?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D(?:[\u2640\u2642]\uFE0F?(?:\u200D\u27A1\uFE0F?)?|\u27A1\uFE0F?))?)|\uD83E(?:[\uDD0C\uDD0F\uDD18-\uDD1F\uDD30-\uDD34\uDD36\uDD77\uDDB5\uDDB6\uDDBB\uDDD2\uDDD3\uDDD5\uDEC3-\uDEC5\uDEF0\uDEF2-\uDEF8](?:\uD83C[\uDFFB-\uDFFF])?|[\uDD26\uDD35\uDD37-\uDD39\uDD3D\uDD3E\uDDB8\uDDB9\uDDCD\uDDCF\uDDD4\uDDD6-\uDDDD](?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDDDE\uDDDF](?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDD0D\uDD0E\uDD10-\uDD17\uDD20-\uDD25\uDD27-\uDD2F\uDD3A\uDD3F-\uDD45\uDD47-\uDD76\uDD78-\uDDB4\uDDB7\uDDBA\uDDBC-\uDDCC\uDDD0\uDDE0-\uDDFF\uDE70-\uDE7C\uDE80-\uDE89\uDE8F-\uDEC2\uDEC6\uDECE-\uDEDC\uDEDF-\uDEE9]|\uDD3C(?:\u200D[\u2640\u2642]\uFE0F?|\uD83C[\uDFFB-\uDFFF])?|\uDDCE(?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D(?:[\u2640\u2642]\uFE0F?(?:\u200D\u27A1\uFE0F?)?|\u27A1\uFE0F?))?|\uDDD1(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83E\uDDD1|\uDDD1\u200D\uD83E\uDDD2(?:\u200D\uD83E\uDDD2)?|\uDDD2(?:\u200D\uD83E\uDDD2)?))|\uD83C(?:\uDFFB(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFC-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF])))?|\uDFFC(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB\uDFFD-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF])))?|\uDFFD(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF])))?|\uDFFE(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB-\uDFFD\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF])))?|\uDFFF(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB-\uDFFE]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF])))?))?|\uDEF1(?:\uD83C(?:\uDFFB(?:\u200D\uD83E\uDEF2\uD83C[\uDFFC-\uDFFF])?|\uDFFC(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB\uDFFD-\uDFFF])?|\uDFFD(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])?|\uDFFE(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB-\uDFFD\uDFFF])?|\uDFFF(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB-\uDFFE])?))?)/g;
};
var segmenter = globalThis.Intl?.Segmenter ? new Intl.Segmenter() : { segment: (str) => str.split("") };
var defaultIgnorableCodePointRegex = new RegExp("^\\p{Default_Ignorable_Code_Point}$", "u");
function stringWidth$1(string, options = {}) {
  if (typeof string !== "string" || string.length === 0) {
    return 0;
  }
  const {
    ambiguousIsNarrow = true,
    countAnsiEscapeCodes = false
  } = options;
  if (!countAnsiEscapeCodes) {
    string = stripAnsi2(string);
  }
  if (string.length === 0) {
    return 0;
  }
  let width = 0;
  const eastAsianWidthOptions = { ambiguousAsWide: !ambiguousIsNarrow };
  for (const { segment: character } of segmenter.segment(string)) {
    const codePoint = character.codePointAt(0);
    if (codePoint <= 31 || codePoint >= 127 && codePoint <= 159) {
      continue;
    }
    if (codePoint >= 8203 && codePoint <= 8207 || codePoint === 65279) {
      continue;
    }
    if (codePoint >= 768 && codePoint <= 879 || codePoint >= 6832 && codePoint <= 6911 || codePoint >= 7616 && codePoint <= 7679 || codePoint >= 8400 && codePoint <= 8447 || codePoint >= 65056 && codePoint <= 65071) {
      continue;
    }
    if (codePoint >= 55296 && codePoint <= 57343) {
      continue;
    }
    if (codePoint >= 65024 && codePoint <= 65039) {
      continue;
    }
    if (defaultIgnorableCodePointRegex.test(character)) {
      continue;
    }
    if (emojiRegex().test(character)) {
      width += 2;
      continue;
    }
    width += eastAsianWidth(codePoint, eastAsianWidthOptions);
  }
  return width;
}
function isUnicodeSupported() {
  const { env: env2 } = import_node_process2.default;
  const { TERM, TERM_PROGRAM } = env2;
  if (import_node_process2.default.platform !== "win32") {
    return TERM !== "linux";
  }
  return Boolean(env2.WT_SESSION) || Boolean(env2.TERMINUS_SUBLIME) || env2.ConEmuTask === "{cmd::Cmder}" || TERM_PROGRAM === "Terminus-Sublime" || TERM_PROGRAM === "vscode" || TERM === "xterm-256color" || TERM === "alacritty" || TERM === "rxvt-unicode" || TERM === "rxvt-unicode-256color" || env2.TERMINAL_EMULATOR === "JetBrains-JediTerm";
}
var TYPE_COLOR_MAP = {
  info: "cyan",
  fail: "red",
  success: "green",
  ready: "green",
  start: "magenta"
};
var LEVEL_COLOR_MAP = {
  0: "red",
  1: "yellow"
};
var unicode = isUnicodeSupported();
var s = (c3, fallback) => unicode ? c3 : fallback;
var TYPE_ICONS = {
  error: s("\u2716", "\xD7"),
  fatal: s("\u2716", "\xD7"),
  ready: s("\u2714", "\u221A"),
  warn: s("\u26A0", "\u203C"),
  info: s("\u2139", "i"),
  success: s("\u2714", "\u221A"),
  debug: s("\u2699", "D"),
  trace: s("\u2192", "\u2192"),
  fail: s("\u2716", "\xD7"),
  start: s("\u25D0", "o"),
  log: ""
};
function stringWidth(str) {
  const hasICU = typeof Intl === "object";
  if (!hasICU || !Intl.Segmenter) {
    return stripAnsi(str).length;
  }
  return stringWidth$1(str);
}
var FancyReporter = class extends BasicReporter {
  formatStack(stack, message, opts) {
    const indent = "  ".repeat((opts?.errorLevel || 0) + 1);
    return `
${indent}` + parseStack(stack, message).map(
      (line) => "  " + line.replace(/^at +/, (m2) => colors.gray(m2)).replace(/\((.+)\)/, (_3, m2) => `(${colors.cyan(m2)})`)
    ).join(`
${indent}`);
  }
  formatType(logObj, isBadge, opts) {
    const typeColor = TYPE_COLOR_MAP[logObj.type] || LEVEL_COLOR_MAP[logObj.level] || "gray";
    if (isBadge) {
      return getBgColor(typeColor)(
        colors.black(` ${logObj.type.toUpperCase()} `)
      );
    }
    const _type = typeof TYPE_ICONS[logObj.type] === "string" ? TYPE_ICONS[logObj.type] : logObj.icon || logObj.type;
    return _type ? getColor2(typeColor)(_type) : "";
  }
  formatLogObj(logObj, opts) {
    const [message, ...additional] = this.formatArgs(logObj.args, opts).split(
      "\n"
    );
    if (logObj.type === "box") {
      return box(
        characterFormat(
          message + (additional.length > 0 ? "\n" + additional.join("\n") : "")
        ),
        {
          title: logObj.title ? characterFormat(logObj.title) : void 0,
          style: logObj.style
        }
      );
    }
    const date = this.formatDate(logObj.date, opts);
    const coloredDate = date && colors.gray(date);
    const isBadge = logObj.badge ?? logObj.level < 2;
    const type = this.formatType(logObj, isBadge, opts);
    const tag = logObj.tag ? colors.gray(logObj.tag) : "";
    let line;
    const left = this.filterAndJoin([type, characterFormat(message)]);
    const right = this.filterAndJoin(opts.columns ? [tag, coloredDate] : [tag]);
    const space = (opts.columns || 0) - stringWidth(left) - stringWidth(right) - 2;
    line = space > 0 && (opts.columns || 0) >= 80 ? left + " ".repeat(space) + right : (right ? `${colors.gray(`[${right}]`)} ` : "") + left;
    line += characterFormat(
      additional.length > 0 ? "\n" + additional.join("\n") : ""
    );
    if (logObj.type === "trace") {
      const _err = new Error("Trace: " + logObj.message);
      line += this.formatStack(_err.stack || "", _err.message);
    }
    return isBadge ? "\n" + line + "\n" : line;
  }
};
function characterFormat(str) {
  return str.replace(/`([^`]+)`/gm, (_3, m2) => colors.cyan(m2)).replace(/\s+_([^_]+)_\s+/gm, (_3, m2) => ` ${colors.underline(m2)} `);
}
function getColor2(color = "white") {
  return colors[color] || colors.white;
}
function getBgColor(color = "bgWhite") {
  return colors[`bg${color[0].toUpperCase()}${color.slice(1)}`] || colors.bgWhite;
}
function createConsola2(options = {}) {
  let level = _getDefaultLogLevel();
  if (process.env.CONSOLA_LEVEL) {
    level = Number.parseInt(process.env.CONSOLA_LEVEL) ?? level;
  }
  const consola2 = createConsola({
    level,
    defaults: { level },
    stdout: process.stdout,
    stderr: process.stderr,
    prompt: (...args) => Promise.resolve().then(() => (init_prompt(), prompt_exports)).then((m2) => m2.prompt(...args)),
    reporters: options.reporters || [
      options.fancy ?? !(T2 || R2) ? new FancyReporter() : new BasicReporter()
    ],
    ...options
  });
  return consola2;
}
function _getDefaultLogLevel() {
  if (g2) {
    return LogLevels.debug;
  }
  if (R2) {
    return LogLevels.warn;
  }
  return LogLevels.info;
}
var consola = createConsola2();

// ../packages/clis/parser/logger.ts
var _logger = createConsola2({
  formatOptions: { compact: true, colors: true, date: false }
});
var logger = createConsola2({
  reporters: [
    {
      log: (log) => {
        if (log.level === LogLevels.warn) {
          return _logger.log(colors.yellow("\u26A0"), ...log.args);
        } else if (log.level === LogLevels.error) {
          return _logger.log(colors.red("\u2716"), ...log.args);
        }
        _logger.log(log);
      }
    }
  ]
});

// ../packages/clis/parser/game-files/dds-parser.ts
var import_dxtn = __toESM(require_dxtn(), 1);
var import_pngjs = __toESM(require_png(), 1);
var DdsHeader = new Struct({
  size: uint32le,
  flags: uint32le,
  height: uint32le,
  width: uint32le,
  pitchOrLinearSize: uint32le,
  depth: uint32le,
  mipMapCount: uint32le,
  reserved1: new Reserved(uint32le, 11),
  ddsPixelFormat: new Struct({
    size: uint32le,
    flags: uint32le,
    fourCc: new StringT(4),
    rgbBitCount: uint32le,
    rBitMask: uint32le,
    gBitMask: uint32le,
    bBitMask: uint32le,
    aBitMask: uint32le
  }),
  caps: uint32le,
  caps2: uint32le,
  caps3: uint32le,
  caps4: uint32le,
  reserved2: new Reserved(uint32le, 1)
});
assert(DdsHeader.size() === 124);

// ../packages/clis/parser/game-files/restructure-helpers.ts
var float3 = new ArrayT(floatle, 3);
var float4 = new ArrayT(floatle, 4);
var debugStruct = new ArrayT(uint8, function(parent) {
  console.log(parent);
  return 0;
});
var Uint64 = class {
  fromBuffer() {
    throw new Error("Method not implemented.");
  }
  decode(stream) {
    return stream.readBuffer(8).readBigUInt64LE();
  }
  size() {
    return 8;
  }
};
var MappedNumber = class {
  constructor(type, tx) {
    this.type = type;
    this.tx = tx;
  }
  fromBuffer() {
    throw new Error("Method not implemented.");
  }
  decode(stream) {
    return this.tx(this.type.decode(stream));
  }
  size() {
    return this.type.size(0);
  }
};
var uint64le = new Uint64();
var Token = class _Token {
  fromBuffer() {
    throw new Error("Method not implemented.");
  }
  decode(stream) {
    return _Token.tokenToString(stream.readBuffer(8).readBigUInt64LE());
  }
  size() {
    return 8;
  }
  static tokenLetters = [
    ..."\x000123456789abcdefghijklmnopqrstuvwxyz_"
  ];
  // ported from https://github.com/dariowouters/ts-map/blob/0163e95d652f35953e38695084abd6d0cb071446/docs/structures/base/875/functions.1sc
  static tokenToString(n3) {
    let str = "";
    do {
      str += _Token.tokenLetters[Number(n3 % 38n)];
      n3 /= 38n;
    } while (n3 !== 0n);
    return str.replaceAll("\0", "");
  }
};
var token64 = new Token();
var Uint64String = class {
  fromBuffer() {
    throw new Error("Method not implemented.");
  }
  decode(stream) {
    const length = stream.readBuffer(8).readBigUInt64LE();
    if (length === 0n) {
      return "";
    }
    return stream.readString(Number(length)).toString();
  }
  size(str) {
    return 8 + str.length;
  }
};
var uint64String = new Uint64String();

// ../packages/clis/parser/game-files/scs-archive.ts
var import_bindings_shim = __toESM(require_bindings_shim(), 1);
var { city64 } = (0, import_bindings_shim.default)("cityhash");
var { gdeflate } = (0, import_bindings_shim.default)("gdeflate");
var FileHeader = new Struct({
  magic: new StringT(4),
  version: int16le,
  salt: int16le,
  hashMethod: new StringT(4),
  entryTableCount: uint32le,
  entryTableCompressedSize: uint32le,
  metadataTableSize: uint32le,
  metadataTableCompressedSize: uint32le,
  entryTableOffset: uint64le,
  metadataTableOffset: uint64le,
  securityDescriptorOffset: uint64le,
  hashfsV2Platform: uint8
});
var EntryHeader = new Struct({
  hash: uint64le,
  metadataIndex: uint32le,
  metadataCount: uint16le,
  flags: new Bitfield(uint8, ["isDirectory"]),
  someByte: uint8
});
var toCompression = (compression) => {
  switch (compression) {
    case 0:
      return 0 /* NONE */;
    case 1:
      return 1 /* ZLIB */;
    case 2:
      return 2 /* ZLIB_HEADERLESS */;
    case 3:
      return 3 /* GDEFLATE */;
    case 4:
      return 4 /* ZSTD */;
    default:
      throw new Error("unknown compression value: " + compression);
  }
};
var ImageMeta = new Struct({
  width: new MappedNumber(uint16le, (n3) => n3 + 1),
  height: new MappedNumber(uint16le, (n3) => n3 + 1),
  image: new MappedNumber(uint32le, (n3) => ({
    mipmapCount: 1 + (n3 & 15),
    format: n3 >> 4 & 255,
    isCube: (n3 >> 12 & 3) !== 0,
    count: (n3 >> 14 & 63) + 1,
    pitchAlignment: 1 << (n3 >> 20 & 15),
    imageAlignment: 1 << (n3 >> 24 & 15)
  }))
});
var SampleMeta = new Struct({
  sample: new MappedNumber(uint32le, (n3) => ({
    magFilter: n3 & 1,
    // 0 = nearest, 1 = linear
    minFilter: n3 >> 1 & 1,
    // 0 = nearest, 1 = linear
    mipFilter: n3 >> 2 & 3,
    // 0 = nearest, 1 = trilinear, 2 = nomips
    addr: {
      u: n3 >> 4 & 7,
      v: n3 >> 7 & 7,
      w: n3 >> 10 & 7
    }
  }))
});
var PmaInfoMeta = new Struct({
  flag: uint32le,
  animationLength: floatle,
  skeletonHash: uint64le,
  bSphereRad: floatle,
  bSphereOrgX: floatle,
  bSphereOrgY: floatle,
  bSphereOrgZ: floatle
});
var PmgInfoMeta = new Struct({
  skeletonHash: uint64le
});
var PlainMeta = new Struct({
  packedCompressionInfo: new MappedNumber(uint32le, (n3) => ({
    compressedSize: n3 & 268435455,
    compression: toCompression((n3 & 4026531840) >> 28)
  })),
  size: new MappedNumber(uint32le, (n3) => n3 & 268435455),
  _unknown: new Reserved(uint32le, 1),
  offset: new MappedNumber(uint32le, (n3) => BigInt(n3) * 16n)
});
var MetadataEntryHeader = new Struct({
  index: uint24le,
  type: uint8
});
var ScsArchive = class {
  constructor(path2, scsSource) {
    this.path = path2;
    this.scsSource = scsSource;
    this.fd = import_fs.default.openSync(path2, "r");
    const buffer = Buffer.alloc(FileHeader.size());
    import_fs.default.readSync(this.fd, buffer, { length: buffer.length });
    this.header = FileHeader.fromBuffer(buffer);
  }
  fd;
  header;
  entries;
  dispose() {
    import_fs.default.closeSync(this.fd);
  }
  isValid() {
    return this.header.magic === "SCS#" && this.header.hashMethod === "CITY" && this.header.version === 2;
  }
  parseEntries() {
    Preconditions.checkState(this.isValid());
    if (this.entries) {
      return this.entries;
    }
    const entryHeaders = new ArrayT(
      EntryHeader,
      this.header.entryTableCount
    ).fromBuffer(
      this.readData({
        offset: this.header.entryTableOffset,
        compressedSize: this.header.entryTableCompressedSize,
        uncompressedSize: EntryHeader.size() * this.header.entryTableCount
      })
    );
    const metadataMap = this.createMetadataMap(entryHeaders);
    const directories = [];
    const files2 = [];
    for (const header of entryHeaders) {
      const entry = createEntry(this.fd, header, this.scsSource, metadataMap);
      if (entry.type === "directory") {
        directories.push(entry);
      } else {
        files2.push(entry);
      }
    }
    this.entries = {
      directories: createStore(directories),
      files: createStore(files2)
    };
    return this.entries;
  }
  createMetadataMap(entryHeaders) {
    const metadataMap = /* @__PURE__ */ new Map();
    const metadataTable = this.readData({
      offset: this.header.metadataTableOffset,
      compressedSize: this.header.metadataTableCompressedSize,
      uncompressedSize: this.header.metadataTableSize
    });
    const skippedMetaTypes = /* @__PURE__ */ new Set();
    for (const header of entryHeaders) {
      for (let i2 = 0; i2 < header.metadataCount; i2++) {
        const metadataHeaderByteOffset = 4 * (header.metadataIndex + i2);
        const metadataHeader = MetadataEntryHeader.fromBuffer(
          metadataTable.subarray(
            metadataHeaderByteOffset,
            metadataHeaderByteOffset + MetadataEntryHeader.size()
          )
        );
        const type = metadataHeader.type;
        switch (type) {
          case 1 /* IMG */:
          case 2 /* SAMPLE */:
          case 128 /* PLAIN */:
          case 129 /* DIRECTORY */:
          case 132 /* MIP_TAIL */:
          case 5 /* PMA_INFO */:
          case 6 /* PMG_INFO */: {
            let descriptor;
            if (type === 1 /* IMG */) {
              descriptor = ImageMeta;
            } else if (type === 2 /* SAMPLE */) {
              descriptor = SampleMeta;
            } else if (type === 5 /* PMA_INFO */) {
              descriptor = PmaInfoMeta;
            } else if (type === 6 /* PMG_INFO */) {
              descriptor = PmgInfoMeta;
            } else {
              descriptor = PlainMeta;
            }
            const metadataEntryByteOffset = 4 * metadataHeader.index;
            metadataMap.set(header.metadataIndex + i2, {
              version: metadataHeader.type,
              ...descriptor.fromBuffer(
                metadataTable.subarray(
                  metadataEntryByteOffset,
                  metadataEntryByteOffset + descriptor.size()
                )
              )
            });
            break;
          }
          case 130 /* MIP_0 */:
          case 131 /* MIP_1 */:
          case 3 /* MIP_PROXY */:
          case 4 /* INLINE_DIRECTORY */:
            skippedMetaTypes.add(metadataHeader.type);
            break;
          default:
            throw new UnreachableError(type);
        }
      }
    }
    if (skippedMetaTypes.size) {
      logger.warn("skipped metadata types", skippedMetaTypes);
    }
    return metadataMap;
  }
  readData({
    offset,
    compressedSize,
    uncompressedSize
  }) {
    const buffer = Buffer.alloc(compressedSize);
    import_fs.default.readSync(this.fd, buffer, {
      length: buffer.length,
      position: offset
    });
    return compressedSize !== uncompressedSize ? import_zlib.default.inflateSync(buffer) : buffer;
  }
};
function createStore(values) {
  const map = new Map(values.map((v2) => [v2.hash, v2]));
  return {
    get: (key) => map.get(city64(key))
  };
}
function createEntry(fd, header, scsSource, metadataMap) {
  if (header.metadataCount === 3) {
    return createTobjEntry(fd, header, scsSource, metadataMap);
  }
  if (header.metadataCount === 2) {
    const metas = [
      assertExists(metadataMap.get(header.metadataIndex)),
      assertExists(metadataMap.get(header.metadataIndex + 1))
    ];
    assert(metas[0].version === 128 /* PLAIN */);
    assert(
      metas[1].version === 5 /* PMA_INFO */ || metas[1].version === 6 /* PMG_INFO */
    );
  } else {
    assert(header.metadataCount === 1);
  }
  const assocMetadata = assertExists(metadataMap.get(header.metadataIndex));
  if (header.flags.isDirectory) {
    assert(
      assocMetadata.version === 129 /* DIRECTORY */,
      `assocMetadata.version ${assocMetadata.version} isn't DIRECTORY`
    );
  }
  assert(
    assocMetadata.version === 128 /* PLAIN */ || assocMetadata.version === 129 /* DIRECTORY */
  );
  const plainMeta = assocMetadata;
  const metadata = {
    hash: header.hash,
    offset: plainMeta.offset,
    compressedSize: plainMeta.packedCompressionInfo.compressedSize,
    uncompressedSize: plainMeta.size,
    compression: plainMeta.packedCompressionInfo.compression,
    isDirectory: header.flags.isDirectory
  };
  return metadata.isDirectory ? new ScsArchiveDirectory(fd, metadata, scsSource) : new ScsArchiveFile(fd, metadata, scsSource);
}
function createTobjEntry(fd, header, scsSource, metadataMap) {
  Preconditions.checkArgument(
    !header.flags.isDirectory && header.metadataCount === 3
  );
  const metas = [
    assertExists(metadataMap.get(header.metadataIndex)),
    assertExists(metadataMap.get(header.metadataIndex + 1)),
    assertExists(metadataMap.get(header.metadataIndex + 2))
  ];
  const imageMeta = assertExists(
    metas.find((m2) => m2.version === 1 /* IMG */)
  );
  assertExists(metas.find((m2) => m2.version === 2 /* SAMPLE */));
  const plainMeta = assertExists(
    metas.find((m2) => m2.version === 132 /* MIP_TAIL */)
  );
  return new ScsArchiveTobjFile(
    fd,
    {
      hash: header.hash,
      offset: plainMeta.offset,
      compressedSize: plainMeta.packedCompressionInfo.compressedSize,
      uncompressedSize: plainMeta.size,
      compression: plainMeta.packedCompressionInfo.compression,
      isDirectory: header.flags.isDirectory
    },
    scsSource,
    imageMeta
  );
}
var TileStreamHeader = new Struct({
  id: uint8,
  magic: uint8,
  numTiles: uint16le,
  tileSizeIdx: uint32le,
  lastTileSize: uint32le
});
var ScsArchiveEntry = class {
  constructor(fd, metadata, scsSource) {
    this.fd = fd;
    this.metadata = metadata;
    this.scsSource = scsSource;
  }
  get hash() {
    return this.metadata.hash;
  }
  read() {
    const rawData = Buffer.alloc(this.metadata.compressedSize);
    const bytesRead = import_fs.default.readSync(this.fd, rawData, {
      length: rawData.length,
      position: this.metadata.offset
    });
    assert(bytesRead === rawData.length);
    switch (this.metadata.compression) {
      case 0 /* NONE */:
        return rawData;
      case 1 /* ZLIB */:
        return import_zlib.default.inflateSync(rawData);
      case 3 /* GDEFLATE */: {
        const tileStreamHeader = TileStreamHeader.decode(
          new DecodeStream(rawData)
        );
        const tileOffsets = new Uint32Array(
          rawData.buffer,
          TileStreamHeader.size(),
          tileStreamHeader.numTiles - 1
        );
        const tilesData = rawData.buffer.slice(
          TileStreamHeader.size() + tileOffsets.byteLength
        );
        const kDefaultTileSize = 64 * 1024;
        const outputBuffer = Buffer.alloc(this.metadata.uncompressedSize);
        for (let tileIndex = 0, outputOffset = 0; tileIndex < tileStreamHeader.numTiles; tileIndex++, outputOffset += kDefaultTileSize) {
          const tileData = tilesData.slice(
            tileIndex === 0 ? 0 : tileOffsets[tileIndex - 1]
          );
          const outputTileBuffer = Buffer.alloc(kDefaultTileSize);
          const result = gdeflate(tileData, outputTileBuffer.buffer);
          if (result !== 0) {
            throw new Error(`gdeflate error: ${result}`);
          }
          outputTileBuffer.copy(outputBuffer, outputOffset);
        }
        return outputBuffer;
      }
      case 2 /* ZLIB_HEADERLESS */:
      case 4 /* ZSTD */:
      default:
        throw new Error(
          `unsupported compression type ${this.metadata.compression}`
        );
    }
  }
};
var ScsArchiveFile = class extends ScsArchiveEntry {
  type = "file";
  constructor(fd, metadata, scsSource) {
    super(fd, metadata, scsSource);
  }
};
var ScsArchiveTobjFile = class extends ScsArchiveFile {
  constructor(fd, metadata, scsSource, imageMetadata) {
    super(fd, metadata, scsSource);
    this.imageMetadata = imageMetadata;
  }
  read() {
    const imageMeta = this.imageMetadata.image;
    const imageFormat = imageMeta.format;
    let ddsBytes;
    let { width, height } = this.imageMetadata;
    if (imageFormat === 78) {
      const firstMipmapBytes = width * height;
      ddsBytes = super.read().subarray(0, firstMipmapBytes);
    } else if (imageFormat === 91 || imageFormat === 93 || imageFormat === 88) {
      width = closestPowerOf2(this.imageMetadata.width, "floor");
      height = closestPowerOf2(this.imageMetadata.height, "floor");
      const xOffset = Math.floor((this.imageMetadata.width - width) / 2);
      const yOffset = Math.floor((this.imageMetadata.height - height) / 2);
      ddsBytes = Buffer.alloc(4 * width * height);
      const rawData = super.read();
      const pitch = closestPowerOf2(
        rawData.length / this.imageMetadata.height,
        "ceil"
      );
      for (let rowIdx = 0; rowIdx < height; rowIdx++) {
        rawData.copy(
          ddsBytes,
          // target buffer
          rowIdx * 4 * width,
          // target start
          (rowIdx + yOffset) * pitch + 4 * xOffset,
          // source start
          (rowIdx + yOffset) * pitch + 4 * xOffset + 4 * width
          // source end
        );
      }
    } else {
      throw new Error("unknown image format " + imageFormat);
    }
    const header = Buffer.from(
      DdsHeader.toBuffer({
        size: DdsHeader.size(),
        flags: 0,
        height,
        width,
        pitchOrLinearSize: ddsBytes.length,
        depth: 0,
        mipMapCount: imageMeta.mipmapCount,
        reserved1: void 0,
        ddsPixelFormat: {
          size: 32,
          flags: 0,
          // this looks like the only field of import.
          fourCc: imageFormat === 91 || imageFormat === 93 || imageFormat === 88 ? "\0\0\0\0" : "DXT5",
          rgbBitCount: 0,
          rBitMask: 0,
          gBitMask: 0,
          bBitMask: 0,
          aBitMask: 0
        },
        caps: 0,
        caps2: 0,
        caps3: 0,
        caps4: 0,
        reserved2: void 0
      })
    );
    const ddsFile = Buffer.alloc(
      4 + // magic
      DdsHeader.size() + ddsBytes.length
    );
    ddsFile.write("DDS ");
    header.copy(ddsFile, 4);
    ddsBytes.copy(ddsFile, 4 + DdsHeader.size());
    return ddsFile;
  }
};
function closestPowerOf2(n3, mode) {
  const lg = mode === "floor" ? Math.floor(Math.log2(n3)) : Math.ceil(Math.log2(n3));
  return Math.pow(2, lg);
}
var ScsArchiveDirectory = class extends ScsArchiveEntry {
  type = "directory";
  subdirectories;
  files;
  constructor(fd, metadata, scsSource) {
    super(fd, metadata, scsSource);
    const reader = new DecodeStream(this.read());
    const numStrings = reader.readBuffer(4).readUInt32LE();
    const stringLengths = reader.readBuffer(numStrings).values();
    const subdirectories = [];
    const files2 = [];
    for (const stringLength of stringLengths) {
      const str = reader.readBuffer(stringLength).toString();
      if (str.startsWith("/")) {
        subdirectories.push(str.substring(1));
      } else {
        files2.push(str);
      }
    }
    this.subdirectories = subdirectories;
    this.files = files2;
  }
};

// ../packages/clis/parser/game-files/combined-entries.ts
var CombinedEntries = class {
  archives;
  constructor(archives) {
    const valid = [];
    for (const archive of archives) {
      if (!archive.isValid()) {
        logger.warn(`${archive.path} is invalid. ignoring.`);
        continue;
      }
      valid.push(archive);
    }
    this.archives = valid;
  }
  get directories() {
    return {
      get: (key) => {
        const entries = this.archives.map((a2) => a2.parseEntries().directories.get(key)).filter((e3) => e3 != null);
        return entries.length ? new CompositeDirectory(entries) : void 0;
      }
    };
  }
  get files() {
    return {
      get: (key) => {
        const entries = this.archives.map((a2) => a2.parseEntries().files.get(key)).filter((e3) => e3 != null);
        if (entries.length > 1) {
          logger.debug(
            `multiple files found for ${key}; using most recent one.`
          );
        }
        return entries.length ? entries.at(-1) : void 0;
      }
    };
  }
};
var CompositeDirectory = class {
  type = "directory";
  hash;
  files;
  subdirectories;
  scsSource = "composite";
  scsSources;
  constructor(directories) {
    Preconditions.checkArgument(directories.length > 0);
    this.hash = directories[0].hash;
    this.files = [...new Set(directories.flatMap((d2) => d2.files))];
    this.scsSources = directories.map((d2) => d2.scsSource);
    this.subdirectories = [
      ...new Set(directories.flatMap((d2) => d2.subdirectories))
    ];
  }
};

// ../packages/libs/base/geom.ts
function normalizeRadians(theta) {
  const twoPi = Math.PI * 2;
  let normalized = theta % twoPi;
  normalized = (normalized + twoPi) % twoPi;
  return normalized <= Math.PI ? normalized : normalized - twoPi;
}

// ../packages/libs/map/constants.ts
var AtsDlcGuards = {
  0: /* @__PURE__ */ new Set(),
  1: /* @__PURE__ */ new Set([11 /* Nevada */]),
  2: /* @__PURE__ */ new Set([0 /* Arizona */]),
  3: /* @__PURE__ */ new Set([12 /* NewMexico */]),
  4: /* @__PURE__ */ new Set([14 /* Oregon */]),
  5: /* @__PURE__ */ new Set([18 /* Washington */]),
  6: /* @__PURE__ */ new Set([18 /* Washington */, 14 /* Oregon */]),
  7: /* @__PURE__ */ new Set([17 /* Utah */]),
  8: /* @__PURE__ */ new Set([17 /* Utah */, 12 /* NewMexico */]),
  9: /* @__PURE__ */ new Set([3 /* Idaho */]),
  10: /* @__PURE__ */ new Set([3 /* Idaho */, 14 /* Oregon */]),
  11: /* @__PURE__ */ new Set([3 /* Idaho */, 17 /* Utah */]),
  12: /* @__PURE__ */ new Set([3 /* Idaho */, 18 /* Washington */]),
  13: /* @__PURE__ */ new Set([2 /* Colorado */]),
  14: /* @__PURE__ */ new Set([2 /* Colorado */, 12 /* NewMexico */]),
  15: /* @__PURE__ */ new Set([2 /* Colorado */, 17 /* Utah */]),
  16: /* @__PURE__ */ new Set([19 /* Wyoming */]),
  17: /* @__PURE__ */ new Set([19 /* Wyoming */, 2 /* Colorado */]),
  18: /* @__PURE__ */ new Set([19 /* Wyoming */, 3 /* Idaho */]),
  19: /* @__PURE__ */ new Set([19 /* Wyoming */, 17 /* Utah */]),
  20: /* @__PURE__ */ new Set([16 /* Texas */]),
  21: /* @__PURE__ */ new Set([16 /* Texas */, 12 /* NewMexico */]),
  22: /* @__PURE__ */ new Set([9 /* Montana */]),
  23: /* @__PURE__ */ new Set([9 /* Montana */, 3 /* Idaho */]),
  24: /* @__PURE__ */ new Set([9 /* Montana */, 19 /* Wyoming */]),
  25: /* @__PURE__ */ new Set([13 /* Oklahoma */]),
  26: /* @__PURE__ */ new Set([13 /* Oklahoma */, 2 /* Colorado */]),
  27: /* @__PURE__ */ new Set([13 /* Oklahoma */, 12 /* NewMexico */]),
  28: /* @__PURE__ */ new Set([13 /* Oklahoma */, 16 /* Texas */]),
  29: /* @__PURE__ */ new Set([6 /* Kansas */]),
  30: /* @__PURE__ */ new Set([6 /* Kansas */, 2 /* Colorado */]),
  31: /* @__PURE__ */ new Set([6 /* Kansas */, 13 /* Oklahoma */]),
  32: /* @__PURE__ */ new Set([10 /* Nebraska */]),
  33: /* @__PURE__ */ new Set([10 /* Nebraska */, 2 /* Colorado */]),
  34: /* @__PURE__ */ new Set([10 /* Nebraska */, 6 /* Kansas */]),
  35: /* @__PURE__ */ new Set([10 /* Nebraska */, 19 /* Wyoming */]),
  36: /* @__PURE__ */ new Set([1 /* Arkansas */]),
  37: /* @__PURE__ */ new Set([1 /* Arkansas */, 13 /* Oklahoma */]),
  38: /* @__PURE__ */ new Set([1 /* Arkansas */, 16 /* Texas */]),
  39: /* @__PURE__ */ new Set([8 /* Missouri */]),
  40: /* @__PURE__ */ new Set([8 /* Missouri */, 1 /* Arkansas */]),
  41: /* @__PURE__ */ new Set([8 /* Missouri */, 6 /* Kansas */]),
  42: /* @__PURE__ */ new Set([8 /* Missouri */, 10 /* Nebraska */]),
  43: /* @__PURE__ */ new Set([8 /* Missouri */, 13 /* Oklahoma */]),
  44: /* @__PURE__ */ new Set([5 /* Iowa */]),
  45: /* @__PURE__ */ new Set([5 /* Iowa */, 8 /* Missouri */]),
  46: /* @__PURE__ */ new Set([5 /* Iowa */, 10 /* Nebraska */]),
  47: /* @__PURE__ */ new Set([7 /* Louisiana */]),
  48: /* @__PURE__ */ new Set([7 /* Louisiana */, 1 /* Arkansas */]),
  49: /* @__PURE__ */ new Set([7 /* Louisiana */, 16 /* Texas */]),
  50: /* @__PURE__ */ new Set([4 /* Illinois */]),
  51: /* @__PURE__ */ new Set([4 /* Illinois */, 5 /* Iowa */]),
  52: /* @__PURE__ */ new Set([4 /* Illinois */, 8 /* Missouri */]),
  53: /* @__PURE__ */ new Set([15 /* SouthDakota */]),
  54: /* @__PURE__ */ new Set([15 /* SouthDakota */, 5 /* Iowa */]),
  55: /* @__PURE__ */ new Set([15 /* SouthDakota */, 9 /* Montana */]),
  56: /* @__PURE__ */ new Set([15 /* SouthDakota */, 10 /* Nebraska */]),
  57: /* @__PURE__ */ new Set([15 /* SouthDakota */, 19 /* Wyoming */])
};
var AtsCountryIdToDlcGuard = {
  // Base Map
  [1 /* California */]: 0,
  [2 /* Nevada */]: 1,
  [3 /* Arizona */]: 2,
  // DLCs
  [7 /* Colorado */]: 13,
  [13 /* Idaho */]: 9,
  [31 /* NewMexico */]: 3,
  [37 /* Oregon */]: 4,
  [43 /* Texas */]: 20,
  [44 /* Utah */]: 7,
  [47 /* Washington */]: 5,
  [17 /* Kansas */]: 29,
  [27 /* Montana */]: 22,
  [36 /* Oklahoma */]: 25,
  [50 /* Wyoming */]: 16,
  [18 /* Nebraska */]: 32,
  [19 /* Arkansas */]: 36,
  [26 /* Missouri */]: 39,
  [21 /* Iowa */]: 44,
  [22 /* Lousiana */]: 47,
  [14 /* Illinois */]: 50,
  [41 /* SouthDakota */]: 53
};
for (const dlcGuard of Object.values(AtsCountryIdToDlcGuard)) {
  if (dlcGuard === 0) {
    continue;
  }
  assert(AtsDlcGuards[dlcGuard].size === 1);
}
var MapAreaColorUtils = {
  from: (n3) => {
    switch (n3) {
      case 0:
        return 0 /* Road */;
      case 1:
        return 1 /* Light */;
      case 2:
        return 2 /* Dark */;
      case 3:
        return 3 /* Green */;
      case 4:
        return 4 /* NavRed */;
      case 5:
        return 5 /* NavGreen */;
      case 6:
        return 6 /* NavBlue */;
      case 7:
        return 7 /* NavYellow */;
      case 8:
        return 8 /* NavPurple */;
      default:
        throw new Error("unknown MapAreaColor: " + n3);
    }
  }
};
var MapOverlayTypeUtils = {
  from: (n3) => {
    switch (n3) {
      case 0:
        return 0 /* Road */;
      case 1:
        return 1 /* Parking */;
      case 4:
        return 4 /* Landmark */;
      default:
        throw new Error("unknown MapOverlayType: " + n3);
    }
  }
};

// ../node_modules/binary-parser/dist/binary_parser.js
var IDENTIFIER = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;
function sanitizeReference(ref) {
  if (!ref.split(".").every((s2) => IDENTIFIER.test(s2))) {
    throw new Error(`Invalid reference: ${ref}`);
  }
  return ref;
}
var Context = class {
  code = "";
  scopes = [["vars"]];
  bitFields = [];
  tmpVariableCount = 0;
  references = /* @__PURE__ */ new Map();
  importPath;
  imports = [];
  reverseImports = /* @__PURE__ */ new Map();
  useContextVariables = false;
  constructor(importPath, useContextVariables) {
    this.importPath = importPath;
    this.useContextVariables = useContextVariables;
  }
  generateVariable(name) {
    const scopes = [...this.scopes[this.scopes.length - 1]];
    if (name) {
      scopes.push(name);
    }
    return scopes.join(".");
  }
  generateOption(val) {
    switch (typeof val) {
      case "number":
        return val.toString();
      case "string":
        return this.generateVariable(sanitizeReference(val));
      default:
        return `${this.addImport(val)}.call(${this.generateVariable()}, vars)`;
    }
  }
  generateError(err) {
    this.pushCode(`throw new Error(${err});`);
  }
  generateTmpVariable() {
    return "$tmp" + this.tmpVariableCount++;
  }
  pushCode(code) {
    this.code += code + "\n";
  }
  pushPath(name) {
    if (name) {
      this.scopes[this.scopes.length - 1].push(name);
    }
  }
  popPath(name) {
    if (name) {
      this.scopes[this.scopes.length - 1].pop();
    }
  }
  pushScope(name) {
    this.scopes.push([name]);
  }
  popScope() {
    this.scopes.pop();
  }
  addImport(im) {
    if (!this.importPath)
      return `(${im})`;
    let id = this.reverseImports.get(im);
    if (id === void 0) {
      id = this.imports.push(im) - 1;
      this.reverseImports.set(im, id);
    }
    return `${this.importPath}[${id}]`;
  }
  addReference(alias) {
    if (!this.references.has(alias)) {
      this.references.set(alias, { resolved: false, requested: false });
    }
  }
  markResolved(alias) {
    const reference = this.references.get(alias);
    if (reference) {
      reference.resolved = true;
    }
  }
  markRequested(aliasList) {
    aliasList.forEach((alias) => {
      const reference = this.references.get(alias);
      if (reference) {
        reference.requested = true;
      }
    });
  }
  getUnresolvedReferences() {
    return Array.from(this.references).filter(([_3, reference]) => !reference.resolved && !reference.requested).map(([alias, _3]) => alias);
  }
};
var aliasRegistry = /* @__PURE__ */ new Map();
var FUNCTION_PREFIX = "___parser_";
var PRIMITIVE_SIZES = {
  uint8: 1,
  uint16le: 2,
  uint16be: 2,
  uint32le: 4,
  uint32be: 4,
  int8: 1,
  int16le: 2,
  int16be: 2,
  int32le: 4,
  int32be: 4,
  int64be: 8,
  int64le: 8,
  uint64be: 8,
  uint64le: 8,
  floatle: 4,
  floatbe: 4,
  doublele: 8,
  doublebe: 8
};
var PRIMITIVE_NAMES = {
  uint8: "Uint8",
  uint16le: "Uint16",
  uint16be: "Uint16",
  uint32le: "Uint32",
  uint32be: "Uint32",
  int8: "Int8",
  int16le: "Int16",
  int16be: "Int16",
  int32le: "Int32",
  int32be: "Int32",
  int64be: "BigInt64",
  int64le: "BigInt64",
  uint64be: "BigUint64",
  uint64le: "BigUint64",
  floatle: "Float32",
  floatbe: "Float32",
  doublele: "Float64",
  doublebe: "Float64"
};
var PRIMITIVE_LITTLE_ENDIANS = {
  uint8: false,
  uint16le: true,
  uint16be: false,
  uint32le: true,
  uint32be: false,
  int8: false,
  int16le: true,
  int16be: false,
  int32le: true,
  int32be: false,
  int64be: false,
  int64le: true,
  uint64be: false,
  uint64le: true,
  floatle: true,
  floatbe: false,
  doublele: true,
  doublebe: false
};
var BYTE_ENCODINGS = ["hex", "binary", "base64", "base64url"];
function bytesToLatin1(bytes) {
  let s2 = "";
  for (let i2 = 0; i2 < bytes.length; i2 += 8192) {
    s2 += String.fromCharCode.apply(null, bytes.subarray(i2, i2 + 8192));
  }
  return s2;
}
var Parser = class _Parser {
  varName = "";
  type = "";
  options = {};
  next;
  head;
  compiled;
  endian = "be";
  constructorFn;
  alias;
  useContextVariables = false;
  static start() {
    return new _Parser();
  }
  sanitizeFieldName(name) {
    if (name && !IDENTIFIER.test(name)) {
      throw new Error(`Invalid field name: ${name}`);
    }
    return name;
  }
  primitiveGenerateN(type, ctx) {
    const typeName = PRIMITIVE_NAMES[type];
    const littleEndian = PRIMITIVE_LITTLE_ENDIANS[type];
    ctx.pushCode(`${ctx.generateVariable(this.varName)} = dataView.get${typeName}(offset, ${littleEndian});`);
    ctx.pushCode(`offset += ${PRIMITIVE_SIZES[type]};`);
  }
  primitiveN(type, varName, options) {
    return this.setNextParser(type, varName, options);
  }
  useThisEndian(type) {
    return type + this.endian.toLowerCase();
  }
  uint8(varName, options = {}) {
    return this.primitiveN("uint8", varName, options);
  }
  uint16(varName, options = {}) {
    return this.primitiveN(this.useThisEndian("uint16"), varName, options);
  }
  uint16le(varName, options = {}) {
    return this.primitiveN("uint16le", varName, options);
  }
  uint16be(varName, options = {}) {
    return this.primitiveN("uint16be", varName, options);
  }
  uint32(varName, options = {}) {
    return this.primitiveN(this.useThisEndian("uint32"), varName, options);
  }
  uint32le(varName, options = {}) {
    return this.primitiveN("uint32le", varName, options);
  }
  uint32be(varName, options = {}) {
    return this.primitiveN("uint32be", varName, options);
  }
  int8(varName, options = {}) {
    return this.primitiveN("int8", varName, options);
  }
  int16(varName, options = {}) {
    return this.primitiveN(this.useThisEndian("int16"), varName, options);
  }
  int16le(varName, options = {}) {
    return this.primitiveN("int16le", varName, options);
  }
  int16be(varName, options = {}) {
    return this.primitiveN("int16be", varName, options);
  }
  int32(varName, options = {}) {
    return this.primitiveN(this.useThisEndian("int32"), varName, options);
  }
  int32le(varName, options = {}) {
    return this.primitiveN("int32le", varName, options);
  }
  int32be(varName, options = {}) {
    return this.primitiveN("int32be", varName, options);
  }
  int64(varName, options = {}) {
    return this.primitiveN(this.useThisEndian("int64"), varName, options);
  }
  int64be(varName, options = {}) {
    return this.primitiveN("int64be", varName, options);
  }
  int64le(varName, options = {}) {
    return this.primitiveN("int64le", varName, options);
  }
  uint64(varName, options = {}) {
    return this.primitiveN(this.useThisEndian("uint64"), varName, options);
  }
  uint64be(varName, options = {}) {
    return this.primitiveN("uint64be", varName, options);
  }
  uint64le(varName, options = {}) {
    return this.primitiveN("uint64le", varName, options);
  }
  floatle(varName, options = {}) {
    return this.primitiveN("floatle", varName, options);
  }
  floatbe(varName, options = {}) {
    return this.primitiveN("floatbe", varName, options);
  }
  doublele(varName, options = {}) {
    return this.primitiveN("doublele", varName, options);
  }
  doublebe(varName, options = {}) {
    return this.primitiveN("doublebe", varName, options);
  }
  bitN(size, varName, options) {
    return this.setNextParser("bit", varName, { ...options, length: size });
  }
  bit1(varName, options = {}) {
    return this.bitN(1, varName, options);
  }
  bit2(varName, options = {}) {
    return this.bitN(2, varName, options);
  }
  bit3(varName, options = {}) {
    return this.bitN(3, varName, options);
  }
  bit4(varName, options = {}) {
    return this.bitN(4, varName, options);
  }
  bit5(varName, options = {}) {
    return this.bitN(5, varName, options);
  }
  bit6(varName, options = {}) {
    return this.bitN(6, varName, options);
  }
  bit7(varName, options = {}) {
    return this.bitN(7, varName, options);
  }
  bit8(varName, options = {}) {
    return this.bitN(8, varName, options);
  }
  bit9(varName, options = {}) {
    return this.bitN(9, varName, options);
  }
  bit10(varName, options = {}) {
    return this.bitN(10, varName, options);
  }
  bit11(varName, options = {}) {
    return this.bitN(11, varName, options);
  }
  bit12(varName, options = {}) {
    return this.bitN(12, varName, options);
  }
  bit13(varName, options = {}) {
    return this.bitN(13, varName, options);
  }
  bit14(varName, options = {}) {
    return this.bitN(14, varName, options);
  }
  bit15(varName, options = {}) {
    return this.bitN(15, varName, options);
  }
  bit16(varName, options = {}) {
    return this.bitN(16, varName, options);
  }
  bit17(varName, options = {}) {
    return this.bitN(17, varName, options);
  }
  bit18(varName, options = {}) {
    return this.bitN(18, varName, options);
  }
  bit19(varName, options = {}) {
    return this.bitN(19, varName, options);
  }
  bit20(varName, options = {}) {
    return this.bitN(20, varName, options);
  }
  bit21(varName, options = {}) {
    return this.bitN(21, varName, options);
  }
  bit22(varName, options = {}) {
    return this.bitN(22, varName, options);
  }
  bit23(varName, options = {}) {
    return this.bitN(23, varName, options);
  }
  bit24(varName, options = {}) {
    return this.bitN(24, varName, options);
  }
  bit25(varName, options = {}) {
    return this.bitN(25, varName, options);
  }
  bit26(varName, options = {}) {
    return this.bitN(26, varName, options);
  }
  bit27(varName, options = {}) {
    return this.bitN(27, varName, options);
  }
  bit28(varName, options = {}) {
    return this.bitN(28, varName, options);
  }
  bit29(varName, options = {}) {
    return this.bitN(29, varName, options);
  }
  bit30(varName, options = {}) {
    return this.bitN(30, varName, options);
  }
  bit31(varName, options = {}) {
    return this.bitN(31, varName, options);
  }
  bit32(varName, options = {}) {
    return this.bitN(32, varName, options);
  }
  namely(alias) {
    this.sanitizeFieldName(alias);
    aliasRegistry.set(alias, this);
    this.alias = alias;
    return this;
  }
  skip(length, options = {}) {
    return this.seek(length, options);
  }
  skipBits(length, options = {}) {
    if (options.assert != null) {
      throw new Error("assert option on skipBits is not allowed.");
    }
    if (typeof length !== "number" || !Number.isInteger(length) || length < 1) {
      throw new Error("skipBits length must be a positive integer.");
    }
    if (length > 32) {
      throw new Error("skipBits length must not exceed 32.");
    }
    return this.setNextParser("bit", "", { ...options, length, skip: true });
  }
  seek(relOffset, options = {}) {
    if (options.assert != null) {
      throw new Error("assert option on seek is not allowed.");
    }
    return this.setNextParser("seek", "", { length: relOffset });
  }
  string(varName, options) {
    if (!options.zeroTerminated && options.length == null && !options.greedy) {
      throw new Error("One of length, zeroTerminated, or greedy must be defined for string.");
    }
    if ((options.zeroTerminated || options.length != null) && options.greedy) {
      throw new Error("greedy is mutually exclusive with length and zeroTerminated for string.");
    }
    if (options.stripNull && !(options.length != null || options.greedy)) {
      throw new Error("length or greedy must be defined if stripNull is enabled.");
    }
    const encoding = options.encoding || "utf8";
    if (typeof encoding !== "string") {
      throw new Error("Invalid encoding: must be a string");
    }
    let decoder;
    if (!BYTE_ENCODINGS.includes(encoding.toLowerCase())) {
      try {
        decoder = new TextDecoder(encoding);
      } catch (e3) {
        if (!(e3 instanceof RangeError))
          throw e3;
        throw new Error(`Invalid encoding: ${encoding}`, { cause: e3 });
      }
    }
    options = { ...options, encoding, decoder };
    return this.setNextParser("string", varName, options);
  }
  buffer(varName, options) {
    if (options.length == null && options.readUntil == null) {
      throw new Error("length or readUntil must be defined for buffer.");
    }
    return this.setNextParser("buffer", varName, options);
  }
  wrapped(varName, options) {
    if (typeof options !== "object" && typeof varName === "object") {
      options = varName;
      varName = "";
    }
    if (!options || options.wrapper == null || options.type == null) {
      throw new Error("Both wrapper and type must be defined for wrapped.");
    }
    if (options.length == null && options.readUntil == null) {
      throw new Error("length or readUntil must be defined for wrapped.");
    }
    if (!(options.type instanceof _Parser) && !varName) {
      throw new Error("type must be a Parser object if the variable name is omitted.");
    }
    return this.setNextParser("wrapper", varName, options);
  }
  array(varName, options) {
    if (options.readUntil == null && options.length == null && options.lengthInBytes == null) {
      throw new Error("One of readUntil, length and lengthInBytes must be defined for array.");
    }
    if (options.type == null) {
      throw new Error("type is required for array.");
    }
    if (typeof options.type === "string" && !aliasRegistry.has(options.type) && !(options.type in PRIMITIVE_SIZES)) {
      throw new Error(`Array element type "${options.type}" is unknown.`);
    }
    return this.setNextParser("array", varName, options);
  }
  choice(varName, options) {
    if (typeof options !== "object" && typeof varName === "object") {
      options = varName;
      varName = "";
    }
    if (!options) {
      throw new Error("tag and choices are required for choice.");
    }
    if (options.tag == null) {
      throw new Error("tag is required for choice.");
    }
    if (!options.choices) {
      throw new Error("choices is required for choice.");
    }
    for (const keyString in options.choices) {
      const key = parseInt(keyString, 10);
      const value = options.choices[key];
      if (isNaN(key)) {
        throw new Error(`Choice key "${keyString}" is not a number.`);
      }
      if (typeof value === "string" && !aliasRegistry.has(value) && !(value in PRIMITIVE_SIZES)) {
        throw new Error(`Choice type "${value}" is unknown.`);
      }
      if (typeof value === "string" && !varName) {
        throw new Error("Choice type must be a Parser object if the variable name is omitted.");
      }
    }
    if (typeof options.defaultChoice === "string" && !varName) {
      throw new Error("defaultChoice must be a Parser object if the variable name is omitted.");
    }
    return this.setNextParser("choice", varName, options);
  }
  nest(varName, options) {
    if (typeof options !== "object" && typeof varName === "object") {
      options = varName;
      varName = "";
    }
    if (!options || options.type == null) {
      throw new Error("type is required for nest.");
    }
    if (!(options.type instanceof _Parser) && !aliasRegistry.has(options.type)) {
      throw new Error("type must be a known parser name or a Parser object.");
    }
    if (!(options.type instanceof _Parser) && !varName) {
      throw new Error("type must be a Parser object if the variable name is omitted.");
    }
    return this.setNextParser("nest", varName, options);
  }
  pointer(varName, options) {
    if (options.offset == null) {
      throw new Error("offset is required for pointer.");
    }
    if (options.type == null) {
      throw new Error("type is required for pointer.");
    }
    if (typeof options.type === "string" && !(options.type in PRIMITIVE_SIZES) && !aliasRegistry.has(options.type)) {
      throw new Error(`Pointer type "${options.type}" is unknown.`);
    }
    return this.setNextParser("pointer", varName, options);
  }
  saveOffset(varName, options = {}) {
    return this.setNextParser("saveOffset", varName, options);
  }
  endianness(endianness) {
    switch (endianness.toLowerCase()) {
      case "little":
        this.endian = "le";
        break;
      case "big":
        this.endian = "be";
        break;
      default:
        throw new Error('endianness must be one of "little" or "big"');
    }
    return this;
  }
  endianess(endianess) {
    return this.endianness(endianess);
  }
  useContextVars(useContextVariables = true) {
    this.useContextVariables = useContextVariables;
    return this;
  }
  create(constructorFn) {
    if (typeof constructorFn !== "function") {
      throw new Error("Constructor must be a Function object.");
    }
    this.constructorFn = constructorFn;
    return this;
  }
  getContext(importPath) {
    const ctx = new Context(importPath, this.useContextVariables);
    ctx.pushCode("var dataView = new DataView(buffer.buffer, buffer.byteOffset, buffer.length);");
    if (!this.alias) {
      this.addRawCode(ctx);
    } else {
      this.addAliasedCode(ctx);
      ctx.pushCode(`return ${FUNCTION_PREFIX + this.alias}(0).result;`);
    }
    return ctx;
  }
  getCode() {
    const importPath = "imports";
    return this.getContext(importPath).code;
  }
  addRawCode(ctx) {
    ctx.pushCode("var offset = 0;");
    ctx.pushCode(`var vars = ${this.constructorFn ? "new constructorFn()" : "{}"};`);
    ctx.pushCode("vars.$parent = null;");
    ctx.pushCode("vars.$root = vars;");
    this.generate(ctx);
    this.resolveReferences(ctx);
    ctx.pushCode("delete vars.$parent;");
    ctx.pushCode("delete vars.$root;");
    ctx.pushCode("return vars;");
  }
  addAliasedCode(ctx) {
    ctx.pushCode(`function ${FUNCTION_PREFIX + this.alias}(offset, context) {`);
    ctx.pushCode(`var vars = ${this.constructorFn ? "new constructorFn()" : "{}"};`);
    ctx.pushCode("var ctx = Object.assign({$parent: null, $root: vars}, context || {});");
    ctx.pushCode(`vars = Object.assign(vars, ctx);`);
    this.generate(ctx);
    ctx.markResolved(this.alias);
    this.resolveReferences(ctx);
    ctx.pushCode("Object.keys(ctx).forEach(function (item) { delete vars[item]; });");
    ctx.pushCode("return { offset: offset, result: vars };");
    ctx.pushCode("}");
    return ctx;
  }
  resolveReferences(ctx) {
    const references = ctx.getUnresolvedReferences();
    ctx.markRequested(references);
    references.forEach((alias) => {
      aliasRegistry.get(alias)?.addAliasedCode(ctx);
    });
  }
  compile() {
    const importPath = "imports";
    const ctx = this.getContext(importPath);
    this.compiled = new Function(importPath, `return function (buffer, constructorFn) { ${ctx.code} };`)(ctx.imports);
  }
  // Sum consecutive fields without consuming one stack frame per field.
  sizeOf() {
    let size = this.fieldSizeOf();
    for (let parser = this.next; parser; parser = parser.next) {
      size += parser.fieldSizeOf();
    }
    return size;
  }
  fieldSizeOf() {
    let size = NaN;
    if (Object.keys(PRIMITIVE_SIZES).indexOf(this.type) >= 0) {
      size = PRIMITIVE_SIZES[this.type];
    } else if (this.type === "string" && typeof this.options.length === "number") {
      size = this.options.length;
    } else if (this.type === "buffer" && typeof this.options.length === "number") {
      size = this.options.length;
    } else if (this.type === "array" && typeof this.options.length === "number") {
      let elementSize = NaN;
      if (typeof this.options.type === "string") {
        elementSize = PRIMITIVE_SIZES[this.options.type];
      } else if (this.options.type instanceof _Parser) {
        elementSize = this.options.type.sizeOf();
      }
      size = this.options.length * elementSize;
    } else if (this.type === "seek") {
      size = this.options.length;
    } else if (this.type === "nest") {
      size = this.options.type.sizeOf();
    } else if (!this.type) {
      size = 0;
    }
    return size;
  }
  // Follow the parser chain till the root and start parsing from there
  parse(buffer) {
    if (!this.compiled) {
      this.compile();
    }
    return this.compiled(buffer, this.constructorFn);
  }
  setNextParser(type, varName, options) {
    const parser = new _Parser();
    parser.type = type;
    parser.varName = this.sanitizeFieldName(varName);
    parser.options = options;
    parser.endian = this.endian;
    if (this.head) {
      this.head.next = parser;
    } else {
      this.next = parser;
    }
    this.head = parser;
    return this;
  }
  // Generate consecutive fields without consuming one stack frame per field.
  generate(ctx) {
    this.generateField(ctx);
    for (let parser = this.next; parser; parser = parser.next) {
      parser.generateField(ctx);
    }
    return ctx;
  }
  generateField(ctx) {
    if (this.type) {
      switch (this.type) {
        case "uint8":
        case "uint16le":
        case "uint16be":
        case "uint32le":
        case "uint32be":
        case "int8":
        case "int16le":
        case "int16be":
        case "int32le":
        case "int32be":
        case "int64be":
        case "int64le":
        case "uint64be":
        case "uint64le":
        case "floatle":
        case "floatbe":
        case "doublele":
        case "doublebe":
          this.primitiveGenerateN(this.type, ctx);
          break;
        case "bit":
          this.generateBit(ctx);
          break;
        case "string":
          this.generateString(ctx);
          break;
        case "buffer":
          this.generateBuffer(ctx);
          break;
        case "seek":
          this.generateSeek(ctx);
          break;
        case "nest":
          this.generateNest(ctx);
          break;
        case "array":
          this.generateArray(ctx);
          break;
        case "choice":
          this.generateChoice(ctx);
          break;
        case "pointer":
          this.generatePointer(ctx);
          break;
        case "saveOffset":
          this.generateSaveOffset(ctx);
          break;
        case "wrapper":
          this.generateWrapper(ctx);
          break;
      }
      if (this.type !== "bit")
        this.generateAssert(ctx);
    }
    const varName = ctx.generateVariable(this.varName);
    if (this.options.formatter && this.type !== "bit") {
      this.generateFormatter(ctx, varName, this.options.formatter);
    }
  }
  generateAssert(ctx, varName = ctx.generateVariable(this.varName)) {
    if (this.options.assert == null) {
      return;
    }
    switch (typeof this.options.assert) {
      case "function":
        {
          const func = ctx.addImport(this.options.assert);
          ctx.pushCode(`if (!${func}.call(vars, ${varName})) {`);
        }
        break;
      case "number":
        ctx.pushCode(`if (${this.options.assert} !== ${varName}) {`);
        break;
      case "string":
        ctx.pushCode(`if (${JSON.stringify(this.options.assert)} !== ${varName}) {`);
        break;
      default:
        throw new Error("assert option must be a string, number or a function.");
    }
    ctx.generateError(`"Assertion error: ${varName} is " + ${JSON.stringify(this.options.assert.toString())}`);
    ctx.pushCode("}");
  }
  nextNotBit() {
    if (this.next) {
      if (this.next.type === "nest") {
        if (this.next.options.type instanceof _Parser) {
          if (this.next.options.type.next) {
            return this.next.options.type.next.type !== "bit";
          }
          return false;
        } else {
          return true;
        }
      } else {
        return this.next.type !== "bit";
      }
    } else {
      return true;
    }
  }
  generateBit(ctx) {
    const parser = new _Parser();
    parser.options = this.options;
    parser.generateAssert = this.generateAssert.bind(this);
    const thisVar = ctx.generateVariable();
    parser.generateFormatter = (c3, v2, f3) => this.generateFormatter(c3, v2, f3, thisVar);
    parser.varName = ctx.generateVariable(this.varName);
    ctx.bitFields.push(parser);
    if (!this.next || this.nextNotBit()) {
      const val = ctx.generateTmpVariable();
      ctx.pushCode(`var ${val} = 0;`);
      const getMaxBits = (from = 0) => {
        let sum2 = 0;
        for (let i2 = from; i2 < ctx.bitFields.length; i2++) {
          const length = ctx.bitFields[i2].options.length;
          if (sum2 + length > 32)
            break;
          sum2 += length;
        }
        return sum2;
      };
      const getBytes = (sum2) => {
        if (sum2 <= 8) {
          ctx.pushCode(`${val} = dataView.getUint8(offset);`);
          sum2 = 8;
        } else if (sum2 <= 16) {
          ctx.pushCode(`${val} = dataView.getUint16(offset);`);
          sum2 = 16;
        } else if (sum2 <= 24) {
          ctx.pushCode(`${val} = (dataView.getUint16(offset) << 8) | dataView.getUint8(offset + 2);`);
          sum2 = 24;
        } else {
          ctx.pushCode(`${val} = dataView.getUint32(offset);`);
          sum2 = 32;
        }
        ctx.pushCode(`offset += ${sum2 / 8};`);
        return sum2;
      };
      let bitOffset = 0;
      const isBigEndian2 = this.endian === "be";
      let sum = 0;
      let rem = 0;
      ctx.bitFields.forEach((field, i2) => {
        let length = field.options.length;
        if (length > rem) {
          if (rem > 0) {
            if (!field.options.skip) {
              const mask = -1 >>> 32 - rem;
              ctx.pushCode(`${field.varName} = (${val} & 0x${mask.toString(16)}) << ${length - rem};`);
            }
            length -= rem;
          }
          bitOffset = 0;
          rem = sum = getBytes(getMaxBits(i2) - rem);
        }
        if (!field.options.skip) {
          const offset = isBigEndian2 ? sum - bitOffset - length : bitOffset;
          const mask = -1 >>> 32 - length;
          ctx.pushCode(`${field.varName} ${length < field.options.length ? "|=" : "="} ${val} >> ${offset} & 0x${mask.toString(16)};`);
          if (field.options.length === 32) {
            ctx.pushCode(`${field.varName} >>>= 0`);
          }
          if (field.options.assert != null) {
            field.generateAssert(ctx, field.varName);
          }
          if (field.options.formatter) {
            field.generateFormatter(ctx, field.varName, field.options.formatter);
          }
        }
        bitOffset += length;
        rem -= length;
      });
      ctx.bitFields = [];
    }
  }
  generateSeek(ctx) {
    const length = ctx.generateOption(this.options.length);
    ctx.pushCode(`offset += ${length};`);
  }
  generateString(ctx) {
    const name = ctx.generateVariable(this.varName);
    const start = ctx.generateTmpVariable();
    const decoder = this.options.decoder;
    const latin1 = (bytes) => `${ctx.addImport(bytesToLatin1)}(${bytes})`;
    const decode = (bytes) => {
      if (decoder)
        return `${ctx.addImport(decoder)}.decode(${bytes})`;
      switch (this.options.encoding.toLowerCase()) {
        case "hex":
          return `Array.from(${bytes}, b => b.toString(16).padStart(2, "0")).join('')`;
        case "binary":
          return latin1(bytes);
        case "base64":
          return `btoa(${latin1(bytes)})`;
        default:
          return `btoa(${latin1(bytes)}).replace(/\\+/g, '-').replace(/\\//g, '_').replace(/=+$/, '')`;
      }
    };
    if (this.options.length != null && this.options.zeroTerminated) {
      const len = ctx.generateTmpVariable();
      ctx.pushCode(`var ${len} = ${ctx.generateOption(this.options.length)};`);
      ctx.pushCode(`var ${start} = offset;`);
      ctx.pushCode(`while(offset - ${start} < ${len} && dataView.getUint8(offset) !== 0) offset++;`);
      ctx.pushCode(`${name} = ${decode(`buffer.subarray(${start}, offset)`)};`);
      ctx.pushCode(`if (offset - ${start} < ${len}) offset++;`);
    } else if (this.options.length != null) {
      const len = ctx.generateOption(this.options.length);
      ctx.pushCode(`${name} = ${decode(`buffer.subarray(offset, offset + ${len})`)};`);
      ctx.pushCode(`offset += ${len};`);
    } else if (this.options.zeroTerminated) {
      ctx.pushCode(`var ${start} = offset;`);
      ctx.pushCode("while(dataView.getUint8(offset++) !== 0);");
      ctx.pushCode(`${name} = ${decode(`buffer.subarray(${start}, offset - 1)`)};`);
    } else if (this.options.greedy) {
      ctx.pushCode(`var ${start} = offset;`);
      ctx.pushCode("offset = buffer.length;");
      ctx.pushCode(`${name} = ${decode(`buffer.subarray(${start}, offset)`)};`);
    }
    if (this.options.stripNull) {
      ctx.pushCode(`${name} = ${name}.replace(/\\x00+$/g, '')`);
    }
  }
  generateBuffer(ctx) {
    const varName = ctx.generateVariable(this.varName);
    if (typeof this.options.readUntil === "function") {
      const pred = this.options.readUntil;
      const start = ctx.generateTmpVariable();
      const cur = ctx.generateTmpVariable();
      ctx.pushCode(`var ${start} = offset;`);
      ctx.pushCode(`var ${cur} = 0;`);
      ctx.pushCode(`while (offset < buffer.length) {`);
      ctx.pushCode(`${cur} = dataView.getUint8(offset);`);
      const func = ctx.addImport(pred);
      ctx.pushCode(`if (${func}.call(${ctx.generateVariable()}, ${cur}, buffer.subarray(offset))) break;`);
      ctx.pushCode(`offset += 1;`);
      ctx.pushCode(`}`);
      ctx.pushCode(`${varName} = buffer.subarray(${start}, offset);`);
    } else if (this.options.readUntil === "eof") {
      ctx.pushCode(`${varName} = buffer.subarray(offset);`);
    } else {
      const len = ctx.generateOption(this.options.length);
      ctx.pushCode(`${varName} = buffer.subarray(offset, offset + ${len});`);
      ctx.pushCode(`offset += ${len};`);
    }
    if (this.options.clone) {
      ctx.pushCode(`${varName} = buffer.constructor.from(${varName});`);
    }
  }
  generateArray(ctx) {
    const length = ctx.generateOption(this.options.length);
    const lengthInBytes = this.options.lengthInBytes == null ? void 0 : ctx.generateOption(this.options.lengthInBytes);
    const type = this.options.type;
    const counter = ctx.generateTmpVariable();
    const lhs = ctx.generateVariable(this.varName);
    const item = ctx.generateTmpVariable();
    const key = this.options.key;
    const isHash = typeof key === "string";
    if (isHash)
      sanitizeReference(key);
    const checkProgress = this.options.readUntil === "eof" || lengthInBytes !== void 0;
    const start = checkProgress ? ctx.generateTmpVariable() : "";
    if (isHash) {
      ctx.pushCode(`${lhs} = {};`);
    } else {
      ctx.pushCode(`${lhs} = [];`);
    }
    if (typeof this.options.readUntil === "function") {
      ctx.pushCode("do {");
    } else if (this.options.readUntil === "eof") {
      ctx.pushCode(`for (var ${counter} = 0; offset < buffer.length; ${counter}++) {`);
    } else if (lengthInBytes !== void 0) {
      ctx.pushCode(`for (var ${counter} = offset + ${lengthInBytes}; offset < ${counter}; ) {`);
    } else {
      ctx.pushCode(`for (var ${counter} = ${length}; ${counter} > 0; ${counter}--) {`);
    }
    if (checkProgress) {
      ctx.pushCode(`var ${start} = offset;`);
    }
    if (typeof type === "string") {
      if (!aliasRegistry.get(type)) {
        const typeName = PRIMITIVE_NAMES[type];
        const littleEndian = PRIMITIVE_LITTLE_ENDIANS[type];
        ctx.pushCode(`var ${item} = dataView.get${typeName}(offset, ${littleEndian});`);
        ctx.pushCode(`offset += ${PRIMITIVE_SIZES[type]};`);
      } else {
        const tempVar = ctx.generateTmpVariable();
        ctx.pushCode(`var ${tempVar} = ${FUNCTION_PREFIX + type}(offset, {`);
        if (ctx.useContextVariables) {
          const parentVar = ctx.generateVariable();
          ctx.pushCode(`$parent: ${parentVar},`);
          ctx.pushCode(`$root: ${parentVar}.$root,`);
          if (this.options.readUntil == null && lengthInBytes === void 0) {
            ctx.pushCode(`$index: ${length} - ${counter},`);
          }
        }
        ctx.pushCode(`});`);
        ctx.pushCode(`var ${item} = ${tempVar}.result; offset = ${tempVar}.offset;`);
        if (type !== this.alias)
          ctx.addReference(type);
      }
    } else if (type instanceof _Parser) {
      ctx.pushCode(`var ${item} = {};`);
      const parentVar = ctx.generateVariable();
      ctx.pushScope(item);
      if (ctx.useContextVariables) {
        ctx.pushCode(`${item}.$parent = ${parentVar};`);
        ctx.pushCode(`${item}.$root = ${parentVar}.$root;`);
        if (this.options.readUntil == null && lengthInBytes === void 0) {
          ctx.pushCode(`${item}.$index = ${length} - ${counter};`);
        }
      }
      type.generate(ctx);
      if (ctx.useContextVariables) {
        ctx.pushCode(`delete ${item}.$parent;`);
        ctx.pushCode(`delete ${item}.$root;`);
        ctx.pushCode(`delete ${item}.$index;`);
      }
      ctx.popScope();
    }
    if (isHash) {
      const hashKey = ctx.generateTmpVariable();
      ctx.pushCode(`var ${hashKey} = ${item}.${key};`);
      ctx.pushCode(`if (${hashKey} === "__proto__") {`);
      ctx.generateError(`"Invalid key: __proto__"`);
      ctx.pushCode("}");
      ctx.pushCode(`${lhs}[${hashKey}] = ${item};`);
    } else {
      ctx.pushCode(`${lhs}.push(${item});`);
    }
    if (checkProgress) {
      ctx.pushCode(`if (offset <= ${start}) throw new Error("Array element did not consume any bytes");`);
    }
    ctx.pushCode("}");
    if (typeof this.options.readUntil === "function") {
      const pred = this.options.readUntil;
      const func = ctx.addImport(pred);
      ctx.pushCode(`while (!${func}.call(${ctx.generateVariable()}, ${item}, buffer.subarray(offset)));`);
    }
  }
  generateChoiceCase(ctx, varName, type) {
    if (typeof type === "string") {
      const fieldVar = ctx.generateVariable(this.varName);
      if (!aliasRegistry.has(type)) {
        const typeName = PRIMITIVE_NAMES[type];
        const littleEndian = PRIMITIVE_LITTLE_ENDIANS[type];
        ctx.pushCode(`${fieldVar} = dataView.get${typeName}(offset, ${littleEndian});`);
        ctx.pushCode(`offset += ${PRIMITIVE_SIZES[type]}`);
      } else {
        const tempVar = ctx.generateTmpVariable();
        ctx.pushCode(`var ${tempVar} = ${FUNCTION_PREFIX + type}(offset, {`);
        if (ctx.useContextVariables) {
          ctx.pushCode(`$parent: ${fieldVar}.$parent,`);
          ctx.pushCode(`$root: ${fieldVar}.$root,`);
        }
        ctx.pushCode(`});`);
        ctx.pushCode(`${fieldVar} = ${tempVar}.result; offset = ${tempVar}.offset;`);
        if (type !== this.alias)
          ctx.addReference(type);
      }
    } else if (type instanceof _Parser) {
      ctx.pushPath(varName);
      type.generate(ctx);
      ctx.popPath(varName);
    }
  }
  generateChoice(ctx) {
    const tag = ctx.generateOption(this.options.tag);
    const nestVar = ctx.generateVariable(this.varName);
    if (this.varName) {
      ctx.pushCode(`${nestVar} = {};`);
      if (ctx.useContextVariables) {
        const parentVar = ctx.generateVariable();
        ctx.pushCode(`${nestVar}.$parent = ${parentVar};`);
        ctx.pushCode(`${nestVar}.$root = ${parentVar}.$root;`);
      }
    }
    ctx.pushCode(`switch(${tag}) {`);
    for (const tagString in this.options.choices) {
      const key = parseInt(tagString, 10);
      const type = this.options.choices[key];
      ctx.pushCode(`case ${key}:`);
      this.generateChoiceCase(ctx, this.varName, type);
      ctx.pushCode("break;");
    }
    ctx.pushCode("default:");
    if (this.options.defaultChoice != null) {
      this.generateChoiceCase(ctx, this.varName, this.options.defaultChoice);
    } else {
      ctx.generateError(`"Met undefined tag value " + ${tag} + " at choice"`);
    }
    ctx.pushCode("}");
    if (this.varName && ctx.useContextVariables) {
      ctx.pushCode(`delete ${nestVar}.$parent;`);
      ctx.pushCode(`delete ${nestVar}.$root;`);
    }
  }
  generateNest(ctx) {
    const nestVar = ctx.generateVariable(this.varName);
    if (this.options.type instanceof _Parser) {
      if (this.varName) {
        ctx.pushCode(`${nestVar} = {};`);
        if (ctx.useContextVariables) {
          const parentVar = ctx.generateVariable();
          ctx.pushCode(`${nestVar}.$parent = ${parentVar};`);
          ctx.pushCode(`${nestVar}.$root = ${parentVar}.$root;`);
        }
      }
      ctx.pushPath(this.varName);
      this.options.type.generate(ctx);
      ctx.popPath(this.varName);
      if (this.varName && ctx.useContextVariables) {
        ctx.pushCode(`delete ${nestVar}.$parent;`);
        ctx.pushCode(`delete ${nestVar}.$root;`);
      }
    } else if (aliasRegistry.has(this.options.type)) {
      const tempVar = ctx.generateTmpVariable();
      ctx.pushCode(`var ${tempVar} = ${FUNCTION_PREFIX + this.options.type}(offset, {`);
      if (ctx.useContextVariables) {
        const parentVar = ctx.generateVariable();
        ctx.pushCode(`$parent: ${parentVar},`);
        ctx.pushCode(`$root: ${parentVar}.$root,`);
      }
      ctx.pushCode(`});`);
      ctx.pushCode(`${nestVar} = ${tempVar}.result; offset = ${tempVar}.offset;`);
      if (this.options.type !== this.alias) {
        ctx.addReference(this.options.type);
      }
    }
  }
  generateWrapper(ctx) {
    const wrapperVar = ctx.generateVariable(this.varName);
    const wrappedBuf = ctx.generateTmpVariable();
    if (typeof this.options.readUntil === "function") {
      const pred = this.options.readUntil;
      const start = ctx.generateTmpVariable();
      const cur = ctx.generateTmpVariable();
      ctx.pushCode(`var ${start} = offset;`);
      ctx.pushCode(`var ${cur} = 0;`);
      ctx.pushCode(`while (offset < buffer.length) {`);
      ctx.pushCode(`${cur} = dataView.getUint8(offset);`);
      const func2 = ctx.addImport(pred);
      ctx.pushCode(`if (${func2}.call(${ctx.generateVariable()}, ${cur}, buffer.subarray(offset))) break;`);
      ctx.pushCode(`offset += 1;`);
      ctx.pushCode(`}`);
      ctx.pushCode(`${wrappedBuf} = buffer.subarray(${start}, offset);`);
    } else if (this.options.readUntil === "eof") {
      ctx.pushCode(`${wrappedBuf} = buffer.subarray(offset);`);
    } else {
      const len = ctx.generateOption(this.options.length);
      ctx.pushCode(`${wrappedBuf} = buffer.subarray(offset, offset + ${len});`);
      ctx.pushCode(`offset += ${len};`);
    }
    if (this.options.clone) {
      ctx.pushCode(`${wrappedBuf} = buffer.constructor.from(${wrappedBuf});`);
    }
    const tempBuf = ctx.generateTmpVariable();
    const tempOff = ctx.generateTmpVariable();
    const tempView = ctx.generateTmpVariable();
    const func = ctx.addImport(this.options.wrapper);
    ctx.pushCode(`${wrappedBuf} = ${func}.call(${ctx.generateVariable()}, ${wrappedBuf}).subarray(0);`);
    ctx.pushCode(`var ${tempBuf} = buffer;`);
    ctx.pushCode(`var ${tempOff} = offset;`);
    ctx.pushCode(`var ${tempView} = dataView;`);
    ctx.pushCode(`buffer = ${wrappedBuf};`);
    ctx.pushCode(`offset = 0;`);
    ctx.pushCode(`dataView = new DataView(buffer.buffer, buffer.byteOffset, buffer.length);`);
    if (this.options.type instanceof _Parser) {
      if (this.varName) {
        ctx.pushCode(`${wrapperVar} = {};`);
      }
      ctx.pushPath(this.varName);
      this.options.type.generate(ctx);
      ctx.popPath(this.varName);
    } else if (aliasRegistry.has(this.options.type)) {
      const tempVar = ctx.generateTmpVariable();
      ctx.pushCode(`var ${tempVar} = ${FUNCTION_PREFIX + this.options.type}(0);`);
      ctx.pushCode(`${wrapperVar} = ${tempVar}.result;`);
      if (this.options.type !== this.alias) {
        ctx.addReference(this.options.type);
      }
    }
    ctx.pushCode(`buffer = ${tempBuf};`);
    ctx.pushCode(`dataView = ${tempView};`);
    ctx.pushCode(`offset = ${tempOff};`);
  }
  generateFormatter(ctx, varName, formatter, thisVar = ctx.generateVariable()) {
    if (typeof formatter === "function") {
      const func = ctx.addImport(formatter);
      ctx.pushCode(`${varName} = ${func}.call(${thisVar}, ${varName});`);
    }
  }
  generatePointer(ctx) {
    const type = this.options.type;
    const offset = ctx.generateOption(this.options.offset);
    const tempVar = ctx.generateTmpVariable();
    const nestVar = ctx.generateVariable(this.varName);
    ctx.pushCode(`var ${tempVar} = offset;`);
    ctx.pushCode(`offset = ${offset};`);
    if (this.options.type instanceof _Parser) {
      ctx.pushCode(`${nestVar} = {};`);
      if (ctx.useContextVariables) {
        const parentVar = ctx.generateVariable();
        ctx.pushCode(`${nestVar}.$parent = ${parentVar};`);
        ctx.pushCode(`${nestVar}.$root = ${parentVar}.$root;`);
      }
      ctx.pushPath(this.varName);
      this.options.type.generate(ctx);
      ctx.popPath(this.varName);
      if (ctx.useContextVariables) {
        ctx.pushCode(`delete ${nestVar}.$parent;`);
        ctx.pushCode(`delete ${nestVar}.$root;`);
      }
    } else if (aliasRegistry.has(this.options.type)) {
      const resultVar = ctx.generateTmpVariable();
      ctx.pushCode(`var ${resultVar} = ${FUNCTION_PREFIX + this.options.type}(offset, {`);
      if (ctx.useContextVariables) {
        const parentVar = ctx.generateVariable();
        ctx.pushCode(`$parent: ${parentVar},`);
        ctx.pushCode(`$root: ${parentVar}.$root,`);
      }
      ctx.pushCode(`});`);
      ctx.pushCode(`${nestVar} = ${resultVar}.result; offset = ${resultVar}.offset;`);
      if (this.options.type !== this.alias) {
        ctx.addReference(this.options.type);
      }
    } else if (Object.keys(PRIMITIVE_SIZES).indexOf(this.options.type) >= 0) {
      const typeName = PRIMITIVE_NAMES[type];
      const littleEndian = PRIMITIVE_LITTLE_ENDIANS[type];
      ctx.pushCode(`${nestVar} = dataView.get${typeName}(offset, ${littleEndian});`);
      ctx.pushCode(`offset += ${PRIMITIVE_SIZES[type]};`);
    }
    ctx.pushCode(`offset = ${tempVar};`);
  }
  generateSaveOffset(ctx) {
    const varName = ctx.generateVariable(this.varName);
    ctx.pushCode(`${varName} = offset`);
  }
};

// ../packages/clis/parser/game-files/binary-parser-adapter.ts
var BinaryParserBase = class {
  decode(stream) {
    const parser = new Parser();
    this.bind("root", parser);
    parser.saveOffset("_privateOffset").seek(function() {
      stream.pos = this._privateOffset;
      return 0;
    });
    const res = parser.parse(stream.buffer);
    return res.root;
  }
  fromBuffer(buffer) {
    return this.decode(new DecodeStream2(buffer));
  }
  size() {
    const parser = new Parser();
    this.bind("root", parser);
    return parser.sizeOf();
  }
};
var NumberBase = class extends BinaryParserBase {
  constructor(primitiveType) {
    super();
    this.primitiveType = primitiveType;
  }
  bind(name, parser) {
    parser[this.primitiveType](name);
    return parser;
  }
};
var String2 = class extends BinaryParserBase {
  constructor(length) {
    super();
    this.length = length;
  }
  bind(name, parser) {
    return parser.string(name, {
      length: this.length,
      encoding: "ascii"
    });
  }
};
var Struct2 = class extends BinaryParserBase {
  constructor(map) {
    super();
    this.map = map;
  }
  bind(name, parser) {
    const sParser = new Parser();
    for (const [key, val] of Object.entries(this.map)) {
      if (val instanceof BinaryParserBase) {
        val.bind(key, sParser);
      } else {
        console.error(key, val);
        throw new Error("struct: encountered unexpected type");
      }
    }
    return parser.nest(name, {
      type: sParser,
      formatter: (item) => {
        const { _tmp, ...rest } = item;
        return rest;
      }
    });
  }
};
var Array2 = class extends BinaryParserBase {
  constructor(type, lengthField) {
    super();
    this.type = type;
    this.lengthField = lengthField;
    if (!(this.type instanceof BinaryParserBase)) {
      throw new Error("array: encountered unexpected type");
    }
  }
  bind(name, parser) {
    const itemType = this.type;
    let type;
    if (itemType instanceof NumberBase) {
      type = itemType.primitiveType;
    } else {
      type = new Parser();
      itemType.bind(null, type);
    }
    if (this.lengthField instanceof NumberBase) {
      const countField = "_tmp";
      this.lengthField.bind(countField, parser);
      return parser.array(name, {
        type,
        length: countField
      });
    } else if (this.lengthField instanceof Function) {
      const lengthFn = this.lengthField;
      return parser.array(name, {
        type,
        length: function() {
          return lengthFn(this);
        }
      });
    } else {
      return parser.array(name, {
        type,
        length: this.lengthField
      });
    }
  }
};
var Reserved2 = class extends BinaryParserBase {
  constructor(type, count = 1) {
    super();
    this.type = type;
    this.count = count;
  }
  bind(_name, parser) {
    return parser.array("_tmp", {
      type: this.type.primitiveType,
      length: this.count,
      formatter: () => void 0
    });
  }
};
var Optional2 = class extends BinaryParserBase {
  constructor(type, testFn) {
    super();
    this.type = type;
    this.testFn = testFn;
  }
  bind(name, parser) {
    const itemType = this.type;
    let type;
    if (itemType instanceof NumberBase) {
      type = itemType.primitiveType;
    } else {
      type = new Parser();
      itemType.bind(null, type);
    }
    const testFn = this.testFn;
    return parser.array(name, {
      type,
      length: function() {
        return testFn(this) ? 1 : 0;
      },
      formatter: (arr) => arr[0]
    });
  }
};
var VersionedStruct2 = class extends BinaryParserBase {
  constructor(tagType, headerAndTypes) {
    super();
    this.tagType = tagType;
    const { header, ...types2 } = headerAndTypes;
    this.types = types2;
    this.headerStruct = new Struct2(header);
  }
  headerStruct;
  types;
  bind(name, parser) {
    const vsParser = new Parser();
    this.tagType.bind("version", vsParser);
    this.headerStruct.bind(null, vsParser);
    const parserMap = {};
    for (const key of Object.keys(this.types)) {
      const structDef = this.types[key];
      const struct = new Struct2(
        structDef
      );
      const structParser = new Parser();
      struct.bind(null, structParser);
      parserMap[key] = structParser;
    }
    vsParser.choice(null, {
      tag: "version",
      choices: parserMap
    });
    return parser.nest(name, { type: vsParser });
  }
};
var DecodeStream2 = class {
  constructor(buffer) {
    this.buffer = buffer;
  }
  pos = 0;
};
var floatle2 = new NumberBase("floatle");
var int16le2 = new NumberBase("int16le");
var int32le2 = new NumberBase("int32le");
var int82 = new NumberBase("int8");
var uint16le2 = new NumberBase("uint16le");
var uint32le2 = new NumberBase("uint32le");
var uint82 = new NumberBase("uint8");
var r3 = {
  String: String2,
  Struct: Struct2,
  Array: Array2,
  Reserved: Reserved2,
  Optional: Optional2,
  VersionedStruct: VersionedStruct2,
  //
  DecodeStream: DecodeStream2,
  //
  uint16le: uint16le2,
  uint32le: uint32le2,
  floatle: floatle2,
  uint8: uint82,
  int16le: int16le2,
  int32le: int32le2,
  int8: int82
};
var Uint64String2 = class extends BinaryParserBase {
  bind(name, parser) {
    const sizeField = "_tmp";
    return parser.uint64le(sizeField).wrapped(null, {
      length: function() {
        const thisRecord = this;
        return Number(thisRecord[sizeField]);
      },
      wrapper: (buffer) => buffer,
      type: new Parser().string(name, {
        greedy: true,
        zeroTerminated: false,
        encoding: "utf8"
      })
    });
  }
};
var Token2 = class _Token extends BinaryParserBase {
  static tokenLetters = [
    ..."\x000123456789abcdefghijklmnopqrstuvwxyz_"
  ];
  bind(name, parser) {
    return parser.uint64le(name, {
      formatter: function(n3) {
        let str = "";
        do {
          str += _Token.tokenLetters[Number(n3 % 38n)];
          n3 /= 38n;
        } while (n3 !== 0n);
        return str.replaceAll("\0", "");
      }
    });
  }
};
var float32 = new r3.Array(floatle2, 3);
var float42 = new r3.Array(floatle2, 4);
var token642 = new Token2();
var uint64String2 = new Uint64String2();
var uint64le2 = new NumberBase("uint64le");

// ../packages/clis/parser/game-files/sector-parser.ts
var quadInfo = new r3.Struct({
  materials: new r3.Array(
    new r3.Struct({
      token: token642,
      rot: r3.uint16le
    }),
    r3.uint16le
  ),
  colors: new r3.Array(r3.uint32le, r3.uint16le),
  sizeX: r3.uint16le,
  sizeY: r3.uint16le,
  storage: new r3.Array(r3.uint32le, r3.uint32le),
  offsets: new r3.Array(
    new r3.Struct({
      x: r3.uint16le,
      y: r3.uint16le,
      normal: float32
    }),
    r3.uint32le
  ),
  normals: new r3.Array(
    new r3.Struct({
      x: r3.uint16le,
      y: r3.uint16le,
      normal: float32
    }),
    r3.uint32le
  )
});
var vegetationSpheres = new r3.Array(
  new r3.Struct({
    center: float32,
    radius: r3.floatle,
    type: r3.uint32le
  }),
  r3.uint32le
);
var SimpleItemStruct = {
  header: {
    // Note: care must be taken to _not_ reuse header keys
    // in the versioned struct keys below, as the keys get
    // merged during decoding.
    uid: uint64le2,
    pos: float32,
    posR: float32,
    rot: float32,
    padding: new r3.Reserved(r3.floatle, 1),
    flags: r3.uint32le,
    viewDistance: r3.uint8
    // uncomment this to get console output of the above item headers.
    // useful for finding node UIDs of items that may have changed between
    // game versions.
    //debugStruct,
  },
  [1 /* Terrain */]: {
    startNodeUid: uint64le2,
    endNodeUid: uint64le2,
    node0Offset: float32,
    node1Offset: float32,
    length: r3.floatle,
    previousLength: r3.floatle,
    randomSeed: r3.uint32le,
    railings: new r3.Array(
      new r3.Struct({
        token: token642,
        offset: r3.uint16le
      }),
      3
    ),
    terrains: new r3.Array(
      new r3.Struct({
        size: r3.uint16le,
        profile: token642,
        coef: r3.floatle,
        prevProfile: token642,
        prevCoef: r3.floatle,
        vegetation: new r3.Array(
          new r3.Struct({
            token: token642,
            density: r3.uint16le,
            highPolyDistance: r3.uint8,
            scaleType: r3.uint8,
            start: r3.uint16le,
            end: r3.uint16le
          }),
          3
        ),
        dvdm: r3.uint16le,
        dvd: r3.uint16le
      }),
      2
    ),
    vegetationSpheres,
    rightQuad: quadInfo,
    leftQuad: quadInfo,
    rightEdge: token642,
    rightEdgeLook: token642,
    leftEdge: token642,
    leftEdgeLook: token642
  },
  [2 /* Building */]: {
    scheme: token642,
    lookOverride: token642,
    startNodeUid: uint64le2,
    endNodeUid: uint64le2,
    length: r3.floatle,
    seed: r3.uint32le,
    stretchCoef: r3.floatle,
    heightOffsets: new r3.Array(r3.floatle, r3.uint32le)
  },
  [3 /* Road */]: {
    flags1: r3.uint8,
    dlcGuard: r3.uint8,
    flags2: r3.uint16le,
    roadLook: token642,
    rightLanesVariant: token642,
    leftLanesVariant: token642,
    rightTemplateVariant: token642,
    leftTemplateVariant: token642,
    rightEdgeRight: token642,
    rightEdgeLeft: token642,
    leftEdgeRight: token642,
    leftEdgeLeft: token642,
    rightProfile: token642,
    rightProfileCoef: r3.floatle,
    leftProfile: token642,
    leftProfileCoef: r3.floatle,
    rightTemplateLook: token642,
    leftTemplateLook: token642,
    material: token642,
    railings: new r3.Array(
      new r3.Struct({
        rightRailing: token642,
        rightRailingOffset: r3.int16le,
        leftRailing: token642,
        leftRailingOffset: r3.int16le
      }),
      3
    ),
    rightRoadHeight: r3.int32le,
    leftRoadHeight: r3.int32le,
    startNodeUid: uint64le2,
    endNodeUid: uint64le2,
    length: r3.floatle
  },
  [4 /* Prefab */]: {
    model: token642,
    variant: token642,
    parts: new r3.Array(token642, r3.uint32le),
    nodeUids: new r3.Array(uint64le2, r3.uint32le),
    connectedItemUids: new r3.Array(uint64le2, r3.uint32le),
    ferryLink: uint64le2,
    originIndex: r3.uint16le,
    terrainInfos: new r3.Array(
      new r3.Struct({
        token: token642,
        coef: r3.floatle
      }),
      (parent) => parent.nodeUids.length
    ),
    semaphoreProfile: token642
  },
  [5 /* Model */]: {
    token: token642,
    look: token642,
    variant: token642,
    addParts: new r3.Array(token642, r3.uint32le),
    nodeUid: uint64le2,
    scale: float32,
    material: token642,
    color: r3.uint32le,
    terrainRot: r3.floatle
  },
  [6 /* Company */]: {
    cityName: token642,
    prefabUid: uint64le2,
    overlayName: token642,
    nodeUid: uint64le2,
    nodes: new r3.Array(
      new r3.Struct({
        nodeUid: uint64le2,
        nodeFlag: r3.uint32le
      }),
      r3.uint32le
    )
  },
  [7 /* Service */]: {
    nodeUid: uint64le2,
    prefabUid: uint64le2,
    subItemUids: new r3.Array(uint64le2, r3.uint32le)
  },
  [8 /* CutPlane */]: {
    nodeUids: new r3.Array(uint64le2, r3.uint32le)
  },
  [9 /* Mover */]: {
    tags: new r3.Array(token642, r3.uint32le),
    model: token642,
    look: token642,
    variant: token642,
    speed: r3.floatle,
    endDelay: r3.floatle,
    width: r3.floatle,
    count: r3.uint32le,
    lengths: new r3.Array(r3.floatle, r3.uint32le),
    nodeUids: new r3.Array(uint64le2, r3.uint32le)
  },
  [11 /* NoWeather */]: {
    width: r3.floatle,
    height: r3.floatle,
    fogMaskPresetId: r3.int32le,
    // new in v901.
    unknown: new r3.Reserved(r3.uint8, 16),
    nodeUid: uint64le2
  },
  [12 /* City */]: {
    token: token642,
    width: r3.floatle,
    height: r3.floatle,
    nodeUid: uint64le2
  },
  [13 /* Hinge */]: {
    token: token642,
    look: token642,
    nodeUid: uint64le2,
    minRot: r3.floatle,
    maxRot: r3.floatle
  },
  [18 /* MapOverlay */]: {
    name: token642,
    nodeUid: uint64le2
  },
  [19 /* Ferry */]: {
    ferryPort: token642,
    prefabUid: uint64le2,
    nodeUid: uint64le2,
    unloadOffset: float32
  },
  [22 /* Garage */]: {
    cityName: token642,
    // TODO verify type and nodeUid values and prefab values
    type: r3.uint32le,
    nodeUid: uint64le2,
    prefabUid: uint64le2,
    childItemUids: new r3.Array(uint64le2, r3.uint32le)
  },
  [23 /* CameraPoint */]: {
    tags: new r3.Array(token642, r3.uint32le),
    nodeUid: uint64le2
  },
  [34 /* Trigger */]: {
    tags: new r3.Array(token642, r3.uint32le),
    nodeUids: new r3.Array(uint64le2, r3.uint32le),
    actions: new r3.Array(
      new r3.Struct({
        action: token642,
        hasOverride: r3.int32le,
        overrideValues: new r3.Array(r3.uint32le, "hasOverride"),
        override: new r3.Optional(
          new r3.Struct({
            params: new r3.Array(uint64String2, r3.uint32le),
            targetTags: new r3.Array(uint64le2, r3.uint32le),
            range: r3.floatle,
            type: r3.uint32le
          }),
          (parent) => parent.hasOverride >= 0
        )
      }),
      r3.uint32le
    ),
    radius: new r3.Optional(
      r3.floatle,
      (parent) => parent.nodeUids.length === 1
    )
  },
  [35 /* FuelPump */]: {
    nodeUid: uint64le2,
    prefabUid: uint64le2,
    childItemUids: new r3.Array(uint64le2, r3.uint32le)
  },
  [36 /* Sign */]: {
    token: token642,
    nodeUid: uint64le2,
    look: token642,
    variant: token642,
    boards: new r3.Array(
      new r3.Struct({
        token: token642,
        city1: token642,
        city2: token642
      }),
      r3.uint8
    ),
    overrideTemplate: uint64String2,
    overrides: new r3.Optional(
      new r3.Struct({
        boards: new r3.Array(
          new r3.Struct({
            areaName: token642,
            flags: r3.uint8,
            offsets: new r3.Optional(
              new r3.Struct({
                x: r3.int8,
                y: r3.int8
              }),
              (parent) => (parent.flags & 1) !== 0
            ),
            token: new r3.Optional(
              token642,
              (parent) => (parent.flags & 2) !== 0
            )
          }),
          r3.uint32le
        ),
        items: new r3.Array(
          new r3.Struct({
            id: r3.uint32le,
            areaName: token642,
            attributes: new r3.Array(
              new r3.VersionedStruct(r3.uint16le, {
                header: {
                  index: r3.uint32le
                },
                1: {
                  value: r3.int8
                },
                2: {
                  value: r3.int32le
                },
                3: {
                  value: r3.uint32le
                },
                4: {
                  value: r3.floatle
                },
                5: {
                  value: uint64String2
                },
                6: {
                  value: uint64le2
                }
              }),
              r3.uint32le
            )
          }),
          r3.uint32le
        )
        //debugStruct,
      }),
      (parent) => parent.overrideTemplate != ""
    )
  },
  [37 /* BusStop */]: {
    cityName: token642,
    prefabUid: uint64le2,
    nodeUid: uint64le2
  },
  // Possibly useful for mapping?
  [38 /* TrafficRule */]: {
    tags: new r3.Array(token642, r3.uint32le),
    nodeUids: new r3.Array(uint64le2, r3.uint32le),
    ruleId: token642,
    range: r3.floatle
  },
  [39 /* BezierPatch */]: {
    controlPoints: new r3.Array(float32, 16),
    xTess: r3.uint16le,
    zTess: r3.uint16le,
    nodeUid: uint64le2,
    randomSeed: r3.uint32le,
    vegetation: new r3.Array(
      new r3.Struct({
        token: token642,
        sparsity: r3.uint16le,
        scale: r3.uint8
      }),
      3
    ),
    vegetationSpheres,
    quadInfo
  },
  [41 /* TrajectoryItem */]: {
    nodeUids: new r3.Array(uint64le2, r3.uint32le),
    flags2: uint64le2,
    routeRules: new r3.Array(
      new r3.Struct({
        node: r3.uint32le,
        rule: token642,
        padding: new r3.Reserved(r3.uint32le),
        params: float32
      }),
      r3.uint32le
    ),
    checkpoints: new r3.Array(
      new r3.Struct({
        route: token642,
        checkpoint: token642
      }),
      r3.uint32le
    ),
    tags: new r3.Array(token642, r3.uint32le)
  },
  [42 /* MapArea */]: {
    nodeUids: new r3.Array(uint64le2, r3.uint32le),
    colorIndex: r3.uint32le
  },
  [43 /* FarModel */]: {
    width: r3.floatle,
    height: r3.floatle,
    models: new r3.Array(
      new r3.Struct({
        token: token642,
        scale: float32
      }),
      r3.uint32le
    ),
    childUids: new r3.Array(uint64le2, r3.uint32le),
    nodeUids: new r3.Array(uint64le2, r3.uint32le)
  },
  [44 /* Curve */]: {
    startNodeUid: uint64le2,
    endNodeUid: uint64le2,
    paddingUids: new r3.Array(uint64le2, 2),
    length: r3.floatle,
    subcurveUseMask: r3.uint32le,
    subcurves: new r3.Array(
      new r3.Struct({
        model: token642,
        flags: r3.uint32le,
        randomSeed: r3.uint32le,
        stretchCoef: r3.floatle,
        scale: r3.floatle,
        fixedStep: r3.floatle,
        material: token642,
        color: r3.uint32le,
        terrainRot: r3.floatle,
        firstPart: token642,
        lastPart: token642,
        centerPartVariation: token642,
        modelLook: token642,
        heightOffsets: new r3.Array(r3.floatle, r3.uint32le),
        initialHeightOffset: r3.floatle,
        offsetFromBaseCurveStartX: r3.floatle,
        offsetFromBaseCurveStartY: r3.floatle,
        offsetFromBaseCurveEndX: r3.floatle,
        offsetFromBaseCurveEndY: r3.floatle
      }),
      (parent) => {
        let n3 = parent.subcurveUseMask;
        let count = 0;
        while (n3 !== 0) {
          n3 &= n3 - 1;
          count++;
        }
        return count;
      }
    )
  },
  [45 /* CameraPath */]: {
    tags: new r3.Array(token642, r3.uint32le),
    nodeUids: new r3.Array(uint64le2, r3.uint32le),
    trackPointNodeUids: new r3.Array(uint64le2, r3.uint32le),
    curveControlNodeUids: new r3.Array(uint64le2, r3.uint32le),
    keyFrames: new r3.Array(
      new r3.Struct({
        speedChange: r3.int32le,
        rotationChange: r3.int32le,
        speedCoef: r3.floatle,
        fov: r3.floatle,
        backwardTangentPos: float32,
        forwardTangentPos: float32
      }),
      r3.uint32le
    ),
    speed: r3.floatle
  },
  [46 /* Cutscene */]: {
    tags: new r3.Array(token642, r3.uint32le),
    nodeUid: uint64le2,
    actions: new r3.Array(
      new r3.Struct({
        params: new r3.Array(r3.uint32le, r3.uint32le),
        stringParams: new r3.Array(uint64String2, r3.uint32le),
        targetTags: new r3.Array(uint64le2, r3.uint32le),
        range: r3.floatle,
        actionFlags: r3.uint32le
      }),
      r3.uint32le
    )
  },
  [47 /* Hookup */]: {
    name: uint64String2,
    nodeUid: uint64le2
  },
  [48 /* VisibilityArea */]: {
    nodeUid: uint64le2,
    width: r3.floatle,
    height: r3.floatle,
    childItemUids: new r3.Array(uint64le2, r3.uint32le)
  },
  [49 /* Gate */]: {
    model: token642,
    nodeUids: new r3.Array(uint64le2, r3.uint32le),
    activationPointUnits: new r3.Array(
      new r3.Struct({
        triggerUnitName: uint64String2,
        triggerNodeIndex: r3.int32le
      }),
      2
    )
  }
};
var SectorNode = new r3.Struct({
  uid: uint64le2,
  pos: new r3.Array(r3.int32le, 3),
  rot: float42,
  backwardItemUid: uint64le2,
  forwardItemUid: uint64le2,
  flags: r3.uint32le
});
var SimpleItem = new r3.VersionedStruct(r3.uint32le, SimpleItemStruct);
var ComplexItem = new r3.VersionedStruct(r3.uint32le, {
  ...SimpleItemStruct,
  [40 /* Compound */]: {
    nodeUid: uint64le2,
    childItems: new r3.Array(SimpleItem, r3.uint32le),
    childNodes: new r3.Array(SectorNode, r3.uint32le)
  }
});
var Sector = new r3.Struct({
  version: r3.uint32le,
  gameId: token642,
  padding: new r3.Reserved(r3.uint32le),
  items: new r3.Array(ComplexItem, r3.uint32le),
  nodes: new r3.Array(SectorNode, r3.uint32le),
  visibleAreaChildUids: new r3.Array(uint64le2, r3.uint32le)
});
var versionWarnings = /* @__PURE__ */ new Set();
function parseSector(buffer, ignoreNodeUids) {
  const version = buffer.readUint32LE();
  if (version !== 907) {
    if (!versionWarnings.has(version)) {
      logger.warn("unknown .base file version", version);
      logger.warn("errors may come up, and parse results may be inaccurate.");
      versionWarnings.add(version);
    }
  }
  const str = new r3.DecodeStream(buffer);
  const sector = Sector.decode(str);
  if (str.pos !== buffer.length) {
    logger.error(
      "not enough bytes read; expected / actual",
      buffer.length,
      str.pos
    );
    throw new Error();
  }
  const simples = {
    items: sector.items.map((ri) => {
      switch (ri.version) {
        case 3 /* Road */:
          return toRoad(ri);
        case 4 /* Prefab */:
          return toPrefab(ri);
        case 42 /* MapArea */:
          return toMapArea(ri);
        case 12 /* City */:
          return toCityArea(ri);
        case 18 /* MapOverlay */:
          return toMapOverlay(ri);
        case 19 /* Ferry */:
          return toFerry(ri);
        case 6 /* Company */:
          return toCompany(ri);
        case 46 /* Cutscene */:
          return toCutscene(ri);
        case 34 /* Trigger */:
          return toTrigger(ri);
        case 36 /* Sign */:
          return toSignWithText(ri);
        case 5 /* Model */:
          return toModel(ri);
        case 1 /* Terrain */:
          return toTerrain(ri);
        case 2 /* Building */:
          return toBuilding(ri);
        case 44 /* Curve */:
          return toCurve(ri);
        case 41 /* TrajectoryItem */:
          return toTrajectoryItem(ri);
        default:
          return void 0;
      }
    }).filter((i2) => i2 != null),
    nodes: sector.nodes.reduce((acc, n3) => {
      if (!ignoreNodeUids.has(n3.uid)) {
        acc.push(toNode(n3));
      }
      return acc;
    }, [])
  };
  const moreItems = [];
  const moreNodes = [];
  for (const ri of sector.items) {
    if (ri.version !== 40 /* Compound */) {
      continue;
    }
    for (const ci of ri.childItems) {
      let pushNodes = false;
      if (ci.version === 5 /* Model */) {
        moreItems.push(toModel(ci));
        pushNodes = true;
      } else if (ci.version === 2 /* Building */) {
        const b2 = toBuilding(ci);
        if (b2) {
          moreItems.push(b2);
          pushNodes = true;
        }
      } else if (ci.version === 44 /* Curve */) {
        const c3 = toCurve(ci);
        if (c3) {
          moreItems.push(c3);
          pushNodes = true;
        }
      }
      if (pushNodes) {
        moreNodes.push(...ri.childNodes.map(toNode));
      }
    }
  }
  return {
    items: simples.items.concat(moreItems),
    nodes: simples.nodes.concat(moreNodes)
  };
}
function toBaseItem(rawItem) {
  return {
    uid: rawItem.uid,
    type: rawItem.version,
    x: rawItem.pos[0],
    y: rawItem.pos[2]
  };
}
function toRoad(rawItem) {
  return {
    ...toBaseItem(rawItem),
    dlcGuard: rawItem.dlcGuard,
    //                          ┌─ bit 25 (0-based)
    hidden: (rawItem.flags & 33554432) !== 0 ? true : void 0,
    //                             ┌─ bit 16 (0-based)
    secret: (rawItem.flags & 65536) !== 0 ? true : void 0,
    roadLookToken: rawItem.roadLook,
    startNodeUid: rawItem.startNodeUid,
    endNodeUid: rawItem.endNodeUid,
    length: rawItem.length
  };
}
function toPrefab(rawItem) {
  return {
    ...toBaseItem(rawItem),
    dlcGuard: (rawItem.flags & 65280) >> 8,
    token: rawItem.model,
    //                             ┌─ bit 17 (0-based)
    hidden: (rawItem.flags & 131072) !== 0 ? true : void 0,
    //                                  ┌─ bit 5 (0-based)
    secret: (rawItem.flags & 32) !== 0 ? true : void 0,
    //                                   ┌─ bit 0 (0-based)
    tunnel: (rawItem.flags & 1) !== 0 ? true : void 0,
    //                                             ┌─ bit 1 (0-based)
    customSemaphores: (rawItem.flags & 2) !== 0 ? true : void 0,
    //                                     ┌─ bit 19 (0-based)
    showSemaphores: (rawItem.flags & 524288) !== 0 ? true : void 0,
    ferryLinkUid: rawItem.ferryLink || void 0,
    nodeUids: rawItem.nodeUids,
    originNodeIndex: rawItem.originIndex
  };
}
function toMapArea(rawItem) {
  return {
    ...toBaseItem(rawItem),
    dlcGuard: (rawItem.flags & 65280) >> 8,
    drawOver: (rawItem.flags & 1) !== 0 ? true : void 0,
    //                                  ┌─ bit 4 (0-based)
    secret: (rawItem.flags & 268435472) !== 0 ? true : void 0,
    nodeUids: rawItem.nodeUids,
    color: MapAreaColorUtils.from(rawItem.colorIndex)
  };
}
function toCityArea(rawItem) {
  return {
    ...toBaseItem(rawItem),
    token: rawItem.token,
    hidden: (rawItem.flags & 1) !== 0,
    width: rawItem.width,
    height: rawItem.height
  };
}
function toMapOverlay(rawItem) {
  return {
    ...toBaseItem(rawItem),
    dlcGuard: (rawItem.flags & 65280) >> 8,
    //                             ┌─ bit 16 (0-based)
    secret: (rawItem.flags & 65536) !== 0 ? true : void 0,
    overlayType: MapOverlayTypeUtils.from(rawItem.flags & 15),
    token: rawItem.name,
    nodeUid: rawItem.nodeUid
  };
}
function toFerry(rawItem) {
  return {
    ...toBaseItem(rawItem),
    token: rawItem.ferryPort,
    train: (rawItem.flags & 1) !== 0,
    prefabUid: rawItem.prefabUid,
    nodeUid: rawItem.nodeUid
  };
}
function toCompany(rawItem) {
  return {
    ...toBaseItem(rawItem),
    token: rawItem.overlayName,
    cityToken: rawItem.cityName,
    prefabUid: rawItem.prefabUid,
    nodeUid: rawItem.nodeUid
  };
}
function toCutscene(rawItem) {
  return {
    ...toBaseItem(rawItem),
    dlcGuard: (rawItem.flags & 65280) >> 8,
    //                         ┌─ bit 28 (0-based)
    secret: (rawItem.flags & 268435456) !== 0 ? true : void 0,
    flags: rawItem.flags,
    tags: rawItem.tags,
    nodeUid: rawItem.nodeUid,
    actionStringParams: rawItem.actions.flatMap((action) => action.stringParams)
    // TODO search actions.stringParams "ui_value" for @@ localization string name
  };
}
function toTrigger(rawItem) {
  const actionsMap = new Map(
    rawItem.actions.map((a2) => [a2.action, a2.override ? a2.override.params : []])
  );
  return {
    ...toBaseItem(rawItem),
    dlcGuard: (rawItem.flags & 65280) >> 8,
    //                             ┌─ bit 18 (0-based)
    secret: (rawItem.flags & 262144) !== 0 ? true : void 0,
    actions: [...actionsMap.entries()],
    nodeUids: rawItem.nodeUids
  };
}
function toSignWithText(rawItem) {
  const textItems = [];
  for (const attr of (rawItem.overrides ?? { items: [] }).items.flatMap(
    (item) => item.attributes
  )) {
    if (attr.version === 5) {
      textItems.push(attr.value);
    }
  }
  if (textItems.length === 0) {
    return void 0;
  }
  return {
    ...toBaseItem(rawItem),
    token: rawItem.token,
    nodeUid: rawItem.nodeUid,
    textItems
  };
}
function toBuilding(rawItem) {
  if (rawItem.scheme !== "scheme20") {
    return;
  }
  return {
    ...toBaseItem(rawItem),
    scheme: rawItem.scheme,
    startNodeUid: rawItem.startNodeUid,
    endNodeUid: rawItem.endNodeUid
  };
}
function toCurve(rawItem) {
  assert(rawItem.subcurves.length >= 1, "curve has no subcurves");
  if (rawItem.subcurves.every((sc) => sc.model !== "0i03a") && rawItem.subcurves.every((sc) => sc.model !== "0i03b")) {
    return;
  }
  return {
    ...toBaseItem(rawItem),
    subcurves: rawItem.subcurves.map((sc) => ({
      model: sc.model,
      look: sc.modelLook,
      numBuildings: sc.heightOffsets.length
    })),
    startNodeUid: rawItem.startNodeUid,
    endNodeUid: rawItem.endNodeUid
  };
}
function toTrajectoryItem(rawItem) {
  if (!rawItem.checkpoints.some((c3) => c3.checkpoint === "offer_point")) {
    return;
  }
  return {
    ...toBaseItem(rawItem),
    nodeUids: rawItem.nodeUids,
    checkpoints: rawItem.checkpoints
  };
}
function toModel(rawItem) {
  const [sx, sy, sz] = rawItem.scale;
  return {
    ...toBaseItem(rawItem),
    token: rawItem.token,
    nodeUid: rawItem.nodeUid,
    scale: { x: sx, y: sz, z: sy }
  };
}
function toTerrain(rawItem) {
  return {
    ...toBaseItem(rawItem),
    startNodeUid: rawItem.startNodeUid,
    endNodeUid: rawItem.endNodeUid,
    length: rawItem.length
  };
}
function toNode(rawNode) {
  const [qw, , qy] = rawNode.rot;
  const rotation = normalizeRadians(Math.atan2(-qy, qw) * 2 - Math.PI / 2);
  return {
    uid: rawNode.uid,
    x: rawNode.pos[0] / 256,
    y: rawNode.pos[2] / 256,
    z: rawNode.pos[1] / 256,
    rotation,
    rotationQuat: rawNode.rot,
    forwardItemUid: rawNode.forwardItemUid,
    backwardItemUid: rawNode.backwardItemUid,
    forwardCountryId: (rawNode.flags & 65280) >> 8,
    backwardCountryId: (rawNode.flags & 16711680) >> 16
    // playerVehicleTypeChange: isBitSetU32(rawNode.flags, 4) ? true : undefined,
    // forwardTruck: isBitSetU32(rawNode.flags, 5),
    // forwardBus: isBitSetU32(rawNode.flags, 6),
    // forwardCar: isBitSetU32(rawNode.flags, 7),
    // backwardTruck: isBitSetU32(rawNode.flags, 28),
    // backwardBus: isBitSetU32(rawNode.flags, 29),
    // backwardCar: isBitSetU32(rawNode.flags, 30),
  };
}

// profil.ts
var [gameDir, nStr] = process.argv.slice(2);
var scs = import_fs2.default.readdirSync(gameDir).filter((f3) => f3.endsWith(".scs") && (f3.startsWith("base") || f3.startsWith("dlc") || ["core.scs", "def.scs", "locale.scs", "version.scs"].includes(f3)));
var e2 = new CombinedEntries(scs.map((f3) => new ScsArchive(import_path.default.join(gameDir, f3), f3)));
var root = e2.directories.get("map/europe");
var files = root.files.filter((f3) => f3.endsWith(".base") || f3.endsWith(".aux"));
console.log("secteurs", files.length);
var n2 = Number(nStr);
var types = {};
var nodes = 0;
var seen = /* @__PURE__ */ new Set();
var step = Math.max(1, Math.floor(files.length / n2));
var items = [];
var allNodes = [];
global.gc?.();
var h0 = process.memoryUsage().heapUsed;
for (let i2 = 0; i2 < files.length; i2 += step) {
  const s2 = parseSector(e2.files.get("map/europe/" + files[i2]).read(), seen);
  for (const it of s2.items) {
    types[it.type] = (types[it.type] || 0) + 1;
    items.push(it);
  }
  nodes += s2.nodes.length;
  allNodes.push(...s2.nodes);
}
global.gc?.();
var h1 = process.memoryUsage().heapUsed;
console.log("\xE9chantillon", Math.ceil(files.length / step), "n\u0153uds", nodes, "objets", JSON.stringify(types), "tas Mo", Math.round((h1 - h0) / 1e6));
for (const t2 of Object.keys(types)) {
  const keep = items.filter((x2) => String(x2.type) !== t2);
  items.length = 0;
  items.push(...keep);
  global.gc?.();
  console.log("sans type", t2, "tas Mo", Math.round((process.memoryUsage().heapUsed - h0) / 1e6));
}
allNodes.length = 0;
global.gc?.();
console.log("sans n\u0153uds", Math.round((process.memoryUsage().heapUsed - h0) / 1e6));
