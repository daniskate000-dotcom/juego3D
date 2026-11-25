// Motor principal de Operación Vanguardia
(function () {
  const {
    WEAPON_CATALOG,
    WEAPON_UPGRADE_DEFS,
    SOLDIER_UPGRADE_DEFS,
    ENEMY_TYPES,
    getWeaponStats,
    resolveCircleObstacles,
    pointHitsObstacle,
    hasLineOfSight,
    drawMap,
    drawSoldier,
  } = window.GameEntities;

  const { WIDTH, HEIGHT, getLevelConfig } = window.GameMaps;
  const Audio = window.GameAudio;

  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  // Referencias UI
  const hud = document.getElementById('hud');
  const weaponBar = document.getElementById('weaponBar');
  const hpBar = document.getElementById('hpBar');
  const hpText = document.getElementById('hpText');
  const ammoBar = document.getElementById('ammoBar');
  const ammoText = document.getElementById('ammoText');
  const weaponNameHud = document.getElementById('weaponNameHud');
  const levelNumHud = document.getElementById('levelNumHud');
  const mapNameHud = document.getElementById('mapNameHud');
  const enemiesLeftHud = document.getElementById('enemiesLeftHud');
  const coinsHud = document.getElementById('coinsHud');

  const startScreen = document.getElementById('startScreen');
  const upgradeOverlay = document.getElementById('upgradeOverlay');
  const pauseOverlay = document.getElementById('pauseOverlay');
  const levelCompleteOverlay = document.getElementById('levelCompleteOverlay');
  const endOverlay = document.getElementById('endOverlay');
  const levelBanner = document.getElementById('levelBanner');

  const coinsMenu = document.getElementById('coinsMenu');
  const selectedWeaponLabel = document.getElementById('selectedWeaponLabel');
  const weaponsList = document.getElementById('weaponsList');
  const weaponUpgradesList = document.getElementById('weaponUpgradesList');
  const soldierUpgradesList = document.getElementById('soldierUpgradesList');
  const upgradeFeedback = document.getElementById('upgradeFeedback');

  // Estado global del juego
  let gameState = 'start'; // 'start' | 'playing' | 'paused' | 'upgrade' | 'levelComplete' | 'gameOver'
  let returnStateFromUpgrade = 'playing';

  const keys = {};
  const mouse = { x: WIDTH / 2, y: HEIGHT / 2, down: false };

  let levelConfig = null;
  let currentLevel = 1;
  let coins = 0;
  let totalKills = 0;
  let bannerTimer = 0;
  let shakeTime = 0;
  let shakeIntensity = 0;

  let player = null;
  let enemies = [];
  let bullets = [];
  let pickups = [];
  let particles = [];
  let floatingTexts = [];

  let enemiesToSpawn = [];
  let spawnTimer = 0;

  function createInitialPlayer() {
    const weaponUpgrades = {};
    const ammoByWeapon = {};
    for (const w of WEAPON_CATALOG) {
      weaponUpgrades[w.id] = { damage: 0, fireRate: 0, capacity: 0, ballistics: 0 };
      ammoByWeapon[w.id] = w.baseStats.magSize;
    }

    return {
      x: WIDTH / 2,
      y: HEIGHT / 2,
      radius: 16,
      angle: 0,
      baseSpeed: 235,
      hp: 100,
      maxHp: 100,
      coins: 0,
      unlockedWeapons: ['pistol'],
      equippedWeapon: 'pistol',
      weaponUpgrades,
      ammoByWeapon,
      soldierUpgrades: { armor: 0, boots: 0, magnet: 0 },
      fireCooldown: 0,
      reloading: false,
      reloadTimer: 0,
      reloadDuration: 1,
      muzzleFlash: 0,
      hurtFlash: 0,
      invulnTimer: 0,
    };
  }

  function startNewGame() {
    Audio.init();
    currentLevel = 1;
    coins = 0;
    totalKills = 0;
    player = createInitialPlayer();
    hideAllOverlays();
    hud.classList.remove('hidden');
    weaponBar.classList.remove('hidden');
    loadLevel(1);
    gameState = 'playing';
  }

  function loadLevel(lvl) {
    currentLevel = lvl;
    levelConfig = getLevelConfig(lvl);
    const map = levelConfig.map;

    player.x = map.playerSpawn.x;
    player.y = map.playerSpawn.y;
    player.reloading = false;
    player.reloadTimer = 0;
    player.fireCooldown = 0;
    // Recarga gratuita al desplegar en nuevo mapa
    for (const wId of player.unlockedWeapons) {
      player.ammoByWeapon[wId] = getWeaponStats(wId, player.weaponUpgrades).magSize;
    }

    enemies = [];
    bullets = [];
    pickups = [];
    particles = [];
    floatingTexts = [];

    // Construir cola de enemigos del nivel
    enemiesToSpawn = [];
    const diff = levelConfig.difficulty;
    const regularCount = diff.hasBoss ? diff.totalEnemies - 1 : diff.totalEnemies;
    for (let i = 0; i < regularCount; i++) {
      const pool = diff.enemyPool;
      const typeKey = pool[Math.floor(Math.random() * pool.length)];
      enemiesToSpawn.push(typeKey);
    }
    if (diff.hasBoss) {
      enemiesToSpawn.push('boss');
    }
    spawnTimer = 0.6;

    // Mostrar banner del nivel
    document.getElementById('bannerTag').textContent =
      diff.hasBoss ? 'ALERTA DE COMANDO • JEFE EN EL SECTOR' : 'DESPLIEGUE TÁCTICO';
    document.getElementById('bannerTitle').textContent = `NIVEL ${lvl}: ${map.displayName.toUpperCase()}`;
    document.getElementById('bannerSubtitle').textContent = map.subtitle;
    levelBanner.classList.remove('hidden');
    bannerTimer = 2.8;

    renderWeaponBar();
    updateHud();
  }

  function spawnEnemy(typeKey) {
    const def = ENEMY_TYPES[typeKey];
    const diff = levelConfig.difficulty;
    const spawns = levelConfig.map.spawnPoints;
    // Elegir un punto de aparición no demasiado pegado al jugador
    const candidates = spawns.filter((s) => Math.hypot(s.x - player.x, s.y - player.y) > 210);
    const pt = (candidates.length ? candidates : spawns)[
      Math.floor(Math.random() * (candidates.length ? candidates.length : spawns.length))
    ];

    const maxHp = Math.round(def.hp * diff.hpScale);
    enemies.push({
      type: typeKey,
      name: def.name,
      x: pt.x + (Math.random() * 20 - 10),
      y: pt.y + (Math.random() * 20 - 10),
      radius: def.radius,
      hp: maxHp,
      maxHp,
      speed: def.speed * diff.speedScale,
      damage: Math.round(def.damage * diff.damageScale),
      fireInterval: Math.max(0.35, def.fireInterval / Math.min(1.4, diff.speedScale)),
      fireTimer: 0.4 + Math.random() * 0.8,
      preferredDist: def.preferredDist,
      pellets: def.pellets || 1,
      spread: def.spread || 0.06,
      bulletSpeed: def.bulletSpeed,
      color: def.color,
      helmet: def.helmet,
      coinMin: def.coinMin,
      coinMax: def.coinMax,
      isBoss: Boolean(def.isBoss),
      angle: 0,
      muzzleFlash: 0,
      hurtFlash: 0,
      strafeDir: Math.random() < 0.5 ? 1 : -1,
      strafeTimer: 1.5 + Math.random() * 2,
    });
  }

  function addShake(time, intensity) {
    shakeTime = Math.max(shakeTime, time);
    shakeIntensity = Math.max(shakeIntensity, intensity);
  }

  function spawnParticles(x, y, color, count, speed = 160, size = 3.5) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const spd = speed * (0.35 + Math.random() * 0.85);
      particles.push({
        x,
        y,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        life: 0.25 + Math.random() * 0.35,
        maxLife: 0.6,
        color,
        size: size * (0.6 + Math.random() * 0.8),
      });
    }
  }

  function addFloatingText(x, y, text, color = '#fde047') {
    floatingTexts.push({ x, y, text, color, life: 0.85, maxLife: 0.85 });
  }

  function explodeAt(x, y, radius, damage) {
    Audio.explosion();
    addShake(0.32, 9);
    spawnParticles(x, y, '#fb923c', 26, 280, 5.5);
    spawnParticles(x, y, '#fef08a', 14, 210, 4);

    // Dañar enemigos cercanos
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      const d = Math.hypot(e.x - x, e.y - y);
      if (d <= radius + e.radius) {
        const dmg = Math.round(damage * (1 - (d / (radius + 40)) * 0.5));
        damageEnemy(i, dmg);
      }
    }

    // Dañar levemente al jugador si está muy cerca
    const pd = Math.hypot(player.x - x, player.y - y);
    if (pd <= radius) {
      damagePlayer(Math.round(damage * 0.32 * (1 - pd / radius)));
    }
  }

  function startReload() {
    if (player.reloading) return;
    const stats = getWeaponStats(player.equippedWeapon, player.weaponUpgrades);
    if (player.ammoByWeapon[player.equippedWeapon] >= stats.magSize) return;
    player.reloading = true;
    player.reloadDuration = stats.reloadTime;
    player.reloadTimer = 0;
    Audio.reload();
  }

  function tryFirePlayer() {
    if (player.reloading || player.fireCooldown > 0) return;

    const wId = player.equippedWeapon;
    const stats = getWeaponStats(wId, player.weaponUpgrades);

    if (player.ammoByWeapon[wId] <= 0) {
      startReload();
      return;
    }

    player.ammoByWeapon[wId] -= 1;
    player.fireCooldown = stats.fireInterval;
    player.muzzleFlash = 0.06;

    const muzzleX = player.x + Math.cos(player.angle) * (player.radius + stats.barrelLen - 4);
    const muzzleY = player.y + Math.sin(player.angle) * (player.radius + stats.barrelLen - 4);

    for (let p = 0; p < stats.pellets; p++) {
      const spreadOffset = (Math.random() - 0.5) * stats.spread * 2;
      const a = player.angle + spreadOffset;
      bullets.push({
        fromPlayer: true,
        x: muzzleX,
        y: muzzleY,
        vx: Math.cos(a) * stats.bulletSpeed,
        vy: Math.sin(a) * stats.bulletSpeed,
        damage: stats.damage,
        radius: wId === 'plasma' ? 5.5 : 3.5,
        color: stats.bulletColor,
        pierceLeft: stats.pierce,
        hitIds: new Set(),
        life: 1.5,
      });
    }

    Audio.shoot(wId);
    addShake(0.05, wId === 'shotgun' ? 4 : 1.6);

    if (player.ammoByWeapon[wId] === 0) {
      startReload();
    }
  }

  function damageEnemy(index, dmg) {
    const e = enemies[index];
    if (!e) return;
    e.hp -= dmg;
    e.hurtFlash = 0.09;
    Audio.hit();
    addFloatingText(e.x, e.y - e.radius - 6, `-${dmg}`, '#f8fafc');
    spawnParticles(e.x, e.y, '#ef4444', 5, 110, 2.5);

    if (e.hp <= 0) {
      totalKills += 1;
      spawnParticles(e.x, e.y, e.color, e.isBoss ? 28 : 12, 180, 4);

      // Soltar monedas
      const dropCoins = e.coinMin + Math.floor(Math.random() * (e.coinMax - e.coinMin + 1));
      const coinCount = e.isBoss ? 6 : 2;
      const valPerCoin = Math.ceil(dropCoins / coinCount);
      for (let c = 0; c < coinCount; c++) {
        pickups.push({
          type: 'coin',
          x: e.x + (Math.random() * 24 - 12),
          y: e.y + (Math.random() * 24 - 12),
          value: c === 0 ? dropCoins - valPerCoin * (coinCount - 1) : valPerCoin,
          radius: 9,
          bob: Math.random() * Math.PI * 2,
        });
      }

      // Probabilidad de botiquín
      if (e.isBoss || Math.random() < 0.16) {
        pickups.push({
          type: 'medkit',
          x: e.x + (Math.random() * 18 - 9),
          y: e.y + (Math.random() * 18 - 9),
          value: 25,
          radius: 10,
          bob: Math.random() * Math.PI * 2,
        });
      }

      enemies.splice(index, 1);
    }
  }

  function damagePlayer(dmg) {
    if (dmg <= 0 || player.invulnTimer > 0) return;
    player.hp = Math.max(0, player.hp - dmg);
    player.hurtFlash = 0.14;
    player.invulnTimer = 0.18;
    Audio.playerHurt();
    addShake(0.14, 5);
    addFloatingText(player.x, player.y - 22, `-${dmg}`, '#f87171');

    if (player.hp <= 0) {
      triggerGameOver();
    }
  }

  function triggerLevelComplete() {
    gameState = 'levelComplete';
    mouse.down = false;
    const bonus = levelConfig.difficulty.coinBonus;
    coins += bonus;
    Audio.levelComplete();

    document.getElementById('levelCompleteTitle').textContent = `¡NIVEL ${currentLevel} COMPLETADO!`;
    document.getElementById('levelCompleteStats').textContent =
      `Mapa "${levelConfig.map.displayName}" asegurado. Bonificación: +${bonus} monedas 🪙`;
    levelCompleteOverlay.classList.remove('hidden');
    updateHud();
  }

  function triggerGameOver() {
    gameState = 'gameOver';
    mouse.down = false;
    Audio.gameOver();
    document.getElementById('endTitle').textContent = 'SOLDADO CAÍDO';
    document.getElementById('endStats').textContent =
      `Alcanzaste el Nivel ${currentLevel} (${levelConfig.map.displayName}) • Enemigos abatidos: ${totalKills}`;
    endOverlay.classList.remove('hidden');
    updateHud();
  }

  function update(dt) {
    if (bannerTimer > 0) {
      bannerTimer -= dt;
      if (bannerTimer <= 0) levelBanner.classList.add('hidden');
    }
    if (shakeTime > 0) {
      shakeTime = Math.max(0, shakeTime - dt);
    }

    if (gameState !== 'playing') return;

    const map = levelConfig.map;

    // 1. Movimiento del jugador con flechas direccionales (y WASD opcional)
    let moveX = 0;
    let moveY = 0;
    if (keys['ArrowLeft'] || keys['KeyA']) moveX -= 1;
    if (keys['ArrowRight'] || keys['KeyD']) moveX += 1;
    if (keys['ArrowUp'] || keys['KeyW']) moveY -= 1;
    if (keys['ArrowDown'] || keys['KeyS']) moveY += 1;

    if (moveX !== 0 || moveY !== 0) {
      const len = Math.hypot(moveX, moveY);
      const speedMult = 1 + player.soldierUpgrades.boots * 0.1;
      const speed = player.baseSpeed * speedMult;
      player.x += (moveX / len) * speed * dt;
      player.y += (moveY / len) * speed * dt;
      resolveCircleObstacles(player, map.obstacles, WIDTH, HEIGHT);
    }

    // Apuntar al mouse
    player.angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);

    // Temporizadores de disparo / recarga
    if (player.fireCooldown > 0) player.fireCooldown -= dt;
    if (player.muzzleFlash > 0) player.muzzleFlash -= dt;
    if (player.hurtFlash > 0) player.hurtFlash -= dt;
    if (player.invulnTimer > 0) player.invulnTimer -= dt;

    if (player.reloading) {
      player.reloadTimer += dt;
      if (player.reloadTimer >= player.reloadDuration) {
        const stats = getWeaponStats(player.equippedWeapon, player.weaponUpgrades);
        player.ammoByWeapon[player.equippedWeapon] = stats.magSize;
        player.reloading = false;
        player.reloadTimer = 0;
      }
    }

    if (mouse.down) {
      tryFirePlayer();
    }

    // 2. Aparición de oleada enemiga
    if (enemiesToSpawn.length > 0 && enemies.length < levelConfig.difficulty.maxConcurrent) {
      spawnTimer -= dt;
      if (spawnTimer <= 0) {
        const nextType = enemiesToSpawn.shift();
        spawnEnemy(nextType);
        spawnTimer = levelConfig.difficulty.spawnInterval;
      }
    }

    // 3. IA y movimiento de enemigos
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (e.muzzleFlash > 0) e.muzzleFlash -= dt;
      if (e.hurtFlash > 0) e.hurtFlash -= dt;

      const dx = player.x - e.x;
      const dy = player.y - e.y;
      const dist = Math.hypot(dx, dy) || 1;
      e.angle = Math.atan2(dy, dx);

      e.strafeTimer -= dt;
      if (e.strafeTimer <= 0) {
        e.strafeDir *= -1;
        e.strafeTimer = 1.2 + Math.random() * 1.8;
      }

      const los = hasLineOfSight(e.x, e.y, player.x, player.y, map.obstacles);
      let vx = 0;
      let vy = 0;

      if (!los || dist > e.preferredDist) {
        vx = (dx / dist) * e.speed;
        vy = (dy / dist) * e.speed;
        // Movimiento lateral para rodear obstáculos
        vx += (-dy / dist) * e.speed * 0.35 * e.strafeDir;
        vy += (dx / dist) * e.speed * 0.35 * e.strafeDir;
      } else if (dist < e.preferredDist * 0.65) {
        vx = (-dx / dist) * e.speed * 0.55;
        vy = (-dy / dist) * e.speed * 0.55;
      } else {
        // Esquiva lateral táctica
        vx = (-dy / dist) * e.speed * 0.5 * e.strafeDir;
        vy = (dx / dist) * e.speed * 0.5 * e.strafeDir;
      }

      e.x += vx * dt;
      e.y += vy * dt;
      resolveCircleObstacles(e, map.obstacles, WIDTH, HEIGHT);

      // Separación suave entre enemigos
      for (let j = i + 1; j < enemies.length; j++) {
        const other = enemies[j];
        const sdx = e.x - other.x;
        const sdy = e.y - other.y;
        const sdist = Math.hypot(sdx, sdy);
        const minSep = e.radius + other.radius + 2;
        if (sdist > 0.01 && sdist < minSep) {
          const push = (minSep - sdist) * 0.5;
          e.x += (sdx / sdist) * push;
          e.y += (sdy / sdist) * push;
          other.x -= (sdx / sdist) * push;
          other.y -= (sdy / sdist) * push;
        }
      }

      // Disparo enemigo si tiene línea de visión
      e.fireTimer -= dt;
      if (e.fireTimer <= 0 && los && dist < 560) {
        e.fireTimer = e.fireInterval;
        e.muzzleFlash = 0.06;
        Audio.enemyShoot();
        for (let p = 0; p < e.pellets; p++) {
          const a = e.angle + (Math.random() - 0.5) * e.spread * 2;
          bullets.push({
            fromPlayer: false,
            x: e.x + Math.cos(e.angle) * (e.radius + 14),
            y: e.y + Math.sin(e.angle) * (e.radius + 14),
            vx: Math.cos(a) * e.bulletSpeed,
            vy: Math.sin(a) * e.bulletSpeed,
            damage: e.damage,
            radius: e.isBoss ? 5 : 4,
            color: e.isBoss ? '#fb923c' : '#f87171',
            pierceLeft: 0,
            hitIds: new Set(),
            life: 2.2,
          });
        }
      }
    }

    // 4. Proyectiles y colisiones
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;

      if (b.life <= 0 || b.x < 0 || b.x > WIDTH || b.y < 0 || b.y > HEIGHT) {
        bullets.splice(i, 1);
        continue;
      }

      if (pointHitsObstacle(b.x, b.y, map.obstacles)) {
        spawnParticles(b.x, b.y, b.color, 4, 90, 2);
        bullets.splice(i, 1);
        continue;
      }

      // Impacto en barriles explosivos
      let hitBarrel = false;
      for (const barrel of map.barrels) {
        if (!barrel.alive) continue;
        if (Math.hypot(b.x - barrel.x, b.y - barrel.y) <= 15 + b.radius) {
          barrel.hp -= b.damage;
          hitBarrel = true;
          spawnParticles(b.x, b.y, '#fbbf24', 5, 100, 2.5);
          if (barrel.hp <= 0) {
            barrel.alive = false;
            explodeAt(barrel.x, barrel.y, 130, 120);
          }
          break;
        }
      }
      if (hitBarrel) {
        bullets.splice(i, 1);
        continue;
      }

      if (b.fromPlayer) {
        let removeBullet = false;
        for (let eIdx = enemies.length - 1; eIdx >= 0; eIdx--) {
          const e = enemies[eIdx];
          if (b.hitIds.has(e)) continue;
          if (Math.hypot(b.x - e.x, b.y - e.y) <= e.radius + b.radius) {
            b.hitIds.add(e);
            damageEnemy(eIdx, b.damage);
            if (b.pierceLeft > 0) {
              b.pierceLeft -= 1;
            } else {
              removeBullet = true;
              break;
            }
          }
        }
        if (removeBullet) {
          bullets.splice(i, 1);
          continue;
        }
      } else {
        if (Math.hypot(b.x - player.x, b.y - player.y) <= player.radius + b.radius) {
          damagePlayer(b.damage);
          bullets.splice(i, 1);
          continue;
        }
      }
    }

    // 5. Monedas y botiquines (con imán)
    const magnetRange = 75 + player.soldierUpgrades.magnet * 48;
    for (let i = pickups.length - 1; i >= 0; i--) {
      const p = pickups[i];
      p.bob += dt * 4;
      const dx = player.x - p.x;
      const dy = player.y - p.y;
      const d = Math.hypot(dx, dy);

      if (d < magnetRange && d > 1) {
        const pull = 300 + player.soldierUpgrades.magnet * 75;
        p.x += (dx / d) * pull * dt;
        p.y += (dy / d) * pull * dt;
      }

      if (d <= player.radius + p.radius + 4) {
        if (p.type === 'coin') {
          coins += p.value;
          Audio.coin();
          addFloatingText(player.x, player.y - 24, `+${p.value} 🪙`, '#fde047');
        } else if (p.type === 'medkit') {
          if (player.hp < player.maxHp) {
            const healed = Math.min(p.value, player.maxHp - player.hp);
            player.hp += healed;
            Audio.heal();
            addFloatingText(player.x, player.y - 24, `+${healed} HP`, '#4ade80');
          } else {
            coins += 4;
            Audio.coin();
            addFloatingText(player.x, player.y - 24, '+4 🪙', '#fde047');
          }
        }
        pickups.splice(i, 1);
      }
    }

    // 6. Partículas y textos flotantes
    for (let i = particles.length - 1; i >= 0; i--) {
      const pt = particles[i];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.vx *= 0.92;
      pt.vy *= 0.92;
      pt.life -= dt;
      if (pt.life <= 0) particles.splice(i, 1);
    }

    for (let i = floatingTexts.length - 1; i >= 0; i--) {
      const ft = floatingTexts[i];
      ft.y -= 28 * dt;
      ft.life -= dt;
      if (ft.life <= 0) floatingTexts.splice(i, 1);
    }

    // 7. Verificar si el nivel fue completado
    if (enemiesToSpawn.length === 0 && enemies.length === 0 && gameState === 'playing') {
      triggerLevelComplete();
    }

    updateHud();
  }

  function render() {
    ctx.save();
    if (shakeTime > 0) {
      const ox = (Math.random() - 0.5) * shakeIntensity * 2;
      const oy = (Math.random() - 0.5) * shakeIntensity * 2;
      ctx.translate(ox, oy);
    }

    if (!levelConfig) {
      ctx.fillStyle = '#0d131d';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.restore();
      return;
    }

    drawMap(ctx, levelConfig.map, WIDTH, HEIGHT);

    // Recogibles (monedas y botiquines)
    for (const p of pickups) {
      const yOff = Math.sin(p.bob) * 3;
      if (p.type === 'coin') {
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(p.x, p.y + yOff, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#78350f';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('$', p.x, p.y + yOff + 0.5);
      } else {
        ctx.fillStyle = '#16a34a';
        ctx.fillRect(p.x - 9, p.y + yOff - 9, 18, 18);
        ctx.strokeStyle = '#bbf7d0';
        ctx.lineWidth = 1.8;
        ctx.strokeRect(p.x - 9, p.y + yOff - 9, 18, 18);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(p.x - 2, p.y + yOff - 5, 4, 10);
        ctx.fillRect(p.x - 5, p.y + yOff - 2, 10, 4);
      }
    }

    // Balas
    for (const b of bullets) {
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Enemigos
    for (const e of enemies) {
      drawSoldier(ctx, {
        x: e.x,
        y: e.y,
        angle: e.angle,
        radius: e.radius,
        bodyColor: e.color,
        helmetColor: e.helmet,
        gunColor: '#334155',
        barrelLen: e.isBoss ? 26 : 19,
        barrelWidth: e.isBoss ? 7 : 5,
        isPlayer: false,
        isBoss: e.isBoss,
        muzzleFlash: e.muzzleFlash,
        hurtFlash: e.hurtFlash,
        hp: e.hp,
        maxHp: e.maxHp,
      });
    }

    // Jugador
    if (player) {
      const wStats = getWeaponStats(player.equippedWeapon, player.weaponUpgrades);
      drawSoldier(ctx, {
        x: player.x,
        y: player.y,
        angle: player.angle,
        radius: player.radius,
        bodyColor: '#2563eb',
        helmetColor: '#1e3a8a',
        gunColor: wStats.color,
        barrelLen: wStats.barrelLen,
        barrelWidth: wStats.barrelWidth,
        isPlayer: true,
        muzzleFlash: player.muzzleFlash,
        hurtFlash: player.hurtFlash,
        hp: player.hp,
        maxHp: player.maxHp,
        reloadProgress: player.reloading ? player.reloadTimer / player.reloadDuration : 0,
        mouseX: mouse.x,
        mouseY: mouse.y,
      });
    }

    // Partículas
    for (const pt of particles) {
      ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Textos flotantes
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    for (const ft of floatingTexts) {
      ctx.globalAlpha = Math.max(0, ft.life / ft.maxLife);
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, ft.x, ft.y);
    }
    ctx.globalAlpha = 1;

    ctx.restore();
  }

  function updateHud() {
    if (!player || !levelConfig) return;
    const wStats = getWeaponStats(player.equippedWeapon, player.weaponUpgrades);
    const ammo = player.ammoByWeapon[player.equippedWeapon];

    hpBar.style.width = `${(player.hp / player.maxHp) * 100}%`;
    hpText.textContent = `${Math.ceil(player.hp)} / ${player.maxHp}`;

    weaponNameHud.textContent = wStats.name;
    if (player.reloading) {
      const pct = Math.min(100, Math.round((player.reloadTimer / player.reloadDuration) * 100));
      ammoBar.style.width = `${pct}%`;
      ammoText.textContent = 'RECARGANDO...';
    } else {
      ammoBar.style.width = `${(ammo / wStats.magSize) * 100}%`;
      ammoText.textContent = `${ammo} / ${wStats.magSize}`;
    }

    levelNumHud.textContent = `NIVEL ${currentLevel}`;
    mapNameHud.textContent = levelConfig.map.displayName;
    enemiesLeftHud.textContent = `Enemigos restantes: ${enemies.length + enemiesToSpawn.length}`;
    coinsHud.textContent = coins;
    coinsMenu.textContent = coins;
  }

  function renderWeaponBar() {
    if (!player) return;
    weaponBar.innerHTML = '';
    WEAPON_CATALOG.forEach((w, idx) => {
      const unlocked = player.unlockedWeapons.includes(w.id);
      const active = player.equippedWeapon === w.id;
      const btn = document.createElement('button');
      btn.className = `weapon-slot ${active ? 'active' : ''} ${!unlocked ? 'locked' : ''}`;
      btn.innerHTML = `<span>[${idx + 1}]</span> <span>${w.name}</span>`;
      btn.onclick = () => {
        if (unlocked && gameState === 'playing') {
          equipWeapon(w.id);
        }
      };
      weaponBar.appendChild(btn);
    });
  }

  function equipWeapon(wId) {
    if (!player.unlockedWeapons.includes(wId)) return;
    if (player.equippedWeapon === wId) return;
    player.equippedWeapon = wId;
    player.reloading = false;
    player.reloadTimer = 0;
    renderWeaponBar();
    updateHud();
  }

  // Menú Desplegable de Mejoras y Armería
  function openUpgradeMenu(returnTo) {
    returnStateFromUpgrade = returnTo;
    gameState = 'upgrade';
    mouse.down = false;
    hideAllOverlays();
    upgradeOverlay.classList.remove('hidden');
    renderUpgradeMenu();
  }

  function closeUpgradeMenu() {
    upgradeOverlay.classList.add('hidden');
    if (returnStateFromUpgrade === 'levelComplete') {
      levelCompleteOverlay.classList.remove('hidden');
      gameState = 'levelComplete';
    } else {
      gameState = 'playing';
    }
    updateHud();
  }

  function renderUpgradeMenu() {
    if (!player) return;
    coinsMenu.textContent = coins;
    const eqStats = getWeaponStats(player.equippedWeapon, player.weaponUpgrades);
    selectedWeaponLabel.textContent = eqStats.name;

    // 1. Arsenal / Armas
    weaponsList.innerHTML = '';
    for (const w of WEAPON_CATALOG) {
      const unlocked = player.unlockedWeapons.includes(w.id);
      const equipped = player.equippedWeapon === w.id;

      const card = document.createElement('div');
      card.className = `card-item ${equipped ? 'equipped' : ''}`;

      let tagHtml = '<span class="card-tag">Bloqueada</span>';
      if (equipped) tagHtml = '<span class="card-tag active-tag">Equipada</span>';
      else if (unlocked) tagHtml = '<span class="card-tag">Disponible</span>';

      card.innerHTML = `
        <div>
          <div class="card-title-row">
            <span class="card-title">${w.name}</span>
            ${tagHtml}
          </div>
          <p class="card-desc">${w.desc}</p>
        </div>
      `;

      const btn = document.createElement('button');
      if (equipped) {
        btn.className = 'card-btn';
        btn.textContent = 'En uso actual';
        btn.disabled = true;
      } else if (unlocked) {
        btn.className = 'card-btn equip-btn';
        btn.textContent = 'Equipar arma';
        btn.onclick = () => {
          equipWeapon(w.id);
          Audio.reload();
          upgradeFeedback.textContent = `Has equipado: ${w.name}.`;
          renderUpgradeMenu();
        };
      } else {
        btn.className = 'card-btn';
        btn.textContent = `Desbloquear (${w.unlockCost} 🪙)`;
        btn.disabled = coins < w.unlockCost;
        btn.onclick = () => {
          if (coins >= w.unlockCost) {
            coins -= w.unlockCost;
            player.unlockedWeapons.push(w.id);
            player.ammoByWeapon[w.id] = getWeaponStats(w.id, player.weaponUpgrades).magSize;
            equipWeapon(w.id);
            Audio.upgrade();
            upgradeFeedback.textContent = `¡${w.name} desbloqueada y equipada!`;
            renderUpgradeMenu();
            updateHud();
          }
        };
      }

      card.appendChild(btn);
      weaponsList.appendChild(card);
    }

    // 2. Mejoras del arma equipada
    weaponUpgradesList.innerHTML = '';
    const wUpgrades = player.weaponUpgrades[player.equippedWeapon];

    for (const up of WEAPON_UPGRADE_DEFS) {
      const lvl = wUpgrades[up.key];
      const maxed = lvl >= up.maxLevel;
      const cost = up.baseCost + lvl * up.costStep;

      const card = document.createElement('div');
      card.className = 'card-item';

      let pips = '';
      for (let i = 0; i < up.maxLevel; i++) {
        pips += `<div class="pip ${i < lvl ? 'filled' : ''}"></div>`;
      }

      card.innerHTML = `
        <div>
          <div class="card-title-row">
            <span class="card-title">${up.name}</span>
            <span class="card-tag">Nv. ${lvl}/${up.maxLevel}</span>
          </div>
          <p class="card-desc">${up.desc}</p>
        </div>
        <div class="level-pips">${pips}</div>
      `;

      const btn = document.createElement('button');
      btn.className = 'card-btn';
      if (maxed) {
        btn.textContent = 'NIVEL MÁXIMO';
        btn.disabled = true;
      } else {
        btn.textContent = `Mejorar (${cost} 🪙)`;
        btn.disabled = coins < cost;
        btn.onclick = () => {
          if (coins >= cost) {
            coins -= cost;
            wUpgrades[up.key] += 1;
            const newStats = getWeaponStats(player.equippedWeapon, player.weaponUpgrades);
            player.ammoByWeapon[player.equippedWeapon] = newStats.magSize;
            Audio.upgrade();
            upgradeFeedback.textContent = `Mejorado "${up.name}" de ${newStats.name} a Nivel ${wUpgrades[up.key]}.`;
            renderUpgradeMenu();
            updateHud();
          }
        };
      }

      card.appendChild(btn);
      weaponUpgradesList.appendChild(card);
    }

    // 3. Mejoras del soldado
    soldierUpgradesList.innerHTML = '';
    for (const sup of SOLDIER_UPGRADE_DEFS) {
      const lvl = sup.isConsumable ? 0 : player.soldierUpgrades[sup.key];
      const maxed = !sup.isConsumable && lvl >= sup.maxLevel;
      const cost = sup.baseCost + lvl * sup.costStep;

      const card = document.createElement('div');
      card.className = 'card-item';

      let pipsHtml = '';
      if (!sup.isConsumable) {
        let pips = '';
        for (let i = 0; i < sup.maxLevel; i++) {
          pips += `<div class="pip ${i < lvl ? 'filled' : ''}"></div>`;
        }
        pipsHtml = `<div class="level-pips">${pips}</div>`;
      }

      card.innerHTML = `
        <div>
          <div class="card-title-row">
            <span class="card-title">${sup.name}</span>
            <span class="card-tag">${sup.isConsumable ? `HP: ${Math.ceil(player.hp)}/${player.maxHp}` : `Nv. ${lvl}/${sup.maxLevel}`}</span>
          </div>
          <p class="card-desc">${sup.desc}</p>
        </div>
        ${pipsHtml}
      `;

      const btn = document.createElement('button');
      btn.className = 'card-btn';
      if (sup.isConsumable) {
        const fullHp = player.hp >= player.maxHp;
        btn.textContent = fullHp ? 'Salud al máximo' : `Curar +50 HP (${cost} 🪙)`;
        btn.disabled = fullHp || coins < cost;
        btn.onclick = () => {
          if (coins >= cost && player.hp < player.maxHp) {
            coins -= cost;
            player.hp = Math.min(player.maxHp, player.hp + 50);
            Audio.heal();
            upgradeFeedback.textContent = '¡Salud restaurada en +50 HP!';
            renderUpgradeMenu();
            updateHud();
          }
        };
      } else if (maxed) {
        btn.textContent = 'NIVEL MÁXIMO';
        btn.disabled = true;
      } else {
        btn.textContent = `Mejorar (${cost} 🪙)`;
        btn.disabled = coins < cost;
        btn.onclick = () => {
          if (coins >= cost) {
            coins -= cost;
            player.soldierUpgrades[sup.key] += 1;
            if (sup.key === 'armor') {
              player.maxHp += 25;
              player.hp = Math.min(player.maxHp, player.hp + 25);
            }
            Audio.upgrade();
            upgradeFeedback.textContent = `¡${sup.name} mejorado a Nivel ${player.soldierUpgrades[sup.key]}!`;
            renderUpgradeMenu();
            updateHud();
          }
        };
      }

      card.appendChild(btn);
      soldierUpgradesList.appendChild(card);
    }

    const nextBtn = document.getElementById('btnNextOrResume');
    nextBtn.textContent =
      returnStateFromUpgrade === 'levelComplete' ? 'AVANZAR AL SIGUIENTE MAPA ➜' : 'VOLVER AL COMBATE';
  }

  function hideAllOverlays() {
    startScreen.classList.add('hidden');
    upgradeOverlay.classList.add('hidden');
    pauseOverlay.classList.add('hidden');
    levelCompleteOverlay.classList.add('hidden');
    endOverlay.classList.add('hidden');
  }

  // Acordeones desplegables dentro del menú de mejoras
  document.querySelectorAll('.dropdown-trigger').forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const targetId = trigger.getAttribute('data-section');
      const content = document.getElementById(targetId);
      const isOpen = content.classList.toggle('open');
      trigger.classList.toggle('active', isOpen);
      trigger.setAttribute('aria-expanded', String(isOpen));
    });
  });

  // Eventos de ratón sobre el canvas
  function updateMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * WIDTH;
    mouse.y = ((e.clientY - rect.top) / rect.height) * HEIGHT;
  }

  canvas.addEventListener('mousemove', updateMousePos);
  canvas.addEventListener('mousedown', (e) => {
    if (e.button === 0) {
      Audio.init();
      updateMousePos(e);
      mouse.down = true;
      if (gameState === 'playing' && player) {
        player.angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
        tryFirePlayer();
        updateHud();
      }
    }
  });
  window.addEventListener('mouseup', (e) => {
    if (e.button === 0) mouse.down = false;
  });

  // Controles de teclado
  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
      e.preventDefault();
    }
    keys[e.code] = true;

    if (!player) return;

    if (e.code === 'KeyR' && gameState === 'playing') {
      startReload();
    } else if (e.code === 'KeyM') {
      if (gameState === 'playing') {
        openUpgradeMenu('playing');
      } else if (gameState === 'upgrade') {
        closeUpgradeMenu();
      }
    } else if (e.code === 'Escape' || e.code === 'KeyP') {
      if (gameState === 'playing') {
        gameState = 'paused';
        mouse.down = false;
        pauseOverlay.classList.remove('hidden');
      } else if (gameState === 'paused') {
        pauseOverlay.classList.add('hidden');
        gameState = 'playing';
      } else if (gameState === 'upgrade') {
        closeUpgradeMenu();
      }
    } else if (gameState === 'playing') {
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= WEAPON_CATALOG.length) {
        const target = WEAPON_CATALOG[num - 1];
        if (player.unlockedWeapons.includes(target.id)) {
          equipWeapon(target.id);
        }
      }
    }
  });

  window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
  });

  // Botones UI
  document.getElementById('btnStartGame').addEventListener('click', startNewGame);
  document.getElementById('btnRetry').addEventListener('click', startNewGame);
  document.getElementById('btnRestartFromPause').addEventListener('click', startNewGame);

  document.getElementById('btnOpenUpgradeHud').addEventListener('click', () => {
    if (gameState === 'playing') openUpgradeMenu('playing');
  });
  document.getElementById('btnCloseUpgrade').addEventListener('click', closeUpgradeMenu);
  document.getElementById('btnNextOrResume').addEventListener('click', () => {
    if (returnStateFromUpgrade === 'levelComplete') {
      upgradeOverlay.classList.add('hidden');
      loadLevel(currentLevel + 1);
      gameState = 'playing';
    } else {
      closeUpgradeMenu();
    }
  });

  document.getElementById('btnPause').addEventListener('click', () => {
    if (gameState === 'playing') {
      gameState = 'paused';
      mouse.down = false;
      pauseOverlay.classList.remove('hidden');
    } else if (gameState === 'paused') {
      pauseOverlay.classList.add('hidden');
      gameState = 'playing';
    }
  });

  document.getElementById('btnResume').addEventListener('click', () => {
    pauseOverlay.classList.add('hidden');
    gameState = 'playing';
  });

  document.getElementById('btnPauseToUpgrade').addEventListener('click', () => {
    openUpgradeMenu('playing');
  });

  document.getElementById('btnOpenArmoryBetween').addEventListener('click', () => {
    openUpgradeMenu('levelComplete');
  });

  document.getElementById('btnContinueNextLevel').addEventListener('click', () => {
    levelCompleteOverlay.classList.add('hidden');
    loadLevel(currentLevel + 1);
    gameState = 'playing';
  });

  document.getElementById('btnMute').addEventListener('click', (e) => {
    const muted = Audio.toggleMute();
    e.currentTarget.textContent = muted ? '🔇' : '🔊';
  });

  // Bucle principal
  let lastTime = performance.now();
  function gameLoop(now) {
    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;

    update(dt);
    render();
    requestAnimationFrame(gameLoop);
  }

  requestAnimationFrame(gameLoop);
})();
