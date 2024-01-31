import React, { Component } from 'react';
import { SphereGeometry, MeshBasicMaterial, Mesh, BufferGeometry, BufferAttribute, Line, LineBasicMaterial, Vector3, Scene } from 'three';

export class Node {
  constructor(pos = new Vector3(), vel = new Vector3(), acc = new Vector3()) {
    this.pos = pos;
    this.vel = vel;
    this.acc = acc;
    this.force = new Vector3();
    this.mass = 1.0;
    this.type = "particle";
    this.fixed = false;

    this.gravity = new Vector3(0.0, -9.8, 0.0);

    const geometry = new SphereGeometry(0.5, 32, 32); // 반지름이 0.5인 구
    const material = new MeshBasicMaterial({ color: 0xff0000 });
    this.mesh = new Mesh(geometry, material);
    this.mesh.position.copy(this.pos);
    
  }

  changeColor(material) {
    this.mesh.material = material;
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

  clearForce(){
    this.force = new Vector3();
  }

  applyExternalForce(force){
    if (this.fixed) return;
    this.force.x += force.x;
    this.force.y += force.y;
    this.force.z += force.z;
  }

  update(dt) {

    if (this.fixed === true) return;

    // 속도 업데이트
    this.force = this.force.divideScalar(this.mass);
    this.force.add(this.gravity);    
    this.vel.add(this.force.multiplyScalar(dt));
    // 위치 업데이트
    //const displacement = this.vel.clone().multiplyScalar(dt);    
    this.pos.add(this.vel.clone().multiplyScalar(dt));
    //this.pos.add(this.vel.clone().multiplyScalar(dt).add(this.acc.clone().multiplyScalar(0.5 * Math.pow(dt, 2))));
    // 충돌처리
    this.collisionCheck();
    // 메시의 위치 업데이트
    this.mesh.position.copy(this.pos);
  }

}

export class Spring {
  constructor(n1 = new Node(), n2 = new Node(), ks, kd, type) {
    this.first = n1;
    this.second = n2;
    this.type = type;

    this.ks = ks;
    this.kd = kd;

    this.mRestLen = this.first.pos.distanceTo(this.second.pos);
  }

  createMesh(lineColor) {
    const points = [];
    points.push(this.first.pos);
    points.push(this.second.pos);

    this.lineColor = lineColor

    const geometry = new BufferGeometry().setFromPoints(points);
    const material = new LineBasicMaterial({ color: this.lineColor });

    const line = new Line(geometry, material);
    this.mesh = line;
  }

  updateMesh() {
    const positions = this.mesh.geometry.attributes.position.array;

    // 첫 번째 노드의 위치를 업데이트
    positions[0] = this.first.pos.x;
    positions[1] = this.first.pos.y;
    positions[2] = this.first.pos.z;
  
    // 두 번째 노드의 위치를 업데이트
    positions[3] = this.second.pos.x;
    positions[4] = this.second.pos.y;
    positions[5] = this.second.pos.z;
  
    // 위치 데이터가 변경되었음을 알립니다.
    this.mesh.geometry.attributes.position.needsUpdate = true;
  
    // const positions = new Float32Array([
    //   this.first.pos.x, this.first.pos.y, this.first.pos.z,
    //   this.second.pos.x, this.second.pos.y, this.second.pos.z
    // ]);

    // // 기존 지오메트리의 'position' 속성을 업데이트
    // this.mesh.geometry.setAttribute('position', new BufferAttribute(positions, 3));
    // this.mesh.geometry.attributes.position.needsUpdate = true; // 중요: 업데이트 플래그 설정    
  }

  update(){
    // 스프링 힘 계산 및 적용    
    this.applyForce(this.calculationForce());
    // 스프링 메시 업데이트
    this.updateMesh();
  }

  applyForce(force){

    let f = new Vector3(force.x, force.y, force.z);    

    this.first.applyExternalForce(f);
    this.second.applyExternalForce(f.clone().negate());
  }

  calculationForce() {
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
    var spforce = (len - this.mRestLen) * this.ks;    
    var damp = velDirection.dot(forceDirection) / len * this.kd;    

    // 최종 스프링 힘 계산
    var nSPF = forceDirection.multiplyScalar(spforce + damp).divideScalar(len);    
    return new Vector3(nSPF.x,nSPF.y,nSPF.z); // 최종 힘 벡터 반환
  }
}

export class Cloth {
  constructor(N, M, x_size, y_size) {
    this.N = N; // 가로 방향 노드 수
    this.M = M; // 세로 방향 노드 수
    this.x_size = x_size;
    this.y_size = y_size;
    this.nodes = []; // 모든 노드를 저장할 배열
    this.springs = []; // 모든 스프링을 저장할 배열

    this.ks = 300.0;
    this.kd = 0.001;

    this.createNodes();
    this.createSprings();
  }  

  createNodes() {
    // N * M 그리드의 노드를 생성하는 로직
    const start_x = -(this.x_size / 2.0);
    const start_y = 70.0;

    const dist_x = (this.x_size / this.N);
    const dist_y = (this.y_size / this.M);

    for (let i = 0; i < this.N; i++) {
      for (let j = 0; j < this.M; j++) {
        // 여기서 노드의 위치를 계산하고 생성해야 합니다.
        // 예: new Node(new THREE.Vector3(x, y, z));
        var node = new Node(new Vector3(start_x + (dist_x * j), start_y - (dist_y * i), 0.0), new Vector3(0.0, -9.8, 0.0), new Vector3(0.0, 0.0, 0.0)); // 위치 계산 후 Node 생성        
        const material = new MeshBasicMaterial({ color: 0xffffff });
        node.changeColor(material);
        this.nodes.push(node);
      }
    }
    this.nodes.at(0).fixed = true;
    this.nodes.at(this.N-1).fixed = true;
    console.log("create node success");
  }

  createSprings() {
    // 노드 사이의 스프링을 생성하는 로직

    let index = 0;
    // 1. Structural 세로
    for(let i =0; i<this.M; i++)
    {
      for(let j=0;j<(this.N-1);j++)
      {
        if(i>0 && j===0) index++;        
        let spring = new Spring(this.nodes.at(index),this.nodes.at(index+1),this.ks,this.kd,"structural");        
        index++;
        this.springs.push(spring); 
        spring.createMesh(0xff0000);
      }
    }
    // 2. Structural 가로
    for(let i=0;i<(this.M-1);i++)
    {
      for(let j=0;j<this.N;j++)
      {
        ++index;
        let spring = new Spring(this.nodes.at(this.N*i + j),this.nodes.at(this.N*i + j + this.N),this.ks,this.kd,"structural");        
        this.springs.push(spring); 
        spring.createMesh(0xff0000);
      }
    }
    // 3. Shear 우상좌하
    index = 0;
    for(let i=0;i<(this.N) * (this.M - 1);i++)
    {
      if(i%this.N === (this.N-1)){
        index++;
        continue;
      }
      let spring = new Spring(this.nodes.at(index),this.nodes.at(index+this.N+1),this.ks,this.kd,"shear");        
      this.springs.push(spring); 
      spring.createMesh(0x00ff00);
      index++;
    }
    // 4. Shear 좌상우하
    index = 0;
    for(let i=0;i<(this.N)*(this.M-1);i++)
    {
      if(i%this.N === 0){
        index++;
        continue;
      }
      let spring = new Spring(this.nodes.at(index),this.nodes.at(index+this.N-1),this.ks,this.kd,"shear");        
      this.springs.push(spring); 
      spring.createMesh(0x00ff00);
      index++;
    }
    // 5. Bending 가로
    index = 0;
    for (let i = 0; i < (this.N) * this.M; i++) {
      if (i % this.N > this.N - 3) {
        index++;
        continue;
      }
      let spring = new Spring(this.nodes.at(index), this.nodes.at(index + 2), this.ks, this.kd, "bending");
      this.springs.push(spring);
      spring.createMesh(0x0000ff);
      index++;
    }
    //6. Bending 세로
    for (let i = 0; i < this.N; i++) {
      for (let j = 0; j < this.M - 3; j++) {
        let spring = new Spring(this.nodes.at(i + (j*this.M)), this.nodes.at(i + (j+3)*this.M), this.ks, this.kd, "bending");
        this.springs.push(spring);
        spring.createMesh(0x0000ff);
      }
    }
    console.log("#", this.springs.length, " spring initialize success");
  }

  // Cloth 모델의 업데이트 로직, 물리 시뮬레이션 등
  update(dt) {
    // 여기에 시뮬레이션 업데이트 로직 구현
    for (const node of this.nodes) {
      node.clearForce();
    }    
    for (const spring of this.springs){
      spring.update();      
    }
    for (const node of this.nodes) {
      node.update(dt);
    }
  }
}