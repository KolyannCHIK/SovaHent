#!/bin/bash
set -e

# ============================================================
#  SovaHent — скрипт установки на VDS
#  Домен: hent.sovadev.space
#  Совместимость: Pterodactyl Panel + Wings (не трогает порты 80/443/8080/2022)
#  
#  Что делает:
#  1. Устанавливает Node.js 20 LTS (если нет)
#  2. Устанавливает PM2 (если нет)
#  3. Клонирует/обновляет репозиторий
#  4. Собирает Next.js приложение
#  5. Добавляет Nginx конфиг (отдельный server block, не трогает существующие)
#  6. Получает SSL через Certbot (Let's Encrypt)
#  7. Запускает через PM2 с автозапуском
#
#  Запуск:
#    chmod +x deploy.sh
#    sudo bash deploy.sh
# ============================================================

DOMAIN="hent.sovadev.space"
APP_PORT=3100                   # Внутренний порт (не конфликтует с Pterodactyl)
APP_DIR="/opt/sovahent"
APP_USER="sovahent"
REPO="https://github.com/KolyannCHIK/SovaHent.git"
NODE_VERSION="20"

# Цвета
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log()  { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
err()  { echo -e "${RED}[✗]${NC} $1"; exit 1; }
step() { echo -e "\n${CYAN}━━━ $1 ━━━${NC}"; }

# ── Проверка root ──
if [ "$EUID" -ne 0 ]; then
  err "Запустите скрипт от root: sudo bash deploy.sh"
fi

step "1/7 — Проверка системы"

# Определяем пакетный менеджер
if command -v apt-get &>/dev/null; then
  PKG="apt"
elif command -v dnf &>/dev/null; then
  PKG="dnf"
elif command -v yum &>/dev/null; then
  PKG="yum"
else
  err "Не поддерживаемый пакетный менеджер. Нужен apt, dnf или yum."
fi
log "Пакетный менеджер: $PKG"

# Проверяем что Pterodactyl порты не заняты нами
if ss -tlnp | grep -q ":${APP_PORT} "; then
  warn "Порт ${APP_PORT} уже занят. Попробуем 3101..."
  APP_PORT=3101
  if ss -tlnp | grep -q ":${APP_PORT} "; then
    err "Порты 3100 и 3101 заняты. Измените APP_PORT в скрипте."
  fi
fi
log "Приложение будет на порту: ${APP_PORT}"

# ── Node.js ──
step "2/7 — Node.js ${NODE_VERSION}"

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

if [ "${INSTALL_NODE}" = true ]; then
  if [ "$PKG" = "apt" ]; then
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
    apt-get install -y nodejs
  else
    curl -fsSL https://rpm.nodesource.com/setup_${NODE_VERSION}.x | bash -
    $PKG install -y nodejs
  fi
  log "Node.js $(node -v) установлен"
fi

# ── PM2 ──
step "3/7 — PM2"

if command -v pm2 &>/dev/null; then
  log "PM2 уже установлен"
else
  npm install -g pm2
  log "PM2 установлен"
fi

# ── Системный пользователь ──
if ! id "$APP_USER" &>/dev/null; then
  useradd -r -m -s /bin/bash "$APP_USER"
  log "Создан пользователь: $APP_USER"
else
  log "Пользователь $APP_USER существует"
fi

# ── Клонирование / обновление ──
step "4/7 — Код приложения"

if [ -d "$APP_DIR" ]; then
  warn "Директория $APP_DIR существует, обновляем..."
  cd "$APP_DIR"
  sudo -u "$APP_USER" git fetch origin
  sudo -u "$APP_USER" git reset --hard origin/main
  log "Код обновлён"
else
  git clone "$REPO" "$APP_DIR"
  chown -R "$APP_USER":"$APP_USER" "$APP_DIR"
  log "Репозиторий клонирован в $APP_DIR"
fi

cd "$APP_DIR"

# ── Сборка ──
step "5/7 — Сборка приложения"

sudo -u "$APP_USER" npm ci --production=false
log "Зависимости установлены"

# Устанавливаем порт для production
cat > "$APP_DIR/.env.local" <<EOF
PORT=${APP_PORT}
HOSTNAME=127.0.0.1
EOF
chown "$APP_USER":"$APP_USER" "$APP_DIR/.env.local"

sudo -u "$APP_USER" npm run build
log "Next.js собран"

# ── PM2 ──
pm2 delete sovahent 2>/dev/null || true
sudo -u "$APP_USER" bash -c "cd $APP_DIR && PORT=$APP_PORT pm2 start npm --name sovahent -- start"
sudo -u "$APP_USER" pm2 save
pm2 startup systemd -u "$APP_USER" --hp "/home/$APP_USER" 2>/dev/null || true
log "PM2 запущен: sovahent на порту $APP_PORT"

# ── Nginx ──
step "6/7 — Nginx"

if ! command -v nginx &>/dev/null; then
  if [ "$PKG" = "apt" ]; then
    apt-get install -y nginx
  else
    $PKG install -y nginx
  fi
fi

NGINX_CONF="/etc/nginx/sites-available/sovahent"
NGINX_ENABLED="/etc/nginx/sites-enabled/sovahent"

# Если sites-available не существует (CentOS/RHEL)
if [ ! -d "/etc/nginx/sites-available" ]; then
  mkdir -p /etc/nginx/sites-available /etc/nginx/sites-enabled
  # Убедимся что sites-enabled подключен
  if ! grep -q "sites-enabled" /etc/nginx/nginx.conf; then
    sed -i '/http {/a \    include /etc/nginx/sites-enabled/*;' /etc/nginx/nginx.conf
  fi
fi

cat > "$NGINX_CONF" <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN};

    # Безопасность
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Логи отдельно от Pterodactyl
    access_log /var/log/nginx/sovahent_access.log;
    error_log  /var/log/nginx/sovahent_error.log;

    # Увеличенные лимиты для проксирования видео
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

        # Таймауты для медиа-проксирования
        proxy_connect_timeout 60s;
        proxy_send_timeout 120s;
        proxy_read_timeout 120s;
    }

    # Кэш статики Next.js
    location /_next/static/ {
        proxy_pass http://127.0.0.1:${APP_PORT};
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
EOF

ln -sf "$NGINX_CONF" "$NGINX_ENABLED"

# Проверяем конфиг nginx (не ломаем Pterodactyl)
if nginx -t 2>&1; then
  systemctl reload nginx
  log "Nginx настроен для ${DOMAIN}"
else
  rm -f "$NGINX_ENABLED"
  err "Ошибка конфига Nginx! Откат выполнен. Pterodactyl не затронут."
fi

# ── SSL ──
step "7/7 — SSL (Let's Encrypt)"

if ! command -v certbot &>/dev/null; then
  if [ "$PKG" = "apt" ]; then
    apt-get install -y certbot python3-certbot-nginx
  else
    $PKG install -y certbot python3-certbot-nginx
  fi
fi

# Проверяем, может SSL уже есть
if [ -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" ]; then
  log "SSL сертификат уже существует"
else
  certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --email admin@sovadev.space --redirect
  log "SSL сертификат получен"
fi

# ── Готово ──
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  ✓ SovaHent успешно установлен!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  Сайт:     ${CYAN}https://${DOMAIN}${NC}"
echo -e "  Порт:     ${CYAN}${APP_PORT}${NC} (внутренний)"
echo -e "  Директория: ${CYAN}${APP_DIR}${NC}"
echo -e "  PM2:      ${CYAN}pm2 status / pm2 logs sovahent${NC}"
echo ""
echo -e "  ${YELLOW}Pterodactyl Panel и Wings не затронуты.${NC}"
echo ""
echo -e "  Команды управления:"
echo -e "    Перезапуск:  ${CYAN}pm2 restart sovahent${NC}"
echo -e "    Логи:        ${CYAN}pm2 logs sovahent${NC}"
echo -e "    Обновление:  ${CYAN}cd $APP_DIR && sudo bash deploy.sh${NC}"
echo ""
