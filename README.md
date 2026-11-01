# Editor de Imagem — Fragmento Liferay

Fragmento para Liferay que permite **recortar, redimensionar, converter e comprimir uma imagem direto no navegador** e salvá-la em **Documents & Media** com um clique.

## O problema que ele resolve

Em portais corporativos, é comum que quem publica conteúdo receba imagens fora do padrão: fotos de celular com 8 MB, proporções erradas, formatos pesados e metadados que o usuário nem sabe que existem. O fluxo tradicional é sair do portal, abrir um editor externo, ajustar a imagem, voltar e fazer o upload. Isso toma tempo, depende de software instalado e deixa o resultado final sem padronização.

Este fragmento concentra tudo em uma única tela dentro do próprio Liferay.

## Como funciona

1. **Seleção:** o usuário arrasta uma imagem para a área indicada ou clica para escolher o arquivo.
2. **Edição:** a imagem abre em um editor visual, onde ele define o recorte (livre ou em proporções prontas como 1:1, 16:9, 4:3, 9:16 e 3:4), as dimensões de saída, o formato (JPEG, WebP ou PNG) e a qualidade.
3. **Pré-visualização:** antes de salvar, ele vê o resultado e confere o **tamanho final do arquivo** e as **dimensões em pixels**.
4. **Salvamento:** com um clique, o arquivo é enviado para a **raiz do Documents & Media do site**.

Todo o processamento de imagem (recorte, redimensionamento, compressão) acontece **no navegador do usuário**. O servidor recebe apenas o arquivo final, já otimizado.

## Principais vantagens

- **Padronização:** quem publica envia imagens já no tamanho, formato e proporção desejados, sem depender de conhecimento técnico.
- **Economia de armazenamento e banda:** imagens menores significam páginas mais leves e menos espaço consumido no Documents & Media.
- **Privacidade:** os metadados EXIF (como localização GPS e modelo do aparelho) são removidos automaticamente, porque a imagem é redesenhada antes do envio.
- **Menos retrabalho:** não é preciso sair do portal nem instalar editores de imagem.
- **Carga reduzida no servidor:** como o processamento é feito no cliente, o Liferay não gasta CPU redimensionando ou comprimindo imagens.
- **Integração nativa:** usa a Headless Delivery API e a sessão do usuário logado, respeitando as permissões já configuradas no Liferay. Quem não pode adicionar documentos no site não consegue salvar.

## Para quem é útil

- Equipes de comunicação e marketing que publicam banners e imagens de capa.
- Portais com muitos colaboradores que enviam fotos sem padrão definido.
- Administradores que querem garantir imagens leves e consistentes sem treinar cada usuário.

## Tecnologias

- **Liferay Fragments** (HTML, CSS e JavaScript)
- **[Cropper.js](https://github.com/fengyuanchen/cropperjs)** 1.6.1 para o recorte (carregado do cdnjs)
- **Canvas API** para redimensionar, converter e comprimir
- **Liferay Headless Delivery API** (`POST /o/headless-delivery/v1.0/sites/{siteId}/documents`) para salvar no Documents & Media
