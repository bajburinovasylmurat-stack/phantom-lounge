// Phantom Lounge hall schemes with tables (A / B / C sectors), shared by browser and server.
// Coordinates are in the 1932x1932 frame of the venue's own seating plan image.
// Each table: [centerX, centerY, rotationDeg, leftTop, leftBottom, rightTop, rightBottom]
(function (root) {
  const A_FRONT = [ // diagonal tables by the stage, A 1-20
    [192, 1345, -49, 18, 17, 20, 19], [407, 1377, -49, 14, 13, 16, 15],
    [260, 1515, -49, 10, 9, 12, 11], [527, 1514, -49, 6, 5, 8, 7],
    [377, 1654, -49, 2, 1, 4, 3]
  ];
  const A_BACK = [ // A 21-56
    [297, 385, 0, 51, 49, 52, 50], [508, 385, 0, 55, 53, 56, 54],
    [315, 571, 0, 47, 45, 48, 46],
    [315, 761, 0, 39, 37, 40, 38], [526, 761, 0, 43, 41, 44, 42],
    [315, 957, 0, 31, 29, 32, 30], [526, 957, 0, 35, 33, 36, 34],
    [315, 1146, 0, 23, 21, 24, 22], [526, 1146, 0, 27, 25, 28, 26]
  ];
  const B_ALL = [ // B 1-84
    [738, 305, 0, 74, 73, 76, 75], [967, 305, 0, 78, 77, 80, 79], [1197, 305, 0, 83, 81, 84, 82],
    [738, 501, 0, 62, 61, 64, 63], [967, 501, 0, 66, 65, 68, 67], [1197, 501, 0, 70, 69, 72, 71],
    [738, 691, 0, 50, 49, 52, 51], [967, 691, 0, 54, 53, 56, 55], [1197, 691, 0, 58, 57, 60, 59],
    [738, 880, 0, 38, 37, 40, 39], [967, 880, 0, 42, 41, 44, 43], [1197, 880, 0, 46, 45, 48, 47],
    [738, 1077, 0, 26, 25, 28, 27], [967, 1077, 0, 30, 29, 32, 31], [1197, 1077, 0, 34, 33, 36, 35],
    [738, 1266, 0, 15, 13, 16, 14], [967, 1266, 0, 18, 17, 20, 19], [1197, 1266, 0, 22, 21, 24, 23],
    [738, 1462, 0, 2, 1, 4, 3], [967, 1462, 0, 6, 5, 8, 7], [1197, 1462, 0, 10, 9, 12, 11]
  ];
  const C_FRONT = [ // diagonal tables by the stage, C 1-24
    [1418, 1484, 45, 2, 1, 4, 3], [1555, 1630, 45, 6, 5, 8, 7],
    [1555, 1367, 45, 10, 9, 12, 11], [1693, 1515, 45, 14, 13, 16, 15],
    [1653, 1227, 32, 18, 17, 20, 19], [1822, 1340, 32, 22, 21, 24, 23]
  ];
  const C_BACK = [ // C 25-68
    [1648, 1061, 9, 30, 29, 32, 31], [1845, 1098, 9, 34, 33, 36, 35],
    [1583, 408, 0, 62, 61, 64, 63], [1812, 408, 0, 66, 65, 68, 67],
    [1580, 571, 0, 54, 53, 56, 55], [1810, 571, 0, 59, 57, 60, 58],
    [1416, 761, 0, 46, 45, 48, 47], [1663, 736, 0, 50, 49, 52, 51],
    [1663, 900, 0, 42, 41, 44, 43], [1416, 957, 0, 38, 37, 40, 39],
    [1416, 1146, 0, 26, 25, 28, 27]
  ];

  function tables(sector, list) {
    return list.map(([x, y, a, lt, lb, rt, rb]) => ({ sector, x, y, a, seats: { lt, lb, rt, rb } }));
  }

  const HALL_LAYOUTS = {
    hall208: {
      label: 'Үстелді зал 208 орын',
      tables: [...tables('A', A_FRONT), ...tables('A', A_BACK), ...tables('B', B_ALL), ...tables('C', C_FRONT), ...tables('C', C_BACK)]
    },
    hall128: {
      label: 'Шағын үстелді зал 128 орын',
      tables: [...tables('A', A_FRONT), ...tables('B', B_ALL), ...tables('C', C_FRONT)]
    }
  };

  // Seat ids like "A12", ordered sector by sector, number ascending
  function hallSeatIds(layout) {
    const hall = HALL_LAYOUTS[layout];
    if (!hall) return null;
    const ids = [];
    hall.tables.forEach(t => Object.values(t.seats).forEach(n => ids.push({ sector: t.sector, n })));
    const order = { A: 0, B: 1, C: 2 };
    ids.sort((p, q) => order[p.sector] - order[q.sector] || p.n - q.n);
    return ids.map(s => s.sector + s.n);
  }

  function isHallLayout(layout) { return !!HALL_LAYOUTS[layout]; }

  function splitSeatId(id) {
    const m = /^([A-Z])(\d+)$/.exec(String(id));
    return m ? { sector: m[1], n: Number(m[2]) } : { sector: '', n: Number(id) };
  }

  function seatLabel(id) {
    const s = splitSeatId(id);
    return s.sector ? `${s.sector}-${s.n}` : String(id);
  }

  const CYR = { 'А': 'A', 'В': 'B', 'С': 'C' };
  // Lines like "1-20: 20000", "A: 15000", "B 1-24: 20000", "С секторы: 8000"
  function parsePriceRules(text) {
    const rules = [];
    String(text || '').split(/\n|;/).forEach(line => {
      let clean = line.trim();
      if (!clean) return;
      let sector = '';
      const sm = clean.match(/^([ABCАВС])(?![0-9A-Za-zА-Яа-яЁёӘәҒғҚқҢңӨөҰұҮүҺһІі])\s*(?:сектор[а-яәіңғүұқөһ]*)?\s*/i);
      if (sm) {
        const letter = sm[1].toUpperCase();
        sector = CYR[letter] || letter;
        clean = clean.slice(sm[0].length);
      }
      const colon = clean.search(/[:=]/);
      const left = colon >= 0 ? clean.slice(0, colon) : clean;
      const right = colon >= 0 ? clean.slice(colon + 1) : '';
      let range = left.match(/(\d+)\s*[-–—]\s*(\d+)/);
      let price = null;
      if (right) {
        const pm = right.match(/\d[\d\s]*/);
        if (pm) price = Number(pm[0].replace(/\s/g, ''));
        if (!range) { const one = left.match(/\b(\d+)\b/); if (one) range = [one[0], one[1], one[1]]; }
      } else if (range) {
        const rest = left.slice(range.index + range[0].length).replace(/\D/g, '');
        if (rest) price = Number(rest);
      } else if (sector) {
        const digits = left.replace(/\D/g, '');
        if (digits) price = Number(digits);
      }
      if (!price) return;
      if (!range) {
        if (!sector) return;
        rules.push({ sector, start: 1, end: 100000, price });
        return;
      }
      const start = Number(range[1]);
      const end = Number(range[2] || range[1]);
      if (start && end) rules.push({ sector, start: Math.min(start, end), end: Math.max(start, end), price });
    });
    return rules;
  }

  function priceForSeatId(id, basePrice, priceRules) {
    const s = splitSeatId(id);
    const rule = parsePriceRules(priceRules).find(r => (!r.sector || r.sector === s.sector) && s.n >= r.start && s.n <= r.end);
    return rule ? rule.price : Number(basePrice || 0);
  }

  function priceRuleText(r) {
    const range = r.end >= 100000 ? '' : (r.start === r.end ? String(r.start) : `${r.start}-${r.end}`);
    return r.sector ? `${r.sector} сектор${range ? ' ' + range : ''}` : range;
  }

  const api = { HALL_LAYOUTS, hallSeatIds, isHallLayout, splitSeatId, seatLabel, parsePriceRules, priceForSeatId, priceRuleText };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.PhantomHalls = api;
})(typeof window !== 'undefined' ? window : globalThis);
