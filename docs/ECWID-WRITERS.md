# Guida Ecwid: prodotti, attributi e fee writers

Procedura operativa per collegare prodotti Ecwid ai writers TagTales e far calcolare correttamente le royalties.

## Panoramica

Due livelli distinti:

1. **Ecwid** — catalogo, attributi (`artist_id`, `product_type`, …), checkout e fee
2. **TagTales Admin** — assegna gli ID prodotto Ecwid al user writer (`ecwidProductIds`)

Flusso ordine: evento Ecwid `order.created` con `paymentStatus === PAID` → webhook (`functions/src/ecwidWebhook.ts`) → documenti in `royalties` con `feeAmount` → dashboard Vendite del writer.

Le quote writer sono **importi fissi in euro**, non percentuali sul prezzo di listino (eccezione: `stampa_limitata`).

---

## 1. Nuovo prodotto writer su Ecwid

1. Catalog → Products → **Add New Product**
2. Nome, foto, prezzo, varianti → **Save**
3. Aprire la scheda **Attributes** (visibilità attributi: `NOTSHOW`)
4. Compilare i campi sotto (ignorare UPC, Brand e campi `[English]`)
5. **Save**
6. Copiare l’**ID prodotto** Ecwid (serve per il collegamento in admin)

### Attributi da compilare

| Attributo | Obbligatorio | Valore |
|-----------|--------------|--------|
| `artist_id` | Per royalty sì | UID Firebase del writer. Vuoto = prodotto interno (nessuna royalty) |
| `product_type` | Sì | Solo uno dei valori della lista chiusa sotto |
| `promo_active` | No | `true` / `false` (o vuoto = false) |
| `fee_override` | No | Vuoto = fee standard · `0` = nessuna royalty · numero = fee fissa € |

**Prodotto writer:** `artist_id` = UID, `product_type` compilato.

**Prodotto interno** (es. merch logo TagTales): `artist_id` vuoto, `product_type` compilato, `fee_override` = `0`.

### Come trovare l’UID writer (`artist_id`)

Firebase Console → Authentication → cerca l’email del writer → copia l’**UID**.

### Poster (e altri formati) con prezzi/fee diversi: due prodotti separati

`product_type` è **uno solo per prodotto Ecwid**. Il webhook **non** legge la variante (es. Taglia A1 / A2) per scegliere la fee.

Quindi **non** creare un unico prodotto con combinazioni A1 + A2 se A1 e A2 devono avere fee diverse (`poster_a1` vs `poster_a2`).

**Regola operativa:** un `product_type` = un prodotto Ecwid.

Esempio Soft Skin Poster Shaone:

| Prodotto Ecwid | `product_type` | Fee piena |
|----------------|----------------|-----------|
| Soft Skin Poster A1 (solo taglia A1) | `poster_a1` | 19 € |
| Soft Skin Poster A2 (solo taglia A2) | `poster_a2` | 17 € |

Stesso `artist_id` su entrambi. In admin TagTales assegna **entrambi** gli ID prodotto al writer.

Stessa regola per le tele: `tela_12x18`, `tela_16x24`, ecc. → prodotti Ecwid distinti, non una sola scheda con più formati se i `product_type` (e le fee) sono diversi.

Le **varianti** su Ecwid restano ok solo se tutte le combinazioni condividono lo **stesso** `product_type` e la stessa fee (es. colorazioni di una t-shirt `tshirt`).

Il prezzo di vendita per variante (modificatore prezzo) non cambia la quota writer: conta solo `product_type` / `fee_override`.

---

## 2. Come scrivere `product_type` (obbligatorio)

Nome attributo Ecwid: `product_type` (minuscolo, underscore).

### Formato del valore

- Tutto **minuscolo**
- **Nessuno spazio**, nessuna maiuscola, nessun trattino `-`
- Separatore solo dove previsto: underscore `_`
- Copiare **lettera per lettera** uno dei valori sotto

Il webhook normalizza con `toLowerCase()`, ma spazi e typo restano fatali: l’item viene saltato (`Unknown product_type`).

### Valori ammessi (lista chiusa — solo questi)

Copia-incolla:

```
tshirt
felpa
poster_a2
poster_a1
tela_12x18
tela_16x24
tela_20x30
tela_40x60
stampa_limitata
```

| Valore da scrivere | Significato |
|--------------------|-------------|
| `tshirt` | T-shirt |
| `felpa` | Felpa |
| `poster_a2` | Poster A2 |
| `poster_a1` | Poster A1 |
| `tela_12x18` | Tela 12×18 |
| `tela_16x24` | Tela 16×24 |
| `tela_20x30` | Tela 20×30 |
| `tela_40x60` | Tela 40×60 |
| `stampa_limitata` | Stampa limitata |

### Errori tipici (non funzionano)

- `t-shirt`, `Tshirt`, `T-Shirt`, `tee`
- `poster a2`, `poster-a2`, `Poster_A2`
- `tela 40x60`, `tela-40x60`, `canvas_40x60`
- `stampa limitata`, `stampa-limitata`, `limited_print`
- qualsiasi sinonimo o valore inventato

---

## 3. Tabella fee (quota writer)

Importi in **euro per unità**. `promo_active = true` usa la colonna promo.

| `product_type` | Fee piena (€) | Fee promo (€) |
|----------------|---------------|---------------|
| `tshirt` | 7 | 4 |
| `felpa` | 9 | 5 |
| `poster_a2` | 17 | 12 |
| `poster_a1` | 19 | 13 |
| `tela_12x18` | 93 | 67 |
| `tela_16x24` | 111 | 81 |
| `tela_20x30` | 124 | 90 |
| `tela_40x60` | 164 | 104 |
| `stampa_limitata` | prezzo ex-IVA − 90 € | stessa formula |

### Regole di calcolo

1. Se `fee_override` è presente e numerico → usa quel valore (ignora tabella e promo)
2. Altrimenti, se `product_type` = `stampa_limitata` → fee = prezzo vendita senza IVA − 90 €
3. Altrimenti → valore dalla tabella (full o promo)
4. `feeAmount` finale = fee × quantità, mai negativo
5. Senza `artist_id` → nessuna royalty (prodotto interno)
6. Senza `product_type` o valore non in lista → item saltato

---

## 4. Collegare i prodotti in TagTales Admin

1. Login admin → `/app/admin/users`
2. Aprire il writer → sezione vendite/prodotti → **Visualizza / Assegna Prodotti**
3. Cercare e selezionare i product ID Ecwid → salvare  
   (scrive `ecwidProductIds` su `users` e sincronizza `scrittori`)
4. Verificare il conteggio prodotti assegnati sul profilo

Senza questo passo le royalties possono comunque essere scritte dal webhook (se gli attributi Ecwid sono corretti), ma il writer non vede i prodotti in vetrina / filtri dashboard collegati.

---

## 5. Verifica post-vendita

1. Ordine di test **PAID** su Ecwid
2. Controllare la collection Firestore `royalties` (`feeAmount`, `artistId`, `productType`)
3. Controllare la pagina Vendite del writer (Quota Writer = `feeAmount`)

Nota: lo shop pubblico usa l’embed Ecwid; i link `ecwidLink` nei blocchi mostre sono opzionali e separati da questa procedura.

---

## 6. Checklist errori comuni

| Problema | Causa tipica |
|----------|----------------|
| Niente royalty / writer sbagliato | `artist_id` vuoto o UID errato |
| Item saltato dal webhook | Typo in `product_type` (non nella lista chiusa) |
| A1 e A2 con fee uguale (sbagliata) | Un solo prodotto con due taglie e un solo `product_type` — serve un prodotto Ecwid per formato |
| Royalty ok ma writer senza prodotti in vetrina | Product ID non in `ecwidProductIds` (assegnare entrambi A1 e A2) |
| Royalty indesiderata su merch interno | Impostare `artist_id` vuoto e/o `fee_override` = `0` |

---

## Riferimenti codice

- Webhook e `FEE_TABLE`: `functions/src/ecwidWebhook.ts`
- Assegnazione prodotti: `src/components/EcwidConnectionModal.tsx`
- UI admin: `src/pages/AdminUsers.tsx`
- Env store: `ECWID_STORE_ID`, `ECWID_SECRET_TOKEN` — vedi [DEPLOY.md](./DEPLOY.md)
- Storico attributi (changelog): [ROADMAP.md](../ROADMAP.md) sezione «Logica Attributi Ecwid»
