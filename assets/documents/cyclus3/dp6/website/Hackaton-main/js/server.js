const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();

app.use(express.json());
app.use(express.static(path.resolve(__dirname, '..')));

const ROUTESCRIPT_PATH = path.resolve(__dirname, 'routescript.js');

function buildRoutesCode(routesForFloor) {
  if (!routesForFloor || Object.keys(routesForFloor).length === 0) {
    return '        ';
  }

  let code = '';
  const orderedTypes = ['main', 'accessible', 'quiet'];

  Object.keys(routesForFloor).sort().forEach((room) => {
    code += `        "${room}": {\n`;

    orderedTypes.forEach((type) => {
      const points = routesForFloor[room][type];
      if (!points) return;

      const pointCode = points.map(([x, y]) => `[${x}, ${y}]`).join(', ');
      code += `          ${type}: [${pointCode}],\n`;
    });

    code += `        },\n`;
  });

  return code;
}

app.post('/save-route', (req, res) => {
  try {
    const { allRoutes } = req.body;

    if (!allRoutes || typeof allRoutes !== 'object') {
      return res.status(400).json({ success: false, error: 'Missing allRoutes' });
    }

    let content = fs.readFileSync(ROUTESCRIPT_PATH, 'utf8');

    ['AC1', 'AC2'].forEach((floor) => {
      const code = buildRoutesCode(allRoutes[floor]);

      const floorRegex = new RegExp(
        `(${floor}\\s*:\\s*\\{[\\s\\S]*?routes\\s*:\\s*\\{)([\\s\\S]*?)(\\n\\s*\\}\\s*\\n\\s*\\})`,
        'm'
      );

      if (!floorRegex.test(content)) {
        throw new Error(`Could not find routes block for ${floor}`);
      }

      content = content.replace(floorRegex, `$1\n${code}      $3`);
    });

    fs.writeFileSync(ROUTESCRIPT_PATH, content, 'utf8');

    res.json({
      success: true,
      path: ROUTESCRIPT_PATH
    });
  } catch (error) {
    console.error('Save failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
  console.log(`Editing: ${ROUTESCRIPT_PATH}`);
});