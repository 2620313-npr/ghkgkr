
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>화학 실험 시뮬레이션 - 인트로</title>
    <style>
        /* 🎨 인트로 페이지 깔끔하고 세련된 테마 디자인 */
        body {
            margin: 0;
            padding: 0;
            font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif;
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            color: #f8fafc;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            overflow: hidden;
        }

        .intro-container {
            text-align: center;
            background: rgba(30, 41, 59, 0.7);
            padding: 50px 60px;
            border-radius: 24px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
            border: 1px solid rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(16px);
            max-width: 650px;
            width: 90%;
            transform: translateY(0);
            animation: fadeIn 1s ease-out;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .icon {
            font-size: 64px;
            margin-bottom: 20px;
            display: inline-block;
            animation: float 3s ease-in-out infinite;
        }

        @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
        }

        h1 {
            font-size: 32px;
            font-weight: 800;
            line-height: 1.4;
            margin: 0 0 15px 0;
            background: linear-gradient(to right, #38bdf8, #818cf8);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            word-break: keep-all;
        }

        .subtitle {
            font-size: 18px;
            color: #94a3b8;
            font-weight: 500;
            margin-bottom: 40px;
            letter-spacing: 1px;
        }

        /* 💡 오차 원인 요약 카드 공간 */
        .reason-box {
            text-align: left;
            background: rgba(15, 23, 42, 0.5);
            padding: 20px 25px;
            border-radius: 16px;
            margin-bottom: 45px;
            border-left: 4px solid #38bdf8;
        }

        .reason-box p {
            margin: 8px 0;
            font-size: 14px;
            color: #cbd5e1;
            display: flex;
            align-items: center;
        }

        .reason-box p::before {
            content: "•";
            color: #38bdf8;
            font-weight: bold;
            display: inline-block;
            width: 15px;
            font-size: 18px;
        }

        /* ➡️ 다음으로 넘어가기 버튼 */
        .start-btn {
            background: linear-gradient(90deg, #2563eb, #1d4ed8);
            color: white;
            border: none;
            padding: 16px 40px;
            font-size: 18px;
            font-weight: 700;
            border-radius: 12px;
            cursor: pointer;
            box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            display: inline-flex;
            align-items: center;
            gap: 10px;
        }

        .start-btn:hover {
            background: linear-gradient(90deg, #3b82f6, #2563eb);
            transform: translateY(-3px);
            box-shadow: 0 6px 20px rgba(37, 99, 235, 0.6);
        }

        .start-btn:active {
            transform: translateY(-1px);
        }
    </style>
</head>
<body>

    <div class="intro-container">
        <div class="icon">🧪</div>
        
        <h1>화학 - 이론적 실험과 실제 실험이 다른 이유</h1>
        
        <div class="subtitle">20313 우승연</div>

        <div class="reason-box">
            <p>메니스크스(표선) 읽기 시 발생하는 인간의 시각 측정 오차</p>
            <p>기구 내벽에 잔류하여 완벽히 배출되지 않는 용액의 손실</p>
            <p>공기 중의 이산화탄소($\text{CO}_2$) 흡수로 인한 시약의 변질</p>
        </div>

        <button class="start-btn" onclick="location.href='1.html'">
            실험 시작하기 ➡️
        </button>
    </div>

</body>
</html>
