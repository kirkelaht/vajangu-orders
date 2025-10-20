# Vajangu Perefarm – Tellimuste halduse MVP

## Ülevaade

Tellimuse voog: **kliendilt → vorm → tellimuste kogutabel → pood → tarnering → klient**  
Eesmärk: koondada kõik tellimused (veeb, telefon, e-post, Facebook) ühte süsteemi, et neid oleks võimalik hallata, töödelda ja analüüsida ühest kohast.  
Kodulehe tellimusvorm lisatakse aadressile [https://perefarm.ee/](https://perefarm.ee/).

---

## Põhireeglid ja protsess

- Ringid seab **Marvi iga kuu 25. kuupäeval** järgmiseks kuuks.
- **Cutoff**: tellimuste vastuvõtt lõpeb **T–2 päeva enne ringi kuupäeva kell 23:59**.
- Pärast cutoff'i:
  - klient **ei saa uut tellimust** teha ega olemasolevat muuta;
  - töötaja saab teha **erandi (rollipõhine override + põhjuse väli)**.
- Kõik tellimused (FB, e-post, telefon, veeb) sisestatakse ühtsesse süsteemi — sama vormi kaudu, millel on kanaliväli (FB / telefon / e-post / veeb).
- Poodi saadetakse automaatselt **koondaruanded**:
  - tootekogused (nt 10 × 1 kg seahakkliha);
  - individuaalsed tellimused peatuse kaupa;
  - korjelehed ja sildid (PDF).
- Poes saab muuta ainult **reaalset väljastatud kogust/kaalu**, mitte kliendi tellitud kogust.
- Arve koostatakse automaatselt ainult **ülekandega maksjatele**.
- Numbriseeria on **järjestikune ja unikaalne kogu ettevõttes** (võib sisaldada eesliidet asukoha koodiga).

---

## Staatused (tellimuse olekuvoog)

`Uus → Vastu võetud → Täitmisel → Valmis väljastuseks → Teel → Kättetoimetatud → Arve saadetud → Tühistatud`

Lubatud üleminekud:

| Praegune | Võimalikud järgmised |
|-----------|----------------------|
| Uus | Vastu võetud, Tühistatud |
| Vastu võetud | Täitmisel, Tühistatud |
| Täitmisel | Valmis väljastuseks, Tühistatud |
| Valmis väljastuseks | Teel, Tühistatud |
| Teel | Kättetoimetatud, Tühistatud |
| Kättetoimetatud | Arve saadetud |
| Arve saadetud | — |
| Tühistatud | — |

> NB! "Saada arve" on **toiming**, mitte eraldi staatus.

---

## Rollid ja õigused

| Roll | Õigused |
|------|----------|
| **Admin** | hinnad, arved, krediitarve, staatuse override |
| **Pood** | saab muuta ainult `packed_qty` ja `packed_weight` |
| **Juht** | näeb oma ringi, saab saata "Teel" SMS ja märkida "Kohal" |
| **Klienditugi** | muudab staatuseid, saadab kinnituskirju |
| **Avalik kasutaja** | saab esitada tellimuse veebivormi kaudu |

---

## Andmemudel (minimaalne skeem)

### Tabel: Tellimus
| Väli | Kirjeldus |
|------|------------|
| order_id | unikaalne ID |
| created_at | loomisaeg |
| channel | veeb / telefon / FB / e-post |
| customer_id | viide kliendile |
| ring_id | viide ringile |
| stop_id | viide peatuskohale |
| delivery_type | peatus / koju |
| delivery_address | kui `koju` |
| status | vt olekuvoog |
| notes_customer | kliendi märkus |
| notes_internal | sisemärkused |
| payment_method | sularaha / ülekandega |
| payment_status | maksmata / osaliselt / tasutud / krediit |
| invoice_id | viide arvele (kui loodud) |
| invoice_total | summa |
| tax_rate | käibemaks |
| picked_by | kes komplekteeris |
| delivered_by | kes toimetas |

### Tabel: Tellimuse read
| Väli | Kirjeldus |
|------|------------|
| order_line_id | unikaalne ID |
| order_id | viide tellimusele |
| sku | toote kood |
| name | toote nimi |
| uom | ühik (kg/tk) |
| ordered_qty | kliendi soov |
| packed_weight | tegelik kaal |
| packed_qty | tegelik kogus |
| unit_price | ühikuhind |
| line_total | ridade kogusumma |
| substitution_allowed | lubatud asendus (jah/ei) |
| substitution_used | kas asendus kasutatud |

### Tabel: Klient
| Väli | Kirjeldus |
|------|------------|
| customer_id | unikaalne ID |
| name | kliendi nimi |
| org_name | ettevõtte nimi (kui olemas) |
| reg_code | registrikood |
| vat | KMKR number |
| phone | telefon |
| email | e-post |
| segment | jaeklient / restoran / hulgiklient |
| consent_email | nõusolek e-postiga |
| consent_sms | nõusolek SMS-ga |

### Tabel: Ring
| Väli | Kirjeldus |
|------|------------|
| ring_id | unikaalne ID |
| ring_date | kuupäev |
| region | piirkond |
| driver | juht |
| capacity_orders | max tellimuste arv |
| capacity_kg | max kg |
| cutoff_at | viimase tellimuse aeg |
| status | OPEN / CLOSED / DONE |

### Tabel: Peatus
| Väli | Kirjeldus |
|------|------------|
| stop_id | unikaalne ID |
| ring_id | viide ringile |
| stop_name | peatus |
| meeting_point | kohtumispaik |
| time_window_start / end | ajavahemik |
| sort_order | järjekord ringis |

### Tabel: Toode
CSV-fail `data/products.csv`  
Väljad: `sku, name, category, uom, catch_weight, active`

Näide:
```csv
sku,name,category,uom,catch_weight,active
PORK-001,Seahakkliha,Värske sealiha,kg,true,true
PORK-002,Sealiha kotlet,Värske sealiha,kg,true,true
SAUS-001,Ahjuvorst,Valmistooted,tk,false,true
SMOK-001,Suitsuvorst,Valmistooted,kg,true,true
```

---

## Kliendi teekond

1. Klient avab kodulehel vormi (`https://perefarm.ee/order`).
2. Valib nähtava ringi (ainult `visible_from ≤ now ≤ visible_to` ja `now < cutoff_at`).
3. Valib peatuse, sisestab oma andmed ja tooted (kategooriate järgi).
4. Saab automaatse e-kirja: "Aitäh, tellimus laekus".
5. Kui tellimus kinnitatakse, saab teise kirja: "Tellimus vastu võetud".
6. Kui juht alustab reisi, saab SMS-i: "Kaup jõuab ~XX min pärast. Kohtume: <peatus>."

---

## Arveldamine ja numbrid

- Arve koostatakse **ainult ülekandega maksjatele**.
- Krediitarve kasutatakse tühistamisel, **arvet ei kustutata**.
- Numbriseeria on järjestikune ja ühtne.
- Arve PDF saadetakse käsitsi "Saada arve" nupuga.
- Hindade muutmine pärast "Valmis väljastuseks" staatust ainult Adminil.

---

## Automaatikad ja teavitused

| Staatus | Tegevus |
|----------|----------|
| **Uus** | automaatne "Aitäh, tellimus laekus" e-kiri |
| **Vastu võetud** | e-kiri ringi ja peatuskohaga |
| **Teel** | juhi SMS "Kaup jõuab ~XX min pärast" |
| **Kättetoimetatud** | e-kiri "Aitäh ostu eest" (võimalik arve lingiga) |

---

## Andmekaitse (GDPR)

- Kõik logid sisaldavad IP ja rolli; telefonid ja e-postid on logides maskeeritud (`+372xxx...`).
- Andmeid säilitatakse:
  - Tellimused ja arved: **7 aastat**.
  - Logid: **12 kuud**.
  - Pooleliolevad vormid: **30 päeva**.
- MailerSend/Resend kasutab domeeni `perefarm.ee` SPF + DKIM autentimisega.
- Turundusnõusolek on vabatahtlik, teenuse teavitus on kohustuslik.

---

## MVP valmisoleku kontrollnimekiri ✅

- [ ] Tellimus salvestub andmebaasi ja järgib cutoff'i reeglit.
- [ ] Vormis on kanaliväli (veeb / telefon / FB / e-post).
- [ ] Pood saab muuta ainult väljastusvälju (`packed_qty`, `packed_weight`).
- [ ] Poodi koond (CSV) ja korjeleht (PDF) tekivad automaatselt.
- [ ] "Uus" ja "Vastu võetud" e-kirjad toimivad.
- [ ] Juhi "Teel" SMS töötab (stub või Messente integratsioon).
- [ ] Arve PDF tekib ainult ülekandega tellimustele.
- [ ] Arve tühistamisel tekib krediitarve, mitte kustutamine.

---

## Kasutatavad tehnoloogiad

- **Frontend:** Next.js + React + TypeScript  
- **Server/API:** Next.js API Routes (Node.js)  
- **Andmebaas:** PostgreSQL (Neon, prod) / SQLite (dev)  
- **ORM:** Prisma  
- **E-post:** MailerSend (tasuta tase piisab)  
- **SMS (hiljem):** Messente  
- **Deploy:** Vercel (Free Plan)

---

## Embed olemasolevale kodulehele

Kui vorm on avaldatud Vercelis (nt `https://vajanguperefarm.vercel.app/order`),  
lisa kodulehe HTML-sse:

```html
<iframe
  src="https://vajanguperefarm.vercel.app/order"
  width="100%"
  height="1800"
  style="border:0"
  loading="lazy"
  referrerpolicy="no-referrer-when-downgrade">
</iframe>
```

---

### Kuidas kasutada

1️⃣ Ava **Cursoris uus projekt (Next.js + TypeScript)**.  
2️⃣ Ava fail `README.md` ja **kleepi ülaltoodud tekst 1:1**.  
3️⃣ Salvesta ja commit'i.  
4️⃣ Cursor küsib seejärel automaatselt täpsustused (andmebaas, e-post, deploy) — vali:
   - Database → PostgreSQL  
   - Email → MailerSend  
   - Deployment → Vercel  
   - Language → Estonian