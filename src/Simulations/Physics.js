import React, { Component } from 'react';
import { SphereGeometry, MeshBasicMaterial, Mesh, Vector3 } from 'three';

export class Node {
  constructor(pos = new Vector3(), vel = new Vector3(), acc = new Vector3()) {
    this.pos = pos;
    this.vel = vel;
    this.acc = acc;
    this.type = "particle";
    this.fixed = false;

    const geometry = new SphereGeometry(0.5, 32, 32); // 반지름이 0.5인 구
    const material = new MeshBasicMaterial({ color: 0xff0000 });
    this.mesh = new Mesh(geometry, material);

    this.mesh.position.copy(this.pos);
  }

  collisionCheck() {
    if (this.pos.y < 0.0) {
      // 속도를 반대 방향으로 조정하고, 감쇠 적용
      this.vel.multiplyScalar(-0.9);
  
      // 바닥에 닿았을 때의 위치 조정
      this.pos.y = 0.0; // 예를 들어, 바닥의 y 위치가 0.0이라고 가정
      // 필요하다면 x, z 위치도 조정할 수 있습니다.
    }
  }
  

  update(dt) {    
    // 속도 업데이트
    this.vel.add(this.acc.clone().multiplyScalar(dt));
    // 위치 업데이트
    const displacement = this.vel.clone().multiplyScalar(dt)
      .add(this.acc.clone().multiplyScalar(0.5 * Math.pow(dt, 2)));
    this.pos.add(displacement);

    this.collisionCheck();

    // 메시의 위치 업데이트
    this.mesh.position.copy(this.pos);
  }

}

export class Spring {
  constructor(n1 = new Node(), n2 = new Node()) {
    this.first = n1;
    this.second = n2;
    this.type = "structural";
  }
  calculationForce(ks, kd, mRestLen) {
    var pos1 = this.first.pos;
    var pos2 = this.second.pos;
    var vel1 = this.first.vel;
    var vel2 = this.second.vel;

    // 위치 방향 및 속도 방향 계산
    var posDirection = new Vector3().subVectors(pos2, pos1);
    var velDirection = new Vector3().subVectors(vel2, vel1);

    // 방향 정규화
    var forceDirection = posDirection.clone().normalize();

    // 길이 계산
    var len = posDirection.length(); // three.js의 length 메서드를 사용

    // 스프링 힘과 감쇠 계산
    var spforce = (len - mRestLen) * ks;
    var damp = velDirection.dot(forceDirection) / len * kd;

    // 최종 스프링 힘 계산
    var nSPF = forceDirection.multiplyScalar(spforce + damp).divideScalar(len);

    // 결과 출력
    console.log(nSPF);

    return nSPF; // 최종 힘 벡터 반환
  }
}

export class Cloth {
  constructor(N, M) {
    this.N = N; // 가로 방향 노드 수
    this.M = M; // 세로 방향 노드 수
    this.nodes = []; // 모든 노드를 저장할 배열
    this.springs = []; // 모든 스프링을 저장할 배열

    this.createNodes();
    this.createSprings();
  }

  createNodes() {
    // N * M 그리드의 노드를 생성하는 로직
    for (let i = 0; i < this.N; i++) {
      for (let j = 0; j < this.M; j++) {
        // 여기서 노드의 위치를 계산하고 생성해야 합니다.
        // 예: new Node(new THREE.Vector3(x, y, z));
        const node = new Node(new Vector3(0.0, 0.0, 0.0), new Vector3(0.0, 0.0, 0.0), new Vector3(0.0, 0.0, 0.0)); // 위치 계산 후 Node 생성
        this.nodes.push(node);
      }
    }
  }

  createSprings() {
    // 노드 사이의 스프링을 생성하는 로직
    // 구조적(structural), 전단(shear), 굽힘(bending) 스프링을 생성해야 합니다.
    // 예: new Spring(node1, node2);
  }

  // Cloth 모델의 업데이트 로직, 물리 시뮬레이션 등
  update(dt) {
    // 여기에 시뮬레이션 업데이트 로직 구현
  }
}