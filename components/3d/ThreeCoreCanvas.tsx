"use client";

import * as React from "react";
import * as THREE from "three";
import { SceneFallback } from "./SceneFallback";

export function ThreeCoreCanvas() {
  const mountRef = React.useRef<HTMLDivElement>(null);
  const [webGLFailed, setWebGLFailed] = React.useState(false);

  React.useEffect(() => {
    // Check for prefers-reduced-motion
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setWebGLFailed(true);
      return;
    }

    const container = mountRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer | null = null;
    let animationFrameId: number;

    try {
      const width = container.clientWidth || 450;
      const height = container.clientHeight || 500;

      // 1. Scene & Camera
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
      camera.position.z = 7;

      // 2. Renderer
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.appendChild(renderer.domElement);

      // 3. Geometries: Core Icosahedron
      const coreGeo = new THREE.IcosahedronGeometry(1.6, 2);
      const coreMat = new THREE.MeshStandardMaterial({
        color: 0x8b5cf6,
        wireframe: true,
        roughness: 0.3,
        metalness: 0.8,
        emissive: 0x4338ca,
        emissiveIntensity: 0.4,
      });
      const coreMesh = new THREE.Mesh(coreGeo, coreMat);
      scene.add(coreMesh);

      // Inner Solid Glow Mesh
      const innerGeo = new THREE.IcosahedronGeometry(1.0, 1);
      const innerMat = new THREE.MeshBasicMaterial({
        color: 0x22d3ee,
        wireframe: true,
        transparent: true,
        opacity: 0.6,
      });
      const innerMesh = new THREE.Mesh(innerGeo, innerMat);
      scene.add(innerMesh);

      // 4. Orbital Gimbal Rings
      const ring1Geo = new THREE.TorusGeometry(2.5, 0.02, 16, 100);
      const ring1Mat = new THREE.MeshBasicMaterial({ color: 0x8b5cf6, transparent: true, opacity: 0.4 });
      const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
      ring1.rotation.x = Math.PI / 3;
      scene.add(ring1);

      const ring2Geo = new THREE.TorusGeometry(3.0, 0.02, 16, 100);
      const ring2Mat = new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.3 });
      const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
      ring2.rotation.y = Math.PI / 4;
      scene.add(ring2);

      // 5. Starfield Particles
      const particlesCount = 200;
      const positions = new Float32Array(particlesCount * 3);
      for (let i = 0; i < particlesCount * 3; i++) {
        positions[i] = (Math.random() - 0.5) * 12;
      }
      const particlesGeo = new THREE.BufferGeometry();
      particlesGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const particlesMat = new THREE.PointsMaterial({
        size: 0.04,
        color: 0xc4b5fd,
        transparent: true,
        opacity: 0.6,
      });
      const particleSystem = new THREE.Points(particlesGeo, particlesMat);
      scene.add(particleSystem);

      // 6. Lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
      scene.add(ambientLight);

      const pointLight1 = new THREE.PointLight(0x8b5cf6, 2, 50);
      pointLight1.position.set(5, 5, 5);
      scene.add(pointLight1);

      const pointLight2 = new THREE.PointLight(0x22d3ee, 2, 50);
      pointLight2.position.set(-5, -5, 5);
      scene.add(pointLight2);

      // 7. Mouse interaction parallax (using window coordinates with passive listener to avoid forced reflows)
      let mouseX = 0;
      let mouseY = 0;
      const onMouseMove = (e: MouseEvent) => {
        mouseX = (e.clientX / Math.max(window.innerWidth, 1)) * 2 - 1;
        mouseY = -(e.clientY / Math.max(window.innerHeight, 1)) * 2 - 1;
      };
      window.addEventListener("mousemove", onMouseMove, { passive: true });

      // Handle WebGL context lost gracefully
      const onContextLost = (e: Event) => {
        e.preventDefault();
        console.warn("WebGL context lost, switching to lightweight fallback");
        setWebGLFailed(true);
      };
      renderer.domElement.addEventListener("webglcontextlost", onContextLost);

      // 8. Animation Loop with frame limiter and slow-device detection
      let lastRenderTime = 0;
      let slowFramesCount = 0;

      const animate = (currentTime: number) => {
        animationFrameId = requestAnimationFrame(animate);

        // Frame rate limiter (~60fps) to prevent excessive CPU/GPU usage
        if (currentTime - lastRenderTime < 14) return;

        // Auto-degrade if device is struggling (e.g., virtual machine or weak GPU)
        if (lastRenderTime > 0 && currentTime - lastRenderTime > 120) {
          slowFramesCount++;
          if (slowFramesCount >= 4) {
            console.warn("Low FPS detected in 3D scene, switching to lightweight SVG scene");
            setWebGLFailed(true);
            return;
          }
        } else if (slowFramesCount > 0) {
          slowFramesCount--;
        }

        lastRenderTime = currentTime;

        coreMesh.rotation.x += 0.004;
        coreMesh.rotation.y += 0.006;

        innerMesh.rotation.x -= 0.003;
        innerMesh.rotation.y -= 0.005;

        ring1.rotation.z += 0.005;
        ring2.rotation.x += 0.004;
        particleSystem.rotation.y += 0.0008;

        // Smooth camera dampening to mouse
        camera.position.x += (mouseX * 0.8 - camera.position.x) * 0.05;
        camera.position.y += (mouseY * 0.8 - camera.position.y) * 0.05;
        camera.lookAt(scene.position);

        renderer?.render(scene, camera);
      };

      animationFrameId = requestAnimationFrame(animate);

      const handleResize = () => {
        if (!container || !renderer) return;
        const newW = container.clientWidth;
        const newH = container.clientHeight;
        camera.aspect = newW / newH;
        camera.updateProjectionMatrix();
        renderer.setSize(newW, newH);
      };
      window.addEventListener("resize", handleResize);

      return () => {
        cancelAnimationFrame(animationFrameId);
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("resize", handleResize);
        if (renderer?.domElement) {
          renderer.domElement.removeEventListener("webglcontextlost", onContextLost);
          if (container.contains(renderer.domElement)) {
            container.removeChild(renderer.domElement);
          }
        }
        renderer?.dispose();
      };
    } catch (err) {
      console.warn("WebGL initialization failed, using high-fidelity fallback:", err);
      setWebGLFailed(true);
    }
  }, []);

  if (webGLFailed) {
    return <SceneFallback />;
  }

  return (
    <div className="relative w-full h-[460px] md:h-[540px] flex items-center justify-center select-none overflow-hidden rounded-3xl bg-gradient-to-b from-card/30 to-background/50 border border-border/40 backdrop-blur-md">
      {/* Three.js Canvas Mount */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Floating Metric 1: Technical Accuracy */}
      <div className="absolute top-6 left-4 md:left-8 p-3 rounded-2xl glass-panel-elevated shadow-xl border border-violet-500/30 max-w-[190px] pointer-events-none animate-in fade-in slide-in-from-left-4 duration-700">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-violet-400 animate-ping" />
          <span className="text-xs font-semibold text-foreground">Technical Depth</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono text-violet-400">92%</span>
          <span className="text-[10px] text-muted-foreground uppercase font-mono">Benchmark</span>
        </div>
        <p className="text-[10px] text-muted-foreground/90 mt-1 leading-tight">
          Algorithmic accuracy & edge case coverage
        </p>
        <span className="text-[8px] text-muted-foreground/60 uppercase font-mono mt-1 block">
          *Illustrative Demo Data
        </span>
      </div>

      {/* Floating Metric 2: Communication Quality */}
      <div className="absolute bottom-6 left-6 md:left-12 p-3 rounded-2xl glass-panel-elevated shadow-xl border border-cyan-500/30 max-w-[200px] pointer-events-none animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-cyan-400" />
          <span className="text-xs font-semibold text-foreground">Communication</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono text-cyan-400">88%</span>
          <span className="text-[10px] text-muted-foreground uppercase font-mono">Clarity</span>
        </div>
        <p className="text-[10px] text-muted-foreground/90 mt-1 leading-tight">
          Concise articulation & structured delivery
        </p>
        <span className="text-[8px] text-muted-foreground/60 uppercase font-mono mt-1 block">
          *Illustrative Demo Data
        </span>
      </div>

      {/* Floating Metric 3: Answer Relevance */}
      <div className="absolute top-8 right-4 md:right-8 p-3 rounded-2xl glass-panel-elevated shadow-xl border border-indigo-500/30 max-w-[190px] pointer-events-none animate-in fade-in slide-in-from-right-4 duration-700 delay-300">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-indigo-400" />
          <span className="text-xs font-semibold text-foreground">Answer Relevance</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono text-indigo-400">95%</span>
          <span className="text-[10px] text-muted-foreground uppercase font-mono">Precision</span>
        </div>
        <p className="text-[10px] text-muted-foreground/90 mt-1 leading-tight">
          Direct alignment with target role questions
        </p>
        <span className="text-[8px] text-muted-foreground/60 uppercase font-mono mt-1 block">
          *Illustrative Demo Data
        </span>
      </div>

      {/* Floating Metric 4: Interview Readiness */}
      <div className="absolute bottom-8 right-6 md:right-12 p-3 rounded-2xl glass-panel-elevated shadow-xl border border-emerald-500/30 max-w-[200px] pointer-events-none animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-xs font-semibold text-foreground">Placement Readiness</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono text-emerald-400">84%</span>
          <span className="text-[10px] text-emerald-400/90 font-mono font-medium">Placement Ready</span>
        </div>
        <p className="text-[10px] text-muted-foreground/90 mt-1 leading-tight">
          Confidence index calculated from 5 rubrics
        </p>
        <span className="text-[8px] text-muted-foreground/60 uppercase font-mono mt-1 block">
          *Illustrative Demo Data
        </span>
      </div>
    </div>
  );
}
