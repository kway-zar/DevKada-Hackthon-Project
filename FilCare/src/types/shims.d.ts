// These module shims unblock TypeScript when the project doesn't ship
// or include type declarations for certain UI libraries.
// They can be removed once proper @types packages (or official types) are added.

declare module 'lucide-react' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type Icon = any

  // Icons used across the repo.
  export const Activity: Icon
  export const AlertCircle: Icon
  export const AlertTriangle: Icon
  export const ArrowLeft: Icon
  export const ArrowRight: Icon
  export const BarChart: Icon
  export const BarChart3: Icon
  export const Brain: Icon
  export const Building2: Icon
  export const Camera: Icon
  export const CheckCircle: Icon
  export const CheckIcon: Icon
  export const CheckCheck: Icon
  export const ChevronDownIcon: Icon
  export const ChevronDown: Icon
  export const ChevronLeft: Icon
  export const ChevronRight: Icon
  export const ChevronLeftIcon: Icon
  export const ChevronRightIcon: Icon
  export const ChevronUpIcon: Icon
  export const CircleIcon: Icon
  export const ClipboardList: Icon
  export const Download: Icon
  export const Droplet: Icon
  export const Droplets: Icon
  export const Edit3: Icon
  export const Eye: Icon
  export const Filter: Icon
  export const FileText: Icon
  export const GripVerticalIcon: Icon
  export const Heart: Icon
  export const IdCard: Icon
  export const Image: Icon
  export const Mail: Icon
  export const Loader2: Icon
  export const LogOut: Icon
  export const MessageCircle: Icon
  export const Mic: Icon
  export const MicOff: Icon
  export const MinusIcon: Icon
  export const MoreHorizontal: Icon
  export const MoreHorizontalIcon: Icon
  export const Navigation: Icon
  export const MapPin: Icon
  export const PanelLeftIcon: Icon
  export const Phone: Icon
  export const Pill: Icon
  export const Plus: Icon
  export const QrCode: Icon
  export const RefreshCw: Icon
  export const Search: Icon
  export const SearchIcon: Icon
  export const Send: Icon
  export const Shield: Icon
  export const Share2: Icon
  export const Star: Icon
  export const Stethoscope: Icon
  export const Tablet: Icon
  export const Timer: Icon
  export const TrendingUp: Icon
  export const Upload: Icon
  export const User: Icon
  export const UserCheck: Icon
  export const UserCircle: Icon
  export const Users: Icon
  export const CheckCircle2: Icon
  export const X: Icon
  export const XCircle: Icon
  export const XIcon: Icon
  export const Calendar: Icon
  export const CalendarDays: Icon
  export const Clock: Icon
}

declare module 'react-day-picker' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const DayPicker: any
}
