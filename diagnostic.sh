#!/bin/bash
# FitForge — Diagnóstico completo de conexão
# Repositório: lucasleomendel/dynamic-exercise-pal

REPO="lucasleomendel/dynamic-exercise-pal"
SUPABASE_URL="https://jscquwhtsjdzripqfugf.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzY3F1d2h0c2pkenJpcHFmdWdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwNzAzODYsImV4cCI6MjA4ODY0NjM4Nn0._8BM_xAZ3tBUrkJVBsK6pOrH1gQXILSU4IuFnBmvDiU"
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzY3F1d2h0c2pkenJpcHFmdWdmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzA3MDM4NiwiZXhwIjoyMDg4NjQ2Mzg2fQ.0TPYrl_f9UXXmwSQM7A3CisISOhx0FAOyBZRuLe1MN0"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

pass() { echo -e "${GREEN}✅ $1${NC}"; }
fail() { echo -e "${RED}❌ $1${NC}"; }
info() { echo -e "${YELLOW}→ $1${NC}"; }

echo ""
echo "================================================"
echo "   FITFORGE — DIAGNÓSTICO DE CONEXÃO"
echo "================================================"
echo ""

# ── BLOCO 1: GIT ─────────────────────────────────
echo "── GITHUB ──────────────────────────────────────"

info "Remote configurado:"
git remote -v 2>/dev/null || fail "Nenhum remote encontrado"

echo ""
info "Branch atual:"
BRANCH=$(git branch --show-current 2>/dev/null)
[ -n "$BRANCH" ] && pass "$BRANCH" || fail "Branch não detectada"

echo ""
info "Últimos 5 commits locais:"
git log --oneline -5 2>/dev/null || fail "Sem histórico de commits"

echo ""
info "Status local vs remoto:"
git fetch origin --quiet 2>/dev/null
AHEAD=$(git rev-list HEAD..origin/${BRANCH} --count 2>/dev/null)
BEHIND=$(git rev-list origin/${BRANCH}..HEAD --count 2>/dev/null)
[ "$AHEAD" = "0" ] && [ "$BEHIND" = "0" ] && pass "Sincronizado com origin/$BRANCH" \
  || info "Local: $BEHIND commit(s) à frente | $AHEAD commit(s) atrás"

echo ""
info "Repositório remoto via API GitHub:"
GH_API=$(curl -s "https://api.github.com/repos/$REPO")
GH_NAME=$(echo $GH_API | grep -o '"full_name":"[^"]*"' | cut -d'"' -f4)
GH_BRANCH=$(echo $GH_API | grep -o '"default_branch":"[^"]*"' | cut -d'"' -f4)
GH_PUSHED=$(echo $GH_API | grep -o '"pushed_at":"[^"]*"' | cut -d'"' -f4)
GH_VIS=$(echo $GH_API | grep -o '"private":[a-z]*' | cut -d':' -f2)
[ -n "$GH_NAME" ] && pass "Repo: $GH_NAME | Branch: $GH_BRANCH | Último push: $GH_PUSHED | Privado: $GH_VIS" \
  || fail "Não foi possível acessar a API do GitHub (repo privado ou sem autenticação)"

echo ""
info "Últimos 3 commits remotos:"
curl -s "https://api.github.com/repos/$REPO/commits?per_page=3" \
  | grep -E '"sha"|"message"' \
  | paste - - \
  | sed 's/.*"sha":"\([^"]*\)".*"message":"\([^"]*\)".*/  \1 — \2/' \
  2>/dev/null || fail "Não foi possível listar commits remotos"

echo ""
info "Arquivos críticos no repositório:"
FILES=(
  "middleware.ts"
  "utils/supabase/client.ts"
  "utils/supabase/server.ts"
  "utils/supabase/admin.ts"
  "utils/supabase/middleware.ts"
  "package.json"
  ".env.local"
)
for f in "${FILES[@]}"; do
  [ -f "$f" ] && pass "$f" || fail "$f — AUSENTE"
done

echo ""
info "Dependências no package.json:"
DEPS=("@supabase/supabase-js" "@supabase/ssr" "next" "react" "react-dom")
for dep in "${DEPS[@]}"; do
  VERSION=$(grep "\"$dep\"" package.json 2>/dev/null | head -1 | grep -o '": *"[^"]*"' | tr -d '": ')
  [ -n "$VERSION" ] && pass "$dep @ $VERSION" || fail "$dep — NÃO ENCONTRADO"
done

# ── BLOCO 2: SUPABASE ────────────────────────────
echo ""
echo "── SUPABASE ─────────────────────────────────────"

info "REST API:"
REST=$(curl -s -o /dev/null -w "%{http_code}" \
  "$SUPABASE_URL/rest/v1/" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $ANON_KEY")
[ "$REST" = "200" ] && pass "REST API respondeu 200" || fail "REST API retornou $REST"

echo ""
info "Auth endpoint:"
AUTH=$(curl -s -o /dev/null -w "%{http_code}" \
  "$SUPABASE_URL/auth/v1/settings" \
  -H "apikey: $ANON_KEY")
[ "$AUTH" = "200" ] && pass "Auth respondeu 200" || fail "Auth retornou $AUTH"

echo ""
info "Tabelas públicas (anon key):"
TABLES_ANON=$(curl -s \
  "$SUPABASE_URL/rest/v1/rpc/version" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" 2>/dev/null)

TABLES=$(curl -s \
  "$SUPABASE_URL/rest/v1/?apikey=$ANON_KEY" \
  -H "Authorization: Bearer $ANON_KEY" 2>/dev/null)
echo "  $TABLES" | head -5

echo ""
info "Tabelas públicas (service role):"
TABLES_SR=$(curl -s \
  "$SUPABASE_URL/rest/v1/?apikey=$SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" 2>/dev/null)
echo "  $TABLES_SR" | head -5

echo ""
info "Realtime endpoint:"
RT=$(curl -s -o /dev/null -w "%{http_code}" \
  "$SUPABASE_URL/realtime/v1/api" \
  -H "apikey: $ANON_KEY")
[ "$RT" = "200" ] || [ "$RT" = "301" ] \
  && pass "Realtime acessível ($RT)" \
  || fail "Realtime retornou $RT"

# ── RESUMO ───────────────────────────────────────
echo ""
echo "================================================"
echo "   RESUMO FINAL"
echo "================================================"
echo "Repo:      https://github.com/$REPO"
echo "Supabase:  $SUPABASE_URL"
echo "Branch:    $BRANCH"
echo "REST API:  $REST"
echo "Auth:      $AUTH"
echo "Realtime:  $RT"
echo "================================================"
echo ""
