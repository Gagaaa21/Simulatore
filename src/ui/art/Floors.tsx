import type { SettingId } from '../../engine/types';

export const W = 900;
export const H = 560;

function Casa() {
  return (
    <g>
      <defs>
        <pattern id="parquet" width="160" height="56" patternUnits="userSpaceOnUse">
          <rect width="160" height="28" fill="#5e412c" />
          <rect y="28" width="160" height="28" fill="#664833" />
          <rect x="0" y="0" width="96" height="28" fill="#6a4a33" />
          <rect x="60" y="28" width="100" height="28" fill="#5a3f2b" />
          <path d="M0 28H160M0 56H160M96 0V28M60 28V56" stroke="#3e2a1c" strokeWidth="1.5" />
          <path d="M10 9c30 2 50-2 70 1M110 40c20 1 30-2 46 0" stroke="#7a5840" strokeWidth="1" fill="none" opacity="0.5" />
        </pattern>
        <radialGradient id="lampada" cx="0.78" cy="0.12" r="0.7">
          <stop offset="0" stopColor="#ffcf8a" stopOpacity="0.35" />
          <stop offset="1" stopColor="#ffcf8a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="tv" cx="0.05" cy="0.0" r="0.6">
          <stop offset="0" stopColor="#7fb2ff" stopOpacity="0.45" />
          <stop offset="1" stopColor="#7fb2ff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width={W} height={H} fill="url(#parquet)" />
      {/* tappeto */}
      <rect x="150" y="150" width="620" height="300" rx="6" fill="#5b2f37" />
      <rect x="166" y="166" width="588" height="268" rx="4" fill="none" stroke="#c9a46b" strokeWidth="3" strokeDasharray="14 6" opacity="0.55" />
      <rect x="186" y="186" width="548" height="228" rx="3" fill="#6a3a43" opacity="0.6" />
      {/* divano */}
      <g>
        <rect x="120" y="18" width="560" height="104" rx="18" fill="#2f4a52" />
        <rect x="140" y="30" width="170" height="70" rx="12" fill="#3b5a63" />
        <rect x="315" y="30" width="170" height="70" rx="12" fill="#3b5a63" />
        <rect x="490" y="30" width="170" height="70" rx="12" fill="#3b5a63" />
        <rect x="120" y="18" width="560" height="20" rx="10" fill="#24393f" />
      </g>
      {/* tavolino */}
      <g>
        <rect x="690" y="400" width="170" height="110" rx="6" fill="#3a2a1d" />
        <rect x="700" y="410" width="150" height="90" rx="4" fill="#4a3727" />
        <circle cx="740" cy="440" r="14" fill="#d9d9d9" opacity="0.8" />
        <rect x="780" y="455" width="50" height="26" rx="3" fill="#202326" />
      </g>
      <rect width={W} height={H} fill="url(#lampada)" />
      <rect width={W} height={H} fill="url(#tv)" className="tv-flicker" />
    </g>
  );
}

export type Room = 'soggiorno' | 'cucina' | 'camera';
export type Decor = 'seggiolone' | 'lettino' | 'inalatori' | 'pentola';

function Cucina({ decor }: { decor: Decor[] }) {
  return (
    <g>
      <defs>
        <pattern id="piastrelle-cucina" width="140" height="140" patternUnits="userSpaceOnUse">
          <rect width="140" height="140" fill="#bdb29f" />
          <rect width="70" height="70" fill="#c9bfae" />
          <rect x="70" y="70" width="70" height="70" fill="#c9bfae" />
          <path d="M0 70H140M70 0V140M0 0H140M0 0V140" stroke="#a39885" strokeWidth="1.6" />
        </pattern>
        <linearGradient id="luce-cucina" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff2d6" stopOpacity="0.32" />
          <stop offset="0.6" stopColor="#fff2d6" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="acciaio" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#c7cdd2" />
          <stop offset="1" stopColor="#8e979e" />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill="url(#piastrelle-cucina)" />
      {/* piano di lavoro lungo la parete */}
      <rect x="0" y="0" width="780" height="104" fill="#000" opacity="0.18" />
      <rect x="0" y="0" width="780" height="96" fill="#d9dcdf" />
      <rect x="0" y="88" width="780" height="10" fill="#7d8287" />
      <path d="M0 6H780" stroke="#eef0f2" strokeWidth="2" opacity="0.7" />
      {/* tagliere */}
      <g transform="rotate(-4 160 48)">
        <rect x="112" y="22" width="96" height="54" rx="7" fill="#c99a63" />
        <rect x="120" y="30" width="80" height="38" rx="5" fill="#d4a670" />
        <circle cx="150" cy="48" r="9" fill="#d94b3a" />
        <circle cx="172" cy="52" r="7" fill="#e8c23c" />
        <rect x="190" y="70" width="70" height="7" rx="3" fill="#b8bec4" transform="rotate(14 190 70)" />
      </g>
      {/* lavello */}
      <g>
        <rect x="270" y="14" width="160" height="68" rx="9" fill="url(#acciaio)" />
        <rect x="282" y="24" width="66" height="48" rx="7" fill="#7f888f" />
        <rect x="354" y="24" width="64" height="48" rx="7" fill="#7f888f" />
        <circle cx="315" cy="48" r="4" fill="#5b636a" />
        <circle cx="386" cy="48" r="4" fill="#5b636a" />
        <rect x="346" y="2" width="8" height="26" rx="3" fill="#cfd5da" />
        <circle cx="350" cy="6" r="7" fill="#dfe4e8" />
      </g>
      {/* piano cottura con pentola */}
      <g>
        <rect x="500" y="12" width="160" height="72" rx="7" fill="#1c1f23" />
        {[
          [538, 34, 14],
          [622, 34, 11],
          [538, 64, 11],
          [622, 64, 15],
        ].map(([x, y, r], i) => (
          <circle key={i} cx={x} cy={y} r={r} fill="#2b3036" stroke="#4b525a" strokeWidth="2" />
        ))}
        {decor.includes('pentola') ? (
          <g>
            <circle cx="538" cy="34" r="24" fill="#ff7a1a" opacity="0.22" />
            <circle cx="538" cy="34" r="14" fill="none" stroke="#ff8a2a" strokeWidth="4" />
            <circle cx="538" cy="34" r="8" fill="none" stroke="#3f8cff" strokeWidth="2" opacity="0.8" />
          </g>
        ) : (
          <g>
            <rect x="644" y="58" width="34" height="8" rx="3" fill="#2a2d31" />
            <circle cx="622" cy="64" r="21" fill="url(#acciaio)" stroke="#6f777e" strokeWidth="2" />
            <circle cx="622" cy="64" r="14" fill="#a7b0b7" />
          </g>
        )}
      </g>
      {decor.includes('pentola') && (
        <g>
          <path d="M470 150 C 480 118, 560 112, 610 128 S 690 150, 676 186 S 600 236, 540 224 S 452 196, 470 150Z" fill="#9cc9e6" opacity="0.38" />
          <path d="M470 150 C 480 118, 560 112, 610 128 S 690 150, 676 186 S 600 236, 540 224 S 452 196, 470 150Z" fill="none" stroke="#e3f2fb" strokeWidth="2" opacity="0.45" />
          <g transform="rotate(-28 626 150)">
            <rect x="590" y="126" width="72" height="50" rx="10" fill="#000" opacity="0.2" transform="translate(4 6)" />
            <rect x="590" y="126" width="72" height="50" rx="10" fill="url(#acciaio)" stroke="#6f777e" strokeWidth="2" />
            <ellipse cx="662" cy="151" rx="7" ry="25" fill="#5b636a" />
            <rect x="566" y="146" width="26" height="9" rx="4" fill="#2a2d31" />
          </g>
          {[0, 1, 2].map((i) => (
            <path key={i} className="vapore" d={`M${520 + i * 40} ${178 - i * 6} c -10 -14, 10 -22, 0 -38 c -8 -12, 8 -20, 2 -32`} stroke="#ffffff" strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.28" />
          ))}
        </g>
      )}
      {/* frigorifero */}
      <g>
        <rect x="788" y="0" width="112" height="128" fill="#000" opacity="0.2" />
        <rect x="792" y="0" width="108" height="122" rx="4" fill="#e7eaed" />
        <rect x="792" y="0" width="108" height="122" rx="4" fill="none" stroke="#c3c9ce" strokeWidth="2" />
        <rect x="800" y="104" width="44" height="6" rx="3" fill="#aab2b9" />
      </g>
      {/* tavolo apparecchiato, sedia spostata */}
      <g>
        <rect x="690" y="372" width="196" height="136" rx="10" fill="#000" opacity="0.22" transform="translate(6 8)" />
        <rect x="690" y="372" width="196" height="136" rx="10" fill="#7a5235" />
        <rect x="700" y="382" width="176" height="116" rx="7" fill="#8b5f3d" />
        <path d="M712 404c40-4 90 3 150-2M712 470c50 3 100-4 150 1" stroke="#9c6c47" strokeWidth="2" fill="none" opacity="0.6" />
        <circle cx="742" cy="414" r="20" fill="#f4f1ea" />
        <circle cx="742" cy="414" r="13" fill="#e9e3d6" />
        <circle cx="742" cy="414" r="8" fill="#d4b26a" opacity="0.8" />
        <circle cx="836" cy="466" r="20" fill="#f4f1ea" />
        <circle cx="836" cy="466" r="13" fill="#e9e3d6" />
        <circle cx="784" cy="446" r="8" fill="#cfe6f5" opacity="0.75" />
        <circle cx="806" cy="404" r="10" fill="#e6e0d2" />
        <g transform="rotate(-18 650 420)">
          <rect x="626" y="396" width="48" height="50" rx="7" fill="#000" opacity="0.2" transform="translate(4 5)" />
          <rect x="626" y="396" width="48" height="50" rx="7" fill="#5b3d28" />
          <rect x="626" y="396" width="10" height="50" rx="4" fill="#4a3020" />
        </g>
      </g>
      {decor.includes('seggiolone') && (
        <g transform="rotate(8 760 220)">
          <rect x="716" y="186" width="96" height="78" rx="18" fill="#000" opacity="0.2" transform="translate(5 7)" />
          <path d="M716 190 l-18 -18 M812 190 l18 -18 M716 262 l-18 18 M812 262 l18 18" stroke="#9aa3ab" strokeWidth="6" strokeLinecap="round" />
          <rect x="716" y="186" width="96" height="78" rx="18" fill="#7fb7d9" />
          <rect x="730" y="198" width="52" height="54" rx="12" fill="#5d9cc4" />
          <rect x="776" y="182" width="44" height="86" rx="12" fill="#eee8dc" />
          <circle cx="796" cy="206" r="4" fill="#e08a3c" />
          <circle cx="804" cy="232" r="3" fill="#e08a3c" />
          <rect x="784" y="244" width="22" height="5" rx="2" fill="#c0c6cc" />
        </g>
      )}
      <rect width={W} height={H} fill="url(#luce-cucina)" />
    </g>
  );
}

function Camera({ decor }: { decor: Decor[] }) {
  return (
    <g>
      <defs>
        <pattern id="parquet-camera" width="180" height="48" patternUnits="userSpaceOnUse">
          <rect width="180" height="24" fill="#7c5d40" />
          <rect y="24" width="180" height="24" fill="#856546" />
          <rect x="0" y="0" width="110" height="24" fill="#8a6a4b" />
          <rect x="70" y="24" width="110" height="24" fill="#77593d" />
          <path d="M0 24H180M0 48H180M110 0V24M70 24V48" stroke="#5a412c" strokeWidth="1.4" />
          <path d="M12 8c30 2 60-2 84 1M120 36c24 1 34-2 52 0" stroke="#9a7a58" strokeWidth="1" fill="none" opacity="0.5" />
        </pattern>
        <radialGradient id="abat-jour" cx="0.79" cy="0.05" r="0.55">
          <stop offset="0" stopColor="#ffd48f" stopOpacity="0.5" />
          <stop offset="1" stopColor="#ffd48f" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="piumone" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d6dde7" />
          <stop offset="1" stopColor="#b4c0cf" />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill="url(#parquet-camera)" />
      {/* scendiletto */}
      <rect x="196" y="156" width="540" height="286" rx="14" fill="#5f6573" />
      <rect x="210" y="170" width="512" height="258" rx="10" fill="none" stroke="#7b8291" strokeWidth="3" />
      {/* letto matrimoniale contro la parete */}
      <g>
        <rect x="160" y="-40" width="500" height="168" rx="12" fill="#000" opacity="0.22" transform="translate(6 8)" />
        <rect x="160" y="-40" width="500" height="168" rx="12" fill="#3b2f27" />
        <rect x="160" y="-40" width="20" height="168" rx="6" fill="#2c231d" />
        <rect x="186" y="-32" width="466" height="152" rx="12" fill="url(#piumone)" />
        <rect x="192" y="-24" width="74" height="62" rx="16" fill="#f2f4f6" />
        <rect x="192" y="48" width="74" height="62" rx="16" fill="#eef1f4" />
        <path d="M300 -30 C 330 20, 300 70, 330 118 M420 -30 c 20 60, -10 90, 18 148" stroke="#a5b2c2" strokeWidth="3" fill="none" opacity="0.7" />
        <path d="M186 116 C 260 132, 340 108, 420 128 S 560 112, 652 122 L652 120 L186 120Z" fill="#b0bccb" />
      </g>
      {/* comodino con abat-jour */}
      <g>
        <rect x="676" y="0" width="92" height="86" rx="6" fill="#000" opacity="0.22" transform="translate(5 6)" />
        <rect x="676" y="0" width="92" height="86" rx="6" fill="#5a4330" />
        <rect x="684" y="4" width="76" height="74" rx="4" fill="#6a503a" />
        <circle cx="708" cy="30" r="20" fill="#f6e3b4" />
        <circle cx="708" cy="30" r="8" fill="#fff6dd" />
        <rect x="736" y="44" width="16" height="28" rx="3" fill="#1b1e22" />
        {decor.includes('inalatori') && (
          <g>
            <rect x="694" y="58" width="22" height="12" rx="4" fill="#3d7fd1" />
            <rect x="712" y="54" width="8" height="18" rx="3" fill="#2d63a6" />
            <rect x="720" y="62" width="14" height="10" rx="3" fill="#e9b949" />
          </g>
        )}
      </g>
      {/* armadio */}
      <g>
        <rect x="790" y="0" width="110" height="120" fill="#000" opacity="0.2" />
        <rect x="794" y="0" width="106" height="114" fill="#4b3a2c" />
        <path d="M847 0V114" stroke="#33271d" strokeWidth="3" />
        <rect x="838" y="96" width="6" height="12" rx="2" fill="#c8b48a" />
        <rect x="850" y="96" width="6" height="12" rx="2" fill="#c8b48a" />
      </g>
      {decor.includes('lettino') && (
        <g>
          <rect x="690" y="380" width="184" height="120" rx="8" fill="#000" opacity="0.2" transform="translate(5 7)" />
          <rect x="690" y="380" width="184" height="120" rx="8" fill="#ece7dd" />
          <rect x="702" y="392" width="160" height="96" rx="5" fill="#cfe3f0" />
          {Array.from({ length: 13 }).map((_, i) => (
            <line key={i} x1={704 + i * 12.5} y1="381" x2={704 + i * 12.5} y2="391" stroke="#c9c2b4" strokeWidth="3" />
          ))}
          {Array.from({ length: 13 }).map((_, i) => (
            <line key={`b${i}`} x1={704 + i * 12.5} y1="489" x2={704 + i * 12.5} y2="499" stroke="#c9c2b4" strokeWidth="3" />
          ))}
          <rect x="770" y="404" width="80" height="72" rx="10" fill="#f3c6d3" />
          <path d="M770 420h80M770 440h80M770 460h80" stroke="#e7a9bb" strokeWidth="2" />
          <circle cx="726" cy="440" r="12" fill="#f6e7b8" />
        </g>
      )}
      <rect width={W} height={H} fill="url(#abat-jour)" />
    </g>
  );
}

function Ristorante() {
  return (
    <g>
      <defs>
        <pattern id="piastrelle" width="80" height="80" patternUnits="userSpaceOnUse">
          <rect width="80" height="80" fill="#6f665b" />
          <rect width="40" height="40" fill="#7d7468" />
          <rect x="40" y="40" width="40" height="40" fill="#7d7468" />
          <path d="M0 40H80M40 0V80" stroke="#5a5249" strokeWidth="1.5" />
        </pattern>
        <radialGradient id="caldo" cx="0.5" cy="0.4" r="0.8">
          <stop offset="0" stopColor="#ffd59a" stopOpacity="0.28" />
          <stop offset="1" stopColor="#ffd59a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width={W} height={H} fill="url(#piastrelle)" />
      {[
        [110, 90],
        [790, 110],
        [800, 470],
      ].map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="70" fill="#efe9df" />
          <circle cx={x} cy={y} r="70" fill="none" stroke="#cfc6b6" strokeWidth="3" />
          <circle cx={x - 25} cy={y - 18} r="16" fill="#fff" stroke="#ddd" />
          <circle cx={x + 24} cy={y + 14} r="16" fill="#fff" stroke="#ddd" />
          <rect x={x - 6} y={y - 40} width="12" height="30" rx="3" fill="#7a1f2a" opacity="0.8" />
        </g>
      ))}
      {/* tavolo del paziente con sedia rovesciata */}
      <g>
        <circle cx="300" cy="80" r="60" fill="#efe9df" />
        <circle cx="285" cy="70" r="15" fill="#fff" stroke="#ddd" />
        <path d="M280 66c6-4 14-3 16 4" stroke="#b07a3a" strokeWidth="5" fill="none" />
        <rect x="420" y="120" width="56" height="56" rx="6" fill="#3e2a1d" transform="rotate(28 448 148)" />
        <rect x="430" y="118" width="40" height="12" rx="3" fill="#2c1e15" transform="rotate(28 448 148)" />
      </g>
      <rect width={W} height={H} fill="url(#caldo)" />
    </g>
  );
}

function Strada() {
  return (
    <g>
      <defs>
        <filter id="asfalto" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" />
          <feColorMatrix values="0 0 0 0 0.16  0 0 0 0 0.17  0 0 0 0 0.19  0 0 0 0.55 0" />
          <feComposite in2="SourceGraphic" operator="in" />
        </filter>
        <radialGradient id="lampione" cx="0.86" cy="0.08" r="0.55">
          <stop offset="0" stopColor="#ffb860" stopOpacity="0.35" />
          <stop offset="1" stopColor="#ffb860" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width={W} height={H} fill="#2a2e34" />
      <rect width={W} height={H} fill="#2a2e34" filter="url(#asfalto)" />
      {/* marciapiede */}
      <rect x="0" y="0" width={W} height="70" fill="#4b4f55" />
      <rect x="0" y="66" width={W} height="8" fill="#6c7076" />
      {/* strisce */}
      {Array.from({ length: 8 }).map((_, i) => (
        <rect key={i} x={i * 130 + 10} y="286" width="70" height="10" fill="#e8e6dc" opacity="0.85" />
      ))}
      <rect x="0" y="520" width={W} height="6" fill="#e8e6dc" opacity="0.7" />
      {/* frenata */}
      <path d="M40 360 C 220 350, 380 340, 520 380" stroke="#16181b" strokeWidth="9" fill="none" opacity="0.7" />
      <path d="M40 380 C 220 372, 380 362, 520 398" stroke="#16181b" strokeWidth="9" fill="none" opacity="0.6" />
      {/* moto a terra */}
      <g transform="translate(700 150) rotate(-24)">
        <ellipse cx="0" cy="0" rx="92" ry="22" fill="#121417" opacity="0.5" transform="translate(6 10)" />
        <rect x="-80" y="-12" width="40" height="24" rx="10" fill="#1d1f22" />
        <rect x="42" y="-12" width="40" height="24" rx="10" fill="#1d1f22" />
        <rect x="-50" y="-18" width="100" height="36" rx="14" fill="#c4271f" />
        <rect x="-20" y="-11" width="45" height="22" rx="8" fill="#1b1b1d" />
        <rect x="52" y="-30" width="8" height="60" rx="3" fill="#8a9097" />
      </g>
      {/* detriti */}
      {[
        [560, 250, 0],
        [600, 230, 30],
        [610, 270, 70],
        [520, 220, 15],
      ].map(([x, y, r], i) => (
        <rect key={i} x={x} y={y} width="12" height="7" fill="#d0d5da" opacity="0.7" transform={`rotate(${r} ${x} ${y})`} />
      ))}
      <rect width={W} height={H} fill="url(#lampione)" />
      <rect width={W} height={H} className="lampeggiante" fill="#3f8cff" />
    </g>
  );
}

function Cantiere() {
  return (
    <g>
      <defs>
        <filter id="cemento" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="8" />
          <feColorMatrix values="0 0 0 0 0.45  0 0 0 0 0.44  0 0 0 0 0.41  0 0 0 0.45 0" />
          <feComposite in2="SourceGraphic" operator="in" />
        </filter>
        <pattern id="zebra" width="30" height="30" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="15" height="30" fill="#f3c316" />
          <rect x="15" width="15" height="30" fill="#1b1b1b" />
        </pattern>
        <radialGradient id="faro" cx="0.15" cy="0.15" r="0.9">
          <stop offset="0" stopColor="#fff6dc" stopOpacity="0.3" />
          <stop offset="1" stopColor="#fff6dc" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width={W} height={H} fill="#6b6862" />
      <rect width={W} height={H} fill="#6b6862" filter="url(#cemento)" />
      <path d="M120 470 L190 420 L260 432 L330 380" stroke="#4d4a45" strokeWidth="2" fill="none" />
      <rect x="0" y="0" width={W} height="26" fill="url(#zebra)" />
      {/* tavolo da lavoro e smerigliatrice */}
      <rect x="640" y="70" width="220" height="110" rx="4" fill="#7c5a37" />
      <rect x="650" y="80" width="200" height="90" fill="#8a6640" />
      <g transform="translate(600 210) rotate(-15)">
        <rect x="-50" y="-12" width="80" height="24" rx="8" fill="#1f5fae" />
        <rect x="-70" y="-6" width="26" height="12" rx="4" fill="#222" />
        <circle cx="38" cy="0" r="24" fill="#9aa3ab" stroke="#4b5157" strokeWidth="4" />
      </g>
      <path d="M560 216 C 520 240, 500 170, 460 150 S 380 110, 300 40" stroke="#111" strokeWidth="5" fill="none" />
      {/* polvere */}
      {Array.from({ length: 30 }).map((_, i) => (
        <circle key={i} cx={560 + ((i * 37) % 120)} cy={220 + ((i * 53) % 80)} r={1.5 + (i % 3)} fill="#d8d2c6" opacity="0.4" />
      ))}
      <rect width={W} height={H} fill="url(#faro)" />
    </g>
  );
}

function Concerto({ giorno }: { giorno: boolean }) {
  const heads = Array.from({ length: 44 }).map((_, i) => {
    const x = 18 + i * 20 + ((i * 7) % 9);
    const y = 10 + ((i * 13) % 26);
    const cols = ['#2a1d14', '#4a3222', '#141414', '#a37a43', '#6b3b26', '#d9c28a', '#3b2a1e'];
    return <circle key={i} cx={x} cy={y} r={12 + (i % 3)} fill={cols[i % cols.length]} />;
  });
  return (
    <g>
      <defs>
        <filter id="erba" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="2" seed="5" />
          <feColorMatrix values={giorno ? '0 0 0 0 0.42  0 0 0 0 0.52  0 0 0 0 0.24  0 0 0 0.6 0' : '0 0 0 0 0.12  0 0 0 0 0.17  0 0 0 0 0.12  0 0 0 0.7 0'} />
          <feComposite in2="SourceGraphic" operator="in" />
        </filter>
      </defs>
      <rect width={W} height={H} fill={giorno ? '#7f8a45' : '#1b2419'} />
      <rect width={W} height={H} fill={giorno ? '#7f8a45' : '#1b2419'} filter="url(#erba)" />
      {/* zone calpestate */}
      <ellipse cx="300" cy="380" rx="220" ry="120" fill={giorno ? '#8f8250' : '#2a2a20'} opacity="0.6" />
      {/* transenna e pubblico */}
      <g>{heads}</g>
      <rect x="0" y="48" width={W} height="10" fill="#9aa3ad" />
      {Array.from({ length: 19 }).map((_, i) => (
        <rect key={i} x={i * 50} y="44" width="4" height="18" fill="#6f7882" />
      ))}
      {/* bicchieri e bottiglie */}
      {[
        [130, 470],
        [720, 330],
        [760, 360],
        [180, 140],
        [620, 500],
        [840, 210],
      ].map(([x, y], i) => (
        <g key={i} transform={`rotate(${i * 40} ${x} ${y})`}>
          <rect x={x} y={y} width="16" height="9" rx="2" fill={i % 2 ? '#e8f1ff' : '#d84b3b'} opacity="0.85" />
        </g>
      ))}
      {!giorno && <rect width={W} height={H} className="luci-palco" fill="url(#raggi)" />}
      <defs>
        <linearGradient id="raggi" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff3fa6" stopOpacity="0.22" />
          <stop offset="0.5" stopColor="#3fe0ff" stopOpacity="0.05" />
          <stop offset="1" stopColor="#7b5cff" stopOpacity="0.2" />
        </linearGradient>
      </defs>
      {giorno && (
        <>
          {/* ombra della tenda del PMA */}
          <path d="M600 560 L900 560 L900 300 L700 260 Z" fill="#0b1a10" opacity="0.28" />
          <rect x="760" y="250" width="140" height="18" fill="#e8ecef" />
          <rect x="760" y="250" width="140" height="18" fill="none" stroke="#c4271f" strokeWidth="4" strokeDasharray="20 10" />
        </>
      )}
    </g>
  );
}

function Lago() {
  return (
    <g>
      <defs>
        <linearGradient id="acqua" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1f5a74" />
          <stop offset="1" stopColor="#3a8aa3" />
        </linearGradient>
        <filter id="sabbia" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed="11" />
          <feColorMatrix values="0 0 0 0 0.79  0 0 0 0 0.7  0 0 0 0 0.54  0 0 0 0.5 0" />
          <feComposite in2="SourceGraphic" operator="in" />
        </filter>
      </defs>
      <rect width={W} height={H} fill="#c7b089" />
      <rect width={W} height={H} fill="#c7b089" filter="url(#sabbia)" />
      <path d="M0 0 H900 V130 C 760 160, 600 120, 450 150 S 150 120, 0 150 Z" fill="url(#acqua)" />
      <path d="M0 150 C 150 120, 300 160, 450 150 S 760 160, 900 130" stroke="#e8f4f7" strokeWidth="5" fill="none" opacity="0.7" className="onda" />
      {[60, 95].map((y, i) => (
        <path key={i} d={`M${40 + i * 60} ${y} q 30 -8 60 0 t 60 0`} stroke="#bfe3ee" strokeWidth="2" fill="none" opacity="0.5" />
      ))}
      {/* telo e salvagente */}
      <rect x="640" y="380" width="200" height="110" rx="6" fill="#2f8f88" transform="rotate(-6 740 435)" />
      <rect x="640" y="380" width="200" height="110" rx="6" fill="none" stroke="#f2e9c9" strokeWidth="6" strokeDasharray="30 18" transform="rotate(-6 740 435)" />
      <g transform="translate(130 450)">
        <circle r="38" fill="#e8492f" />
        <circle r="20" fill="#c7b089" />
        {[0, 90, 180, 270].map((a) => (
          <rect key={a} x="-8" y="-38" width="16" height="18" fill="#f5f2ea" transform={`rotate(${a + 45})`} />
        ))}
      </g>
    </g>
  );
}

function Parcheggio() {
  return (
    <g>
      <defs>
        <radialGradient id="lampada-park" cx="0.5" cy="0.35" r="0.65">
          <stop offset="0" stopColor="#ffd7a0" stopOpacity="0.28" />
          <stop offset="1" stopColor="#ffd7a0" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width={W} height={H} fill="#23272d" />
      {Array.from({ length: 7 }).map((_, i) => (
        <rect key={i} x={40 + i * 130} y="0" width="6" height="120" fill="#d9d7cf" opacity="0.8" />
      ))}
      {Array.from({ length: 7 }).map((_, i) => (
        <rect key={i} x={40 + i * 130} y="440" width="6" height="120" fill="#d9d7cf" opacity="0.8" />
      ))}
      <g transform="translate(110 20)">
        <rect width="110" height="190" rx="28" fill="#3e4f63" />
        <rect x="12" y="40" width="86" height="50" rx="10" fill="#1d2733" />
        <rect x="12" y="120" width="86" height="40" rx="10" fill="#1d2733" />
      </g>
      <ellipse cx="640" cy="420" rx="90" ry="30" fill="#14171b" opacity="0.7" />
      <rect width={W} height={H} fill="url(#lampada-park)" />
    </g>
  );
}

function Supermercato() {
  const cols = ['#d9534f', '#f0ad4e', '#5bc0de', '#5cb85c', '#9b6bd1', '#e8e2d0'];
  return (
    <g>
      <defs>
        <pattern id="linoleum" width="60" height="60" patternUnits="userSpaceOnUse">
          <rect width="60" height="60" fill="#b9bcb5" />
          <path d="M0 60H60M60 0V60" stroke="#a5a9a1" strokeWidth="1.5" />
          <circle cx="18" cy="22" r="1.2" fill="#8f938b" />
          <circle cx="44" cy="40" r="1" fill="#8f938b" />
        </pattern>
        <radialGradient id="neon" cx="0.5" cy="0.3" r="0.9">
          <stop offset="0" stopColor="#f4fbff" stopOpacity="0.18" />
          <stop offset="1" stopColor="#f4fbff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width={W} height={H} fill="url(#linoleum)" />
      {/* scaffali */}
      {[0, 1].map((r) => (
        <g key={r} transform={`translate(0 ${r === 0 ? 10 : 470})`}>
          <rect x="20" y="0" width="860" height="70" rx="4" fill="#d6d9de" />
          {Array.from({ length: 34 }).map((_, i) => (
            <rect key={i} x={28 + i * 25} y="8" width="20" height="54" rx="3" fill={cols[(i * 7 + r * 3) % cols.length]} opacity="0.85" />
          ))}
        </g>
      ))}
      {/* cassa con nastro */}
      <g>
        <rect x="690" y="120" width="190" height="90" rx="6" fill="#3a3f47" />
        <rect x="700" y="140" width="130" height="50" rx="4" fill="#1d2126" />
        {Array.from({ length: 6 }).map((_, i) => (
          <rect key={i} x={706 + i * 21} y="146" width="14" height="38" fill="#2a2f36" />
        ))}
        <rect x="840" y="135" width="30" height="40" rx="3" fill="#87929f" />
      </g>
      {/* carrello */}
      <g transform="translate(140 120) rotate(-12)">
        <rect width="110" height="70" rx="6" fill="none" stroke="#9aa3ad" strokeWidth="5" />
        {Array.from({ length: 5 }).map((_, i) => (
          <line key={i} x1={i * 22 + 11} y1="4" x2={i * 22 + 11} y2="66" stroke="#9aa3ad" strokeWidth="2" />
        ))}
        <rect x="14" y="14" width="30" height="22" rx="3" fill="#f0ad4e" />
        <rect x="52" y="30" width="26" height="26" rx="3" fill="#5bc0de" />
      </g>
      {/* spesa caduta */}
      <circle cx="600" cy="420" r="9" fill="#d9534f" />
      <circle cx="622" cy="432" r="9" fill="#e5c33f" />
      <rect x="560" y="400" width="26" height="16" rx="3" fill="#f2f2f2" transform="rotate(25 573 408)" />
      <rect width={W} height={H} fill="url(#neon)" />
    </g>
  );
}

export function Floor({
  setting,
  timeOfDay,
  room = 'soggiorno',
  decor = [],
}: {
  setting: SettingId;
  timeOfDay: 'giorno' | 'sera' | 'notte';
  room?: Room;
  decor?: Decor[];
}) {
  let floor: JSX.Element;
  switch (setting) {
    case 'casa':
      floor = room === 'cucina' ? <Cucina decor={decor} /> : room === 'camera' ? <Camera decor={decor} /> : <Casa />;
      break;
    case 'ristorante':
      floor = <Ristorante />;
      break;
    case 'strada':
      floor = <Strada />;
      break;
    case 'cantiere':
      floor = <Cantiere />;
      break;
    case 'concerto':
    case 'stadio':
      floor = <Concerto giorno={timeOfDay === 'giorno'} />;
      break;
    case 'festival':
      floor = <Concerto giorno />;
      break;
    case 'lago':
      floor = <Lago />;
      break;
    case 'parcheggio':
      floor = <Parcheggio />;
      break;
    case 'supermercato':
      floor = <Supermercato />;
      break;
    default:
      floor = <Casa />;
  }
  const night = timeOfDay !== 'giorno';
  return (
    <g>
      {floor}
      <defs>
        <radialGradient id="vignetta" cx="0.5" cy="0.54" r="0.72">
          <stop offset="0.45" stopColor="#050a14" stopOpacity="0" />
          <stop offset="1" stopColor="#050a14" stopOpacity={night ? 0.82 : 0.38} />
        </radialGradient>
      </defs>
      <rect width={W} height={H} fill="url(#vignetta)" pointerEvents="none" />
    </g>
  );
}
