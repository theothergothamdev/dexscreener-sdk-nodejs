const pJe = Object.defineProperty;
const mJe = (t, e, r) => (e in t ? pJe(t, e, { enumerable: !0, configurable: !0, writable: !0, value: r }) : (t[e] = r));
const St = (t, e, r) => mJe(t, typeof e != "symbol" ? e + "" : e, r);

function iy(t) {
  return Array.isArray(t);
}

function si(t, e) {
  if (((this.buf = t), (this.pos = e | 0), this.pos < 0)) throw new Error("negative offset");
}
si.prototype.isValid = function () {
  return this.pos <= this.buf.length;
};
si.prototype._invalidate = function () {
  this.pos = this.buf.length + 1;
};
si.prototype.readBoolean = function () {
  return !!this.buf[this.pos++];
};
si.prototype.skipBoolean = function () {
  this.pos++;
};
si.prototype.writeBoolean = function (t) {
  this.buf[this.pos++] = !!t;
};
si.prototype.readInt = si.prototype.readLong = function () {
  var t = 0,
    e = 0,
    r = this.buf,
    n,
    i,
    a,
    s;
  do (n = r[this.pos++]), (i = n & 128), (t |= (n & 127) << e), (e += 7);
  while (i && e < 28);
  if (i) {
    (a = t), (s = 268435456);
    do (n = r[this.pos++]), (a += (n & 127) * s), (s *= 128);
    while (n & 128);
    return (a % 2 ? -(a + 1) : a) / 2;
  }
  return (t >> 1) ^ -(t & 1);
};
si.prototype.skipInt = si.prototype.skipLong = function () {
  for (var t = this.buf; t[this.pos++] & 128; );
};
si.prototype.writeInt = si.prototype.writeLong = function (t) {
  var e = this.buf,
    r,
    n;
  if (t >= -1073741824 && t < 1073741824) {
    n = t >= 0 ? t << 1 : (~t << 1) | 1;
    do (e[this.pos] = n & 127), (n >>= 7);
    while (n && (e[this.pos++] |= 128));
  } else {
    r = t >= 0 ? t * 2 : -t * 2 - 1;
    do (e[this.pos] = r & 127), (r /= 128);
    while (r >= 1 && (e[this.pos++] |= 128));
  }
  this.pos++;
};
si.prototype.readFloat = function () {
  var t = this.buf,
    e = this.pos;
  return (this.pos += 4), this.pos > t.length ? 0 : this.buf.readFloatLE(e);
};
si.prototype.skipFloat = function () {
  this.pos += 4;
};
si.prototype.writeFloat = function (t) {
  var e = this.buf,
    r = this.pos;
  if (((this.pos += 4), !(this.pos > e.length))) return this.buf.writeFloatLE(t, r);
};
si.prototype.readDouble = function () {
  var t = this.buf,
    e = this.pos;
  return (this.pos += 8), this.pos > t.length ? 0 : this.buf.readDoubleLE(e);
};
si.prototype.skipDouble = function () {
  this.pos += 8;
};
si.prototype.writeDouble = function (t) {
  var e = this.buf,
    r = this.pos;
  if (((this.pos += 8), !(this.pos > e.length))) return this.buf.writeDoubleLE(t, r);
};
si.prototype.readFixed = function (t) {
  var e = this.pos;
  if (((this.pos += t), !(this.pos > this.buf.length))) {
    var r = Obt.alloc(t);
    return this.buf.copy(r, 0, e, e + t), r;
  }
};
si.prototype.skipFixed = function (t) {
  this.pos += t;
};
si.prototype.writeFixed = function (t, e) {
  e = e || t.length;
  var r = this.pos;
  (this.pos += e), !(this.pos > this.buf.length) && t.copy(this.buf, r, 0, e);
};
si.prototype.readBytes = function () {
  var t = this.readLong();
  if (t < 0) {
    this._invalidate();
    return;
  }
  return this.readFixed(t);
};
si.prototype.skipBytes = function () {
  var t = this.readLong();
  if (t < 0) {
    this._invalidate();
    return;
  }
  this.pos += t;
};
si.prototype.writeBytes = function (t) {
  var e = t.length;
  this.writeLong(e), this.writeFixed(t, e);
};

const fm = Buffer;

typeof fm.prototype.utf8Slice == "function"
  ? (si.prototype.readString = function () {
      var t = this.readLong();
      if (t < 0) return this._invalidate(), "";
      var e = this.pos,
        r = this.buf;
      if (((this.pos += t), !(this.pos > r.length))) return this.buf.utf8Slice(e, e + t);
    })
  : (si.prototype.readString = function () {
      var t = this.readLong();
      if (t < 0) return this._invalidate(), "";
      var e = this.pos,
        r = this.buf;
      if (((this.pos += t), !(this.pos > r.length))) return this.buf.slice(e, e + t).toString();
    });

si.prototype.skipString = function () {
  var t = this.readLong();
  if (t < 0) {
    this._invalidate();
    return;
  }
  this.pos += t;
};

si.prototype.writeString = function (t) {
  var e = fm.byteLength(t),
    r = this.buf;
  this.writeLong(e);
  var n = this.pos;
  if (((this.pos += e), !(this.pos > r.length)))
    if (e > 64 && typeof fm.prototype.utf8Write == "function") r.utf8Write(t, n, e);
    else {
      var i, a, s, o;
      for (i = 0, a = e; i < a; i++)
        (s = t.charCodeAt(i)),
          s < 128
            ? (r[n++] = s)
            : s < 2048
            ? ((r[n++] = (s >> 6) | 192), (r[n++] = (s & 63) | 128))
            : (s & 64512) === 55296 && ((o = t.charCodeAt(i + 1)) & 64512) === 56320
            ? ((s = 65536 + ((s & 1023) << 10) + (o & 1023)),
              i++,
              (r[n++] = (s >> 18) | 240),
              (r[n++] = ((s >> 12) & 63) | 128),
              (r[n++] = ((s >> 6) & 63) | 128),
              (r[n++] = (s & 63) | 128))
            : ((r[n++] = (s >> 12) | 224), (r[n++] = ((s >> 6) & 63) | 128), (r[n++] = (s & 63) | 128));
    }
};

typeof fm.prototype.latin1Write == "function"
  ? (si.prototype.writeBinary = function (t, e) {
      var r = this.pos;
      (this.pos += e), !(this.pos > this.buf.length) && this.buf.latin1Write(t, r, e);
    })
  : typeof fm.prototype.binaryWrite == "function"
  ? (si.prototype.writeBinary = function (t, e) {
      var r = this.pos;
      (this.pos += e), !(this.pos > this.buf.length) && this.buf.binaryWrite(t, r, e);
    })
  : (si.prototype.writeBinary = function (t, e) {
      var r = this.pos;
      (this.pos += e), !(this.pos > this.buf.length) && this.buf.write(t, r, e, "binary");
    });
si.prototype.matchBoolean = function (t) {
  return this.buf[this.pos++] - t.buf[t.pos++];
};
si.prototype.matchInt = si.prototype.matchLong = function (t) {
  var e = this.readLong(),
    r = t.readLong();
  return e === r ? 0 : e < r ? -1 : 1;
};
si.prototype.matchFloat = function (t) {
  var e = this.readFloat(),
    r = t.readFloat();
  return e === r ? 0 : e < r ? -1 : 1;
};
si.prototype.matchDouble = function (t) {
  var e = this.readDouble(),
    r = t.readDouble();
  return e === r ? 0 : e < r ? -1 : 1;
};
si.prototype.matchFixed = function (t, e) {
  return this.readFixed(e).compare(t.readFixed(e));
};
si.prototype.matchBytes = si.prototype.matchString = function (t) {
  var e = this.readLong(),
    r = this.pos;
  this.pos += e;
  var n = t.readLong(),
    i = t.pos;
  t.pos += n;
  var a = this.buf.slice(r, this.pos),
    s = t.buf.slice(i, t.pos);
  return a.compare(s);
};
si.prototype.unpackLongBytes = function () {
  var t = MP(8),
    e = 0,
    r = 0,
    n = 6,
    i = this.buf,
    a,
    s;
  for (a = i[this.pos++], s = a & 1, t.fill(0), e |= (a & 127) >> 1; a & 128; )
    (a = i[this.pos++]), (e |= (a & 127) << n), (n += 7), n >= 8 && ((n -= 8), (t[r++] = e), (e >>= 8));
  return (t[r] = e), s && bre(t, 8), t;
};
si.prototype.packLongBytes = function (t) {
  var e = (t[7] & 128) >> 7,
    r = this.buf,
    n = 1,
    i = 0,
    a = 3,
    s;
  e ? (bre(t, 8), (s = 1)) : (s = 0);
  for (var o = [t.readUIntLE(0, 3), t.readUIntLE(3, 3), t.readUIntLE(6, 2)]; a && !o[--a]; );
  for (; i < a; ) for (s |= o[i++] << n, n += 24; n > 7; ) (r[this.pos++] = (s & 127) | 128), (s >>= 7), (n -= 7);
  s |= o[a] << n;
  do (r[this.pos] = s & 127), (s >>= 7);
  while (s && (r[this.pos++] |= 128));
  this.pos++, e && bre(t, 8);
};

function bre(t, e) {
  for (; e--; ) t[e] = ~t[e];
}

function MP(t) {
  return typeof fm.alloc == "function" ? fm.alloc(t) : new fm(t);
}

var $$ = {
  newBuffer: MP,
  Tap: si,
};

function Xbt(t, e) {
  return t instanceof kd
    ? t
    : new kd({
        issues: {
          type: "error",
          cause: t,
          path: e,
        },
      });
}

function Sce() {
  return new ewt();
}

const swt = (t) => t instanceof ORe;
export function Fh(t) {
  const e = [];
  for (const r of t) swt(r) ? e.push(...r.schemas) : e.push(r);
  return new ORe(e);
}

function hwt(t) {
  return Fh([Sce(), t]);
}

function pwt(t) {
  return Fh([MRe(), t]);
}

let $f = class {
  constructor() {
    St(this, "_decoded");
    St(this, "_encoded");
  }
  
  encode(e) {
    (fA.pos = 0), this.write(fA, e, []);
    const r = $$.newBuffer(fA.pos);
    return fA.isValid() ? fA.buf.copy(r, 0, 0, fA.pos) : this.write(new $$.Tap(r), e, []), r;
  }

  decode(e) {
    const r = new $$.Tap(e);
    const n = this.read(r, []);

    if (r.pos !== e.length) throw new kd({ issues: { type: "mismatch", message: "Buffer and tap lengths mismatch" } });
    return n;
  }
  safeDecode(e) {
    try {
      return { ok: !0, value: this.decode(e) };
    } catch (r) {
      return { ok: !1, error: _o(r) };
    }
  }
  transform(e, r, n) {
    return new Zbt(this, e, r, n);
  }
  optional() {
    return hwt(this);
  }
  nullable() {
    return pwt(this);
  }
  or(e) {
    return Fh([this, e]);
  }
  extend(e) {
    return new Wk({ ...this.fields, ...e });
  }
  merge(e) {
    return new Wk({ ...this.fields, ...e.fields });
  }
  pick(e) {
    const r = {};
    for (const [n, i] of Object.entries(this.fields)) e[n] === !0 && (r[n] = i);
    return new Wk(r);
  }
  omit(e) {
    const r = {};
    for (const [n, i] of Object.entries(this.fields)) e[n] !== !0 && (r[n] = i);
    return new Wk(r);
  }
};

class Zbt extends $f {
  constructor(e, r, n, i) {
    super(), (this.source = e), (this.deserialize = r), (this.serialize = n), (this.is = i);
  }

  read(e, r) {
    try {
      return this.deserialize(this.source.read(e, r), r);
    } catch (n) {
      throw Xbt(n, r);
    }
  }
  write(e, r, n) {
    this.source.write(e, this.serialize(r, n), n);
  }
}

class Jbt extends $f {
  read() {
    return null;
  }
  write() {}
  is(e) {
    return e === null;
  }
}

const MRe = () => new Jbt();
let ewt = class extends $f {
  read() {}
  write() {}
  is(e) {
    return e === void 0;
  }
};

let Wk = class extends $f {
  constructor(r) {
    super();
    St(this, "keys");
    (this.fields = r), (this.keys = Object.keys(r));
  }
  write(r, n, i) {
    var a;
    for (const s of this.keys) {
      const o = n;
      (a = this.fields[s]) == null || a.write(r, o[s], [...i, s]);
    }
  }
  read(r, n) {
    const i = {};
    for (const a of this.keys) {
      const s = this.fields[a];
      s !== void 0 && (i[a] = s.read(r, [...n, a]));
    }
    return i;
  }
  is(r) {
    var n;
    if (ay(r)) {
      for (const i of this.keys) if (!((n = this.fields[i]) != null && n.is(r[i]))) return !1;
      return !0;
    }
    return !1;
  }
};

export class ORe extends $f {
  constructor(e) {
    super(), (this.schemas = e);
  }
  is(e) {
    for (const r of this.schemas) if (r.is(e)) return !0;
    return !1;
  }
  read(e, r) {
    console.log('e', e);
    console.log('r', r);

    const n = e.readLong();
    console.log('n', n);
    const i = this.schemas[n];

    // console.log('debuggggggggggggggggggggggg');
    // console.log('schemas', this.schemas);
    // console.log('debuggggggggggggggggggggggg');
    console.log('i', i);

    if (!i)
      throw new kd({
        issues: {
          type: "error",
          cause: `Cannot read union "${this.toString()}" - schema with index "${n}" not found`,
          path: r,
        },
      });
    const a = i.read(e, r);
    if (this.is(a)) return a;
    throw new kd({
      issues: {
        type: "error",
        cause: `Cannot read union "${this.toString()}" for value "${a}"`,
        path: r,
      },
    });
  }
  write(e, r, n) {
    var a;
    const i = this.schemas.findIndex((s) => s.is(r));
    if (i === -1)
      throw new kd({
        issues: {
          type: "error",
          cause: `Cannot write union "${this.toString()}" for value "${r}"`,
          path: n,
        },
      });
    e.writeLong(i), (a = this.schemas[i]) == null || a.write(e, r, n);
  }
}

let awt = class extends $f {
  constructor(e) {
    super(), (this.values = e);
  }
  read(e, r) {
    const n = e.readString();
    if (this.is(n)) return n;
    throw new kd({ issues: { type: "enum", expected: this.values, received: n, path: r } });
  }
  write(e, r) {
    e.writeString(r);
  }
  is(e) {
    return this.values.includes(e);
  }
};

class fwt extends $f {
  write(e, r) {
    e.writeLong(r.getTime());
  }
  read(e) {
    return new Date(e.readLong());
  }
  is(e) {
    return e instanceof Date;
  }
}

class kd extends Error {
  constructor(r) {
    super();
    St(this, "issues");
    (this.name = "AVSCError"),
      Object.setPrototypeOf(this, kd.prototype),
      (this.issues = iy(r.issues) ? r.issues : [r.issues]);
  }
}

let uwt = class LRe extends $f {
  constructor(e, r) {
    super(), (this.item = e), (this.cardinality = r);
  }
  write(e, r, n) {
    e.writeLong(r.length), r.forEach((i, a) => this.item.write(e, i, [...n, `${a}`]));
  }
  read(e, r) {
    const n = [],
      i = e.readLong();
    for (let a = 0; a < i; a++) n.push(this.item.read(e, [...r, `${a}`]));
    if (this.cardinality === "single") return n;
    if (Xu(n)) return n;
    throw new kd({
      issues: { type: "error", cause: `Cannot read array with cardinality "${this.cardinality}"`, path: r },
    });
  }
  is(e) {
    if (!Array.isArray(e)) return !1;
    for (let r = 0; r < e.length; r++) if (!this.item.is(e[r])) return !1;
    return this.cardinality === "single" ? !0 : !!Xu(e);
  }
  nonempty() {
    return this.cardinality === "at-least-one" ? this : new LRe(this.item, "at-least-one");
  }
};

let twt = class extends $f {
  read(e) {
    return e.readDouble();
  }
  write(e, r) {
    e.writeDouble(r);
  }
  is(e) {
    return typeof e == "number";
  }
};

let nwt = class Sre extends $f {
  constructor(r) {
    super();
    St(this, "minLengthValue");
    St(this, "maxLengthValue");
    (this.minLengthValue = r == null ? void 0 : r.minLength), (this.maxLengthValue = r == null ? void 0 : r.maxLength);
  }
  read(r, n) {
    const i = r.readString();
    return this.assert(i, n), i;
  }
  write(r, n, i) {
    this.assert(n, i), r.writeString(n);
  }
  is(r) {
    try {
      return this.assert(r, []), !0;
    } catch {
      return !1;
    }
  }
  minLength(r) {
    return new Sre({ minLength: r });
  }
  maxLength(r) {
    return new Sre({ maxLength: r });
  }
  assert(r, n) {
    if (typeof r != "string") throw new kd({ issues: { type: "string", received: r, path: n } });
    const i = [];
    if (
      (this.minLengthValue !== void 0 &&
        r.length < this.minLengthValue &&
        i.push({
          type: "validation",
          received: r,
          message: `String length is less than ${this.minLengthValue}`,
          path: n,
        }),
      this.maxLengthValue !== void 0 &&
        r.length > this.maxLengthValue &&
        i.push({
          type: "validation",
          received: r,
          message: `String length is greater than ${this.maxLengthValue}`,
          path: n,
        }),
      Xu(i))
    )
      throw new kd({ issues: i });
  }
};

const Et = () => new twt();
const Kn = (t) => new uwt(t, "single");
const ac = () => new fwt();
const U1 = (t) => new awt(t);
const He = () => new nwt();
const jT = () =>
  He().transform(
    (t) => new URL(t),
    (t) => t.toString(),
    (t) => t instanceof URL
  );

const jt = (t) => new Wk(t);

const nue = U1(["pending", "running", "ended"]);
const tDe = U1(["telegram", "twitter", "discord", "facebook", "tiktok"]);
const iDe = jt({ date: ac(), count: Et() });
const sDe = jt({ date: ac(), count: Et() });
const XM = jt({ label: He(), url: He() });
const QM = jt({ type: tDe, url: jT() });

let iwt = class extends $f {
  constructor(e) {
    super(), (this.value = e);
  }
  read(e) {
    let r;
    switch (typeof this.value) {
      case "string": {
        r = e.readString();
        break;
      }
      case "number": {
        r = e.readDouble();
        break;
      }
      case "boolean": {
        r = e.readBoolean();
        break;
      }
    }
    if (this.is(r)) return r;
    throw new kd({ issues: { type: "literal", expected: this.value, received: r, path: [] } });
  }
  write(e, r) {
    switch (typeof r) {
      case "string":
        return e.writeString(r);
      case "number":
        return e.writeDouble(r);
      case "boolean":
        return e.writeBoolean(r);
    }
  }
  is(e) {
    return e === this.value;
  }
};

const Bi = (t) => new iwt(t);
export const uDe = jt({
  id: He(),
  chainId: He(),
  tokenAddress: He(),
  title: He(),
  image: jT(),
  status: nue,
  startDate: ac(),
  endDate: ac().optional(),
  visits: Kn(sDe).optional(),
  totalVisits: Et(),
  impressions: Kn(iDe).optional(),
  usedImpressions: Et(),
  impressionURL: jT(),
});

export const iue = uDe.extend({
  kind: Bi("pair-details"),
  description: He(),
  websites: Kn(XM).optional(),
  socials: Kn(QM).optional(),
  acquiredImpressions: Et(),
});

export const fDe = uDe
  .omit({
    endDate: !0,
  })
  .extend({
    kind: Bi("trending-bar"),
    endDate: ac(),
  });
