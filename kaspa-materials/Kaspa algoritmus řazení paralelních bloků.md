# Kaspa algoritmus řazení paralelních bloků

## User

Přeším Kaspa kryptoměnu a její algoritmus pro řazení paralelních bloků. Řešme situaci, kdy na jeden genesis blok navazují 2 paralelní bloky (blok 1 a 2) a na tyto 2 bloky navazují náhodně dalších 10 bloků (blok 3 až 12). udělej obrázek této struktury a pak se budeme bavit dál.

## Claude

Tady je struktura DAG (Directed Acyclic Graph) jak ji Kaspa používá.

Pár poznámek k tomu, co vidíš:

**Vrstva 0** — Genesis blok, jediný počáteční bod celé sítě.

**Vrstva 1** — Blok 1 a Blok 2 vznikly přibližně ve stejný čas a oba referencují Genesis. To je klíčový rozdíl oproti Bitcoinu — v Kaspě tyto bloky *nejsou* v konfliktu, obojí jsou platné.

**Vrstva 2** — Bloky 3–12 vznikají náhodně a každý referencuje jeden nebo více bloků z předchozích vrstev. Šipky záměrně kříží přes vrstvy — blok může referencovat klidně bloky z různých "výšek" DAGu, nejen bezprostředního předchůdce.

Toto je základ toho, proč Kaspa dosahuje vysoké propustnosti. Teď mi řekni — co tě zajímá dál? Chceš probrat algoritmus **GHOSTDAG**, který z tohoto chaosu paralelních bloků vybere kanonické pořadí? Nebo třeba to, jak se detekují konflikty transakcí v paralelních blocích?

## User

Pomocí GHOSTDAG (greedy) algoritmu mi obarvi blue-set a urči konstantu "k" na hodnotu 3. Vypisuj mi postup

## Claude

Nejdřív si připomeňme pravidla GHOSTDAG:

**k = 3** znamená, že každý blok smí mít v tzv. **past** (všichni jeho předchůdci) nejvýše k bloků, které jsou **anticone** (tj. nejsou navzájem propojené). Blue-set je pak ta největší množina bloků, která toto pravidlo splňuje.

Postup GHOSTDAG greedy algoritmu:
1. Začni od Genesis, postupuj topologicky dopředu
2. Pro každý blok vyber **blue parent** — rodiče s největším blue-set v jeho minulosti
3. Přidej do blue-set ty bloky z anticone blue parenta, jejichž anticone vůči dosavadnímu blue-setu má velikost ≤ k
4. Blok samotný přidej do blue-set, pokud splňuje podmínku

Pojďme krok po kroku:

Nejdřív si musím přesně definovat topologii DAGu z minulého obrázku, abych mohl korektně počítat. Použiji stejné hrany jako v předchozím diagramu.

---

**Definice grafu (hrany — každý blok referencuje své rodiče):**

- B1 → Genesis, B2 → Genesis
- B3 → B1, B4 → B1, B2; B5 → B1, B2; B6 → B2; B7 → B1, B2
- B8 → B3, B4; B9 → B3, B5; B10 → B4, B5, B6; B11 → B6, B7; B12 → B5, B7

---

**Krok 1 — Genesis**

Genesis nemá žádné předchůdce. Anticone(Genesis) = ∅. Genesis → **BLUE** ✓

Blue-set: {G}

---

**Krok 2 — Vrstva 1: B1 a B2**

B1 a B2 jsou paralelní — navzájem jsou v anticone (žádný není předchůdcem toho druhého).

- B1: past(B1) = {G}. Anticone B1 vůči blue-setu = {B2}. |anticone| = 1 ≤ k=3 → **BLUE** ✓
- B2: past(B2) = {G}. Anticone B2 vůči blue-setu = {} (B1 je už blue, ale B2 je potomek G, ne B1). Anticone(B2) ∩ blue = {B1}. |anticone| = 1 ≤ 3 → **BLUE** ✓

Blue-set: {G, B1, B2}

---

**Krok 3 — Vrstva 2 (B3–B12): výběr blue parenta a přidávání**

Každý blok v této vrstvě má jako rodiče bloky z vrstvy 1. Projdeme je v topologickém pořadí. Blue parent = rodič s největším blue-set v minulosti.

Pro každý blok Bx spočítám jeho anticone vůči dosavadnímu blue-setu: to jsou bloky ve stejné vrstvě, které nejsou v past(Bx) ani Bx není v jejich past.

**B3** (rodiče: B1): anticone(B3) ∩ blue = {B2, B4,B5,B6,B7,B8...B12} — ale zatím z vrstvy 2 není nic blue. Anticone ve vrstvě 1 = {B2}. |anticone| = 1 ≤ 3 → **BLUE** ✓

**B4** (rodiče: B1, B2): anticone = bloky sourozenci, které nejsou předci ani potomci. Ve vrstvě 2 zatím blue = {B3}. B3 a B4 mají společného rodiče ale nejsou propojeni → anticone. |anticone ∩ blue| = 1 ≤ 3 → **BLUE** ✓

**B5** (rodiče: B1, B2): anticone ∩ blue = {B3, B4}. |anticone| = 2 ≤ 3 → **BLUE** ✓

**B6** (rodiče: B2): anticone ∩ blue = {B3, B4, B5} (všechny jsou blue a žádný není v past B6 ani B6 v jejich past). |anticone| = 3 ≤ 3 → **BLUE** ✓

**B7** (rodiče: B1, B2): anticone ∩ blue = {B3, B4, B5, B6}. |anticone| = 4 > k=3 → **RED** ✗

**B8** (rodiče: B3, B4): anticone ∩ blue = {B5, B6} (B3,B4 jsou v past B8, B7 je red). |anticone| = 2 ≤ 3 → **BLUE** ✓

**B9** (rodiče: B3, B5): anticone ∩ blue = {B4, B6, B8}. |anticone| = 3 ≤ 3 → **BLUE** ✓

**B10** (rodiče: B4, B5, B6): anticone ∩ blue = {B3, B8, B9}. |anticone| = 3 ≤ 3 → **BLUE** ✓

**B11** (rodiče: B6, B7): anticone ∩ blue = {B3, B4, B5, B8, B9, B10}. |anticone| = 6 > 3 → **RED** ✗

**B12** (rodiče: B5, B7): anticone ∩ blue = {B3, B4, B6, B8, B9, B10}. |anticone| = 6 > 3 → **RED** ✗

---

**Výsledek:** Blue = {G, B1, B2, B3, B4, B5, B6, B8, B9, B10} | Red = {B7, B11, B12}

Shrnutí výsledku GHOSTDAG s k=3:

**Blue-set (10 bloků):** Genesis, B1, B2, B3, B4, B5, B6, B8, B9, B10

**Red (3 bloky):** B7, B11, B12

Klíčové momenty rozhodování:

B7 byl první "obětí". V momentě kdy jsme ho zpracovávali, bylo v blue-setu už {B3, B4, B5, B6} — čtyři bloky, které jsou vůči B7 v anticone (nejsou navzájem propojeni přímou hranou v žádném směru). To je o jeden více než k=3, takže B7 vypadl.

B11 a B12 jsou red kombinací dvou příčin — mají B7 jako rodiče (red blok, který do blue-setu nepřispěl) a zároveň samy mají enormní anticone vůči blue-setu (6 bloků), protože "přišly pozdě" do přeplněné vrstvy.

Zajímavé je, že B8, B9, B10 prošly navzdory tomu, že jsou ve stejné vrstvě — dostaly se na řadu dříve v topologickém pořadí, takže jejich anticone vůči blue-setu ještě nepřekročil limit.

Chceš probrat, jak se z tohoto blue-setu sestaví lineární pořadí bloků (topological order), nebo třeba co by se změnilo při k=2 nebo k=4?

## User

Podle čeho se rozhodno, že zrovna B7 vypadl? Jednalo se o tie-break? Vypadl by, kdyby hash B7 odpovídal lépe pravidlům tie-break?

## Claude

Výborná otázka — tady jsem udělal chybu ve výkladu. Musím to opravit.

**B7 nevypadl kvůli tie-breaku. Vypadl proto, že má objektivně větší anticone než k=3.**

Pojďme to rozebrat přesně.

---

## Anticone B7 — proč je to 4, ne záležitost tie-breaku

Když zpracováváme B7, jeho rodiče jsou B1 a B2. Podívej se, kdo je v jeho anticone vůči blue-setu v tom momentě:

- **B3** — rodič je jen B1, B7 ho nereferencuje a B3 nereferencuje B7. Jsou "vedle sebe". ✓ anticone
- **B4** — rodiče B1, B2. Stejná situace, žádné přímé propojení s B7. ✓ anticone
- **B5** — rodiče B1, B2. Stejná situace. ✓ anticone
- **B6** — rodič je jen B2. Žádné propojení s B7. ✓ anticone

To jsou **4 bloky v anticone**, a všechny jsou blue. Limit je k=3. B7 tedy **nesplňuje podmínku bez ohledu na hash** — pravidlo říká, že blok smí mít nejvýše k blue bloků v anticone, a B7 jich má 4.

---

## Kdy by tie-break nastoupil?

Tie-break (porovnání hashů) nastupuje pouze ve dvou situacích:

1. **Výběr blue parenta** — když dva rodiče mají stejně velký blue-set ve své minulosti. Tehdy vybíráš toho s lexikograficky menším hashem.

2. **Hranice blue-setu je přesně na k** — to znamená, kdyby anticone B7 byl přesně 3 (= k), blok by prošel. Tie-break nerozhoduje o tom, jestli blok prošel nebo ne při počtu > k.

Jinými slovy: **hash by B7 pomohl jedině tehdy, kdyby měl anticone = 3**, tedy kdybychom jeden ze sourozenců B3/B4/B5/B6 hodnotili jako red před B7. Pak by anticone B7 vůči blue-setu klesl na 3 a B7 by prošel.

---

## Mohl by B7 projít jiným uspořádáním?

Ano — a to je zajímavá část. Záleží na **pořadí zpracování bloků** v topologickém průchodu. Kdybychom zpracovávali B7 dříve než např. B6:

- Pořadí: B3, B4, B5, **B7**, B6 ...
- Při zpracování B7: anticone ∩ blue = {B3, B4, B5} = **3** ≤ k → B7 by byl **BLUE**
- Pak by při zpracování B6: anticone ∩ blue = {B3, B4, B5, **B7**} = 4 > k → **B6 by byl RED**

A tady tie-break skutečně nastoupí — **pokud mají B6 a B7 stejnou "váhu"** při rozhodování o pořadí zpracování, použije se hash. GHOSTDAG zpracovává bloky ve vrstvě v pořadí určeném hashem (lexikograficky menší hash = zpracován dříve = výhoda). Takže hash B7 oproti B6 rozhoduje o tom, **který z nich "obsadí místo" a který vypadne** — ale až ve chvíli kdy jsou oba na hranici k.

Chceš, abych překreslil scénář kde B7 má lepší hash než B6 a projde, zatímco B6 vypadne?

## User

Chci překreslit situaci, kdy útočník vytěží 2 nové bloky. Blok X bude mít předka B1 a B2 a bude mít  lexikograficky malý hash. Blok Y bude mít předky B3 až B7 a taky předchůdce blok X. Potřebuji pořadí bloků bez bloku X a Y pak pořadí včetně X a Y.

## Claude

Nejdřív si ujasněme strukturu nových bloků:

- **Blok X** — rodiče: B1, B2 (stejná vrstva jako B3–B7, ale s malým hashem → zpracován jako první ve vrstvě)
- **Blok Y** — rodiče: B3, B4, B5, B6, B7, X (agreguje celou předchozí vrstvu + X)

Toto je klasický **útok paralelními bloky** — útočník se snaží pomocí X "obsadit místo" v blue-setu a vytlačit poctivé bloky, pak Y vše zakryje velkým anticone.

---

## Scénář A — bez X a Y (původní výsledek)

Topologické pořadí blue-setu (dle GHOSTDAG, hloubka + hash):

**G → B1 → B2 → B3 → B4 → B5 → B6 → B8 → B9 → B10**

Red bloky (vyřazeny z pořadí, ale existují v DAGu): B7, B11, B12

---

## Scénář B — výpočet s X a Y

Nyní přidám X a Y a přepočítám celý blue-set.

**X** má rodiče B1, B2 a **lexikograficky nejmenší hash ve vrstvě** → zpracován jako úplně první mezi B3–B7 a X.

Topologické pořadí zpracování vrstvy 2 (řada 1): **X, B3, B4, B5, B6, B7**

- **X**: anticone ∩ blue = {} (ještě nikdo jiný ze sourozenců není blue) → **BLUE** ✓
- **B3**: anticone ∩ blue = {X} → 1 ≤ 3 → **BLUE** ✓
- **B4**: anticone ∩ blue = {X, B3} → 2 ≤ 3 → **BLUE** ✓
- **B5**: anticone ∩ blue = {X, B3, B4} → 3 ≤ 3 → **BLUE** ✓
- **B6**: anticone ∩ blue = {X, B3, B4, B5} → **4 > 3 → RED** ✗
- **B7**: anticone ∩ blue = {X, B3, B4, B5} → **4 > 3 → RED** ✗

X tedy svou přítomností vytlačil B6 (a B7 zůstal red stejně jako dříve). Blue v této vrstvě: {X, B3, B4, B5}.

**Y** má rodiče B3, B4, B5, B6, B7, X — tedy referencuje celou předchozí vrstvu.

- **Y**: Všichni rodiče jsou v past(Y). Anticone(Y) ∩ blue = {B8, B9, B10} (bloky které nejsou ani předci ani potomci Y). → 3 ≤ 3 → **BLUE** ✓

Vrstva s B8–B12: zpracování stejné jako dříve, ale B6 je teď red → anticone podmínky se mírně mění:

- **B8** (rodiče B3, B4): anticone ∩ blue = {B5, Y pokud zpracován} — Y je v budoucnosti, počítáme bez něj. anticone = {B5} → 1 ≤ 3 → **BLUE** ✓
- **B9** (rodiče B3, B5): anticone ∩ blue = {B4, B8} → 2 ≤ 3 → **BLUE** ✓
- **B10** (rodiče B4, B5, B6): anticone ∩ blue = {B3, B8, B9} → 3 ≤ 3 → **BLUE** ✓
- **B11** (rodiče B6, B7): oba rodiče jsou red, anticone ∩ blue = {B3, B4, B5, B8, B9, B10} → 6 > 3 → **RED** ✗
- **B12** (rodiče B5, B7): anticone ∩ blue = {B3, B4, B8, B9, B10} → 5 > 3 → **RED** ✗
- **Y** (rodiče B3–B7, X): past(Y) zahrnuje celou předchozí vrstvu. anticone ∩ blue = {B8, B9, B10} → 3 ≤ 3 → **BLUE** ✓

---

## Co útočník získal a co nezískal

Útočník svými dvěma bloky dosáhl toho, že **X a Y jsou v blue-setu** a jejich transakce dostanou prioritu v kanonickém pořadí. Navíc **vytlačil B6** — poctivý blok — z blue-setu. Transakce v B6 jsou sice stále v DAGu, ale jsou označeny jako red a mají nižší prioritu.

Nicméně útok má přirozené limity. Y sice prošel do blue-setu, ale pouze proto, že referencuje celou předchozí vrstvu — to je vlastně "poctivé" chování z pohledu protokolu. Y skutečně vidí a potvrzuje všechny bloky vrstvy 2. A přestože útočník kontroluje pořadí X a Y, **poctivé uzly B8, B9, B10 zůstaly blue** a jejich transakce jsou platné.

Chceš probrat, jak by Kaspa tomuto útoku bránila zvýšením k, nebo jak moc hashrate útočník potřebuje aby udržel tento vzor dlouhodobě?

## User

Blok X nemá B1 jako předchůdce, přepočítej pro případ, kdy blok X má předky B1 a B2

## Claude

Počkej — to je přesně to, co jsem v minulém výpočtu měl. Blok X má rodiče **B1 a B2**, což jsem správně zakreslil (šipky z B1 i B2 do X). Ale podívám se znovu detailně na hrany v diagramu...

Ty máš pravdu — v kódu jsem udělal chybu. Šipka z **B1 do X chybí**. Do X vedla pouze šipka z B2. Hrany do X byly:

- `B2 → X` ✓ (nakresleno)
- `B1 → X` ✗ (chybělo!)

Výpočet blue-setu byl přesto správný (X má rodiče B1 i B2, anticone = {} při zpracování jako první → BLUE), ale diagram byl klamavý. Překreslím ho s oběma správnými hranami.

Opraveno — X teď správně zobrazuje obě hrany, zlatou z **B1 → X** i z **B2 → X**.

Výpočet se tím nijak nemění, výsledek blue-setu zůstává stejný jako v minulém scénáři. Opravený diagram jen přesně odráží to, co jsme počítali — X je legitimní blok vrstvy 2 se dvěma rodiči z vrstvy 1, díky nejmenšímu hashi zpracován první, a proto obsadí slot ještě před B3.

Chceš pokračovat analýzou toho, kolik hashrate útočník potřebuje aby tento vzor udržel, nebo se podíváme na to jak Y ovlivní výsledné kanonické pořadí transakcí?

