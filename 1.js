class ChemistryExperiment {
    constructor(container, naohBeaker, waterBeaker, flaskEl) {
        this.container = container;
        this.beakerEl = naohBeaker; 
        this.waterBeakerEl = waterBeaker;
        this.flaskEl = flaskEl; 
        
        this.volume = 0; 
        this.flaskVolume = 0; 
        this.accumulatedError = 0; 
        
        this.gearAngle = 0;
        this.filling = false;
        this.dispensing = false;
        this.fillTimer = null;
        this.dispenseTimer = null;
        this.state = "EMPTY";
        this.inBeaker = false;
        this.inFlask = false;

        this.isRunning = false;
        this.startTime = 0;
        this.elapsedTime = 0;
        this.timerInterval = null;
        this.co2Interval = null; 

        // 피펫 좌표 변수 (독립 구동)
        this.posX = 20; this.posY = 140;
        this.isDraggingPipette = false;

        // 증류수 제어 변수
        this.isPouringWater = false;
        this.waterPourTimer = null;

        this.createPipetteDOM();
        this.initPipetteEvents();
        this.initWaterBeakerClickEvents(); // 꾹 누르기 이벤트로 전면 교체
        this.initPanelEvents(); 
        this.update();
    }

    createPipetteDOM() {
        this.el = document.createElement("div");
        this.el.className = "pipette disabled"; 
        this.el.style.left = `${this.posX}px`;
        this.el.style.top = `${this.posY}px`;

        this.el.innerHTML = `
            <div class="piston"></div>
            <div class="control-box"></div>
            <div class="gear"><div class="gear-center"></div></div>
            <div class="lever"></div>
            <div class="body">
                <div class="body-bg"></div>
                <div class="scale"><span></span><span></span><span></span><span></span><span></span></div>
                <div class="liquid-container"><div class="liquid"></div></div>
            </div>
            <div class="tip"><div class="tip-liquid"></div></div>
            <div class="drop"></div>
            <div class="status"><span class="volumeText">LOCKED</span></div>
        `;

        this.container.appendChild(this.el);

        // 💡 [수정 완료] 객체 내부에 nextStepBtn을 올바른 문법으로 포함시켰습니다.
        this.dom = {
            piston: this.el.querySelector(".piston"),
            liquid: this.el.querySelector(".liquid"),
            tipLiquid: this.el.querySelector(".tip-liquid"),
            gear: this.el.querySelector(".gear"),
            lever: this.el.querySelector(".lever"),
            drop: this.el.querySelector(".drop"),
            volumeText: this.el.querySelector(".volumeText"),
            
            startBtn: document.getElementById("startBtn"),
            timerDisplay: document.getElementById("timerDisplay"),
            pipetteVal: document.getElementById("pipetteVal"),
            actualFlaskVal: document.getElementById("actualFlaskVal"),
            errorVal: document.getElementById("errorVal"), 
            flaskLiquid: document.getElementById("flaskLiquid"),
            nextStepBtn: document.getElementById("nextStepBtn") // 👈 정상 등록
        };
    }

    initPipetteEvents() {
        // 피펫 드래그
        this.el.addEventListener("pointerdown", (e) => {
            if (!this.isRunning) return; 
            if (e.target.closest(".gear") || e.target.closest(".lever") || e.target.closest(".piston")) return;
            this.isDraggingPipette = true;
            this.startX = e.clientX - this.posX;
            this.startY = e.clientY - this.posY;
            this.el.setPointerCapture(e.pointerId);
            e.preventDefault();
        });

        this.el.addEventListener("pointermove", (e) => {
            if (!this.isRunning || !this.isDraggingPipette) return;
            this.posX = e.clientX - this.startX;
            this.posY = e.clientY - this.startY;
            this.el.style.left = `${this.posX}px`;
            this.el.style.top = `${this.posY}px`;
            this.checkPipetteCollision();
        });

        const handlePointerUp = (e) => {
            if (this.isDraggingPipette) {
                this.isDraggingPipette = false;
                this.el.releasePointerCapture(e.pointerId);
            }
        };
        this.el.addEventListener("pointerup", handlePointerUp);
        this.el.addEventListener("pointercancel", handlePointerUp);

        // 톱니바퀴 (NaOH 흡입)
        this.dom.gear.addEventListener("mousedown", (e) => {
            e.stopPropagation();
            if (!this.isRunning || !this.inBeaker || this.state === "LAST_DROP" || this.dispensing) return;
            this.filling = true; this.state = "FILLING";
            this.fillTimer = setInterval(() => {
                if (this.volume >= 100) { clearInterval(this.fillTimer); this.filling = false; this.state = "FILLED"; this.update(); return; }
                this.volume += 0.4; if(this.volume > 100) this.volume = 100;
                this.dom.piston.style.transform = `translateY(${-this.volume * 0.9}px)`;
                this.gearAngle += 3; this.dom.gear.style.transform = `rotate(${this.gearAngle}deg)`;
                this.update();
            }, 25);
        });

        window.addEventListener("mouseup", () => { if (this.filling) { clearInterval(this.fillTimer); this.filling = false; if (this.volume > 0) this.state = "FILLED"; this.update(); } });

        // 레버 (NaOH 배출)
        this.dom.lever.addEventListener("mousedown", (e) => {
            e.stopPropagation();
            if (!this.isRunning || this.state !== "FILLED") return;
            this.dispensing = true; this.state = "DISPENSING";
            this.dispenseTimer = setInterval(() => {
                if (this.volume <= 2) { clearInterval(this.dispenseTimer); this.dispensing = false; this.state = "LAST_DROP"; this.update(); return; }
                this.volume -= 0.5;
                if (this.inFlask) { this.flaskVolume += 0.0877; }
                this.createDrop(); this.update();
            }, 30);
        });

        window.addEventListener("mouseup", () => { if (this.dispensing) { clearInterval(this.dispenseTimer); this.dispensing = false; if (this.volume > 2) this.state = "FILLED"; this.update(); } });

        // 피스톤 막방울 클릭
        this.dom.piston.addEventListener("mousedown", (e) => {
            e.stopPropagation();
            if (!this.isRunning || this.state !== "LAST_DROP") return;
            
            this.dom.piston.animate([
                { transform: `translateY(${-100 * 0.9}px)` }, 
                { transform: `translateY(${-100 * 0.9 + 15}px)` }, 
                { transform: `translateY(${-100 * 0.9}px)` }
            ], { duration: 140 });

            setTimeout(() => {
                if (this.inFlask) {
                    let remnant = 0.1754 * this.volume - 1.4912;
                    if (remnant > 0) this.flaskVolume += remnant;
                }
                this.volume = 0; 
                this.createDrop(); 
                this.dom.piston.style.transform = "translateY(0px)"; 
                this.state = "EMPTY"; 
                this.update();
            }, 90);
        });
    }

    initWaterBeakerClickEvents() {
        const startPour = (e) => {
            if (e.type === 'touchstart') {
                this.isTouchMode = true; 
            } else if (e.type === 'mousedown' && this.isTouchMode) {
                return;
            }

            e.preventDefault();
            if (!this.isRunning) return;

            if (!this.isPouringWater) {
                this.isPouringWater = true;
                if (this.waterPourTimer) clearInterval(this.waterPourTimer);
                this.waterBeakerEl.classList.add("beaker-pouring"); 
                
                this.waterPourTimer = setInterval(() => {
                    this.flaskVolume += 0.1; 
                    if (Math.random() < 0.1) {
                        this.accumulatedError += (0.05 + Math.random() * 0.05);
                    }
                    this.update();
                }, 16);
            }
        };

        const stopPour = () => {
            if (this.isPouringWater) {
                this.isPouringWater = false;
                this.waterBeakerEl.classList.remove("beaker-pouring");
                if (this.waterPourTimer) {
                    clearInterval(this.waterPourTimer);
                    this.waterPourTimer = null;
                }
                this.update();
            }
        };

        this.waterBeakerEl.addEventListener("mousedown", startPour);
        window.addEventListener("mouseup", stopPour);
        this.waterBeakerEl.addEventListener("touchstart", startPour, { passive: false });
        window.addEventListener("touchend", stopPour);
        window.addEventListener("touchcancel", stopPour);
    }

    initPanelEvents() {
        this.dom.startBtn.addEventListener("click", () => {
            if (!this.isRunning) {
                this.isRunning = true;
                this.dom.startBtn.innerText = "실험 중단";
                this.dom.startBtn.classList.add("running");
                this.startTime = Date.now() - this.elapsedTime;
                
                this.timerInterval = setInterval(() => {
                    this.elapsedTime = Date.now() - this.startTime;
                    this.dom.timerDisplay.innerText = this.formatTime(this.elapsedTime);
                }, 10);

                this.co2Interval = setInterval(() => {
                    if (Math.random() < 0.2) {
                        let stepError = 0.1 + Math.random() * 0.2;
                        this.accumulatedError += stepError;
                        this.update();
                    }
                }, 1000);

                this.update();
            } else {
                this.isRunning = false;
                this.dom.startBtn.innerText = "실험 재개";
                this.dom.startBtn.classList.remove("running");
                clearInterval(this.timerInterval);
                clearInterval(this.co2Interval); 
                if(this.isPouringWater) {
                    this.isPouringWater = false;
                    this.waterBeakerEl.classList.remove("beaker-pouring");
                    clearInterval(this.waterPourTimer);
                }
                this.isDraggingPipette = false; 
                this.update();
            }
        });

        // 💡 [수정 완료] 넘어가기 버튼 이벤트를 패널 이벤트 영역 내부로 정상 이동시켰습니다.
       if (this.dom.nextStepBtn) {
            this.dom.nextStepBtn.addEventListener("click", () => {
                // 타이머 및 실험 상태 정지
                this.isRunning = false;
                clearInterval(this.timerInterval);
                clearInterval(this.co2Interval);
                if (this.waterPourTimer) clearInterval(this.waterPourTimer);

                // 현재 과정 1에서 쌓인 최종 오차값 추출
                const finalError = this.accumulatedError.toFixed(3);

                // 🎯 [수정 완료] 다음 파일인 2.html로 오차값을 주렁주렁 매달고 이동합니다!
                window.location.href = `2.html?error=${finalError}`;
            });
        }
    }

    formatTime(ms) {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        const centiseconds = Math.floor((ms % 1000) / 10);
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`;
    }

    checkPipetteCollision() {
        if (!this.isRunning) return;
        const tipEl = this.el.querySelector(".tip");
        const tipRect = tipEl.getBoundingClientRect();
        const tipX = tipRect.left + tipRect.width / 2;
        const tipY = tipRect.bottom; 

        const beakerLiqRect = this.beakerEl.querySelector(".beaker-liquid").getBoundingClientRect();
        if (tipX >= beakerLiqRect.left && tipX <= beakerLiqRect.right && tipY >= beakerLiqRect.top && tipY <= beakerLiqRect.bottom) {
            this.inBeaker = true; this.el.classList.remove("disabled"); this.beakerEl.classList.add("active");
        } else {
            this.inBeaker = false; this.beakerEl.classList.remove("active");
        }

        const flaskNeckRect = this.flaskEl.querySelector(".flask-neck").getBoundingClientRect();
        if (tipX >= flaskNeckRect.left && tipX <= flaskNeckRect.right && tipY <= flaskNeckRect.bottom + 40 && tipY >= flaskNeckRect.top - 20) {
            this.inFlask = true; this.el.classList.remove("disabled");
        } else {
            this.inFlask = false;
        }

        if (!this.inBeaker && !this.inFlask && this.volume === 0) { this.el.classList.add("disabled"); }
    }

    update() {
        let tipHeight = 0; let bodyHeight = 0;
        if (this.volume <= 30) { tipHeight = (this.volume / 30) * 100; bodyHeight = 0; } 
        else { tipHeight = 100; bodyHeight = ((this.volume - 30) / 70) * 100; }

        this.dom.liquid.style.height = bodyHeight + "%";
        this.dom.tipLiquid.style.height = tipHeight + "%";

        let mlValue = 0.1754 * this.volume - 1.4912;
        if (mlValue < 0) mlValue = 0;

        let displayFlaskVolume = this.flaskVolume - (this.accumulatedError * 0.1);
        if (displayFlaskVolume < 0) displayFlaskVolume = 0;

        if (!this.inBeaker && !this.inFlask && this.volume === 0) { this.dom.volumeText.innerText = "LOCKED"; } 
        else { this.dom.volumeText.innerText = mlValue.toFixed(1) + "ml"; }

        let noise = (this.state === "FILLING" || this.state === "DISPENSING") ? (Math.random() * 0.003 - 0.001) : 0;
        let dPipVal = mlValue + noise; if (dPipVal < 0) dPipVal = 0;

        this.dom.pipetteVal.innerText = dPipVal.toFixed(3) + "ml";
        this.dom.actualFlaskVal.innerText = displayFlaskVolume.toFixed(3) + "ml";
        this.dom.errorVal.innerText = this.accumulatedError.toFixed(3); 

        let bodyPercent = 0;
        let neckHeightPx = 0;
        const bodyMaxBoundary = 40 
        const totalMaxBoundary = 48;

        if (displayFlaskVolume <= bodyMaxBoundary) {
            bodyPercent = (displayFlaskVolume / bodyMaxBoundary) * 100;
            neckHeightPx = 0; 
        } else {
            bodyPercent = 100;
            let neckProgress = (displayFlaskVolume - bodyMaxBoundary) / (totalMaxBoundary - bodyMaxBoundary);
            if (neckProgress > 1) neckProgress = 1;
            neckHeightPx = neckProgress * 110; 
        }

        this.dom.flaskLiquid.style.height = bodyPercent + "%";
        
        const neckEl = this.flaskEl.querySelector('.flask-neck');
        if (neckEl) {
            neckEl.style.setProperty('--neck-height', `${neckHeightPx}px`);
        }

        if (!this.isRunning) {
            this.dom.volumeText.innerText = "LOCKED";
            this.dom.pipetteVal.innerText = "0.000ml";
            return;
        }
    }
  
    createDrop() {
        this.dom.drop.style.opacity = 1; this.dom.drop.style.top = "425px"; let y = 425;
        const t = setInterval(() => { y += 8; this.dom.drop.style.top = y + "px"; if (y > 560) { clearInterval(t); this.dom.drop.style.opacity = 0; } }, 16);
    }
}
