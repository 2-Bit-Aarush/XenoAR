
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter';
// Fixed: Changed ObjectAnalysis to Object3DParams as it is the correct exported member from types.ts
import { Object3DParams } from '../types';

interface Viewer3DProps {
  params: Object3DParams;
  onExportSuccess: (blob: Blob, fileName: string) => void;
}

const Viewer3D: React.FC<Viewer3DProps> = ({ params, onExportSuccess }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const objectRef = useRef<THREE.Mesh | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 1000);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    rendererRef.current = renderer;
    containerRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    let geometry: THREE.BufferGeometry;
    // Fixed: Using params instead of analysis and ensuring dimensions are accessed correctly
    const { width, height, depth } = params.dimensions;
    const scale = 2 / Math.max(width, height, depth); 

    // Fixed: Using params instead of analysis
    switch (params.shapeType) {
      case 'sphere':
        geometry = new THREE.SphereGeometry(width * scale / 2, 64, 64);
        break;
      case 'cylinder':
        geometry = new THREE.CylinderGeometry(width * scale / 2, width * scale / 2, height * scale, 64);
        break;
      case 'box':
      default:
        geometry = new THREE.BoxGeometry(width * scale, height * scale, depth * scale);
        break;
    }

    // Fixed: Updated property paths to match Object3DParams structure (material.color, material.roughness, etc.)
    const material = new THREE.MeshStandardMaterial({
      color: params.material.color || '#3b82f6',
      roughness: params.material.roughness,
      metalness: params.material.metalness,
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    objectRef.current = mesh;

    const grid = new THREE.GridHelper(20, 20, 0x222222, 0x111111);
    grid.position.y = -(height * scale) / 2;
    scene.add(grid);

    camera.position.set(2, 2, 4);
    camera.lookAt(0, 0, 0);

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
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
      if (containerRef.current) containerRef.current.removeChild(renderer.domElement);
    };
  }, [params]);

  const handleSave = () => {
    if (!sceneRef.current || isExporting) return;
    setIsExporting(true);
    
    const exporter = new GLTFExporter();
    exporter.parse(sceneRef.current, (gltf) => {
      const output = gltf instanceof ArrayBuffer ? gltf : JSON.stringify(gltf);
      const blob = new Blob([output], { type: 'model/gltf-binary' });
      // Fixed: Using params instead of analysis
      const fileName = `${params.name.replace(/\s+/g, '_')}.glb`;
      onExportSuccess(blob, fileName);
      setIsExporting(false);
    }, (err) => {
      console.error(err);
      setIsExporting(false);
    }, { binary: true });
  };

  return (
    <div className="space-y-4">
      <div className="relative w-full h-[350px] md:h-[500px] rounded-3xl overflow-hidden glass border border-blue-500/20 shadow-2xl">
        <div ref={containerRef} className="w-full h-full" />
        <div className="absolute top-4 left-4 pointer-events-none">
          <h3 className="text-[10px] font-black text-blue-500 mono tracking-widest uppercase">Preview Mode</h3>
          {/* Fixed: Using params instead of analysis */}
          <p className="text-xl font-bold text-white mt-0.5">{params.name}</p>
        </div>
      </div>
      
      <button 
        onClick={handleSave}
        disabled={isExporting}
        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-5 rounded-2xl transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
      >
        {isExporting ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
        Add to Library
      </button>
    </div>
  );
};

export default Viewer3D;
