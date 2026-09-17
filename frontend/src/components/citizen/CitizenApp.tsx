import React, { useState } from 'react';
import {
  AlertTriangle, ShieldCheck, Navigation, PhoneCall, Globe, Radio,
  Heart, CheckCircle2, Bell, MapPin, Users, Volume2,
} from 'lucide-react';
import { Shelter, PublicAlert } from '../../types';

interface CitizenAppProps {
  shelters: Shelter[];
  alerts: PublicAlert[];
  onTriggerSOS: (details: { name: string; phone: string; trappedCount: number; urgency: string; notes: string }) => void;
}

const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
  { code: 'te', label: 'Telugu', native: 'తెలుగు' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
  { code: 'mr', label: 'Marathi', native: 'मराठी' },
  { code: 'bn', label: 'Bengali', native: 'বাংলা' },
  { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'ml', label: 'Malayalam', native: 'മലയാളം' },
  { code: 'gu', label: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'or', label: 'Odia', native: 'ଓଡ଼ିଆ' },
  { code: 'pa', label: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
  { code: 'ur', label: 'Urdu', native: 'اردو' },
];

export const CitizenApp: React.FC<CitizenAppProps> = ({ shelters, alerts, onTriggerSOS }) => {
  const [selectedLang, setSelectedLang] = useState('en');
  const [sosSent, setSosSent] = useState(false);
  const [familyMarkedSafe, setFamilyMarkedSafe] = useState(false);
  const [citizenName, setCitizenName] = useState('Govindappa');
  const [citizenPhone, setCitizenPhone] = useState('+91 97000 11234');
  const [trappedCount, setTrappedCount] = useState(3);
  const [urgency, setUrgency] = useState('FLOOD_RISING');
  const [notes] = useState('Water rising rapidly on ground floor. Moved to terrace with 1 elderly person.');

  const nearestShelter = shelters[0] ?? {
    name: 'North Highland Multi-Purpose Cyclone & Flood Shelter',
    capacity: 1500, currentOccupancy: 840, contactPhone: '+91 94401 22891',
  } as Shelter;

  const handleSOSSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onTriggerSOS({ name: citizenName, phone: citizenPhone, trappedCount, urgency, notes });
    setSosSent(true);
  };

  const t = (() => {
    switch (selectedLang) {
      case 'hi': return { header: 'राष्ट्रीय आपदा प्रबंधन नागरिक सुरक्षा पोर्टल', dangerTitle: 'खतरा स्तर: अति गंभीर (लेवल 4)', dangerDesc: 'कृष्णा नदी का जलस्तर खतरे के निशान से ऊपर है। आपके स्थान से 180 मीटर पर बाढ़ भर रही है।', evacTitle: 'निकटतम सुरक्षित राहत शिविर', sosTitle: 'आपातकालीन सहायता (1-टैप SOS)', helplineTitle: 'आपातकालीन हेल्पलाइन नंबर' };
      case 'te': return { header: 'విపత్తు నిర్వహణ పౌర భద్రతా పోర్టల్', dangerTitle: 'ప్రమాద స్థాయి: తీవ్ర హెచ్చరిక (లెవల్ 4)', dangerDesc: 'కృష్ణా నది నీటిమట్టం ప్రమాద స్థాయిని దాటింది. మీ ప్రాంతానికి సమీపంలో వరద నీరు చేరుతోంది.', evacTitle: 'సమీప సురక్షిత సహాయ పునరావాస కేంద్రం', sosTitle: 'అత్యవసర సహాయం (1-ట్యాప్ SOS)', helplineTitle: 'అత్యవసర హెల్ప్‌లైన్ నంబర్లు' };
      case 'ta': return { header: 'பேரிடர் மேலாண்மை குடிமக்கள் பாதுகாப்பு போர்டல்', dangerTitle: 'அபாய நிலை: மிக தீவிரம் (நிலை 4)', dangerDesc: 'கிருஷ்ணா நதி நீர்மட்டம் அபாய அளவை தாண்டியுள்ளது.', evacTitle: 'அருகிலுள்ள பாதுகாப்பான நிவாரண முகாம்', sosTitle: 'அவசர உதவி (1-தட்டு SOS)', helplineTitle: 'அவசர உதவி எண்கள்' };
      case 'mr': return { header: 'आपत्ती व्यवस्थापन नागरिक सुरक्षा पोर्टल', dangerTitle: 'धोका पातळी: अति गंभीर (लेव्हल 4)', dangerDesc: 'कृष्णा नदीने धोक्याची पातळी ओलांडली आहे.', evacTitle: 'जवळचे सुरक्षित मदत केंद्र', sosTitle: 'तातडीची मदत (1-टॅप SOS)', helplineTitle: 'आपत्कालीन हेल्पलाइन क्रमांक' };
      case 'bn': return { header: 'দুর্যোগ ব্যবস্থাপনা নাগরিক সুরক্ষা পোর্টাল', dangerTitle: 'বিপদ স্তর: অতি মারাত্মক (লেভেল ৪)', dangerDesc: 'কৃষ্ণা নদীর জল বিপদসীমার উপর দিয়ে প্রবাহিত হচ্ছে।', evacTitle: 'নিকটতম নিরাপদ আশ্রয়কেন্দ্র', sosTitle: 'জরুরি সহায়তা (১-ট্যাপ এসওএস)', helplineTitle: 'জরুরি হেল্পলাইন নম্বর' };
      default: return { header: 'National Disaster Management Citizen Safety Portal', dangerTitle: 'Hazard Level: Level 4 · Critical', dangerDesc: 'Krishna River gauge has crossed the Danger Mark (4.82 m). Severe surge detected 180 m from your location.', evacTitle: 'Nearest safe haven', sosTitle: 'Emergency rescue request', helplineTitle: '24×7 emergency helplines' };
    }
  })();

  return (
    <div className="mx-auto max-w-[720px] space-y-4" style={{ animation: 'fadeUp .36s var(--ease-out) both' }}>
      {/* Intro */}
      <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--accent)] text-white shadow-sm"><ShieldCheck className="h-5 w-5" /></span>
          <div>
            <h2 className="text-[14px] font-extrabold tracking-tight text-[var(--ink)]">{t.header}</h2>
            <p className="text-[11px] text-[var(--ink-3)]">Citizen safety · shelters · SOS beacon — demo data</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-white px-2.5 py-1 text-[11px] font-semibold text-[var(--ink-2)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--ok)] animate-pulse" /> Live — sector 4
        </span>
      </div>

      {/* Language */}
      <div className="card flex items-center justify-between gap-3 p-3 sm:p-4">
        <span className="inline-flex items-center gap-2 text-[12px] font-semibold text-[var(--ink-2)]">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--accent)]"><Globe className="h-3.5 w-3.5" /></span>
          Language / भाषा
        </span>
        <select
          id="select-citizen-language"
          value={selectedLang}
          onChange={(e) => setSelectedLang(e.target.value)}
          className="h-8 rounded-full border border-[var(--line)] bg-white px-3 pr-7 text-[12px] font-semibold text-[var(--ink)] outline-none focus:border-[var(--line-strong)]"
        >
          {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.native} — {l.label}</option>)}
        </select>
      </div>

      {/* Danger banner — muted danger-soft, not neon */}
      <div className="rounded-[16px] border border-[var(--danger-line)] bg-[var(--danger-soft)] p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--danger)] px-2.5 py-1 text-[10px] font-bold tracking-wide text-white">
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" /> LIVE GPS RISK
          </span>
          <span className="font-mono-code text-[11px] text-[var(--ink-3)]">Sector 4 · Lowland plain</span>
        </div>
        <h3 className="mt-3 inline-flex items-center gap-2 text-[15px] font-extrabold tracking-tight text-[var(--danger)]">
          <AlertTriangle className="h-5 w-5" /> {t.dangerTitle}
        </h3>
        <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--ink-2)]">{t.dangerDesc}</p>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--danger-line)] pt-3 font-mono-code text-[11px]">
          <span className="text-[var(--ink-3)]">Inundation <strong className="text-[var(--ink)]">0.6 m/hr</strong></span>
          <span className="rounded-full bg-[var(--danger)] px-2.5 py-1 text-[11px] font-bold text-white">Evacuate immediately</span>
        </div>
      </div>

      {/* Shelter */}
      <div className="card p-4 sm:p-5 space-y-3">
        <h4 className="inline-flex items-center gap-1.5 text-[12px] font-bold tracking-wide text-[var(--ink)]">
          <Navigation className="h-4 w-4 text-[var(--ink-3)]" /> {t.evacTitle}
        </h4>
        <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-subtle)] p-4 space-y-2.5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h5 className="text-[13px] font-bold leading-tight text-[var(--ink)]">{nearestShelter.name}</h5>
              <p className="mt-1 text-[11px] text-[var(--ink-3)]">1.4 km north · ~18 min via Elevated Bridge · {nearestShelter.code ?? 'SH-01'}</p>
            </div>
            <span className="shrink-0 rounded-full border border-[var(--ok-line)] bg-[var(--ok-soft)] px-2.5 py-1 font-mono-code text-[11px] font-bold text-[var(--ok)]">SAFE</span>
          </div>
          <p className="rounded-lg border border-[var(--info-line)] bg-[var(--info-soft)] px-3 py-2 text-[12px] leading-relaxed text-[var(--ink-2)]">
            Recommended corridor: <strong className="text-[var(--ink)]">Sector 4 North Overbridge</strong> (rd-02). Avoid Embankment Road — liable to flood.
          </p>
          <div className="flex items-center justify-between gap-2 pt-1">
            <span className="text-[12px] text-[var(--ink-3)]">Officer <strong className="text-[var(--ink)] font-mono-code">{(nearestShelter as any).contactPhone ?? '+91 94401 22891'}</strong></span>
            <a
              data-cursor="hover"
              href={`tel:${(nearestShelter as any).contactPhone ?? '+919440122891'}`}
              className="inline-flex items-center gap-1.5 rounded-full bg-[var(--ok)] px-3.5 py-1.5 text-[12px] font-semibold text-white shadow-sm hover:opacity-95 active:scale-[.985]"
            >
              <PhoneCall className="h-3.5 w-3.5" /> Call
            </a>
          </div>
        </div>
        {alerts[0] && (
          <p className="flex items-start gap-2 rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-[11px] leading-relaxed text-[var(--ink-3)]">
            <Bell className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--ink-3)]" />
            Latest SACHET: <span className="font-semibold text-[var(--ink)]">{alerts[0].title}</span>
          </p>
        )}
      </div>

      {/* SOS */}
      <div className="card p-4 sm:p-5 space-y-3">
        <h4 className="inline-flex items-center gap-1.5 text-[12px] font-bold tracking-wide text-[var(--ink)]">
          <Radio className="h-4 w-4 text-[var(--danger)]" /> {t.sosTitle}
        </h4>
        {sosSent ? (
          <div className="rounded-xl border border-[var(--ok-line)] bg-[var(--ok-soft)] p-6 text-center">
            <CheckCircle2 className="mx-auto h-8 w-8 text-[var(--ok)]" />
            <h5 className="mt-2 text-[14px] font-bold text-[var(--ink)]">SOS recorded</h5>
            <p className="mx-auto mt-1 max-w-[36ch] text-[12px] leading-relaxed text-[var(--ink-2)]">
              Your request was recorded in this demo and appears on the command map. Keep your phone available and move to higher ground if conditions worsen.
            </p>
            <button
              data-cursor="hover"
              onClick={() => setSosSent(false)}
              className="mt-3 rounded-full border border-[var(--line)] bg-white px-4 py-1.5 text-[12px] font-semibold text-[var(--ink-2)] hover:text-[var(--ink)] active:scale-[.985]"
            >
              Send another
            </button>
          </div>
        ) : (
          <form onSubmit={handleSOSSubmit} className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="space-y-1">
                <span className="text-[11px] font-semibold tracking-wide text-[var(--ink-3)]">Your name</span>
                <input value={citizenName} onChange={(e) => setCitizenName(e.target.value)} required className="h-9 w-full rounded-full border border-[var(--line)] bg-white px-3 text-[13px] text-[var(--ink)] outline-none focus:border-[var(--line-strong)]" />
              </label>
              <label className="space-y-1">
                <span className="text-[11px] font-semibold tracking-wide text-[var(--ink-3)]">Mobile</span>
                <input type="tel" value={citizenPhone} onChange={(e) => setCitizenPhone(e.target.value)} required className="h-9 w-full rounded-full border border-[var(--line)] bg-white px-3 text-[13px] text-[var(--ink)] outline-none focus:border-[var(--line-strong)]" />
              </label>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="space-y-1">
                <span className="text-[11px] font-semibold tracking-wide text-[var(--ink-3)]">Trapped persons</span>
                <input type="number" min={1} max={20} value={trappedCount} onChange={(e) => setTrappedCount(parseInt(e.target.value) || 1)} className="h-9 w-full rounded-full border border-[var(--line)] bg-white px-3 text-[13px] text-[var(--ink)] outline-none focus:border-[var(--line-strong)]" />
              </label>
              <label className="space-y-1">
                <span className="text-[11px] font-semibold tracking-wide text-[var(--ink-3)]">Situation</span>
                <select value={urgency} onChange={(e) => setUrgency(e.target.value)} className="h-9 w-full rounded-full border border-[var(--line)] bg-white px-3 text-[13px] text-[var(--ink)] outline-none focus:border-[var(--line-strong)]">
                  <option value="FLOOD_RISING">Water rising rapidly</option>
                  <option value="CHILDREN_ELDERLY">Infants / elderly present</option>
                  <option value="CRITICAL_INJURY">Severe injury / fracture</option>
                  <option value="OXYGEN_NEEDED">Oxygen / life support</option>
                </select>
              </label>
            </div>
            <button
              id="btn-submit-sos"
              data-cursor="hover"
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[var(--danger)] px-4 py-3 text-[13px] font-bold tracking-wide text-white shadow-sm hover:opacity-95 active:scale-[.985]"
            >
              <Radio className="h-4 w-4" /> Broadcast emergency SOS
            </button>
            <p className="text-center text-[11px] text-[var(--ink-4)]">Uses LoRa mesh when mobile network is down · demo only</p>
          </form>
        )}
      </div>

      {/* Family safety + helplines */}
      <div className="card p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h4 className="inline-flex items-center gap-1.5 text-[12px] font-bold tracking-wide text-[var(--ink)]">
            <Heart className="h-4 w-4 text-[var(--ink-3)]" /> Family safety
          </h4>
          <button
            data-cursor="hover"
            onClick={() => setFamilyMarkedSafe(!familyMarkedSafe)}
            className={`rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-colors active:scale-[.985] ${familyMarkedSafe ? 'bg-[var(--ok)] text-white shadow-sm' : 'border border-[var(--line)] bg-white text-[var(--ink-2)] hover:text-[var(--ink)]'}`}
          >
            {familyMarkedSafe ? '✓ Marked safe' : 'Mark myself safe'}
          </button>
        </div>
        <div className="border-t border-[var(--line)] pt-4">
          <span className="block font-mono-code text-[11px] font-semibold tracking-wide text-[var(--ink-3)]">{t.helplineTitle}</span>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {[
              { label: 'NDRF disaster help', num: '1078' },
              { label: 'Medical ambulance', num: '108' },
              { label: 'National emergency', num: '112' },
              { label: 'District control', num: '1077' },
            ].map((h) => (
              <a
                key={h.num}
                href={`tel:${h.num}`}
                data-cursor="hover"
                className="flex items-center justify-between rounded-xl border border-[var(--line)] bg-[var(--bg-subtle)] px-3 py-2.5 text-[12px] transition-colors hover:border-[var(--line-strong)] hover:bg-white active:scale-[.98]"
              >
                <span className="font-medium text-[var(--ink-2)]">{h.label}</span>
                <strong className="font-mono-code text-[13px] font-bold text-[var(--accent)]">{h.num}</strong>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
