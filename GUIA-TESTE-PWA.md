# 📱 Guia Completo para Testar o PWA - Site de Questões DP-300

## 🌐 URLs para Teste

### 1. **Servidor Local (Build de Produção)**
- **Desktop:** http://localhost:4173/
- **Mobile/Rede Local:** http://192.168.1.6:4173/

### 2. **Servidor de Desenvolvimento** (caso queira testar)
```bash
npm run dev -- --host
# Acesse via: http://192.168.1.6:5173/
```

## 📱 Como Testar no Mobile

### **Android:**

#### Chrome/Edge/Firefox:
1. Conecte o dispositivo na mesma rede Wi-Fi
2. Acesse: `http://192.168.1.6:4173/`
3. **Instalação PWA:**
   - Chrome: Menu (⋮) → "Instalar app" ou "Adicionar à tela inicial"
   - Edge: Menu (⋯) → "Apps" → "Instalar este site como app"
   - Firefox: Menu → "Instalar"

#### Samsung Internet:
1. Acesse a URL
2. Menu → "Adicionar página a" → "Tela inicial"

### **iOS (iPhone/iPad):**

#### Safari:
1. Acesse: `http://192.168.1.6:4173/`
2. Toque no botão **Compartilhar** (□↗)
3. Role para baixo e toque em **"Adicionar à Tela de Início"**
4. Confirme o nome e toque em **"Adicionar"**

## 🧪 Testes Essenciais

### ✅ **1. Instalação PWA**
- [ ] Prompt de instalação aparece automaticamente
- [ ] Consegue instalar via menu do navegador
- [ ] Ícone aparece na tela inicial
- [ ] App abre em tela cheia (sem barra do navegador)

### ✅ **2. Funcionamento Básico**
- [ ] Login/cadastro funciona
- [ ] Dashboard carrega
- [ ] Consegue ver questões
- [ ] Consegue responder questões
- [ ] Área de revisão funciona

### ✅ **3. Funcionamento Offline**
- [ ] **Desconecte a internet** (Wi-Fi + dados móveis)
- [ ] App ainda funciona
- [ ] Consegue responder questões offline
- [ ] Indicador "OFFLINE" aparece no header
- [ ] Respostas ficam na fila de sincronização

### ✅ **4. Sincronização Online**
- [ ] **Reconecte a internet**
- [ ] Indicador muda para "ONLINE"
- [ ] Respostas offline são sincronizadas automaticamente
- [ ] Fila de sincronização fica vazia
- [ ] Dados aparecem corretamente no dashboard

### ✅ **5. Performance Mobile**
- [ ] Interface responsiva
- [ ] Botões têm tamanho adequado para toque
- [ ] Navegação fluida entre questões
- [ ] Carregamento rápido

## 🔧 **Resolução de Problemas**

### **Não consegue acessar via rede:**
1. Verifique se ambos dispositivos estão na mesma rede Wi-Fi
2. Desative firewall temporariamente no PC
3. Teste com IP: `http://192.168.1.6:4173/`

### **PWA não instala:**
1. Verifique se está usando HTTPS ou localhost
2. Limpe cache do navegador
3. Teste em modo privado/incógnito primeiro

### **Offline não funciona:**
1. Abra DevTools → Application → Service Workers
2. Verifique se o SW está ativo
3. Teste desconectando via DevTools primeiro

### **Sincronização não funciona:**
1. Verifique console do navegador para erros
2. Confirme se Firebase está configurado
3. Teste login/logout

## 📊 **Comandos Úteis**

```bash
# Build e preview
npm run build
npm run preview

# Com acesso via rede
npm run preview -- --host

# Desenvolvimento com rede
npm run dev -- --host

# Verificar portas em uso
netstat -an | findstr 4173

# Ver IP local
ipconfig | findstr IPv4
```

## 🚀 **Próximos Passos**

Após testar:
1. **Teste em diferentes dispositivos/navegadores**
2. **Compartilhe com outros usuários para feedback**
3. **Considere deploy em produção (Vercel/Netlify)**
4. **Documente bugs encontrados**
5. **Otimize baseado no feedback de uso real**

---

**Status atual:** ✅ Servidor rodando em http://192.168.1.6:4173/
**Pronto para teste!** 🎉
