/* Translations. Portuguese (Portugal) is the default; English is in Settings.
 *
 * Use DEF.i18n.t('key') everywhere text is shown. To add a language, add a
 * table to STRINGS and an entry to LANGS. A missing key falls back to English,
 * then to the key itself, so a half-translated language still works.
 */
window.DEF = window.DEF || {};

(function () {
  'use strict';

  var STRINGS = {
    pt: {
      'level.name': 'Nível 1 — O Percurso da Acessibilidade',

      'title.tagline': 'um passeio do caralho',
      'title.press': 'Prime ESPAÇO ou ENTER para começar (ou toca no ecrã)',
      'title.best': 'Melhor tempo: {0}',
      'ctl.roll.key': '← →  /  A D',            'ctl.roll.do': 'rolar',
      'ctl.hop.key': 'ESPAÇO  /  ↑  /  W',      'ctl.hop.do': 'saltar (manter = mais alto)',
      'ctl.boost.key': 'NUM 5  /  B',           'ctl.boost.do': 'turbo ligar / desligar',
      'ctl.brake.key': '↓  /  S  /  NUM 2',     'ctl.brake.do': 'travar',
      'ctl.misc.key': 'P  /  R  /  M  /  O',    'ctl.misc.do': 'pausa / reiniciar / sem som / definições',

      'hud.boost': 'TURBO',
      'hud.boostOn': 'TURBO LIGADO',
      'hud.par': 'alvo {0}',
      'hud.muted': 'sem som (M)',

      'toast.checkpoint': 'Ponto de controlo',
      'toast.battery': 'Bateria recarregada',
      'toast.pit': 'Caíste num buraco. Pedido de reembolso recusado.',
      'toast.cells': 'Sem células de bateria. De volta ao último ponto de controlo.',

      'pause.title': 'PAUSA',
      'pause.hint': 'Carrega em P para continuar',
      'settings.btn': 'DEFINIÇÕES  (O)',

      'win.title': 'NÍVEL CONCLUÍDO',
      'win.time': 'Tempo',
      'win.under': '(abaixo do alvo!)',
      'win.par': '(alvo {0})',
      'win.tokens': 'Moedas',
      'win.stomps': 'Carrinhos esmagados',
      'win.deaths': 'Regressos a pontos de controlo',
      'win.best': 'Melhor tempo',
      'win.legend': '★ terminar   ★ 80% das moedas   ★ bater o alvo',
      'win.again': 'ENTER ou R para jogar outra vez',

      'settings.title': 'DEFINIÇÕES',
      'settings.boost': 'Modo do turbo',
      'settings.toggle': 'ALTERNAR',
      'settings.hold': 'MANTER',
      'settings.toggle1': 'Carrega uma vez no 5 do teclado numérico (ou B) para ligar o turbo',
      'settings.toggle2': 'e outra vez para o desligar. Não é preciso manter nada premido.',
      'settings.hold1': 'O turbo só fica ligado enquanto mantiveres o 5 (ou B) premido.',
      'settings.hold2': 'Larga a tecla e o turbo desliga.',
      'settings.lang': 'Idioma',
      'settings.avatar': 'Personagem',
      'settings.avatar.classic': 'CLÁSSICO',
      'settings.avatar.logo': 'LOGÓTIPO',
      'settings.hint': '↑ ↓ escolher   ·   ESPAÇO / ENTER / clique: mudar',
      'settings.back': 'Voltar  (O / ESC)',

      'building.label': 'MINISTÉRIO DA PAPELADA',
      'elevator.broken': 'AVARIADO',
      'finish.label': 'META',

      'sign.start':   'PERCURSO DA ACESSIBILIDADE. Rola com ← → (ou A / D).',
      'sign.hop':     'Salta com ESPAÇO / ↑ / W. Mantém premido para um salto mais alto. No ar, carrega numa direção para avançares.',
      'sign.boost':   'TURBO: carrega no 5 do teclado numérico (ou B) para ligar e desligar. Gasta bateria — apanha o ⚡ para recarregar.',
      'sign.curb1':   'LANCIL À FRENTE. «Só 10 cm», disse o arquiteto.',
      'sign.curb2':   'Outro lancil. Estes multiplicam-se.',
      'sign.ramp':    'RAMPA! A descer a velocidade é grátis. Isto é que é eficiência.',
      'sign.gap':     'BURACO À FRENTE. Leva velocidade. A gravidade é agora a tua estagiária.',
      'sign.main':    'ENTRADA PRINCIPAL: 3 degraus (70 cm cada). Entrada acessível: a rampa comprida →',
      'sign.elev':    'ELEVADOR: avariado desde 2019. Utilize as escadas, se faz favor.',
      'sign.bridge':  'PONTE EM OBRAS. Usa as plataformas móveis. Segurança em primeiro lugar. (Não incluída.)',
      'sign.drain':   'SARJETA ABERTA. Infraestrutura urbana perfeitamente normal.',
      'sign.gravel':  'CAMINHO DO PARQUE: gravilha. Pitoresco. Lento. Muito lento.',
      'sign.last':    'ÚLTIMA RAMPA. Ganha balanço, ou liga o turbo (5 do teclado numérico / B).'
    },

    en: {
      'level.name': 'Level 1 — The Accessibility Tour',

      'title.tagline': 'um passeio do caralho',   // the game's title, kept as written
      'title.press': 'Press SPACE or ENTER to start (or tap)',
      'title.best': 'Best time: {0}',
      'ctl.roll.key': '← →  /  A D',            'ctl.roll.do': 'roll',
      'ctl.hop.key': 'SPACE  /  ↑  /  W',       'ctl.hop.do': 'hop (hold = taller)',
      'ctl.boost.key': 'NUM 5  /  B',           'ctl.boost.do': 'boost on / off',
      'ctl.brake.key': '↓  /  S  /  NUM 2',     'ctl.brake.do': 'brake',
      'ctl.misc.key': 'P  /  R  /  M  /  O',    'ctl.misc.do': 'pause / restart / mute / settings',

      'hud.boost': 'BOOST',
      'hud.boostOn': 'BOOST ON',
      'hud.par': 'par {0}',
      'hud.muted': 'muted (M)',

      'toast.checkpoint': 'Checkpoint',
      'toast.battery': 'Battery recharged',
      'toast.pit': 'Fell in a pit. Reimbursement request denied.',
      'toast.cells': 'Out of battery cells. Back to the last checkpoint.',

      'pause.title': 'PAUSED',
      'pause.hint': 'Press P to continue',
      'settings.btn': 'SETTINGS  (O)',

      'win.title': 'LEVEL COMPLETE',
      'win.time': 'Time',
      'win.under': '(under par!)',
      'win.par': '(par {0})',
      'win.tokens': 'Tokens',
      'win.stomps': 'Carts squashed',
      'win.deaths': 'Trips to checkpoints',
      'win.best': 'Best time',
      'win.legend': '★ finish   ★ 80% tokens   ★ beat par',
      'win.again': 'ENTER or R to roll again',

      'settings.title': 'SETTINGS',
      'settings.boost': 'Boost mode',
      'settings.toggle': 'TOGGLE',
      'settings.hold': 'HOLD',
      'settings.toggle1': 'Press NUMPAD 5 (or B) once to turn boost ON,',
      'settings.toggle2': 'press it again to turn it OFF. No need to hold anything.',
      'settings.hold1': 'Boost is ON only while you hold NUMPAD 5 (or B).',
      'settings.hold2': 'Let go and boost turns off.',
      'settings.lang': 'Language',
      'settings.avatar': 'Character',
      'settings.avatar.classic': 'CLASSIC',
      'settings.avatar.logo': 'LOGO',
      'settings.hint': '↑ ↓ choose   ·   SPACE / ENTER / click: change',
      'settings.back': 'Back  (O / ESC)',

      'building.label': 'MINISTRY OF PAPERWORK',
      'elevator.broken': 'OUT OF ORDER',
      'finish.label': 'FINISH',

      'sign.start':   'ACCESSIBILITY TOUR. Roll with ← → (or A / D).',
      'sign.hop':     'Hop with SPACE / ↑ / W. Hold it for a taller hop. In the air, tap a direction to steer.',
      'sign.boost':   'BOOST: press NUMPAD 5 (or B) to switch it on and off. It drains the battery — grab the ⚡ to refill.',
      'sign.curb1':   'CURB AHEAD. “Only 10 cm,” said the architect.',
      'sign.curb2':   'Another curb. They breed.',
      'sign.ramp':    'RAMP! Downhill is free speed. That’s efficiency.',
      'sign.gap':     'GAP AHEAD. Bring speed. Gravity is your intern now.',
      'sign.main':    'MAIN ENTRANCE: 3 steps (70 cm each). Accessible entrance: the long ramp →',
      'sign.elev':    'ELEVATOR: out of order since 2019. Please use the stairs.',
      'sign.bridge':  'BRIDGE UNDER CONSTRUCTION. Use the moving platforms. Safety first. (Not provided.)',
      'sign.drain':   'OPEN DRAIN. Totally normal city infrastructure.',
      'sign.gravel':  'PARK PATH: gravel. Scenic. Slow. Very slow.',
      'sign.last':    'LAST RAMP. Get a run-up, or turn on boost (NUMPAD 5 / B).'
    }
  };

  // Shown in their own language so anyone can find theirs.
  var LANGS = [
    { code: 'pt', name: 'PORTUGUÊS', html: 'pt-PT', decimal: ',' },
    { code: 'en', name: 'ENGLISH',   html: 'en',    decimal: '.' }
  ];

  var current = LANGS[0];   // default: Portuguese (Portugal)

  function find(code) {
    for (var i = 0; i < LANGS.length; i++) if (LANGS[i].code === code) return LANGS[i];
    return null;
  }

  DEF.i18n = {
    langs: LANGS,
    code: function () { return current.code; },
    decimal: function () { return current.decimal; },
    set: function (code) {
      var l = find(code);
      if (!l) return;
      current = l;
      document.documentElement.lang = l.html;
    },
    t: function (key) {
      var s = STRINGS[current.code][key];
      if (s === undefined) s = STRINGS.en[key];
      if (s === undefined) s = key;
      for (var i = 1; i < arguments.length; i++) s = s.replace('{' + (i - 1) + '}', arguments[i]);
      return s;
    }
  };

  DEF.i18n.set('pt');
})();
