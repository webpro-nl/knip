var Mt = (t =>
  typeof require < 'u'
    ? require
    : typeof Proxy < 'u'
      ? new Proxy(t, { get: (e, r) => (typeof require < 'u' ? require : e)[r] })
      : t)(function (t) {
  if (typeof require < 'u') return require.apply(this, arguments);
  throw Error('Dynamic require of "' + t + '" is not supported');
});
var x = (t, e) => () => (e || t((e = { exports: {} }).exports, e), e.exports);
var Mr = x((Jl, $r) => {
  $r.exports = function (t) {
    return function () {
      return t.apply(null, arguments);
    };
  };
});
var Wr = x((Zl, Vr) => {
  Vr.exports = function (t) {
    return function (e) {
      return t.apply(null, arguments);
    };
  };
});
var Gr = x((tp, Ur) => {
  Ur.exports = function (t) {
    return function (e, r) {
      return t.apply(null, arguments);
    };
  };
});
var zr = x((ep, Kr) => {
  Kr.exports = function (t) {
    return function (e, r, s) {
      return t.apply(null, arguments);
    };
  };
});
var Yr = x((rp, Xr) => {
  Xr.exports = function (t) {
    return function (e, r, s, i) {
      return t.apply(null, arguments);
    };
  };
});
var Hr = x((sp, Qr) => {
  Qr.exports = function (t) {
    return function (e, r, s, i, n) {
      return t.apply(null, arguments);
    };
  };
});
var Zr = x((ip, Jr) => {
  var Ka = [Mr(), Wr(), Gr(), zr(), Yr(), Hr()];
  Jr.exports = function (t, e) {
    return e && e <= 5 ? Ka[e](t) : t;
  };
});
var J = x((oe, ts) => {
  'use strict';
  Object.defineProperty(oe, '__esModule', { value: !0 });
  oe.default = Ha;
  function za(t) {
    return t && t.__esModule ? t : { default: t };
  }
  var Xa = Zr(),
    Ya = za(Xa),
    Qa = function (e, r) {
      return function () {
        return e(r.apply(void 0, arguments));
      };
    };
  function Ha() {
    for (var t = arguments.length, e = Array(t), r = 0; r < t; r++) e[r] = arguments[r];
    var s = e.filter(function (o) {
        return typeof o == 'function';
      }),
      i = s.length - 1,
      n = 0;
    if (s.length <= 0) throw new Error('No funcs passed');
    return i >= 0 && s[i] && (n = s[i].length), (0, Ya.default)(s.reduce(Qa), n);
  }
  ts.exports = oe.default;
});
var rs = x((np, es) => {
  'use strict';
  var Ja = J(),
    Za = (t, e) => ({
      lex() {
        let s = this.tokenizer.next().value,
          i = s.originalType,
          n = s.value;
        return (
          (this.yytext = { text: n }),
          s.expansion && (this.yytext.expansion = s.expansion),
          s.originalText && (this.yytext.originalText = s.originalText),
          s.type && (this.yytext.type = s.type),
          s.maybeSimpleCommandName && (this.yytext.maybeSimpleCommandName = s.maybeSimpleCommandName),
          s.joined && (this.yytext.joined = s.joined),
          s.fieldIdx !== void 0 && (this.yytext.fieldIdx = s.fieldIdx),
          e.insertLOC && s.loc && (this.yytext.loc = s.loc),
          s.loc && (this.yylineno = s.loc.start.row - 1),
          i
        );
      },
      setInput(r) {
        let s = t.tokenizer(e),
          i = [s],
          n = [s].concat(
            t.lexerPhases.map(u => {
              let c = u(e, t, i);
              return (i = i.concat(c)), c;
            })
          ),
          o = Ja.apply(null, n.reverse());
        this.tokenizer = o(r);
      },
    });
  es.exports = Za;
});
var is = x((ap, ss) => {
  'use strict';
  var to = t => () =>
    function* (e) {
      for (let r of e) r || console.log(`In ${t} token null.`), console.log(t, '<<<', r, '>>>'), yield r;
    };
  ss.exports = to;
});
var ue = x((op, ns) => {
  var eo = Object.prototype.hasOwnProperty;
  ns.exports = function (e, r) {
    return eo.call(e, r);
  };
});
var Be = x((up, as) => {
  'use strict';
  as.exports = function (t, e) {
    for (var r = {}, s = Object.keys(t), i = Array.isArray(e), n = 0; n < s.length; n++) {
      var o = s[n],
        u = t[o];
      (i ? e.indexOf(o) !== -1 : e(o, u, t)) && (r[o] = u);
    }
    return r;
  };
});
var _e = x((cp, os) => {
  'use strict';
  var ro = {
    '&': 'AND',
    '|': 'PIPE',
    '(': 'OPEN_PAREN',
    ')': 'CLOSE_PAREN',
    '>': 'GREAT',
    '<': 'LESS',
    '&&': 'AND_IF',
    '||': 'OR_IF',
    ';;': 'DSEMI',
    '<<': 'DLESS',
    '>>': 'DGREAT',
    '<&': 'LESSAND',
    '>&': 'GREATAND',
    '<>': 'LESSGREAT',
    '<<-': 'DLESSDASH',
    '>|': 'CLOBBER',
    ';': 'SEMICOLON',
  };
  os.exports = ro;
});
var I = x(K => {
  'use strict';
  var qe = ue(),
    so = Be(),
    je = _e(),
    Vt = class t {
      constructor(e) {
        let r = so(e, (s, i) => i !== void 0);
        Object.assign(this, r), this._ === void 0 && (this._ = {});
      }
      is(e) {
        return this.type === e;
      }
      appendTo(e) {
        return new t(Object.assign({}, this, { value: this.value + e }));
      }
      changeTokenType(e, r) {
        return new t({ type: e, value: r, loc: this.loc, _: this._, expansion: this.expansion });
      }
      setValue(e) {
        return new t(Object.assign({}, this, { value: e }));
      }
      alterValue(e) {
        return new t(Object.assign({}, this, { value: e, originalText: this.originalText || this.value }));
      }
      addExpansions() {
        return new t(Object.assign({}, this, { expansion: [] }));
      }
      setExpansions(e) {
        return new t(Object.assign({}, this, { expansion: e }));
      }
    };
  K.token = t => new Vt(t);
  function Dt(t, e, r, s) {
    let i = new Vt({ type: t, value: e, loc: r });
    return s && s.length && (i.expansion = s), i;
  }
  K.mkToken = Dt;
  K.mkFieldSplitToken = function (e, r, s) {
    return new Vt({
      type: e.type,
      value: r,
      joined: e.value,
      fieldIdx: s,
      loc: e.loc,
      expansion: e.expansion,
      originalText: e.originalText,
    });
  };
  K.appendTo = (t, e) => t.appendTo(e);
  K.changeTokenType = (t, e, r) => t.changeTokenType(e, r);
  K.setValue = (t, e) => t.setValue(e);
  K.alterValue = (t, e) => t.alterValue(e);
  K.addExpansions = t => t.addExpansions();
  K.setExpansions = (t, e) => t.setExpansions(e);
  K.tokenOrEmpty = function (e) {
    if (
      e.current !== '' &&
      e.current !==
        `
`
    ) {
      let r = (e.expansion || []).map(i =>
        Object.assign({}, i, {
          loc: { start: i.loc.start.char - e.loc.start.char, end: i.loc.end.char - e.loc.start.char },
        })
      );
      return [
        Dt('TOKEN', e.current, { start: Object.assign({}, e.loc.start), end: Object.assign({}, e.loc.previous) }, r),
      ];
    }
    return [];
  };
  K.operatorTokens = function (e) {
    return [
      Dt(je[e.current], e.current, { start: Object.assign({}, e.loc.start), end: Object.assign({}, e.loc.previous) }),
    ];
  };
  K.newLine = function () {
    return Dt(
      'NEWLINE',
      `
`
    );
  };
  K.continueToken = function (e) {
    return Dt('CONTINUE', e);
  };
  K.eof = function () {
    return Dt('EOF', '');
  };
  K.isPartOfOperator = function (e) {
    return Object.keys(je).some(r => r.slice(0, e.length) === e);
  };
  K.isOperator = function (e) {
    return qe(je, e);
  };
  K.applyTokenizerVisitor = t => (e, r, s) => {
    if (qe(t, e.type)) {
      let i = t[e.type];
      return i(e, s);
    }
    if (qe(t, 'defaultMethod')) {
      let i = t.defaultMethod;
      return i(e, s);
    }
    return e;
  };
});
var Wt = x((lp, us) => {
  'use strict';
  us.exports = function (e) {
    return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(e);
  };
});
var le = x((pp, Ts) => {
  var io = 'Expected a function',
    cs = '__lodash_placeholder__',
    Tt = 1,
    he = 2,
    no = 4,
    St = 8,
    Ut = 16,
    Lt = 32,
    Gt = 64,
    xs = 128,
    ao = 256,
    ys = 512,
    hs = 1 / 0,
    oo = 9007199254740991,
    uo = 17976931348623157e292,
    ls = NaN,
    co = [
      ['ary', xs],
      ['bind', Tt],
      ['bindKey', he],
      ['curry', St],
      ['curryRight', Ut],
      ['flip', ys],
      ['partial', Lt],
      ['partialRight', Gt],
      ['rearg', ao],
    ],
    ho = '[object Function]',
    lo = '[object GeneratorFunction]',
    po = '[object Symbol]',
    fo = /[\\^$.*+?()[\]{}|]/g,
    mo = /^\s+|\s+$/g,
    xo = /\{(?:\n\/\* \[wrapped with .+\] \*\/)?\n?/,
    yo = /\{\n\/\* \[wrapped with (.+)\] \*/,
    vo = /,? & /,
    Eo = /^[-+]0x[0-9a-f]+$/i,
    go = /^0b[01]+$/i,
    Ao = /^\[object .+?Constructor\]$/,
    Co = /^0o[0-7]+$/i,
    bo = /^(?:0|[1-9]\d*)$/,
    wo = parseInt,
    So = typeof global == 'object' && global && global.Object === Object && global,
    To = typeof self == 'object' && self && self.Object === Object && self,
    zt = So || To || Function('return this')();
  function vs(t, e, r) {
    switch (r.length) {
      case 0:
        return t.call(e);
      case 1:
        return t.call(e, r[0]);
      case 2:
        return t.call(e, r[0], r[1]);
      case 3:
        return t.call(e, r[0], r[1], r[2]);
    }
    return t.apply(e, r);
  }
  function Po(t, e) {
    for (var r = -1, s = t ? t.length : 0; ++r < s && e(t[r], r, t) !== !1; );
    return t;
  }
  function No(t, e) {
    var r = t ? t.length : 0;
    return !!r && ko(t, e, 0) > -1;
  }
  function Fo(t, e, r, s) {
    for (var i = t.length, n = r + (s ? 1 : -1); s ? n-- : ++n < i; ) if (e(t[n], n, t)) return n;
    return -1;
  }
  function ko(t, e, r) {
    if (e !== e) return Fo(t, Oo, r);
    for (var s = r - 1, i = t.length; ++s < i; ) if (t[s] === e) return s;
    return -1;
  }
  function Oo(t) {
    return t !== t;
  }
  function Do(t, e) {
    for (var r = t.length, s = 0; r--; ) t[r] === e && s++;
    return s;
  }
  function Lo(t, e) {
    return t?.[e];
  }
  function Ro(t) {
    var e = !1;
    if (t != null && typeof t.toString != 'function')
      try {
        e = !!(t + '');
      } catch {}
    return e;
  }
  function Es(t, e) {
    for (var r = -1, s = t.length, i = 0, n = []; ++r < s; ) {
      var o = t[r];
      (o === e || o === cs) && ((t[r] = cs), (n[i++] = r));
    }
    return n;
  }
  var Io = Function.prototype,
    gs = Object.prototype,
    $e = zt['__core-js_shared__'],
    ps = (function () {
      var t = /[^.]+$/.exec(($e && $e.keys && $e.keys.IE_PROTO) || '');
      return t ? 'Symbol(src)_1.' + t : '';
    })(),
    As = Io.toString,
    Bo = gs.hasOwnProperty,
    Cs = gs.toString,
    _o = RegExp(
      '^' +
        As.call(Bo)
          .replace(fo, '\\$&')
          .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') +
        '$'
    ),
    qo = Object.create,
    ce = Math.max,
    jo = Math.min,
    fs = (function () {
      var t = ds(Object, 'defineProperty'),
        e = ds.name;
      return e && e.length > 2 ? t : void 0;
    })();
  function $o(t) {
    return Rt(t) ? qo(t) : {};
  }
  function Mo(t) {
    if (!Rt(t) || Jo(t)) return !1;
    var e = ru(t) || Ro(t) ? _o : Ao;
    return e.test(tu(t));
  }
  function Vo(t, e, r, s) {
    for (
      var i = -1, n = t.length, o = r.length, u = -1, c = e.length, h = ce(n - o, 0), p = Array(c + h), m = !s;
      ++u < c;
    )
      p[u] = e[u];
    for (; ++i < o; ) (m || i < n) && (p[r[i]] = t[i]);
    for (; h--; ) p[u++] = t[i++];
    return p;
  }
  function Wo(t, e, r, s) {
    for (
      var i = -1, n = t.length, o = -1, u = r.length, c = -1, h = e.length, p = ce(n - u, 0), m = Array(p + h), d = !s;
      ++i < p;
    )
      m[i] = t[i];
    for (var y = i; ++c < h; ) m[y + c] = e[c];
    for (; ++o < u; ) (d || i < n) && (m[y + r[o]] = t[i++]);
    return m;
  }
  function Uo(t, e) {
    var r = -1,
      s = t.length;
    for (e || (e = Array(s)); ++r < s; ) e[r] = t[r];
    return e;
  }
  function Go(t, e, r) {
    var s = e & Tt,
      i = Kt(t);
    function n() {
      var o = this && this !== zt && this instanceof n ? i : t;
      return o.apply(s ? r : this, arguments);
    }
    return n;
  }
  function Kt(t) {
    return function () {
      var e = arguments;
      switch (e.length) {
        case 0:
          return new t();
        case 1:
          return new t(e[0]);
        case 2:
          return new t(e[0], e[1]);
        case 3:
          return new t(e[0], e[1], e[2]);
        case 4:
          return new t(e[0], e[1], e[2], e[3]);
        case 5:
          return new t(e[0], e[1], e[2], e[3], e[4]);
        case 6:
          return new t(e[0], e[1], e[2], e[3], e[4], e[5]);
        case 7:
          return new t(e[0], e[1], e[2], e[3], e[4], e[5], e[6]);
      }
      var r = $o(t.prototype),
        s = t.apply(r, e);
      return Rt(s) ? s : r;
    };
  }
  function Ko(t, e, r) {
    var s = Kt(t);
    function i() {
      for (var n = arguments.length, o = Array(n), u = n, c = ws(i); u--; ) o[u] = arguments[u];
      var h = n < 3 && o[0] !== c && o[n - 1] !== c ? [] : Es(o, c);
      if (((n -= h.length), n < r)) return bs(t, e, Me, i.placeholder, void 0, o, h, void 0, void 0, r - n);
      var p = this && this !== zt && this instanceof i ? s : t;
      return vs(p, this, o);
    }
    return i;
  }
  function Me(t, e, r, s, i, n, o, u, c, h) {
    var p = e & xs,
      m = e & Tt,
      d = e & he,
      y = e & (St | Ut),
      E = e & ys,
      v = d ? void 0 : Kt(t);
    function N() {
      for (var T = arguments.length, A = Array(T), C = T; C--; ) A[C] = arguments[C];
      if (y)
        var S = ws(N),
          g = Do(A, S);
      if ((s && (A = Vo(A, s, i, y)), n && (A = Wo(A, n, o, y)), (T -= g), y && T < h)) {
        var k = Es(A, S);
        return bs(t, e, Me, N.placeholder, r, A, k, u, c, h - T);
      }
      var Z = m ? r : this,
        Q = d ? Z[t] : t;
      return (
        (T = A.length),
        u ? (A = Zo(A, u)) : E && T > 1 && A.reverse(),
        p && c < T && (A.length = c),
        this && this !== zt && this instanceof N && (Q = v || Kt(Q)),
        Q.apply(Z, A)
      );
    }
    return N;
  }
  function zo(t, e, r, s) {
    var i = e & Tt,
      n = Kt(t);
    function o() {
      for (
        var u = -1,
          c = arguments.length,
          h = -1,
          p = s.length,
          m = Array(p + c),
          d = this && this !== zt && this instanceof o ? n : t;
        ++h < p;
      )
        m[h] = s[h];
      for (; c--; ) m[h++] = arguments[++u];
      return vs(d, i ? r : this, m);
    }
    return o;
  }
  function bs(t, e, r, s, i, n, o, u, c, h) {
    var p = e & St,
      m = p ? o : void 0,
      d = p ? void 0 : o,
      y = p ? n : void 0,
      E = p ? void 0 : n;
    (e |= p ? Lt : Gt), (e &= ~(p ? Gt : Lt)), e & no || (e &= ~(Tt | he));
    var v = r(t, e, i, y, m, E, d, u, c, h);
    return (v.placeholder = s), Ss(v, t, e);
  }
  function Xo(t, e, r, s, i, n, o, u) {
    var c = e & he;
    if (!c && typeof t != 'function') throw new TypeError(io);
    var h = s ? s.length : 0;
    if (
      (h || ((e &= ~(Lt | Gt)), (s = i = void 0)),
      (o = o === void 0 ? o : ce(ms(o), 0)),
      (u = u === void 0 ? u : ms(u)),
      (h -= i ? i.length : 0),
      e & Gt)
    ) {
      var p = s,
        m = i;
      s = i = void 0;
    }
    var d = [t, e, r, s, i, p, m, n, o, u];
    if (
      ((t = d[0]),
      (e = d[1]),
      (r = d[2]),
      (s = d[3]),
      (i = d[4]),
      (u = d[9] = d[9] == null ? (c ? 0 : t.length) : ce(d[9] - h, 0)),
      !u && e & (St | Ut) && (e &= ~(St | Ut)),
      !e || e == Tt)
    )
      var y = Go(t, e, r);
    else
      e == St || e == Ut
        ? (y = Ko(t, e, u))
        : (e == Lt || e == (Tt | Lt)) && !i.length
          ? (y = zo(t, e, r, s))
          : (y = Me.apply(void 0, d));
    return Ss(y, t, e);
  }
  function ws(t) {
    var e = t;
    return e.placeholder;
  }
  function ds(t, e) {
    var r = Lo(t, e);
    return Mo(r) ? r : void 0;
  }
  function Yo(t) {
    var e = t.match(yo);
    return e ? e[1].split(vo) : [];
  }
  function Qo(t, e) {
    var r = e.length,
      s = r - 1;
    return (
      (e[s] = (r > 1 ? '& ' : '') + e[s]),
      (e = e.join(r > 2 ? ', ' : ' ')),
      t.replace(
        xo,
        `{
/* [wrapped with ` +
          e +
          `] */
`
      )
    );
  }
  function Ho(t, e) {
    return (e = e ?? oo), !!e && (typeof t == 'number' || bo.test(t)) && t > -1 && t % 1 == 0 && t < e;
  }
  function Jo(t) {
    return !!ps && ps in t;
  }
  function Zo(t, e) {
    for (var r = t.length, s = jo(e.length, r), i = Uo(t); s--; ) {
      var n = e[s];
      t[s] = Ho(n, r) ? i[n] : void 0;
    }
    return t;
  }
  var Ss = fs
    ? function (t, e, r) {
        var s = e + '';
        return fs(t, 'toString', { configurable: !0, enumerable: !1, value: ou(Qo(s, eu(Yo(s), r))) });
      }
    : uu;
  function tu(t) {
    if (t != null) {
      try {
        return As.call(t);
      } catch {}
      try {
        return t + '';
      } catch {}
    }
    return '';
  }
  function eu(t, e) {
    return (
      Po(co, function (r) {
        var s = '_.' + r[0];
        e & r[1] && !No(t, s) && t.push(s);
      }),
      t.sort()
    );
  }
  function Ve(t, e, r) {
    e = r ? void 0 : e;
    var s = Xo(t, St, void 0, void 0, void 0, void 0, void 0, e);
    return (s.placeholder = Ve.placeholder), s;
  }
  function ru(t) {
    var e = Rt(t) ? Cs.call(t) : '';
    return e == ho || e == lo;
  }
  function Rt(t) {
    var e = typeof t;
    return !!t && (e == 'object' || e == 'function');
  }
  function su(t) {
    return !!t && typeof t == 'object';
  }
  function iu(t) {
    return typeof t == 'symbol' || (su(t) && Cs.call(t) == po);
  }
  function nu(t) {
    if (!t) return t === 0 ? t : 0;
    if (((t = au(t)), t === hs || t === -hs)) {
      var e = t < 0 ? -1 : 1;
      return e * uo;
    }
    return t === t ? t : 0;
  }
  function ms(t) {
    var e = nu(t),
      r = e % 1;
    return e === e ? (r ? e - r : e) : 0;
  }
  function au(t) {
    if (typeof t == 'number') return t;
    if (iu(t)) return ls;
    if (Rt(t)) {
      var e = typeof t.valueOf == 'function' ? t.valueOf() : t;
      t = Rt(e) ? e + '' : e;
    }
    if (typeof t != 'string') return t === 0 ? t : +t;
    t = t.replace(mo, '');
    var r = go.test(t);
    return r || Co.test(t) ? wo(t.slice(2), r ? 2 : 8) : Eo.test(t) ? ls : +t;
  }
  function ou(t) {
    return function () {
      return t;
    };
  }
  function uu(t) {
    return t;
  }
  Ve.placeholder = {};
  Ts.exports = Ve;
});
var Ns = x((fp, Ps) => {
  'use strict';
  var cu = le();
  function hu(t, e, r) {
    return r.map(s => (s === t ? e : s));
  }
  Ps.exports = cu(hu);
});
var Fs = x(Xt => {
  Xt.loggerPhase = is();
  Xt.tokens = I();
  Xt.isValidName = Wt();
  Xt.replaceRule = Ns();
});
var We = x((mp, ks) => {
  ks.exports = function (t) {
    return t;
  };
});
var Ds = x((xp, Os) => {
  'use strict';
  Os.exports = function (t) {
    return (
      typeof Symbol < 'u' && Symbol && 'iterator' in Symbol && t != null && typeof t[Symbol.iterator] == 'function'
    );
  };
});
var q = x((yp, Ls) => {
  'use strict';
  var lu = le(),
    pu = Ds();
  function fu(t) {
    return t;
  }
  function du(t, e) {
    if (typeof t != 'function' && (typeof t != 'object' || t === null))
      throw new TypeError('Callback argument must be a function or option object');
    if (!pu(e)) throw new TypeError('Data argument must be an iterable');
    let r = 0,
      s = t.init || fu,
      i = t.callback || t,
      n = s(e),
      o = e[Symbol.iterator]();
    return {
      [Symbol.iterator]() {
        return this;
      },
      next() {
        let u = o.next();
        return u.done || (u.value = i(u.value, r++, n)), u;
      },
    };
  }
  Ls.exports = lu(du);
});
var pe = x((vp, Rs) => {
  'use strict';
  Rs.exports = function (t) {
    for (var e = Object.keys(t), r = [], s = 0; s < e.length; s++) r.push(t[e[s]]);
    return r;
  };
});
var fe = x((Ep, Is) => {
  'use strict';
  function* mu(t) {
    for (let e of t) typeof e[Symbol.iterator] == 'function' ? yield* e : yield e;
  }
  Is.exports = mu;
});
var qs = x((gp, _s) => {
  'use strict';
  var Bs = J(),
    xu = We(),
    yu = q(),
    vu = pe(),
    Eu = fe(),
    gu = I(),
    Au = (t, e, r) => {
      function* s(o, u) {
        if (u.indexOf(o.value) !== -1) {
          yield o;
          return;
        }
        let c = e(o.value);
        if (c === void 0) yield o;
        else
          for (let h of t(c))
            h.is('WORD') || r.some(p => h.is(p)) ? yield* s(h, u.concat(o.value)) : h.is('EOF') || (yield h);
      }
      function i(o) {
        return Array.from(s(o, []));
      }
      let n = { WORD: i };
      return (
        r.forEach(o => {
          n[o] = i;
        }),
        n
      );
    };
  _s.exports = (t, e, r) => {
    if (typeof t.resolveAlias != 'function') return xu;
    let s = Bs.apply(null, r.reverse()),
      i = Au(s, t.resolveAlias, vu(e.enums.reservedWords));
    return Bs(Eu, yu(gu.applyTokenizerVisitor(i)));
  };
});
var Ms = x((Ap, $s) => {
  'use strict';
  var js = qs(),
    It = '[a-zA-Z_][a-zA-Z0-9_]*',
    Cu = {
      [`^(${It}):([^:]*):?([^:]*)$`]: {
        op: 'substring',
        parameter: t => t[1],
        offset: t => parseInt(t[2], 10),
        length: t => parseInt(t[3], 10) || void 0,
      },
      [`^!(${It})(\\*|@)$`]: { op: 'prefix', prefix: t => t[1], expandWords: t => t[2] === '@', parameter: () => {} },
      [`^!(${It})(\\[\\*\\]|\\[@\\])$`]: { op: 'arrayIndices', parameter: t => t[1], expandWords: t => t[2] === '[@]' },
      [`^(${It})\\/(\\/)?([^\\/])+\\/(.*)$`]: {
        op: 'stringReplace',
        parameter: t => t[1],
        substitute: t => t[3],
        replace: t => t[4],
        globally: t => t[2] === '/',
      },
      [`^(${It})(\\^\\^|\\^|,,|,)(.*)$`]: {
        op: 'caseChange',
        parameter: t => t[1],
        pattern: t => t[3] || '?',
        case: t => (t[2][0] === ',' ? 'lower' : 'upper'),
        globally: t => t[2].length === 2,
      },
      [`^(${It})@([Q|E|P|A|a])$`]: {
        op: 'transformation',
        parameter: t => t[1],
        kind: t => {
          switch (t[2]) {
            case 'Q':
              return 'quoted';
            case 'E':
              return 'escape';
            case 'P':
              return 'prompt';
            case 'A':
              return 'assignment';
            case 'a':
              return 'flags';
            default:
              return 'unknown';
          }
        },
      },
      '^!(.+)$': { op: 'indirection', word: t => t[1], parameter: () => {} },
    };
  $s.exports = {
    inherits: 'posix',
    init: (t, e) => {
      let r = Object.assign({}, t.phaseCatalog, { bashAliasSubstitution: js }),
        s = e.replaceRule(r.aliasSubstitution, js, t.lexerPhases),
        i = Object.assign(Cu, t.enums.parameterOperators),
        n = Object.assign({}, t.enums, { parameterOperators: i });
      return Object.assign({}, t, { phaseCatalog: r, lexerPhases: s, enums: n });
    },
  };
});
var Ws = x((Cp, Vs) => {
  'use strict';
  Vs.exports = function (e) {
    var r = typeof e;
    if (r === 'string' || e instanceof String) {
      if (!e.trim()) return !1;
    } else if (r !== 'number' && !(e instanceof Number)) return !1;
    return e - e + 1 >= 0;
  };
});
var Et = x((bp, Us) => {
  var bu = Ws();
  Us.exports = function (e, r) {
    if (!Array.isArray(e)) throw new Error('expected the first argument to be an array');
    var s = e.length;
    if (s === 0) return null;
    if (((r = bu(r) ? +r : 1), r === 1)) return e[s - 1];
    for (var i = new Array(r); r--; ) i[r] = e[--s];
    return i;
  };
});
var Ks = x((wp, Gs) => {
  'use strict';
  Gs.exports = t => {
    let e = {};
    de(e, 'caseList'),
      de(e, 'pattern'),
      de(e, 'prefix'),
      de(e, 'suffix'),
      (e.caseItem = (i, n, o, u) => {
        let h = { type: 'CaseItem', pattern: i, body: n };
        return t.insertLOC && (h.loc = V(U({}, o), u)), h;
      }),
      (e.caseClause = (i, n, o, u) => {
        let h = { type: 'Case', clause: i };
        return n && Object.assign(h, { cases: n }), t.insertLOC && (h.loc = V(U({}, o), u)), h;
      }),
      (e.doGroup = (i, n, o) => (t.insertLOC && V(U(i.loc, n), o), i)),
      (e.braceGroup = (i, n, o) => (t.insertLOC && V(U(i.loc, n), o), i)),
      (e.list = i => {
        let n = { type: 'Script', commands: [i] };
        return t.insertLOC && (n.loc = V(U({}, i.loc), i.loc)), n;
      });
    function r(i) {
      return i.text.indexOf('&') !== -1;
    }
    let s = Et();
    return (
      (e.checkAsync = (i, n) => (r(n) && (s(i.commands).async = !0), i)),
      (e.listAppend = (i, n, o) => (
        r(o) && (s(i.commands).async = !0), i.commands.push(n), t.insertLOC && V(i.loc, n.loc), i
      )),
      (e.addRedirections = (i, n) => {
        if (((i.redirections = n), t.insertLOC)) {
          let o = n[n.length - 1];
          V(i.loc, o.loc);
        }
        return i;
      }),
      (e.term = i => {
        let n = { type: 'CompoundList', commands: [i] };
        return t.insertLOC && (n.loc = V(U({}, i.loc), i.loc)), n;
      }),
      (e.termAppend = (i, n, o) => (r(o) && (s(i.commands).async = !0), i.commands.push(n), V(i.loc, n.loc), i)),
      (e.subshell = (i, n, o) => {
        let u = { type: 'Subshell', list: i };
        return t.insertLOC && (u.loc = V(U({}, n), o)), u;
      }),
      (e.pipeSequence = i => {
        let n = { type: 'Pipeline', commands: [i] };
        return t.insertLOC && (n.loc = V(U({}, i.loc), i.loc)), n;
      }),
      (e.pipeSequenceAppend = (i, n) => (i.commands.push(n), t.insertLOC && V(i.loc, n.loc), i)),
      (e.bangPipeLine = i =>
        i.commands.length === 1 ? Object.assign(i.commands[0], { bang: !0 }) : Object.assign(i, { bang: !0 })),
      (e.pipeLine = i => (i.commands.length === 1 ? i.commands[0] : i)),
      (e.andAndOr = (i, n) => {
        let o = { type: 'LogicalExpression', op: 'and', left: i, right: n };
        return t.insertLOC && (o.loc = V(U({}, i.loc), n.loc)), o;
      }),
      (e.orAndOr = (i, n) => {
        let o = { type: 'LogicalExpression', op: 'or', left: i, right: n };
        return t.insertLOC && (o.loc = V(U({}, i.loc), n.loc)), o;
      }),
      (e.forClause = (i, n, o, u) => {
        let c = { type: 'For', name: i, wordlist: n, do: o };
        return t.insertLOC && (c.loc = V(U({}, u), o.loc)), c;
      }),
      (e.forClauseDefault = (i, n, o) => {
        let u = { type: 'For', name: i, do: n };
        return t.insertLOC && (u.loc = V(U({}, o), n.loc)), u;
      }),
      (e.functionDefinition = (i, n) => {
        let o = { type: 'Function', name: i };
        (o.body = n[0]), n[1] && (o.redirections = n[1]);
        let u = n[1] || n[0];
        return t.insertLOC && (o.loc = V(U({}, i.loc), u.loc)), o;
      }),
      (e.elseClause = (i, n) => (t.insertLOC && U(i.loc, n.loc), i)),
      (e.ifClause = (i, n, o, u, c) => {
        let h = { type: 'If', clause: i, then: n };
        return o && (h.else = o), t.insertLOC && (h.loc = V(U({}, u), c)), h;
      }),
      (e.while = (i, n, o) => {
        let u = { type: 'While', clause: i, do: n };
        return t.insertLOC && (u.loc = V(U({}, o.loc), n.loc)), u;
      }),
      (e.until = (i, n, o) => {
        let u = { type: 'Until', clause: i, do: n };
        return t.insertLOC && (u.loc = V(U({}, o.loc), n.loc)), u;
      }),
      (e.commandName = i => i),
      (e.commandAssignment = function (n) {
        return e.command(n);
      }),
      (e.command = function (i, n, o) {
        let u = { type: 'Command' };
        if ((n && (u.name = n), t.insertLOC)) {
          if (((u.loc = {}), i)) {
            let c = i[0];
            u.loc.start = c.loc.start;
          } else u.loc.start = n.loc.start;
          if (o) {
            let c = o[o.length - 1];
            u.loc.end = c.loc.end;
          } else if (n) u.loc.end = n.loc.end;
          else {
            let c = i[i.length - 1];
            u.loc.end = c.loc.end;
          }
        }
        return i && (u.prefix = i), o && (u.suffix = o), u;
      }),
      (e.ioRedirect = (i, n) => {
        let o = { type: 'Redirect', op: i, file: n };
        return t.insertLOC && (o.loc = V(U({}, i.loc), n.loc)), o;
      }),
      (e.numberIoRedirect = (i, n) => {
        let o = Object.assign({}, i, { numberIo: n });
        return t.insertLOC && U(o.loc, n.loc), o;
      }),
      e
    );
  };
  function U(t, e) {
    return e && (t.start = e.start), t;
  }
  function V(t, e) {
    return e && (t.end = e.end), t;
  }
  function de(t, e) {
    (t[e] = r => [r]), (t[`${e}Append`] = (r, s) => (r.push(s), r));
  }
});
var Xs = x((Sp, zs) => {
  'use strict';
  var wu = I().eof;
  zs.exports = function () {
    return { nextReduction: null, tokensToEmit: [wu()] };
  };
});
var Js = x((Tp, Hs) => {
  'use strict';
  var Ue = I(),
    Su = Ue.isPartOfOperator,
    Ys = Ue.operatorTokens,
    Qs = Ue.isOperator;
  Hs.exports = function (e, r, s) {
    let i = r && r.shift();
    if (i === void 0)
      return Qs(e.current)
        ? { nextReduction: s.end, tokensToEmit: Ys(e), nextState: e.resetCurrent().saveCurrentLocAsStart() }
        : s.start(e, i);
    if (Su(e.current + i)) return { nextReduction: s.operator, nextState: e.appendChar(i) };
    let n = [];
    Qs(e.current) && ((n = Ys(e)), (e = e.resetCurrent().saveCurrentLocAsStart()));
    let o = s.start(e, [i].concat(r), s),
      u = o.nextReduction,
      c = o.tokensToEmit,
      h = o.nextState;
    return c && (n = n.concat(c)), { nextReduction: u, tokensToEmit: n, nextState: h };
  };
});
var ti = x((Pp, Zs) => {
  'use strict';
  var Tu = I().newLine;
  Zs.exports = function t(e, r, s) {
    let i = r && r.shift();
    return i === void 0
      ? { nextReduction: s.end, nextState: e }
      : i ===
          `
`
        ? { tokensToEmit: [Tu()], nextReduction: s.start, nextState: e }
        : { nextReduction: t, nextState: e };
  };
});
var si = x((Np, ri) => {
  'use strict';
  var ei = I(),
    Pu = ei.tokenOrEmpty,
    Nu = ei.continueToken;
  ri.exports = function (e, r, s) {
    let i = r && r.shift();
    return i === void 0
      ? { nextState: e, nextReduction: null, tokensToEmit: Pu(e).concat(Nu("'")) }
      : i === "'"
        ? { nextReduction: s.start, nextState: e.appendChar(i) }
        : { nextReduction: s.singleQuoting, nextState: e.appendChar(i) };
  };
});
var ai = x((Fp, ni) => {
  'use strict';
  var ii = I(),
    Fu = ii.tokenOrEmpty,
    ku = ii.continueToken;
  ni.exports = function t(e, r, s) {
    let i = r && r.shift();
    return (
      (e = e.setPreviousReducer(t)),
      i === void 0
        ? { nextReduction: null, tokensToEmit: Fu(e).concat(ku('"')), nextState: e }
        : !e.escaping && i === '\\'
          ? { nextReduction: t, nextState: e.setEscaping(!0).appendChar(i) }
          : !e.escaping && i === '"'
            ? { nextReduction: s.start, nextState: e.setPreviousReducer(s.start).appendChar(i) }
            : !e.escaping && i === '$'
              ? { nextReduction: s.expansionStart, nextState: e.appendEmptyExpansion().appendChar(i) }
              : !e.escaping && i === '`'
                ? { nextReduction: s.expansionCommandTick, nextState: e.appendEmptyExpansion().appendChar(i) }
                : { nextReduction: s.doubleQuoting, nextState: e.setEscaping(!1).appendChar(i) }
    );
  };
});
var ui = x((kp, oi) => {
  'use strict';
  function Ou(t) {
    return t.match(/^[0-9\-!@#\?\*\$]$/);
  }
  oi.exports = function (e, r, s) {
    let i = r && r.shift();
    return i === '{'
      ? { nextReduction: s.expansionParameterExtended, nextState: e.appendChar(i) }
      : i === '('
        ? { nextReduction: s.expansionCommandOrArithmetic, nextState: e.appendChar(i) }
        : i.match(/[a-zA-Z_]/)
          ? {
              nextReduction: s.expansionParameter,
              nextState: e.appendChar(i).replaceLastExpansion({ parameter: i, type: 'parameter_expansion' }),
            }
          : Ou(i)
            ? s.expansionSpecialParameter(e, [i].concat(r))
            : e.previousReducer(e, [i].concat(r));
  };
});
var hi = x((Op, ci) => {
  'use strict';
  var Du = Et(),
    Lu = I(),
    Ru = Lu.continueToken;
  ci.exports = function (e, r, s) {
    let i = r && r.shift(),
      n = Du(e.expansion);
    return !e.escaping && i === '`'
      ? {
          nextReduction: e.previousReducer,
          nextState: e
            .appendChar(i)
            .replaceLastExpansion({ type: 'command_expansion', loc: Object.assign({}, n.loc, { end: e.loc.current }) }),
        }
      : i === void 0
        ? {
            nextReduction: e.previousReducer,
            tokensToEmit: [Ru('`')],
            nextState: e.replaceLastExpansion({ loc: Object.assign({}, n.loc, { end: e.loc.previous }) }),
          }
        : !e.escaping && i === '\\'
          ? { nextReduction: s.expansionCommandTick, nextState: e.appendChar(i).setEscaping(!0) }
          : {
              nextReduction: s.expansionCommandTick,
              nextState: e
                .setEscaping(!1)
                .appendChar(i)
                .replaceLastExpansion({ command: (n.command || '') + i }),
            };
  };
});
var pi = x((Dp, li) => {
  'use strict';
  var Ge = I(),
    me = Ge.tokenOrEmpty,
    Iu = Ge.newLine,
    Bu = Ge.isPartOfOperator;
  li.exports = function (e, r, s) {
    let i = r && r.shift();
    return i === void 0
      ? { nextReduction: s.end, tokensToEmit: me(e), nextState: e.resetCurrent().saveCurrentLocAsStart() }
      : e.escaping &&
          i ===
            `
`
        ? { nextReduction: s.start, nextState: e.setEscaping(!1).removeLastChar() }
        : !e.escaping && i === '#' && e.current === ''
          ? { nextReduction: s.comment }
          : !e.escaping &&
              i ===
                `
`
            ? {
                nextReduction: s.start,
                tokensToEmit: me(e).concat(Iu()),
                nextState: e.resetCurrent().saveCurrentLocAsStart(),
              }
            : !e.escaping && i === '\\'
              ? { nextReduction: s.start, nextState: e.setEscaping(!0).appendChar(i) }
              : !e.escaping && Bu(i)
                ? { nextReduction: s.operator, tokensToEmit: me(e), nextState: e.setCurrent(i).saveCurrentLocAsStart() }
                : !e.escaping && i === "'"
                  ? { nextReduction: s.singleQuoting, nextState: e.appendChar(i) }
                  : !e.escaping && i === '"'
                    ? { nextReduction: s.doubleQuoting, nextState: e.appendChar(i) }
                    : !e.escaping && i.match(/\s/)
                      ? {
                          nextReduction: s.start,
                          tokensToEmit: me(e),
                          nextState: e.resetCurrent().saveCurrentLocAsStart().setExpansion([]),
                        }
                      : !e.escaping && i === '$'
                        ? { nextReduction: s.expansionStart, nextState: e.appendChar(i).appendEmptyExpansion() }
                        : !e.escaping && i === '`'
                          ? { nextReduction: s.expansionCommandTick, nextState: e.appendChar(i).appendEmptyExpansion() }
                          : { nextReduction: s.start, nextState: e.appendChar(i).setEscaping(!1) };
  };
});
var di = x((Lp, fi) => {
  'use strict';
  var _u = Et(),
    qu = I(),
    ju = qu.continueToken;
  fi.exports = function t(e, r) {
    let s = r && r.shift(),
      i = _u(e.expansion);
    return s === ')' && e.current.slice(-1)[0] === ')'
      ? {
          nextReduction: e.previousReducer,
          nextState: e
            .appendChar(s)
            .replaceLastExpansion({
              type: 'arithmetic_expansion',
              expression: i.value.slice(0, -1),
              loc: Object.assign({}, i.loc, { end: e.loc.current }),
            })
            .deleteLastExpansionValue(),
        }
      : s === void 0
        ? {
            nextReduction: e.previousReducer,
            tokensToEmit: [ju('$((')],
            nextState: e.replaceLastExpansion({ loc: Object.assign({}, i.loc, { end: e.loc.previous }) }),
          }
        : { nextReduction: t, nextState: e.appendChar(s).replaceLastExpansion({ value: (i.value || '') + s }) };
  };
});
var xi = x((Rp, mi) => {
  'use strict';
  var $u = Et();
  mi.exports = function (e, r) {
    let s = r && r.shift(),
      i = $u(e.expansion);
    return {
      nextReduction: e.previousReducer,
      nextState: e
        .appendChar(s)
        .replaceLastExpansion({
          parameter: s,
          type: 'parameter_expansion',
          loc: Object.assign({}, i.loc, { end: e.loc.current }),
        }),
    };
  };
});
var vi = x((Ip, yi) => {
  'use strict';
  var Mu = Et();
  yi.exports = function (e, r, s) {
    let i = r && r.shift(),
      n = Mu(e.expansion);
    return i === void 0
      ? {
          nextReduction: s.start,
          nextState: e.replaceLastExpansion({ loc: Object.assign({}, n.loc, { end: e.loc.previous }) }),
        }
      : i.match(/[0-9a-zA-Z_]/)
        ? {
            nextReduction: s.expansionParameter,
            nextState: e.appendChar(i).replaceLastExpansion({ parameter: n.parameter + (i || '') }),
          }
        : e.previousReducer(
            e.replaceLastExpansion({ loc: Object.assign({}, n.loc, { end: e.loc.previous }) }),
            [i].concat(r),
            s
          );
  };
});
var gi = x((Bp, Ei) => {
  'use strict';
  var Vu = Et(),
    Wu = I(),
    Uu = Wu.continueToken;
  Ei.exports = function (e, r, s) {
    let i = r && r.shift(),
      n = Vu(e.expansion);
    return i === '(' && e.current.slice(-2) === '$('
      ? { nextReduction: s.expansionArithmetic, nextState: e.appendChar(i) }
      : i === void 0
        ? {
            nextReduction: e.previousReducer,
            tokensToEmit: [Uu('$(')],
            nextState: e.replaceLastExpansion({ loc: Object.assign({}, n.loc, { end: e.loc.previous }) }),
          }
        : i === ')'
          ? {
              nextReduction: e.previousReducer,
              nextState: e
                .appendChar(i)
                .replaceLastExpansion({
                  type: 'command_expansion',
                  loc: Object.assign({}, n.loc, { end: e.loc.current }),
                }),
            }
          : {
              nextReduction: s.expansionCommandOrArithmetic,
              nextState: e.appendChar(i).replaceLastExpansion({ command: (n.command || '') + i }),
            };
  };
});
var Ci = x((_p, Ai) => {
  'use strict';
  var Gu = Et(),
    Ku = I(),
    zu = Ku.continueToken;
  Ai.exports = function (e, r, s) {
    let i = r && r.shift(),
      n = Gu(e.expansion);
    return i === '}'
      ? {
          nextReduction: e.previousReducer,
          nextState: e
            .appendChar(i)
            .replaceLastExpansion({
              type: 'parameter_expansion',
              loc: Object.assign({}, n.loc, { end: e.loc.current }),
            }),
        }
      : i === void 0
        ? {
            nextReduction: e.previousReducer,
            tokensToEmit: [zu('${')],
            nextState: e.replaceLastExpansion({ loc: Object.assign({}, n.loc, { end: e.loc.previous }) }),
          }
        : {
            nextReduction: s.expansionParameterExtended,
            nextState: e.appendChar(i).replaceLastExpansion({ parameter: (n.parameter || '') + i }),
          };
  };
});
var Ke = x((qp, bi) => {
  'use strict';
  var Xu = Xs(),
    Yu = Js(),
    Qu = ti(),
    Hu = si(),
    Ju = ai(),
    Zu = ui(),
    tc = hi(),
    ec = pi(),
    rc = di(),
    sc = xi(),
    ic = vi(),
    nc = gi(),
    ac = Ci();
  bi.exports = {
    end: Xu,
    operator: Yu,
    comment: Qu,
    singleQuoting: Hu,
    doubleQuoting: Ju,
    expansionStart: Zu,
    expansionCommandTick: tc,
    start: ec,
    expansionArithmetic: rc,
    expansionSpecialParameter: sc,
    expansionParameter: ic,
    expansionCommandOrArithmetic: nc,
    expansionParameterExtended: ac,
  };
});
var Ti = x((jp, ze) => {
  'use strict';
  var wi = Et(),
    Si = t => ({
      current: '',
      escaping: !1,
      previousReducer: t.start,
      loc: { start: { col: 1, row: 1, char: 0 }, previous: null, current: { col: 1, row: 1, char: 0 } },
    }),
    oc = t =>
      class dt {
        constructor(r) {
          Object.assign(this, r || Si(t));
        }
        setLoc(r) {
          return new dt(Object.assign({}, this, { loc: r }));
        }
        setEscaping(r) {
          return new dt(Object.assign({}, this, { escaping: r }));
        }
        setExpansion(r) {
          return new dt(Object.assign({}, this, { expansion: r }));
        }
        setPreviousReducer(r) {
          return new dt(Object.assign({}, this, { previousReducer: r }));
        }
        setCurrent(r) {
          return new dt(Object.assign({}, this, { current: r }));
        }
        appendEmptyExpansion() {
          let r = (this.expansion || []).concat({ loc: { start: Object.assign({}, this.loc.current) } });
          return this.setExpansion(r);
        }
        appendChar(r) {
          return new dt(Object.assign({}, this, { current: this.current + r }));
        }
        removeLastChar() {
          return new dt(Object.assign({}, this, { current: this.current.slice(0, -1) }));
        }
        saveCurrentLocAsStart() {
          return new dt(Object.assign({}, this, { loc: Object.assign({}, this.loc, { start: this.loc.current }) }));
        }
        resetCurrent() {
          return new dt(Object.assign({}, this, { current: '' }));
        }
        advanceLoc(r) {
          let s = Object.assign({}, this.loc, {
            current: Object.assign({}, this.loc.current),
            previous: Object.assign({}, this.loc.current),
          });
          return (
            r ===
            `
`
              ? (s.current.row++, (s.current.col = 1))
              : s.current.col++,
            s.current.char++,
            r && r.match(/\s/) && this.current === '' && (s.start = Object.assign({}, s.current)),
            this.setLoc(s)
          );
        }
      },
    uc = t =>
      class {
        constructor(e) {
          Object.assign(this, e || Si(t));
        }
        setLoc(e) {
          return (this.loc = e), this;
        }
        setEscaping(e) {
          return (this.escaping = e), this;
        }
        setExpansion(e) {
          return (this.expansion = e), this;
        }
        setPreviousReducer(e) {
          return (this.previousReducer = e), this;
        }
        setCurrent(e) {
          return (this.current = e), this;
        }
        appendEmptyExpansion() {
          return (
            (this.expansion = this.expansion || []),
            this.expansion.push({ loc: { start: Object.assign({}, this.loc.current) } }),
            this
          );
        }
        appendChar(e) {
          return (this.current = this.current + e), this;
        }
        removeLastChar() {
          return (this.current = this.current.slice(0, -1)), this;
        }
        saveCurrentLocAsStart() {
          return (this.loc.start = Object.assign({}, this.loc.current)), this;
        }
        resetCurrent() {
          return (this.current = ''), this;
        }
        replaceLastExpansion(e) {
          let r = wi(this.expansion);
          return Object.assign(r, e), this;
        }
        deleteLastExpansionValue() {
          let e = wi(this.expansion);
          return delete e.value, this;
        }
        advanceLoc(e) {
          let r = JSON.parse(JSON.stringify(this.loc));
          return (
            (r.previous = Object.assign({}, this.loc.current)),
            e ===
            `
`
              ? (r.current.row++, (r.current.col = 1))
              : r.current.col++,
            r.current.char++,
            e && e.match(/\s/) && this.current === '' && (r.start = Object.assign({}, r.current)),
            this.setLoc(r)
          );
        }
      };
  ze.exports = (t, e) =>
    function* (s) {
      e = e || Ke();
      let i = process.env.NODE_NEV === 'development' ? oc(e) : uc(e),
        n = new i(),
        o = e.start,
        u = Array.from(s);
      for (; typeof o == 'function'; ) {
        let c = u[0],
          h = o(n, u, e),
          p = h.nextReduction,
          m = h.tokensToEmit,
          d = h.nextState;
        m && (yield* m), d ? (n = d.advanceLoc(c)) : (n = n.advanceLoc(c)), (o = p);
      }
    };
  ze.exports.reducers = Ke();
});
var Fi = x((Mp, Ni) => {
  'use strict';
  var Pi = t =>
    typeof t == 'object' && t !== null && !(t instanceof RegExp) && !(t instanceof Error) && !(t instanceof Date);
  Ni.exports = function t(e, r, s, i) {
    if (((s = Object.assign({ deep: !1, target: {} }, s)), (i = i || new WeakMap()), i.has(e))) return i.get(e);
    i.set(e, s.target);
    let n = s.target;
    delete s.target;
    for (let o of Object.keys(e)) {
      let u = e[o],
        c = r(o, u, e),
        h = c[1];
      s.deep && Pi(h) && (Array.isArray(h) ? (h = h.map(p => (Pi(p) ? t(p, r, s, i) : p))) : (h = t(h, r, s, i))),
        (n[c[0]] = h);
    }
    return n;
  };
});
var Oi = x((Vp, ki) => {
  'use strict';
  ki.exports = function (t) {
    return Object.keys(t).map(function (e) {
      return [e, t[e]];
    });
  };
});
var Li = x((xe, Di) => {
  (function (t, e) {
    typeof xe == 'object' && typeof Di < 'u'
      ? e(xe)
      : typeof define == 'function' && define.amd
        ? define(['exports'], e)
        : e((t.vlq = t.vlq || {}));
  })(xe, function (t) {
    'use strict';
    var e = {},
      r = {};
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='.split('').forEach(function (o, u) {
      (e[o] = u), (r[u] = o);
    });
    function s(o) {
      for (var u = [], c = 0, h = 0, p = 0; p < o.length; p += 1) {
        var m = e[o[p]];
        if (m === void 0) throw new Error('Invalid character (' + o[p] + ')');
        var d = m & 32;
        if (((m &= 31), (h += m << c), d)) c += 5;
        else {
          var y = h & 1;
          (h >>= 1), u.push(y ? -h : h), (h = c = 0);
        }
      }
      return u;
    }
    function i(o) {
      var u;
      if (typeof o == 'number') u = n(o);
      else {
        u = '';
        for (var c = 0; c < o.length; c += 1) u += n(o[c]);
      }
      return u;
    }
    function n(o) {
      var u = '';
      o < 0 ? (o = (-o << 1) | 1) : (o <<= 1);
      do {
        var c = o & 31;
        (o >>= 5), o > 0 && (c |= 32), (u += r[c]);
      } while (o > 0);
      return u;
    }
    (t.decode = s), (t.encode = i), Object.defineProperty(t, '__esModule', { value: !0 });
  });
});
var Ee = x((Wp, qi) => {
  'use strict';
  var cc = Li();
  function Yt(t, e, r) {
    (this.start = t),
      (this.end = e),
      (this.original = r),
      (this.intro = ''),
      (this.outro = ''),
      (this.content = r),
      (this.storeName = !1),
      (this.edited = !1),
      Object.defineProperties(this, { previous: { writable: !0, value: null }, next: { writable: !0, value: null } });
  }
  Yt.prototype = {
    append: function (e) {
      this.outro += e;
    },
    clone: function () {
      var e = new Yt(this.start, this.end, this.original);
      return (
        (e.intro = this.intro),
        (e.outro = this.outro),
        (e.content = this.content),
        (e.storeName = this.storeName),
        (e.edited = this.edited),
        e
      );
    },
    contains: function (e) {
      return this.start < e && e < this.end;
    },
    eachNext: function (e) {
      for (var r = this; r; ) e(r), (r = r.next);
    },
    eachPrevious: function (e) {
      for (var r = this; r; ) e(r), (r = r.previous);
    },
    edit: function (e, r) {
      return (this.content = e), (this.intro = ''), (this.outro = ''), (this.storeName = r), (this.edited = !0), this;
    },
    prepend: function (e) {
      this.intro = e + this.intro;
    },
    split: function (e) {
      var r = e - this.start,
        s = this.original.slice(0, r),
        i = this.original.slice(r);
      this.original = s;
      var n = new Yt(e, this.end, i);
      return (
        (n.outro = this.outro),
        (this.outro = ''),
        (this.end = e),
        this.edited ? (n.edit('', !1), (this.content = '')) : (this.content = s),
        (n.next = this.next),
        n.next && (n.next.previous = n),
        (n.previous = this),
        (this.next = n),
        n
      );
    },
    toString: function () {
      return this.intro + this.content + this.outro;
    },
    trimEnd: function (e) {
      if (((this.outro = this.outro.replace(e, '')), this.outro.length)) return !0;
      var r = this.content.replace(e, '');
      if (r.length) return r !== this.content && this.split(this.start + r.length).edit('', !1), !0;
      if ((this.edit('', !1), (this.intro = this.intro.replace(e, '')), this.intro.length)) return !0;
    },
    trimStart: function (e) {
      if (((this.intro = this.intro.replace(e, '')), this.intro.length)) return !0;
      var r = this.content.replace(e, '');
      if (r.length) return r !== this.content && (this.split(this.end - r.length), this.edit('', !1)), !0;
      if ((this.edit('', !1), (this.outro = this.outro.replace(e, '')), this.outro.length)) return !0;
    },
  };
  var ye;
  typeof window < 'u' && typeof window.btoa == 'function'
    ? (ye = window.btoa)
    : typeof Buffer == 'function'
      ? (ye = function (t) {
          return new Buffer(t).toString('base64');
        })
      : (ye = function () {
          throw new Error('Unsupported environment: `window.btoa` or `Buffer` should be supported.');
        });
  var hc = ye;
  function Ye(t) {
    (this.version = 3),
      (this.file = t.file),
      (this.sources = t.sources),
      (this.sourcesContent = t.sourcesContent),
      (this.names = t.names),
      (this.mappings = t.mappings);
  }
  Ye.prototype = {
    toString: function () {
      return JSON.stringify(this);
    },
    toUrl: function () {
      return 'data:application/json;charset=utf-8;base64,' + hc(this.toString());
    },
  };
  function lc(t) {
    var e = t.split(`
`),
      r = e.filter(function (n) {
        return /^\t+/.test(n);
      }),
      s = e.filter(function (n) {
        return /^ {2,}/.test(n);
      });
    if (r.length === 0 && s.length === 0) return null;
    if (r.length >= s.length) return '	';
    var i = s.reduce(function (n, o) {
      var u = /^ +/.exec(o)[0].length;
      return Math.min(u, n);
    }, 1 / 0);
    return new Array(i + 1).join(' ');
  }
  function ve(t) {
    return new Array(
      t.split(`
`).length
    ).join(';');
  }
  function Ii(t) {
    var e = t.split(`
`),
      r = 0,
      s = e.map(function (u, c) {
        var h = r + u.length + 1,
          p = { start: r, end: h, line: c };
        return (r = h), p;
      }),
      i = 0;
    function n(u, c) {
      return u.start <= c && c < u.end;
    }
    function o(u, c) {
      return { line: u.line, column: c - u.start };
    }
    return function (c) {
      for (var h = s[i], p = c >= h.end ? 1 : -1; h; ) {
        if (n(h, c)) return o(h, c);
        (i += p), (h = s[i]);
      }
    };
  }
  var pc = /\S/;
  function fc(t, e, r, s, i, n, o, u, c) {
    var h = [],
      p =
        e.split(`
`).length - 1,
      m = (h[p] = []),
      d = 0,
      y = Ii(t);
    function E(C, S, g, k, Z) {
      (Z || (C.length && pc.test(C))) &&
        m.push({
          generatedCodeLine: p,
          generatedCodeColumn: d,
          sourceCodeLine: g.line,
          sourceCodeColumn: g.column,
          sourceCodeName: k,
          sourceIndex: o,
        });
      var Q = C.split(`
`),
        ht = Q.pop();
      Q.length ? ((p += Q.length), (h[p] = m = []), (d = ht.length)) : (d += ht.length),
        (Q = S.split(`
`)),
        (ht = Q.pop()),
        Q.length ? ((g.line += Q.length), (g.column = ht.length)) : (g.column += ht.length);
    }
    function v(C, S) {
      for (var g = C.start, k = !0; g < C.end; )
        (i || k || n[g]) &&
          m.push({
            generatedCodeLine: p,
            generatedCodeColumn: d,
            sourceCodeLine: S.line,
            sourceCodeColumn: S.column,
            sourceCodeName: -1,
            sourceIndex: o,
          }),
          t[g] ===
          `
`
            ? ((S.line += 1), (S.column = 0), (p += 1), (h[p] = m = []), (d = 0))
            : ((S.column += 1), (d += 1)),
          (g += 1),
          (k = !1);
    }
    for (var N = !1; s; ) {
      var T = y(s.start);
      s.intro.length && E(s.intro, '', T, -1, N),
        s.edited ? E(s.content, s.original, T, s.storeName ? c.indexOf(s.original) : -1, N) : v(s, T),
        s.outro.length && E(s.outro, '', T, -1, N),
        (s.content || s.intro || s.outro) && (N = !0);
      var A = s.next;
      s = A;
    }
    return (
      (u.sourceIndex = u.sourceIndex || 0),
      (u.sourceCodeLine = u.sourceCodeLine || 0),
      (u.sourceCodeColumn = u.sourceCodeColumn || 0),
      (u.sourceCodeName = u.sourceCodeName || 0),
      h
        .map(function (C) {
          var S = 0;
          return C.map(function (g) {
            var k = [
              g.generatedCodeColumn - S,
              g.sourceIndex - u.sourceIndex,
              g.sourceCodeLine - u.sourceCodeLine,
              g.sourceCodeColumn - u.sourceCodeColumn,
            ];
            return (
              (S = g.generatedCodeColumn),
              (u.sourceIndex = g.sourceIndex),
              (u.sourceCodeLine = g.sourceCodeLine),
              (u.sourceCodeColumn = g.sourceCodeColumn),
              ~g.sourceCodeName && (k.push(g.sourceCodeName - u.sourceCodeName), (u.sourceCodeName = g.sourceCodeName)),
              cc.encode(k)
            );
          }).join(',');
        })
        .join(';') + ve(r)
    );
  }
  function Bi(t, e) {
    var r = t.split(/[\/\\]/),
      s = e.split(/[\/\\]/);
    for (r.pop(); r[0] === s[0]; ) r.shift(), s.shift();
    if (r.length) for (var i = r.length; i--; ) r[i] = '..';
    return r.concat(s).join('/');
  }
  var dc = Object.prototype.toString;
  function _i(t) {
    return dc.call(t) === '[object Object]';
  }
  function Bt(t, e) {
    e === void 0 && (e = {});
    var r = new Yt(0, t.length, t);
    Object.defineProperties(this, {
      original: { writable: !0, value: t },
      outro: { writable: !0, value: '' },
      intro: { writable: !0, value: '' },
      firstChunk: { writable: !0, value: r },
      lastChunk: { writable: !0, value: r },
      lastSearchedChunk: { writable: !0, value: r },
      byStart: { writable: !0, value: {} },
      byEnd: { writable: !0, value: {} },
      filename: { writable: !0, value: e.filename },
      indentExclusionRanges: { writable: !0, value: e.indentExclusionRanges },
      sourcemapLocations: { writable: !0, value: {} },
      storedNames: { writable: !0, value: {} },
      indentStr: { writable: !0, value: lc(t) },
    }),
      (this.byStart[0] = r),
      (this.byEnd[t.length] = r);
  }
  Bt.prototype = {
    addSourcemapLocation: function (e) {
      this.sourcemapLocations[e] = !0;
    },
    append: function (e) {
      if (typeof e != 'string') throw new TypeError('outro content must be a string');
      return (this.outro += e), this;
    },
    clone: function () {
      for (
        var e = new Bt(this.original, { filename: this.filename }),
          r = this.firstChunk,
          s = (e.firstChunk = e.lastSearchedChunk = r.clone());
        r;
      ) {
        (e.byStart[s.start] = s), (e.byEnd[s.end] = s);
        var i = r.next,
          n = i && i.clone();
        n && ((s.next = n), (n.previous = s), (s = n)), (r = i);
      }
      return (
        (e.lastChunk = s),
        this.indentExclusionRanges &&
          (e.indentExclusionRanges =
            typeof this.indentExclusionRanges[0] == 'number'
              ? [this.indentExclusionRanges[0], this.indentExclusionRanges[1]]
              : this.indentExclusionRanges.map(function (o) {
                  return [o.start, o.end];
                })),
        Object.keys(this.sourcemapLocations).forEach(function (o) {
          e.sourcemapLocations[o] = !0;
        }),
        e
      );
    },
    generateMap: function (e) {
      e = e || {};
      var r = Object.keys(this.storedNames),
        s = new Ye({
          file: e.file ? e.file.split(/[\/\\]/).pop() : null,
          sources: [e.source ? Bi(e.file || '', e.source) : null],
          sourcesContent: e.includeContent ? [this.original] : [null],
          names: r,
          mappings: this.getMappings(e.hires, 0, {}, r),
        });
      return s;
    },
    getIndentString: function () {
      return this.indentStr === null ? '	' : this.indentStr;
    },
    getMappings: function (e, r, s, i) {
      return fc(this.original, this.intro, this.outro, this.firstChunk, e, this.sourcemapLocations, r, s, i);
    },
    indent: function (e, r) {
      var s = this,
        i = /^[^\r\n]/gm;
      if ((_i(e) && ((r = e), (e = void 0)), (e = e !== void 0 ? e : this.indentStr || '	'), e === '')) return this;
      r = r || {};
      var n = {};
      if (r.exclude) {
        var o = typeof r.exclude[0] == 'number' ? [r.exclude] : r.exclude;
        o.forEach(function (E) {
          for (var v = E[0]; v < E[1]; v += 1) n[v] = !0;
        });
      }
      var u = r.indentStart !== !1,
        c = function (E) {
          return u ? '' + e + E : ((u = !0), E);
        };
      this.intro = this.intro.replace(i, c);
      for (var h = 0, p = this.firstChunk; p; ) {
        var m = p.end;
        if (p.edited)
          n[h] ||
            ((p.content = p.content.replace(i, c)),
            p.content.length &&
              (u =
                p.content[p.content.length - 1] ===
                `
`));
        else
          for (h = p.start; h < m; ) {
            if (!n[h]) {
              var d = s.original[h];
              if (
                d ===
                `
`
              )
                u = !0;
              else if (d !== '\r' && u)
                if (((u = !1), h === p.start)) p.prepend(e);
                else {
                  var y = p.split(h);
                  y.prepend(e), (s.byStart[h] = y), (s.byEnd[h] = p), (p = y);
                }
            }
            h += 1;
          }
        (h = p.end), (p = p.next);
      }
      return (this.outro = this.outro.replace(i, c)), this;
    },
    insert: function () {
      throw new Error('magicString.insert(...) is deprecated. Use insertRight(...) or insertLeft(...)');
    },
    insertLeft: function (e, r) {
      if (typeof r != 'string') throw new TypeError('inserted content must be a string');
      this._split(e);
      var s = this.byEnd[e];
      return s ? s.append(r) : (this.intro += r), this;
    },
    insertRight: function (e, r) {
      if (typeof r != 'string') throw new TypeError('inserted content must be a string');
      this._split(e);
      var s = this.byStart[e];
      return s ? s.prepend(r) : (this.outro += r), this;
    },
    move: function (e, r, s) {
      if (s >= e && s <= r) throw new Error('Cannot move a selection inside itself');
      this._split(e), this._split(r), this._split(s);
      var i = this.byStart[e],
        n = this.byEnd[r],
        o = i.previous,
        u = n.next,
        c = this.byStart[s];
      if (!c && n === this.lastChunk) return this;
      var h = c ? c.previous : this.lastChunk;
      return (
        o && (o.next = u),
        u && (u.previous = o),
        h && (h.next = i),
        c && (c.previous = n),
        i.previous || (this.firstChunk = n.next),
        n.next || ((this.lastChunk = i.previous), (this.lastChunk.next = null)),
        (i.previous = h),
        (n.next = c),
        h || (this.firstChunk = i),
        c || (this.lastChunk = n),
        this
      );
    },
    overwrite: function (e, r, s, i) {
      var n = this;
      if (typeof s != 'string') throw new TypeError('replacement content must be a string');
      for (; e < 0; ) e += n.original.length;
      for (; r < 0; ) r += n.original.length;
      if (r > this.original.length) throw new Error('end is out of bounds');
      if (e === r) throw new Error('Cannot overwrite a zero-length range \u2013 use insertLeft or insertRight instead');
      if ((this._split(e), this._split(r), i)) {
        var o = this.original.slice(e, r);
        this.storedNames[o] = !0;
      }
      var u = this.byStart[e],
        c = this.byEnd[r];
      if (u) {
        if ((u.edit(s, i), u !== c)) {
          for (var h = u.next; h !== c; ) h.edit('', !1), (h = h.next);
          h.edit('', !1);
        }
      } else {
        var p = new Yt(e, r, '').edit(s, i);
        (c.next = p), (p.previous = c);
      }
      return this;
    },
    prepend: function (e) {
      if (typeof e != 'string') throw new TypeError('outro content must be a string');
      return (this.intro = e + this.intro), this;
    },
    remove: function (e, r) {
      for (var s = this; e < 0; ) e += s.original.length;
      for (; r < 0; ) r += s.original.length;
      if (e === r) return this;
      if (e < 0 || r > this.original.length) throw new Error('Character is out of bounds');
      if (e > r) throw new Error('end must be greater than start');
      return this.overwrite(e, r, '', !1);
    },
    slice: function (e, r) {
      var s = this;
      for (e === void 0 && (e = 0), r === void 0 && (r = this.original.length); e < 0; ) e += s.original.length;
      for (; r < 0; ) r += s.original.length;
      for (var i = '', n = this.firstChunk; n && (n.start > e || n.end <= e); ) {
        if (n.start < r && n.end >= r) return i;
        n = n.next;
      }
      if (n && n.edited && n.start !== e)
        throw new Error('Cannot use replaced character ' + e + ' as slice start anchor.');
      for (var o = n; n; ) {
        n.intro && (o !== n || n.start === e) && (i += n.intro);
        var u = n.start < r && n.end >= r;
        if (u && n.edited && n.end !== r)
          throw new Error('Cannot use replaced character ' + r + ' as slice end anchor.');
        var c = o === n ? e - n.start : 0,
          h = u ? n.content.length + r - n.end : n.content.length;
        if (((i += n.content.slice(c, h)), n.outro && (!u || n.end === r) && (i += n.outro), u)) break;
        n = n.next;
      }
      return i;
    },
    snip: function (e, r) {
      var s = this.clone();
      return s.remove(0, e), s.remove(r, s.original.length), s;
    },
    _split: function (e) {
      var r = this;
      if (!(this.byStart[e] || this.byEnd[e]))
        for (var s = this.lastSearchedChunk, i = e > s.end; ; ) {
          if (s.contains(e)) return r._splitChunk(s, e);
          s = i ? r.byStart[s.end] : r.byEnd[s.start];
        }
    },
    _splitChunk: function (e, r) {
      if (e.edited && e.content.length) {
        var s = Ii(this.original)(r);
        throw new Error(
          'Cannot split a chunk that has already been edited (' +
            s.line +
            ':' +
            s.column +
            ' \u2013 "' +
            e.original +
            '")'
        );
      }
      var i = e.split(r);
      return (
        (this.byEnd[r] = e),
        (this.byStart[r] = i),
        (this.byEnd[i.end] = i),
        e === this.lastChunk && (this.lastChunk = i),
        (this.lastSearchedChunk = e),
        !0
      );
    },
    toString: function () {
      for (var e = this.intro, r = this.firstChunk; r; ) (e += r.toString()), (r = r.next);
      return e + this.outro;
    },
    trimLines: function () {
      return this.trim('[\\r\\n]');
    },
    trim: function (e) {
      return this.trimStart(e).trimEnd(e);
    },
    trimEnd: function (e) {
      var r = this,
        s = new RegExp((e || '\\s') + '+$');
      if (((this.outro = this.outro.replace(s, '')), this.outro.length)) return this;
      var i = this.lastChunk;
      do {
        var n = i.end,
          o = i.trimEnd(s);
        if ((i.end !== n && ((r.lastChunk = i.next), (r.byEnd[i.end] = i), (r.byStart[i.next.start] = i.next)), o))
          return r;
        i = i.previous;
      } while (i);
      return this;
    },
    trimStart: function (e) {
      var r = this,
        s = new RegExp('^' + (e || '\\s') + '+');
      if (((this.intro = this.intro.replace(s, '')), this.intro.length)) return this;
      var i = this.firstChunk;
      do {
        var n = i.end,
          o = i.trimStart(s);
        if (
          (i.end !== n &&
            (i === r.lastChunk && (r.lastChunk = i.next), (r.byEnd[i.end] = i), (r.byStart[i.next.start] = i.next)),
          o)
        )
          return r;
        i = i.next;
      } while (i);
      return this;
    },
  };
  var Ri = Object.prototype.hasOwnProperty;
  function Xe(t) {
    t === void 0 && (t = {}),
      (this.intro = t.intro || ''),
      (this.separator =
        t.separator !== void 0
          ? t.separator
          : `
`),
      (this.sources = []),
      (this.uniqueSources = []),
      (this.uniqueSourceIndexByFilename = {});
  }
  Xe.prototype = {
    addSource: function (e) {
      if (e instanceof Bt) return this.addSource({ content: e, filename: e.filename, separator: this.separator });
      if (!_i(e) || !e.content)
        throw new Error(
          'bundle.addSource() takes an object with a `content` property, which should be an instance of MagicString, and an optional `filename`'
        );
      if (
        (['filename', 'indentExclusionRanges', 'separator'].forEach(function (s) {
          Ri.call(e, s) || (e[s] = e.content[s]);
        }),
        e.separator === void 0 && (e.separator = this.separator),
        e.filename)
      )
        if (!Ri.call(this.uniqueSourceIndexByFilename, e.filename))
          (this.uniqueSourceIndexByFilename[e.filename] = this.uniqueSources.length),
            this.uniqueSources.push({ filename: e.filename, content: e.content.original });
        else {
          var r = this.uniqueSources[this.uniqueSourceIndexByFilename[e.filename]];
          if (e.content.original !== r.content)
            throw new Error('Illegal source: same filename (' + e.filename + '), different contents');
        }
      return this.sources.push(e), this;
    },
    append: function (e, r) {
      return this.addSource({ content: new Bt(e), separator: (r && r.separator) || '' }), this;
    },
    clone: function () {
      var e = new Xe({ intro: this.intro, separator: this.separator });
      return (
        this.sources.forEach(function (r) {
          e.addSource({ filename: r.filename, content: r.content.clone(), separator: r.separator });
        }),
        e
      );
    },
    generateMap: function (e) {
      var r = this;
      e = e || {};
      var s = {},
        i = [];
      this.sources.forEach(function (o) {
        Object.keys(o.content.storedNames).forEach(function (u) {
          ~i.indexOf(u) || i.push(u);
        });
      });
      var n =
        ve(this.intro) +
        this.sources
          .map(function (o, u) {
            var c = u > 0 ? ve(o.separator) || ',' : '',
              h;
            if (!o.filename) h = ve(o.content.toString());
            else {
              var p = r.uniqueSourceIndexByFilename[o.filename];
              h = o.content.getMappings(e.hires, p, s, i);
            }
            return c + h;
          })
          .join('');
      return new Ye({
        file: e.file ? e.file.split(/[\/\\]/).pop() : null,
        sources: this.uniqueSources.map(function (o) {
          return e.file ? Bi(e.file, o.filename) : o.filename;
        }),
        sourcesContent: this.uniqueSources.map(function (o) {
          return e.includeContent ? o.content : null;
        }),
        names: i,
        mappings: n,
      });
    },
    getIndentString: function () {
      var e = {};
      return (
        this.sources.forEach(function (r) {
          var s = r.content.indentStr;
          s !== null && (e[s] || (e[s] = 0), (e[s] += 1));
        }),
        Object.keys(e).sort(function (r, s) {
          return e[r] - e[s];
        })[0] || '	'
      );
    },
    indent: function (e) {
      var r = this;
      if ((arguments.length || (e = this.getIndentString()), e === '')) return this;
      var s =
        !this.intro ||
        this.intro.slice(-1) ===
          `
`;
      return (
        this.sources.forEach(function (i, n) {
          var o = i.separator !== void 0 ? i.separator : r.separator,
            u = s || (n > 0 && /\r?\n$/.test(o));
          i.content.indent(e, { exclude: i.indentExclusionRanges, indentStart: u }),
            (s =
              i.content.toString().slice(0, -1) ===
              `
`);
        }),
        this.intro &&
          (this.intro =
            e +
            this.intro.replace(/^[^\n]/gm, function (i, n) {
              return n > 0 ? e + i : i;
            })),
        this
      );
    },
    prepend: function (e) {
      return (this.intro = e + this.intro), this;
    },
    toString: function () {
      var e = this,
        r = this.sources
          .map(function (s, i) {
            var n = s.separator !== void 0 ? s.separator : e.separator,
              o = (i > 0 ? n : '') + s.content.toString();
            return o;
          })
          .join('');
      return this.intro + r;
    },
    trimLines: function () {
      return this.trim('[\\r\\n]');
    },
    trim: function (e) {
      return this.trimStart(e).trimEnd(e);
    },
    trimStart: function (e) {
      var r = this,
        s = new RegExp('^' + (e || '\\s') + '+');
      if (((this.intro = this.intro.replace(s, '')), !this.intro)) {
        var i,
          n = 0;
        do {
          if (((i = r.sources[n]), !i)) break;
          i.content.trimStart(e), (n += 1);
        } while (i.content.toString() === '');
      }
      return this;
    },
    trimEnd: function (e) {
      var r = this,
        s = new RegExp((e || '\\s') + '+$'),
        i,
        n = this.sources.length - 1;
      do {
        if (((i = r.sources[n]), !i)) {
          r.intro = r.intro.replace(s, '');
          break;
        }
        i.content.trimEnd(e), (n -= 1);
      } while (i.content.toString() === '');
      return this;
    },
  };
  Bt.Bundle = Xe;
  qi.exports = Bt;
});
var Qt = x(Qe => {
  'use strict';
  var mc = q(),
    xc = fe(),
    yc = J(),
    vc = I().mkFieldSplitToken;
  Qe.mark = function (e, r, s) {
    if (typeof s.resolveEnv == 'function' && r[0] !== "'" && r[0] !== '"') {
      let i = s.resolveEnv('IFS');
      if (i !== null) return e.replace(new RegExp(`[${i}]+`, 'g'), '\0');
    }
    return e;
  };
  Qe.split = () =>
    yc(
      xc,
      mc(t => {
        if (t.is('WORD')) {
          let e = t.value.split('\0');
          if (e.length > 1) {
            let r = 0;
            return e.map(s => vc(t, s, r++));
          }
        }
        return t;
      })
    );
});
var Ui = x((Gp, Wi) => {
  'use strict';
  var Ec = Fi(),
    gc = Be(),
    ji = q(),
    Ac = Oi(),
    Cc = Ee(),
    $i = I(),
    bc = Qt(),
    Mi = (t, e) => {
      let r = Ec(t, (s, i) => {
        if (typeof i == 'function') {
          let n = i(e);
          return [s, n];
        }
        return typeof i == 'object' && s !== 'expand' ? [s, Mi(i, e)] : [s, i];
      });
      if (r.expand) {
        let s = He();
        for (let i of r.expand) {
          let n = s(r[i], { mode: 'word-expansion' });
          r[i] = n.commands[0].name;
        }
        delete r.expand;
      }
      return r;
    };
  function wc(t, e) {
    let r = t.parameter;
    for (let s of Ac(e.parameterOperators)) {
      let i = new RegExp(s[0]),
        n = r.match(i);
      if (n) {
        let o = Mi(s[1], n);
        return gc(Object.assign(t, o), (u, c) => c !== void 0);
      }
    }
    return t;
  }
  var Vi = (t, e) =>
    ji(r =>
      r.is('WORD') || r.is('ASSIGNMENT_WORD')
        ? !r.expansion || r.expansion.length === 0
          ? r
          : $i.setExpansions(
              r,
              r.expansion.map(s => (s.type === 'parameter_expansion' ? wc(s, e.enums) : s))
            )
        : r
    );
  Vi.resolve = t =>
    ji(e => {
      if (e.is('WORD') || e.is('ASSIGNMENT_WORD')) {
        if (!t.resolveParameter || !e.expansion || e.expansion.length === 0) return e;
        let r = e.value,
          s = new Cc(r);
        for (let i of e.expansion)
          if (i.type === 'parameter_expansion') {
            let n = t.resolveParameter(i);
            (i.resolved = !0), s.overwrite(i.loc.start, i.loc.end + 1, bc.mark(n, r, t));
          }
        return $i.alterValue(e, s.toString());
      }
      return e;
    });
  Wi.exports = Vi;
});
var Xi = x((Kp, zi) => {
  'use strict';
  var Gi = q(),
    Sc = Ee(),
    Tc = I(),
    Pc = Qt();
  function Nc(t, e) {
    let r = t.command;
    e.value[t.loc.start - 1] === '`' && (r = r.replace(/\\`/g, '`'));
    let i = He()(r);
    return Object.assign({}, t, { command: r, commandAST: i });
  }
  var Ki = () =>
    Gi(t =>
      t.is('WORD') || t.is('ASSIGNMENT_WORD')
        ? !t.expansion || t.expansion.length === 0
          ? t
          : Tc.setExpansions(
              t,
              t.expansion.map(e => (e.type === 'command_expansion' ? Nc(e, t) : e))
            )
        : t
    );
  Ki.resolve = t =>
    Gi(e => {
      if (t.execCommand && e.expansion) {
        let r = e.value,
          s = new Sc(r);
        for (let i of e.expansion)
          if (i.type === 'command_expansion') {
            let n = t.execCommand(i);
            s.overwrite(i.loc.start, i.loc.end + 1, Pc.mark(n.replace(/\n+$/, ''), r, t)), (i.resolved = !0);
          }
        return e.alterValue(s.toString());
      }
      return e;
    });
  zi.exports = Ki;
});
var on = x(Zt => {
  'use strict';
  Object.defineProperty(Zt, '__esModule', { value: !0 });
  function ge(t) {
    return (
      (t = t.split(' ')),
      function (e) {
        return t.indexOf(e) >= 0;
      }
    );
  }
  var er = {
      6: ge('enum await'),
      strict: ge('implements interface let package private protected public static yield'),
      strictBind: ge('eval arguments'),
    },
    Fc = ge(
      'break case catch continue debugger default do else finally for function if return switch throw try var while with null true false instanceof typeof void delete new in this let const class extends export import yield super'
    ),
    ar =
      '\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u08A0-\u08B4\u08B6-\u08BD\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0AF9\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58-\u0C5A\u0C60\u0C61\u0C80\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D54-\u0D56\u0D5F-\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1C80-\u1C88\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2118-\u211D\u2124\u2126\u2128\u212A-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309B-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FD5\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA7AE\uA7B0-\uA7B7\uA7F7-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA8FD\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB65\uAB70-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC',
    tn =
      '\u200C\u200D\xB7\u0300-\u036F\u0387\u0483-\u0487\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u0610-\u061A\u064B-\u0669\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED\u06F0-\u06F9\u0711\u0730-\u074A\u07A6-\u07B0\u07C0-\u07C9\u07EB-\u07F3\u0816-\u0819\u081B-\u0823\u0825-\u0827\u0829-\u082D\u0859-\u085B\u08D4-\u08E1\u08E3-\u0903\u093A-\u093C\u093E-\u094F\u0951-\u0957\u0962\u0963\u0966-\u096F\u0981-\u0983\u09BC\u09BE-\u09C4\u09C7\u09C8\u09CB-\u09CD\u09D7\u09E2\u09E3\u09E6-\u09EF\u0A01-\u0A03\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A66-\u0A71\u0A75\u0A81-\u0A83\u0ABC\u0ABE-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AE2\u0AE3\u0AE6-\u0AEF\u0B01-\u0B03\u0B3C\u0B3E-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B62\u0B63\u0B66-\u0B6F\u0B82\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD7\u0BE6-\u0BEF\u0C00-\u0C03\u0C3E-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C62\u0C63\u0C66-\u0C6F\u0C81-\u0C83\u0CBC\u0CBE-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CE2\u0CE3\u0CE6-\u0CEF\u0D01-\u0D03\u0D3E-\u0D44\u0D46-\u0D48\u0D4A-\u0D4D\u0D57\u0D62\u0D63\u0D66-\u0D6F\u0D82\u0D83\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DE6-\u0DEF\u0DF2\u0DF3\u0E31\u0E34-\u0E3A\u0E47-\u0E4E\u0E50-\u0E59\u0EB1\u0EB4-\u0EB9\u0EBB\u0EBC\u0EC8-\u0ECD\u0ED0-\u0ED9\u0F18\u0F19\u0F20-\u0F29\u0F35\u0F37\u0F39\u0F3E\u0F3F\u0F71-\u0F84\u0F86\u0F87\u0F8D-\u0F97\u0F99-\u0FBC\u0FC6\u102B-\u103E\u1040-\u1049\u1056-\u1059\u105E-\u1060\u1062-\u1064\u1067-\u106D\u1071-\u1074\u1082-\u108D\u108F-\u109D\u135D-\u135F\u1369-\u1371\u1712-\u1714\u1732-\u1734\u1752\u1753\u1772\u1773\u17B4-\u17D3\u17DD\u17E0-\u17E9\u180B-\u180D\u1810-\u1819\u18A9\u1920-\u192B\u1930-\u193B\u1946-\u194F\u19D0-\u19DA\u1A17-\u1A1B\u1A55-\u1A5E\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1AB0-\u1ABD\u1B00-\u1B04\u1B34-\u1B44\u1B50-\u1B59\u1B6B-\u1B73\u1B80-\u1B82\u1BA1-\u1BAD\u1BB0-\u1BB9\u1BE6-\u1BF3\u1C24-\u1C37\u1C40-\u1C49\u1C50-\u1C59\u1CD0-\u1CD2\u1CD4-\u1CE8\u1CED\u1CF2-\u1CF4\u1CF8\u1CF9\u1DC0-\u1DF5\u1DFB-\u1DFF\u203F\u2040\u2054\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2CEF-\u2CF1\u2D7F\u2DE0-\u2DFF\u302A-\u302F\u3099\u309A\uA620-\uA629\uA66F\uA674-\uA67D\uA69E\uA69F\uA6F0\uA6F1\uA802\uA806\uA80B\uA823-\uA827\uA880\uA881\uA8B4-\uA8C5\uA8D0-\uA8D9\uA8E0-\uA8F1\uA900-\uA909\uA926-\uA92D\uA947-\uA953\uA980-\uA983\uA9B3-\uA9C0\uA9D0-\uA9D9\uA9E5\uA9F0-\uA9F9\uAA29-\uAA36\uAA43\uAA4C\uAA4D\uAA50-\uAA59\uAA7B-\uAA7D\uAAB0\uAAB2-\uAAB4\uAAB7\uAAB8\uAABE\uAABF\uAAC1\uAAEB-\uAAEF\uAAF5\uAAF6\uABE3-\uABEA\uABEC\uABED\uABF0-\uABF9\uFB1E\uFE00-\uFE0F\uFE20-\uFE2F\uFE33\uFE34\uFE4D-\uFE4F\uFF10-\uFF19\uFF3F',
    kc = new RegExp('[' + ar + ']'),
    Oc = new RegExp('[' + ar + tn + ']');
  ar = tn = null;
  var en = [
      0, 11, 2, 25, 2, 18, 2, 1, 2, 14, 3, 13, 35, 122, 70, 52, 268, 28, 4, 48, 48, 31, 17, 26, 6, 37, 11, 29, 3, 35, 5,
      7, 2, 4, 43, 157, 19, 35, 5, 35, 5, 39, 9, 51, 157, 310, 10, 21, 11, 7, 153, 5, 3, 0, 2, 43, 2, 1, 4, 0, 3, 22,
      11, 22, 10, 30, 66, 18, 2, 1, 11, 21, 11, 25, 71, 55, 7, 1, 65, 0, 16, 3, 2, 2, 2, 26, 45, 28, 4, 28, 36, 7, 2,
      27, 28, 53, 11, 21, 11, 18, 14, 17, 111, 72, 56, 50, 14, 50, 785, 52, 76, 44, 33, 24, 27, 35, 42, 34, 4, 0, 13,
      47, 15, 3, 22, 0, 2, 0, 36, 17, 2, 24, 85, 6, 2, 0, 2, 3, 2, 14, 2, 9, 8, 46, 39, 7, 3, 1, 3, 21, 2, 6, 2, 1, 2,
      4, 4, 0, 19, 0, 13, 4, 159, 52, 19, 3, 54, 47, 21, 1, 2, 0, 185, 46, 42, 3, 37, 47, 21, 0, 60, 42, 86, 25, 391,
      63, 32, 0, 449, 56, 264, 8, 2, 36, 18, 0, 50, 29, 881, 921, 103, 110, 18, 195, 2749, 1070, 4050, 582, 8634, 568,
      8, 30, 114, 29, 19, 47, 17, 3, 32, 20, 6, 18, 881, 68, 12, 0, 67, 12, 65, 0, 32, 6124, 20, 754, 9486, 1, 3071,
      106, 6, 12, 4, 8, 8, 9, 5991, 84, 2, 70, 2, 1, 3, 0, 3, 1, 3, 3, 2, 11, 2, 0, 2, 6, 2, 64, 2, 3, 3, 7, 2, 6, 2,
      27, 2, 3, 2, 4, 2, 0, 4, 6, 2, 339, 3, 24, 2, 24, 2, 30, 2, 24, 2, 30, 2, 24, 2, 30, 2, 24, 2, 30, 2, 24, 2, 7,
      4149, 196, 60, 67, 1213, 3, 2, 26, 2, 1, 2, 0, 3, 0, 2, 9, 2, 3, 2, 0, 2, 0, 7, 0, 5, 0, 2, 0, 2, 0, 2, 2, 2, 1,
      2, 0, 3, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 1, 2, 0, 3, 3, 2, 6, 2, 3, 2, 3, 2, 0, 2, 9, 2, 16, 6, 2, 2, 4, 2, 16,
      4421, 42710, 42, 4148, 12, 221, 3, 5761, 10591, 541,
    ],
    Dc = [
      509, 0, 227, 0, 150, 4, 294, 9, 1368, 2, 2, 1, 6, 3, 41, 2, 5, 0, 166, 1, 1306, 2, 54, 14, 32, 9, 16, 3, 46, 10,
      54, 9, 7, 2, 37, 13, 2, 9, 52, 0, 13, 2, 49, 13, 10, 2, 4, 9, 83, 11, 7, 0, 161, 11, 6, 9, 7, 3, 57, 0, 2, 6, 3,
      1, 3, 2, 10, 0, 11, 1, 3, 6, 4, 4, 193, 17, 10, 9, 87, 19, 13, 9, 214, 6, 3, 8, 28, 1, 83, 16, 16, 9, 82, 12, 9,
      9, 84, 14, 5, 9, 423, 9, 838, 7, 2, 7, 17, 9, 57, 21, 2, 13, 19882, 9, 135, 4, 60, 6, 26, 9, 1016, 45, 17, 3,
      19723, 1, 5319, 4, 4, 5, 9, 7, 3, 6, 31, 3, 149, 2, 1418, 49, 513, 54, 5, 49, 9, 0, 15, 0, 23, 4, 2, 14, 1361, 6,
      2, 16, 3, 6, 2, 1, 2, 4, 2214, 6, 110, 6, 6, 9, 792487, 239,
    ];
  function rr(t, e) {
    for (var r = 65536, s = 0; s < e.length; s += 2) {
      if (((r += e[s]), r > t)) return !1;
      if (((r += e[s + 1]), r >= t)) return !0;
    }
  }
  function Ht(t) {
    return t < 65
      ? t === 36
      : t < 91
        ? !0
        : t < 97
          ? t === 95
          : t < 123
            ? !0
            : t <= 65535
              ? t >= 170 && kc.test(String.fromCharCode(t))
              : rr(t, en);
  }
  function sr(t) {
    return t < 48
      ? t === 36
      : t < 58
        ? !0
        : t < 65
          ? !1
          : t < 91
            ? !0
            : t < 97
              ? t === 95
              : t < 123
                ? !0
                : t <= 65535
                  ? t >= 170 && Oc.test(String.fromCharCode(t))
                  : rr(t, en) || rr(t, Dc);
  }
  var Yi = {
    sourceType: 'script',
    sourceFilename: void 0,
    startLine: 1,
    allowReturnOutsideFunction: !1,
    allowImportExportEverywhere: !1,
    allowSuperOutsideMethod: !1,
    plugins: [],
    strictMode: null,
  };
  function Lc(t) {
    var e = {};
    for (var r in Yi) e[r] = t && r in t ? t[r] : Yi[r];
    return e;
  }
  var Rc =
      typeof Symbol == 'function' && typeof Symbol.iterator == 'symbol'
        ? function (t) {
            return typeof t;
          }
        : function (t) {
            return t && typeof Symbol == 'function' && t.constructor === Symbol && t !== Symbol.prototype
              ? 'symbol'
              : typeof t;
          },
    ut = function (t, e) {
      if (!(t instanceof e)) throw new TypeError('Cannot call a class as a function');
    },
    or = function (t, e) {
      if (typeof e != 'function' && e !== null)
        throw new TypeError('Super expression must either be null or a function, not ' + typeof e);
      (t.prototype = Object.create(e && e.prototype, {
        constructor: { value: t, enumerable: !1, writable: !0, configurable: !0 },
      })),
        e && (Object.setPrototypeOf ? Object.setPrototypeOf(t, e) : (t.__proto__ = e));
    },
    ur = function (t, e) {
      if (!t) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
      return e && (typeof e == 'object' || typeof e == 'function') ? e : t;
    },
    R = !0,
    B = !0,
    Je = !0,
    Qi = !0,
    _t = !0,
    Ic = !0,
    D = function t(e) {
      var r = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
      ut(this, t),
        (this.label = e),
        (this.keyword = r.keyword),
        (this.beforeExpr = !!r.beforeExpr),
        (this.startsExpr = !!r.startsExpr),
        (this.rightAssociative = !!r.rightAssociative),
        (this.isLoop = !!r.isLoop),
        (this.isAssign = !!r.isAssign),
        (this.prefix = !!r.prefix),
        (this.postfix = !!r.postfix),
        (this.binop = r.binop || null),
        (this.updateContext = null);
    },
    O = (function (t) {
      or(e, t);
      function e(r) {
        var s = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        return ut(this, e), (s.keyword = r), ur(this, t.call(this, r, s));
      }
      return e;
    })(D),
    ot = (function (t) {
      or(e, t);
      function e(r, s) {
        return ut(this, e), ur(this, t.call(this, r, { beforeExpr: R, binop: s }));
      }
      return e;
    })(D),
    a = {
      num: new D('num', { startsExpr: B }),
      regexp: new D('regexp', { startsExpr: B }),
      string: new D('string', { startsExpr: B }),
      name: new D('name', { startsExpr: B }),
      eof: new D('eof'),
      bracketL: new D('[', { beforeExpr: R, startsExpr: B }),
      bracketR: new D(']'),
      braceL: new D('{', { beforeExpr: R, startsExpr: B }),
      braceBarL: new D('{|', { beforeExpr: R, startsExpr: B }),
      braceR: new D('}'),
      braceBarR: new D('|}'),
      parenL: new D('(', { beforeExpr: R, startsExpr: B }),
      parenR: new D(')'),
      comma: new D(',', { beforeExpr: R }),
      semi: new D(';', { beforeExpr: R }),
      colon: new D(':', { beforeExpr: R }),
      doubleColon: new D('::', { beforeExpr: R }),
      dot: new D('.'),
      question: new D('?', { beforeExpr: R }),
      arrow: new D('=>', { beforeExpr: R }),
      template: new D('template'),
      ellipsis: new D('...', { beforeExpr: R }),
      backQuote: new D('`', { startsExpr: B }),
      dollarBraceL: new D('${', { beforeExpr: R, startsExpr: B }),
      at: new D('@'),
      eq: new D('=', { beforeExpr: R, isAssign: Qi }),
      assign: new D('_=', { beforeExpr: R, isAssign: Qi }),
      incDec: new D('++/--', { prefix: _t, postfix: Ic, startsExpr: B }),
      prefix: new D('prefix', { beforeExpr: R, prefix: _t, startsExpr: B }),
      logicalOR: new ot('||', 1),
      logicalAND: new ot('&&', 2),
      bitwiseOR: new ot('|', 3),
      bitwiseXOR: new ot('^', 4),
      bitwiseAND: new ot('&', 5),
      equality: new ot('==/!=', 6),
      relational: new ot('</>', 7),
      bitShift: new ot('<</>>', 8),
      plusMin: new D('+/-', { beforeExpr: R, binop: 9, prefix: _t, startsExpr: B }),
      modulo: new ot('%', 10),
      star: new ot('*', 10),
      slash: new ot('/', 10),
      exponent: new D('**', { beforeExpr: R, binop: 11, rightAssociative: !0 }),
    },
    ir = {
      break: new O('break'),
      case: new O('case', { beforeExpr: R }),
      catch: new O('catch'),
      continue: new O('continue'),
      debugger: new O('debugger'),
      default: new O('default', { beforeExpr: R }),
      do: new O('do', { isLoop: Je, beforeExpr: R }),
      else: new O('else', { beforeExpr: R }),
      finally: new O('finally'),
      for: new O('for', { isLoop: Je }),
      function: new O('function', { startsExpr: B }),
      if: new O('if'),
      return: new O('return', { beforeExpr: R }),
      switch: new O('switch'),
      throw: new O('throw', { beforeExpr: R }),
      try: new O('try'),
      var: new O('var'),
      let: new O('let'),
      const: new O('const'),
      while: new O('while', { isLoop: Je }),
      with: new O('with'),
      new: new O('new', { beforeExpr: R, startsExpr: B }),
      this: new O('this', { startsExpr: B }),
      super: new O('super', { startsExpr: B }),
      class: new O('class'),
      extends: new O('extends', { beforeExpr: R }),
      export: new O('export'),
      import: new O('import', { startsExpr: B }),
      yield: new O('yield', { beforeExpr: R, startsExpr: B }),
      null: new O('null', { startsExpr: B }),
      true: new O('true', { startsExpr: B }),
      false: new O('false', { startsExpr: B }),
      in: new O('in', { beforeExpr: R, binop: 7 }),
      instanceof: new O('instanceof', { beforeExpr: R, binop: 7 }),
      typeof: new O('typeof', { beforeExpr: R, prefix: _t, startsExpr: B }),
      void: new O('void', { beforeExpr: R, prefix: _t, startsExpr: B }),
      delete: new O('delete', { beforeExpr: R, prefix: _t, startsExpr: B }),
    };
  Object.keys(ir).forEach(function (t) {
    a['_' + t] = ir[t];
  });
  var Pt = /\r\n?|\n|\u2028|\u2029/,
    Ae = new RegExp(Pt.source, 'g');
  function Ce(t) {
    return t === 10 || t === 13 || t === 8232 || t === 8233;
  }
  var Bc = /[\u1680\u180e\u2000-\u200a\u202f\u205f\u3000\ufeff]/,
    mt = function t(e, r, s, i) {
      ut(this, t), (this.token = e), (this.isExpr = !!r), (this.preserveSpace = !!s), (this.override = i);
    },
    L = {
      braceStatement: new mt('{', !1),
      braceExpression: new mt('{', !0),
      templateQuasi: new mt('${', !0),
      parenStatement: new mt('(', !1),
      parenExpression: new mt('(', !0),
      template: new mt('`', !0, !0, function (t) {
        return t.readTmplToken();
      }),
      functionExpression: new mt('function', !0),
    };
  a.parenR.updateContext = a.braceR.updateContext = function () {
    if (this.state.context.length === 1) {
      this.state.exprAllowed = !0;
      return;
    }
    var t = this.state.context.pop();
    t === L.braceStatement && this.curContext() === L.functionExpression
      ? (this.state.context.pop(), (this.state.exprAllowed = !1))
      : t === L.templateQuasi
        ? (this.state.exprAllowed = !0)
        : (this.state.exprAllowed = !t.isExpr);
  };
  a.name.updateContext = function (t) {
    (this.state.exprAllowed = !1),
      (t === a._let || t === a._const || t === a._var) &&
        Pt.test(this.input.slice(this.state.end)) &&
        (this.state.exprAllowed = !0);
  };
  a.braceL.updateContext = function (t) {
    this.state.context.push(this.braceIsBlock(t) ? L.braceStatement : L.braceExpression), (this.state.exprAllowed = !0);
  };
  a.dollarBraceL.updateContext = function () {
    this.state.context.push(L.templateQuasi), (this.state.exprAllowed = !0);
  };
  a.parenL.updateContext = function (t) {
    var e = t === a._if || t === a._for || t === a._with || t === a._while;
    this.state.context.push(e ? L.parenStatement : L.parenExpression), (this.state.exprAllowed = !0);
  };
  a.incDec.updateContext = function () {};
  a._function.updateContext = function () {
    this.curContext() !== L.braceStatement && this.state.context.push(L.functionExpression),
      (this.state.exprAllowed = !1);
  };
  a.backQuote.updateContext = function () {
    this.curContext() === L.template ? this.state.context.pop() : this.state.context.push(L.template),
      (this.state.exprAllowed = !1);
  };
  var rn = function t(e, r) {
      ut(this, t), (this.line = e), (this.column = r);
    },
    cr = function t(e, r) {
      ut(this, t), (this.start = e), (this.end = r);
    };
  function _c(t, e) {
    for (var r = 1, s = 0; ; ) {
      Ae.lastIndex = s;
      var i = Ae.exec(t);
      if (i && i.index < e) ++r, (s = i.index + i[0].length);
      else return new rn(r, e - s);
    }
  }
  var qc = (function () {
      function t() {
        ut(this, t);
      }
      return (
        (t.prototype.init = function (r, s) {
          return (
            (this.strict = r.strictMode === !1 ? !1 : r.sourceType === 'module'),
            (this.input = s),
            (this.potentialArrowAt = -1),
            (this.inMethod =
              this.inFunction =
              this.inGenerator =
              this.inAsync =
              this.inPropertyName =
              this.inType =
              this.inClassProperty =
              this.noAnonFunctionType =
                !1),
            (this.labels = []),
            (this.decorators = []),
            (this.tokens = []),
            (this.comments = []),
            (this.trailingComments = []),
            (this.leadingComments = []),
            (this.commentStack = []),
            (this.pos = this.lineStart = 0),
            (this.curLine = r.startLine),
            (this.type = a.eof),
            (this.value = null),
            (this.start = this.end = this.pos),
            (this.startLoc = this.endLoc = this.curPosition()),
            (this.lastTokEndLoc = this.lastTokStartLoc = null),
            (this.lastTokStart = this.lastTokEnd = this.pos),
            (this.context = [L.braceStatement]),
            (this.exprAllowed = !0),
            (this.containsEsc = this.containsOctal = !1),
            (this.octalPosition = null),
            (this.invalidTemplateEscapePosition = null),
            (this.exportedIdentifiers = []),
            this
          );
        }),
        (t.prototype.curPosition = function () {
          return new rn(this.curLine, this.pos - this.lineStart);
        }),
        (t.prototype.clone = function (r) {
          var s = new t();
          for (var i in this) {
            var n = this[i];
            (!r || i === 'context') && Array.isArray(n) && (n = n.slice()), (s[i] = n);
          }
          return s;
        }),
        t
      );
    })(),
    jc = function t(e) {
      ut(this, t),
        (this.type = e.type),
        (this.value = e.value),
        (this.start = e.start),
        (this.end = e.end),
        (this.loc = new cr(e.startLoc, e.endLoc));
    };
  function Ze(t) {
    return t <= 65535
      ? String.fromCharCode(t)
      : String.fromCharCode(((t - 65536) >> 10) + 55296, ((t - 65536) & 1023) + 56320);
  }
  var $c = (function () {
      function t(e, r) {
        ut(this, t), (this.state = new qc()), this.state.init(e, r);
      }
      return (
        (t.prototype.next = function () {
          this.isLookahead || this.state.tokens.push(new jc(this.state)),
            (this.state.lastTokEnd = this.state.end),
            (this.state.lastTokStart = this.state.start),
            (this.state.lastTokEndLoc = this.state.endLoc),
            (this.state.lastTokStartLoc = this.state.startLoc),
            this.nextToken();
        }),
        (t.prototype.eat = function (r) {
          return this.match(r) ? (this.next(), !0) : !1;
        }),
        (t.prototype.match = function (r) {
          return this.state.type === r;
        }),
        (t.prototype.isKeyword = function (r) {
          return Fc(r);
        }),
        (t.prototype.lookahead = function () {
          var r = this.state;
          (this.state = r.clone(!0)), (this.isLookahead = !0), this.next(), (this.isLookahead = !1);
          var s = this.state.clone(!0);
          return (this.state = r), s;
        }),
        (t.prototype.setStrict = function (r) {
          if (((this.state.strict = r), !(!this.match(a.num) && !this.match(a.string)))) {
            for (this.state.pos = this.state.start; this.state.pos < this.state.lineStart; )
              (this.state.lineStart =
                this.input.lastIndexOf(
                  `
`,
                  this.state.lineStart - 2
                ) + 1),
                --this.state.curLine;
            this.nextToken();
          }
        }),
        (t.prototype.curContext = function () {
          return this.state.context[this.state.context.length - 1];
        }),
        (t.prototype.nextToken = function () {
          var r = this.curContext();
          return (
            (!r || !r.preserveSpace) && this.skipSpace(),
            (this.state.containsOctal = !1),
            (this.state.octalPosition = null),
            (this.state.start = this.state.pos),
            (this.state.startLoc = this.state.curPosition()),
            this.state.pos >= this.input.length
              ? this.finishToken(a.eof)
              : r.override
                ? r.override(this)
                : this.readToken(this.fullCharCodeAtPos())
          );
        }),
        (t.prototype.readToken = function (r) {
          return Ht(r) || r === 92 ? this.readWord() : this.getTokenFromCode(r);
        }),
        (t.prototype.fullCharCodeAtPos = function () {
          var r = this.input.charCodeAt(this.state.pos);
          if (r <= 55295 || r >= 57344) return r;
          var s = this.input.charCodeAt(this.state.pos + 1);
          return (r << 10) + s - 56613888;
        }),
        (t.prototype.pushComment = function (r, s, i, n, o, u) {
          var c = { type: r ? 'CommentBlock' : 'CommentLine', value: s, start: i, end: n, loc: new cr(o, u) };
          this.isLookahead || (this.state.tokens.push(c), this.state.comments.push(c), this.addComment(c));
        }),
        (t.prototype.skipBlockComment = function () {
          var r = this.state.curPosition(),
            s = this.state.pos,
            i = this.input.indexOf('*/', (this.state.pos += 2));
          i === -1 && this.raise(this.state.pos - 2, 'Unterminated comment'),
            (this.state.pos = i + 2),
            (Ae.lastIndex = s);
          for (var n = void 0; (n = Ae.exec(this.input)) && n.index < this.state.pos; )
            ++this.state.curLine, (this.state.lineStart = n.index + n[0].length);
          this.pushComment(!0, this.input.slice(s + 2, i), s, this.state.pos, r, this.state.curPosition());
        }),
        (t.prototype.skipLineComment = function (r) {
          for (
            var s = this.state.pos, i = this.state.curPosition(), n = this.input.charCodeAt((this.state.pos += r));
            this.state.pos < this.input.length && n !== 10 && n !== 13 && n !== 8232 && n !== 8233;
          )
            ++this.state.pos, (n = this.input.charCodeAt(this.state.pos));
          this.pushComment(!1, this.input.slice(s + r, this.state.pos), s, this.state.pos, i, this.state.curPosition());
        }),
        (t.prototype.skipSpace = function () {
          t: for (; this.state.pos < this.input.length; ) {
            var r = this.input.charCodeAt(this.state.pos);
            switch (r) {
              case 32:
              case 160:
                ++this.state.pos;
                break;
              case 13:
                this.input.charCodeAt(this.state.pos + 1) === 10 && ++this.state.pos;
              case 10:
              case 8232:
              case 8233:
                ++this.state.pos, ++this.state.curLine, (this.state.lineStart = this.state.pos);
                break;
              case 47:
                switch (this.input.charCodeAt(this.state.pos + 1)) {
                  case 42:
                    this.skipBlockComment();
                    break;
                  case 47:
                    this.skipLineComment(2);
                    break;
                  default:
                    break t;
                }
                break;
              default:
                if ((r > 8 && r < 14) || (r >= 5760 && Bc.test(String.fromCharCode(r)))) ++this.state.pos;
                else break t;
            }
          }
        }),
        (t.prototype.finishToken = function (r, s) {
          (this.state.end = this.state.pos), (this.state.endLoc = this.state.curPosition());
          var i = this.state.type;
          (this.state.type = r), (this.state.value = s), this.updateContext(i);
        }),
        (t.prototype.readToken_dot = function () {
          var r = this.input.charCodeAt(this.state.pos + 1);
          if (r >= 48 && r <= 57) return this.readNumber(!0);
          var s = this.input.charCodeAt(this.state.pos + 2);
          return r === 46 && s === 46
            ? ((this.state.pos += 3), this.finishToken(a.ellipsis))
            : (++this.state.pos, this.finishToken(a.dot));
        }),
        (t.prototype.readToken_slash = function () {
          if (this.state.exprAllowed) return ++this.state.pos, this.readRegexp();
          var r = this.input.charCodeAt(this.state.pos + 1);
          return r === 61 ? this.finishOp(a.assign, 2) : this.finishOp(a.slash, 1);
        }),
        (t.prototype.readToken_mult_modulo = function (r) {
          var s = r === 42 ? a.star : a.modulo,
            i = 1,
            n = this.input.charCodeAt(this.state.pos + 1);
          return (
            n === 42 && (i++, (n = this.input.charCodeAt(this.state.pos + 2)), (s = a.exponent)),
            n === 61 && (i++, (s = a.assign)),
            this.finishOp(s, i)
          );
        }),
        (t.prototype.readToken_pipe_amp = function (r) {
          var s = this.input.charCodeAt(this.state.pos + 1);
          return s === r
            ? this.finishOp(r === 124 ? a.logicalOR : a.logicalAND, 2)
            : s === 61
              ? this.finishOp(a.assign, 2)
              : r === 124 && s === 125 && this.hasPlugin('flow')
                ? this.finishOp(a.braceBarR, 2)
                : this.finishOp(r === 124 ? a.bitwiseOR : a.bitwiseAND, 1);
        }),
        (t.prototype.readToken_caret = function () {
          var r = this.input.charCodeAt(this.state.pos + 1);
          return r === 61 ? this.finishOp(a.assign, 2) : this.finishOp(a.bitwiseXOR, 1);
        }),
        (t.prototype.readToken_plus_min = function (r) {
          var s = this.input.charCodeAt(this.state.pos + 1);
          return s === r
            ? s === 45 &&
              this.input.charCodeAt(this.state.pos + 2) === 62 &&
              Pt.test(this.input.slice(this.state.lastTokEnd, this.state.pos))
              ? (this.skipLineComment(3), this.skipSpace(), this.nextToken())
              : this.finishOp(a.incDec, 2)
            : s === 61
              ? this.finishOp(a.assign, 2)
              : this.finishOp(a.plusMin, 1);
        }),
        (t.prototype.readToken_lt_gt = function (r) {
          var s = this.input.charCodeAt(this.state.pos + 1),
            i = 1;
          return s === r
            ? ((i = r === 62 && this.input.charCodeAt(this.state.pos + 2) === 62 ? 3 : 2),
              this.input.charCodeAt(this.state.pos + i) === 61
                ? this.finishOp(a.assign, i + 1)
                : this.finishOp(a.bitShift, i))
            : s === 33 &&
                r === 60 &&
                this.input.charCodeAt(this.state.pos + 2) === 45 &&
                this.input.charCodeAt(this.state.pos + 3) === 45
              ? (this.inModule && this.unexpected(), this.skipLineComment(4), this.skipSpace(), this.nextToken())
              : (s === 61 && (i = 2), this.finishOp(a.relational, i));
        }),
        (t.prototype.readToken_eq_excl = function (r) {
          var s = this.input.charCodeAt(this.state.pos + 1);
          return s === 61
            ? this.finishOp(a.equality, this.input.charCodeAt(this.state.pos + 2) === 61 ? 3 : 2)
            : r === 61 && s === 62
              ? ((this.state.pos += 2), this.finishToken(a.arrow))
              : this.finishOp(r === 61 ? a.eq : a.prefix, 1);
        }),
        (t.prototype.getTokenFromCode = function (r) {
          switch (r) {
            case 46:
              return this.readToken_dot();
            case 40:
              return ++this.state.pos, this.finishToken(a.parenL);
            case 41:
              return ++this.state.pos, this.finishToken(a.parenR);
            case 59:
              return ++this.state.pos, this.finishToken(a.semi);
            case 44:
              return ++this.state.pos, this.finishToken(a.comma);
            case 91:
              return ++this.state.pos, this.finishToken(a.bracketL);
            case 93:
              return ++this.state.pos, this.finishToken(a.bracketR);
            case 123:
              return this.hasPlugin('flow') && this.input.charCodeAt(this.state.pos + 1) === 124
                ? this.finishOp(a.braceBarL, 2)
                : (++this.state.pos, this.finishToken(a.braceL));
            case 125:
              return ++this.state.pos, this.finishToken(a.braceR);
            case 58:
              return this.hasPlugin('functionBind') && this.input.charCodeAt(this.state.pos + 1) === 58
                ? this.finishOp(a.doubleColon, 2)
                : (++this.state.pos, this.finishToken(a.colon));
            case 63:
              return ++this.state.pos, this.finishToken(a.question);
            case 64:
              return ++this.state.pos, this.finishToken(a.at);
            case 96:
              return ++this.state.pos, this.finishToken(a.backQuote);
            case 48:
              var s = this.input.charCodeAt(this.state.pos + 1);
              if (s === 120 || s === 88) return this.readRadixNumber(16);
              if (s === 111 || s === 79) return this.readRadixNumber(8);
              if (s === 98 || s === 66) return this.readRadixNumber(2);
            case 49:
            case 50:
            case 51:
            case 52:
            case 53:
            case 54:
            case 55:
            case 56:
            case 57:
              return this.readNumber(!1);
            case 34:
            case 39:
              return this.readString(r);
            case 47:
              return this.readToken_slash();
            case 37:
            case 42:
              return this.readToken_mult_modulo(r);
            case 124:
            case 38:
              return this.readToken_pipe_amp(r);
            case 94:
              return this.readToken_caret();
            case 43:
            case 45:
              return this.readToken_plus_min(r);
            case 60:
            case 62:
              return this.readToken_lt_gt(r);
            case 61:
            case 33:
              return this.readToken_eq_excl(r);
            case 126:
              return this.finishOp(a.prefix, 1);
          }
          this.raise(this.state.pos, "Unexpected character '" + Ze(r) + "'");
        }),
        (t.prototype.finishOp = function (r, s) {
          var i = this.input.slice(this.state.pos, this.state.pos + s);
          return (this.state.pos += s), this.finishToken(r, i);
        }),
        (t.prototype.readRegexp = function () {
          for (var r = this.state.pos, s = void 0, i = void 0; ; ) {
            this.state.pos >= this.input.length && this.raise(r, 'Unterminated regular expression');
            var n = this.input.charAt(this.state.pos);
            if ((Pt.test(n) && this.raise(r, 'Unterminated regular expression'), s)) s = !1;
            else {
              if (n === '[') i = !0;
              else if (n === ']' && i) i = !1;
              else if (n === '/' && !i) break;
              s = n === '\\';
            }
            ++this.state.pos;
          }
          var o = this.input.slice(r, this.state.pos);
          ++this.state.pos;
          var u = this.readWord1();
          if (u) {
            var c = /^[gmsiyu]*$/;
            c.test(u) || this.raise(r, 'Invalid regular expression flag');
          }
          return this.finishToken(a.regexp, { pattern: o, flags: u });
        }),
        (t.prototype.readInt = function (r, s) {
          for (var i = this.state.pos, n = 0, o = 0, u = s ?? 1 / 0; o < u; ++o) {
            var c = this.input.charCodeAt(this.state.pos),
              h = void 0;
            if (
              (c >= 97
                ? (h = c - 97 + 10)
                : c >= 65
                  ? (h = c - 65 + 10)
                  : c >= 48 && c <= 57
                    ? (h = c - 48)
                    : (h = 1 / 0),
              h >= r)
            )
              break;
            ++this.state.pos, (n = n * r + h);
          }
          return this.state.pos === i || (s != null && this.state.pos - i !== s) ? null : n;
        }),
        (t.prototype.readRadixNumber = function (r) {
          this.state.pos += 2;
          var s = this.readInt(r);
          return (
            s == null && this.raise(this.state.start + 2, 'Expected number in radix ' + r),
            Ht(this.fullCharCodeAtPos()) && this.raise(this.state.pos, 'Identifier directly after number'),
            this.finishToken(a.num, s)
          );
        }),
        (t.prototype.readNumber = function (r) {
          var s = this.state.pos,
            i = this.input.charCodeAt(s) === 48,
            n = !1;
          !r && this.readInt(10) === null && this.raise(s, 'Invalid number'), i && this.state.pos == s + 1 && (i = !1);
          var o = this.input.charCodeAt(this.state.pos);
          o === 46 && !i && (++this.state.pos, this.readInt(10), (n = !0), (o = this.input.charCodeAt(this.state.pos))),
            (o === 69 || o === 101) &&
              !i &&
              ((o = this.input.charCodeAt(++this.state.pos)),
              (o === 43 || o === 45) && ++this.state.pos,
              this.readInt(10) === null && this.raise(s, 'Invalid number'),
              (n = !0)),
            Ht(this.fullCharCodeAtPos()) && this.raise(this.state.pos, 'Identifier directly after number');
          var u = this.input.slice(s, this.state.pos),
            c = void 0;
          return (
            n
              ? (c = parseFloat(u))
              : !i || u.length === 1
                ? (c = parseInt(u, 10))
                : this.state.strict
                  ? this.raise(s, 'Invalid number')
                  : /[89]/.test(u)
                    ? (c = parseInt(u, 10))
                    : (c = parseInt(u, 8)),
            this.finishToken(a.num, c)
          );
        }),
        (t.prototype.readCodePoint = function (r) {
          var s = this.input.charCodeAt(this.state.pos),
            i = void 0;
          if (s === 123) {
            var n = ++this.state.pos;
            if (
              ((i = this.readHexChar(this.input.indexOf('}', this.state.pos) - this.state.pos, r)),
              ++this.state.pos,
              i === null)
            )
              --this.state.invalidTemplateEscapePosition;
            else if (i > 1114111)
              if (r) this.raise(n, 'Code point out of bounds');
              else return (this.state.invalidTemplateEscapePosition = n - 2), null;
          } else i = this.readHexChar(4, r);
          return i;
        }),
        (t.prototype.readString = function (r) {
          for (var s = '', i = ++this.state.pos; ; ) {
            this.state.pos >= this.input.length && this.raise(this.state.start, 'Unterminated string constant');
            var n = this.input.charCodeAt(this.state.pos);
            if (n === r) break;
            n === 92
              ? ((s += this.input.slice(i, this.state.pos)), (s += this.readEscapedChar(!1)), (i = this.state.pos))
              : (Ce(n) && this.raise(this.state.start, 'Unterminated string constant'), ++this.state.pos);
          }
          return (s += this.input.slice(i, this.state.pos++)), this.finishToken(a.string, s);
        }),
        (t.prototype.readTmplToken = function () {
          for (var r = '', s = this.state.pos, i = !1; ; ) {
            this.state.pos >= this.input.length && this.raise(this.state.start, 'Unterminated template');
            var n = this.input.charCodeAt(this.state.pos);
            if (n === 96 || (n === 36 && this.input.charCodeAt(this.state.pos + 1) === 123))
              return this.state.pos === this.state.start && this.match(a.template)
                ? n === 36
                  ? ((this.state.pos += 2), this.finishToken(a.dollarBraceL))
                  : (++this.state.pos, this.finishToken(a.backQuote))
                : ((r += this.input.slice(s, this.state.pos)), this.finishToken(a.template, i ? null : r));
            if (n === 92) {
              r += this.input.slice(s, this.state.pos);
              var o = this.readEscapedChar(!0);
              o === null ? (i = !0) : (r += o), (s = this.state.pos);
            } else if (Ce(n)) {
              switch (((r += this.input.slice(s, this.state.pos)), ++this.state.pos, n)) {
                case 13:
                  this.input.charCodeAt(this.state.pos) === 10 && ++this.state.pos;
                case 10:
                  r += `
`;
                  break;
                default:
                  r += String.fromCharCode(n);
                  break;
              }
              ++this.state.curLine, (this.state.lineStart = this.state.pos), (s = this.state.pos);
            } else ++this.state.pos;
          }
        }),
        (t.prototype.readEscapedChar = function (r) {
          var s = !r,
            i = this.input.charCodeAt(++this.state.pos);
          switch ((++this.state.pos, i)) {
            case 110:
              return `
`;
            case 114:
              return '\r';
            case 120: {
              var n = this.readHexChar(2, s);
              return n === null ? null : String.fromCharCode(n);
            }
            case 117: {
              var o = this.readCodePoint(s);
              return o === null ? null : Ze(o);
            }
            case 116:
              return '	';
            case 98:
              return '\b';
            case 118:
              return '\v';
            case 102:
              return '\f';
            case 13:
              this.input.charCodeAt(this.state.pos) === 10 && ++this.state.pos;
            case 10:
              return (this.state.lineStart = this.state.pos), ++this.state.curLine, '';
            default:
              if (i >= 48 && i <= 55) {
                var u = this.state.pos - 1,
                  c = this.input.substr(this.state.pos - 1, 3).match(/^[0-7]+/)[0],
                  h = parseInt(c, 8);
                if ((h > 255 && ((c = c.slice(0, -1)), (h = parseInt(c, 8))), h > 0)) {
                  if (r) return (this.state.invalidTemplateEscapePosition = u), null;
                  this.state.strict
                    ? this.raise(u, 'Octal literal in strict mode')
                    : this.state.containsOctal || ((this.state.containsOctal = !0), (this.state.octalPosition = u));
                }
                return (this.state.pos += c.length - 1), String.fromCharCode(h);
              }
              return String.fromCharCode(i);
          }
        }),
        (t.prototype.readHexChar = function (r, s) {
          var i = this.state.pos,
            n = this.readInt(16, r);
          return (
            n === null &&
              (s
                ? this.raise(i, 'Bad character escape sequence')
                : ((this.state.pos = i - 1), (this.state.invalidTemplateEscapePosition = i - 1))),
            n
          );
        }),
        (t.prototype.readWord1 = function () {
          this.state.containsEsc = !1;
          for (var r = '', s = !0, i = this.state.pos; this.state.pos < this.input.length; ) {
            var n = this.fullCharCodeAtPos();
            if (sr(n)) this.state.pos += n <= 65535 ? 1 : 2;
            else if (n === 92) {
              (this.state.containsEsc = !0), (r += this.input.slice(i, this.state.pos));
              var o = this.state.pos;
              this.input.charCodeAt(++this.state.pos) !== 117 &&
                this.raise(this.state.pos, 'Expecting Unicode escape sequence \\uXXXX'),
                ++this.state.pos;
              var u = this.readCodePoint(!0);
              (s ? Ht : sr)(u, !0) || this.raise(o, 'Invalid Unicode escape'), (r += Ze(u)), (i = this.state.pos);
            } else break;
            s = !1;
          }
          return r + this.input.slice(i, this.state.pos);
        }),
        (t.prototype.readWord = function () {
          var r = this.readWord1(),
            s = a.name;
          return !this.state.containsEsc && this.isKeyword(r) && (s = ir[r]), this.finishToken(s, r);
        }),
        (t.prototype.braceIsBlock = function (r) {
          if (r === a.colon) {
            var s = this.curContext();
            if (s === L.braceStatement || s === L.braceExpression) return !s.isExpr;
          }
          return r === a._return
            ? Pt.test(this.input.slice(this.state.lastTokEnd, this.state.start))
            : r === a._else || r === a.semi || r === a.eof || r === a.parenR
              ? !0
              : r === a.braceL
                ? this.curContext() === L.braceStatement
                : !this.state.exprAllowed;
        }),
        (t.prototype.updateContext = function (r) {
          var s = this.state.type,
            i = void 0;
          s.keyword && r === a.dot
            ? (this.state.exprAllowed = !1)
            : (i = s.updateContext)
              ? i.call(this, r)
              : (this.state.exprAllowed = s.beforeExpr);
        }),
        t
      );
    })(),
    qt = {},
    Mc = [
      'jsx',
      'doExpressions',
      'objectRestSpread',
      'decorators',
      'classProperties',
      'exportExtensions',
      'asyncGenerators',
      'functionBind',
      'functionSent',
      'dynamicImport',
      'flow',
    ],
    st = (function (t) {
      or(e, t);
      function e(r, s) {
        ut(this, e), (r = Lc(r));
        var i = ur(this, t.call(this, r, s));
        return (
          (i.options = r),
          (i.inModule = i.options.sourceType === 'module'),
          (i.input = s),
          (i.plugins = i.loadPlugins(i.options.plugins)),
          (i.filename = r.sourceFilename),
          i.state.pos === 0 && i.input[0] === '#' && i.input[1] === '!' && i.skipLineComment(2),
          i
        );
      }
      return (
        (e.prototype.isReservedWord = function (s) {
          return s === 'await' ? this.inModule : er[6](s);
        }),
        (e.prototype.hasPlugin = function (s) {
          return this.plugins['*'] && Mc.indexOf(s) > -1 ? !0 : !!this.plugins[s];
        }),
        (e.prototype.extend = function (s, i) {
          this[s] = i(this[s]);
        }),
        (e.prototype.loadAllPlugins = function () {
          var s = this,
            i = Object.keys(qt).filter(function (n) {
              return n !== 'flow' && n !== 'estree';
            });
          i.push('flow'),
            i.forEach(function (n) {
              var o = qt[n];
              o && o(s);
            });
        }),
        (e.prototype.loadPlugins = function (s) {
          if (s.indexOf('*') >= 0) return this.loadAllPlugins(), { '*': !0 };
          var i = {};
          s.indexOf('flow') >= 0 &&
            ((s = s.filter(function (m) {
              return m !== 'flow';
            })),
            s.push('flow')),
            s.indexOf('estree') >= 0 &&
              ((s = s.filter(function (m) {
                return m !== 'estree';
              })),
              s.unshift('estree'));
          for (var u = s, n = Array.isArray(u), o = 0, u = n ? u : u[Symbol.iterator](); ; ) {
            var c;
            if (n) {
              if (o >= u.length) break;
              c = u[o++];
            } else {
              if (((o = u.next()), o.done)) break;
              c = o.value;
            }
            var h = c;
            if (!i[h]) {
              i[h] = !0;
              var p = qt[h];
              p && p(this);
            }
          }
          return i;
        }),
        (e.prototype.parse = function () {
          var s = this.startNode(),
            i = this.startNode();
          return this.nextToken(), this.parseTopLevel(s, i);
        }),
        e
      );
    })($c),
    ct = st.prototype;
  ct.addExtra = function (t, e, r) {
    if (t) {
      var s = (t.extra = t.extra || {});
      s[e] = r;
    }
  };
  ct.isRelational = function (t) {
    return this.match(a.relational) && this.state.value === t;
  };
  ct.expectRelational = function (t) {
    this.isRelational(t) ? this.next() : this.unexpected(null, a.relational);
  };
  ct.isContextual = function (t) {
    return this.match(a.name) && this.state.value === t;
  };
  ct.eatContextual = function (t) {
    return this.state.value === t && this.eat(a.name);
  };
  ct.expectContextual = function (t, e) {
    this.eatContextual(t) || this.unexpected(null, e);
  };
  ct.canInsertSemicolon = function () {
    return (
      this.match(a.eof) || this.match(a.braceR) || Pt.test(this.input.slice(this.state.lastTokEnd, this.state.start))
    );
  };
  ct.isLineTerminator = function () {
    return this.eat(a.semi) || this.canInsertSemicolon();
  };
  ct.semicolon = function () {
    this.isLineTerminator() || this.unexpected(null, a.semi);
  };
  ct.expect = function (t, e) {
    return this.eat(t) || this.unexpected(e, t);
  };
  ct.unexpected = function (t) {
    var e = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 'Unexpected token';
    e &&
      (typeof e > 'u' ? 'undefined' : Rc(e)) === 'object' &&
      e.label &&
      (e = 'Unexpected token, expected ' + e.label),
      this.raise(t ?? this.state.start, e);
  };
  var w = st.prototype;
  w.parseTopLevel = function (t, e) {
    return (
      (e.sourceType = this.options.sourceType),
      this.parseBlockBody(e, !0, !0, a.eof),
      (t.program = this.finishNode(e, 'Program')),
      (t.comments = this.state.comments),
      (t.tokens = this.state.tokens),
      this.finishNode(t, 'File')
    );
  };
  var hr = { kind: 'loop' },
    Vc = { kind: 'switch' };
  w.stmtToDirective = function (t) {
    var e = t.expression,
      r = this.startNodeAt(e.start, e.loc.start),
      s = this.startNodeAt(t.start, t.loc.start),
      i = this.input.slice(e.start, e.end),
      n = (r.value = i.slice(1, -1));
    return (
      this.addExtra(r, 'raw', i),
      this.addExtra(r, 'rawValue', n),
      (s.value = this.finishNodeAt(r, 'DirectiveLiteral', e.end, e.loc.end)),
      this.finishNodeAt(s, 'Directive', t.end, t.loc.end)
    );
  };
  w.parseStatement = function (t, e) {
    this.match(a.at) && this.parseDecorators(!0);
    var r = this.state.type,
      s = this.startNode();
    switch (r) {
      case a._break:
      case a._continue:
        return this.parseBreakContinueStatement(s, r.keyword);
      case a._debugger:
        return this.parseDebuggerStatement(s);
      case a._do:
        return this.parseDoStatement(s);
      case a._for:
        return this.parseForStatement(s);
      case a._function:
        return t || this.unexpected(), this.parseFunctionStatement(s);
      case a._class:
        return t || this.unexpected(), this.parseClass(s, !0);
      case a._if:
        return this.parseIfStatement(s);
      case a._return:
        return this.parseReturnStatement(s);
      case a._switch:
        return this.parseSwitchStatement(s);
      case a._throw:
        return this.parseThrowStatement(s);
      case a._try:
        return this.parseTryStatement(s);
      case a._let:
      case a._const:
        t || this.unexpected();
      case a._var:
        return this.parseVarStatement(s, r);
      case a._while:
        return this.parseWhileStatement(s);
      case a._with:
        return this.parseWithStatement(s);
      case a.braceL:
        return this.parseBlock();
      case a.semi:
        return this.parseEmptyStatement(s);
      case a._export:
      case a._import:
        if (this.hasPlugin('dynamicImport') && this.lookahead().type === a.parenL) break;
        return (
          this.options.allowImportExportEverywhere ||
            (e || this.raise(this.state.start, "'import' and 'export' may only appear at the top level"),
            this.inModule ||
              this.raise(this.state.start, `'import' and 'export' may appear only with 'sourceType: "module"'`)),
          r === a._import ? this.parseImport(s) : this.parseExport(s)
        );
      case a.name:
        if (this.state.value === 'async') {
          var i = this.state.clone();
          if ((this.next(), this.match(a._function) && !this.canInsertSemicolon()))
            return this.expect(a._function), this.parseFunction(s, !0, !1, !0);
          this.state = i;
        }
    }
    var n = this.state.value,
      o = this.parseExpression();
    return r === a.name && o.type === 'Identifier' && this.eat(a.colon)
      ? this.parseLabeledStatement(s, n, o)
      : this.parseExpressionStatement(s, o);
  };
  w.takeDecorators = function (t) {
    this.state.decorators.length && ((t.decorators = this.state.decorators), (this.state.decorators = []));
  };
  w.parseDecorators = function (t) {
    for (; this.match(a.at); ) {
      var e = this.parseDecorator();
      this.state.decorators.push(e);
    }
    (t && this.match(a._export)) ||
      this.match(a._class) ||
      this.raise(this.state.start, 'Leading decorators must be attached to a class declaration');
  };
  w.parseDecorator = function () {
    this.hasPlugin('decorators') || this.unexpected();
    var t = this.startNode();
    return this.next(), (t.expression = this.parseMaybeAssign()), this.finishNode(t, 'Decorator');
  };
  w.parseBreakContinueStatement = function (t, e) {
    var r = e === 'break';
    this.next(),
      this.isLineTerminator()
        ? (t.label = null)
        : this.match(a.name)
          ? ((t.label = this.parseIdentifier()), this.semicolon())
          : this.unexpected();
    var s = void 0;
    for (s = 0; s < this.state.labels.length; ++s) {
      var i = this.state.labels[s];
      if (
        (t.label == null || i.name === t.label.name) &&
        ((i.kind != null && (r || i.kind === 'loop')) || (t.label && r))
      )
        break;
    }
    return (
      s === this.state.labels.length && this.raise(t.start, 'Unsyntactic ' + e),
      this.finishNode(t, r ? 'BreakStatement' : 'ContinueStatement')
    );
  };
  w.parseDebuggerStatement = function (t) {
    return this.next(), this.semicolon(), this.finishNode(t, 'DebuggerStatement');
  };
  w.parseDoStatement = function (t) {
    return (
      this.next(),
      this.state.labels.push(hr),
      (t.body = this.parseStatement(!1)),
      this.state.labels.pop(),
      this.expect(a._while),
      (t.test = this.parseParenExpression()),
      this.eat(a.semi),
      this.finishNode(t, 'DoWhileStatement')
    );
  };
  w.parseForStatement = function (t) {
    this.next(), this.state.labels.push(hr);
    var e = !1;
    if (
      (this.hasPlugin('asyncGenerators') && this.state.inAsync && this.isContextual('await') && ((e = !0), this.next()),
      this.expect(a.parenL),
      this.match(a.semi))
    )
      return e && this.unexpected(), this.parseFor(t, null);
    if (this.match(a._var) || this.match(a._let) || this.match(a._const)) {
      var r = this.startNode(),
        s = this.state.type;
      return (
        this.next(),
        this.parseVar(r, !0, s),
        this.finishNode(r, 'VariableDeclaration'),
        (this.match(a._in) || this.isContextual('of')) && r.declarations.length === 1 && !r.declarations[0].init
          ? this.parseForIn(t, r, e)
          : (e && this.unexpected(), this.parseFor(t, r))
      );
    }
    var i = { start: 0 },
      n = this.parseExpression(!0, i);
    if (this.match(a._in) || this.isContextual('of')) {
      var o = this.isContextual('of') ? 'for-of statement' : 'for-in statement';
      return this.toAssignable(n, void 0, o), this.checkLVal(n, void 0, void 0, o), this.parseForIn(t, n, e);
    } else i.start && this.unexpected(i.start);
    return e && this.unexpected(), this.parseFor(t, n);
  };
  w.parseFunctionStatement = function (t) {
    return this.next(), this.parseFunction(t, !0);
  };
  w.parseIfStatement = function (t) {
    return (
      this.next(),
      (t.test = this.parseParenExpression()),
      (t.consequent = this.parseStatement(!1)),
      (t.alternate = this.eat(a._else) ? this.parseStatement(!1) : null),
      this.finishNode(t, 'IfStatement')
    );
  };
  w.parseReturnStatement = function (t) {
    return (
      !this.state.inFunction &&
        !this.options.allowReturnOutsideFunction &&
        this.raise(this.state.start, "'return' outside of function"),
      this.next(),
      this.isLineTerminator() ? (t.argument = null) : ((t.argument = this.parseExpression()), this.semicolon()),
      this.finishNode(t, 'ReturnStatement')
    );
  };
  w.parseSwitchStatement = function (t) {
    this.next(),
      (t.discriminant = this.parseParenExpression()),
      (t.cases = []),
      this.expect(a.braceL),
      this.state.labels.push(Vc);
    for (var e = void 0, r; !this.match(a.braceR); )
      if (this.match(a._case) || this.match(a._default)) {
        var s = this.match(a._case);
        e && this.finishNode(e, 'SwitchCase'),
          t.cases.push((e = this.startNode())),
          (e.consequent = []),
          this.next(),
          s
            ? (e.test = this.parseExpression())
            : (r && this.raise(this.state.lastTokStart, 'Multiple default clauses'), (r = !0), (e.test = null)),
          this.expect(a.colon);
      } else e ? e.consequent.push(this.parseStatement(!0)) : this.unexpected();
    return (
      e && this.finishNode(e, 'SwitchCase'), this.next(), this.state.labels.pop(), this.finishNode(t, 'SwitchStatement')
    );
  };
  w.parseThrowStatement = function (t) {
    return (
      this.next(),
      Pt.test(this.input.slice(this.state.lastTokEnd, this.state.start)) &&
        this.raise(this.state.lastTokEnd, 'Illegal newline after throw'),
      (t.argument = this.parseExpression()),
      this.semicolon(),
      this.finishNode(t, 'ThrowStatement')
    );
  };
  var Wc = [];
  w.parseTryStatement = function (t) {
    if ((this.next(), (t.block = this.parseBlock()), (t.handler = null), this.match(a._catch))) {
      var e = this.startNode();
      this.next(),
        this.expect(a.parenL),
        (e.param = this.parseBindingAtom()),
        this.checkLVal(e.param, !0, Object.create(null), 'catch clause'),
        this.expect(a.parenR),
        (e.body = this.parseBlock()),
        (t.handler = this.finishNode(e, 'CatchClause'));
    }
    return (
      (t.guardedHandlers = Wc),
      (t.finalizer = this.eat(a._finally) ? this.parseBlock() : null),
      !t.handler && !t.finalizer && this.raise(t.start, 'Missing catch or finally clause'),
      this.finishNode(t, 'TryStatement')
    );
  };
  w.parseVarStatement = function (t, e) {
    return this.next(), this.parseVar(t, !1, e), this.semicolon(), this.finishNode(t, 'VariableDeclaration');
  };
  w.parseWhileStatement = function (t) {
    return (
      this.next(),
      (t.test = this.parseParenExpression()),
      this.state.labels.push(hr),
      (t.body = this.parseStatement(!1)),
      this.state.labels.pop(),
      this.finishNode(t, 'WhileStatement')
    );
  };
  w.parseWithStatement = function (t) {
    return (
      this.state.strict && this.raise(this.state.start, "'with' in strict mode"),
      this.next(),
      (t.object = this.parseParenExpression()),
      (t.body = this.parseStatement(!1)),
      this.finishNode(t, 'WithStatement')
    );
  };
  w.parseEmptyStatement = function (t) {
    return this.next(), this.finishNode(t, 'EmptyStatement');
  };
  w.parseLabeledStatement = function (t, e, r) {
    for (var n = this.state.labels, s = Array.isArray(n), i = 0, n = s ? n : n[Symbol.iterator](); ; ) {
      var o;
      if (s) {
        if (i >= n.length) break;
        o = n[i++];
      } else {
        if (((i = n.next()), i.done)) break;
        o = i.value;
      }
      var u = o;
      u.name === e && this.raise(r.start, "Label '" + e + "' is already declared");
    }
    for (
      var c = this.state.type.isLoop ? 'loop' : this.match(a._switch) ? 'switch' : null,
        h = this.state.labels.length - 1;
      h >= 0;
      h--
    ) {
      var p = this.state.labels[h];
      if (p.statementStart === t.start) (p.statementStart = this.state.start), (p.kind = c);
      else break;
    }
    return (
      this.state.labels.push({ name: e, kind: c, statementStart: this.state.start }),
      (t.body = this.parseStatement(!0)),
      this.state.labels.pop(),
      (t.label = r),
      this.finishNode(t, 'LabeledStatement')
    );
  };
  w.parseExpressionStatement = function (t, e) {
    return (t.expression = e), this.semicolon(), this.finishNode(t, 'ExpressionStatement');
  };
  w.parseBlock = function (t) {
    var e = this.startNode();
    return this.expect(a.braceL), this.parseBlockBody(e, t, !1, a.braceR), this.finishNode(e, 'BlockStatement');
  };
  w.isValidDirective = function (t) {
    return (
      t.type === 'ExpressionStatement' && t.expression.type === 'StringLiteral' && !t.expression.extra.parenthesized
    );
  };
  w.parseBlockBody = function (t, e, r, s) {
    (t.body = []), (t.directives = []);
    for (var i = !1, n = void 0, o = void 0; !this.eat(s); ) {
      !i && this.state.containsOctal && !o && (o = this.state.octalPosition);
      var u = this.parseStatement(!0, r);
      if (e && !i && this.isValidDirective(u)) {
        var c = this.stmtToDirective(u);
        t.directives.push(c),
          n === void 0 &&
            c.value.value === 'use strict' &&
            ((n = this.state.strict), this.setStrict(!0), o && this.raise(o, 'Octal literal in strict mode'));
        continue;
      }
      (i = !0), t.body.push(u);
    }
    n === !1 && this.setStrict(!1);
  };
  w.parseFor = function (t, e) {
    return (
      (t.init = e),
      this.expect(a.semi),
      (t.test = this.match(a.semi) ? null : this.parseExpression()),
      this.expect(a.semi),
      (t.update = this.match(a.parenR) ? null : this.parseExpression()),
      this.expect(a.parenR),
      (t.body = this.parseStatement(!1)),
      this.state.labels.pop(),
      this.finishNode(t, 'ForStatement')
    );
  };
  w.parseForIn = function (t, e, r) {
    var s = void 0;
    return (
      r
        ? (this.eatContextual('of'), (s = 'ForAwaitStatement'))
        : ((s = this.match(a._in) ? 'ForInStatement' : 'ForOfStatement'), this.next()),
      (t.left = e),
      (t.right = this.parseExpression()),
      this.expect(a.parenR),
      (t.body = this.parseStatement(!1)),
      this.state.labels.pop(),
      this.finishNode(t, s)
    );
  };
  w.parseVar = function (t, e, r) {
    for (t.declarations = [], t.kind = r.keyword; ; ) {
      var s = this.startNode();
      if (
        (this.parseVarHead(s),
        this.eat(a.eq)
          ? (s.init = this.parseMaybeAssign(e))
          : r === a._const && !(this.match(a._in) || this.isContextual('of'))
            ? this.unexpected()
            : s.id.type !== 'Identifier' && !(e && (this.match(a._in) || this.isContextual('of')))
              ? this.raise(this.state.lastTokEnd, 'Complex binding patterns require an initialization value')
              : (s.init = null),
        t.declarations.push(this.finishNode(s, 'VariableDeclarator')),
        !this.eat(a.comma))
      )
        break;
    }
    return t;
  };
  w.parseVarHead = function (t) {
    (t.id = this.parseBindingAtom()), this.checkLVal(t.id, !0, void 0, 'variable declaration');
  };
  w.parseFunction = function (t, e, r, s, i) {
    var n = this.state.inMethod;
    return (
      (this.state.inMethod = !1),
      this.initFunction(t, s),
      this.match(a.star) &&
        (t.async && !this.hasPlugin('asyncGenerators') ? this.unexpected() : ((t.generator = !0), this.next())),
      e && !i && !this.match(a.name) && !this.match(a._yield) && this.unexpected(),
      (this.match(a.name) || this.match(a._yield)) && (t.id = this.parseBindingIdentifier()),
      this.parseFunctionParams(t),
      this.parseFunctionBody(t, r),
      (this.state.inMethod = n),
      this.finishNode(t, e ? 'FunctionDeclaration' : 'FunctionExpression')
    );
  };
  w.parseFunctionParams = function (t) {
    this.expect(a.parenL), (t.params = this.parseBindingList(a.parenR));
  };
  w.parseClass = function (t, e, r) {
    return (
      this.next(),
      this.takeDecorators(t),
      this.parseClassId(t, e, r),
      this.parseClassSuper(t),
      this.parseClassBody(t),
      this.finishNode(t, e ? 'ClassDeclaration' : 'ClassExpression')
    );
  };
  w.isClassProperty = function () {
    return this.match(a.eq) || this.match(a.semi) || this.match(a.braceR);
  };
  w.isClassMethod = function () {
    return this.match(a.parenL);
  };
  w.isNonstaticConstructor = function (t) {
    return !t.computed && !t.static && (t.key.name === 'constructor' || t.key.value === 'constructor');
  };
  w.parseClassBody = function (t) {
    var e = this.state.strict;
    this.state.strict = !0;
    var r = !1,
      s = !1,
      i = [],
      n = this.startNode();
    for (n.body = [], this.expect(a.braceL); !this.eat(a.braceR); ) {
      if (this.eat(a.semi)) {
        i.length > 0 && this.raise(this.state.lastTokEnd, 'Decorators must not be followed by a semicolon');
        continue;
      }
      if (this.match(a.at)) {
        i.push(this.parseDecorator());
        continue;
      }
      var o = this.startNode();
      if (
        (i.length && ((o.decorators = i), (i = [])),
        (o.static = !1),
        this.match(a.name) && this.state.value === 'static')
      ) {
        var u = this.parseIdentifier(!0);
        if (this.isClassMethod()) {
          (o.kind = 'method'), (o.computed = !1), (o.key = u), this.parseClassMethod(n, o, !1, !1);
          continue;
        } else if (this.isClassProperty()) {
          (o.computed = !1), (o.key = u), n.body.push(this.parseClassProperty(o));
          continue;
        }
        o.static = !0;
      }
      if (this.eat(a.star))
        (o.kind = 'method'),
          this.parsePropertyName(o),
          this.isNonstaticConstructor(o) && this.raise(o.key.start, "Constructor can't be a generator"),
          !o.computed &&
            o.static &&
            (o.key.name === 'prototype' || o.key.value === 'prototype') &&
            this.raise(o.key.start, 'Classes may not have static property named prototype'),
          this.parseClassMethod(n, o, !0, !1);
      else {
        var c = this.match(a.name),
          h = this.parsePropertyName(o);
        if (
          (!o.computed &&
            o.static &&
            (o.key.name === 'prototype' || o.key.value === 'prototype') &&
            this.raise(o.key.start, 'Classes may not have static property named prototype'),
          this.isClassMethod())
        )
          this.isNonstaticConstructor(o)
            ? (s
                ? this.raise(h.start, 'Duplicate constructor in the same class')
                : o.decorators && this.raise(o.start, "You can't attach decorators to a class constructor"),
              (s = !0),
              (o.kind = 'constructor'))
            : (o.kind = 'method'),
            this.parseClassMethod(n, o, !1, !1);
        else if (this.isClassProperty())
          this.isNonstaticConstructor(o) &&
            this.raise(o.key.start, "Classes may not have a non-static field named 'constructor'"),
            n.body.push(this.parseClassProperty(o));
        else if (c && h.name === 'async' && !this.isLineTerminator()) {
          var p = this.hasPlugin('asyncGenerators') && this.eat(a.star);
          (o.kind = 'method'),
            this.parsePropertyName(o),
            this.isNonstaticConstructor(o) && this.raise(o.key.start, "Constructor can't be an async function"),
            this.parseClassMethod(n, o, p, !0);
        } else
          c && (h.name === 'get' || h.name === 'set') && !(this.isLineTerminator() && this.match(a.star))
            ? ((o.kind = h.name),
              this.parsePropertyName(o),
              this.isNonstaticConstructor(o) && this.raise(o.key.start, "Constructor can't have get/set modifier"),
              this.parseClassMethod(n, o, !1, !1),
              this.checkGetterSetterParamCount(o))
            : this.hasPlugin('classConstructorCall') &&
                c &&
                h.name === 'call' &&
                this.match(a.name) &&
                this.state.value === 'constructor'
              ? (r
                  ? this.raise(o.start, 'Duplicate constructor call in the same class')
                  : o.decorators && this.raise(o.start, "You can't attach decorators to a class constructor"),
                (r = !0),
                (o.kind = 'constructorCall'),
                this.parsePropertyName(o),
                this.parseClassMethod(n, o, !1, !1))
              : this.isLineTerminator()
                ? (this.isNonstaticConstructor(o) &&
                    this.raise(o.key.start, "Classes may not have a non-static field named 'constructor'"),
                  n.body.push(this.parseClassProperty(o)))
                : this.unexpected();
      }
    }
    i.length && this.raise(this.state.start, 'You have trailing decorators with no method'),
      (t.body = this.finishNode(n, 'ClassBody')),
      (this.state.strict = e);
  };
  w.parseClassProperty = function (t) {
    return (
      (this.state.inClassProperty = !0),
      this.match(a.eq)
        ? (this.hasPlugin('classProperties') || this.unexpected(), this.next(), (t.value = this.parseMaybeAssign()))
        : (t.value = null),
      this.semicolon(),
      (this.state.inClassProperty = !1),
      this.finishNode(t, 'ClassProperty')
    );
  };
  w.parseClassMethod = function (t, e, r, s) {
    this.parseMethod(e, r, s), t.body.push(this.finishNode(e, 'ClassMethod'));
  };
  w.parseClassId = function (t, e, r) {
    this.match(a.name) ? (t.id = this.parseIdentifier()) : r || !e ? (t.id = null) : this.unexpected();
  };
  w.parseClassSuper = function (t) {
    t.superClass = this.eat(a._extends) ? this.parseExprSubscripts() : null;
  };
  w.parseExport = function (t) {
    if ((this.next(), this.match(a.star))) {
      var e = this.startNode();
      if ((this.next(), this.hasPlugin('exportExtensions') && this.eatContextual('as')))
        (e.exported = this.parseIdentifier()),
          (t.specifiers = [this.finishNode(e, 'ExportNamespaceSpecifier')]),
          this.parseExportSpecifiersMaybe(t),
          this.parseExportFrom(t, !0);
      else return this.parseExportFrom(t, !0), this.finishNode(t, 'ExportAllDeclaration');
    } else if (this.hasPlugin('exportExtensions') && this.isExportDefaultSpecifier()) {
      var r = this.startNode();
      if (
        ((r.exported = this.parseIdentifier(!0)),
        (t.specifiers = [this.finishNode(r, 'ExportDefaultSpecifier')]),
        this.match(a.comma) && this.lookahead().type === a.star)
      ) {
        this.expect(a.comma);
        var s = this.startNode();
        this.expect(a.star),
          this.expectContextual('as'),
          (s.exported = this.parseIdentifier()),
          t.specifiers.push(this.finishNode(s, 'ExportNamespaceSpecifier'));
      } else this.parseExportSpecifiersMaybe(t);
      this.parseExportFrom(t, !0);
    } else if (this.eat(a._default)) {
      var i = this.startNode(),
        n = !1;
      return (
        this.eat(a._function)
          ? (i = this.parseFunction(i, !0, !1, !1, !0))
          : this.match(a._class)
            ? (i = this.parseClass(i, !0, !0))
            : ((n = !0), (i = this.parseMaybeAssign())),
        (t.declaration = i),
        n && this.semicolon(),
        this.checkExport(t, !0, !0),
        this.finishNode(t, 'ExportDefaultDeclaration')
      );
    } else
      this.shouldParseExportDeclaration()
        ? ((t.specifiers = []), (t.source = null), (t.declaration = this.parseExportDeclaration(t)))
        : ((t.declaration = null), (t.specifiers = this.parseExportSpecifiers()), this.parseExportFrom(t));
    return this.checkExport(t, !0), this.finishNode(t, 'ExportNamedDeclaration');
  };
  w.parseExportDeclaration = function () {
    return this.parseStatement(!0);
  };
  w.isExportDefaultSpecifier = function () {
    if (this.match(a.name)) return this.state.value !== 'async';
    if (!this.match(a._default)) return !1;
    var t = this.lookahead();
    return t.type === a.comma || (t.type === a.name && t.value === 'from');
  };
  w.parseExportSpecifiersMaybe = function (t) {
    this.eat(a.comma) && (t.specifiers = t.specifiers.concat(this.parseExportSpecifiers()));
  };
  w.parseExportFrom = function (t, e) {
    this.eatContextual('from')
      ? ((t.source = this.match(a.string) ? this.parseExprAtom() : this.unexpected()), this.checkExport(t))
      : e
        ? this.unexpected()
        : (t.source = null),
      this.semicolon();
  };
  w.shouldParseExportDeclaration = function () {
    return (
      this.state.type.keyword === 'var' ||
      this.state.type.keyword === 'const' ||
      this.state.type.keyword === 'let' ||
      this.state.type.keyword === 'function' ||
      this.state.type.keyword === 'class' ||
      this.isContextual('async')
    );
  };
  w.checkExport = function (t, e, r) {
    if (e) {
      if (r) this.checkDuplicateExports(t, 'default');
      else if (t.specifiers && t.specifiers.length)
        for (var n = t.specifiers, s = Array.isArray(n), i = 0, n = s ? n : n[Symbol.iterator](); ; ) {
          var o;
          if (s) {
            if (i >= n.length) break;
            o = n[i++];
          } else {
            if (((i = n.next()), i.done)) break;
            o = i.value;
          }
          var u = o;
          this.checkDuplicateExports(u, u.exported.name);
        }
      else if (t.declaration) {
        if (t.declaration.type === 'FunctionDeclaration' || t.declaration.type === 'ClassDeclaration')
          this.checkDuplicateExports(t, t.declaration.id.name);
        else if (t.declaration.type === 'VariableDeclaration')
          for (var p = t.declaration.declarations, c = Array.isArray(p), h = 0, p = c ? p : p[Symbol.iterator](); ; ) {
            var m;
            if (c) {
              if (h >= p.length) break;
              m = p[h++];
            } else {
              if (((h = p.next()), h.done)) break;
              m = h.value;
            }
            var d = m;
            this.checkDeclaration(d.id);
          }
      }
    }
    if (this.state.decorators.length) {
      var y = t.declaration && (t.declaration.type === 'ClassDeclaration' || t.declaration.type === 'ClassExpression');
      (!t.declaration || !y) && this.raise(t.start, 'You can only use decorators on an export when exporting a class'),
        this.takeDecorators(t.declaration);
    }
  };
  w.checkDeclaration = function (t) {
    if (t.type === 'ObjectPattern')
      for (var s = t.properties, e = Array.isArray(s), r = 0, s = e ? s : s[Symbol.iterator](); ; ) {
        var i;
        if (e) {
          if (r >= s.length) break;
          i = s[r++];
        } else {
          if (((r = s.next()), r.done)) break;
          i = r.value;
        }
        var n = i;
        this.checkDeclaration(n);
      }
    else if (t.type === 'ArrayPattern')
      for (var c = t.elements, o = Array.isArray(c), u = 0, c = o ? c : c[Symbol.iterator](); ; ) {
        var h;
        if (o) {
          if (u >= c.length) break;
          h = c[u++];
        } else {
          if (((u = c.next()), u.done)) break;
          h = u.value;
        }
        var p = h;
        p && this.checkDeclaration(p);
      }
    else
      t.type === 'ObjectProperty'
        ? this.checkDeclaration(t.value)
        : t.type === 'RestElement' || t.type === 'RestProperty'
          ? this.checkDeclaration(t.argument)
          : t.type === 'Identifier' && this.checkDuplicateExports(t, t.name);
  };
  w.checkDuplicateExports = function (t, e) {
    this.state.exportedIdentifiers.indexOf(e) > -1 && this.raiseDuplicateExportError(t, e),
      this.state.exportedIdentifiers.push(e);
  };
  w.raiseDuplicateExportError = function (t, e) {
    this.raise(
      t.start,
      e === 'default'
        ? 'Only one default export allowed per module.'
        : '`' + e + '` has already been exported. Exported identifiers must be unique.'
    );
  };
  w.parseExportSpecifiers = function () {
    var t = [],
      e = !0,
      r = void 0;
    for (this.expect(a.braceL); !this.eat(a.braceR); ) {
      if (e) e = !1;
      else if ((this.expect(a.comma), this.eat(a.braceR))) break;
      var s = this.match(a._default);
      s && !r && (r = !0);
      var i = this.startNode();
      (i.local = this.parseIdentifier(s)),
        (i.exported = this.eatContextual('as') ? this.parseIdentifier(!0) : i.local.__clone()),
        t.push(this.finishNode(i, 'ExportSpecifier'));
    }
    return r && !this.isContextual('from') && this.unexpected(), t;
  };
  w.parseImport = function (t) {
    return (
      this.eat(a._import),
      this.match(a.string)
        ? ((t.specifiers = []), (t.source = this.parseExprAtom()))
        : ((t.specifiers = []),
          this.parseImportSpecifiers(t),
          this.expectContextual('from'),
          (t.source = this.match(a.string) ? this.parseExprAtom() : this.unexpected())),
      this.semicolon(),
      this.finishNode(t, 'ImportDeclaration')
    );
  };
  w.parseImportSpecifiers = function (t) {
    var e = !0;
    if (this.match(a.name)) {
      var r = this.state.start,
        s = this.state.startLoc;
      if ((t.specifiers.push(this.parseImportSpecifierDefault(this.parseIdentifier(), r, s)), !this.eat(a.comma)))
        return;
    }
    if (this.match(a.star)) {
      var i = this.startNode();
      this.next(),
        this.expectContextual('as'),
        (i.local = this.parseIdentifier()),
        this.checkLVal(i.local, !0, void 0, 'import namespace specifier'),
        t.specifiers.push(this.finishNode(i, 'ImportNamespaceSpecifier'));
      return;
    }
    for (this.expect(a.braceL); !this.eat(a.braceR); ) {
      if (e) e = !1;
      else if (
        (this.eat(a.colon) &&
          this.unexpected(
            null,
            'ES2015 named imports do not destructure. Use another statement for destructuring after the import.'
          ),
        this.expect(a.comma),
        this.eat(a.braceR))
      )
        break;
      this.parseImportSpecifier(t);
    }
  };
  w.parseImportSpecifier = function (t) {
    var e = this.startNode();
    (e.imported = this.parseIdentifier(!0)),
      this.eatContextual('as')
        ? (e.local = this.parseIdentifier())
        : (this.checkReservedWord(e.imported.name, e.start, !0, !0), (e.local = e.imported.__clone())),
      this.checkLVal(e.local, !0, void 0, 'import specifier'),
      t.specifiers.push(this.finishNode(e, 'ImportSpecifier'));
  };
  w.parseImportSpecifierDefault = function (t, e, r) {
    var s = this.startNodeAt(e, r);
    return (
      (s.local = t),
      this.checkLVal(s.local, !0, void 0, 'default import specifier'),
      this.finishNode(s, 'ImportDefaultSpecifier')
    );
  };
  var it = st.prototype;
  it.toAssignable = function (t, e, r) {
    if (t)
      switch (t.type) {
        case 'Identifier':
        case 'ObjectPattern':
        case 'ArrayPattern':
        case 'AssignmentPattern':
          break;
        case 'ObjectExpression':
          t.type = 'ObjectPattern';
          for (var n = t.properties, s = Array.isArray(n), i = 0, n = s ? n : n[Symbol.iterator](); ; ) {
            var o;
            if (s) {
              if (i >= n.length) break;
              o = n[i++];
            } else {
              if (((i = n.next()), i.done)) break;
              o = i.value;
            }
            var u = o;
            u.type === 'ObjectMethod'
              ? u.kind === 'get' || u.kind === 'set'
                ? this.raise(u.key.start, "Object pattern can't contain getter or setter")
                : this.raise(u.key.start, "Object pattern can't contain methods")
              : this.toAssignable(u, e, 'object destructuring pattern');
          }
          break;
        case 'ObjectProperty':
          this.toAssignable(t.value, e, r);
          break;
        case 'SpreadProperty':
          t.type = 'RestProperty';
          var c = t.argument;
          this.toAssignable(c, e, r);
          break;
        case 'ArrayExpression':
          (t.type = 'ArrayPattern'), this.toAssignableList(t.elements, e, r);
          break;
        case 'AssignmentExpression':
          t.operator === '='
            ? ((t.type = 'AssignmentPattern'), delete t.operator)
            : this.raise(t.left.end, "Only '=' operator can be used for specifying default value.");
          break;
        case 'MemberExpression':
          if (!e) break;
        default: {
          var h = 'Invalid left-hand side' + (r ? ' in ' + r : 'expression');
          this.raise(t.start, h);
        }
      }
    return t;
  };
  it.toAssignableList = function (t, e, r) {
    var s = t.length;
    if (s) {
      var i = t[s - 1];
      if (i && i.type === 'RestElement') --s;
      else if (i && i.type === 'SpreadElement') {
        i.type = 'RestElement';
        var n = i.argument;
        this.toAssignable(n, e, r),
          n.type !== 'Identifier' &&
            n.type !== 'MemberExpression' &&
            n.type !== 'ArrayPattern' &&
            this.unexpected(n.start),
          --s;
      }
    }
    for (var o = 0; o < s; o++) {
      var u = t[o];
      u && this.toAssignable(u, e, r);
    }
    return t;
  };
  it.toReferencedList = function (t) {
    return t;
  };
  it.parseSpread = function (t) {
    var e = this.startNode();
    return this.next(), (e.argument = this.parseMaybeAssign(!1, t)), this.finishNode(e, 'SpreadElement');
  };
  it.parseRest = function () {
    var t = this.startNode();
    return this.next(), (t.argument = this.parseBindingIdentifier()), this.finishNode(t, 'RestElement');
  };
  it.shouldAllowYieldIdentifier = function () {
    return this.match(a._yield) && !this.state.strict && !this.state.inGenerator;
  };
  it.parseBindingIdentifier = function () {
    return this.parseIdentifier(this.shouldAllowYieldIdentifier());
  };
  it.parseBindingAtom = function () {
    switch (this.state.type) {
      case a._yield:
        (this.state.strict || this.state.inGenerator) && this.unexpected();
      case a.name:
        return this.parseIdentifier(!0);
      case a.bracketL:
        var t = this.startNode();
        return this.next(), (t.elements = this.parseBindingList(a.bracketR, !0)), this.finishNode(t, 'ArrayPattern');
      case a.braceL:
        return this.parseObj(!0);
      default:
        this.unexpected();
    }
  };
  it.parseBindingList = function (t, e) {
    for (var r = [], s = !0; !this.eat(t); )
      if ((s ? (s = !1) : this.expect(a.comma), e && this.match(a.comma))) r.push(null);
      else {
        if (this.eat(t)) break;
        if (this.match(a.ellipsis)) {
          r.push(this.parseAssignableListItemTypes(this.parseRest())), this.expect(t);
          break;
        } else {
          for (var i = []; this.match(a.at); ) i.push(this.parseDecorator());
          var n = this.parseMaybeDefault();
          i.length && (n.decorators = i),
            this.parseAssignableListItemTypes(n),
            r.push(this.parseMaybeDefault(n.start, n.loc.start, n));
        }
      }
    return r;
  };
  it.parseAssignableListItemTypes = function (t) {
    return t;
  };
  it.parseMaybeDefault = function (t, e, r) {
    if (
      ((e = e || this.state.startLoc), (t = t || this.state.start), (r = r || this.parseBindingAtom()), !this.eat(a.eq))
    )
      return r;
    var s = this.startNodeAt(t, e);
    return (s.left = r), (s.right = this.parseMaybeAssign()), this.finishNode(s, 'AssignmentPattern');
  };
  it.checkLVal = function (t, e, r, s) {
    switch (t.type) {
      case 'Identifier':
        if ((this.checkReservedWord(t.name, t.start, !1, !0), r)) {
          var i = '_' + t.name;
          r[i] ? this.raise(t.start, 'Argument name clash in strict mode') : (r[i] = !0);
        }
        break;
      case 'MemberExpression':
        e && this.raise(t.start, (e ? 'Binding' : 'Assigning to') + ' member expression');
        break;
      case 'ObjectPattern':
        for (var u = t.properties, n = Array.isArray(u), o = 0, u = n ? u : u[Symbol.iterator](); ; ) {
          var c;
          if (n) {
            if (o >= u.length) break;
            c = u[o++];
          } else {
            if (((o = u.next()), o.done)) break;
            c = o.value;
          }
          var h = c;
          h.type === 'ObjectProperty' && (h = h.value), this.checkLVal(h, e, r, 'object destructuring pattern');
        }
        break;
      case 'ArrayPattern':
        for (var d = t.elements, p = Array.isArray(d), m = 0, d = p ? d : d[Symbol.iterator](); ; ) {
          var y;
          if (p) {
            if (m >= d.length) break;
            y = d[m++];
          } else {
            if (((m = d.next()), m.done)) break;
            y = m.value;
          }
          var E = y;
          E && this.checkLVal(E, e, r, 'array destructuring pattern');
        }
        break;
      case 'AssignmentPattern':
        this.checkLVal(t.left, e, r, 'assignment pattern');
        break;
      case 'RestProperty':
        this.checkLVal(t.argument, e, r, 'rest property');
        break;
      case 'RestElement':
        this.checkLVal(t.argument, e, r, 'rest element');
        break;
      default: {
        var v = (e ? 'Binding invalid' : 'Invalid') + ' left-hand side' + (s ? ' in ' + s : 'expression');
        this.raise(t.start, v);
      }
    }
  };
  var F = st.prototype;
  F.checkPropClash = function (t, e) {
    if (!(t.computed || t.kind)) {
      var r = t.key,
        s = r.type === 'Identifier' ? r.name : String(r.value);
      s === '__proto__' && (e.proto && this.raise(r.start, 'Redefinition of __proto__ property'), (e.proto = !0));
    }
  };
  F.getExpression = function () {
    this.nextToken();
    var t = this.parseExpression();
    return this.match(a.eof) || this.unexpected(), t;
  };
  F.parseExpression = function (t, e) {
    var r = this.state.start,
      s = this.state.startLoc,
      i = this.parseMaybeAssign(t, e);
    if (this.match(a.comma)) {
      var n = this.startNodeAt(r, s);
      for (n.expressions = [i]; this.eat(a.comma); ) n.expressions.push(this.parseMaybeAssign(t, e));
      return this.toReferencedList(n.expressions), this.finishNode(n, 'SequenceExpression');
    }
    return i;
  };
  F.parseMaybeAssign = function (t, e, r, s) {
    var i = this.state.start,
      n = this.state.startLoc;
    if (this.match(a._yield) && this.state.inGenerator) {
      var o = this.parseYield();
      return r && (o = r.call(this, o, i, n)), o;
    }
    var u = void 0;
    e ? (u = !1) : ((e = { start: 0 }), (u = !0)),
      (this.match(a.parenL) || this.match(a.name)) && (this.state.potentialArrowAt = this.state.start);
    var c = this.parseMaybeConditional(t, e, s);
    if ((r && (c = r.call(this, c, i, n)), this.state.type.isAssign)) {
      var h = this.startNodeAt(i, n);
      if (
        ((h.operator = this.state.value),
        (h.left = this.match(a.eq) ? this.toAssignable(c, void 0, 'assignment expression') : c),
        (e.start = 0),
        this.checkLVal(c, void 0, void 0, 'assignment expression'),
        c.extra && c.extra.parenthesized)
      ) {
        var p = void 0;
        c.type === 'ObjectPattern'
          ? (p = '`({a}) = 0` use `({a} = 0)`')
          : c.type === 'ArrayPattern' && (p = '`([a]) = 0` use `([a] = 0)`'),
          p && this.raise(c.start, "You're trying to assign to a parenthesized expression, eg. instead of " + p);
      }
      return this.next(), (h.right = this.parseMaybeAssign(t)), this.finishNode(h, 'AssignmentExpression');
    } else u && e.start && this.unexpected(e.start);
    return c;
  };
  F.parseMaybeConditional = function (t, e, r) {
    var s = this.state.start,
      i = this.state.startLoc,
      n = this.parseExprOps(t, e);
    return e && e.start ? n : this.parseConditional(n, t, s, i, r);
  };
  F.parseConditional = function (t, e, r, s) {
    if (this.eat(a.question)) {
      var i = this.startNodeAt(r, s);
      return (
        (i.test = t),
        (i.consequent = this.parseMaybeAssign()),
        this.expect(a.colon),
        (i.alternate = this.parseMaybeAssign(e)),
        this.finishNode(i, 'ConditionalExpression')
      );
    }
    return t;
  };
  F.parseExprOps = function (t, e) {
    var r = this.state.start,
      s = this.state.startLoc,
      i = this.parseMaybeUnary(e);
    return e && e.start ? i : this.parseExprOp(i, r, s, -1, t);
  };
  F.parseExprOp = function (t, e, r, s, i) {
    var n = this.state.type.binop;
    if (n != null && (!i || !this.match(a._in)) && n > s) {
      var o = this.startNodeAt(e, r);
      (o.left = t),
        (o.operator = this.state.value),
        o.operator === '**' &&
          t.type === 'UnaryExpression' &&
          t.extra &&
          !t.extra.parenthesizedArgument &&
          !t.extra.parenthesized &&
          this.raise(
            t.argument.start,
            'Illegal expression. Wrap left hand side or entire exponentiation in parentheses.'
          );
      var u = this.state.type;
      this.next();
      var c = this.state.start,
        h = this.state.startLoc;
      return (
        (o.right = this.parseExprOp(this.parseMaybeUnary(), c, h, u.rightAssociative ? n - 1 : n, i)),
        this.finishNode(o, u === a.logicalOR || u === a.logicalAND ? 'LogicalExpression' : 'BinaryExpression'),
        this.parseExprOp(o, e, r, s, i)
      );
    }
    return t;
  };
  F.parseMaybeUnary = function (t) {
    if (this.state.type.prefix) {
      var e = this.startNode(),
        r = this.match(a.incDec);
      (e.operator = this.state.value), (e.prefix = !0), this.next();
      var s = this.state.type;
      return (
        (e.argument = this.parseMaybeUnary()),
        this.addExtra(
          e,
          'parenthesizedArgument',
          s === a.parenL && (!e.argument.extra || !e.argument.extra.parenthesized)
        ),
        t && t.start && this.unexpected(t.start),
        r
          ? this.checkLVal(e.argument, void 0, void 0, 'prefix operation')
          : this.state.strict &&
            e.operator === 'delete' &&
            e.argument.type === 'Identifier' &&
            this.raise(e.start, 'Deleting local variable in strict mode'),
        this.finishNode(e, r ? 'UpdateExpression' : 'UnaryExpression')
      );
    }
    var i = this.state.start,
      n = this.state.startLoc,
      o = this.parseExprSubscripts(t);
    if (t && t.start) return o;
    for (; this.state.type.postfix && !this.canInsertSemicolon(); ) {
      var u = this.startNodeAt(i, n);
      (u.operator = this.state.value),
        (u.prefix = !1),
        (u.argument = o),
        this.checkLVal(o, void 0, void 0, 'postfix operation'),
        this.next(),
        (o = this.finishNode(u, 'UpdateExpression'));
    }
    return o;
  };
  F.parseExprSubscripts = function (t) {
    var e = this.state.start,
      r = this.state.startLoc,
      s = this.state.potentialArrowAt,
      i = this.parseExprAtom(t);
    return (i.type === 'ArrowFunctionExpression' && i.start === s) || (t && t.start)
      ? i
      : this.parseSubscripts(i, e, r);
  };
  F.parseSubscripts = function (t, e, r, s) {
    for (;;)
      if (!s && this.eat(a.doubleColon)) {
        var i = this.startNodeAt(e, r);
        return (
          (i.object = t),
          (i.callee = this.parseNoCallExpr()),
          this.parseSubscripts(this.finishNode(i, 'BindExpression'), e, r, s)
        );
      } else if (this.eat(a.dot)) {
        var n = this.startNodeAt(e, r);
        (n.object = t),
          (n.property = this.parseIdentifier(!0)),
          (n.computed = !1),
          (t = this.finishNode(n, 'MemberExpression'));
      } else if (this.eat(a.bracketL)) {
        var o = this.startNodeAt(e, r);
        (o.object = t),
          (o.property = this.parseExpression()),
          (o.computed = !0),
          this.expect(a.bracketR),
          (t = this.finishNode(o, 'MemberExpression'));
      } else if (!s && this.match(a.parenL)) {
        var u =
          this.state.potentialArrowAt === t.start &&
          t.type === 'Identifier' &&
          t.name === 'async' &&
          !this.canInsertSemicolon();
        this.next();
        var c = this.startNodeAt(e, r);
        if (
          ((c.callee = t),
          (c.arguments = this.parseCallExpressionArguments(a.parenR, u)),
          c.callee.type === 'Import' &&
            c.arguments.length !== 1 &&
            this.raise(c.start, 'import() requires exactly one argument'),
          (t = this.finishNode(c, 'CallExpression')),
          u && this.shouldParseAsyncArrow())
        )
          return this.parseAsyncArrowFromCallExpression(this.startNodeAt(e, r), c);
        this.toReferencedList(c.arguments);
      } else if (this.match(a.backQuote)) {
        var h = this.startNodeAt(e, r);
        (h.tag = t), (h.quasi = this.parseTemplate(!0)), (t = this.finishNode(h, 'TaggedTemplateExpression'));
      } else return t;
  };
  F.parseCallExpressionArguments = function (t, e) {
    for (var r = [], s = void 0, i = !0; !this.eat(t); ) {
      if (i) i = !1;
      else if ((this.expect(a.comma), this.eat(t))) break;
      this.match(a.parenL) && !s && (s = this.state.start),
        r.push(this.parseExprListItem(!1, e ? { start: 0 } : void 0, e ? { start: 0 } : void 0));
    }
    return e && s && this.shouldParseAsyncArrow() && this.unexpected(), r;
  };
  F.shouldParseAsyncArrow = function () {
    return this.match(a.arrow);
  };
  F.parseAsyncArrowFromCallExpression = function (t, e) {
    return this.expect(a.arrow), this.parseArrowExpression(t, e.arguments, !0);
  };
  F.parseNoCallExpr = function () {
    var t = this.state.start,
      e = this.state.startLoc;
    return this.parseSubscripts(this.parseExprAtom(), t, e, !0);
  };
  F.parseExprAtom = function (t) {
    var e = this.state.potentialArrowAt === this.state.start,
      r = void 0;
    switch (this.state.type) {
      case a._super:
        return (
          !this.state.inMethod &&
            !this.state.inClassProperty &&
            !this.options.allowSuperOutsideMethod &&
            this.raise(this.state.start, "'super' outside of function or class"),
          (r = this.startNode()),
          this.next(),
          !this.match(a.parenL) && !this.match(a.bracketL) && !this.match(a.dot) && this.unexpected(),
          this.match(a.parenL) &&
            this.state.inMethod !== 'constructor' &&
            !this.options.allowSuperOutsideMethod &&
            this.raise(r.start, 'super() outside of class constructor'),
          this.finishNode(r, 'Super')
        );
      case a._import:
        return (
          this.hasPlugin('dynamicImport') || this.unexpected(),
          (r = this.startNode()),
          this.next(),
          this.match(a.parenL) || this.unexpected(null, a.parenL),
          this.finishNode(r, 'Import')
        );
      case a._this:
        return (r = this.startNode()), this.next(), this.finishNode(r, 'ThisExpression');
      case a._yield:
        this.state.inGenerator && this.unexpected();
      case a.name:
        r = this.startNode();
        var s = this.state.value === 'await' && this.state.inAsync,
          i = this.shouldAllowYieldIdentifier(),
          n = this.parseIdentifier(s || i);
        if (n.name === 'await') {
          if (this.state.inAsync || this.inModule) return this.parseAwait(r);
        } else {
          if (n.name === 'async' && this.match(a._function) && !this.canInsertSemicolon())
            return this.next(), this.parseFunction(r, !1, !1, !0);
          if (e && n.name === 'async' && this.match(a.name)) {
            var o = [this.parseIdentifier()];
            return this.expect(a.arrow), this.parseArrowExpression(r, o, !0);
          }
        }
        return e && !this.canInsertSemicolon() && this.eat(a.arrow) ? this.parseArrowExpression(r, [n]) : n;
      case a._do:
        if (this.hasPlugin('doExpressions')) {
          var u = this.startNode();
          this.next();
          var c = this.state.inFunction,
            h = this.state.labels;
          return (
            (this.state.labels = []),
            (this.state.inFunction = !1),
            (u.body = this.parseBlock(!1, !0)),
            (this.state.inFunction = c),
            (this.state.labels = h),
            this.finishNode(u, 'DoExpression')
          );
        }
      case a.regexp:
        var p = this.state.value;
        return (r = this.parseLiteral(p.value, 'RegExpLiteral')), (r.pattern = p.pattern), (r.flags = p.flags), r;
      case a.num:
        return this.parseLiteral(this.state.value, 'NumericLiteral');
      case a.string:
        return this.parseLiteral(this.state.value, 'StringLiteral');
      case a._null:
        return (r = this.startNode()), this.next(), this.finishNode(r, 'NullLiteral');
      case a._true:
      case a._false:
        return (
          (r = this.startNode()), (r.value = this.match(a._true)), this.next(), this.finishNode(r, 'BooleanLiteral')
        );
      case a.parenL:
        return this.parseParenAndDistinguishExpression(null, null, e);
      case a.bracketL:
        return (
          (r = this.startNode()),
          this.next(),
          (r.elements = this.parseExprList(a.bracketR, !0, t)),
          this.toReferencedList(r.elements),
          this.finishNode(r, 'ArrayExpression')
        );
      case a.braceL:
        return this.parseObj(!1, t);
      case a._function:
        return this.parseFunctionExpression();
      case a.at:
        this.parseDecorators();
      case a._class:
        return (r = this.startNode()), this.takeDecorators(r), this.parseClass(r, !1);
      case a._new:
        return this.parseNew();
      case a.backQuote:
        return this.parseTemplate(!1);
      case a.doubleColon:
        (r = this.startNode()), this.next(), (r.object = null);
        var m = (r.callee = this.parseNoCallExpr());
        if (m.type === 'MemberExpression') return this.finishNode(r, 'BindExpression');
        this.raise(m.start, 'Binding should be performed on object property.');
      default:
        this.unexpected();
    }
  };
  F.parseFunctionExpression = function () {
    var t = this.startNode(),
      e = this.parseIdentifier(!0);
    return this.state.inGenerator && this.eat(a.dot) && this.hasPlugin('functionSent')
      ? this.parseMetaProperty(t, e, 'sent')
      : this.parseFunction(t, !1);
  };
  F.parseMetaProperty = function (t, e, r) {
    return (
      (t.meta = e),
      (t.property = this.parseIdentifier(!0)),
      t.property.name !== r &&
        this.raise(t.property.start, 'The only valid meta property for new is ' + e.name + '.' + r),
      this.finishNode(t, 'MetaProperty')
    );
  };
  F.parseLiteral = function (t, e, r, s) {
    (r = r || this.state.start), (s = s || this.state.startLoc);
    var i = this.startNodeAt(r, s);
    return (
      this.addExtra(i, 'rawValue', t),
      this.addExtra(i, 'raw', this.input.slice(r, this.state.end)),
      (i.value = t),
      this.next(),
      this.finishNode(i, e)
    );
  };
  F.parseParenExpression = function () {
    this.expect(a.parenL);
    var t = this.parseExpression();
    return this.expect(a.parenR), t;
  };
  F.parseParenAndDistinguishExpression = function (t, e, r) {
    (t = t || this.state.start), (e = e || this.state.startLoc);
    var s = void 0;
    this.expect(a.parenL);
    for (
      var i = this.state.start,
        n = this.state.startLoc,
        o = [],
        u = { start: 0 },
        c = { start: 0 },
        h = !0,
        p = void 0,
        m = void 0;
      !this.match(a.parenR);
    ) {
      if (h) h = !1;
      else if ((this.expect(a.comma, c.start || null), this.match(a.parenR))) {
        m = this.state.start;
        break;
      }
      if (this.match(a.ellipsis)) {
        var d = this.state.start,
          y = this.state.startLoc;
        (p = this.state.start), o.push(this.parseParenItem(this.parseRest(), d, y));
        break;
      } else o.push(this.parseMaybeAssign(!1, u, this.parseParenItem, c));
    }
    var E = this.state.start,
      v = this.state.startLoc;
    this.expect(a.parenR);
    var N = this.startNodeAt(t, e);
    if (r && this.shouldParseArrow() && (N = this.parseArrow(N))) {
      for (var C = o, T = Array.isArray(C), A = 0, C = T ? C : C[Symbol.iterator](); ; ) {
        var S;
        if (T) {
          if (A >= C.length) break;
          S = C[A++];
        } else {
          if (((A = C.next()), A.done)) break;
          S = A.value;
        }
        var g = S;
        g.extra && g.extra.parenthesized && this.unexpected(g.extra.parenStart);
      }
      return this.parseArrowExpression(N, o);
    }
    return (
      o.length || this.unexpected(this.state.lastTokStart),
      m && this.unexpected(m),
      p && this.unexpected(p),
      u.start && this.unexpected(u.start),
      c.start && this.unexpected(c.start),
      o.length > 1
        ? ((s = this.startNodeAt(i, n)),
          (s.expressions = o),
          this.toReferencedList(s.expressions),
          this.finishNodeAt(s, 'SequenceExpression', E, v))
        : (s = o[0]),
      this.addExtra(s, 'parenthesized', !0),
      this.addExtra(s, 'parenStart', t),
      s
    );
  };
  F.shouldParseArrow = function () {
    return !this.canInsertSemicolon();
  };
  F.parseArrow = function (t) {
    if (this.eat(a.arrow)) return t;
  };
  F.parseParenItem = function (t) {
    return t;
  };
  F.parseNew = function () {
    var t = this.startNode(),
      e = this.parseIdentifier(!0);
    if (this.eat(a.dot)) {
      var r = this.parseMetaProperty(t, e, 'target');
      return this.state.inFunction || this.raise(r.property.start, 'new.target can only be used in functions'), r;
    }
    return (
      (t.callee = this.parseNoCallExpr()),
      this.eat(a.parenL)
        ? ((t.arguments = this.parseExprList(a.parenR)), this.toReferencedList(t.arguments))
        : (t.arguments = []),
      this.finishNode(t, 'NewExpression')
    );
  };
  F.parseTemplateElement = function (t) {
    var e = this.startNode();
    return (
      this.state.value === null &&
        (!t || !this.hasPlugin('templateInvalidEscapes')
          ? this.raise(this.state.invalidTemplateEscapePosition, 'Invalid escape sequence in template')
          : (this.state.invalidTemplateEscapePosition = null)),
      (e.value = {
        raw: this.input.slice(this.state.start, this.state.end).replace(
          /\r\n?/g,
          `
`
        ),
        cooked: this.state.value,
      }),
      this.next(),
      (e.tail = this.match(a.backQuote)),
      this.finishNode(e, 'TemplateElement')
    );
  };
  F.parseTemplate = function (t) {
    var e = this.startNode();
    this.next(), (e.expressions = []);
    var r = this.parseTemplateElement(t);
    for (e.quasis = [r]; !r.tail; )
      this.expect(a.dollarBraceL),
        e.expressions.push(this.parseExpression()),
        this.expect(a.braceR),
        e.quasis.push((r = this.parseTemplateElement(t)));
    return this.next(), this.finishNode(e, 'TemplateLiteral');
  };
  F.parseObj = function (t, e) {
    var r = [],
      s = Object.create(null),
      i = !0,
      n = this.startNode();
    (n.properties = []), this.next();
    for (var o = null; !this.eat(a.braceR); ) {
      if (i) i = !1;
      else if ((this.expect(a.comma), this.eat(a.braceR))) break;
      for (; this.match(a.at); ) r.push(this.parseDecorator());
      var u = this.startNode(),
        c = !1,
        h = !1,
        p = void 0,
        m = void 0;
      if ((r.length && ((u.decorators = r), (r = [])), this.hasPlugin('objectRestSpread') && this.match(a.ellipsis)))
        if (
          ((u = this.parseSpread(t ? { start: 0 } : void 0)),
          (u.type = t ? 'RestProperty' : 'SpreadProperty'),
          t && this.toAssignable(u.argument, !0, 'object pattern'),
          n.properties.push(u),
          t)
        ) {
          var d = this.state.start;
          if (o !== null) this.unexpected(o, 'Cannot have multiple rest elements when destructuring');
          else {
            if (this.eat(a.braceR)) break;
            if (this.match(a.comma) && this.lookahead().type === a.braceR) continue;
            o = d;
            continue;
          }
        } else continue;
      if (
        ((u.method = !1),
        (u.shorthand = !1),
        (t || e) && ((p = this.state.start), (m = this.state.startLoc)),
        t || (c = this.eat(a.star)),
        !t && this.isContextual('async'))
      ) {
        c && this.unexpected();
        var y = this.parseIdentifier();
        this.match(a.colon) || this.match(a.parenL) || this.match(a.braceR) || this.match(a.eq) || this.match(a.comma)
          ? ((u.key = y), (u.computed = !1))
          : ((h = !0), this.hasPlugin('asyncGenerators') && (c = this.eat(a.star)), this.parsePropertyName(u));
      } else this.parsePropertyName(u);
      this.parseObjPropValue(u, p, m, c, h, t, e),
        this.checkPropClash(u, s),
        u.shorthand && this.addExtra(u, 'shorthand', !0),
        n.properties.push(u);
    }
    return (
      o !== null && this.unexpected(o, 'The rest element has to be the last element when destructuring'),
      r.length && this.raise(this.state.start, 'You have trailing decorators with no property'),
      this.finishNode(n, t ? 'ObjectPattern' : 'ObjectExpression')
    );
  };
  F.isGetterOrSetterMethod = function (t, e) {
    return (
      !e &&
      !t.computed &&
      t.key.type === 'Identifier' &&
      (t.key.name === 'get' || t.key.name === 'set') &&
      (this.match(a.string) ||
        this.match(a.num) ||
        this.match(a.bracketL) ||
        this.match(a.name) ||
        this.state.type.keyword)
    );
  };
  F.checkGetterSetterParamCount = function (t) {
    var e = t.kind === 'get' ? 0 : 1;
    if (t.params.length !== e) {
      var r = t.start;
      t.kind === 'get'
        ? this.raise(r, 'getter should have no params')
        : this.raise(r, 'setter should have exactly one param');
    }
  };
  F.parseObjectMethod = function (t, e, r, s) {
    if (r || e || this.match(a.parenL))
      return (
        s && this.unexpected(),
        (t.kind = 'method'),
        (t.method = !0),
        this.parseMethod(t, e, r),
        this.finishNode(t, 'ObjectMethod')
      );
    if (this.isGetterOrSetterMethod(t, s))
      return (
        (e || r) && this.unexpected(),
        (t.kind = t.key.name),
        this.parsePropertyName(t),
        this.parseMethod(t),
        this.checkGetterSetterParamCount(t),
        this.finishNode(t, 'ObjectMethod')
      );
  };
  F.parseObjectProperty = function (t, e, r, s, i) {
    if (this.eat(a.colon))
      return (
        (t.value = s ? this.parseMaybeDefault(this.state.start, this.state.startLoc) : this.parseMaybeAssign(!1, i)),
        this.finishNode(t, 'ObjectProperty')
      );
    if (!t.computed && t.key.type === 'Identifier')
      return (
        this.checkReservedWord(t.key.name, t.key.start, !0, !0),
        s
          ? (t.value = this.parseMaybeDefault(e, r, t.key.__clone()))
          : this.match(a.eq) && i
            ? (i.start || (i.start = this.state.start), (t.value = this.parseMaybeDefault(e, r, t.key.__clone())))
            : (t.value = t.key.__clone()),
        (t.shorthand = !0),
        this.finishNode(t, 'ObjectProperty')
      );
  };
  F.parseObjPropValue = function (t, e, r, s, i, n, o) {
    var u = this.parseObjectMethod(t, s, i, n) || this.parseObjectProperty(t, e, r, n, o);
    return u || this.unexpected(), u;
  };
  F.parsePropertyName = function (t) {
    if (this.eat(a.bracketL)) (t.computed = !0), (t.key = this.parseMaybeAssign()), this.expect(a.bracketR);
    else {
      t.computed = !1;
      var e = this.state.inPropertyName;
      (this.state.inPropertyName = !0),
        (t.key = this.match(a.num) || this.match(a.string) ? this.parseExprAtom() : this.parseIdentifier(!0)),
        (this.state.inPropertyName = e);
    }
    return t.key;
  };
  F.initFunction = function (t, e) {
    (t.id = null), (t.generator = !1), (t.expression = !1), (t.async = !!e);
  };
  F.parseMethod = function (t, e, r) {
    var s = this.state.inMethod;
    return (
      (this.state.inMethod = t.kind || !0),
      this.initFunction(t, r),
      this.expect(a.parenL),
      (t.params = this.parseBindingList(a.parenR)),
      (t.generator = !!e),
      this.parseFunctionBody(t),
      (this.state.inMethod = s),
      t
    );
  };
  F.parseArrowExpression = function (t, e, r) {
    return (
      this.initFunction(t, r),
      (t.params = this.toAssignableList(e, !0, 'arrow function parameters')),
      this.parseFunctionBody(t, !0),
      this.finishNode(t, 'ArrowFunctionExpression')
    );
  };
  F.isStrictBody = function (t, e) {
    if (!e && t.body.directives.length)
      for (var i = t.body.directives, r = Array.isArray(i), s = 0, i = r ? i : i[Symbol.iterator](); ; ) {
        var n;
        if (r) {
          if (s >= i.length) break;
          n = i[s++];
        } else {
          if (((s = i.next()), s.done)) break;
          n = s.value;
        }
        var o = n;
        if (o.value.value === 'use strict') return !0;
      }
    return !1;
  };
  F.parseFunctionBody = function (t, e) {
    var r = e && !this.match(a.braceL),
      s = this.state.inAsync;
    if (((this.state.inAsync = t.async), r)) (t.body = this.parseMaybeAssign()), (t.expression = !0);
    else {
      var i = this.state.inFunction,
        n = this.state.inGenerator,
        o = this.state.labels;
      (this.state.inFunction = !0),
        (this.state.inGenerator = t.generator),
        (this.state.labels = []),
        (t.body = this.parseBlock(!0)),
        (t.expression = !1),
        (this.state.inFunction = i),
        (this.state.inGenerator = n),
        (this.state.labels = o);
    }
    this.state.inAsync = s;
    var u = this.isStrictBody(t, r),
      c = this.state.strict || e || u;
    if (
      (u &&
        t.id &&
        t.id.type === 'Identifier' &&
        t.id.name === 'yield' &&
        this.raise(t.id.start, 'Binding yield in strict mode'),
      c)
    ) {
      var h = Object.create(null),
        p = this.state.strict;
      u && (this.state.strict = !0), t.id && this.checkLVal(t.id, !0, void 0, 'function name');
      for (var y = t.params, m = Array.isArray(y), d = 0, y = m ? y : y[Symbol.iterator](); ; ) {
        var E;
        if (m) {
          if (d >= y.length) break;
          E = y[d++];
        } else {
          if (((d = y.next()), d.done)) break;
          E = d.value;
        }
        var v = E;
        u && v.type !== 'Identifier' && this.raise(v.start, 'Non-simple parameter in strict mode'),
          this.checkLVal(v, !0, h, 'function parameter list');
      }
      this.state.strict = p;
    }
  };
  F.parseExprList = function (t, e, r) {
    for (var s = [], i = !0; !this.eat(t); ) {
      if (i) i = !1;
      else if ((this.expect(a.comma), this.eat(t))) break;
      s.push(this.parseExprListItem(e, r));
    }
    return s;
  };
  F.parseExprListItem = function (t, e, r) {
    var s = void 0;
    return (
      t && this.match(a.comma)
        ? (s = null)
        : this.match(a.ellipsis)
          ? (s = this.parseSpread(e))
          : (s = this.parseMaybeAssign(!1, e, this.parseParenItem, r)),
      s
    );
  };
  F.parseIdentifier = function (t) {
    var e = this.startNode();
    return (
      t || this.checkReservedWord(this.state.value, this.state.start, !!this.state.type.keyword, !1),
      this.match(a.name)
        ? (e.name = this.state.value)
        : this.state.type.keyword
          ? (e.name = this.state.type.keyword)
          : this.unexpected(),
      !t &&
        e.name === 'await' &&
        this.state.inAsync &&
        this.raise(e.start, 'invalid use of await inside of an async function'),
      (e.loc.identifierName = e.name),
      this.next(),
      this.finishNode(e, 'Identifier')
    );
  };
  F.checkReservedWord = function (t, e, r, s) {
    (this.isReservedWord(t) || (r && this.isKeyword(t))) && this.raise(e, t + ' is a reserved word'),
      this.state.strict &&
        (er.strict(t) || (s && er.strictBind(t))) &&
        this.raise(e, t + ' is a reserved word in strict mode');
  };
  F.parseAwait = function (t) {
    return (
      this.state.inAsync || this.unexpected(),
      this.match(a.star) &&
        this.raise(t.start, 'await* has been removed from the async functions proposal. Use Promise.all() instead.'),
      (t.argument = this.parseMaybeUnary()),
      this.finishNode(t, 'AwaitExpression')
    );
  };
  F.parseYield = function () {
    var t = this.startNode();
    return (
      this.next(),
      this.match(a.semi) || this.canInsertSemicolon() || (!this.match(a.star) && !this.state.type.startsExpr)
        ? ((t.delegate = !1), (t.argument = null))
        : ((t.delegate = this.eat(a.star)), (t.argument = this.parseMaybeAssign())),
      this.finishNode(t, 'YieldExpression')
    );
  };
  var be = st.prototype,
    Uc = ['leadingComments', 'trailingComments', 'innerComments'],
    sn = (function () {
      function t(e, r, s) {
        ut(this, t),
          (this.type = ''),
          (this.start = e),
          (this.end = 0),
          (this.loc = new cr(r)),
          s && (this.loc.filename = s);
      }
      return (
        (t.prototype.__clone = function () {
          var r = new t();
          for (var s in this) Uc.indexOf(s) < 0 && (r[s] = this[s]);
          return r;
        }),
        t
      );
    })();
  be.startNode = function () {
    return new sn(this.state.start, this.state.startLoc, this.filename);
  };
  be.startNodeAt = function (t, e) {
    return new sn(t, e, this.filename);
  };
  function nn(t, e, r, s) {
    return (t.type = e), (t.end = r), (t.loc.end = s), this.processComment(t), t;
  }
  be.finishNode = function (t, e) {
    return nn.call(this, t, e, this.state.lastTokEnd, this.state.lastTokEndLoc);
  };
  be.finishNodeAt = function (t, e, r, s) {
    return nn.call(this, t, e, r, s);
  };
  var Gc = st.prototype;
  Gc.raise = function (t, e) {
    var r = _c(this.input, t);
    e += ' (' + r.line + ':' + r.column + ')';
    var s = new SyntaxError(e);
    throw ((s.pos = t), (s.loc = r), s);
  };
  function gt(t) {
    return t[t.length - 1];
  }
  var an = st.prototype;
  an.addComment = function (t) {
    this.filename && (t.loc.filename = this.filename),
      this.state.trailingComments.push(t),
      this.state.leadingComments.push(t);
  };
  an.processComment = function (t) {
    if (!(t.type === 'Program' && t.body.length > 0)) {
      var e = this.state.commentStack,
        r = void 0,
        s = void 0,
        i = void 0,
        n = void 0,
        o = void 0;
      if (this.state.trailingComments.length > 0)
        this.state.trailingComments[0].start >= t.end
          ? ((i = this.state.trailingComments), (this.state.trailingComments = []))
          : (this.state.trailingComments.length = 0);
      else {
        var u = gt(e);
        e.length > 0 &&
          u.trailingComments &&
          u.trailingComments[0].start >= t.end &&
          ((i = u.trailingComments), (u.trailingComments = null));
      }
      for (e.length > 0 && gt(e).start >= t.start && (r = e.pop()); e.length > 0 && gt(e).start >= t.start; )
        s = e.pop();
      if ((!s && r && (s = r), r && this.state.leadingComments.length > 0)) {
        var c = gt(this.state.leadingComments);
        if (r.type === 'ObjectProperty') {
          if (c.start >= t.start && this.state.commentPreviousNode) {
            for (o = 0; o < this.state.leadingComments.length; o++)
              this.state.leadingComments[o].end < this.state.commentPreviousNode.end &&
                (this.state.leadingComments.splice(o, 1), o--);
            this.state.leadingComments.length > 0 &&
              ((r.trailingComments = this.state.leadingComments), (this.state.leadingComments = []));
          }
        } else if (t.type === 'CallExpression' && t.arguments && t.arguments.length) {
          var h = gt(t.arguments);
          h &&
            c.start >= h.start &&
            c.end <= t.end &&
            this.state.commentPreviousNode &&
            this.state.leadingComments.length > 0 &&
            ((h.trailingComments = this.state.leadingComments), (this.state.leadingComments = []));
        }
      }
      if (s) {
        if (s.leadingComments) {
          if (s !== t && gt(s.leadingComments).end <= t.start)
            (t.leadingComments = s.leadingComments), (s.leadingComments = null);
          else
            for (n = s.leadingComments.length - 2; n >= 0; --n)
              if (s.leadingComments[n].end <= t.start) {
                t.leadingComments = s.leadingComments.splice(0, n + 1);
                break;
              }
        }
      } else if (this.state.leadingComments.length > 0)
        if (gt(this.state.leadingComments).end <= t.start) {
          if (this.state.commentPreviousNode)
            for (o = 0; o < this.state.leadingComments.length; o++)
              this.state.leadingComments[o].end < this.state.commentPreviousNode.end &&
                (this.state.leadingComments.splice(o, 1), o--);
          this.state.leadingComments.length > 0 &&
            ((t.leadingComments = this.state.leadingComments), (this.state.leadingComments = []));
        } else {
          for (n = 0; n < this.state.leadingComments.length && !(this.state.leadingComments[n].end > t.start); n++);
          (t.leadingComments = this.state.leadingComments.slice(0, n)),
            t.leadingComments.length === 0 && (t.leadingComments = null),
            (i = this.state.leadingComments.slice(n)),
            i.length === 0 && (i = null);
        }
      (this.state.commentPreviousNode = t),
        i &&
          (i.length && i[0].start >= t.start && gt(i).end <= t.end ? (t.innerComments = i) : (t.trailingComments = i)),
        e.push(t);
    }
  };
  var lr = st.prototype;
  lr.estreeParseRegExpLiteral = function (t) {
    var e = t.pattern,
      r = t.flags,
      s = null;
    try {
      s = new RegExp(e, r);
    } catch {}
    var i = this.estreeParseLiteral(s);
    return (i.regex = { pattern: e, flags: r }), i;
  };
  lr.estreeParseLiteral = function (t) {
    return this.parseLiteral(t, 'Literal');
  };
  lr.directiveToStmt = function (t) {
    var e = t.value,
      r = this.startNodeAt(t.start, t.loc.start),
      s = this.startNodeAt(e.start, e.loc.start);
    return (
      (s.value = e.value),
      (s.raw = e.extra.raw),
      (r.expression = this.finishNodeAt(s, 'Literal', e.end, e.loc.end)),
      (r.directive = e.extra.raw.slice(1, -1)),
      this.finishNodeAt(r, 'ExpressionStatement', t.end, t.loc.end)
    );
  };
  function tr(t) {
    return t && t.type === 'Property' && t.kind === 'init' && t.method === !1;
  }
  var Kc = function (t) {
      t.extend('checkDeclaration', function (e) {
        return function (r) {
          tr(r) ? this.checkDeclaration(r.value) : e.call(this, r);
        };
      }),
        t.extend('checkGetterSetterParamCount', function () {
          return function (e) {
            var r = e.kind === 'get' ? 0 : 1;
            if (e.value.params.length !== r) {
              var s = e.start;
              e.kind === 'get'
                ? this.raise(s, 'getter should have no params')
                : this.raise(s, 'setter should have exactly one param');
            }
          };
        }),
        t.extend('checkLVal', function (e) {
          return function (r, s, i) {
            var n = this;
            switch (r.type) {
              case 'ObjectPattern':
                r.properties.forEach(function (h) {
                  n.checkLVal(h.type === 'Property' ? h.value : h, s, i, 'object destructuring pattern');
                });
                break;
              default:
                for (var o = arguments.length, u = Array(o > 3 ? o - 3 : 0), c = 3; c < o; c++) u[c - 3] = arguments[c];
                e.call.apply(e, [this, r, s, i].concat(u));
            }
          };
        }),
        t.extend('checkPropClash', function () {
          return function (e, r) {
            if (!(e.computed || !tr(e))) {
              var s = e.key,
                i = s.type === 'Identifier' ? s.name : String(s.value);
              i === '__proto__' &&
                (r.proto && this.raise(s.start, 'Redefinition of __proto__ property'), (r.proto = !0));
            }
          };
        }),
        t.extend('isStrictBody', function () {
          return function (e, r) {
            if (!r && e.body.body.length > 0)
              for (var n = e.body.body, s = Array.isArray(n), i = 0, n = s ? n : n[Symbol.iterator](); ; ) {
                var o;
                if (s) {
                  if (i >= n.length) break;
                  o = n[i++];
                } else {
                  if (((i = n.next()), i.done)) break;
                  o = i.value;
                }
                var u = o;
                if (u.type === 'ExpressionStatement' && u.expression.type === 'Literal') {
                  if (u.expression.value === 'use strict') return !0;
                } else break;
              }
            return !1;
          };
        }),
        t.extend('isValidDirective', function () {
          return function (e) {
            return (
              e.type === 'ExpressionStatement' &&
              e.expression.type === 'Literal' &&
              typeof e.expression.value == 'string' &&
              (!e.expression.extra || !e.expression.extra.parenthesized)
            );
          };
        }),
        t.extend('stmtToDirective', function (e) {
          return function (r) {
            var s = e.call(this, r),
              i = r.expression.value;
            return (s.value.value = i), s;
          };
        }),
        t.extend('parseBlockBody', function (e) {
          return function (r) {
            for (var s = this, i = arguments.length, n = Array(i > 1 ? i - 1 : 0), o = 1; o < i; o++)
              n[o - 1] = arguments[o];
            e.call.apply(e, [this, r].concat(n)),
              r.directives.reverse().forEach(function (u) {
                r.body.unshift(s.directiveToStmt(u));
              }),
              delete r.directives;
          };
        }),
        t.extend('parseClassMethod', function () {
          return function (e, r, s, i) {
            this.parseMethod(r, s, i),
              r.typeParameters && ((r.value.typeParameters = r.typeParameters), delete r.typeParameters),
              e.body.push(this.finishNode(r, 'MethodDefinition'));
          };
        }),
        t.extend('parseExprAtom', function (e) {
          return function () {
            switch (this.state.type) {
              case a.regexp:
                return this.estreeParseRegExpLiteral(this.state.value);
              case a.num:
              case a.string:
                return this.estreeParseLiteral(this.state.value);
              case a._null:
                return this.estreeParseLiteral(null);
              case a._true:
                return this.estreeParseLiteral(!0);
              case a._false:
                return this.estreeParseLiteral(!1);
              default:
                for (var r = arguments.length, s = Array(r), i = 0; i < r; i++) s[i] = arguments[i];
                return e.call.apply(e, [this].concat(s));
            }
          };
        }),
        t.extend('parseLiteral', function (e) {
          return function () {
            for (var r = arguments.length, s = Array(r), i = 0; i < r; i++) s[i] = arguments[i];
            var n = e.call.apply(e, [this].concat(s));
            return (n.raw = n.extra.raw), delete n.extra, n;
          };
        }),
        t.extend('parseMethod', function (e) {
          return function (r) {
            var s = this.startNode();
            s.kind = r.kind;
            for (var i = arguments.length, n = Array(i > 1 ? i - 1 : 0), o = 1; o < i; o++) n[o - 1] = arguments[o];
            return (
              (s = e.call.apply(e, [this, s].concat(n))),
              delete s.kind,
              (r.value = this.finishNode(s, 'FunctionExpression')),
              r
            );
          };
        }),
        t.extend('parseObjectMethod', function (e) {
          return function () {
            for (var r = arguments.length, s = Array(r), i = 0; i < r; i++) s[i] = arguments[i];
            var n = e.call.apply(e, [this].concat(s));
            return n && (n.kind === 'method' && (n.kind = 'init'), (n.type = 'Property')), n;
          };
        }),
        t.extend('parseObjectProperty', function (e) {
          return function () {
            for (var r = arguments.length, s = Array(r), i = 0; i < r; i++) s[i] = arguments[i];
            var n = e.call.apply(e, [this].concat(s));
            return n && ((n.kind = 'init'), (n.type = 'Property')), n;
          };
        }),
        t.extend('toAssignable', function (e) {
          return function (r, s) {
            for (var i = arguments.length, n = Array(i > 2 ? i - 2 : 0), o = 2; o < i; o++) n[o - 2] = arguments[o];
            if (tr(r)) return this.toAssignable.apply(this, [r.value, s].concat(n)), r;
            if (r.type === 'ObjectExpression') {
              r.type = 'ObjectPattern';
              for (var h = r.properties, u = Array.isArray(h), c = 0, h = u ? h : h[Symbol.iterator](); ; ) {
                var p;
                if (u) {
                  if (c >= h.length) break;
                  p = h[c++];
                } else {
                  if (((c = h.next()), c.done)) break;
                  p = c.value;
                }
                var m = p;
                m.kind === 'get' || m.kind === 'set'
                  ? this.raise(m.key.start, "Object pattern can't contain getter or setter")
                  : m.method
                    ? this.raise(m.key.start, "Object pattern can't contain methods")
                    : this.toAssignable(m, s, 'object destructuring pattern');
              }
              return r;
            }
            return e.call.apply(e, [this, r, s].concat(n));
          };
        });
    },
    zc = ['any', 'mixed', 'empty', 'bool', 'boolean', 'number', 'string', 'void', 'null'],
    P = st.prototype;
  P.flowParseTypeInitialiser = function (t) {
    var e = this.state.inType;
    (this.state.inType = !0), this.expect(t || a.colon);
    var r = this.flowParseType();
    return (this.state.inType = e), r;
  };
  P.flowParsePredicate = function () {
    var t = this.startNode(),
      e = this.state.startLoc,
      r = this.state.start;
    this.expect(a.modulo);
    var s = this.state.startLoc;
    return (
      this.expectContextual('checks'),
      (e.line !== s.line || e.column !== s.column - 1) &&
        this.raise(r, 'Spaces between \xB4%\xB4 and \xB4checks\xB4 are not allowed here.'),
      this.eat(a.parenL)
        ? ((t.expression = this.parseExpression()), this.expect(a.parenR), this.finishNode(t, 'DeclaredPredicate'))
        : this.finishNode(t, 'InferredPredicate')
    );
  };
  P.flowParseTypeAndPredicateInitialiser = function () {
    var t = this.state.inType;
    (this.state.inType = !0), this.expect(a.colon);
    var e = null,
      r = null;
    return (
      this.match(a.modulo)
        ? ((this.state.inType = t), (r = this.flowParsePredicate()))
        : ((e = this.flowParseType()),
          (this.state.inType = t),
          this.match(a.modulo) && (r = this.flowParsePredicate())),
      [e, r]
    );
  };
  P.flowParseDeclareClass = function (t) {
    return this.next(), this.flowParseInterfaceish(t, !0), this.finishNode(t, 'DeclareClass');
  };
  P.flowParseDeclareFunction = function (t) {
    this.next();
    var e = (t.id = this.parseIdentifier()),
      r = this.startNode(),
      s = this.startNode();
    this.isRelational('<') ? (r.typeParameters = this.flowParseTypeParameterDeclaration()) : (r.typeParameters = null),
      this.expect(a.parenL);
    var i = this.flowParseFunctionTypeParams();
    (r.params = i.params), (r.rest = i.rest), this.expect(a.parenR);
    var n = null,
      o = this.flowParseTypeAndPredicateInitialiser();
    return (
      (r.returnType = o[0]),
      (n = o[1]),
      (s.typeAnnotation = this.finishNode(r, 'FunctionTypeAnnotation')),
      (s.predicate = n),
      (e.typeAnnotation = this.finishNode(s, 'TypeAnnotation')),
      this.finishNode(e, e.type),
      this.semicolon(),
      this.finishNode(t, 'DeclareFunction')
    );
  };
  P.flowParseDeclare = function (t) {
    if (this.match(a._class)) return this.flowParseDeclareClass(t);
    if (this.match(a._function)) return this.flowParseDeclareFunction(t);
    if (this.match(a._var)) return this.flowParseDeclareVariable(t);
    if (this.isContextual('module'))
      return this.lookahead().type === a.dot ? this.flowParseDeclareModuleExports(t) : this.flowParseDeclareModule(t);
    if (this.isContextual('type')) return this.flowParseDeclareTypeAlias(t);
    if (this.isContextual('opaque')) return this.flowParseDeclareOpaqueType(t);
    if (this.isContextual('interface')) return this.flowParseDeclareInterface(t);
    if (this.match(a._export)) return this.flowParseDeclareExportDeclaration(t);
    this.unexpected();
  };
  P.flowParseDeclareExportDeclaration = function (t) {
    if ((this.expect(a._export), this.isContextual('opaque')))
      return (
        (t.declaration = this.flowParseDeclare(this.startNode())),
        (t.default = !1),
        this.finishNode(t, 'DeclareExportDeclaration')
      );
    throw this.unexpected();
  };
  P.flowParseDeclareVariable = function (t) {
    return (
      this.next(),
      (t.id = this.flowParseTypeAnnotatableIdentifier()),
      this.semicolon(),
      this.finishNode(t, 'DeclareVariable')
    );
  };
  P.flowParseDeclareModule = function (t) {
    this.next(), this.match(a.string) ? (t.id = this.parseExprAtom()) : (t.id = this.parseIdentifier());
    var e = (t.body = this.startNode()),
      r = (e.body = []);
    for (this.expect(a.braceL); !this.match(a.braceR); ) {
      var s = this.startNode();
      if (this.match(a._import)) {
        var i = this.lookahead();
        i.value !== 'type' &&
          i.value !== 'typeof' &&
          this.unexpected(
            null,
            'Imports within a `declare module` body must always be `import type` or `import typeof`'
          ),
          this.parseImport(s);
      } else
        this.expectContextual('declare', 'Only declares and type imports are allowed inside declare module'),
          (s = this.flowParseDeclare(s, !0));
      r.push(s);
    }
    return this.expect(a.braceR), this.finishNode(e, 'BlockStatement'), this.finishNode(t, 'DeclareModule');
  };
  P.flowParseDeclareModuleExports = function (t) {
    return (
      this.expectContextual('module'),
      this.expect(a.dot),
      this.expectContextual('exports'),
      (t.typeAnnotation = this.flowParseTypeAnnotation()),
      this.semicolon(),
      this.finishNode(t, 'DeclareModuleExports')
    );
  };
  P.flowParseDeclareTypeAlias = function (t) {
    return this.next(), this.flowParseTypeAlias(t), this.finishNode(t, 'DeclareTypeAlias');
  };
  P.flowParseDeclareOpaqueType = function (t) {
    return this.next(), this.flowParseOpaqueType(t, !0), this.finishNode(t, 'DeclareOpaqueType');
  };
  P.flowParseDeclareInterface = function (t) {
    return this.next(), this.flowParseInterfaceish(t), this.finishNode(t, 'DeclareInterface');
  };
  P.flowParseInterfaceish = function (t) {
    if (
      ((t.id = this.parseIdentifier()),
      this.isRelational('<')
        ? (t.typeParameters = this.flowParseTypeParameterDeclaration())
        : (t.typeParameters = null),
      (t.extends = []),
      (t.mixins = []),
      this.eat(a._extends))
    )
      do t.extends.push(this.flowParseInterfaceExtends());
      while (this.eat(a.comma));
    if (this.isContextual('mixins')) {
      this.next();
      do t.mixins.push(this.flowParseInterfaceExtends());
      while (this.eat(a.comma));
    }
    t.body = this.flowParseObjectType(!0, !1, !1);
  };
  P.flowParseInterfaceExtends = function () {
    var t = this.startNode();
    return (
      (t.id = this.flowParseQualifiedTypeIdentifier()),
      this.isRelational('<')
        ? (t.typeParameters = this.flowParseTypeParameterInstantiation())
        : (t.typeParameters = null),
      this.finishNode(t, 'InterfaceExtends')
    );
  };
  P.flowParseInterface = function (t) {
    return this.flowParseInterfaceish(t, !1), this.finishNode(t, 'InterfaceDeclaration');
  };
  P.flowParseRestrictedIdentifier = function (t) {
    return (
      zc.indexOf(this.state.value) > -1 &&
        this.raise(this.state.start, 'Cannot overwrite primitive type ' + this.state.value),
      this.parseIdentifier(t)
    );
  };
  P.flowParseTypeAlias = function (t) {
    return (
      (t.id = this.flowParseRestrictedIdentifier()),
      this.isRelational('<')
        ? (t.typeParameters = this.flowParseTypeParameterDeclaration())
        : (t.typeParameters = null),
      (t.right = this.flowParseTypeInitialiser(a.eq)),
      this.semicolon(),
      this.finishNode(t, 'TypeAlias')
    );
  };
  P.flowParseOpaqueType = function (t, e) {
    return (
      this.expectContextual('type'),
      (t.id = this.flowParseRestrictedIdentifier()),
      this.isRelational('<')
        ? (t.typeParameters = this.flowParseTypeParameterDeclaration())
        : (t.typeParameters = null),
      (t.supertype = null),
      this.match(a.colon) && (t.supertype = this.flowParseTypeInitialiser(a.colon)),
      (t.impltype = null),
      e || (t.impltype = this.flowParseTypeInitialiser(a.eq)),
      this.semicolon(),
      this.finishNode(t, 'OpaqueType')
    );
  };
  P.flowParseTypeParameter = function () {
    var t = this.startNode(),
      e = this.flowParseVariance(),
      r = this.flowParseTypeAnnotatableIdentifier();
    return (
      (t.name = r.name),
      (t.variance = e),
      (t.bound = r.typeAnnotation),
      this.match(a.eq) && (this.eat(a.eq), (t.default = this.flowParseType())),
      this.finishNode(t, 'TypeParameter')
    );
  };
  P.flowParseTypeParameterDeclaration = function () {
    var t = this.state.inType,
      e = this.startNode();
    (e.params = []),
      (this.state.inType = !0),
      this.isRelational('<') || this.match(a.jsxTagStart) ? this.next() : this.unexpected();
    do e.params.push(this.flowParseTypeParameter()), this.isRelational('>') || this.expect(a.comma);
    while (!this.isRelational('>'));
    return this.expectRelational('>'), (this.state.inType = t), this.finishNode(e, 'TypeParameterDeclaration');
  };
  P.flowParseTypeParameterInstantiation = function () {
    var t = this.startNode(),
      e = this.state.inType;
    for (t.params = [], this.state.inType = !0, this.expectRelational('<'); !this.isRelational('>'); )
      t.params.push(this.flowParseType()), this.isRelational('>') || this.expect(a.comma);
    return this.expectRelational('>'), (this.state.inType = e), this.finishNode(t, 'TypeParameterInstantiation');
  };
  P.flowParseObjectPropertyKey = function () {
    return this.match(a.num) || this.match(a.string) ? this.parseExprAtom() : this.parseIdentifier(!0);
  };
  P.flowParseObjectTypeIndexer = function (t, e, r) {
    return (
      (t.static = e),
      this.expect(a.bracketL),
      this.lookahead().type === a.colon
        ? ((t.id = this.flowParseObjectPropertyKey()), (t.key = this.flowParseTypeInitialiser()))
        : ((t.id = null), (t.key = this.flowParseType())),
      this.expect(a.bracketR),
      (t.value = this.flowParseTypeInitialiser()),
      (t.variance = r),
      this.flowObjectTypeSemicolon(),
      this.finishNode(t, 'ObjectTypeIndexer')
    );
  };
  P.flowParseObjectTypeMethodish = function (t) {
    for (
      t.params = [],
        t.rest = null,
        t.typeParameters = null,
        this.isRelational('<') && (t.typeParameters = this.flowParseTypeParameterDeclaration()),
        this.expect(a.parenL);
      !this.match(a.parenR) && !this.match(a.ellipsis);
    )
      t.params.push(this.flowParseFunctionTypeParam()), this.match(a.parenR) || this.expect(a.comma);
    return (
      this.eat(a.ellipsis) && (t.rest = this.flowParseFunctionTypeParam()),
      this.expect(a.parenR),
      (t.returnType = this.flowParseTypeInitialiser()),
      this.finishNode(t, 'FunctionTypeAnnotation')
    );
  };
  P.flowParseObjectTypeMethod = function (t, e, r, s) {
    var i = this.startNodeAt(t, e);
    return (
      (i.value = this.flowParseObjectTypeMethodish(this.startNodeAt(t, e))),
      (i.static = r),
      (i.key = s),
      (i.optional = !1),
      this.flowObjectTypeSemicolon(),
      this.finishNode(i, 'ObjectTypeProperty')
    );
  };
  P.flowParseObjectTypeCallProperty = function (t, e) {
    var r = this.startNode();
    return (
      (t.static = e),
      (t.value = this.flowParseObjectTypeMethodish(r)),
      this.flowObjectTypeSemicolon(),
      this.finishNode(t, 'ObjectTypeCallProperty')
    );
  };
  P.flowParseObjectType = function (t, e, r) {
    var s = this.state.inType;
    this.state.inType = !0;
    var i = this.startNode(),
      n = void 0,
      o = void 0,
      u = !1;
    (i.callProperties = []), (i.properties = []), (i.indexers = []);
    var c = void 0,
      h = void 0;
    for (
      e && this.match(a.braceBarL)
        ? (this.expect(a.braceBarL), (c = a.braceBarR), (h = !0))
        : (this.expect(a.braceL), (c = a.braceR), (h = !1)),
        i.exact = h;
      !this.match(c);
    ) {
      var p = !1,
        m = this.state.start,
        d = this.state.startLoc;
      (n = this.startNode()),
        t && this.isContextual('static') && this.lookahead().type !== a.colon && (this.next(), (u = !0));
      var y = this.state.start,
        E = this.flowParseVariance();
      this.match(a.bracketL)
        ? i.indexers.push(this.flowParseObjectTypeIndexer(n, u, E))
        : this.match(a.parenL) || this.isRelational('<')
          ? (E && this.unexpected(y), i.callProperties.push(this.flowParseObjectTypeCallProperty(n, u)))
          : this.match(a.ellipsis)
            ? (r || this.unexpected(null, 'Spread operator cannot appear in class or interface definitions'),
              E && this.unexpected(E.start, 'Spread properties cannot have variance'),
              this.expect(a.ellipsis),
              (n.argument = this.flowParseType()),
              this.flowObjectTypeSemicolon(),
              i.properties.push(this.finishNode(n, 'ObjectTypeSpreadProperty')))
            : ((o = this.flowParseObjectPropertyKey()),
              this.isRelational('<') || this.match(a.parenL)
                ? (E && this.unexpected(E.start), i.properties.push(this.flowParseObjectTypeMethod(m, d, u, o)))
                : (this.eat(a.question) && (p = !0),
                  (n.key = o),
                  (n.value = this.flowParseTypeInitialiser()),
                  (n.optional = p),
                  (n.static = u),
                  (n.variance = E),
                  this.flowObjectTypeSemicolon(),
                  i.properties.push(this.finishNode(n, 'ObjectTypeProperty')))),
        (u = !1);
    }
    this.expect(c);
    var v = this.finishNode(i, 'ObjectTypeAnnotation');
    return (this.state.inType = s), v;
  };
  P.flowObjectTypeSemicolon = function () {
    !this.eat(a.semi) && !this.eat(a.comma) && !this.match(a.braceR) && !this.match(a.braceBarR) && this.unexpected();
  };
  P.flowParseQualifiedTypeIdentifier = function (t, e, r) {
    (t = t || this.state.start), (e = e || this.state.startLoc);
    for (var s = r || this.parseIdentifier(); this.eat(a.dot); ) {
      var i = this.startNodeAt(t, e);
      (i.qualification = s), (i.id = this.parseIdentifier()), (s = this.finishNode(i, 'QualifiedTypeIdentifier'));
    }
    return s;
  };
  P.flowParseGenericType = function (t, e, r) {
    var s = this.startNodeAt(t, e);
    return (
      (s.typeParameters = null),
      (s.id = this.flowParseQualifiedTypeIdentifier(t, e, r)),
      this.isRelational('<') && (s.typeParameters = this.flowParseTypeParameterInstantiation()),
      this.finishNode(s, 'GenericTypeAnnotation')
    );
  };
  P.flowParseTypeofType = function () {
    var t = this.startNode();
    return (
      this.expect(a._typeof), (t.argument = this.flowParsePrimaryType()), this.finishNode(t, 'TypeofTypeAnnotation')
    );
  };
  P.flowParseTupleType = function () {
    var t = this.startNode();
    for (
      t.types = [], this.expect(a.bracketL);
      this.state.pos < this.input.length &&
      !this.match(a.bracketR) &&
      (t.types.push(this.flowParseType()), !this.match(a.bracketR));
    )
      this.expect(a.comma);
    return this.expect(a.bracketR), this.finishNode(t, 'TupleTypeAnnotation');
  };
  P.flowParseFunctionTypeParam = function () {
    var t = null,
      e = !1,
      r = null,
      s = this.startNode(),
      i = this.lookahead();
    return (
      i.type === a.colon || i.type === a.question
        ? ((t = this.parseIdentifier()), this.eat(a.question) && (e = !0), (r = this.flowParseTypeInitialiser()))
        : (r = this.flowParseType()),
      (s.name = t),
      (s.optional = e),
      (s.typeAnnotation = r),
      this.finishNode(s, 'FunctionTypeParam')
    );
  };
  P.reinterpretTypeAsFunctionTypeParam = function (t) {
    var e = this.startNodeAt(t.start, t.loc.start);
    return (e.name = null), (e.optional = !1), (e.typeAnnotation = t), this.finishNode(e, 'FunctionTypeParam');
  };
  P.flowParseFunctionTypeParams = function () {
    for (
      var t = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : [], e = { params: t, rest: null };
      !this.match(a.parenR) && !this.match(a.ellipsis);
    )
      e.params.push(this.flowParseFunctionTypeParam()), this.match(a.parenR) || this.expect(a.comma);
    return this.eat(a.ellipsis) && (e.rest = this.flowParseFunctionTypeParam()), e;
  };
  P.flowIdentToTypeAnnotation = function (t, e, r, s) {
    switch (s.name) {
      case 'any':
        return this.finishNode(r, 'AnyTypeAnnotation');
      case 'void':
        return this.finishNode(r, 'VoidTypeAnnotation');
      case 'bool':
      case 'boolean':
        return this.finishNode(r, 'BooleanTypeAnnotation');
      case 'mixed':
        return this.finishNode(r, 'MixedTypeAnnotation');
      case 'empty':
        return this.finishNode(r, 'EmptyTypeAnnotation');
      case 'number':
        return this.finishNode(r, 'NumberTypeAnnotation');
      case 'string':
        return this.finishNode(r, 'StringTypeAnnotation');
      default:
        return this.flowParseGenericType(t, e, s);
    }
  };
  P.flowParsePrimaryType = function () {
    var t = this.state.start,
      e = this.state.startLoc,
      r = this.startNode(),
      s = void 0,
      i = void 0,
      n = !1,
      o = this.state.noAnonFunctionType;
    switch (this.state.type) {
      case a.name:
        return this.flowIdentToTypeAnnotation(t, e, r, this.parseIdentifier());
      case a.braceL:
        return this.flowParseObjectType(!1, !1, !0);
      case a.braceBarL:
        return this.flowParseObjectType(!1, !0, !0);
      case a.bracketL:
        return this.flowParseTupleType();
      case a.relational:
        if (this.state.value === '<')
          return (
            (r.typeParameters = this.flowParseTypeParameterDeclaration()),
            this.expect(a.parenL),
            (s = this.flowParseFunctionTypeParams()),
            (r.params = s.params),
            (r.rest = s.rest),
            this.expect(a.parenR),
            this.expect(a.arrow),
            (r.returnType = this.flowParseType()),
            this.finishNode(r, 'FunctionTypeAnnotation')
          );
        break;
      case a.parenL:
        if ((this.next(), !this.match(a.parenR) && !this.match(a.ellipsis)))
          if (this.match(a.name)) {
            var u = this.lookahead().type;
            n = u !== a.question && u !== a.colon;
          } else n = !0;
        if (n) {
          if (
            ((this.state.noAnonFunctionType = !1),
            (i = this.flowParseType()),
            (this.state.noAnonFunctionType = o),
            this.state.noAnonFunctionType ||
              !(this.match(a.comma) || (this.match(a.parenR) && this.lookahead().type === a.arrow)))
          )
            return this.expect(a.parenR), i;
          this.eat(a.comma);
        }
        return (
          i
            ? (s = this.flowParseFunctionTypeParams([this.reinterpretTypeAsFunctionTypeParam(i)]))
            : (s = this.flowParseFunctionTypeParams()),
          (r.params = s.params),
          (r.rest = s.rest),
          this.expect(a.parenR),
          this.expect(a.arrow),
          (r.returnType = this.flowParseType()),
          (r.typeParameters = null),
          this.finishNode(r, 'FunctionTypeAnnotation')
        );
      case a.string:
        return this.parseLiteral(this.state.value, 'StringLiteralTypeAnnotation');
      case a._true:
      case a._false:
        return (r.value = this.match(a._true)), this.next(), this.finishNode(r, 'BooleanLiteralTypeAnnotation');
      case a.plusMin:
        if (this.state.value === '-')
          return (
            this.next(),
            this.match(a.num) || this.unexpected(null, 'Unexpected token, expected number'),
            this.parseLiteral(-this.state.value, 'NumericLiteralTypeAnnotation', r.start, r.loc.start)
          );
        this.unexpected();
      case a.num:
        return this.parseLiteral(this.state.value, 'NumericLiteralTypeAnnotation');
      case a._null:
        return (r.value = this.match(a._null)), this.next(), this.finishNode(r, 'NullLiteralTypeAnnotation');
      case a._this:
        return (r.value = this.match(a._this)), this.next(), this.finishNode(r, 'ThisTypeAnnotation');
      case a.star:
        return this.next(), this.finishNode(r, 'ExistentialTypeParam');
      default:
        if (this.state.type.keyword === 'typeof') return this.flowParseTypeofType();
    }
    this.unexpected();
  };
  P.flowParsePostfixType = function () {
    for (
      var t = this.state.start, e = this.state.startLoc, r = this.flowParsePrimaryType();
      !this.canInsertSemicolon() && this.match(a.bracketL);
    ) {
      var s = this.startNodeAt(t, e);
      (s.elementType = r),
        this.expect(a.bracketL),
        this.expect(a.bracketR),
        (r = this.finishNode(s, 'ArrayTypeAnnotation'));
    }
    return r;
  };
  P.flowParsePrefixType = function () {
    var t = this.startNode();
    return this.eat(a.question)
      ? ((t.typeAnnotation = this.flowParsePrefixType()), this.finishNode(t, 'NullableTypeAnnotation'))
      : this.flowParsePostfixType();
  };
  P.flowParseAnonFunctionWithoutParens = function () {
    var t = this.flowParsePrefixType();
    if (!this.state.noAnonFunctionType && this.eat(a.arrow)) {
      var e = this.startNodeAt(t.start, t.loc.start);
      return (
        (e.params = [this.reinterpretTypeAsFunctionTypeParam(t)]),
        (e.rest = null),
        (e.returnType = this.flowParseType()),
        (e.typeParameters = null),
        this.finishNode(e, 'FunctionTypeAnnotation')
      );
    }
    return t;
  };
  P.flowParseIntersectionType = function () {
    var t = this.startNode();
    this.eat(a.bitwiseAND);
    var e = this.flowParseAnonFunctionWithoutParens();
    for (t.types = [e]; this.eat(a.bitwiseAND); ) t.types.push(this.flowParseAnonFunctionWithoutParens());
    return t.types.length === 1 ? e : this.finishNode(t, 'IntersectionTypeAnnotation');
  };
  P.flowParseUnionType = function () {
    var t = this.startNode();
    this.eat(a.bitwiseOR);
    var e = this.flowParseIntersectionType();
    for (t.types = [e]; this.eat(a.bitwiseOR); ) t.types.push(this.flowParseIntersectionType());
    return t.types.length === 1 ? e : this.finishNode(t, 'UnionTypeAnnotation');
  };
  P.flowParseType = function () {
    var t = this.state.inType;
    this.state.inType = !0;
    var e = this.flowParseUnionType();
    return (this.state.inType = t), e;
  };
  P.flowParseTypeAnnotation = function () {
    var t = this.startNode();
    return (t.typeAnnotation = this.flowParseTypeInitialiser()), this.finishNode(t, 'TypeAnnotation');
  };
  P.flowParseTypeAndPredicateAnnotation = function () {
    var t = this.startNode(),
      e = this.flowParseTypeAndPredicateInitialiser();
    return (t.typeAnnotation = e[0]), (t.predicate = e[1]), this.finishNode(t, 'TypeAnnotation');
  };
  P.flowParseTypeAnnotatableIdentifier = function () {
    var t = this.flowParseRestrictedIdentifier();
    return this.match(a.colon) && ((t.typeAnnotation = this.flowParseTypeAnnotation()), this.finishNode(t, t.type)), t;
  };
  P.typeCastToParameter = function (t) {
    return (
      (t.expression.typeAnnotation = t.typeAnnotation),
      this.finishNodeAt(t.expression, t.expression.type, t.typeAnnotation.end, t.typeAnnotation.loc.end)
    );
  };
  P.flowParseVariance = function () {
    var t = null;
    return (
      this.match(a.plusMin) &&
        (this.state.value === '+' ? (t = 'plus') : this.state.value === '-' && (t = 'minus'), this.next()),
      t
    );
  };
  var Xc = function (t) {
    t.extend('parseFunctionBody', function (e) {
      return function (r, s) {
        return (
          this.match(a.colon) && !s && (r.returnType = this.flowParseTypeAndPredicateAnnotation()), e.call(this, r, s)
        );
      };
    }),
      t.extend('parseStatement', function (e) {
        return function (r, s) {
          if (this.state.strict && this.match(a.name) && this.state.value === 'interface') {
            var i = this.startNode();
            return this.next(), this.flowParseInterface(i);
          } else return e.call(this, r, s);
        };
      }),
      t.extend('parseExpressionStatement', function (e) {
        return function (r, s) {
          if (s.type === 'Identifier') {
            if (s.name === 'declare') {
              if (
                this.match(a._class) ||
                this.match(a.name) ||
                this.match(a._function) ||
                this.match(a._var) ||
                this.match(a._export)
              )
                return this.flowParseDeclare(r);
            } else if (this.match(a.name)) {
              if (s.name === 'interface') return this.flowParseInterface(r);
              if (s.name === 'type') return this.flowParseTypeAlias(r);
              if (s.name === 'opaque') return this.flowParseOpaqueType(r, !1);
            }
          }
          return e.call(this, r, s);
        };
      }),
      t.extend('shouldParseExportDeclaration', function (e) {
        return function () {
          return (
            this.isContextual('type') || this.isContextual('interface') || this.isContextual('opaque') || e.call(this)
          );
        };
      }),
      t.extend('isExportDefaultSpecifier', function (e) {
        return function () {
          return this.match(a.name) &&
            (this.state.value === 'type' || this.state.value === 'interface' || this.state.value === 'opaque')
            ? !1
            : e.call(this);
        };
      }),
      t.extend('parseConditional', function (e) {
        return function (r, s, i, n, o) {
          if (o && this.match(a.question)) {
            var u = this.state.clone();
            try {
              return e.call(this, r, s, i, n);
            } catch (c) {
              if (c instanceof SyntaxError) return (this.state = u), (o.start = c.pos || this.state.start), r;
              throw c;
            }
          }
          return e.call(this, r, s, i, n);
        };
      }),
      t.extend('parseParenItem', function (e) {
        return function (r, s, i) {
          if (((r = e.call(this, r, s, i)), this.eat(a.question) && (r.optional = !0), this.match(a.colon))) {
            var n = this.startNodeAt(s, i);
            return (
              (n.expression = r),
              (n.typeAnnotation = this.flowParseTypeAnnotation()),
              this.finishNode(n, 'TypeCastExpression')
            );
          }
          return r;
        };
      }),
      t.extend('parseExport', function (e) {
        return function (r) {
          return (
            (r = e.call(this, r)), r.type === 'ExportNamedDeclaration' && (r.exportKind = r.exportKind || 'value'), r
          );
        };
      }),
      t.extend('parseExportDeclaration', function (e) {
        return function (r) {
          if (this.isContextual('type')) {
            r.exportKind = 'type';
            var s = this.startNode();
            return (
              this.next(),
              this.match(a.braceL)
                ? ((r.specifiers = this.parseExportSpecifiers()), this.parseExportFrom(r), null)
                : this.flowParseTypeAlias(s)
            );
          } else if (this.isContextual('opaque')) {
            r.exportKind = 'type';
            var i = this.startNode();
            return this.next(), this.flowParseOpaqueType(i, !1);
          } else if (this.isContextual('interface')) {
            r.exportKind = 'type';
            var n = this.startNode();
            return this.next(), this.flowParseInterface(n);
          } else return e.call(this, r);
        };
      }),
      t.extend('parseClassId', function (e) {
        return function (r) {
          e.apply(this, arguments),
            this.isRelational('<') && (r.typeParameters = this.flowParseTypeParameterDeclaration());
        };
      }),
      t.extend('isKeyword', function (e) {
        return function (r) {
          return this.state.inType && r === 'void' ? !1 : e.call(this, r);
        };
      }),
      t.extend('readToken', function (e) {
        return function (r) {
          return this.state.inType && (r === 62 || r === 60) ? this.finishOp(a.relational, 1) : e.call(this, r);
        };
      }),
      t.extend('jsx_readToken', function (e) {
        return function () {
          if (!this.state.inType) return e.call(this);
        };
      }),
      t.extend('toAssignable', function (e) {
        return function (r, s, i) {
          return r.type === 'TypeCastExpression'
            ? e.call(this, this.typeCastToParameter(r), s, i)
            : e.call(this, r, s, i);
        };
      }),
      t.extend('toAssignableList', function (e) {
        return function (r, s, i) {
          for (var n = 0; n < r.length; n++) {
            var o = r[n];
            o && o.type === 'TypeCastExpression' && (r[n] = this.typeCastToParameter(o));
          }
          return e.call(this, r, s, i);
        };
      }),
      t.extend('toReferencedList', function () {
        return function (e) {
          for (var r = 0; r < e.length; r++) {
            var s = e[r];
            s && s._exprListItem && s.type === 'TypeCastExpression' && this.raise(s.start, 'Unexpected type cast');
          }
          return e;
        };
      }),
      t.extend('parseExprListItem', function (e) {
        return function () {
          for (var r = this.startNode(), s = arguments.length, i = Array(s), n = 0; n < s; n++) i[n] = arguments[n];
          var o = e.call.apply(e, [this].concat(i));
          return this.match(a.colon)
            ? ((r._exprListItem = !0),
              (r.expression = o),
              (r.typeAnnotation = this.flowParseTypeAnnotation()),
              this.finishNode(r, 'TypeCastExpression'))
            : o;
        };
      }),
      t.extend('checkLVal', function (e) {
        return function (r) {
          if (r.type !== 'TypeCastExpression') return e.apply(this, arguments);
        };
      }),
      t.extend('parseClassProperty', function (e) {
        return function (r) {
          return (
            delete r.variancePos,
            this.match(a.colon) && (r.typeAnnotation = this.flowParseTypeAnnotation()),
            e.call(this, r)
          );
        };
      }),
      t.extend('isClassMethod', function (e) {
        return function () {
          return this.isRelational('<') || e.call(this);
        };
      }),
      t.extend('isClassProperty', function (e) {
        return function () {
          return this.match(a.colon) || e.call(this);
        };
      }),
      t.extend('isNonstaticConstructor', function (e) {
        return function (r) {
          return !this.match(a.colon) && e.call(this, r);
        };
      }),
      t.extend('parseClassMethod', function (e) {
        return function (r, s) {
          s.variance && this.unexpected(s.variancePos),
            delete s.variance,
            delete s.variancePos,
            this.isRelational('<') && (s.typeParameters = this.flowParseTypeParameterDeclaration());
          for (var i = arguments.length, n = Array(i > 2 ? i - 2 : 0), o = 2; o < i; o++) n[o - 2] = arguments[o];
          e.call.apply(e, [this, r, s].concat(n));
        };
      }),
      t.extend('parseClassSuper', function (e) {
        return function (r, s) {
          if (
            (e.call(this, r, s),
            r.superClass &&
              this.isRelational('<') &&
              (r.superTypeParameters = this.flowParseTypeParameterInstantiation()),
            this.isContextual('implements'))
          ) {
            this.next();
            var i = (r.implements = []);
            do {
              var n = this.startNode();
              (n.id = this.parseIdentifier()),
                this.isRelational('<')
                  ? (n.typeParameters = this.flowParseTypeParameterInstantiation())
                  : (n.typeParameters = null),
                i.push(this.finishNode(n, 'ClassImplements'));
            } while (this.eat(a.comma));
          }
        };
      }),
      t.extend('parsePropertyName', function (e) {
        return function (r) {
          var s = this.state.start,
            i = this.flowParseVariance(),
            n = e.call(this, r);
          return (r.variance = i), (r.variancePos = s), n;
        };
      }),
      t.extend('parseObjPropValue', function (e) {
        return function (r) {
          r.variance && this.unexpected(r.variancePos), delete r.variance, delete r.variancePos;
          var s = void 0;
          this.isRelational('<') &&
            ((s = this.flowParseTypeParameterDeclaration()), this.match(a.parenL) || this.unexpected()),
            e.apply(this, arguments),
            s && ((r.value || r).typeParameters = s);
        };
      }),
      t.extend('parseAssignableListItemTypes', function () {
        return function (e) {
          return (
            this.eat(a.question) && (e.optional = !0),
            this.match(a.colon) && (e.typeAnnotation = this.flowParseTypeAnnotation()),
            this.finishNode(e, e.type),
            e
          );
        };
      }),
      t.extend('parseMaybeDefault', function (e) {
        return function () {
          for (var r = arguments.length, s = Array(r), i = 0; i < r; i++) s[i] = arguments[i];
          var n = e.apply(this, s);
          return (
            n.type === 'AssignmentPattern' &&
              n.typeAnnotation &&
              n.right.start < n.typeAnnotation.start &&
              this.raise(
                n.typeAnnotation.start,
                'Type annotations must come before default assignments, e.g. instead of `age = 25: number` use `age: number = 25`'
              ),
            n
          );
        };
      }),
      t.extend('parseImportSpecifiers', function (e) {
        return function (r) {
          r.importKind = 'value';
          var s = null;
          if ((this.match(a._typeof) ? (s = 'typeof') : this.isContextual('type') && (s = 'type'), s)) {
            var i = this.lookahead();
            ((i.type === a.name && i.value !== 'from') || i.type === a.braceL || i.type === a.star) &&
              (this.next(), (r.importKind = s));
          }
          e.call(this, r);
        };
      }),
      t.extend('parseImportSpecifier', function () {
        return function (e) {
          var r = this.startNode(),
            s = this.state.start,
            i = this.parseIdentifier(!0),
            n = null;
          i.name === 'type' ? (n = 'type') : i.name === 'typeof' && (n = 'typeof');
          var o = !1;
          if (this.isContextual('as')) {
            var u = this.parseIdentifier(!0);
            n !== null && !this.match(a.name) && !this.state.type.keyword
              ? ((r.imported = u), (r.importKind = n), (r.local = u.__clone()))
              : ((r.imported = i), (r.importKind = null), (r.local = this.parseIdentifier()));
          } else
            n !== null && (this.match(a.name) || this.state.type.keyword)
              ? ((r.imported = this.parseIdentifier(!0)),
                (r.importKind = n),
                this.eatContextual('as')
                  ? (r.local = this.parseIdentifier())
                  : ((o = !0), (r.local = r.imported.__clone())))
              : ((o = !0), (r.imported = i), (r.importKind = null), (r.local = r.imported.__clone()));
          (e.importKind === 'type' || e.importKind === 'typeof') &&
            (r.importKind === 'type' || r.importKind === 'typeof') &&
            this.raise(
              s,
              '`The `type` and `typeof` keywords on named imports can only be used on regular `import` statements. It cannot be used with `import type` or `import typeof` statements`'
            ),
            o && this.checkReservedWord(r.local.name, r.start, !0, !0),
            this.checkLVal(r.local, !0, void 0, 'import specifier'),
            e.specifiers.push(this.finishNode(r, 'ImportSpecifier'));
        };
      }),
      t.extend('parseFunctionParams', function (e) {
        return function (r) {
          this.isRelational('<') && (r.typeParameters = this.flowParseTypeParameterDeclaration()), e.call(this, r);
        };
      }),
      t.extend('parseVarHead', function (e) {
        return function (r) {
          e.call(this, r),
            this.match(a.colon) &&
              ((r.id.typeAnnotation = this.flowParseTypeAnnotation()), this.finishNode(r.id, r.id.type));
        };
      }),
      t.extend('parseAsyncArrowFromCallExpression', function (e) {
        return function (r, s) {
          if (this.match(a.colon)) {
            var i = this.state.noAnonFunctionType;
            (this.state.noAnonFunctionType = !0),
              (r.returnType = this.flowParseTypeAnnotation()),
              (this.state.noAnonFunctionType = i);
          }
          return e.call(this, r, s);
        };
      }),
      t.extend('shouldParseAsyncArrow', function (e) {
        return function () {
          return this.match(a.colon) || e.call(this);
        };
      }),
      t.extend('parseMaybeAssign', function (e) {
        return function () {
          for (var r = null, s = arguments.length, i = Array(s), n = 0; n < s; n++) i[n] = arguments[n];
          if (a.jsxTagStart && this.match(a.jsxTagStart)) {
            var o = this.state.clone();
            try {
              return e.apply(this, i);
            } catch (h) {
              if (h instanceof SyntaxError) (this.state = o), (this.state.context.length -= 2), (r = h);
              else throw h;
            }
          }
          if (r != null || this.isRelational('<')) {
            var u = void 0,
              c = void 0;
            try {
              (c = this.flowParseTypeParameterDeclaration()),
                (u = e.apply(this, i)),
                (u.typeParameters = c),
                (u.start = c.start),
                (u.loc.start = c.loc.start);
            } catch (h) {
              throw r || h;
            }
            if (u.type === 'ArrowFunctionExpression') return u;
            if (r != null) throw r;
            this.raise(c.start, 'Expected an arrow function after this type parameter declaration');
          }
          return e.apply(this, i);
        };
      }),
      t.extend('parseArrow', function (e) {
        return function (r) {
          if (this.match(a.colon)) {
            var s = this.state.clone();
            try {
              var i = this.state.noAnonFunctionType;
              this.state.noAnonFunctionType = !0;
              var n = this.flowParseTypeAndPredicateAnnotation();
              (this.state.noAnonFunctionType = i),
                this.canInsertSemicolon() && this.unexpected(),
                this.match(a.arrow) || this.unexpected(),
                (r.returnType = n);
            } catch (o) {
              if (o instanceof SyntaxError) this.state = s;
              else throw o;
            }
          }
          return e.call(this, r);
        };
      }),
      t.extend('shouldParseArrow', function (e) {
        return function () {
          return this.match(a.colon) || e.call(this);
        };
      });
  };
  var nr = String.fromCodePoint;
  nr ||
    ((Hi = String.fromCharCode),
    (Ji = Math.floor),
    (nr = function () {
      var e = 16384,
        r = [],
        s = void 0,
        i = void 0,
        n = -1,
        o = arguments.length;
      if (!o) return '';
      for (var u = ''; ++n < o; ) {
        var c = Number(arguments[n]);
        if (!isFinite(c) || c < 0 || c > 1114111 || Ji(c) != c) throw RangeError('Invalid code point: ' + c);
        c <= 65535 ? r.push(c) : ((c -= 65536), (s = (c >> 10) + 55296), (i = (c % 1024) + 56320), r.push(s, i)),
          (n + 1 == o || r.length > e) && ((u += Hi.apply(null, r)), (r.length = 0));
      }
      return u;
    }));
  var Hi,
    Ji,
    Zi = nr,
    Yc = {
      quot: '"',
      amp: '&',
      apos: "'",
      lt: '<',
      gt: '>',
      nbsp: '\xA0',
      iexcl: '\xA1',
      cent: '\xA2',
      pound: '\xA3',
      curren: '\xA4',
      yen: '\xA5',
      brvbar: '\xA6',
      sect: '\xA7',
      uml: '\xA8',
      copy: '\xA9',
      ordf: '\xAA',
      laquo: '\xAB',
      not: '\xAC',
      shy: '\xAD',
      reg: '\xAE',
      macr: '\xAF',
      deg: '\xB0',
      plusmn: '\xB1',
      sup2: '\xB2',
      sup3: '\xB3',
      acute: '\xB4',
      micro: '\xB5',
      para: '\xB6',
      middot: '\xB7',
      cedil: '\xB8',
      sup1: '\xB9',
      ordm: '\xBA',
      raquo: '\xBB',
      frac14: '\xBC',
      frac12: '\xBD',
      frac34: '\xBE',
      iquest: '\xBF',
      Agrave: '\xC0',
      Aacute: '\xC1',
      Acirc: '\xC2',
      Atilde: '\xC3',
      Auml: '\xC4',
      Aring: '\xC5',
      AElig: '\xC6',
      Ccedil: '\xC7',
      Egrave: '\xC8',
      Eacute: '\xC9',
      Ecirc: '\xCA',
      Euml: '\xCB',
      Igrave: '\xCC',
      Iacute: '\xCD',
      Icirc: '\xCE',
      Iuml: '\xCF',
      ETH: '\xD0',
      Ntilde: '\xD1',
      Ograve: '\xD2',
      Oacute: '\xD3',
      Ocirc: '\xD4',
      Otilde: '\xD5',
      Ouml: '\xD6',
      times: '\xD7',
      Oslash: '\xD8',
      Ugrave: '\xD9',
      Uacute: '\xDA',
      Ucirc: '\xDB',
      Uuml: '\xDC',
      Yacute: '\xDD',
      THORN: '\xDE',
      szlig: '\xDF',
      agrave: '\xE0',
      aacute: '\xE1',
      acirc: '\xE2',
      atilde: '\xE3',
      auml: '\xE4',
      aring: '\xE5',
      aelig: '\xE6',
      ccedil: '\xE7',
      egrave: '\xE8',
      eacute: '\xE9',
      ecirc: '\xEA',
      euml: '\xEB',
      igrave: '\xEC',
      iacute: '\xED',
      icirc: '\xEE',
      iuml: '\xEF',
      eth: '\xF0',
      ntilde: '\xF1',
      ograve: '\xF2',
      oacute: '\xF3',
      ocirc: '\xF4',
      otilde: '\xF5',
      ouml: '\xF6',
      divide: '\xF7',
      oslash: '\xF8',
      ugrave: '\xF9',
      uacute: '\xFA',
      ucirc: '\xFB',
      uuml: '\xFC',
      yacute: '\xFD',
      thorn: '\xFE',
      yuml: '\xFF',
      OElig: '\u0152',
      oelig: '\u0153',
      Scaron: '\u0160',
      scaron: '\u0161',
      Yuml: '\u0178',
      fnof: '\u0192',
      circ: '\u02C6',
      tilde: '\u02DC',
      Alpha: '\u0391',
      Beta: '\u0392',
      Gamma: '\u0393',
      Delta: '\u0394',
      Epsilon: '\u0395',
      Zeta: '\u0396',
      Eta: '\u0397',
      Theta: '\u0398',
      Iota: '\u0399',
      Kappa: '\u039A',
      Lambda: '\u039B',
      Mu: '\u039C',
      Nu: '\u039D',
      Xi: '\u039E',
      Omicron: '\u039F',
      Pi: '\u03A0',
      Rho: '\u03A1',
      Sigma: '\u03A3',
      Tau: '\u03A4',
      Upsilon: '\u03A5',
      Phi: '\u03A6',
      Chi: '\u03A7',
      Psi: '\u03A8',
      Omega: '\u03A9',
      alpha: '\u03B1',
      beta: '\u03B2',
      gamma: '\u03B3',
      delta: '\u03B4',
      epsilon: '\u03B5',
      zeta: '\u03B6',
      eta: '\u03B7',
      theta: '\u03B8',
      iota: '\u03B9',
      kappa: '\u03BA',
      lambda: '\u03BB',
      mu: '\u03BC',
      nu: '\u03BD',
      xi: '\u03BE',
      omicron: '\u03BF',
      pi: '\u03C0',
      rho: '\u03C1',
      sigmaf: '\u03C2',
      sigma: '\u03C3',
      tau: '\u03C4',
      upsilon: '\u03C5',
      phi: '\u03C6',
      chi: '\u03C7',
      psi: '\u03C8',
      omega: '\u03C9',
      thetasym: '\u03D1',
      upsih: '\u03D2',
      piv: '\u03D6',
      ensp: '\u2002',
      emsp: '\u2003',
      thinsp: '\u2009',
      zwnj: '\u200C',
      zwj: '\u200D',
      lrm: '\u200E',
      rlm: '\u200F',
      ndash: '\u2013',
      mdash: '\u2014',
      lsquo: '\u2018',
      rsquo: '\u2019',
      sbquo: '\u201A',
      ldquo: '\u201C',
      rdquo: '\u201D',
      bdquo: '\u201E',
      dagger: '\u2020',
      Dagger: '\u2021',
      bull: '\u2022',
      hellip: '\u2026',
      permil: '\u2030',
      prime: '\u2032',
      Prime: '\u2033',
      lsaquo: '\u2039',
      rsaquo: '\u203A',
      oline: '\u203E',
      frasl: '\u2044',
      euro: '\u20AC',
      image: '\u2111',
      weierp: '\u2118',
      real: '\u211C',
      trade: '\u2122',
      alefsym: '\u2135',
      larr: '\u2190',
      uarr: '\u2191',
      rarr: '\u2192',
      darr: '\u2193',
      harr: '\u2194',
      crarr: '\u21B5',
      lArr: '\u21D0',
      uArr: '\u21D1',
      rArr: '\u21D2',
      dArr: '\u21D3',
      hArr: '\u21D4',
      forall: '\u2200',
      part: '\u2202',
      exist: '\u2203',
      empty: '\u2205',
      nabla: '\u2207',
      isin: '\u2208',
      notin: '\u2209',
      ni: '\u220B',
      prod: '\u220F',
      sum: '\u2211',
      minus: '\u2212',
      lowast: '\u2217',
      radic: '\u221A',
      prop: '\u221D',
      infin: '\u221E',
      ang: '\u2220',
      and: '\u2227',
      or: '\u2228',
      cap: '\u2229',
      cup: '\u222A',
      int: '\u222B',
      there4: '\u2234',
      sim: '\u223C',
      cong: '\u2245',
      asymp: '\u2248',
      ne: '\u2260',
      equiv: '\u2261',
      le: '\u2264',
      ge: '\u2265',
      sub: '\u2282',
      sup: '\u2283',
      nsub: '\u2284',
      sube: '\u2286',
      supe: '\u2287',
      oplus: '\u2295',
      otimes: '\u2297',
      perp: '\u22A5',
      sdot: '\u22C5',
      lceil: '\u2308',
      rceil: '\u2309',
      lfloor: '\u230A',
      rfloor: '\u230B',
      lang: '\u2329',
      rang: '\u232A',
      loz: '\u25CA',
      spades: '\u2660',
      clubs: '\u2663',
      hearts: '\u2665',
      diams: '\u2666',
    },
    Qc = /^[\da-fA-F]+$/,
    Hc = /^\d+$/;
  L.j_oTag = new mt('<tag', !1);
  L.j_cTag = new mt('</tag', !1);
  L.j_expr = new mt('<tag>...</tag>', !0, !0);
  a.jsxName = new D('jsxName');
  a.jsxText = new D('jsxText', { beforeExpr: !0 });
  a.jsxTagStart = new D('jsxTagStart', { startsExpr: !0 });
  a.jsxTagEnd = new D('jsxTagEnd');
  a.jsxTagStart.updateContext = function () {
    this.state.context.push(L.j_expr), this.state.context.push(L.j_oTag), (this.state.exprAllowed = !1);
  };
  a.jsxTagEnd.updateContext = function (t) {
    var e = this.state.context.pop();
    (e === L.j_oTag && t === a.slash) || e === L.j_cTag
      ? (this.state.context.pop(), (this.state.exprAllowed = this.curContext() === L.j_expr))
      : (this.state.exprAllowed = !0);
  };
  var z = st.prototype;
  z.jsxReadToken = function () {
    for (var t = '', e = this.state.pos; ; ) {
      this.state.pos >= this.input.length && this.raise(this.state.start, 'Unterminated JSX contents');
      var r = this.input.charCodeAt(this.state.pos);
      switch (r) {
        case 60:
        case 123:
          return this.state.pos === this.state.start
            ? r === 60 && this.state.exprAllowed
              ? (++this.state.pos, this.finishToken(a.jsxTagStart))
              : this.getTokenFromCode(r)
            : ((t += this.input.slice(e, this.state.pos)), this.finishToken(a.jsxText, t));
        case 38:
          (t += this.input.slice(e, this.state.pos)), (t += this.jsxReadEntity()), (e = this.state.pos);
          break;
        default:
          Ce(r)
            ? ((t += this.input.slice(e, this.state.pos)), (t += this.jsxReadNewLine(!0)), (e = this.state.pos))
            : ++this.state.pos;
      }
    }
  };
  z.jsxReadNewLine = function (t) {
    var e = this.input.charCodeAt(this.state.pos),
      r = void 0;
    return (
      ++this.state.pos,
      e === 13 && this.input.charCodeAt(this.state.pos) === 10
        ? (++this.state.pos,
          (r = t
            ? `
`
            : `\r
`))
        : (r = String.fromCharCode(e)),
      ++this.state.curLine,
      (this.state.lineStart = this.state.pos),
      r
    );
  };
  z.jsxReadString = function (t) {
    for (var e = '', r = ++this.state.pos; ; ) {
      this.state.pos >= this.input.length && this.raise(this.state.start, 'Unterminated string constant');
      var s = this.input.charCodeAt(this.state.pos);
      if (s === t) break;
      s === 38
        ? ((e += this.input.slice(r, this.state.pos)), (e += this.jsxReadEntity()), (r = this.state.pos))
        : Ce(s)
          ? ((e += this.input.slice(r, this.state.pos)), (e += this.jsxReadNewLine(!1)), (r = this.state.pos))
          : ++this.state.pos;
    }
    return (e += this.input.slice(r, this.state.pos++)), this.finishToken(a.string, e);
  };
  z.jsxReadEntity = function () {
    for (
      var t = '', e = 0, r = void 0, s = this.input[this.state.pos], i = ++this.state.pos;
      this.state.pos < this.input.length && e++ < 10;
    ) {
      if (((s = this.input[this.state.pos++]), s === ';')) {
        t[0] === '#'
          ? t[1] === 'x'
            ? ((t = t.substr(2)), Qc.test(t) && (r = Zi(parseInt(t, 16))))
            : ((t = t.substr(1)), Hc.test(t) && (r = Zi(parseInt(t, 10))))
          : (r = Yc[t]);
        break;
      }
      t += s;
    }
    return r || ((this.state.pos = i), '&');
  };
  z.jsxReadWord = function () {
    var t = void 0,
      e = this.state.pos;
    do t = this.input.charCodeAt(++this.state.pos);
    while (sr(t) || t === 45);
    return this.finishToken(a.jsxName, this.input.slice(e, this.state.pos));
  };
  function Jt(t) {
    if (t.type === 'JSXIdentifier') return t.name;
    if (t.type === 'JSXNamespacedName') return t.namespace.name + ':' + t.name.name;
    if (t.type === 'JSXMemberExpression') return Jt(t.object) + '.' + Jt(t.property);
  }
  z.jsxParseIdentifier = function () {
    var t = this.startNode();
    return (
      this.match(a.jsxName)
        ? (t.name = this.state.value)
        : this.state.type.keyword
          ? (t.name = this.state.type.keyword)
          : this.unexpected(),
      this.next(),
      this.finishNode(t, 'JSXIdentifier')
    );
  };
  z.jsxParseNamespacedName = function () {
    var t = this.state.start,
      e = this.state.startLoc,
      r = this.jsxParseIdentifier();
    if (!this.eat(a.colon)) return r;
    var s = this.startNodeAt(t, e);
    return (s.namespace = r), (s.name = this.jsxParseIdentifier()), this.finishNode(s, 'JSXNamespacedName');
  };
  z.jsxParseElementName = function () {
    for (var t = this.state.start, e = this.state.startLoc, r = this.jsxParseNamespacedName(); this.eat(a.dot); ) {
      var s = this.startNodeAt(t, e);
      (s.object = r), (s.property = this.jsxParseIdentifier()), (r = this.finishNode(s, 'JSXMemberExpression'));
    }
    return r;
  };
  z.jsxParseAttributeValue = function () {
    var t = void 0;
    switch (this.state.type) {
      case a.braceL:
        if (((t = this.jsxParseExpressionContainer()), t.expression.type === 'JSXEmptyExpression'))
          this.raise(t.start, 'JSX attributes must only be assigned a non-empty expression');
        else return t;
      case a.jsxTagStart:
      case a.string:
        return (t = this.parseExprAtom()), (t.extra = null), t;
      default:
        this.raise(this.state.start, 'JSX value should be either an expression or a quoted JSX text');
    }
  };
  z.jsxParseEmptyExpression = function () {
    var t = this.startNodeAt(this.state.lastTokEnd, this.state.lastTokEndLoc);
    return this.finishNodeAt(t, 'JSXEmptyExpression', this.state.start, this.state.startLoc);
  };
  z.jsxParseSpreadChild = function () {
    var t = this.startNode();
    return (
      this.expect(a.braceL),
      this.expect(a.ellipsis),
      (t.expression = this.parseExpression()),
      this.expect(a.braceR),
      this.finishNode(t, 'JSXSpreadChild')
    );
  };
  z.jsxParseExpressionContainer = function () {
    var t = this.startNode();
    return (
      this.next(),
      this.match(a.braceR) ? (t.expression = this.jsxParseEmptyExpression()) : (t.expression = this.parseExpression()),
      this.expect(a.braceR),
      this.finishNode(t, 'JSXExpressionContainer')
    );
  };
  z.jsxParseAttribute = function () {
    var t = this.startNode();
    return this.eat(a.braceL)
      ? (this.expect(a.ellipsis),
        (t.argument = this.parseMaybeAssign()),
        this.expect(a.braceR),
        this.finishNode(t, 'JSXSpreadAttribute'))
      : ((t.name = this.jsxParseNamespacedName()),
        (t.value = this.eat(a.eq) ? this.jsxParseAttributeValue() : null),
        this.finishNode(t, 'JSXAttribute'));
  };
  z.jsxParseOpeningElementAt = function (t, e) {
    var r = this.startNodeAt(t, e);
    for (r.attributes = [], r.name = this.jsxParseElementName(); !this.match(a.slash) && !this.match(a.jsxTagEnd); )
      r.attributes.push(this.jsxParseAttribute());
    return (r.selfClosing = this.eat(a.slash)), this.expect(a.jsxTagEnd), this.finishNode(r, 'JSXOpeningElement');
  };
  z.jsxParseClosingElementAt = function (t, e) {
    var r = this.startNodeAt(t, e);
    return (r.name = this.jsxParseElementName()), this.expect(a.jsxTagEnd), this.finishNode(r, 'JSXClosingElement');
  };
  z.jsxParseElementAt = function (t, e) {
    var r = this.startNodeAt(t, e),
      s = [],
      i = this.jsxParseOpeningElementAt(t, e),
      n = null;
    if (!i.selfClosing) {
      t: for (;;)
        switch (this.state.type) {
          case a.jsxTagStart:
            if (((t = this.state.start), (e = this.state.startLoc), this.next(), this.eat(a.slash))) {
              n = this.jsxParseClosingElementAt(t, e);
              break t;
            }
            s.push(this.jsxParseElementAt(t, e));
            break;
          case a.jsxText:
            s.push(this.parseExprAtom());
            break;
          case a.braceL:
            this.lookahead().type === a.ellipsis
              ? s.push(this.jsxParseSpreadChild())
              : s.push(this.jsxParseExpressionContainer());
            break;
          default:
            this.unexpected();
        }
      Jt(n.name) !== Jt(i.name) &&
        this.raise(n.start, 'Expected corresponding JSX closing tag for <' + Jt(i.name) + '>');
    }
    return (
      (r.openingElement = i),
      (r.closingElement = n),
      (r.children = s),
      this.match(a.relational) &&
        this.state.value === '<' &&
        this.raise(this.state.start, 'Adjacent JSX elements must be wrapped in an enclosing tag'),
      this.finishNode(r, 'JSXElement')
    );
  };
  z.jsxParseElement = function () {
    var t = this.state.start,
      e = this.state.startLoc;
    return this.next(), this.jsxParseElementAt(t, e);
  };
  var Jc = function (t) {
    t.extend('parseExprAtom', function (e) {
      return function (r) {
        if (this.match(a.jsxText)) {
          var s = this.parseLiteral(this.state.value, 'JSXText');
          return (s.extra = null), s;
        } else return this.match(a.jsxTagStart) ? this.jsxParseElement() : e.call(this, r);
      };
    }),
      t.extend('readToken', function (e) {
        return function (r) {
          if (this.state.inPropertyName) return e.call(this, r);
          var s = this.curContext();
          if (s === L.j_expr) return this.jsxReadToken();
          if (s === L.j_oTag || s === L.j_cTag) {
            if (Ht(r)) return this.jsxReadWord();
            if (r === 62) return ++this.state.pos, this.finishToken(a.jsxTagEnd);
            if ((r === 34 || r === 39) && s === L.j_oTag) return this.jsxReadString(r);
          }
          return r === 60 && this.state.exprAllowed
            ? (++this.state.pos, this.finishToken(a.jsxTagStart))
            : e.call(this, r);
        };
      }),
      t.extend('updateContext', function (e) {
        return function (r) {
          if (this.match(a.braceL)) {
            var s = this.curContext();
            s === L.j_oTag
              ? this.state.context.push(L.braceExpression)
              : s === L.j_expr
                ? this.state.context.push(L.templateQuasi)
                : e.call(this, r),
              (this.state.exprAllowed = !0);
          } else if (this.match(a.slash) && r === a.jsxTagStart)
            (this.state.context.length -= 2), this.state.context.push(L.j_cTag), (this.state.exprAllowed = !1);
          else return e.call(this, r);
        };
      });
  };
  qt.estree = Kc;
  qt.flow = Xc;
  qt.jsx = Jc;
  function Zc(t, e) {
    return new st(e, t).parse();
  }
  function th(t, e) {
    var r = new st(e, t);
    return r.options.strictMode && (r.state.strict = !0), r.getExpression();
  }
  Zt.parse = Zc;
  Zt.parseExpression = th;
  Zt.tokTypes = a;
});
var ln = x((Xp, hn) => {
  'use strict';
  var un = q(),
    eh = on(),
    rh = Ee(),
    sh = I(),
    ih = Qt();
  function nh(t) {
    let e;
    try {
      e = eh.parse(t.expression);
    } catch (s) {
      throw new SyntaxError(`Cannot parse arithmetic expression "${t.expression}": ${s.message}`);
    }
    let r = e.program.body[0].expression;
    if (r === void 0) throw new SyntaxError(`Cannot parse arithmetic expression "${t.expression}": Not an expression`);
    return JSON.parse(JSON.stringify(r));
  }
  var cn = () =>
    un(t =>
      t.is('WORD') || t.is('ASSIGNMENT_WORD')
        ? !t.expansion || t.expansion.length === 0
          ? t
          : sh.setExpansions(
              t,
              t.expansion.map(e =>
                e.type === 'arithmetic_expansion' ? Object.assign({}, e, { arithmeticAST: nh(e) }) : e
              )
            )
        : t
    );
  cn.resolve = t =>
    un(e => {
      if (t.runArithmeticExpression && e.expansion) {
        let r = e.value,
          s = new rh(r);
        for (let i of e.expansion)
          if (i.type === 'arithmetic_expansion') {
            let n = t.runArithmeticExpression(i);
            s.overwrite(i.loc.start, i.loc.end + 1, ih.mark(n, r, t)), (i.resolved = !0);
          }
        return e.alterValue(s.toString());
      }
      return e;
    });
  hn.exports = cn;
});
var dn = x((Yp, fn) => {
  'use strict';
  var pn = J(),
    ah = We(),
    oh = q(),
    uh = fe(),
    ch = I(),
    hh = (t, e) => {
      function* r(s, i) {
        if (i.indexOf(s.value) !== -1 || !s._.maybeSimpleCommandName) {
          yield s;
          return;
        }
        let n = e(s.value);
        if (n === void 0) yield s;
        else for (let o of t(n)) o.is('WORD') ? yield* r(o, i.concat(s.value)) : o.is('EOF') || (yield o);
      }
      return { WORD: s => Array.from(r(s, [])) };
    };
  fn.exports = (t, e, r) => {
    if (typeof t.resolveAlias != 'function') return ah;
    let s = pn.apply(null, r.reverse()),
      i = hh(s, t.resolveAlias);
    return pn(uh, oh(ch.applyTokenizerVisitor(i)));
  };
});
var xn = x((Qp, mn) => {
  mn.exports = dh;
  var lh = /\s/,
    ph = /(_|-|\.|:)/,
    fh = /([a-z][A-Z]|[A-Z][a-z])/;
  function dh(t) {
    return lh.test(t)
      ? t.toLowerCase()
      : ph.test(t)
        ? (xh(t) || t).toLowerCase()
        : fh.test(t)
          ? vh(t).toLowerCase()
          : t.toLowerCase();
  }
  var mh = /[\W_]+(.|$)/g;
  function xh(t) {
    return t.replace(mh, function (e, r) {
      return r ? ' ' + r : '';
    });
  }
  var yh = /(.)([A-Z]+)/g;
  function vh(t) {
    return t.replace(yh, function (e, r, s) {
      return r + ' ' + s.toLowerCase().split('').join(' ');
    });
  }
});
var vn = x((Hp, yn) => {
  var Eh = xn();
  yn.exports = gh;
  function gh(t) {
    return Eh(t)
      .replace(/[\W_]+(.|$)/g, function (e, r) {
        return r ? ' ' + r : '';
      })
      .trim();
  }
});
var gn = x((Jp, En) => {
  var Ah = vn();
  En.exports = Ch;
  function Ch(t) {
    return Ah(t).replace(/(?:^|\s)(\w)/g, function (e, r) {
      return r.toUpperCase();
    });
  }
});
var bn = x((Zp, Cn) => {
  'use strict';
  var An = gn(),
    bh = q();
  Cn.exports = () =>
    bh(t => {
      let e = Object.assign({}, t);
      if (e.type) {
        (e.originalType = t.type),
          t.is('WORD') || t.is('NAME') || t.is('ASSIGNMENT_WORD')
            ? (e.type = An(e.type))
            : (e.type = t.type.toLowerCase());
        for (let r of e.expansion || []) r.type = An(r.type);
        delete e._;
      }
      return e;
    });
});
var Pn = x((tf, Tn) => {
  'use strict';
  var wh = q(),
    wn = I(),
    Sn = (t, e) => {
      let r = !1,
        s = t.replace(/^~([^\/]*)\//, (i, n) => ((r = !0), e(n || null) + '/'));
      return r || (s = t.replace(/^~(.*)$/, (i, n) => e(n || null))), s;
    };
  Tn.exports = t =>
    wh(e => {
      if (e.is('WORD') && typeof t.resolveHomeUser == 'function') return wn.setValue(e, Sn(e.value, t.resolveHomeUser));
      if (e.is('ASSIGNMENT_WORD') && typeof t.resolveHomeUser == 'function') {
        let r = e.value.split('=', 2),
          s = r[0],
          n = r[1]
            .split(':')
            .map(o => Sn(o, t.resolveHomeUser))
            .join(':');
        return wn.setValue(e, s + '=' + n);
      }
      return e;
    });
});
var kn = x((ef, Fn) => {
  'use strict';
  var Sh = q(),
    Nn = I();
  Fn.exports = t =>
    Sh(e => {
      if (e.is('WORD') && typeof t.resolvePath == 'function') return Nn.setValue(e, t.resolvePath(e.value));
      if (e.is('ASSIGNMENT_WORD') && typeof t.resolvePath == 'function') {
        let r = e.value.split('=');
        return Nn.setValue(e, r[0] + '=' + t.resolvePath(r[1]));
      }
      return e;
    });
});
var Ln = x((rf, Dn) => {
  'use strict';
  var On = '|&;()<> \\t',
    Th = `(\\\\['"` + On + `]|[^\\s'"` + On + '])+',
    Ph = '"((\\\\"|[^"])*?)"',
    Nh = "'((\\\\'|[^'])*?)'",
    Fh = '';
  for (pr = 0; pr < 4; pr++) Fh += (Math.pow(16, 8) * Math.random()).toString(16);
  var pr;
  Dn.exports = function (e) {
    var r = new RegExp(['(' + Th + '|' + Ph + '|' + Nh + ')*'].join('|'), 'g'),
      s = e.match(r).filter(Boolean),
      i = !1;
    return s
      ? s
          .map((n, o) => {
            if (!i) {
              for (var u = "'", c = '"', h = '\\', p = !1, m = !1, d = '', y = 0, E = n.length; y < E; y++) {
                var v = n.charAt(y);
                if (m) (d += v), (m = !1);
                else if (p)
                  v === p
                    ? (p = !1)
                    : p === u
                      ? (d += v)
                      : v === h
                        ? ((y += 1), (v = n.charAt(y)), v === c || v === h ? (d += v) : (d += h + v))
                        : (d += v);
                else if (v === c || v === u) p = v;
                else {
                  if (RegExp('^#$').test(v))
                    return (
                      (i = !0),
                      d.length
                        ? [d, { comment: n.slice(y + 1) + s.slice(o + 1).join(' ') }]
                        : [{ comment: n.slice(y + 1) + s.slice(o + 1).join(' ') }]
                    );
                  v === h ? (m = !0) : (d += v);
                }
              }
              return d;
            }
          })
          .reduce((n, o) => (o === void 0 ? n : n.concat(o)), [])
      : [];
  };
});
var Rn = x(() => {
  String.fromCodePoint ||
    (function () {
      var t = (function () {
          try {
            var i = {},
              n = Object.defineProperty,
              o = n(i, i, i) && n;
          } catch {}
          return o;
        })(),
        e = String.fromCharCode,
        r = Math.floor,
        s = function (i) {
          var n = 16384,
            o = [],
            u,
            c,
            h = -1,
            p = arguments.length;
          if (!p) return '';
          for (var m = ''; ++h < p; ) {
            var d = Number(arguments[h]);
            if (!isFinite(d) || d < 0 || d > 1114111 || r(d) != d) throw RangeError('Invalid code point: ' + d);
            d <= 65535 ? o.push(d) : ((d -= 65536), (u = (d >> 10) + 55296), (c = (d % 1024) + 56320), o.push(u, c)),
              (h + 1 == p || o.length > n) && ((m += e.apply(null, o)), (o.length = 0));
          }
          return m;
        };
      t ? t(String, 'fromCodePoint', { value: s, configurable: !0, writable: !0 }) : (String.fromCodePoint = s);
    })();
});
var Bn = x((te, In) => {
  'use strict';
  Object.defineProperty(te, '__esModule', { value: !0 });
  te.default = void 0;
  Rn();
  var kh =
      /\\(u\{([0-9A-Fa-f]+)\}|u([0-9A-Fa-f]{4})|x([0-9A-Fa-f]{2})|([1-7][0-7]{0,2}|[0-7]{2,3})|(['"tbrnfv0\\]))|\\U([0-9A-Fa-f]{8})/g,
    Oh = {
      0: '\0',
      b: '\b',
      f: '\f',
      n: `
`,
      r: '\r',
      t: '	',
      v: '\v',
      "'": "'",
      '"': '"',
      '\\': '\\',
    },
    we = function (e) {
      return String.fromCodePoint(parseInt(e, 16));
    },
    Dh = function (e) {
      return String.fromCodePoint(parseInt(e, 8));
    },
    Lh = function (e) {
      return e.replace(kh, function (r, s, i, n, o, u, c, h) {
        return i !== void 0
          ? we(i)
          : n !== void 0
            ? we(n)
            : o !== void 0
              ? we(o)
              : u !== void 0
                ? Dh(u)
                : h !== void 0
                  ? we(h)
                  : Oh[c];
      });
    };
  te.default = Lh;
  In.exports = te.default;
});
var qn = x((af, _n) => {
  'use strict';
  var Rh = Ln(),
    Ih = Bn(),
    Bh = q(),
    _h = I();
  function qh(t) {
    let e = Rh(t);
    return e.length === 0 ? t : e[0].comment ? '' : Ih(e[0]);
  }
  function jh(t) {
    return t.expansion ? t.expansion.filter(r => !r.resolved).length > 0 : !1;
  }
  _n.exports = () => Bh(t => ((t.is('WORD') || t.is('ASSIGNMENT_WORD')) && !jh(t) ? _h.setValue(t, qh(t.value)) : t));
});
var xt = x((of, jn) => {
  'use strict';
  function ee(t, e) {
    if ((e === void 0 && (e = 1), typeof e != 'number' && !(e instanceof Number)))
      throw new TypeError('Size argument must be a number');
    if (e < 1) throw new RangeError('Size argument must be greater than 0');
    let r = new Array(e + 1),
      s = [],
      i = t[Symbol.iterator]();
    return {
      ahead(n) {
        if (n > e) throw new RangeError(`Cannot look ahead of ${n} position, currently depth is ${e}`);
        if (n < 1) throw new RangeError('Look ahead index must be greater than 0');
        return s[n - 1];
      },
      behind(n) {
        if (n > e) throw new RangeError(`Cannot look behind of ${n} position, currently depth is ${e}`);
        if (n < 1) throw new RangeError('Look behind index must be greater than 0');
        return r[n];
      },
      [Symbol.iterator]() {
        return this;
      },
      next() {
        let n = i.next();
        for (; !n.done && s.length <= e; ) s.push(n.value), (n = i.next());
        if ((n.done || s.push(n.value), n.done && s.length === 0)) return { done: !0 };
        let o = s.shift();
        return r.unshift(o), r.pop(), { done: !1, value: o };
      },
    };
  }
  ee.depth = t => e => ee(e, t);
  ee.spread = function (e, r) {
    let s = ee(e, r);
    return (
      (s._next = s.next),
      (s.next = function () {
        let i = this._next();
        return i.done || (i.value = [i.value, s]), i;
      }),
      s
    );
  };
  jn.exports = ee;
});
var Wn = x((uf, Vn) => {
  'use strict';
  var $h = xt(),
    Mh = J(),
    Vh = q(),
    Wh = Wt();
  function $n(t) {
    return (
      t &&
      (t.is('SEPARATOR_OP') ||
        t.is('NEWLINE') ||
        t.is('NEWLINE_LIST') ||
        t.value === ';' ||
        t.is('PIPE') ||
        t.is('OR_IF') ||
        t.is('PIPE') ||
        t.is('AND_IF'))
    );
  }
  function Mn(t) {
    return t && t.is('WORD') && Wh(t.value);
  }
  Vn.exports = (t, e) =>
    Mh(
      Vh((r, s, i) => {
        if (r._.maybeStartOfSimpleCommand)
          if (Mn(r)) r._.maybeSimpleCommandName = !0;
          else {
            let n = i.ahead(1);
            n && !$n(n) && (n._.commandNameNotFoundYet = !0);
          }
        if (r._.commandNameNotFoundYet) {
          let n = i.behind(1);
          if (!e.enums.IOFileOperators.isOperator(n) && Mn(r)) r._.maybeSimpleCommandName = !0;
          else {
            let o = i.ahead(1);
            o && !$n(o) && (o._.commandNameNotFoundYet = !0);
          }
          delete r._.commandNameNotFoundYet;
        }
        return r;
      }),
      $h
    );
});
var Gn = x((cf, Un) => {
  'use strict';
  var Uh = pe(),
    Gh = J(),
    Kh = q(),
    zh = xt();
  Un.exports = function (e, r) {
    return Gh(
      Kh((s, i, n) => {
        let o = n.behind(1) || { EMPTY: !0, is: u => u === 'EMPTY' };
        return (
          (s._.maybeStartOfSimpleCommand = !!(
            o.is('EMPTY') ||
            o.is('SEPARATOR_OP') ||
            o.is('OPEN_PAREN') ||
            o.is('CLOSE_PAREN') ||
            o.is('NEWLINE') ||
            o.is('NEWLINE_LIST') ||
            o.is('TOKEN') === ';' ||
            o.is('PIPE') ||
            o.is('DSEMI') ||
            o.is('OR_IF') ||
            o.is('PIPE') ||
            o.is('AND_IF') ||
            (!o.is('For') && !o.is('In') && !o.is('Case') && Uh(r.enums.reservedWords).some(u => o.is(u)))
          )),
          s
        );
      }),
      zh
    );
  };
});
var Xn = x((hf, zn) => {
  'use strict';
  var Xh = ue(),
    Yh = q(),
    Kn = I(),
    Qh = t => ({
      OPERATOR(e) {
        return Xh(t, e.value) ? Kn.changeTokenType(e, t[e.value], e.value) : e;
      },
    });
  zn.exports = (t, e) => Yh(Kn.applyTokenizerVisitor(Qh(e.enums.operators)));
});
var Qn = x((lf, Yn) => {
  'use strict';
  var Hh = ue(),
    Jh = pe(),
    Zh = J(),
    tl = q(),
    el = xt();
  function rl(t, e, r) {
    let s = e.behind(1) || { EMPTY: !0, is: h => h === 'EMPTY' },
      i = e.behind(2) || { EMPTY: !0, is: h => h === 'EMPTY' },
      n =
        s.is('EMPTY') ||
        s.is('SEPARATOR_OP') ||
        s.is('OPEN_PAREN') ||
        s.is('CLOSE_PAREN') ||
        s.is('NEWLINE') ||
        s.is('NEWLINE_LIST') ||
        s.is('DSEMI') ||
        s.value === ';' ||
        s.is('PIPE') ||
        s.is('OR_IF') ||
        s.is('PIPE') ||
        s.is('AND_IF'),
      o = !s.value === 'for' && !s.value === 'in' && !s.value === 'case' && Jh(r).some(h => s.is(h)),
      u = i.value === 'case' && t.is('TOKEN') && t.value.toLowerCase() === 'in',
      c = i.value === 'for' && t.is('TOKEN') && (t.value.toLowerCase() === 'in' || t.value.toLowerCase() === 'do');
    return t.value === '}' || n || o || c || u;
  }
  Yn.exports = function (e, r) {
    return Zh(
      tl((s, i, n) =>
        rl(s, n, r.enums.reservedWords) && Hh(r.enums.reservedWords, s.value)
          ? s.changeTokenType(r.enums.reservedWords[s.value], s.value)
          : s.is('TOKEN')
            ? s.changeTokenType('WORD', s.value)
            : s
      ),
      el.depth(2)
    );
  };
});
var Jn = x((pf, Hn) => {
  'use strict';
  Hn.exports = sl;
  function* sl(t, e) {
    for (let r of t) e(r) && (yield r);
  }
});
var ta = x((ff, Zn) => {
  Zn.exports = function (e, r) {
    return function () {
      var s = Array.prototype.slice.call(arguments);
      return e.apply(r || this, s.reverse());
    };
  };
});
var ra = x((df, ea) => {
  'use strict';
  var il = Jn(),
    nl = ta(),
    al = le(),
    ol = al(nl(il), 2);
  ea.exports = ol;
});
var Se = x((mf, na) => {
  'use strict';
  var sa = ra(),
    ia = t => t !== null;
  na.exports = sa(ia);
  sa.predicate = ia;
});
var ua = x((xf, oa) => {
  'use strict';
  var ul = J(),
    cl = q(),
    hl = xt(),
    aa = I(),
    ll = Se(),
    pl = t =>
      t &&
      (t.is('NEWLINE') ||
        t.is('NEWLINE_LIST') ||
        t.is('AND') ||
        t.is('SEMICOLON') ||
        (t.is('OPERATOR') && t.value === ';') ||
        (t.is('OPERATOR') && t.value === '&'));
  function fr(t, e) {
    if (dr(t) === null) return null;
    let r = aa.changeTokenType(t, 'SEPARATOR_OP', t.value),
      s = 1,
      i = e.ahead(s);
    for (; pl(i); ) (i._.joinedToSeparator = !0), s++, (r = r.appendTo(i.value)), (i = e.ahead(s));
    return r;
  }
  function dr(t) {
    return t._.joinedToSeparator ? null : t;
  }
  var fl = {
    NEWLINE: dr,
    NEWLINE_LIST: dr,
    SEMICOLON: fr,
    AND: fr,
    OPERATOR: (t, e) => (t.value === '&' || t.value === ';' ? fr(t, e) : t),
  };
  oa.exports = () => ul(ll, cl(aa.applyTokenizerVisitor(fl)), hl.depth(10));
});
var ha = x((yf, ca) => {
  'use strict';
  var dl = J(),
    ml = q(),
    xl = xt(),
    Te = I(),
    yl = Se(),
    vl = {
      NEWLINE_LIST(t, e) {
        return (e.ahead(1) || Te.mkToken('EMPTY')).is('In')
          ? Te.changeTokenType(
              t,
              'LINEBREAK_IN',
              `
in`
            )
          : t;
      },
      In(t, e) {
        return (e.behind(1) || Te.mkToken('EMPTY')).is('NEWLINE_LIST') ? null : t;
      },
    };
  ca.exports = () => dl(yl, ml(Te.applyTokenizerVisitor(vl)), xl);
});
var pa = x((vf, la) => {
  'use strict';
  var El = J(),
    gl = q(),
    Al = xt(),
    Cl = Wt();
  la.exports = function () {
    return El(
      gl((e, r, s) =>
        (s.behind(1) || { is: () => !1 }).is('For') && e.is('WORD') && Cl(e.value)
          ? e.changeTokenType('NAME', e.value)
          : e
      ),
      Al
    );
  };
});
var da = x((Ef, fa) => {
  'use strict';
  var bl = J(),
    wl = q(),
    Sl = xt();
  fa.exports = function () {
    return bl(
      wl(
        (e, r, s) => (
          e._.maybeStartOfSimpleCommand &&
            e.is('WORD') &&
            s.ahead(2) &&
            s.ahead(1).is('OPEN_PAREN') &&
            s.ahead(2).is('CLOSE_PAREN') &&
            (e = e.changeTokenType('NAME', e.value)),
          e
        )
      ),
      Sl.depth(2)
    );
  };
});
var xa = x((gf, ma) => {
  'use strict';
  var Tl = J(),
    Pl = q(),
    Nl = xt();
  ma.exports = function (e, r) {
    return Tl(
      Pl((s, i, n) => {
        let o = n.ahead(1);
        return s && s.is('WORD') && s.value.match(/^[0-9]+$/) && r.enums.IOFileOperators.isOperator(o)
          ? s.changeTokenType('IO_NUMBER', s.value)
          : s;
      }),
      Nl
    );
  };
});
var va = x((Af, ya) => {
  'use strict';
  var Fl = J(),
    kl = q(),
    Ol = xt(),
    mr = I(),
    Dl = Se(),
    Ll = {
      NEWLINE(t, e) {
        return (e.behind(1) || mr.mkToken('EMPTY')).is('NEWLINE')
          ? null
          : mr.changeTokenType(
              t,
              'NEWLINE_LIST',
              `
`
            );
      },
    };
  ya.exports = () => Fl(Dl, kl(mr.applyTokenizerVisitor(Ll)), Ol);
});
var ga = x((Cf, Ea) => {
  'use strict';
  var Rl = q(),
    Il = Wt();
  Ea.exports = function () {
    return Rl(
      (e, r, s) => (
        e._.maybeStartOfSimpleCommand && (s.commandPrefixNotAllowed = !1),
        !s.commandPrefixNotAllowed &&
        e.is('WORD') &&
        e.value.indexOf('=') > 0 &&
        Il(e.value.slice(0, e.value.indexOf('=')))
          ? e.changeTokenType('ASSIGNMENT_WORD', e.value)
          : ((s.commandPrefixNotAllowed = !0), e)
      )
    );
  };
});
var Ca = x((bf, Aa) => {
  'use strict';
  var Bl = q();
  Aa.exports = function () {
    return Bl(e => {
      if (e && e.is('CONTINUE')) throw new SyntaxError('Unclosed ' + e.value);
      return e;
    });
  };
});
var ba = x(M => {
  'use strict';
  M.parameterExpansion = Ui();
  M.commandExpansion = Xi();
  M.arithmeticExpansion = ln();
  M.aliasSubstitution = dn();
  M.defaultNodeType = bn();
  M.fieldSplitting = Qt();
  M.tildeExpanding = Pn();
  M.pathExpansion = kn();
  M.quoteRemoval = qn();
  M.identifySimpleCommandNames = Wn();
  M.identifyMaybeSimpleCommands = Gn();
  M.operatorTokens = Xn();
  M.reservedWords = Qn();
  M.separator = ua();
  M.linebreakIn = ha();
  M.forNameVariable = pa();
  M.functionName = da();
  M.ioNumber = xa();
  M.newLineList = va();
  M.assignmentWord = ga();
  M.syntaxerrorOnContinue = Ca();
});
var Sa = x((Sf, wa) => {
  wa.exports = {
    start: 'complete_command',
    bnf: {
      complete_command: [
        ['list separator EOF', ' return yy.checkAsync($list, $separator)'],
        ['list EOF', ' return $list '],
        ['separator list EOF', ' return $list '],
        ['separator list separator EOF', ' return yy.checkAsync($list, $separator)'],
      ],
      list: [
        ['list separator and_or', '$$ = yy.listAppend($list, $and_or, $separator);'],
        ['and_or', '$$ = yy.list($and_or);'],
      ],
      and_or: [
        ['pipeline', '$$ = $pipeline;'],
        ['and_or AND_IF linebreak pipeline', '$$ = yy.andAndOr($and_or, $pipeline);'],
        ['and_or OR_IF linebreak pipeline', '$$ = yy.orAndOr($and_or, $pipeline);'],
      ],
      pipeline: [
        ['pipe_sequence', '$$ = yy.pipeLine($pipe_sequence);'],
        ['Bang pipe_sequence', '$$ = yy.bangPipeLine($pipe_sequence);'],
      ],
      pipe_sequence: [
        ['command', '$$ = yy.pipeSequence($command);'],
        ['pipe_sequence PIPE linebreak command', '$$ = yy.pipeSequenceAppend($pipe_sequence, $command);'],
      ],
      command: [
        'simple_command',
        'compound_command',
        ['compound_command redirect_list', '$$ = yy.addRedirections($compound_command, $redirect_list)'],
        'function_definition',
      ],
      compound_command: [
        'brace_group',
        'subshell',
        'for_clause',
        'case_clause',
        'if_clause',
        'while_clause',
        'until_clause',
      ],
      subshell: [
        [
          'OPEN_PAREN compound_list CLOSE_PAREN',
          '$$ = yy.subshell($compound_list, $OPEN_PAREN.loc, $CLOSE_PAREN.loc);',
        ],
      ],
      compound_list: [
        ['term', '$$ = $term;'],
        ['NEWLINE_LIST term', '$$ = $term;'],
        ['term separator', '$$ = yy.checkAsync($term, $separator);'],
        ['NEWLINE_LIST term separator', '$$ = yy.checkAsync($term, $separator);'],
      ],
      term: [
        ['term separator and_or', '$$ = yy.termAppend($term, $and_or, $separator);'],
        ['and_or', '$$ = yy.term($and_or);'],
      ],
      for_clause: [
        ['For name linebreak do_group', '$$ = yy.forClauseDefault($name, $do_group, $For.loc);'],
        ['For name LINEBREAK_IN separator do_group', '$$ = yy.forClauseDefault($name, $do_group, $For.loc);'],
        ['For name In separator do_group', '$$ = yy.forClauseDefault($name, $do_group, $For.loc);'],
        ['For name in wordlist separator do_group', '$$ = yy.forClause($name, $wordlist, $do_group, $For.loc);'],
      ],
      name: ['NAME'],
      in: ['In'],
      wordlist: ['wordlist_repetition_plus0'],
      case_clause: [
        [
          'Case WORD linebreak in linebreak case_list Esac',
          '$$ = yy.caseClause($WORD, $case_list, $Case.loc, $Esac.loc);',
        ],
        [
          'Case WORD linebreak in linebreak case_list_ns Esac',
          '$$ = yy.caseClause($WORD, $case_list_ns, $Case.loc, $Esac.loc);',
        ],
        ['Case WORD linebreak in linebreak Esac', '$$ = yy.caseClause($WORD, null, $Case.loc, $Esac.loc);'],
      ],
      case_list_ns: [
        ['case_list case_item_ns', '$$ = yy.caseListAppend($case_list, $case_item_ns);'],
        ['case_item_ns', '$$ = yy.caseList($case_item_ns);'],
      ],
      case_list: [
        ['case_list case_item', '$$ = yy.caseListAppend($case_list, $case_item);'],
        ['case_item', '$$ = yy.caseList($case_item);'],
      ],
      case_item_ns: [
        ['pattern CLOSE_PAREN linebreak', '$$ = yy.caseItem($pattern, null, $pattern[0].loc, $CLOSE_PAREN.loc);'],
        [
          'pattern CLOSE_PAREN compound_list linebreak',
          '$$ = yy.caseItem($pattern, $compound_list, $pattern[0].loc, $compound_list.loc);',
        ],
        [
          'OPEN_PAREN pattern CLOSE_PAREN linebreak',
          '$$ = yy.caseItem($pattern, null, $OPEN_PAREN.loc, $CLOSE_PAREN.loc );',
        ],
        [
          'OPEN_PAREN pattern CLOSE_PAREN compound_list linebreak',
          '$$ = yy.caseItem($pattern, $compound_list, $OPEN_PAREN.loc, $compound_list.loc);',
        ],
      ],
      case_item: [
        [
          'pattern CLOSE_PAREN linebreak DSEMI linebreak',
          '$$ = yy.caseItem($pattern, null, $pattern[0].loc, $DSEMI.loc);',
        ],
        [
          'pattern CLOSE_PAREN compound_list DSEMI linebreak',
          '$$ = yy.caseItem($pattern, $compound_list, $pattern[0].loc, $DSEMI.loc);',
        ],
        [
          'OPEN_PAREN pattern CLOSE_PAREN linebreak DSEMI linebreak',
          '$$ = yy.caseItem($pattern, null, $OPEN_PAREN.loc, $DSEMI.loc );',
        ],
        [
          'OPEN_PAREN pattern CLOSE_PAREN compound_list DSEMI linebreak',
          '$$ = yy.caseItem($pattern, $compound_list, $OPEN_PAREN.loc, $DSEMI.loc);',
        ],
      ],
      pattern: [
        ['WORD', '$$ = yy.pattern($WORD);'],
        ['pattern PIPE WORD', '$$ = yy.patternAppend($pattern, $WORD);'],
      ],
      if_clause: [
        ['If compound_list Then compound_list else_part Fi', '$$ = yy.ifClause($2, $4, $else_part, $If.loc, $Fi.loc);'],
        ['If compound_list Then compound_list Fi', '$$ = yy.ifClause($2, $4, null, $If.loc, $Fi.loc);'],
      ],
      else_part: [
        ['Elif compound_list Then compound_list', '$$ = yy.ifClause($2, $4, null, $Elif.loc, $4.loc);'],
        [
          'Elif compound_list Then compound_list else_part',
          '$$ = yy.ifClause($2, $4, $else_part, $Elif.loc, $else_part.loc);',
        ],
        ['Else compound_list', '$$ = yy.elseClause($compound_list, $Else);'],
      ],
      while_clause: [['While compound_list do_group', '$$ = yy.while($2, $3, $While);']],
      until_clause: [['Until compound_list do_group', '$$ = yy.until($2, $3, $Until);']],
      function_definition: [
        ['fname OPEN_PAREN CLOSE_PAREN linebreak function_body', '$$ = yy.functionDefinition($fname, $function_body);'],
      ],
      function_body: [
        ['compound_command', '$$ = [$compound_command, null];'],
        ['compound_command redirect_list', '$$ = [$compound_command, $redirect_list];'],
      ],
      fname: ['NAME'],
      brace_group: [['Lbrace compound_list Rbrace', '$$ = yy.braceGroup($compound_list, $Lbrace.loc, $Rbrace.loc);']],
      do_group: [['Do compound_list Done', '$$ = yy.doGroup($compound_list, $Do.loc, $Done.loc);']],
      simple_command: [
        ['cmd_prefix cmd_word cmd_suffix', '$$ =yy.command($cmd_prefix, $cmd_word, $cmd_suffix);'],
        ['cmd_prefix cmd_word', '$$ =yy.command($cmd_prefix, $cmd_word, null);'],
        ['cmd_prefix', '$$ =yy.commandAssignment($cmd_prefix);'],
        ['cmd_name cmd_suffix', '$$ =yy.command(null, $cmd_name, $cmd_suffix);'],
        ['cmd_name', '$$ =yy.command(null, $cmd_name);'],
      ],
      cmd_name: [['WORD', '$$ =yy.commandName(yytext) /* Apply rule 7a */;']],
      cmd_word: [['WORD', '$$ = yytext	/* Apply rule 7B */;']],
      cmd_prefix: [
        ['io_redirect', '$$ = yy.prefix($io_redirect);'],
        ['cmd_prefix io_redirect', '$$ = yy.prefixAppend($1, $2);'],
        ['ASSIGNMENT_WORD', '$$ = yy.prefix($1);'],
        ['cmd_prefix ASSIGNMENT_WORD', '$$ = yy.prefixAppend($1, $2);'],
      ],
      cmd_suffix: [
        ['io_redirect', '$$ = yy.suffix($io_redirect);'],
        ['cmd_suffix io_redirect', '$$ = yy.suffixAppend($cmd_suffix, $io_redirect);'],
        ['WORD', '$$ = yy.suffix($1);'],
        ['cmd_suffix WORD', '$$ = yy.suffixAppend($cmd_suffix, $2);'],
      ],
      redirect_list: [
        ['io_redirect', '$$ = [$io_redirect];'],
        ['redirect_list io_redirect', '$$ = $redirect_list.concat($io_redirect);'],
      ],
      io_redirect: [
        ['io_file', '$$ = $io_file;'],
        ['IO_NUMBER io_file', '$$ = yy.numberIoRedirect($io_file, $1);'],
        'io_here',
        'IO_NUMBER io_here',
      ],
      io_file: [
        ['LESS filename', '$$ =yy.ioRedirect($1, $filename);'],
        ['LESSAND filename', '$$ =yy.ioRedirect($1, $filename);'],
        ['GREAT filename', '$$ =yy.ioRedirect($1, $filename);'],
        ['GREATAND filename', '$$ =yy.ioRedirect($1, $filename);'],
        ['DGREAT filename', '$$ =yy.ioRedirect($1, $filename);'],
        ['LESSGREAT filename', '$$ =yy.ioRedirect($1, $filename);'],
        ['CLOBBER filename', '$$ =yy.ioRedirect($1, $filename);'],
      ],
      filename: ['WORD'],
      io_here: ['DLESS here_end', 'DLESSDASH here_end'],
      here_end: ['WORD'],
      linebreak: ['NEWLINE_LIST', ''],
      separator: ['SEPARATOR_OP', 'NEWLINE_LIST'],
      wordlist_repetition_plus0: [
        ['WORD', '$$ = [$1];'],
        ['wordlist_repetition_plus0 WORD', '$1.push($2);'],
      ],
    },
  };
});
var Na = x((Tf, Pa) => {
  'use strict';
  var Ta = (Pa.exports = ['LESS', 'DLESS', 'DGREAT', 'LESSAND', 'GREATAND', 'GREAT', 'LESSGREAT', 'CLOBBER']);
  Ta.isOperator = function (e) {
    for (let r of Ta) if (e.type === r) return !0;
    return !1;
  };
});
var ka = x((Pf, Fa) => {
  'use strict';
  var et = '[a-zA-Z_][a-zA-Z0-9_]*',
    _l = {
      [`^(${et}):\\-(.*)$`]: { op: 'useDefaultValue', parameter: t => t[1], word: t => t[2], expand: ['word'] },
      [`^(${et}):\\=(.*)$`]: { op: 'assignDefaultValue', parameter: t => t[1], word: t => t[2], expand: ['word'] },
      [`^(${et}):\\?(.*)$`]: { op: 'indicateErrorIfNull', parameter: t => t[1], word: t => t[2], expand: ['word'] },
      [`^(${et}):\\+(.*)$`]: { op: 'useAlternativeValue', parameter: t => t[1], word: t => t[2], expand: ['word'] },
      [`^(${et})\\-(.*)$`]: { op: 'useDefaultValueIfUnset', parameter: t => t[1], word: t => t[2], expand: ['word'] },
      [`^(${et})\\=(.*)$`]: {
        op: 'assignDefaultValueIfUnset',
        parameter: t => t[1],
        word: t => t[2],
        expand: ['word'],
      },
      [`^(${et})\\?(.*)$`]: { op: 'indicateErrorIfUnset', parameter: t => t[1], word: t => t[2], expand: ['word'] },
      [`^(${et})\\+(.*)$`]: {
        op: 'useAlternativeValueIfUnset',
        parameter: t => t[1],
        word: t => t[2],
        expand: ['word'],
      },
      [`^(${et})\\%\\%(.*)$`]: {
        op: 'removeLargestSuffixPattern',
        parameter: t => t[1],
        word: t => t[2],
        expand: ['word'],
      },
      [`^(${et})\\#\\#(.*)$`]: {
        op: 'removeLargestPrefixPattern',
        parameter: t => t[1],
        word: t => t[2],
        expand: ['word'],
      },
      [`^(${et})\\%(.*)$`]: {
        op: 'removeSmallestSuffixPattern',
        parameter: t => t[1],
        word: t => t[2],
        expand: ['word'],
      },
      [`^(${et})\\#(.*)$`]: {
        op: 'removeSmallestPrefixPattern',
        parameter: t => t[1],
        word: t => t[2],
        expand: ['word'],
      },
      [`^\\#(${et})$`]: { op: 'stringLength', parameter: t => t[1] },
      '^([1-9][0-9]*)$': { kind: 'positional', parameter: t => Number(t[1]) },
      '^!$': { kind: 'last-background-pid' },
      '^\\@$': { kind: 'positional-list' },
      '^\\-$': { kind: 'current-option-flags' },
      '^\\#$': { kind: 'positional-count' },
      '^\\?$': { kind: 'last-exit-status' },
      '^\\*$': { kind: 'positional-string' },
      '^\\$$': { kind: 'shell-process-id' },
      '^0$': { kind: 'shell-script-name' },
    };
  Fa.exports = _l;
});
var Da = x((Nf, Oa) => {
  'use strict';
  Oa.exports = {
    if: 'If',
    then: 'Then',
    else: 'Else',
    elif: 'Elif',
    fi: 'Fi',
    do: 'Do',
    done: 'Done',
    case: 'Case',
    esac: 'Esac',
    while: 'While',
    until: 'Until',
    for: 'For',
    in: 'In',
    '{': 'Lbrace',
    '}': 'Rbrace',
    '!': 'Bang',
  };
});
var La = x(re => {
  'use strict';
  re.IOFileOperators = Na();
  re.operators = _e();
  re.parameterOperators = ka();
  re.reservedWords = Da();
});
var Ra = x((At, xr) => {
  var Pe = (function () {
    var t = function (kt, yt, pt, $) {
        for (pt = pt || {}, $ = kt.length; $--; pt[kt[$]] = yt);
        return pt;
      },
      e = [1, 9],
      r = [1, 28],
      s = [1, 6],
      i = [1, 29],
      n = [1, 34],
      o = [1, 30],
      u = [1, 26],
      c = [1, 31],
      h = [1, 32],
      p = [1, 33],
      m = [1, 27],
      d = [1, 25],
      y = [1, 36],
      E = [1, 38],
      v = [1, 39],
      N = [1, 40],
      T = [1, 41],
      A = [1, 42],
      C = [1, 43],
      S = [1, 44],
      g = [1, 45],
      k = [1, 46],
      Z = [1, 5],
      Q = [6, 31, 84],
      ht = [1, 50],
      se = [1, 51],
      yr = [
        6, 13, 27, 29, 31, 32, 39, 41, 42, 44, 49, 50, 51, 53, 54, 55, 56, 57, 60, 61, 62, 63, 69, 71, 73, 75, 76, 77,
        78, 79, 80, 81, 83,
      ],
      jt = [6, 9, 11, 29, 31, 44, 49, 51, 53, 54, 55, 61, 62, 63, 84],
      vr = [1, 52],
      H = [6, 9, 11, 15, 29, 31, 44, 49, 51, 53, 54, 55, 61, 62, 63, 84],
      Er = [1, 62],
      j = [6, 9, 11, 15, 29, 31, 44, 49, 51, 53, 54, 55, 61, 62, 63, 71, 73, 75, 76, 77, 78, 79, 80, 81, 83, 84],
      W = [
        6, 9, 11, 15, 29, 31, 42, 44, 49, 51, 53, 54, 55, 61, 62, 63, 69, 71, 73, 75, 76, 77, 78, 79, 80, 81, 83, 84,
      ],
      Nt = [6, 9, 11, 15, 29, 31, 42, 44, 49, 51, 53, 54, 55, 61, 62, 63, 71, 73, 75, 76, 77, 78, 79, 80, 81, 83, 84],
      lt = [1, 66],
      Ct = [1, 78],
      gr = [1, 86],
      Ar = [13, 27, 32, 39, 41, 42, 50, 56, 57, 60, 69, 71, 73, 75, 76, 77, 78, 79, 80, 81, 83],
      X = [2, 102],
      tt = [1, 93],
      Cr = [1, 99],
      br = [29, 44, 49, 51, 53, 54, 55, 61, 62, 63],
      wr = [29, 31, 44, 49, 51, 53, 54, 55, 61, 62, 63, 84],
      Ft = [1, 112],
      Sr = [2, 101],
      Tr = [29, 31, 44, 49, 51, 53, 54, 55, 61, 62, 63],
      Pr = [2, 37],
      Nr = [31, 42, 84],
      nt = [27, 42, 44],
      Fr = [1, 140],
      kr = [1, 141],
      Or = [1, 151],
      Ne = [1, 152],
      Dr = [1, 161],
      Lr = [15, 29],
      Fe = [44, 49],
      Rr = [1, 166],
      Ir = {
        trace: function () {},
        yy: {},
        symbols_: {
          error: 2,
          complete_command: 3,
          list: 4,
          separator: 5,
          EOF: 6,
          and_or: 7,
          pipeline: 8,
          AND_IF: 9,
          linebreak: 10,
          OR_IF: 11,
          pipe_sequence: 12,
          Bang: 13,
          command: 14,
          PIPE: 15,
          simple_command: 16,
          compound_command: 17,
          redirect_list: 18,
          function_definition: 19,
          brace_group: 20,
          subshell: 21,
          for_clause: 22,
          case_clause: 23,
          if_clause: 24,
          while_clause: 25,
          until_clause: 26,
          OPEN_PAREN: 27,
          compound_list: 28,
          CLOSE_PAREN: 29,
          term: 30,
          NEWLINE_LIST: 31,
          For: 32,
          name: 33,
          do_group: 34,
          LINEBREAK_IN: 35,
          In: 36,
          in: 37,
          wordlist: 38,
          NAME: 39,
          wordlist_repetition_plus0: 40,
          Case: 41,
          WORD: 42,
          case_list: 43,
          Esac: 44,
          case_list_ns: 45,
          case_item_ns: 46,
          case_item: 47,
          pattern: 48,
          DSEMI: 49,
          If: 50,
          Then: 51,
          else_part: 52,
          Fi: 53,
          Elif: 54,
          Else: 55,
          While: 56,
          Until: 57,
          fname: 58,
          function_body: 59,
          Lbrace: 60,
          Rbrace: 61,
          Do: 62,
          Done: 63,
          cmd_prefix: 64,
          cmd_word: 65,
          cmd_suffix: 66,
          cmd_name: 67,
          io_redirect: 68,
          ASSIGNMENT_WORD: 69,
          io_file: 70,
          IO_NUMBER: 71,
          io_here: 72,
          LESS: 73,
          filename: 74,
          LESSAND: 75,
          GREAT: 76,
          GREATAND: 77,
          DGREAT: 78,
          LESSGREAT: 79,
          CLOBBER: 80,
          DLESS: 81,
          here_end: 82,
          DLESSDASH: 83,
          SEPARATOR_OP: 84,
          $accept: 0,
          $end: 1,
        },
        terminals_: {
          2: 'error',
          6: 'EOF',
          9: 'AND_IF',
          11: 'OR_IF',
          13: 'Bang',
          15: 'PIPE',
          27: 'OPEN_PAREN',
          29: 'CLOSE_PAREN',
          31: 'NEWLINE_LIST',
          32: 'For',
          35: 'LINEBREAK_IN',
          36: 'In',
          39: 'NAME',
          41: 'Case',
          42: 'WORD',
          44: 'Esac',
          49: 'DSEMI',
          50: 'If',
          51: 'Then',
          53: 'Fi',
          54: 'Elif',
          55: 'Else',
          56: 'While',
          57: 'Until',
          60: 'Lbrace',
          61: 'Rbrace',
          62: 'Do',
          63: 'Done',
          69: 'ASSIGNMENT_WORD',
          71: 'IO_NUMBER',
          73: 'LESS',
          75: 'LESSAND',
          76: 'GREAT',
          77: 'GREATAND',
          78: 'DGREAT',
          79: 'LESSGREAT',
          80: 'CLOBBER',
          81: 'DLESS',
          83: 'DLESSDASH',
          84: 'SEPARATOR_OP',
        },
        productions_: [
          0,
          [3, 3],
          [3, 2],
          [3, 3],
          [3, 4],
          [4, 3],
          [4, 1],
          [7, 1],
          [7, 4],
          [7, 4],
          [8, 1],
          [8, 2],
          [12, 1],
          [12, 4],
          [14, 1],
          [14, 1],
          [14, 2],
          [14, 1],
          [17, 1],
          [17, 1],
          [17, 1],
          [17, 1],
          [17, 1],
          [17, 1],
          [17, 1],
          [21, 3],
          [28, 1],
          [28, 2],
          [28, 2],
          [28, 3],
          [30, 3],
          [30, 1],
          [22, 4],
          [22, 5],
          [22, 5],
          [22, 6],
          [33, 1],
          [37, 1],
          [38, 1],
          [23, 7],
          [23, 7],
          [23, 6],
          [45, 2],
          [45, 1],
          [43, 2],
          [43, 1],
          [46, 3],
          [46, 4],
          [46, 4],
          [46, 5],
          [47, 5],
          [47, 5],
          [47, 6],
          [47, 6],
          [48, 1],
          [48, 3],
          [24, 6],
          [24, 5],
          [52, 4],
          [52, 5],
          [52, 2],
          [25, 3],
          [26, 3],
          [19, 5],
          [59, 1],
          [59, 2],
          [58, 1],
          [20, 3],
          [34, 3],
          [16, 3],
          [16, 2],
          [16, 1],
          [16, 2],
          [16, 1],
          [67, 1],
          [65, 1],
          [64, 1],
          [64, 2],
          [64, 1],
          [64, 2],
          [66, 1],
          [66, 2],
          [66, 1],
          [66, 2],
          [18, 1],
          [18, 2],
          [68, 1],
          [68, 2],
          [68, 1],
          [68, 2],
          [70, 2],
          [70, 2],
          [70, 2],
          [70, 2],
          [70, 2],
          [70, 2],
          [70, 2],
          [74, 1],
          [72, 2],
          [72, 2],
          [82, 1],
          [10, 1],
          [10, 0],
          [5, 1],
          [5, 1],
          [40, 1],
          [40, 2],
        ],
        performAction: function (yt, pt, $, b, at, l, $t) {
          var f = l.length - 1;
          switch (at) {
            case 1:
              return b.checkAsync(l[f - 2], l[f - 1]);
            case 2:
            case 3:
              return l[f - 1];
            case 4:
              return b.checkAsync(l[f - 2], l[f - 3]);
            case 5:
              this.$ = b.listAppend(l[f - 2], l[f], l[f - 1]);
              break;
            case 6:
              this.$ = b.list(l[f]);
              break;
            case 7:
            case 26:
            case 27:
            case 86:
              this.$ = l[f];
              break;
            case 8:
              this.$ = b.andAndOr(l[f - 3], l[f]);
              break;
            case 9:
              this.$ = b.orAndOr(l[f - 3], l[f]);
              break;
            case 10:
              this.$ = b.pipeLine(l[f]);
              break;
            case 11:
              this.$ = b.bangPipeLine(l[f]);
              break;
            case 12:
              this.$ = b.pipeSequence(l[f]);
              break;
            case 13:
              this.$ = b.pipeSequenceAppend(l[f - 3], l[f]);
              break;
            case 16:
              this.$ = b.addRedirections(l[f - 1], l[f]);
              break;
            case 25:
              this.$ = b.subshell(l[f - 1], l[f - 2].loc, l[f].loc);
              break;
            case 28:
            case 29:
              this.$ = b.checkAsync(l[f - 1], l[f]);
              break;
            case 30:
              this.$ = b.termAppend(l[f - 2], l[f], l[f - 1]);
              break;
            case 31:
              this.$ = b.term(l[f]);
              break;
            case 32:
              this.$ = b.forClauseDefault(l[f - 2], l[f], l[f - 3].loc);
              break;
            case 33:
            case 34:
              this.$ = b.forClauseDefault(l[f - 3], l[f], l[f - 4].loc);
              break;
            case 35:
              this.$ = b.forClause(l[f - 4], l[f - 2], l[f], l[f - 5].loc);
              break;
            case 39:
            case 40:
              this.$ = b.caseClause(l[f - 5], l[f - 1], l[f - 6].loc, l[f].loc);
              break;
            case 41:
              this.$ = b.caseClause(l[f - 4], null, l[f - 5].loc, l[f].loc);
              break;
            case 42:
            case 44:
              this.$ = b.caseListAppend(l[f - 1], l[f]);
              break;
            case 43:
            case 45:
              this.$ = b.caseList(l[f]);
              break;
            case 46:
              this.$ = b.caseItem(l[f - 2], null, l[f - 2][0].loc, l[f - 1].loc);
              break;
            case 47:
              this.$ = b.caseItem(l[f - 3], l[f - 1], l[f - 3][0].loc, l[f - 1].loc);
              break;
            case 48:
              this.$ = b.caseItem(l[f - 2], null, l[f - 3].loc, l[f - 1].loc);
              break;
            case 49:
              this.$ = b.caseItem(l[f - 3], l[f - 1], l[f - 4].loc, l[f - 1].loc);
              break;
            case 50:
              this.$ = b.caseItem(l[f - 4], null, l[f - 4][0].loc, l[f - 1].loc);
              break;
            case 51:
              this.$ = b.caseItem(l[f - 4], l[f - 2], l[f - 4][0].loc, l[f - 1].loc);
              break;
            case 52:
              this.$ = b.caseItem(l[f - 4], null, l[f - 5].loc, l[f - 1].loc);
              break;
            case 53:
              this.$ = b.caseItem(l[f - 4], l[f - 2], l[f - 5].loc, l[f - 1].loc);
              break;
            case 54:
              this.$ = b.pattern(l[f]);
              break;
            case 55:
              this.$ = b.patternAppend(l[f - 2], l[f]);
              break;
            case 56:
              this.$ = b.ifClause(l[f - 4], l[f - 2], l[f - 1], l[f - 5].loc, l[f].loc);
              break;
            case 57:
              this.$ = b.ifClause(l[f - 3], l[f - 1], null, l[f - 4].loc, l[f].loc);
              break;
            case 58:
              this.$ = b.ifClause(l[f - 2], l[f], null, l[f - 3].loc, l[f].loc);
              break;
            case 59:
              this.$ = b.ifClause(l[f - 3], l[f - 1], l[f], l[f - 4].loc, l[f].loc);
              break;
            case 60:
              this.$ = b.elseClause(l[f], l[f - 1]);
              break;
            case 61:
              this.$ = b.while(l[f - 1], l[f], l[f - 2]);
              break;
            case 62:
              this.$ = b.until(l[f - 1], l[f], l[f - 2]);
              break;
            case 63:
              this.$ = b.functionDefinition(l[f - 4], l[f]);
              break;
            case 64:
              this.$ = [l[f], null];
              break;
            case 65:
              this.$ = [l[f - 1], l[f]];
              break;
            case 67:
              this.$ = b.braceGroup(l[f - 1], l[f - 2].loc, l[f].loc);
              break;
            case 68:
              this.$ = b.doGroup(l[f - 1], l[f - 2].loc, l[f].loc);
              break;
            case 69:
              this.$ = b.command(l[f - 2], l[f - 1], l[f]);
              break;
            case 70:
              this.$ = b.command(l[f - 1], l[f], null);
              break;
            case 71:
              this.$ = b.commandAssignment(l[f]);
              break;
            case 72:
              this.$ = b.command(null, l[f - 1], l[f]);
              break;
            case 73:
              this.$ = b.command(null, l[f]);
              break;
            case 74:
              this.$ = b.commandName(yt);
              break;
            case 75:
              this.$ = yt;
              break;
            case 76:
            case 78:
              this.$ = b.prefix(l[f]);
              break;
            case 77:
            case 79:
              this.$ = b.prefixAppend(l[f - 1], l[f]);
              break;
            case 80:
            case 82:
              this.$ = b.suffix(l[f]);
              break;
            case 81:
            case 83:
              this.$ = b.suffixAppend(l[f - 1], l[f]);
              break;
            case 84:
            case 105:
              this.$ = [l[f]];
              break;
            case 85:
              this.$ = l[f - 1].concat(l[f]);
              break;
            case 87:
              this.$ = b.numberIoRedirect(l[f], l[f - 1]);
              break;
            case 90:
            case 91:
            case 92:
            case 93:
            case 94:
            case 95:
            case 96:
              this.$ = b.ioRedirect(l[f - 1], l[f]);
              break;
            case 106:
              l[f - 1].push(l[f]);
              break;
          }
        },
        table: [
          {
            3: 1,
            4: 2,
            5: 3,
            7: 4,
            8: 7,
            12: 8,
            13: e,
            14: 10,
            16: 11,
            17: 12,
            19: 13,
            20: 16,
            21: 17,
            22: 18,
            23: 19,
            24: 20,
            25: 21,
            26: 22,
            27: r,
            31: s,
            32: i,
            39: n,
            41: o,
            42: u,
            50: c,
            56: h,
            57: p,
            58: 23,
            60: m,
            64: 14,
            67: 15,
            68: 24,
            69: d,
            70: 35,
            71: y,
            72: 37,
            73: E,
            75: v,
            76: N,
            77: T,
            78: A,
            79: C,
            80: S,
            81: g,
            83: k,
            84: Z,
          },
          { 1: [3] },
          { 5: 47, 6: [1, 48], 31: s, 84: Z },
          {
            4: 49,
            7: 4,
            8: 7,
            12: 8,
            13: e,
            14: 10,
            16: 11,
            17: 12,
            19: 13,
            20: 16,
            21: 17,
            22: 18,
            23: 19,
            24: 20,
            25: 21,
            26: 22,
            27: r,
            32: i,
            39: n,
            41: o,
            42: u,
            50: c,
            56: h,
            57: p,
            58: 23,
            60: m,
            64: 14,
            67: 15,
            68: 24,
            69: d,
            70: 35,
            71: y,
            72: 37,
            73: E,
            75: v,
            76: N,
            77: T,
            78: A,
            79: C,
            80: S,
            81: g,
            83: k,
          },
          t(Q, [2, 6], { 9: ht, 11: se }),
          t(yr, [2, 103]),
          t(yr, [2, 104]),
          t(jt, [2, 7]),
          t(jt, [2, 10], { 15: vr }),
          {
            12: 53,
            14: 10,
            16: 11,
            17: 12,
            19: 13,
            20: 16,
            21: 17,
            22: 18,
            23: 19,
            24: 20,
            25: 21,
            26: 22,
            27: r,
            32: i,
            39: n,
            41: o,
            42: u,
            50: c,
            56: h,
            57: p,
            58: 23,
            60: m,
            64: 14,
            67: 15,
            68: 24,
            69: d,
            70: 35,
            71: y,
            72: 37,
            73: E,
            75: v,
            76: N,
            77: T,
            78: A,
            79: C,
            80: S,
            81: g,
            83: k,
          },
          t(H, [2, 12]),
          t(H, [2, 14]),
          t(H, [2, 15], {
            70: 35,
            72: 37,
            18: 54,
            68: 55,
            71: y,
            73: E,
            75: v,
            76: N,
            77: T,
            78: A,
            79: C,
            80: S,
            81: g,
            83: k,
          }),
          t(H, [2, 17]),
          t(H, [2, 71], {
            70: 35,
            72: 37,
            65: 56,
            68: 57,
            42: [1, 59],
            69: [1, 58],
            71: y,
            73: E,
            75: v,
            76: N,
            77: T,
            78: A,
            79: C,
            80: S,
            81: g,
            83: k,
          }),
          t(H, [2, 73], {
            70: 35,
            72: 37,
            66: 60,
            68: 61,
            42: Er,
            71: y,
            73: E,
            75: v,
            76: N,
            77: T,
            78: A,
            79: C,
            80: S,
            81: g,
            83: k,
          }),
          t(j, [2, 18]),
          t(j, [2, 19]),
          t(j, [2, 20]),
          t(j, [2, 21]),
          t(j, [2, 22]),
          t(j, [2, 23]),
          t(j, [2, 24]),
          { 27: [1, 63] },
          t(W, [2, 76]),
          t(W, [2, 78]),
          t(Nt, [2, 74]),
          {
            7: 67,
            8: 7,
            12: 8,
            13: e,
            14: 10,
            16: 11,
            17: 12,
            19: 13,
            20: 16,
            21: 17,
            22: 18,
            23: 19,
            24: 20,
            25: 21,
            26: 22,
            27: r,
            28: 64,
            30: 65,
            31: lt,
            32: i,
            39: n,
            41: o,
            42: u,
            50: c,
            56: h,
            57: p,
            58: 23,
            60: m,
            64: 14,
            67: 15,
            68: 24,
            69: d,
            70: 35,
            71: y,
            72: 37,
            73: E,
            75: v,
            76: N,
            77: T,
            78: A,
            79: C,
            80: S,
            81: g,
            83: k,
          },
          {
            7: 67,
            8: 7,
            12: 8,
            13: e,
            14: 10,
            16: 11,
            17: 12,
            19: 13,
            20: 16,
            21: 17,
            22: 18,
            23: 19,
            24: 20,
            25: 21,
            26: 22,
            27: r,
            28: 68,
            30: 65,
            31: lt,
            32: i,
            39: n,
            41: o,
            42: u,
            50: c,
            56: h,
            57: p,
            58: 23,
            60: m,
            64: 14,
            67: 15,
            68: 24,
            69: d,
            70: 35,
            71: y,
            72: 37,
            73: E,
            75: v,
            76: N,
            77: T,
            78: A,
            79: C,
            80: S,
            81: g,
            83: k,
          },
          { 33: 69, 39: [1, 70] },
          { 42: [1, 71] },
          {
            7: 67,
            8: 7,
            12: 8,
            13: e,
            14: 10,
            16: 11,
            17: 12,
            19: 13,
            20: 16,
            21: 17,
            22: 18,
            23: 19,
            24: 20,
            25: 21,
            26: 22,
            27: r,
            28: 72,
            30: 65,
            31: lt,
            32: i,
            39: n,
            41: o,
            42: u,
            50: c,
            56: h,
            57: p,
            58: 23,
            60: m,
            64: 14,
            67: 15,
            68: 24,
            69: d,
            70: 35,
            71: y,
            72: 37,
            73: E,
            75: v,
            76: N,
            77: T,
            78: A,
            79: C,
            80: S,
            81: g,
            83: k,
          },
          {
            7: 67,
            8: 7,
            12: 8,
            13: e,
            14: 10,
            16: 11,
            17: 12,
            19: 13,
            20: 16,
            21: 17,
            22: 18,
            23: 19,
            24: 20,
            25: 21,
            26: 22,
            27: r,
            28: 73,
            30: 65,
            31: lt,
            32: i,
            39: n,
            41: o,
            42: u,
            50: c,
            56: h,
            57: p,
            58: 23,
            60: m,
            64: 14,
            67: 15,
            68: 24,
            69: d,
            70: 35,
            71: y,
            72: 37,
            73: E,
            75: v,
            76: N,
            77: T,
            78: A,
            79: C,
            80: S,
            81: g,
            83: k,
          },
          {
            7: 67,
            8: 7,
            12: 8,
            13: e,
            14: 10,
            16: 11,
            17: 12,
            19: 13,
            20: 16,
            21: 17,
            22: 18,
            23: 19,
            24: 20,
            25: 21,
            26: 22,
            27: r,
            28: 74,
            30: 65,
            31: lt,
            32: i,
            39: n,
            41: o,
            42: u,
            50: c,
            56: h,
            57: p,
            58: 23,
            60: m,
            64: 14,
            67: 15,
            68: 24,
            69: d,
            70: 35,
            71: y,
            72: 37,
            73: E,
            75: v,
            76: N,
            77: T,
            78: A,
            79: C,
            80: S,
            81: g,
            83: k,
          },
          { 27: [2, 66] },
          t(W, [2, 86]),
          { 70: 75, 72: 76, 73: E, 75: v, 76: N, 77: T, 78: A, 79: C, 80: S, 81: g, 83: k },
          t(W, [2, 88]),
          { 42: Ct, 74: 77 },
          { 42: Ct, 74: 79 },
          { 42: Ct, 74: 80 },
          { 42: Ct, 74: 81 },
          { 42: Ct, 74: 82 },
          { 42: Ct, 74: 83 },
          { 42: Ct, 74: 84 },
          { 42: gr, 82: 85 },
          { 42: gr, 82: 87 },
          {
            6: [1, 88],
            7: 89,
            8: 7,
            12: 8,
            13: e,
            14: 10,
            16: 11,
            17: 12,
            19: 13,
            20: 16,
            21: 17,
            22: 18,
            23: 19,
            24: 20,
            25: 21,
            26: 22,
            27: r,
            32: i,
            39: n,
            41: o,
            42: u,
            50: c,
            56: h,
            57: p,
            58: 23,
            60: m,
            64: 14,
            67: 15,
            68: 24,
            69: d,
            70: 35,
            71: y,
            72: 37,
            73: E,
            75: v,
            76: N,
            77: T,
            78: A,
            79: C,
            80: S,
            81: g,
            83: k,
          },
          { 1: [2, 2] },
          { 5: 91, 6: [1, 90], 31: s, 84: Z },
          t(Ar, X, { 10: 92, 31: tt }),
          t(Ar, X, { 10: 94, 31: tt }),
          t([27, 32, 39, 41, 42, 50, 56, 57, 60, 69, 71, 73, 75, 76, 77, 78, 79, 80, 81, 83], X, { 10: 95, 31: tt }),
          t(jt, [2, 11], { 15: vr }),
          t(H, [2, 16], {
            70: 35,
            72: 37,
            68: 96,
            71: y,
            73: E,
            75: v,
            76: N,
            77: T,
            78: A,
            79: C,
            80: S,
            81: g,
            83: k,
          }),
          t(j, [2, 84]),
          t(H, [2, 70], {
            70: 35,
            72: 37,
            68: 61,
            66: 97,
            42: Er,
            71: y,
            73: E,
            75: v,
            76: N,
            77: T,
            78: A,
            79: C,
            80: S,
            81: g,
            83: k,
          }),
          t(W, [2, 77]),
          t(W, [2, 79]),
          t(Nt, [2, 75]),
          t(H, [2, 72], {
            70: 35,
            72: 37,
            68: 98,
            42: Cr,
            71: y,
            73: E,
            75: v,
            76: N,
            77: T,
            78: A,
            79: C,
            80: S,
            81: g,
            83: k,
          }),
          t(Nt, [2, 80]),
          t(Nt, [2, 82]),
          { 29: [1, 100] },
          { 61: [1, 101] },
          t(br, [2, 26], { 5: 102, 31: s, 84: Z }),
          {
            7: 67,
            8: 7,
            12: 8,
            13: e,
            14: 10,
            16: 11,
            17: 12,
            19: 13,
            20: 16,
            21: 17,
            22: 18,
            23: 19,
            24: 20,
            25: 21,
            26: 22,
            27: r,
            30: 103,
            32: i,
            39: n,
            41: o,
            42: u,
            50: c,
            56: h,
            57: p,
            58: 23,
            60: m,
            64: 14,
            67: 15,
            68: 24,
            69: d,
            70: 35,
            71: y,
            72: 37,
            73: E,
            75: v,
            76: N,
            77: T,
            78: A,
            79: C,
            80: S,
            81: g,
            83: k,
          },
          t(wr, [2, 31], { 9: ht, 11: se }),
          { 29: [1, 104] },
          { 10: 105, 31: tt, 35: [1, 106], 36: [1, 107], 37: 108, 62: X },
          t([31, 35, 36, 62], [2, 36]),
          { 10: 109, 31: tt, 36: X },
          { 51: [1, 110] },
          { 34: 111, 62: Ft },
          { 34: 113, 62: Ft },
          t(W, [2, 87]),
          t(W, [2, 89]),
          t(W, [2, 90]),
          t(W, [2, 97]),
          t(W, [2, 91]),
          t(W, [2, 92]),
          t(W, [2, 93]),
          t(W, [2, 94]),
          t(W, [2, 95]),
          t(W, [2, 96]),
          t(W, [2, 98]),
          t(W, [2, 100]),
          t(W, [2, 99]),
          { 1: [2, 1] },
          t(Q, [2, 5], { 9: ht, 11: se }),
          { 1: [2, 3] },
          {
            6: [1, 114],
            7: 89,
            8: 7,
            12: 8,
            13: e,
            14: 10,
            16: 11,
            17: 12,
            19: 13,
            20: 16,
            21: 17,
            22: 18,
            23: 19,
            24: 20,
            25: 21,
            26: 22,
            27: r,
            32: i,
            39: n,
            41: o,
            42: u,
            50: c,
            56: h,
            57: p,
            58: 23,
            60: m,
            64: 14,
            67: 15,
            68: 24,
            69: d,
            70: 35,
            71: y,
            72: 37,
            73: E,
            75: v,
            76: N,
            77: T,
            78: A,
            79: C,
            80: S,
            81: g,
            83: k,
          },
          {
            8: 115,
            12: 8,
            13: e,
            14: 10,
            16: 11,
            17: 12,
            19: 13,
            20: 16,
            21: 17,
            22: 18,
            23: 19,
            24: 20,
            25: 21,
            26: 22,
            27: r,
            32: i,
            39: n,
            41: o,
            42: u,
            50: c,
            56: h,
            57: p,
            58: 23,
            60: m,
            64: 14,
            67: 15,
            68: 24,
            69: d,
            70: 35,
            71: y,
            72: 37,
            73: E,
            75: v,
            76: N,
            77: T,
            78: A,
            79: C,
            80: S,
            81: g,
            83: k,
          },
          t([13, 27, 32, 36, 39, 41, 42, 44, 50, 56, 57, 60, 62, 69, 71, 73, 75, 76, 77, 78, 79, 80, 81, 83], Sr),
          {
            8: 116,
            12: 8,
            13: e,
            14: 10,
            16: 11,
            17: 12,
            19: 13,
            20: 16,
            21: 17,
            22: 18,
            23: 19,
            24: 20,
            25: 21,
            26: 22,
            27: r,
            32: i,
            39: n,
            41: o,
            42: u,
            50: c,
            56: h,
            57: p,
            58: 23,
            60: m,
            64: 14,
            67: 15,
            68: 24,
            69: d,
            70: 35,
            71: y,
            72: 37,
            73: E,
            75: v,
            76: N,
            77: T,
            78: A,
            79: C,
            80: S,
            81: g,
            83: k,
          },
          {
            14: 117,
            16: 11,
            17: 12,
            19: 13,
            20: 16,
            21: 17,
            22: 18,
            23: 19,
            24: 20,
            25: 21,
            26: 22,
            27: r,
            32: i,
            39: n,
            41: o,
            42: u,
            50: c,
            56: h,
            57: p,
            58: 23,
            60: m,
            64: 14,
            67: 15,
            68: 24,
            69: d,
            70: 35,
            71: y,
            72: 37,
            73: E,
            75: v,
            76: N,
            77: T,
            78: A,
            79: C,
            80: S,
            81: g,
            83: k,
          },
          t(j, [2, 85]),
          t(H, [2, 69], {
            70: 35,
            72: 37,
            68: 98,
            42: Cr,
            71: y,
            73: E,
            75: v,
            76: N,
            77: T,
            78: A,
            79: C,
            80: S,
            81: g,
            83: k,
          }),
          t(Nt, [2, 81]),
          t(Nt, [2, 83]),
          t([27, 32, 41, 50, 56, 57, 60], X, { 10: 118, 31: tt }),
          t(j, [2, 67]),
          t(Tr, [2, 28], {
            8: 7,
            12: 8,
            14: 10,
            16: 11,
            17: 12,
            19: 13,
            64: 14,
            67: 15,
            20: 16,
            21: 17,
            22: 18,
            23: 19,
            24: 20,
            25: 21,
            26: 22,
            58: 23,
            68: 24,
            70: 35,
            72: 37,
            7: 119,
            13: e,
            27: r,
            32: i,
            39: n,
            41: o,
            42: u,
            50: c,
            56: h,
            57: p,
            60: m,
            69: d,
            71: y,
            73: E,
            75: v,
            76: N,
            77: T,
            78: A,
            79: C,
            80: S,
            81: g,
            83: k,
          }),
          t(br, [2, 27], { 5: 120, 31: s, 84: Z }),
          t(j, [2, 25]),
          { 34: 121, 62: Ft },
          { 5: 122, 31: s, 84: Z },
          { 5: 123, 31: s, 42: Pr, 84: Z },
          { 38: 124, 40: 125, 42: [1, 126] },
          { 36: [1, 128], 37: 127 },
          {
            7: 67,
            8: 7,
            12: 8,
            13: e,
            14: 10,
            16: 11,
            17: 12,
            19: 13,
            20: 16,
            21: 17,
            22: 18,
            23: 19,
            24: 20,
            25: 21,
            26: 22,
            27: r,
            28: 129,
            30: 65,
            31: lt,
            32: i,
            39: n,
            41: o,
            42: u,
            50: c,
            56: h,
            57: p,
            58: 23,
            60: m,
            64: 14,
            67: 15,
            68: 24,
            69: d,
            70: 35,
            71: y,
            72: 37,
            73: E,
            75: v,
            76: N,
            77: T,
            78: A,
            79: C,
            80: S,
            81: g,
            83: k,
          },
          t(j, [2, 61]),
          {
            7: 67,
            8: 7,
            12: 8,
            13: e,
            14: 10,
            16: 11,
            17: 12,
            19: 13,
            20: 16,
            21: 17,
            22: 18,
            23: 19,
            24: 20,
            25: 21,
            26: 22,
            27: r,
            28: 130,
            30: 65,
            31: lt,
            32: i,
            39: n,
            41: o,
            42: u,
            50: c,
            56: h,
            57: p,
            58: 23,
            60: m,
            64: 14,
            67: 15,
            68: 24,
            69: d,
            70: 35,
            71: y,
            72: 37,
            73: E,
            75: v,
            76: N,
            77: T,
            78: A,
            79: C,
            80: S,
            81: g,
            83: k,
          },
          t(j, [2, 62]),
          { 1: [2, 4] },
          t(jt, [2, 8]),
          t(jt, [2, 9]),
          t(H, [2, 13]),
          {
            17: 132,
            20: 16,
            21: 17,
            22: 18,
            23: 19,
            24: 20,
            25: 21,
            26: 22,
            27: r,
            32: i,
            41: o,
            50: c,
            56: h,
            57: p,
            59: 131,
            60: m,
          },
          t(wr, [2, 30], { 9: ht, 11: se }),
          t(Tr, [2, 29], {
            8: 7,
            12: 8,
            14: 10,
            16: 11,
            17: 12,
            19: 13,
            64: 14,
            67: 15,
            20: 16,
            21: 17,
            22: 18,
            23: 19,
            24: 20,
            25: 21,
            26: 22,
            58: 23,
            68: 24,
            70: 35,
            72: 37,
            7: 119,
            13: e,
            27: r,
            32: i,
            39: n,
            41: o,
            42: u,
            50: c,
            56: h,
            57: p,
            60: m,
            69: d,
            71: y,
            73: E,
            75: v,
            76: N,
            77: T,
            78: A,
            79: C,
            80: S,
            81: g,
            83: k,
          }),
          t(j, [2, 32]),
          { 34: 133, 62: Ft },
          { 34: 134, 62: Ft },
          { 5: 135, 31: s, 84: Z },
          t([31, 84], [2, 38], { 42: [1, 136] }),
          t(Nr, [2, 105]),
          t(nt, X, { 10: 137, 31: tt }),
          t([27, 31, 42, 44], Pr),
          { 52: 138, 53: [1, 139], 54: Fr, 55: kr },
          { 63: [1, 142] },
          t(H, [2, 63]),
          t(H, [2, 64], {
            70: 35,
            72: 37,
            68: 55,
            18: 143,
            71: y,
            73: E,
            75: v,
            76: N,
            77: T,
            78: A,
            79: C,
            80: S,
            81: g,
            83: k,
          }),
          t(j, [2, 33]),
          t(j, [2, 34]),
          { 34: 144, 62: Ft },
          t(Nr, [2, 106]),
          { 27: Or, 42: Ne, 43: 145, 44: [1, 147], 45: 146, 46: 149, 47: 148, 48: 150 },
          { 53: [1, 153] },
          t(j, [2, 57]),
          {
            7: 67,
            8: 7,
            12: 8,
            13: e,
            14: 10,
            16: 11,
            17: 12,
            19: 13,
            20: 16,
            21: 17,
            22: 18,
            23: 19,
            24: 20,
            25: 21,
            26: 22,
            27: r,
            28: 154,
            30: 65,
            31: lt,
            32: i,
            39: n,
            41: o,
            42: u,
            50: c,
            56: h,
            57: p,
            58: 23,
            60: m,
            64: 14,
            67: 15,
            68: 24,
            69: d,
            70: 35,
            71: y,
            72: 37,
            73: E,
            75: v,
            76: N,
            77: T,
            78: A,
            79: C,
            80: S,
            81: g,
            83: k,
          },
          {
            7: 67,
            8: 7,
            12: 8,
            13: e,
            14: 10,
            16: 11,
            17: 12,
            19: 13,
            20: 16,
            21: 17,
            22: 18,
            23: 19,
            24: 20,
            25: 21,
            26: 22,
            27: r,
            28: 155,
            30: 65,
            31: lt,
            32: i,
            39: n,
            41: o,
            42: u,
            50: c,
            56: h,
            57: p,
            58: 23,
            60: m,
            64: 14,
            67: 15,
            68: 24,
            69: d,
            70: 35,
            71: y,
            72: 37,
            73: E,
            75: v,
            76: N,
            77: T,
            78: A,
            79: C,
            80: S,
            81: g,
            83: k,
          },
          t(j, [2, 68]),
          t(H, [2, 65], {
            70: 35,
            72: 37,
            68: 96,
            71: y,
            73: E,
            75: v,
            76: N,
            77: T,
            78: A,
            79: C,
            80: S,
            81: g,
            83: k,
          }),
          t(j, [2, 35]),
          { 27: Or, 42: Ne, 44: [1, 156], 46: 158, 47: 157, 48: 150 },
          { 44: [1, 159] },
          t(j, [2, 41]),
          t(nt, [2, 45]),
          { 44: [2, 43] },
          { 15: Dr, 29: [1, 160] },
          { 42: Ne, 48: 162 },
          t(Lr, [2, 54]),
          t(j, [2, 56]),
          { 51: [1, 163] },
          { 53: [2, 60] },
          t(j, [2, 39]),
          t(nt, [2, 44]),
          { 44: [2, 42] },
          t(j, [2, 40]),
          t(Fe, X, {
            8: 7,
            12: 8,
            14: 10,
            16: 11,
            17: 12,
            19: 13,
            64: 14,
            67: 15,
            20: 16,
            21: 17,
            22: 18,
            23: 19,
            24: 20,
            25: 21,
            26: 22,
            58: 23,
            68: 24,
            70: 35,
            72: 37,
            30: 65,
            7: 67,
            10: 164,
            28: 165,
            13: e,
            27: r,
            31: Rr,
            32: i,
            39: n,
            41: o,
            42: u,
            50: c,
            56: h,
            57: p,
            60: m,
            69: d,
            71: y,
            73: E,
            75: v,
            76: N,
            77: T,
            78: A,
            79: C,
            80: S,
            81: g,
            83: k,
          }),
          { 42: [1, 167] },
          { 15: Dr, 29: [1, 168] },
          {
            7: 67,
            8: 7,
            12: 8,
            13: e,
            14: 10,
            16: 11,
            17: 12,
            19: 13,
            20: 16,
            21: 17,
            22: 18,
            23: 19,
            24: 20,
            25: 21,
            26: 22,
            27: r,
            28: 169,
            30: 65,
            31: lt,
            32: i,
            39: n,
            41: o,
            42: u,
            50: c,
            56: h,
            57: p,
            58: 23,
            60: m,
            64: 14,
            67: 15,
            68: 24,
            69: d,
            70: 35,
            71: y,
            72: 37,
            73: E,
            75: v,
            76: N,
            77: T,
            78: A,
            79: C,
            80: S,
            81: g,
            83: k,
          },
          { 44: [2, 46], 49: [1, 170] },
          { 10: 172, 31: tt, 44: X, 49: [1, 171] },
          t(Fe, Sr, {
            8: 7,
            12: 8,
            14: 10,
            16: 11,
            17: 12,
            19: 13,
            64: 14,
            67: 15,
            20: 16,
            21: 17,
            22: 18,
            23: 19,
            24: 20,
            25: 21,
            26: 22,
            58: 23,
            68: 24,
            70: 35,
            72: 37,
            7: 67,
            30: 103,
            13: e,
            27: r,
            32: i,
            39: n,
            41: o,
            42: u,
            50: c,
            56: h,
            57: p,
            60: m,
            69: d,
            71: y,
            73: E,
            75: v,
            76: N,
            77: T,
            78: A,
            79: C,
            80: S,
            81: g,
            83: k,
          }),
          t(Lr, [2, 55]),
          t(Fe, X, {
            8: 7,
            12: 8,
            14: 10,
            16: 11,
            17: 12,
            19: 13,
            64: 14,
            67: 15,
            20: 16,
            21: 17,
            22: 18,
            23: 19,
            24: 20,
            25: 21,
            26: 22,
            58: 23,
            68: 24,
            70: 35,
            72: 37,
            30: 65,
            7: 67,
            10: 173,
            28: 174,
            13: e,
            27: r,
            31: Rr,
            32: i,
            39: n,
            41: o,
            42: u,
            50: c,
            56: h,
            57: p,
            60: m,
            69: d,
            71: y,
            73: E,
            75: v,
            76: N,
            77: T,
            78: A,
            79: C,
            80: S,
            81: g,
            83: k,
          }),
          { 52: 175, 53: [2, 58], 54: Fr, 55: kr },
          t(nt, X, { 10: 176, 31: tt }),
          t(nt, X, { 10: 177, 31: tt }),
          { 44: [2, 47] },
          { 44: [2, 48], 49: [1, 178] },
          { 10: 180, 31: tt, 44: X, 49: [1, 179] },
          { 53: [2, 59] },
          t(nt, [2, 50]),
          t(nt, [2, 51]),
          t(nt, X, { 10: 181, 31: tt }),
          t(nt, X, { 10: 182, 31: tt }),
          { 44: [2, 49] },
          t(nt, [2, 52]),
          t(nt, [2, 53]),
        ],
        defaultActions: {
          34: [2, 66],
          48: [2, 2],
          88: [2, 1],
          90: [2, 3],
          114: [2, 4],
          149: [2, 43],
          155: [2, 60],
          158: [2, 42],
          172: [2, 47],
          175: [2, 59],
          180: [2, 49],
        },
        parseError: function (yt, pt) {
          if (pt.recoverable) this.trace(yt);
          else {
            var $ = new Error(yt);
            throw (($.hash = pt), $);
          }
        },
        parse: function (yt) {
          var pt = this,
            $ = [0],
            b = [],
            at = [null],
            l = [],
            $t = this.table,
            f = '',
            ie = 0,
            Br = 0,
            _r = 0,
            Va = 2,
            qr = 1,
            Wa = l.slice.call(arguments, 1),
            G = Object.create(this.lexer),
            bt = { yy: {} };
          for (var Oe in this.yy) Object.prototype.hasOwnProperty.call(this.yy, Oe) && (bt.yy[Oe] = this.yy[Oe]);
          G.setInput(yt, bt.yy), (bt.yy.lexer = G), (bt.yy.parser = this), typeof G.yylloc > 'u' && (G.yylloc = {});
          var De = G.yylloc;
          l.push(De);
          var Ua = G.options && G.options.ranges;
          typeof bt.yy.parseError == 'function'
            ? (this.parseError = bt.yy.parseError)
            : (this.parseError = Object.getPrototypeOf(this).parseError);
          function Yl(ft) {
            ($.length = $.length - 2 * ft), (at.length = at.length - ft), (l.length = l.length - ft);
          }
          for (
            var Ga = function () {
                var ft;
                return (ft = G.lex() || qr), typeof ft != 'number' && (ft = pt.symbols_[ft] || ft), ft;
              },
              Y,
              Le,
              wt,
              rt,
              Ql,
              Re,
              Ot = {},
              ne,
              vt,
              jr,
              ae;
            ;
          ) {
            if (
              ((wt = $[$.length - 1]),
              this.defaultActions[wt]
                ? (rt = this.defaultActions[wt])
                : ((Y === null || typeof Y > 'u') && (Y = Ga()), (rt = $t[wt] && $t[wt][Y])),
              typeof rt > 'u' || !rt.length || !rt[0])
            ) {
              var Ie = '';
              ae = [];
              for (ne in $t[wt]) this.terminals_[ne] && ne > Va && ae.push("'" + this.terminals_[ne] + "'");
              G.showPosition
                ? (Ie =
                    'Parse error on line ' +
                    (ie + 1) +
                    `:
` +
                    G.showPosition() +
                    `
Expecting ` +
                    ae.join(', ') +
                    ", got '" +
                    (this.terminals_[Y] || Y) +
                    "'")
                : (Ie =
                    'Parse error on line ' +
                    (ie + 1) +
                    ': Unexpected ' +
                    (Y == qr ? 'end of input' : "'" + (this.terminals_[Y] || Y) + "'")),
                this.parseError(Ie, {
                  text: G.match,
                  token: this.terminals_[Y] || Y,
                  line: G.yylineno,
                  loc: De,
                  expected: ae,
                });
            }
            if (rt[0] instanceof Array && rt.length > 1)
              throw new Error('Parse Error: multiple actions possible at state: ' + wt + ', token: ' + Y);
            switch (rt[0]) {
              case 1:
                $.push(Y),
                  at.push(G.yytext),
                  l.push(G.yylloc),
                  $.push(rt[1]),
                  (Y = null),
                  Le
                    ? ((Y = Le), (Le = null))
                    : ((Br = G.yyleng), (f = G.yytext), (ie = G.yylineno), (De = G.yylloc), _r > 0 && _r--);
                break;
              case 2:
                if (
                  ((vt = this.productions_[rt[1]][1]),
                  (Ot.$ = at[at.length - vt]),
                  (Ot._$ = {
                    first_line: l[l.length - (vt || 1)].first_line,
                    last_line: l[l.length - 1].last_line,
                    first_column: l[l.length - (vt || 1)].first_column,
                    last_column: l[l.length - 1].last_column,
                  }),
                  Ua && (Ot._$.range = [l[l.length - (vt || 1)].range[0], l[l.length - 1].range[1]]),
                  (Re = this.performAction.apply(Ot, [f, Br, ie, bt.yy, rt[1], at, l].concat(Wa))),
                  typeof Re < 'u')
                )
                  return Re;
                vt && (($ = $.slice(0, -1 * vt * 2)), (at = at.slice(0, -1 * vt)), (l = l.slice(0, -1 * vt))),
                  $.push(this.productions_[rt[1]][0]),
                  at.push(Ot.$),
                  l.push(Ot._$),
                  (jr = $t[$[$.length - 2]][$[$.length - 1]]),
                  $.push(jr);
                break;
              case 3:
                return !0;
            }
          }
          return !0;
        },
      };
    function ke() {
      this.yy = {};
    }
    return (ke.prototype = Ir), (Ir.Parser = ke), new ke();
  })();
  typeof Mt < 'u' &&
    typeof At < 'u' &&
    ((At.parser = Pe),
    (At.Parser = Pe.Parser),
    (At.parse = function () {
      return Pe.parse.apply(Pe, arguments);
    }),
    (At.main = function (e) {
      e[1] || (console.log('Usage: ' + e[0] + ' FILE'), process.exit(1));
      var r = Mt('fs').readFileSync(Mt('path').normalize(e[1]), 'utf8');
      return At.parser.parse(r);
    }),
    typeof xr < 'u' && Mt.main === xr && At.main(process.argv.slice(1)));
});
var Ba = x((Of, Ia) => {
  'use strict';
  var ql = Ks(),
    jl = Ti(),
    _ = ba(),
    $l = Sa(),
    Ml = La(),
    Vl = () => [
      _.newLineList,
      _.operatorTokens,
      _.separator,
      _.reservedWords,
      _.linebreakIn,
      _.ioNumber,
      _.identifyMaybeSimpleCommands,
      _.assignmentWord,
      _.parameterExpansion,
      _.arithmeticExpansion,
      _.commandExpansion,
      _.forNameVariable,
      _.functionName,
      _.identifySimpleCommandNames,
      _.aliasSubstitution,
      _.tildeExpanding,
      _.parameterExpansion.resolve,
      _.commandExpansion.resolve,
      _.arithmeticExpansion.resolve,
      _.fieldSplitting.split,
      _.pathExpansion,
      _.quoteRemoval,
      _.syntaxerrorOnContinue,
      _.defaultNodeType,
    ];
  Ia.exports = {
    inherits: null,
    init: (t, e) => {
      let r = null;
      try {
        r = Ra();
      } catch {}
      return {
        enums: Ml,
        phaseCatalog: _,
        lexerPhases: Vl(e),
        tokenizer: jl,
        grammarSource: $l,
        grammar: r,
        astBuilder: ql,
      };
    },
  };
});
var qa = x((Df, _a) => {
  'use strict';
  var Wl = q(),
    Ul = I().tokenOrEmpty,
    Gl = () => Wl(t => (t.is('TOKEN') ? t.changeTokenType('WORD', t.value) : t));
  function Kl(t, e, r) {
    let s = e && e.shift();
    return s === void 0
      ? { nextReduction: r.end, tokensToEmit: Ul(t), nextState: t.resetCurrent().saveCurrentLocAsStart() }
      : t.escaping &&
          s ===
            `
`
        ? { nextReduction: r.start, nextState: t.setEscaping(!1).removeLastChar() }
        : !t.escaping && s === '\\'
          ? { nextReduction: r.start, nextState: t.setEscaping(!0).appendChar(s) }
          : !t.escaping && s === "'"
            ? { nextReduction: r.singleQuoting, nextState: t.appendChar(s) }
            : !t.escaping && s === '"'
              ? { nextReduction: r.doubleQuoting, nextState: t.appendChar(s) }
              : !t.escaping && s === '$'
                ? { nextReduction: r.expansionStart, nextState: t.appendChar(s).appendEmptyExpansion() }
                : !t.escaping && s === '`'
                  ? { nextReduction: r.expansionCommandTick, nextState: t.appendChar(s).appendEmptyExpansion() }
                  : { nextReduction: r.start, nextState: t.appendChar(s).setEscaping(!1) };
  }
  _a.exports = {
    inherits: 'posix',
    init: t => {
      let e = t.phaseCatalog,
        r = [
          Gl,
          e.parameterExpansion,
          e.arithmeticExpansion,
          e.commandExpansion,
          e.tildeExpanding,
          e.parameterExpansion.resolve,
          e.commandExpansion.resolve,
          e.arithmeticExpansion.resolve,
          e.fieldSplitting.split,
          e.pathExpansion,
          e.quoteRemoval,
          e.defaultNodeType,
        ],
        s = Object.assign({}, t.tokenizer.reducers, { start: Kl });
      return Object.assign({}, t, { lexerPhases: r, tokenizer: () => t.tokenizer({}, s) });
    },
  };
});
var He = x((Lf, Ma) => {
  var zl = rs(),
    ja = Fs(),
    Xl = { bash: Ms(), posix: Ba(), 'word-expansion': qa() };
  function $a(t) {
    let e = Xl[t];
    return e.inherits ? e.init($a(e.inherits), ja) : e.init(null, ja);
  }
  Ma.exports = function (e, r) {
    try {
      (r = r || {}), (r.mode = r.mode || 'posix');
      let s = $a(r.mode),
        i = s.grammar.Parser,
        n = s.astBuilder,
        o = new i();
      return (o.lexer = zl(s, r)), (o.yy = n(r)), o.parse(e);
    } catch (s) {
      throw s instanceof SyntaxError ? s : new Error(s.stack || s.message);
    }
  };
});
export default He();
/*! Bundled license information:

is-number/index.js:
  (*!
   * is-number <https://github.com/jonschlinkert/is-number>
   *
   * Copyright (c) 2014-2017, Jon Schlinkert.
   * Released under the MIT License.
   *)

array-last/index.js:
  (*!
   * array-last <https://github.com/jonschlinkert/array-last>
   *
   * Copyright (c) 2014-2017, Jon Schlinkert.
   * Released under the MIT License.
   *)

babylon/lib/index.js:
  (*! https://mths.be/fromcodepoint v0.2.1 by @mathias *)

string.fromcodepoint/fromcodepoint.js:
  (*! http://mths.be/fromcodepoint v0.2.1 by @mathias *)
*/
