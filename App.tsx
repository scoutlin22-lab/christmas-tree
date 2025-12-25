
import React, { Suspense, useState, useEffect, useRef, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Float, Stars } from '@react-three/drei';
import { EffectComposer, Bloom, Noise, Vignette } from '@react-three/postprocessing';
import ChristmasTree from './components/ChristmasTree';
import Snow from './components/Snow';
import Overlay from './components/Overlay';
import WishParticle from './components/WishParticle';
import { GestureRecognizer, FilesetResolver } from '@mediapipe/tasks-vision';

const App: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [gesture, setGesture] = useState<string>('None');
  const [handPos, setHandPos] = useState({ x: 0, y: 0 });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [wishes, setWishes] = useState<{ id: number }[]>([]);
  const [treePulse, setTreePulse] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const gestureRecognizerRef = useRef<GestureRecognizer | null>(null);
  const requestRef = useRef<number>(null);

  useEffect(() => {
    setMounted(true);
    const initGestureRecognizer = async () => {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
      );
      gestureRecognizerRef.current = await GestureRecognizer.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
          delegate: "GPU"
        },
        runningMode: "VIDEO"
      });
    };
    initGestureRecognizer();

    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * -2
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const toggleCamera = async () => {
    if (cameraEnabled) {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
      setCameraEnabled(false);
      setGesture('None');
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.addEventListener('loadeddata', () => {
            setCameraEnabled(true);
          });
        }
      } catch (err) {
        console.error("Camera access denied", err);
        alert("Camera access is required for hand interaction.");
      }
    }
  };

  const predictGestures = useCallback(() => {
    if (cameraEnabled && videoRef.current && gestureRecognizerRef.current) {
      const nowInMs = Date.now();
      const results = gestureRecognizerRef.current.recognizeForVideo(videoRef.current, nowInMs);
      
      if (results.gestures.length > 0) {
        const categoryName = results.gestures[0][0].categoryName;
        setGesture(categoryName);

        if (results.landmarks.length > 0) {
          const landmark = results.landmarks[0][0];
          setHandPos({
            x: (landmark.x - 0.5) * 2,
            y: (landmark.y - 0.5) * -2
          });
        }
      } else {
        setGesture('None');
      }
    }
    requestRef.current = requestAnimationFrame(predictGestures);
  }, [cameraEnabled]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(predictGestures);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [predictGestures]);

  const handleSendWish = () => {
    setWishes(prev => [...prev, { id: Date.now() }]);
  };

  const onWishArrival = (id: number) => {
    setTreePulse(Date.now());
    setTimeout(() => {
      setWishes(prev => prev.filter(w => w.id !== id));
    }, 10000); // Cleanup after explosion, extended to maintain total screen time
  };

  if (!mounted) return null;

  return (
    <div className="relative w-full h-screen bg-[#02040a] overflow-hidden cursor-crosshair">
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        className={`absolute top-4 left-4 w-32 h-24 rounded-lg border border-white/20 z-50 transition-opacity duration-500 scale-x-[-1] object-cover ${cameraEnabled ? 'opacity-50' : 'opacity-0 pointer-events-none'}`}
      />

      <button 
        onClick={toggleCamera}
        className="absolute top-8 right-8 z-50 px-6 py-3 rounded-full bg-white/5 border border-white/10 text-white text-xs font-bold tracking-widest uppercase backdrop-blur-xl hover:bg-white/20 transition-all active:scale-95 pointer-events-auto shadow-[0_0_20px_rgba(255,215,0,0.1)]"
      >
        {cameraEnabled ? 'Disable Gesture' : 'Enable Gesture'}
      </button>

      <Canvas shadows dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 8, 20]} fov={45} />
        
        <color attach="background" args={['#02040a']} />
        <fog attach="fog" args={['#02040a', 15, 35]} />
        <ambientLight intensity={0.2} />
        <pointLight position={[10, 10, 10]} intensity={1.5} color="#ffd700" />
        <spotLight position={[-10, 20, 10]} angle={0.15} penumbra={1} intensity={2} castShadow />

        <Suspense fallback={null}>
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
          
          <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
            <ChristmasTree 
              gesture={gesture} 
              handPos={handPos} 
              mousePos={mousePos}
              isCameraActive={cameraEnabled}
              pulseTrigger={treePulse}
            />
          </Float>

          <Snow />

          {wishes.map(wish => (
            <WishParticle 
              key={wish.id} 
              id={wish.id} 
              onArrival={() => onWishArrival(wish.id)} 
            />
          ))}

          <Environment preset="night" />
        </Suspense>

        <EffectComposer disableNormalPass>
          <Bloom luminanceThreshold={0.2} mipmapBlur intensity={1.5} radius={0.4} />
          <Noise opacity={0.03} />
          <Vignette eskil={false} offset={0.1} darkness={0.8} />
        </EffectComposer>

        <OrbitControls 
          enablePan={false} 
          enableDamping={true}
          dampingFactor={0.05}
          minDistance={8} 
          maxDistance={35} 
          autoRotate={!cameraEnabled || gesture === 'None'} 
          autoRotateSpeed={0.5}
          maxPolarAngle={Math.PI / 1.8}
          minPolarAngle={Math.PI / 4}
        />
      </Canvas>

      <Overlay onSendWish={handleSendWish} />
    </div>
  );
};

export default App;
