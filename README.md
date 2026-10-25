# SmartPlay IPTV — player web

Projeto demonstrativo de um reprodutor IPTV que roda no navegador do PC e pode ser publicado em hospedagem estática gratuita.

## Recursos

- Interface responsiva inspirada em players IPTV modernos.
- Importação de lista M3U/M3U8 por arquivo local ou URL direta.
- Pesquisa, filtro por categoria e favoritos.
- Player HTML5 com suporte HLS via hls.js.
- Não contém canais pagos, credenciais, nem listas pirateadas.

## Testar no Windows

1. Extraia o ZIP para uma pasta.
2. Abra `index.html` no Chrome ou Edge.
3. Clique em **Adicionar lista M3U** e selecione seu arquivo `.m3u` ou `.m3u8`.
4. Se usar uma URL, ela deve ser uma URL direta para o arquivo da lista e o servidor precisa permitir CORS.

A biblioteca HLS é carregada de um CDN, então a reprodução HLS precisa de internet. Alguns streams não funcionam por restrições do servidor, CORS, codecs, geobloqueio, autenticação ou DRM. O player não contorna essas restrições.

## Publicar online gratuitamente com GitHub Pages

1. Crie uma conta em https://github.com, se ainda não tiver.
2. Crie um repositório novo, por exemplo `smartplay-iptv`, e deixe-o **Public**.
3. Envie os arquivos `index.html`, `styles.css`, `app.js` e `README.md` para a raiz do repositório.
4. No repositório, abra **Settings → Pages**.
5. Em **Build and deployment**, selecione **Deploy from a branch**.
6. Escolha a branch `main` e a pasta `/ (root)` e clique em **Save**.
7. Aguarde a publicação. O GitHub mostrará um link parecido com `https://SEU-USUARIO.github.io/smartplay-iptv/`.

O endereço exato depende do seu nome de usuário e repositório; não é possível gerar o link público sem publicar na sua conta.

## Importante sobre listas e segurança

- Use apenas listas e transmissões que você tenha autorização para acessar.
- Evite publicar links privados, tokens ou credenciais em um site público: visitantes podem inspecionar o código e as requisições.
- Uma lista M3U pode conter endereços privados ou informações de acesso. Não a inclua no repositório público.
- Este projeto não armazena a lista em um servidor; a lista é carregada no navegador do usuário.
- O player não oferece autenticação, backend, EPG/guia de programação, suporte a DRM nem gerenciamento de usuários.
- Para listas remotas, o servidor de origem precisa permitir requisições CORS. Se não permitir, baixe o arquivo e carregue-o pelo seletor de arquivo.
- A hospedagem gratuita serve os arquivos do site, não hospeda nem retransmite os vídeos.

## Formato M3U esperado

O formato comum é:

```m3u
#EXTM3U
#EXTINF:-1 tvg-name="Exemplo" tvg-logo="https://exemplo.com/logo.png" group-title="Notícias",Canal Exemplo
https://servidor-autorizado.example/live/canal.m3u8
```

A extensão `.m3u8` pode representar uma playlist HLS, enquanto o arquivo M3U de entrada lista canais e URLs.
