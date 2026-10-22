# DexterLab — Impressão 3D

Front-end completo para a DexterLab, com vitrine pública e painel administrativo responsivo.

Projeto Supabase dedicado: `hqigbxruqexqiitlmcat`. O banco e a Edge Function já foram criados nele. A vitrine usa a chave **publishable** em `.env.local` (ignorado pelo Git), e a Vercel já recebeu as duas variáveis públicas para produção. O push em `main` inicia um deploy pela integração Git da Vercel.

## Recursos

- Catálogo público com busca e categorias
- Cadastro, edição, inativação e exclusão de produtos
- Controle e histórico de estoque
- Pedidos sincronizados por webhook da Kiwify; checkout e pagamento fora do site
- Dashboard com faturamento, custo, lucro e ticket médio
- Relatórios e exportação CSV
- Gráficos com Recharts
- Animações com Motion e GSAP ScrollTrigger
- Persistência no Supabase com autenticação por código de e-mail, dois superadmins e RLS

## Desenvolvimento

```bash
npm install
npm run dev
```

## Configurar Supabase

1. Use apenas o projeto Supabase **DexterLab**; não execute esta configuração no `LabsDemo`.
2. [A migração inicial](supabase/migrations/202609210001_dexterlab.sql) e [a correção do catálogo](supabase/migrations/202609220001_catalog_security.sql) já foram executadas no projeto DexterLab. **Não execute a migração inicial novamente.** Elas criam categorias, produtos, pedidos, eventos, histórico de estoque e RLS. A correção substitui a view pública por uma função de catálogo com saída limitada. Os dois e-mails de superadmin já estão na allowlist, mas só recebem acesso após verificarem o próprio e-mail pelo Supabase Auth.
3. O domínio oficial é `https://www.dexterlabs.com.br` e está configurado na Vercel. O Site URL e a única URL de redirecionamento permitida no Supabase Auth apontam para ele. O domínio de envio `dexterlabs.com.br` está verificado no Resend, e o remetente SMTP é `noreply@dexterlabs.com.br`. A nova credencial foi salva diretamente no Supabase, fora do repositório. Os modelos de [login por OTP](supabase/email-templates/otp.html) e [confirmação de cadastro](supabase/email-templates/confirm-signup-otp.html) usam `{{ .Token }}`. Um envio de teste recebeu HTTP 200 do Supabase e status **Delivered** no Resend; a entrada do código no site ainda precisa ser validada por quem tem acesso à caixa de e-mail.
4. Antes de liberar cadastro público, ajuste limites de envio, expiração do OTP e monitore abuso.
5. Copie `.env.example` para `.env.local` e preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`. Use **somente** a chave publishable (ou anon legada), nunca `service_role`, secret key ou senha do banco no Vite.
6. Para a Vercel, configure as mesmas duas variáveis de ambiente e faça novo deploy. Guarde a senha do banco em um gerenciador de senhas, nunca em arquivo de texto ou no repositório.

## Integração Kiwify

1. Cadastre cada produto oficial no painel DexterLab com `kiwify_product_id` e o link HTTPS de checkout da Kiwify. A vitrine só habilita “Comprar” quando houver link válido. Para peças produzidas após a compra, marque “sob encomenda”.
2. Crie um webhook na Kiwify para compra aprovada, recusada, reembolso, chargeback e cancelamento, apontando para `https://hqigbxruqexqiitlmcat.supabase.co/functions/v1/kiwify-webhook`.
3. Guarde o **token do webhook da Kiwify** como Supabase Secret `KIWIFY_WEBHOOK_TOKEN`; não o coloque no código, no navegador, no repositório ou na URL. A assinatura da requisição é conferida antes de qualquer gravação. A função usa `SUPABASE_SERVICE_ROLE_KEY` apenas no ambiente servidor.
4. A Edge Function `kiwify-webhook` já foi publicada com `verify_jwt = false`. Sem o segredo configurado, responde **503** e não processa eventos. Depois de configurar o segredo, chamadas sem assinatura válida devem receber **401**; teste isso antes de ativar o webhook na Kiwify.
5. Use “Testar Webhook” na Kiwify e confira `kiwify_eventos`, `pedidos` e `stock_movements` antes de ativar vendas reais. Repita o teste para validar idempotência e estorno. A documentação pública da Kiwify atualmente aponta para uma página de payload/assinatura indisponível; não considere a integração homologada sem esse teste real.

Sem essas variáveis, a vitrine apresenta produtos demonstrativos e o painel fica bloqueado. A migração não importa automaticamente dados antigos do `localStorage`; cadastre os produtos reais após a conexão.

## Verificação

```bash
npm run lint
npm run build
npm run dev
# em outro terminal: npm run test:e2e
```

## Deploy na Vercel

Importe o repositório na Vercel. A plataforma detectará o Vite automaticamente:

- Build command: `npm run build`
- Output directory: `dist`

As variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` já estão configuradas na Vercel para produção. Configure `VITE_GOOGLE_ADS_ID` e `VITE_META_PIXEL_ID` somente quando houver IDs reais e a integração com consentimento for validada. No momento não há tags de publicidade carregadas.

## Segurança

A função pública de catálogo expõe apenas campos de vitrine; custos, clientes, pedidos e webhooks são protegidos por RLS. A função é `SECURITY DEFINER` de propósito, não recebe parâmetros e retorna apenas produtos ativos; o Advisor ainda pode sinalizá-la como aviso. A allowlist de superadmin contém somente os dois e-mails informados. `pedidos` não aceita escrita pelo front-end: a Edge Function registra a entrega e a função SQL aplica pedido/estoque em uma transação idempotente. O payload bruto da Kiwify pode conter dados pessoais; defina retenção e acesso conforme a LGPD. Antes de operar em produção, revise backup, monitoramento, MFA dos superadmins e controles de abuso no projeto Supabase.
