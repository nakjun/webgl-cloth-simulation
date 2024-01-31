import { Node, Cloth } from './Physics';
import { Scene, PerspectiveCamera, Vector3, WebGLRenderer, HemisphereLight, PlaneGeometry, MeshStandardMaterial, Mesh, ShaderMaterial } from 'three';
import GUI from 'lil-gui';

const camera_pos_x = 0.0;
const camera_pos_y = 20.0;
const camera_pos_z = 150.0;

export class SceneManager {
    constructor(n, m) {

        this.stats = {
            fps: 0
        };

        this.frameCount = 0;
        this.totalDeltaTime = 0;
        this.lastTime = 0;

        this.current_type = "empty";

        this.initializeScene();
        this.setupGUI();

        this.child_index_src = this.scene.children.length;

        /* Particle Simulation */
        this.particle_size = 10;
        this.x_min = -5;
        this.x_max = 5;
        this.z_min = -5;
        this.z_max = 5;
        this.y_min = 5;
        this.particles = []

        /* Cloth Simulation */
        this.n_size = 8;
        this.m_size = 8;
        this.x_size = 50;
        this.y_size = 50;                

        console.log(`Creating cloth with ${n} x ${m} nodes`);
    }

    clearRange(startIndex, endIndex) {
        // endIndex는 배열 길이보다 클 수 없으며, startIndex는 음수가 될 수 없습니다.
        endIndex = Math.min(endIndex, this.scene.children.length);
        startIndex = Math.max(startIndex, 0);
    
        // 역순으로 삭제하여 인덱스 문제를 방지
        for (let i = endIndex - 1; i >= startIndex; i--) {
          const object = this.scene.children[i];
          this.scene.remove(object);
    
          // 필요한 경우 메모리 해제
          if (object.geometry) {
            object.geometry.dispose();
          }
          if (object.material) {
            if (object.material instanceof Array) {
              object.material.forEach(material => material.dispose());
            } else {
              object.material.dispose();
            }
          }
        }
      }
    

    clear(){
        this.particle_size = 10;
        this.x_min = -5;
        this.x_max = 5;
        this.z_min = -5;
        this.z_max = 5;
        this.y_min = 5;
        this.particles = []

        this.n_size = 8;
        this.m_size = 8;
        this.x_size = 50;
        this.y_size = 50;

        this.current_type = "empty";

        this.clearRange(this.child_index_src,this.child_index_dst);
        this.cloth_model = null;
        this.initGUI();
    }

    setupGUI() {
        const gui = new GUI({
            container: document.body,
            autoPlace: false // 기본 위치 배치 사용 안함
        });
        gui.title("Performance");
        gui.domElement.style.position = 'absolute';
        gui.domElement.style.top = '0px';
        gui.domElement.style.left = '0px';

        gui.add(this.stats, 'fps').name('FPS').listen();

    }

    initializeScene() {
        // 씬 생성
        this.scene = new Scene();

        // 카메라 생성
        this.camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(camera_pos_x, camera_pos_y, camera_pos_z); // 적절한 위치 설정
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
        const geometry = new PlaneGeometry(200, 200);
        const material = new ShaderMaterial({
            vertexShader,
            fragmentShader
        });

        // 메시 생성 및 씬에 추가
        const planeMesh = new Mesh(geometry, material);
        planeMesh.rotation.x = -Math.PI / 2;
        this.scene.add(planeMesh);
    }

    initGUI(){
        if (this.gui) {
            this.gui.destroy();
        }

        this.gui = new GUI({
            container: document.body,
            autoPlace: false
        });
    }

    startSimulation(simulationType) {
        this.initGUI();
        console.log(simulationType);
        this.current_type = simulationType;
        if (simulationType === "particle") {
            this.gui.title("Particle Settings");
            this.gui.domElement.style.position = 'absolute';
            this.gui.domElement.style.top = '80px';
            this.gui.domElement.style.left = '0px';

            const particleSettings = { 'number of particles': 10, 'x_min': -5, 'x_max': 5, 'z_min': -5, 'z_max': 5, 'y_min': 5 }; // 기본값 설정            
            const particleActions = {
                createParticles: () => this.createParticles()
            };
            this.gui.add(particleSettings, 'number of particles', 1, 10000).step(1).name('Particles').onChange(value => {
                this.particle_size = value;
            });
            this.gui.add(particleSettings, 'x_min', -50, -5).step(1).name('X Min').onChange(value => {
                this.x_min = value;
            });
            this.gui.add(particleSettings, 'x_max', 5, 50).step(1).name('X Max').onChange(value => {
                this.x_max = value;
            });
            this.gui.add(particleSettings, 'z_min', -50, -5).step(1).name('Z Min').onChange(value => {
                this.z_min = value;
            });
            this.gui.add(particleSettings, 'z_max', 5, 50).step(1).name('Z Max').onChange(value => {
                this.z_max = value;
            });
            this.gui.add(particleSettings, 'y_min', 5, 50).step(1).name('Y Min').onChange(value => {
                this.y_min = value;
            });
            this.gui.add(particleActions, 'createParticles').name('Create Particles');

        } else {
            this.gui.title("Cloth Settings");
            this.gui.domElement.style.position = 'absolute';
            this.gui.domElement.style.top = '80px';
            this.gui.domElement.style.left = '0px';

            const clothSettings = { 'cloth N': 8, 'cloth M': 8, 'x Size':30, 'y Size':30, 'Stiffness':500, 'Damping':0.001, 'line fix':false }; // 기본값 설정
            this.gui.add(clothSettings, 'cloth N', 1, 100000).step(1).onChange(value => {                
                this.n_size = value;
            });
            this.gui.add(clothSettings, 'cloth M', 1, 100000).step(1).onChange(value => {                
                this.m_size = value;
            });
            this.gui.add(clothSettings, 'x Size', 10, 50).step(1).onChange(value => {                
                this.x_size = value;
            });
            this.gui.add(clothSettings, 'y Size', 10, 50).step(1).onChange(value => {                
                this.y_size = value;
            });
            this.gui.add(clothSettings, 'Stiffness', 10, 10000).step(1).onChange(value => {                
                if(this.cloth_model)
                {
                    this.cloth_model.ks = value;
                }
            });
            this.gui.add(clothSettings, 'Damping', 0.0001, 10.0).step(0.0001).onChange(value => {                
                if(this.cloth_model)
                {
                    this.cloth_model.kd = value;
                }
            });
            
            
            const particleActions = {
                createCloth: () => this.createCloth()
            };
            this.gui.add(particleActions, 'createCloth').name('Create Cloth');
        }
    }

    createCloth(){
        console.log("create cloth function");        
        this.cloth_model = new Cloth(this.n_size, this.m_size, this.x_size, this.y_size);
        for(let i=0;i<this.cloth_model.nodes.length;i++){
            this.scene.add(this.cloth_model.nodes.at(i).mesh);
        }
        for(let i=0;i<this.cloth_model.springs.length;i++){
            this.scene.add(this.cloth_model.springs.at(i).mesh);
        }
        this.current_type = "cloth";
        this.child_index_dst = this.scene.children.length;

        const clothSettings = {'line fix':false};

        this.gui.add(clothSettings, 'line fix').onChange(value => {                
            if(this.cloth_model)
            {
                this.cloth_model.line_fix = value;
                this.cloth_model.updateNodeStatus();
            }
        });

        this.test = 0;
    }

    createParticles() {
        console.log("create particle function");
        console.log(this.particle_size);
        
        for (let i = 0; i < this.particle_size; i++) {
            const pos = new Vector3(
                Math.random() * (this.x_max - this.x_min) + this.x_min,
                Math.random() * (30 - this.y_min) + this.y_min,    // Y 좌표: 0 ~ 10 범위 내 랜덤
                Math.random() * (this.z_max - this.z_min) + this.z_min
            );
            const node = new Node(pos, new Vector3(), new Vector3());
            this.particles.push(node);
            this.scene.add(node.mesh);
        }
        this.current_type = "particle";
        this.child_index_dst = this.scene.children.length;
    }

    render() {
        requestAnimationFrame((time) => this.updateFPSAndRender(time));
    }

    updateFPSAndRender(time) {        
        const deltaTime = (time - this.lastTime) / 1000;
        this.totalDeltaTime += deltaTime;
        this.frameCount++;

        if (this.totalDeltaTime >= 1.0) {
            this.stats.fps = this.frameCount / this.totalDeltaTime;
            this.totalDeltaTime = 0;
            this.frameCount = 0;
        }

        // 모든 파티클 업데이트
        if (this.current_type === "particle") {            
            for (const node of this.particles) {
                node.update(0.01);
            }
        }
        else {
            if(this.cloth_model)
            {
                this.cloth_model.update(0.01);
                this.test++;
            }
        }

        this.lastTime = time;
        this.renderer.render(this.scene, this.camera);
        requestAnimationFrame((time) => this.updateFPSAndRender(time));
    }

    start() {
        this.render();
    }

}