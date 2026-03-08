import { BarChart3, Bot, ShoppingCart, Hash, FileText } from "lucide-react";
import { useState, useRef } from "react";
import { Link, useLocation } from "react-router-dom";

import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";

interface ClientSidebarProps {
  onNavigate?: () => void;
}
export const NavBar = ({ onNavigate }: ClientSidebarProps) => {
  const location = useLocation();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const iconRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const getTooltipStyle = (key: string) => {
    const ref = iconRefs.current[key];
    if (!ref || hoveredItem !== key) return { display: "none" };
    const rect = ref.getBoundingClientRect();
    return {
      position: "fixed" as const,
      left: `${rect.right + 8}px`,
      top: `${rect.top + rect.height / 2}px`,
      transform: "translateY(-50%)"
    };
  };

  return (
    <div className="w-16 lg:w-16 border-r border-border/50 h-full flex flex-col bg-card relative">
      <ScrollArea className="flex-1 h-full">
        <div className="p-2 lg:p-3 space-y-2">
          <div
            ref={(el) => {
              iconRefs.current["Dashboard"] = el;
            }}
            className="relative"
            onMouseEnter={() => setHoveredItem("Dashboard")}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <Link to="/dashboard" onClick={onNavigate} className="block">
              <Button
                variant="ghost"
                size="icon"
                className={`w-10 h-10 rounded-lg transition-all duration-300 hover:scale-110 ${
                  location.pathname === "/dashboard"
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <BarChart3 className="w-5 h-5" />
              </Button>
            </Link>
          </div>

          <div
            ref={(el) => {
              iconRefs.current["ask-cazza"] = el;
            }}
            className="relative"
            onMouseEnter={() => setHoveredItem("ask-cazza")}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <Link to="/ask-cazza" onClick={onNavigate} className="block">
              <Button
                variant="ghost"
                size="icon"
                className={`w-10 h-10 rounded-lg transition-all duration-300 hover:scale-110 ${
                  location.pathname === "/ask-cazza"
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <Bot className="w-5 h-5" />
              </Button>
            </Link>
          </div>

          <div
            ref={(el) => {
              iconRefs.current["channels"] = el;
            }}
            className="relative"
            onMouseEnter={() => setHoveredItem("channels")}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <Link to="/channels" onClick={onNavigate} className="block">
              <Button
                variant="ghost"
                size="icon"
                className={`w-10 h-10 rounded-lg transition-all duration-300 hover:scale-110 ${
                  location.pathname === "/channels"
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <Hash className="w-5 h-5" />
              </Button>
            </Link>
          </div>

          <div
            ref={(el) => {
              iconRefs.current["integrations"] = el;
            }}
            className="relative"
            onMouseEnter={() => setHoveredItem("integrations")}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <Link to="/platforms" onClick={onNavigate} className="block">
              <Button
                variant="ghost"
                size="icon"
                className={`w-10 h-10 rounded-lg transition-all duration-300 hover:scale-110 ${
                  location.pathname === "/platforms"
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <ShoppingCart className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </ScrollArea>

      {hoveredItem === "Dashboard" && (
        <div
          className="fixed bg-popover text-popover-foreground text-xs px-2.5 py-1.5 rounded shadow-md pointer-events-none whitespace-nowrap z-[9999] border border-border/50 backdrop-blur-sm"
          style={getTooltipStyle("Dashboard")}
        >
          Dashboard
        </div>
      )}

      {hoveredItem === "ask-cazza" && (
        <div
          className="fixed bg-popover text-popover-foreground text-xs px-2.5 py-1.5 rounded shadow-md pointer-events-none whitespace-nowrap z-[9999] border border-border/50 backdrop-blur-sm"
          style={getTooltipStyle("ask-cazza")}
        >
          Ask Cazza
        </div>
      )}

      {hoveredItem === "channels" && (
        <div
          className="fixed bg-popover text-popover-foreground text-xs px-2.5 py-1.5 rounded shadow-md pointer-events-none whitespace-nowrap z-[9999] border border-border/50 backdrop-blur-sm"
          style={getTooltipStyle("channels")}
        >
          Channels
        </div>
      )}

      {hoveredItem === "integrations" && (
        <div
          className="fixed bg-popover text-popover-foreground text-xs px-2.5 py-1.5 rounded shadow-md pointer-events-none whitespace-nowrap z-[9999] border border-border/50 backdrop-blur-sm"
          style={getTooltipStyle("integrations")}
        >
          Integrations
        </div>
      )}

      {hoveredItem === "blog" && (
        <div
          className="fixed bg-popover text-popover-foreground text-xs px-2.5 py-1.5 rounded shadow-md pointer-events-none whitespace-nowrap z-[9999] border border-border/50 backdrop-blur-sm"
          style={getTooltipStyle("blog")}
        >
          Blog
        </div>
      )}
      {/* 
      <CreateChannelDialog
        open={showCreateChannel}
        onOpenChange={setShowCreateChannel}
        onCreated={fetchChannels}
      /> */}
    </div>
  );
};
