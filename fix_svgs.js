const fs = require('fs');
const path = './src/pages/Content/toolbar/components/SVG.jsx';
let content = fs.readFileSync(path, 'utf8');

// Replace the large import block with import * as Lucide
const regex = /import \{\s*GripVerticalIcon[\s\S]*?\} from "lucide-animated";/;
content = content.replace(regex, 'import * as Lucide from "lucide-animated";');

// Now replace all standard <IconName ... > with <Lucide.IconName ... >
// We only want to replace the ones we added which start with <GripVerticalIcon, <CircleIcon, etc.
const iconsToReplace = [
  'GripVerticalIcon', 'CircleIcon', 'PenIcon', 'PauseIcon', 'PlayIcon', 'MousePointer2Icon',
  'MessageCircleIcon', 'MicIcon', 'MoreHorizontalIcon', 'RotateCcwIcon', 'Trash2Icon',
  'PipetteIcon', 'CrosshairIcon', 'SparklesIcon', 'TypeIcon', 'ArrowUpRightIcon', 'EraserIcon',
  'SquareIcon', 'UndoIcon', 'RedoIcon', 'ImageIcon', 'HighlighterIcon', 'TrashIcon',
  'VideoIcon', 'GridIcon', 'XIcon', 'TriangleIcon', 'VideoOffIcon', 'BellIcon', 'ClockIcon',
  'SearchIcon', 'PictureInPictureIcon', 'WifiOffIcon', 'HelpCircleIcon', 'Volume2Icon', 'AlertCircleIcon'
];

for (const icon of iconsToReplace) {
  const tagRegex = new RegExp(`<${icon}\\b`, 'g');
  content = content.replace(tagRegex, `<Lucide.${icon}`);
}

fs.writeFileSync(path, content);
console.log('done fixed');
