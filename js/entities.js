// Catálogo de armas, mejoras, tipos de enemigos, física 2D y renderizado de entidades
window.GameEntities = (function () {
  const WEAPON_CATALOG = [
    {
      id: 'pistol',
      name: 'Pistola Táctica',
      desc: 'Precisa y confiable. Munición equilibrada para cualquier distancia.',
      unlockCost: 0,
      color: '#cbd5e1',
      barrelLen: 20,
      barrelWidth: 5,
      baseStats: {
        damage: 24,
        fireInterval: 0.28,
        magSize: 12,
        reloadTime: 1.05,
        bulletSpeed: 740,
        pellets: 1,
        spread: 0.035,
        pierce: 0,
        bulletColor: '#fde047',
      },
    },
    {
      id: 'smg',
      name: 'Subfusil MP-X',
      desc: 'Cadencia altísima para barrer oleadas rápidas de enemigos.',
      unlockCost: 60,
      color: '#64748b',
      barrelLen: 24,
      barrelWidth: 6,
      baseStats: {
        damage: 15,
        fireInterval: 0.095,
        magSize: 32,
        reloadTime: 1.35,
        bulletSpeed: 760,
        pellets: 1,
        spread: 0.09,
        pierce: 0,
        bulletColor: '#fbbf24',
      },
    },
    {
      id: 'shotgun',
      name: 'Escopeta M870',
      desc: 'Dispara 6 perdigones en abanico. Letal a corta y media distancia.',
      unlockCost: 110,
      color: '#78350f',
      barrelLen: 27,
      barrelWidth: 7,
      baseStats: {
        damage: 14,
        fireInterval: 0.65,
        magSize: 8,
        reloadTime: 1.65,
        bulletSpeed: 680,
        pellets: 6,
        spread: 0.24,
        pierce: 0,
        bulletColor: '#fb923c',
      },
    },
    {
      id: 'rifle',
      name: 'Rifle de Asalto M4',
      desc: 'Alto daño, largo alcance y disparo automático preciso.',
      unlockCost: 175,
      color: '#334155',
      barrelLen: 30,
      barrelWidth: 6,
      baseStats: {
        damage: 30,
        fireInterval: 0.135,
        magSize: 28,
        reloadTime: 1.45,
        bulletSpeed: 900,
        pellets: 1,
        spread: 0.04,
        pierce: 0,
        bulletColor: '#fef08a',
      },
    },
    {
      id: 'plasma',
      name: 'Cañón de Plasma',
      desc: 'Proyectiles energéticos perforantes que atraviesan múltiples objetivos.',
      unlockCost: 260,
      color: '#0284c7',
      barrelLen: 31,
      barrelWidth: 8,
      baseStats: {
        damage: 52,
        fireInterval: 0.24,
        magSize: 18,
        reloadTime: 1.5,
        bulletSpeed: 960,
        pellets: 1,
        spread: 0.02,
        pierce: 2,
        bulletColor: '#38bdf8',
      },
    },
  ];

  const WEAPON_UPGRADE_DEFS = [
    {
      key: 'damage',
      name: 'Potencia de Fuego',
      desc: '+22% de daño por impacto en cada mejora.',
      maxLevel: 5,
      baseCost: 25,
      costStep: 20,
    },
    {
      key: 'fireRate',
      name: 'Cadencia de Disparo',
      desc: 'Dispara un 13% más rápido entre cada tiro.',
      maxLevel: 5,
      baseCost: 25,
      costStep: 20,
    },
    {
      key: 'capacity',
      name: 'Cargador Ampliado',
      desc: '+25% de balas por cargador y recarga más ágil.',
      maxLevel: 5,
      baseCost: 20,
      costStep: 18,
    },
    {
      key: 'ballistics',
      name: 'Calibre Perforante',
      desc: 'Mayor velocidad de bala y +1 perforación al nivel 3 y 5.',
      maxLevel: 5,
      baseCost: 35,
      costStep: 28,
    },
  ];

  const SOLDIER_UPGRADE_DEFS = [
    {
      key: 'armor',
      name: 'Blindaje Táctico',
      desc: '+25 Salud Máxima permanente y restaura +25 HP.',
      maxLevel: 6,
      baseCost: 30,
      costStep: 25,
    },
    {
      key: 'boots',
      name: 'Botas de Combate',
      desc: '+10% de velocidad de desplazamiento.',
      maxLevel: 5,
      baseCost: 25,
      costStep: 22,
    },
    {
      key: 'magnet',
      name: 'Imán de Monedas',
      desc: 'Atrae monedas y botiquines desde mayor distancia.',
      maxLevel: 4,
      baseCost: 22,
      costStep: 20,
    },
    {
      key: 'medkit',
      name: 'Botiquín de Emergencia',
      desc: 'Cura +50 de salud inmediatamente (uso instantáneo).',
      maxLevel: 99,
      baseCost: 20,
      costStep: 0,
      isConsumable: true,
    },
  ];

  const ENEMY_TYPES = {
    grunt: {
      name: 'Soldado Raso',
      radius: 15,
      hp: 45,
      speed: 105,
      damage: 10,
      fireInterval: 1.35,
      preferredDist: 210,
      color: '#dc2626',
      helmet: '#7f1d1d',
      bulletSpeed: 370,
      coinMin: 5,
      coinMax: 8,
    },
    scout: {
      name: 'Explorador',
      radius: 13,
      hp: 32,
      speed: 170,
      damage: 8,
      fireInterval: 0.95,
      preferredDist: 145,
      color: '#ea580c',
      helmet: '#9a3412',
      bulletSpeed: 420,
      coinMin: 6,
      coinMax: 10,
    },
    shotgunner: {
      name: 'Asaltante Pesado',
      radius: 17,
      hp: 82,
      speed: 92,
      damage: 7,
      pellets: 4,
      spread: 0.25,
      fireInterval: 1.75,
      preferredDist: 150,
      color: '#9333ea',
      helmet: '#581c87',
      bulletSpeed: 350,
      coinMin: 10,
      coinMax: 15,
    },
    sniper: {
      name: 'Francotirador',
      radius: 14,
      hp: 48,
      speed: 88,
      damage: 22,
      fireInterval: 2.2,
      preferredDist: 420,
      color: '#0d9488',
      helmet: '#134e4a',
      bulletSpeed: 640,
      coinMin: 12,
      coinMax: 18,
    },
    heavy: {
      name: 'Artillero Blindado',
      radius: 21,
      hp: 155,
      speed: 68,
      damage: 14,
      fireInterval: 0.55,
      preferredDist: 230,
      color: '#b91c1c',
      helmet: '#3f3f46',
      bulletSpeed: 390,
      coinMin: 16,
      coinMax: 24,
    },
    boss: {
      name: 'Comandante Supremo',
      radius: 28,
      hp: 460,
      speed: 78,
      damage: 16,
      pellets: 3,
      spread: 0.22,
      fireInterval: 0.72,
      preferredDist: 240,
      color: '#f59e0b',
      helmet: '#451a03',
      bulletSpeed: 440,
      coinMin: 45,
      coinMax: 70,
      isBoss: true,
    },
  };

  function getWeaponStats(weaponId, upgrades) {
    const def = WEAPON_CATALOG.find((w) => w.id === weaponId) || WEAPON_CATALOG[0];
    const up = upgrades[weaponId] || { damage: 0, fireRate: 0, capacity: 0, ballistics: 0 };
    const base = def.baseStats;

    const damage = Math.round(base.damage * (1 + up.damage * 0.22));
    const fireInterval = base.fireInterval * Math.pow(0.87, up.fireRate);
    const magSize = Math.round(base.magSize * (1 + up.capacity * 0.25));
    const reloadTime = Math.max(0.45, base.reloadTime * Math.pow(0.9, up.capacity));
    const bulletSpeed = Math.round(base.bulletSpeed * (1 + up.ballistics * 0.1));
    const extraPierce = up.ballistics >= 5 ? 2 : up.ballistics >= 3 ? 1 : 0;

    return {
      ...def,
      damage,
      fireInterval,
      magSize,
      reloadTime,
      bulletSpeed,
      pellets: base.pellets,
      spread: Math.max(0.01, base.spread * Math.pow(0.92, up.ballistics)),
      pierce: base.pierce + extraPierce,
      bulletColor: base.bulletColor,
    };
  }

  // Colisión círculo vs rectángulos (deslizamiento suave)
  function resolveCircleObstacles(entity, obstacles, width, height) {
    entity.x = Math.max(entity.radius + 6, Math.min(width - entity.radius - 6, entity.x));
    entity.y = Math.max(entity.radius + 6, Math.min(height - entity.radius - 6, entity.y));

    for (let i = 0; i < obstacles.length; i++) {
      const o = obstacles[i];
      const closestX = Math.max(o.x, Math.min(entity.x, o.x + o.w));
      const closestY = Math.max(o.y, Math.min(entity.y, o.y + o.h));
      const dx = entity.x - closestX;
      const dy = entity.y - closestY;
      const distSq = dx * dx + dy * dy;

      if (distSq < entity.radius * entity.radius) {
        const dist = Math.sqrt(distSq);
        if (dist > 0.0001) {
          const overlap = entity.radius - dist;
          entity.x += (dx / dist) * overlap;
          entity.y += (dy / dist) * overlap;
        } else {
          // Dentro del obstáculo: empujar hacia el borde más cercano
          const leftPen = entity.x - o.x;
          const rightPen = o.x + o.w - entity.x;
          const topPen = entity.y - o.y;
          const bottomPen = o.y + o.h - entity.y;
          const minPen = Math.min(leftPen, rightPen, topPen, bottomPen);
          if (minPen === leftPen) entity.x = o.x - entity.radius;
          else if (minPen === rightPen) entity.x = o.x + o.w + entity.radius;
          else if (minPen === topPen) entity.y = o.y - entity.radius;
          else entity.y = o.y + o.h + entity.radius;
        }
      }
    }
  }

  function pointHitsObstacle(x, y, obstacles) {
    for (let i = 0; i < obstacles.length; i++) {
      const o = obstacles[i];
      if (x >= o.x && x <= o.x + o.w && y >= o.y && y <= o.y + o.h) {
        return o;
      }
    }
    return null;
  }

  function hasLineOfSight(x1, y1, x2, y2, obstacles) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.hypot(dx, dy);
    const steps = Math.max(2, Math.ceil(dist / 18));
    for (let s = 1; s < steps; s++) {
      const t = s / steps;
      const px = x1 + dx * t;
      const py = y1 + dy * t;
      if (pointHitsObstacle(px, py, obstacles)) return false;
    }
    return true;
  }

  // Renderizado del mapa y cobertura
  function drawMap(ctx, map, width, height) {
    const p = map.palette;
    ctx.fillStyle = p.bg;
    ctx.fillRect(0, 0, width, height);

    // Cuadrícula táctica sutil
    ctx.strokeStyle = p.grid;
    ctx.lineWidth = 1;
    for (let x = 0; x <= width; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Decoraciones de suelo por mapa
    for (const d of map.decors) {
      if (d.type === 'road') {
        ctx.fillStyle = p.road;
        ctx.fillRect(d.x, d.y, d.w, d.h);
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.setLineDash([16, 14]);
        ctx.lineWidth = 2;
        if (d.w > d.h) {
          ctx.beginPath();
          ctx.moveTo(d.x, d.y + d.h / 2);
          ctx.lineTo(d.x + d.w, d.y + d.h / 2);
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.moveTo(d.x + d.w / 2, d.y);
          ctx.lineTo(d.x + d.w / 2, d.y + d.h);
          ctx.stroke();
        }
        ctx.setLineDash([]);
      } else if (d.type === 'treePatch' || d.type === 'dune' || d.type === 'icePatch') {
        ctx.fillStyle = p.foliage;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fill();
      } else if (d.type === 'helipad') {
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.14)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.font = 'bold 42px sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('H', d.x, d.y + 2);
        ctx.restore();
      } else if (d.type === 'hazardZone') {
        ctx.fillStyle = p.foliage;
        ctx.fillRect(d.x, d.y, d.w, d.h);
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.28)';
        ctx.lineWidth = 2;
        ctx.strokeRect(d.x, d.y, d.w, d.h);
      } else if (d.type === 'lavaPool') {
        const grad = ctx.createRadialGradient(d.x, d.y, 10, d.x, d.y, d.r);
        grad.addColorStop(0, 'rgba(251, 146, 60, 0.55)');
        grad.addColorStop(1, 'rgba(220, 38, 38, 0.05)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Obstáculos sólidos
    for (const o of map.obstacles) {
      // Sombra proyectada
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(o.x + 5, o.y + 6, o.w, o.h);

      if (o.type === 'sandbag') {
        ctx.fillStyle = '#9c8359';
        ctx.fillRect(o.x, o.y, o.w, o.h);
        ctx.strokeStyle = '#5c4b2f';
        ctx.lineWidth = 2;
        ctx.strokeRect(o.x, o.y, o.w, o.h);
        ctx.beginPath();
        ctx.moveTo(o.x + o.w * 0.33, o.y);
        ctx.lineTo(o.x + o.w * 0.33, o.y + o.h);
        ctx.moveTo(o.x + o.w * 0.66, o.y);
        ctx.lineTo(o.x + o.w * 0.66, o.y + o.h);
        ctx.stroke();
      } else if (o.type === 'crate') {
        ctx.fillStyle = '#8b5a2b';
        ctx.fillRect(o.x, o.y, o.w, o.h);
        ctx.strokeStyle = '#4a2e12';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(o.x, o.y, o.w, o.h);
        ctx.beginPath();
        ctx.moveTo(o.x + 4, o.y + 4);
        ctx.lineTo(o.x + o.w - 4, o.y + o.h - 4);
        ctx.moveTo(o.x + o.w - 4, o.y + 4);
        ctx.lineTo(o.x + 4, o.y + o.h - 4);
        ctx.stroke();
      } else if (o.type === 'container') {
        ctx.fillStyle = o.color || p.wall;
        ctx.fillRect(o.x, o.y, o.w, o.h);
        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.lineWidth = 2;
        ctx.strokeRect(o.x, o.y, o.w, o.h);
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        for (let sx = o.x + 12; sx < o.x + o.w - 6; sx += 14) {
          ctx.beginPath();
          ctx.moveTo(sx, o.y + 4);
          ctx.lineTo(sx, o.y + o.h - 4);
          ctx.stroke();
        }
      } else if (o.type === 'rock') {
        ctx.fillStyle = p.rock;
        ctx.beginPath();
        ctx.roundRect(o.x, o.y, o.w, o.h, 12);
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.45)';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else {
        // Muro o búnker
        ctx.fillStyle = p.wall;
        ctx.fillRect(o.x, o.y, o.w, o.h);
        ctx.strokeStyle = p.wallBorder;
        ctx.lineWidth = 3;
        ctx.strokeRect(o.x, o.y, o.w, o.h);
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.fillRect(o.x + 4, o.y + 4, o.w - 8, 5);
      }
    }

    // Barriles explosivos
    for (const b of map.barrels) {
      if (!b.alive) continue;
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath();
      ctx.arc(3, 4, 15, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.fillStyle = '#fef08a';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('!', 0, 1);
      ctx.restore();
    }
  }

  // Renderizado del Soldado (jugador o enemigo)
  function drawSoldier(ctx, opts) {
    const {
      x,
      y,
      angle,
      radius,
      bodyColor,
      helmetColor,
      gunColor,
      barrelLen,
      barrelWidth,
      isPlayer,
      isBoss,
      muzzleFlash,
      hurtFlash,
      hp,
      maxHp,
      reloadProgress,
      mouseX,
      mouseY,
    } = opts;

    // Mira láser sutil para el jugador
    if (isPlayer && typeof mouseX === 'number') {
      ctx.save();
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.22)';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(angle) * (radius + 10), y + Math.sin(angle) * (radius + 10));
      ctx.lineTo(mouseX, mouseY);
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.translate(x, y);

    // Sombra
    ctx.fillStyle = 'rgba(0,0,0,0.38)';
    ctx.beginPath();
    ctx.arc(3, 5, radius + 1, 0, Math.PI * 2);
    ctx.fill();

    ctx.rotate(angle);

    // Hombros / chaleco táctico
    ctx.fillStyle = hurtFlash > 0 ? '#ffffff' : bodyColor;
    ctx.beginPath();
    ctx.ellipse(0, 0, radius * 0.85, radius * 1.05, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.55)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Brazos sujetando el arma
    ctx.fillStyle = hurtFlash > 0 ? '#ffffff' : bodyColor;
    ctx.fillRect(4, 5, 11, 5);
    ctx.fillRect(6, -10, 9, 5);

    // Arma
    ctx.fillStyle = gunColor || '#cbd5e1';
    ctx.fillRect(6, -barrelWidth / 2, barrelLen, barrelWidth);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(6, -barrelWidth / 2, barrelLen, barrelWidth);

    // Destello de disparo
    if (muzzleFlash > 0) {
      ctx.fillStyle = 'rgba(254, 240, 138, 0.92)';
      ctx.beginPath();
      ctx.moveTo(6 + barrelLen, 0);
      ctx.lineTo(18 + barrelLen, -7);
      ctx.lineTo(14 + barrelLen, 0);
      ctx.lineTo(18 + barrelLen, 7);
      ctx.closePath();
      ctx.fill();
    }

    // Casco
    ctx.fillStyle = hurtFlash > 0 ? '#fecaca' : helmetColor;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.62, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Visor del casco
    ctx.fillStyle = isPlayer ? '#38bdf8' : isBoss ? '#fef08a' : '#fca5a5';
    ctx.fillRect(radius * 0.24, -radius * 0.28, 4, radius * 0.56);

    ctx.restore();

    // Indicador de recarga sobre el jugador
    if (isPlayer && reloadProgress > 0 && reloadProgress < 1) {
      ctx.save();
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y, radius + 8, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * reloadProgress);
      ctx.stroke();
      ctx.restore();
    }

    // Barra de vida de enemigos dañados o jefes
    if (!isPlayer && (hp < maxHp || isBoss)) {
      const barW = isBoss ? 56 : 32;
      const barH = isBoss ? 6 : 4;
      const bx = x - barW / 2;
      const by = y - radius - 13;
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      ctx.fillRect(bx - 1, by - 1, barW + 2, barH + 2);
      ctx.fillStyle = isBoss ? '#f59e0b' : '#ef4444';
      ctx.fillRect(bx, by, barW * Math.max(0, hp / maxHp), barH);
    }
  }

  return {
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
  };
})();
