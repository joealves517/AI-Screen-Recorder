const fs = require('fs');
const file = 'src/pages/Sandbox/layout/player/RightPanel.js';
let content = fs.readFileSync(file, 'utf8');

const icons = ['Alert', 'Trim', 'ArrowRight', 'Audio', 'Gif'];
icons.forEach(icon => {
  const regex = new RegExp(`(<${icon}[\\s]+[^>]*\\/>)`, 'g');
  content = content.replace(regex, (match) => {
    return `<AnimatedIcon animation="none">\n      ${match}\n    </AnimatedIcon>`;
  });
});

fs.writeFileSync(file, content);
