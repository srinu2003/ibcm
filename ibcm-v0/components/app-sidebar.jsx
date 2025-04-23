"use client"

import * as React from "react"
import {
  BookOpen,
  Command,
  HardHat,
  LifeBuoy,
  Building,
  Map,
  Layers,
  Send,
  ImageIcon,
  Home,
  Construction,
  Camera,
  ClipboardCheck,
  Users,
  FileBarChart,
} from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher" // do not remove this import.
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  // SidebarRail,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"
import { ThemeToggle } from "@/components/theme-toggle"
import { Tooltip } from "recharts"

// IBCM Project Data
const data = {
  user: {
    name: "Engineer",
    email: "engineer@ibcm.org",
    avatar: "/avatars/engineer.jpg",
  },
  teams: [
    {
      name: "ULB Projects",
      logo: Building,
      plan: "Enterprise",
    },
    {
      name: "State Agency",
      logo: Map,
      plan: "Enterprise",
    },
    {
      name: "Central Agency",
      logo: Command,
      plan: "Enterprise",
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: Home,
      items: [
        {
          title: "Overview",
          url: "/dashboard",
        },
        {
          title: "Analytics",
          url: "/dashboard#analytics",
        },
        {
          title: "Project Timeline",
          url: "/dashboard#timeline",
        },
      ],
    },
    {
      title: "Progress Monitoring",
      url: "/progress",
      icon: Camera,
      isActive: true,
      items: [
        {
          title: "Upload Images",
          url: "/#image-comparison-header",
        },
        {
          title: "Stage Classification",
          url: "/progress#classification",
        },
        {
          title: "Compare Progress",
          url: "/progress#compare",
        },
        {
          title: "Timeline View",
          url: "/progress#timeline",
        },
      ],
    },
    {
      title: "Safety Monitoring",
      url: "/safety",
      icon: HardHat,
      items: [
        {
          title: "PPE Detection",
          url: "/safety#ppe-detection",
        },
        {
          title: "Upload Safety Images",
          url: "/safety#upload",
        },
        {
          title: "Safety Reports",
          url: "/safety#reports",
        },
        {
          title: "Compliance History",
          url: "/safety#compliance",
        },
      ],
    },
    {
      title: "Projects",
      url: "/projects",
      icon: Construction,
      items: [
        {
          title: "All Projects",
          url: "/projects#all",
        },
        {
          title: "Add New Project",
          url: "/projects#new",
        },
        {
          title: "Project Details",
          url: "/projects#details",
        },
        {
          title: "Locations",
          url: "/projects#locations",
        },
      ],
    },
    {
      title: "Reporting",
      url: "/reports",
      icon: FileBarChart,
      items: [
        {
          title: "Progress Reports",
          url: "/reports#progress",
        },
        {
          title: "Safety Reports",
          url: "/reports#safety",
        },
        {
          title: "Export Data",
          url: "/reports#export",
        },
      ],
    },
    {
      title: "Users",
      url: "/users",
      icon: Users,
      items: [
        {
          title: "User Management",
          url: "/users#manage",
        },
        {
          title: "Roles & Permissions",
          url: "/users#roles",
        },
        {
          title: "Audit Logs",
          url: "/users#audit",
        },
      ],
    },
    {
      title: "Documentation",
      url: "/docs",
      icon: BookOpen,
      items: [
        {
          title: "Getting Started",
          url: "/docs#getting-started",
        },
        {
          title: "ML Models",
          url: "/docs#ml-models",
        },
        {
          title: "API Reference",
          url: "/docs#api",
        },
      ],
    },
    // {
    //   title: "Settings",
    //   url: "/settings",
    //   icon: Settings2,
    //   items: [
    //     {
    //       title: "General",
    //       url: "/settings/general",
    //     },
    //     {
    //       title: "Notifications",
    //       url: "/settings/notifications",
    //     },
    //     {
    //       title: "API Keys",
    //       url: "/settings/api-keys",
    //     },
    //     {
    //       title: "ML Parameters",
    //       url: "/settings/ml-parameters",
    //     },
    //   ],
    // },
  ],
  navSecondary: [
    {
      title: "Support",
      url: "/support",
      icon: LifeBuoy,
    },
    {
      title: "Feedback",
      url: "/feedback",
      icon: Send,
    },
  ],
  projects: [
    {
      name: "Foundation Works",
      url: "/projects/foundation",
      icon: Layers,
    },
    {
      name: "Superstructure",
      url: "/projects/superstructure",
      icon: Building,
    },
    {
      name: "Facade & Interiors",
      url: "/projects/facade-interiors",
      icon: ImageIcon,
    },
    {
      name: "Safety Compliance",
      url: "/projects/safety",
      icon: ClipboardCheck,
    },
  ],
};

export function AppSidebar({
  ...props
}) {
  return (
    (<Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground" asChild>
              <a href="#">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Building className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">IBCM</span>
                  <span className="truncate text-xs">Image-Based Construction Monitoring</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      {/* <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader> */}
      <SidebarContent>
        <ScrollArea className="flex flex-col gap-4">
          <NavProjects projects={data.projects} />
          <NavMain items={data.navMain} />
        </ScrollArea>
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      {/* <SidebarRail /> */}
    </Sidebar>)
  );
}
