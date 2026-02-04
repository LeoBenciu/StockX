# Configurare OpenAI pentru StockX

## Pași pentru configurare:

### 1. Obține cheia API OpenAI

1. Mergi la: https://platform.openai.com/api-keys
2. Loghează-te sau creează un cont OpenAI
3. Click pe "Create new secret key"
4. Copiază cheia API (va arăta ceva de genul: `sk-...`)

### 2. Adaugă cheia în backend

Editează fișierul: `backend/.env`

Găsește linia:

```
OPENAI_API_KEY=placeholder
```

Și înlocuiește cu:

```
OPENAI_API_KEY=sk-tu-cheie-api-aici
```

**Exemplu:**

```
OPENAI_API_KEY=sk-proj-abc123xyz789...
```

### 3. Repornește backend-ul

După ce ai adăugat cheia, repornește serverul backend:

```bash
# Oprește backend-ul (Ctrl+C în terminalul unde rulează)
# Apoi pornește din nou:
cd backend
npm run start:dev
```

### 4. Testează

1. Încarcă o factură nouă
2. Sistemul va extrage automat ingredientele folosind AI
3. Ingredientele vor fi adăugate automat în inventar

## Notă importantă:

- **Costuri**: OpenAI API are costuri bazate pe utilizare. GPT-4o costă aproximativ $2.50-$5.00 per 1M tokens de input.
- **Limite**: Verifică limitele tale de API în dashboard-ul OpenAI
- **Securitate**: Nu partaja niciodată cheia ta API public sau în repository-uri Git

## Alternative:

Dacă nu vrei să folosești OpenAI, poți:

- Adăuga manual ingredientele din facturi folosind butonul verde (iconița pachet)
- Sau configura Google AI (GOOGLE_AI_API_KEY) ca alternativă
