"use client";

import { useRef } from "react";

export const PageContainer = ({ children }: { children: React.ReactNode }) => {
    return <div className="space-y-6 p-5">{children}</div>;
};

export const PageSectionTitle = ({
    children,
}: {
    children: React.ReactNode;
}) => {
    return <h3 className="text-xs font-bold uppercase">{children}</h3>;
};

export const PageSectionContent = ({
    children,
}: {
    children: React.ReactNode;
}) => {
    return <div className="space-y-3">{children}</div>;
};

export const PageSectionScroller = ({
    children,
}: {
    children: React.ReactNode;
}) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const dragStateRef = useRef({
        isDragging: false,
        startX: 0,
        scrollLeft: 0,
    });

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!scrollRef.current) return;
        dragStateRef.current = {
            isDragging: true,
            startX: e.pageX,
            scrollLeft: scrollRef.current.scrollLeft,
        };
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!dragStateRef.current.isDragging || !scrollRef.current) return;
        const walk = (e.pageX - dragStateRef.current.startX) * 2;
        scrollRef.current.scrollLeft = dragStateRef.current.scrollLeft - walk;
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        if (!scrollRef.current) return;
        dragStateRef.current = {
            isDragging: true,
            startX: e.touches[0].pageX,
            scrollLeft: scrollRef.current.scrollLeft,
        };
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!dragStateRef.current.isDragging || !scrollRef.current) return;
        const walk = (e.touches[0].pageX - dragStateRef.current.startX) * 2;
        scrollRef.current.scrollLeft = dragStateRef.current.scrollLeft - walk;
    };

    const handleDragEnd = () => {
        dragStateRef.current.isDragging = false;
    };

    // Removed global listeners to avoid interference with other elements
    // useEffect(() => {
    //     const handleGlobalMouseUp = () => {
    //         if (dragStateRef.current.isDragging) {
    //             handleDragEnd();
    //         }
    //     };

    //     const handleGlobalTouchEnd = () => {
    //         if (dragStateRef.current.isDragging) {
    //             handleDragEnd();
    //         }
    //     };

    //     document.addEventListener("mouseup", handleGlobalMouseUp);
    //     document.addEventListener("touchend", handleGlobalTouchEnd);

    //     return () => {
    //         document.removeEventListener("mouseup", handleGlobalMouseUp);
    //         document.removeEventListener("touchend", handleGlobalTouchEnd);
    //     };
    // }, []);

    return (
        <div 
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto [&::-webkit-scrollbar]:hidden cursor-grab active:cursor-grabbing select-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleDragEnd}
        >
            {children}
        </div>
    );
};