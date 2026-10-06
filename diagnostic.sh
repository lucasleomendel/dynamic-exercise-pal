#!/bin/bash
# FitForge — Diagnóstico de conexão
# Não armazena chaves ou segredos no código-fonte.

set -u

REPO="lucasleomendel/dynamic-exercise-pal"
SUPABASE_URL="${SUPABASE_URL:-https://jscquwhtsjdzripqfugf.supabase.co}"
SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY:-${VITE_SUPABASE_PUBLISHABLE_KEY:-}}"

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

echo "── GITHUB ──────────────────────────────────────"
info "Remote configurado:"
git remote -v 2>/dev/null || fail "Nenhum remote encontrado"

BRANCH=$(git branch --show-current 2>/dev/null)
[ -n "$BRANCH" ] && pass "Branch atual: $BRANCH" || fail "Branch não detectada"

echo ""
info "Últimos 5 commits locais:"
git log --oneline -5 2>/dev/null || fail "Sem histórico de commits"

echo ""
info "Status local vs remoto:"
git fetch origin --quiet 2>/dev/null
AHEAD=$(git rev-list HEAD..origin/${BRANCH} --count 2>/dev/null || echo "?")
BEHIND=$(git rev-list origin/${BRANCH}..HEAD --count 2>/dev/null || echo "?")
[ "$AHEAD" = "0" ] && [ "$BEHIND" = "0" ] && pass "Sincronizado com origin/$BRANCH" \
  || info "Local: $BEHIND commit(s) à frente | $AHEAD commit(s) atrás"

echo ""
info "Repositório remoto via API GitHub:"
GH_API=$(curl -s "https://api.github.com/repos/$REPO")
GH_NAME=$(echo "$GH_API" | grep -o '"full_name":"[^"]*"' | cut -d'"' -f4)
[ -n "$GH_NAME" ] && pass "Repo: $GH_NAME" || fail "Não foi possível acessar a API do GitHub"

echo ""
echo "── SUPABASE ─────────────────────────────────────"
if [ -z "$SUPABASE_ANON_KEY" ]; then
  fail "Defina SUPABASE_ANON_KEY ou VITE_SUPABASE_PUBLISHABLE_KEY no ambiente para testar a API"
else
  info "REST API:"
  REST=$(curl -s -o /dev/null -w "%{http_code}" \
    "$SUPABASE_URL/rest/v1/" \
    -H "apikey: $SUPABASE_ANON_KEY" \
    -H "Authorization: Bearer $SUPABASE_ANON_KEY")
  [ "$REST" = "200" ] && pass "REST API respondeu 200" || fail "REST API retornou $REST"

  echo ""
  info "Auth endpoint:"
  AUTH=$(curl -s -o /dev/null -w "%{http_code}" \
    "$SUPABASE_URL/auth/v1/settings" \
    -H "apikey: $SUPABASE_ANON_KEY")
  [ "$AUTH" = "200" ] && pass "Auth respondeu 200" || fail "Auth retornou $AUTH"

  echo ""
  info "Realtime endpoint:"
  RT=$(curl -s -o /dev/null -w "%{http_code}" \
    "$SUPABASE_URL/realtime/v1/api" \
    -H "apikey: $SUPABASE_ANON_KEY")
  [ "$RT" = "200" ] || [ "$RT" = "301" ] \
    && pass "Realtime acessível ($RT)" \
    || fail "Realtime retornou $RT"
fi

echo ""
echo "================================================"
echo "   RESUMO FINAL"
echo "================================================"
echo "Repo:      https://github.com/$REPO"
echo "Supabase:  $SUPABASE_URL"
echo "Branch:    $BRANCH"
echo "================================================"
