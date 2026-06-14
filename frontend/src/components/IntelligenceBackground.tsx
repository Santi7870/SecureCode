import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { motion } from 'framer-motion';

// =========================================================
// Custom Shaders for Volumetric Fog (Layer 1)
// =========================================================
const fogVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fogFragmentShader = `
  uniform float uTime;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform vec3 uColor3;
  uniform vec3 uColor4;
  varying vec2 vUv;

  // Simple 2D Hash Noise
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise2d(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i + vec2(0.0,0.0)), hash(i + vec2(1.0,0.0)), u.x),
               mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), u.x), u.y);
  }

  // Fractional Brownian Motion
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    vec2 shift = vec2(100.0);
    mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
    for (int i = 0; i < 2; ++i) {
      v += a * noise2d(p);
      p = rot * p * 2.0 + shift;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = vUv;
    
    // Optimized single-layer domain warping
    vec2 q = vec2(0.0);
    q.x = fbm(uv + 0.015 * uTime);
    q.y = fbm(uv + vec2(1.0) + 0.012 * uTime);
    
    float f = fbm(uv + 1.2 * q + 0.018 * uTime);
    
    // Smoothly interpolate custom colors
    vec3 color = mix(uColor1, uColor2, f);
    color = mix(color, uColor3, q.x * 0.8);
    color = mix(color, uColor4, q.y * 0.4);
    
    // Soft vignette
    float dist = distance(uv, vec2(0.5));
    color *= 1.0 - dist * dist * 0.65;
    
    gl_FragColor = vec4(color, 1.0);
  }
`;

// =========================================================
// Custom Shaders for Glass-like Knowledge Orbs (Layer 3)
// =========================================================
const orbVertexShader = `
  uniform vec3 uMouse3D;
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec3 vWorldPosition;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    
    // Proximity displacement distortion
    vec3 worldPos = vWorldPosition;
    float dist = distance(worldPos, uMouse3D);
    vec3 pos = position;
    if (dist < 6.0) {
      float force = (6.0 - dist) / 6.0;
      pos += normal * sin(pos.y * 6.0 + uTime * 3.0) * force * 0.35;
    }
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const orbFragmentShader = `
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  uniform vec3 uColor;

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);
    
    // Fresnel edge-glow calculations for glass refraction sheen
    float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 4.5);
    
    // Virtual Light Direction & Specular reflections
    vec3 lightDir = normalize(vec3(6.0, 6.0, 6.0));
    vec3 halfDir = normalize(lightDir + viewDir);
    float spec = pow(max(dot(normal, halfDir), 0.0), 64.0);
    vec3 specularGlow = vec3(1.0) * spec * 0.8; // Bright specular highlight
    
    // Chromatic-shifted edge rim highlights
    vec3 edgeColor = mix(uColor, vec3(1.0), fresnel * 0.45);
    vec3 edgeGlow = edgeColor * fresnel * 2.5;
    vec3 innerColor = uColor * 0.02; // Darker translucent body
    
    gl_FragColor = vec4(innerColor + edgeGlow + specularGlow, 0.04 + fresnel * 0.42);
  }
`;

// =========================================================
// Node Interface
// =========================================================
interface NeuralNode {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  baseX: number;
  baseY: number;
  baseZ: number;
  isTemp?: boolean;
  decay?: number;
}

export const IntelligenceBackground: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // React state for Intelligence Mode (activated on double click)
  const [intelMode, setIntelMode] = useState(false);

  // Ambient words overlay config (Layer 5)
  const ambientWords = [
    { text: 'OWASP', top: '15%', left: '10%' },
    { text: 'Foundry IQ', top: '22%', left: '75%' },
    { text: 'Reasoning', top: '75%', left: '12%' },
    { text: 'Validation', top: '82%', left: '68%' },
    { text: 'Multi-Agent', top: '48%', left: '83%' },
    { text: 'Security AI', top: '8%', left: '48%' },
    { text: 'AST Engine', top: '58%', left: '86%' },
    { text: 'CWE Rules', top: '88%', left: '22%' },
  ];

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    // -----------------------------------------------------
    // 1. Scene & Render Loop Setup
    // -----------------------------------------------------
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 25;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: false, // Disabled MSAA to optimize rendering on integrated GPUs
      alpha: true
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(0.7); // Downsampled to 0.7x — fragment-heavy fog shader dominates cost; ~23% fewer pixels vs 0.8 with no visible loss on a blurred backdrop

    // -----------------------------------------------------
    // 2. Interaction State
    // -----------------------------------------------------
    const mouse2D = new THREE.Vector2(-1000, -1000);
    const mouse3D = new THREE.Vector3(-1000, -1000, 0);
    let isHolding = false;
    let holdTimer: any = null;
    let intelModeMultiplier = 1.0;
    let intelTimer: any = null;

    // Projection mapping helper
    const updateMouse3D = (clientX: number, clientY: number) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((clientY - rect.top) / rect.height) * 2 + 1;
      mouse2D.set(x, y);

      const tempV = new THREE.Vector3(x, y, 0.5);
      tempV.unproject(camera);
      const dir = tempV.sub(camera.position).normalize();
      const dist = -camera.position.z / dir.z;
      mouse3D.copy(camera.position).add(dir.multiplyScalar(dist));
    };

    // -----------------------------------------------------
    // 3. LAYER 1: Volumetric Fog Plane
    // -----------------------------------------------------
    const fogGeo = new THREE.PlaneGeometry(120, 80);
    const fogMat = new THREE.ShaderMaterial({
      vertexShader: fogVertexShader,
      fragmentShader: fogFragmentShader,
      uniforms: {
        uTime: { value: 0.0 },
        uColor1: { value: new THREE.Color('#020617') },
        uColor2: { value: new THREE.Color('#081028') },
        uColor3: { value: new THREE.Color('#1E1B4B') },
        uColor4: { value: new THREE.Color('#312E81') }
      },
      depthWrite: false
    });
    const fogMesh = new THREE.Mesh(fogGeo, fogMat);
    fogMesh.position.z = -22;
    scene.add(fogMesh);

    // -----------------------------------------------------
    // 4. LAYER 2: Neural Intelligence Field
    // -----------------------------------------------------
    const nodeCount = 180; // Increased to restore premium particle density
    const neuralNodes: NeuralNode[] = [];
    const widthBound = 24;
    const heightBound = 14;
    const depthBound = 8;

    for (let i = 0; i < nodeCount; i++) {
      const x = (Math.random() - 0.5) * widthBound * 2;
      const y = (Math.random() - 0.5) * heightBound * 2;
      const z = (Math.random() - 0.5) * depthBound;
      neuralNodes.push({
        x, y, z,
        vx: (Math.random() - 0.5) * 0.004,
        vy: (Math.random() - 0.5) * 0.004,
        vz: (Math.random() - 0.5) * 0.002,
        baseX: x, baseY: y, baseZ: z
      });
    }

    // Points Geometry for Nodes representation
    const nodePositions = new Float32Array(nodeCount * 3);
    const nodeGeo = new THREE.BufferGeometry();
    nodeGeo.setAttribute('position', new THREE.BufferAttribute(nodePositions, 3));

    const nodeMat = new THREE.PointsMaterial({
      color: 0x818CF8,
      size: 0.12,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const nodePoints = new THREE.Points(nodeGeo, nodeMat);
    scene.add(nodePoints);

    // (Line connections removed for a cleaner minimal particle backdrop)

    // -----------------------------------------------------
    // 5. LAYER 3: Glass-like Knowledge Orbs
    // -----------------------------------------------------
    const orbCount = 4;
    const orbs: { mesh: THREE.Mesh; basePos: THREE.Vector3; speed: number; phase: number; radius: number }[] = [];
    const orbColors = [
      new THREE.Color('#818CF8'), // Indigo
      new THREE.Color('#A78BFA'), // Purple
      new THREE.Color('#34D399'), // Green/Cyan
      new THREE.Color('#F472B6')  // Pink
    ];

    // Fixed depths for orbs
    const baseDepths = [-5, -6, -4, -5];

    const getVisibleSizeAtDepth = (depth: number) => {
      const d = camera.position.z - depth;
      const vFOV = (camera.fov * Math.PI) / 180;
      const visibleHeight = 2 * d * Math.tan(vFOV / 2);
      const visibleWidth = visibleHeight * camera.aspect;
      return { width: visibleWidth, height: visibleHeight };
    };

    const updateOrbPositions = () => {
      orbs.forEach((orb, i) => {
        const { width: vW, height: vH } = getVisibleSizeAtDepth(orb.basePos.z);
        // Position relative to screen margins:
        // Orb 0: top-left, Orb 1: bottom-right, Orb 2: bottom-left, Orb 3: top-right
        let rx = 0;
        let ry = 0;
        if (i === 0) { rx = -vW * 0.38; ry = vH * 0.28; }
        else if (i === 1) { rx = vW * 0.38; ry = -vH * 0.25; }
        else if (i === 2) { rx = -vW * 0.35; ry = -vH * 0.28; }
        else if (i === 3) { rx = vW * 0.35; ry = vH * 0.28; }

        orb.basePos.x = rx;
        orb.basePos.y = ry;
      });
    };

    for (let i = 0; i < orbCount; i++) {
      const radius = 1.0 + Math.random() * 0.4; // Reduced to 1.0-1.4 units for subtler, elegant orbs (not large distracting bubbles)
      const geo = new THREE.SphereGeometry(radius, 32, 24); // 32x24 segments — at 1.0-1.4 unit radius this is visually identical to 64x64 but ~4.6x fewer vertices for the per-vertex displacement shader
      const mat = new THREE.ShaderMaterial({
        vertexShader: orbVertexShader,
        fragmentShader: orbFragmentShader,
        uniforms: {
          uMouse3D: { value: new THREE.Vector3(-1000, -1000, 0) },
          uTime: { value: 0.0 },
          uColor: { value: orbColors[i] }
        },
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const mesh = new THREE.Mesh(geo, mat);
      
      // Initialize basePos at (0,0,depth) first
      const basePos = new THREE.Vector3(0, 0, baseDepths[i]);
      scene.add(mesh);
      orbs.push({
        mesh,
        basePos,
        speed: 0.15 + Math.random() * 0.12,
        phase: Math.random() * Math.PI * 2,
        radius
      });
    }

    // Call dynamic positioning after camera is loaded
    updateOrbPositions();

    // -----------------------------------------------------
    // 6. LAYER 4: Knowledge Streams (Bezier particles flowing to Core)
    // -----------------------------------------------------
    // Paths from 5 sources mapping to center 3D coordinates (0, 0, 0)
    const streamSources = [
      new THREE.Vector3(-18, 9, -2),   // OWASP (Left top)
      new THREE.Vector3(-18, -9, -2),  // CWE (Left bottom)
      new THREE.Vector3(18, 9, -2),    // Grounding (Right top)
      new THREE.Vector3(18, -9, -2),   // Validation (Right bottom)
      new THREE.Vector3(0, 10, -2)     // Reasoning (Center top)
    ];

    const streamControlPoints = [
      new THREE.Vector3(-9, 13, -2),
      new THREE.Vector3(-9, -13, -2),
      new THREE.Vector3(9, 13, -2),
      new THREE.Vector3(9, -13, -2),
      new THREE.Vector3(0, 5, -2)
    ];

    const streams: THREE.QuadraticBezierCurve3[] = [];
    for (let i = 0; i < streamSources.length; i++) {
      streams.push(
        new THREE.QuadraticBezierCurve3(
          streamSources[i],
          streamControlPoints[i],
          new THREE.Vector3(0, 0, 0) // Core center coordinates
        )
      );
    }

    const particlesPerStream = 10; // Increased flow particles for active stream visual
    const streamParticleCount = streamSources.length * particlesPerStream;
    const streamParticlePositions = new Float32Array(streamParticleCount * 3);
    const streamParticleGeo = new THREE.BufferGeometry();
    streamParticleGeo.setAttribute('position', new THREE.BufferAttribute(streamParticlePositions, 3));

    const streamParticleMat = new THREE.PointsMaterial({
      color: 0xA5B4FC,
      size: 0.22,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const streamParticles = new THREE.Points(streamParticleGeo, streamParticleMat);
    scene.add(streamParticles);

    // -----------------------------------------------------
    // 7. Click Pulse System (Expanding reasoning waves)
    // -----------------------------------------------------
    const maxPulses = 5;
    const pulses: { mesh: THREE.Mesh; scale: number; maxScale: number; opacity: number; active: boolean }[] = [];
    const pulseMatPool = new THREE.MeshBasicMaterial({
      color: 0xE0E7FF, // Soft white/blue water ripple
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    });
    const pulseGeo = new THREE.RingGeometry(0.98, 1.0, 64);

    for (let i = 0; i < maxPulses; i++) {
      const mesh = new THREE.Mesh(pulseGeo, pulseMatPool.clone() as THREE.MeshBasicMaterial);
      mesh.visible = false;
      scene.add(mesh);
      pulses.push({
        mesh,
        scale: 0.05,
        maxScale: 3.2 + Math.random() * 1.6,
        opacity: 0.85,
        active: false
      });
    }

    const spawnPulse = (pos3D: THREE.Vector3) => {
      const inactivePulse = pulses.find(p => !p.active);
      if (inactivePulse) {
        inactivePulse.active = true;
        inactivePulse.scale = 0.05;
        inactivePulse.opacity = 0.85;
        inactivePulse.mesh.position.copy(pos3D);
        inactivePulse.mesh.scale.set(0.05, 0.05, 1);
        (inactivePulse.mesh.material as THREE.MeshBasicMaterial).opacity = 0.85;
        inactivePulse.mesh.visible = true;
      }
    };

    // -----------------------------------------------------
    // 8. Event Listeners & Interaction Mechanics
    // -----------------------------------------------------
    const handleMouseMove = (e: MouseEvent) => {
      updateMouse3D(e.clientX, e.clientY);
    };

    const handleClick = () => {
      if (mouse3D.x > -999) {
        spawnPulse(mouse3D);
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return; // Left click only
      isHolding = true;
      holdTimer = setTimeout(() => {
        if (isHolding && mouse3D.x > -999) {
          // Spawn temporary knowledge node inside network
          neuralNodes.push({
            x: mouse3D.x,
            y: mouse3D.y,
            z: mouse3D.z + (Math.random() - 0.5) * 2,
            vx: (Math.random() - 0.5) * 0.003,
            vy: (Math.random() - 0.5) * 0.003,
            vz: (Math.random() - 0.5) * 0.002,
            baseX: mouse3D.x,
            baseY: mouse3D.y,
            baseZ: mouse3D.z,
            isTemp: true,
            decay: 1.0 // opacity decays slowly
          });
        }
      }, 350);
    };

    const handleMouseUp = () => {
      isHolding = false;
      if (holdTimer) clearTimeout(holdTimer);
    };

    const handleDoubleClick = () => {
      // Trigger Intelligence Mode
      setIntelMode(true);
      intelModeMultiplier = 3.5;
      
      // Spawn pulses from all floating orbs
      orbs.forEach(orb => spawnPulse(orb.mesh.position));
      
      if (intelTimer) clearTimeout(intelTimer);
      intelTimer = setTimeout(() => {
        setIntelMode(false);
        intelModeMultiplier = 1.0;
      }, 3000);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleClick);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('dblclick', handleDoubleClick);

    // -----------------------------------------------------
    // 9. Animation frame loop (60 FPS, optimized calculations)
    // -----------------------------------------------------
    let animationFrameId: number;

    // Visibility gating: skip all work + GPU render when the canvas is scrolled
    // off-screen or the tab is hidden. Time is accumulated only while visible so
    // animations resume seamlessly (no teleport jump) instead of using a wall-clock.
    let isVisible = true;
    let time = 0;
    let lastTs = 0;

    const animate = (ts: number) => {
      animationFrameId = requestAnimationFrame(animate);
      if (!isVisible) {
        lastTs = 0; // reset delta baseline so we don't fast-forward on resume
        return;
      }
      if (lastTs === 0) lastTs = ts;
      time += (ts - lastTs) / 1000;
      lastTs = ts;

      // Update Layer 1 shader time uniform
      fogMat.uniforms.uTime.value = time;

      // Update Layer 3 glass orbs position, distortion, and uniforms
      orbs.forEach((orb) => {
        // Smooth cinematic floating with 3D depth drift (Z axis)
        const slowTime = time * 0.4 * orb.speed + orb.phase;
        const driftX = Math.cos(slowTime) * 2.8;
        const driftY = Math.sin(slowTime * 1.2) * 2.4;
        const driftZ = Math.sin(slowTime * 0.6) * 1.5; // Drifts depth in 3D
        
        orb.mesh.position.x = orb.basePos.x + driftX;
        orb.mesh.position.y = orb.basePos.y + driftY;
        orb.mesh.position.z = orb.basePos.z + driftZ;
        
        // Slow axial rotation to animate specular highlights dynamically
        orb.mesh.rotation.x = time * 0.05 * orb.speed;
        orb.mesh.rotation.y = time * 0.08 * orb.speed;
        
        // Pass uniforms
        const orbMat = orb.mesh.material as THREE.ShaderMaterial;
        orbMat.uniforms.uTime.value = time;
        orbMat.uniforms.uMouse3D.value.copy(mouse3D);
      });

      // Update Layer 4 curve particles positions
      const pPositions = streamParticleGeo.attributes.position.array as Float32Array;
      const speedCoeff = intelMode ? 0.35 : 0.12;
      for (let s = 0; s < streamSources.length; s++) {
        const curve = streams[s];
        for (let p = 0; p < particlesPerStream; p++) {
          const tOffset = p / particlesPerStream;
          const t = (time * speedCoeff + tOffset) % 1.0;
          const pos = curve.getPointAt(t);
          
          const idx = (s * particlesPerStream + p) * 3;
          pPositions[idx] = pos.x;
          pPositions[idx + 1] = pos.y;
          pPositions[idx + 2] = pos.z;
        }
      }
      streamParticleGeo.attributes.position.needsUpdate = true;

      // Update click pulses (Fine, elegant water droplet ripple)
      pulses.forEach((pulse) => {
        if (!pulse.active) return;
        pulse.scale += (pulse.maxScale - pulse.scale) * 0.055;
        pulse.opacity -= 0.022;
        
        pulse.mesh.scale.set(pulse.scale, pulse.scale, 1);
        const mat = pulse.mesh.material as THREE.MeshBasicMaterial;
        mat.opacity = Math.max(pulse.opacity, 0);
        
        if (pulse.opacity <= 0) {
          pulse.active = false;
          pulse.mesh.visible = false;
        }
      });

      // Update Layer 2 nodes physics, mouse attraction, boundary logic
      const pts = nodeGeo.attributes.position.array as Float32Array;
      
      // Cleanup decayed temporary nodes
      for (let i = neuralNodes.length - 1; i >= 0; i--) {
        const node = neuralNodes[i];
        if (node.isTemp) {
          node.decay = (node.decay || 1.0) - 0.005;
          if (node.decay <= 0) {
            neuralNodes.splice(i, 1);
          }
        }
      }

      const activeNodeCount = neuralNodes.length;

      // Calculate node positions array
      for (let i = 0; i < activeNodeCount; i++) {
        const node = neuralNodes[i];
        
        // Physics float velocity
        node.x += node.vx * intelModeMultiplier;
        node.y += node.vy * intelModeMultiplier;
        node.z += node.vz * intelModeMultiplier;

        // Proximity magnetic attraction
        const distToMouse = mouse3D.x > -999 ? distance3D(node.x, node.y, node.z, mouse3D.x, mouse3D.y, mouse3D.z) : 999;
        if (distToMouse < 6.0) {
          const attractionForce = (6.0 - distToMouse) / 6.0;
          const dx = mouse3D.x - node.x;
          const dy = mouse3D.y - node.y;
          const dz = mouse3D.z - node.z;
          
          node.x += (dx / distToMouse) * attractionForce * 0.012;
          node.y += (dy / distToMouse) * attractionForce * 0.012;
          node.z += (dz / distToMouse) * attractionForce * 0.006;
        }

        // Return forces to base bounds
        const returnForce = 0.0015;
        node.x += (node.baseX - node.x) * returnForce;
        node.y += (node.baseY - node.y) * returnForce;
        node.z += (node.baseZ - node.z) * returnForce;

        // Bounce off bounds
        if (Math.abs(node.x) > widthBound * 1.5) node.vx *= -1;
        if (Math.abs(node.y) > heightBound * 1.5) node.vy *= -1;
        if (Math.abs(node.z) > depthBound * 1.5) node.vz *= -1;

        // Write position into buffer
        if (i < nodeCount) {
          const idx = i * 3;
          pts[idx] = node.x;
          pts[idx + 1] = node.y;
          pts[idx + 2] = node.z;
        }
      }
      nodeGeo.attributes.position.needsUpdate = true;

      // (Line rebuilding loop removed for a cleaner minimal particle backdrop)
      
      // Render
      renderer.render(scene, camera);
    };

    animate(0);

    // -----------------------------------------------------
    // 9b. Visibility gating — pause render when off-screen or tab hidden
    // -----------------------------------------------------
    let inViewport = true;
    let tabVisible = !document.hidden;
    const syncVisibility = () => { isVisible = inViewport && tabVisible; };

    const io = new IntersectionObserver(
      (entries) => {
        inViewport = entries[0]?.isIntersecting ?? true;
        syncVisibility();
      },
      { threshold: 0 }
    );
    io.observe(containerRef.current);

    const handleVisibilityChange = () => {
      tabVisible = !document.hidden;
      syncVisibility();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Helper Math function
    function distance3D(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number) {
      const dx = x1 - x2;
      const dy = y1 - y2;
      const dz = z1 - z2;
      return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    // -----------------------------------------------------
    // 10. Responsive resizing
    // -----------------------------------------------------
    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      
      // Update orb base positions dynamically on screen resize/zoom
      updateOrbPositions();
    };
    
    window.addEventListener('resize', handleResize);

    // -----------------------------------------------------
    // 11. Strict Cleanup logic (No memory leaks)
    // -----------------------------------------------------
    return () => {
      cancelAnimationFrame(animationFrameId);
      io.disconnect();
      document.removeEventListener('visibilitychange', handleVisibilityChange);

      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('dblclick', handleDoubleClick);
      window.removeEventListener('resize', handleResize);
      
      if (holdTimer) clearTimeout(holdTimer);
      if (intelTimer) clearTimeout(intelTimer);

      // Dispose Geometries
      fogGeo.dispose();
      nodeGeo.dispose();
      orbCount && orbs.forEach(o => o.mesh.geometry.dispose());
      streamParticleGeo.dispose();
      pulseGeo.dispose();

      // Dispose Materials
      fogMat.dispose();
      nodeMat.dispose();
      orbs.forEach(o => (o.mesh.material as THREE.ShaderMaterial).dispose());
      streamParticleMat.dispose();
      pulseMatPool.dispose();
      pulses.forEach(p => (p.mesh.material as THREE.MeshBasicMaterial).dispose());

      // Dispose Renderer
      renderer.dispose();
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="intelligence-bg-container"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0
      }}
    >
      <canvas 
        ref={canvasRef} 
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          opacity: 0.85
        }}
      />

      {/* Layer 5: Ambient floating intelligence words (subtle drifts) */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          userSelect: 'none',
          zIndex: 1
        }}
      >
        {ambientWords.map((word, idx) => (
          <motion.div
            key={`ambient-${word.text}-${idx}`}
            style={{
              position: 'absolute',
              top: word.top,
              left: word.left,
              fontFamily: 'var(--font-sans)',
              fontSize: '0.75rem',
              fontWeight: 800,
              letterSpacing: '0.12em',
              color: 'rgba(255, 255, 255, 0.045)',
              textTransform: 'uppercase'
            }}
            animate={{
              y: [0, -12, 0],
              x: [0, 8, 0],
              opacity: [0.03, 0.05, 0.03]
            }}
            transition={{
              duration: 8 + idx * 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          >
            {word.text}
          </motion.div>
        ))}
      </div>

      {/* Floating notification readout when double click (Intelligence Mode) */}
      {intelMode && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -10 }}
          style={{
            position: 'absolute',
            bottom: '40px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(99, 102, 241, 0.12)',
            border: '1px solid rgba(99, 102, 241, 0.35)',
            color: '#C7D2FE',
            padding: '8px 18px',
            borderRadius: '20px',
            fontSize: '0.75rem',
            fontWeight: 800,
            letterSpacing: '0.05em',
            zIndex: 10,
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            pointerEvents: 'none'
          }}
        >
          <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#F472B6', animation: 'pulse 1s infinite' }} />
          INTELLIGENCE BURST ACTIVE
        </motion.div>
      )}
    </div>
  );
};
