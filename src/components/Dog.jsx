import React, { useEffect, useRef } from 'react'
import * as THREE from 'three';
import { useGLTF, useTexture, useAnimations } from '@react-three/drei';
import { useThree, useFrame } from '@react-three/fiber';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const Dog = () => {

  gsap.registerPlugin(ScrollTrigger);

  const parallaxGroup = useRef();
  const mouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      // Normalized (-1 to 1) with soft edge easing
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = -(e.clientY / window.innerHeight) * 2 + 1;
      mouse.current.x = Math.sign(nx) * Math.pow(Math.abs(nx), 0.9);
      mouse.current.y = Math.sign(ny) * Math.pow(Math.abs(ny), 0.9);
    };

    const handleMouseLeave = () => {
      mouse.current.x = 0;
      mouse.current.y = 0;
    };

    const handleTouchMove = (e) => {
      if (e.touches && e.touches.length > 0) {
        const touch = e.touches[0];
        const nx = (touch.clientX / window.innerWidth) * 2 - 1;
        const ny = -(touch.clientY / window.innerHeight) * 2 + 1;
        mouse.current.x = Math.sign(nx) * Math.pow(Math.abs(nx), 0.9);
        mouse.current.y = Math.sign(ny) * Math.pow(Math.abs(ny), 0.9);
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  useFrame((state, delta) => {
    if (parallaxGroup.current) {
      // Frame-rate independent exponential damping (consistent across 60Hz/120Hz/144Hz)
      const damp = 1 - Math.exp(-4.2 * Math.min(delta, 0.1));

      // Organic micro-breathing (keeps the scene feeling alive when cursor is idle)
      const time = state.clock.elapsedTime;
      const breathY = Math.sin(time * 0.8) * 0.007;
      const breathZ = Math.cos(time * 0.6) * 0.004;

      // 6-DOF Multi-Axis Targets:
      // 1. Yaw (Y-rotation) - turns toward cursor
      const targetRotY = mouse.current.x * 0.18;
      // 2. Pitch (X-rotation) - tilts with vertical cursor position
      const targetRotX = -mouse.current.y * 0.10;
      // 3. Roll (Z-rotation) - subtle cinematic banking into horizontal movement
      const targetRotZ = -mouse.current.x * 0.04 + breathZ;

      // 4. Spatial sway (X/Y translation)
      const targetPosX = mouse.current.x * 0.035;
      const targetPosY = mouse.current.y * 0.025 + breathY;

      // Smooth physics interpolation
      parallaxGroup.current.rotation.y = THREE.MathUtils.lerp(parallaxGroup.current.rotation.y, targetRotY, damp);
      parallaxGroup.current.rotation.x = THREE.MathUtils.lerp(parallaxGroup.current.rotation.x, targetRotX, damp);
      parallaxGroup.current.rotation.z = THREE.MathUtils.lerp(parallaxGroup.current.rotation.z, targetRotZ, damp);

      parallaxGroup.current.position.x = THREE.MathUtils.lerp(parallaxGroup.current.position.x, targetPosX, damp);
      parallaxGroup.current.position.y = THREE.MathUtils.lerp(parallaxGroup.current.position.y, targetPosY, damp);
    }
  });


  const model = useGLTF('/models/dog.drc.glb');

  useThree(({ camera, _scene, gl }) => {
    camera.position.z = 0.55;
    gl.toneMapping = THREE.ReinhardToneMapping;
    gl.outputColorSpace = THREE.SRGBColorSpace;
  })


  const { actions } = useAnimations(model.animations, model.scene);

  useEffect(() => {
    actions['Take 001'].play();
  }, [actions]);


  const [normalMap] = (useTexture([
    '/dog_normals.jpg'
  ])).map(texture => {
    texture.flipY = false;
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  });


  const [branchNormalMap] = (useTexture([
    '/branches_normals.jpeg'])).map(texture => {
      texture.flipY = false;
      texture.colorSpace = THREE.SRGBColorSpace;
      return texture;
    });


  const [
    mat2,
    mat8,
    mat9,
    mat10,
    mat12,
    mat13,
    mat19,
  ] = (useTexture([
    "/matcap/mat-2.png",
    "/matcap/mat-8.png",
    "/matcap/mat-9.png",
    "/matcap/mat-10.png",
    "/matcap/mat-12.png",
    "/matcap/mat-13.png",
    "/matcap/mat-19.png",
  ])).map(texture => {
    texture.colorSpace = THREE.SRGBColorSpace
    return texture
  })


  const material = useRef({
    uMatcap1: { value: mat2 },
    uMatcap2: { value: mat2 },
    uProgress: { value: 1.0 }
  })


  const dogMaterial = new THREE.MeshMatcapMaterial({
    normalMap: normalMap,
    matcap: mat2,
  })


  const branchMaterial = new THREE.MeshMatcapMaterial({
    normalMap: branchNormalMap,
    matcap: mat2,
    side: THREE.DoubleSide,
  })


  function onBeforeCompile(shader) {
    shader.uniforms.uMatcapTexture1 = material.current.uMatcap1
    shader.uniforms.uMatcapTexture2 = material.current.uMatcap2
    shader.uniforms.uProgress = material.current.uProgress

    // Store reference to shader uniforms for GSAP animation

    shader.fragmentShader = shader.fragmentShader.replace(
      "void main() {",
      `
        uniform sampler2D uMatcapTexture1;
        uniform sampler2D uMatcapTexture2;
        uniform float uProgress;

        void main() {
        `
    )

    shader.fragmentShader = shader.fragmentShader.replace(
      "vec4 matcapColor = texture2D( matcap, uv );",
      `
          vec4 matcapColor1 = texture2D( uMatcapTexture1, uv );
          vec4 matcapColor2 = texture2D( uMatcapTexture2, uv );
          float transitionFactor  = 0.2;
          
          float progress = smoothstep(uProgress - transitionFactor,uProgress, (vViewPosition.x+vViewPosition.y)*0.5 + 0.5);

          vec4 matcapColor = mix(matcapColor2, matcapColor1, progress );
        `
    )
  }

  dogMaterial.onBeforeCompile = onBeforeCompile;
  branchMaterial.onBeforeCompile = onBeforeCompile;



  model.scene.traverse((child) => {
    if (child.isMesh) {
      if (child.name.includes("DOG")) {
        child.material = dogMaterial;
      } else {
        child.material = branchMaterial;
      }
    }
  })

  const dogModel = useRef(model);

  useGSAP(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: "#section-1",
        endTrigger: ".site-footer",
        start: "top top",
        end: "bottom bottom",
        scrub: true,
      }
    })

    tl
      .to(dogModel.current.scene.position, {
        z: "-=0.75",
        y: "+=0.1"
      })
      .to(dogModel.current.scene.rotation, {
        x: `+=${Math.PI / 15}`
      })
      .to(dogModel.current.scene.rotation, {
        y: `-=${Math.PI}`,

      }, "third")
      .to(dogModel.current.scene.position, {
        x: "-=0.5",
        z: "+=0.6",
        y: "-=0.05"
      }, "third")
  })

  useEffect(() => {

    document.querySelector(`.title[img-title="tomorrowland"]`).addEventListener("mouseenter", () => {

      material.current.uMatcap1.value = mat19
      gsap.to(material.current.uProgress, {
        value: 0.0,
        duration: 0.5,
        onComplete: () => {
          material.current.uMatcap2.value = material.current.uMatcap1.value
          material.current.uProgress.value = 1.0
        }
      })
    })
    document.querySelector(`.title[img-title="navy-pier"]`).addEventListener("mouseenter", () => {


      material.current.uMatcap1.value = mat8

      gsap.to(material.current.uProgress, {
        value: 0.0,
        duration: 0.5,
        onComplete: () => {
          material.current.uMatcap2.value = material.current.uMatcap1.value
          material.current.uProgress.value = 1.0
        }
      })
    })
    document.querySelector(`.title[img-title="msi-chicago"]`).addEventListener("mouseenter", () => {


      material.current.uMatcap1.value = mat9

      gsap.to(material.current.uProgress, {
        value: 0.0,
        duration: 0.5,
        onComplete: () => {
          material.current.uMatcap2.value = material.current.uMatcap1.value
          material.current.uProgress.value = 1.0
        }
      })
    })
    document.querySelector(`.title[img-title="phone"]`).addEventListener("mouseenter", () => {


      material.current.uMatcap1.value = mat12

      gsap.to(material.current.uProgress, {
        value: 0.0,
        duration: 0.5,
        onComplete: () => {
          material.current.uMatcap2.value = material.current.uMatcap1.value
          material.current.uProgress.value = 1.0
        }
      })
    })
    document.querySelector(`.title[img-title="kikk"]`).addEventListener("mouseenter", () => {


      material.current.uMatcap1.value = mat10

      gsap.to(material.current.uProgress, {
        value: 0.0,
        duration: 0.5,
        onComplete: () => {
          material.current.uMatcap2.value = material.current.uMatcap1.value
          material.current.uProgress.value = 1.0
        }
      })
    })
    document.querySelector(`.title[img-title="kennedy"]`).addEventListener("mouseenter", () => {


      material.current.uMatcap1.value = mat8

      gsap.to(material.current.uProgress, {
        value: 0.0,
        duration: 0.5,
        onComplete: () => {
          material.current.uMatcap2.value = material.current.uMatcap1.value
          material.current.uProgress.value = 1.0
        }
      })
    })
    document.querySelector(`.title[img-title="opera"]`).addEventListener("mouseenter", () => {


      material.current.uMatcap1.value = mat13

      gsap.to(material.current.uProgress, {
        value: 0.0,
        duration: 0.5,
        onComplete: () => {
          material.current.uMatcap2.value = material.current.uMatcap1.value
          material.current.uProgress.value = 1.0
        }
      })
    })
    document.querySelector(`.titles`).addEventListener("mouseleave", () => {

      material.current.uMatcap1.value = mat2

      gsap.to(material.current.uProgress, {
        value: 0.0,
        duration: 0.5,
        onComplete: () => {
          material.current.uMatcap2.value = material.current.uMatcap1.value
          material.current.uProgress.value = 1.0
        }
      })
    })

  }, [])

  return (
    <>
      <group ref={parallaxGroup}>
        <primitive object={model.scene} position={[0.12, -0.6, 0.05]} rotation={[0, Math.PI / 4.9, 0]} />
      </group>
      <directionalLight position={[0, 5, 5]} intensity={10} color={0xffffff} />
    </>
  )
}

export default Dog