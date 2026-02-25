/**
 * Contact Section — Three.js 3D Scene
 * Animated wireframe icosahedron + particle constellation
 * Lazy-initialized when contact section enters viewport
 */
import * as THREE from 'three';

export function initContact3D() {
    const section = document.getElementById('contact');
    const wrap = document.getElementById('contact-3d-wrap');
    if (!section || !wrap) return;

    let renderer, scene, camera, animFrame, isRunning = false;
    let mouse = new THREE.Vector2(0, 0);
    let targetRot = new THREE.Vector2(0, 0);

    function boot() {
        if (isRunning) return;
        isRunning = true;

        const W = wrap.offsetWidth;
        const H = wrap.offsetHeight;

        // ── Renderer ───────────────────────────────────────────────
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(W, H);
        renderer.setClearColor(0x000000, 0);
        wrap.appendChild(renderer.domElement);

        // ── Scene + camera ─────────────────────────────────────────
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 200);
        camera.position.set(0, 0, 6);

        // ── Main wireframe icosahedron ─────────────────────────────
        const icoGeo = new THREE.IcosahedronGeometry(1.8, 2);
        const icoMat = new THREE.MeshBasicMaterial({
            color: 0xc8ff00,
            wireframe: true,
            transparent: true,
            opacity: 0.55,
        });
        const ico = new THREE.Mesh(icoGeo, icoMat);
        scene.add(ico);

        // ── Inner solid (very transparent fill) ────────────────────
        const innerGeo = new THREE.IcosahedronGeometry(1.75, 2);
        const innerMat = new THREE.MeshBasicMaterial({
            color: 0x0a0a0a,
            transparent: true,
            opacity: 0.6,
            side: THREE.FrontSide,
        });
        const inner = new THREE.Mesh(innerGeo, innerMat);
        scene.add(inner);

        // ── Outer ghost ring ───────────────────────────────────────
        const ringGeo = new THREE.TorusGeometry(2.6, 0.008, 2, 120);
        const ringMat = new THREE.MeshBasicMaterial({
            color: 0xc8ff00,
            transparent: true,
            opacity: 0.3,
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 3;
        scene.add(ring);

        const ring2 = new THREE.Mesh(
            new THREE.TorusGeometry(3.1, 0.005, 2, 140),
            new THREE.MeshBasicMaterial({ color: 0x6b6b6b, transparent: true, opacity: 0.2 })
        );
        ring2.rotation.x = -Math.PI / 5;
        ring2.rotation.z = Math.PI / 6;
        scene.add(ring2);

        // ── Particle field ─────────────────────────────────────────
        const particleCount = 280;
        const positions = new Float32Array(particleCount * 3);
        for (let i = 0; i < particleCount; i++) {
            const r = 3.5 + Math.random() * 3;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = r * Math.cos(phi);
        }
        const partGeo = new THREE.BufferGeometry();
        partGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const partMat = new THREE.PointsMaterial({
            color: 0xc8ff00,
            size: 0.04,
            transparent: true,
            opacity: 0.45,
            sizeAttenuation: true,
        });
        const particles = new THREE.Points(partGeo, partMat);
        scene.add(particles);

        // ── Accent point light ─────────────────────────────────────
        const light = new THREE.PointLight(0xc8ff00, 2, 15);
        light.position.set(2, 2, 4);
        scene.add(light);

        // ── Animate ────────────────────────────────────────────────
        let t = 0;
        function animate() {
            animFrame = requestAnimationFrame(animate);
            t += 0.004;

            // Smooth mouse-driven tilt
            targetRot.x += (mouse.y * 0.4 - targetRot.x) * 0.05;
            targetRot.y += (mouse.x * 0.4 - targetRot.y) * 0.05;

            ico.rotation.y = t * 0.35 + targetRot.y;
            ico.rotation.x = t * 0.15 + targetRot.x;
            inner.rotation.y = ico.rotation.y;
            inner.rotation.x = ico.rotation.x;

            ring.rotation.z = t * 0.2;
            ring2.rotation.y = t * -0.15;

            particles.rotation.y = t * 0.06;
            particles.rotation.x = t * 0.03;

            renderer.render(scene, camera);
        }
        animate();

        // Resize
        function onResize() {
            const W = wrap.offsetWidth, H = wrap.offsetHeight;
            camera.aspect = W / H;
            camera.updateProjectionMatrix();
            renderer.setSize(W, H);
        }
        window.addEventListener('resize', onResize, { passive: true });
    }

    // Mouse tracking (relative to section)
    section.addEventListener('mousemove', (e) => {
        const rect = section.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
        mouse.y = -((e.clientY - rect.top) / rect.height - 0.5) * 2;
    }, { passive: true });

    section.addEventListener('mouseleave', () => {
        mouse.set(0, 0);
    });

    // Lazy-boot via IntersectionObserver
    const observer = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) { boot(); observer.disconnect(); } },
        { threshold: 0.15 }
    );
    observer.observe(section);

    return () => {
        if (animFrame) cancelAnimationFrame(animFrame);
        if (renderer) renderer.dispose();
    };
}
