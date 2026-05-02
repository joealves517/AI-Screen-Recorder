const fs = require('fs');
const path = './src/pages/Content/toolbar/components/SVG.jsx';
let content = fs.readFileSync(path, 'utf8');

// Add imports
const imports = `
import {
  GripVerticalIcon, CircleIcon, PenIcon, PauseIcon, PlayIcon, MousePointer2Icon,
  MessageCircleIcon, MicIcon, MoreHorizontalIcon, RotateCcwIcon, Trash2Icon,
  PipetteIcon, CrosshairIcon, SparklesIcon, TypeIcon, ArrowUpRightIcon, EraserIcon,
  SquareIcon, UndoIcon, RedoIcon, ImageIcon, HighlighterIcon, TrashIcon,
  VideoIcon, GridIcon, XIcon, TriangleIcon, VideoOffIcon, BellIcon, ClockIcon, SearchIcon, PictureInPictureIcon, WifiOffIcon, HelpCircleIcon, Volume2Icon, AlertCircleIcon
} from "lucide-animated";
`;
content = content.replace('import { ReactSVG } from "react-svg";', 'import { ReactSVG } from "react-svg";' + imports);

// Helper for replacement
function replaceIcon(name, newJSX) {
  const regex = new RegExp(`const ${name} = \\(props\\) => \\{[\\s\\S]*?return \\([\\s\\S]*?<AnimatedSvg[\\s\\S]*?\\/>\\s*\\);\\s*\\};`, 'm');
  content = content.replace(regex, `const ${name} = (props) => ${newJSX};`);
}

function replaceIconDirect(name, newJSX) {
  const regex = new RegExp(`const ${name} = \\(props\\) => \\{[\\s\\S]*?return \\([\\s\\S]*?<AnimatedSvg[\\s\\S]*?\\/>\\s*\\);\\s*\\};`, 'm');
  content = content.replace(regex, `const ${name} = (props) => ${newJSX};`);
}

const style = `style={{ display: "flex", alignItems: "center", justifyContent: "center" }}`;

replaceIcon('GrabIcon', `<GripVerticalIcon ${style} size={props.width || 18} color="currentColor" {...props} />`);
replaceIcon('StopIcon', `<CircleIcon fill="#EF4444" color="#EF4444" ${style} size={props.width || 18} {...props} />`);
replaceIcon('DrawIcon', `<PenIcon ${style} size={props.width || 18} color="currentColor" {...props} />`);
replaceIcon('PauseIcon', `<PauseIcon ${style} size={props.width || 18} color="currentColor" {...props} />`);
replaceIcon('ResumeIcon', `<PlayIcon ${style} size={props.width || 18} color="currentColor" {...props} />`);
replaceIcon('CursorIcon', `<MousePointer2Icon ${style} size={props.width || 18} color="currentColor" {...props} />`);
replaceIcon('CommentIcon', `<MessageCircleIcon ${style} size={props.width || 18} color="currentColor" {...props} />`);
replaceIcon('MicIcon', `<MicIcon ${style} size={props.width || 18} color="currentColor" {...props} />`);
replaceIcon('MoreIcon', `<MoreHorizontalIcon ${style} size={props.width || 18} color="currentColor" {...props} />`);
replaceIcon('RestartIcon', `<RotateCcwIcon ${style} size={props.width || 18} color="currentColor" {...props} />`);
replaceIcon('DiscardIcon', `<Trash2Icon ${style} size={props.width || 18} color="currentColor" {...props} />`);
replaceIcon('EyeDropperIcon', `<PipetteIcon ${style} size={props.width || 18} color="currentColor" {...props} />`);
replaceIcon('TargetCursorIcon', `<CrosshairIcon ${style} size={props.width || 18} color="currentColor" {...props} />`);
replaceIcon('HighlightCursorIcon', `<SparklesIcon ${style} size={props.width || 18} color="currentColor" {...props} />`);
replaceIcon('HideCursorIcon', `<MousePointer2Icon ${style} size={props.width || 18} color="currentColor" {...props} />`);
replaceIcon('TextIcon', `<TypeIcon ${style} size={props.width || 18} color="currentColor" {...props} />`);
replaceIcon('ArrowIcon', `<ArrowUpRightIcon ${style} size={props.width || 18} color="currentColor" {...props} />`);
replaceIcon('EraserIcon', `<EraserIcon ${style} size={props.width || 18} color="currentColor" {...props} />`);
replaceIcon('PenIcon', `<PenIcon ${style} size={props.width || 18} color="currentColor" {...props} />`);
replaceIcon('ShapeIcon', `<SquareIcon ${style} size={props.width || 18} color="currentColor" {...props} />`);
replaceIcon('SelectIcon', `<MousePointer2Icon ${style} size={props.width || 18} color="currentColor" {...props} />`);
replaceIcon('UndoIcon', `<UndoIcon ${style} size={props.width || 18} color="currentColor" {...props} />`);
replaceIcon('RedoIcon', `<RedoIcon ${style} size={props.width || 18} color="currentColor" {...props} />`);
replaceIcon('ImageIcon', `<ImageIcon ${style} size={props.width || 18} color="currentColor" {...props} />`);
replaceIcon('TransformIcon', `<MousePointer2Icon ${style} size={props.width || 18} color="currentColor" {...props} />`);
replaceIcon('HighlighterIcon', `<HighlighterIcon ${style} size={props.width || 18} color="currentColor" {...props} />`);
replaceIcon('RectangleIcon', `<SquareIcon ${style} size={props.width || 18} color="currentColor" {...props} />`);
replaceIcon('CircleIcon', `<CircleIcon ${style} size={props.width || 18} color="currentColor" {...props} />`);
replaceIcon('TriangleIcon', `<TriangleIcon ${style} size={props.width || 18} color="currentColor" {...props} />`);
replaceIcon('RectangleFilledIcon', `<SquareIcon fill="currentColor" ${style} size={props.width || 18} color="currentColor" {...props} />`);
replaceIcon('CircleFilledIcon', `<CircleIcon fill="currentColor" ${style} size={props.width || 18} color="currentColor" {...props} />`);
replaceIcon('TriangleFilledIcon', `<TriangleIcon fill="currentColor" ${style} size={props.width || 18} color="currentColor" {...props} />`);
replaceIcon('TrashIcon', `<TrashIcon ${style} size={props.width || 18} color="currentColor" {...props} />`);
replaceIcon('VideoOffIcon', `<VideoOffIcon ${style} size={props.width || 18} color="currentColor" {...props} />`);
replaceIcon('CameraCloseIcon', `<XIcon ${style} size={props.width || 18} color="currentColor" {...props} />`);
replaceIcon('CameraMoreIcon', `<MoreHorizontalIcon ${style} size={props.width || 18} color="currentColor" {...props} />`);
replaceIcon('CameraIcon', `<VideoIcon ${style} size={props.width || 18} color="currentColor" {...props} />`);
replaceIcon('BlurIcon', `<GridIcon ${style} size={props.width || 18} color="currentColor" {...props} />`);
replaceIcon('AlertIcon', `<BellIcon ${style} size={props.width || 18} color="currentColor" {...props} />`);
replaceIcon('TimeIcon', `<ClockIcon ${style} size={props.width || 18} color="currentColor" {...props} />`);
replaceIcon('SpotlightCursorIcon', `<SearchIcon ${style} size={props.width || 18} color="currentColor" {...props} />`);
replaceIcon('Pip', `<PictureInPictureIcon ${style} size={props.width || 18} color="currentColor" {...props} />`);
replaceIcon('CloseIconPopup', `<XIcon ${style} size={props.width || 18} color="currentColor" {...props} />`);
replaceIcon('GrabIconPopup', `<GripVerticalIcon ${style} size={props.width || 18} color="currentColor" {...props} />`);
replaceIcon('MoreIconPopup', `<MoreHorizontalIcon ${style} size={props.width || 18} color="currentColor" {...props} />`);
replaceIcon('NoInternet', `<WifiOffIcon ${style} size={props.width || 18} color="currentColor" {...props} />`);
replaceIcon('CloseButtonToolbar', `<XIcon ${style} size={props.width || 18} color="currentColor" {...props} />`);
replaceIcon('HelpIconPopup', `<HelpCircleIcon ${style} size={props.width || 18} color="currentColor" {...props} />`);
replaceIcon('AudioIcon', `<Volume2Icon ${style} size={props.width || 18} color="currentColor" {...props} />`);
replaceIcon('NotSupportedIcon', `<AlertCircleIcon ${style} size={props.width || 18} color="currentColor" {...props} />`);

fs.writeFileSync(path, content);
console.log('done');
