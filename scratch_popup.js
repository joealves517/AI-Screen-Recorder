const fs = require('fs');
const glob = require('glob'); // Not sure if glob is installed, will use basic fs.readdirSync
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('.jsx')) results.push(file);
        }
    });
    return results;
}

const files = walk('src/pages/Content/popup');

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Check if it imports from lucide-animated
    if (!content.includes('lucide-animated')) return;

    // Make sure AnimatedIcon is imported
    if (!content.includes('AnimatedIcon')) {
        // Need to figure out the path to AnimatedIcon based on file depth
        const depth = file.split('/').length - 4; // src/pages/Content/popup/xxx
        const relativePrefix = '../'.repeat(depth) + 'components/AnimatedIcon';
        content = content.replace(/(import.*lucide-animated";)/, `$1\nimport { AnimatedIcon } from "${relativePrefix}";`);
    }

    // Wrap the icons
    // Match <IconName ... /> or <IconName>...</IconName>
    // Just find standard lucide icon usage. They are usually imported directly.
    // Let's grab the imported names from lucide-animated
    const importMatch = content.match(/import\s*\{([^}]+)\}\s*from\s*"lucide-animated"/);
    if (importMatch) {
        const iconNames = importMatch[1].split(',').map(s => s.split(' as ').pop().trim()).filter(s => s);
        iconNames.forEach(icon => {
            const regex = new RegExp(`(<${icon}[\\s>][^>]*\\/>)`, 'g');
            content = content.replace(regex, (match) => {
                // If it's already wrapped, don't double wrap
                return `<AnimatedIcon animation="none">${match}</AnimatedIcon>`;
            });
            // Also match non-self-closing tags if any
            const regex2 = new RegExp(`(<${icon}[\\s>][^>]*>.*?</${icon}>)`, 'gs');
            content = content.replace(regex2, (match) => {
                return `<AnimatedIcon animation="none">${match}</AnimatedIcon>`;
            });
        });
        
        // Remove duplicate AnimatedIcon wrapping if happened
        content = content.replace(/<AnimatedIcon[^>]*>\s*<AnimatedIcon[^>]*>(.*?)<\/AnimatedIcon>\s*<\/AnimatedIcon>/gs, '<AnimatedIcon animation="none">$1</AnimatedIcon>');
    }
    
    fs.writeFileSync(file, content);
});
