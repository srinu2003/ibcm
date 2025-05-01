"use client"

import * as React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar"
import { ThemeToggle } from "@/components/theme-toggle"
import { NotificationPopover } from "@/components/notification-popover"
import WorkerSafety from "@/components/worker-safety.jsx"


export default function Page() {
    const [fontSize, setFontSize] = React.useState(16);

    const increaseFontSize = () => {
        setFontSize((prevSize) => prevSize + 1);
    };

    const decreaseFontSize = () => {
        setFontSize((prevSize) => (prevSize > 1 ? prevSize - 1 : 1));
    };

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <header
                    className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
                    <div className="flex justify-between p-4 w-full">
                        <div className="flex items-center gap-2 px-4">
                            <SidebarTrigger className="-ml-1" />
                            <Separator orientation="vertical" className="mr-2 h-4" />
                            <Breadcrumb>
                                <BreadcrumbList>
                                    <BreadcrumbItem className="hidden md:block">
                                        <BreadcrumbLink href="#">
                                            Construction Site Management
                                        </BreadcrumbLink>
                                    </BreadcrumbItem>
                                    <BreadcrumbSeparator className="hidden md:block" />
                                    <BreadcrumbItem>
                                        <BreadcrumbPage>Worker Safety</BreadcrumbPage>
                                    </BreadcrumbItem>
                                </BreadcrumbList>
                            </Breadcrumb>
                        </div>
                        <div className="flex items-center gap-2">
                            <NotificationPopover />
                            <ThemeToggle />
                        </div>
                    </div>
                </header>
                <div className="flex flex-1 flex-col gap-4 p-4 pt-0" style={{ fontSize: `${fontSize}px` }}>
                    <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                        <div className="aspect-video rounded-xl bg-muted/50 flex items-center justify-center">
                            Project Stats
                        </div>
                        <div className="aspect-video rounded-xl bg-muted/50 flex items-center justify-center">
                            PPE Safety Stats
                        </div>
                        <div className="aspect-video rounded-xl bg-muted/50 flex items-center justify-center">
                            Weather
                        </div>
                    </div>
                    <WorkerSafety />
                    <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min">
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
