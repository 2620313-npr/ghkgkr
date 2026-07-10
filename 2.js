let pipetteInstance = null;
let isExperimentRunning = false; 

document.addEventListener("DOMContentLoaded", () => {
    // 1. URL 파라미터 오차값 처리
    const urlParams = new URLSearchParams(window.location.search);
    let accumulatedError = parseFloat(urlParams.get('error') || 0);
    
    const errorDisplay = document.getElementById('errorVal');
    errorDisplay.innerText = accumulatedError.toFixed(3);

    // 2. DOM 요소 가져오기
    const ws = document.getElementById("workspace");
    const startBtn = document.getElementById("startBtn");
    const timerDisplay = document.getElementById("timerDisplay");
    const statusField = document.getElementById("statusField");
    const nextStepBtn = document.getElementById("nextStepBtn");
    
    const theoryDisplay = document.getElementById("theoryVolume");
    const actualDisplay = document.getElementById("actualVolume");

    // 이론값은 25.00ml 고정
    theoryDisplay.innerText = "25.00ml";

    let startTime = 0;
    let elapsedTime = 0;
    let timerInterval = null;
    let co2Interval = null;

    // 3. 뷰렛 및 비커 생성 (초기값 연동 배치)
    const pipette1 = new Pipette(ws, 180, 140, actualDisplay);
    const beaker1 = new Beaker(ws, 380, 160);

    // 시간 변환 함수
    function formatTime(ms) {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        const centiseconds = Math.floor((ms % 1000) / 10);
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`;
    }

    // 실험 시작 버튼 제어
    startBtn.addEventListener("click", () => {
        if (!isExperimentRunning) {
            isExperimentRunning = true;
            startBtn.innerText = "실험 중단";
            startBtn.classList.add("running");
            statusField.innerText = "동적 상태 (CO₂ 반응 중)";
            statusField.className = "status-dynamic";
            
            pipette1.el.classList.remove("locked");
            beaker1.el.classList.remove("locked");

            startTime = Date.now() - elapsedTime;
            timerInterval = setInterval(() => {
                elapsedTime = Date.now() - startTime;
                timerDisplay.innerText = formatTime(elapsedTime);
            }, 10);

            // 1초마다 실시간 CO2 오차 누적
            co2Interval = setInterval(() => {
                if (Math.random() < 0.2) {
                    accumulatedError += (0.05 + Math.random() * 0.15);
                    errorDisplay.innerText = accumulatedError.toFixed(3);
                }
            }, 1000);
        } else {
            isExperimentRunning = false;
            startBtn.innerText = "실험 재개";
            startBtn.classList.remove("running");
            statusField.innerText = "정지 상태";
            statusField.className = "status-static";
            
            pipette1.el.classList.add("locked");
            beaker1.el.classList.add("locked");
            pipette1.stopFlow();
            beaker1.stopPouring();

            clearInterval(timerInterval);
            clearInterval(co2Interval);
        }
    });

    if (nextStepBtn) {
        nextStepBtn.addEventListener("click", (e) => {
            e.preventDefault();
            clearInterval(timerInterval);
            clearInterval(co2Interval);
            window.location.href = `3.html?error=${accumulatedError.toFixed(3)}`;
        });
    }
});

// ==========================================
// [물리 엔진] 1. 뷰렛 클래스
// ==========================================
class Pipette {
    constructor(container, initialX, initialY, sidebarDisplay) {
        this.container = container;
        this.sidebarDisplay = sidebarDisplay; // 우측 패널 연동용 DOM

        // 내부 물리 수치 설계 (0 ~ 100 스케일 구조화)
        // 최대치 35ml 기준: 100% = 35ml
        this.volume = 0; 
        this.cockAngle = 0;
        this.isDraggingCock = false;
        this.flowInterval = null;

        this.isAirExpelled = false; 
        this.tipVolume = 0;         

        this.posX = initialX;
        this.posY = initialY;
        this.isDragging = false;

        this.createDOM();
        this.initEvents();
        this.update();
        
        this.el.classList.add("locked");
        pipetteInstance = this;
    }

    createDOM() {
        this.el = document.createElement("div");
        this.el.className = "pipette";
        this.el.style.left = `${this.posX}px`;
        this.el.style.top = `${this.posY}px`;

        this.el.innerHTML = `
            <div class="body">
                <div class="body-bg"></div>
                <div class="scale">
                    <div class="scale-line"></div>
                    <div class="scale-line"><span>0</span></div>
                    <div class="scale-line"><span>1</span></div>
                    <div class="scale-line"><span>2</span></div>
                </div>
                <div class="liquid-container">
                    <div class="liquid"></div>
                </div>
            </div>
            <div class="tip">
                <div class="tip-liquid"></div>
            </div>
            <div class="burette-cock">
                <div class="cock-center"></div>
            </div>
            <div class="drop"></div>
            <div class="status">
                <span class="volumeText">0.00ml</span> (<span class="angleText">0°</span>)
                <span class="airStatus" style="color: #ff5252; font-size: 11px; display: block; margin-top: 2px;">[공기 차있음]</span>
            </div>
        `;

        this.container.appendChild(this.el);

        this.dom = {
            liquid: this.el.querySelector(".liquid"),
            tipLiquid: this.el.querySelector(".tip-liquid"),
            cock: this.el.querySelector(".burette-cock"),
            drop: this.el.querySelector(".drop"),
            volumeText: this.el.querySelector(".volumeText"),
            angleText: this.el.querySelector(".angleText"),
            airStatus: this.el.querySelector(".airStatus")
        };
    }

    initEvents() {
        this.el.addEventListener("pointerdown", (e) => {
            if (!isExperimentRunning) return;
            if (e.target.closest(".burette-cock")) return;
            this.isDragging = true;
            this.startX = e.clientX - this.posX;
            this.startY = e.clientY - this.posY;
            this.el.setPointerCapture(e.pointerId);
            e.preventDefault();
        });

        this.el.addEventListener("pointermove", (e) => {
            if (!this.isDragging) return;
            this.posX = e.clientX - this.startX;
            this.posY = e.clientY - this.startY;
            this.el.style.left = `${this.posX}px`;
            this.el.style.top = `${this.posY}px`;
        });

        const handlePointerUp = (e) => {
            if (this.isDragging) {
                this.isDragging = false;
                this.el.releasePointerCapture(e.pointerId);
            }
        };
        this.el.addEventListener("pointerup", handlePointerUp);
        this.el.addEventListener("pointercancel", handlePointerUp);

        // 콕 제어
        const handleCockMove = (e) => {
            if (!this.isDraggingCock) return;
            const rect = this.dom.cock.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            const angleRad = Math.atan2(e.clientY - centerY, e.clientX - centerX);
            let angleDeg = angleRad * (180 / Math.PI);
            if (angleDeg < 0) angleDeg += 360;

            this.cockAngle = Math.round(angleDeg % 180);
            this.dom.cock.style.transform = `translateX(-50%) rotate(${this.cockAngle}deg)`;
            this.dom.angleText.innerText = `${this.cockAngle}°`;

            this.updateFlow();
        };

        const handleCockUp = () => {
            if (this.isDraggingCock) {
                this.isDraggingCock = false;
                window.removeEventListener("mousemove", handleCockMove);
                window.removeEventListener("mouseup", handleCockUp);
            }
        };

        this.dom.cock.addEventListener("mousedown", (e) => {
            if (!isExperimentRunning) return;
            e.stopPropagation();
            this.isDraggingCock = true;
            window.addEventListener("mousemove", handleCockMove);
            window.addEventListener("mouseup", handleCockUp);
        });
    }

    updateFlow() {
        clearInterval(this.flowInterval);
        const flowRatio = Math.sin(this.cockAngle * (Math.PI / 180));

        if (flowRatio < 0.15) return;

        let intervalMs = 600;
        let step = 0.4;       

        if (flowRatio >= 0.15 && flowRatio <= 0.55) {
            intervalMs = 500;
            step = 0.35;
        } else if (flowRatio > 0.55 && flowRatio <= 0.85) {
            intervalMs = 200;
            step = 0.75;
        } else if (flowRatio > 0.85) {
            intervalMs = 35;  
            step = 1.65; // 와르르 흐름
        }

        this.flowInterval = setInterval(() => {
            if (flowRatio > 0.85 && !this.isAirExpelled && this.volume > 0) {
                this.isAirExpelled = true;
                this.dom.airStatus.innerText = "[기포 제거됨]";
                this.dom.airStatus.style.color = "#4caf50";
            }

            if (this.volume <= 0) {
                this.volume = 0;
                if (this.isAirExpelled) {
                    this.tipVolume -= step;
                    if (this.tipVolume < 0) this.tipVolume = 0;
                }
                clearInterval(this.flowInterval);
                this.update();
                return;
            }

            this.volume -= step;
            if (this.isAirExpelled) {
                this.tipVolume = Math.min(20, this.volume);
            }

            this.update();
            this.createDrop();
        }, intervalMs);
    }

    // [억까 로직 탑재] 비커 용액 공급 함수
    receiveLiquid(amount) {
        const flowRatio = Math.sin(this.cockAngle * (Math.PI / 180));

        if (flowRatio > 0.15) {
            this.createDrop();
            if (flowRatio > 0.85 && !this.isAirExpelled) {
                this.isAirExpelled = true;
                this.dom.airStatus.innerText = "[기포 제거됨]";
                this.dom.airStatus.style.color = "#4caf50";
            }
            return;
        }

        if (this.volume >= 100) {
            this.volume = 100;
            return;
        }

        // 받아온 양에 난수를 섞어 소수점 아래 조작 억까 발생시킴
        const jitter = (Math.random() - 0.5) * 0.45; 
        this.volume += Math.max(0.1, amount + jitter);

        if (this.volume > 100) this.volume = 100;

        if (this.isAirExpelled) {
            this.tipVolume = 20;
        } else {
            this.tipVolume = 0;
        }

        this.update();
    }

    stopFlow() {
        clearInterval(this.flowInterval);
    }

update() {
        // 전체 100% 중 몸통과 팁의 비주얼 비율 계산
        let bodyPercent = (this.volume / 100) * 100;
        let tipPercent = (this.tipVolume / 20) * 100;

        this.dom.liquid.style.height = bodyPercent + "%";
        this.dom.tipLiquid.style.height = tipPercent + "%";

        // [변경] 현재 뷰렛 내부의 실제 물리적 액체 부피 (최대 35.00ml)
        let actualPhysicalMl = (this.volume / 100) * 35.0;

        // [핵심 공식 수정] 실제 물이 30ml 찼을 때 눈금 판독값(수정값)이 25ml가 되도록 보정 (-5.00ml 오프셋)
        let displayMl = actualPhysicalMl - 5.00;
        if (displayMl < 0) displayMl = 0; // 음수 방지

        // [패널티] 공기가 아직 안 빠졌다면, 팁 부피(6ml 분량)만큼 강제 판독 손실 발생
        if (!this.isAirExpelled) {
            displayMl = Math.max(0, displayMl - 6.00);
        }

        // 최종 문자열 포맷팅 (소수점 둘째 자리)
        const outputString = displayMl.toFixed(2) + "ml";
        
        // 뷰렛 옆 상태 말풍선 업데이트
        this.dom.volumeText.innerText = outputString;
        
        // 우측 감시 패널의 [실제 측정치] 실시간 동기화
        if (this.sidebarDisplay) {
            this.sidebarDisplay.innerText = outputString;
        }
    }
    createDrop() {
        this.dom.drop.style.opacity = 1;
        this.dom.drop.style.top = "420px";
        let y = 420;
        const t = setInterval(() => {
            y += 15;
            this.dom.drop.style.top = y + "px";
            if (y > 530) {
                clearInterval(t);
                this.dom.drop.style.opacity = 0;
            }
        }, 16);
    }
}

// ==========================================
// [물리 엔진] 2. 비커 클래스
// ==========================================
class Beaker {
    constructor(container, initialX, initialY) {
        this.container = container;
        this.posX = initialX;
        this.posY = initialY;
        this.isDragging = false;
        this.pourTimer = null;
        this.isPouring = false;

        this.createDOM();
        this.initEvents();
        this.el.classList.add("locked");
    }

    createDOM() {
        this.el = document.createElement("div");
        this.el.className = "beaker";
        this.el.style.left = `${this.posX}px`;
        this.el.style.top = `${this.posY}px`;

        this.el.innerHTML = `
            <div class="beaker-glass">
                <div class="beaker-liquid"></div>
                <div class="beaker-label">NaOH + 증류수</div>
            </div>
        `;
        this.container.appendChild(this.el);
    }

    initEvents() {
        this.el.addEventListener("pointerdown", (e) => {
            if (!isExperimentRunning) return;
            this.isDragging = true;
            this.startX = e.clientX - this.posX;
            this.startY = e.clientY - this.posY;
            this.el.setPointerCapture(e.pointerId);
            e.preventDefault();
        });

        this.el.addEventListener("pointermove", (e) => {
            if (!this.isDragging) return;
            
            this.posX = e.clientX - this.startX;
            this.posY = e.clientY - this.startY;
            this.el.style.left = `${this.posX}px`;
            this.el.style.top = `${this.posY}px`;

            this.checkPourCondition();
        });

        const handleUp = (e) => {
            if (this.isDragging) {
                this.isDragging = false;
                this.el.releasePointerCapture(e.pointerId);
                this.stopPouring();
            }
        };

        this.el.addEventListener("pointerup", handleUp);
        this.el.addEventListener("pointercancel", handleUp);
    }

    checkPourCondition() {
        if (!pipetteInstance) return;

        const bRect = pipetteInstance.el.getBoundingClientRect();
        const targetX = bRect.left + 70;
        const targetY = bRect.top + 60;

        const beakerRect = this.el.getBoundingClientRect();
        const spoutX = beakerRect.left + 10;
        const spoutY = beakerRect.top + 10;

        const distance = Math.hypot(targetX - spoutX, targetY - spoutY);

        if (distance < 60) {
            this.startPouring();
        } else {
            this.stopPouring();
        }
    }

    startPouring() {
        if (this.isPouring) return;
        this.isPouring = true;

        this.pourTimer = setInterval(() => {
            if (!pipetteInstance) return;
            // 기본 부피 단위 2.0 베이스에 지터 난수가 내부에서 연산됨
            pipetteInstance.receiveLiquid(2.0);
        }, 40);
    }

    stopPouring() {
        if (!this.isPouring) return;
        this.isPouring = false;
        clearInterval(this.pourTimer);
        this.pourTimer = null;
    }
}
