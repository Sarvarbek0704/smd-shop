# SMD Shop — Yaxshilash Texnik Topshirig'i

> Bu loyiha **portfolio eksponati** — biznes emas, to'liq e-commerce
> stackning texnik namoyishi. Demak butun qiymat **muhandislik sifatida**.
> Bu TZ o'sha muhandislikni a'lo darajaga chiqaradigan aniq ishlar ro'yxati.
>
> Har vazifa kodni o'qib aniqlangan, `fayl:qator` bilan. Uslub: **Maqsad ·
> Fayllar · Ish · Definition of Done**.

---

## 0. Avval — nima yaxshi qilingan (buzilmasin)

Tanqiddan oldin, halol e'tirof. Bu loyiha texnik jihatdan **eng malakali**:

| | |
|---|---|
| **Payme Merchant API — real** | Mock emas. `CheckPerformTransaction`, `CreateTransaction`, `PerformTransaction` protokolga mos. Summa **tiyinda** solishtiriladi (`payments.service.ts:370`) |
| **Idempotentlik niyati bor** | Perform `SUCCESS` holatini qayta qaytaradi, `CANCELLED` ni rad etadi (`:499,489`) — Payme retry'lariga tayyor. ⚠️ Lekin qulfsiz — 1-vazifa |
| **Pul `numeric`** | `numeric(12,2)` narx, `numeric(14,2)` buyurtma. **Float yo'q** bazada |
| **Migratsiyalar real** | `synchronize` env bilan, productionda `false` |
| **Qidiruv `tsvector`** | `ILIKE` emas — `to_tsquery` + `ts_rank`. ⚠️ Lekin crash xavfi — 3-vazifa |
| **Validatsiya** | 42 DTO klass, atigi 4 inline. Asosan to'g'ri |

Quyidagi vazifalar shu poydevorni **buzmasdan** yaxshilaydi.

---

## FAZA 1 — Pul yo'lidagi to'g'rilik (eng muhim)

### 1. Payme `PerformTransaction` — atomiklik va qulf 🔥

- **Maqsad:** Payme protokolining eng nozik joyi. Hozir idempotentlik
  **tekshiriladi**, lekin **majburlanmaydi** — chunki qulf va tranzaksiya yo'q.

- **Hozirgi holat (o'lchangan):** `payments.service.ts:476-540` —
  `paymePerformTransaction`:
  ```
  :476  payment = paymentRepo.findOne(...)        ← o'qish
  :499  if (payment.status === SUCCESS) return ...  ← tekshiruv
  :512  payment.status = SUCCESS; save()          ← yozish 1
  :519  order = orderRepo.findOne(...)
  :521  order.paymentStatus = PAID; save()        ← yozish 2 (alohida)
  ```
  **Ikki muammo:**
  1. **Qulf yo'q (read-modify-write poygasi).** Payme `PerformTransaction`
     ni bir xil tranzaksiya uchun **bir necha marta** chaqirishi mumkin
     (retry — bu ularning dizayni). Ikki chaqiruv bir vaqtda `PENDING`
     o'qisa — ikkalasi ham `:499` tekshiruvidan o'tadi, ikkalasi ham
     buyurtmani bajaradi. **Ikki marta bajarilish.** Idempotentlik
     tekshiruvi qulfsiz ma'nosiz
  2. **Atomiklik yo'q.** `payment.save()` (`:512`) va `order.save()` (`:521`)
     — **ikki alohida** yozish, bitta tranzaksiyada emas. Ikkisi orasida
     crash/xato bo'lsa: **to'lov SUCCESS, buyurtma to'lanmagan qoladi**.
     Nomuvofiq holat — va bu pul

- **Fayllar:** `payments.service.ts` (perform, create, cancel — hammasi).

- **Ish:**
  - `PerformTransaction` (va `CreateTransaction`, `CancelTransaction`) ni
    **bitta tranzaksiyaga** o'rang (`dataSource.transaction(...)` yoki
    `queryRunner`)
  - `payment` qatorini **pessimistic write lock** bilan o'qing:
    ```ts
    const payment = await manager.findOne(PaymentTx, {
      where: { externalTxId },
      lock: { mode: 'pessimistic_write' },
    });
    ```
    Ikkinchi bir vaqtdagi chaqiruv qulf ochilguncha kutadi, keyin
    `status === SUCCESS` ni ko'rib idempotent qaytadi — bajarmaydi
  - `payment` va `order` yozuvlari **o'sha tranzaksiyada** — ikkalasi birga
    commit yoki birga rollback

- **Definition of Done:**
  - Ikki parallel `PerformTransaction` (bir tranzaksiya uchun) → buyurtma
    **bir marta** bajariladi
  - Payment va order holati **doim mos** (biri SUCCESS, biri PAID — yoki
    ikkalasi ham emas)
  - **Test:** parallel perform → bitta muvaffaqiyat, ikkinchisi idempotent
    javob (Testcontainers)

- ⚠️ **Nega №1:** bu — pul, va bu Payme integratsiyasining eng ko'p
  maqtaladigan qismidagi teshik. Portfolioda "Payme'ni to'g'ri qildim"
  degan da'vo qulf bilan **isbotlanadi**.

### 2. Buyurtma summasi — `numeric` da, float'da emas

- **Maqsad:** Buyurtma jami `parseFloat` orqali JS float64'da hisoblanadi.
  Va aynan bu jami Payme tomonidan **tiyinda solishtiriladi** — ya'ni float
  xatosi to'lovni to'g'ridan-to'g'ri buzadi.

- **Hozirgi holat (o'lchangan):** `orders.service.ts:111-152` —
  ```ts
  const basePrice = parseFloat(item.product.basePrice);
  const variantMod = parseFloat(item.variant.priceModifier);
  // ... jami JS'da qo'shiladi
  ```
  Keyin bu jami `finalAmount` ga yoziladi, va `CheckPerformTransaction`
  (`payments.service.ts:370`) uni `× 100` qilib Payme summasi bilan
  solishtiradi.

  ⚠️ **Zanjir:** float jami `1234567.89` ni `1234567.8900000001` qilsa →
  `× 100` → `Math.round` uni to'g'rilashi mumkin, lekin **ko'p element +
  chegirma + variant + kupon** yig'ilганda xato to'planadi. Natijada:
  - Payme summa **mos kelmasligi** mumkin → to'g'ri to'lov **rad etiladi**
  - Yoki noto'g'ri jami bilan buyurtma yaratiladi

- **Fayllar:** `orders.service.ts` (hisob-kitob), ixtiyoriy yangi
  `common/money.ts` yordamchi.

- **Ish:**
  - Buyurtma jamisini **`numeric` da** hisoblang — DB'da (`SELECT SUM(...)`)
    yoki `Decimal.js` bilan servis qatlamida. `parseFloat` + `+` **emas**
  - Chegirma taqsimoti (kupon bir necha elementga): qoldiqni taqsimlang,
    mustaqil yaxlitlamang (nexus/kelvindagi `allocate()` naqshi)
  - `finalAmount` va Payme kutgan summa **bir xil manbadan** kelsin

- **Definition of Done:**
  - Ko'p elementli, chegirmali, kuponli buyurtma jamisi tiyin darajasida aniq
  - `CheckPerformTransaction` to'g'ri summani rad etmaydi
  - **Test:** property test — element narxlari yig'indisi = buyurtma jami,
    har doim (fast-check)

---

## FAZA 2 — Ishonchlilik

### 3. Qidiruv — foydalanuvchi kiritmasidan crash bo'lmasin 🔥

- **Maqsad:** Qidiruv `to_tsquery` ga foydalanuvchi matnini yetkazadi.
  Maxsus belgi (`c++`, `a & b`, `(`, `!`) → `to_tsquery` **sintaksis xatosi**
  → 500. Oddiy qidiruv so'rovi serverni yiqitadi.

- **Hozirgi holat (o'lchangan):** `search.service.ts:35-44` —
  ```ts
  const tsQuery = searchTerm.split(/\s+/).filter(...).map((w) => `${w}:*`).join(' & ');
  qb.andWhere(`p.search_vector @@ to_tsquery('simple', :tsq)`, { tsq: tsQuery });
  ```
  So'z `c++` bo'lsa → `c++:*` → `to_tsquery('simple', 'c++:*')` → **xato**.
  Foydalanuvchi `&`, `|`, `!`, `:` yozsa ham.

- **Fayllar:** `search.service.ts`.

- **Ish:**
  - **Variant A (tavsiya):** `websearch_to_tsquery('simple', :q)` — u
    foydalanuvchi kiritmasini **xavfsiz** qabul qiladi (Google uslubidagi
    `"ibora"`, `-istisno`), hech qachon xato tashlamaydi. Prefix (`:*`)
    kerak bo'lsa, oxirgi so'zga alohida qo'shing
  - **Variant B:** har so'zdan `tsquery` maxsus belgilarini tozalang
    (`[&|!():*']` olib tashlang), keyin `:*` qo'shing
  - ⚠️ **Har ikkala holatda** — bo'sh natijaga tushib qolmang (hamma belgi
    tozalansa `q` bo'sh bo'ladi)

- **Definition of Done:**
  - `c++`, `a & b`, `(test`, `!!!` — hech biri 500 bermaydi
  - Oddiy qidiruv oldingidek ishlaydi
  - **Test:** maxsus belgili so'rovlar 200 qaytaradi (bo'sh yoki natija bilan)

### 4. Validatsiyasiz endpointlar — 4 ta

- **Maqsad:** 4 endpoint `@Body() x: { ... }` inline tip — `ValidationPipe`
  metatip ko'rmaydi → **validatsiya ishlamaydi**.

- **Hozirgi holat (o'lchangan):**
  ```
  cart.controller.ts:67       { code: string }              ← kupon kodi
  users.controller.ts:87      { storeName, storeDescription } ← sotuvchi bo'lish
  users.controller.ts:147     { reason: string }
  payments.controller.ts:75   Payme JSON-RPC body           ← quyiga qara
  ```

- **Ish:**
  - Har biriga **DTO klass** + `class-validator` dekoratorlari (`@IsString`,
    `@MaxLength`, `@IsNotEmpty`)
  - ⚠️ **`payments.controller.ts:75` (Payme webhook) — ehtiyot bo'ling.**
    Payme JSON-RPC ni qat'iy DTO bilan cheklash protokolni buzishi mumkin
    (Payme kutilmagan maydon yuborsa). Bu yerda validatsiya **yumshoq**
    bo'lsin yoki umuman tegmang — Payme auth (`X-Auth` header) allaqachon
    himoya. Buni **hujjatlang**, jim qoldirmang
  - Lint qoidasi: `@Body()` faqat klass bilan (Payme istisnosidan tashqari)

- **Definition of Done:**
  - Uch endpoint (kupon, sotuvchi, sabab) DTO bilan validatsiya qilinadi
  - Payme webhook qarori hujjatlangan (validatsiya qilinadi yoki ataylab yo'q)

---

## FAZA 3 — Sifat va himoya

### 5. Testlar — Payme va pul birinchi 🔥

- **Maqsad:** Hozir **0 test**. Va eng ko'p test kerak bo'lgan kod — Payme
  holat mashinasi va pul arifmetikasi — aynan testsiz.

- **Ish:**
  - **Testcontainers + real PostgreSQL** (Payme lock/tranzaksiya faqat real
    DB'da sinaladi; mock poygani ko'rsatmaydi)
  - **1-ustuvorlik:** Payme holat mashinasi:
    - `CheckPerformTransaction` — noto'g'ri summa rad etiladi, to'g'ri o'tadi
    - `PerformTransaction` — ikki marta chaqirilsa idempotent (1-vazifa)
    - `CancelTransaction` — holatlar to'g'ri o'tadi
    - Parallel perform → bitta bajarilish
  - **2-ustuvorlik:** buyurtma jami (2-vazifa) — property test
  - **3-ustuvorlik:** qidiruv (3-vazifa) — maxsus belgilar crash bermaydi
  - **DoD:** yuqoridagilar qoplangan, `npm test` yashil

- ⚠️ **Qoplama maqsadi:** "80%" ma'nosiz. Aniq: **Payme yo'li 100%, pul
  hisobi 100%**; qolgani o'sib boradi.

### 6. CI + type-check (o'tkazib yuborilgan tsc)

- **Maqsad:** Frontend build type-check'ni **o'tkazib yuboradi**
  (`fix: skip tsc type-check in build` commiti — `vite build`, oldidan
  `tsc --noEmit` yo'q). Type xatosi build'ni yiqitmaydi — u jimgina o'tadi.

- **Ish:**
  - `.github/workflows/ci.yml`: `npm ci` · `tsc --noEmit` (web + api) ·
    `npm test` · `npm run build`
  - Type-check **build'dan alohida CI qadami** — Vercel build'ni sekinlatmasdan,
    lekin type xatosi PR'ni **qizil** qiladi
  - PostgreSQL service container (testlar uchun)
  - ⚠️ GitHub Actions **billing lock** — public repolar uchun bepul bo'lishi
    kerak (bu xato — Support'ga murojaat). Shungacha YAML `workflow_dispatch:`
    bilan tayyor tursin

- **DoD:** CI type xatoli yoki testsiz PR'ni rad etadi.

### 7. `DB_SYNCHRONIZE` — productionda majburan o'chirilsin

- **Maqsad:** `synchronize` env bilan boshqariladi
  (`configuration.ts:12`). Productionda tasodifan `true` qo'yilsa — TypeORM
  sxemani jimgina o'zgartiradi, **ma'lumot yo'qotishi** mumkin.

- **Ish:**
  - Ishga tushishda: `NODE_ENV === 'production' && DB_SYNCHRONIZE === 'true'`
    bo'lsa — **ishga tushmasin** (aniq xato bilan)
  - `.env.example` da ogohlantirish izohi

- **DoD:** production'da `synchronize=true` bilan ilova ishga tushmaydi.

---

## FAZA 4 — Kengaytirish (ixtiyoriy, yo'nalishga qarab)

> Bu vazifalar "halol eksponat" uchun **shart emas**, lekin loyihani
> chuqurlashtiradi. Faqat vaqt bo'lsa.

### 8. O'zbekcha qidiruv morfologiyasi

- **Hozir:** `to_tsquery('simple', ...)` — `simple` konfiguratsiya
  **morfologiyani bilmaydi**. `telefon` qidirilsa `telefonlar` topiladi
  (prefix `:*` tufayli), lekin `kitoblar` qidirilsa `kitob` **topilmaydi**.
- **Ish:** o'zbek affikslarini normallashtiruvchi yengil stemmer (wisar
  loyihasidagi `41-vazifa` bilan bir xil yondashuv — agar ikkala loyiha
  ham davom etsa, umumiy paket qilish mumkin).
- ⚠️ Bu — kengaytirish, tuzatish emas. Qidiruv **ishlaydi**, faqat
  morfologik jihatdan to'liq emas.

### 9. Indeks auditi

- **Ish:** FK ustunlarida indeks bormi TEKSHIR (PostgreSQL FK'ga avtomatik
  indeks yaratmaydi). Buyurtma → element, mahsulot → sharh kabi tez-tez
  JOIN qilinadigan joylar. `EXPLAIN` bilan sekin so'rovlarni toping.
- ⚠️ **O'lchovsiz indeks qo'shmang** — avval sekin so'rovni loglang, keyin
  indeks.

---

## Yakuniy tartib

| Ustuvorlik | Vazifa | Nega |
|---|---|---|
| **1** | Payme perform atomiklik + qulf | Pul, va idempotentlik hozir majburlanmaydi |
| **2** | Buyurtma jami `numeric` da | Float xatosi Payme to'lovini buzadi |
| **3** | Qidiruv crash tuzatish | Oddiy so'rov serverni yiqitadi |
| **4** | Validatsiya (4 endpoint) | Arzon, mustaqil |
| **5** | Testlar (Payme + pul) | Yuqoridagilarni himoyalaydi |
| **6** | CI + type-check | O'tkazib yuborilgan tsc'ni qaytaradi |
| **7** | `DB_SYNCHRONIZE` himoyasi | Ma'lumot yo'qotish oldini oladi |
| **8-9** | Qidiruv morfologiya, indeks | Kengaytirish — ixtiyoriy |

⚠️ **1–3 — bug tuzatish, kengaytirish emas.** Ular **hoziroq** qilinsa,
loyiha "ishlaydigan demo" dan "to'g'ri ishlaydigan tizim" ga o'tadi. 5–7 —
sifat. 8–9 — vaqt bo'lsa.

Butun maqsad: bu **portfolio eksponati**, ya'ni ko'riladigan narsa —
muhandislik sifati. Payme'ni qulf bilan atomik qilish, pulni aniq
hisoblash, qidiruvni crash qilmaydigan qilish — bu uchtasi eksponatning
qiymatini eng ko'p oshiradi.
