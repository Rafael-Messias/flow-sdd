# Publicacao do flow-sdd no npm e GitHub

Este guia descreve o passo a passo para publicar o pacote `flow-sdd` no npm, subir o codigo para o GitHub e preparar o fluxo automatizado de release.

## Estado atual

Hoje o pacote deve ser tratado como repositorio dedicado, com o codigo do pacote na raiz do projeto.

Nome atual do pacote:

- `flow-sdd`

Workflow de release ja existente no repositorio:

- `.github/workflows/flow-sdd-release.yml`

Observacao importante:

- para o repositorio publico `flow-sdd`, use a raiz do projeto como diretório de trabalho;
- nao assuma uma estrutura `packages/...` nas instrucoes de publicacao.

## Visao geral do fluxo

1. Criar conta no GitHub.
2. Criar conta no npm.
4. Revisar os metadados do pacote antes da primeira publicacao.
5. Criar o repositorio no GitHub.
6. Inicializar Git localmente e fazer o primeiro push.
7. Validar o pacote localmente.
8. Fazer a primeira publicacao manual no npm.
9. Configurar `NPM_TOKEN` no GitHub.
10. Fazer os proximos releases por tag usando o workflow existente.

## Parte 1: criar sua conta no GitHub

### 1. Criar a conta

1. Acesse `https://github.com/`.
2. Clique em `Sign up`.
3. Siga o fluxo de cadastro.
4. Verifique seu email.

Sem email verificado, voce pode ficar bloqueado para algumas acoes basicas.

### 2. Opcional, mas recomendado

Depois da conta criada:

1. Ative 2FA.
2. Preencha nome, bio e avatar.
3. Instale o GitHub CLI (`gh`) se quiser um fluxo mais pratico.

## Parte 2: criar sua conta no npm

### 1. Criar a conta

1. Acesse `https://www.npmjs.com/signup`.
2. Escolha `username`, `email` e `password`.
3. Verifique o email da conta.

Sem email verificado, voce nao consegue publicar pacotes.

### 2. Testar login no terminal

No terminal:

```bash
npm login
npm whoami
```

Se `npm whoami` retornar seu usuario, o login local esta funcionando.

## Parte 3: confirmar o scope do pacote

O pacote atual usa este nome:

```json
"name": "flow-sdd"
```

Isso significa que o nome `flow-sdd` precisa estar livre no npm no momento da publicacao.

### Recomendacao

Se a ideia e manter um pacote unscoped simples, publique como `flow-sdd` e registre o nome o quanto antes no npm.

## Parte 4: revisar o pacote antes da primeira publicacao

Antes de publicar, revise `package.json`.

Hoje ele ja tem:

- `name`
- `version`
- `description`
- `author`
- `bin`
- `files`
- `engines`

Recomendo adicionar tambem:

- `license`
- `repository`
- `homepage`
- `bugs`
- `keywords`

Exemplo de campos recomendados:

```json
{
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/SEU-USUARIO/SEU-REPO.git"
  },
  "homepage": "https://github.com/SEU-USUARIO/SEU-REPO#readme",
  "bugs": {
    "url": "https://github.com/SEU-USUARIO/SEU-REPO/issues"
  },
  "keywords": [
    "sdd",
    "spec-driven-development",
    "codex",
    "claude",
    "workflow",
    "skills"
  ]
}
```

### Validar o pacote localmente

Na raiz do projeto:

```bash
npm ci
npm run build
npm run lint
npm run test
npm pack
```

Se `npm pack` funcionar, voce valida o pacote exatamente no formato que sera publicado.

## Parte 5: criar o repositorio no GitHub

### Opcao recomendada: criar pelo navegador

1. Acesse `https://github.com/new`.
2. Escolha o owner.
3. Defina o nome do repositorio.
4. Escolha `Public` ou `Private`.
5. Crie o repositorio.

### Nome sugerido de repositorio

Se este repo for dedicado ao pacote:

- `flow-sdd`

Se este repo continuar como repositorio mais amplo:

- use o nome final do repositorio que sera publicado

## Parte 6: inicializar Git localmente e subir para o GitHub

### Se este diretorio ainda nao tiver Git

Na raiz do projeto:

```bash
git init
git branch -M main
git add .
git commit -m "chore: initial import"
```

### Adicionar o remoto do GitHub

Use HTTPS:

```bash
git remote add origin https://github.com/SEU-USUARIO/SEU-REPO.git
git remote -v
git push -u origin main
```

### Autenticacao no push

O GitHub nao aceita mais senha comum em operacoes Git por HTTPS.

Voce pode autenticar de duas formas:

1. usando GitHub CLI:

```bash
gh auth login
```

2. usando Personal Access Token no lugar da senha.

## Parte 7: criar um token do GitHub para uso com HTTPS

Se voce nao quiser usar `gh auth login`, faca assim:

1. Acesse `GitHub > Settings > Developer settings > Personal access tokens`.
2. Crie um token `fine-grained` se ele cobrir seu caso.
3. Se o fluxo exigir algo que o fine-grained nao suporte, use `classic`.
4. Dê permissao de escrita no repositorio alvo.
5. Defina expiracao.
6. Copie o token e guarde com seguranca.

Quando o Git pedir sua senha no `git push`, use esse token.

## Parte 8: primeira publicacao manual no npm

### 1. Verificar se o pacote ja existe

No terminal:

```bash
npm view flow-sdd version
```

Se esse comando retornar erro `404`, o nome provavelmente ainda nao foi publicado.

### 2. Publicar manualmente

Na raiz do projeto:

```bash
npm publish --access public
```

Importante:

- o comando acima continua valido para padronizar o processo;
- para pacote unscoped, o ponto critico e a disponibilidade do nome no momento do publish.

### 3. Testar o pacote publicado

Depois da publicacao:

```bash
npm view flow-sdd
npx flow-sdd list --json
```

E abra a pagina publica:

- `https://www.npmjs.com/package/flow-sdd`

## Parte 9: configurar o release automatizado pelo GitHub

O repositorio ja tem este workflow:

- `.github/workflows/flow-sdd-release.yml`

No repositorio publico, ele:

1. roda em tags `flow-sdd-v*`;
2. valida `build`, `lint`, `test` e `npm pack`;
3. publica o pacote da raiz do repositorio com `npm publish --access public`.

### 1. Criar `NPM_TOKEN`

No npm:

1. Acesse sua conta.
2. Va em `Access Tokens`.
3. Gere um token com permissao de escrita para publicacao.
4. Copie o token imediatamente.

### 2. Adicionar o secret no GitHub

No GitHub:

1. Abra o repositorio.
2. Va em `Settings`.
3. Va em `Secrets and variables > Actions`.
4. Clique em `New repository secret`.
5. Nome: `NPM_TOKEN`
6. Valor: o token criado no npm

### 3. Publicar por tag

Depois que a primeira publicacao manual estiver validada, faca os proximos releases assim:

1. atualize `version` em `package.json`;
2. commite a mudanca;
3. crie a tag:

```bash
git tag flow-sdd-vX.Y.Z
git push origin main
git push origin flow-sdd-vX.Y.Z
```

Quando a tag subir, o workflow publica automaticamente.

## Parte 10: recomendacao de ordem para a primeira publicacao

Use esta ordem:

1. criar conta no GitHub;
2. criar conta no npm;
3. garantir que o nome `flow-sdd` esteja disponivel;
4. completar metadados do `package.json`;
5. criar repo no GitHub;
6. subir o codigo;
7. rodar validacoes locais;
8. publicar manualmente no npm;
9. testar instalacao real;
10. configurar `NPM_TOKEN`;
11. usar tags para os proximos releases.

## Checklist rapido

- [ ] Conta no GitHub criada e email verificado
- [ ] Conta no npm criada e email verificado
- [ ] Nome `flow-sdd` disponivel no npm
- [ ] `npm login` funcionando
- [ ] Repo criado no GitHub
- [ ] `git push origin main` funcionando
- [ ] `npm ci`
- [ ] `npm run build`
- [ ] `npm run lint`
- [ ] `npm run test`
- [ ] `npm pack`
- [ ] `npm publish --access public`
- [ ] Pagina no npm aberta
- [ ] `NPM_TOKEN` salvo no GitHub
- [ ] Workflow por tag validado

## Recomendacoes finais

### 1. Primeira publicacao: faca manual

Mesmo com workflow pronto, a primeira publicacao costuma ser melhor manualmente para:

- validar nome, scope e visibilidade;
- confirmar o pacote final;
- checar a pagina publica no npm.

### 2. Depois da primeira publicacao: use tag

Depois que tudo estiver certo, migre para o fluxo por tag ja existente no repo.

### 3. Futuro recomendado

Hoje o workflow usa `NPM_TOKEN`. Isso funciona.

Mas a documentacao do npm hoje recomenda `trusted publishing` para CI/CD quando possivel. Entao, no futuro, vale considerar migrar esse workflow para OIDC e eliminar token de publicacao de longo prazo.

## Links oficiais usados como referencia

- npm account creation: `https://docs.npmjs.com/creating-a-new-npm-user-account/`
- npm scoped public publish: `https://docs.npmjs.com/creating-and-publishing-scoped-public-packages/`
- npm access tokens: `https://docs.npmjs.com/creating-and-viewing-access-tokens/`
- npm CI/CD publishing guidance: `https://docs.npmjs.com/using-private-packages-in-a-ci-cd-workflow/`
- GitHub account creation: `https://docs.github.com/en/get-started/start-your-journey/creating-an-account-on-github`
- GitHub creating repository: `https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-new-repository`
- GitHub adding local code: `https://docs.github.com/en/migrations/importing-source-code/using-the-command-line-to-import-source-code/adding-locally-hosted-code-to-github`
- GitHub remotes: `https://docs.github.com/en/get-started/git-basics/managing-remote-repositories`
- GitHub personal access tokens: `https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens`
