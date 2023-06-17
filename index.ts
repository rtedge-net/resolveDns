import { serve, ConnInfo } from "https://deno.land/std/http/server.ts";
import { Status }          from "https://deno.land/std/http/http_status.ts";
import   ip6               from "https://deno.land/x/ip6/ip6.js"; 
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
import { readAll }         from "https://deno.land/std/streams/read_all.ts";

const getTLD = domain => domain.slice(domain.lastIndexOf('.') + 1);
const WHOIS = async (domain, server, port = 43) => { const tld = getTLD(domain);                      server ??= (WHOIS.IANA.cache[tld] ??= await WHOIS(domain, WHOIS.IANA.server).then(WHOIS.IANA.find).then(server => { if (!server) throw new Error(`WHOIS server not found for TLD: ${tld}`); return server; }));
  const                                                         conn = await Deno.connect({ hostname: server, port: 43 });
  await                                                         conn.write(new TextEncoder().encode(domain + "\r\n"));
  const                                  buffer = await readAll(conn);
  const  data = new TextDecoder().decode(buffer);               conn.close();
  return data;
};/**/WHOIS.IANA = { server: `whois.iana.org`, find: data => data?.match?.(/^whois:\s+([^\s]+)/m)?.[1] ?? '', cache: {} };

const RDAP = async (domain = '', server) => { const tld = getTLD(domain); if (tld === '') return await RDAP.IANA.data();
  /**/                                                                                                server ??= (RDAP.IANA.cache[tld] ??= await RDAP.IANA.server(tld)); const url = `${server}domain/${domain}`;
  return await fetch(url).then(f => f.status === 404 ? ({ error: `no records`, status: f.status, tld, server, url }) : f.json())
};/**/RDAP.IANA = { cache: {},
/**/    server: async domain => {  const tld = getTLD(domain);
/**/      const  srv =   RDAP.IANA.cache[tld];
/**/      return srv ?? (RDAP.IANA.cache[tld] ??= await RDAP.IANA.data().then(data => data.services[tld]?.[0]).then(srv => { if (srv === undefined) throw new Error(`RDAP server not found for TLD: ${tld}`); return srv; }));
/**/    },
/**/  };
/**/  RDAP.IANA.data = async () => {
        const iana = RDAP.IANA.data.cache ??= await fetch(RDAP.IANA.data.url).then(f => f.json());
        const data = {
          source: { url: RDAP.IANA.data.url, transformation: { company: 'Elefunc.com', department: 'RTEdge.net', construct: [ 'services' ], add: [ 'servers' ] } },
          description: iana.description,
          publication: iana.publication, services: {}, servers: {},
          version:     iana.version,
        };
        for (const service of iana.services) {
          const                tlds    =      service[0];
          const                servers =      service[1];
          for (const tld    of tlds)     data.services[tld] = servers;
          for (const server of servers) (data.servers[server] ??= []).push(...tlds);
        }
        return data;
      };
      RDAP.IANA.data.url = 'https://data.iana.org/rdap/dns.json';

const TLD = (q = '') => fetch('https://data.iana.org/TLD/tlds-alpha-by-domain.txt').then(f => f.text()).then(x => x.split('\n').filter(l => !l?.startsWith?.('#')).filter(l => l.trim() !== '').map(l => l.toLowerCase())).then(TLD => q === '' ? TLD : TLD.includes(q));

//await WHOIS('efn.kr')
//await RDAP(['deno.dev','efn.kr'][0]);
//await RDAP();
//await TLD();
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const         CT = `content-type`;
const TP = { [CT]: `text/plain;charset=utf-8` };
const TH = { [CT]: `text/html;charset=utf-8` };
const TJ = { [CT]: `text/javascript;charset=utf-8` };
const AJ = { [CT]: `application/json;charset=utf-8` };
const         ACXH = `access-control-expose-headers`;
const         ACAO = `access-control-allow-origin`;
const XH = { [ACXH]: '_, ip, ip-x, dur, server, server-timing' };
const AO = { [ACAO]: '*' };
const NS = { 'cache-control': 'no-store' };
const HSTS = { "strict-transport-security": "max-age=31536000; includeSubDomains; preload" };

const JP = (...v) => { try { return JSON.parse    (...v); } catch (e) { } };
const JS =                          JSON.stringify;

const PF = 'fulfilled';
const PR =  'rejected';

const resolve = async (t, q, ...O) => {
  try       { return await (t === 'AS' ? ip.info(`AS${q.replace(/^ASN?/i, '')}`) : t === 'IP' ? q : Deno.resolveDns(q, t, ...O)); } 
  catch (e) { return { error: e.message }; }
};
const rextend = async (t, q, ...O) => {
  const o = await resolve(t, q, ...O);
  return ip.type.has(t) && o.map ? (await Promise.all(o.map(ip.info))).reduce((x, { ip, ...O }) => (x[ip] = O, x), {}) : t === 'IP' ? ip.info(o) : o;
};
const registry      = (t, q, ...O) => registry[t](q, ...O).catch(e => ({ error: e.message }));
/**/  registry.RDAP  =   (q, ...O) =>        RDAP(q);
/**/  registry.WHOIS =   (q, ...O) =>       WHOIS(q);

const tld = (t, q, ...O) => TLD(q);

const F = { // [ short, extended ] output
  DENO:  [  resolve, rextend  ],
  RDAP:  [ registry, registry ],
  WHOIS: [ registry, registry ],
  TLD:   [      tld, tld      ]
};

const ip = { v4: q => !q.includes(':'),
  type: new Set([ 'A', 'AAAA', 'IP' ]),
  info:    q => undefined,
  reverse: q => ip.v4(q) ? q.split('.').reverse().join('.') : ip6.ptr(q, 0),
  ptr:     q => `${ip.reverse(q)}.${ip.v4(q) ? 'in-addr' : 'ip6'}.arpa.`
};
ip.info.user = q => fetch(`https://ipinfo.io/${q}?${new URLSearchParams({ token: Deno.env.get('IPINFO_TOKEN') })}`).then(f => f.json())                                .catch(e => ({ ip: q, error: e.message }));
ip.info.curl = q => fetch(`https://ipinfo.io/${q}`,                   { headers: { "user-agent": "curl/7.81.0" } }).then(f => f.json()).then(o => (delete o.readme, o)).catch(e => ({ ip: q, error: e.message }));
ip.info.user.user = ip.info.user; ip.info.curl.user = ip.info.user;
ip.info.user.curl = ip.info.curl; ip.info.curl.curl = ip.info.curl;

const cartesian = (...a) => a.reduce((a, b) => a.flatMap(d => b.map(e => [d, e].flat())));
Object.prototype.sort = function({ K = true, V = false } = {}) { const C = 0; if (C) console.warn('Object.sort()', 0, { K, V }, this);
  if (!K && !V) return structuredClone(this);
  if (       V) throw new Error(`Object.sort(${JSON.stringify({ K, V })}) not implemented`); const i = structuredClone(this);
  for (const k of Object.keys(i).sort()) { delete this[k]; this[k] = i[k]; }; if (C) console.warn('Object.sort()', 1, { K, V }, this); return this;
};
const sort = x => { try { x?.sort?.(); } catch (e) {} return x; }; // MX records cannot be sorted [{},{}]

const ZQT = new Set([ 'RDAP', 'TLD' ]);

const                                     A = new Set([ /* allowed source IPs */ ]);
serve(async (r: Request, c: ConnInfo) => { console.warn('----------------------------------------------'); console.warn(r.url, c); const ta = performance.now();
//const a = c?.remoteAddr?.hostname; if (!A.has(a)) return new Response('403 Forbidden', { status: Status.Forbidden, headers: { ...TP, ...NS, ...AO, ...HSTS } });
  ip.info = ip.info[Deno.env.get('IPINFO_TOKEN') ? 'user' : 'curl'];
  const u = new URL(r.url);
  const p = u.pathname;
  switch (p) { case '/ipinfo.io': return fetch(`https://ipinfo.io/1.1.1.1?${new URLSearchParams({ token: Deno.env.get('IPINFO_TOKEN') })}`); }
  const I = c.remoteAddr.hostname;
  const O = c. localAddr.hostname;
  const C = { IP: JS({ i: I, o: O }), "IP-X": "https://ipinfo.io", ...XH };
  const q = u.searchParams; //   _               _____________________
  const _ = JP(q.get('_')); // { _ = nameServer: { ipAddr, port = 53 } } https://deno.land/api@latest?s=Deno.ResolveDnsOptions
  const s =    q.get('s') !== null; // _={"nameServer":{"ipAddr":"1x.rtedge.net"}}
  const i =    q.get('i') ===   ''; [ '_', 's', 'i' ].forEach(x => q.delete(x));
  const f = s ? resolve : rextend;
  const                                                           X = { I, O, i: I, o: O, "": I };
  const m = (t, q) => ZQT.has(t.toUpperCase()) && q === '' ? q : (X[q] ?? q); // ←                                            ↓
  const Q = [...q.entries()].flatMap(([ T, Q ]) => cartesian(T.split(','), Q.split(',')).map(([ t, q ]) => [ t.toUpperCase(), m(t, q) ])).map(([ t, q ]) => [ t === 'X' ? 'PTR' : t, t === 'X' ? ip.ptr(q) : q ]); console.warn(Q, { i, _ });
  if   (Q.length === 0) return Response.redirect('https://apple.com', 308); // obfuscation
  if   (i)      return new Response(JS(Q, '', '  '), { headers: { _: JS(_), ...C, ...AJ, ...NS, ...AO, ...HSTS } });
  try {
    const R = await Promise.all(
      Q.map(async ([ t, q ]) => {
        const                       T = F[t] ?? F.DENO;
        const                   f = T    [s ? 0 : 1];
        return [ t, [ q, await (f ?? resolve)(t, q, _ ?? {}).then(o => ZQT.has(t) && q === '' ? o : sort(o)) ] ];
      })
    );
    const O = R.reduce((x, [ t, [ q, r ]]) => (x[t] !== undefined ? (x[t][q] = r) : (x[t] = { [q]: r }), x), {}); 
    C.dur = performance.now() - ta; 
    C['server-timing'] = `total;dur=${C.dur}`;
    /**/        return new Response(JS(O, '', '  '), { headers: { _: JS(_), ...C, ...AJ, ...NS, ...AO, ...HSTS } });
  } catch (e) { return new Response(   e.stack,      { headers: { _: JS(_), ...C, ...TP, ...NS, ...AO, ...HSTS } }); 
  }

});