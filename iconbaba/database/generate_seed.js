// database/generate_seed.js
// Generates database/seed.sql using official MIT-licensed @tabler/icons dataset

const fs = require('fs');
const path = require('path');

const CATEGORIES = [
  'Animals', 'Arrows', 'Badges', 'Brand', 'Buildings', 'Charts', 'Communication', 
  'Computers', 'Currencies', 'Database', 'Design', 'Development', 'Devices', 
  'Document', 'E-commerce', 'Electrical', 'Extensions', 'Food', 'Games', 
  'Gender', 'Gestures', 'Health', 'Laundry', 'Letters', 'Logic', 'Map', 
  'Math', 'Media', 'Misc', 'Mood', 'Nature', 'Numbers', 'Photography', 
  'Shapes', 'Sport', 'Symbols', 'System', 'Text', 'Vehicles', 'Version control', 
  'Weather', 'Zodiac'
];

function escapeSql(str) {
  if (!str) return "''";
  return "'" + str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '\\r') + "'";
}

function renderSvg(nodes, style = 'outlined') {
  const children = nodes.map(([tag, attrs]) => {
    const attrStr = Object.entries(attrs).map(([k, v]) => `${k}="${v}"`).join(' ');
    return `<${tag} ${attrStr} />`;
  }).join('');

  if (style === 'filled') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">${children}</svg>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${children}</svg>`;
}

async function main() {
  console.log('Fetching icon data from CDN...');
  const [iconsRes, outlineRes, filledRes] = await Promise.all([
    fetch('https://cdn.jsdelivr.net/npm/@tabler/icons@latest/icons.json').then(r => r.json()),
    fetch('https://cdn.jsdelivr.net/npm/@tabler/icons@latest/tabler-nodes-outline.json').then(r => r.json()),
    fetch('https://cdn.jsdelivr.net/npm/@tabler/icons@latest/tabler-nodes-filled.json').then(r => r.json())
  ]);

  console.log(`Loaded ${Object.keys(iconsRes).length} icons metadata.`);
  console.log(`Loaded ${Object.keys(outlineRes).length} outline SVGs.`);
  console.log(`Loaded ${Object.keys(filledRes).length} filled SVGs.`);

  let sql = `-- IconBaba Database Seed Data\n`;
  sql += `-- Generated from @tabler/icons (MIT License)\n\n`;
  sql += `USE \`iconbaba\`;\n\n`;
  sql += `SET FOREIGN_KEY_CHECKS = 0;\n`;
  sql += `TRUNCATE TABLE \`categories\`;\n`;
  sql += `TRUNCATE TABLE \`icons\`;\n`;
  sql += `TRUNCATE TABLE \`icon_variants\`;\n`;
  sql += `TRUNCATE TABLE \`favorites\`;\n`;
  sql += `TRUNCATE TABLE \`collections\`;\n`;
  sql += `TRUNCATE TABLE \`collection_items\`;\n`;
  sql += `TRUNCATE TABLE \`downloads\`;\n`;
  sql += `SET FOREIGN_KEY_CHECKS = 1;\n\n`;

  // 1. Insert Categories
  sql += `-- Insert 42 Categories\n`;
  sql += `INSERT INTO \`categories\` (\`id\`, \`name\`, \`slug\`, \`display_order\`) VALUES\n`;
  const catMap = new Map();
  CATEGORIES.forEach((cat, index) => {
    const id = index + 1;
    const slug = cat.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    catMap.set(cat.toLowerCase(), id);
    const isLast = index === CATEGORIES.length - 1;
    sql += `(${id}, ${escapeSql(cat)}, ${escapeSql(slug)}, ${index})${isLast ? ';' : ','}\n`;
  });
  sql += `\n`;

  // 2. Demo User (password: password123)
  // PHP password_hash('password123', PASSWORD_BCRYPT): $2y$10$w6YJ2f9d.kK9hPZ1kI0KeeP3X0wR5sT.qQzO7qg6q8U6N8wN0XlKu
  const demoHash = '$2y$10$w6YJ2f9d.kK9hPZ1kI0KeeP3X0wR5sT.qQzO7qg6q8U6N8wN0XlKu';
  sql += `-- Demo User (credentials: demo@iconbaba.com / password123)\n`;
  sql += `INSERT INTO \`users\` (\`id\`, \`username\`, \`email\`, \`password_hash\`, \`full_name\`, \`role\`) VALUES\n`;
  sql += `(1, 'demo', 'demo@iconbaba.com', '${demoHash}', 'Demo User', 'user')\n`;
  sql += `ON DUPLICATE KEY UPDATE \`password_hash\` = VALUES(\`password_hash\`);\n\n`;

  // 3. Icons and Variants
  console.log('Building SQL statements for icons and variants...');
  let iconId = 1;
  const iconRows = [];
  const variantRows = [];
  const catCounts = new Map();

  for (const [name, meta] of Object.entries(iconsRes)) {
    const rawCat = (meta.category || 'Misc').trim();
    let catId = catMap.get(rawCat.toLowerCase());
    if (!catId) {
      catId = catMap.get('misc');
    }

    catCounts.set(catId, (catCounts.get(catId) || 0) + 1);

    const slug = name;
    const tagsStr = (meta.tags || []).join(',');
    
    iconRows.push(`(${iconId}, ${escapeSql(name)}, ${escapeSql(slug)}, ${catId}, ${escapeSql(tagsStr)})`);

    // Outline variant
    if (outlineRes[name]) {
      const outlineSvg = renderSvg(outlineRes[name], 'outlined');
      variantRows.push(`(${iconId}, 'outlined', ${escapeSql(outlineSvg)})`);
    }

    // Filled variant (if available, else fallback)
    if (filledRes[name]) {
      const filledSvg = renderSvg(filledRes[name], 'filled');
      variantRows.push(`(${iconId}, 'filled', ${escapeSql(filledSvg)})`);
    } else if (outlineRes[name]) {
      // Fallback filled
      const filledSvg = renderSvg(outlineRes[name], 'outlined');
      variantRows.push(`(${iconId}, 'filled', ${escapeSql(filledSvg)})`);
    }

    iconId++;
  }

  // Batch insert icons
  sql += `-- Insert Icons (${iconRows.length} total)\n`;
  const BATCH_SIZE = 500;
  for (let i = 0; i < iconRows.length; i += BATCH_SIZE) {
    const batch = iconRows.slice(i, i + BATCH_SIZE);
    sql += `INSERT INTO \`icons\` (\`id\`, \`name\`, \`slug\`, \`category_id\`, \`tags\`) VALUES\n` + batch.join(',\n') + `;\n\n`;
  }

  // Batch insert icon_variants
  sql += `-- Insert Icon Variants (${variantRows.length} total)\n`;
  for (let i = 0; i < variantRows.length; i += BATCH_SIZE) {
    const batch = variantRows.slice(i, i + BATCH_SIZE);
    sql += `INSERT INTO \`icon_variants\` (\`icon_id\`, \`style\`, \`svg_content\`) VALUES\n` + batch.join(',\n') + `;\n\n`;
  }

  // Update category icon counts
  sql += `-- Update Category Icon Counts\n`;
  for (const [catId, count] of catCounts.entries()) {
    sql += `UPDATE \`categories\` SET \`icon_count\` = ${count} WHERE \`id\` = ${catId};\n`;
  }

  // Add sample collection & favorites for demo user
  sql += `\n-- Sample Collection for Demo User\n`;
  sql += `INSERT INTO \`collections\` (\`id\`, \`user_id\`, \`name\`, \`description\`, \`is_public\`) VALUES\n`;
  sql += `(1, 1, 'My Essential UI Icons', 'Handpicked icons for modern web interfaces', 1);\n\n`;

  sql += `INSERT INTO \`collection_items\` (\`collection_id\`, \`icon_id\`) VALUES\n`;
  sql += `(1, 1), (1, 2), (1, 3), (1, 4), (1, 5);\n\n`;

  sql += `INSERT INTO \`favorites\` (\`user_id\`, \`icon_id\`) VALUES\n`;
  sql += `(1, 1), (1, 2), (1, 3);\n`;

  const outputPath = path.join(__dirname, 'seed.sql');
  fs.writeFileSync(outputPath, sql, 'utf8');
  console.log(`Successfully generated ${outputPath} with ${iconRows.length} icons and ${variantRows.length} variants!`);
}

main().catch(err => {
  console.error('Error generating seed:', err);
  process.exit(1);
});
