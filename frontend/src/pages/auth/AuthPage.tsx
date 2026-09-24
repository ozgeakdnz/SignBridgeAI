import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

type Mode = 'giris' | 'kaydol'
type LegalId = 'sozlesme' | 'kvkk' | 'riza' | 'gizlilik'

const LEGAL: Record<LegalId, { title: string; body: string }> = {
  sozlesme: {
    title: 'SignBridge AI Kullanıcı Sözleşmesi',
    body: `1. Taraflar ve Konu
Bu sözleşme, SignBridge AI platformunu (bundan böyle "Platform" veya "Uygulama" olarak anılacaktır) işleten şirket/girişim ile Platform’a üye olan veya kullanan kişi ("Kullanıcı") arasında, Platform'un kullanım şartlarını, tarafların hak ve yükümlülüklerini düzenlemek amacıyla akdedilmiştir. Kullanıcı, uygulamaya kayıt olarak veya uygulamayı kullanarak bu sözleşmenin tüm şartlarını kabul etmiş sayılır.

2. Hizmetin Kapsamı ve Modeller
SignBridge AI; işitme engelli bireyler ve yakınları için yapay zeka destekli anlık Türk İşaret Dili (TİD) - Türkçe çevirisi, çevresel ses/alarm algılama ("Güvenlik" modülü) ve acil durum iletişim desteği ("Yakınlarım" modülü) sunan bir teknoloji platformudur.

Ücretsiz (Freemium) Kullanım: Temel iletişim özelliklerini kapsar.

Aile Paketi: Belirlenen ücret mukabilinde bir ana kullanıcı ve dört yakınının sisteme entegre edilmesini, gelişmiş güvenlik ve erişilebilirlik özelliklerinin kullanılmasını sağlar.

Askıda Abonelik: Bireysel veya kurumsal sponsorlar tarafından satın alınan ve ihtiyaç sahibi işitme engelli bireylere dernekler aracılığıyla ücretsiz tahsis edilen kullanım modelidir.

3. Kullanım Koşulları ve Sorumluluk Reddi

Tıbbi/Resmi Uyarı: SignBridge AI bir tıbbi cihaz veya resmi bir acil durum/112 hizmeti değildir. "Güvenlik" modülü kapsamındaki çevresel ses, zil veya alarm uyarıları yalnızca destekleyici farkındalık amaçlıdır. Uygulamanın teknik aksaklıklar, internet kesintisi veya yapay zeka yanılma payları nedeniyle bir alarmı kaçırmasından doğabilecek can veya mal kayıplarından SignBridge AI sorumlu tutulamaz. Hayati tehlike arz eden durumlarda resmi acil servisler aranmalıdır.

Kullanıcı, "Köprü" ve "Güvenlik" modüllerinin çalışabilmesi için cihazının kamera ve mikrofon donanımlarına erişim izni vermesi gerektiğini kabul eder.

Platform üzerinde hukuka aykırı, üçüncü kişilerin gizliliğini ihlal eden veya telif haklarına aykırı içerik üretilmesi yasaktır.`,
  },
  kvkk: {
    title: 'KVKK Aydınlatma Metni',
    body: `1. Veri Sorumlusu
6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca kişisel verileriniz; veri sorumlusu sıfatıyla SignBridge AI tarafından aşağıda açıklanan kapsamda işlenebilecektir.

2. İşlenen Kişisel Veriler ve İşlenme Amaçları
Platform'un sunduğu hizmetlerden faydalanabilmeniz için aşağıdaki verileriniz işlenmektedir:

Kimlik ve İletişim Verileri: Ad, soyad, e-posta, telefon numarası (Kullanıcı hesabı oluşturmak, Yakınlarım modülüne kişi eklemek ve Askıda Abonelik eşleştirmeleri için).

Görsel ve İşitsel Veriler: Kamera ve mikrofon kayıtları (Yalnızca "Köprü" modülünde anlık işaret dili çevirisi yapmak ve "Güvenlik" modülünde çevresel alarmları algılamak amacıyla anlık olarak işlenir).

Özel Nitelikli Kişisel Veriler: İşitme engellilik durumu/sağlık verisi (Uygulamanın hedef kitlesine uygun hizmet verebilmesi, profil optimizasyonu ve Askıda Abonelik modelinden yararlanma uygunluğunun teyidi için).

Finansal Veriler: Abonelik işlemleri için (Kredi kartı bilgileri tarafımızca tutulmaz, lisanslı ödeme kuruluşları altyapısında işlenir).

3. İşlemenin Hukuki Sebebi ve Aktarım
Verileriniz; KVKK Madde 5/2 uyarınca "Sözleşmenin kurulması veya ifası", "Veri sorumlusunun hukuki yükümlülüğünü yerine getirebilmesi" ve "İlgili kişinin temel hak ve özgürlüklerine zarar vermemek kaydıyla meşru menfaat" hukuki sebeplerine dayalı olarak; özel nitelikli kişisel verileriniz ise KVKK Madde 6 uyarınca yalnızca "Açık Rıza" hukuki sebebine dayalı olarak işlenmektedir. Yapay zeka modellerimizin çalışabilmesi için anlık veri işleme süreçleri şifrelenmiş bulut sunucularında gerçekleştirilmekte olup, verileriniz yasal zorunluluklar haricinde üçüncü şahıslara satılmaz veya pazarlama amacıyla paylaşılmaz.

4. İlgili Kişi Hakları
KVKK'nın 11. maddesi uyarınca; verilerinizin işlenip işlenmediğini öğrenme, amacına uygun kullanılıp kullanılmadığını bilme, eksik/yanlış işlenmişse düzeltilmesini isteme ve silinmesini talep etme haklarına sahipsiniz.`,
  },
  riza: {
    title: 'Açık Rıza Metni',
    body: `SignBridge AI platformunu kullanırken, tarafıma sunulan "KVKK Aydınlatma Metni"ni okuduğumu, anladığımı ve haklarım konusunda bilgilendirildiğimi beyan ederim. Bu kapsamda;

Uygulamanın temel işlevi olan işaret dili çevirisi ve sesli iletişim hizmetlerinden yararlanabilmem için cihazımın kamera ve mikrofon donanımları aracılığıyla toplanan görsel ve işitsel verilerimin yapay zeka modelleri tarafından anlık olarak işlenmesine,

Çevresel ses farkındalığı (alarm, zil, tehlike uyarıları) sağlanabilmesi amacıyla ortam seslerinin anlık olarak analiz edilmesine,

Uygulamayı kullanım amacıma bağlı olarak "işitme engelli birey" statümün (Özel Nitelikli Kişisel Veri / Sağlık Verisi) sistemde kayıtlı tutulmasına ve Askıda Abonelik veya Topluluk modülü eşleştirmelerinde kullanılmasına,

"Yakınlarım" modülüne eklediğim kişilerle acil durumlarda konum veya durum bilgimin paylaşılmasına,

Çeviri ve analiz kalitesinin artırılması amacıyla söz konusu verilerimin ulusal/uluslararası güvenlik standartlarına sahip bulut altyapılarında (sunucularda) şifrelenmiş olarak işlenmesine,

Kendi özgür irademle, hiçbir baskı altında kalmadan açık rıza veriyorum.`,
  },
  gizlilik: {
    title: 'Gizlilik Politikası',
    body: `1. Veri Güvenliği ve Altyapı
SignBridge AI, kullanıcılarının kişisel gizliliğini en üst düzeyde korumayı taahhüt eder. Uygulama üzerinden iletilen tüm görsel (işaret dili görüntüleri) ve işitsel (ortam sesleri ve konuşmalar) veriler, uçtan uca şifreleme ve modern kriptografik yöntemlerle korunmaktadır. Sistemimize iletilen anlık çeviri verileri, yapay zeka modelinin çeviri işlemini tamamlamasının ardından kalıcı olarak saklanmaz; yalnızca hizmetin ifası anında RAM (geçici bellek) üzerinde işlenir ve anonimleştirilir.

2. Model Eğitimi ve Anonimleştirme
Kullanıcıların kamera ve mikrofonlarından alınan veriler, kullanıcıların açık ve yazılı izni (ayrıca sunulan geliştirici katkı onayı) olmaksızın SignBridge AI yapay zeka modellerinin genel eğitiminde kullanılamaz. Eğitim amacıyla kullanılacak veriler tamamen kimliksizleştirilir ve kişiyi belirlenebilir kılan hiçbir unsur (yüz hatları, spesifik mekan sesleri vb.) barındırmaz.

3. Üçüncü Taraf Entegrasyonları ve Çerezler (Cookies)
Uygulama deneyimini iyileştirmek, ödeme süreçlerini yönetmek (örn. lisanslı ödeme altyapıları) ve uygulama içi hataları takip etmek amacıyla güvenilir üçüncü taraf hizmet sağlayıcılarla çalışmaktayız. Web sitemizde (Landing Page) ve platformumuzda, oturum yönetimi ve kullanım istatistiklerinin analizi için zorunlu ve performans çerezleri kullanılmaktadır. Kullanıcılar, cihaz ayarları üzerinden çerez tercihlerini diledikleri zaman yönetebilirler.

4. Çocukların Gizliliği
SignBridge AI, 18 yaş altı kullanıcıların platformu tek başlarına (velilerinin veya yasal temsilcilerinin onayı olmaksızın) üye olarak kullanmasına izin vermemektedir. Aile Paketi kapsamında hesaba dahil edilen alt kullanıcıların veri güvenliği ve sorumluluğu, ana kullanıcıyı oluşturan yasal temsilciye aittir.

5. Politika Değişiklikleri
SignBridge AI, teknolojik gelişmelere ve yasal mevzuata uyum sağlamak amacıyla işbu Gizlilik Politikası'nda değişiklik yapma hakkını saklı tutar. Yapılacak esaslı değişiklikler, uygulamaya giriş esnasında veya kayıtlı e-posta adresleri üzerinden kullanıcılara bildirilecektir.`,
  },
}

const LEGAL_BUTTONS: { id: LegalId; label: string }[] = [
  { id: 'sozlesme', label: 'Kullanıcı Sözleşmesi' },
  { id: 'kvkk', label: 'KVKK Aydınlatma Metni' },
  { id: 'riza', label: 'Açık Rıza Metni' },
  { id: 'gizlilik', label: 'Gizlilik Politikası' },
]

const emptyChecks = (): Record<LegalId, boolean> => ({
  sozlesme: false,
  kvkk: false,
  riza: false,
  gizlilik: false,
})

export function AuthPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>('giris')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [checks, setChecks] = useState(emptyChecks)
  const [error, setError] = useState<string | null>(null)
  const [legal, setLegal] = useState<LegalId | null>(null)

  const allChecked = LEGAL_BUTTONS.every((b) => checks[b.id])

  const toggleCheck = (id: LegalId) => {
    setChecks((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const acceptFromModal = () => {
    if (!legal) return
    setChecks((prev) => ({ ...prev, [legal]: true }))
    setLegal(null)
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!email.trim() || !password.trim()) {
      setError('E-posta ve şifre gerekli.')
      return
    }
    if (mode === 'kaydol' && !name.trim()) {
      setError('Ad soyad gerekli.')
      return
    }
    if (!allChecked) {
      setError('Devam etmek için dört yasal metni de işaretleyin.')
      return
    }
    try {
      localStorage.setItem(
        'sb_auth',
        JSON.stringify({
          email: email.trim(),
          name: name.trim() || email.trim(),
          at: Date.now(),
        }),
      )
    } catch {
      // ignore
    }
    navigate('/kopru', { replace: true })
  }

  return (
    <div className="auth-page">
      <style>{authCss}</style>
      <div className="auth-bg" aria-hidden>
        <span className="auth-blob a" />
        <span className="auth-blob b" />
        <span className="auth-blob c" />
      </div>

      <header className="auth-top">
        <Link to="/" className="auth-brand">
          <span className="auth-mark" aria-hidden>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              strokeWidth="1.9"
              strokeLinecap="round"
            >
              <path d="M3 12c1.6-3.4 3.2-3.4 4.8 0s3.2 3.4 4.8 0 3.2-3.4 4.8 0" />
              <path d="M20 7v10" />
            </svg>
          </span>
          SignBridge AI
        </Link>
        <Link to="/" className="auth-back">
          Landing’e dön
        </Link>
      </header>

      <main className="auth-main">
        <div className="auth-card">
          <div className="auth-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'giris'}
              className={mode === 'giris' ? 'on' : ''}
              onClick={() => setMode('giris')}
            >
              Giriş Yap
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'kaydol'}
              className={mode === 'kaydol' ? 'on' : ''}
              onClick={() => setMode('kaydol')}
            >
              Kaydol
            </button>
          </div>

          <h1>{mode === 'giris' ? 'Tekrar hoş geldin' : 'Hesap oluştur'}</h1>
          <p className="auth-lead">
            Girişten sonra Köprü, Güvenlik, Yakınlarım ve Topluluk ekranlarına geçersin.
          </p>

          <form className="auth-form" onSubmit={submit}>
            {mode === 'kaydol' && (
              <label>
                <span>Ad soyad</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Adın Soyadın"
                  autoComplete="name"
                />
              </label>
            )}
            <label>
              <span>E-posta</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@eposta.com"
                autoComplete="email"
              />
            </label>
            <label>
              <span>Şifre</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={mode === 'giris' ? 'current-password' : 'new-password'}
              />
            </label>

            <div className="auth-legal">
              <p className="auth-legal-title">Yasal metinler</p>
              <div className="auth-legal-list">
                {LEGAL_BUTTONS.map((b) => {
                  const on = checks[b.id]
                  return (
                    <div key={b.id} className={`auth-tick-btn ${on ? 'checked' : ''}`}>
                      <button
                        type="button"
                        className="auth-tick"
                        aria-pressed={on}
                        aria-label={`${b.label} onayla`}
                        onClick={() => toggleCheck(b.id)}
                      >
                        {on ? (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                            <path
                              d="M5 12l5 5 9-10"
                              stroke="#fff"
                              strokeWidth="2.6"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        ) : null}
                      </button>
                      <button
                        type="button"
                        className="auth-tick-label"
                        onClick={() => setLegal(b.id)}
                      >
                        {b.label}
                        <span className="auth-tick-hint">Metni oku</span>
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>

            {error && <p className="auth-error">{error}</p>}

            <button type="submit" className="auth-submit" disabled={!allChecked}>
              {mode === 'giris' ? 'Giriş Yap' : 'Kaydol ve devam et'}
            </button>
          </form>
        </div>
      </main>

      {legal && (
        <div
          className="auth-modal-backdrop"
          role="presentation"
          onClick={() => setLegal(null)}
        >
          <div
            className="auth-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="legal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="auth-modal-head">
              <h2 id="legal-title">{LEGAL[legal].title}</h2>
              <button type="button" onClick={() => setLegal(null)} aria-label="Kapat">
                ✕
              </button>
            </div>
            <div className="auth-modal-body">
              {LEGAL[legal].body.split('\n').map((line, i) =>
                line.trim() ? <p key={i}>{line}</p> : <br key={i} />,
              )}
            </div>
            <button type="button" className="auth-submit" onClick={acceptFromModal}>
              Okudum, kabul ediyorum
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const authCss = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@500;600;700&family=Manrope:wght@500;600;700;800&display=swap');

.auth-page{
  --ink:#16305E;--muted:#6B7A97;--blue:#3B6FE0;--blue-dp:#1E4BB8;--sky:#E8F0FE;--line:#E3EBF8;--bg:#F5F8FD;
  min-height:100dvh;background:var(--bg);color:var(--ink);font-family:Manrope,system-ui,sans-serif;
  position:relative;overflow-x:hidden;
}
.auth-bg{position:absolute;inset:0;pointer-events:none;overflow:hidden}
.auth-blob{position:absolute;border-radius:999px;opacity:.55}
.auth-blob.a{width:420px;height:420px;left:-140px;top:-120px;background:#DCE9FD}
.auth-blob.b{width:280px;height:280px;right:-80px;top:40px;background:#FDEEDC}
.auth-blob.c{width:240px;height:240px;left:40%;bottom:-100px;background:#DDF3EA;opacity:.45}
.auth-top{position:relative;z-index:2;display:flex;align-items:center;justify-content:space-between;
  max-width:520px;margin:0 auto;padding:22px 20px 8px}
.auth-brand{display:inline-flex;align-items:center;gap:10px;text-decoration:none;color:var(--ink);
  font-family:Sora,sans-serif;font-weight:600;font-size:17px}
.auth-mark{width:34px;height:34px;border-radius:12px;background:var(--blue);display:flex;align-items:center;justify-content:center;
  box-shadow:0 8px 18px rgba(59,111,224,.32)}
.auth-back{font-size:14px;font-weight:700;color:var(--muted);text-decoration:none}
.auth-back:hover{color:var(--blue)}
.auth-main{position:relative;z-index:2;display:flex;justify-content:center;padding:12px 20px 40px}
.auth-card{width:100%;max-width:440px;background:#fff;border:1px solid var(--line);border-radius:28px;
  padding:28px 26px 26px;box-shadow:0 18px 44px rgba(22,48,94,.08)}
.auth-tabs{display:grid;grid-template-columns:1fr 1fr;gap:6px;background:var(--sky);border-radius:999px;padding:5px;margin-bottom:20px}
.auth-tabs button{border:0;background:transparent;border-radius:999px;padding:11px 12px;font:inherit;font-weight:700;
  color:var(--muted);cursor:pointer}
.auth-tabs button.on{background:var(--blue);color:#fff;box-shadow:0 8px 18px rgba(59,111,224,.28)}
.auth-card h1{margin:0;font-family:Sora,sans-serif;font-size:28px;letter-spacing:-.03em;color:var(--ink)}
.auth-lead{margin:8px 0 0;font-size:14.5px;line-height:1.55;color:var(--muted)}
.auth-form{display:flex;flex-direction:column;gap:14px;margin-top:22px}
.auth-form label{display:flex;flex-direction:column;gap:6px;font-size:13px;font-weight:700;color:var(--ink)}
.auth-form input[type=email],.auth-form input[type=password],.auth-form input[type=text],.auth-form input:not([type]){
  border:1px solid var(--line);border-radius:14px;padding:13px 14px;font:inherit;font-weight:600;color:var(--ink);
  background:#F7FAFE;outline:none}
.auth-form input:focus{border-color:#9FC0F5;box-shadow:0 0 0 3px rgba(59,111,224,.15)}
.auth-error{margin:0;padding:10px 12px;border-radius:12px;background:#FFE8E6;color:#9B1C1C;font-size:13px;font-weight:700}
.auth-submit{border:0;border-radius:999px;padding:15px 22px;background:var(--blue);color:#fff;font:inherit;font-weight:800;
  cursor:pointer;box-shadow:0 14px 28px rgba(59,111,224,.3)}
.auth-submit:hover{background:var(--blue-dp)}
.auth-submit:disabled{opacity:.45;cursor:not-allowed;box-shadow:none}
.auth-legal{margin-top:4px}
.auth-legal-title{margin:0 0 12px;font-size:12px;letter-spacing:.14em;text-transform:uppercase;font-weight:800;color:var(--ink)}
.auth-legal-list{display:flex;flex-direction:column;gap:10px}
.auth-tick-btn{display:flex;align-items:stretch;gap:0;border-radius:16px;overflow:hidden;
  background:var(--blue);box-shadow:0 10px 22px rgba(59,111,224,.22)}
.auth-tick-btn.checked{background:var(--blue-dp)}
.auth-tick{width:48px;flex-shrink:0;border:0;background:rgba(0,0,0,.12);color:#fff;cursor:pointer;
  display:flex;align-items:center;justify-content:center}
.auth-tick-btn.checked .auth-tick{background:rgba(0,0,0,.2)}
.auth-tick-label{flex:1;border:0;background:transparent;color:#fff;text-align:left;padding:14px 14px 14px 12px;
  font:inherit;font-size:13.5px;font-weight:800;cursor:pointer;display:flex;flex-direction:column;gap:2px;line-height:1.3}
.auth-tick-hint{font-size:11px;font-weight:600;opacity:.85}
.auth-modal-backdrop{position:fixed;inset:0;z-index:50;background:rgba(22,48,94,.45);display:flex;align-items:center;justify-content:center;padding:20px}
.auth-modal{width:min(560px,100%);max-height:min(82dvh,720px);overflow:auto;background:#fff;border-radius:24px;padding:22px;
  box-shadow:0 30px 60px rgba(22,48,94,.25)}
.auth-modal-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:12px}
.auth-modal-head h2{margin:0;font-family:Sora,sans-serif;font-size:18px;line-height:1.3;color:var(--ink)}
.auth-modal-head button{border:0;background:var(--sky);width:34px;height:34px;border-radius:999px;cursor:pointer;font-size:14px;color:var(--ink);flex-shrink:0}
.auth-modal-body{font-size:14px;line-height:1.65;color:var(--muted)}
.auth-modal-body p{margin:0 0 10px}
.auth-modal .auth-submit{width:100%;margin-top:14px}
@media (max-width:480px){
  .auth-top{padding:16px 14px 4px}
  .auth-brand{font-size:15px;gap:8px}
  .auth-main{padding:8px 14px 28px}
  .auth-card{padding:22px 16px 20px;border-radius:22px}
  .auth-card h1{font-size:24px}
  .auth-tick{width:44px}
  .auth-tick-label{font-size:12.5px;padding:12px 12px 12px 10px}
  .auth-modal-backdrop{padding:12px;align-items:flex-end}
  .auth-modal{max-height:min(88dvh,720px);border-radius:20px 20px 12px 12px;padding:18px}
}
`
