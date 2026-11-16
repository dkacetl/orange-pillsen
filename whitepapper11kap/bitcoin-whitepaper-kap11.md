# Bitcoin whitepaper, kapitola 11 – pravděpodobnost dohnání řetězce

## Vzorec

```
P = Σ_{k=0}^{∞}  (λ^k · e^(−λ) / k!) · { (q/p)^(z−k)   pro k ≤ z
                                       { 1              pro k > z
```

Je to pravděpodobnost, že útočník dožene poctivý řetězec, který vede o *z* bloků.

## Značení

- **p** – podíl výpočetního výkonu (hash rate) poctivých uzlů, tedy pravděpodobnost, že další blok najdou poctiví.
- **q = 1 − p** – podíl útočníka, tedy pravděpodobnost, že další blok najde útočník.
- **z** – počet potvrzení, tedy náskok poctivého řetězce v blocích.
- **k** – počet bloků, které útočník najde v době, než poctiví najdou *z* bloků. Je to náhodná veličina (0, 1, 2, … bez horní meze).
- **λ = z · q/p** – očekávaný počet útočníkových bloků za tu dobu.

p a q nejsou pevná čísla, jsou to parametry. Whitepaper počítá např. pro q = 0,1 a q = 0,3.

## Dvě fáze vzorce

1. **Fáze 1 – Poisson.** Útočník tajně těží, zatímco poctiví hledají *z* bloků. Jeho postup *k* má pravděpodobnost `λ^k e^(−λ) / k!`.
   - Přesně vzato jde o negativně binomické rozdělení. Satoshi ho aproximuje Poissonem s λ = z · q/p.
2. **Fáze 2 – random walk (gambler's ruin).** Z mezery *n = z − k* útočník závodí dál bez časového limitu.
   - Každý další blok mezeru zmenší o 1 (pravděpodobnost q) nebo zvětší o 1 (pravděpodobnost p).
   - Pravděpodobnost, že se někdy dostane na 0: **(q/p)^n** pro q < p, **1** pro q ≥ p.

Suma přes *k* zprůměruje výsledek fáze 2 přes všechny možné výsledky fáze 1.

### Kde je random walk ve vzorci

Jen jako hotový výsledek `(q/p)^(z−k)` ve složené závorce. Samotné odvození random walk je v textu před vzorcem a v kapitole 11 se neopakuje.

### Proč nestačí jen Poisson

Poisson říká, kolik bloků útočník najde za pevný čas. Po okamžiku, kdy obchodník vydá zboží, závod pokračuje a útočník může poctivý řetězec doběhnout kdykoli později. Otázka „dožene to někdy?" je bez časového limitu a řeší ji random walk. Poisson dodává výchozí mezeru (*z − k*), random walk z ní spočítá výsledek.

## Případ q ≥ p

Vzorec je psaný pro poctivou většinu (q < p).

- Pro q > p je λ > z, takže většina pravděpodobnosti leží u k > z, kde je člen roven 1.
- Pro k ≤ z by ale (q/p)^(z−k) > 1, což není pravděpodobnost.
- Správně: pro q ≥ p je výsledek **1** (útočník s většinou výkonu dožene řetězec vždy).
- Implementace by měla začít `if (q >= p) return 1;` (whitepaperův C kód to dělá také).

## Rozdělení na k ≤ z a k > z

Pro k > z je člen jen samotná Poissonova pravděpodobnost `λ^k e^(−λ) / k!`.

```
P = Σ_{k=0}^{z} (λ^k e^(−λ) / k!) · (q/p)^(z−k)  +  Σ_{k=z+1}^{∞} λ^k e^(−λ) / k!
```

Protože Poissonovy pravděpodobnosti dávají dohromady 1:

```
Σ_{k=z+1}^{∞} λ^k e^(−λ) / k!  =  1 − Σ_{k=0}^{z} λ^k e^(−λ) / k!
```

Sloučením obou sum (rozsah k = 0 až z) vznikne konečný tvar, který Satoshi uvádí za původním vzorcem:

```
P = 1 − Σ_{k=0}^{z} (λ^k e^(−λ) / k!) · (1 − (q/p)^(z−k))
```

Dá se spočítat cyklem od 0 do z.

## Příklad (z = 5)

| k | zbývá dohnat | pravděpodobnost dohnání |
|---|--------------|-------------------------|
| 0 | 5 | (q/p)^5 |
| 3 | 2 | (q/p)^2 |
| 5 | 0 | (q/p)^0 = 1 |
| 7 | útočník už vede | 1 |

## Hodnoty z whitepaperu

- q = 0,1, z = 5: P ≈ 0,0009137
- q = 0,3, z = 5: P ≈ 0,1773523

Při 10 % výkonu stačí 5 potvrzení. Při 30 % je šance útočníka pořád přes 17 %, takže je třeba čekat víc potvrzení.

Příklad λ: pro q = 0,1 a z = 5 je λ = 5 · 0,1 / 0,9 ≈ 0,556.

---

# Otázky a odpovědi

## 1. Vzorec z kapitoly 11 (obrázek) – co to je?

> tento vzorec se nachází v kapitole 11 v bitcoinovým whitepapperu.

Je to pravděpodobnost, že útočník dožene poctivý řetězec, který vede o *z* bloků.

- **p** je pravděpodobnost, že další blok najdou poctiví uzly, **q = 1 − p** že ho najde útočník.
- Za dobu, kdy poctiví najdou *z* bloků, se útočníkův postup řídí Poissonovým rozdělením s očekávanou hodnotou **λ = z · q/p**.
- **λ^k e^(−λ) / k!** je pravděpodobnost, že útočník našel přesně *k* bloků.
- Složená závorka: pro *k > z* už útočník vede, pravděpodobnost je **1**. Pro *k ≤ z* mu zbývá dohnat *z − k* bloků, pravděpodobnost je **(q/p)^(z−k)** (gambler's ruin).
- Suma přes k = 0 až ∞ zprůměruje všechny možné hodnoty *k*.

Důsledek: pro q < p klesá výsledek exponenciálně s rostoucím *z*, proto se čeká na více potvrzení. Pro q ≥ p je pravděpodobnost 1.

Satoshi ji hned za vzorcem přepisuje do konečného tvaru:
`1 − Σ_{k=0}^{z} (λ^k e^(−λ) / k!) · (1 − (q/p)^(z−k))`

## 2. Kde je v tom random walk?

> v tomto vzorci není nic z problému "random walk". ono se tam před tím o tom psalo. tak nevím, jestli s tim random walk souvisi nebo kde je v tom vztahu

Random walk je v členu **(q/p)^(z−k)**.

- Po každém novém bloku se mezera mezi útočníkem a poctivým řetězcem změní o 1: s pravděpodobností q se zmenší, s pravděpodobností p zvětší.
- Pravděpodobnost, že se z mezery *n* někdy dostane na 0 (gambler's ruin): 1 pro q ≥ p, **(q/p)^n** pro q < p.
- Ve vzorci je to dosazeno za n = z − k. Samotné odvození je v textu před vzorcem a v kapitole 11 se neopakuje.
- Poisson je kolem toho proto, že nevíme, jak daleko se útočník mezitím dostal. Dvě fáze: (1) závod, než poctiví najdou *z* bloků, popisuje Poisson; (2) random walk z výsledné mezery *z − k*.

## 3. Co je to k?

> co je to k?

Počet bloků, které útočník stihne najít v době, než poctiví uzly najdou *z* bloků.

- Je to náhodná veličina (0, 1, 2, … bez horní meze) s pravděpodobností λ^k e^(−λ) / k!.
- Příklad pro z = 5: k = 0 → zbývá 5, (q/p)^5; k = 3 → zbývá 2, (q/p)^2; k = 5 → vyrovnáno, 1; k = 7 → útočník vede, 1.
- Proto podmínky *k ≤ z* (útočník dohání) a *k > z* (už je před poctivým řetězcem).

## 4. A kolik je p a kolik q?

> a kolik je p a kolik q?

Nejsou to pevná čísla, ale parametry. **p** je podíl výpočetního výkonu poctivých uzlů, **q = 1 − p** podíl útočníka.

- q = 0,1 → p = 0,9, q/p ≈ 0,111
- q = 0,3 → p = 0,7, q/p ≈ 0,429
- q = 0,5 → p = 0,5, q/p = 1, pravděpodobnost je 1

Whitepaper počítá pro q = 0,1 a q = 0,3: pro z = 5 vychází P ≈ 0,0009137, resp. 0,1773523.

## 5. Proč nejdřív Poisson a pak random walk? Nešlo by to celé jen Poissonem?

> proč nejdřív použije poasson a pak náhodná procházka? to nejde celé řešit jen poassonem?

Nešlo. Poisson říká, kolik bloků útočník najde **za pevný čas**. Po okamžiku, kdy obchodník vydá zboží, ale závod pokračuje a útočník může řetězec doběhnout kdykoli později. Otázka „dožene to někdy?" je bez časového limitu a řeší ji random walk.

- Random walk potřebuje znát výchozí mezeru. Dává (q/p)^n.
- Poisson určuje, jaká ta mezera v okamžiku vydání zboží je (kolik bloků *k* útočník tajně našel).
- Suma průměruje přes všechny možné vstupy.
- Přesně vzato je počet útočníkových bloků negativně binomický, Satoshi ho aproximuje Poissonem s λ = z · q/p.

## 6. Co když je q/p větší než jedna?

> no ale pokud q/p je vetší než jedna, utočník má velkou pravděpodobnost, že doběhl z bloků

Správně, a proto je vzorec psaný jen pro **q < p** (poctivá většina).

- Pro q > p je λ > z, takže většina pravděpodobnosti leží u k > z, kde je člen roven 1.
- Pro k ≤ z by ale (q/p)^(z−k) > 1, což není pravděpodobnost.
- Gambler's ruin má dvě větve: q < p → (q/p)^n, q ≥ p → 1. Satoshiho vzorec používá jen první.
- Při implementaci přidat `if (q >= p) return 1;` (whitepaperův C kód dělá `if (p < q) return 1.0;`).

## 7. Jak bude vzorec vypadat pro k > z?

> jak bude tedy vypadat ten vzorec pro k>z?

Člen ve složené závorce je 1, takže příspěvek je jen `λ^k e^(−λ) / k!`. Celek se dá rozdělit na dvě sumy:

```
P = Σ_{k=0}^{z} (λ^k e^(−λ) / k!) · (q/p)^(z−k)  +  Σ_{k=z+1}^{∞} λ^k e^(−λ) / k!
```

Protože Poissonovy pravděpodobnosti dávají dohromady 1, platí `Σ_{k=z+1}^{∞} = 1 − Σ_{k=0}^{z}`. Sloučením vznikne konečný tvar:

```
P = 1 − Σ_{k=0}^{z} (λ^k e^(−λ) / k!) · (1 − (q/p)^(z−k))
```

Část pro k > z se do něj „schovala" ve výrazu „1 −". Dá se spočítat cyklem od 0 do z.
