#!/bin/bash
set -e

# ============================================================
#  SovaHent — универсальный скрипт установки / обновления
#
#  Поддержка: Ubuntu, Debian, CentOS, RHEL, Fedora, Alma, Rocky
#  Безопасен для серверов с Pterodactyl Panel + Wings
#
#  Что делает:
#  1. Спрашивает домен, порт, email (или берёт из аргументов)
#  2. Устанавливает Node.js 20 LTS (если нет)
#  3. Устанавливает PM2 (если нет)
#  4. Клонирует / обновляет репозиторий
#  5. Собирает Next.js приложение
#  6. Настраивает Nginx reverse proxy (отдельный server block)
#  7. Получает SSL через Certbot (Let's Encrypt)
#  8. Запускает через PM2 с автозапуском
#
#  Использование:
#    Интерактивно:   sudo bash deploy.sh
#    С аргументами:  sudo bash deploy.sh --domain example.com --port 3200 --email you@mail.com
#    Только обновить: sudo bash deploy.sh --update
# ============================================================

REPO="https://github.com/KolyannCHIK/SovaHent.git"
APP_DIR="/opt/sovahent"
APP_USER="sovahent"
PM2_NAME="sovahent"
NODE_VERSION="20"

# ── Цвета ──
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

log()  { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
err()  { echo -e "${RED}[✗]${NC} $1"; exit 1; }
step() { echo -e "\n${CYAN}━━━ $1 ━━━${NC}"; }
ask()  { echo -en "${BOLD}$1${NC}"; }

# ── Проверка root ──
if [ "$EUID" -ne 0 ]; then
  err "Запустите скрипт от root: sudo bash deploy.sh"
fi

# ── Парсинг аргументов ──
DOMAIN=""
APP_PORT=""
EMAIL=""
UPDATE_ONLY=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --domain)   DOMAIN="$2";   shift 2 ;;
    --port)     APP_PORT="$2"; shift 2 ;;
    --email)    EMAIL="$2";    shift 2 ;;
    --update)   UPDATE_ONLY=true; shift ;;
    --help|-h)
      echo "Использование: sudo bash deploy.sh [опции]"
      echo ""
      echo "  --domain DOMAIN   Домен для сайта (например: hent.example.com)"
      echo "  --port PORT       Внутренний порт приложения (по умолчанию: 3200)"
      echo "  --email EMAIL     Email для SSL-сертификата Let's Encrypt"
      echo "  --update          Только обновить код и пересобрать (без настройки nginx/ssl)"
      echo "  --help            Показать эту справку"
      exit 0
      ;;
    *) warn "Неизвестный аргумент: $1"; shift ;;
  esac
done

# ── Режим обновления ──
if [ "$UPDATE_ONLY" = true ]; then
  step "Быстрое обновление"

  if [ ! -d "$APP_DIR/.git" ]; then
    err "Приложение не установлено. Запустите полную установку: sudo bash deploy.sh"
  fi

  # Читаем порт из .env.local
  if [ -f "$APP_DIR/.env.local" ]; then
    APP_PORT=$(grep -oP 'PORT=\K[0-9]+' "$APP_DIR/.env.local" 2>/dev/null || echo "3200")
  else
    APP_PORT="3200"
  fi

  git config --global --add safe.directory "$APP_DIR" 2>/dev/null || true
  cd "$APP_DIR"
  git fetch origin
  git reset --hard origin/main
  log "Код обновлён"

  npm ci --production=false
  npm run build
  log "Сборка завершена"

  # Остановить, освободить порт, запустить
  pm2 delete "$PM2_NAME" 2>/dev/null || true
  sleep 2
  fuser -k "${APP_PORT}/tcp" 2>/dev/null || true
  sleep 1
  PORT="$APP_PORT" pm2 start npm --name "$PM2_NAME" --cwd "$APP_DIR" -- start --restart-delay=5000
  pm2 save --force 2>/dev/null || true
  log "Приложение перезапущено на порту $APP_PORT"
  exit 0
fi

# ══════════════════════════════════════
#  ПОЛНАЯ УСТАНОВКА
# ══════════════════════════════════════

echo ""
echo -e "${CYAN}╔═══════════════════════════════════════╗${NC}"
echo -e "${CYAN}║     ${BOLD}🦉 SovaHent — Установщик${NC}${CYAN}          ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════╝${NC}"
echo ""

# ── Интерактивный ввод ──
if [ -z "$DOMAIN" ]; then
  ask "Введите домен (например hent.example.com): "
  read -r DOMAIN
  [ -z "$DOMAIN" ] && err "Домен не может быть пустым"
fi

if [ -z "$APP_PORT" ]; then
  ask "Внутренний порт приложения [3200]: "
  read -r APP_PORT
  APP_PORT="${APP_PORT:-3200}"
fi

if [ -z "$EMAIL" ]; then
  ask "Email для SSL-сертификата (Let's Encrypt) [admin@${DOMAIN}]: "
  read -r EMAIL
  EMAIL="${EMAIL:-admin@${DOMAIN}}"
fi

echo ""
echo -e "${BOLD}Конфигурация:${NC}"
echo -e "  Домен:  ${CYAN}${DOMAIN}${NC}"
echo -e "  Порт:   ${CYAN}${APP_PORT}${NC}"
echo -e "  Email:  ${CYAN}${EMAIL}${NC}"
echo -e "  Каталог: ${CYAN}${APP_DIR}${NC}"
echo ""
ask "Всё верно? [Y/n]: "
read -r CONFIRM
CONFIRM="${CONFIRM:-Y}"
if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
  err "Установка отменена"
fi

# ── 1. Система ──
step "1/8 — Проверка системы"

OS_NAME="неизвестная"
if [ -f /etc/os-release ]; then
  . /etc/os-release
  OS_NAME="${NAME} ${VERSION_ID:-}"
fi
log "ОС: $OS_NAME"

# Определяем пакетный менеджер
if command -v apt-get &>/dev/null; then
  PKG="apt"
  PKG_INSTALL="apt-get install -y"
  PKG_UPDATE="apt-get update -y"
elif command -v dnf &>/dev/null; then
  PKG="dnf"
  PKG_INSTALL="dnf install -y"
  PKG_UPDATE="dnf makecache"
elif command -v yum &>/dev/null; then
  PKG="yum"
  PKG_INSTALL="yum install -y"
  PKG_UPDATE="yum makecache"
elif command -v pacman &>/dev/null; then
  PKG="pacman"
  PKG_INSTALL="pacman -S --noconfirm"
  PKG_UPDATE="pacman -Sy"
elif command -v apk &>/dev/null; then
  PKG="apk"
  PKG_INSTALL="apk add"
  PKG_UPDATE="apk update"
else
  err "Пакетный менеджер не найден (нужен apt/dnf/yum/pacman/apk)"
fi
log "Пакетный менеджер: $PKG"

# Установим базовые утилиты
for cmd in git curl sudo; do
  if ! command -v "$cmd" &>/dev/null; then
    warn "$cmd не найден, устанавливаем..."
    $PKG_INSTALL "$cmd"
  fi
done

# ── 2. Проверка порта ──
step "2/8 — Проверка порта"

# Убиваем старый процесс SovaHent если есть
pm2 delete "$PM2_NAME" 2>/dev/null || true
sleep 1
fuser -k "${APP_PORT}/tcp" 2>/dev/null || true
sleep 2

if ss -tlnp 2>/dev/null | grep -q ":${APP_PORT} "; then
  warn "Порт ${APP_PORT} занят другим приложением"
  # Пробуем следующие порты
  for TRY_PORT in 3201 3202 3300 3400 3500; do
    if ! ss -tlnp 2>/dev/null | grep -q ":${TRY_PORT} "; then
      APP_PORT="$TRY_PORT"
      warn "Используем порт: ${APP_PORT}"
      break
    fi
  done
  # Финальная проверка
  if ss -tlnp 2>/dev/null | grep -q ":${APP_PORT} "; then
    err "Не удалось найти свободный порт. Укажите вручную: --port XXXX"
  fi
fi
log "Порт: ${APP_PORT} (свободен)"

# ── 3. Node.js ──
step "3/8 — Node.js ${NODE_VERSION}"

INSTALL_NODE=false
if command -v node &>/dev/null; then
  CURRENT_NODE=$(node -v | sed 's/v//' | cut -d. -f1)
  if [ "$CURRENT_NODE" -ge "$NODE_VERSION" ]; then
    log "Node.js $(node -v) уже установлен"
  else
    warn "Node.js $(node -v) устарел, обновляем..."
    INSTALL_NODE=true
  fi
else
  INSTALL_NODE=true
fi

if [ "$INSTALL_NODE" = true ]; then
  case "$PKG" in
    apt)
      curl -fsSL "https://deb.nodesource.com/setup_${NODE_VERSION}.x" | bash -
      apt-get install -y nodejs
      ;;
    dnf|yum)
      curl -fsSL "https://rpm.nodesource.com/setup_${NODE_VERSION}.x" | bash -
      $PKG_INSTALL nodejs
      ;;
    pacman)
      $PKG_INSTALL nodejs npm
      ;;
    apk)
      $PKG_INSTALL nodejs npm
      ;;
  esac
  log "Node.js $(node -v) установлен"
fi

# ── 4. PM2 ──
step "4/8 — PM2"

if command -v pm2 &>/dev/null; then
  log "PM2 уже установлен"
else
  npm install -g pm2
  log "PM2 установлен"
fi

# ── 5. Системный пользователь ──
if ! id "$APP_USER" &>/dev/null; then
  useradd -r -m -s /bin/bash "$APP_USER"
  log "Создан пользователь: $APP_USER"
else
  log "Пользователь $APP_USER существует"
fi

# ── 6. Код приложения ──
step "5/8 — Код приложения"

git config --global --add safe.directory "$APP_DIR" 2>/dev/null || true

if [ -d "$APP_DIR/.git" ]; then
  warn "Директория $APP_DIR существует, обновляем..."
  chown -R "$APP_USER":"$APP_USER" "$APP_DIR"
  cd "$APP_DIR"
  sudo -u "$APP_USER" git config --global --add safe.directory "$APP_DIR" 2>/dev/null || true
  sudo -u "$APP_USER" git fetch origin
  sudo -u "$APP_USER" git reset --hard origin/main
  log "Код обновлён"
else
  rm -rf "$APP_DIR"
  git clone "$REPO" "$APP_DIR"
  chown -R "$APP_USER":"$APP_USER" "$APP_DIR"
  log "Репозиторий клонирован в $APP_DIR"
fi

cd "$APP_DIR"

# ── 7. Сборка ──
step "6/8 — Сборка приложения"

sudo -u "$APP_USER" npm ci --production=false
log "Зависимости установлены"

cat > "$APP_DIR/.env.local" <<EOF
PORT=${APP_PORT}
HOSTNAME=127.0.0.1
EOF
chown "$APP_USER":"$APP_USER" "$APP_DIR/.env.local"

sudo -u "$APP_USER" npm run build
log "Next.js собран"

# ── 8. PM2 — запуск ──
step "7/8 — Запуск PM2"

# Гарантируем что порт свободен перед стартом
fuser -k "${APP_PORT}/tcp" 2>/dev/null || true
sleep 2

PORT="$APP_PORT" pm2 start npm --name "$PM2_NAME" --cwd "$APP_DIR" -- start --restart-delay=5000
pm2 save --force 2>/dev/null || true

# Автозапуск при перезагрузке сервера
INIT_SYSTEM=""
if command -v systemctl &>/dev/null; then
  INIT_SYSTEM="systemd"
elif command -v rc-update &>/dev/null; then
  INIT_SYSTEM="openrc"
fi

if [ -n "$INIT_SYSTEM" ]; then
  pm2 startup "$INIT_SYSTEM" --silent 2>/dev/null || true
fi

# Ждём и проверяем стабильность
sleep 5
RESTARTS=$(pm2 jlist 2>/dev/null | grep -o '"restart_time":[0-9]*' | head -1 | grep -o '[0-9]*' || echo "0")
if [ "$RESTARTS" -gt 2 ]; then
  warn "Приложение нестабильно ($RESTARTS рестартов). Проверьте логи: pm2 logs $PM2_NAME"
else
  log "PM2 запущен: $PM2_NAME на порту $APP_PORT (рестартов: $RESTARTS)"
fi

# ── 9. Nginx ──
step "8/8 — Nginx + SSL"

if ! command -v nginx &>/dev/null; then
  $PKG_INSTALL nginx
fi

# Находим правильный каталог конфигов nginx
if [ -d "/etc/nginx/sites-available" ]; then
  NGINX_CONF_DIR="/etc/nginx/sites-available"
  NGINX_ENABLED_DIR="/etc/nginx/sites-enabled"
elif [ -d "/etc/nginx/conf.d" ]; then
  NGINX_CONF_DIR="/etc/nginx/conf.d"
  NGINX_ENABLED_DIR=""
else
  mkdir -p /etc/nginx/sites-available /etc/nginx/sites-enabled
  NGINX_CONF_DIR="/etc/nginx/sites-available"
  NGINX_ENABLED_DIR="/etc/nginx/sites-enabled"
  if ! grep -q "sites-enabled" /etc/nginx/nginx.conf; then
    sed -i '/http {/a \    include /etc/nginx/sites-enabled/*;' /etc/nginx/nginx.conf
  fi
fi

if [ -n "$NGINX_ENABLED_DIR" ]; then
  NGINX_CONF="$NGINX_CONF_DIR/sovahent"
  NGINX_LINK="$NGINX_ENABLED_DIR/sovahent"
else
  NGINX_CONF="$NGINX_CONF_DIR/sovahent.conf"
  NGINX_LINK=""
fi

cat > "$NGINX_CONF" <<NGINX
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN};

    # Безопасность
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Логи
    access_log /var/log/nginx/sovahent_access.log;
    error_log  /var/log/nginx/sovahent_error.log;

    # Без лимита на размер тела (видео-проксирование)
    client_max_body_size 0;
    proxy_buffering off;
    proxy_request_buffering off;

    location / {
        proxy_pass http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        proxy_connect_timeout 60s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }

    location /_next/static/ {
        proxy_pass http://127.0.0.1:${APP_PORT};
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
NGINX

[ -n "$NGINX_LINK" ] && ln -sf "$NGINX_CONF" "$NGINX_LINK"

if nginx -t 2>&1; then
  systemctl reload nginx 2>/dev/null || nginx -s reload 2>/dev/null || true
  log "Nginx настроен для ${DOMAIN}"
else
  [ -n "$NGINX_LINK" ] && rm -f "$NGINX_LINK" || rm -f "$NGINX_CONF"
  err "Ошибка конфига Nginx! Откат выполнен. Другие сайты не затронуты."
fi

# ── SSL ──
if ! command -v certbot &>/dev/null; then
  case "$PKG" in
    apt)     $PKG_INSTALL certbot python3-certbot-nginx ;;
    dnf|yum) $PKG_INSTALL certbot python3-certbot-nginx ;;
    pacman)  $PKG_INSTALL certbot certbot-nginx ;;
    apk)     $PKG_INSTALL certbot certbot-nginx ;;
  esac
fi

if [ -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" ]; then
  log "SSL сертификат уже существует"
else
  if certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --email "$EMAIL" --redirect 2>&1; then
    log "SSL сертификат получен"
  else
    warn "Не удалось получить SSL. Убедитесь что DNS для ${DOMAIN} указывает на этот сервер."
    warn "Повторите вручную: certbot --nginx -d ${DOMAIN}"
  fi
fi

# ── Готово ──
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  ✓ SovaHent успешно установлен!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  🌐 Сайт:       ${CYAN}https://${DOMAIN}${NC}"
echo -e "  🔌 Порт:       ${CYAN}${APP_PORT}${NC} (внутренний)"
echo -e "  📁 Каталог:    ${CYAN}${APP_DIR}${NC}"
echo -e "  📊 Статус:     ${CYAN}pm2 status${NC}"
echo ""
echo -e "  ${BOLD}Команды управления:${NC}"
echo -e "    Обновить:    ${CYAN}cd $APP_DIR && sudo bash deploy.sh --update${NC}"
echo -e "    Перезапуск:  ${CYAN}pm2 restart $PM2_NAME${NC}"
echo -e "    Логи:        ${CYAN}pm2 logs $PM2_NAME${NC}"
echo -e "    Остановить:  ${CYAN}pm2 stop $PM2_NAME${NC}"
echo ""
