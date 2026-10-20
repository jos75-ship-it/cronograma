/* liturgia.js — Evangelho e Santo do dia segundo o Missal Romano de 1962.
   Motor do Próprio do Tempo (a partir da Páscoa) + Santoral do calendário de 1962.
   Expõe window.Liturgia = { dia(date), textoEvangelho(biblia, citacao) } */
(function(root){
"use strict";
/* ============================================================
   MAPA DE LIVROS (abreviação -> nome exato usado no biblia.json)
   ============================================================ */
const BOOK_MAP = {
  'Mt': 'Evangelho segundo S. Mateus',
  'Mc': 'Evangelho segundo S. Marcos',
  'Lc': 'Evangelho segundo S. Lucas',
  'Jo': 'Evangelho segundo S. João'
};

/* ============================================================
   DADOS DO CICLO TEMPORAL (Próprio do Tempo)
   Cada semana: [Domingo, Segunda, Terça, Quarta, Quinta, Sexta, Sábado]
   ============================================================ */
const WD = ["Domingo","Segunda-feira","Terça-feira","Quarta-feira","Quinta-feira","Sexta-feira","Sábado"];

const ADVENT_WEEKS = [
  ["Lc 21,25-33","Lc 21,25-33","Lc 21,25-33","Lc 21,25-33","Lc 21,25-33","Lc 21,25-33","Lc 21,25-33"],
  ["Mt 11,2-10","Mt 11,2-10","Mt 11,2-10","Mt 11,2-10","Mt 11,2-10","Mt 11,2-10","Mt 11,2-10"],
  ["Jo 1,19-28","Jo 1,19-28","Jo 1,19-28","Lc 1,26-38","Jo 1,19-28","Lc 1,39-47","Lc 3,1-6"],
  ["Lc 3,1-6","Lc 3,1-6","Lc 3,1-6","Lc 3,1-6","Lc 3,1-6","Lc 3,1-6","Lc 3,1-6"]
];
const ADVENT_LABELS = ["I Domingo do Advento","II Domingo do Advento","III Domingo do Advento — Gaudete","IV Domingo do Advento"];

// datas fixas: "MM-DD" -> {label, cit}
const CHRISTMAS_FIXED = {
  "12-24": ["Vigília do Natal", "Mt 1,18-21"],
  "12-25": ["Natal do Senhor", "Jo 1,1-14"],
  "12-26": ["Santo Estêvão, Protomártir", "Mt 23,34-39"],
  "12-27": ["São João Evangelista", "Jo 21,19-24"],
  "12-28": ["Santos Inocentes", "Mt 2,13-18"],
  "12-29": ["Féria na Oitava do Natal", "Lc 2,15-20"],
  "12-30": ["Féria na Oitava do Natal", "Lc 2,15-20"],
  "12-31": ["Féria na Oitava do Natal", "Lc 2,15-20"],
  "01-01": ["Circuncisão do Senhor", "Lc 2,21"],
  "01-02": ["Santíssimo Nome de Jesus", "Lc 2,21"],
  "01-03": ["Féria depois do Ano Novo", "Lc 2,21"],
  "01-04": ["Féria depois do Ano Novo", "Lc 2,21"],
  "01-05": ["Féria depois do Ano Novo", "Lc 2,21"],
  "01-06": ["Epifania do Senhor", "Mt 2,1-12"],
  "01-13": ["Comemoração do Batismo do Senhor", "Jo 1,29-34"]
};
const SUNDAY_IN_OCTAVE = ["Domingo na Oitava do Natal", "Lc 2,33-40"];
const HOLY_FAMILY = ["I Domingo depois da Epifania — Sagrada Família", "Lc 2,42-52"];

const EPIPHANY_SUNDAYS = [ // II..VI
  ["2º Domingo depois da Epifania", "Jo 2,1-11"],
  ["3º Domingo depois da Epifania", "Mt 8,1-13"],
  ["4º Domingo depois da Epifania", "Mt 8,23-27"],
  ["5º Domingo depois da Epifania", "Mt 13,24-30"],
  ["6º Domingo depois da Epifania", "Mt 13,31-35"]
];
const RESUMED_EPIPHANY = [ // III..VI retomado
  ["III Domingo depois da Epifania (retomado)", "Mt 8,1-13"],
  ["IV Domingo depois da Epifania (retomado)", "Mt 8,23-27"],
  ["V Domingo depois da Epifania (retomado)", "Mt 13,24-30"],
  ["VI Domingo depois da Epifania (retomado)", "Mt 13,31-35"]
];

const SEPTUAGESIMA = ["Domingo da Septuagésima", "Mt 20,1-16"];
const SEXAGESIMA   = ["Domingo da Sexagésima", "Lc 8,4-15"];
const QUINQUAGESIMA= ["Domingo da Quinquagésima", "Lc 18,31-43"];

const ASH_WEEK = { // offsets from Ash Wednesday (0=Wed..3=Sat)
  0: ["Quarta-feira de Cinzas", "Mt 6,16-21"],
  1: ["Quinta-feira depois das Cinzas", "Mt 8,5-13"],
  2: ["Sexta-feira depois das Cinzas", "Mt 5,43\u201316,4".replace("16,4","6,4")],
  3: ["Sábado depois das Cinzas", "Mc 6,47-56"]
};
// fix citation string with proper en-dash cross-chapter form
ASH_WEEK[2] = ["Sexta-feira depois das Cinzas", "Mt 5,43\u20136,4"];

const LENT_WEEKS = [
  ["Mt 4,1-11","Mt 25,31-46","Mt 21,10-17","Mt 12,38-50","Mt 15,21-28","Jo 5,1-15","Mt 17,1-9"],
  ["Mt 17,1-9","Jo 8,21-29","Mt 23,1-12","Mt 20,17-28","Lc 16,19-31","Mt 21,33-46","Lc 15,11-32"],
  ["Lc 11,14-28","Lc 4,23-30","Mt 18,15-22","Mt 15,1-20","Lc 4,38-44","Jo 4,5-42","Jo 8,1-11"],
  ["Jo 6,1-15","Jo 2,13-25","Jo 7,14-31","Jo 9,1-38","Lc 7,11-16","Jo 11,1-45","Jo 8,12-20"]
];
const LENT_LABELS = ["I Domingo da Quaresma","II Domingo da Quaresma","III Domingo da Quaresma","IV Domingo da Quaresma — Laetare"];

const PASSION_WEEK = ["Jo 8,46-59","Jo 7,32-39","Jo 7,1-13","Jo 10,22-38","Lc 7,36-50","Jo 11,47-54","Jo 12,10-36"];
const PASSION_LABEL = "Domingo da Paixão";

const HOLY_WEEK_LABELS = ["Domingo de Ramos","Segunda-feira Santa","Terça-feira Santa — Paixão","Quarta-feira Santa — Paixão","Quinta-feira Santa — Missa da Ceia do Senhor","Sexta-feira Santa — Paixão do Senhor","Sábado Santo — Vigília Pascal"];
const HOLY_WEEK = ["Mt 26,36\u201327,66","Jo 12,1-9","Mc 14,32\u201315,46","Lc 22,39\u201323,53","Jo 13,1-15","Jo 18,1\u201319,42","Mt 28,1-7"];

const EASTER_OCTAVE_LABELS = ["Domingo da Ressurreição","Segunda-feira na Oitava da Páscoa","Terça-feira na Oitava da Páscoa","Quarta-feira na Oitava da Páscoa","Quinta-feira na Oitava da Páscoa","Sexta-feira na Oitava da Páscoa","Sábado in albis, na Oitava da Páscoa"];
const EASTER_OCTAVE = ["Mc 16,1-7","Lc 24,13-35","Lc 24,36-47","Jo 21,1-14","Jo 20,11-18","Mt 28,16-20","Jo 20,1-9"];

const EASTER_WEEKS = [ // 2..5 (all ferias = sunday citation)
  { label: "Domingo in albis / Domingo da Oitava da Páscoa", cit: "Jo 20,19-31" },
  { label: "II Domingo depois da Páscoa — Bom Pastor", cit: "Jo 10,11-16" },
  { label: "III Domingo depois da Páscoa", cit: "Jo 16,16-22" },
  { label: "IV Domingo depois da Páscoa", cit: "Jo 16,5-14" }
];

// week starting at V Domingo depois da Páscoa (special weekdays)
const V_EASTER_WEEK_LABELS = ["V Domingo depois da Páscoa","Segunda-feira","Terça-feira","Quarta-feira — Vigília da Ascensão","Quinta-feira — Ascensão do Senhor","Sexta-feira depois da Ascensão","Sábado depois da Ascensão"];
const V_EASTER_WEEK = ["Jo 16,23-30","Jo 16,23-30","Jo 16,23-30","Jo 17,1-11","Mc 16,14-20","Mc 16,14-20","Mc 16,14-20"];

const ASCENSION_WEEK_LABELS = ["Domingo depois da Ascensão","Segunda-feira","Terça-feira","Quarta-feira","Quinta-feira","Sexta-feira","Sábado — Vigília de Pentecostes"];
const ASCENSION_WEEK = ["Jo 15,26\u201316,4","Jo 15,26\u201316,4","Jo 15,26\u201316,4","Jo 15,26\u201316,4","Jo 15,26\u201316,4","Jo 15,26\u201316,4","Jo 14,15-21"];

const PENTECOST_WEEK_LABELS = ["Domingo de Pentecostes","Segunda-feira na Oitava de Pentecostes","Terça-feira na Oitava de Pentecostes","Quarta-feira das Têmporas de Pentecostes","Quinta-feira na Oitava de Pentecostes","Sexta-feira das Têmporas de Pentecostes","Sábado das Têmporas de Pentecostes"];
const PENTECOST_WEEK = ["Jo 14,23-31","Jo 3,16-21","Jo 10,1-10","Jo 6,44-52","Lc 9,1-6","Lc 5,17-26","Lc 4,38-44"];

const TRINITY_WEEK_LABELS = ["Domingo da Santíssima Trindade","Segunda-feira depois da Santíssima Trindade","Terça-feira depois da Santíssima Trindade","Quarta-feira depois da Santíssima Trindade","Quinta-feira — Corpus Christi","Sexta-feira depois da Santíssima Trindade","Sábado depois da Santíssima Trindade"];
const TRINITY_WEEK = ["Mt 28,18-20","Lc 6,36-42","Lc 6,36-42","Lc 6,36-42","Jo 6,56-59","Lc 6,36-42","Lc 6,36-42"];

// Sundays II..XXIV depois de Pentecostes (index 0 = II)
const PENTECOST_SUNDAYS = [
  "Lc 14,16-24","Lc 15,1-10","Lc 5,1-11","Mt 5,20-24","Mc 8,1-9","Mt 7,15-21","Lc 16,1-9",
  "Lc 19,41-47","Lc 18,9-14","Mc 7,31-37","Lc 10,23-37","Lc 17,11-19","Mt 6,24-33","Lc 7,11-16",
  "Lc 14,1-11","Mt 22,34-46","Mt 9,1-8","Mt 22,1-14","Jo 4,46-53","Mt 18,23-35","Mt 22,15-21",
  "Mt 9,18-26","Mt 24,15-35"
];
const PENTECOST_SUNDAY_LABELS = [
  "2º","3º","4º","5º","6º","7º","8º","9º","10º","11º","12º","13º","14º","15º","16º","17º","18º","19º","20º","21º","22º","23º","24º e último"
];
const SACRED_HEART = ["Sagrado Coração de Jesus", "Jo 19,31-37"]; // sexta depois do 2º domingo
const CHRIST_KING = ["Nosso Senhor Jesus Cristo Rei", "Jo 18,33-37"];
const SEPT_EMBER = { // offsets from 3rd sunday of september: 3=wed,5=fri,6=sat
  3: ["Quarta-feira das Têmporas de setembro", "Mc 9,16-28"],
  5: ["Sexta-feira das Têmporas de setembro", "Lc 7,36-50"],
  6: ["Sábado das Têmporas de setembro", "Lc 13,6-17"]
};

/* ============================================================
   SANTORAL FIXO (fora do intervalo 24/dez–13/jan, já coberto acima)
   "alta precedência" pode substituir até um domingo de tempo comum
   ============================================================ */
function sanctoralFor(year){
  const isLeap = (year%4===0 && (year%100!==0 || year%400===0));
  const s = {
    "01-25": ["Conversão de São Paulo", "Mt 19,27-29"],
    "02-02": ["Purificação da B. V. Maria — Candelária", "Lc 2,22-32"],
    "02-22": ["Cátedra de São Pedro", "Mt 16,13-19"],
    [isLeap ? "02-25" : "02-24"]: ["São Matias Apóstolo", "Mt 11,25-30"],
    "03-19": ["São José, Esposo da B. V. Maria", "Mt 1,18-21", true],
    "03-25": ["Anunciação da B. V. Maria", "Lc 1,26-38", true],
    "04-25": ["São Marcos Evangelista", "Lc 10,1-9"],
    "05-01": ["São José Operário", "Mt 13,54-58"],
    "05-11": ["Santos Filipe e Tiago Apóstolos", "Jo 14,1-13"],
    "05-31": ["B. V. Maria Rainha", "Lc 1,26-33"],
    "06-23": ["Vigília da Natividade de São João Batista", "Lc 1,5-17"],
    "06-24": ["Natividade de São João Batista", "Lc 1,57-68"],
    "06-28": ["Vigília dos Santos Pedro e Paulo", "Jo 21,15-19"],
    "06-29": ["Santos Pedro e Paulo Apóstolos", "Mt 16,13-19"],
    "07-01": ["Preciosíssimo Sangue de Nosso Senhor Jesus Cristo", "Jo 19,30-35"],
    "07-02": ["Visitação da B. V. Maria", "Lc 1,39-47"],
    "07-25": ["São Tiago Apóstolo", "Mt 20,20-23"],
    "07-26": ["Santa Ana", "Mt 13,44-52"],
    "08-06": ["Transfiguração de Nosso Senhor Jesus Cristo", "Mt 17,1-9"],
    "08-10": ["São Lourenço Mártir", "Jo 12,24-26"],
    "08-14": ["Vigília da Assunção", "Lc 11,27-28"],
    "08-15": ["Assunção da B. V. Maria", "Lc 1,41-50", true],
    "08-24": ["São Bartolomeu Apóstolo", "Lc 6,12-19"],
    "09-08": ["Natividade da B. V. Maria", "Mt 1,1-16"],
    "09-14": ["Exaltação da Santa Cruz", "Jo 12,31-36"],
    "09-15": ["Sete Dores da B. V. Maria", "Jo 19,25-27"],
    "09-21": ["São Mateus Apóstolo e Evangelista", "Mt 9,9-13"],
    "09-29": ["Dedicação de São Miguel Arcanjo", "Mt 18,1-10"],
    "10-02": ["Santos Anjos da Guarda", "Mt 18,1-10"],
    "10-07": ["Nossa Senhora do Santíssimo Rosário", "Lc 1,26-38"],
    "10-11": ["Maternidade da B. V. Maria", "Lc 2,43-51"],
    "10-18": ["São Lucas Evangelista", "Lc 10,1-9"],
    "10-28": ["Santos Simão e Judas Apóstolos", "Jo 15,17-25"],
    "11-01": ["Todos os Santos", "Mt 5,1-12", true],
    "11-02": ["Comemoração de Todos os Fiéis Defuntos", "Jo 5,25-29"],
    "11-09": ["Dedicação da Arquibasílica do Santíssimo Salvador", "Lc 19,1-10"],
    "11-30": ["Santo André Apóstolo", "Mt 4,18-22"],
    "12-08": ["Imaculada Conceição da B. V. Maria", "Lc 1,26-38", true],
    "12-21": ["São Tomé Apóstolo", "Jo 20,24-29"]
  };
  return s;
}

/* ============================================================
   CÁLCULO DE PÁSCOA (algoritmo de Meeus/Jones/Butcher, gregoriano)
   ============================================================ */
function computeEaster(year){
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19*a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2*e + 2*i - h - k) % 7;
  const m = Math.floor((a + 11*h + 22*l) / 451);
  const month = Math.floor((h + l - 7*m + 114) / 31);
  const day = ((h + l - 7*m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function addDays(date, n){
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}
function ymd(d){ return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,'0')+"-"+String(d.getDate()).padStart(2,'0'); }
function mmdd(d){ return String(d.getMonth()+1).padStart(2,'0')+"-"+String(d.getDate()).padStart(2,'0'); }
function sameDate(a,b){ return ymd(a)===ymd(b); }

// most recent Sunday on/before d
function sundayOnOrBefore(d){
  return addDays(d, -d.getDay());
}
// first Sunday strictly after d
function sundayStrictlyAfter(d){
  const days = 7 - d.getDay();
  return addDays(d, days === 7 ? 7 : days || 7);
}

/* ============================================================
   MONTA O MAPA LITÚRGICO DE UM "ANO LITÚRGICO" (Advento -> Advento)
   que cobre o ano civil `year`, retornando função lookup(date)
   ============================================================ */
function buildLiturgicalYear(civilYear, semSantoral){
  // ancoras baseadas no Natal DESTE ano civil e no anterior, para cobrir jan-dez corretamente
  function adventStartFor(christmasYear){
    const dec25 = new Date(christmasYear, 11, 25);
    const advent4 = sundayOnOrBefore(addDays(dec25, -1)); // last sunday on/before dec24
    return addDays(advent4, -21);
  }

  const map = {}; // "YYYY-MM-DD" -> {label, cit, highPrec:bool}

  function set(date, label, cit, highPrec){
    map[ymd(date)] = { label, cit, highPrec: !!highPrec };
  }

  // processa dois "ciclos" (o que começa no advento do ano anterior, e o deste ano)
  // para garantir cobertura completa de jan-dez do civilYear
  [civilYear-1, civilYear].forEach(chYear => {
    const easter = computeEaster(chYear+1); // Easter falls in the year AFTER Advent begins
    const advent1 = adventStartFor(chYear);

    // ADVENTO
    for (let w=0; w<4; w++){
      const sunday = addDays(advent1, w*7);
      for (let d=0; d<7; d++){
        set(addDays(sunday,d), d===0?ADVENT_LABELS[w]:(WD[d]+" — "+ADVENT_LABELS[w]), ADVENT_WEEKS[w][d]);
      }
    }

    // NATAL FIXO (24 dez ano chYear -> 13 jan chYear+1)
    Object.keys(CHRISTMAS_FIXED).forEach(md => {
      const [mm,dd] = md.split("-").map(Number);
      const y = (mm===12) ? chYear : chYear+1;
      const date = new Date(y, mm-1, dd);
      set(date, CHRISTMAS_FIXED[md][0], CHRISTMAS_FIXED[md][1]);
    });
    // Domingo na oitava (apenas 29,30,31 dez podem ser sobrescritos)
    [29,30,31].forEach(dd=>{
      const date = new Date(chYear,11,dd);
      if (date.getDay()===0) set(date, SUNDAY_IN_OCTAVE[0], SUNDAY_IN_OCTAVE[1]);
    });

    // EPIFANIA -> ANTES DO I DOMINGO
    const epiphany = new Date(chYear+1, 0, 6);
    const holyFamilySunday = sundayStrictlyAfter(epiphany);
    for (let d = addDays(epiphany,1); d < holyFamilySunday; d = addDays(d,1)){
      if (!map[ymd(d)]) set(d, "Féria antes do I Domingo depois da Epifania", "Mt 2,1-12");
    }
    // I domingo (sagrada familia) + suas ferias ate o proximo domingo
    set(holyFamilySunday, HOLY_FAMILY[0], HOLY_FAMILY[1]);
    for (let d=1; d<7; d++){
      const dt = addDays(holyFamilySunday,d);
      if (!map[ymd(dt)]) set(dt, WD[d]+" — "+HOLY_FAMILY[0], HOLY_FAMILY[1]);
    }

    // SEPTUAGESIMA E ANTERIORES
    const septuagesima = addDays(easter, -63);
    const sexagesima = addDays(easter, -56);
    const quinquagesima = addDays(easter, -49);
    const ashWednesday = addDays(easter, -46);

    // domingos II..VI depois da epifania (apenas os que cabem antes da septuagesima)
    let epUsed = 0;
    for (let k=0; k<5; k++){ // II..VI
      const sunday = addDays(holyFamilySunday, 7*(k+1));
      if (sunday.getTime() >= septuagesima.getTime()) break;
      epUsed = k+1;
      const [label,cit] = EPIPHANY_SUNDAYS[k];
      set(sunday, label, cit);
      for (let d=1; d<7; d++){
        const dt = addDays(sunday,d);
        const nextBoundary = addDays(sunday,7);
        if (dt.getTime() < Math.min(septuagesima.getTime(), nextBoundary.getTime()))
          if (!map[ymd(dt)]) set(dt, WD[d]+" — "+label, cit);
      }
    }

    set(septuagesima, SEPTUAGESIMA[0], SEPTUAGESIMA[1]);
    for (let d=1; d<7; d++) set(addDays(septuagesima,d), WD[d]+" — "+SEPTUAGESIMA[0], SEPTUAGESIMA[1]);
    set(sexagesima, SEXAGESIMA[0], SEXAGESIMA[1]);
    for (let d=1; d<7; d++) set(addDays(sexagesima,d), WD[d]+" — "+SEXAGESIMA[0], SEXAGESIMA[1]);
    set(quinquagesima, QUINQUAGESIMA[0], QUINQUAGESIMA[1]);
    set(addDays(quinquagesima,1), "Segunda-feira — "+QUINQUAGESIMA[0], QUINQUAGESIMA[1]);
    set(addDays(quinquagesima,2), "Terça-feira — "+QUINQUAGESIMA[0], QUINQUAGESIMA[1]);

    // QUARESMA
    for (let i=0;i<4;i++) set(addDays(ashWednesday,i), ASH_WEEK[i][0], ASH_WEEK[i][1]);
    for (let w=0; w<4; w++){
      const sunday = addDays(easter, -42 + w*7);
      for (let d=0; d<7; d++){
        const lbl = d===0 ? LENT_LABELS[w] : (WD[d]+" da "+(w+1)+"ª semana da Quaresma");
        set(addDays(sunday,d), lbl, LENT_WEEKS[w][d]);
      }
    }

    // PAIXAO
    const passionSunday = addDays(easter,-14);
    for (let d=0; d<7; d++){
      const lbl = d===0 ? PASSION_LABEL : (WD[d]+" da Semana da Paixão");
      set(addDays(passionSunday,d), lbl, PASSION_WEEK[d]);
    }

    // SEMANA SANTA
    const palmSunday = addDays(easter,-7);
    for (let d=0; d<7; d++) set(addDays(palmSunday,d), HOLY_WEEK_LABELS[d], HOLY_WEEK[d]);

    // OITAVA DA PASCOA
    for (let d=0; d<7; d++) set(addDays(easter,d), EASTER_OCTAVE_LABELS[d], EASTER_OCTAVE[d]);

    // DOMINGOS II-V DEPOIS DA PASCOA (semanas inteiras)
    EASTER_WEEKS.forEach((info,idx)=>{
      const sunday = addDays(easter, 7*(idx+1));
      for (let d=0; d<7; d++){
        const lbl = d===0 ? info.label : (WD[d]+" — "+info.label);
        set(addDays(sunday,d), lbl, info.cit);
      }
    });

    // V DOMINGO DEPOIS DA PASCOA ATE VESPERA DA ASCENSAO
    const vEasterSunday = addDays(easter, 35);
    for (let d=0; d<7; d++) set(addDays(vEasterSunday,d), V_EASTER_WEEK_LABELS[d], V_EASTER_WEEK[d]);

    // DOMINGO DEPOIS DA ASCENSAO
    const ascensionSunday = addDays(easter, 42);
    for (let d=0; d<7; d++) set(addDays(ascensionSunday,d), ASCENSION_WEEK_LABELS[d], ASCENSION_WEEK[d]);

    // PENTECOSTES
    const pentecost = addDays(easter,49);
    for (let d=0; d<7; d++) set(addDays(pentecost,d), PENTECOST_WEEK_LABELS[d], PENTECOST_WEEK[d]);

    // TRINDADE
    const trinity = addDays(easter,56);
    for (let d=0; d<7; d++) set(addDays(trinity,d), TRINITY_WEEK_LABELS[d], TRINITY_WEEK[d]);
    // sagrado coracao (sexta depois do 2 domingo) sobrescrito depois

    // TEMPO DEPOIS DE PENTECOSTES
    const advent1Next = adventStartFor(chYear+1);
    const lastSunday = addDays(advent1Next, -7);
    const totalWeeks = Math.round((lastSunday - trinity)/(7*86400000)); // posicoes: trinity=0
    // sundays numeradas II..N ficam nas posicoes 1..totalWeeks-1; a ultima (totalWeeks) e sempre XXIV
    const numberedSlots = totalWeeks - 1; // quantidade de domingos numerados antes do ultimo
    const maxNumbered = 22; // III..XXIII normalmente cabem numerados (posicoes 1..22 => II..XXIII)
    for (let pos=1; pos<=numberedSlots; pos++){
      const sunday = addDays(trinity, pos*7);
      let label, cit;
      if (pos <= maxNumbered){
        label = PENTECOST_SUNDAY_LABELS[pos-1] + " Domingo depois de Pentecostes";
        cit = PENTECOST_SUNDAYS[pos-1];
      } else {
        // usa domingos retomados da epifania (III, IV, V, VI) que nao foram usados antes da quaresma
        const resumeIdx = pos - maxNumbered - 1; // 0=III,1=IV,2=V,3=VI
        const epIdx = epUsed + resumeIdx; // epUsed conta quantos ja foram usados (I nao conta, k comeca em II=0)
        if (epIdx>=0 && epIdx<4){
          label = RESUMED_EPIPHANY[epIdx][0];
          cit = RESUMED_EPIPHANY[epIdx][1];
        } else {
          label = "24º e último Domingo depois de Pentecostes";
          cit = PENTECOST_SUNDAYS[22];
        }
      }
      set(sunday, label, cit);
      for (let d=1; d<7; d++) if(!map[ymd(addDays(sunday,d))]) set(addDays(sunday,d), WD[d]+" — "+label, cit);
    }
    // ultimo domingo, sempre XXIV
    set(lastSunday, "24º e último Domingo depois de Pentecostes", PENTECOST_SUNDAYS[22]);
    for (let d=1; d<7; d++) if(!map[ymd(addDays(lastSunday,d))]) set(addDays(lastSunday,d), WD[d]+" — 24º e último Domingo depois de Pentecostes", PENTECOST_SUNDAYS[22]);

    // SAGRADO CORACAO (sexta depois do 2 domingo depois de pentecostes)
    const secondSunday = addDays(trinity,7);
    set(addDays(secondSunday,5), SACRED_HEART[0], SACRED_HEART[1]);

    // TEMPORAS DE SETEMBRO (semana apos o 3 domingo de setembro)
    const sept1 = new Date(chYear+1,8,1);
    const firstSundaySept = sundayOnOrBefore(sept1).getMonth()===8 ? sundayOnOrBefore(sept1) : addDays(sept1, (7-sept1.getDay())%7);
    const thirdSundaySept = addDays(firstSundaySept, 14);
    Object.keys(SEPT_EMBER).forEach(off=>{
      const dt = addDays(thirdSundaySept, Number(off));
      set(dt, SEPT_EMBER[off][0], SEPT_EMBER[off][1]);
    });

    // CRISTO REI (ultimo domingo de outubro) - sobrescreve so o domingo
    const oct31 = new Date(chYear+1,10,0); // dia 0 do mes 11 (indice 10+1=11) = 31/10
    const christKingSunday = sundayOnOrBefore(oct31);
    set(christKingSunday, CHRIST_KING[0], CHRIST_KING[1]);
  });

  if (!semSantoral)
  // SANTORAL FIXO (sobrescreve dias de semana; em domingos so se highPrec e a estacao permitir)
  [civilYear-1, civilYear, civilYear+1].forEach(y=>{
    const s = sanctoralFor(y);
    Object.keys(s).forEach(md=>{
      const [mm,dd] = md.split("-").map(Number);
      const date = new Date(y, mm-1, dd);
      const key = ymd(date);
      const entry = s[md];
      const isSunday = date.getDay()===0;
      const existing = map[key];
      if (!isSunday){
        // nao sobrescreve semana santa/oitava da pascoa/oitava de pentecostes mesmo em dia de semana,
        // exceto para as festas de alta precedencia (Sao Jose, Anunciacao, etc.)
        const protectedPeriod = existing && /Semana Santa|Oitava da Páscoa|Oitava de Pentecostes|Paixão/i.test(existing.label);
        if (!protectedPeriod || entry[2]) {
          map[key] = { label: entry[0], cit: entry[1], highPrec: !!entry[2] };
        }
      } else if (entry[2] && existing){
        // domingo: so sobrescreve se a estacao for "comum" (depois da epifania / depois de pentecostes)
        const commonSeason = /depois da Epifania|depois de Pentecostes/i.test(existing.label) && !/retomado/i.test(existing.label);
        if (commonSeason) map[key] = { label: entry[0], cit: entry[1], highPrec: true };
      }
    });
  });

  return map;
}

/* ============================================================
   BUSCA DO TEXTO NO biblia.json
   ============================================================ */
function parseCitation(cit){
  const m = cit.match(/^([A-Za-zÀ-ÿ.]+)\s+(\d+),(\d+)(?:[-\u2013](?:(\d+),)?(\d+))?$/);
  if (!m) return null;
  const book = m[1];
  const c1 = parseInt(m[2],10);
  const v1 = parseInt(m[3],10);
  const c2 = m[4] ? parseInt(m[4],10) : c1;
  const v2 = m[5] ? parseInt(m[5],10) : v1;
  return { book, c1, v1, c2, v2 };
}

function getPassageText(bibleData, cit){
  const p = parseCitation(cit);
  if (!p) return null;
  const bookName = BOOK_MAP[p.book];
  const book = bibleData.find(b => b.livro === bookName);
  if (!book) return null;
  let verses = [];
  for (let c = p.c1; c <= p.c2; c++){
    const chap = book.capitulos.find(ch => ch.capitulo === c);
    if (!chap) continue;
    const vStart = (c === p.c1) ? p.v1 : 1;
    const vEnd = (c === p.c2) ? p.v2 : Infinity;
    chap.versiculos.forEach(v => {
      if (v.numero >= vStart && v.numero <= vEnd){
        verses.push({ n: v.numero, c: c, t: v.texto, showChap: (p.c1!==p.c2) });
      }
    });
  }
  return verses;
}


/* ============================================================
   SANTORAL — Calendário Romano Geral de 1962 (rubricas de 1960)
   "MM-DD": [nome, classe, cor, comemorações, festaDoSenhor]
   classe: 1, 2, 3 = I, II, III classe; 0 = só comemoração
   cor: b=branco v=vermelho r=roxo p=preto
   ============================================================ */
const SANTORAL = {
  "01-01": ["Oitava do Natal — Circuncisão do Senhor", 1, "b"],
  "01-05": ["S. Telésforo, Papa e Mártir", 0, "v"],
  "01-06": ["Epifania do Senhor", 1, "b"],
  "01-11": ["S. Higino, Papa e Mártir", 0, "v"],
  "01-13": ["Comemoração do Batismo do Senhor", 2, "b"],
  "01-14": ["S. Hilário, Bispo, Confessor e Doutor", 3, "b", "S. Félix, Presbítero e Mártir"],
  "01-15": ["S. Paulo, Primeiro Eremita", 3, "b", "S. Mauro, Abade"],
  "01-16": ["S. Marcelo I, Papa e Mártir", 3, "v"],
  "01-17": ["S. Antão, Abade", 3, "b"],
  "01-18": ["S. Prisca, Virgem e Mártir", 0, "v"],
  "01-19": ["Ss. Mário, Marta, Audifaz e Ábaco, Mártires", 0, "v"],
  "01-20": ["Ss. Fabião, Papa, e Sebastião, Mártires", 3, "v"],
  "01-21": ["S. Inês, Virgem e Mártir", 3, "v"],
  "01-22": ["Ss. Vicente e Anastácio, Mártires", 3, "v"],
  "01-23": ["S. Raimundo de Penaforte, Confessor", 3, "b"],
  "01-24": ["S. Timóteo, Bispo e Mártir", 3, "v"],
  "01-25": ["Conversão de S. Paulo, Apóstolo", 3, "b"],
  "01-26": ["S. Policarpo, Bispo e Mártir", 3, "v"],
  "01-27": ["S. João Crisóstomo, Bispo, Confessor e Doutor", 3, "b"],
  "01-28": ["S. Pedro Nolasco, Confessor", 3, "b"],
  "01-29": ["S. Francisco de Sales, Bispo, Confessor e Doutor", 3, "b"],
  "01-30": ["S. Martina, Virgem e Mártir", 3, "v"],
  "01-31": ["S. João Bosco, Confessor", 3, "b"],

  "02-01": ["S. Inácio de Antioquia, Bispo e Mártir", 3, "v"],
  "02-02": ["Purificação da Bem-aventurada Virgem Maria", 2, "b", null, true],
  "02-03": ["S. Brás, Bispo e Mártir", 0, "v"],
  "02-04": ["S. André Corsini, Bispo e Confessor", 3, "b"],
  "02-05": ["S. Águeda, Virgem e Mártir", 3, "v"],
  "02-06": ["S. Tito, Bispo e Confessor", 3, "b", "S. Doroteia, Virgem e Mártir"],
  "02-07": ["S. Romualdo, Abade", 3, "b"],
  "02-08": ["S. João da Mata, Confessor", 3, "b"],
  "02-09": ["S. Cirilo de Alexandria, Bispo, Confessor e Doutor", 3, "b", "S. Apolônia, Virgem e Mártir"],
  "02-10": ["S. Escolástica, Virgem", 3, "b"],
  "02-11": ["Aparição da Imaculada Virgem Maria (Lourdes)", 3, "b"],
  "02-12": ["Sete Santos Fundadores dos Servitas", 3, "b"],
  "02-14": ["S. Valentim, Presbítero e Mártir", 0, "v"],
  "02-15": ["Ss. Faustino e Jovita, Mártires", 0, "v"],
  "02-18": ["S. Simeão, Bispo e Mártir", 0, "v"],
  "02-22": ["Cátedra de S. Pedro, Apóstolo", 2, "b", "S. Paulo, Apóstolo"],
  "02-23": ["S. Pedro Damião, Bispo, Confessor e Doutor", 3, "b"],
  "02-24": ["S. Matias, Apóstolo", 2, "v"],
  "02-27": ["S. Gabriel de Nossa Senhora das Dores, Confessor", 3, "b"],

  "03-04": ["S. Casimiro, Confessor", 3, "b", "S. Lúcio I, Papa e Mártir"],
  "03-06": ["Ss. Perpétua e Felicidade, Mártires", 3, "v"],
  "03-07": ["S. Tomás de Aquino, Confessor e Doutor", 3, "b"],
  "03-08": ["S. João de Deus, Confessor", 3, "b"],
  "03-09": ["S. Francisca Romana, Viúva", 3, "b"],
  "03-10": ["Santos Quarenta Mártires", 3, "v"],
  "03-12": ["S. Gregório Magno, Papa, Confessor e Doutor", 3, "b"],
  "03-17": ["S. Patrício, Bispo e Confessor", 3, "b"],
  "03-18": ["S. Cirilo de Jerusalém, Bispo, Confessor e Doutor", 3, "b"],
  "03-19": ["S. José, Esposo da Bem-aventurada Virgem Maria", 1, "b"],
  "03-21": ["S. Bento, Abade", 3, "b"],
  "03-24": ["S. Gabriel Arcanjo", 3, "b"],
  "03-25": ["Anunciação da Bem-aventurada Virgem Maria", 1, "b"],
  "03-27": ["S. João Damasceno, Confessor e Doutor", 3, "b"],
  "03-28": ["S. João de Capistrano, Confessor", 3, "b"],

  "04-02": ["S. Francisco de Paula, Confessor", 3, "b"],
  "04-04": ["S. Isidoro, Bispo, Confessor e Doutor", 3, "b"],
  "04-05": ["S. Vicente Ferrer, Confessor", 3, "b"],
  "04-11": ["S. Leão Magno, Papa, Confessor e Doutor", 3, "b"],
  "04-13": ["S. Hermenegildo, Mártir", 3, "v"],
  "04-14": ["S. Justino, Mártir", 3, "v", "Ss. Tibúrcio, Valeriano e Máximo, Mártires"],
  "04-17": ["S. Aniceto, Papa e Mártir", 0, "v"],
  "04-21": ["S. Anselmo, Bispo, Confessor e Doutor", 3, "b"],
  "04-22": ["Ss. Sotero e Caio, Papas e Mártires", 3, "v"],
  "04-23": ["S. Jorge, Mártir", 0, "v"],
  "04-24": ["S. Fidélis de Sigmaringa, Mártir", 3, "v"],
  "04-25": ["S. Marcos, Evangelista", 2, "v"],
  "04-26": ["Ss. Cleto e Marcelino, Papas e Mártires", 3, "v"],
  "04-27": ["S. Pedro Canísio, Confessor e Doutor", 3, "b"],
  "04-28": ["S. Paulo da Cruz, Confessor", 3, "b"],
  "04-29": ["S. Pedro de Verona, Mártir", 3, "v"],
  "04-30": ["S. Catarina de Sena, Virgem", 3, "b"],

  "05-01": ["S. José Operário", 1, "b"],
  "05-02": ["S. Atanásio, Bispo, Confessor e Doutor", 3, "b"],
  "05-03": ["Ss. Alexandre, Evêncio e Teódulo, Mártires, e S. Juvenal, Bispo", 0, "v"],
  "05-04": ["S. Mônica, Viúva", 3, "b"],
  "05-05": ["S. Pio V, Papa e Confessor", 3, "b"],
  "05-07": ["S. Estanislau, Bispo e Mártir", 3, "v"],
  "05-09": ["S. Gregório Nazianzeno, Bispo, Confessor e Doutor", 3, "b"],
  "05-10": ["S. Antonino, Bispo e Confessor", 3, "b", "Ss. Gordiano e Epímaco, Mártires"],
  "05-11": ["Ss. Filipe e Tiago, Apóstolos", 2, "v"],
  "05-12": ["Ss. Nereu, Aquileu, Domitila e Pancrácio, Mártires", 3, "v"],
  "05-13": ["S. Roberto Belarmino, Bispo, Confessor e Doutor", 3, "b"],
  "05-14": ["S. Bonifácio, Mártir", 0, "v"],
  "05-15": ["S. João Batista de La Salle, Confessor", 3, "b"],
  "05-16": ["S. Ubaldo, Bispo e Confessor", 3, "b"],
  "05-17": ["S. Pascoal Bailão, Confessor", 3, "b"],
  "05-18": ["S. Venâncio, Mártir", 3, "v"],
  "05-19": ["S. Pedro Celestino, Papa e Confessor", 3, "b", "S. Pudenciana, Virgem"],
  "05-20": ["S. Bernardino de Sena, Confessor", 3, "b"],
  "05-25": ["S. Gregório VII, Papa e Confessor", 3, "b", "S. Urbano I, Papa e Mártir"],
  "05-26": ["S. Filipe Néri, Confessor", 3, "b", "S. Eleutério, Papa e Mártir"],
  "05-27": ["S. Beda, o Venerável, Confessor e Doutor", 3, "b", "S. João I, Papa e Mártir"],
  "05-28": ["S. Agostinho de Cantuária, Bispo e Confessor", 3, "b"],
  "05-29": ["S. Maria Madalena de Pazzi, Virgem", 3, "b"],
  "05-30": ["S. Félix I, Papa e Mártir", 0, "v"],
  "05-31": ["Bem-aventurada Virgem Maria, Rainha", 2, "b", "S. Petronila, Virgem"],

  "06-01": ["S. Ângela Merici, Virgem", 3, "b"],
  "06-02": ["Ss. Marcelino, Pedro e Erasmo, Mártires", 0, "v"],
  "06-04": ["S. Francisco Caracciolo, Confessor", 3, "b"],
  "06-05": ["S. Bonifácio, Bispo e Mártir", 3, "v"],
  "06-06": ["S. Norberto, Bispo e Confessor", 3, "b"],
  "06-09": ["Ss. Primo e Feliciano, Mártires", 0, "v"],
  "06-10": ["S. Margarida, Rainha e Viúva", 3, "b"],
  "06-11": ["S. Barnabé, Apóstolo", 3, "v"],
  "06-12": ["S. João de São Facundo, Confessor", 3, "b", "Ss. Basílides, Cirino, Nabor e Nazário, Mártires"],
  "06-13": ["S. Antônio de Pádua, Confessor e Doutor", 3, "b"],
  "06-14": ["S. Basílio Magno, Bispo, Confessor e Doutor", 3, "b"],
  "06-15": ["Ss. Vito, Modesto e Crescência, Mártires", 0, "v"],
  "06-17": ["S. Gregório Barbarigo, Bispo e Confessor", 3, "b"],
  "06-18": ["S. Efrém, Diácono, Confessor e Doutor", 3, "b", "Ss. Marcos e Marceliano, Mártires"],
  "06-19": ["S. Juliana Falconieri, Virgem", 3, "b", "Ss. Gervásio e Protásio, Mártires"],
  "06-20": ["S. Silvério, Papa e Mártir", 0, "v"],
  "06-21": ["S. Luís Gonzaga, Confessor", 3, "b"],
  "06-22": ["S. Paulino, Bispo e Confessor", 3, "b"],
  "06-23": ["Vigília da Natividade de S. João Batista", 2, "r"],
  "06-24": ["Natividade de S. João Batista", 1, "b"],
  "06-25": ["S. Guilherme, Abade", 3, "b"],
  "06-26": ["Ss. João e Paulo, Mártires", 3, "v"],
  "06-28": ["Vigília dos Ss. Pedro e Paulo", 2, "r"],
  "06-29": ["Ss. Pedro e Paulo, Apóstolos", 1, "v"],
  "06-30": ["Comemoração de S. Paulo, Apóstolo", 3, "v", "S. Pedro, Apóstolo"],

  "07-01": ["Preciosíssimo Sangue de Nosso Senhor Jesus Cristo", 1, "v"],
  "07-02": ["Visitação da Bem-aventurada Virgem Maria", 2, "b", "Ss. Processo e Martiniano, Mártires"],
  "07-03": ["S. Irineu, Bispo e Mártir", 3, "v"],
  "07-05": ["S. Antônio Maria Zaccaria, Confessor", 3, "b"],
  "07-07": ["Ss. Cirilo e Metódio, Bispos e Confessores", 3, "b"],
  "07-08": ["S. Isabel de Portugal, Rainha e Viúva", 3, "b"],
  "07-10": ["Sete Santos Irmãos Mártires e Ss. Rufina e Segunda", 3, "v"],
  "07-11": ["S. Pio I, Papa e Mártir", 0, "v"],
  "07-12": ["S. João Gualberto, Abade", 3, "b", "Ss. Nabor e Félix, Mártires"],
  "07-14": ["S. Boaventura, Bispo, Confessor e Doutor", 3, "b"],
  "07-15": ["S. Henrique, Imperador e Confessor", 3, "b"],
  "07-16": ["Nossa Senhora do Carmo", 0, "b"],
  "07-17": ["S. Aleixo, Confessor", 0, "b"],
  "07-18": ["S. Camilo de Lélis, Confessor", 3, "b", "S. Sinforosa e seus sete filhos, Mártires"],
  "07-19": ["S. Vicente de Paulo, Confessor", 3, "b"],
  "07-20": ["S. Jerônimo Emiliani, Confessor", 3, "b", "S. Margarida, Virgem e Mártir"],
  "07-21": ["S. Lourenço de Bríndisi, Confessor e Doutor", 3, "b", "S. Praxedes, Virgem"],
  "07-22": ["S. Maria Madalena, Penitente", 3, "b"],
  "07-23": ["S. Apolinário, Bispo e Mártir", 3, "v", "S. Libório, Bispo e Confessor"],
  "07-24": ["S. Cristina, Virgem e Mártir", 0, "v"],
  "07-25": ["S. Tiago, Apóstolo", 2, "v", "S. Cristóvão, Mártir"],
  "07-26": ["S. Ana, Mãe da Bem-aventurada Virgem Maria", 2, "b"],
  "07-27": ["S. Pantaleão, Mártir", 0, "v"],
  "07-28": ["Ss. Nazário e Celso, Vítor I e Inocêncio I", 3, "v"],
  "07-29": ["S. Marta, Virgem", 3, "b", "Ss. Félix, Simplício, Faustino e Beatriz, Mártires"],
  "07-30": ["Ss. Abdão e Seném, Mártires", 0, "v"],
  "07-31": ["S. Inácio de Loyola, Confessor", 3, "b"],

  "08-01": ["Santos Macabeus, Mártires", 0, "v"],
  "08-02": ["S. Afonso Maria de Ligório, Bispo, Confessor e Doutor", 3, "b", "S. Estêvão I, Papa e Mártir"],
  "08-04": ["S. Domingos, Confessor", 3, "b"],
  "08-05": ["Dedicação de Nossa Senhora das Neves", 3, "b"],
  "08-06": ["Transfiguração de Nosso Senhor Jesus Cristo", 2, "b", "Ss. Sisto II, Felicíssimo e Agapito, Mártires", true],
  "08-07": ["S. Caetano, Confessor", 3, "b", "S. Donato, Bispo e Mártir"],
  "08-08": ["S. João Maria Vianney, Confessor", 3, "b", "Ss. Ciríaco, Largo e Esmaragdo, Mártires"],
  "08-09": ["Vigília de S. Lourenço", 3, "r", "S. Romano, Mártir"],
  "08-10": ["S. Lourenço, Mártir", 2, "v"],
  "08-11": ["Ss. Tibúrcio e Susana, Mártires", 0, "v"],
  "08-12": ["S. Clara, Virgem", 3, "b"],
  "08-13": ["Ss. Hipólito e Cassiano, Mártires", 0, "v"],
  "08-14": ["Vigília da Assunção", 2, "r", "S. Eusébio, Confessor"],
  "08-15": ["Assunção da Bem-aventurada Virgem Maria", 1, "b"],
  "08-16": ["S. Joaquim, Pai da Bem-aventurada Virgem Maria", 2, "b"],
  "08-17": ["S. Jacinto, Confessor", 3, "b"],
  "08-18": ["S. Agapito, Mártir", 0, "v"],
  "08-19": ["S. João Eudes, Confessor", 3, "b"],
  "08-20": ["S. Bernardo, Abade e Doutor", 3, "b"],
  "08-21": ["S. Joana Francisca de Chantal, Viúva", 3, "b"],
  "08-22": ["Imaculado Coração da Bem-aventurada Virgem Maria", 2, "b", "Ss. Timóteo e Companheiros, Mártires"],
  "08-23": ["S. Filipe Benício, Confessor", 3, "b"],
  "08-24": ["S. Bartolomeu, Apóstolo", 2, "v"],
  "08-25": ["S. Luís, Rei e Confessor", 3, "b"],
  "08-26": ["S. Zeferino, Papa e Mártir", 0, "v"],
  "08-27": ["S. José de Calasanz, Confessor", 3, "b"],
  "08-28": ["S. Agostinho, Bispo, Confessor e Doutor", 3, "b", "S. Hermes, Mártir"],
  "08-29": ["Degolação de S. João Batista", 3, "v", "S. Sabina, Mártir"],
  "08-30": ["S. Rosa de Lima, Virgem", 3, "b", "Ss. Félix e Adauto, Mártires"],
  "08-31": ["S. Raimundo Nonato, Confessor", 3, "b"],

  "09-01": ["S. Egídio, Abade", 0, "b", "Santos Doze Irmãos, Mártires"],
  "09-02": ["S. Estêvão da Hungria, Rei e Confessor", 3, "b"],
  "09-03": ["S. Pio X, Papa e Confessor", 3, "b"],
  "09-05": ["S. Lourenço Justiniano, Bispo e Confessor", 3, "b"],
  "09-08": ["Natividade da Bem-aventurada Virgem Maria", 2, "b", "S. Adriano, Mártir"],
  "09-09": ["S. Gorgônio, Mártir", 0, "v"],
  "09-10": ["S. Nicolau de Tolentino, Confessor", 3, "b"],
  "09-11": ["Ss. Proto e Jacinto, Mártires", 0, "v"],
  "09-12": ["Santíssimo Nome de Maria", 3, "b"],
  "09-14": ["Exaltação da Santa Cruz", 2, "v", null, true],
  "09-15": ["Sete Dores da Bem-aventurada Virgem Maria", 2, "b", "S. Nicomedes, Mártir"],
  "09-16": ["Ss. Cornélio, Papa, e Cipriano, Bispo, Mártires", 3, "v", "Ss. Eufêmia, Lúcia e Geminiano, Mártires"],
  "09-17": ["Impressão dos Sagrados Estigmas de S. Francisco", 0, "b"],
  "09-18": ["S. José de Cupertino, Confessor", 3, "b"],
  "09-19": ["S. Januário, Bispo, e Companheiros, Mártires", 3, "v"],
  "09-20": ["S. Eustáquio e Companheiros, Mártires", 0, "v"],
  "09-21": ["S. Mateus, Apóstolo e Evangelista", 2, "v"],
  "09-22": ["S. Tomás de Vilanova, Bispo e Confessor", 3, "b", "S. Maurício e Companheiros, Mártires"],
  "09-23": ["S. Lino, Papa e Mártir", 3, "v", "S. Tecla, Virgem e Mártir"],
  "09-24": ["Nossa Senhora das Mercês", 0, "b"],
  "09-26": ["Ss. Cipriano e Justina, Mártires", 0, "v"],
  "09-27": ["Ss. Cosme e Damião, Mártires", 3, "v"],
  "09-28": ["S. Venceslau, Duque e Mártir", 3, "v"],
  "09-29": ["Dedicação de S. Miguel Arcanjo", 1, "b"],
  "09-30": ["S. Jerônimo, Presbítero, Confessor e Doutor", 3, "b"],

  "10-01": ["S. Remígio, Bispo e Confessor", 0, "b"],
  "10-02": ["Santos Anjos da Guarda", 3, "b"],
  "10-03": ["S. Teresinha do Menino Jesus, Virgem", 3, "b"],
  "10-04": ["S. Francisco de Assis, Confessor", 3, "b"],
  "10-05": ["S. Plácido e Companheiros, Mártires", 0, "v"],
  "10-06": ["S. Bruno, Confessor", 3, "b"],
  "10-07": ["Nossa Senhora do Rosário", 2, "b", "S. Marcos, Papa e Confessor"],
  "10-08": ["S. Brígida, Viúva", 3, "b", "Ss. Sérgio, Baco, Marcelo e Apuleio, Mártires"],
  "10-09": ["S. João Leonardi, Confessor", 3, "b", "Ss. Dionísio, Rústico e Eleutério, Mártires"],
  "10-10": ["S. Francisco de Borja, Confessor", 3, "b"],
  "10-11": ["Maternidade da Bem-aventurada Virgem Maria", 2, "b"],
  "10-12": ["Nossa Senhora da Conceição Aparecida, Padroeira do Brasil", 1, "b", null, false, "Próprio do Brasil"],
  "10-13": ["S. Eduardo, Rei e Confessor", 3, "b"],
  "10-14": ["S. Calisto I, Papa e Mártir", 3, "v"],
  "10-15": ["S. Teresa de Jesus, Virgem e Doutora", 3, "b"],
  "10-16": ["S. Edviges, Viúva", 3, "b"],
  "10-17": ["S. Margarida Maria Alacoque, Virgem", 3, "b"],
  "10-18": ["S. Lucas, Evangelista", 2, "v"],
  "10-19": ["S. Pedro de Alcântara, Confessor", 3, "b"],
  "10-20": ["S. João Câncio, Confessor", 3, "b"],
  "10-21": ["S. Hilarião, Abade", 0, "b", "S. Úrsula e Companheiras, Virgens e Mártires"],
  "10-23": ["S. Antônio Maria Claret, Bispo e Confessor", 3, "b"],
  "10-24": ["S. Rafael Arcanjo", 3, "b"],
  "10-25": ["Ss. Crisanto e Dária, Mártires", 0, "v"],
  "10-26": ["S. Evaristo, Papa e Mártir", 0, "v"],
  "10-28": ["Ss. Simão e Judas, Apóstolos", 2, "v"],

  "11-01": ["Todos os Santos", 1, "b"],
  "11-02": ["Comemoração de Todos os Fiéis Defuntos", 1, "p"],
  "11-04": ["S. Carlos Borromeu, Bispo e Confessor", 3, "b", "Ss. Vital e Agrícola, Mártires"],
  "11-08": ["Santos Quatro Coroados, Mártires", 0, "v"],
  "11-09": ["Dedicação da Arquibasílica do Santíssimo Salvador (Latrão)", 2, "b", "S. Teodoro, Mártir", true],
  "11-10": ["S. André Avelino, Confessor", 3, "b", "Ss. Trifão, Respício e Ninfa, Mártires"],
  "11-11": ["S. Martinho de Tours, Bispo e Confessor", 3, "b", "S. Menas, Mártir"],
  "11-12": ["S. Martinho I, Papa e Mártir", 3, "v"],
  "11-13": ["S. Diogo, Confessor", 3, "b"],
  "11-14": ["S. Josafá, Bispo e Mártir", 3, "v"],
  "11-15": ["S. Alberto Magno, Bispo, Confessor e Doutor", 3, "b"],
  "11-16": ["S. Gertrudes, Virgem", 3, "b"],
  "11-17": ["S. Gregório Taumaturgo, Bispo e Confessor", 3, "b"],
  "11-18": ["Dedicação das Basílicas de S. Pedro e S. Paulo", 3, "b"],
  "11-19": ["S. Isabel da Hungria, Viúva", 3, "b", "S. Ponciano, Papa e Mártir"],
  "11-20": ["S. Félix de Valois, Confessor", 3, "b"],
  "11-21": ["Apresentação da Bem-aventurada Virgem Maria", 3, "b"],
  "11-22": ["S. Cecília, Virgem e Mártir", 3, "v"],
  "11-23": ["S. Clemente I, Papa e Mártir", 3, "v", "S. Felicidade, Mártir"],
  "11-24": ["S. João da Cruz, Confessor e Doutor", 3, "b", "S. Crisógono, Mártir"],
  "11-25": ["S. Catarina de Alexandria, Virgem e Mártir", 3, "v"],
  "11-26": ["S. Silvestre, Abade", 3, "b", "S. Pedro de Alexandria, Bispo e Mártir"],
  "11-29": ["S. Saturnino, Mártir", 0, "v"],
  "11-30": ["S. André, Apóstolo", 2, "v"],

  "12-02": ["S. Bibiana, Virgem e Mártir", 3, "v"],
  "12-03": ["S. Francisco Xavier, Confessor", 3, "b"],
  "12-04": ["S. Pedro Crisólogo, Bispo, Confessor e Doutor", 3, "b", "S. Bárbara, Virgem e Mártir"],
  "12-05": ["S. Sabas, Abade", 0, "b"],
  "12-06": ["S. Nicolau, Bispo e Confessor", 3, "b"],
  "12-07": ["S. Ambrósio, Bispo, Confessor e Doutor", 3, "b"],
  "12-08": ["Imaculada Conceição da Bem-aventurada Virgem Maria", 1, "b"],
  "12-10": ["S. Melquíades, Papa e Mártir", 0, "v"],
  "12-11": ["S. Dâmaso I, Papa e Confessor", 3, "b"],
  "12-13": ["S. Luzia, Virgem e Mártir", 3, "v"],
  "12-16": ["S. Eusébio, Bispo e Mártir", 3, "v"],
  "12-21": ["S. Tomé, Apóstolo", 2, "v"],
  "12-24": ["Vigília do Natal", 1, "r"],
  "12-25": ["Natal de Nosso Senhor Jesus Cristo", 1, "b", "S. Anastásia, Mártir (2ª Missa)"],
  "12-26": ["S. Estêvão, Protomártir", 2, "v"],
  "12-27": ["S. João, Apóstolo e Evangelista", 2, "b"],
  "12-28": ["Santos Inocentes, Mártires", 2, "v"],
  "12-29": ["V dia na Oitava do Natal", 2, "b", "S. Tomás Becket, Bispo e Mártir"],
  "12-30": ["VI dia na Oitava do Natal", 2, "b"],
  "12-31": ["VII dia na Oitava do Natal", 2, "b", "S. Silvestre I, Papa e Confessor"]
};

// Datas do ciclo do Natal que sempre prevalecem (são o próprio do tempo)
const NATAL_FIXO = new Set(["12-24","12-25","12-26","12-27","12-28","12-29","12-30","12-31","01-01","01-06"]);

const COR_NOME = { b:"Branco", v:"Vermelho", r:"Roxo", p:"Preto", g:"Verde", o:"Rosa" };
const CLASSE_NOME = { 0:"Comemoração", 1:"I classe", 2:"II classe", 3:"III classe" };

function adventStart(y){
  const dec25 = new Date(y, 11, 25);
  return addDays(sundayOnOrBefore(addDays(dec25, -1)), -21);
}

function md(d){ return mmdd(d); }

/* entrada do santoral para uma data civil (com regras móveis) */
function santoralDe(date){
  const y = date.getFullYear();
  const key = md(date);
  const leap = (y%4===0 && (y%100!==0 || y%400===0));

  // Santíssimo Nome de Jesus: domingo entre 2 e 5 de janeiro; senão, 2 de janeiro
  let holyName = new Date(y,0,2);
  for (let d=2; d<=5; d++){ const t=new Date(y,0,d); if (t.getDay()===0){ holyName=t; break; } }
  if (sameDate(date, holyName)) return ["Santíssimo Nome de Jesus", 2, "b", null, true];

  // Cristo Rei: último domingo de outubro
  const ck = sundayOnOrBefore(new Date(y,9,31));
  if (sameDate(date, ck)) return ["Nosso Senhor Jesus Cristo Rei", 1, "b"];

  // Fiéis Defuntos: se 2/11 for domingo, passa para 3/11
  const nov2 = new Date(y,10,2);
  if (key==="11-02" && nov2.getDay()===0) return null;
  if (key==="11-03" && nov2.getDay()===0) return SANTORAL["11-02"];

  // ano bissexto: S. Matias em 25/02 e S. Gabriel em 28/02
  if (leap){
    if (key==="02-24") return null;
    if (key==="02-25") return SANTORAL["02-24"];
    if (key==="02-27") return null;
    if (key==="02-28") return SANTORAL["02-27"];
  }
  return SANTORAL[key] || null;
}

/* classe e tempo litúrgico do próprio do tempo */
function tempoDe(date){
  const y = date.getFullYear();
  const easter = computeEaster(y);
  const t = date.getTime();
  const D = n => addDays(easter, n).getTime();
  const sunday = date.getDay()===0;
  const k = md(date);
  const adv = adventStart(y).getTime();
  const r = { sunday, rank:4, priv:false, season:"pentecostes", cor:"g" };

  const septuag = D(-63), ash = D(-46), passion = D(-14), palm = D(-7), pent = D(49);

  if (k >= "12-24" || k <= "01-13"){
    r.season = "natal"; r.cor = "b"; r.rank = sunday ? 2 : 4;
    return r;
  }
  if (t >= adv){
    r.season = "advento"; r.cor = "r";
    if (sunday){ r.rank = 1; if (t === addDays(new Date(adv),14).getTime()) r.cor = "o"; return r; }
    const third = addDays(new Date(adv),14);
    const ember = [3,5,6].some(o => addDays(third,o).getTime()===t);
    r.rank = (k >= "12-17" || ember) ? 2 : 3;
    return r;
  }
  if (t < septuag){ r.season = "epifania"; r.rank = sunday ? 2 : 4; return r; }
  if (t < ash){ r.season = "septuagesima"; r.cor = "r"; r.rank = sunday ? 2 : 4; return r; }
  if (t < D(0)){
    r.cor = "r";
    if (t === ash){ r.season="quaresma"; r.rank = 1; return r; }
    if (t >= palm){
      r.season = "semana-santa"; r.rank = 1;
      if (t === D(-3)) r.cor = "b";
      if (t === D(-2)) r.cor = "p";
      if (t === D(-1)) r.cor = "b";
      return r;
    }
    r.season = t >= passion ? "paixao" : "quaresma";
    if (sunday){ r.rank = 1; if (t === D(-21)) r.cor = "o"; return r; }
    const ember = [3,5,6].some(o => D(-42+o)===t);
    r.rank = ember ? 2 : 3; r.priv = true;
    return r;
  }
  if (t < pent){
    r.season = "pascal"; r.cor = "b";
    if (t <= D(7)){ r.rank = 1; return r; }
    if (t === D(39)){ r.rank = 1; return r; }          // Ascensão
    if (t === D(48)){ r.rank = 1; r.cor = "v"; return r; } // Vigília de Pentecostes
    r.rank = sunday ? 2 : 4;
    return r;
  }
  if (t <= D(55)){ r.season = "pentecostes-oitava"; r.cor = "v"; r.rank = 1; return r; }
  r.season = "pentecostes";
  if (t === D(56)){ r.cor = "b"; r.rank = 1; return r; }   // Trindade
  if (t === D(60)){ r.cor = "b"; r.rank = 1; return r; }   // Corpus Christi
  if (t === D(68)){ r.cor = "b"; r.rank = 1; return r; }   // Sagrado Coração
  // Têmporas de setembro: quarta, sexta e sábado depois do 3º domingo de setembro
  const sept1 = new Date(y,8,1);
  const firstSun = addDays(sept1, (7 - sept1.getDay()) % 7);
  const third = addDays(firstSun, 14);
  if ([3,5,6].some(o => addDays(third,o).getTime()===t)){ r.cor = "r"; r.rank = 2; return r; }
  r.rank = sunday ? 2 : 4;
  return r;
}

/* decide se a festa do santoral é celebrada ou apenas comemorada */
function precedencia(s, tp, key){
  if (!s) return false;
  const [, cls, , , senhor] = s;
  if (NATAL_FIXO.has(key)) return !(tp.sunday && ["12-29","12-30","12-31"].includes(key));
  if (cls === 0) return false;
  if (cls === 1) return tp.rank >= 2;
  if (cls === 2){
    if (tp.rank === 1) return false;
    if (tp.rank === 2) return tp.sunday ? !!senhor : true;
    return true;
  }
  if (cls === 3){
    if (tp.rank === 4) return true;
    if (tp.rank === 3 && !tp.priv) return true;
    return false;
  }
  return false;
}

let _cache = {};
function tempoPuro(y){ return _cache[y] || (_cache[y] = buildLiturgicalYear(y, true)); }

/* Evangelho próprio de uma festa do santoral, quando a base o tem */
function evangelhoProprioDe(s, key, y, puro){
  if (!s) return null;
  if (puro && puro.label === s[0]) return puro.cit;
  if (CHRISTMAS_FIXED[key]) return CHRISTMAS_FIXED[key][1];
  if (/Nome de Jesus/.test(s[0])) return "Lc 2,21";
  if (/Fiéis Defuntos/.test(s[0])) return "Jo 5,25-29";
  if (/Cristo Rei/.test(s[0])) return CHRIST_KING[1];
  const leap = (y%4===0 && (y%100!==0 || y%400===0));
  const sk = sanctoralFor(y);
  if (sk[key]) return sk[key][1];
  return null;
}

/* API principal */
function dia(date){
  const d = new Date(date); d.setHours(0,0,0,0);
  const y = d.getFullYear();
  const key = md(d);
  const puro = tempoPuro(y)[ymd(d)] || { label:"Féria", cit:null };
  const s = santoralDe(d);
  const tp = tempoDe(d);
  const celebrado = precedencia(s, tp, key);

  let tempoLabel = puro.label;
  // o Próprio do Tempo do motor fixa o S. Nome de Jesus em 2/1; aqui ele é móvel
  if (/Nome de Jesus/.test(tempoLabel) && !(s && /Nome de Jesus/.test(s[0]))) tempoLabel = "Féria do tempo do Natal";
  if (!celebrado && s && CHRISTMAS_FIXED[key] && /Domingo/.test(tempoLabel) === false && tp.sunday) tempoLabel = SUNDAY_IN_OCTAVE[0];

  let evangelho = puro.cit, evangelhoDe = tempoLabel, evangelhoProprio = true;
  if (celebrado){
    const ep = evangelhoProprioDe(s, key, y, puro);
    if (ep){ evangelho = ep; evangelhoDe = s[0]; }
    else { evangelhoProprio = false; }
  }

  let cor = celebrado ? s[2] : tp.cor;
  if (tp.sunday && ["12-29","12-30","12-31"].includes(key)) cor = "b";

  const santo = s ? {
    nome: s[0],
    classe: CLASSE_NOME[s[1]],
    comemoracoes: s[3] || null,
    nota: s[5] || null,
    celebrado,
    estado: celebrado ? "celebrado" : (s[1] === 0 ? "comemoração" : "comemorado")
  } : null;

  return {
    data: d,
    celebracao: celebrado ? s[0] : tempoLabel,
    tempo: tempoLabel,
    evangelho, evangelhoDe, evangelhoProprio,
    santo,
    cor, corNome: COR_NOME[cor]
  };
}

const api = { dia, textoEvangelho: getPassageText, santoralDe, tempoDe };
if (typeof module !== "undefined" && module.exports) module.exports = api;
root.Liturgia = api;
})(typeof window !== "undefined" ? window : globalThis);
