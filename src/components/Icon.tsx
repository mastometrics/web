import Adjustments from "~icons/tabler/adjustments";
import ArrowDown from "~icons/tabler/arrow-down";
import ArrowUp from "~icons/tabler/arrow-up";
import At from "~icons/tabler/at";
import Check from "~icons/tabler/check";
import CornerUpLeft from "~icons/tabler/corner-up-left";
import Logout from "~icons/tabler/logout";
import Minus from "~icons/tabler/minus";
import QuestionCircle from "~icons/tabler/question-circle";
import QuestionMark from "~icons/tabler/question-mark";
import Reload from "~icons/tabler/reload";
import Repeat from "~icons/tabler/repeat";
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
  Logout,
  QuestionCircle,
  QuestionMark,
  Reblog: Repeat,
  Reload,
  Repeat,
  Reply: CornerUpLeft,
  ShieldLock,
  Star,
  Trash,
  X,
} as const;

export type Icon = (typeof Icons)[keyof typeof Icons];
