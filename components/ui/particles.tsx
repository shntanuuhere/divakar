"use client";

import React, { useEffect, useRef } from "react";
import { useTheme } from "next-themes";

interface ParticlesProps {
    className?: string;
    quantity?: number;
    staticity?: number;
    ease?: number;
    refresh?: boolean;
}

export default function Particles({
    className = "",
    quantity = 200,
    staticity = 50,
    ease = 50,
    refresh = false,
}: ParticlesProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const canvasContainerRef = useRef<HTMLDivElement>(null);
    const context = useRef<CanvasRenderingContext2D | null>(null);
    const circles = useRef<any[]>([]);
    const mouse = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const canvasSize = useRef<{ w: number; h: number }>({ w: 0, h: 0 });
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio : 1;
    const { theme } = useTheme();
    const rafID = useRef<number | null>(null);
    const isMobile = useRef(false);

    useEffect(() => {
        if (typeof window !== "undefined") {
            isMobile.current = window.matchMedia("(max-width: 768px)").matches;
        }

        if (canvasRef.current) {
            context.current = canvasRef.current.getContext("2d");
        }
        initCanvas();
        animate();
        window.addEventListener("resize", initCanvas);

        return () => {
            if (rafID.current) {
                window.cancelAnimationFrame(rafID.current);
            }
            window.removeEventListener("resize", initCanvas);
        };
    }, [theme]);

    useEffect(() => {
        setupInteractions();
    }, []);

    useEffect(() => {
        initCanvas();
    }, [refresh]);

    const initCanvas = () => {
        resizeCanvas();
        drawParticles();
    };

    const setupInteractions = () => {
        if (!canvasRef.current) return;

        const updateMouse = (x: number, y: number) => {
            const rect = canvasRef.current!.getBoundingClientRect();
            mouse.current.x = x - rect.left;
            mouse.current.y = y - rect.top;
        }

        // Mouse movement
        window.addEventListener("mousemove", (e) => {
            updateMouse(e.clientX, e.clientY);
        });

        // Touch movement
        window.addEventListener("touchmove", (e) => {
            if (e.touches.length > 0) {
                updateMouse(e.touches[0].clientX, e.touches[0].clientY);
            }
        }, { passive: true });

        // Mobile gyroscope/accelerometer
        if (typeof DeviceOrientationEvent !== 'undefined') {
            const handleOrientation = (e: DeviceOrientationEvent) => {
                if (e.gamma !== null && e.beta !== null) {
                    // gamma: left-right tilt (-90 to 90)
                    // beta: front-back tilt (-180 to 180)
                    const tiltX = (e.gamma / 45) * (canvasSize.current.w / 2) + canvasSize.current.w / 2;
                    const tiltY = ((e.beta - 45) / 45) * (canvasSize.current.h / 2) + canvasSize.current.h / 2;

                    // Only update if no recent touch interaction (simple check could be added, but overwriting is fine for now)
                    mouse.current.x += (tiltX - mouse.current.x) * 0.1;
                    mouse.current.y += (tiltY - mouse.current.y) * 0.1;
                }
            };
            // iOS Permission logic remains if needed, but often requires user gesture interaction button to trigger
            // For now, simpler listener:
            window.addEventListener('deviceorientation', handleOrientation);
        }
    };

    const resizeCanvas = () => {
        if (canvasContainerRef.current && canvasRef.current && context.current) {
            circles.current.length = 0;
            canvasSize.current.w = canvasContainerRef.current.offsetWidth;
            canvasSize.current.h = canvasContainerRef.current.offsetHeight;
            canvasRef.current.width = canvasSize.current.w * dpr;
            canvasRef.current.height = canvasSize.current.h * dpr;
            canvasRef.current.style.width = `${canvasSize.current.w}px`;
            canvasRef.current.style.height = `${canvasSize.current.h}px`;
            context.current.scale(dpr, dpr);
        }
    };

    const circleParams = () => {
        const x = Math.floor(Math.random() * canvasSize.current.w);
        const y = Math.floor(Math.random() * canvasSize.current.h);
        const size = Math.floor(Math.random() * 2) + 0.1;
        const alpha = 0;
        const targetAlpha = parseFloat((Math.random() * 0.6 + 0.1).toFixed(1));
        const dx = Math.random() * 0.5 + 0.2;
        const dy = (Math.random() - 0.5) * 0.1;
        const magnetism = 0.1 + Math.random() * 4;
        return {
            x,
            y,
            translateX: 0,
            translateY: 0,
            size,
            alpha,
            targetAlpha,
            dx,
            dy,
            magnetism,
        };
    };

    const drawCircle = (circle: any, update = false) => {
        if (context.current) {
            const { x, y, translateX, translateY, size, alpha } = circle;
            context.current.beginPath();
            context.current.arc(x + translateX, y + translateY, size, 0, 2 * Math.PI);
            context.current.fillStyle = theme === "dark"
                ? `rgba(255, 255, 255, ${alpha})`
                : `rgba(0, 0, 0, ${alpha})`;
            context.current.fill();

            if (!update) {
                circles.current.push(circle);
            }
        }
    };

    const clearContext = () => {
        if (context.current) {
            context.current.clearRect(0, 0, canvasSize.current.w, canvasSize.current.h);
        }
    };

    const drawParticles = () => {
        clearContext();
        const particleCount = isMobile.current ? Math.min(quantity, 400) : quantity; // Optimize count for mobile
        for (let i = 0; i < particleCount; i++) {
            const circle = circleParams();
            drawCircle(circle);
        }
    };

    const animate = () => {
        clearContext();
        const len = circles.current.length;
        const width = canvasSize.current.w;
        const height = canvasSize.current.h;

        for (let i = 0; i < len; i++) {
            const circle = circles.current[i];

            // Optimization: Static math instead of edge array reduction and remapping
            const x = circle.x + circle.translateX;
            const y = circle.y + circle.translateY;

            // Simple edge fade distance (20px) calculation without allocation
            const distLeft = x - circle.size;
            const distRight = width - x - circle.size;
            const distTop = y - circle.size;
            const distBottom = height - y - circle.size;

            // Find min distance manually
            let minEdge = distLeft;
            if (distRight < minEdge) minEdge = distRight;
            if (distTop < minEdge) minEdge = distTop;
            if (distBottom < minEdge) minEdge = distBottom;

            let alphaFactor = 1;

            if (minEdge < 0) {
                minEdge = 0; // clamp
                alphaFactor = 0;
            } else if (minEdge < 20) {
                // Map 0..20 to 0..1
                alphaFactor = minEdge / 20;
            }

            if (alphaFactor === 1) {
                // Fade in
                if (circle.alpha < circle.targetAlpha) {
                    circle.alpha += 0.02;
                    if (circle.alpha > circle.targetAlpha) circle.alpha = circle.targetAlpha;
                }
            } else {
                // Fade out at edge
                circle.alpha = circle.targetAlpha * alphaFactor;
            }

            circle.x += circle.dx;
            circle.y += circle.dy;

            // Interaction: Attract towards mouse
            const targetTranslateX = (mouse.current.x - circle.x) / (staticity / circle.magnetism);
            const targetTranslateY = (mouse.current.y - circle.y) / (staticity / circle.magnetism);

            circle.translateX += (targetTranslateX - circle.translateX) / ease;
            circle.translateY += (targetTranslateY - circle.translateY) / ease;

            // Boundary check - recycle
            if (
                circle.x < -circle.size ||
                circle.x > width + circle.size ||
                circle.y < -circle.size ||
                circle.y > height + circle.size
            ) {
                // Reset particle
                circle.x = -circle.size;
                circle.y = Math.random() * height;
                circle.translateX = 0;
                circle.translateY = 0;
                circle.alpha = 0;
            }

            drawCircle(circle, true);
        }
        rafID.current = window.requestAnimationFrame(animate);
    };

    return (
        <div className={className} ref={canvasContainerRef} aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: -10, pointerEvents: 'none' }}>
            <canvas ref={canvasRef} />
        </div>
    );
}
