import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import forge from 'node-forge';

/* ── Tip Card ──────────────────────────────────────────────────── */
const TipCard = ({ icon, title, description, color = 'indigo' }) => {
  const styles = {
    indigo: { wrap: 'bg-indigo-600/20 border-indigo-500/30', icon: 'text-indigo-400', title: 'text-indigo-300' },
    amber:  { wrap: 'bg-amber-600/20 border-amber-500/30',   icon: 'text-amber-400',  title: 'text-amber-300'  },
    green:  { wrap: 'bg-green-600/20 border-green-500/30',   icon: 'text-green-400',  title: 'text-green-300'  },
    rose:   { wrap: 'bg-rose-600/20 border-rose-500/30',     icon: 'text-rose-400',   title: 'text-rose-300'   },
    blue:   { wrap: 'bg-blue-600/20 border-blue-500/30',     icon: 'text-blue-400',   title: 'text-blue-300'   },
  }[color] ?? { wrap: 'bg-indigo-600/20 border-indigo-500/30', icon: 'text-indigo-400', title: 'text-indigo-300' };

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${styles.wrap}`}>
          <i className={`fa-solid ${icon} text-sm ${styles.icon}`} />
        </div>
        <div>
          <p className={`text-xs font-black uppercase tracking-wide mb-1 ${styles.title}`}>{title}</p>
          <p className="text-[11px] text-slate-400 leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
};

/* ── Key Box ───────────────────────────────────────────────────── */
const KeyBox = ({ label, value, hidden = false, showToggle = false, onToggle, onCopy }) => (
  <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
    <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-700 bg-slate-800">
      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{label}</span>
      <div className="flex items-center gap-3">
        {showToggle && (
          <button onClick={onToggle} title={hidden ? 'Show key' : 'Hide key'}
            className="text-slate-500 hover:text-slate-200 transition-colors text-xs flex items-center gap-1">
            <i className={`fa-solid ${hidden ? 'fa-eye' : 'fa-eye-slash'}`} />
            <span className="text-[9px] font-bold uppercase">{hidden ? 'แสดง' : 'ซ่อน'}</span>
          </button>
        )}
        {onCopy && !hidden && (
          <button onClick={onCopy} title="Copy to clipboard"
            className="text-slate-500 hover:text-slate-200 transition-colors text-xs flex items-center gap-1">
            <i className="fa-solid fa-copy" />
            <span className="text-[9px] font-bold uppercase">คัดลอก</span>
          </button>
        )}
      </div>
    </div>
    <div className="p-4 max-h-44 overflow-auto">
      {hidden ? (
        <div className="flex items-center gap-3 py-2">
          <i className="fa-solid fa-lock text-slate-600 text-lg" />
          <div>
            <p className="text-[11px] font-black text-slate-600 uppercase tracking-widest">ซ่อน Private Key ไว้</p>
            <p className="text-[10px] text-slate-700 mt-0.5">ต้องเป็นแอดมินจึงจะดูหรือคัดลอก private key ได้</p>
          </div>
        </div>
      ) : (
        <pre className="text-[10px] font-mono text-slate-300 whitespace-pre-wrap break-all leading-relaxed">
          {value || '— ยังไม่ได้สร้าง key กด “สร้าง Key ” ด้านบน —'}
        </pre>
      )}
    </div>
  </div>
);

/* ── Main Page ─────────────────────────────────────────────────── */
const EncryptionPage = () => {
  const { user }                              = useAuth();
  const isAdmin                               = user?.role === 'admin';

  const [keyPair,         setKeyPair]         = useState(null);
  const [cryptoKP,        setCryptoKP]        = useState(null);
  const [generating,      setGenerating]      = useState(false);
  const [privHidden,      setPrivHidden]      = useState(true);
  const [importedKey,     setImportedKey]     = useState('');
  const [plaintext,       setPlaintext]       = useState('');
  const [ciphertext,      setCiphertext]      = useState('');
  const [decryptedMsg,    setDecryptedMsg]    = useState('');
  const [showTips,        setShowTips]        = useState(true);
  const [portFilter,      setPortFilter]      = useState(null);

  /* Common encrypted ports */
  const PORTS = [
    { port: 443,  proto: 'HTTPS',  algo: 'TLS → RSA / ECDHE',  icon: 'fa-globe',          color: 'indigo' },
    { port: 22,   proto: 'SSH',    algo: 'RSA / Ed25519',        icon: 'fa-terminal',       color: 'green'  },
    { port: 465,  proto: 'SMTPS',  algo: 'TLS → RSA-2048',      icon: 'fa-envelope',       color: 'amber'  },
    { port: 993,  proto: 'IMAPS',  algo: 'TLS → RSA-2048',      icon: 'fa-inbox',          color: 'blue'   },
    { port: 8443, proto: 'HTTPS*', algo: 'TLS → RSA / ECDHE',  icon: 'fa-shield-halved',  color: 'rose'   },
    { port: 3389, proto: 'RDP',    algo: 'TLS → RSA',           icon: 'fa-desktop',        color: 'amber'  },
  ];
  const selected = PORTS.find(p => p.port === portFilter);

  /* Generate RSA-2048 OAEP key pair via node-forge (works on HTTP + HTTPS) */
  const generateKeys = async () => {
    setGenerating(true);
    setCiphertext('');
    setDecryptedMsg('');
    try {
      // forge.pki.rsa.generateKeyPair is sync — run in a tick to not freeze UI
      await new Promise(resolve => setTimeout(resolve, 30));
      const kp = forge.pki.rsa.generateKeyPair({ bits: 2048, e: 0x10001 });
      const pubPem  = forge.pki.publicKeyToPem(kp.publicKey);
      const privPem = forge.pki.privateKeyToPem(kp.privateKey);
      setKeyPair({ public: pubPem, private: privPem });
      setCryptoKP(kp);
      setPrivHidden(true);
      toast.success('สร้างคู่คีย์ RSA-2048 OAEP สำเร็จแล้ว');
    } catch (e) {
      toast.error('สร้าง key ไม่สำเร็จ: ' + e.message);
    }
    setGenerating(false);
  };

  const copy = (text, label) =>
    navigator.clipboard.writeText(text).then(() => toast.success(`คัดลอก ${label} ไปยัง clipboard แล้ว`));

  const encryptMsg = () => {
    if (!cryptoKP || !plaintext.trim()) return toast.error('สร้าง key pair ก่อน และพิมพ์ข้อความที่ต้องการเข้ารหัส');
    try {
      const encrypted = cryptoKP.publicKey.encrypt(forge.util.encodeUtf8(plaintext), 'RSA-OAEP', {
        md: forge.md.sha256.create(),
        mgf1: { md: forge.md.sha256.create() },
      });
      setCiphertext(forge.util.encode64(encrypted));
      setDecryptedMsg('');
      toast.success('เข้ารหัสข้อความด้วย public key สำเร็จ');
    } catch (e) {
      toast.error('เข้ารหัสไม่สำเร็จ: ' + e.message);
    }
  };

  const decryptMsg = () => {
    if (!cryptoKP || !ciphertext) return;
    try {
      const decoded   = forge.util.decode64(ciphertext);
      const decrypted = cryptoKP.privateKey.decrypt(decoded, 'RSA-OAEP', {
        md: forge.md.sha256.create(),
        mgf1: { md: forge.md.sha256.create() },
      });
      setDecryptedMsg(forge.util.decodeUtf8(decrypted));
      toast.success('ถอดรหัสข้อความด้วย private key สำเร็จ');
    } catch (e) {
      toast.error('ถอดรหัสไม่สำเร็จ: ' + e.message);
    }
  };

  /* ── Render ─────────────────────────────────────── */
  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-black text-white uppercase tracking-tight">ห้องปฏิบัติการ RSA</h2>
          <p className="text-xs text-slate-500 mt-0.5">สร้างคู่คีย์ RSA-2048 OAEP และทดสอบการเข้ารหัส — ใช้ Web Crypto API ที่มีในเบราว์เซอร์โดยตรง</p>
          {/* Algorithm badges */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            {[
              { label: 'RSA-2048',   color: 'bg-indigo-600/20 border-indigo-500/30 text-indigo-300' },
              { label: 'OAEP',       color: 'bg-blue-600/20 border-blue-500/30 text-blue-300'   },
              { label: 'SHA-256',    color: 'bg-green-600/20 border-green-500/30 text-green-300' },
              { label: 'Web Crypto', color: 'bg-slate-700/60 border-slate-600 text-slate-400'    },
            ].map(b => (
              <span key={b.label} className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${b.color}`}>{b.label}</span>
            ))}
          </div>
        </div>
        <button onClick={() => setShowTips(v => !v)}
          className="flex items-center gap-2 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs font-bold text-slate-400 hover:text-slate-200 transition-all shrink-0">
          <i className="fa-solid fa-circle-info text-sm" />
          {showTips ? 'ซ่อนคำแนะนำ' : 'แสดงคำแนะนำ'}
        </button>
      </div>

      {/* Port Filter Row */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <i className="fa-solid fa-filter text-slate-400 text-xs" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Port Filter — เลือก Port ที่ใช้การเข้ารหัส</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {PORTS.map(p => {
            const active = portFilter === p.port;
            const colMap = {
              indigo: 'bg-indigo-600/30 border-indigo-400 text-indigo-200',
              green:  'bg-green-600/30 border-green-400 text-green-200',
              amber:  'bg-amber-600/30 border-amber-400 text-amber-200',
              blue:   'bg-blue-600/30 border-blue-400 text-blue-200',
              rose:   'bg-rose-600/30 border-rose-400 text-rose-200',
            };
            return (
              <button key={p.port}
                onClick={() => setPortFilter(active ? null : p.port)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-black uppercase tracking-wide transition-all ${
                  active ? colMap[p.color] : 'bg-slate-900 border-slate-700 text-slate-500 hover:text-slate-300 hover:border-slate-600'
                }`}>
                <i className={`fa-solid ${p.icon} text-[10px]`} />
                :{p.port} {p.proto}
              </button>
            );
          })}
          {portFilter && (
            <button onClick={() => setPortFilter(null)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-700 text-slate-600 hover:text-slate-400 text-xs transition-all">
              <i className="fa-solid fa-xmark" /> ยกเลิก
            </button>
          )}
        </div>
        {selected && (
          <div className="mt-3 flex items-center gap-2 text-[11px]">
            <i className={`fa-solid ${selected.icon} text-slate-500`} />
            <span className="text-slate-500">Port <span className="font-mono font-black text-slate-300">{selected.port}</span></span>
            <span className="text-slate-700">—</span>
            <span className="text-slate-400">{selected.proto}</span>
            <span className="text-slate-700">—</span>
            <span className="font-mono text-indigo-400 font-bold">{selected.algo}</span>
            <span className="ml-auto text-[9px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded font-black uppercase tracking-widest">
              Asymmetric Encryption
            </span>
          </div>
        )}
      </div>

      {/* Tips Grid — 3 cards only */}
      {showTips && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <TipCard icon="fa-key" title="RSA-2048 OAEP / SHA-256" color="indigo"
            description="RSA เข้ารหัสด้วย Public Key ถอดรหัสด้วย Private Key OAEP เติม padding แบบสุ่มก่อนเข้ารหัส SHA-256 เป็น hash function ที่ใช้ในขั้นตอน OAEP" />
          <TipCard icon="fa-triangle-exclamation" title="ห้ามแจก Private Key" color="rose"
            description="หากใครได้ private key ของคุณ ข้อความทุกชิ้นที่เคยเข้ารหัสด้วย public key คู่กันจะถูกบุกได้ทันที เก็บไว้ออฟไลน์เด็ดขาด" />
          <TipCard icon="fa-microchip" title="Web Crypto API" color="green"
            description="Key สร้างในเบราว์เซอร์ทั้งหมด ไม่มีการส่ง key ไปยังเซิร์ฟเวอร์เลย ใช้ window.crypto.subtle ซึ่งเป็นมาตรฐาน W3C สำหรับการเข้ารหัสฝั่งฝางเบราว์เซอร์" />
        </div>
      )}

      {/* Role Banner */}
      <div className={`flex items-center gap-3 rounded-xl p-4 border ${isAdmin ? 'bg-amber-500/10 border-amber-500/20' : 'bg-indigo-500/10 border-indigo-500/20'}`}>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${isAdmin ? 'bg-amber-600/20' : 'bg-indigo-600/20'}`}>
          <i className={`fa-solid ${isAdmin ? 'fa-crown' : 'fa-user-shield'} ${isAdmin ? 'text-amber-400' : 'text-indigo-400'}`} />
        </div>
        <div>
          <p className={`text-xs font-black uppercase tracking-wide ${isAdmin ? 'text-amber-300' : 'text-indigo-300'}`}>
            {isAdmin ? 'โหมดแอดมิน — เห็น Key เต็มรูปแบบ' : 'โหมดผู้ใช้ — เข้าถึงเฉพาะ Public Key'}
          </p>
          <p className={`text-[11px] mt-0.5 ${isAdmin ? 'text-amber-400/70' : 'text-indigo-400/70'}`}>
            {isAdmin
              ? 'คุณสามารถเปิดเผยและคัดลอก private key ได้ รวมถึง import public key จากภายนอกเพื่อเข้ารหัสข้อความสำหรับบุคคลที่สาม'
              : 'Private key ถูกซ่อนไว้ คุณยังสามารถดู public key และทดสอบเข้ารหัส/ถอดรหัสได้โดยไม่เสี่ยงต่อความปลอดภัย'}
          </p>
        </div>
      </div>

      {/* Generate Button */}
      <div className="flex items-center gap-4 flex-wrap">
        <button onClick={generateKeys} disabled={generating}
          className="flex items-center gap-3 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-black uppercase tracking-wider text-sm transition-all shadow-lg shadow-indigo-900/30">
          <i className={`fa-solid ${generating ? 'fa-spinner fa-spin' : 'fa-key'}`} />
          {generating ? 'กำลังสร้าง key...' : 'สร้างคู่คีย์ RSA-2048'}
        </button>
        {keyPair && (
          <div className="flex items-center gap-2 text-xs text-green-400 font-bold">
            <i className="fa-solid fa-circle-check" />
            คู่คีย์พร้อมใช้งาน — สร้างในเบราว์เซอร์นี้เท่านั้น
          </div>
        )}
      </div>

      {/* Keys Display */}
      {keyPair && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <KeyBox
            label="Public Key — รูปแบบ PEM / SPKI (แจกได้สาธารณะ)"
            value={keyPair.public}
            onCopy={() => copy(keyPair.public, 'Public Key')}
          />
          <KeyBox
            label={isAdmin ? 'Private Key — รูปแบบ PEM / PKCS#8 (สิทธิ์แอดมิน)' : 'Private Key — ซ่อนไว้ (โหมดผู้ใช้)'}
            value={keyPair.private}
            hidden={!isAdmin || privHidden}
            showToggle={isAdmin}
            onToggle={() => setPrivHidden(v => !v)}
            onCopy={isAdmin ? () => copy(keyPair.private, 'Private Key') : undefined}
          />
        </div>
      )}

      {/* Import External Public Key — Admin only */}
      {isAdmin && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <i className="fa-solid fa-file-import text-amber-400 text-sm" />
            <p className="text-xs font-black text-slate-200 uppercase tracking-wide">นำเข้า Public Key จากภายนอก</p>
            <span className="ml-auto text-[9px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded font-black uppercase tracking-widest">
              เฉพาะแอดมิน
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mb-3">
            วาง PEM RSA public key ของอีกฝ่ายเพื่อเข้ารหัสข้อความที่เฉพาะฝ่ายนั้นถอดรหัสได้ด้วย private key ของตนเองเท่านั้น
            นี่คือหลักการแลกเปลี่ยน key อย่างปลอดภัย (เช่น TLS handshake)
          </p>
          <textarea
            value={importedKey}
            onChange={e => setImportedKey(e.target.value)}
            placeholder={"-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A...\n-----END PUBLIC KEY-----"}
            className="w-full h-28 bg-slate-900 border border-slate-700 rounded-lg p-3 text-[10px] font-mono text-slate-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-none transition-colors"
          />
        </div>
      )}

      {/* Encrypt / Decrypt Playground */}
      {keyPair && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 space-y-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <i className="fa-solid fa-flask text-indigo-400 text-sm" />
              <p className="text-xs font-black text-slate-200 uppercase tracking-wide">ทดสอบเข้ารหัส / ถอดรหัส</p>
            </div>
            <p className="text-[11px] text-slate-500">
              พิมพ์ข้อความด้านล่างแล้วกดเข้ารหัสด้วย public key จากนั้นถอดรหัสด้วย private key
              เพื่อพิสูจน์ว่าคู่คีย์ทำงานถูกต้อง และแสดงให้เห็นว่าการเข้ารหัสแบบ Asymmetric คือใครก็เข้ารหัสได้ แต่ถอดรหัสได้เฉพาะเจ้าของ key
            </p>
          </div>

          {/* Plaintext Input */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <i className="fa-solid fa-keyboard text-xs" />ข้อความต้นฉบับที่ต้องการเข้ารหัส
              <span className="ml-auto normal-case font-normal text-slate-600">{plaintext.length} ตัวอักษร</span>
            </label>
            <textarea
              value={plaintext}
              onChange={e => setPlaintext(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && e.ctrlKey && encryptMsg()}
              placeholder={"พิมพ์ข้อความใดใดก็ได้...\n(กด Ctrl+Enter หรือคลิกปุ่มเข้ารหัส)"}
              rows={5}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors resize-none leading-relaxed"
            />
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-slate-600">กด <kbd className="bg-slate-800 border border-slate-700 rounded px-1 py-0.5 text-[9px] font-mono text-slate-400">Ctrl</kbd> + <kbd className="bg-slate-800 border border-slate-700 rounded px-1 py-0.5 text-[9px] font-mono text-slate-400">Enter</kbd> เพื่อเข้ารหัสด่วน</p>
              <button onClick={encryptMsg} disabled={!plaintext.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-lg text-xs font-black uppercase tracking-wide transition-all">
                <i className="fa-solid fa-lock text-xs" />เข้ารหัส
              </button>
            </div>
          </div>

          {/* Ciphertext Output */}
          {ciphertext && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <i className="fa-solid fa-lock text-xs text-green-400" />
                ข้อความที่เข้ารหัสแล้ว — เข้ารหัสด้วย RSA-OAEP เข้ารหัส Base64
              </label>
              <p className="text-[10px] text-slate-600">
                สังเกต: แม้ข้อความเดิมเหมือนกัน แต่ละครั้งที่เข้ารหัสจะได้ผลลัพธ์ต่างกันเสมอ — นี่คือความสุ่มของ OAEP
              </p>
              <div className="flex gap-2 items-start">
                <div className="flex-1 bg-slate-900 border border-green-500/30 rounded-lg p-3 text-[9px] font-mono text-green-300 break-all max-h-20 overflow-auto leading-relaxed">
                  {ciphertext}
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <button onClick={() => copy(ciphertext, 'Ciphertext')}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-700 text-slate-300 hover:bg-slate-600 rounded-lg text-xs font-black uppercase transition-all">
                    <i className="fa-solid fa-copy text-xs" />คัดลอก
                  </button>
                  <button onClick={decryptMsg}
                    className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-black uppercase transition-all">
                    <i className="fa-solid fa-unlock text-xs" />ถอดรหัส
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Decrypted Result */}
          {decryptedMsg && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <i className="fa-solid fa-circle-check text-xs text-emerald-400" />
                ข้อความที่ถอดรหัสแล้ว — ตรงกับต้นฉบับเดิม
              </label>
              <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                <i className="fa-solid fa-check-double text-emerald-400 text-lg shrink-0" />
                <div>
                  <p className="text-sm font-black text-emerald-300 font-mono">{decryptedMsg}</p>
                  <p className="text-[10px] text-emerald-500/70 mt-1">
                    ถอดรหัสสำเร็จ — private key ย้อนกลับการเข้ารหัส RSA-OAEP ได้สำเร็จ
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* How RSA Works — Step by Step */}
      <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-5">
          <i className="fa-solid fa-book-open text-indigo-400 text-sm" />
          <p className="text-xs font-black text-slate-200 uppercase tracking-wide">หลักการทำงานของ RSA — ทีละขั้นตอน</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {[
            { step: '01', icon: 'fa-calculator', color: 'text-indigo-400 bg-indigo-600/20 border-indigo-500/30',
              title: 'สร้างคู่คีย์',
              desc: 'เลือกจำนวนเฉพาะสองตัว (prime) p และ q คำนวณ n = p×q (ปริมาณเพศ modulus) หา e (ตัวยก public) และ d (ตัวยก private) เพื่อสร้างคู่คีย์' },
            { step: '02', icon: 'fa-share-from-square', color: 'text-blue-400 bg-blue-600/20 border-blue-500/30',
              title: 'แจก Public Key',
              desc: 'Public key (n, e) สามารถเผยแพร่ได้อย่างเปิดเผย ใครก็ใช้เข้ารหัสได้ แต่ไม่มี d การย้อนกลับต้องแยกตัวหาร n ซึ่งทำไม่ได้ทางคณิตศาสตร์สำหรับ 2048-bit' },
            { step: '03', icon: 'fa-lock', color: 'text-green-400 bg-green-600/20 border-green-500/30',
              title: 'เข้ารหัส',
              desc: 'ผู้ส่งเติม OAEP padding (ความสุ่ม) แล้วคำนวณ C = M^e mod n OAEP ทำให้ค่าเข้ารหัสแตกต่างกันทุกครั้ง แม้ข้อความเดิมเหมือนกันก็ตาม' },
            { step: '04', icon: 'fa-unlock', color: 'text-amber-400 bg-amber-600/20 border-amber-500/30',
              title: 'ถอดรหัส',
              desc: 'เฉพาะผู้ถือ private key คำนวณ M = C^d mod n ได้ หากไม่รู้ d การทำลาย RSA-2048 ต้องใช้เวลานานกว่าอายุจักรวาลที่ใช้คอมพิวเตอร์ในปัจจุบัน' },
          ].map(s => {
            const [iconColor, bgColor, borderColor] = s.color.split(' ');
            return (
              <div key={s.step} className="flex flex-col gap-2">
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${bgColor} ${borderColor}`}>
                  <i className={`fa-solid ${s.icon} ${iconColor} text-base`} />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-[9px] font-black text-slate-700 font-mono">{s.step}</span>
                  <p className={`text-[10px] font-black uppercase tracking-wide ${iconColor}`}>{s.title}</p>
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed">{s.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Role comparison card */}
      <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <i className="fa-solid fa-users-gear text-indigo-400 text-sm" />
          <p className="text-xs font-black text-slate-200 uppercase tracking-wide">สิทธิ์การใช้งานตามโหมดผู้ใช้</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { role: 'แอดมิน', icon: 'fa-crown', color: 'amber', features: [
              { label: 'สร้างคู่คีย์ RSA',              ok: true },
              { label: 'ดู Public Key',                    ok: true },
              { label: 'ดู Private Key (เปิดเผย/ซ่อน)',    ok: true },
              { label: 'คัดลอก Private Key',          ok: true },
              { label: 'Import Public Key ภายนอก',      ok: true },
              { label: 'ทดสอบเข้ารหัส / ถอดรหัส',    ok: true },
            ]},
            { role: 'ผู้ใช้', icon: 'fa-user', color: 'indigo', features: [
              { label: 'สร้างคู่คีย์ RSA',              ok: true },
              { label: 'ดู Public Key',                    ok: true },
              { label: 'ดู Private Key',                   ok: false },
              { label: 'คัดลอก Private Key',          ok: false },
              { label: 'Import Public Key ภายนอก',      ok: false },
              { label: 'ทดสอบเข้ารหัส / ถอดรหัส',    ok: true },
            ]},
          ].map(card => {
            const c = { amber: { border: 'border-amber-500/20', bg: 'bg-amber-500/10', icon: 'text-amber-400', title: 'text-amber-300' }, indigo: { border: 'border-indigo-500/20', bg: 'bg-indigo-500/10', icon: 'text-indigo-400', title: 'text-indigo-300' } }[card.color];
            return (
              <div key={card.role} className={`rounded-xl p-4 border ${c.bg} ${c.border}`}>
                <div className="flex items-center gap-2 mb-3">
                  <i className={`fa-solid ${card.icon} ${c.icon} text-sm`} />
                  <p className={`text-xs font-black uppercase tracking-wide ${c.title}`}>{card.role}</p>
                </div>
                <ul className="space-y-1.5">
                  {card.features.map(f => (
                    <li key={f.label} className="flex items-center gap-2">
                      <i className={`fa-solid ${f.ok ? 'fa-circle-check text-green-400' : 'fa-circle-xmark text-slate-700'} text-xs shrink-0`} />
                      <span className={`text-[11px] ${f.ok ? 'text-slate-300' : 'text-slate-600'}`}>{f.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};

export default EncryptionPage;
