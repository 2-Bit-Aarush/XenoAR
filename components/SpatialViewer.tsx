
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter';
import { ARButton } from 'three/examples/jsm/webxr/ARButton';
import { Object3DParams } from '../types';

interface SpatialViewerProps {
  params: Object3DParams;
  onSave?: () => void;
  onBack?: () => void;
}

const SpatialViewer: React.FC<SpatialViewerProps> = ({ params, onSave, onBack }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const [arSupported, setArSupported] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    // Check AR Support
    if ('xr' in navigator) {
      (navigator as any).xr.isSessionSupported('immersive-ar').then((supported: boolean) => {
        setArSupported(supported);
      });
    }

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x050505);

    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.01,
      100
    );
    camera.position.set(0.5, 0.5, 1);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.xr.enabled = true;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(2, 2, 2);
    scene.add(directionalLight);

    // Geometry Generation
    let geometry: THREE.BufferGeometry;
    const { width, height, depth, radius } = params.dimensions;

    // Handle Custom AI Mesh
    if (params.shapeType === 'complex' && params.meshData) {
      geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(params.meshData.vertices, 3));
      if (params.meshData.indices.length > 0) {
        geometry.setIndex(params.meshData.indices);
      }
      geometry.computeVertexNormals();
    } else {
      // Fallback or Standard Primitives
      switch (params.shapeType) {
        case 'sphere':
          geometry = new THREE.SphereGeometry(radius || width / 2, 32, 32);
          break;
        case 'cylinder':
          geometry = new THREE.CylinderGeometry(radius || width / 2, radius || width / 2, height, 32);
          break;
        case 'capsule':
          geometry = new THREE.CapsuleGeometry(radius || width / 4, height, 4, 32);
          break;
        case 'torus':
          geometry = new THREE.TorusGeometry(radius || width / 2, 0.05, 16, 100);
          break;
        case 'complex':
          // Organic fallback if meshData is missing
          geometry = new THREE.IcosahedronGeometry(width / 2, 4);
          const positionAttribute = geometry.getAttribute('position');
          for (let i = 0; i < positionAttribute.count; i++) {
            const x = positionAttribute.getX(i);
            const y = positionAttribute.getY(i);
            const z = positionAttribute.getZ(i);
            const noise = (Math.random() - 0.5) * 0.1;
            positionAttribute.setXYZ(i, x + noise, y + noise, z + noise);
          }
          geometry.computeVertexNormals();
          break;
        case 'box':
        default:
          geometry = new THREE.BoxGeometry(width, height, depth);
          break;
      }
    }

    const material = new THREE.MeshStandardMaterial({
      color: params.material.color,
      metalness: params.material.metalness,
      roughness: params.material.roughness,
      emissive: params.material.emissive || '#000000',
      emissiveIntensity: params.material.emissiveIntensity || 0,
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Grid for context
    const grid = new THREE.GridHelper(10, 10, 0x333333, 0x111111);
    grid.position.y = -height / 2;
    scene.add(grid);

    // Setup AR Button
    const arButton = ARButton.createButton(renderer, {
      requiredFeatures: ['hit-test'],
      optionalFeatures: ['dom-overlay'],
      domOverlay: { root: document.body }
    });
    arButton.style.display = 'none'; // We'll trigger it with our own button
    document.body.appendChild(arButton);

    const animate = () => {
      renderer.setAnimationLoop(() => {
        controls.update();
        renderer.render(scene, camera);
      });
    };
    animate();

    const handleResize = () => {
      if (!containerRef.current) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      document.body.removeChild(arButton);
      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, [params]);

  const enterAR = () => {
    const btn = document.querySelector('button#ARButton') as HTMLButtonElement;
    if (btn) btn.click();
  };

  const handleDownloadGLB = () => {
    if (!sceneRef.current) return;
    setIsExporting(true);

    const exporter = new GLTFExporter();
    exporter.parse(
      sceneRef.current,
      (result) => {
        const output = JSON.stringify(result, null, 2);
        const blob = new Blob([output], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.style.display = 'none';
        link.href = url;
        link.download = `${params.name || 'model'}.gltf`; // Using GLTF for now as it's text-based and easier to debug, but works same as GLB for valid viewers
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setIsExporting(false);
      },
      (error) => {
        console.error('An error happened during export:', error);
        alert('Failed to export GLB');
        setIsExporting(false);
      }
    );
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500">
      <div className="relative flex-1 rounded-[2rem] overflow-hidden glass border border-white/5">
        <div ref={containerRef} className="w-full h-full" />

        <div className="absolute top-6 left-6 pointer-events-none">
          <div className="flex items-center gap-2 mb-1">
            <div className={`w-2 h-2 ${params.meshData ? 'bg-purple-500' : 'bg-blue-500'} rounded-full animate-pulse`} />
            <span className={`text-[10px] font-bold ${params.meshData ? 'text-purple-500' : 'text-blue-500'}/80 mono tracking-widest uppercase`}>
              {params.meshData ? 'AI Mesh Geometry' : 'Parametric Object'}
            </span>
          </div>
          <h2 className="text-2xl font-black text-white">{params.name}</h2>
          <p className="text-gray-500 text-xs mt-1 max-w-[200px] leading-tight italic">"{params.spatialDescription}"</p>
        </div>

        <div className="absolute top-6 right-6 flex flex-col gap-3">
          <button
            onClick={handleDownloadGLB}
            disabled={isExporting}
            className="px-4 py-2 glass rounded-full text-[10px] font-bold text-white hover:bg-white/10 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isExporting ? (
              <span className="animate-spin h-3 w-3 border-2 border-white/50 border-t-white rounded-full"></span>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            )}
            GLB
          </button>
        </div>

        <div className="absolute bottom-6 right-6 flex flex-col gap-3">
          {arSupported && (
            <button
              onClick={enterAR}
              className="w-14 h-14 bg-white text-black rounded-full flex items-center justify-center shadow-2xl active:scale-90 transition-transform"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-6">
        <button
          onClick={onBack}
          className="py-4 rounded-2xl glass text-gray-400 font-bold hover:text-white transition-all active:scale-95"
        >
          DISCARD
        </button>
        <button
          onClick={onSave}
          className="py-4 rounded-2xl bg-blue-600 text-white font-bold shadow-xl shadow-blue-900/20 active:scale-95 transition-all"
        >
          SAVE TO LIBRARY
        </button>
      </div>
    </div>
  );
};

export default SpatialViewer;
