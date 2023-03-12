import Adjustments from "~icons/tabler/adjustments";
import AlertOctagon from "~icons/tabler/alert-octagon";
import AlertOctagonFilled from "~icons/tabler/alert-octagon-filled";
import AlertTriangle from "~icons/tabler/alert-triangle";
import AlertTriangleFilled from "~icons/tabler/alert-triangle-filled";
import ArrowDown from "~icons/tabler/arrow-down";
import ArrowUp from "~icons/tabler/arrow-up";
import At from "~icons/tabler/at";
import Check from "~icons/tabler/check";
import ChevronDown from "~icons/tabler/chevron-down";
import ChevronUp from "~icons/tabler/chevron-up";
import CircleKeyFilled from "~icons/tabler/circle-key-filled";
import CornerUpLeft from "~icons/tabler/corner-up-left";
import Home from "~icons/tabler/home";
import KeyOff from "~icons/tabler/key-off";
import Logout from "~icons/tabler/logout";
import Minus from "~icons/tabler/minus";
import Notes from "~icons/tabler/notes";
import QuestionCircle from "~icons/tabler/question-circle";
import QuestionMark from "~icons/tabler/question-mark";
import Reload from "~icons/tabler/reload";
import Repeat from "~icons/tabler/repeat";
import Search from "~icons/tabler/search";
import Settings from "~icons/tabler/settings";
import ShieldLock from "~icons/tabler/shield-lock";
import Star from "~icons/tabler/star";
import Trash from "~icons/tabler/trash";
import User from "~icons/tabler/user";
import Users from "~icons/tabler/users";
import X from "~icons/tabler/x";

export const Icons = {
  Adjustments,
  AlertOctagon,
  AlertOctagonFilled,
  AlertTriangle,
  AlertTriangleFilled,
  ArrowDown,
  ArrowUp,
  At,
  Check,
  ChevronDown,
  ChevronUp,
  CircleKeyFilled,
  Close: X,
  Dash: Minus,
  Home,
  KeyOff,
  Logout,
  Minus,
  Notes,
  QuestionCircle,
  QuestionMark,
  Reblog: Repeat,
  Reload,
  Repeat,
  Reply: CornerUpLeft,
  Search,
  Settings,
  ShieldLock,
  Star,
  Trash,
  User,
  Users,
  X,
} as const;

export type Icon = (typeof Icons)[keyof typeof Icons];
