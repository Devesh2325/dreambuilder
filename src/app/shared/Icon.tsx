import React from 'react';
import {
  AppWindow, BarChart3, Blocks, Box, Boxes, CheckSquare, ChevronsUpDown, CircleDot, ClipboardList, Columns3, Compass, CreditCard, DollarSign, GalleryHorizontal,
  FileText, Footprints, Gauge, Globe, Heading, HelpCircle, Image, LayoutGrid, LayoutTemplate, ListOrdered, LoaderCircle, LucideIcon, Megaphone,
  Menu, MessageSquareQuote, Minus, Monitor, MousePointerClick, MoveVertical, PlaySquare, RectangleHorizontal, ShieldCheck, Square, Star, TextCursorInput, Type, Video,
} from 'lucide-react';

// An explicit list, because importing every icon by name would add megabytes to the app.
const ICONS: Record<string, LucideIcon> = {
  Video,
  AppWindow, BarChart3, Blocks, Box, Boxes, CheckSquare, ChevronsUpDown, CircleDot, ClipboardList, Columns3, Compass, CreditCard, DollarSign, GalleryHorizontal,
  FileText, Footprints, Gauge, Globe, Heading, HelpCircle, Image, LayoutGrid, LayoutTemplate, ListOrdered, LoaderCircle, Megaphone,
  Menu, MessageSquareQuote, Minus, Monitor, MousePointerClick, MoveVertical, PlaySquare, RectangleHorizontal, ShieldCheck, Square, Star, TextCursorInput, Type,
};

export const Icon: React.FC<{ name: string; className?: string }> = ({ name, className = 'w-4 h-4' }) => {
  const Component = ICONS[name] ?? Square;
  return <Component className={className} aria-hidden="true" />;
};
