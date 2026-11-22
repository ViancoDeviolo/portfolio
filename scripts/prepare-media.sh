#!/usr/bin/env bash
# Gera public/media (vídeos e pôsteres), src/assets/media (prints) e src/assets/dupla a partir de kit/media (git-ignored). Idempotente; rodar da raiz do repo.
set -euo pipefail
FF="ffmpeg -y -hide_banner -loglevel error"
SKIP="banco-java/banco-java-completo.mp4" # longo demais para loop; não publicado

# Regiões a borrar (CONFORMIDADE §3), formato x:y:largura:altura[:t_ini:t_fim em s]; sem tempo = o arquivo todo.
CALC_VIDEO_PATH="80:435:715:140"        # terminal Java: caminho C:\Users\<nome>\... (linhas 1 a 5 do comando), vídeo 1600x900
CALC_PRINT_PATH="100:655:1080:205"      # mesmo trecho no print 2400x1349
ANALITIC_PATH_TOP="0:0:790:40"          # prompt "PS C:\Users\<nome>\..." cortado no topo do print 2448x1658
ANALITIC_PATH_BOTTOM="0:1590:790:60"    # prompt final do print
BJ_FORM_FIELDS="360:235:345:380:0:25"   # janela Cadastro: nome, e-mail, CPF, celular, senha (vídeo 760x830)
BJ_ACCOUNT_DIALOG="255:390:200:70:22.5:25.5" # diálogo "Conta: 86122-0"
BJ_LOGIN_CPF="380:280:245:105:24.5:30"  # janela Login: campo CPF
BJ_ACCOUNT_FOOTER="360:700:260:100:29.5:36" # rodapé da tela da conta: cliente, agência, conta

# blur_graph "<scale-final>" spec...  -> filtergraph [0:v:0] ... [o]
blur_graph() {
  local g="[0:v:0]" i=0 x y w h a b r spec
  local fin="$1"; shift
  for spec in "$@"; do
    IFS=: read -r x y w h a b <<<"$spec"; a=${a:-0}; b=${b:-99999}
    r=$(( h/4-1 > 20 ? 20 : h/4-1 ))
    g+="split[a$i][b$i];[b$i]crop=$w:$h:$x:$y,boxblur=$r:5[c$i];[a$i][c$i]overlay=$x:$y:enable='between(t,$a,$b)'[v$i];[v$i]"
    i=$((i+1))
  done
  echo "${g}${fin}[o]"
}

# regions_for <arquivo-relativo-a-kit/media>: especificações de borrão do arquivo
regions_for() {
  case "$1" in
    calculadoras/calculadoras-java-python.mp4) echo "$CALC_VIDEO_PATH" ;;
    calculadoras/calculadoras-lado-a-lado.png) echo "$CALC_PRINT_PATH" ;;
    analitic-blitz/analitic-backtest-2021-2025.png) echo "$ANALITIC_PATH_TOP $ANALITIC_PATH_BOTTOM" ;;
    banco-java/banco-java-cadastro-deposito.mp4) echo "$BJ_FORM_FIELDS $BJ_ACCOUNT_DIALOG $BJ_LOGIN_CPF $BJ_ACCOUNT_FOOTER" ;;
  esac
}

for dir in kit/media/*/; do
  p=$(basename "$dir"); [ "$p" = dupla ] && continue
  out="public/media/$p"; prints="src/assets/media/$p"
  for f in "$dir"*.png; do
    [ -e "$f" ] || continue
    b=$(basename "$f" .png); read -ra R <<<"$(regions_for "$p/$b.png")"; mkdir -p "$prints"
    $FF -i "$f" -filter_complex "$(blur_graph null "${R[@]}")" -map "[o]" -map_metadata -1 -c:v libwebp -quality 88 "$prints/$b.webp"
  done
  for f in "$dir"*.mp4; do
    [ -e "$f" ] || continue
    [ "$p/$(basename "$f")" = "$SKIP" ] && continue
    mkdir -p "$out"
    b=$(basename "$f" .mp4); crf=28; w=1280; read -ra R <<<"$(regions_for "$p/$b.mp4")"
    while :; do # shortcut: se passar de 2 MB, sobe o crf e reduz a largura (ver relatório); sem limite de tentativas além de crf 40
      $FF -i "$f" -filter_complex "$(blur_graph "scale='min($w,iw)':-2" "${R[@]}")" -map "[o]" -an -map_metadata -1 -fflags +bitexact \
        -c:v libx264 -crf $crf -preset slow -movflags +faststart -pix_fmt yuv420p "$out/$b.mp4"
      [ "$(stat -c %s "$out/$b.mp4")" -le 2097152 ] && break
      crf=$((crf+2)); w=$((w>960 ? w-160 : w)); [ $crf -le 40 ] || { echo "$b > 2MB" >&2; exit 1; }
    done
    echo "$b crf=$crf w<=$w size=$(stat -c %s "$out/$b.mp4")"
    $FF -ss 1 -i "$out/$b.mp4" -frames:v 1 -map_metadata -1 -c:v libwebp -quality 80 "$out/$b-poster.webp"
  done
done

mkdir -p src/assets/dupla
$FF -i kit/media/dupla/casual-recorte-provisorio.png -map_metadata -1 src/assets/dupla/casual.png
$FF -i kit/media/dupla/terno-recorte-provisorio.png -map_metadata -1 src/assets/dupla/terno.png
