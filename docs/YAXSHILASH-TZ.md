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
| **IKKI to'lov provayderi — real** | Mock emas. **Payme** (`CheckPerformTransaction`, `CreateTransaction`, `PerformTransaction`) **va Click** (`prepare` + `complete` ikki bosqichli). Ikkalasi ham protokolga mos, summa **tiyinda** solishtiriladi (`payments.service.ts:370`) |
| **Idempotentlik niyati bor** | Perform `SUCCESS` holatini qayta qaytaradi, `CANCELLED` ni rad etadi (`:499,489`) — retry'larga tayyor. ⚠️ Lekin qulfsiz — 1-vazifa |
| **Ko'p sotuvchili marketplace** | `SELLER` roli, `order.sellerId`, sotuvchi–xaridor chat. Struktura bor. ⚠️ Lekin pul sotuvchiga **oqmaydi** — kengaytirish, 10-vazifa |
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

### 3.5. Oversell poygasi — oxirgi mahsulot ikki marta sotiladi 🔥

- **Maqsad:** Ikki xaridor oxirgi mahsulotni bir vaqtda sotib olsa —
  ikkalasiga ham sotiladi, ombor **manfiy** bo'ladi.

- **Hozirgi holat (o'lchangan):** `orders.service.ts` —
  ```
  :90   if (item.variant.stockQuantity < item.quantity) throw ...  ← tekshiruv
                                                                      (tranzaksiyadan OLDIN
                                                                       yuklangan ma'lumot)
  :133  await this.dataSource.transaction(async (manager) => {
  :177    await manager.decrement(ProductVariant, {id}, 'stockQuantity', qty)  ← shartsiz
  ```
  `decrement()` ning **o'zi** atomik (`SET x = x - n`), lekin **tekshiruv**
  eski ma'lumotga qaraydi va decrement **shartsiz**. Ikki parallel checkout:
  ```
  T1: stockQuantity=1 o'qidi (tranzaksiyadan oldin)
  T2: stockQuantity=1 o'qidi
  T1: 1 >= 1 ✓ → decrement → stock 0
  T2: 1 >= 1 ✓ → decrement → stock -1   ← ikki marta sotildi
  ```
  Bu — Payme qulfi (1-vazifa) bilan **bir sinf**: tekshiruv va o'zgartirish
  atomik emas.

- **Fayllar:** `orders.service.ts`.

- **Ish:**
  - Tekshiruv va decrement'ni **bitta shartli operator** qiling:
    ```sql
    UPDATE "product_variants"
       SET "stock_quantity" = "stock_quantity" - $1
     WHERE "id" = $2 AND "stock_quantity" >= $1
    ```
    `affected === 0` → omborда yetarli emas → butun tranzaksiyani rollback +
    aniq xato ("zaxirada qolmadi")
  - Bu allaqachon `dataSource.transaction` ichida (`:133`) — faqat
    tekshiruvni o'sha operatorga ko'chirish kerak
  - ⚠️ `CHECK ("stock_quantity" >= 0)` constraint qo'shing — ikkinchi
    mudofaa chizig'i (kod xato qilsa, baza rad etadi)

- **Definition of Done:**
  - Oxirgi mahsulotга ikki parallel checkout → **bittasi** muvaffaqiyat,
    ikkinchisi "zaxirada qolmadi"
  - Ombor hech qachon manfiy bo'lmaydi (`CHECK` kafolatlaydi)
  - **Test:** parallel checkout → 1 buyurtma, stock 0 (Testcontainers)

- ⚠️ **Nega bu 1-vazifa bilan birga:** Payme qulfi, buyurtma jami, va
  oversell — uchalasi ham **bir sinf** (atomiklik/poyga). Ularni birga
  o'ylash mantiqiy: hammasi "tekshir → o'zgartir" ni bitta atomik qadam
  qilish.

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

## FAZA 4 — Kattalashtirish (kengaytirish)

> Yuqoridagi 1–7 loyihani **to'g'ri** qiladi. Bu faza uni **kattaroq va
> chuqurroq** qiladi — yangi qobiliyatlar bilan. Muhim: bular CRUD
> xususiyatlar ro'yxati emas, balki **texnik jihatdan qiyin va mavjud
> tuzilmaga bog'langan** kengaytirishlar. Har biri eksponatga yangi
> "chuqurlik nuqtasi" qo'shadi.

### 10. Sotuvchi hisob-kitobi — pulni marketplace qiling 🔥

- **Maqsad:** Marketplace **strukturasi bor** (`SELLER` roli,
  `order.sellerId`), lekin **pul sotuvchiga oqmaydi**. Xaridor to'laydi →
  pul platformada qoladi. Haqiqiy marketplace'da: komissiya ajratiladi,
  qolgani sotuvchi balansiga o'tadi, sotuvchi payout so'raydi.

- **Nega bu eng kuchli kengaytirish:** bu — nexus escrow'iga o'xshash
  **pul taqsimoti** muammosi, va u:
  - Mavjud tuzilmaga (`sellerId`, to'lov) **bog'langan**
  - Texnik jihatdan **qiyin**: komissiya taqsimoti (`fee + net = jami`,
    mustaqil yaxlitlamaslik), sotuvchi balansi, payout — hammasi atomik va
    aniq (2-vazifadagi `numeric` intizomi bilan)
  - Loyihani "do'kon" dan **"marketplace platforma"** ga ko'taradi

- **Fayllar:** yangi entity `SellerBalance` / `SellerTransaction`,
  yangi modul `apps/api/.../seller-payouts/` (yoki `payments` kengaytmasi),
  `orders.service.ts` (to'lov bajarilganda taqsimla).

- **Ish:**
  - Buyurtma to'langanda (Payme/Click `Perform` muvaffaqiyatli):
    - Platforma komissiyasini `numeric` da hisobla (bir marta yaxlitla)
    - Sotuvchi ulushi = `jami - komissiya` (**qoldiq deb ta'rifla**, mustaqil
      hisoblama — kelvindagi `allocate()` naqshi)
    - Sotuvchi balansiga qo'sh (atomik, tranzaksiyada — 1-vazifa naqshi)
  - Payout: sotuvchi so'raydi → balansdan yechiladi (shartli `UPDATE`,
    oversell/nexus withdraw naqshi) → `SellerTransaction` yoziladi
  - Invariant: `SUM(sotuvchi balanslari) + platforma = qabul qilingan pul`
  - ⚠️ **Qaytarish (refund) holati:** buyurtma qaytarilса sotuvchi balansi
    kamayishi kerak — manfiy bo'lib qolmasin (nexus'dagi savol)

- **Definition of Done:**
  - Buyurtma to'langanda pul komissiya/sotuvchi bo'lib taqsimlanadi, aniq
  - Sotuvchi payout so'ray oladi, balansidan ortiq emas
  - Yopiq tizim invarianti test bilan tekshiriladi
  - **Test:** taqsimot property test (`komissiya + sotuvchi = jami`);
    parallel payout → balansdan ortiq yechilmaydi

### 11. To'lov provayderi abstraksiyasi — Uzum qo'shish "klass" bo'lsin

- **Maqsad:** Payme va Click **alohida** yozilgan, lekin ko'p mantiq umumiy
  (tranzaksiya holat mashinasi, tiyin, idempotentlik). Uchinchi provayder
  (Uzum) qo'shish uchun hozir hammasini qaytadan yozish kerak.

- **Nega bu qiziq:** bu — **arxitektura** kengaytmasi. `PaymentProvider`
  interfeysi (yagona holat mashinasi, provayder faqat protokol farqini
  beradi) → yangi provayder **klass**, qayta yozish emas. Bu SOLID va
  domen modellashtirishni ko'rsatadi.

- **Fayllar:** `payments/` — `PaymentProvider` interfeysi, `PaymeProvider`,
  `ClickProvider`, umumiy `TransactionStateMachine`.

- **Ish:**
  - Umumiy holat mashinasini ajrat: `PENDING → SUCCESS/CANCELLED`,
    idempotentlik, qulf (1-vazifa) — provayderdan **mustaqil**
  - Har provayder faqat: so'rovni parse qilish, summani olish (tiyin),
    javob formati. Qolgani umumiy
  - Uzum'ni qo'shish `UzumProvider` klassi bilan namoyish qilinsin (yoki
    kamida interfeys tayyor bo'lsin)

- **Definition of Done:**
  - Payme va Click bir xil holat mashinasidan foydalanadi
  - Yangi provayder qo'shish = 1 klass (protokol adapteri)
  - **Test:** har provayder uchun bir xil holat testlari o'tadi

### 12. Ombor rezervatsiyasi — checkout paytida ushlab turish

- **Maqsad:** 3.5-vazifa oversell'ni to'sadi, lekin boshqa muammo qoladi:
  xaridor checkout boshlab, to'lovni bir necha daqiqa tugatmasa — mahsulot
  **band bo'lmaydi**, boshqa xaridor uni sotib olishi mumkin, keyin birinchi
  xaridor to'lovni tugatganда "yo'q" bo'ladi.

- **Nega bu qiziq:** **TTL bilan rezervatsiya** — vaqtinchalik ushlab turish,
  to'lanmasa avtomatik bo'shatish. Bu real e-commerce'da katta muammo va uni
  to'g'ri qilish (poyga, TTL, bo'shatish) texnik jihatdan qiyin.

- **Ish:**
  - Checkout boshlanganda: `StockReservation` (mahsulot, miqdor, `expiresAt`)
    yaratiladi, ombor **rezervatsiya bilan** kamaytiriladi (mavjud = jami −
    faol rezervatsiyalar)
  - To'lov bajarilsa: rezervatsiya → sotuv (doimiy)
  - `expiresAt` o'tsa: rezervatsiya bo'shatiladi (cron yoki lazy tekshiruv)
  - ⚠️ Bu 3.5 (oversell) ustiga quriladi — avval u

- **Definition of Done:**
  - Checkout mahsulotni ushlaydi; to'lanmasa TTL'dan keyin bo'shaydi
  - Band mahsulot boshqa xaridorga ko'rinmaydi
  - **Test:** rezervatsiya muddati tugasa ombor tiklanadi

### 13. Tavsiyalarni chuqurlashtirish

- **Maqsad:** Hozir "also-viewed" / "recently-viewed" — xulq-atvorga
  asoslangan, lekin oddiy (bitta mahsuloga qarab). Kollaborativ filtrlash
  ("sizga o'xshaganlar buni ham oldi") yoki kontentga asoslangan (kategoriya,
  narx, teg bo'yicha o'xshashlik) qo'shish.

- **Nega bu qiziq:** ML-ga yaqin, lekin ML shart emas. **Halol chegara:**
  kollaborativ filtrlash yetarli ma'lumot (ko'p foydalanuvchi × xarid) talab
  qiladi — portfolio'da bu **yo'q**. Shuning uchun:
  - **Kontentga asoslangan** (item-item o'xshashlik) — ma'lumotsiz ham
    ishlaydi, mantiqiy
  - Kollaborativ — faqat namoyish sifatida, "ma'lumot ko'paysa yaxshilanadi"
    deb hujjatlab
- ⚠️ **ML modeli o'qitishни va'da qilmang** portfolio ma'lumoti bilan — bu
  wisar'dagi xato. Kontentga asoslangan o'xshashlik + halol izoh.

### 14. Yetkazib berish kuzatuvi — mavjud WebSocket ustida

- **Maqsad:** Real-time chat uchun WebSocket gateway **allaqachon bor**
  (`chat.gateway.ts`, online-presence bilan). Xuddi shu infratuzilma ustida
  buyurtma holati real-time kuzatuvini qo'shish: "qabul qilindi → yig'ilyapti
  → yo'lda → yetkazildi" — xaridor sahifani yangilamasdan ko'radi.

- **Nega bu qiziq:** mavjud real-time infratuzilmani **qayta ishlatadi**
  (yangi WebSocket qatlami emas), va buyurtma holat mashinasini frontend'ga
  jonli bog'laydi.

- **Ish:** buyurtma holati o'zgarganda WebSocket orqali xaridorga xabar;
  frontend buyurtma sahifasida jonli holat. Kuryer/admin holatni o'zgartiradi.

---

## FAZA 5 — Kichik yaxshilashlar (vaqt bo'lsa)

### 15. O'zbekcha qidiruv morfologiyasi

- **Hozir:** `to_tsquery('simple', ...)` — `simple` konfiguratsiya
  **morfologiyani bilmaydi**. `kitoblar` qidirilsa `kitob` **topilmaydi**.
- **Ish:** o'zbek affikslarini normallashtiruvchi yengil stemmer (wisar
  loyihasidagi `41-vazifa` bilan bir xil — ikkala loyiha ham davom etsa,
  umumiy paket).
- ⚠️ Kengaytirish, tuzatish emas (3-vazifadagi crash boshqa narsa).

### 16. Indeks auditi

- FK ustunlarida indeks bormi TEKSHIR (Postgres FK'ga avtomatik yaratmaydi).
  `EXPLAIN` bilan sekin so'rovlarni toping. ⚠️ **O'lchovsiz indeks qo'shmang**.

---

## Yakuniy tartib

| Faza | Vazifa | Tur | Nega |
|---|---|---|---|
| **1** | Payme perform atomiklik + qulf | 🐛 tuzatish | Pul; idempotentlik majburlanmaydi |
| **1** | Buyurtma jami `numeric` da | 🐛 tuzatish | Float xatosi Payme to'lovini buzadi |
| **2** | Qidiruv crash | 🐛 tuzatish | Oddiy so'rov serverni yiqitadi |
| **2** | **Oversell poygasi** | 🐛 tuzatish | Oxirgi mahsulot ikki marta sotiladi |
| **2** | Validatsiya (4 endpoint) | 🐛 tuzatish | Arzon, mustaqil |
| **3** | Testlar (Payme + pul + oversell) | 🛡 sifat | Yuqoridagilarni himoyalaydi |
| **3** | CI + type-check | 🛡 sifat | O'tkazib yuborilgan tsc |
| **3** | `DB_SYNCHRONIZE` himoyasi | 🛡 sifat | Ma'lumot yo'qotish |
| **4** | **Sotuvchi hisob-kitobi** | 🚀 kattalashtirish | "Do'kon" → "marketplace platforma" |
| **4** | To'lov provayderi abstraksiyasi | 🚀 kattalashtirish | Uzum = 1 klass |
| **4** | Ombor rezervatsiyasi (TTL) | 🚀 kattalashtirish | Real e-commerce muammosi |
| **4** | Tavsiyalarni chuqurlashtirish | 🚀 kattalashtirish | ML-ga yaqin (halol chegara bilan) |
| **4** | Yetkazib berish kuzatuvi | 🚀 kattalashtirish | Mavjud WebSocket'ni qayta ishlatadi |
| **5** | Qidiruv morfologiya, indeks | ✨ kichik | Vaqt bo'lsa |

**Uchta yo'nalish, uchta maqsad:**
- 🐛 **Tuzatish (1–2 faza)** — "ishlaydigan demo" → "to'g'ri ishlaydigan
  tizim". Uchala pul/poyga bagi bir sinf: tekshir→o'zgartir ni atomik qil
- 🛡 **Sifat (3 faza)** — o'zgarishni himoyalaydigan test va CI
- 🚀 **Kattalashtirish (4 faza)** — "do'kon" → **"marketplace platforma"**.
  Eng kuchlisi **sotuvchi hisob-kitobi** (10-vazifa): u mavjud marketplace
  strukturasini haqiqiy pul oqimi bilan to'ldiradi

⚠️ **Kattalashtirish tuzatishdan keyin.** Sotuvchi hisob-kitobi (10) pul
taqsimotini talab qiladi — u esa 1 va 2-vazifadagi atomiklik va `numeric`
intizomi ustiga quriladi. Avval poydevor, keyin bino.
