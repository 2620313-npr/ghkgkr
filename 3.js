document.addEventListener("DOMContentLoaded", () => {
    // 1. URL 파라미터 오차값 처리 (?error=값 추출)
    const urlParams = new URLSearchParams(window.location.search);
    let accumulatedError = parseFloat(urlParams.get('error') || 0);
    
    const errorDisplay = document.getElementById('errorVal');
    errorDisplay.innerText = accumulatedError.toFixed(3);

    // 2. DOM 요소 가져오기
    const startBtn = document.getElementById("startBtn");
    const timerDisplay = document.getElementById("timerDisplay");
    const statusField = document.getElementById("statusField");
    const nextStepBtn = document.getElementById("nextStepBtn");
    
    const beakerAcetic = document.getElementById("beakerAcetic");
    const beakerWater = document.getElementById("beakerWater");
    const cylinderLiquid = document.getElementById("cylinderLiquid");
    const flaskLiquid = document.getElementById("flaskLiquid");
    const pourFlaskBtn = document.getElementById("pourFlaskBtn");
    
    const theoryVolDisplay = document.getElementById("theoryVol");
    const actualVolDisplay = document.getElementById("actualVol");

    let isRunning = false;
    let startTime = 0;
    let elapsedTime = 0;
    let timerInterval = null;
    let co2Interval = null;
    let pourInterval = null;

    // 실험 주입 상태 데이터 변수 (최대 50ml 기준 매핑)
    let currentVolume = 0.000; 
    let totalFlaskVolume = 0.000; // 삼각 플라스크에 누적 보관될 부피
    const maxCylinderVolume = 50.0;

    // 시간 변환 함수 (00:00.00 형식)
    function formatTime(ms) {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        const centiseconds = Math.floor((ms % 1000) / 10);
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`;
    }

    // 실험 시작/중단 버튼 이벤트
    startBtn.addEventListener("click", () => {
        if (!isRunning) {
            isRunning = true;
            startBtn.innerText = "실험 중단";
            startBtn.classList.add("running");
            statusField.innerText = "동적 상태 (CO₂ 반응 중)";
            statusField.className = "status-dynamic";
            
            startTime = Date.now() - elapsedTime;
            timerInterval = setInterval(() => {
                elapsedTime = Date.now() - startTime;
                timerDisplay.innerText = formatTime(elapsedTime);
            }, 10);

            // 1초마다 실시간으로 CO2 오차 추가 누적 시뮬레이션
            co2Interval = setInterval(() => {
                if (Math.random() < 0.2) {
                    accumulatedError += (0.1 + Math.random() * 0.2);
                    errorDisplay.innerText = accumulatedError.toFixed(3);
                    updateVolumeDisplay();
                }
            }, 1000);
        } else {
            isRunning = false;
            startBtn.innerText = "실험 재개";
            startBtn.classList.remove("running");
            statusField.innerText = "정지 상태";
            statusField.className = "status-static";
            
            clearInterval(timerInterval);
            clearInterval(co2Interval);
            stopPouring();
        }
    });

    // 용액 주입 및 수치 업데이트 함수
    function updateVolumeDisplay() {
        theoryVolDisplay.innerText = `${(currentVolume + totalFlaskVolume).toFixed(3)}ml`;
        // 실제 측정치 = 주입 이론치 + 실시간 발생 누적 오차
        let actualVol = currentVolume + totalFlaskVolume + accumulatedError;
        actualVolDisplay.innerText = `${actualVol.toFixed(3)}ml`;

        // 눈금실린더 실시간 렌더링 높이 반영
        let heightPercent = (currentVolume / maxCylinderVolume) * 100;
        if (heightPercent > 100) heightPercent = 100;
        cylinderLiquid.style.height = `${heightPercent}%`;
    }

    // 용액 따르기 시작 (꾹 누르기 인터랙션)
    function startPouring(beakerType) {
        if (!isRunning) return; 

        if (beakerType === "acetic") {
            beakerAcetic.classList.add("pouring-left", "active");
        } else {
            beakerWater.classList.add("pouring-right", "active");
        }

        pourInterval = setInterval(() => {
            if (currentVolume < maxCylinderVolume) {
                currentVolume += 0.20; // 주입 속도
                updateVolumeDisplay();
            }
        }, 50);
    }

    // 용액 따르기 중단
    function stopPouring() {
        clearInterval(pourInterval);
        beakerAcetic.classList.remove("pouring-left", "active");
        beakerWater.classList.remove("pouring-right", "active");
    }

    // 비커 마우스 / 터치 이벤트 바인딩
    beakerAcetic.addEventListener("pointerdown", () => startPouring("acetic"));
    beakerAcetic.addEventListener("pointerup", stopPouring);
    beakerAcetic.addEventListener("pointerleave", stopPouring);

    beakerWater.addEventListener("pointerdown", () => startPouring("water"));
    beakerWater.addEventListener("pointerup", stopPouring);
    beakerWater.addEventListener("pointerleave", stopPouring);

    // 삼각 플라스크에 붓기 버튼 인터랙션
    if (pourFlaskBtn) {
        pourFlaskBtn.addEventListener("click", () => {
            if (!isRunning) return; 
            
            if (currentVolume > 0) {
                totalFlaskVolume += currentVolume;
                // 삼각플라스크 내부 액체 높이 시각화 (최대 50ml 기준 비율 계산)
                let flaskPercent = (totalFlaskVolume / maxCylinderVolume) * 30;
                if (flaskPercent > 100) flaskPercent = 100;
                
                flaskLiquid.style.height = `${flaskPercent}%`;
                currentVolume = 0; // 실린더는 비워짐
                updateVolumeDisplay();
            }
        });
    }

    // 다음 단계 이동 시 현재 누적된 최종 오차값을 3.html로 전달
    if (nextStepBtn) {
        nextStepBtn.addEventListener("click", (e) => {
            e.preventDefault();
            clearInterval(timerInterval);
            clearInterval(co2Interval);
            clearInterval(pourInterval);
            window.location.href = `3.html?error=${accumulatedError.toFixed(3)}`;
        });
    }
});
