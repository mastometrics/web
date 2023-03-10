import Adjustments from "~icons/tabler/adjustments";
import ArrowDown from "~icons/tabler/arrow-down";
import ArrowUp from "~icons/tabler/arrow-up";
import At from "~icons/tabler/at";
import Check from "~icons/tabler/check";
import CornerUpLeft from "~icons/tabler/corner-up-left";
import Home from "~icons/tabler/home";
import Logout from "~icons/tabler/logout";
import Minus from "~icons/tabler/minus";
import QuestionCircle from "~icons/tabler/question-circle";
import QuestionMark from "~icons/tabler/question-mark";
import Reload from "~icons/tabler/reload";
import Repeat from "~icons/tabler/repeat";
import Settings from "~icons/tabler/settings";
import ShieldLock from "~icons/tabler/shield-lock";
import Star from "~icons/tabler/star";
import Trash from "~icons/tabler/trash";
import X from "~icons/tabler/x";

export const Icons = {
  Adjustments,
  ArrowDown,
  ArrowUp,
  At,
  Check,
  Close: X,
  Dash: Minus,
  Home,
  Logout,
  QuestionCircle,
  QuestionMark,
  Reblog: Repeat,
  Reload,
  Repeat,
  Reply: CornerUpLeft,
  Settings,
  ShieldLock,
  Star,
  Trash,
  X,
} as const;

export type Icon = (typeof Icons)[keyof typeof Icons];
