"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  Briefcase,
  Calendar,
  Kanban,
  BarChart3,
  Settings,
  Plus,
  Moon,
  Sun,
  Search,
  ExternalLink,
  Clock,
  Sparkles,
} from "lucide-react";
import { useTheme } from "next-themes";
import { ApplicationWithRelations } from "@/lib/types";
import { CompanyAvatar } from "@/components/common/company-avatar";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applications: ApplicationWithRelations[];
  onSelectApplication: (app: ApplicationWithRelations) => void;
  onOpenAddModal: () => void;
}

export function CommandPalette({
  open,
  onOpenChange,
  applications,
  onSelectApplication,
  onOpenAddModal,
}: CommandPaletteProps) {
  const router = useRouter();
  const { setTheme, theme } = useTheme();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName))) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  const runCommand = (command: () => void) => {
    onOpenChange(false);
    command();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 max-w-xl overflow-hidden border-border shadow-2xl rounded-2xl">
        <Command className="w-full bg-card text-card-foreground">
          <div className="flex items-center border-b border-border/80 px-4 py-3 gap-2.5">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <Command.Input
              placeholder="Search applications, actions, or jump to views... (Cmd+K)"
              className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              autoFocus
            />
          </div>

          <Command.List className="max-h-96 overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-xs text-muted-foreground">
              No matching results found.
            </Command.Empty>

            {/* Quick Actions */}
            <Command.Group heading="Quick Actions" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 py-1.5">
              <Command.Item
                onSelect={() => runCommand(onOpenAddModal)}
                className="flex items-center gap-2 px-2.5 py-2 text-xs rounded-xl cursor-pointer hover:bg-secondary text-foreground data-[selected=true]:bg-secondary transition-colors"
              >
                <div className="h-6 w-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Plus className="h-3.5 w-3.5" />
                </div>
                <span>Track New Application</span>
              </Command.Item>

              <Command.Item
                onSelect={() => runCommand(() => setTheme(theme === "dark" ? "light" : "dark"))}
                className="flex items-center gap-2 px-2.5 py-2 text-xs rounded-xl cursor-pointer hover:bg-secondary text-foreground data-[selected=true]:bg-secondary transition-colors"
              >
                <div className="h-6 w-6 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                </div>
                <span>Toggle Dark / Light Theme</span>
              </Command.Item>
            </Command.Group>

            {/* Navigation Views */}
            <Command.Group heading="Navigation" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 py-1.5 mt-2">
              <Command.Item
                onSelect={() => runCommand(() => router.push("/"))}
                className="flex items-center gap-2 px-2.5 py-2 text-xs rounded-xl cursor-pointer hover:bg-secondary text-foreground data-[selected=true]:bg-secondary transition-colors"
              >
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <span>Dashboard & Table View</span>
              </Command.Item>

              <Command.Item
                onSelect={() => runCommand(() => router.push("/board"))}
                className="flex items-center gap-2 px-2.5 py-2 text-xs rounded-xl cursor-pointer hover:bg-secondary text-foreground data-[selected=true]:bg-secondary transition-colors"
              >
                <Kanban className="h-4 w-4 text-muted-foreground" />
                <span>Kanban Board</span>
              </Command.Item>

              <Command.Item
                onSelect={() => runCommand(() => router.push("/calendar"))}
                className="flex items-center gap-2 px-2.5 py-2 text-xs rounded-xl cursor-pointer hover:bg-secondary text-foreground data-[selected=true]:bg-secondary transition-colors"
              >
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Interview Calendar</span>
              </Command.Item>

              <Command.Item
                onSelect={() => runCommand(() => router.push("/analytics"))}
                className="flex items-center gap-2 px-2.5 py-2 text-xs rounded-xl cursor-pointer hover:bg-secondary text-foreground data-[selected=true]:bg-secondary transition-colors"
              >
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <span>Analytics & Conversion Funnel</span>
              </Command.Item>

              <Command.Item
                onSelect={() => runCommand(() => router.push("/settings"))}
                className="flex items-center gap-2 px-2.5 py-2 text-xs rounded-xl cursor-pointer hover:bg-secondary text-foreground data-[selected=true]:bg-secondary transition-colors"
              >
                <Settings className="h-4 w-4 text-muted-foreground" />
                <span>Settings, CSV Export & Import</span>
              </Command.Item>
            </Command.Group>

            {/* Applications List */}
            {applications && applications.length > 0 && (
              <Command.Group heading="Job Applications" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 py-1.5 mt-2">
                {applications.map((app) => (
                  <Command.Item
                    key={app.id}
                    value={`${app.company} ${app.title} ${app.status} ${app.location || ""}`}
                    onSelect={() => runCommand(() => onSelectApplication(app))}
                    className="flex items-center justify-between px-2.5 py-2 text-xs rounded-xl cursor-pointer hover:bg-secondary text-foreground data-[selected=true]:bg-secondary transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <CompanyAvatar company={app.company} customLogoUrl={app.logoUrl} size="sm" />
                      <div>
                        <p className="font-semibold text-foreground">{app.title}</p>
                        <p className="text-[11px] text-muted-foreground">{app.company}</p>
                      </div>
                    </div>

                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border">
                      {app.status}
                    </span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
