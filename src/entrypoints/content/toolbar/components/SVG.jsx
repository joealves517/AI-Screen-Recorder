import React from "react";
import { ReactSVG } from "react-svg";
import * as Lucide from "lucide-animated";

import { AnimatedIcon } from "../../components/AnimatedIcon";

const URL =
  "chrome-extension://" + chrome.i18n.getMessage("@@extension_id") + "/assets/";

const AnimatedSvg = (props) => (
  <AnimatedIcon animation="hover" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
    <ReactSVG {...props} />
  </AnimatedIcon>
);

const GrabIcon = (props) => (
  <AnimatedIcon animation="none">
    <Lucide.GripVerticalIcon style={{ display: "flex", alignItems: "center", justifyContent: "center" }} size={props.width || 18} color="currentColor" {...props} />
  </AnimatedIcon>
);
/*

*/

// Convert all to ReactSVG

const StopIcon = (props) => (
  <AnimatedIcon animation="none">
    <Lucide.BanIcon fill="#EF4444" color="#EF4444" style={{ display: "flex", alignItems: "center", justifyContent: "center" }} size={props.width || 18} {...props} />
  </AnimatedIcon>
);

const DrawIcon = (props) => (
  <AnimatedIcon animation="none">
    <Lucide.PenToolIcon style={{ display: "flex", alignItems: "center", justifyContent: "center" }} size={props.width || 18} color="currentColor" {...props} />
  </AnimatedIcon>
);

const PauseIcon = (props) => (
  <AnimatedIcon animation="none">
    <Lucide.PauseIcon style={{ display: "flex", alignItems: "center", justifyContent: "center" }} size={props.width || 18} color="currentColor" {...props} />
  </AnimatedIcon>
);

const ResumeIcon = (props) => (
  <AnimatedIcon animation="none">
    <Lucide.PlayIcon style={{ display: "flex", alignItems: "center", justifyContent: "center" }} size={props.width || 18} color="currentColor" {...props} />
  </AnimatedIcon>
);

const CursorIcon = (props) => (
  <AnimatedIcon animation="none">
    <Lucide.CursorClickIcon style={{ display: "flex", alignItems: "center", justifyContent: "center" }} size={props.width || 18} color="currentColor" {...props} />
  </AnimatedIcon>
);

const CommentIcon = (props) => (
  <AnimatedIcon animation="none">
    <Lucide.MessageCircleIcon style={{ display: "flex", alignItems: "center", justifyContent: "center" }} size={props.width || 18} color="currentColor" {...props} />
  </AnimatedIcon>
);

const MicIcon = (props) => (
  <AnimatedIcon animation="none">
    <Lucide.MicIcon style={{ display: "flex", alignItems: "center", justifyContent: "center" }} size={props.width || 18} color="currentColor" {...props} />
  </AnimatedIcon>
);

const MoreIcon = (props) => (
  <AnimatedIcon animation="none">
    <Lucide.GripHorizontalIcon style={{ display: "flex", alignItems: "center", justifyContent: "center" }} size={props.width || 18} color="currentColor" {...props} />
  </AnimatedIcon>
);

const RestartIcon = (props) => (
  <AnimatedIcon animation="none">
    <Lucide.RotateCcwIcon style={{ display: "flex", alignItems: "center", justifyContent: "center" }} size={props.width || 18} color="currentColor" {...props} />
  </AnimatedIcon>
);

const DiscardIcon = (props) => (
  <AnimatedIcon animation="none">
    <Lucide.ArchiveIcon style={{ display: "flex", alignItems: "center", justifyContent: "center" }} size={props.width || 18} color="currentColor" {...props} />
  </AnimatedIcon>
);

const EyeDropperIcon = (props) => (
  <AnimatedIcon animation="none">
    <Lucide.DropletIcon style={{ display: "flex", alignItems: "center", justifyContent: "center" }} size={props.width || 18} color="currentColor" {...props} />
  </AnimatedIcon>
);

const Stroke1Icon = (props) => {
  return (
    <AnimatedSvg
      src={URL + "tool-icons/stroke-1-icon.svg"}
      width={props.width}
      height={props.height}
      className={props.className}
      style={{
        textAlign: "center",
        margin: "auto",
        display: "block",
        width: "100%",
        height: "100%",
      }}
    />
  );
};

const Stroke2Icon = (props) => {
  return (
    <AnimatedSvg
      src={URL + "tool-icons/stroke-2-icon.svg"}
      width={props.width}
      height={props.height}
      className={props.className}
      style={{
        textAlign: "center",
        margin: "auto",
        display: "block",
        width: "100%",
        height: "100%",
      }}
    />
  );
};

const Stroke3Icon = (props) => {
  return (
    <AnimatedSvg
      src={URL + "tool-icons/stroke-3-icon.svg"}
      width={props.width}
      height={props.height}
      className={props.className}
      style={{
        textAlign: "center",
        margin: "auto",
        display: "block",
        width: "100%",
        height: "100%",
      }}
    />
  );
};

const TargetCursorIcon = (props) => (
  <AnimatedIcon animation="none">
    <Lucide.ScanFaceIcon style={{ display: "flex", alignItems: "center", justifyContent: "center" }} size={props.width || 18} color="currentColor" {...props} />
  </AnimatedIcon>
);

const HighlightCursorIcon = (props) => (
  <AnimatedIcon animation="none">
    <Lucide.SparklesIcon style={{ display: "flex", alignItems: "center", justifyContent: "center" }} size={props.width || 18} color="currentColor" {...props} />
  </AnimatedIcon>
);

const HideCursorIcon = (props) => (
  <AnimatedIcon animation="none">
    <Lucide.CursorClickIcon style={{ display: "flex", alignItems: "center", justifyContent: "center" }} size={props.width || 18} color="currentColor" {...props} />
  </AnimatedIcon>
);

const TextIcon = (props) => (
  <AnimatedIcon animation="none">
    <Lucide.UnderlineIcon style={{ display: "flex", alignItems: "center", justifyContent: "center" }} size={props.width || 18} color="currentColor" {...props} />
  </AnimatedIcon>
);

const ArrowIcon = (props) => (
  <AnimatedIcon animation="none">
    <Lucide.ArrowUpRightIcon style={{ display: "flex", alignItems: "center", justifyContent: "center" }} size={props.width || 18} color="currentColor" {...props} />
  </AnimatedIcon>
);

const EraserIcon = (props) => (
  <AnimatedIcon animation="none">
    <Lucide.DeleteIcon style={{ display: "flex", alignItems: "center", justifyContent: "center" }} size={props.width || 18} color="currentColor" {...props} />
  </AnimatedIcon>
);

const PenIcon = (props) => (
  <AnimatedIcon animation="none">
    <Lucide.PenToolIcon style={{ display: "flex", alignItems: "center", justifyContent: "center" }} size={props.width || 18} color="currentColor" {...props} />
  </AnimatedIcon>
);

const ShapeIcon = (props) => (
  <AnimatedIcon animation="none">
    <Lucide.BoxesIcon style={{ display: "flex", alignItems: "center", justifyContent: "center" }} size={props.width || 18} color="currentColor" {...props} />
  </AnimatedIcon>
);

const SelectIcon = (props) => (
  <AnimatedIcon animation="none">
    <Lucide.CursorClickIcon style={{ display: "flex", alignItems: "center", justifyContent: "center" }} size={props.width || 18} color="currentColor" {...props} />
  </AnimatedIcon>
);

const UndoIcon = (props) => (
  <AnimatedIcon animation="none">
    <Lucide.UndoIcon style={{ display: "flex", alignItems: "center", justifyContent: "center" }} size={props.width || 18} color="currentColor" {...props} />
  </AnimatedIcon>
);

const RedoIcon = (props) => (
  <AnimatedIcon animation="none">
    <Lucide.RedoIcon style={{ display: "flex", alignItems: "center", justifyContent: "center" }} size={props.width || 18} color="currentColor" {...props} />
  </AnimatedIcon>
);

const ImageIcon = (props) => (
  <AnimatedIcon animation="none">
    <Lucide.GalleryThumbnailsIcon style={{ display: "flex", alignItems: "center", justifyContent: "center" }} size={props.width || 18} color="currentColor" {...props} />
  </AnimatedIcon>
);

const TransformIcon = (props) => (
  <AnimatedIcon animation="none">
    <Lucide.CursorClickIcon style={{ display: "flex", alignItems: "center", justifyContent: "center" }} size={props.width || 18} color="currentColor" {...props} />
  </AnimatedIcon>
);

const HighlighterIcon = (props) => (
  <AnimatedIcon animation="none">
    <Lucide.SparklesIcon style={{ display: "flex", alignItems: "center", justifyContent: "center" }} size={props.width || 18} color="currentColor" {...props} />
  </AnimatedIcon>
);

const RectangleIcon = (props) => (
  <AnimatedIcon animation="none">
    <Lucide.SquareActivityIcon style={{ display: "flex", alignItems: "center", justifyContent: "center" }} size={props.width || 18} color="currentColor" {...props} />
  </AnimatedIcon>
);

const CircleIcon = (props) => (
  <AnimatedIcon animation="none">
    <Lucide.CircleDashedIcon style={{ display: "flex", alignItems: "center", justifyContent: "center" }} size={props.width || 18} color="currentColor" {...props} />
  </AnimatedIcon>
);

const TriangleIcon = (props) => (
  <AnimatedIcon animation="none">
    <Lucide.ActivityIcon style={{ display: "flex", alignItems: "center", justifyContent: "center" }} size={props.width || 18} color="currentColor" {...props} />
  </AnimatedIcon>
);

const RectangleFilledIcon = (props) => (
  <AnimatedIcon animation="none">
    <Lucide.SquareActivityIcon fill="currentColor" style={{ display: "flex", alignItems: "center", justifyContent: "center" }} size={props.width || 18} color="currentColor" {...props} />
  </AnimatedIcon>
);

const CircleFilledIcon = (props) => (
  <AnimatedIcon animation="none">
    <Lucide.CircleDashedIcon fill="currentColor" style={{ display: "flex", alignItems: "center", justifyContent: "center" }} size={props.width || 18} color="currentColor" {...props} />
  </AnimatedIcon>
);

const TriangleFilledIcon = (props) => (
  <AnimatedIcon animation="none">
    <Lucide.ActivityIcon fill="currentColor" style={{ display: "flex", alignItems: "center", justifyContent: "center" }} size={props.width || 18} color="currentColor" {...props} />
  </AnimatedIcon>
);

const TrashIcon = (props) => (
  <AnimatedIcon animation="none">
    <Lucide.ArchiveIcon style={{ display: "flex", alignItems: "center", justifyContent: "center" }} size={props.width || 18} color="currentColor" {...props} />
  </AnimatedIcon>
);

const VideoOffIcon = (props) => (
  <AnimatedIcon animation="none">
    <Lucide.EyeOffIcon style={{ display: "flex", alignItems: "center", justifyContent: "center" }} size={props.width || 18} color="currentColor" {...props} />
  </AnimatedIcon>
);

const CameraCloseIcon = (props) => (
  <AnimatedIcon animation="none">
    <Lucide.XIcon style={{ display: "flex", alignItems: "center", justifyContent: "center" }} size={props.width || 18} color="currentColor" {...props} />
  </AnimatedIcon>
);

const CameraMoreIcon = (props) => (
  <AnimatedIcon animation="none">
    <Lucide.GripHorizontalIcon style={{ display: "flex", alignItems: "center", justifyContent: "center" }} size={props.width || 18} color="currentColor" {...props} />
  </AnimatedIcon>
);

const CameraResizeIcon = (props) => {
  return (
    <AnimatedSvg
      src={URL + "camera-icons/camera-resize.svg"}
      width={props.width}
      height={props.height}
    />
  );
};

const CameraIcon = (props) => (
  <AnimatedIcon animation="none">
    <Lucide.CctvIcon style={{ display: "flex", alignItems: "center", justifyContent: "center" }} size={props.width || 18} color="currentColor" {...props} />
  </AnimatedIcon>
);

const BlurIcon = (props) => (
  <AnimatedIcon animation="none">
    <Lucide.DropletIcon style={{ display: "flex", alignItems: "center", justifyContent: "center" }} size={props.width || 18} color="currentColor" {...props} />
  </AnimatedIcon>
);

const AlertIcon = (props) => (
  <AnimatedIcon animation="none">
    <Lucide.BellIcon style={{ display: "flex", alignItems: "center", justifyContent: "center" }} size={props.width || 18} color="currentColor" {...props} />
  </AnimatedIcon>
);

const TimeIcon = (props) => (
  <AnimatedIcon animation="none">
    <Lucide.ClockIcon style={{ display: "flex", alignItems: "center", justifyContent: "center" }} size={props.width || 18} color="currentColor" {...props} />
  </AnimatedIcon>
);
const SpotlightCursorIcon = (props) => (
  <AnimatedIcon animation="none">
    <Lucide.SearchIcon style={{ display: "flex", alignItems: "center", justifyContent: "center" }} size={props.width || 18} color="currentColor" {...props} />
  </AnimatedIcon>
);

const Pip = (props) => (
  <AnimatedIcon animation="none">
    <Lucide.MonitorCheckIcon style={{ display: "flex", alignItems: "center", justifyContent: "center" }} size={props.width || 18} color="currentColor" {...props} />
  </AnimatedIcon>
);

const CloseIconPopup = (props) => (
  <AnimatedIcon animation="none">
    <Lucide.XIcon style={{ display: "flex", alignItems: "center", justifyContent: "center" }} size={props.width || 18} color="currentColor" {...props} />
  </AnimatedIcon>
);

const GrabIconPopup = (props) => (
  <AnimatedIcon animation="none">
    <Lucide.GripVerticalIcon style={{ display: "flex", alignItems: "center", justifyContent: "center" }} size={props.width || 18} color="currentColor" {...props} />
  </AnimatedIcon>
);

const MoreIconPopup = (props) => (
  <AnimatedIcon animation="none">
    <Lucide.GripHorizontalIcon style={{ display: "flex", alignItems: "center", justifyContent: "center" }} size={props.width || 18} color="currentColor" {...props} />
  </AnimatedIcon>
);

const OnboardingArrow = (props) => {
  return (
    <AnimatedSvg
      src={URL + "/helper/onboarding-arrow.svg"}
      width={props.width}
      height={props.height}
    />
  );
};

const NoInternet = (props) => (
  <AnimatedIcon animation="none">
    <Lucide.ZapOffIcon style={{ display: "flex", alignItems: "center", justifyContent: "center" }} size={props.width || 18} color="currentColor" {...props} />
  </AnimatedIcon>
);

const CloseButtonToolbar = (props) => (
  <AnimatedIcon animation="none">
    <Lucide.XIcon style={{ display: "flex", alignItems: "center", justifyContent: "center" }} size={props.width || 18} color="currentColor" {...props} />
  </AnimatedIcon>
);

const HelpIconPopup = (props) => (
  <AnimatedIcon animation="none">
    <Lucide.CircleHelpIcon style={{ display: "flex", alignItems: "center", justifyContent: "center" }} size={props.width || 18} color="currentColor" {...props} />
  </AnimatedIcon>
);

const AudioIcon = (props) => (
  <AnimatedIcon animation="none">
    <Lucide.VolumeIcon style={{ display: "flex", alignItems: "center", justifyContent: "center" }} size={props.width || 18} color="currentColor" {...props} />
  </AnimatedIcon>
);

const NotSupportedIcon = (props) => (
  <AnimatedIcon animation="none">
    <Lucide.BanIcon style={{ display: "flex", alignItems: "center", justifyContent: "center" }} size={props.width || 18} color="currentColor" {...props} />
  </AnimatedIcon>
);

export {
  GrabIcon,
  StopIcon,
  DrawIcon,
  PauseIcon,
  ResumeIcon,
  CursorIcon,
  CommentIcon,
  MicIcon,
  MoreIcon,
  RestartIcon,
  DiscardIcon,
  EyeDropperIcon,
  Stroke1Icon,
  Stroke2Icon,
  Stroke3Icon,
  TargetCursorIcon,
  HighlightCursorIcon,
  HideCursorIcon,
  TextIcon,
  ArrowIcon,
  EraserIcon,
  PenIcon,
  ShapeIcon,
  SelectIcon,
  UndoIcon,
  RedoIcon,
  ImageIcon,
  TransformIcon,
  HighlighterIcon,
  RectangleIcon,
  CircleIcon,
  TriangleIcon,
  RectangleFilledIcon,
  CircleFilledIcon,
  TriangleFilledIcon,
  TrashIcon,
  VideoOffIcon,
  CameraCloseIcon,
  CameraMoreIcon,
  CameraResizeIcon,
  CameraIcon,
  BlurIcon,
  AlertIcon,
  TimeIcon,
  SpotlightCursorIcon,
  Pip,
  CloseIconPopup,
  GrabIconPopup,
  OnboardingArrow,
  NoInternet,
  CloseButtonToolbar,
  HelpIconPopup,
  MoreIconPopup,
  AudioIcon,
  NotSupportedIcon,
};
