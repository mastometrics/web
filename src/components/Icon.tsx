import Activity from "~icons/tabler/activity";
import Adjustments from "~icons/tabler/adjustments";
import Affiliate from "~icons/tabler/affiliate";
import AlertOctagon from "~icons/tabler/alert-octagon";
import AlertOctagonFilled from "~icons/tabler/alert-octagon-filled";
import AlertTriangle from "~icons/tabler/alert-triangle";
import AlertTriangleFilled from "~icons/tabler/alert-triangle-filled";
import ArrowDown from "~icons/tabler/arrow-down";
import ArrowUp from "~icons/tabler/arrow-up";
import At from "~icons/tabler/at";
import Check from "~icons/tabler/check";
import ChevronDown from "~icons/tabler/chevron-down";
import ChevronLeft from "~icons/tabler/chevron-left";
import ChevronRight from "~icons/tabler/chevron-right";
import ChevronUp from "~icons/tabler/chevron-up";
import CircleKeyFilled from "~icons/tabler/circle-key-filled";
import Click from "~icons/tabler/click";
import CornerUpLeft from "~icons/tabler/corner-up-left";
import DiscountCheckFilled from "~icons/tabler/discount-check-filled";
import Home from "~icons/tabler/home";
import KeyOff from "~icons/tabler/key-off";
import Logout from "~icons/tabler/logout";
import { default as Menu } from "~icons/tabler/menu-2";
import Minus from "~icons/tabler/minus";
import Moon from "~icons/tabler/moon";
import MoonStars from "~icons/tabler/moon-stars";
import Notes from "~icons/tabler/notes";
import QuestionCircle from "~icons/tabler/question-circle";
import QuestionMark from "~icons/tabler/question-mark";
import Reload from "~icons/tabler/reload";
import Repeat from "~icons/tabler/repeat";
import Search from "~icons/tabler/search";
import Settings from "~icons/tabler/settings";
import ShieldLock from "~icons/tabler/shield-lock";
import Star from "~icons/tabler/star";
import Sun from "~icons/tabler/sun";
import SunMoon from "~icons/tabler/sun-moon";
import TestPipe from "~icons/tabler/test-pipe";
import Trash from "~icons/tabler/trash";
import User from "~icons/tabler/user";
import Users from "~icons/tabler/users";
import X from "~icons/tabler/x";

export const Icons = {
  Activity,
  Adjustments,
  Affiliate,
  AlertOctagon,
  AlertOctagonFilled,
  AlertTriangle,
  AlertTriangleFilled,
  ArrowDown,
  ArrowUp,
  At,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CircleKeyFilled,
  Click,
  Close: X,
  Dash: Minus,
  Home,
  KeyOff,
  Logout,
  Menu,
  Minus,
  Moon,
  MoonStars,
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
  Sun,
  SunMoon,
  TestPipe,
  Trash,
  User,
  Users,
  Verified: DiscountCheckFilled,
  X,
} as const;

export type Icon = (typeof Icons)[keyof typeof Icons];
