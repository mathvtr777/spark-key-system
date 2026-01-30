# Spark Key System API

Backend para validação de keys do Spark Bot.

## Instalação

```bash
npm install
```

## Executar Localmente

```bash
npm start
```

A API estará disponível em `http://localhost:3000`

## Variáveis de Ambiente

Crie um arquivo `.env` (opcional):

```
PORT=3000
ADMIN_PASSWORD=sua_senha_aqui
```

Se não definir `ADMIN_PASSWORD`, a senha padrão será `admin123`.

## Endpoints

### Validação de Key (Público)
```
POST /api/validate
Body: { "key": "SPK-XXXX-XXXX-XXXX" }
```

### Admin: Criar Key
```
POST /api/admin/create-key
Body: { 
  "duration": 30,
  "plan": "Premium",
  "adminPassword": "admin123"
}
```

### Admin: Listar Keys
```
POST /api/admin/list-keys
Body: { "adminPassword": "admin123" }
```

### Admin: Deletar Key
```
POST /api/admin/delete-key
Body: { 
  "key": "SPK-XXXX-XXXX-XXXX",
  "adminPassword": "admin123"
}
```

## Deploy

### Vercel (Recomendado)

1. Instale Vercel CLI: `npm i -g vercel`
2. Execute: `vercel`
3. Siga as instruções

### Railway

1. Crie conta em railway.app
2. Conecte seu repositório GitHub
3. Deploy automático

### Render

1. Crie conta em render.com
2. New Web Service
3. Conecte repositório
4. Deploy
