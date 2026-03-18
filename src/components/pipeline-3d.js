/**
 * pipeline-3d.js — Scroll-driven "Data → Model → Decision → Value" experience
 * CSS sticky container + Three.js dodecahedron + crossfading phase cards
 * No GSAP pin — natural scroll feel with progressive reveal
 */
import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initPipeline() {
  const wrap = document.getElementById('pipeline-3d-wrap');
  const section = document.getElementById('pipeline');
  if (!wrap || !section) return;

  const phases = document.querySelectorAll('.pipeline-phase');
  const dots = document.querySelectorAll('.pipeline-dot');
  if (!phases.length) return;

  /* ── Three.js Scene ──────────────────────────────────────────── */
  let renderer, scene, camera, group;
  let W = wrap.clientWidth, H = wrap.clientHeight;

  function boot() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 100);
    camera.position.z = 5;

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);
    wrap.appendChild(renderer.domElement);

    group = new THREE.Group();

    // Wireframe dodecahedron
    const dodGeo = new THREE.DodecahedronGeometry(1.6, 1);
    const dodMat = new THREE.MeshBasicMaterial({
      color: 0xc8ff00,
      wireframe: true,
      transparent: true,
      opacity: 0.3,
    });
    group.add(new THREE.Mesh(dodGeo, dodMat));

    // Inner solid core
    const coreGeo = new THREE.IcosahedronGeometry(0.6, 2);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xc8ff00,
      wireframe: true,
      transparent: true,
      opacity: 0.12,
    });
    group.add(new THREE.Mesh(coreGeo, coreMat));

    // Data point particles
    const particleCount = 120;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 2.2 + Math.random() * 0.8;
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    const partGeo = new THREE.BufferGeometry();
    partGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const partMat = new THREE.PointsMaterial({
      color: 0xc8ff00,
      size: 0.03,
      transparent: true,
      opacity: 0.35,
      sizeAttenuation: true,
    });
    group.add(new THREE.Points(partGeo, partMat));

    scene.add(group);

    // Render loop
    function render() {
      renderer.render(scene, camera);
      requestAnimationFrame(render);
    }
    render();
  }

  /* ── Lazy Init ───────────────────────────────────────────────── */
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        boot();
        observer.disconnect();
      }
    },
    { threshold: 0.05 }
  );
  observer.observe(section);

  /* ── Scroll-Driven Crossfade (no pin) ────────────────────────── */
  // Show first phase by default
  phases[0].classList.add('active');

  ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: 'bottom bottom',
    scrub: 0.6,
    onUpdate: (self) => {
      const progress = self.progress; // 0 → 1

      // Rotate 3D object smoothly
      if (group) {
        group.rotation.y = progress * Math.PI * 2;
        group.rotation.x = progress * Math.PI * 0.5;
        // Subtle scale pulse at each phase boundary
        const scalePulse = 1 + 0.05 * Math.sin(progress * Math.PI * 4);
        group.scale.setScalar(scalePulse);
      }

      // Determine active phase with crossfade zones
      const phaseIndex = Math.min(3, Math.floor(progress * 4));

      // Calculate sub-progress within each phase (0→1)
      const phaseProgress = (progress * 4) - phaseIndex;

      phases.forEach((p, i) => {
        if (i === phaseIndex) {
          p.classList.add('active');
          // Fade out as we approach the next phase
          const fadeOut = phaseProgress > 0.8 && i < 3
            ? 1 - ((phaseProgress - 0.8) / 0.2)
            : 1;
          p.style.opacity = fadeOut;
        } else {
          p.classList.remove('active');
          p.style.opacity = '0';
        }
      });

      // Update dots
      dots.forEach((d, i) => {
        d.classList.toggle('active', i === phaseIndex);
      });
    },
  });

  /* ── Resize ──────────────────────────────────────────────────── */
  window.addEventListener('resize', () => {
    W = wrap.clientWidth;
    H = wrap.clientHeight;
    if (renderer) {
      renderer.setSize(W, H);
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
    }
  });
}
