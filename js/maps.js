// Mapas tácticos distintos por cada nivel + progresión de dificultad
window.GameMaps = (function () {
  const WIDTH = 1100;
  const HEIGHT = 700;

  // 6 mapas únicos diseñados a mano; niveles superiores reciclan escenarios con modificadores élite
  const MAPS = [
    {
      id: 1,
      name: 'Puesto Fronterizo',
      subtitle: 'Bosque de vigilancia — Patrullas ligeras en camino',
      theme: 'forest',
      palette: {
        bg: '#1c2b21',
        grid: 'rgba(255,255,255,0.035)',
        road: '#343b30',
        wall: '#6b533b',
        wallBorder: '#433221',
        rock: '#525b63',
        foliage: 'rgba(46, 117, 65, 0.38)',
      },
      playerSpawn: { x: 550, y: 350 },
      decors: [
        { type: 'road', x: 0, y: 310, w: 1100, h: 80 },
        { type: 'road', x: 510, y: 0, w: 80, h: 700 },
        { type: 'treePatch', x: 120, y: 120, r: 58 },
        { type: 'treePatch', x: 960, y: 130, r: 65 },
        { type: 'treePatch', x: 140, y: 580, r: 62 },
        { type: 'treePatch', x: 950, y: 575, r: 58 },
      ],
      obstacles: [
        { x: 250, y: 180, w: 95, h: 32, type: 'sandbag' },
        { x: 755, y: 180, w: 95, h: 32, type: 'sandbag' },
        { x: 250, y: 490, w: 95, h: 32, type: 'sandbag' },
        { x: 755, y: 490, w: 95, h: 32, type: 'sandbag' },
        { x: 400, y: 260, w: 46, h: 46, type: 'crate' },
        { x: 654, y: 394, w: 46, h: 46, type: 'crate' },
        { x: 130, y: 320, w: 48, h: 60, type: 'rock' },
        { x: 920, y: 320, w: 48, h: 60, type: 'rock' },
      ],
      barrels: [
        { x: 355, y: 170 },
        { x: 740, y: 530 },
      ],
      spawnPoints: [
        { x: 60, y: 70 },
        { x: 1040, y: 70 },
        { x: 60, y: 630 },
        { x: 1040, y: 630 },
        { x: 550, y: 45 },
        { x: 550, y: 655 },
      ],
    },
    {
      id: 2,
      name: 'Desierto de Chatarra',
      subtitle: 'Contenedores oxidados y emboscadas veloces',
      theme: 'desert',
      palette: {
        bg: '#4b3b28',
        grid: 'rgba(255,245,210,0.04)',
        road: '#624d35',
        wall: '#7c4b32',
        wallBorder: '#472819',
        rock: '#8b7355',
        foliage: 'rgba(180, 140, 75, 0.25)',
      },
      playerSpawn: { x: 150, y: 350 },
      decors: [
        { type: 'dune', x: 320, y: 140, r: 95 },
        { type: 'dune', x: 780, y: 560, r: 105 },
        { type: 'helipad', x: 550, y: 350, r: 72 },
      ],
      obstacles: [
        { x: 290, y: 160, w: 145, h: 52, type: 'container', color: '#8f3f2c' },
        { x: 290, y: 490, w: 145, h: 52, type: 'container', color: '#2f5d75' },
        { x: 525, y: 95, w: 50, h: 120, type: 'container', color: '#786234' },
        { x: 525, y: 485, w: 50, h: 120, type: 'container', color: '#786234' },
        { x: 710, y: 230, w: 130, h: 50, type: 'container', color: '#4d6140' },
        { x: 710, y: 420, w: 130, h: 50, type: 'container', color: '#8f3f2c' },
        { x: 420, y: 325, w: 45, h: 50, type: 'crate' },
        { x: 930, y: 120, w: 56, h: 56, type: 'rock' },
        { x: 930, y: 524, w: 56, h: 56, type: 'rock' },
      ],
      barrels: [
        { x: 465, y: 235 },
        { x: 675, y: 350 },
        { x: 865, y: 350 },
      ],
      spawnPoints: [
        { x: 1045, y: 80 },
        { x: 1045, y: 350 },
        { x: 1045, y: 620 },
        { x: 680, y: 45 },
        { x: 680, y: 655 },
      ],
    },
    {
      id: 3,
      name: 'Complejo Industrial',
      subtitle: 'Pasillos estrechos, barriles volátiles y artilleros',
      theme: 'industrial',
      palette: {
        bg: '#232830',
        grid: 'rgba(148,163,184,0.06)',
        road: '#313742',
        wall: '#475569',
        wallBorder: '#1e293b',
        rock: '#64748b',
        foliage: 'rgba(245, 158, 11, 0.14)',
      },
      playerSpawn: { x: 550, y: 590 },
      decors: [
        { type: 'hazardZone', x: 450, y: 270, w: 200, h: 160 },
        { type: 'road', x: 190, y: 90, w: 720, h: 520 },
      ],
      obstacles: [
        // Muros de concreto en cuadrícula táctica
        { x: 200, y: 170, w: 190, h: 34, type: 'wall' },
        { x: 710, y: 170, w: 190, h: 34, type: 'wall' },
        { x: 200, y: 496, w: 190, h: 34, type: 'wall' },
        { x: 710, y: 496, w: 190, h: 34, type: 'wall' },
        { x: 320, y: 290, w: 36, h: 120, type: 'wall' },
        { x: 744, y: 290, w: 36, h: 120, type: 'wall' },
        { x: 500, y: 325, w: 100, h: 50, type: 'bunker' },
        { x: 105, y: 325, w: 46, h: 50, type: 'crate' },
        { x: 949, y: 325, w: 46, h: 50, type: 'crate' },
      ],
      barrels: [
        { x: 420, y: 255 },
        { x: 680, y: 255 },
        { x: 420, y: 445 },
        { x: 680, y: 445 },
      ],
      spawnPoints: [
        { x: 60, y: 60 },
        { x: 550, y: 50 },
        { x: 1040, y: 60 },
        { x: 60, y: 350 },
        { x: 1040, y: 350 },
        { x: 60, y: 640 },
        { x: 1040, y: 640 },
      ],
    },
    {
      id: 4,
      name: 'Base Ártica',
      subtitle: 'Visibilidad helada — Francotiradores y asalto pesado',
      theme: 'arctic',
      palette: {
        bg: '#263849',
        grid: 'rgba(224,242,254,0.06)',
        road: '#364d63',
        wall: '#7ea1bd',
        wallBorder: '#3b5870',
        rock: '#94b5ce',
        foliage: 'rgba(186, 230, 253, 0.16)',
      },
      playerSpawn: { x: 550, y: 350 },
      decors: [
        { type: 'icePatch', x: 220, y: 200, r: 90 },
        { type: 'icePatch', x: 880, y: 200, r: 90 },
        { type: 'icePatch', x: 220, y: 500, r: 90 },
        { type: 'icePatch', x: 880, y: 500, r: 90 },
        { type: 'helipad', x: 550, y: 350, r: 85 },
      ],
      obstacles: [
        { x: 355, y: 150, w: 72, h: 72, type: 'bunker' },
        { x: 673, y: 150, w: 72, h: 72, type: 'bunker' },
        { x: 355, y: 478, w: 72, h: 72, type: 'bunker' },
        { x: 673, y: 478, w: 72, h: 72, type: 'bunker' },
        { x: 155, y: 300, w: 42, h: 100, type: 'wall' },
        { x: 903, y: 300, w: 42, h: 100, type: 'wall' },
        { x: 525, y: 120, w: 50, h: 40, type: 'sandbag' },
        { x: 525, y: 540, w: 50, h: 40, type: 'sandbag' },
      ],
      barrels: [
        { x: 285, y: 350 },
        { x: 815, y: 350 },
        { x: 550, y: 215 },
        { x: 550, y: 485 },
      ],
      spawnPoints: [
        { x: 55, y: 55 },
        { x: 550, y: 42 },
        { x: 1045, y: 55 },
        { x: 55, y: 645 },
        { x: 550, y: 658 },
        { x: 1045, y: 645 },
      ],
    },
    {
      id: 5,
      name: 'Ciudadela en Ruinas',
      subtitle: 'Combate urbano intenso entre columnas destruidas',
      theme: 'ruins',
      palette: {
        bg: '#2b262a',
        grid: 'rgba(255,255,255,0.035)',
        road: '#3d373c',
        wall: '#6e6268',
        wallBorder: '#3e353a',
        rock: '#7d7076',
        foliage: 'rgba(239, 68, 68, 0.12)',
      },
      playerSpawn: { x: 130, y: 130 },
      decors: [
        { type: 'road', x: 0, y: 315, w: 1100, h: 70 },
        { type: 'road', x: 515, y: 0, w: 70, h: 700 },
        { type: 'hazardZone', x: 470, y: 270, w: 160, h: 160 },
      ],
      obstacles: [
        { x: 260, y: 110, w: 54, h: 130, type: 'wall' },
        { x: 260, y: 460, w: 54, h: 130, type: 'wall' },
        { x: 786, y: 110, w: 54, h: 130, type: 'wall' },
        { x: 786, y: 460, w: 54, h: 130, type: 'wall' },
        { x: 455, y: 195, w: 48, h: 48, type: 'rock' },
        { x: 597, y: 195, w: 48, h: 48, type: 'rock' },
        { x: 455, y: 457, w: 48, h: 48, type: 'rock' },
        { x: 597, y: 457, w: 48, h: 48, type: 'rock' },
        { x: 635, y: 325, w: 46, h: 50, type: 'crate' },
        { x: 419, y: 325, w: 46, h: 50, type: 'crate' },
      ],
      barrels: [
        { x: 550, y: 350 },
        { x: 360, y: 350 },
        { x: 740, y: 350 },
        { x: 550, y: 135 },
      ],
      spawnPoints: [
        { x: 1045, y: 65 },
        { x: 1045, y: 350 },
        { x: 1045, y: 635 },
        { x: 550, y: 655 },
        { x: 110, y: 645 },
      ],
    },
    {
      id: 6,
      name: 'Fortaleza Volcánica',
      subtitle: 'Cuartel General del Comandante — Máxima amenaza',
      theme: 'volcanic',
      palette: {
        bg: '#231517',
        grid: 'rgba(248,113,113,0.05)',
        road: '#362124',
        wall: '#57363a',
        wallBorder: '#2a1619',
        rock: '#6c494e',
        foliage: 'rgba(249, 115, 22, 0.2)',
      },
      playerSpawn: { x: 550, y: 580 },
      decors: [
        { type: 'lavaPool', x: 140, y: 160, r: 65 },
        { type: 'lavaPool', x: 960, y: 160, r: 65 },
        { type: 'helipad', x: 550, y: 220, r: 85 },
      ],
      obstacles: [
        { x: 240, y: 245, w: 120, h: 38, type: 'bunker' },
        { x: 740, y: 245, w: 120, h: 38, type: 'bunker' },
        { x: 240, y: 445, w: 120, h: 38, type: 'bunker' },
        { x: 740, y: 445, w: 120, h: 38, type: 'bunker' },
        { x: 495, y: 365, w: 110, h: 36, type: 'sandbag' },
        { x: 120, y: 335, w: 50, h: 70, type: 'rock' },
        { x: 930, y: 335, w: 50, h: 70, type: 'rock' },
      ],
      barrels: [
        { x: 400, y: 350 },
        { x: 700, y: 350 },
        { x: 350, y: 150 },
        { x: 750, y: 150 },
      ],
      spawnPoints: [
        { x: 550, y: 55 },
        { x: 80, y: 65 },
        { x: 1020, y: 65 },
        { x: 60, y: 520 },
        { x: 1040, y: 520 },
      ],
    },
  ];

  // Genera la configuración completa de nivel (mapa + dificultad progresiva)
  function getLevelConfig(levelNum) {
    const baseIndex = (levelNum - 1) % MAPS.length;
    const cycle = Math.floor((levelNum - 1) / MAPS.length);
    const baseMap = MAPS[baseIndex];

    // Escalado progresivo de dificultad
    const hpScale = 1 + (levelNum - 1) * 0.22 + cycle * 0.35;
    const speedScale = Math.min(1.85, 1 + (levelNum - 1) * 0.055);
    const damageScale = 1 + (levelNum - 1) * 0.14;
    const totalEnemies = 8 + levelNum * 4 + cycle * 4;
    const maxConcurrent = Math.min(14, 4 + Math.floor(levelNum * 1.1));
    const spawnInterval = Math.max(0.55, 1.85 - levelNum * 0.12);
    const hasBoss = levelNum % 3 === 0 || levelNum >= 6;

    // Composición de enemigos desbloqueada conforme avanza el jugador
    const pool = ['grunt'];
    if (levelNum >= 2) pool.push('scout', 'scout');
    if (levelNum >= 3) pool.push('shotgunner');
    if (levelNum >= 4) pool.push('sniper', 'heavy');
    if (levelNum >= 5) pool.push('heavy', 'shotgunner');

    return {
      levelNum,
      cycle,
      map: {
        ...baseMap,
        displayName: cycle > 0 ? `${baseMap.name} (Élite +${cycle})` : baseMap.name,
        obstacles: baseMap.obstacles.map((o) => ({ ...o })),
        barrels: baseMap.barrels.map((b, i) => ({ ...b, id: i, alive: true, hp: 35, maxHp: 35 })),
      },
      difficulty: {
        hpScale,
        speedScale,
        damageScale,
        totalEnemies,
        maxConcurrent,
        spawnInterval,
        enemyPool: pool,
        hasBoss,
        coinBonus: 20 + levelNum * 10,
      },
    };
  }

  return {
    WIDTH,
    HEIGHT,
    TOTAL_UNIQUE_MAPS: MAPS.length,
    getLevelConfig,
  };
})();
