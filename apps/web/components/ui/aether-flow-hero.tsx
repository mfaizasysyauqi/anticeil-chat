"use client";

import React from 'react';
import { motion, Variants } from 'framer-motion';
import { ArrowRight, Zap } from 'lucide-react';

// A utility function for class names
const cn = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(' ');

// The main hero component
export const AetherFlowHero = () => {
    const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

    React.useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let particles: Particle[] = [];
        const mouse: { x: number | null; y: number | null; radius: number } = { x: null, y: null, radius: 200 };

        // Particle class definition
        class Particle {
            x: number;
            y: number;
            directionX: number;
            directionY: number;
            size: number;
            color: string;

            constructor(x: number, y: number, directionX: number, directionY: number, size: number, color: string) {
                this.x = x;
                this.y = y;
                this.directionX = directionX;
                this.directionY = directionY;
                this.size = size;
                this.color = color;
            }

            draw() {
                if (!ctx) return;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
                ctx.fillStyle = this.color;
                ctx.fill();
            }

            update() {
                if (!canvas) return;
                if (this.x > canvas.width || this.x < 0) {
                    this.directionX = -this.directionX;
                }
                if (this.y > canvas.height || this.y < 0) {
                    this.directionY = -this.directionY;
                }

                // Mouse collision detection
                if (mouse.x !== null && mouse.y !== null) {
                    const dx = mouse.x - this.x;
                    const dy = mouse.y - this.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance < mouse.radius + this.size) {
                        const forceDirectionX = dx / distance;
                        const forceDirectionY = dy / distance;
                        const force = (mouse.radius - distance) / mouse.radius;
                        this.x -= forceDirectionX * force * 5;
                        this.y -= forceDirectionY * force * 5;
                    }
                }

                this.x += this.directionX;
                this.y += this.directionY;
                this.draw();
            }
        }

        function init() {
            if (!canvas) return;
            particles = [];
            const numberOfParticles = (canvas.height * canvas.width) / 9000;
            for (let i = 0; i < numberOfParticles; i++) {
                const size = (Math.random() * 2) + 1;
                const x = (Math.random() * ((window.innerWidth - size * 2) - (size * 2)) + size * 2);
                const y = (Math.random() * ((window.innerHeight - size * 2) - (size * 2)) + size * 2);
                const directionX = (Math.random() * 0.4) - 0.2;
                const directionY = (Math.random() * 0.4) - 0.2;
                const color = 'rgba(191, 128, 255, 0.8)'; // Brighter purple
                particles.push(new Particle(x, y, directionX, directionY, size, color));
            }
        }

        const resizeCanvas = () => {
            if (!canvas) return;
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            init(); 
        };
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        const connect = () => {
            if (!canvas || !ctx) return;
            const maxDistance = 120;
            const maxDistanceSq = maxDistance * maxDistance;
            
            for (let a = 0; a < particles.length; a++) {
                for (let b = a + 1; b < particles.length; b++) {
                    const dx = particles[a].x - particles[b].x;
                    const dy = particles[a].y - particles[b].y;
                    const distSq = dx * dx + dy * dy;
                    
                    if (distSq < maxDistanceSq) {
                        const dist = Math.sqrt(distSq);
                        const opacityValue = (1 - dist / maxDistance) * 0.4;
                        
                        let isNearMouse = false;
                        if (mouse.x !== null && mouse.y !== null) {
                            const mdx = mouse.x - particles[a].x;
                            const mdy = mouse.y - particles[a].y;
                            if (mdx * mdx + mdy * mdy < mouse.radius * mouse.radius) {
                                isNearMouse = true;
                            }
                        }

                        ctx.strokeStyle = isNearMouse
                            ? `rgba(255, 255, 255, ${Math.min(0.85, opacityValue * 2)})`
                            : `rgba(200, 150, 255, ${opacityValue})`;
                        ctx.lineWidth = isNearMouse ? 1.2 : 0.75;
                        ctx.beginPath();
                        ctx.moveTo(particles[a].x, particles[a].y);
                        ctx.lineTo(particles[b].x, particles[b].y);
                        ctx.stroke();
                    }
                }
            }
        };

        const animate = () => {
            if (!ctx) return;
            // Set the background color inside the canvas draw loop
            ctx.fillStyle = '#07080A';
            ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

            for (let i = 0; i < particles.length; i++) {
                particles[i].update();
            }
            connect();
            animationFrameId = requestAnimationFrame(animate);
        };
        
        const handleMouseMove = (event: MouseEvent) => {
            mouse.x = event.clientX;
            mouse.y = event.clientY;
        };
        
        const handleMouseOut = () => {
            mouse.x = null;
            mouse.y = null;
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseout', handleMouseOut);

        init();
        animate();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseout', handleMouseOut);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    const fadeUpVariants: Variants = {
        hidden: { opacity: 0, y: 20 },
        visible: (i: number) => ({
            opacity: 1,
            y: 0,
            transition: {
                delay: i * 0.2 + 0.5,
                duration: 0.8,
                ease: "easeInOut",
            },
        }),
    };

    return (
        <div className="relative h-screen w-full flex flex-col items-center justify-center overflow-hidden" style={{ minHeight: '100vh', background: '#07080A' }}>
            {/* The canvas is now the primary background */}
            <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />
            
            {/* Overlay HTML Content */}
            <div className="relative z-10 text-center p-6" style={{ position: 'relative', zIndex: 10, textAlign: 'center', padding: '24px' }}>
                <motion.div
                    custom={0}
                    variants={fadeUpVariants}
                    initial="hidden"
                    animate="visible"
                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 mb-6 backdrop-blur-sm"
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '6px 16px',
                        borderRadius: '9999px',
                        background: 'rgba(168, 85, 247, 0.1)',
                        border: '1px solid rgba(168, 85, 247, 0.25)',
                        marginBottom: '24px',
                        backdropFilter: 'blur(8px)',
                    }}
                >
                    <Zap className="h-4 w-4 text-purple-400" size={16} color="#C084FC" />
                    <span className="text-sm font-medium text-gray-200" style={{ fontSize: '13px', fontWeight: 600, color: '#E5E7EB' }}>
                        Dynamic Rendering Engine
                    </span>
                </motion.div>

                <motion.h1
                    custom={1}
                    variants={fadeUpVariants}
                    initial="hidden"
                    animate="visible"
                    className="text-5xl md:text-8xl font-bold tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400"
                    style={{
                        fontSize: 'clamp(42px, 7vw, 84px)',
                        fontWeight: 800,
                        letterSpacing: '-0.04em',
                        marginBottom: '24px',
                        background: 'linear-gradient(180deg, #FFFFFF 0%, #9CA3AF 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                    }}
                >
                    Aether Flow
                </motion.h1>

                <motion.p
                    custom={2}
                    variants={fadeUpVariants}
                    initial="hidden"
                    animate="visible"
                    className="max-w-2xl mx-auto text-lg text-gray-400 mb-10"
                    style={{
                        maxWidth: '680px',
                        margin: '0 auto 40px auto',
                        fontSize: '17px',
                        lineHeight: 1.6,
                        color: '#9CA3AF',
                    }}
                >
                    An intelligent, adaptive framework for creating fluid digital experiences that feel alive and respond to user interaction in real-time.
                </motion.p>

                <motion.div
                    custom={3}
                    variants={fadeUpVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <button
                        className="px-8 py-4 bg-white text-black font-semibold rounded-lg shadow-lg hover:bg-gray-200 transition-colors duration-300 flex items-center gap-2 mx-auto"
                        style={{
                            padding: '14px 32px',
                            background: '#FFFFFF',
                            color: '#000000',
                            fontWeight: 700,
                            borderRadius: '8px',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '15px',
                            boxShadow: '0 10px 30px rgba(255, 255, 255, 0.2)',
                            transition: 'all 0.2s ease',
                        }}
                    >
                        <span>Explore the Engine</span>
                        <ArrowRight className="h-5 w-5" size={18} />
                    </button>
                </motion.div>
            </div>
        </div>
    );
};

export default AetherFlowHero;
