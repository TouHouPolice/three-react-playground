import './App.scss'
import React, { useState,useRef, Suspense ,useCallback,useEffect} from 'react'
import {OBJLoader} from "three/examples/jsm/loaders/OBJLoader"
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls"
import { Canvas, useFrame,useLoader,extend,useThree } from '@react-three/fiber'
import * as THREE from 'three'
import {FresnelShader} from "three/examples/jsm/shaders/FresnelShader"
import {extendMaterial} from "./plugin/ExtendMaterial.module.js"
import humanobj from "./assets/human.obj?url"

extend({OrbitControls})


let fresnelMaterial=extendMaterial(THREE.MeshPhongMaterial,{
     // Will be prepended to vertex and fragment code

     header: 'varying vec3 vNN; varying vec3 vEye;',


     // Insert code lines by hinting at a existing

     vertex: {
       // Inserts the line after #include <fog_vertex>
       '#include <fog_vertex>': `


         mat4 LM = modelMatrix;
         LM[2][3] = 0.0;
         LM[3][0] = 0.0;
         LM[3][1] = 0.0;
         LM[3][2] = 0.0;

         vec4 GN = LM * vec4(objectNormal.xyz, 1.0);
         vNN = normalize(GN.xyz);
         vEye = normalize(GN.xyz-cameraPosition);`
     },
     fragment: {
       'gl_FragColor = vec4( outgoingLight, diffuseColor.a );' : `

gl_FragColor.rgb +=  (1.0 - -min(dot(vEye, normalize(vNN) ), 0.0)) * vec3(0.00000,0.13333,0.58039);

`
     },


     // Uniforms (will be applied to existing or added)

     uniforms: {
       diffuse: new THREE.Color(0.21569,0.39216,0.98039),
       shininess:30,
       
      
     }

})







let mFresnelShader= {

	uniforms: {
    
  },

	vertexShader: [
	
		"varying vec3 vPositionW;",
		"varying vec3 vNormalW;",

		"void main() {",

		"	vPositionW = vec3( vec4( position, 1.0 ) * modelMatrix);",
		" vNormalW = normalize( vec3( vec4( normal, 0.0 ) * modelMatrix ) );",

		"	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

		"}"

	].join( "\n" ),

	fragmentShader: [
	
		"varying vec3 vPositionW;",
		"varying vec3 vNormalW;",

		"void main() {",
		
		"	vec3 color = vec3(0.17255,0.51373,0.96078);",
		"	vec3 viewDirectionW = normalize(cameraPosition - vPositionW);",
		"	float fresnelTerm = dot(viewDirectionW, vNormalW);",
		"	fresnelTerm = clamp(1.0 - fresnelTerm, 0., 1.);",

		"	gl_FragColor = vec4( color * fresnelTerm, 1.);",

		"}"

	].join( "\n" )

};




function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="App">
      <Canvas>
        <Suspense fallback={null}>
        <Scene/>
        </Suspense>
      </Canvas>
    </div>
  )
}

function Scene(props){
  const obj0=useLoader(OBJLoader,humanobj)
  const {
    camera,
    gl: { domElement }
  } = useThree();

  const [group, setGroup] = useState(undefined);
  const [mesh, setMesh] = useState(undefined);
  //const meshRef=useRef();
  const onGroupRefChange = useCallback(node => {
    if(node){
      setGroup(node);
    }
  }, []);

  useEffect(() => {
    if(group){
      setMesh(group.children[0]);
    }
    
  }, [group]);

  useEffect(() => {
    if(mesh){
      // let standard = THREE.ShaderLib['standard'];
      // const mFresnelMaterial=new THREE.ShaderMaterial({
      //   lights: true,
      //   uniforms: THREE.UniformsUtils.clone(standard.uniforms),
      //   vertexShader:mFresnelShader.vertexShader,
      //   fragmentShader:mFresnelShader.fragmentShader
      // })

      // mFresnelMaterial.uniforms.diffuse.value = new THREE.Color("white");
      // mFresnelMaterial.uniforms.roughness.value = 0;
      // mFresnelMaterial.uniforms.metalness.value = 1;


      // // const shader=FresnelShader;
      // const uniforms = THREE.UniformsUtils.clone( shader.uniforms );

      // const mFresnelMaterial = new THREE.ShaderMaterial( {
      //   uniforms: uniforms,
      //   vertexShader: shader.vertexShader,
      //   fragmentShader: shader.fragmentShader
      // } );

      mesh.material=fresnelMaterial;
      //mesh.material.needsUpdate=true;
      console.log(mesh.material.uniforms);
      // console.log(new THREE.MeshPhongMaterial)
    } 
  }, [mesh]);


  return (<>
    <primitive object={obj0} ref={onGroupRefChange}></primitive>

    {/* <directionalLight rotation={[1,2,1]} intensity={0.8}></directionalLight> */}
    <ambientLight intensity={0.1}></ambientLight>

    <orbitControls args={[camera,domElement]}></orbitControls>
  </>)
}

export default App
