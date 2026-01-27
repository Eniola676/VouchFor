import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const EtherealBeamBackground = () => {
    const canvasRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!canvasRef.current) return;

        // Scene setup
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        camera.position.z = 5;

        const renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(0x000000, 0); // Transparent background
        canvasRef.current.appendChild(renderer.domElement);

        // Custom shader for glowing beams
        const vertexShader = `
      varying vec2 vUv;
      varying float vDistance;
      uniform float time;
      
      void main() {
        vUv = uv;
        vec3 pos = position;
        
        // Add subtle wave motion
        pos.x += sin(pos.y * 2.0 + time) * 0.1;
        pos.y += cos(pos.x * 2.0 + time * 0.5) * 0.1;
        
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        vDistance = length(mvPosition.xyz);
        
        gl_Position = projectionMatrix * mvPosition;
      }
    `;

        const fragmentShader = `
      uniform float time;
      uniform vec3 color1;
      uniform vec3 color2;
      varying vec2 vUv;
      varying float vDistance;
      
      void main() {
        // Create gradient along the beam
        float gradient = vUv.y;
        
        // Pulsating effect
        float pulse = sin(time * 2.0 + vDistance) * 0.5 + 0.5;
        
        // Mix colors
        vec3 color = mix(color1, color2, gradient);
        
        // Glow effect - brighter in the center
        float glow = 1.0 - abs(vUv.x - 0.5) * 2.0;
        glow = pow(glow, 3.0);
        
        // Fade based on distance
        float alpha = glow * (0.3 + pulse * 0.4) * (1.0 - vDistance / 10.0);
        
        gl_FragColor = vec4(color, alpha);
      }
    `;

        // Create multiple beams
        const beamGroup = new THREE.Group();
        const numBeams = 8;

        for (let i = 0; i < numBeams; i++) {
            const angle = (i / numBeams) * Math.PI * 2;
            const radius = 2 + Math.random() * 2;

            // Create curved path for the beam
            const curve = new THREE.QuadraticBezierCurve3(
                new THREE.Vector3(
                    Math.cos(angle) * radius,
                    -5 + Math.random() * 2,
                    Math.sin(angle) * radius
                ),
                new THREE.Vector3(
                    Math.cos(angle + 0.5) * (radius * 0.5),
                    Math.random() * 3,
                    Math.sin(angle + 0.5) * (radius * 0.5)
                ),
                new THREE.Vector3(
                    Math.cos(angle + 1) * radius,
                    5 + Math.random() * 2,
                    Math.sin(angle + 1) * radius
                )
            );

            const tubeGeometry = new THREE.TubeGeometry(curve, 64, 0.1, 8, false);

            // Orange-themed colors for the beams
            const shaderMaterial = new THREE.ShaderMaterial({
                uniforms: {
                    time: { value: 0 },
                    color1: { value: new THREE.Color(0xffffff) }, // White
                    color2: { value: new THREE.Color(0xffaa44) }, // Light orange/yellow
                },
                vertexShader,
                fragmentShader,
                transparent: true,
                blending: THREE.AdditiveBlending,
                side: THREE.DoubleSide,
            });

            const beam = new THREE.Mesh(tubeGeometry, shaderMaterial);
            beamGroup.add(beam);
        }

        scene.add(beamGroup);

        // Animation loop
        let animationFrameId: number;
        const animate = () => {
            animationFrameId = requestAnimationFrame(animate);

            // Update time uniform for all beams
            beamGroup.children.forEach((child) => {
                if (child instanceof THREE.Mesh && child.material instanceof THREE.ShaderMaterial) {
                    child.material.uniforms.time.value += 0.01;
                }
            });

            // Rotate beam group slowly
            beamGroup.rotation.y += 0.001;
            beamGroup.rotation.x += 0.0005;

            renderer.render(scene, camera);
        };

        animate();

        // Handle window resize
        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };

        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
            if (canvasRef.current) {
                canvasRef.current.removeChild(renderer.domElement);
            }
            renderer.dispose();
        };
    }, []);

    return (
        <div
            ref={canvasRef}
            className="fixed inset-0 z-0"
            style={{ pointerEvents: 'none' }}
        />
    );
};

export default EtherealBeamBackground;
