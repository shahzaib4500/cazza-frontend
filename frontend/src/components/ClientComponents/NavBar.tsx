import { Link, useLocation } from "react-router-dom";
import { Button } from "../ui/button";
import {
  BarChart3,
  Bot,
  LayoutDashboard,
  ShoppingCart,
  Tag,
  UsersRound,
} from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";
import { Logo } from "@/assets/svgs/Logo";

interface ClientSidebarProps {
  onNavigate?: () => void;
}
export const NavBar = ({ onNavigate }: ClientSidebarProps) => {
  const location = useLocation();
  const role = "superAdmin";
  return (
    <div className="w-16 lg:w-16 border-r border-border/50 mt-4 flex flex-col bg-white">
      <ScrollArea className="flex-1">
        <div className="p-2 lg:p-3 space-y-2">
          {/* Ask Cazza - Primary Focus, for super adminDashbaord */}
          <div className="relative group">
            <Button
              variant="ghost"
              size="icon"
              className={`w-10 h-10 rounded-lg transition-all duration-300 hover:scale-110 ${
                location.pathname === "/client/ask-cazza" ||
                location.pathname === "/superadmin/dashboard"
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
              asChild
            >
              <Link
                to={`${
                  role === "superAdmin"
                    ? "/superadmin/dashboard"
                    : "/client/ask-cazza"
                } `}
                onClick={onNavigate}
              >
                {role === "superAdmin" ? (
                  <LayoutDashboard className="w-5 h-5" />
                ) : (
                  <Bot className="w-5 h-5" />
                )}
              </Link>
            </Button>

            {/* Hover Tooltip */}
            <div className="absolute left-12 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-sm px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0 pointer-events-none whitespace-nowrap z-50 flex items-center gap-2">
              <span>Ask</span>
              <Logo size="sm" className="text-white [&>span]:text-white" />
              <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 rotate-45"></div>
            </div>
          </div>

          {/* Channels */}
          {/* <div className="relative group">
            <Button
              variant="ghost"
              size="icon"
              className={`w-10 h-10 rounded-lg transition-all duration-300 hover:scale-110 ${
                location.pathname === "/client/channels"
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
              asChild
            >
              <Link to="/client/channels" onClick={onNavigate}>
                <HashIcon className="w-5 h-5" />
              </Link>
            </Button> */}

          {/* Hover Tooltip */}
          {/* <div className="absolute left-12 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-sm px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0 pointer-events-none whitespace-nowrap z-50">
              Channels
              <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 rotate-45"></div>
            </div>
          </div> */}

          {/* Insights */}
          <div className="relative group">
            <Button
              variant="ghost"
              size="icon"
              className={`w-10 h-10 rounded-lg transition-all duration-300 hover:scale-110 ${
                location.pathname === "/client/dashboard" ||
                location.pathname === "/superadmin/users"
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
              asChild
            >
              <Link
                to={`${
                  role === "superAdmin"
                    ? "/superadmin/users"
                    : "/client/dashboard"
                }`}
                onClick={onNavigate}
              >
                {role === "superAdmin" ? (
                  <UsersRound className="w-5 h-5" />
                ) : (
                  <BarChart3 className="w-5 h-5" />
                )}
              </Link>
            </Button>

            {/* Hover Tooltip */}
            <div className="absolute left-12 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-sm px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0 pointer-events-none whitespace-nowrap z-50">
              Insights
              <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 rotate-45"></div>
            </div>
          </div>

          {/* Integrations */}
          <div className="relative group">
            <Button
              variant="ghost"
              size="icon"
              className={`w-10 h-10 rounded-lg transition-all duration-300 hover:scale-110 ${
                location.pathname === "/client/platforms" ||
                location.pathname === "superadmin/customerSupport"
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
              asChild
            >
              <Link
                to={`${
                  role === "superAdmin"
                    ? "/superadmin/customer-support"
                    : "/client/platforms"
                }`}
                onClick={onNavigate}
              >
                {role === "superAdmin" ? (
                  <Tag className="w-5 h-5" />
                ) : (
                  <ShoppingCart className="w-5 h-5" />
                )}
              </Link>
            </Button>

            {/* Hover Tooltip */}
            <div className="absolute left-12 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-sm px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0 pointer-events-none whitespace-nowrap z-50">
              Integrations
              <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 rotate-45"></div>
            </div>
          </div>
        </div>
      </ScrollArea>
      {/* 
      <CreateChannelDialog
        open={showCreateChannel}
        onOpenChange={setShowCreateChannel}
        onCreated={fetchChannels}
      /> */}
    </div>
  );
};
