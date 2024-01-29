import React, { useState, Component } from 'react'
import { Node, Spring, Cloth } from './Physics';
import { Scene, PerspectiveCamera, Vector3, WebGLRenderer, HemisphereLight, PlaneGeometry, MeshStandardMaterial, Mesh, ShaderMaterial } from 'three';


export class SceneManager {
    constructor(n, m) {
        this.initializeScene();
        console.log(`Creating cloth with ${n} x ${m} nodes`);
    }

    initializeScene() {
        // 씬 생성
        this.scene = new Scene();   

        // 카메라 생성
        this.camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 15, 50); // 적절한 위치 설정
        this.camera.lookAt(0, 0, 0);

        // 렌더러 생성
        this.renderer = new WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        // 바닥 생성
        this.createFloor();

        // 조명 추가
        const light = new HemisphereLight(0xffffbb, 0x080820, 1);
        this.scene.add(light);
    }

    createFloor() {
        //체커보드 쉐이더
        const vertexShader = /* glsl */ `
  void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
        const fragmentShader = /* glsl */ `
  void main() {
    float checker = mod(floor(gl_FragCoord.x / 10.0) + floor(gl_FragCoord.y / 10.0), 2.0);
    gl_FragColor = checker > 0.5 ? vec4(1, 1, 1, 1) : vec4(0, 0, 0, 1);
  }
`;
        // 지오메트리 및 쉐이더 재질 생성
        const geometry = new PlaneGeometry(75, 75);
        const material = new ShaderMaterial({
            vertexShader,
            fragmentShader
        });

        // 메시 생성 및 씬에 추가
        const planeMesh = new Mesh(geometry, material);
        planeMesh.rotation.x = -Math.PI / 2; 
        this.scene.add(planeMesh);
    }

    startSimulation(simulationType){
        console.log("start :", simulationType);
    }

    render() {
        requestAnimationFrame(() => this.render());
        this.renderer.render(this.scene, this.camera);
    }

    start() {
        this.render();
    }

}